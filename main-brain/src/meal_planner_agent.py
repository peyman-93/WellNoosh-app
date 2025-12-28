"""
Meal Planner AI Agent
Creates personalized weekly meal plans based on user profile and preferences
"""

import os
import json
import re
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from dotenv import load_dotenv

import psycopg2
from psycopg2.extras import RealDictCursor

from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage

# Load environment variables
load_dotenv()

# Database configuration
DB_CONFIG = {
    'host': os.getenv('SUPABASE_HOST'),
    'port': os.getenv('SUPABASE_PORT', '5432'),
    'database': os.getenv('SUPABASE_DB', 'postgres'),
    'user': os.getenv('SUPABASE_USER', 'postgres'),
    'password': os.getenv('SUPABASE_PASSWORD')
}


def get_llm(provider: str = None):
    """Get the configured LLM instance"""
    provider = provider or os.getenv('LLM_PROVIDER', 'openai').lower()

    if provider == 'gemini':
        api_key = os.getenv('GOOGLE_API_KEY')
        if not api_key:
            raise ValueError("GOOGLE_API_KEY not set")
        return ChatGoogleGenerativeAI(
            model="gemini-1.5-flash",
            google_api_key=api_key,
            temperature=0.7
        )
    else:
        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key:
            raise ValueError("OPENAI_API_KEY not set")
        return ChatOpenAI(
            model="gpt-4o-mini",
            api_key=api_key,
            temperature=0.7
        )


