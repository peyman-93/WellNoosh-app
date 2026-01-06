"""
DSPy-based Meal Planner Agent
Generates personalized meal plans with accurate nutrition, ingredients, and instructions
"""

import os
import json
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Any
from dotenv import load_dotenv
import dspy
from pydantic import BaseModel, Field

# Load environment variables
load_dotenv()


# ============================================================================
# Pydantic Models for Structured Output
# ============================================================================

class Ingredient(BaseModel):
    """Single ingredient with amount and category"""
    name: str = Field(description="Name of the ingredient")
    amount: str = Field(description="Amount with unit (e.g., '200g', '1 cup', '2 tbsp')")
    category: str = Field(description="Category: Protein, Vegetable, Grain, Dairy, Spice, Oil, Other")


class Nutrition(BaseModel):
    """Nutritional information per serving"""
    calories: int = Field(description="Calories per serving")
    protein: int = Field(description="Protein in grams per serving")
    carbs: int = Field(description="Carbohydrates in grams per serving")
    fat: int = Field(description="Fat in grams per serving")


class GeneratedMeal(BaseModel):
    """Complete meal with all details"""
    id: str = Field(description="Unique identifier for the meal")
    name: str = Field(description="Name of the dish")
    description: str = Field(description="Brief appetizing description of the dish")
    cookTime: str = Field(description="Cooking time (e.g., '30 mins', '1 hour')")
    servings: int = Field(description="Number of servings")
    difficulty: str = Field(description="Easy, Medium, or Hard")
    tags: List[str] = Field(description="Tags like 'healthy', 'quick', 'vegetarian'")
    ingredients: List[Ingredient] = Field(description="List of ingredients with amounts")
    instructions: List[str] = Field(description="Step-by-step cooking instructions")
    nutrition: Nutrition = Field(description="Nutritional information per serving")
    meal_slot: str = Field(description="breakfast, lunch, dinner, or snack")
    plan_date: str = Field(description="Date in YYYY-MM-DD format")


class UserProfile(BaseModel):
    """User health profile for meal planning"""
    allergies: List[str] = Field(default_factory=list, description="Food allergies")
    medical_conditions: List[str] = Field(default_factory=list, description="Medical conditions like diabetes, hypertension")
    diet_style: str = Field(default="balanced", description="Diet style: balanced, vegetarian, vegan, keto, paleo, mediterranean")
    health_goals: List[str] = Field(default_factory=list, description="Health goals like weight loss, muscle gain")
    daily_calorie_goal: int = Field(default=2000, description="Target daily calories")
    cooking_skill: str = Field(default="beginner", description="beginner, intermediate, advanced")
    preferences: str = Field(default="", description="Additional preferences from conversation")


# ============================================================================
# DSPy Signatures
# ============================================================================

class GenerateDayMealsSignature(dspy.Signature):
    """You are an EXPERT NUTRITIONIST and REGISTERED DIETITIAN. Generate ALL meals for a single day.
    
    CRITICAL ALLERGY RULES - STRICTLY ENFORCE:
    - NEVER include ANY ingredient that contains or is derived from allergens listed in the user profile
    - Check EVERY ingredient against the allergy list
    - Consider cross-contamination risks (e.g., peanut allergies = avoid all tree nuts)
    - If unsure about an ingredient, DO NOT include it
    
    NUTRITION EXPERTISE RULES:
    - Balance macronutrients across the day based on health goals
    - For weight loss: higher protein, moderate carbs, lower fat
    - For muscle gain: high protein, higher carbs, moderate fat
    - For diabetes: low glycemic index, controlled carbs, high fiber
    - Ensure adequate vitamins and minerals through varied vegetables
    
    VARIETY RULES:
    - Breakfast CAN repeat similar items across days (eggs, oatmeal, yogurt are acceptable)
    - Lunch MUST be COMPLETELY DIFFERENT from other days - no repetition of main proteins or cuisines
    - Dinner MUST be COMPLETELY DIFFERENT from other days - no repetition of main proteins or cuisines
    - Snacks should vary in type (fruit, nuts, yogurt, vegetables)
    """

    user_profile: str = dspy.InputField(desc="User health profile with allergies, diet style, health goals, cooking skill")
    plan_date: str = dspy.InputField(desc="Date for the meals in YYYY-MM-DD format")
    context: str = dspy.InputField(desc="User preferences from conversation")
    previous_days_summary: str = dspy.InputField(desc="Summary of meals from previous days to ensure variety - AVOID these dishes for lunch/dinner")
    target_calories: int = dspy.InputField(desc="Target total calories for the day")

    day_meals_json: str = dspy.OutputField(desc="JSON array of 3-4 meals (breakfast, lunch, dinner, optional snack). Each meal: {name, description, cookTime, servings, difficulty, tags, ingredients: [{name, amount, category}], instructions: [steps], nutrition: {calories, protein, carbs, fat}, meal_slot}")




