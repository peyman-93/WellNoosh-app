"""
Personalized Recipe Agent
Generates personalized recipes based on user profile, health goals, and preferences.
Uses DSPy for structured recipe generation with ingredients (with units), instructions, and nutrition.
"""

import os
import uuid
from typing import List, Dict, Any, Optional, Tuple
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv()

try:
    import dspy
    DSPY_AVAILABLE = True
except ImportError:
    DSPY_AVAILABLE = False
    print("Warning: dspy not available for PersonalizedRecipeAgent")

ALLERGEN_DERIVATIVES = {
    'dairy': [
        'milk', 'cheese', 'butter', 'cream', 'yogurt', 'yoghurt', 'whey', 'casein',
        'lactose', 'ghee', 'paneer', 'ricotta', 'mozzarella', 'parmesan', 'cheddar',
        'brie', 'camembert', 'feta', 'gouda', 'swiss', 'provolone', 'cottage cheese',
        'cream cheese', 'sour cream', 'half and half', 'buttermilk', 'condensed milk',
        'evaporated milk', 'powdered milk', 'milk powder', 'ice cream', 'gelato',
        'custard', 'pudding', 'kefir', 'lassi', 'dairy', 'milky', 'cheesy', 'creamy',
        'lactalbumin', 'lactoglobulin', 'curds', 'whipped cream', 'heavy cream',
        'light cream', 'half-and-half', 'nonfat milk', 'skim milk', 'whole milk',
        'malted milk', 'milk fat', 'milk solids', 'rennet casein', 'sodium caseinate',
        'calcium caseinate', 'hydrolyzed casein', 'acidophilus milk', 'dulce de leche'
    ],
    'gluten': [
        'wheat', 'flour', 'bread', 'pasta', 'noodles', 'barley', 'rye', 'oats',
        'semolina', 'couscous', 'bulgur', 'farro', 'spelt', 'kamut', 'triticale',
        'durum', 'seitan', 'croutons', 'breadcrumbs', 'panko', 'tortilla', 'pita',
        'naan', 'bagel', 'muffin', 'cake', 'cookie', 'biscuit', 'cracker', 'pretzel',
        'cereal', 'pancake', 'waffle', 'soy sauce', 'teriyaki', 'malt', 'einkorn',
        'emmer', 'graham', 'vital wheat gluten', 'wheat germ', 'wheat bran',
        'wheat starch', 'modified wheat starch', 'hydrolyzed wheat protein',
        'wheat berries', 'udon', 'ramen', 'orzo', 'matzo', 'matzah'
    ],
    'nuts': [
        'almond', 'walnut', 'cashew', 'pistachio', 'pecan', 'hazelnut', 'macadamia',
        'brazil nut', 'pine nut', 'chestnut', 'nut butter', 'almond butter',
        'cashew butter', 'peanut', 'peanut butter', 'nutella', 'praline', 'marzipan',
        'nougat', 'nut oil', 'nut milk', 'almond milk', 'cashew milk', 'nut flour',
        'almond flour', 'almond meal', 'hazelnut spread', 'walnut oil', 'almond oil',
        'pistachio butter', 'pecan oil', 'mixed nuts', 'tree nuts', 'nut paste',
        'nut extract', 'almond extract', 'natural nut flavor', 'gianduja', 'filberts'
    ],
    'eggs': [
        'egg', 'eggs', 'egg white', 'egg yolk', 'mayonnaise', 'mayo', 'meringue',
        'aioli', 'hollandaise', 'béarnaise', 'custard', 'quiche', 'frittata',
        'omelette', 'scrambled', 'fried egg', 'poached egg', 'egg wash', 'albumin',
        'globulin', 'livetin', 'lysozyme', 'ovalbumin', 'ovomucin', 'ovomucoid',
        'ovovitellin', 'powdered egg', 'dried egg', 'egg solids', 'egg substitute',
        'eggnog', 'surimi', 'lecithin'
    ],
    'shellfish': [
        'shrimp', 'prawn', 'crab', 'lobster', 'crayfish', 'crawfish', 'scallop',
        'clam', 'mussel', 'oyster', 'squid', 'calamari', 'octopus', 'shellfish',
        'abalone', 'cockle', 'conch', 'limpet', 'periwinkle', 'sea urchin', 'snail',
        'escargot', 'langoustine', 'krill', 'barnacle', 'geoduck', 'whelk'
    ],
    'fish': [
        'fish', 'salmon', 'tuna', 'cod', 'tilapia', 'halibut', 'trout', 'sardine',
        'anchovy', 'mackerel', 'herring', 'snapper', 'bass', 'catfish', 'flounder',
        'sole', 'haddock', 'pollock', 'fish sauce', 'worcestershire', 'mahi mahi',
        'swordfish', 'grouper', 'perch', 'pike', 'carp', 'eel', 'monkfish',
        'orange roughy', 'rockfish', 'sturgeon', 'caviar', 'roe', 'fish oil',
        'omega-3 fish', 'bonito', 'surimi', 'dashi', 'fish stock', 'fish paste'
    ],
    'soy': [
        'soy', 'soya', 'tofu', 'tempeh', 'edamame', 'miso', 'soy sauce', 'soy milk',
        'soy protein', 'soybean', 'tamari', 'teriyaki', 'soy lecithin', 'lecithin',
        'textured vegetable protein', 'tvp', 'textured soy protein', 'soy flour',
        'soy fiber', 'soy albumin', 'soy concentrate', 'soy isolate', 'soy nuts',
        'soy sprouts', 'shoyu', 'natto', 'okara', 'yuba', 'hydrolyzed soy protein',
        'hydrolyzed plant protein', 'hydrolyzed vegetable protein', 'hvp',
        'natural flavoring', 'vegetable broth', 'vegetable gum', 'vegetable starch',
        'miso paste', 'bean curd', 'kinako', 'soy cheese', 'soy yogurt', 'soy ice cream'
    ],
    'peanuts': [
        'peanut', 'peanuts', 'peanut butter', 'peanut oil', 'peanut flour',
        'arachis oil', 'groundnut', 'groundnuts', 'monkey nuts', 'earth nuts',
        'goober peas', 'mandelonas', 'peanut protein', 'hydrolyzed peanut protein'
    ],
    'sesame': [
        'sesame', 'sesame seed', 'sesame oil', 'tahini', 'halvah', 'halva',
        'hummus', 'sesame paste', 'sesame flour', 'benne seeds', 'gingelly oil',
        'til', 'simsim'
    ]
}