class MealPlannerAgent:
    """AI Agent for creating personalized meal plans"""

    def __init__(self, llm_provider: str = None):
        self.llm_provider = llm_provider or os.getenv('LLM_PROVIDER', 'openai').lower()
        try:
            self.llm = get_llm(self.llm_provider)
            print(f"MealPlannerAgent initialized with {self.llm_provider}")
        except Exception as e:
            print(f"Warning: LLM initialization issue: {e}")
            self.llm = None

    def get_user_profile(self, user_id: str) -> Optional[Dict]:
        """Load user profile from database"""
        try:
            conn = psycopg2.connect(**DB_CONFIG)
            cur = conn.cursor(cursor_factory=RealDictCursor)

            cur.execute("""
                SELECT
                    up.user_id, up.full_name,
                    uhp.cooking_skill, uhp.diet_style,
                    uhp.allergies, uhp.medical_conditions,
                    uhp.health_goals, uhp.daily_calorie_goal
                FROM user_profiles up
                LEFT JOIN user_health_profiles uhp ON up.user_id = uhp.user_id
                WHERE up.user_id = %s
            """, (user_id,))

            profile = cur.fetchone()
            cur.close()
            conn.close()

            return dict(profile) if profile else None
        except Exception as e:
            print(f"Error loading user profile: {e}")
            return None

    def get_available_recipes(self, filters: Dict = None, limit: int = 50) -> List[Dict]:
        """Get recipes from database with optional filtering"""
        try:
            conn = psycopg2.connect(**DB_CONFIG)
            cur = conn.cursor(cursor_factory=RealDictCursor)

            query = """
                SELECT
                    r.id, r.title, r.category, r.area as cuisine,
                    r.image_url, r.servings,
                    COALESCE(rn.per_serving->>'kcal', '400') as calories,
                    COALESCE(rn.per_serving->>'protein_g', '20') as protein,
                    COALESCE(rn.per_serving->>'carbs_g', '40') as carbs,
                    COALESCE(rn.per_serving->>'fat_g', '15') as fat
                FROM recipes r
                LEFT JOIN recipe_nutrients rn ON r.id = rn.recipe_id
                WHERE r.instructions IS NOT NULL
                ORDER BY RANDOM()
                LIMIT %s
            """

            cur.execute(query, (limit,))
            recipes = cur.fetchall()
            cur.close()
            conn.close()

            return [dict(r) for r in recipes]
        except Exception as e:
            print(f"Error fetching recipes: {e}")
            return []

    def chat(self, user_id: str, messages: List[Dict], health_context: Dict) -> str:
        """Handle conversational chat about meal planning"""
        if not self.llm:
            return "I'm sorry, the AI service is currently unavailable. Please try again later."

        # Build context from health profile
        allergies = health_context.get('allergies', []) or []
        diet_style = health_context.get('dietStyle', 'balanced')
        health_goals = health_context.get('healthGoals', []) or []
        calorie_goal = health_context.get('dailyCalorieGoal', 2000)
        cooking_skill = health_context.get('cookingSkill', 'beginner')

        system_prompt = f"""You are a friendly and knowledgeable meal planning assistant.
Your role is to help users plan their meals for the week based on their preferences and health needs.

USER PROFILE:
- Diet Style: {diet_style}
- Allergies: {', '.join(allergies) if allergies else 'None'}
- Health Goals: {', '.join(health_goals) if health_goals else 'General wellness'}
- Daily Calorie Target: {calorie_goal} calories
- Cooking Skill: {cooking_skill}

GUIDELINES:
- Be conversational and helpful
- Ask clarifying questions if needed (e.g., "Do you prefer quick meals or are you okay with longer cooking times?")
- Consider their allergies and dietary restrictions in all suggestions
- When they're ready to generate a plan, let them know they can click "Generate Plan"
- Keep responses concise but informative"""

        # Convert messages to LangChain format
        langchain_messages = [SystemMessage(content=system_prompt)]
        for msg in messages:
            if msg['role'] == 'user':
                langchain_messages.append(HumanMessage(content=msg['content']))

        try:
            response = self.llm.invoke(langchain_messages)
            return response.content
        except Exception as e:
            print(f"Chat error: {e}")
            return "I encountered an error. Please try again."

    def generate_meal_plan(
        self,
        user_id: str,
        messages: List[Dict],
        health_context: Dict,
        start_date: str,
        number_of_days: int = 7
    ) -> Dict:
        """Generate a complete meal plan based on conversation and user profile"""

        if not self.llm:
            return {
                'meals': [],
                'summary': 'AI service unavailable. Please try again later.',
                'error': 'LLM not initialized'
            }

        print(f"\n{'='*60}")
        print(f"Generating Meal Plan")
        print(f"{'='*60}")
        print(f"User: {user_id}, Days: {number_of_days}, Start: {start_date}")

        # Get user profile from database for complete info
        db_profile = self.get_user_profile(user_id)

        # Merge with provided health context
        allergies = health_context.get('allergies', []) or (db_profile.get('allergies', []) if db_profile else [])
        diet_style = health_context.get('dietStyle') or (db_profile.get('diet_style', 'balanced') if db_profile else 'balanced')
        health_goals = health_context.get('healthGoals', []) or (db_profile.get('health_goals', []) if db_profile else [])
        calorie_goal = health_context.get('dailyCalorieGoal') or (db_profile.get('daily_calorie_goal', 2000) if db_profile else 2000)
        cooking_skill = health_context.get('cookingSkill') or (db_profile.get('cooking_skill', 'beginner') if db_profile else 'beginner')
        medical_conditions = health_context.get('medicalConditions', []) or (db_profile.get('medical_conditions', []) if db_profile else [])

        # Get available recipes
        recipes = self.get_available_recipes(limit=60)

        if not recipes:
            return {
                'meals': [],
                'summary': 'No recipes available in the database.',
                'error': 'No recipes found'
            }

        # Build recipe list for LLM
        recipe_list = []
        for r in recipes:
            recipe_list.append(
                f"- ID:{r['id']} | {r['title']} | {r['category']} | {r['calories']}cal | {r['protein']}g protein"
            )
        recipes_text = '\n'.join(recipe_list[:40])  # Limit to avoid token overflow

        # Extract user preferences from conversation
        conversation_context = ""
        for msg in messages:
            if msg['role'] == 'user':
                conversation_context += f"User said: {msg['content']}\n"

        # Generate dates for the plan
        start = datetime.strptime(start_date, '%Y-%m-%d')
        dates = [(start + timedelta(days=i)).strftime('%Y-%m-%d') for i in range(number_of_days)]

        prompt = f"""You are a professional meal planner. Create a {number_of_days}-day meal plan.

USER PROFILE:
- Allergies: {', '.join(allergies) if allergies else 'None'}
- Medical Conditions: {', '.join(medical_conditions) if medical_conditions else 'None'}
- Diet Style: {diet_style}
- Health Goals: {', '.join(health_goals) if health_goals else 'General wellness'}
- Daily Calorie Target: {calorie_goal} calories
- Cooking Skill: {cooking_skill}

USER'S REQUEST:
{conversation_context if conversation_context else 'Create a balanced weekly meal plan'}

AVAILABLE RECIPES (select from these):
{recipes_text}

DATES TO PLAN:
{', '.join(dates)}

RULES:
1. Select recipes that match the user's dietary needs and allergies
2. Distribute calories across meals (breakfast ~25%, lunch ~35%, dinner ~35%, snack ~5%)
3. Vary the meals - don't repeat the same recipe too often
4. For "{diet_style}" diet, ensure all meals comply
5. Consider cooking skill - {cooking_skill} level means {'simple recipes' if cooking_skill == 'beginner' else 'can handle complex recipes'}
6. If user mentioned specific preferences (light meals, quick meals, etc.), prioritize those

Return ONLY a valid JSON object with this structure:
{{
    "meals": [
        {{
            "plan_date": "YYYY-MM-DD",
            "meal_slot": "breakfast|lunch|dinner|snack",
            "recipe_id": "uuid from the list above",
            "recipe_title": "exact title from list",
            "notes": "brief note about why this meal fits"
        }}
    ],
    "summary": "2-3 sentence summary of the meal plan and how it meets user's goals"
}}

Create 3-4 meals per day (breakfast, lunch, dinner, and optionally snack).
Use ONLY recipe IDs from the provided list."""

        try:
            response = self.llm.invoke([HumanMessage(content=prompt)])
            response_text = response.content

            # Parse JSON response
            json_match = re.search(r'\{[\s\S]*\}', response_text)
            if json_match:
                result = json.loads(json_match.group())

                # Enrich meals with recipe details
                recipe_map = {str(r['id']): r for r in recipes}
                enriched_meals = []

                for meal in result.get('meals', []):
                    recipe_id = meal.get('recipe_id')
                    recipe = recipe_map.get(recipe_id)

                    if recipe:
                        enriched_meals.append({
                            'plan_date': meal.get('plan_date'),
                            'meal_slot': meal.get('meal_slot'),
                            'recipe_id': recipe_id,
                            'recipe_title': recipe.get('title'),
                            'recipe_image': recipe.get('image_url'),
                            'notes': meal.get('notes', ''),
                            'servings': 1,
                            'calories': int(recipe.get('calories', 0)),
                            'protein_g': int(recipe.get('protein', 0)),
                            'carbs_g': int(recipe.get('carbs', 0)),
                            'fat_g': int(recipe.get('fat', 0))
                        })
                    else:
                        # Recipe not found, use provided info
                        enriched_meals.append({
                            'plan_date': meal.get('plan_date'),
                            'meal_slot': meal.get('meal_slot'),
                            'recipe_id': recipe_id,
                            'recipe_title': meal.get('recipe_title', 'Custom Meal'),
                            'notes': meal.get('notes', ''),
                            'servings': 1
                        })

                print(f"  Generated {len(enriched_meals)} meals for {number_of_days} days")

                return {
                    'meals': enriched_meals,
                    'summary': result.get('summary', f'Created a {number_of_days}-day meal plan tailored to your preferences.')
                }
            else:
                return {
                    'meals': [],
                    'summary': 'Failed to generate meal plan. Please try again.',
                    'error': 'JSON parse error'
                }

        except Exception as e:
            print(f"Error generating meal plan: {e}")
            import traceback
            traceback.print_exc()
            return {
                'meals': [],
                'summary': f'Error generating meal plan: {str(e)}',
                'error': str(e)
            }

    def save_meal_plan(self, user_id: str, meals: List[Dict]) -> bool:
        """Save generated meal plan to database"""
        try:
            conn = psycopg2.connect(**DB_CONFIG)
            cur = conn.cursor()

            for meal in meals:
                cur.execute("""
                    INSERT INTO meal_plans (
                        user_id, plan_date, meal_slot, recipe_id, recipe_title,
                        recipe_image, notes, servings, calories, protein_g, carbs_g, fat_g
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (user_id, plan_date, meal_slot)
                    DO UPDATE SET
                        recipe_id = EXCLUDED.recipe_id,
                        recipe_title = EXCLUDED.recipe_title,
                        recipe_image = EXCLUDED.recipe_image,
                        notes = EXCLUDED.notes,
                        servings = EXCLUDED.servings,
                        calories = EXCLUDED.calories,
                        protein_g = EXCLUDED.protein_g,
                        carbs_g = EXCLUDED.carbs_g,
                        fat_g = EXCLUDED.fat_g,
                        updated_at = NOW()
                """, (
                    user_id,
                    meal.get('plan_date'),
                    meal.get('meal_slot'),
                    meal.get('recipe_id'),
                    meal.get('recipe_title'),
                    meal.get('recipe_image'),
                    meal.get('notes'),
                    meal.get('servings', 1),
                    meal.get('calories'),
                    meal.get('protein_g'),
                    meal.get('carbs_g'),
                    meal.get('fat_g')
                ))

            conn.commit()
            cur.close()
            conn.close()

            print(f"  Saved {len(meals)} meals to database")
            return True

        except Exception as e:
            print(f"Error saving meal plan: {e}")
            return False


# Create singleton instance
meal_planner_agent = MealPlannerAgent()
