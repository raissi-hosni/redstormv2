"""
RedStorm AI-Powered Real-Time Attack Simulator
File-based version - No database required
"""
import asyncio
import json
from typing import Dict, Any
from agents.scanning_agent import ScanningAgent

async def test_scanning_agent():
    """Test the ScanningAgent with a target"""
    
    print("🚀 Testing ScanningAgent...")
    print("=" * 50)
    
    # Initialize the scanning agent
    agent = ScanningAgent()
    
    # Test target
    target = "onetech-group.com"
    
    print(f"🎯 Target: {target}")
    print("⏳ Starting scan...")
    
    try:
        # Execute the scanning agent
        results = await agent.execute(target)
        
        print("✅ Scan completed successfully!")
        print("=" * 50)
        print("📊 RESULTS:")
        print("=" * 50)
        
        # Pretty print the results
        print(json.dumps(results, indent=2, default=str))
        
        # Analyze results
        print("\n📈 SUMMARY:")
        print("-" * 30)
        
        if "error" in results:
            print(f"❌ Error: {results['error']}")
        else:
            print(results) 
           
    except Exception as e:
        print(f"❌ Test failed with error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    # Set up logging to see what's happening
    import logging
    logging.basicConfig(level=logging.INFO)
    
    # Run the test
    asyncio.run(test_scanning_agent())