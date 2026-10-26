import os
import asyncio
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_community.tools import DuckDuckGoSearchResults
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser

load_dotenv()

# 1. Define the exact JSON structure we want the LLM to output
class FactCheckResult(BaseModel):
    reasoning: str = Field(description="A 3-4 sentence explanation verifying or debunking the claim based on the evidence.")
    sources: list[str] = Field(description="List of URLs or publication names found in the evidence. Return empty list if none.")

# 2. Initialize the LLM and the Search Tool
# Note: Ensure the model string matches the one you successfully fixed in the previous steps
llm = ChatGoogleGenerativeAI(model="gemini-3.5-flash", temperature=0.1)
structured_llm = llm.with_structured_output(FactCheckResult)

search_tool = DuckDuckGoSearchResults(backend="news")

# 3. The Agent Pipeline
async def run_agent(text: str) -> dict:
    try:
        print("\n[Agent] Step 1: Extracting claim...")
        extraction_prompt = PromptTemplate.from_template(
            "Extract the single most important verifiable factual claim from this article. Keep it under 15 words.\n\nArticle: {text}"
        )
        
        # StrOutputParser() safely forces whatever the LLM returns into a pure Python string
        claim_chain = extraction_prompt | llm | StrOutputParser()
        search_query = await claim_chain.ainvoke({"text": text})
        search_query = search_query.strip()
        
        print(f"[Agent] Extracted claim: {search_query}")

        print("[Agent] Step 2: Searching DuckDuckGo...")
        search_results = await asyncio.to_thread(search_tool.run, search_query)
        print("[Agent] Search complete.")

        print("[Agent] Step 3: Synthesizing final verdict...")
        synthesis_prompt = PromptTemplate.from_template(
            """You are an expert fact-checker. Evaluate the original claim against the live web search evidence.
            
            Original Claim: {claim}
            Web Search Evidence: {evidence}
            
            Determine if the claim is supported, contradicted, or unverified by the evidence.
            """
        )
        
        # structured_llm safely forces the output into our Pydantic FactCheckResult object
        synthesis_chain = synthesis_prompt | structured_llm
        final_verdict = await synthesis_chain.ainvoke({
            "claim": search_query, 
            "evidence": search_results
        })
        
        print("[Agent] Verification complete!")
        # Convert the Pydantic object safely to a dictionary for FastAPI
        return final_verdict.dict()

    except Exception as e:
        print(f"Agent Error: {e}")
        return {
            "reasoning": "The agentic verification system encountered an error while searching the web.",
            "sources": []
        }