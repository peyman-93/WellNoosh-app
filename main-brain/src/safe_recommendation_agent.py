"""
Enhanced Safe Recommendation Agent with Safety Validation and Recipe Adaptation
Location: main-brain/src/safe_recommendation_agent.py
"""

import os
import json
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, List, TypedDict, Optional, Tuple
from datetime import datetime
import re
import traceback

# LangGraph imports
from langgraph.graph import StateGraph, END
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from dotenv import load_dotenv

load_dotenv()

# Database configuration using YOUR exact environment variable names
DB_CONFIG = {
    'host': os.getenv('SUPABASE_HOST'),
    'port': os.getenv('SUPABASE_PORT', 5432),
    'database': os.getenv('SUPABASE_DB', 'postgres'),
    'user': os.getenv('SUPABASE_USER', 'postgres'),
    'password': os.getenv('SUPABASE_PASSWORD'),
    'sslmode': os.getenv('SUPABASE_SSLMODE', 'require')
}

class GraphState(TypedDict):
    """State for the recommendation graph"""
    user_id: str
    user_profile: Optional[Dict]
    dietary_filters: Dict
    sql_query: Optional[str]
    candidate_recipes: List[Dict]
    adapted_recipes: List[Dict]
    validated_recipes: List[Dict]
    recommended_recipes: List[Dict]
    error: Optional[str]
    messages: List[str]

class RecipeSafetyValidator:
    """Validates recipe safety based on user health profile"""
    
    def __init__(self):
        self.common_allergens = {
            'milk': ['milk', 'cream', 'cheese', 'butter', 'yogurt', 'dairy', 'whey', 'casein', 'lactose'],
            'eggs': ['egg', 'eggs', 'mayonnaise', 'meringue', 'custard'],
            'fish': ['fish', 'salmon', 'tuna', 'cod', 'mackerel', 'sardine', 'anchovy'],
            'shellfish': ['shrimp', 'lobster', 'crab', 'oyster', 'clam', 'scallop', 'mussel'],
            'nuts': ['almond', 'walnut', 'pecan', 'cashew', 'pistachio', 'hazelnut', 'macadamia'],
            'peanuts': ['peanut', 'peanut butter', 'groundnut'],
            'wheat': ['wheat', 'flour', 'bread', 'pasta', 'gluten', 'barley', 'rye'],
            'soy': ['soy', 'soybean', 'tofu', 'tempeh', 'miso', 'soy sauce'],
            'sesame': ['sesame', 'tahini', 'sesame oil', 'sesame seed']
        }
        
        self.medical_restrictions = {
            'diabetes': {
                'avoid': ['sugar', 'honey', 'syrup', 'candy', 'cake', 'cookies'],
                'limit_sugar_per_serving': 10  # grams
            },
            'hypertension': {
                'avoid': ['salt', 'soy sauce', 'pickled', 'canned soup', 'processed meat'],
                'limit_sodium_per_serving': 600  # mg
            },
            'heart_disease': {
                'avoid': ['saturated fat', 'trans fat', 'fried food', 'processed meat'],
                'limit_sat_fat_per_serving': 7  # grams
            },
            'kidney_disease': {
                'avoid': ['high potassium foods', 'processed foods', 'dark sodas'],
                'limit_potassium_per_serving': 200  # mg
            }
        }
    
    def validate_recipe(self, recipe: Dict, user_profile: Dict) -> Dict:
        """Validate recipe safety and suggest modifications"""
        safety_result = {
            'is_safe': True,
            'safety_score': 100,
            'warnings': [],
            'modifications': [],
            'blocked_reasons': []
        }
        
        # Check allergens
        allergen_check = self._check_allergens(recipe, user_profile.get('allergies', []))
        if not allergen_check['safe']:
            safety_result['is_safe'] = False
            safety_result['blocked_reasons'].extend(allergen_check['reasons'])
            safety_result['modifications'].extend(allergen_check['modifications'])
        
        # Check medical conditions
        medical_check = self._check_medical_conditions(recipe, user_profile.get('medical_conditions', []))
        if not medical_check['safe']:
            safety_result['warnings'].extend(medical_check['warnings'])
            safety_result['modifications'].extend(medical_check['modifications'])
            safety_result['safety_score'] -= medical_check['severity_score']
        
        # Check nutritional bounds
        nutrition_check = self._check_nutrition_bounds(recipe, user_profile)
        if nutrition_check['warnings']:
            safety_result['warnings'].extend(nutrition_check['warnings'])
            safety_result['modifications'].extend(nutrition_check['modifications'])
        
        return safety_result
    
    def _check_allergens(self, recipe: Dict, user_allergies: List[str]) -> Dict:
        """Check for allergen conflicts"""
        result = {'safe': True, 'reasons': [], 'modifications': []}
        
        if not user_allergies:
            return result
        
        ingredients = recipe.get('ingredients', [])
        for allergen in user_allergies:
            allergen_lower = allergen.lower()
            
            # Map common allergen names to our standard format
            allergen_key = None
            for key in self.common_allergens:
                if allergen_lower in key or key in allergen_lower:
                    allergen_key = key
                    break
            
            if allergen_key and allergen_key in self.common_allergens:
                allergen_terms = self.common_allergens[allergen_key]
                
                # Check ingredients for allergen presence
                for ingredient in ingredients:
                    ingredient_name = ingredient.get('name', '').lower()
                    for term in allergen_terms:
                        if term in ingredient_name:
                            result['safe'] = False
                            result['reasons'].append(f"Contains {allergen}: {ingredient['name']}")
                            # Suggest alternatives
                            alternative = self._get_allergen_substitute(ingredient['name'], allergen_key)
                            if alternative:
                                result['modifications'].append(f"Replace {ingredient['name']} with {alternative}")
        
        return result
    
    def _check_medical_conditions(self, recipe: Dict, conditions: List[str]) -> Dict:
        """Check medical condition restrictions"""
        result = {'safe': True, 'warnings': [], 'modifications': [], 'severity_score': 0}
        
        for condition in conditions:
            condition_lower = condition.lower()
            
            if 'diabetes' in condition_lower:
                sugar_content = self._extract_numeric_value(recipe.get('sugar', '0'))
                if sugar_content > self.medical_restrictions['diabetes']['limit_sugar_per_serving']:
                    result['warnings'].append(f"High sugar content ({sugar_content}g) - not suitable for diabetes")
                    result['modifications'].append("Reduce sugar or use sugar substitute")
                    result['severity_score'] += 30
            
            elif 'hypertension' in condition_lower or 'blood pressure' in condition_lower:
                sodium_content = self._extract_numeric_value(recipe.get('sodium', '0'))
                if sodium_content > self.medical_restrictions['hypertension']['limit_sodium_per_serving']:
                    result['warnings'].append(f"High sodium content ({sodium_content}mg) - caution for hypertension")
                    result['modifications'].append("Reduce salt, avoid processed ingredients")
                    result['severity_score'] += 25
            
            elif 'heart' in condition_lower:
                # Check for high saturated fat (approximate from total fat)
                fat_content = self._extract_numeric_value(recipe.get('fat', '0'))
                if fat_content > 15:  # Conservative estimate
                    result['warnings'].append(f"High fat content ({fat_content}g) - caution for heart conditions")
                    result['modifications'].append("Use lean proteins, reduce oil/butter")
                    result['severity_score'] += 20
        
        return result
    
    def _check_nutrition_bounds(self, recipe: Dict, user_profile: Dict) -> Dict:
        """Check if nutrition fits user's goals"""
        result = {'warnings': [], 'modifications': []}
        
        daily_calorie_goal = user_profile.get('daily_calorie_goal', 2000)
        meal_calorie_target = daily_calorie_goal // 3  # Rough estimate for one meal
        
        recipe_calories = self._extract_numeric_value(recipe.get('calories', '0'))
        
        if recipe_calories > meal_calorie_target * 1.5:  # 50% over target
            result['warnings'].append(f"High calories ({recipe_calories}) for your daily goal")
            result['modifications'].append("Reduce portion size or use lighter ingredients")
        
        return result
    
    def _extract_numeric_value(self, value) -> float:
        """Extract numeric value from string, int, float, or Decimal"""
        if value is None or value == 'N/A' or value == '':
            return 0.0
        
        # Handle numeric types directly
        if isinstance(value, (int, float)):
            return float(value)
        
        # Handle Decimal type
        try:
            from decimal import Decimal
            if isinstance(value, Decimal):
                return float(value)
        except ImportError:
            pass
        
        # Handle string values
        try:
            # First try direct conversion
            return float(value)
        except (ValueError, TypeError):
            try:
                # Extract first number from string
                match = re.search(r'\d+(?:\.\d+)?', str(value))
                return float(match.group()) if match else 0.0
            except:
                return 0.0
    
    def _get_allergen_substitute(self, ingredient: str, allergen_type: str) -> str:
        """Get safe substitute for allergen ingredient"""
        substitutes = {
            'milk': {
                'milk': 'almond milk or oat milk',
                'cream': 'coconut cream',
                'cheese': 'nutritional yeast or dairy-free cheese',
                'butter': 'olive oil or vegan butter',
                'yogurt': 'coconut yogurt'
            },
            'eggs': {
                'egg': 'flax egg (1 tbsp ground flaxseed + 3 tbsp water)',
                'eggs': 'applesauce or mashed banana for baking'
            },
            'wheat': {
                'flour': 'rice flour or almond flour',
                'bread': 'gluten-free bread',
                'pasta': 'rice noodles or zucchini noodles'
            },
            'nuts': {
                'almond': 'sunflower seeds',
                'walnut': 'pumpkin seeds',
                'cashew': 'sunflower seed butter'
            }
        }
        
        ingredient_lower = ingredient.lower()
        if allergen_type in substitutes:
            for key, substitute in substitutes[allergen_type].items():
                if key in ingredient_lower:
                    return substitute
        
        return f"allergen-free alternative to {ingredient}"

