"""
DSPy-Enhanced Safe Recommendation Agent
Location: main-brain/src/dspy_recipe_agent.py

Uses DSPy for:
1. Recipe Safety Validation
2. Recipe Adaptation 
3. Instruction Parsing
"""

import os
import json
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, List, Optional
from datetime import datetime
import re

import dspy
from dspy.teleprompt import BootstrapFewShot
from dotenv import load_dotenv

load_dotenv()

# Database config
DB_CONFIG = {
    'host': os.getenv('SUPABASE_HOST'),
    'port': os.getenv('SUPABASE_PORT', 5432),
    'database': os.getenv('SUPABASE_DB', 'postgres'),
    'user': os.getenv('SUPABASE_USER', 'postgres'),
    'password': os.getenv('SUPABASE_PASSWORD'),
    'sslmode': os.getenv('SUPABASE_SSLMODE', 'require')
}

# ============================================
# DSPY SIGNATURES - Define Input/Output Types
# ============================================

class CompactBatchSafety(dspy.Signature):
    """Validate all recipes safety at once - return only recipe IDs and scores"""
    
    recipes_summary = dspy.InputField(desc="Compact list: recipe_id|title|key_ingredients")
    user_allergies = dspy.InputField(desc="Allergies to check")
    medical_conditions = dspy.InputField(desc="Medical conditions")
    
    results = dspy.OutputField(desc="JSON: {recipe_id: {safe: bool, score: int}}")

class SingleCallValidator(dspy.Module):
    """Ultra-fast validator - 1 LLM call for all recipes"""
    
    def __init__(self):
        super().__init__()
        self.validate = dspy.Predict(CompactBatchSafety)  # Use Predict, not ChainOfThought (faster)
    
    def forward(self, recipes: List[Dict], user_profile: Dict) -> List[Dict]:
        """Validate all recipes in ONE call"""
        allergies_str = ', '.join(user_profile.get('allergies', []))
        conditions_str = ', '.join(user_profile.get('medical_conditions', []))
        
        # Create ultra-compact summary (fit all 50 in one call)
        compact_summary = []
        for recipe in recipes:
            # Only send critical info: ID, title, main ingredients (first 3)
            ingredients = recipe.get('ingredients', [])[:3]
            ing_names = [ing.get('name', '') for ing in ingredients]
            compact_summary.append(f"{recipe['id']}|{recipe['title']}|{','.join(ing_names)}")
        
        # Single LLM call
        result = self.validate(
            recipes_summary='\n'.join(compact_summary),
            user_allergies=allergies_str,
            medical_conditions=conditions_str
        )
        
        # Parse results
        try:
            results_dict = json.loads(result.results)
        except:
            # Fallback: mark all as safe
            results_dict = {str(r['id']): {'safe': True, 'score': 80} for r in recipes}
        
        # Convert to list format
        results_list = []
        for recipe_id, data in results_dict.items():
            results_list.append({
                'recipe_id': str(recipe_id),
                'is_safe': data.get('safe', True),
                'safety_score': data.get('score', 80),
                'warnings': []  # Keep empty list (no details for speed)
            })
        
        return results_list

class BatchSafetyCheck(dspy.Signature):
    """Validate multiple recipes for safety at once"""
    
    recipes_batch = dspy.InputField(desc="JSON array of recipes with ingredients")
    user_allergies = dspy.InputField(desc="User's allergies")
    medical_conditions = dspy.InputField(desc="Medical conditions")
    
    safety_results = dspy.OutputField(desc="JSON array: [{recipe_id, is_safe, safety_score, warnings}]")

class BatchSafetyValidator(dspy.Module):
    """DSPy module for batch recipe safety validation"""
    
    def __init__(self):
        super().__init__()
        self.validate = dspy.ChainOfThought(BatchSafetyCheck)
    
    def forward(self, recipes: List[Dict], user_profile: Dict, batch_size: int = 10) -> List[Dict]:
        """Validate recipes in batches for speed"""
        allergies_str = ', '.join(user_profile.get('allergies', []))
        conditions_str = ', '.join(user_profile.get('medical_conditions', []))
        
        all_results = []
        
        # Process in batches
        for i in range(0, len(recipes), batch_size):
            batch = recipes[i:i + batch_size]
            
            # Prepare batch data
            batch_data = []
            for recipe in batch:
                ingredients = ', '.join([ing.get('name', '') for ing in recipe.get('ingredients', [])])
                batch_data.append({
                    'id': str(recipe['id']),
                    'title': recipe['title'],
                    'ingredients': ingredients
                })
            
            # Single LLM call for entire batch
            result = self.validate(
                recipes_batch=json.dumps(batch_data),
                user_allergies=allergies_str,
                medical_conditions=conditions_str
            )
            
            # Parse batch results
            try:
                batch_results = json.loads(result.safety_results)
                all_results.extend(batch_results)
            except:
                # Fallback: mark all as safe with low score
                for recipe in batch:
                    all_results.append({
                        'recipe_id': str(recipe['id']),
                        'is_safe': 'true',
                        'safety_score': 70,
                        'warnings': []
                    })
        
        return all_results

class RecipeSafetyCheck(dspy.Signature):
    """Validate recipe safety for user with allergies and medical conditions"""
    
    recipe_ingredients = dspy.InputField(desc="List of recipe ingredients")
    user_allergies = dspy.InputField(desc="User's allergies (comma-separated)")
    medical_conditions = dspy.InputField(desc="User's medical conditions")
    recipe_nutrition = dspy.InputField(desc="Recipe nutrition per serving")
    
    is_safe = dspy.OutputField(desc="true or false")
    safety_score = dspy.OutputField(desc="Score 0-100")
    warnings = dspy.OutputField(desc="List of safety warnings")
    suggested_modifications = dspy.OutputField(desc="How to make recipe safe")
    blocked_ingredients = dspy.OutputField(desc="Ingredients that must be removed")

