import os
import asyncio
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_community.tools import DuckDuckGoSearchResults
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser

# Load API keys
load_dotenv()

# Define the exact JSON structure we want the LLM to output
class FactCheckResult(BaseModel):
    reasoning: str = Field(description="A 3-4 sentence explanation verifying or debunking the claim based on the evidence.")
    sources: list[str] = Field(description="List of URLs or publication names found in the evidence. Return empty list if none.")

# Initialize the LLM and the Search Tool
# Gemini Flash is incredibly fast and cheap, perfect for this rapid pipeline
llm = ChatGoogleGenerativeAI(model="gemini-3.5-flash", temperature=0.1)
structured_llm = llm.with_structured_output(FactCheckResult)

search_tool = DuckDuckGoSearchResults(backend="news") # Focuses on news results

async def run_agent(text: str) -> dict:
    """
    Extracts the claim, searches the web, and returns a verified JSON verdict.
    """
    print("Inside the run_agent function");
    try:
        # Step 1: Extract the core falsifiable claim
        print("Trying to use gemini for the facts collections");
        extraction_prompt = PromptTemplate.from_template(
            "Extract the single most important verifiable factual claim from this article. Keep it under 15 words.\n\nArticle: {text}"
        )
        # Add StrOutputParser() to the end of the pipeline
        claim_chain = extraction_prompt | llm | StrOutputParser()
        
        # Because of the parser, ainvoke now returns a pure string, not an AIMessage object
        claim_result = await claim_chain.ainvoke({"text": text})
        
        # Now we can safely strip it
        search_query = claim_result.strip()

        print(f"[Agent] Extracted claim: {search_query}")
        claim_result = await claim_chain.ainvoke({"text": text})
        search_query = claim_result.content.strip()
        print("Facts fetched successfully using gemini");

        print(f"Agent extracted claim: {search_query}")

        # Step 2: Perform the live web search
        # DuckDuckGo is synchronous, so we run it in a thread to keep FastAPI non-blocking
        print("GOING FOR DUCK DUCK GO");
        search_results = await asyncio.to_thread(search_tool.run, search_query)
        print("Facts fetched successfully using gemini");
        print("DUCK DUCK GO RAN SUCCESSFULLY");

        # Step 3: Synthesize and Verify
        synthesis_prompt = PromptTemplate.from_template(
            """You are an expert fact-checker. Evaluate the original claim against the live web search evidence.
            
            Original Claim: {claim}
            Web Search Evidence: {evidence}
            
            Determine if the claim is supported, contradicted, or unverified by the evidence.
            """
        )
        
        synthesis_chain = synthesis_prompt | structured_llm
        final_verdict = await synthesis_chain.ainvoke({
            "claim": search_query, 
            "evidence": search_results
        })
        
        # Convert Pydantic object to dictionary
        return final_verdict.dict()

    except Exception as e:
        print(f"Agent Error: {e}")
        return {
            "reasoning": "The agentic verification system encountered an error while searching the web.",
            "sources": []
        }