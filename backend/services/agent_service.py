import json
import asyncio
from pydantic import BaseModel, Field
from typing import List
from langchain_ollama import ChatOllama
from langchain_community.tools import DuckDuckGoSearchResults
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser

# 1. Strict Pydantic schemas mapping what the local model must return
class ArticleExtraction(BaseModel):
    heading: str = Field(description="A concise generated heading summarizing the article")
    facts: List[str] = Field(description="A list of up to 5 main verifiable facts extracted from the article")

class FactVerification(BaseModel):
    status: str = Field(description="Must be exactly: Supported, Contradicted, or Unverified")
    reasoning: str = Field(description="1-2 sentences explaining the verdict based exclusively on the search evidence")
    sources: List[str] = Field(description="List of exact URLs found in the search evidence")

# 2. Local Model Initialization
# format="json" acts as a strict schema enforcer for local Ollama models
llm = ChatOllama(
    model="qwen2.5:1.5b", 
    temperature=0.1, 
    format="json", 
    num_predict=300
)
search_tool = DuckDuckGoSearchResults(backend="news", max_results=3)

extraction_parser = JsonOutputParser(pydantic_object=ArticleExtraction)
verification_parser = JsonOutputParser(pydantic_object=FactVerification)

async def verify_single_fact(heading: str, fact: str) -> dict:
    """Independent worker function to search and evaluate a specific fact."""
    print(f"  -> [Search] Querying: {fact[:40]}...")
    search_query = f"{heading} {fact}"
    
    try:
        # Offload network IO to a background thread to allow concurrent fact-checking
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
    
    chain = verify_prompt | llm | verification_parser
    
    try:
        verdict = await asyncio.to_thread(chain.invoke, {
            "claim": search_query, 
            "evidence": search_results
        })
        return {
            "fact": fact,
            "status": verdict.get("status", "Unverified"),
            "reasoning": verdict.get("reasoning", "Evidence evaluation completed without reasoning."),
            "sources": verdict.get("sources", [])
        }
    except Exception as e:
        print(f"  -> [Parse Error] Local LLM failed to parse verification for '{fact[:20]}': {e}")
        return {
            "fact": fact,
            "status": "Unverified",
            "reasoning": "The local AI failed to evaluate the search evidence correctly.",
            "sources": []
        }

async def run_agent(text: str) -> dict:
    try:
        print("\n[Agent] Step 1: Extracting Heading and Facts (Local Qwen:4b)...")
        extract_prompt = PromptTemplate(
            template="""Analyze the following text. Generate a concise heading and extract a maximum of 5 main verifiable facts.
            Focus on claims involving dates, names, events, and statistics.
            
            Article Text: {text}
            
            Provide your response in raw JSON format matching this schema:
            {format_instructions}
            """,
            input_variables=["text"],
            partial_variables={"format_instructions": extraction_parser.get_format_instructions()}
        )
        
        extract_chain = extract_prompt | llm | extraction_parser
        # Run the synchronous .invoke() safely in a background thread
        extraction = await asyncio.to_thread(extract_chain.invoke, {"text": text})
        
        heading = extraction.get("heading", "News Article")
        facts = extraction.get("facts", [])
        
        print(f"[Agent] Extracted Heading: {heading}")
        print(f"[Agent] Successfully isolated {len(facts)} facts to verify.")

        if not facts:
            return {
                "heading": heading,
                "verified_facts": [],
                "overall_verdict": "Unverified"
            }

        print("\n[Agent] Step 2: Firing concurrent fact-checking threads...")
        # Execute the map-reduce pattern: simultaneously verify all extracted facts
        verification_tasks = [verify_single_fact(heading, fact) for fact in facts]
        verified_facts = await asyncio.gather(*verification_tasks)
        
        print("[Agent] All concurrent verification threads finished!")
        
        # Calculate overall verdict by checking if any single fact was fully contradicted
        statuses = [f["status"].lower() for f in verified_facts]
        if "contradicted" in statuses:
            overall_verdict = "Fake"
        elif "supported" in statuses and "contradicted" not in statuses:
            overall_verdict = "Real"
        else:
            overall_verdict = "Unverified"

        return {
            "heading": heading,
            "verified_facts": verified_facts,
            "overall_verdict": overall_verdict
        }

    except Exception as e:
        print(f"Agent Error during main execution: {e}")
        return {
            "heading": "Extraction Error",
            "verified_facts": [],
            "overall_verdict": "Error"
        }