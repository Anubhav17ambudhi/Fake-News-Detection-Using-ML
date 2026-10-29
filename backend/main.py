import os
# Force bypass campus proxy before ANY libraries initialize
os.environ["NO_PROXY"] = "localhost,127.0.0.1,::1"
os.environ["no_proxy"] = "localhost,127.0.0.1,::1"

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from contextlib import asynccontextmanager
import asyncio
import time

from services.ml_service import load_ml_models, predict_ml
from services.agent_service import run_agent, run_agent_stream 

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[System] Loading DistilBERT ML Model into memory...")
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

# --- EXISTING HTTP ENDPOINT (REST) ---
@app.post("/api/v1/verify", response_model=VerificationResponse)
async def verify_article(request: ArticleRequest):
    if len(request.text.split()) < 20:
        raise HTTPException(status_code=400, detail="Article too short. Please provide at least 20 words.")

    print("\n--- NEW HTTP REQUEST RECEIVED ---")
    try:
        ml_task = asyncio.wait_for(predict_ml(request.text), timeout=15.0)
        agent_task = asyncio.wait_for(run_agent(request.text), timeout=300.0) 
        ml_result, agent_result = await asyncio.gather(ml_task, agent_task)
    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail="The local LLM timed out.")
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error.")

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

# --- NEW WEBSOCKET ENDPOINT (INTERACTIVE UI) ---
@app.websocket("/ws/verify")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        data = await websocket.receive_json()
        article_text = data.get("text")
        
        if not article_text or len(article_text.split()) < 20:
            await websocket.send_json({"step": "error", "message": "Article too short (needs 20+ words)."})
            await websocket.close()
            return
            
        print("\n--- NEW WEBSOCKET SESSION STARTED ---")
        
        # 1. DistilBERT Check (Instant return to UI)
        ml_result = await predict_ml(article_text)
        await websocket.send_json({
            "step": "ml_verdict",
            "data": ml_result
        })
        
        # 2. Agent Check (Streams updates fact-by-fact)
        await run_agent_stream(article_text, websocket)
        
        print("--- WEBSOCKET SESSION COMPLETED ---\n")
        await websocket.close()
        
    except WebSocketDisconnect:
        print("[System] Frontend client disconnected early.")
    except Exception as e:
        print(f"[System ERROR] {e}")
        try:
            await websocket.send_json({"step": "error", "message": str(e)})
            await websocket.close()
        except:
            pass