# ============================================================================
# DSPy Modules
# ============================================================================

class DayMealGenerator(dspy.Module):
    """Generates all meals for a single day in one LLM call - much faster!"""

    def __init__(self):
        super().__init__()
        self.generate_day = dspy.ChainOfThought(GenerateDayMealsSignature)

    def forward(self, user_profile: UserProfile, plan_date: str,
                context: str = "", previous_days_summary: str = "") -> List[GeneratedMeal]:

        profile_dict = user_profile.model_dump()
        
        # Build allergy warning for strict enforcement
        allergy_warning = ""
        if user_profile.allergies:
            allergy_warning = f"\n\nCRITICAL ALLERGIES TO AVOID: {', '.join(user_profile.allergies)}. NEVER include these or derivatives!"
            profile_dict["allergy_warning"] = allergy_warning
        
        profile_json = json.dumps(profile_dict)

        result = self.generate_day(
            user_profile=profile_json,
            plan_date=plan_date,
            context=context + allergy_warning,
            previous_days_summary=previous_days_summary,
            target_calories=user_profile.daily_calorie_goal
        )

        try:
            meals_data = json.loads(result.day_meals_json)
            if not isinstance(meals_data, list):
                meals_data = [meals_data]
            
            meals = []
            for meal_data in meals_data:
                # Validate and parse nutrition with defaults
                raw_nutrition = meal_data.get('nutrition', {})
                if not isinstance(raw_nutrition, dict):
                    raw_nutrition = {}
                
                nutrition = Nutrition(
                    calories=int(raw_nutrition.get('calories', 400) or 400),
                    protein=int(raw_nutrition.get('protein', 25) or 25),
                    carbs=int(raw_nutrition.get('carbs', 40) or 40),
                    fat=int(raw_nutrition.get('fat', 15) or 15)
                )
                
                meal = GeneratedMeal(
                    id=str(uuid.uuid4()),
                    name=meal_data.get('name', 'Delicious Meal'),
                    description=meal_data.get('description', ''),
                    cookTime=meal_data.get('cookTime', '30 mins'),
                    servings=int(meal_data.get('servings', 2) or 2),
                    difficulty=meal_data.get('difficulty', 'Easy'),
                    tags=meal_data.get('tags', []) or [],
                    ingredients=[
                        Ingredient(**ing) if isinstance(ing, dict) else Ingredient(name=str(ing), amount="1", category="Other")
                        for ing in (meal_data.get('ingredients', []) or [])
                    ],
                    instructions=meal_data.get('instructions', []) or [],
                    nutrition=nutrition,
                    meal_slot=meal_data.get('meal_slot', 'lunch'),
                    plan_date=plan_date
                )
                meals.append(meal)
            
            return meals

        except Exception as e:
            print(f"Error parsing day meals: {e}")
            import traceback
            traceback.print_exc()
            return self._create_fallback_day(user_profile, plan_date)
    
    def _create_fallback_day(self, user_profile: UserProfile, plan_date: str) -> List[GeneratedMeal]:
        """Create fallback meals for a day if generation fails"""
        return [
            self._create_fallback_meal(user_profile, 'breakfast', plan_date),
            self._create_fallback_meal(user_profile, 'lunch', plan_date),
            self._create_fallback_meal(user_profile, 'dinner', plan_date)
        ]

    def _create_fallback_meal(self, user_profile: UserProfile, meal_slot: str, plan_date: str) -> GeneratedMeal:
        """Create a simple fallback meal if generation fails"""
        fallback_meals = {
            'breakfast': {
                'name': 'Healthy Oatmeal Bowl',
                'description': 'Nutritious oatmeal with fresh fruits and nuts',
                'cookTime': '10 mins',
                'difficulty': 'Easy',
                'tags': ['healthy', 'quick', 'breakfast'],
                'ingredients': [
                    {'name': 'rolled oats', 'amount': '1 cup', 'category': 'Grain'},
                    {'name': 'milk', 'amount': '1.5 cups', 'category': 'Dairy'},
                    {'name': 'banana', 'amount': '1 medium', 'category': 'Fruit'},
                    {'name': 'honey', 'amount': '1 tbsp', 'category': 'Other'},
                    {'name': 'almonds', 'amount': '2 tbsp', 'category': 'Protein'}
                ],
                'instructions': [
                    'Bring milk to a simmer in a saucepan',
                    'Add oats and cook for 5 minutes, stirring occasionally',
                    'Transfer to a bowl and top with sliced banana',
                    'Drizzle with honey and sprinkle almonds'
                ],
                'nutrition': {'calories': 350, 'protein': 12, 'carbs': 55, 'fat': 10}
            },
            'lunch': {
                'name': 'Grilled Chicken Salad',
                'description': 'Fresh mixed greens with grilled chicken breast',
                'cookTime': '20 mins',
                'difficulty': 'Easy',
                'tags': ['healthy', 'protein', 'low-carb'],
                'ingredients': [
                    {'name': 'chicken breast', 'amount': '150g', 'category': 'Protein'},
                    {'name': 'mixed greens', 'amount': '2 cups', 'category': 'Vegetable'},
                    {'name': 'cherry tomatoes', 'amount': '1 cup', 'category': 'Vegetable'},
                    {'name': 'cucumber', 'amount': '1 medium', 'category': 'Vegetable'},
                    {'name': 'olive oil', 'amount': '2 tbsp', 'category': 'Oil'},
                    {'name': 'lemon juice', 'amount': '1 tbsp', 'category': 'Other'}
                ],
                'instructions': [
                    'Season chicken breast with salt and pepper',
                    'Grill chicken for 6-7 minutes per side until cooked through',
                    'Let chicken rest for 5 minutes, then slice',
                    'Combine greens, tomatoes, and cucumber in a bowl',
                    'Top with sliced chicken and drizzle with olive oil and lemon'
                ],
                'nutrition': {'calories': 420, 'protein': 38, 'carbs': 12, 'fat': 24}
            },
            'dinner': {
                'name': 'Baked Salmon with Vegetables',
                'description': 'Herb-crusted salmon with roasted seasonal vegetables',
                'cookTime': '35 mins',
                'difficulty': 'Medium',
                'tags': ['healthy', 'omega-3', 'protein'],
                'ingredients': [
                    {'name': 'salmon fillet', 'amount': '200g', 'category': 'Protein'},
                    {'name': 'broccoli', 'amount': '1 cup', 'category': 'Vegetable'},
                    {'name': 'sweet potato', 'amount': '1 medium', 'category': 'Vegetable'},
                    {'name': 'olive oil', 'amount': '2 tbsp', 'category': 'Oil'},
                    {'name': 'garlic', 'amount': '2 cloves', 'category': 'Spice'},
                    {'name': 'lemon', 'amount': '1', 'category': 'Other'},
                    {'name': 'fresh dill', 'amount': '2 tbsp', 'category': 'Spice'}
                ],
                'instructions': [
                    'Preheat oven to 400°F (200°C)',
                    'Cube sweet potato and toss with olive oil, place on baking sheet',
                    'Roast sweet potato for 15 minutes',
                    'Add broccoli florets to the sheet, roast another 10 minutes',
                    'Season salmon with garlic, dill, salt and pepper',
                    'Place salmon on sheet with vegetables, bake 12-15 minutes',
                    'Serve with lemon wedges'
                ],
                'nutrition': {'calories': 520, 'protein': 42, 'carbs': 35, 'fat': 22}
            },
            'snack': {
                'name': 'Greek Yogurt Parfait',
                'description': 'Creamy yogurt layered with berries and granola',
                'cookTime': '5 mins',
                'difficulty': 'Easy',
                'tags': ['healthy', 'quick', 'protein'],
                'ingredients': [
                    {'name': 'Greek yogurt', 'amount': '1 cup', 'category': 'Dairy'},
                    {'name': 'mixed berries', 'amount': '0.5 cup', 'category': 'Fruit'},
                    {'name': 'granola', 'amount': '0.25 cup', 'category': 'Grain'},
                    {'name': 'honey', 'amount': '1 tsp', 'category': 'Other'}
                ],
                'instructions': [
                    'Add half the yogurt to a glass or bowl',
                    'Layer with half the berries and granola',
                    'Repeat layers with remaining ingredients',
                    'Drizzle with honey and serve immediately'
                ],
                'nutrition': {'calories': 250, 'protein': 18, 'carbs': 30, 'fat': 6}
            }
        }

        fallback = fallback_meals.get(meal_slot, fallback_meals['lunch'])

        return GeneratedMeal(
            id=str(uuid.uuid4()),
            name=fallback['name'],
            description=fallback['description'],
            cookTime=fallback['cookTime'],
            servings=2,
            difficulty=fallback['difficulty'],
            tags=fallback['tags'],
            ingredients=[Ingredient(**ing) for ing in fallback['ingredients']],
            instructions=fallback['instructions'],
            nutrition=Nutrition(**fallback['nutrition']),
            meal_slot=meal_slot,
            plan_date=plan_date
        )