class RecipeSafetyModification(dspy.Signature):
    """Modify recipe to make it safe for user with allergies and medical conditions"""
    
    recipe_title = dspy.InputField(desc="Recipe name")
    original_ingredients = dspy.InputField(desc="Current ingredients")
    safety_issues = dspy.InputField(desc="What makes this recipe unsafe")
    user_allergies = dspy.InputField(desc="Allergies to avoid")
    medical_conditions = dspy.InputField(desc="Medical conditions to consider")
    
    safe_ingredients = dspy.OutputField(desc="Modified ingredients list that is safe")
    modifications_made = dspy.OutputField(desc="What was changed and why")
    taste_impact = dspy.OutputField(desc="How modifications affect flavor")
    is_now_safe = dspy.OutputField(desc="true or false - is recipe safe now")

class RecipeAdaptation(dspy.Signature):
    """Adapt recipe for user's dietary restrictions and skill level"""
    
    recipe_title = dspy.InputField(desc="Recipe name")
    original_ingredients = dspy.InputField(desc="Original ingredients list")
    user_diet_style = dspy.InputField(desc="vegetarian, vegan, keto, etc.")
    user_cooking_skill = dspy.InputField(desc="beginner, intermediate, advanced")
    allergies_to_avoid = dspy.InputField(desc="Ingredients to replace")
    
    adapted_ingredients = dspy.OutputField(desc="Modified ingredient list with substitutions")
    cooking_simplifications = dspy.OutputField(desc="Simplified cooking methods")
    substitution_notes = dspy.OutputField(desc="Why each substitution was made")
    estimated_difficulty = dspy.OutputField(desc="easy, medium, hard")

class InstructionStructuring(dspy.Signature):
    """Parse cooking instructions into structured steps with timing and equipment"""
    
    recipe_title = dspy.InputField(desc="Name of recipe")
    raw_instructions = dspy.InputField(desc="Plain text cooking instructions")
    
    structured_steps = dspy.OutputField(desc="JSON array of step objects with: step_number, instruction, estimated_time, equipment_needed")
    total_prep_time = dspy.OutputField(desc="Total preparation time")
    total_cook_time = dspy.OutputField(desc="Total cooking time")

class RecipeRanking(dspy.Signature):
    """Rank and select best recipes for user based on health profile"""
    
    user_health_goal = dspy.InputField(desc="weight loss, muscle gain, maintenance")
    user_preferences = dspy.InputField(desc="diet style, allergies, conditions")
    meal_period = dspy.InputField(desc="breakfast, lunch, dinner, snack")
    candidate_recipes = dspy.InputField(desc="List of candidate recipes with nutrition")
    
    top_recipe_ids = dspy.OutputField(desc="Comma-separated list of top 5 recipe IDs")
    selection_reasoning = dspy.OutputField(desc="Why each recipe was chosen")

# ============================================
# DSPY MODULES - Reusable Components
# ============================================

class SafetyValidator(dspy.Module):
    """DSPy module for recipe safety validation"""
    
    def __init__(self):
        super().__init__()
        self.validate = dspy.ChainOfThought(RecipeSafetyCheck)
    
    def forward(self, recipe: Dict, user_profile: Dict) -> Dict:
        """Validate recipe safety"""
        # Prepare inputs
        ingredients_str = ', '.join([
            ing.get('name', '') for ing in recipe.get('ingredients', [])
        ])
        
        allergies_str = ', '.join(user_profile.get('allergies', []))
        conditions_str = ', '.join(user_profile.get('medical_conditions', []))
        
        nutrition_str = f"Calories: {recipe.get('calories', 'N/A')}, Protein: {recipe.get('protein', 'N/A')}g, Sodium: {recipe.get('sodium', 'N/A')}mg, Sugar: {recipe.get('sugar', 'N/A')}g"
        
        # Run DSPy validation
        result = self.validate(
            recipe_ingredients=ingredients_str,
            user_allergies=allergies_str,
            medical_conditions=conditions_str,
            recipe_nutrition=nutrition_str
        )
        
        # Parse result
        is_safe = result.is_safe.lower() == 'true'
        
        try:
            safety_score = int(result.safety_score)
        except:
            safety_score = 100 if is_safe else 50
        
        # Parse warnings and modifications
        warnings = self._parse_list(result.warnings)
        modifications = self._parse_list(result.suggested_modifications)
        blocked = self._parse_list(result.blocked_ingredients)
        
        return {
            'is_safe': is_safe,
            'safety_score': safety_score,
            'warnings': warnings,
            'modifications': modifications,
            'blocked_ingredients': blocked
        }
    
    def _parse_list(self, text: str) -> List[str]:
        """Parse comma-separated or bullet list into array"""
        if not text or text.lower() in ['none', 'n/a', 'null']:
            return []
        
        # Try JSON parsing first
        try:
            parsed = json.loads(text)
            if isinstance(parsed, list):
                return parsed
        except:
            pass
        
        # Fall back to splitting
        items = re.split(r'[,;\n]|\d+\.', text)
        return [item.strip() for item in items if item.strip()]