class RecipeAdaptationAgent:
    """Adapts recipes based on user constraints when no direct matches found"""
    
    def __init__(self, llm):
        self.llm = llm
        self.skill_modifications = {
            'beginner': {
                'cooking_methods': ['boiling', 'steaming', 'baking', 'microwaving'],
                'avoid_methods': ['flambéing', 'deep frying', 'sous vide'],
                'max_ingredients': 8,
                'max_steps': 6
            },
            'intermediate': {
                'cooking_methods': ['sautéing', 'roasting', 'grilling', 'braising'],
                'avoid_methods': ['molecular gastronomy', 'fermentation'],
                'max_ingredients': 12,
                'max_steps': 10
            },
            'advanced': {
                'cooking_methods': ['all methods'],
                'avoid_methods': [],
                'max_ingredients': 20,
                'max_steps': 15
            }
        }
    
    def adapt_recipes(self, recipes: List[Dict], user_profile: Dict, dietary_filters: Dict) -> List[Dict]:
        """Adapt recipes to user constraints"""
        if not recipes:
            return []
        
        adapted_recipes = []
        for recipe in recipes:
            try:
                adapted_recipe = self._adapt_single_recipe(recipe, user_profile, dietary_filters)
                if adapted_recipe:
                    adapted_recipes.append(adapted_recipe)
            except Exception as e:
                print(f"Failed to adapt recipe {recipe.get('title', 'Unknown')}: {e}")
                continue
        
        return adapted_recipes
    
    def _adapt_single_recipe(self, recipe: Dict, user_profile: Dict, dietary_filters: Dict) -> Dict:
        """Adapt a single recipe"""
        adapted_recipe = recipe.copy()
        
        # Adapt portion sizes
        adapted_recipe = self._adapt_portion_sizes(adapted_recipe, user_profile)
        
        # Adapt cooking methods for skill level
        adapted_recipe = self._adapt_cooking_methods(adapted_recipe, user_profile.get('cooking_skill', 'beginner'))
        
        # Adapt ingredients for dietary restrictions
        adapted_recipe = self._adapt_ingredients(adapted_recipe, dietary_filters)
        
        # Add adaptation notes
        adapted_recipe['adaptation_notes'] = self._generate_adaptation_notes(recipe, adapted_recipe)
        
        return adapted_recipe
    
    def _adapt_portion_sizes(self, recipe: Dict, user_profile: Dict) -> Dict:
        """Adjust portion sizes based on calorie goals"""
        daily_calorie_goal = user_profile.get('daily_calorie_goal', 2000)
        current_calories = self._extract_numeric_value(recipe.get('calories', '0'))
        current_servings = recipe.get('servings', 2)
        
        if current_calories == 0:
            return recipe
        
        # Convert to float to handle Decimal types
        try:
            current_servings = float(current_servings) if current_servings else 2.0
            current_calories = float(current_calories)
            daily_calorie_goal = float(daily_calorie_goal)
        except (ValueError, TypeError):
            return recipe
        
        # Target 25-30% of daily calories per meal
        target_meal_calories = daily_calorie_goal * 0.275
        # Convert to float to handle Decimal types from PostgreSQL
        calories_per_serving = current_calories / float(current_servings) if current_servings > 0 else current_calories
        
        if calories_per_serving > target_meal_calories * 1.2:  # 20% over target
            # Reduce portion size
            scale_factor = target_meal_calories / calories_per_serving
            recipe['servings'] = max(1, int(current_servings * scale_factor))
            recipe['portion_adapted'] = True
            recipe['original_servings'] = current_servings
        
        return recipe
    
    def _adapt_cooking_methods(self, recipe: Dict, cooking_skill: str) -> Dict:
        """Simplify cooking methods based on skill level"""
        instructions = recipe.get('instructions', '')
        skill_config = self.skill_modifications.get(cooking_skill, self.skill_modifications['beginner'])
        
        # Replace complex methods with simpler ones for beginners
        if cooking_skill == 'beginner':
            replacements = {
                'sauté': 'cook in a pan with a little oil',
                'braise': 'cook slowly in liquid',
                'flambé': 'cook until alcohol evaporates',
                'julienne': 'cut into thin strips',
                'brunoise': 'dice finely'
            }
            
            for complex_term, simple_term in replacements.items():
                instructions = instructions.replace(complex_term, simple_term)
            
            recipe['instructions'] = instructions
            recipe['cooking_adapted'] = True
        
        return recipe
    
    def _adapt_ingredients(self, recipe: Dict, dietary_filters: Dict) -> Dict:
        """Adapt ingredients for dietary restrictions"""
        ingredients = recipe.get('ingredients', [])
        adapted_ingredients = []
        substitutions_made = []
        
        for ingredient in ingredients:
            ingredient_name = ingredient.get('name', '').lower()
            adapted_ingredient = ingredient.copy()
            
            # Diet style adaptations
            if dietary_filters.get('diet_style') == 'vegetarian':
                if any(meat in ingredient_name for meat in ['chicken', 'beef', 'pork', 'fish', 'turkey']):
                    # Replace with plant protein
                    if 'chicken' in ingredient_name:
                        adapted_ingredient['name'] = ingredient['name'].replace('chicken', 'tofu')
                        substitutions_made.append(f"Replaced chicken with tofu")
                    elif 'beef' in ingredient_name:
                        adapted_ingredient['name'] = ingredient['name'].replace('beef', 'mushrooms')
                        substitutions_made.append(f"Replaced beef with mushrooms")
            
            elif dietary_filters.get('diet_style') == 'vegan':
                # Replace all animal products
                vegan_subs = {
                    'milk': 'almond milk',
                    'cream': 'coconut cream',
                    'butter': 'olive oil',
                    'cheese': 'nutritional yeast',
                    'egg': 'flax egg'
                }
                
                for animal_product, vegan_alt in vegan_subs.items():
                    if animal_product in ingredient_name:
                        adapted_ingredient['name'] = ingredient['name'].replace(animal_product, vegan_alt)
                        substitutions_made.append(f"Replaced {animal_product} with {vegan_alt}")
            
            adapted_ingredients.append(adapted_ingredient)
        
        recipe['ingredients'] = adapted_ingredients
        if substitutions_made:
            recipe['substitutions_made'] = substitutions_made
            recipe['ingredients_adapted'] = True
        
        return recipe
    
    def _extract_numeric_value(self, value) -> float:
        """Extract numeric value from string, int, float, or Decimal"""
        if value is None or value == 'N/A' or value == '':
            return 0.0
        
        # Handle numeric types directly
        if isinstance(value, (int, float)):
            return float(value)
        
        # Handle Decimal type
        try:
            from decimal import Decimal
            if isinstance(value, Decimal):
                return float(value)
        except ImportError:
            pass
        
        # Handle string values
        try:
            # First try direct conversion
            return float(value)
        except (ValueError, TypeError):
            try:
                # Extract first number from string
                match = re.search(r'\d+(?:\.\d+)?', str(value))
                return float(match.group()) if match else 0.0
            except:
                return 0.0
    
    def _generate_adaptation_notes(self, original: Dict, adapted: Dict) -> List[str]:
        """Generate notes about adaptations made"""
        notes = []
        
        if adapted.get('portion_adapted'):
            notes.append(f"Portion adjusted from {adapted.get('original_servings', 'original')} to {adapted.get('servings')} servings for your calorie goals")
        
        if adapted.get('cooking_adapted'):
            notes.append("Cooking methods simplified for your skill level")
        
        if adapted.get('ingredients_adapted'):
            notes.extend(adapted.get('substitutions_made', []))
        
        return notes

