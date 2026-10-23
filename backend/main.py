from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import asyncio

# We will build these two files next
from services.ml_service import predict_ml
# from services.agent_service import run_agent

app = FastAPI(title="Fake News Detection API")

# Define the incoming data format
class ArticleRequest(BaseModel):
    text: str

# Define the outgoing data format
class VerificationResponse(BaseModel):
    ml_confidence: float
    ml_verdict: str
    agent_reasoning: str
    agent_sources: list[str]
    final_verdict: str

@app.post("/api/v1/verify", response_model=VerificationResponse)
async def verify_article(request: ArticleRequest):
    if len(request.text.split()) < 20:
        raise HTTPException(status_code=400, detail="Article text is too short. Provide at least 20 words.")

    # Run BOTH branches concurrently to save time
    # (We are mocking the agent response for now until we build it)
    ml_task = predict_ml(request.text)
    
    # agent_task = run_agent(request.text) 
    
    # Wait for both tasks to finish
    # ml_result, agent_result = await asyncio.gather(ml_task, agent_task)
    
    # Temporary mock data for testing
    ml_result = await ml_task 
    agent_result = {
        "reasoning": "Agentic verification is under construction.",
        "sources": []
    }

    # The Aggregation Logic
    # If the ML model outputs < 0.5, it predicts "Fake"
    ml_verdict = "Real" if ml_result > 0.5 else "Fake"
    
    # For now, the final verdict is just the ML verdict. 
    # Later, we will add logic to let the Agent override this.
    final_verdict = ml_verdict

    return VerificationResponse(
        ml_confidence=ml_result,
        ml_verdict=ml_verdict,
        agent_reasoning=agent_result["reasoning"],
        agent_sources=agent_result["sources"],
        final_verdict=final_verdict
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)