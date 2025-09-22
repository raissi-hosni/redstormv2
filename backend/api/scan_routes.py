"""
Enhanced Scanning API Routes
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
import logging

from agents.scanning_agent import ScanningAgent
from utils.cache_manager import cache_manager
from utils.ethical_boundaries import ethical_boundaries

# Create router instance
scan_router = APIRouter()
logger = logging.getLogger(__name__)
scanning_agent = ScanningAgent()

class ScanRequest(BaseModel):
    target: str = Field(..., description="Target IP or hostname")
    scan_type: str = Field(default="full", description="Type of scan: quick, full, custom")
    ports: Optional[List[int]] = Field(default=None, description="Specific ports to scan")
    techniques: Optional[List[str]] = Field(default=None, description="Scanning techniques to use")
    advanced_options: Optional[Dict[str, Any]] = Field(default=None, description="Advanced scanning options")

class PortScanRequest(BaseModel):
    target: str
    port_range: str = Field(default="1-65535", description="Port range to scan")
    scan_technique: str = Field(default="syn", description="Scan technique: syn, connect, udp")
    timing: str = Field(default="T4", description="Timing template: T1-T5")
    service_detection: bool = Field(default=True, description="Enable service detection")

class NetworkDiscoveryRequest(BaseModel):
    target_range: str = Field(..., description="Network range to discover (e.g., 192.168.1.0/24)")
    discovery_methods: Optional[List[str]] = Field(default=None, description="Discovery methods to use")

@scan_router.post("/port-scan")
async def port_scan(request: PortScanRequest):
    """Perform detailed port scanning"""
    try:
        # Validate target
        if not await ethical_boundaries.validate_target(request.target):
            raise HTTPException(status_code=400, detail="Invalid or unauthorized target")
        
        # Check cache
        cache_key = f"port_scan:{request.target}:{request.port_range}:{request.scan_technique}"
        cached_result = await cache_manager.get_cached_result("port_scan", request.target, {
            "port_range": request.port_range,
            "scan_technique": request.scan_technique
        })
        
        if cached_result:
            return cached_result
        
        # Execute port scan
        result = await scanning_agent.scan_ports_advanced(
            target=request.target,
            port_range=request.port_range,
            technique=request.scan_technique,
            timing=request.timing,
            service_detection=request.service_detection
        )
        
        # Cache result
        await cache_manager.cache_result("port_scan", request.target, result, {
            "port_range": request.port_range,
            "scan_technique": request.scan_technique
        }, ttl=1800)  # Cache for 30 minutes
        
        return result
        
    except Exception as e:
        logger.error(f"Port scan error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Port scan failed: {str(e)}")

@scan_router.post("/network-discovery")
async def network_discovery(request: NetworkDiscoveryRequest):
    """Discover hosts in network range"""
    try:
        # Validate network range
        if not await ethical_boundaries.validate_network_range(request.target_range):
            raise HTTPException(status_code=400, detail="Invalid or unauthorized network range")
        
        result = await scanning_agent.discover_network_hosts(
            network_range=request.target_range,
            methods=request.discovery_methods or ["ping", "arp", "icmp"]
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Network discovery error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Network discovery failed: {str(e)}")

@scan_router.post("/service-enumeration")
async def service_enumeration(scan_request: ScanRequest):
    """Perform detailed service enumeration"""
    try:
        result = await scanning_agent.enumerate_services(
            target=scan_request.target,
            scan_type=scan_request.scan_type,
            ports=scan_request.ports,
            techniques=scan_request.techniques,
            options=scan_request.advanced_options
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Service enumeration error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Service enumeration failed: {str(e)}")

@scan_router.get("/scan-results/{scan_id}")
async def get_scan_results(scan_id: str):
    """Get scan results by ID"""
    try:
        result = await scanning_agent.get_scan_results(scan_id)
        if not result:
            raise HTTPException(status_code=404, detail="Scan results not found")
        return result
        
    except Exception as e:
        logger.error(f"Get scan results error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve scan results: {str(e)}")

@scan_router.post("/os-detection")
async def os_detection(target_request: Dict[str, Any]):
    """Detect operating system of target"""
    try:
        target = target_request.get("target")
        if not target:
            raise HTTPException(status_code=400, detail="Target required")
            
        result = await scanning_agent.detect_os_advanced(target)
        return result
        
    except Exception as e:
        logger.error(f"OS detection error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"OS detection failed: {str(e)}")

@scan_router.get("/active-scans")
async def get_active_scans():
    """Get list of active scans"""
    try:
        active_scans = await scanning_agent.get_active_scans()
        return {"active_scans": active_scans, "count": len(active_scans)}
        
    except Exception as e:
        logger.error(f"Get active scans error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve active scans: {str(e)}")

@scan_router.delete("/cancel-scan/{scan_id}")
async def cancel_scan(scan_id: str):
    """Cancel active scan"""
    try:
        success = await scanning_agent.cancel_scan(scan_id)
        if success:
            return {"status": "cancelled", "scan_id": scan_id}
        else:
            raise HTTPException(status_code=404, detail="Scan not found or already completed")
            
    except Exception as e:
        logger.error(f"Cancel scan error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to cancel scan: {str(e)}")

@scan_router.get("/scan-templates")
async def get_scan_templates():
    """Get available scan templates"""
    templates = {
        "quick_scan": {
            "name": "Quick Scan",
            "description": "Fast scan of top 1000 ports",
            "ports": "1-1000",
            "timing": "T5",
            "techniques": ["syn"]
        },
        "full_scan": {
            "name": "Full Scan",
            "description": "Comprehensive scan of all ports",
            "ports": "1-65535",
            "timing": "T3",
            "techniques": ["syn", "udp"]
        },
        "stealth_scan": {
            "name": "Stealth Scan",
            "description": "Slow, stealthy scan to avoid detection",
            "ports": "1-65535",
            "timing": "T1",
            "techniques": ["syn", "fin", "xmas"]
        },
        "service_scan": {
            "name": "Service Detection",
            "description": "Focus on service version detection",
            "ports": "1-10000",
            "timing": "T4",
            "techniques": ["syn"],
            "service_detection": True
        }
    }
    
    return {"templates": templates}