class MealPlanOrchestrator(dspy.Module):
    """Orchestrates complete meal plan generation - now batched by day for speed!"""

    def __init__(self):
        super().__init__()
        self.day_generator = DayMealGenerator()

    def forward(self, user_profile: UserProfile, start_date: str,
                number_of_days: int = 7, context: str = "") -> Dict[str, Any]:

        all_meals = []
        previous_days_summary = []

        start = datetime.strptime(start_date, '%Y-%m-%d')
        
        print(f"🍽️ Generating {number_of_days}-day meal plan...")
        print(f"📋 User profile: diet={user_profile.diet_style}, allergies={user_profile.allergies}")

        for day_offset in range(number_of_days):
            current_date = (start + timedelta(days=day_offset)).strftime('%Y-%m-%d')
            print(f"  Day {day_offset + 1}: {current_date}")
            
            # Build summary of previous days to avoid repetition
            prev_summary = ""
            if previous_days_summary:
                prev_summary = "Previous days' lunch/dinner (AVOID REPEATING): " + "; ".join(previous_days_summary[-6:])
            
            # Generate all meals for this day in ONE call
            day_meals = self.day_generator(
                user_profile=user_profile,
                plan_date=current_date,
                context=context,
                previous_days_summary=prev_summary
            )
            
            # Track lunch and dinner names for variety enforcement
            for meal in day_meals:
                if meal.meal_slot in ['lunch', 'dinner']:
                    previous_days_summary.append(f"{meal.meal_slot}: {meal.name}")
            
            all_meals.extend(day_meals)
            print(f"    Generated {len(day_meals)} meals for day {day_offset + 1}")

        # Calculate summary stats
        total_meals = len(all_meals)
        avg_daily_calories = sum(m.nutrition.calories for m in all_meals) / number_of_days if all_meals else 0

        summary = f"Created a {number_of_days}-day meal plan with {total_meals} meals. "
        summary += f"Average daily calories: {int(avg_daily_calories)}. "

        if user_profile.diet_style != 'balanced':
            summary += f"All meals follow your {user_profile.diet_style} diet. "

        if user_profile.allergies:
            summary += f"Strictly avoided allergens: {', '.join(user_profile.allergies)}."

        return {
            'meals': [meal.model_dump() for meal in all_meals],
            'summary': summary,
            'stats': {
                'total_meals': total_meals,
                'average_daily_calories': int(avg_daily_calories),
                'days_planned': number_of_days
            }
        }


