"""
Host Agent - The Master Orchestrator
Routes user requests to the appropriate specialized agent and coordinates responses.
"""

import os
from typing import Dict, List, Any, Optional
from enum import Enum
from dotenv import load_dotenv

load_dotenv()


class AgentType(Enum):
    """Types of specialized agents available"""
    MEAL_PLANNER = "meal_planner"
    RECIPE_RECOMMENDATION = "recipe_recommendation"
    NUTRITION_ANALYSIS = "nutrition_analysis"
    HEALTH_TRACKING = "health_tracking"
    UNKNOWN = "unknown"


class HostAgent:
    """
    Host Agent - Orchestrates all specialized AI agents.
    
    The Host Agent receives user requests, determines which specialized agent
    should handle the request, and coordinates the response.
    
    Currently Available Agents:
    - Meal Planner Agent: Generates personalized meal plans
    - Recipe Recommendation Agent: Suggests recipes based on preferences
    
    Future Agents (planned):
    - Nutrition Analysis Agent: Analyzes nutritional content
    - Health Tracking Agent: Tracks and analyzes health metrics
    - Grocery List Agent: Manages shopping lists
    """

    def __init__(self):
        self._agents = {}
        self._initialize_agents()
        print("HostAgent initialized - orchestrating all specialized agents")

    def _initialize_agents(self):
        """Initialize all specialized agents"""
        try:
            from .meal_planner import dspy_meal_planner
            self._agents[AgentType.MEAL_PLANNER] = dspy_meal_planner
            print("  - Meal Planner Agent: Ready")
        except Exception as e:
            print(f"  - Meal Planner Agent: Failed to load ({e})")
        
        try:
            from .recipe_recommendation import personalized_recipe_agent
            self._agents[AgentType.RECIPE_RECOMMENDATION] = personalized_recipe_agent
            print("  - Recipe Recommendation Agent: Ready")
        except Exception as e:
            print(f"  - Recipe Recommendation Agent: Failed to load ({e})")

    def get_agent(self, agent_type: AgentType) -> Any:
        """Get a specific agent by type"""
        return self._agents.get(agent_type)

    def classify_request(self, user_message: str) -> AgentType:
        """
        Classify user request to determine which agent should handle it.
        
        In the future, this could use an LLM for more sophisticated routing.
        For now, uses keyword-based classification.
        """
        message_lower = user_message.lower()
        
        meal_keywords = [
            'meal plan', 'weekly plan', 'plan my meals', 'what should i eat',
            'breakfast', 'lunch', 'dinner', 'snack', 'generate meals',
            'create a plan', 'meal prep', 'week of meals'
        ]
        
        recipe_keywords = [
            'recipe', 'cook', 'how to make', 'ingredient', 'dish',
            'recommend a', 'suggest a', 'what can i cook'
        ]
        
        nutrition_keywords = [
            'calories', 'protein', 'carbs', 'fat', 'nutrition',
            'macros', 'healthy', 'diet analysis'
        ]
        
        for keyword in meal_keywords:
            if keyword in message_lower:
                return AgentType.MEAL_PLANNER
        
        for keyword in recipe_keywords:
            if keyword in message_lower:
                return AgentType.RECIPE_RECOMMENDATION
        
        for keyword in nutrition_keywords:
            if keyword in message_lower:
                return AgentType.NUTRITION_ANALYSIS
        
        return AgentType.UNKNOWN

    async def route_request(
        self,
        user_id: str,
        request_type: str,
        payload: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Route a request to the appropriate agent.
        
        Args:
            user_id: The user making the request
            request_type: Explicit type of request (meal_plan, recipe, etc.)
            payload: Request-specific data
            
        Returns:
            Response from the specialized agent
        """
        if request_type == "meal_plan":
            return await self._handle_meal_plan_request(user_id, payload)
        elif request_type == "recipe":
            return await self._handle_recipe_request(user_id, payload)
        else:
            return {
                "success": False,
                "error": f"Unknown request type: {request_type}",
                "available_types": ["meal_plan", "recipe"]
            }

    async def _handle_meal_plan_request(
        self,
        user_id: str,
        payload: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Handle meal plan generation requests"""
        agent = self.get_agent(AgentType.MEAL_PLANNER)
        if not agent:
            return {
                "success": False,
                "error": "Meal Planner Agent not available"
            }
        
        try:
            result = agent.generate_meal_plan(
                user_id=user_id,
                messages=payload.get('messages', []),
                health_context=payload.get('health_context', {}),
                start_date=payload.get('start_date'),
                number_of_days=payload.get('number_of_days', 7)
            )
            return {
                "success": True,
                "agent": "meal_planner",
                "data": result
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "agent": "meal_planner"
            }

    async def _handle_recipe_request(
        self,
        user_id: str,
        payload: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Handle recipe recommendation requests"""
        agent = self.get_agent(AgentType.RECIPE_RECOMMENDATION)
        if not agent:
            return {
                "success": False,
                "error": "Recipe Recommendation Agent not available",
                "agent": "recipe_recommendation"
            }
        
        try:
            health_context = payload.get('health_context', {})
            meal_type = payload.get('meal_type', 'dinner')
            preferences = payload.get('preferences', '')
            count = payload.get('count', 1)
            
            if count > 1:
                recipes = agent.generate_multiple_recipes(health_context, count)
                return {
                    "success": True,
                    "agent": "recipe_recommendation",
                    "data": [r.model_dump() for r in recipes]
                }
            else:
                recipe = agent.generate_recipe(health_context, meal_type, preferences)
                return {
                    "success": True,
                    "agent": "recipe_recommendation",
                    "data": recipe.model_dump()
                }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "agent": "recipe_recommendation"
            }

    def get_available_agents(self) -> List[str]:
        """Get list of available agents"""
        return [agent_type.value for agent_type in self._agents.keys()]

    def get_agent_status(self) -> Dict[str, str]:
        """Get status of all agents"""
        all_agents = [
            AgentType.MEAL_PLANNER,
            AgentType.RECIPE_RECOMMENDATION,
            AgentType.NUTRITION_ANALYSIS,
            AgentType.HEALTH_TRACKING
        ]
        
        status = {}
        for agent_type in all_agents:
            if agent_type in self._agents:
                status[agent_type.value] = "active"
            else:
                status[agent_type.value] = "not_implemented"
        
        return status


host_agent = HostAgent()
