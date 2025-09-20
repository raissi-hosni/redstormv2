"""
Agent Orchestrator - Manages the execution flow of all agents
"""
import asyncio
import json
from typing import Dict, Any, Optional
from datetime import datetime

from .reconnaissance_agent import ReconnaissanceAgent
from .scanning_agent import ScanningAgent
from .vulnerability_agent import VulnerabilityAgent
from .exploitation_agent import ExploitationAgent

class AgentOrchestrator:
    def __init__(self):
        self.agents = {
            "reconnaissance": ReconnaissanceAgent(),
            "scanning": ScanningAgent(),
            "vulnerability": VulnerabilityAgent(),
            "exploitation": ExploitationAgent()
        }
        self.active_assessments = {}
        
    async def start_assessment(self, target: str, client_id: str, websocket_manager):
        """Start a complete security assessment"""
        assessment_id = f"{client_id}_{int(datetime.now().timestamp())}"
        
        self.active_assessments[assessment_id] = {
            "target": target,
            "client_id": client_id,
            "status": "running",
            "current_phase": "reconnaissance",
            "results": {},
            "start_time": datetime.now()
        }
        
        try:
            # Send assessment started message
            await websocket_manager.send_personal_message(
                json.dumps({
                    "type": "assessment_started",
                    "assessment_id": assessment_id,
                    "target": target,
                    "phases": ["reconnaissance", "scanning", "vulnerability", "exploitation"]
                }),
                client_id
            )
            
            # Execute phases sequentially
            phases = ["reconnaissance", "scanning", "vulnerability", "exploitation"]
            
            for phase in phases:
                self.active_assessments[assessment_id]["current_phase"] = phase
                
                await websocket_manager.send_personal_message(
                    json.dumps({
                        "type": "phase_started",
                        "phase": phase,
                        "assessment_id": assessment_id
                    }),
                    client_id
                )
                
                # Execute agent
                agent = self.agents[phase]
                options = {
                    "websocket_manager": websocket_manager,
                    "client_id": client_id,
                    "assessment_id": assessment_id
                }
                
                results = await agent.execute(target, options)
                self.active_assessments[assessment_id]["results"][phase] = results
                
                await websocket_manager.send_personal_message(
                    json.dumps({
                        "type": "phase_completed",
                        "phase": phase,
                        "results": results,
                        "assessment_id": assessment_id
                    }),
                    client_id
                )
            
            # Assessment completed
            self.active_assessments[assessment_id]["status"] = "completed"
            await websocket_manager.send_personal_message(
                json.dumps({
                    "type": "assessment_completed",
                    "assessment_id": assessment_id,
                    "results": self.active_assessments[assessment_id]["results"]
                }),
                client_id
            )
            
        except Exception as e:
            self.active_assessments[assessment_id]["status"] = "error"
            await websocket_manager.send_personal_message(
                json.dumps({
                    "type": "assessment_error",
                    "assessment_id": assessment_id,
                    "error": str(e)
                }),
                client_id
            )
    
    async def stop_assessment(self, client_id: str):
        """Stop active assessment for client"""
        for assessment_id, assessment in self.active_assessments.items():
            if assessment["client_id"] == client_id and assessment["status"] == "running":
                assessment["status"] = "stopped"
                break
    
    def get_assessment_status(self, assessment_id: str) -> Optional[Dict[str, Any]]:
        """Get current assessment status"""
        return self.active_assessments.get(assessment_id)