class InstructionParser:
    """Parses plain text instructions into structured steps"""
    
    def __init__(self, llm):
        self.llm = llm
    
    def parse_instructions(self, instructions_text: str, recipe_title: str = "") -> List[Dict]:
        """Parse instructions text into structured steps"""
        if not instructions_text:
            return []
        
        # Try to parse existing numbered steps first
        numbered_steps = self._extract_numbered_steps(instructions_text)
        if numbered_steps:
            return self._format_steps(numbered_steps)
        
        # Use LLM to structure the instructions
        try:
            structured_steps = self._llm_structure_instructions(instructions_text, recipe_title)
            return structured_steps
        except Exception as e:
            print(f"LLM structuring failed: {e}")
            # Fallback to basic parsing
            return self._basic_instruction_parsing(instructions_text)
    
    def _extract_numbered_steps(self, text: str) -> List[str]:
        """Extract already numbered steps"""
        # Look for patterns like "1.", "Step 1:", "1)", etc.
        pattern = r'(?:^|\n)\s*(?:step\s*)?(\d+)(?:\.|:|\))\s*(.+?)(?=(?:\n\s*(?:step\s*)?\d+(?:\.|:|\))|$))'
        matches = re.findall(pattern, text, re.IGNORECASE | re.DOTALL)
        
        if matches and len(matches) >= 2:  # At least 2 steps found
            return [match[1].strip() for match in matches]
        
        return []
    
    def _llm_structure_instructions(self, instructions_text: str, recipe_title: str) -> List[Dict]:
        """Use LLM to structure instructions into clear steps"""
        prompt = f"""
        Convert these cooking instructions into clear, numbered steps.
        
        Recipe: {recipe_title}
        Instructions: {instructions_text}
        
        Return ONLY a JSON array of steps in this format:
        [
            {{"step": 1, "instruction": "Step description", "time": "estimated time", "equipment": ["needed equipment"]}},
            {{"step": 2, "instruction": "Next step", "time": "time", "equipment": ["equipment"]}}
        ]
        
        Guidelines:
        - Break down into logical, sequential steps
        - Estimate reasonable time for each step
        - List equipment/tools needed
        - Keep instructions clear and actionable
        - Maximum 12 steps
        """
        
        messages = [
            SystemMessage(content="You are a culinary expert who creates clear, step-by-step cooking instructions."),
            HumanMessage(content=prompt)
        ]
        
        response = self.llm.invoke(messages)
        
        # Extract JSON from response
        json_match = re.search(r'\[.*?\]', response.content, re.DOTALL)
        if json_match:
            try:
                steps_data = json.loads(json_match.group())
                return steps_data
            except json.JSONDecodeError:
                pass
        
        # Fallback if LLM response isn't valid JSON
        return self._basic_instruction_parsing(instructions_text)
    
    def _basic_instruction_parsing(self, instructions_text: str) -> List[Dict]:
        """Basic fallback parsing"""
        # Clean up the text first
        text = instructions_text.strip()
        
        # Pattern to match various numbered step formats
        # Matches: "1.", "1)", "1 -", "Step 1:", "Step 1.", etc.
        numbered_pattern = r'(?:^|\n)\s*(?:Step\s*)?(\d+)[\.\):\-]?\s+(.+?)(?=(?:\n\s*(?:Step\s*)?\d+[\.\):\-]?\s)|$)'
        numbered_matches = re.findall(numbered_pattern, text, re.IGNORECASE | re.DOTALL)
        
        if numbered_matches and len(numbered_matches) >= 2:  # At least 2 numbered steps
            steps = []
            seen_steps = set()  # Track which step numbers we've seen
            
            for step_num_str, instruction in numbered_matches:
                step_num = int(step_num_str)
                instruction = instruction.strip()
                
                # Skip duplicate step numbers or very short instructions
                if step_num in seen_steps or len(instruction) < 10:
                    continue
                    
                seen_steps.add(step_num)
                
                # Clean up the instruction text
                instruction = re.sub(r'\s+', ' ', instruction)  # Normalize whitespace
                instruction = instruction.rstrip('.')  # Remove trailing period
                
                steps.append({
                    "step": step_num,
                    "instruction": instruction,
                    "time": self._estimate_step_time(instruction),
                    "equipment": self._extract_equipment(instruction)
                })
            
            # Sort by step number to ensure correct order
            steps.sort(key=lambda x: x['step'])
            
            # Renumber steps to be sequential
            for i, step in enumerate(steps, 1):
                step['step'] = i
            
            return steps
        
        # Fallback: Split by line breaks first, then sentences
        lines = text.split('\n')
        instructions = []
        
        for line in lines:
            line = line.strip()
            if len(line) > 15:  # Meaningful instruction length
                # Check if this line is part of a numbered list we missed
                if re.match(r'^\d+[\.\):\-]?\s', line):
                    line = re.sub(r'^\d+[\.\):\-]?\s+', '', line)
                instructions.append(line)
        
        # If we don't have enough instructions from lines, try sentences
        if len(instructions) < 3:
            sentences = re.split(r'[.!]\s+', text)
            instructions = [s.strip() for s in sentences if s.strip() and len(s.strip()) > 15]
        
        steps = []
        for i, instruction in enumerate(instructions[:12], 1):  # Max 12 steps
            steps.append({
                "step": i,
                "instruction": instruction,
                "time": self._estimate_step_time(instruction),
                "equipment": self._extract_equipment(instruction)
            })
        
        return steps
    
    def _format_steps(self, step_texts: List[str]) -> List[Dict]:
        """Format step texts into structured format"""
        formatted_steps = []
        
        for i, step_text in enumerate(step_texts, 1):
            # Basic time estimation
            estimated_time = self._estimate_step_time(step_text)
            equipment = self._extract_equipment(step_text)
            
            formatted_steps.append({
                "step": i,
                "instruction": step_text.strip(),
                "time": estimated_time,
                "equipment": equipment
            })
        
        return formatted_steps
    
    def _estimate_step_time(self, step_text: str) -> str:
        """Estimate time for a cooking step"""
        text_lower = step_text.lower()
        
        # Look for explicit time mentions
        time_pattern = r'(\d+)\s*(minute|min|hour|hr|second|sec)'
        time_match = re.search(time_pattern, text_lower)
        if time_match:
            return f"{time_match.group(1)} {time_match.group(2)}"
        
        # Estimate based on cooking action
        if any(word in text_lower for word in ['boil', 'simmer']):
            return "10-15 min"
        elif any(word in text_lower for word in ['bake', 'roast']):
            return "20-30 min"
        elif any(word in text_lower for word in ['fry', 'sauté']):
            return "5-8 min"
        elif any(word in text_lower for word in ['prep', 'chop', 'dice', 'slice']):
            return "3-5 min"
        elif any(word in text_lower for word in ['mix', 'stir', 'combine']):
            return "2-3 min"
        else:
            return "5 min"
    
    def _extract_equipment(self, step_text: str) -> List[str]:
        """Extract equipment mentioned in step"""
        text_lower = step_text.lower()
        equipment = []
        
        equipment_terms = {
            'pan': 'pan', 'pot': 'pot', 'bowl': 'bowl', 'knife': 'knife',
            'oven': 'oven', 'stove': 'stove', 'blender': 'blender',
            'whisk': 'whisk', 'spatula': 'spatula', 'cutting board': 'cutting board',
            'baking sheet': 'baking sheet', 'measuring cup': 'measuring cup'
        }
        
        for term, equipment_name in equipment_terms.items():
            if term in text_lower:
                equipment.append(equipment_name)
        
        return list(set(equipment))  # Remove duplicates

