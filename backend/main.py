"""
RedStorm AI-Powered Real-Time Attack Simulator
Main FastAPI application entry point
"""
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import asyncio
import json
from typing import Dict, List
import uvicorn

from api.routes import router
from agents.orchestrator import AgentOrchestrator
from utils.websocket_manager import WebSocketManager
from utils.cache_manager import cache_manager
from utils.ethical_boundaries import ethical_boundaries

app = FastAPI(
    title="RedStorm Attack Simulator",
    description="AI-Powered Real-Time Penetration Testing Simulator",
    version="1.0.0"
)

# CORS middleware for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://your-frontend-domain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket manager for real-time communication
websocket_manager = WebSocketManager()
orchestrator = AgentOrchestrator()

@app.on_event("startup")
async def startup_event():
    await cache_manager.connect()
    print("Redis cache manager connected")

@app.on_event("shutdown")
async def shutdown_event():
    await cache_manager.disconnect()
    print("Redis cache manager disconnected")

# Include API routes
app.include_router(router, prefix="/api/v1")

@app.post("/api/v1/consent/validate")
async def validate_consent(consent_data: dict):
    target = consent_data.get("target")
    if not target:
        return JSONResponse(
            status_code=400,
            content={"error": "Target is required"}
        )
    
    validation_result = await ethical_boundaries.validate_consent(target, consent_data)
    return validation_result

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await websocket_manager.connect(websocket, client_id)
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message["type"] == "start_assessment":
                # Start the assessment workflow
                await orchestrator.start_assessment(
                    target=message["target"],
                    client_id=client_id,
                    websocket_manager=websocket_manager
                )
            elif message["type"] == "stop_assessment":
                await orchestrator.stop_assessment(client_id)
                
    except WebSocketDisconnect:
        websocket_manager.disconnect(client_id)

@app.get("/")
async def root():
    return {"message": "RedStorm Attack Simulator API", "status": "active"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
