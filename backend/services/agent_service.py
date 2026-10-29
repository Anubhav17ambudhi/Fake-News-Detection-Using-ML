import os
import json
import re
import asyncio
import traceback
from pydantic import BaseModel, Field
from typing import List
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_community.tools import DuckDuckGoSearchResults
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser

# Load environment variables (.env)
load_dotenv()

# Force Python to bypass proxy for local connections if needed
os.environ["NO_PROXY"] = "localhost,127.0.0.1,::1"
os.environ["no_proxy"] = "localhost,127.0.0.1,::1"

# 1. Pydantic schemas reflecting your requested UI statuses
class ArticleExtraction(BaseModel):
    heading: str = Field(description="A concise generated heading summarizing the article")
    facts: List[str] = Field(description="A list of up to 3 main verifiable facts extracted from the article")

class FactVerification(BaseModel):
    status: str = Field(description="Must be exactly: 'Strong Support', 'Contradiction', or 'Inconclusive'")
    reasoning: str = Field(description="1-2 sentences explaining the verdict based exclusively on the search evidence")
    sources: List[str] = Field(description="List of exact URLs found in the search evidence")

# 2. Gemini Flash Model Initialization
gemini_api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
gemini_model = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")

llm = ChatGoogleGenerativeAI(
    model=gemini_model, 
    temperature=0.1,
    google_api_key=gemini_api_key
)
search_tool = DuckDuckGoSearchResults(backend="news", max_results=3)

extraction_parser = JsonOutputParser(pydantic_object=ArticleExtraction)
verification_parser = JsonOutputParser(pydantic_object=FactVerification)

def robust_parse_json(raw_input):
    """
    Robust JSON parser that handles strings, AIMessages, markdown code blocks,
    or slightly noisy outputs from smaller local LLMs.
    """
    content = raw_input.content if hasattr(raw_input, 'content') else str(raw_input)
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

async def verify_single_fact(heading: str, fact: str) -> dict:
    """Independent worker function to search and evaluate a specific fact."""
    print(f"  -> [Search] Querying: {fact[:40]}...")
    search_query = f"{heading} {fact}"
    
    try:
        search_results = await asyncio.to_thread(search_tool.run, search_query)
    except Exception as e:
        print(f"  -> [Search Error] on fact '{fact[:20]}': {e}")
        search_results = "No search results retrieved due to network or proxy error."

    verify_prompt = PromptTemplate(
        template="""You are a strict journalistic fact-checker. Evaluate the claim against the provided web search evidence.
        
        Claim: {claim}
        Search Evidence: {evidence}
        
        Provide your response in raw JSON format matching this schema:
        {format_instructions}
        """,
        input_variables=["claim", "evidence"],
        partial_variables={"format_instructions": verification_parser.get_format_instructions()}
    )
    
    try:
        # First attempt with chain
        chain = verify_prompt | llm
        raw_result = await asyncio.to_thread(chain.invoke, {
            "claim": search_query, 
            "evidence": search_results
        })
        verdict = robust_parse_json(raw_result)
        
        return {
            "fact": fact,
            "status": verdict.get("status", "Inconclusive"),
            "reasoning": verdict.get("reasoning", "Evidence evaluation completed."),
            "sources": verdict.get("sources", [])
        }
    except Exception as e:
        print(f"  -> [Parse Error] Gemini Agent failed to parse verification for '{fact[:20]}': {e}")
        return {
            "fact": fact,
            "status": "Inconclusive",
            "reasoning": f"Gemini verification evaluation inconclusive: {str(e)[:60]}",
            "sources": []
        }

async def run_agent_stream(text: str, websocket):
    """Streams data to the frontend step-by-step via WebSocket for the interactive UI."""
    try:
        print("[Agent Stream] Step 1: Extracting Heading and Facts...")
        extract_prompt = PromptTemplate(
            template="""Analyze the following text. Generate a concise heading and extract a maximum of 3 main verifiable facts.
            
            Article Text: {text}
            
            Provide your response in raw JSON format matching this schema:
            {format_instructions}
            """,
            input_variables=["text"],
            partial_variables={"format_instructions": extraction_parser.get_format_instructions()}
        )
        
        extract_chain = extract_prompt | llm
        raw_extraction = await asyncio.to_thread(extract_chain.invoke, {"text": text})
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

        print(f"[Agent Stream] Step 2: Firing {len(facts)} concurrent search threads...")
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
            print(f"  -> [Stream] Pushed verified fact: {result['status']}")
        
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
        print(f"[Agent Stream Error] Detailed trace:")
        traceback.print_exc()
        await websocket.send_json({"step": "error", "message": f"Agent Error: {str(e)}"})

# --- EXISTING HTTP LOGIC (Kept for backward compatibility if you still need the normal REST endpoint) ---
async def run_agent(text: str) -> dict:
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
        
        extract_chain = extract_prompt | llm
        raw_extraction = await asyncio.to_thread(extract_chain.invoke, {"text": text})
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
        print(f"[Extraction Error] run_agent failed with exception:")
        traceback.print_exc()
        return {"heading": "Extraction Error", "verified_facts": [], "overall_verdict": "Error"}
