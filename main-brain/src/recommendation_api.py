"""
Recommendation API Server
Location: main-brain/src/recommendation_api.py
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime
import uvicorn
import os
from dotenv import load_dotenv

from safe_recommendation_agent import SafeRecommendationAgent

load_dotenv()

app = FastAPI(
    title="WellNoosh Recommendation API",
    description="AI-powered recipe recommendations based on user health profiles",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the recommendation agent
try:
    agent = SafeRecommendationAgent()
    print("✅ Recommendation agent initialized successfully")
except Exception as e:
    print(f"❌ Failed to initialize recommendation agent: {e}")
    agent = None

# Request/Response models
class RecommendationRequest(BaseModel):
    user_id: str
    limit: Optional[int] = 5
    refresh: Optional[bool] = False

class RecipeRecommendation(BaseModel):
    id: str
    title: str
    image_url: Optional[str]
    category: Optional[str]
    cuisine: Optional[str]
    calories: Optional[str]
    protein: Optional[str]
    carbs: Optional[str]
    fat: Optional[str]
    fiber: Optional[str]
    sugar: Optional[str]
    sodium: Optional[str]
    servings: Optional[int]
    instructions: Optional[str]
    recommendation_reason: str
    tags: Optional[List[str]] = []

class RecommendationResponse(BaseModel):
    user_id: str
    recommendations: List[RecipeRecommendation]
    filters_applied: Dict
    messages: List[str]
    generated_at: datetime

class FeedbackRequest(BaseModel):
    user_id: str
    recipe_id: str
    event_type: str  # 'like', 'dislike', 'save', 'hide'

class HealthCheckResponse(BaseModel):
    status: str
    timestamp: datetime
    service: str
    version: str
    agent_available: bool

# API Endpoints
@app.get("/health", response_model=HealthCheckResponse)
async def health_check():
    """Health check endpoint"""
    return HealthCheckResponse(
        status="healthy",
        timestamp=datetime.now(),
        service="recommendation-api",
        version="1.0.0",
        agent_available=agent is not None
    )

@app.post("/api/recommendations", response_model=RecommendationResponse)
async def get_recommendations(request: RecommendationRequest):
    """Get personalized recipe recommendations for a user"""
    
    if not agent:
        raise HTTPException(status_code=503, detail="Recommendation service unavailable")
    
    try:
        # Get recommendations from the agent
        result = agent.get_recommendations(request.user_id)
        
        if result.get('error'):
            raise HTTPException(status_code=400, detail=result['error'])
        
        # Transform the response to match our API model
        recommendations = []
        for rec in result.get('recommendations', []):
            recipe_data = RecipeRecommendation(
                id=rec['id'],
                title=rec['title'],
                image_url=rec.get('image_url'),
                category=rec.get('category'),
                cuisine=rec.get('cuisine'),
                calories=rec.get('calories'),
                protein=rec.get('protein'),
                carbs=rec.get('carbs'),
                fat=rec.get('fat'),
                fiber=rec.get('fiber'),
                sugar=rec.get('sugar'),
                sodium=rec.get('sodium'),
                servings=rec.get('servings'),
                instructions=rec.get('instructions'),
                recommendation_reason=rec.get('recommendation_reason', 'Matches your preferences'),
                tags=rec.get('tags', [])
            )
            recommendations.append(recipe_data)
        
        return RecommendationResponse(
            user_id=request.user_id,
            recommendations=recommendations[:request.limit],
            filters_applied=result.get('filters_applied', {}),
            messages=result.get('messages', []),
            generated_at=datetime.now()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting recommendations: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate recommendations: {str(e)}")

@app.post("/api/feedback")
async def record_feedback(request: FeedbackRequest):
    """Record user feedback on recommendations"""
    
    if not agent:
        raise HTTPException(status_code=503, detail="Recommendation service unavailable")
    
    # Map frontend events to agent events
    event_mapping = {
        'like': 'like',
        'dislike': 'hide',
        'save': 'save',
        'pass': 'view'
    }
    
    event_type = event_mapping.get(request.event_type, request.event_type)
    
    try:
        success = agent.record_feedback(
            request.user_id,
            request.recipe_id,
            event_type
        )
        
        if not success:
            raise HTTPException(status_code=400, detail="Failed to record feedback")
        
        return {"success": True, "message": "Feedback recorded"}
        
    except Exception as e:
        print(f"Error recording feedback: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to record feedback: {str(e)}")

@app.get("/api/recommendations/{user_id}/history")
async def get_recommendation_history(user_id: str, limit: int = 50):
    """Get user's recommendation history"""
    
    if not agent:
        raise HTTPException(status_code=503, detail="Recommendation service unavailable")
    
    try:
        # This would need to be implemented in the agent
        # For now, return empty history
        return {
            "user_id": user_id,
            "history": [],
            "message": "History endpoint not yet implemented"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    
    print(f"🚀 Starting Recommendation API server on {host}:{port}")
    uvicorn.run(app, host=host, port=port)