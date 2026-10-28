import os
import json
import asyncio
from pydantic import BaseModel, Field
from typing import List
from langchain_community.chat_models import ChatOllama
from langchain_community.tools import DuckDuckGoSearchResults
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser

# 1. Define the Expected Data Structures for Local LLM
class ArticleExtraction(BaseModel):
    heading: str = Field(description="A generated heading for the article")
    facts: List[str] = Field(description="A list of up to 5 main verifiable facts extracted from the article")

class FactVerification(BaseModel):
    status: str = Field(description="Must be exactly: Supported, Contradicted, or Unverified")
    reasoning: str = Field(description="1-2 sentences explaining the verdict based on the search evidence")
    sources: List[str] = Field(description="List of URLs found in the evidence")

# 2. Initialize Local Ollama and Search
# Replace "qwen:4b" with your exact Ollama model name (e.g., "qwen2.5", "llama3")
# format="json" forces the local model to output parsable JSON
llm = ChatOllama(model="qwen:4b", temperature=0.1, format="json")
search_tool = DuckDuckGoSearchResults(backend="news", max_results=3)

# 3. Setup Parsers
extraction_parser = JsonOutputParser(pydantic_object=ArticleExtraction)
verification_parser = JsonOutputParser(pydantic_object=FactVerification)

async def verify_single_fact(heading: str, fact: str) -> dict:
    """Helper function to search and verify a single fact."""
    print(f"  -> [Search] Verifying: {fact[:50]}...")
    search_query = f"{heading} {fact}"
    
    # Execute web search
    search_results = await asyncio.to_thread(search_tool.run, search_query)
    
    # Synthesize verdict with Ollama
    verify_prompt = PromptTemplate(
        template="""You are a strict fact-checker. Evaluate the claim against the web search evidence.
        
        Claim: {claim}
        Evidence: {evidence}
        
        Provide your response in JSON matching this schema:
        {format_instructions}
        """,
        input_variables=["claim", "evidence"],
        partial_variables={"format_instructions": verification_parser.get_format_instructions()}
    )
    
    chain = verify_prompt | llm | verification_parser
    
    try:
        verdict = await chain.ainvoke({
            "claim": search_query, 
            "evidence": search_results
        })
        return {
            "fact": fact,
            "status": verdict.get("status", "Unverified"),
            "reasoning": verdict.get("reasoning", "Error analyzing evidence."),
            "sources": verdict.get("sources", [])
        }
    except Exception as e:
        print(f"  -> [Error] Failed to verify fact: {e}")
        return {
            "fact": fact,
            "status": "Unverified",
            "reasoning": "Local LLM failed to parse the verification.",
            "sources": []
        }

async def run_agent(text: str) -> dict:
    try:
        print("\n[Agent] Step 1: Extracting heading and main facts via Ollama...")
        extract_prompt = PromptTemplate(
            template="""Analyze the following article. Generate a concise heading and extract up to 5 main verifiable facts.
            
            Article: {text}
            
            Provide your response in JSON matching this schema:
            {format_instructions}
            """,
            input_variables=["text"],
            partial_variables={"format_instructions": extraction_parser.get_format_instructions()}
        )
        
        extract_chain = extract_prompt | llm | extraction_parser
        extraction = await extract_chain.ainvoke({"text": text})
        
        heading = extraction.get("heading", "News Article")
        facts = extraction.get("facts", [])
        print(f"[Agent] Extracted Heading: {heading}")
        print(f"[Agent] Extracted {len(facts)} facts.")

        print("\n[Agent] Step 2: Verifying facts concurrently...")
        # Run fact verifications in parallel for speed
        verification_tasks = [verify_single_fact(heading, fact) for fact in facts]
        verified_facts = await asyncio.gather(*verification_tasks)
        
        print("[Agent] All facts verified!")
        
        # Calculate an overall agent verdict based on individual facts
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
        print(f"Agent Error: {e}")
        return {
            "heading": "Error",
            "verified_facts": [],
            "overall_verdict": "Error"
        }