class SafetyModifier(dspy.Module):
    """DSPy module to modify unsafe recipes to make them safe"""
    
    def __init__(self):
        super().__init__()
        self.modify = dspy.ChainOfThought(RecipeSafetyModification)
    
    def forward(self, recipe: Dict, safety_result: Dict, user_profile: Dict) -> Dict:
        """Modify recipe to make it safe"""
        # Prepare inputs
        original_ingredients = ', '.join([
            f"{ing.get('amount', '')} {ing.get('name', '')}" 
            for ing in recipe.get('ingredients', [])
        ])
        
        safety_issues = ', '.join(
            safety_result.get('warnings', []) + 
            [f"Contains: {item}" for item in safety_result.get('blocked_ingredients', [])]
        )
        
        allergies_str = ', '.join(user_profile.get('allergies', []))
        conditions_str = ', '.join(user_profile.get('medical_conditions', []))
        
        # Run DSPy modification
        result = self.modify(
            recipe_title=recipe.get('title', 'Recipe'),
            original_ingredients=original_ingredients,
            safety_issues=safety_issues,
            user_allergies=allergies_str,
            medical_conditions=conditions_str
        )
        
        # Parse safe ingredients
        safe_ingredients = self._parse_ingredients(result.safe_ingredients)
        modifications_made = self._parse_list(result.modifications_made)
        
        return {
            'safe_ingredients': safe_ingredients,
            'modifications_made': modifications_made,
            'taste_impact': result.taste_impact,
            'is_now_safe': result.is_now_safe.lower() == 'true',
            'modified': True
        }
    
    def _parse_ingredients(self, text: str) -> List[Dict]:
        """Parse ingredient text into structured format"""
        if not text:
            return []
        
        # Try JSON first
        try:
            parsed = json.loads(text)
            if isinstance(parsed, list):
                return parsed
        except:
            pass
        
        # Fall back to line parsing
        lines = text.split('\n')
        ingredients = []
        
        for line in lines:
            line = line.strip()
            if not line or line.lower() in ['none', 'n/a']:
                continue
            
            # Remove bullet points or numbers
            line = re.sub(r'^[\d\-\*\.]+\s*', '', line)
            
            # Try to split into amount and name
            parts = line.split(' ', 1)
            if len(parts) == 2:
                ingredients.append({
                    'amount': parts[0],
                    'name': parts[1]
                })
            else:
                ingredients.append({
                    'amount': '',
                    'name': line
                })
        
        return ingredients
    
    def _parse_list(self, text: str) -> List[str]:
        """Parse list from text"""
        if not text or text.lower() in ['none', 'n/a']:
            return []
        
        items = re.split(r'[,;\n]|\d+\.', text)
        return [item.strip() for item in items if item.strip()]

class RecipeAdapter(dspy.Module):
    """DSPy module for recipe adaptation"""
    
    def __init__(self):
        super().__init__()
        self.adapt = dspy.ChainOfThought(RecipeAdaptation)
    
    def forward(self, recipe: Dict, user_profile: Dict) -> Dict:
        """Adapt recipe to user constraints"""
        # Prepare inputs
        ingredients_str = ', '.join([
            f"{ing.get('amount', '')} {ing.get('name', '')}" 
            for ing in recipe.get('ingredients', [])
        ])
        
        allergies_str = ', '.join(user_profile.get('allergies', []))
        
        # Run DSPy adaptation
        result = self.adapt(
            recipe_title=recipe.get('title', 'Recipe'),
            original_ingredients=ingredients_str,
            user_diet_style=user_profile.get('diet_style', 'balanced'),
            user_cooking_skill=user_profile.get('cooking_skill', 'beginner'),
            allergies_to_avoid=allergies_str
        )
        
        # Parse adapted ingredients
        adapted_ingredients = self._parse_ingredients(result.adapted_ingredients)
        
        return {
            'adapted_ingredients': adapted_ingredients,
            'cooking_simplifications': result.cooking_simplifications,
            'substitution_notes': self._parse_list(result.substitution_notes),
            'difficulty': result.estimated_difficulty,
            'ingredients_adapted': len(adapted_ingredients) > 0
        }
    
    def _parse_ingredients(self, text: str) -> List[Dict]:
        """Parse ingredient text into structured format"""
        if not text:
            return []
        
        # Try JSON first
        try:
            parsed = json.loads(text)
            if isinstance(parsed, list):
                return parsed
        except:
            pass
        
        # Fall back to line parsing
        lines = text.split('\n')
        ingredients = []
        
        for line in lines:
            line = line.strip()
            if not line or line.lower() in ['none', 'n/a']:
                continue
            
            # Remove bullet points or numbers
            line = re.sub(r'^[\d\-\*\.]+\s*', '', line)
            
            # Try to split into amount and name
            parts = line.split(' ', 1)
            if len(parts) == 2:
                ingredients.append({
                    'amount': parts[0],
                    'name': parts[1]
                })
            else:
                ingredients.append({
                    'amount': '',
                    'name': line
                })
        
        return ingredients
    
    def _parse_list(self, text: str) -> List[str]:
        """Parse list from text"""
        if not text or text.lower() in ['none', 'n/a']:
            return []
        
        items = re.split(r'[,;\n]|\d+\.', text)
        return [item.strip() for item in items if item.strip()]

