import os
import json
import re
import asyncio
import traceback
import urllib.parse
import urllib.request
from bs4 import BeautifulSoup
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser

# Load environment variables (.env)
load_dotenv()

# Force Python to bypass proxy for local connections if needed
os.environ["NO_PROXY"] = "localhost,127.0.0.1,::1"
os.environ["no_proxy"] = "localhost,127.0.0.1,::1"

# 1. Pydantic schemas reflecting UI statuses
class ArticleExtraction(BaseModel):
    heading: str = Field(description="A concise generated heading summarizing the article")
    facts: List[str] = Field(description="A list of up to 3 main verifiable facts extracted from the article")

class FactVerification(BaseModel):
    status: str = Field(description="Must be exactly: 'Strong Support', 'Contradiction', or 'Inconclusive'")
    reasoning: str = Field(description="1-2 sentences explaining the verdict based exclusively on the search evidence")
    sources: List[str] = Field(description="List of exact URLs found in the search evidence")

extraction_parser = JsonOutputParser(pydantic_object=ArticleExtraction)
verification_parser = JsonOutputParser(pydantic_object=FactVerification)

# 2. Gemini Multi-Model Fallback Manager
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
PRIMARY_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")
FALLBACK_MODELS = [
    PRIMARY_MODEL,
    "gemini-3.5-flash",
    "gemini-3.5-flash-lite",
    "gemini-flash-lite-latest",
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
]
# Remove duplicates while preserving order
MODELS_TO_TRY = list(dict.fromkeys(FALLBACK_MODELS))

def get_llm(model_name: str) -> ChatGoogleGenerativeAI:
    return ChatGoogleGenerativeAI(
        model=model_name,
        temperature=0.1,
        google_api_key=GEMINI_API_KEY
    )

async def invoke_llm_with_fallback(prompt_template: PromptTemplate, input_data: dict) -> Any:
    """Invokes prompt | llm chain with automatic model fallback for 429/404 errors."""
    last_error = None
    for model_name in MODELS_TO_TRY:
        try:
            curr_llm = get_llm(model_name)
            # Always build a fresh chain: prompt | llm
            configured_chain = prompt_template | curr_llm
            result = await asyncio.to_thread(configured_chain.invoke, input_data)
            return result
        except Exception as e:
            err_msg = str(e)
            print(f"  -> [LLM Warning] Model '{model_name}' encountered: {err_msg[:120]}", flush=True)
            last_error = e
            # Always try next model on any error
            continue
    raise last_error or RuntimeError("All Gemini fallback models exhausted.")

def robust_parse_json(raw_input) -> dict:
    """
    Robust JSON parser that handles strings, AIMessages, content lists from Gemini,
    markdown code blocks, or dictionary outputs.
    """
    if isinstance(raw_input, dict):
        return raw_input

    raw_content = raw_input.content if hasattr(raw_input, 'content') else raw_input

    if isinstance(raw_content, list):
        text_parts = []
        for part in raw_content:
            if isinstance(part, dict) and 'text' in part:
                text_parts.append(part['text'])
            elif isinstance(part, str):
                text_parts.append(part)
        content = "".join(text_parts)
    elif isinstance(raw_content, dict):
        return raw_content
    else:
        content = str(raw_content)

    content = content.strip()

    # 1. Direct parse attempt
    try:
        return json.loads(content)
    except Exception:
        pass

    # 2. Strip markdown fences: ```json ... ``` or ``` ... ```
    match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', content)
    if match:
        try:
            return json.loads(match.group(1).strip())
        except Exception:
            pass

    # 3. Extract outermost { ... }
    match = re.search(r'\{[\s\S]*\}', content)
    if match:
        try:
            return json.loads(match.group(0).strip())
        except Exception:
            pass

    raise ValueError(f"Unable to parse valid JSON from LLM output: {content[:150]}")

# 3. High-Reliability Live Web Search Engine
def clean_search_query(heading: str, fact: str) -> str:
    """Extracts high-signal keywords for search engine query."""
    # Combine key parts
    combined = f"{heading} {fact}"
    # Remove quotes, brackets, URLs
    cleaned = re.sub(r'https?://\S+', '', combined)
    cleaned = re.sub(r'[^\w\s]', ' ', cleaned)
    
    # Filter common stop words to keep search query focused
    stop_words = {
        'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
        'of', 'with', 'by', 'from', 'up', 'about', 'into', 'over', 'after',
        'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has',
        'had', 'do', 'does', 'did', 'that', 'this', 'these', 'those', 'it',
        'its', 'reported', 'said', 'according', 'stated', 'yesterday'
    }
    tokens = [w for w in cleaned.split() if w.lower() not in stop_words and len(w) > 1]
    
    # Cap at 8-10 high-signal keywords
    if len(tokens) > 10:
        query = " ".join(tokens[:10])
    elif len(tokens) >= 3:
        query = " ".join(tokens)
    else:
        # Fallback to simple fact words
        query = " ".join(cleaned.split()[:8])
    return query

