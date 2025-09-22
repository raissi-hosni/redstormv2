"""
Enhanced Reconnaissance API Routes
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
import logging

from agents.reconnaissance_agent import ReconnaissanceAgent
from utils.cache_manager import cache_manager
from utils.ethical_boundaries import ethical_boundaries

# Create router instance
router = APIRouter()          
logger = logging.getLogger(__name__)
recon_agent = ReconnaissanceAgent()

class ReconRequest(BaseModel):
    target: str = Field(..., description="Target domain or IP")
    recon_type: str = Field(default="full", description="Type: passive, active, full")
    techniques: Optional[List[str]] = Field(default=None, description="Recon techniques")
    depth: str = Field(default="normal", description="Depth: shallow, normal, deep")

class SubdomainRequest(BaseModel):
    domain: str = Field(..., description="Domain to enumerate subdomains")
    wordlist: Optional[str] = Field(default=None, description="Custom wordlist for subdomain brute force")
    techniques: Optional[List[str]] = Field(default=None, description="Subdomain discovery techniques")

class WHOISRequest(BaseModel):
    target: str = Field(..., description="Target for WHOIS lookup")
    detailed: bool = Field(default=True, description="Get detailed WHOIS information")

@router.post("/subdomain-enumeration")
async def subdomain_enumeration(request: SubdomainRequest):
    """Perform subdomain enumeration"""
    try:
        # Validate domain
        if not await ethical_boundaries.validate_domain(request.domain):
            raise HTTPException(status_code=400, detail="Invalid or unauthorized domain")
        
        # Check cache
        cached_result = await cache_manager.get_cached_result("subdomains", request.domain, {
            "techniques": request.techniques
        })
        
        if cached_result:
            return cached_result
        
        # Execute subdomain enumeration
        result = await recon_agent.discover_subdomains_advanced(
            domain=request.domain,
            wordlist=request.wordlist,
            techniques=request.techniques or ["dns", "brute", "permutation"]
        )
        
        # Cache result
        await cache_manager.cache_result("subdomains", request.domain, result, {
            "techniques": request.techniques
        }, ttl=3600)  # Cache for 1 hour
        
        return result
        
    except Exception as e:
        logger.error(f"Subdomain enumeration error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Subdomain enumeration failed: {str(e)}")

@router.post("/dns-enumeration")
async def dns_enumeration(dns_request: Dict[str, Any]):
    """Perform comprehensive DNS enumeration"""
    try:
        target = dns_request.get("target")
        if not target:
            raise HTTPException(status_code=400, detail="Target required")
            
        # Check cache
        cached_result = await cache_manager.get_cached_result("dns", target)
        if cached_result:
            return cached_result
        
        result = await recon_agent.enumerate_dns_comprehensive(target)
        
        # Cache result
        await cache_manager.cache_result("dns", target, result, ttl=1800)
        
        return result
        
    except Exception as e:
        logger.error(f"DNS enumeration error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"DNS enumeration failed: {str(e)}")

@router.post("/whois-lookup")
async def whois_lookup(request: WHOISRequest):
    """Perform WHOIS lookup"""
    try:
        result = await recon_agent.whois_lookup_detailed(
            target=request.target,
            detailed=request.detailed
        )
        return result
        
    except Exception as e:
        logger.error(f"WHOIS lookup error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"WHOIS lookup failed: {str(e)}")

@router.post("/certificate-analysis")
async def certificate_analysis(cert_request: Dict[str, Any]):
    """Analyze SSL/TLS certificates"""
    try:
        target = cert_request.get("target")
        if not target:
            raise HTTPException(status_code=400, detail="Target required")
            
        result = await recon_agent.analyze_certificates_comprehensive(target)
        return result
        
    except Exception as e:
        logger.error(f"Certificate analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Certificate analysis failed: {str(e)}")

@router.post("/technology-fingerprinting")
async def technology_fingerprinting(fp_request: Dict[str, Any]):
    """Fingerprint technologies used by target"""
    try:
        target = fp_request.get("target")
        if not target:
            raise HTTPException(status_code=400, detail="Target required")
            
        result = await recon_agent.fingerprint_technologies_advanced(target)
        return result
        
    except Exception as e:
        logger.error(f"Technology fingerprinting error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Technology fingerprinting failed: {str(e)}")

@router.post("/osint-gathering")
async def osint_gathering(request: ReconRequest):
    """Perform OSINT gathering"""
    try:
        result = await recon_agent.gather_osint(
            target=request.target,
            recon_type=request.recon_type,
            techniques=request.techniques,
            depth=request.depth
        )
        return result
        
    except Exception as e:
        logger.error(f"OSINT gathering error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"OSINT gathering failed: {str(e)}")

@router.get("/recon-methods")
async def get_recon_methods():
    """Get available reconnaissance methods"""
    methods = {
        "passive": [
            "WHOIS lookup",
            "DNS enumeration",
            "Certificate transparency logs",
            "Search engine reconnaissance",
            "Social media analysis"
        ],
        "active": [
            "Subdomain brute force",
            "DNS zone transfer",
            "Port scanning",
            "Service enumeration",
            "Technology fingerprinting"
        ],
        "advanced": [
            "API reconnaissance",
            "GitHub reconnaissance",
            "Cloud resource discovery",
            "Network topology mapping",
            "Certificate analysis"
        ]
    }
    
    return {"recon_methods": methods}

@router.post("/full-reconnaissance")
async def full_reconnaissance(request: ReconRequest):
    """Perform full reconnaissance with all techniques"""
    try:
        result = await recon_agent.execute_full_reconnaissance(
            target=request.target,
            depth=request.depth
        )
        return result
        
    except Exception as e:
        logger.error(f"Full reconnaissance error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Full reconnaissance failed: {str(e)}")
    
recon_router = router 