class RecipeIngredient(BaseModel):
    name: str = Field(description="Name of the ingredient")
    amount: str = Field(description="Amount with unit (e.g., '2 tbsp', '1 cup', '200g')")
    category: str = Field(description="Category: Protein, Vegetable, Grain, Dairy, Spice, Oil, Other")


class RecipeNutrition(BaseModel):
    calories: int = Field(description="Total calories")
    protein: int = Field(description="Protein in grams")
    carbs: int = Field(description="Carbohydrates in grams")
    fat: int = Field(description="Fat in grams")
    fiber: int = Field(default=0, description="Fiber in grams")


class PersonalizedRecipe(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str = Field(description="Recipe name")
    description: str = Field(description="Brief description of the dish")
    servings: int = Field(default=2)
    tags: List[str] = Field(default_factory=list)
    ingredients: List[RecipeIngredient] = Field(default_factory=list)
    instructions: List[str] = Field(default_factory=list)
    nutrition: RecipeNutrition = Field(default_factory=lambda: RecipeNutrition(calories=0, protein=0, carbs=0, fat=0))
    personalization_notes: str = Field(default="", description="How this recipe was personalized for the user")


def get_forbidden_ingredients(allergies: List[str]) -> set:
    """Get all forbidden ingredients based on user allergies"""
    forbidden = set()
    for allergy in allergies:
        allergy_lower = allergy.lower()
        forbidden.add(allergy_lower)
        if allergy_lower in ALLERGEN_DERIVATIVES:
            forbidden.update(ALLERGEN_DERIVATIVES[allergy_lower])
    return forbidden


def validate_recipe_allergens(recipe: Dict[str, Any], forbidden: set) -> Tuple[bool, List[str]]:
    """Validate a recipe doesn't contain any forbidden ingredients.
    
    Scans ALL textual fields: name, description, instructions, ingredients,
    tags, personalization_notes, and nutrition notes.
    """
    violations = []
    
    name = recipe.get('name', '').lower()
    description = recipe.get('description', '').lower()
    instructions = ' '.join(recipe.get('instructions', [])).lower()
    personalization_notes = recipe.get('personalization_notes', '').lower()
    tags = ' '.join(recipe.get('tags', [])).lower()
    
    ingredients = recipe.get('ingredients', [])
    ingredient_names = []
    ingredient_amounts = []
    for ing in ingredients:
        if isinstance(ing, dict):
            ingredient_names.append(ing.get('name', '').lower())
            ingredient_amounts.append(ing.get('amount', '').lower())
            ingredient_names.append(ing.get('category', '').lower())
        elif isinstance(ing, str):
            ingredient_names.append(ing.lower())
    
    nutrition = recipe.get('nutrition', {})
    nutrition_text = ''
    if isinstance(nutrition, dict):
        for key, val in nutrition.items():
            nutrition_text += f" {key} {val}"
    nutrition_text = nutrition_text.lower()
    
    all_text = f"{name} {description} {instructions} {personalization_notes} {tags} {nutrition_text} {' '.join(ingredient_names)} {' '.join(ingredient_amounts)}"
    
    for forbidden_item in forbidden:
        if forbidden_item in all_text:
            violations.append(forbidden_item)
    
    return len(violations) == 0, violations


if DSPY_AVAILABLE:
    class RecipeGeneratorSignature(dspy.Signature):
        """Generate a personalized recipe based on user profile and preferences."""
        
        user_profile: str = dspy.InputField(desc="User health profile including allergies, diet style, health goals")
        meal_type: str = dspy.InputField(desc="Type of meal: breakfast, lunch, dinner, snack")
        preferences: str = dspy.InputField(desc="User's specific preferences or requests")
        
        recipe_name: str = dspy.OutputField(desc="Creative, appetizing name for the recipe")
        description: str = dspy.OutputField(desc="Brief 1-2 sentence description of the dish")
        servings: int = dspy.OutputField(desc="Number of servings (usually 2)")
        tags: str = dspy.OutputField(desc="Comma-separated tags like 'healthy,quick,vegetarian'")
        ingredients_json: str = dspy.OutputField(desc='JSON array of ingredients with UNITS in amount field. Format: [{"name": "chicken breast", "amount": "200g", "category": "Protein"}, {"name": "olive oil", "amount": "2 tbsp", "category": "Oil"}]. IMPORTANT: amount MUST include unit like "2 cups", "100g", "1 tbsp", "3 cloves"')
        instructions_json: str = dspy.OutputField(desc='JSON array of step-by-step instructions: ["Step 1...", "Step 2..."]')
        calories: int = dspy.OutputField(desc="Estimated total calories")
        protein: int = dspy.OutputField(desc="Estimated protein in grams")
        carbs: int = dspy.OutputField(desc="Estimated carbohydrates in grams")
        fat: int = dspy.OutputField(desc="Estimated fat in grams")
        personalization_notes: str = dspy.OutputField(desc="How this recipe was customized for the user's needs")


class PersonalizedRecipeAgent:
    """
    Agent that generates personalized recipes based on user profile.
    
    Features:
    - Considers allergies and dietary restrictions
    - Adapts to health goals (weight loss, muscle gain, etc.)
    - Provides detailed ingredients with proper units
    - Includes step-by-step instructions
    - Calculates approximate nutrition metrics
    """
    
    def __init__(self):
        self.initialized = False
        if DSPY_AVAILABLE:
            self._setup_dspy()
    
    def _setup_dspy(self):
        """Initialize DSPy with LLM configuration"""
        try:
            api_key = os.getenv('AI_INTEGRATIONS_OPENAI_API_KEY') or os.getenv('OPENAI_API_KEY')
            base_url = os.getenv('AI_INTEGRATIONS_OPENAI_BASE_URL')
            
            if not api_key:
                print("Warning: No OpenAI API key found for PersonalizedRecipeAgent")
                return
            
            max_tokens = int(os.getenv('DSPY_MAX_TOKENS', '2000'))
            
            if base_url:
                lm = dspy.LM('openai/gpt-4o', api_key=api_key, api_base=base_url, max_tokens=max_tokens)
            else:
                lm = dspy.LM('openai/gpt-4o', api_key=api_key, max_tokens=max_tokens)
            
            dspy.configure(lm=lm)
            self.recipe_generator = dspy.ChainOfThought(RecipeGeneratorSignature)
            self.initialized = True
            print("PersonalizedRecipeAgent initialized successfully")
        except Exception as e:
            print(f"Error initializing PersonalizedRecipeAgent: {e}")
            self.initialized = False
    
    def _build_user_profile_string(self, health_context: Dict[str, Any]) -> str:
        """Build a string description of user profile for the LLM"""
        parts = []
        
        allergies = health_context.get('allergies', [])
        if allergies:
            parts.append(f"CRITICAL ALLERGIES (must avoid completely): {', '.join(allergies)}")
        
        diet_style = health_context.get('dietStyle', '')
        if diet_style:
            parts.append(f"Diet style: {diet_style}")
        
        health_goals = health_context.get('healthGoals', [])
        if health_goals:
            parts.append(f"Health goals: {', '.join(health_goals)}")
        
        calorie_goal = health_context.get('dailyCalorieGoal')
        if calorie_goal:
            parts.append(f"Daily calorie target: {calorie_goal} kcal")
        
        cooking_skill = health_context.get('cookingSkill', 'beginner')
        parts.append(f"Cooking skill: {cooking_skill}")
        
        return '\n'.join(parts) if parts else "No specific dietary requirements"
    
    def generate_recipe(
        self,
        health_context: Dict[str, Any],
        meal_type: str = "dinner",
        preferences: str = ""
    ) -> PersonalizedRecipe:
        """
        Generate a single personalized recipe.
        
        Args:
            health_context: User's health profile (allergies, goals, etc.)
            meal_type: breakfast, lunch, dinner, or snack
            preferences: Additional user preferences
            
        Returns:
            PersonalizedRecipe with full details
        """
        if not self.initialized:
            return self._get_fallback_recipe(meal_type, health_context)
        
        user_profile = self._build_user_profile_string(health_context)
        allergies = health_context.get('allergies', [])
        
        try:
            result = self.recipe_generator(
                user_profile=user_profile,
                meal_type=meal_type,
                preferences=preferences or f"Create a delicious {meal_type} recipe"
            )
            
            import json
            
            try:
                ingredients_data = json.loads(result.ingredients_json)
                if not ingredients_data or not isinstance(ingredients_data, list):
                    raise ValueError("Invalid ingredients data")
                ingredients = [RecipeIngredient(**ing) for ing in ingredients_data]
            except Exception as e:
                print(f"⚠️ Failed to parse ingredients: {e}. Using fallback.")
                return self._get_fallback_recipe(meal_type, health_context)
            
            try:
                instructions = json.loads(result.instructions_json)
                if not instructions or not isinstance(instructions, list):
                    raise ValueError("Invalid instructions data")
            except Exception as e:
                print(f"⚠️ Failed to parse instructions: {e}. Using fallback.")
                return self._get_fallback_recipe(meal_type, health_context)
            
            if not ingredients or len(ingredients) == 0:
                print(f"⚠️ Recipe has no ingredients. Using fallback.")
                return self._get_fallback_recipe(meal_type, health_context)
            
            tags = [t.strip() for t in result.tags.split(',') if t.strip()]
            
            recipe_dict = {
                'name': result.recipe_name,
                'description': result.description,
                'ingredients': [ing.model_dump() for ing in ingredients],
                'instructions': instructions,
                'tags': tags,
                'personalization_notes': result.personalization_notes
            }
            
            if allergies:
                forbidden = get_forbidden_ingredients(allergies)
                is_safe, violations = validate_recipe_allergens(recipe_dict, forbidden)
                if not is_safe:
                    print(f"⚠️ Recipe contains allergens: {violations}. Using fallback.")
                    return self._get_fallback_recipe(meal_type, health_context)
            
            recipe = PersonalizedRecipe(
                name=result.recipe_name,
                description=result.description,
                servings=result.servings,
                tags=tags,
                ingredients=ingredients,
                instructions=instructions,
                nutrition=RecipeNutrition(
                    calories=result.calories,
                    protein=result.protein,
                    carbs=result.carbs,
                    fat=result.fat
                ),
                personalization_notes=result.personalization_notes
            )
            
            return recipe
            
        except Exception as e:
            print(f"Error generating recipe: {e}")
            return self._get_fallback_recipe(meal_type, health_context)
    
    def generate_multiple_recipes(
        self,
        health_context: Dict[str, Any],
        count: int = 3,
        meal_types: List[str] = None
    ) -> List[PersonalizedRecipe]:
        """Generate multiple personalized recipes with allergen safety validation"""
        if meal_types is None:
            meal_types = ['breakfast', 'lunch', 'dinner']
        
        allergies = health_context.get('allergies', [])
        forbidden = get_forbidden_ingredients(allergies) if allergies else set()
        
        recipes = []
        for i in range(count):
            meal_type = meal_types[i % len(meal_types)]
            try:
                recipe = self.generate_recipe(health_context, meal_type)
                
                if allergies:
                    recipe_dict = {
                        'name': recipe.name,
                        'description': recipe.description,
                        'ingredients': [ing.model_dump() for ing in recipe.ingredients],
                        'instructions': recipe.instructions
                    }
                    is_safe, violations = validate_recipe_allergens(recipe_dict, forbidden)
                    if not is_safe:
                        print(f"⚠️ Final validation caught allergens in recipe '{recipe.name}': {violations}")
                        recipe = self._get_fallback_recipe(meal_type, health_context)
                
                recipes.append(recipe)
            except Exception as e:
                print(f"Error generating recipe {i+1}: {e}")
                recipes.append(self._get_fallback_recipe(meal_type, health_context))
        
        return recipes
    
    def _get_fallback_recipe(self, meal_type: str, health_context: Dict[str, Any]) -> PersonalizedRecipe:
        """Get a safe fallback recipe when generation fails or allergens detected"""
        fallbacks = {
            'breakfast': PersonalizedRecipe(
                name="Fresh Fruit & Avocado Bowl",
                description="A refreshing bowl of seasonal fruits with creamy avocado",
                servings=2,
                tags=["healthy", "quick", "allergen-free"],
                ingredients=[
                    RecipeIngredient(name="mixed berries", amount="1 cup", category="Fruit"),
                    RecipeIngredient(name="banana", amount="1 medium", category="Fruit"),
                    RecipeIngredient(name="avocado", amount="1/2", category="Fruit"),
                    RecipeIngredient(name="chia seeds", amount="1 tbsp", category="Other"),
                    RecipeIngredient(name="maple syrup", amount="1 tsp", category="Other")
                ],
                instructions=[
                    "Slice the banana into rounds and arrange in a bowl",
                    "Add fresh mixed berries on top",
                    "Slice the avocado and fan it over the fruit",
                    "Sprinkle with chia seeds",
                    "Drizzle with maple syrup and serve"
                ],
                nutrition=RecipeNutrition(calories=320, protein=6, carbs=45, fat=15),
                personalization_notes="A safe, allergen-free option for your breakfast"
            ),
            'lunch': PersonalizedRecipe(
                name="Grilled Chicken & Vegetable Bowl",
                description="Lean protein with colorful roasted vegetables over quinoa",
                servings=2,
                tags=["healthy", "protein", "allergen-free"],
                ingredients=[
                    RecipeIngredient(name="chicken breast", amount="200g", category="Protein"),
                    RecipeIngredient(name="quinoa", amount="1 cup cooked", category="Grain"),
                    RecipeIngredient(name="zucchini", amount="1 medium", category="Vegetable"),
                    RecipeIngredient(name="bell pepper", amount="1", category="Vegetable"),
                    RecipeIngredient(name="cherry tomatoes", amount="1 cup", category="Vegetable"),
                    RecipeIngredient(name="olive oil", amount="2 tbsp", category="Oil"),
                    RecipeIngredient(name="garlic", amount="2 cloves", category="Spice"),
                    RecipeIngredient(name="lemon juice", amount="2 tbsp", category="Other")
                ],
                instructions=[
                    "Season chicken breast with salt, pepper, and minced garlic",
                    "Grill or pan-fry chicken for 6-7 minutes per side until cooked through",
                    "Chop vegetables and toss with olive oil",
                    "Roast vegetables at 200°C/400°F for 15-20 minutes",
                    "Slice chicken and serve over cooked quinoa with roasted vegetables",
                    "Drizzle with lemon juice before serving"
                ],
                nutrition=RecipeNutrition(calories=450, protein=38, carbs=32, fat=18),
                personalization_notes="High protein meal to support your health goals"
            ),
            'dinner': PersonalizedRecipe(
                name="Herb-Roasted Salmon with Sweet Potato",
                description="Omega-3 rich salmon with roasted sweet potato and asparagus",
                servings=2,
                tags=["healthy", "omega-3", "allergen-free"],
                ingredients=[
                    RecipeIngredient(name="salmon fillet", amount="250g", category="Protein"),
                    RecipeIngredient(name="sweet potato", amount="1 large", category="Vegetable"),
                    RecipeIngredient(name="asparagus", amount="8 spears", category="Vegetable"),
                    RecipeIngredient(name="olive oil", amount="2 tbsp", category="Oil"),
                    RecipeIngredient(name="lemon", amount="1", category="Other"),
                    RecipeIngredient(name="fresh dill", amount="2 tbsp chopped", category="Spice"),
                    RecipeIngredient(name="garlic powder", amount="1/2 tsp", category="Spice")
                ],
                instructions=[
                    "Preheat oven to 200°C/400°F",
                    "Cube sweet potato, toss with 1 tbsp olive oil and roast for 20 minutes",
                    "Season salmon with dill, garlic powder, salt and pepper",
                    "Add asparagus to the sheet pan with remaining olive oil",
                    "Place salmon on the pan and roast for 12-15 minutes until salmon flakes easily",
                    "Squeeze fresh lemon juice over salmon before serving"
                ],
                nutrition=RecipeNutrition(calories=520, protein=42, carbs=35, fat=24),
                personalization_notes="Rich in omega-3 for heart health and brain function"
            ),
            'snack': PersonalizedRecipe(
                name="Fresh Veggie Sticks with Hummus",
                description="Crunchy vegetables with creamy chickpea dip",
                servings=2,
                tags=["healthy", "vegan", "quick"],
                ingredients=[
                    RecipeIngredient(name="carrots", amount="2 medium", category="Vegetable"),
                    RecipeIngredient(name="celery", amount="3 stalks", category="Vegetable"),
                    RecipeIngredient(name="cucumber", amount="1/2", category="Vegetable"),
                    RecipeIngredient(name="hummus", amount="1/2 cup", category="Other")
                ],
                instructions=[
                    "Wash all vegetables thoroughly",
                    "Cut carrots and celery into 3-inch sticks",
                    "Slice cucumber into rounds or sticks",
                    "Arrange vegetables on a plate with hummus in the center",
                    "Serve immediately or store in fridge for up to 2 days"
                ],
                nutrition=RecipeNutrition(calories=180, protein=8, carbs=22, fat=8),
                personalization_notes="A healthy, fiber-rich snack to keep you satisfied"
            )
        }
        
        return fallbacks.get(meal_type, fallbacks['lunch'])


personalized_recipe_agent = PersonalizedRecipeAgent()


def generate_personalized_recipe(
    health_context: Dict[str, Any],
    meal_type: str = "dinner",
    preferences: str = ""
) -> Dict[str, Any]:
    """Convenience function to generate a recipe and return as dict"""
    recipe = personalized_recipe_agent.generate_recipe(health_context, meal_type, preferences)
    return recipe.model_dump()


def generate_personalized_recipes(
    health_context: Dict[str, Any],
    count: int = 3
) -> List[Dict[str, Any]]:
    """Convenience function to generate multiple recipes"""
    recipes = personalized_recipe_agent.generate_multiple_recipes(health_context, count)
    return [r.model_dump() for r in recipes]
