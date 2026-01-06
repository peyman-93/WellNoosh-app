"""
Main entry point for the WellNoosh AI Brain service
"""

import uvicorn
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from src.recommendation_api import app

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    
    print(f"Starting WellNoosh AI Brain on {host}:{port}")
    uvicorn.run(app, host=host, port=port)