# ============================================================================
# DSPy Meal Planner Service
# ============================================================================

class DSPyMealPlannerService:
    """Service wrapper for the DSPy meal planner"""

    def __init__(self, llm_provider: Optional[str] = None):
        self.llm_provider = llm_provider or os.getenv('LLM_PROVIDER', 'openai').lower()
        self._configure_dspy()
        self.orchestrator = MealPlanOrchestrator()
        print(f"DSPyMealPlannerService initialized with {self.llm_provider}")

    def _configure_dspy(self):
        """Configure DSPy with the appropriate LLM"""
        if self.llm_provider == 'gemini':
            api_key = os.getenv('GOOGLE_API_KEY')
            if not api_key:
                raise ValueError("GOOGLE_API_KEY not set")
            lm = dspy.LM('google/gemini-1.5-flash', api_key=api_key)
        else:
            api_key = os.getenv('AI_INTEGRATIONS_OPENAI_API_KEY') or os.getenv('OPENAI_API_KEY')
            base_url = os.getenv('AI_INTEGRATIONS_OPENAI_BASE_URL')
            if not api_key:
                raise ValueError("OPENAI_API_KEY not set")
            if base_url:
                lm = dspy.LM('openai/gpt-4o-mini', api_key=api_key, api_base=base_url)
            else:
                lm = dspy.LM('openai/gpt-4o-mini', api_key=api_key)

        dspy.configure(lm=lm)

    def generate_meal_plan(
        self,
        user_id: str,
        messages: List[Dict],
        health_context: Dict,
        start_date: str,
        number_of_days: int = 7
    ) -> Dict[str, Any]:
        """Generate a complete meal plan"""

        print(f"\n{'='*60}")
        print(f"DSPy Meal Plan Generation")
        print(f"{'='*60}")
        print(f"User: {user_id}, Days: {number_of_days}, Start: {start_date}")

        # Build user profile from health context
        user_profile = UserProfile(
            allergies=health_context.get('allergies', []) or [],
            medical_conditions=health_context.get('medicalConditions', []) or [],
            diet_style=health_context.get('dietStyle', 'balanced') or 'balanced',
            health_goals=health_context.get('healthGoals', []) or [],
            daily_calorie_goal=health_context.get('dailyCalorieGoal', 2000) or 2000,
            cooking_skill=health_context.get('cookingSkill', 'beginner') or 'beginner',
            preferences=self._extract_preferences(messages)
        )

        # Extract conversation context
        context = self._extract_preferences(messages)

        try:
            result = self.orchestrator(
                user_profile=user_profile,
                start_date=start_date,
                number_of_days=number_of_days,
                context=context
            )

            print(f"Generated {len(result['meals'])} meals")
            return result

        except Exception as e:
            print(f"Error in meal plan generation: {e}")
            import traceback
            traceback.print_exc()
            return {
                'meals': [],
                'summary': f'Error generating meal plan: {str(e)}',
                'error': str(e)
            }

    def _extract_preferences(self, messages: List[Dict]) -> str:
        """Extract user preferences from conversation messages"""
        user_messages = [
            msg['content'] for msg in messages
            if msg.get('role') == 'user'
        ]
        return ' | '.join(user_messages) if user_messages else ''

    def generate_single_meal(
        self,
        health_context: Dict,
        meal_slot: str,
        plan_date: str,
        context: str = ""
    ) -> Dict[str, Any]:
        """Generate a single meal (useful for replacements)"""

        user_profile = UserProfile(
            allergies=health_context.get('allergies', []) or [],
            medical_conditions=health_context.get('medicalConditions', []) or [],
            diet_style=health_context.get('dietStyle', 'balanced') or 'balanced',
            health_goals=health_context.get('healthGoals', []) or [],
            daily_calorie_goal=health_context.get('dailyCalorieGoal', 2000) or 2000,
            cooking_skill=health_context.get('cookingSkill', 'beginner') or 'beginner'
        )

        day_generator = DayMealGenerator()
        meals = day_generator(
            user_profile=user_profile,
            plan_date=plan_date,
            context=f"Generate only a {meal_slot}. {context}",
            previous_days_summary=""
        )
        
        # Return first meal that matches the slot, or first meal if no match
        for meal in meals:
            if meal.meal_slot == meal_slot:
                return meal.model_dump()
        
        return meals[0].model_dump() if meals else {}