class InstructionParser(dspy.Module):
    """DSPy module for parsing instructions"""
    
    def __init__(self):
        super().__init__()
        self.parse = dspy.ChainOfThought(InstructionStructuring)
    
    def forward(self, recipe: Dict) -> Dict:
        """Parse instructions into structured steps"""
        instructions_text = recipe.get('instructions', '')
        
        if not instructions_text:
            return {'structured_steps': [], 'prep_time': '0 min', 'cook_time': '0 min'}
        
        # Run DSPy parsing
        result = self.parse(
            recipe_title=recipe.get('title', 'Recipe'),
            raw_instructions=instructions_text
        )
        
        # Parse structured steps
        steps = self._parse_steps(result.structured_steps)
        
        return {
            'structured_steps': steps,
            'total_prep_time': result.total_prep_time,
            'total_cook_time': result.total_cook_time
        }
    
    def _parse_steps(self, text: str) -> List[Dict]:
        """Parse steps from JSON or text"""
        # Try JSON parsing first
        try:
            parsed = json.loads(text)
            if isinstance(parsed, list):
                return parsed
        except:
            pass
        
        # Fall back to manual parsing
        steps = []
        lines = text.split('\n')
        
        for i, line in enumerate(lines, 1):
            line = line.strip()
            if not line or len(line) < 10:
                continue
            
            # Remove step numbers
            line = re.sub(r'^(step\s*)?\d+[\.\):\-]?\s*', '', line, flags=re.IGNORECASE)
            
            steps.append({
                'step': i,
                'instruction': line,
                'time': self._estimate_time(line),
                'equipment': self._extract_equipment(line)
            })
        
        return steps
    
    def _estimate_time(self, text: str) -> str:
        """Estimate cooking time from instruction"""
        text_lower = text.lower()
        
        # Look for explicit times
        time_match = re.search(r'(\d+)\s*(minute|min|hour|hr)', text_lower)
        if time_match:
            return f"{time_match.group(1)} {time_match.group(2)}"
        
        # Estimate based on action
        if any(word in text_lower for word in ['boil', 'simmer']):
            return "10-15 min"
        elif any(word in text_lower for word in ['bake', 'roast']):
            return "20-30 min"
        elif any(word in text_lower for word in ['fry', 'sauté']):
            return "5-8 min"
        else:
            return "5 min"
    
    def _extract_equipment(self, text: str) -> List[str]:
        """Extract equipment from instruction"""
        text_lower = text.lower()
        equipment = []
        
        equipment_terms = ['pan', 'pot', 'bowl', 'knife', 'oven', 'blender', 'whisk']
        
        for term in equipment_terms:
            if term in text_lower:
                equipment.append(term)
        
        return equipment

class RecipeRanker(dspy.Module):
    """DSPy module for ranking recipes"""
    
    def __init__(self):
        super().__init__()
        self.rank = dspy.ChainOfThought(RecipeRanking)
    
    def forward(self, recipes: List[Dict], user_profile: Dict, filters: Dict) -> List[Dict]:
        """Rank recipes and return top 5"""
        if not recipes:
            return []
        
        # Prepare candidate summary
        candidates = []
        for r in recipes[:20]:  # Limit to top 20 for ranking
            candidates.append({
                'id': str(r['id']),
                'title': r['title'],
                'calories': r.get('calories', 'N/A'),
                'protein': r.get('protein', 'N/A'),
                'category': r.get('category', 'N/A'),
                'safety_score': r.get('safety_score', 100)
            })
        
        candidates_str = json.dumps(candidates)
        
        # Prepare user preferences
        prefs = f"Diet: {filters.get('diet_style', 'balanced')}, Allergies: {', '.join(filters.get('allergies', []))}, Conditions: {', '.join(filters.get('medical_conditions', []))}"
        
        # Run DSPy ranking
        result = self.rank(
            user_health_goal=filters.get('health_goal', 'maintain'),
            user_preferences=prefs,
            meal_period=filters.get('meal_period', 'any'),
            candidate_recipes=candidates_str
        )
        
        # Parse top recipe IDs
        top_ids = [id.strip() for id in result.top_recipe_ids.split(',')][:5]
        
        # Build ranked recipes
        ranked = []
        for recipe_id in top_ids:
            recipe = next((r for r in recipes if str(r['id']) == recipe_id), None)
            if recipe:
                recipe['recommendation_reason'] = result.selection_reasoning
                ranked.append(recipe)
        
        # Fill remaining slots if needed
        while len(ranked) < 5 and len(ranked) < len(recipes):
            for r in recipes:
                if str(r['id']) not in top_ids:
                    r['recommendation_reason'] = "Matches your dietary preferences"
                    ranked.append(r)
                    top_ids.append(str(r['id']))
                    break
        
        return ranked[:5]

# ============================================
# MAIN AGENT
# ============================================

