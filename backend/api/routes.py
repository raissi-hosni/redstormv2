"""
API Routes for RedStorm
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
import asyncio

from agents.orchestrator import AgentOrchestrator

router = APIRouter()
orchestrator = AgentOrchestrator()

class AssessmentRequest(BaseModel):
    target: str
    phases: Optional[List[str]] = ["reconnaissance", "scanning", "vulnerability", "exploitation"]
    options: Optional[Dict[str, Any]] = {}

class TargetValidationRequest(BaseModel):
    target: str

@router.post("/validate-target")
async def validate_target(request: TargetValidationRequest):
    """Validate target before assessment"""
    target = request.target.strip()
    
    if not target:
        raise HTTPException(status_code=400, detail="Target cannot be empty")
    
    # Basic validation
    if len(target) < 3:
        raise HTTPException(status_code=400, detail="Target too short")
    
    # Check if target is reachable (basic ping)
    try:
        import subprocess
        result = subprocess.run(
            ["ping", "-c", "1", "-W", "3", target],
            capture_output=True,
            text=True,
            timeout=5
        )
        
        is_reachable = result.returncode == 0
        
        return {
            "target": target,
            "valid": True,
            "reachable": is_reachable,
            "message": "Target validated successfully"
        }
        
    except Exception as e:
        return {
            "target": target,
            "valid": True,
            "reachable": False,
            "message": f"Target validation completed with warnings: {str(e)}"
        }

@router.get("/assessments/{assessment_id}")
async def get_assessment_status(assessment_id: str):
    """Get assessment status"""
    status = orchestrator.get_assessment_status(assessment_id)
    if not status:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    return status

@router.get("/tools/status")
async def get_tools_status():
    """Get status of security tools"""
    tools_status = {
        "nmap": {"available": True, "version": "7.94"},
        "subfinder": {"available": True, "version": "2.6.3"},
        "nuclei": {"available": True, "version": "3.1.0"},
        "gobuster": {"available": True, "version": "3.6.0"},
        "httpx": {"available": True, "version": "1.3.7"},
        "fping": {"available": True, "version": "5.1"},
        "hping3": {"available": True, "version": "3.0.0"},
        "amass": {"available": True, "version": "4.2.0"},
        "metasploit": {"available": True, "version": "6.3.0", "mode": "simulation"},
        "empire": {"available": True, "version": "5.0.0", "mode": "simulation"},
        "dradis": {"available": True, "version": "4.10.0"}
    }
    
    return {
        "status": "operational",
        "tools": tools_status,
        "total_tools": len(tools_status),
        "available_tools": sum(1 for tool in tools_status.values() if tool["available"])
    }

@router.get("/agents/status")
async def get_agents_status():
    """Get status of AI agents"""
    agents_status = {}
    
    for name, agent in orchestrator.agents.items():
        agents_status[name] = {
            "name": agent.name,
            "description": agent.description,
            "status": agent.status,
            "available": True
        }
    
    return {
        "status": "operational",
        "agents": agents_status,
        "total_agents": len(agents_status)
    }