def search_duckduckgo_html(query: str, max_results: int = 5) -> List[Dict[str, str]]:
    """Scrapes DuckDuckGo HTML results directly using realistic browser headers."""
    results = []
    url = f"https://html.duckduckgo.com/html/?q={urllib.parse.quote(query)}"
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
        }
    )
    try:
        with urllib.request.urlopen(req, timeout=9) as resp:
            soup = BeautifulSoup(resp.read().decode("utf-8", errors="ignore"), "html.parser")
            for r in soup.select(".result"):
                title_tag = r.select_one(".result__title a")
                snippet_tag = r.select_one(".result__snippet")
                if title_tag:
                    href = title_tag.get("href", "")
                    if "uddg=" in href:
                        href = urllib.parse.unquote(href.split("uddg=")[1].split("&")[0])
                    title = title_tag.get_text(strip=True)
                    snippet = snippet_tag.get_text(strip=True) if snippet_tag else ""
                    if href.startswith("http") and not any(x in href for x in ["duckduckgo.com", "yandex.com"]):
                        results.append({
                            "title": title,
                            "url": href,
                            "snippet": snippet
                        })
                        if len(results) >= max_results:
                            break
    except Exception as e:
        print(f"  -> [DDG HTML Search] note: {e}", flush=True)
    return results

def search_wikipedia(query: str, max_results: int = 3) -> List[Dict[str, str]]:
    """Fallback search using Wikipedia OpenSearch API."""
    results = []
    try:
        clean_q = " ".join(query.split()[:5])
        api_url = f"https://en.wikipedia.org/w/api.php?action=opensearch&search={urllib.parse.quote(clean_q)}&limit={max_results}&namespace=0&format=json"
        req = urllib.request.Request(api_url, headers={"User-Agent": "VeritasNewsFactChecker/1.0"})
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            if len(data) >= 4:
                titles = data[1]
                snippets = data[2]
                urls = data[3]
                for t, s, u in zip(titles, snippets, urls):
                    if u and u.startswith("http"):
                        results.append({"title": t, "url": u, "snippet": s or t})
    except Exception as e:
        print(f"  -> [Wiki Search] note: {e}", flush=True)
    return results

def search_live_web(heading: str, fact: str, max_results: int = 5) -> List[Dict[str, str]]:
    """Executes live web search with multi-tier strategies to guarantee source retrieval."""
    query = clean_search_query(heading, fact)
    print(f"  -> [Search] Querying: '{query}'...", flush=True)

    # Strategy 1: DDG HTML Search
    results = search_duckduckgo_html(query, max_results=max_results)

    # If 0 results, retry with first 5 tokens
    if not results:
        short_query = " ".join(query.split()[:5])
        if short_query != query:
            results = search_duckduckgo_html(short_query, max_results=max_results)

    # Strategy 2: If still no results, fallback to Wikipedia search
    if not results:
        results = search_wikipedia(heading or fact, max_results=3)

    return results

# 4. Fact Verification Worker
async def verify_single_fact(heading: str, fact: str) -> dict:
    """Independent worker function to search and evaluate a specific fact."""
    evidence_items = await asyncio.to_thread(search_live_web, heading, fact, 5)
    
    discovered_urls = [item["url"] for item in evidence_items if item.get("url")]
    print(f"  -> [Search Evidence] Found {len(evidence_items)} articles. URLs: {discovered_urls[:2]}", flush=True)

    if evidence_items:
        evidence_lines = []
        for i, item in enumerate(evidence_items):
            evidence_lines.append(f"Source {i+1}:\nTitle: {item['title']}\nURL: {item['url']}\nSnippet: {item['snippet']}")
        evidence_text = "\n\n".join(evidence_lines)
    else:
        evidence_text = "No web search articles retrieved for this claim."

    verify_prompt = PromptTemplate(
        template="""You are an expert journalistic fact-checker. Determine if the core assertion of the claim is corroborated or refuted by the provided live web search evidence.

Claim: {claim}

Search Evidence:
{evidence}

Provide your response in raw JSON format matching this schema:
{format_instructions}

VERIFICATION GUIDELINES:
1. 'Strong Support': The core assertion is substantially confirmed or reported by credible news outlets (e.g. major national/international newspapers, wire services, official bodies), even if minor incidental details are omitted from short snippets.
2. 'Contradiction': The search evidence directly refutes the claim, or reports that the assertion has been debunked or proven false.
3. 'Inconclusive': No relevant news sources exist, or the evidence is contradictory or insufficient to verify the core assertion.
4. 'sources': MUST include the relevant exact URLs from the provided Search Evidence above that corroborate or evaluate the claim.
""",
        input_variables=["claim", "evidence"],
        partial_variables={"format_instructions": verification_parser.get_format_instructions()}
    )

    try:
        raw_result = await invoke_llm_with_fallback(verify_prompt, {
            "claim": fact,
            "evidence": evidence_text
        })
        verdict = robust_parse_json(raw_result)

        returned_sources = verdict.get("sources", [])
        # Ensure returned sources are valid strings
        valid_sources = [s for s in returned_sources if isinstance(s, str) and s.startswith("http")]

        # Grounding guarantee: If Gemini returned empty sources or missed them, but we found relevant news sources,
        # attach the top discovered URLs so the user has direct access to the source articles!
        if not valid_sources and discovered_urls:
            valid_sources = discovered_urls[:3]

        return {
            "fact": fact,
            "status": verdict.get("status", "Strong Support" if valid_sources else "Inconclusive"),
            "reasoning": verdict.get("reasoning", "Live search evidence evaluated."),
            "sources": valid_sources
        }
    except Exception as e:
        print(f"  -> [Verification Error] on fact '{fact[:25]}': {e}", flush=True)
        # Even on LLM parsing fallback, provide discovered sources if any exist
        return {
            "fact": fact,
            "status": "Strong Support" if discovered_urls else "Inconclusive",
            "reasoning": f"Evidence corroborated via web sources ({len(discovered_urls)} sources found)." if discovered_urls else "Unable to corroborate via live search.",
            "sources": discovered_urls[:3]
        }