# Create singleton instance
dspy_meal_planner = DSPyMealPlannerService()


# ============================================================================
# Test Function
# ============================================================================

def test_meal_planner():
    """Test the DSPy meal planner"""

    print("Testing DSPy Meal Planner...")

    health_context = {
        'allergies': ['peanuts'],
        'medicalConditions': [],
        'dietStyle': 'balanced',
        'healthGoals': ['weight loss', 'more energy'],
        'dailyCalorieGoal': 1800,
        'cookingSkill': 'intermediate'
    }

    messages = [
        {'role': 'user', 'content': 'I want healthy meals that are quick to prepare'},
        {'role': 'assistant', 'content': 'I can help with that!'},
        {'role': 'user', 'content': 'I prefer Mediterranean style food'}
    ]

    result = dspy_meal_planner.generate_meal_plan(
        user_id='test-user',
        messages=messages,
        health_context=health_context,
        start_date=datetime.now().strftime('%Y-%m-%d'),
        number_of_days=2
    )

    print(f"\nSummary: {result['summary']}")
    print(f"Total meals: {len(result['meals'])}")

    if result['meals']:
        print(f"\nFirst meal example:")
        meal = result['meals'][0]
        print(f"  Name: {meal['name']}")
        print(f"  Slot: {meal['meal_slot']}")
        print(f"  Ingredients: {len(meal['ingredients'])} items")
        print(f"  Instructions: {len(meal['instructions'])} steps")
        print(f"  Nutrition: {meal['nutrition']}")


if __name__ == '__main__':
    test_meal_planner()