class SafeRecommendationAgent:
    def __init__(self, llm_provider: str = None):
        """Initialize with chosen LLM provider"""
        # Test database connection first
        self._test_connection()
        self.llm = self._setup_llm(llm_provider)
        
        # Initialize sub-agents
        self.safety_validator = RecipeSafetyValidator()
        self.adaptation_agent = RecipeAdaptationAgent(self.llm)
        self.instruction_parser = InstructionParser(self.llm)
        
        self.graph = self._build_graph()
    
    def _test_connection(self):
        """Test database connection on initialization"""
        try:
            print(f"Connecting to Supabase at {DB_CONFIG['host']}...")
            conn = psycopg2.connect(**DB_CONFIG)
            cur = conn.cursor()
            
            # Test basic connection
            cur.execute("SELECT 1")
            
            # Check if we have recipes
            cur.execute("SELECT COUNT(*) FROM recipes")
            recipe_count = cur.fetchone()[0]
            
            cur.close()
            conn.close()
            print(f"Connected to Supabase! Found {recipe_count} recipes")
            
        except Exception as e:
            print(f"Connection failed: {e}")
            raise
        
    def _setup_llm(self, provider: str = None):
        """Setup LLM based on provider choice"""
        # Determine provider
        if provider is None:
            # Check which API key is available
            if os.getenv('OPENAI_API_KEY'):
                provider = 'openai'
            elif os.getenv('GOOGLE_API_KEY'):
                provider = 'gemini'
            else:
                raise ValueError(
                    "No LLM API key found!\n"
                    "Please add to your .env:\n"
                    "  OPENAI_API_KEY=sk-...\n"
                    "OR\n"
                    "  GOOGLE_API_KEY=..."
                )
        
        if provider.lower() == 'gemini':
            api_key = os.getenv('GOOGLE_API_KEY')
            if not api_key:
                raise ValueError("GOOGLE_API_KEY not found in .env")
            return ChatGoogleGenerativeAI(
                model="gemini-pro",
                google_api_key=api_key,
                temperature=0.7
            )
        else:  # Default to OpenAI
            api_key = os.getenv('OPENAI_API_KEY')
            if not api_key:
                raise ValueError("OPENAI_API_KEY not found in .env")
            return ChatOpenAI(
                model="gpt-4o-mini",
                api_key=api_key,
                temperature=0.7
            )
    
    def _build_graph(self) -> StateGraph:
        """Build the enhanced LangGraph workflow"""
        workflow = StateGraph(GraphState)
        
        # Add nodes
        workflow.add_node("load_profile", self.load_user_profile)
        workflow.add_node("create_filters", self.create_dietary_filters)
        workflow.add_node("build_query", self.build_sql_query)
        workflow.add_node("fetch_recipes", self.fetch_candidate_recipes)
        workflow.add_node("adapt_recipes", self.adapt_recipes_node)
        workflow.add_node("validate_safety", self.validate_recipe_safety)
        workflow.add_node("rank_recipes", self.llm_ranking)
        workflow.add_node("parse_instructions", self.parse_recipe_instructions)
        workflow.add_node("save_events", self.save_recommendation_events)
        workflow.add_node("handle_error", self.handle_error)
        
        # Add edges
        workflow.add_edge("load_profile", "create_filters")
        workflow.add_edge("create_filters", "build_query")
        workflow.add_edge("build_query", "fetch_recipes")
        workflow.add_edge("fetch_recipes", "adapt_recipes")
        workflow.add_edge("adapt_recipes", "validate_safety")
        workflow.add_edge("validate_safety", "rank_recipes")
        workflow.add_edge("rank_recipes", "parse_instructions")
        workflow.add_edge("parse_instructions", "save_events")
        workflow.add_edge("save_events", END)
        
        # Add conditional edges for error handling
        workflow.add_conditional_edges(
            "load_profile",
            lambda x: "handle_error" if x.get("error") else "create_filters"
        )
        
        # Set entry point
        workflow.set_entry_point("load_profile")
        
        return workflow.compile()
    
    def load_user_profile(self, state: GraphState) -> GraphState:
        """Load user health profile from Supabase"""
        try:
            conn = psycopg2.connect(**DB_CONFIG)
            cur = conn.cursor(cursor_factory=RealDictCursor)
            
            # Query matching your exact schema
            cur.execute("""
                SELECT 
                    up.user_id,
                    up.full_name,
                    up.email,
                    uhp.age,
                    uhp.gender,
                    uhp.weight_kg,
                    uhp.height_cm,
                    uhp.activity_level,
                    uhp.cooking_skill,
                    uhp.diet_style,
                    uhp.allergies,
                    uhp.medical_conditions,
                    uhp.health_goals,
                    uhp.target_weight_kg,
                    uhp.timeline,
                    uhp.bmi,
                    uhp.daily_calorie_goal
                FROM user_profiles up
                LEFT JOIN user_health_profiles uhp ON up.user_id = uhp.user_id
                WHERE up.user_id = %s
                LIMIT 1
            """, (state['user_id'],))
            
            profile = cur.fetchone()
            
            if not profile:
                state['error'] = f"User {state['user_id']} not found in user_profiles"
                cur.close()
                conn.close()
                return state
            
            # If no health profile, use defaults
            if not profile.get('cooking_skill'):
                profile['cooking_skill'] = 'beginner'
                profile['diet_style'] = 'balanced'
                profile['allergies'] = []
                profile['medical_conditions'] = []
                profile['health_goals'] = ['maintain']
                profile['daily_calorie_goal'] = 2000
            
            state['user_profile'] = dict(profile)
            state['messages'].append(f"Loaded profile for {profile.get('full_name', profile.get('email'))}")
            
            cur.close()
            conn.close()
            
        except Exception as e:
            state['error'] = f"Failed to load profile: {str(e)}"
            
        return state
    
    def create_dietary_filters(self, state: GraphState) -> GraphState:
        """Create filters based on user profile"""
        profile = state['user_profile']
        
        # Handle PostgreSQL arrays properly
        allergies = profile.get('allergies', []) or []
        medical_conditions = profile.get('medical_conditions', []) or []
        health_goals = profile.get('health_goals', ['maintain']) or ['maintain']
        
        # Determine meal period
        current_hour = datetime.now().hour
        if 5 <= current_hour < 11:
            meal_period = "breakfast"
        elif 11 <= current_hour < 16:
            meal_period = "lunch"
        elif 16 <= current_hour < 21:
            meal_period = "dinner"
        else:
            meal_period = "snack"
        
        filters = {
            'cooking_skill': profile.get('cooking_skill', 'beginner'),
            'diet_style': profile.get('diet_style', 'balanced'),
            'allergies': allergies,
            'medical_conditions': medical_conditions,
            'health_goal': health_goals[0] if health_goals else 'maintain',
            'daily_calories': profile.get('daily_calorie_goal', 2000),
            'meal_period': meal_period,
            'bmi': profile.get('bmi'),
            'activity_level': profile.get('activity_level', 'moderate')
        }
        
        state['dietary_filters'] = filters
        state['messages'].append(f"Applied filters: {filters['diet_style']} diet, {len(allergies)} allergies")
        
        return state
    
    def build_sql_query(self, state: GraphState) -> GraphState:
        """Build SQL query matching your exact schema"""
        filters = state['dietary_filters']
        
        # Base query - matching your actual schema
        query = """
            WITH recipe_data AS (
                SELECT 
                    r.id,
                    r.title,
                    r.category,
                    r.area as cuisine,
                    r.instructions,
                    r.image_url,
                    r.servings,
                    r.tags,
                    COALESCE(rn.per_serving->>'kcal', rn.per_serving->>'calories', '0') as calories,
                    COALESCE(rn.per_serving->>'protein_g', '0') as protein,
                    COALESCE(rn.per_serving->>'carbs_g', '0') as carbs,
                    COALESCE(rn.per_serving->>'fat_g', '0') as fat,
                    COALESCE(rn.per_serving->>'fiber_g', '0') as fiber,
                    COALESCE(rn.per_serving->>'sugar_g', '0') as sugar,
                    COALESCE(rn.per_serving->>'sodium_mg', '0') as sodium,
                    COUNT(DISTINCT ri.id) as ingredient_count,
                    json_agg(
                        json_build_object(
                            'ingredient_id', ri.fdc_id,
                            'amount', ri.measure_text,
                            'unit', ri.unit,
                            'notes', ri.raw,
                            'name', ri.ingredient_name,
                            'category', null
                        ) ORDER BY ri.position
                    ) FILTER (WHERE ri.id IS NOT NULL) as ingredients
                FROM recipes r
                LEFT JOIN recipe_nutrients rn ON r.id = rn.recipe_id
                LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id
                WHERE r.instructions IS NOT NULL
                AND r.instructions != ''
        """
        
        conditions = []
        
        # Apply basic allergen filters (safety validator will do more thorough check)
        if filters['allergies']:
            for allergen in filters['allergies']:
                if allergen:
                    allergen_lower = allergen.lower().replace("'", "''")
                    
                    # Map allergen to search terms
                    allergen_patterns = {
                        'milk/dairy': ['milk', 'cream', 'cheese', 'butter', 'yogurt', 'dairy'],
                        'wheat/gluten': ['wheat', 'flour', 'bread', 'pasta', 'gluten'],
                        'nuts': ['nut', 'almond', 'walnut', 'pecan', 'cashew', 'pistachio'],
                        'eggs': ['egg'],
                        'shellfish': ['shrimp', 'lobster', 'crab', 'oyster', 'clam'],
                        'fish': ['fish', 'salmon', 'tuna', 'cod'],
                        'soy': ['soy', 'tofu'],
                        'peanuts': ['peanut'],
                        'sesame': ['sesame', 'tahini']
                    }
                    
                    terms = allergen_patterns.get(allergen_lower, [allergen_lower.split('/')[0]])
                    
                    exclusion_conditions = []
                    for term in terms:
                        term_escaped = term.replace("'", "''")
                        exclusion_conditions.append(
                            f"LOWER(ri2.ingredient_name) LIKE '%{term_escaped}%' OR LOWER(ri2.raw) LIKE '%{term_escaped}%'"
                        )
                    
                    if exclusion_conditions:
                        conditions.append(f"""
                            NOT EXISTS (
                                SELECT 1 FROM recipe_ingredients ri2 
                                WHERE ri2.recipe_id = r.id 
                                AND ({' OR '.join(exclusion_conditions)})
                            )
                        """)
        
        # Medical condition filters (basic - safety validator will do thorough check)
        if 'High Blood Pressure' in filters['medical_conditions'] or 'Hypertension' in filters['medical_conditions']:
            conditions.append("CAST(COALESCE(rn.per_serving->>'sodium_mg', '0') AS FLOAT) < 600")
        
        if 'Diabetes' in filters['medical_conditions']:
            conditions.append("CAST(COALESCE(rn.per_serving->>'sugar_g', '0') AS FLOAT) < 10")
        
        # Apply conditions
        if conditions:
            query += " AND " + " AND ".join(conditions)
        
        # Complete query
        query += """
                GROUP BY r.id, r.title, r.category, r.area, r.instructions, 
                         r.image_url, r.servings, r.tags, rn.per_serving
            )
            SELECT * FROM recipe_data
            ORDER BY RANDOM()
            LIMIT 50
        """
        
        state['sql_query'] = query
        state['messages'].append("Built safety-first query")
        
        return state
    
    def fetch_candidate_recipes(self, state: GraphState) -> GraphState:
        """Fetch recipes matching filters with better error handling"""
        try:
            conn = psycopg2.connect(**DB_CONFIG)
            cur = conn.cursor(cursor_factory=RealDictCursor)
            
            cur.execute(state['sql_query'])
            recipes = cur.fetchall()
            
            state['candidate_recipes'] = [dict(r) for r in recipes] if recipes else []
            state['messages'].append(f"Found {len(state['candidate_recipes'])} candidate recipes")
            
            cur.close()
            conn.close()
            
        except Exception as e:
            error_msg = f"Database error: {str(e)}"
            state['error'] = error_msg
            state['candidate_recipes'] = []
            print(f"SQL Error: {error_msg}")
            
        return state
    
    def adapt_recipes_node(self, state: GraphState) -> GraphState:
        """Adapt recipes using the adaptation agent"""
        try:
            if not state['candidate_recipes']:
                # Try to get some general recipes for adaptation
                conn = psycopg2.connect(**DB_CONFIG)
                cur = conn.cursor(cursor_factory=RealDictCursor)
                
                cur.execute("""
                    SELECT 
                        r.id, r.title, r.category, r.area as cuisine,
                        r.image_url, r.instructions, r.servings,
                        COALESCE(rn.per_serving->>'kcal', '0') as calories,
                        COALESCE(rn.per_serving->>'protein_g', '0') as protein,
                        COALESCE(rn.per_serving->>'carbs_g', '0') as carbs,
                        COALESCE(rn.per_serving->>'fat_g', '0') as fat,
                        json_agg(
                            json_build_object(
                                'ingredient_id', ri.fdc_id,
                                'amount', ri.measure_text,
                                'unit', ri.unit,
                                'name', ri.ingredient_name,
                                'category', null
                            ) ORDER BY ri.position
                        ) FILTER (WHERE ri.id IS NOT NULL) as ingredients
                    FROM recipes r
                    LEFT JOIN recipe_nutrients rn ON r.id = rn.recipe_id
                    LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id
                    WHERE r.instructions IS NOT NULL
                    AND r.instructions != ''
                    GROUP BY r.id, r.title, r.category, r.area, r.image_url, 
                             r.instructions, r.servings, rn.per_serving
                    ORDER BY RANDOM()
                    LIMIT 10
                """)
                
                general_recipes = cur.fetchall()
                state['candidate_recipes'] = [dict(r) for r in general_recipes] if general_recipes else []
                cur.close()
                conn.close()
            
            # Adapt the recipes
            adapted_recipes = self.adaptation_agent.adapt_recipes(
                state['candidate_recipes'], 
                state['user_profile'], 
                state['dietary_filters']
            )
            
            state['adapted_recipes'] = adapted_recipes
            state['messages'].append(f"Adapted {len(adapted_recipes)} recipes to user constraints")
            
        except Exception as e:
            state['adapted_recipes'] = state['candidate_recipes']  # Fallback
            state['messages'].append(f"Recipe adaptation failed: {str(e)}")
            
        return state
    
    def validate_recipe_safety(self, state: GraphState) -> GraphState:
        """Validate recipe safety using the safety validator"""
        try:
            recipes_to_validate = state.get('adapted_recipes', state.get('candidate_recipes', []))
            validated_recipes = []
            safety_warnings = []
            
            for recipe in recipes_to_validate:
                safety_result = self.safety_validator.validate_recipe(recipe, state['user_profile'])
                
                if safety_result['is_safe'] or safety_result['safety_score'] >= 70:
                    # Add safety information to recipe
                    recipe['safety_validated'] = True
                    recipe['safety_score'] = safety_result['safety_score']
                    recipe['safety_warnings'] = safety_result['warnings']
                    recipe['safety_modifications'] = safety_result['modifications']
                    
                    validated_recipes.append(recipe)
                else:
                    safety_warnings.extend(safety_result['blocked_reasons'])
            
            state['validated_recipes'] = validated_recipes
            
            if safety_warnings:
                state['messages'].append(f"Safety validation blocked {len(recipes_to_validate) - len(validated_recipes)} recipes")
            else:
                state['messages'].append(f"All {len(validated_recipes)} recipes passed safety validation")
                
        except Exception as e:
            # Fallback: use recipes without validation
            state['validated_recipes'] = state.get('adapted_recipes', state.get('candidate_recipes', []))
            state['messages'].append(f"Safety validation failed: {str(e)}")
            
        return state
    
    def llm_ranking(self, state: GraphState) -> GraphState:
        """Use LLM to rank and select best recipes"""
        recipes_to_rank = state.get('validated_recipes', [])
        
        if not recipes_to_rank:
            state['recommended_recipes'] = []
            state['messages'].append("No safe recipes found for ranking")
            return state
        
        prompt_template = """
        You are a nutritionist recommending meals.
        
        User Profile:
        - Health Goal: {health_goal}
        - Cooking Skill: {cooking_skill}
        - Diet Style: {diet_style}
        - Allergies: {allergies}
        - Medical Conditions: {medical_conditions}
        - Meal Period: {meal_period}
        
        Select TOP 5 recipes from candidates.
        Return JSON array:
        [{{"id": "recipe_id", "reason": "brief reason"}}]
        
        Candidates:
        {candidates}
        """
        
        candidates_str = json.dumps([{
            "id": str(r['id']),
            "title": r['title'],
            "calories": r.get('calories', 'N/A'),
            "category": r.get('category', 'N/A'),
            "safety_score": r.get('safety_score', 100),
            "adaptations": r.get('adaptation_notes', [])
        } for r in recipes_to_rank[:20]], indent=2)
        
        messages = [
            SystemMessage(content="You are a helpful nutritionist."),
            HumanMessage(content=prompt_template.format(
                health_goal=state['dietary_filters'].get('health_goal', 'maintain'),
                cooking_skill=state['dietary_filters'].get('cooking_skill', 'beginner'),
                diet_style=state['dietary_filters'].get('diet_style', 'balanced'),
                allergies=state['dietary_filters'].get('allergies', []),
                medical_conditions=state['dietary_filters'].get('medical_conditions', []),
                meal_period=state['dietary_filters'].get('meal_period', 'any'),
                candidates=candidates_str
            ))
        ]
        
        try:
            response = self.llm.invoke(messages)
            
            # Parse response
            json_match = re.search(r'\[.*?\]', response.content, re.DOTALL)
            if json_match:
                recommendations = json.loads(json_match.group())
                
                recommended_recipes = []
                for rec in recommendations[:5]:
                    recipe = next((r for r in recipes_to_rank 
                                 if str(r['id']) == str(rec['id'])), None)
                    if recipe:
                        recipe['recommendation_reason'] = rec.get('reason', 'Matches preferences')
                        recommended_recipes.append(recipe)
                
                state['recommended_recipes'] = recommended_recipes
                state['messages'].append(f"LLM selected {len(recommended_recipes)} recipes")
            else:
                # Fallback: use top 5
                state['recommended_recipes'] = recipes_to_rank[:5]
                for rec in state['recommended_recipes']:
                    rec['recommendation_reason'] = "Matches dietary preferences"
                state['messages'].append("Using top 5 recipes")
                
        except Exception as e:
            # Fallback on error
            state['recommended_recipes'] = recipes_to_rank[:5]
            for rec in state['recommended_recipes']:
                rec['recommendation_reason'] = "Selected based on filters"
            state['messages'].append(f"LLM ranking skipped: {str(e)}")
            
        return state
    
    def parse_recipe_instructions(self, state: GraphState) -> GraphState:
        """Parse instructions into structured steps"""
        try:
            for recipe in state['recommended_recipes']:
                instructions_text = recipe.get('instructions', '')
                if instructions_text:
                    structured_steps = self.instruction_parser.parse_instructions(
                        instructions_text, 
                        recipe.get('title', '')
                    )
                    recipe['structured_instructions'] = structured_steps
                    recipe['original_instructions'] = instructions_text
            
            state['messages'].append("Parsed instructions into structured steps")
            
        except Exception as e:
            state['messages'].append(f"Instruction parsing failed: {str(e)}")
            
        return state
    
    def save_recommendation_events(self, state: GraphState) -> GraphState:
        """Save recommendation events"""
        if not state['recommended_recipes']:
            return state
            
        try:
            conn = psycopg2.connect(**DB_CONFIG)
            cur = conn.cursor()
            
            for recipe in state['recommended_recipes']:
                cur.execute("""
                    INSERT INTO recipe_events (user_id, recipe_id, event, created_at)
                    VALUES (%s, %s, %s, NOW())
                    ON CONFLICT DO NOTHING
                """, (state['user_id'], recipe['id'], 'view'))
            
            conn.commit()
            cur.close()
            conn.close()
            
            state['messages'].append("Saved events")
            
        except Exception as e:
            state['messages'].append(f"Failed to save events: {str(e)}")
            
        return state
    
    def handle_error(self, state: GraphState) -> GraphState:
        """Handle errors"""
        print(f"Error: {state['error']}")
        return state
    
    def get_recommendations(self, user_id: str) -> Dict:
        """Get recommendations for a user"""
        initial_state = {
            "user_id": user_id,
            "user_profile": None,
            "dietary_filters": {},
            "sql_query": None,
            "candidate_recipes": [],
            "adapted_recipes": [],
            "validated_recipes": [],
            "recommended_recipes": [],
            "error": None,
            "messages": []
        }
        
        try:
            final_state = self.graph.invoke(initial_state)
        except Exception as e:
            print(f"Graph execution error: {str(e)}")
            print(f"Traceback: {traceback.format_exc()}")
            final_state = initial_state
            final_state['error'] = str(e)
        
        return {
            "user_id": user_id,
            "recommendations": [
                self._build_recipe_with_nutrition(r)
                for r in final_state.get('recommended_recipes', [])
            ],
            "filters_applied": final_state.get('dietary_filters', {}),
            "messages": final_state.get('messages', []),
            "error": final_state.get('error')
        }
    
    def _safe_extract_nutrition(self, value, value_type: str = 'float', default=0):
        """Safely extract and convert nutrition values"""
        if value is None or value == '' or value == 'N/A':
            return default
            
        # Handle numeric types directly
        if isinstance(value, (int, float)):
            if value_type == 'int':
                return int(value)
            return float(value)
        
        # Handle Decimal type
        try:
            from decimal import Decimal
            if isinstance(value, Decimal):
                if value_type == 'int':
                    return int(float(value))
                return float(value)
        except ImportError:
            pass
        
        # Handle string values
        try:
            # Remove any non-numeric characters except decimal point
            import re
            clean_value = re.sub(r'[^\d.]', '', str(value))
            if not clean_value:
                return default
                
            numeric_value = float(clean_value)
            if value_type == 'int':
                return int(numeric_value)
            return numeric_value
        except (ValueError, TypeError):
            return default
    
    def _calculate_estimated_nutrition(self, recipe: Dict) -> Dict:
        """Calculate estimated nutrition when data is missing or unrealistic"""
        # Try ingredient-based calculation first
        ingredient_nutrition = self._calculate_from_ingredients(recipe)
        if ingredient_nutrition:
            return ingredient_nutrition
        
        # Fallback to category-based estimates
        return self._calculate_from_category(recipe)
    
    def _calculate_from_ingredients(self, recipe: Dict) -> Dict:
        """Calculate nutrition based on actual ingredients and their portions"""
        ingredients = recipe.get('ingredients', [])
        if not ingredients:
            return None
            
        # Handle string format ingredients (comma-separated)
        if isinstance(ingredients, str):
            ingredient_parts = [part.strip() for part in ingredients.split(',')]
            ingredients = []
            for part in ingredient_parts:
                # Simple parsing: assume format "ingredient amount"
                words = part.split()
                if len(words) >= 2:
                    amount = words[-1]  # Last word is usually amount
                    name = ' '.join(words[:-1])  # Everything else is name
                    ingredients.append({'name': name, 'amount': amount})
                elif len(words) == 1:
                    ingredients.append({'name': words[0], 'amount': '100g'})  # Default amount
        
        # Ingredient nutrition database (calories per 100g, protein, carbs, fat)
        ingredient_db = {
            # Proteins
            'chicken': {'cal': 239, 'protein': 27.3, 'carbs': 0, 'fat': 13.6},
            'beef': {'cal': 250, 'protein': 26, 'carbs': 0, 'fat': 15},
            'pork': {'cal': 242, 'protein': 27.3, 'carbs': 0, 'fat': 13.9},
            'salmon': {'cal': 208, 'protein': 20.4, 'carbs': 0, 'fat': 13.4},
            'fish': {'cal': 206, 'protein': 22.1, 'carbs': 0, 'fat': 12.4},
            'egg': {'cal': 155, 'protein': 13.3, 'carbs': 1.1, 'fat': 10.6},
            'tofu': {'cal': 76, 'protein': 8.1, 'carbs': 1.9, 'fat': 4.8},
            
            # Carbohydrates
            'rice': {'cal': 130, 'protein': 2.7, 'carbs': 28, 'fat': 0.3},
            'pasta': {'cal': 131, 'protein': 5, 'carbs': 25, 'fat': 1.1},
            'bread': {'cal': 265, 'protein': 9, 'carbs': 49, 'fat': 3.2},
            'potato': {'cal': 77, 'protein': 2, 'carbs': 17, 'fat': 0.1},
            'quinoa': {'cal': 120, 'protein': 4.4, 'carbs': 22, 'fat': 1.9},
            'flour': {'cal': 364, 'protein': 10.3, 'carbs': 76, 'fat': 1},
            
            # Vegetables
            'tomato': {'cal': 18, 'protein': 0.9, 'carbs': 3.9, 'fat': 0.2},
            'onion': {'cal': 40, 'protein': 1.1, 'carbs': 9.3, 'fat': 0.1},
            'garlic': {'cal': 149, 'protein': 6.4, 'carbs': 33, 'fat': 0.5},
            'bell pepper': {'cal': 31, 'protein': 1, 'carbs': 7, 'fat': 0.3},
            'carrot': {'cal': 41, 'protein': 0.9, 'carbs': 10, 'fat': 0.2},
            'broccoli': {'cal': 34, 'protein': 2.8, 'carbs': 7, 'fat': 0.4},
            
            # Fats & Dairy
            'olive oil': {'cal': 884, 'protein': 0, 'carbs': 0, 'fat': 100},
            'oil': {'cal': 884, 'protein': 0, 'carbs': 0, 'fat': 100},
            'butter': {'cal': 717, 'protein': 0.9, 'carbs': 0.1, 'fat': 81.1},
            'cheese': {'cal': 402, 'protein': 25, 'carbs': 1.3, 'fat': 33},
            'milk': {'cal': 42, 'protein': 3.4, 'carbs': 5, 'fat': 1},
            
            # Common seasonings (minimal calories)
            'salt': {'cal': 0, 'protein': 0, 'carbs': 0, 'fat': 0},
            'pepper': {'cal': 251, 'protein': 10.4, 'carbs': 64, 'fat': 3.3},
            'herbs': {'cal': 25, 'protein': 2, 'carbs': 5, 'fat': 0.5},
            'spice': {'cal': 25, 'protein': 2, 'carbs': 5, 'fat': 0.5},
        }
        
        total_nutrition = {'calories': 0, 'protein': 0, 'carbs': 0, 'fat': 0}
        servings = max(recipe.get('servings', 2), 1)
        
        for ingredient in ingredients:
            name = ingredient.get('name', '').lower()
            amount_text = ingredient.get('amount', '1')
            
            # Find matching ingredient in database
            nutrition_data = None
            for key, data in ingredient_db.items():
                if key in name or name in key:
                    nutrition_data = data
                    break
            
            if not nutrition_data:
                continue  # Skip unknown ingredients
            
            # Extract portion size (rough estimates)
            portion_grams = self._estimate_portion_grams(amount_text, name)
            
            # Calculate nutrition for this ingredient
            multiplier = portion_grams / 100  # Database is per 100g
            total_nutrition['calories'] += nutrition_data['cal'] * multiplier
            total_nutrition['protein'] += nutrition_data['protein'] * multiplier
            total_nutrition['carbs'] += nutrition_data['carbs'] * multiplier
            total_nutrition['fat'] += nutrition_data['fat'] * multiplier
        
        # If we got meaningful data, return per-serving values
        if total_nutrition['calories'] > 50:  # Minimum threshold
            # Convert servings to float to handle Decimal types from PostgreSQL
            servings_float = float(servings) if servings else 1.0
            return {
                'calories': int(total_nutrition['calories'] / servings_float),
                'protein': round(total_nutrition['protein'] / servings_float, 1),
                'carbs': round(total_nutrition['carbs'] / servings_float, 1),
                'fat': round(total_nutrition['fat'] / servings_float, 1),
                'fiber': round(total_nutrition['carbs'] / servings_float * 0.12, 1),
                'sugar': round(total_nutrition['carbs'] / servings_float * 0.15, 1),
                'sodium': round(total_nutrition['calories'] / servings_float * 1.2, 0)
            }
        
        return None  # Fall back to category-based estimation
    
    def _estimate_portion_grams(self, amount_text: str, ingredient_name: str) -> float:
        """Estimate ingredient portion in grams"""
        import re
        
        # Extract numbers from amount text
        numbers = re.findall(r'\d+(?:\.\d+)?', amount_text)
        if not numbers:
            return 100  # Default assumption
        
        quantity = float(numbers[0])
        amount_lower = amount_text.lower()
        
        # Convert common measurements to grams
        if 'cup' in amount_lower:
            # Different ingredients have different cup weights
            if any(grain in ingredient_name for grain in ['rice', 'quinoa', 'pasta']):
                return quantity * 200  # ~200g per cup of grains
            elif 'flour' in ingredient_name:
                return quantity * 125  # ~125g per cup of flour
            elif any(liquid in ingredient_name for liquid in ['milk', 'water', 'oil']):
                return quantity * 240  # ~240g per cup of liquid
            else:
                return quantity * 150  # General assumption
        
        elif any(unit in amount_lower for unit in ['tbsp', 'tablespoon']):
            return quantity * 15  # ~15g per tablespoon
        
        elif any(unit in amount_lower for unit in ['tsp', 'teaspoon']):
            return quantity * 5   # ~5g per teaspoon
        
        elif any(unit in amount_lower for unit in ['lb', 'pound']):
            return quantity * 454  # 454g per pound
        
        elif any(unit in amount_lower for unit in ['oz', 'ounce']):
            return quantity * 28   # ~28g per ounce
        
        elif 'g' in amount_lower:
            return quantity  # Already in grams
        
        elif 'kg' in amount_lower:
            return quantity * 1000  # Convert kg to grams
        
        elif 'ml' in amount_lower:
            return quantity  # Assume 1ml = 1g for liquids
        
        elif 'whole' in amount_lower or 'piece' in amount_lower:
            # Estimate whole item weights
            if any(item in ingredient_name for item in ['chicken', 'beef', 'pork']):
                return quantity * 200  # ~200g per serving of meat
            elif 'egg' in ingredient_name:
                return quantity * 50   # ~50g per egg
            elif any(veg in ingredient_name for veg in ['onion', 'tomato']):
                return quantity * 150  # ~150g per medium vegetable
            else:
                return quantity * 100  # General assumption
        
        else:
            # If no unit specified, assume it's a reasonable portion
            return quantity * 50
    
    def _calculate_from_category(self, recipe: Dict) -> Dict:
        """Fallback nutrition estimates based on recipe category"""
        category = recipe.get('category', '').lower()
        cuisine = recipe.get('cuisine', '').lower()
        
        # Base estimates per serving
        base_estimates = {
            'breakfast': {'calories': 320, 'protein': 12, 'carbs': 45, 'fat': 10},
            'lunch': {'calories': 450, 'protein': 18, 'carbs': 55, 'fat': 15},
            'dinner': {'calories': 520, 'protein': 25, 'carbs': 60, 'fat': 18},
            'snack': {'calories': 180, 'protein': 6, 'carbs': 25, 'fat': 7},
            'dessert': {'calories': 280, 'protein': 4, 'carbs': 45, 'fat': 12},
        }
        
        estimates = base_estimates.get(category, base_estimates['dinner'])
        
        # Cuisine adjustments
        cuisine_multipliers = {
            'italian': 1.1, 'indian': 1.0, 'chinese': 0.95, 'mexican': 1.05,
            'american': 1.15, 'french': 1.2, 'mediterranean': 0.9, 
            'japanese': 0.85, 'thai': 0.95
        }
        
        multiplier = cuisine_multipliers.get(cuisine, 1.0)
        
        return {
            'calories': int(estimates['calories'] * multiplier),
            'protein': round(estimates['protein'] * multiplier, 1),
            'carbs': round(estimates['carbs'] * multiplier, 1),
            'fat': round(estimates['fat'] * multiplier, 1),
            'fiber': round(estimates['carbs'] * multiplier * 0.12, 1),
            'sugar': round(estimates['carbs'] * multiplier * 0.15, 1),
            'sodium': round(estimates['calories'] * multiplier * 1.2, 0)
        }
    
    def _build_recipe_with_nutrition(self, r: Dict) -> Dict:
        """Build recipe dict with accurate nutrition data"""
        # Always use agent's intelligent nutrition estimation instead of table data
        estimated = self._calculate_estimated_nutrition(r)
        calories = estimated['calories']
        protein = estimated['protein']
        carbs = estimated['carbs']
        fat = estimated['fat']
        fiber = estimated['fiber']
        sugar = estimated['sugar']
        sodium = estimated['sodium']
        
        return {
            "id": str(r['id']),
            "title": r['title'],
            "image_url": r.get('image_url'),
            "category": r.get('category'),
            "cuisine": r.get('cuisine'),
            "instructions": r.get('instructions'),
            "structured_instructions": r.get('structured_instructions', []),
            "servings": r.get('servings'),
            "tags": r.get('tags') if r.get('tags') is not None else [],
            "calories": str(calories),
            "protein": str(protein),
            "carbs": str(carbs),
            "fat": str(fat),
            "fiber": str(fiber),
            "sugar": str(sugar),
            "sodium": str(sodium),
            "ingredients": r.get('ingredients', []),
            "recommendation_reason": r.get('recommendation_reason', 'Matches your preferences'),
            "safety_validated": r.get('safety_validated', False),
            "safety_score": r.get('safety_score', 100),
            "safety_warnings": r.get('safety_warnings', []),
            "safety_modifications": r.get('safety_modifications', []),
            "adaptation_notes": r.get('adaptation_notes', []),
            "portion_adapted": r.get('portion_adapted', False),
            "cooking_adapted": r.get('cooking_adapted', False),
            "ingredients_adapted": r.get('ingredients_adapted', False)
        }
    
    def record_feedback(self, user_id: str, recipe_id: str, event_type: str) -> bool:
        """Record user feedback"""
        valid_events = {'view', 'like', 'save', 'hide'}
        if event_type not in valid_events:
            print(f"Invalid event: {event_type}")
            return False
            
        try:
            conn = psycopg2.connect(**DB_CONFIG)
            cur = conn.cursor()
            
            cur.execute("""
                INSERT INTO recipe_events (user_id, recipe_id, event, created_at)
                VALUES (%s, %s, %s, NOW())
            """, (user_id, recipe_id, event_type))
            
            conn.commit()
            cur.close()
            conn.close()
            return True
            
        except Exception as e:
            print(f"Failed to record: {e}")
            return False


