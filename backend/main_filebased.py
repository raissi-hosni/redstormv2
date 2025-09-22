"""
RedStorm AI-Powered Real-Time Attack Simulator
File-based version - No database required
"""
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import asyncio
import json
from typing import Dict, List, Optional
import uvicorn
import logging

from api.routes import router
from agents.orchestrator import AgentOrchestrator
from utils.websocket_manager import WebSocketManager
from utils.cache_manager import cache_manager
from utils.ethical_boundaries import ethical_boundaries
from utils.file_storage import file_storage

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="RedStorm Attack Simulator",
    description="AI-Powered Real-Time Penetration Testing Simulator - File-based Storage",
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
    """Startup event - file-based storage"""
    try:
        await cache_manager.connect()
        logger.info("Redis cache manager connected")
        
        # Initialize file storage
        health = await file_storage.health_check()
        if health["status"] == "healthy":
            logger.info(f"File storage initialized at: {health['data_directory']}")
        else:
            logger.warning(f"File storage health check failed: {health.get('error')}")
            
    except Exception as e:
        logger.error(f"Startup error: {e}")
        raise

@app.on_event("shutdown")
async def shutdown_event():
    """Shutdown event"""
    try:
        await cache_manager.disconnect()
        logger.info("Redis cache manager disconnected")
    except Exception as e:
        logger.error(f"Shutdown error: {e}")

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
    
    # Log consent validation to file
    await file_storage.log_consent_validation(target, validation_result)
    
    return validation_result

@app.get("/api/v1/assessments/{assessment_id}")
async def get_assessment_status(assessment_id: str):
    """Get assessment status from file storage"""
    try:
        assessment = await file_storage.get_assessment(assessment_id)
        if not assessment:
            return JSONResponse(
                status_code=404,
                content={"error": "Assessment not found"}
            )
        return assessment
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"Error retrieving assessment: {str(e)}"}
        )

@app.get("/api/v1/assessments")
async def get_assessments(client_id: Optional[str] = None):
    """Get all assessments or filter by client_id"""
    try:
        assessments = await file_storage.get_active_assessments(client_id)
        return {"assessments": assessments, "count": len(assessments)}
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"Error retrieving assessments: {str(e)}"}
        )

@app.get("/api/v1/vulnerabilities")
async def get_vulnerabilities(
    assessment_id: Optional[str] = None,
    target: Optional[str] = None,
    severity: Optional[str] = None
):
    """Get vulnerability findings"""
    try:
        findings = await file_storage.get_vulnerability_findings(
            assessment_id=assessment_id,
            target=target,
            severity=severity
        )
        return {"findings": findings, "count": len(findings)}
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"Error retrieving vulnerabilities: {str(e)}"}
        )

@app.get("/api/v1/statistics")
async def get_statistics():
    """Get system statistics from file storage"""
    try:
        stats = await file_storage.get_system_statistics()
        return stats
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"Error retrieving statistics: {str(e)}"}
        )

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
    return {"message": "RedStorm Attack Simulator API - File-based Storage", "status": "active"}

@app.get("/health")
async def health_check():
    """Health check including file storage"""
    health_data = {
        "status": "healthy", 
        "version": "1.0.0", 
        "storage": "file_system"
    }
    
    # Check file storage health
    try:
        storage_health = await file_storage.health_check()
        health_data["storage_health"] = storage_health
    except Exception as e:
        health_data["storage_health"] = {"status": "unhealthy", "error": str(e)}
    
    return health_data

if __name__ == "__main__":
    uvicorn.run(
        "main_filebased:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )