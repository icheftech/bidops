"""
BidOps Agent Service — FastAPI
Handles all LangGraph agent orchestration.
Runs alongside the Next.js web app.
"""
from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("BidOps Agent Service starting...")
    yield
    print("BidOps Agent Service shutting down...")

app = FastAPI(
    title="BidOps Agent Service",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("NEXT_PUBLIC_APP_URL", "http://localhost:3000")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

AGENT_API_SECRET = os.getenv("AGENT_API_SECRET", "")

def verify_secret(x_agent_secret: str = Header(None)):
    if x_agent_secret != AGENT_API_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized")

@app.get("/health")
async def health():
    return {"status": "ok", "service": "bidops-agent"}

@app.post("/agents/score-opportunity")
async def score_opportunity(payload: dict, x_agent_secret: str = Header(None)):
    """
    Scoring Sub-Agent endpoint.
    Accepts an opportunity and returns a score + recommendation.
    LangGraph workflow implemented in Phase 2.
    """
    verify_secret(x_agent_secret)
    # TODO: Phase 2 — wire LangGraph scoring workflow
    return {"status": "queued", "message": "Scoring agent coming in Phase 2"}

@app.post("/agents/prepare-bid")
async def prepare_bid(payload: dict, x_agent_secret: str = Header(None)):
    """
    Bid preparation pipeline.
    Orchestrates Pricing, Compliance, Narrative, and Assembly sub-agents.
    LangGraph workflow implemented in Phase 3.
    """
    verify_secret(x_agent_secret)
    # TODO: Phase 3 — wire LangGraph bid preparation workflow
    return {"status": "queued", "message": "Bid prep agent coming in Phase 3"}
