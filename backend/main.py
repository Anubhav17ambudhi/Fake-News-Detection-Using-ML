from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from contextlib import asynccontextmanager
import asyncio
import time

from services.ml_service import load_ml_models, predict_ml
from services.agent_service import run_agent

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[System] Loading DistilBERT ML Model into memory...")
    # Pre-loads the transformer to prevent cold-start delays on the first request
    load_ml_models()
    print("[System] ML Model loaded successfully!")
    yield
    print("[System] Shutting down...")

app = FastAPI(title="Fake News Detection API", lifespan=lifespan)

class ArticleRequest(BaseModel):
    text: str

class FactDetail(BaseModel):
    fact: str
    status: str
    reasoning: str
    sources: list[str]

class VerificationResponse(BaseModel):
    ml_confidence: float
    ml_verdict: str
    article_heading: str
    fact_checks: list[FactDetail]
    final_verdict: str

@app.post("/api/v1/verify", response_model=VerificationResponse)
async def verify_article(request: ArticleRequest):
    if len(request.text.split()) < 20:
        raise HTTPException(status_code=400, detail="Article too short. Please provide at least 20 words.")

    print("\n--- NEW REQUEST RECEIVED ---")
    start_time = time.time()

    try:
        print("[System] Firing ML and Agent branches...")
        
        # The ML branch uses DistilBERT (extremely fast).
        # The Agent branch runs 1 extraction + N verification calls locally on Qwen:4b (requires more time).
        ml_task = asyncio.wait_for(predict_ml(request.text), timeout=15.0)
        agent_task = asyncio.wait_for(run_agent(request.text), timeout=90.0) 
        
        ml_result, agent_result = await asyncio.gather(ml_task, agent_task)
        
        print(f"[System] Both branches completed in {time.time() - start_time:.2f} seconds!")

    except asyncio.TimeoutError:
        print("[System ERROR] A branch timed out!")
        raise HTTPException(status_code=504, detail="The local LLM or Search service took too long to respond.")
    except Exception as e:
        print(f"[System ERROR] Execution failed: {e}")
        raise HTTPException(status_code=500, detail="Internal server error during verification.")

    # Aggregation: Determine the final verdict based on contradiction logic
    ml_verdict = ml_result["ml_verdict"]
    agent_overall = agent_result["overall_verdict"]

    if ml_verdict == "Real" and agent_overall == "Fake":
        final_verdict = "Fake"
    elif ml_verdict == "Fake" and agent_overall == "Real":
        final_verdict = "Real"
    else:
        final_verdict = ml_verdict

    return VerificationResponse(
        ml_confidence=ml_result["ml_confidence"],
        ml_verdict=ml_verdict,
        article_heading=agent_result["heading"],
        fact_checks=agent_result["verified_facts"],
        final_verdict=final_verdict
    )