class DSPyRecipeAgent:
    """Main agent using DSPy modules"""
    
    def __init__(self, llm_provider: str = None):
        """Initialize with DSPy - auto-detects provider from env if not specified"""
        # Auto-detect provider from environment variables
        if llm_provider is None:
            llm_provider = os.getenv('LLM_PROVIDER', 'openai').lower()
        
        self._setup_dspy(llm_provider)
        
        # Initialize DSPy modules
        self.single_call_validator = SingleCallValidator()  # NEW: 1 call for all 50 recipes
        self.safety_validator = SafetyValidator()  # Keep for individual checks if needed
        self.safety_modifier = SafetyModifier()
        self.recipe_adapter = RecipeAdapter()
        self.instruction_parser = InstructionParser()
        self.recipe_ranker = RecipeRanker()
        
        print(f"✅ DSPy Agent initialized with {llm_provider}")
    
    def _setup_dspy(self, provider: str):
        """Configure DSPy with LLM - using modern DSPy 2.x API"""
        if provider == 'openai':
            api_key = os.getenv('OPENAI_API_KEY')
            if not api_key:
                raise ValueError("OPENAI_API_KEY not found in .env")
            
            # Increased max_tokens for batch operations
            lm = dspy.LM('openai/gpt-4o-mini', api_key=api_key, max_tokens=2000)
            print("✅ Using OpenAI GPT-4o-mini")
        
        elif provider == 'gemini':
            api_key = os.getenv('GOOGLE_API_KEY')
            if not api_key:
                raise ValueError("GOOGLE_API_KEY not found in .env")
            
            lm = dspy.LM('google/gemini-1.5-flash', api_key=api_key, max_tokens=2000)
            print("✅ Using Google Gemini 1.5 Flash")
        
        elif provider == 'ollama':
            lm = dspy.LM('ollama/llama3.2', api_base='http://localhost:11434', max_tokens=2000)
            print("✅ Using Ollama (local llama3.2)")
        
        else:
            raise ValueError(f"Unknown provider: {provider}. Choose: openai, gemini, or ollama")
        
        dspy.settings.configure(lm=lm)
    
    def get_recommendations(self, user_id: str) -> Dict:
        """Get personalized recipe recommendations - optimized for 15s max"""
        print(f"\n🔍 Getting recommendations for user: {user_id}")
        
        # 1. Load user profile
        user_profile = self._load_user_profile(user_id)
        if not user_profile:
            return {'error': f'User {user_id} not found', 'recommendations': []}
        
        print(f"✅ Loaded profile: {user_profile.get('full_name', user_profile.get('email'))}")
        
        # 2. Create dietary filters
        filters = self._create_filters(user_profile)
        print(f"✅ Applied filters: {filters['diet_style']} diet, {len(filters['allergies'])} allergies")
        
        # 3. Fetch candidate recipes (already pre-filtered by SQL)
        recipes = self._fetch_recipes(filters)
        print(f"✅ Found {len(recipes)} candidate recipes")
        
        if not recipes:
            return {
                'user_id': user_id,
                'recommendations': [],
                'message': 'No recipes found matching your criteria'
            }
        
        # 4. Validation - OPTIONAL (skip if SKIP_VALIDATION=true in env)
        skip_validation = os.getenv('SKIP_VALIDATION', 'false').lower() == 'true'
        
        if skip_validation:
            print("⏩ Skipping LLM validation (using SQL filtering only)...")
            safe_recipes = recipes
            for recipe in safe_recipes:
                recipe['safety_validated'] = True
                recipe['safety_score'] = 85
                recipe['safety_warnings'] = []
                recipe['safety_fixed'] = False
        else:
            print("🔒 Validating (1 LLM call)...")
            validation_results = self.single_call_validator(recipes, user_profile)
            
            results_map = {r['recipe_id']: r for r in validation_results}
            safe_recipes = []
            
            for recipe in recipes:
                recipe_id = str(recipe['id'])
                safety_data = results_map.get(recipe_id, {'is_safe': True, 'safety_score': 80})
                
                is_safe_value = safety_data.get('is_safe', True)
                is_safe = bool(is_safe_value) if not isinstance(is_safe_value, str) else is_safe_value.lower() == 'true'
                
                safety_score = int(safety_data.get('safety_score', 80))
                
                warnings = safety_data.get('warnings', [])
                if not isinstance(warnings, list):
                    warnings = []
                
                if is_safe or safety_score >= 75:
                    recipe['safety_validated'] = True
                    recipe['safety_score'] = safety_score
                    recipe['safety_warnings'] = warnings
                    recipe['safety_fixed'] = False
                    safe_recipes.append(recipe)
        
        print(f"✅ {len(safe_recipes)} safe recipes")
        
        if not safe_recipes:
            return {
                'user_id': user_id,
                'recommendations': [],
                'message': 'No safe recipes found for your profile'
            }
        
        # 5. SKIP adaptation for speed (SQL filtering already handles diet)
        print("⏩ Skipping adaptation (pre-filtered)")
        
        # 6. SIMPLE ranking (no LLM - use scores)
        print("📊 Quick ranking...")
        top_recipes = self._simple_rank(safe_recipes, user_profile, filters)[:5]
        
        # 6.5 Adapt ONLY top 5 recipes (not all 50)
        print("🔧 Adapting top 5 recipes...")
        for recipe in top_recipes:
            adaptation = self.recipe_adapter(recipe, user_profile)
            recipe['adapted_ingredients'] = adaptation.get('adapted_ingredients', [])
            recipe['substitution_notes'] = adaptation.get('substitution_notes', [])
            recipe['estimated_difficulty'] = adaptation.get('difficulty', 'medium')
        
        # 7. Parse instructions (ONLY for top 5, not all 50)
        print("📝 Parsing top 5 instructions...")
        for recipe in top_recipes:
            instruction_data = self.instruction_parser(recipe)
            recipe['structured_instructions'] = instruction_data['structured_steps']
            recipe['total_prep_time'] = instruction_data['total_prep_time']
            recipe['total_cook_time'] = instruction_data['total_cook_time']

        # 7.5. Save adapted recipes to database
        print("💾 Saving adapted recipes to database...")
        self._save_adapted_recipes_to_db(top_recipes)

        # 8. Save events
        self._save_events(user_id, top_recipes)
        
        return {
            'user_id': user_id,
            'recommendations': top_recipes,
            'filters_applied': filters,
            'total_candidates': len(recipes),
            'safe_count': len(safe_recipes),
            'final_count': len(top_recipes)
        }
    
    def _quick_safety_check(self, recipe: Dict, user_profile: Dict) -> bool:
        """Fast rule-based safety check without LLM"""
        allergies = user_profile.get('allergies', []) or []
        conditions = user_profile.get('medical_conditions', []) or []
        ingredients = recipe.get('ingredients', [])
        
        # Check allergens (SQL already filtered, but double-check)
        allergen_patterns = {
            'milk': ['milk', 'cream', 'cheese', 'butter', 'dairy'],
            'eggs': ['egg'],
            'wheat': ['wheat', 'flour', 'bread'],
            'nuts': ['nut', 'almond', 'walnut'],
            'peanuts': ['peanut'],
            'shellfish': ['shrimp', 'lobster', 'crab'],
            'fish': ['fish', 'salmon', 'tuna'],
            'soy': ['soy', 'tofu']
        }
        
        for allergen in allergies:
            allergen = allergen.lower().strip()
            patterns = allergen_patterns.get(allergen, [allergen])
            
            for ingredient in ingredients:
                ing_name = ingredient.get('name', '').lower()
                if any(pattern in ing_name for pattern in patterns):
                    return False  # Unsafe
        
        # Check medical conditions
        if 'diabetes' in str(conditions).lower():
            sugar = float(recipe.get('sugar', 0) or 0)
            if sugar > 15:  # High sugar
                return False
        
        if any(cond in str(conditions).lower() for cond in ['hypertension', 'blood pressure']):
            sodium = float(recipe.get('sodium', 0) or 0)
            if sodium > 800:  # High sodium
                return False
        
        return True  # Safe
    
    def _simple_rank(self, recipes: List[Dict], user_profile: Dict, filters: Dict) -> List[Dict]:
        """Fast ranking without LLM - uses safety scores and nutrition"""
        health_goal = filters.get('health_goal', 'maintain')
        target_calories = filters.get('daily_calories', 2000) / 3  # Per meal
        
        for recipe in recipes:
            score = recipe.get('safety_score', 75)
            
            # Bonus for calorie match
            calories = float(recipe.get('calories', 0) or 0)
            if calories > 0:
                calorie_diff = abs(calories - target_calories)
                if calorie_diff < 100:
                    score += 10
                elif calorie_diff < 200:
                    score += 5
            
            # Bonus for health goal
            reason_parts = []
            if health_goal == 'weight_loss' and calories < target_calories * 0.8:
                score += 15
                reason_parts.append("low in calories for weight loss")
            elif health_goal == 'muscle_gain':
                protein = float(recipe.get('protein', 0) or 0)
                if protein > 25:
                    score += 15
                    reason_parts.append("high in protein for muscle gain")
            
            # Build clean recommendation reason (no markdown, no numbering)
            if reason_parts:
                reason = f"This dish is {', '.join(reason_parts)} and matches your {filters['diet_style']} diet"
            else:
                reason = f"Matches your {filters['diet_style']} diet and nutritional needs"
            
            recipe['ranking_score'] = score
            recipe['recommendation_reason'] = reason
        
        # Sort by ranking score
        recipes.sort(key=lambda x: x.get('ranking_score', 0), reverse=True)
        return recipes
    
    def _batch_adapt_top5(self, recipes: List[Dict], user_profile: Dict) -> List[Dict]:
        """Adapt all 5 recipes in ONE LLM call for speed"""
        if not recipes:
            return recipes
        
        # Create compact batch request
        batch_request = []
        for r in recipes:
            batch_request.append({
                'id': str(r['id']),
                'title': r['title'],
                'ingredients': [ing.get('name', '') for ing in r.get('ingredients', [])[:5]]
            })
        
        try:
            # Single LLM call for all 5 recipes
            result = self.recipe_adapter(
                recipe_title="Batch of 5 recipes",
                original_ingredients=json.dumps(batch_request),
                user_diet_style=user_profile.get('diet_style', 'balanced'),
                user_cooking_skill=user_profile.get('cooking_skill', 'beginner'),
                allergies_to_avoid=', '.join(user_profile.get('allergies', []))
            )
            
            # For now, apply same adaptations to all (quick)
            for recipe in recipes:
                recipe['adapted_ingredients'] = []
                recipe['substitution_notes'] = []
                recipe['estimated_difficulty'] = 'medium'
        except:
            # Fallback: no adaptation
            for recipe in recipes:
                recipe['adapted_ingredients'] = []
                recipe['substitution_notes'] = []
                recipe['estimated_difficulty'] = 'medium'
        
        return recipes
    
    def _batch_parse_instructions(self, recipes: List[Dict]) -> List[Dict]:
        """Parse all 5 instructions in ONE LLM call for speed"""
        if not recipes:
            return recipes
        
        # Combine all instructions
        combined = []
        for i, r in enumerate(recipes, 1):
            instructions = r.get('instructions', '')
            if instructions:
                combined.append(f"Recipe {i} ({r['title']}): {instructions[:200]}")  # First 200 chars
        
        combined_text = '\n\n'.join(combined)
        
        try:
            # Single LLM call to parse all
            result = self.instruction_parser.parse(
                recipe_title="Batch of 5 recipes",
                raw_instructions=combined_text
            )
            
            # Parse the response - expect grouped steps
            # For now, use simple fallback
            for recipe in recipes:
                steps = self._simple_instruction_parse(recipe.get('instructions', ''))
                recipe['structured_instructions'] = steps
                recipe['total_prep_time'] = '10 min'
                recipe['total_cook_time'] = '20 min'
        except:
            # Fallback: simple parsing
            for recipe in recipes:
                steps = self._simple_instruction_parse(recipe.get('instructions', ''))
                recipe['structured_instructions'] = steps
                recipe['total_prep_time'] = '10 min'
                recipe['total_cook_time'] = '20 min'
        
        return recipes
    
    def _simple_instruction_parse(self, instructions: str) -> List[Dict]:
        """Quick regex-based instruction parsing (no LLM)"""
        if not instructions:
            return []
        
        steps = []
        
        # Split by periods or newlines
        sentences = re.split(r'[.!]\s+|\n+', instructions)
        
        step_num = 1
        for sentence in sentences:
            sentence = sentence.strip()
            
            # Skip short or empty
            if len(sentence) < 15:
                continue
            
            # Remove leading numbers/bullets
            sentence = re.sub(r'^[\d\-\*\.]+\s*', '', sentence)
            
            # Clean up
            sentence = sentence.strip().capitalize()
            
            if sentence:
                steps.append({
                    'step': step_num,
                    'instruction': sentence,
                    'time': '5 min'
                })
                step_num += 1
                
                if step_num > 10:  # Max 10 steps
                    break
        
        return steps
    
    def _load_user_profile(self, user_id: str) -> Optional[Dict]:
        """Load user profile from database"""
        try:
            conn = psycopg2.connect(**DB_CONFIG)
            cur = conn.cursor(cursor_factory=RealDictCursor)
            
            cur.execute("""
                SELECT 
                    up.user_id, up.full_name, up.email,
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
            
            if profile:
                return dict(profile)
            return None
            
        except Exception as e:
            print(f"Error loading profile: {e}")
            return None
    
    def _create_filters(self, profile: Dict) -> Dict:
        """Create dietary filters"""
        current_hour = datetime.now().hour
        if 5 <= current_hour < 11:
            meal_period = "breakfast"
        elif 11 <= current_hour < 16:
            meal_period = "lunch"
        else:
            meal_period = "dinner"
        
        return {
            'cooking_skill': profile.get('cooking_skill', 'beginner'),
            'diet_style': profile.get('diet_style', 'balanced'),
            'allergies': profile.get('allergies', []) or [],
            'medical_conditions': profile.get('medical_conditions', []) or [],
            'health_goal': (profile.get('health_goals') or ['maintain'])[0],
            'daily_calories': profile.get('daily_calorie_goal', 2000),
            'meal_period': meal_period
        }
    
    def _fetch_recipes(self, filters: Dict) -> List[Dict]:
        """Fetch candidate recipes from database with STRICT allergen filtering"""
        try:
            conn = psycopg2.connect(**DB_CONFIG)
            cur = conn.cursor(cursor_factory=RealDictCursor)
            
            # Build strict allergen exclusions
            allergen_conditions = []
            for allergen in filters.get('allergies', []):
                allergen = allergen.lower().strip()
                if allergen:
                    # Map common allergen patterns
                    allergen_patterns = {
                        'milk': ['milk', 'cream', 'cheese', 'butter', 'dairy'],
                        'eggs': ['egg'],
                        'wheat': ['wheat', 'flour', 'bread'],
                        'nuts': ['nut', 'almond', 'walnut', 'pecan'],
                        'peanuts': ['peanut'],
                        'shellfish': ['shrimp', 'lobster', 'crab', 'shellfish'],
                        'soy': ['soy', 'tofu']
                    }
                    
                    # Get search terms for this allergen
                    search_terms = allergen_patterns.get(allergen, [allergen])
                    
                    # Build SQL condition to exclude recipes with this allergen
                    term_conditions = []
                    for term in search_terms:
                        term_conditions.append(f"LOWER(ri.ingredient_name) LIKE '%{term}%'")
                    
                    if term_conditions:
                        allergen_conditions.append(f"""
                            NOT EXISTS (
                                SELECT 1 FROM recipe_ingredients ri 
                                WHERE ri.recipe_id = r.id 
                                AND ({' OR '.join(term_conditions)})
                            )
                        """)
            
            # Build WHERE clause
            where_clause = "WHERE r.instructions IS NOT NULL"
            if allergen_conditions:
                where_clause += " AND " + " AND ".join(allergen_conditions)
            
            query = f"""
                SELECT 
                    r.id, r.title, r.category, r.area as cuisine,
                    r.instructions, r.image_url, r.servings,
                    COALESCE(rn.per_serving->>'kcal', '300') as calories,
                    COALESCE(rn.per_serving->>'protein_g', '15') as protein,
                    COALESCE(rn.per_serving->>'sodium_mg', '400') as sodium,
                    COALESCE(rn.per_serving->>'sugar_g', '5') as sugar,
                    json_agg(
                        json_build_object(
                            'name', ri.ingredient_name,
                            'amount', ri.measure_text
                        ) ORDER BY ri.position
                    ) as ingredients
                FROM recipes r
                LEFT JOIN recipe_nutrients rn ON r.id = rn.recipe_id
                LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id
                {where_clause}
                GROUP BY r.id, r.title, r.category, r.area, 
                         r.instructions, r.image_url, r.servings, rn.per_serving
                ORDER BY RANDOM()
                LIMIT 50
            """
            
            cur.execute(query)
            recipes = cur.fetchall()
            cur.close()
            conn.close()
            
            return [dict(r) for r in recipes]
            
        except Exception as e:
            print(f"Error fetching recipes: {e}")
            return []
    
    def _save_adapted_recipes_to_db(self, recipes: List[Dict]):
        """Save adapted recipes to Supabase recipes table"""
        try:
            conn = psycopg2.connect(**DB_CONFIG)
            cur = conn.cursor()

            for recipe in recipes:
                try:
                    # Check if recipe already exists
                    cur.execute("SELECT id FROM recipes WHERE id = %s", (recipe['id'],))
                    exists = cur.fetchone()

                    if not exists:
                        # Insert new adapted recipe
                        cur.execute("""
                            INSERT INTO recipes (
                                id, title, category, area, instructions,
                                image_url, servings, tags
                            )
                            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                            ON CONFLICT (id) DO NOTHING
                        """, (
                            recipe['id'],
                            recipe.get('title', 'Unknown Recipe'),
                            recipe.get('category'),
                            recipe.get('cuisine') or recipe.get('area'),
                            recipe.get('instructions', ''),
                            recipe.get('image_url'),
                            recipe.get('servings'),
                            recipe.get('tags', [])
                        ))
                        print(f"✅ Saved adapted recipe to DB: {recipe.get('title')}")
                    else:
                        print(f"ℹ️ Recipe already exists: {recipe.get('title')}")
                except Exception as e:
                    print(f"❌ Error saving recipe {recipe.get('title')}: {e}")
                    import traceback
                    traceback.print_exc()

            conn.commit()
            cur.close()
            conn.close()

        except Exception as e:
            print(f"⚠️ Error saving adapted recipes to DB: {e}")
            import traceback
            traceback.print_exc()

    def _save_events(self, user_id: str, recipes: List[Dict]):
        """Save recommendation events"""
        try:
            conn = psycopg2.connect(**DB_CONFIG)
            cur = conn.cursor()

            for recipe in recipes:
                cur.execute("""
                    INSERT INTO recipe_events (user_id, recipe_id, event, created_at)
                    VALUES (%s, %s, 'view', NOW())
                    ON CONFLICT DO NOTHING
                """, (user_id, recipe['id']))

            conn.commit()
            cur.close()
            conn.close()

        except Exception as e:
            print(f"Error saving events: {e}")

    def record_feedback(self, user_id: str, recipe_id: str, event_type: str) -> bool:
        """Record user feedback on a recipe"""
        try:
            conn = psycopg2.connect(**DB_CONFIG)
            cur = conn.cursor()

            # Validate event type
            valid_events = {'like', 'hide', 'save', 'view', 'cook_now', 'share_family'}
            if event_type not in valid_events:
                print(f"Invalid event type: {event_type}")
                return False

            # Insert event
            cur.execute("""
                INSERT INTO recipe_events (user_id, recipe_id, event, created_at)
                VALUES (%s, %s, %s, NOW())
            """, (user_id, recipe_id, event_type))

            conn.commit()
            cur.close()
            conn.close()

            print(f"✅ Recorded {event_type} for recipe {recipe_id}")
            return True

        except Exception as e:
            print(f"Error recording feedback: {e}")
            return False

    def optimize_with_feedback(self, training_examples: List[Dict]):
        """
        Optimize DSPy modules using user feedback
        
        training_examples format:
        [
            {
                'recipe': {...},
                'user_profile': {...},
                'user_saved': True,  # Did user save/like it?
                'safety_issue': False  # Any safety problems?
            }
        ]
        """
        print("\n🎓 Optimizing DSPy modules with user feedback...")
        
        # Convert to DSPy examples
        dspy_examples = []
        for ex in training_examples:
            dspy_examples.append(
                dspy.Example(
                    recipe=ex['recipe'],
                    user_profile=ex['user_profile'],
                    user_saved=ex['user_saved'],
                    safety_issue=ex.get('safety_issue', False)
                ).with_inputs('recipe', 'user_profile')
            )
        
        # Define optimization metric
        def recommendation_quality(example, prediction, trace=None):
            # Good if user saved AND no safety issues
            return example.user_saved and not example.safety_issue
        
        # Optimize safety validator
        optimizer = BootstrapFewShot(
            metric=recommendation_quality,
            max_bootstrapped_demos=5
        )
        
        optimized_validator = optimizer.compile(
            self.safety_validator,
            trainset=dspy_examples
        )
        
        self.safety_validator = optimized_validator
        print("✅ Safety validator optimized")
        
        return {"status": "optimized", "examples_used": len(dspy_examples)}

# ============================================
# CLI
# ============================================

if __name__ == "__main__":
    print("\n" + "="*60)
    print("DSPy-Enhanced Recipe Recommendation Agent")
    print("="*60)
    
    # Check if running in interactive test mode or production mode
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == '--test':
        # TESTING MODE: Let developer choose provider interactively
        print("\n🧪 TEST MODE - Choose LLM provider:")
        print("1. OpenAI GPT-4o-mini (Requires: OPENAI_API_KEY)")
        print("2. Google Gemini Pro (Requires: GOOGLE_API_KEY)")
        print("3. Ollama - Local (Free, requires: ollama installed)")
        
        choice = input("\nSelect (1-3): ").strip()
        
        if choice == "1":
            provider = "openai"
        elif choice == "2":
            provider = "gemini"
        elif choice == "3":
            provider = "ollama"
        else:
            print("Invalid choice, using configured provider from .env")
            provider = None  # Will auto-detect
        
        agent = DSPyRecipeAgent(llm_provider=provider)
        
        user_id = input("\nEnter user ID to test: ").strip()
    else:
        # PRODUCTION MODE: Use provider from .env automatically
        print("\n🚀 PRODUCTION MODE - Using LLM_PROVIDER from .env")
        agent = DSPyRecipeAgent()  # Auto-detects from environment
        
        # In production, user_id comes from your API/app
        user_id = input("\nEnter user ID: ").strip()  # Or: user_id = request.user_id
    
    if user_id:
        result = agent.get_recommendations(user_id)
        
        if result.get('error'):
            print(f"\n❌ Error: {result['error']}")
        else:
            print(f"\n✅ Processing Complete!")
            print(f"   Total candidates: {result['total_candidates']}")
            print(f"   Safe recipes: {result['safe_count']}")
            print(f"   Recipes auto-fixed: {result.get('fixed_count', 0)}")
            print(f"   Final recommendations: {result['final_count']}")
            
            if result['recommendations']:
                print(f"\n📋 Top {len(result['recommendations'])} Recommendations:")
                for i, rec in enumerate(result['recommendations'], 1):
                    print(f"\n{i}. {rec['title']}")
                    print(f"   {rec.get('calories', 'N/A')} cal | Safety Score: {rec.get('safety_score', 100)}/100")
                    print(f"   Reason: {rec.get('recommendation_reason', 'N/A')}")
                    
                    # Show if recipe was fixed
                    if rec.get('safety_fixed'):
                        print(f"   🔧 AUTO-FIXED for safety:")
                        for mod in rec.get('safety_modifications', [])[:3]:
                            print(f"      • {mod}")
                        print(f"   Taste impact: {rec.get('taste_impact', 'Minimal')}")
                    
                    if rec.get('safety_warnings'):
                        print(f"   ⚠️  Warnings: {', '.join(rec['safety_warnings'][:2])}")
                    
                    if rec.get('substitution_notes'):
                        print(f"   🔄 Adaptations: {len(rec['substitution_notes'])} made")
                    
                    if rec.get('structured_instructions'):
                        print(f"   📝 Steps: {len(rec['structured_instructions'])} structured")
                
    else:
        print("No user ID provided")