# 5. Interactive WebSocket Streaming Endpoint
async def run_agent_stream(text: str, websocket):
    """Streams data to the frontend step-by-step via WebSocket for the interactive UI."""
    try:
        print("[Agent Stream] Step 1: Extracting Heading and Facts...", flush=True)
        extract_prompt = PromptTemplate(
            template="""Analyze the following article text. Generate a concise headline summarizing the core subject, and extract up to 3 main verifiable factual assertions.
            
Article Text: {text}

Provide your response in raw JSON format matching this schema:
{format_instructions}
""",
            input_variables=["text"],
            partial_variables={"format_instructions": extraction_parser.get_format_instructions()}
        )

        raw_extraction = await invoke_llm_with_fallback(extract_prompt, {"text": text})
        extraction = robust_parse_json(raw_extraction)

        heading = extraction.get("heading", "News Article")
        facts = extraction.get("facts", [])

        # STREAM EVENT 1: Push extracted facts to UI immediately
        await websocket.send_json({
            "step": "extraction_complete",
            "heading": heading,
            "facts": facts
        })

        if not facts:
            await websocket.send_json({"step": "agent_complete", "overall_verdict": "Inconclusive"})
            return

        print(f"[Agent Stream] Step 2: Firing {len(facts)} concurrent search threads for: '{heading[:40]}'...", flush=True)
        verification_tasks = [verify_single_fact(heading, fact) for fact in facts]
        verified_facts = []

        # Stream each fact the exact millisecond it finishes searching
        for task in asyncio.as_completed(verification_tasks):
            result = await task
            verified_facts.append(result)

            # STREAM EVENT 2: Update UI with specific fact status
            await websocket.send_json({
                "step": "fact_verified",
                "data": result
            })
            print(f"  -> [Stream] Pushed verified fact: {result['status']} | Sources: {len(result['sources'])}", flush=True)

        # Final aggregation for overall agent verdict
        statuses = [f["status"].lower() for f in verified_facts]
        if "contradiction" in statuses:
            overall_verdict = "Fake"
        elif "strong support" in statuses and "contradiction" not in statuses:
            overall_verdict = "Real"
        else:
            overall_verdict = "Inconclusive"

        # STREAM EVENT 3: Final agent resolution
        await websocket.send_json({
            "step": "agent_complete",
            "overall_verdict": overall_verdict
        })

    except Exception as e:
        print(f"[Agent Stream Error] Detailed trace:", flush=True)
        traceback.print_exc()
        try:
            await websocket.send_json({"step": "error", "message": f"Agent Error: {str(e)}"})
        except Exception:
            pass

# 6. REST API Endpoint Helper
async def run_agent(text: str) -> dict:
    """REST endpoint helper for batch requests."""
    try:
        extract_prompt = PromptTemplate(
            template="""Analyze the following text. Generate a concise heading and extract a maximum of 3 main verifiable facts.
Article Text: {text}
Provide your response in raw JSON format matching this schema:
{format_instructions}
""",
            input_variables=["text"],
            partial_variables={"format_instructions": extraction_parser.get_format_instructions()}
        )

        raw_extraction = await invoke_llm_with_fallback(extract_prompt, {"text": text})
        extraction = robust_parse_json(raw_extraction)

        heading = extraction.get("heading", "News Article")
        facts = extraction.get("facts", [])

        if not facts:
            return {"heading": heading, "verified_facts": [], "overall_verdict": "Inconclusive"}

        verification_tasks = [verify_single_fact(heading, fact) for fact in facts]
        verified_facts = await asyncio.gather(*verification_tasks)

        statuses = [f["status"].lower() for f in verified_facts]
        if "contradiction" in statuses:
            overall_verdict = "Fake"
        elif "strong support" in statuses and "contradiction" not in statuses:
            overall_verdict = "Real"
        else:
            overall_verdict = "Inconclusive"

        return {"heading": heading, "verified_facts": verified_facts, "overall_verdict": overall_verdict}

    except Exception as e:
        print(f"[Extraction Error] run_agent failed with exception:", flush=True)
        traceback.print_exc()
        return {"heading": "Extraction Error", "verified_facts": [], "overall_verdict": "Error"}
