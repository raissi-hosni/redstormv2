"""
RedStorm AI-Powered Real-Time Attack Simulator
Enhanced Main FastAPI Application
"""
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import asyncio
import json
import logging
from typing import Dict, List, Optional
import uvicorn
from datetime import datetime
import os
from dotenv import load_dotenv

# Import all modules
from api.routes import router
from api.scan_routes import scan_router
from api.exploitation_routes import exploitation_router
from api.recon_routes import recon_router
from api.vulnerability_routes import vulnerability_router
from agents.orchestrator import AgentOrchestrator
from utils.websocket_manager import WebSocketManager
from utils.cache_manager import cache_manager
from utils.ethical_boundaries import ethical_boundaries
from utils.logger import setup_logging
from utils.database import database_manager

# Load environment variables
load_dotenv()

# Setup logging
logger = setup_logging()

# Create FastAPI app with enhanced configuration
app = FastAPI(
    title="RedStorm Attack Simulator",
    description="Real-Time Penetration Testing Simulator",
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# Enhanced CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://localhost:3000",
        "http://127.0.0.1:3000",
        "https://127.0.0.1:3000",
        os.getenv("FRONTEND_URL", "http://localhost:3000")
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize managers
websocket_manager = WebSocketManager()
orchestrator = AgentOrchestrator()

@app.on_event("startup")
async def startup_event():
    """Initialize all services on startup"""
    try:
        # Connect to Redis cache
        await cache_manager.connect()
        logger.info("Redis cache manager connected")

        # Initialize database
        await database_manager.connect()
        logger.info("Database manager connected")

        # -----  REMOVED  -----
        # await orchestrator.test_tools_availability()
        # ---------------------

        logger.info("RedStorm backend initialized successfully")

    except Exception as e:
        logger.error(f"Startup error: {str(e)}")
        raise

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    try:
        await cache_manager.disconnect()
        await database_manager.disconnect()
        logger.info("RedStorm backend shutdown completed")
    except Exception as e:
        logger.error(f"Shutdown error: {str(e)}")

# Include all API routers
app.include_router(router, prefix="/api/v1")
app.include_router(scan_router, prefix="/api/v1/scan")
app.include_router(exploitation_router, prefix="/api/v1/exploitation")
app.include_router(recon_router, prefix="/api/v1/recon")
app.include_router(vulnerability_router, prefix="/api/v1/vulnerability")

# Enhanced consent validation
@app.post("/api/v1/consent/validate")
async def validate_consent(consent_data: dict):
    """Enhanced consent validation"""
    try:
        target = consent_data.get("target")
        if not target:
            return JSONResponse(
                status_code=400,
                content={"error": "Target is required"}
            )

        # Basic validation
        validation_result = await ethical_boundaries.validate_consent(target, consent_data)
        
        # Log consent validation
        await database_manager.log_consent_validation(target, validation_result)
        
        return validation_result
        
    except Exception as e:
        logger.error(f"Consent validation error: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"error": "Consent validation failed"}
        )

# Enhanced WebSocket endpoint
@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    """Enhanced WebSocket endpoint with better error handling"""
    await websocket_manager.connect(websocket, client_id)
    logger.info(f"WebSocket client connected: {client_id}")
    
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            logger.debug(f"Received WebSocket message from {client_id}: {message.get('type')}")
            
            if message["type"] == "start_assessment":
                # Enhanced assessment workflow
                assessment_config = message.get("config", {})
                await orchestrator.start_assessment(
                    target=message["target"],
                    client_id=client_id,
                    websocket_manager=websocket_manager,
                    config=assessment_config
                )
                
            elif message["type"] == "stop_assessment":
                await orchestrator.stop_assessment(client_id)
                
            elif message["type"] == "pause_assessment":
                await orchestrator.pause_assessment(client_id)
                
            elif message["type"] == "resume_assessment":
                await orchestrator.resume_assessment(client_id)
                
            elif message["type"] == "get_assessment_status":
                status = await orchestrator.get_assessment_status(client_id)
                await websocket_manager.send_personal_message(
                    json.dumps({
                        "type": "assessment_status",
                        "status": status
                    }),
                    client_id
                )
                
            elif message["type"] == "execute_tool":
                # Execute individual security tool
                tool_result = await orchestrator.execute_tool(
                    tool_name=message.get("tool"),
                    target=message.get("target"),
                    options=message.get("options", {}),
                    client_id=client_id
                )
                await websocket_manager.send_personal_message(
                    json.dumps({
                        "type": "tool_result",
                        "result": tool_result
                    }),
                    client_id
                )

    except WebSocketDisconnect:
        websocket_manager.disconnect(client_id)
        logger.info(f"WebSocket client disconnected: {client_id}")
    except Exception as e:
        logger.error(f"WebSocket error for client {client_id}: {str(e)}")
        websocket_manager.disconnect(client_id)

# System health and monitoring endpoints
@app.get("/health")
async def health_check():
    """Comprehensive health check"""
    try:
        # Check Redis connection
        redis_health = {"status": "healthy", "connected": await cache_manager.redis.ping()} if cache_manager.redis else {"status": "unhealthy"}
        
        # Check database connection
        db_health = await database_manager.health_check()
        
        # Check security tools
        tools_health = await orchestrator.get_tools_health()
        
        overall_health = all([
            redis_health.get("status") == "healthy",
            db_health.get("status") == "healthy", 
            tools_health.get("status") == "healthy"
        ])
        
        return {
            "status": "healthy" if overall_health else "degraded",
            "timestamp": datetime.now().isoformat(),
            "version": "2.0.0",
            "services": {
                "redis": redis_health,
                "database": db_health,
                "security_tools": tools_health
            }
        }
        
    except Exception as e:
        logger.error(f"Health check error: {str(e)}")
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
        )

@app.get("/metrics")
async def get_metrics():
    """Get system metrics and statistics"""
    try:
        metrics = await database_manager.get_system_statistics()
        return metrics
    except Exception as e:
        logger.error(f"Metrics error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve metrics")

# Background task management
@app.post("/api/v1/schedule-assessment")
async def schedule_assessment(background_tasks: BackgroundTasks, assessment_data: dict):
    """Schedule assessment for later execution"""
    try:
        # Validate input
        target = assessment_data.get("target")
        schedule_time = assessment_data.get("schedule_time")
        
        if not target or not schedule_time:
            raise HTTPException(status_code=400, detail="Target and schedule_time required")
        
        # Schedule background task
        background_tasks.add_task(
            orchestrator.schedule_assessment,
            target=target,
            schedule_time=schedule_time,
            config=assessment_data.get("config", {})
        )
        
        return {
            "status": "scheduled",
            "message": "Assessment scheduled successfully",
            "schedule_time": schedule_time
        }
        
    except Exception as e:
        logger.error(f"Schedule assessment error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to schedule assessment")

# Root endpoint
@app.get("/")
async def root():
    """API information endpoint"""
    return {
        "message": "RedStorm Attack Simulator API v2.0",
        "status": "active",
        "version": "2.0.0",
        "features": [
            "Real-time security assessment",
            "WebSocket communication",
            "Comprehensive security scanning",
            "Ethical exploitation simulation",
            "Advanced vulnerability analysis",
            "Compliance checking"
        ],
        "documentation": "/api/docs",
        "health_check": "/health",
        "metrics": "/metrics"
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
        access_log=True
    )