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

class GenerateMealSignature(dspy.Signature):
    """Generate a complete meal with ingredients and instructions based on user profile."""

    user_profile: str = dspy.InputField(desc="User health profile as JSON string")
    meal_slot: str = dspy.InputField(desc="Meal slot: breakfast, lunch, dinner, or snack")
    plan_date: str = dspy.InputField(desc="Date for the meal in YYYY-MM-DD format")
    context: str = dspy.InputField(desc="Additional context from user conversation")
    previous_meals: str = dspy.InputField(desc="Previously generated meals to avoid repetition")

    meal_json: str = dspy.OutputField(desc="Complete meal as JSON with name, description, cookTime, servings, difficulty, tags, ingredients (with name, amount, category), instructions (as array), and nutrition (calories, protein, carbs, fat)")


class CalculateNutritionSignature(dspy.Signature):
    """Calculate accurate nutritional information for a meal based on ingredients."""

    meal_name: str = dspy.InputField(desc="Name of the meal")
    ingredients: str = dspy.InputField(desc="List of ingredients with amounts as JSON")
    servings: int = dspy.InputField(desc="Number of servings the recipe makes")

    nutrition_json: str = dspy.OutputField(desc="Nutrition per serving as JSON: {calories: int, protein: int, carbs: int, fat: int}")


class PlanMealSlotSignature(dspy.Signature):
    """Plan what type of meal fits best for a specific slot considering user preferences and nutrition targets."""

    user_profile: str = dspy.InputField(desc="User health profile")
    meal_slot: str = dspy.InputField(desc="breakfast, lunch, dinner, or snack")
    daily_calorie_target: int = dspy.InputField(desc="User's daily calorie goal")
    already_planned_calories: int = dspy.InputField(desc="Calories already planned for this day")
    user_preferences: str = dspy.InputField(desc="User's stated preferences from conversation")

    meal_concept: str = dspy.OutputField(desc="Concept for the meal: what type of dish, key ingredients to include, target calories for this meal")


# ============================================================================
# DSPy Modules
# ============================================================================

class MealGenerator(dspy.Module):
    """Generates a single complete meal with all details"""

    def __init__(self):
        super().__init__()
        self.generate_meal = dspy.ChainOfThought(GenerateMealSignature)
        self.calculate_nutrition = dspy.ChainOfThought(CalculateNutritionSignature)

    def forward(self, user_profile: UserProfile, meal_slot: str, plan_date: str,
                context: str = "", previous_meals: List[str] = None) -> GeneratedMeal:

        profile_json = json.dumps(user_profile.model_dump())
        prev_meals_str = json.dumps(previous_meals or [])

        # Generate the meal
        result = self.generate_meal(
            user_profile=profile_json,
            meal_slot=meal_slot,
            plan_date=plan_date,
            context=context,
            previous_meals=prev_meals_str
        )

        try:
            # Parse the generated meal JSON
            meal_data = json.loads(result.meal_json)

            # Calculate accurate nutrition based on ingredients
            if meal_data.get('ingredients'):
                nutrition_result = self.calculate_nutrition(
                    meal_name=meal_data.get('name', ''),
                    ingredients=json.dumps(meal_data.get('ingredients', [])),
                    servings=meal_data.get('servings', 1)
                )

                try:
                    accurate_nutrition = json.loads(nutrition_result.nutrition_json)
                    meal_data['nutrition'] = accurate_nutrition
                except:
                    pass  # Keep original nutrition if calculation fails

            # Ensure all required fields
            meal = GeneratedMeal(
                id=str(uuid.uuid4()),
                name=meal_data.get('name', 'Delicious Meal'),
                description=meal_data.get('description', ''),
                cookTime=meal_data.get('cookTime', '30 mins'),
                servings=meal_data.get('servings', 2),
                difficulty=meal_data.get('difficulty', 'Easy'),
                tags=meal_data.get('tags', []),
                ingredients=[
                    Ingredient(**ing) if isinstance(ing, dict) else ing
                    for ing in meal_data.get('ingredients', [])
                ],
                instructions=meal_data.get('instructions', []),
                nutrition=Nutrition(**meal_data.get('nutrition', {'calories': 400, 'protein': 25, 'carbs': 40, 'fat': 15})),
                meal_slot=meal_slot,
                plan_date=plan_date
            )

            return meal

        except Exception as e:
            print(f"Error parsing meal: {e}")
            # Return a fallback meal
            return self._create_fallback_meal(user_profile, meal_slot, plan_date)

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
    """Orchestrates complete meal plan generation for multiple days"""

    def __init__(self):
        super().__init__()
        self.meal_generator = MealGenerator()
        self.plan_slot = dspy.ChainOfThought(PlanMealSlotSignature)

    def forward(self, user_profile: UserProfile, start_date: str,
                number_of_days: int = 7, context: str = "") -> Dict[str, Any]:

        meals = []
        previous_meal_names = []

        # Generate dates
        start = datetime.strptime(start_date, '%Y-%m-%d')

        # Calorie distribution per meal slot
        calorie_distribution = {
            'breakfast': 0.25,
            'lunch': 0.35,
            'dinner': 0.35,
            'snack': 0.05
        }

        for day_offset in range(number_of_days):
            current_date = (start + timedelta(days=day_offset)).strftime('%Y-%m-%d')
            daily_calories_planned = 0

            for meal_slot in ['breakfast', 'lunch', 'dinner', 'snack']:
                target_calories = int(user_profile.daily_calorie_goal * calorie_distribution[meal_slot])

                # Generate meal concept first
                try:
                    concept = self.plan_slot(
                        user_profile=json.dumps(user_profile.model_dump()),
                        meal_slot=meal_slot,
                        daily_calorie_target=user_profile.daily_calorie_goal,
                        already_planned_calories=daily_calories_planned,
                        user_preferences=context
                    )
                    enhanced_context = f"{context}\nTarget: {concept.meal_concept}"
                except:
                    enhanced_context = context

                # Generate the actual meal
                meal = self.meal_generator(
                    user_profile=user_profile,
                    meal_slot=meal_slot,
                    plan_date=current_date,
                    context=enhanced_context,
                    previous_meals=previous_meal_names[-10:]  # Last 10 meals to avoid repetition
                )

                meals.append(meal)
                previous_meal_names.append(meal.name)
                daily_calories_planned += meal.nutrition.calories

        # Calculate summary stats
        total_meals = len(meals)
        avg_daily_calories = sum(m.nutrition.calories for m in meals) / number_of_days

        summary = f"Created a {number_of_days}-day meal plan with {total_meals} meals. "
        summary += f"Average daily calories: {int(avg_daily_calories)}. "

        if user_profile.diet_style != 'balanced':
            summary += f"All meals follow your {user_profile.diet_style} diet. "

        if user_profile.allergies:
            summary += f"Avoided allergens: {', '.join(user_profile.allergies)}."

        return {
            'meals': [meal.model_dump() for meal in meals],
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

    def __init__(self, llm_provider: str = None):
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
            api_key = os.getenv('OPENAI_API_KEY')
            if not api_key:
                raise ValueError("OPENAI_API_KEY not set")
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

        meal_generator = MealGenerator()
        meal = meal_generator(
            user_profile=user_profile,
            meal_slot=meal_slot,
            plan_date=plan_date,
            context=context
        )

        return meal.model_dump()


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