if __name__ == "__main__":
    print("Enhanced Safe Recommendation Agent")
    print("=" * 50)
    
    try:
        agent = SafeRecommendationAgent()
        
        test_user_id = input("\nEnter user ID (UUID) to test: ").strip()
        
        if test_user_id:
            print(f"\nGetting recommendations for: {test_user_id}")
            
            result = agent.get_recommendations(test_user_id)
            
            if result['error']:
                print(f"\nError: {result['error']}")
            else:
                print(f"\nProcess:")
                for msg in result['messages']:
                    print(f"   {msg}")
                
                if result['recommendations']:
                    print(f"\nRecommendations ({len(result['recommendations'])} recipes):")
                    for i, rec in enumerate(result['recommendations'], 1):
                        print(f"\n{i}. {rec['title']}")
                        if rec.get('calories'):
                            print(f"   {rec['calories']} cal | {rec.get('protein', 'N/A')}g protein")
                        print(f"   {rec['recommendation_reason']}")
                        
                        # Show safety info
                        if rec.get('safety_validated'):
                            print(f"   Safety Score: {rec.get('safety_score', 100)}/100")
                            if rec.get('safety_warnings'):
                                print(f"   Warnings: {', '.join(rec['safety_warnings'])}")
                        
                        # Show adaptations
                        if rec.get('adaptation_notes'):
                            print(f"   Adaptations: {', '.join(rec['adaptation_notes'])}")
                        
                        # Show structured instructions
                        if rec.get('structured_instructions'):
                            print(f"   Steps: {len(rec['structured_instructions'])} structured steps")
                else:
                    print("\nNo recipes recommended")
    except Exception as e:
        print(f"\nFailed: {e}")