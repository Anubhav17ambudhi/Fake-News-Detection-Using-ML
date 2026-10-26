from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import asyncio
import time

from services.ml_service import predict_ml
from services.agent_service import run_agent

app = FastAPI(title="Fake News Detection API")

class ArticleRequest(BaseModel):
    text: str

class VerificationResponse(BaseModel):
    ml_confidence: float
    ml_verdict: str
    agent_reasoning: str
    agent_sources: list[str]
    final_verdict: str

@app.post("/api/v1/verify", response_model=VerificationResponse)
async def verify_article(request: ArticleRequest):
    if len(request.text.split()) < 20:
        raise HTTPException(status_code=400, detail="Article too short.")

    print("\n--- NEW REQUEST RECEIVED ---")
    start_time = time.time()

    # Wrap the tasks in a 15-second timeout so they can't hang forever
    try:
        print("[System] Firing ML and Agent branches...")
        
        ml_task = asyncio.wait_for(predict_ml(request.text), timeout=15.0)
        agent_task = asyncio.wait_for(run_agent(request.text), timeout=555.0)
        
        ml_result, agent_result = await asyncio.gather(ml_task, agent_task)
        
        print(f"[System] Both branches completed in {time.time() - start_time:.2f} seconds!")

    except asyncio.TimeoutError:
        print("[System ERROR] A branch timed out after 15 seconds!")
        raise HTTPException(status_code=504, detail="The AI or Search service took too long to respond. Please try again.")

    # EVALUATE ML BRANCH
    ml_verdict = "Real" if ml_result > 0.5 else "Fake"
    final_verdict = ml_verdict
    agent_reasoning_lower = agent_result["reasoning"].lower()
    
    # AGGREGATE
    if ml_verdict == "Real" and ("contradicted" in agent_reasoning_lower or "false" in agent_reasoning_lower):
        final_verdict = "Fake"
    elif ml_verdict == "Fake" and "supported" in agent_reasoning_lower:
        final_verdict = "Real"

    return VerificationResponse(
        ml_confidence=ml_result,
        ml_verdict=ml_verdict,
        agent_reasoning=agent_result["reasoning"],
        agent_sources=agent_result["sources"],
        final_verdict=final_verdict
    )