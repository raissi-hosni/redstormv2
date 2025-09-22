import asyncio
import websockets
import json
import time

async def scan_scanme_live():
    uri = "ws://localhost:8000/ws/scanme_live_client"
    try:
        async with websockets.connect(uri) as websocket:
            print("🚀 Starting LIVE security assessment of scanme.nmap.org")
            print("⏱️ This will take 3-5 minutes to complete...")
            print("=" * 60)
            
            message = {
                "type": "start_assessment",
                "target": "scanme.nmap.org",
                "options": {
                    "phases": ["reconnaissance", "scanning", "vulnerability"],
                    "timeout": 300,
                    "intensity": "medium"
                }
            }
            
            await websocket.send(json.dumps(message))
            print(f"📤 Sent assessment request")
            
            start_time = time.time()
            vulnerabilities_found = []
            phase_results = {}
            
            while True:
                try:
                    response = await asyncio.wait_for(websocket.recv(), timeout=60.0)
                    data = json.loads(response)
                    
                    timestamp = time.strftime('%H:%M:%S', time.localtime())
                    
                    if data.get("type") == "assessment_started":
                        print(f"[{timestamp}] 🟢 ASSESSMENT STARTED")
                        print(f"   Target: {data.get('target')}")
                        print(f"   Phases: {', '.join(data.get('phases', []))}")
                        
                    elif data.get("type") == "phase_started":
                        phase = data.get('phase')
                        print(f"[{timestamp}] 🔄 STARTING PHASE: {phase.upper()}")
                        
                    elif data.get("type") == "phase_completed":
                        phase = data.get('phase')
                        results = data.get('results', {})
                        phase_results[phase] = results
                        
                        print(f"[{timestamp}] ✅ PHASE COMPLETED: {phase.upper()}")
                        if isinstance(results, dict):
                            result_count = len(results)
                            print(f"   📊 Found {result_count} items")
                            
                            # Show first few results
                            if results:
                                for i, (key, value) in enumerate(results.items()):
                                    if i < 3:  # Show first 3
                                        print(f"   🔍 {key}: {str(value)[:100]}...")
                                    elif i == 3:
                                        print(f"   ... and {result_count - 3} more")
                                        break
                        
                    elif data.get("type") == "vulnerability_found":
                        vuln = {
                            "name": data.get('vulnerability_name'),
                            "severity": data.get('severity'),
                            "description": data.get('description', ''),
                            "target": data.get('target')
                        }
                        vulnerabilities_found.append(vuln)
                        
                        print(f"[{timestamp}] 🚨 VULNERABILITY FOUND!")
                        print(f"   🔴 Name: {vuln['name']}")
                        print(f"   📊 Severity: {vuln['severity']}")
                        print(f"   🎯 Target: {vuln['target']}")
                        if vuln['description']:
                            print(f"   📝 {vuln['description'][:150]}...")
                            
                    elif data.get("type") == "assessment_completed":
                        duration = time.time() - start_time
                        print(f"[{timestamp}] 🎉 ASSESSMENT COMPLETED!")
                        print(f"   ⏱️ Duration: {duration:.1f} seconds")
                        print(f"   🎯 Target: {data.get('target')}")
                        print(f"   📊 Total vulnerabilities: {len(vulnerabilities_found)}")
                        print(f"   📋 Phases completed: {', '.join(phase_results.keys())}")
                        break
                        
                    elif data.get("type") == "assessment_error":
                        print(f"[{timestamp}] ❌ ASSESSMENT ERROR!")
                        print(f"   🔴 Error: {data.get('error')}")
                        break
                        
                    else:
                        print(f"[{timestamp}] 📨 {data.get('type', 'unknown')}: {str(data)[:100]}...")
                        
                except asyncio.TimeoutError:
                    print(f"[{time.strftime('%H:%M:%S', time.localtime())}] ⏰ No response for 60 seconds...")
                    continue
                    
            # Final summary
            print("\n" + "=" * 60)
            print("📊 FINAL ASSESSMENT SUMMARY")
            print("=" * 60)
            print(f"🎯 Target: scanme.nmap.org")
            print(f"⏱️ Total Duration: {time.time() - start_time:.1f} seconds")
            print(f"🔄 Phases Completed: {len(phase_results)}")
            print(f"🚨 Vulnerabilities Found: {len(vulnerabilities_found)}")
            
            if vulnerabilities_found:
                print("\n🔴 VULNERABILITIES BREAKDOWN:")
                for i, vuln in enumerate(vulnerabilities_found, 1):
                    print(f"   {i}. {vuln['name']} ({vuln['severity']}) - {vuln['target']}")
                    
            if phase_results:
                print("\n📋 PHASE RESULTS SUMMARY:")
                for phase, results in phase_results.items():
                    if isinstance(results, dict):
                        print(f"   {phase.upper()}: {len(results)} findings")
                    else:
                        print(f"   {phase.upper()}: {type(results).__name__}")
                        
            return {
                "vulnerabilities": vulnerabilities_found,
                "phase_results": phase_results,
                "duration": time.time() - start_time
            }
            
    except Exception as e:
        print(f"❌ WebSocket error: {e}")
        return None

if __name__ == "__main__":
    results = asyncio.run(scan_scanme_live())
    if results:
        print(f"\n✅ Live scanning completed successfully!")
        print(f"💾 Results saved to file storage")
        print(f"🔍 Check API endpoints for detailed results")
    else:
        print(f"\n❌ Live scanning failed")