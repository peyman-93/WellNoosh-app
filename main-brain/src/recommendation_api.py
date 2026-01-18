"""
Enhanced Recommendation API Server
Location: main-brain/src/recommendation_api.py
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
import uvicorn
import os
from dotenv import load_dotenv

from langgraph_recommendation_agent import LangGraphRecipeAgent
from meal_planner_agent import MealPlannerAgent
from agents.meal_planner import DSPyMealPlannerService, dspy_meal_planner as dspy_meal_planner_instance
from agents import host_agent
from agents.nutrition_goals import nutrition_goals_agent, calculate_nutrition_goals

load_dotenv()

app = FastAPI(
    title="WellNoosh Enhanced Recommendation API",
    description="AI-powered recipe recommendations with LangGraph workflow orchestration",
    version="3.0.0"
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
    agent = LangGraphRecipeAgent()
    print("LangGraph recommendation agent initialized successfully")
except Exception as e:
    print(f"Failed to initialize recommendation agent: {e}")
    agent = None

# Initialize the meal planner agent
try:
    meal_planner = MealPlannerAgent()
    print("Meal planner agent initialized successfully")
except Exception as e:
    print(f"Failed to initialize meal planner agent: {e}")
    meal_planner = None

# Use the DSPy meal planner from the agents module
dspy_meal_planner = dspy_meal_planner_instance
print("DSPy meal planner initialized successfully")

# Enhanced Request/Response models

class RecommendationRequest(BaseModel):
    user_id: str
    limit: Optional[int] = 5
    refresh: Optional[bool] = False
    include_safety_details: Optional[bool] = True
    include_adaptations: Optional[bool] = True

class InstructionStep(BaseModel):
    step: int
    instruction: str
    time: str
    equipment: List[str] = []

class SafetyInfo(BaseModel):
    validated: bool
    score: int
    warnings: List[str] = []
    modifications: List[str] = []

class AdaptationInfo(BaseModel):
    notes: List[str] = []
    portion_adapted: bool = False
    cooking_adapted: bool = False
    ingredients_adapted: bool = False

class RecipeIngredient(BaseModel):
    ingredient_id: Optional[Any] = None
    name: str
    amount: Optional[str] = None
    unit: Optional[str] = None
    category: Optional[str] = None
    notes: Optional[str] = None

class EnhancedRecipeRecommendation(BaseModel):
    id: str
    title: str
    image_url: Optional[str] = None
    category: Optional[str] = None
    cuisine: Optional[str] = None
    calories: Optional[str] = None
    protein: Optional[str] = None
    carbs: Optional[str] = None
    fat: Optional[str] = None
    fiber: Optional[str] = None
    sugar: Optional[str] = None
    sodium: Optional[str] = None
    servings: Optional[int] = None
    instructions: Optional[str] = None  # Original instructions
    structured_instructions: List[InstructionStep] = []  # Parsed steps
    ingredients: List[RecipeIngredient] = []
    recommendation_reason: str
    tags: List[str] = []
    
    # Enhanced fields
    safety_info: SafetyInfo
    adaptation_info: AdaptationInfo

class EnhancedRecommendationResponse(BaseModel):
    user_id: str
    recommendations: List[EnhancedRecipeRecommendation]
    filters_applied: Dict
    messages: List[str]
    generated_at: datetime
    total_adapted: int = 0
    total_safety_validated: int = 0

class FeedbackRequest(BaseModel):
    user_id: str
    recipe_id: str
    event_type: str  # 'like', 'dislike', 'save', 'hide', 'view'

class PersonalizeForCookingRequest(BaseModel):
    user_id: str
    recipe_id: str

class PersonalizedRecipeResponse(BaseModel):
    user_id: str
    recipe: Optional[Dict[str, Any]] = None
    user_profile_applied: Optional[Dict[str, Any]] = None
    messages: List[str] = []
    error: Optional[str] = None

class HealthCheckResponse(BaseModel):
    status: str
    timestamp: datetime
    service: str
    version: str
    agent_available: bool
    features: List[str]

# Meal Planner Request/Response models
class MealPlanChatMessage(BaseModel):
    role: str  # 'user', 'assistant', 'system'
    content: str

class UserHealthContext(BaseModel):
    allergies: Optional[List[str]] = []
    medicalConditions: Optional[List[str]] = []
    dietStyle: Optional[str] = 'balanced'
    healthGoals: Optional[List[str]] = []
    dailyCalorieGoal: Optional[int] = 2000
    cookingSkill: Optional[str] = 'beginner'
    fastingSchedule: Optional[str] = None
    mealsPerDay: Optional[int] = 3

class MealPlanChatRequest(BaseModel):
    user_id: str
    messages: List[MealPlanChatMessage]
    healthContext: UserHealthContext

class MealPlanGenerateRequest(BaseModel):
    user_id: str
    messages: List[MealPlanChatMessage]
    healthContext: UserHealthContext
    startDate: str  # YYYY-MM-DD format
    numberOfDays: Optional[int] = 7
    mealsPerDay: Optional[int] = 3
    fastingOption: Optional[str] = 'none'

class GeneratedMeal(BaseModel):
    plan_date: str
    meal_slot: str  # 'breakfast', 'lunch', 'dinner', 'snack', 'snack_am', 'snack_pm', 'snack_evening'
    recipe_id: Optional[str] = None
    recipe_title: str
    recipe_image: Optional[str] = None
    notes: Optional[str] = None
    servings: Optional[int] = 1
    calories: Optional[int] = None
    protein_g: Optional[int] = None
    carbs_g: Optional[int] = None
    fat_g: Optional[int] = None

class MealPlanGenerateResponse(BaseModel):
    meals: List[GeneratedMeal]
    summary: str
    error: Optional[str] = None


# DSPy Enhanced Meal Models (matching RecommendationCard interface)
class DSPyIngredient(BaseModel):
    name: str
    amount: str
    category: str

class DSPyNutrition(BaseModel):
    calories: int
    protein: int
    carbs: int
    fat: int

class DSPyMeal(BaseModel):
    """Complete meal matching RecommendationCard Recipe interface"""
    id: str
    name: str
    image: Optional[str] = None
    cookTime: str
    servings: int
    difficulty: str  # Easy, Medium, Hard
    rating: float = 4.5
    tags: List[str]
    description: str
    ingredients: List[DSPyIngredient]
    instructions: List[str]
    nutrition: DSPyNutrition
    # Meal plan specific fields
    meal_slot: str  # breakfast, lunch, dinner, snack
    plan_date: str  # YYYY-MM-DD

class DSPyMealPlanResponse(BaseModel):
    """Response with full recipe details for each meal"""
    meals: List[DSPyMeal]
    summary: str
    stats: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


# API Endpoints
@app.get("/health", response_model=HealthCheckResponse)
async def health_check():
    """Health check endpoint with feature list"""
    features = [
        "recipe_adaptation",
        "safety_validation", 
        "structured_instructions",
        "allergen_substitution",
        "portion_adjustment",
        "skill_level_adaptation"
    ]
    
    return HealthCheckResponse(
        status="healthy",
        timestamp=datetime.now(),
        service="enhanced-recommendation-api",
        version="2.0.0",
        agent_available=agent is not None,
        features=features
    )

@app.post("/api/recommendations", response_model=EnhancedRecommendationResponse)
async def get_recommendations(request: RecommendationRequest):
    """Get personalized recipe recommendations with safety validation and adaptation"""
    
    if not agent:
        raise HTTPException(status_code=503, detail="Recommendation service unavailable")
    
    try:
        # Get recommendations from the enhanced agent
        result = agent.get_recommendations(request.user_id)
        
        if result.get('error'):
            raise HTTPException(status_code=400, detail=result['error'])
        
        # Transform the response to match our enhanced API model
        recommendations = []
        total_adapted = 0
        total_safety_validated = 0
        
        for rec in result.get('recommendations', []):
            # Process ingredients
            ingredients = []
            for ing in rec.get('ingredients', []):
                if ing:  # Skip None/empty ingredients
                    ingredient = RecipeIngredient(
                        ingredient_id=ing.get('ingredient_id'),
                        name=ing.get('name', 'Unknown ingredient'),
                        amount=ing.get('amount'),
                        unit=ing.get('unit'),
                        category=ing.get('category'),
                        notes=ing.get('notes')
                    )
                    ingredients.append(ingredient)
            
            # Process structured instructions
            structured_instructions = []
            for step_data in rec.get('structured_instructions', []):
                if isinstance(step_data, dict):
                    step = InstructionStep(
                        step=step_data.get('step', 1),
                        instruction=step_data.get('instruction', ''),
                        time=step_data.get('time', 'varies'),
                        equipment=step_data.get('equipment', [])
                    )
                    structured_instructions.append(step)
            
            # Create safety info
            safety_info = SafetyInfo(
                validated=rec.get('safety_validated', False),
                score=rec.get('safety_score', 100),
                warnings=rec.get('safety_warnings', []),
                modifications=rec.get('safety_modifications', [])
            )
            
            if safety_info.validated:
                total_safety_validated += 1
            
            # Create adaptation info
            adaptation_info = AdaptationInfo(
                notes=rec.get('adaptation_notes', []),
                portion_adapted=rec.get('portion_adapted', False),
                cooking_adapted=rec.get('cooking_adapted', False),
                ingredients_adapted=rec.get('ingredients_adapted', False)
            )
            
            if any([adaptation_info.portion_adapted, adaptation_info.cooking_adapted, adaptation_info.ingredients_adapted]):
                total_adapted += 1
            
            # Create the enhanced recipe recommendation
            recipe_data = EnhancedRecipeRecommendation(
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
                structured_instructions=structured_instructions,
                ingredients=ingredients,
                recommendation_reason=rec.get('recommendation_reason', 'Matches your preferences'),
                tags=rec.get('tags', []) or [],
                safety_info=safety_info,
                adaptation_info=adaptation_info
            )
            recommendations.append(recipe_data)
        
        # Limit results as requested
        limited_recommendations = recommendations[:request.limit]
        
        return EnhancedRecommendationResponse(
            user_id=request.user_id,
            recommendations=limited_recommendations,
            filters_applied=result.get('filters_applied', {}),
            messages=result.get('messages', []),
            generated_at=datetime.now(),
            total_adapted=total_adapted,
            total_safety_validated=total_safety_validated
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
        'pass': 'view',
        'view': 'view',
        'cook_now': 'cook_now',
        'share_family': 'share_family'
    }

    event_type = event_mapping.get(request.event_type, request.event_type)

    # Validate event type
    valid_events = {'like', 'hide', 'save', 'view', 'cook_now', 'share_family'}
    if event_type not in valid_events:
        raise HTTPException(status_code=400, detail=f"Invalid event type. Must be one of: {valid_events}")

    try:
        success = agent.record_feedback(
            request.user_id,
            request.recipe_id,
            event_type
        )

        if not success:
            raise HTTPException(status_code=400, detail="Failed to record feedback")

        return {
            "success": True,
            "message": "Feedback recorded",
            "event_recorded": event_type
        }

    except Exception as e:
        print(f"Error recording feedback: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to record feedback: {str(e)}")

@app.post("/api/personalize-for-cooking", response_model=PersonalizedRecipeResponse)
async def personalize_for_cooking(request: PersonalizeForCookingRequest):
    """
    Personalize a recipe when user clicks 'Cook Now'
    This applies all personalization: safety validation, adaptations, substitutions
    """

    if not agent:
        raise HTTPException(status_code=503, detail="Recommendation service unavailable")

    try:
        result = agent.personalize_for_cooking(request.user_id, request.recipe_id)

        if result.get('error'):
            raise HTTPException(status_code=400, detail=result['error'])

        return PersonalizedRecipeResponse(
            user_id=request.user_id,
            recipe=result.get('recipe'),
            user_profile_applied=result.get('user_profile_applied'),
            messages=result.get('messages', [])
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error personalizing recipe: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to personalize recipe: {str(e)}")

@app.get("/api/recommendations/{user_id}/history")
async def get_recommendation_history(user_id: str, limit: int = 50):
    """Get user's recommendation history"""
    
    if not agent:
        raise HTTPException(status_code=503, detail="Recommendation service unavailable")
    
    try:
        # This would need to be implemented in the agent
        # For now, return empty history with helpful message
        return {
            "user_id": user_id,
            "history": [],
            "message": "History endpoint not yet implemented",
            "note": "Check recipe_events table for user interaction history"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/user/{user_id}/safety-profile")
async def get_user_safety_profile(user_id: str):
    """Get user's safety profile for debugging"""
    
    if not agent:
        raise HTTPException(status_code=503, detail="Recommendation service unavailable")
    
    try:
        # This could be extracted from the agent's user profile loading
        return {
            "user_id": user_id,
            "message": "Safety profile endpoint for debugging",
            "note": "This would show user's allergies, medical conditions, and safety constraints"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/recipe/{recipe_id}/safety-analysis")
async def analyze_recipe_safety(recipe_id: str, user_id: Optional[str] = None):
    """Analyze safety of a specific recipe"""
    
    if not agent:
        raise HTTPException(status_code=503, detail="Recommendation service unavailable")
    
    try:
        # This would require implementing a specific safety analysis endpoint
        return {
            "recipe_id": recipe_id,
            "user_id": user_id,
            "message": "Recipe safety analysis endpoint",
            "note": "This would provide detailed safety analysis for a specific recipe"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/adaptations/options")
async def get_adaptation_options():
    """Get available adaptation options"""

    return {
        "allergen_substitutions": {
            "milk": ["almond milk", "oat milk", "coconut milk"],
            "eggs": ["flax egg", "applesauce", "mashed banana"],
            "wheat": ["rice flour", "almond flour", "gluten-free flour"],
            "nuts": ["sunflower seeds", "pumpkin seeds"]
        },
        "cooking_skill_levels": ["beginner", "intermediate", "advanced"],
        "diet_styles": ["balanced", "vegetarian", "vegan", "mediterranean", "low-carb"],
        "portion_adjustment_range": "50% to 150% of original",
        "safety_validations": [
            "allergen_detection",
            "medical_condition_compatibility",
            "nutritional_bounds_checking",
            "ingredient_safety_validation"
        ]
    }

# ============ Meal Planner Endpoints ============

@app.post("/api/meal-plans/ai-chat")
async def meal_plan_chat(request: MealPlanChatRequest):
    """
    Chat with the meal planning AI assistant.
    The assistant helps users plan their meals based on preferences.
    """
    if not meal_planner:
        raise HTTPException(status_code=503, detail="Meal planner service unavailable")

    try:
        # Convert messages to the format expected by the agent
        messages = [{"role": msg.role, "content": msg.content} for msg in request.messages]

        # Convert health context to dict
        health_context = {
            "allergies": request.healthContext.allergies,
            "medicalConditions": request.healthContext.medicalConditions,
            "dietStyle": request.healthContext.dietStyle,
            "healthGoals": request.healthContext.healthGoals,
            "dailyCalorieGoal": request.healthContext.dailyCalorieGoal,
            "cookingSkill": request.healthContext.cookingSkill
        }

        # Call the meal planner agent
        response = meal_planner.chat(
            user_id=request.user_id,
            messages=messages,
            health_context=health_context
        )

        return {"content": response}

    except Exception as e:
        print(f"Error in meal plan chat: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")

@app.post("/api/meal-plans/ai-generate", response_model=MealPlanGenerateResponse)
async def generate_meal_plan(request: MealPlanGenerateRequest):
    """
    Generate a complete meal plan based on conversation and user profile.
    This creates a weekly meal plan and saves it to the database.
    """
    if not meal_planner:
        raise HTTPException(status_code=503, detail="Meal planner service unavailable")

    try:
        # Convert messages to the format expected by the agent
        messages = [{"role": msg.role, "content": msg.content} for msg in request.messages]

        # Convert health context to dict
        health_context = {
            "allergies": request.healthContext.allergies,
            "medicalConditions": request.healthContext.medicalConditions,
            "dietStyle": request.healthContext.dietStyle,
            "healthGoals": request.healthContext.healthGoals,
            "dailyCalorieGoal": request.healthContext.dailyCalorieGoal,
            "cookingSkill": request.healthContext.cookingSkill
        }

        # Generate the meal plan
        result = meal_planner.generate_meal_plan(
            user_id=request.user_id,
            messages=messages,
            health_context=health_context,
            start_date=request.startDate,
            number_of_days=request.numberOfDays
        )

        if result.get('error'):
            return MealPlanGenerateResponse(
                meals=[],
                summary=result.get('summary', 'Error generating meal plan'),
                error=result.get('error')
            )

        # Save the meal plan to database
        meals = result.get('meals', [])
        if meals:
            save_success = meal_planner.save_meal_plan(request.user_id, meals)
            if not save_success:
                print("Warning: Failed to save meal plan to database")

        # Convert meals to response format
        generated_meals = []
        for meal in meals:
            generated_meals.append(GeneratedMeal(
                plan_date=meal.get('plan_date'),
                meal_slot=meal.get('meal_slot'),
                recipe_id=meal.get('recipe_id'),
                recipe_title=meal.get('recipe_title', 'Unknown'),
                recipe_image=meal.get('recipe_image'),
                notes=meal.get('notes'),
                servings=meal.get('servings', 1),
                calories=meal.get('calories'),
                protein_g=meal.get('protein_g'),
                carbs_g=meal.get('carbs_g'),
                fat_g=meal.get('fat_g')
            ))

        return MealPlanGenerateResponse(
            meals=generated_meals,
            summary=result.get('summary', f'Created a {request.numberOfDays}-day meal plan')
        )

    except Exception as e:
        print(f"Error generating meal plan: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to generate meal plan: {str(e)}")


@app.post("/api/meal-plans/dspy-generate", response_model=DSPyMealPlanResponse)
async def generate_dspy_meal_plan(request: MealPlanGenerateRequest):
    """
    Generate a complete meal plan using DSPy with full recipe details.
    Returns meals with ingredients, instructions, and accurate nutrition.
    This is the enhanced version that matches the RecommendationCard format.
    """
    if not dspy_meal_planner:
        raise HTTPException(status_code=503, detail="DSPy meal planner service unavailable")

    try:
        # Convert messages to the format expected by the service
        messages = [{"role": msg.role, "content": msg.content} for msg in request.messages]
        
        # Get fasting and meals per day settings
        fasting_option = request.fastingOption or 'none'
        meals_per_day = request.mealsPerDay or request.healthContext.mealsPerDay or 3
        
        print(f"🍽️ DSPy Generation settings: {meals_per_day} meals/day, fasting: {fasting_option}")

        # Convert health context to dict including fasting info
        health_context = {
            "allergies": request.healthContext.allergies,
            "medicalConditions": request.healthContext.medicalConditions,
            "dietStyle": request.healthContext.dietStyle,
            "healthGoals": request.healthContext.healthGoals,
            "dailyCalorieGoal": request.healthContext.dailyCalorieGoal,
            "cookingSkill": request.healthContext.cookingSkill,
            "fastingSchedule": fasting_option if fasting_option != 'none' else None,
            "mealsPerDay": meals_per_day
        }

        # Generate the meal plan with DSPy
        result = dspy_meal_planner.generate_meal_plan(
            user_id=request.user_id,
            messages=messages,
            health_context=health_context,
            start_date=request.startDate,
            number_of_days=request.numberOfDays,
            meals_per_day=meals_per_day,
            fasting_option=fasting_option
        )

        if result.get('error'):
            return DSPyMealPlanResponse(
                meals=[],
                summary=result.get('summary', 'Error generating meal plan'),
                error=result.get('error')
            )

        # Convert meals to response format matching RecommendationCard
        dspy_meals = []
        for meal in result.get('meals', []):
            # Process ingredients
            ingredients = []
            for ing in meal.get('ingredients', []):
                if isinstance(ing, dict):
                    ingredients.append(DSPyIngredient(
                        name=ing.get('name', ''),
                        amount=ing.get('amount', ''),
                        category=ing.get('category', 'Other')
                    ))

            # Process nutrition
            nutrition_data = meal.get('nutrition', {})
            nutrition = DSPyNutrition(
                calories=nutrition_data.get('calories', 400),
                protein=nutrition_data.get('protein', 25),
                carbs=nutrition_data.get('carbs', 40),
                fat=nutrition_data.get('fat', 15)
            )

            dspy_meals.append(DSPyMeal(
                id=meal.get('id', ''),
                name=meal.get('name', 'Delicious Meal'),
                image=meal.get('image'),
                cookTime=meal.get('cookTime', '30 mins'),
                servings=meal.get('servings', 1),
                difficulty=meal.get('difficulty', 'Easy'),
                rating=4.5,
                tags=meal.get('tags', []),
                description=meal.get('description', ''),
                ingredients=ingredients,
                instructions=meal.get('instructions', []),
                nutrition=nutrition,
                meal_slot=meal.get('meal_slot', 'lunch'),
                plan_date=meal.get('plan_date', '')
            ))

        return DSPyMealPlanResponse(
            meals=dspy_meals,
            summary=result.get('summary', f'Created a {request.numberOfDays}-day meal plan'),
            stats=result.get('stats')
        )

    except Exception as e:
        print(f"Error generating DSPy meal plan: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to generate meal plan: {str(e)}")


@app.post("/api/meal-plans/dspy-single-meal")
async def generate_single_dspy_meal(
    meal_slot: str,
    plan_date: str,
    healthContext: UserHealthContext,
    context: Optional[str] = ""
):
    """
    Generate a single meal using DSPy (useful for replacing a meal).
    """
    if not dspy_meal_planner:
        raise HTTPException(status_code=503, detail="DSPy meal planner service unavailable")

    try:
        health_context = {
            "allergies": healthContext.allergies,
            "medicalConditions": healthContext.medicalConditions,
            "dietStyle": healthContext.dietStyle,
            "healthGoals": healthContext.healthGoals,
            "dailyCalorieGoal": healthContext.dailyCalorieGoal,
            "cookingSkill": healthContext.cookingSkill
        }

        meal = dspy_meal_planner.generate_single_meal(
            health_context=health_context,
            meal_slot=meal_slot,
            plan_date=plan_date,
            context=context
        )

        return meal

    except Exception as e:
        print(f"Error generating single meal: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate meal: {str(e)}")


class PersonalizedRecipeRequest(BaseModel):
    healthContext: UserHealthContext
    meal_type: Optional[str] = "dinner"
    preferences: Optional[str] = ""
    count: Optional[int] = 1

class PersonalizedRecipeItem(BaseModel):
    id: str
    name: str
    description: str
    servings: int
    tags: List[str]
    ingredients: List[DSPyIngredient]
    instructions: List[str]
    nutrition: DSPyNutrition
    personalization_notes: str

class PersonalizedRecipeApiResponse(BaseModel):
    success: bool
    recipes: List[PersonalizedRecipeItem]
    error: Optional[str] = None


@app.post("/api/recipes/personalized", response_model=PersonalizedRecipeApiResponse)
async def generate_personalized_recipes(request: PersonalizedRecipeRequest):
    """
    Generate personalized recipes based on user profile and preferences.
    Routes through HostAgent for consistent orchestration.
    """
    try:
        health_context = {
            "allergies": request.healthContext.allergies,
            "medicalConditions": request.healthContext.medicalConditions,
            "dietStyle": request.healthContext.dietStyle,
            "healthGoals": request.healthContext.healthGoals,
            "dailyCalorieGoal": request.healthContext.dailyCalorieGoal,
            "cookingSkill": request.healthContext.cookingSkill
        }
        
        payload = {
            "health_context": health_context,
            "meal_type": request.meal_type,
            "preferences": request.preferences,
            "count": request.count
        }
        
        result = await host_agent.host_agent.route_request(
            user_id="api_user",
            request_type="recipe",
            payload=payload
        )
        
        if not result.get("success"):
            return PersonalizedRecipeApiResponse(
                success=False,
                recipes=[],
                error=result.get("error", "Unknown error")
            )
        
        data = result.get("data")
        recipe_items = []
        
        recipes_data = data if isinstance(data, list) else [data]
        
        for r in recipes_data:
            ingredients = []
            for ing in r.get('ingredients', []):
                if isinstance(ing, dict):
                    ingredients.append(DSPyIngredient(
                        name=ing.get('name', ''),
                        amount=ing.get('amount', ''),
                        category=ing.get('category', 'Other')
                    ))
            
            nutrition_data = r.get('nutrition', {})
            recipe_items.append(PersonalizedRecipeItem(
                id=r.get('id', ''),
                name=r.get('name', 'Recipe'),
                description=r.get('description', ''),
                servings=r.get('servings', 1),
                tags=r.get('tags', []),
                ingredients=ingredients,
                instructions=r.get('instructions', []),
                nutrition=DSPyNutrition(
                    calories=nutrition_data.get('calories', 400),
                    protein=nutrition_data.get('protein', 25),
                    carbs=nutrition_data.get('carbs', 40),
                    fat=nutrition_data.get('fat', 15)
                ),
                personalization_notes=r.get('personalization_notes', '')
            ))
        
        return PersonalizedRecipeApiResponse(
            success=True,
            recipes=recipe_items
        )
        
    except Exception as e:
        print(f"Error generating personalized recipes: {str(e)}")
        import traceback
        traceback.print_exc()
        return PersonalizedRecipeApiResponse(
            success=False,
            recipes=[],
            error=str(e)
        )


class NutritionGoalsRequest(BaseModel):
    """Request model for calculating personalized nutrition goals"""
    user_id: str
    age: Optional[int] = 30
    sex: Optional[str] = "female"
    weight_kg: Optional[float] = None
    weight: Optional[float] = 70.0  # Alias for weight_kg
    height_cm: Optional[float] = None
    height: Optional[float] = 165.0  # Alias for height_cm
    activity_level: Optional[str] = "moderate"
    health_goal: Optional[str] = "maintain"
    goal: Optional[str] = None  # Alias for health_goal
    diet_style: Optional[str] = "balanced"


@app.post("/api/nutrition/calculate-goals")
async def calculate_user_nutrition_goals(request: NutritionGoalsRequest):
    """
    Calculate personalized daily nutrition goals based on user profile.
    
    Uses Mifflin-St Jeor equation for BMR and adjusts macros based on:
    - Health goal (weight loss, muscle gain, maintain, etc.)
    - Activity level (sedentary to very active)
    - Diet style (balanced, keto, high-protein, etc.)
    
    Returns:
        Personalized daily targets for calories, protein, carbs, fat, fiber, and water.
    """
    try:
        profile_data = {
            "age": request.age,
            "sex": request.sex,
            "weight_kg": request.weight_kg or request.weight,
            "height_cm": request.height_cm or request.height,
            "activity_level": request.activity_level,
            "health_goal": request.health_goal or request.goal or "maintain",
            "diet_style": request.diet_style
        }
        
        goals = calculate_nutrition_goals(profile_data)
        
        return {
            "success": True,
            "user_id": request.user_id,
            "goals": goals,
            "message": "Nutrition goals calculated successfully based on your profile"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate nutrition goals: {str(e)}")


@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "service": "WellNoosh Enhanced Recommendation API",
        "version": "3.0.0",
        "features": [
            "Personalized recipe recommendations",
            "Safety validation for medical conditions and allergies",
            "Recipe adaptation based on user constraints",
            "Structured instruction parsing",
            "Portion size adjustment",
            "Cooking skill level adaptation",
            "Ingredient substitution suggestions",
            "AI-powered meal planning chat",
            "Automated weekly meal plan generation",
            "Personalized nutrition goals calculation"
        ],
        "endpoints": {
            "health": "/health",
            "recommendations": "/api/recommendations",
            "feedback": "/api/feedback",
            "personalize_for_cooking": "/api/personalize-for-cooking",
            "meal_plan_chat": "/api/meal-plans/ai-chat",
            "meal_plan_generate": "/api/meal-plans/ai-generate",
            "dspy_meal_plan": "/api/meal-plans/dspy-generate (enhanced with full recipes)",
            "dspy_single_meal": "/api/meal-plans/dspy-single-meal",
            "personalized_recipes": "/api/recipes/personalized",
            "nutrition_goals": "/api/nutrition/calculate-goals",
            "history": "/api/recommendations/{user_id}/history",
            "safety_profile": "/api/user/{user_id}/safety-profile",
            "recipe_analysis": "/api/recipe/{recipe_id}/safety-analysis",
            "adaptation_options": "/api/adaptations/options"
        }
    }

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")

    print(f"Starting LangGraph Recommendation API server on {host}:{port}")
    print("LangGraph workflow features:")
    print("  - State-based recipe processing pipeline")
    print("  - Conditional routing for safety validation")
    print("  - LLM-powered recipe adaptation")
    print("  - Structured instruction parsing")
    print("  - Enhanced allergen and medical condition handling")

    uvicorn.run(app, host=host, port=port)