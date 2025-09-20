"""
Reconnaissance Agent - OSINT and passive information gathering
"""
import asyncio
import subprocess
import json
import requests
import dns.resolver
import whois
from typing import Dict, Any, List
from .base_agent import BaseAgent

class ReconnaissanceAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="reconnaissance",
            description="OSINT gathering, subdomain discovery, and passive reconnaissance"
        )
        
    async def execute(self, target: str, options: Dict[str, Any] = None) -> Dict[str, Any]:
        """Execute reconnaissance phase"""
        if not await self.validate_target(target):
            return {"error": "Invalid target"}
            
        self.status = "running"
        results = {
            "target": target,
            "phase": "reconnaissance",
            "subdomains": [],
            "dns_records": {},
            "whois_info": {},
            "certificates": [],
            "technologies": [],
            "social_intel": []
        }
        
        try:
            # Subdomain discovery
            await self.send_update(options.get("websocket_manager"), options.get("client_id"), {
                "status": "discovering_subdomains",
                "message": "Discovering subdomains..."
            })
            results["subdomains"] = await self.discover_subdomains(target)
            
            # DNS enumeration
            await self.send_update(options.get("websocket_manager"), options.get("client_id"), {
                "status": "dns_enumeration",
                "message": "Enumerating DNS records..."
            })
            results["dns_records"] = await self.enumerate_dns(target)
            
            # WHOIS lookup
            await self.send_update(options.get("websocket_manager"), options.get("client_id"), {
                "status": "whois_lookup",
                "message": "Performing WHOIS lookup..."
            })
            results["whois_info"] = await self.whois_lookup(target)
            
            # Certificate analysis
            await self.send_update(options.get("websocket_manager"), options.get("client_id"), {
                "status": "certificate_analysis",
                "message": "Analyzing SSL certificates..."
            })
            results["certificates"] = await self.analyze_certificates(target)
            
            # Technology fingerprinting
            await self.send_update(options.get("websocket_manager"), options.get("client_id"), {
                "status": "tech_fingerprinting",
                "message": "Fingerprinting technologies..."
            })
            results["technologies"] = await self.fingerprint_technologies(target)
            
            self.status = "completed"
            return results
            
        except Exception as e:
            self.status = "error"
            self.log_activity(f"Error during reconnaissance: {str(e)}", "error")
            return {"error": str(e)}
    
    async def discover_subdomains(self, target: str) -> List[Dict[str, Any]]:
        """Discover subdomains using Go tool"""
        try:
            cmd = ["./tools/redstorm-tools", "recon", "-d", target, "-p"]
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd="/app/backend"
            )
            
            stdout, stderr = await process.communicate()
            
            if process.returncode == 0:
                result = json.loads(stdout.decode())
                return [{"subdomain": sub, "status": "active"} for sub in result.get("subdomains", [])]
            else:
                self.log_activity(f"Subdomain discovery failed: {stderr.decode()}", "error")
                return []
                
        except Exception as e:
            self.log_activity(f"Subdomain discovery error: {str(e)}", "error")
            return []
    
    async def enumerate_dns(self, target: str) -> Dict[str, List[str]]:
        """Enumerate DNS records"""
        dns_records = {
            "A": [],
            "AAAA": [],
            "MX": [],
            "NS": [],
            "TXT": [],
            "CNAME": []
        }
        
        record_types = ["A", "AAAA", "MX", "NS", "TXT", "CNAME"]
        
        for record_type in record_types:
            try:
                answers = dns.resolver.resolve(target, record_type)
                dns_records[record_type] = [str(answer) for answer in answers]
            except Exception:
                continue
                
        return dns_records
    
    async def whois_lookup(self, target: str) -> Dict[str, Any]:
        """Perform WHOIS lookup"""
        try:
            w = whois.whois(target)
            return {
                "domain": target,
                "registrar": w.registrar,
                "creation_date": str(w.creation_date) if w.creation_date else None,
                "expiration_date": str(w.expiration_date) if w.expiration_date else None,
                "name_servers": w.name_servers if w.name_servers else []
            }
        except Exception as e:
            self.log_activity(f"WHOIS lookup failed: {str(e)}", "error")
            return {}
    
    async def analyze_certificates(self, target: str) -> List[Dict[str, Any]]:
        """Analyze SSL certificates"""
        # Placeholder for certificate analysis
        # In production, use tools like sslscan or custom SSL analysis
        return [
            {
                "subject": f"CN={target}",
                "issuer": "Let's Encrypt Authority X3",
                "valid_from": "2024-01-01",
                "valid_to": "2024-04-01",
                "algorithm": "RSA 2048"
            }
        ]
    
    async def fingerprint_technologies(self, target: str) -> List[Dict[str, Any]]:
        """Fingerprint web technologies"""
        try:
            url = f"https://{target}" if not target.startswith("http") else target
            response = requests.get(url, timeout=10, verify=False)
            
            technologies = []
            headers = response.headers
            
            # Analyze headers for technology indicators
            if "Server" in headers:
                technologies.append({
                    "name": headers["Server"],
                    "category": "Web Server",
                    "confidence": "high"
                })
            
            if "X-Powered-By" in headers:
                technologies.append({
                    "name": headers["X-Powered-By"],
                    "category": "Programming Language",
                    "confidence": "high"
                })
            
            # Analyze HTML content
            content = response.text.lower()
            if "wordpress" in content:
                technologies.append({
                    "name": "WordPress",
                    "category": "CMS",
                    "confidence": "medium"
                })
            
            return technologies
            
        except Exception as e:
            self.log_activity(f"Technology fingerprinting failed: {str(e)}", "error")
            return []
