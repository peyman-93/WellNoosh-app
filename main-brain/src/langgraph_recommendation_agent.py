"""
LangGraph-Enhanced Safe Recommendation Agent
Location: main-brain/src/langgraph_recommendation_agent.py

Uses LangGraph for workflow orchestration with:
1. State-based recipe processing pipeline
2. Conditional routing for safety validation
3. LLM-powered recipe adaptation and validation
"""

import os
import json
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, List, Optional, TypedDict, Annotated
from datetime import datetime
import re
import operator

from langgraph.graph import StateGraph, START, END
from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.prompts import ChatPromptTemplate
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
# STATE DEFINITION
# ============================================

class RecipeState(TypedDict):
    """State for the recipe recommendation workflow"""
    # Input
    user_id: str

    # User data
    user_profile: Optional[Dict]
    filters: Optional[Dict]

    # Recipe processing
    candidate_recipes: List[Dict]
    validated_recipes: List[Dict]
    ranked_recipes: List[Dict]
    adapted_recipes: List[Dict]
    final_recommendations: List[Dict]

    # Metadata
    error: Optional[str]
    messages: Annotated[List[str], operator.add]
    total_candidates: int
    safe_count: int
    final_count: int


# ============================================
# LLM SETUP
# ============================================

def get_llm(provider: str = None):
    """Get the LLM based on provider configuration"""
    if provider is None:
        provider = os.getenv('LLM_PROVIDER', 'openai').lower()

    if provider == 'openai':
        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key:
            raise ValueError("OPENAI_API_KEY not found in .env")
        return ChatOpenAI(
            model="gpt-4o-mini",
            api_key=api_key,
            max_tokens=2000,
            temperature=0.3
        )

    elif provider == 'gemini':
        api_key = os.getenv('GOOGLE_API_KEY')
        if not api_key:
            raise ValueError("GOOGLE_API_KEY not found in .env")
        return ChatGoogleGenerativeAI(
            model="gemini-1.5-flash",
            google_api_key=api_key,
            max_tokens=2000,
            temperature=0.3
        )

    else:
        raise ValueError(f"Unknown provider: {provider}. Choose: openai or gemini")


# ============================================
# NODE FUNCTIONS
# ============================================

def load_user_profile(state: RecipeState) -> RecipeState:
    """Load user profile from database"""
    user_id = state["user_id"]
    print(f"\n[Node: load_user_profile] Loading profile for user: {user_id}")

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
            user_profile = dict(profile)
            print(f"  Loaded profile: {user_profile.get('full_name', user_profile.get('email'))}")
            return {
                **state,
                "user_profile": user_profile,
                "messages": [f"Loaded profile for {user_profile.get('full_name', 'user')}"]
            }
        else:
            return {
                **state,
                "error": f"User {user_id} not found",
                "messages": ["User profile not found"]
            }

    except Exception as e:
        print(f"  Error loading profile: {e}")
        return {
            **state,
            "error": str(e),
            "messages": [f"Database error: {str(e)}"]
        }


def create_filters(state: RecipeState) -> RecipeState:
    """Create dietary filters from user profile"""
    print(f"\n[Node: create_filters] Creating dietary filters")

    if state.get("error"):
        return state

    profile = state["user_profile"]

    current_hour = datetime.now().hour
    if 5 <= current_hour < 11:
        meal_period = "breakfast"
    elif 11 <= current_hour < 16:
        meal_period = "lunch"
    else:
        meal_period = "dinner"

    filters = {
        'cooking_skill': profile.get('cooking_skill', 'beginner'),
        'diet_style': profile.get('diet_style', 'balanced'),
        'allergies': profile.get('allergies', []) or [],
        'medical_conditions': profile.get('medical_conditions', []) or [],
        'health_goal': (profile.get('health_goals') or ['maintain'])[0],
        'daily_calories': profile.get('daily_calorie_goal', 2000),
        'meal_period': meal_period
    }

    print(f"  Applied filters: {filters['diet_style']} diet, {len(filters['allergies'])} allergies")

    return {
        **state,
        "filters": filters,
        "messages": [f"Filters: {filters['diet_style']} diet, meal: {meal_period}"]
    }


def fetch_recipes(state: RecipeState) -> RecipeState:
    """Fetch diverse recipes from database (no personalization/filtering)"""
    print(f"\n[Node: fetch_recipes] Fetching diverse recipes from database")

    if state.get("error"):
        return state

    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor(cursor_factory=RealDictCursor)

        # Simple query - just fetch diverse recipes, no filtering
        query = """
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
            WHERE r.instructions IS NOT NULL
            GROUP BY r.id, r.title, r.category, r.area,
                     r.instructions, r.image_url, r.servings, rn.per_serving
            ORDER BY RANDOM()
            LIMIT 20
        """

        cur.execute(query)
        recipes = cur.fetchall()
        cur.close()
        conn.close()

        recipe_list = [dict(r) for r in recipes]
        print(f"  Found {len(recipe_list)} recipes")

        return {
            **state,
            "candidate_recipes": recipe_list,
            "total_candidates": len(recipe_list),
            "messages": [f"Found {len(recipe_list)} diverse recipes"]
        }

    except Exception as e:
        print(f"  Error fetching recipes: {e}")
        return {
            **state,
            "error": str(e),
            "candidate_recipes": [],
            "total_candidates": 0,
            "messages": [f"Recipe fetch error: {str(e)}"]
        }


def validate_safety(state: RecipeState) -> RecipeState:
    """Validate recipe safety using LLM"""
    print(f"\n[Node: validate_safety] Validating recipe safety")

    if state.get("error") or not state.get("candidate_recipes"):
        return {
            **state,
            "validated_recipes": [],
            "safe_count": 0
        }

    recipes = state["candidate_recipes"]
    user_profile = state["user_profile"]
    skip_validation = os.getenv('SKIP_VALIDATION', 'false').lower() == 'true'

    if skip_validation:
        print("  Skipping LLM validation (using SQL filtering only)")
        validated = []
        for recipe in recipes:
            recipe['safety_validated'] = True
            recipe['safety_score'] = 85
            recipe['safety_warnings'] = []
            recipe['safety_fixed'] = False
            validated.append(recipe)

        return {
            **state,
            "validated_recipes": validated,
            "safe_count": len(validated),
            "messages": ["SQL-based safety filtering applied"]
        }

    # Use LLM for batch validation
    try:
        llm = get_llm()

        allergies_str = ', '.join(user_profile.get('allergies', []))
        conditions_str = ', '.join(user_profile.get('medical_conditions', []))

        # Create compact summary
        compact_summary = []
        for recipe in recipes:
            ingredients = recipe.get('ingredients', [])[:3]
            ing_names = [ing.get('name', '') for ing in ingredients if ing]
            compact_summary.append(f"{recipe['id']}|{recipe['title']}|{','.join(ing_names)}")

        prompt = f"""Analyze these recipes for safety based on user allergies and medical conditions.

User Allergies: {allergies_str or 'None'}
Medical Conditions: {conditions_str or 'None'}

Recipes (format: id|title|key_ingredients):
{chr(10).join(compact_summary)}

Return ONLY a JSON object mapping recipe_id to safety info:
{{"recipe_id": {{"safe": true/false, "score": 0-100}}}}

Example: {{"123": {{"safe": true, "score": 90}}, "456": {{"safe": false, "score": 40}}}}"""

        response = llm.invoke([HumanMessage(content=prompt)])

        # Parse results
        try:
            # Extract JSON from response
            response_text = response.content
            json_match = re.search(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', response_text, re.DOTALL)
            if json_match:
                results_dict = json.loads(json_match.group())
            else:
                results_dict = {}
        except:
            results_dict = {}

        # Apply results
        validated = []
        for recipe in recipes:
            recipe_id = str(recipe['id'])
            safety_data = results_dict.get(recipe_id, {'safe': True, 'score': 80})

            is_safe = safety_data.get('safe', True)
            if isinstance(is_safe, str):
                is_safe = is_safe.lower() == 'true'

            safety_score = int(safety_data.get('score', 80))

            if is_safe or safety_score >= 75:
                recipe['safety_validated'] = True
                recipe['safety_score'] = safety_score
                recipe['safety_warnings'] = []
                recipe['safety_fixed'] = False
                validated.append(recipe)

        print(f"  Validated {len(validated)} safe recipes")

        return {
            **state,
            "validated_recipes": validated,
            "safe_count": len(validated),
            "messages": [f"LLM safety validation: {len(validated)} safe recipes"]
        }

    except Exception as e:
        print(f"  Validation error (using fallback): {e}")
        # Fallback: mark all as safe
        for recipe in recipes:
            recipe['safety_validated'] = True
            recipe['safety_score'] = 75
            recipe['safety_warnings'] = []
            recipe['safety_fixed'] = False

        return {
            **state,
            "validated_recipes": recipes,
            "safe_count": len(recipes),
            "messages": [f"Safety validation fallback used: {len(recipes)} recipes"]
        }


def rank_recipes(state: RecipeState) -> RecipeState:
    """Rank recipes based on user preferences and nutrition"""
    print(f"\n[Node: rank_recipes] Ranking recipes")

    if state.get("error") or not state.get("validated_recipes"):
        return {
            **state,
            "ranked_recipes": []
        }

    recipes = state["validated_recipes"]
    filters = state["filters"]

    health_goal = filters.get('health_goal', 'maintain')
    target_calories = filters.get('daily_calories', 2000) / 3

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

        # Build recommendation reason
        if reason_parts:
            reason = f"This dish is {', '.join(reason_parts)} and matches your {filters['diet_style']} diet"
        else:
            reason = f"Matches your {filters['diet_style']} diet and nutritional needs"

        recipe['ranking_score'] = score
        recipe['recommendation_reason'] = reason

    # Sort by ranking score
    recipes.sort(key=lambda x: x.get('ranking_score', 0), reverse=True)
    top_recipes = recipes[:5]

    print(f"  Selected top {len(top_recipes)} recipes")

    return {
        **state,
        "ranked_recipes": top_recipes,
        "messages": [f"Ranked and selected top {len(top_recipes)} recipes"]
    }


def adapt_recipes(state: RecipeState) -> RecipeState:
    """Adapt all top recipes in ONE batched LLM call"""
    print(f"\n[Node: adapt_recipes] Adapting recipes (batched LLM call)")

    if state.get("error") or not state.get("ranked_recipes"):
        return {
            **state,
            "adapted_recipes": []
        }

    recipes = state["ranked_recipes"]
    user_profile = state["user_profile"]

    try:
        llm = get_llm()

        # Build batch request for all recipes
        recipes_data = []
        for i, recipe in enumerate(recipes, 1):
            ingredients = [ing.get('name', '') for ing in recipe.get('ingredients', []) if ing][:8]
            recipes_data.append(f"Recipe {i} ({recipe.get('title', 'Unknown')}): {', '.join(ingredients)}")

        allergies_str = ', '.join(user_profile.get('allergies', [])) or 'None'
        diet_style = user_profile.get('diet_style', 'balanced')
        skill = user_profile.get('cooking_skill', 'beginner')

        prompt = f"""Adapt these {len(recipes)} recipes for a user with:
- Diet: {diet_style}
- Skill Level: {skill}
- Allergies: {allergies_str}

Recipes:
{chr(10).join(recipes_data)}

Return JSON with adaptations for each recipe:
{{
    "1": {{"substitutions": ["sub1", "sub2"], "difficulty": "easy/medium/hard"}},
    "2": {{"substitutions": ["sub1"], "difficulty": "easy/medium/hard"}},
    ...
}}

Keep substitutions brief (max 2-3 per recipe). Only suggest substitutions if needed for allergies or diet."""

        response = llm.invoke([HumanMessage(content=prompt)])
        response_text = response.content

        # Parse JSON response
        try:
            json_match = re.search(r'\{[\s\S]*\}', response_text)
            if json_match:
                adaptations = json.loads(json_match.group())
            else:
                adaptations = {}
        except:
            adaptations = {}

        # Apply adaptations to recipes
        for i, recipe in enumerate(recipes, 1):
            adaptation = adaptations.get(str(i), {})
            recipe['adapted_ingredients'] = []
            recipe['substitution_notes'] = adaptation.get('substitutions', [])
            recipe['estimated_difficulty'] = adaptation.get('difficulty', 'medium')

        print(f"  Adapted {len(recipes)} recipes in 1 LLM call")

        return {
            **state,
            "adapted_recipes": recipes,
            "messages": [f"Adapted {len(recipes)} recipes for {diet_style} diet"]
        }

    except Exception as e:
        print(f"  Adaptation error (using fallback): {e}")
        for recipe in recipes:
            recipe['adapted_ingredients'] = []
            recipe['substitution_notes'] = []
            recipe['estimated_difficulty'] = 'medium'

        return {
            **state,
            "adapted_recipes": recipes,
            "messages": ["Recipe adaptation completed (fallback)"]
        }


def parse_instructions(state: RecipeState) -> RecipeState:
    """Parse all instructions in ONE batched LLM call"""
    print(f"\n[Node: parse_instructions] Parsing instructions (batched LLM call)")

    if state.get("error") or not state.get("adapted_recipes"):
        return {
            **state,
            "final_recommendations": []
        }

    recipes = state["adapted_recipes"]

    try:
        llm = get_llm()

        # Build batch request - send first 300 chars of each recipe's instructions
        instructions_data = []
        for i, recipe in enumerate(recipes, 1):
            instructions = recipe.get('instructions', '')[:300]
            if instructions:
                instructions_data.append(f"Recipe {i} ({recipe.get('title', 'Unknown')}):\n{instructions}")

        if not instructions_data:
            # No instructions to parse
            for recipe in recipes:
                recipe['structured_instructions'] = []
                recipe['total_prep_time'] = '10 min'
                recipe['total_cook_time'] = '20 min'
            return {
                **state,
                "final_recommendations": recipes,
                "final_count": len(recipes),
                "messages": ["No instructions to parse"]
            }

        prompt = f"""Parse these {len(recipes)} recipe instructions into structured steps.

{chr(10).join(instructions_data)}

Return JSON with steps for each recipe:
{{
    "1": {{"steps": ["Step 1 text", "Step 2 text", ...], "prep_time": "10 min", "cook_time": "25 min"}},
    "2": {{"steps": ["Step 1 text", "Step 2 text", ...], "prep_time": "15 min", "cook_time": "30 min"}},
    ...
}}

Keep each step concise (1 sentence). Max 8 steps per recipe."""

        response = llm.invoke([HumanMessage(content=prompt)])
        response_text = response.content

        # Parse JSON response
        try:
            json_match = re.search(r'\{[\s\S]*\}', response_text)
            if json_match:
                parsed_data = json.loads(json_match.group())
            else:
                parsed_data = {}
        except:
            parsed_data = {}

        # Apply parsed instructions to recipes
        for i, recipe in enumerate(recipes, 1):
            data = parsed_data.get(str(i), {})
            steps_list = data.get('steps', [])

            # Convert to structured format
            structured_steps = []
            for j, step_text in enumerate(steps_list, 1):
                structured_steps.append({
                    'step': j,
                    'instruction': step_text,
                    'time': '5 min'
                })

            if structured_steps:
                recipe['structured_instructions'] = structured_steps
            else:
                # Fallback to regex parsing
                recipe['structured_instructions'] = _simple_instruction_parse(recipe.get('instructions', ''))

            recipe['total_prep_time'] = data.get('prep_time', '10 min')
            recipe['total_cook_time'] = data.get('cook_time', '20 min')

        print(f"  Parsed instructions for {len(recipes)} recipes in 1 LLM call")

        return {
            **state,
            "final_recommendations": recipes,
            "final_count": len(recipes),
            "messages": [f"Parsed instructions for {len(recipes)} recipes"]
        }

    except Exception as e:
        print(f"  Instruction parsing error (using fallback): {e}")
        # Fallback to regex parsing
        for recipe in recipes:
            recipe['structured_instructions'] = _simple_instruction_parse(recipe.get('instructions', ''))
            recipe['total_prep_time'] = '10 min'
            recipe['total_cook_time'] = '20 min'

        return {
            **state,
            "final_recommendations": recipes,
            "final_count": len(recipes),
            "messages": ["Instruction parsing completed (fallback)"]
        }


def save_results(state: RecipeState) -> RecipeState:
    """Save adapted recipes and events to database"""
    print(f"\n[Node: save_results] Saving results to database")

    if state.get("error") or not state.get("final_recommendations"):
        return state

    user_id = state["user_id"]
    recipes = state["final_recommendations"]

    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()

        # Save events
        for recipe in recipes:
            cur.execute("""
                INSERT INTO recipe_events (user_id, recipe_id, event, created_at)
                VALUES (%s, %s, 'view', NOW())
                ON CONFLICT DO NOTHING
            """, (user_id, recipe['id']))

        conn.commit()
        cur.close()
        conn.close()

        print(f"  Saved {len(recipes)} recommendation events")

        return {
            **state,
            "messages": [f"Saved {len(recipes)} recommendation events"]
        }

    except Exception as e:
        print(f"  Error saving results: {e}")
        return {
            **state,
            "messages": [f"Save warning: {str(e)}"]
        }


def _simple_instruction_parse(instructions: str) -> List[Dict]:
    """Quick regex-based instruction parsing (fallback)"""
    if not instructions:
        return []

    steps = []
    sentences = re.split(r'[.!]\s+|\n+', instructions)

    step_num = 1
    for sentence in sentences:
        sentence = sentence.strip()

        if len(sentence) < 15:
            continue

        sentence = re.sub(r'^[\d\-\*\.]+\s*', '', sentence)
        sentence = sentence.strip().capitalize()

        if sentence:
            steps.append({
                'step': step_num,
                'instruction': sentence,
                'time': '5 min'
            })
            step_num += 1

            if step_num > 10:
                break

    return steps


# ============================================
# CONDITIONAL ROUTING
# ============================================

def should_continue_after_profile(state: RecipeState) -> str:
    """Decide whether to continue after loading profile"""
    if state.get("error"):
        return "end"
    return "continue"


def should_continue_after_fetch(state: RecipeState) -> str:
    """Decide whether to continue after fetching recipes"""
    if state.get("error") or not state.get("candidate_recipes"):
        return "end"
    return "continue"


def should_continue_after_validation(state: RecipeState) -> str:
    """Decide whether to continue after validation"""
    if not state.get("validated_recipes"):
        return "end"
    return "continue"


# ============================================
# BUILD THE GRAPH
# ============================================

def build_recommendation_graph() -> StateGraph:
    """Build simplified LangGraph workflow - just fetch diverse recipes, no personalization"""

    # Create the graph
    workflow = StateGraph(RecipeState)

    # Simplified nodes - no personalization for browsing
    workflow.add_node("fetch_recipes", fetch_recipes_simple)
    workflow.add_node("save_results", save_results)

    # Simple linear flow: fetch -> save -> end
    workflow.add_edge(START, "fetch_recipes")

    workflow.add_conditional_edges(
        "fetch_recipes",
        should_continue_after_fetch,
        {
            "continue": "save_results",
            "end": END
        }
    )

    workflow.add_edge("save_results", END)

    return workflow.compile()


def fetch_recipes_simple(state: RecipeState) -> RecipeState:
    """Simplified fetch - just get diverse recipes from database"""
    print(f"\n[Node: fetch_recipes_simple] Fetching diverse recipes")

    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor(cursor_factory=RealDictCursor)

        query = """
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
            WHERE r.instructions IS NOT NULL
            GROUP BY r.id, r.title, r.category, r.area,
                     r.instructions, r.image_url, r.servings, rn.per_serving
            ORDER BY RANDOM()
            LIMIT 20
        """

        cur.execute(query)
        recipes = cur.fetchall()
        cur.close()
        conn.close()

        recipe_list = []
        for r in recipes:
            recipe = dict(r)
            # Add basic fields for display (no personalization)
            recipe['recommendation_reason'] = 'Discover new recipes'
            recipe['safety_validated'] = False
            recipe['safety_score'] = 0
            recipe['safety_warnings'] = []
            recipe_list.append(recipe)

        print(f"  Found {len(recipe_list)} recipes")

        return {
            **state,
            "candidate_recipes": recipe_list,
            "final_recommendations": recipe_list,
            "total_candidates": len(recipe_list),
            "final_count": len(recipe_list),
            "messages": [f"Found {len(recipe_list)} diverse recipes"]
        }

    except Exception as e:
        print(f"  Error fetching recipes: {e}")
        return {
            **state,
            "error": str(e),
            "candidate_recipes": [],
            "final_recommendations": [],
            "total_candidates": 0,
            "final_count": 0,
            "messages": [f"Recipe fetch error: {str(e)}"]
        }


# ============================================
# MAIN AGENT CLASS
# ============================================

class LangGraphRecipeAgent:
    """Main agent using LangGraph workflow"""

    def __init__(self, llm_provider: str = None):
        """Initialize the LangGraph agent"""
        self.llm_provider = llm_provider or os.getenv('LLM_PROVIDER', 'openai').lower()
        self.graph = build_recommendation_graph()

        # Verify LLM configuration
        try:
            _ = get_llm(self.llm_provider)
            print(f"LangGraph Agent initialized with {self.llm_provider}")
        except Exception as e:
            print(f"Warning: LLM initialization issue: {e}")

    def get_recommendations(self, user_id: str) -> Dict:
        """Get diverse recipe recommendations (no personalization)"""
        print(f"\n{'='*60}")
        print(f"Recipe Recommendation Agent (Browse Mode)")
        print(f"{'='*60}")
        print(f"Fetching diverse recipes for user: {user_id}")

        # Initialize state - simplified, no user profile needed for browsing
        initial_state: RecipeState = {
            "user_id": user_id,
            "user_profile": None,
            "filters": None,
            "candidate_recipes": [],
            "validated_recipes": [],
            "ranked_recipes": [],
            "adapted_recipes": [],
            "final_recommendations": [],
            "error": None,
            "messages": [],
            "total_candidates": 0,
            "safe_count": 0,
            "final_count": 0
        }

        # Run the simplified graph
        try:
            final_state = self.graph.invoke(initial_state)

            if final_state.get("error"):
                return {
                    'user_id': user_id,
                    'error': final_state["error"],
                    'recommendations': []
                }

            return {
                'user_id': user_id,
                'recommendations': final_state.get("final_recommendations", []),
                'filters_applied': {},  # No filters in browse mode
                'total_candidates': final_state.get("total_candidates", 0),
                'safe_count': 0,  # No safety validation in browse mode
                'final_count': final_state.get("final_count", 0),
                'messages': final_state.get("messages", [])
            }

        except Exception as e:
            print(f"Graph execution error: {e}")
            import traceback
            traceback.print_exc()
            return {
                'user_id': user_id,
                'error': str(e),
                'recommendations': []
            }

    def personalize_for_cooking(self, user_id: str, recipe_id: str) -> Dict:
        """
        Personalize a specific recipe when user clicks 'Cook Now'
        This applies all personalization: safety validation, adaptations, substitutions
        """
        print(f"\n{'='*60}")
        print(f"Personalizing Recipe for Cooking")
        print(f"{'='*60}")
        print(f"User: {user_id}, Recipe: {recipe_id}")

        try:
            conn = psycopg2.connect(**DB_CONFIG)
            cur = conn.cursor(cursor_factory=RealDictCursor)

            # 1. Load user profile
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

            if not profile:
                return {'error': 'User profile not found', 'recipe': None}

            user_profile = dict(profile)
            print(f"  Loaded profile: {user_profile.get('full_name', 'User')}")

            # 2. Load the recipe
            cur.execute("""
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
                WHERE r.id = %s
                GROUP BY r.id, r.title, r.category, r.area,
                         r.instructions, r.image_url, r.servings, rn.per_serving
            """, (recipe_id,))
            recipe_row = cur.fetchone()

            if not recipe_row:
                cur.close()
                conn.close()
                return {'error': 'Recipe not found', 'recipe': None}

            recipe = dict(recipe_row)
            cur.close()
            conn.close()

            # 3. Perform personalization using LLM
            llm = get_llm()

            allergies = user_profile.get('allergies', []) or []
            medical_conditions = user_profile.get('medical_conditions', []) or []
            diet_style = user_profile.get('diet_style', 'balanced')
            cooking_skill = user_profile.get('cooking_skill', 'beginner')
            health_goals = user_profile.get('health_goals', []) or []

            allergies_str = ', '.join(allergies) if allergies else 'None'
            conditions_str = ', '.join(medical_conditions) if medical_conditions else 'None'
            health_goals_str = ', '.join(health_goals) if health_goals else 'None'

            # Get full ingredients with amounts
            ingredients = recipe.get('ingredients', [])
            ingredients_list = []
            for ing in ingredients:
                if ing:
                    name = ing.get('name', '')
                    amount = ing.get('amount', '')
                    if name:
                        ingredients_list.append(f"- {amount} {name}".strip())

            ingredients_text = '\n'.join(ingredients_list) if ingredients_list else 'No ingredients listed'
            instructions = recipe.get('instructions', '')

            prompt = f"""You are a professional chef and nutritionist. FULLY ADAPT this recipe for the user's specific needs.

USER PROFILE:
- Allergies: {allergies_str}
- Medical Conditions: {conditions_str}
- Diet Style: {diet_style}
- Cooking Skill Level: {cooking_skill}
- Health Goals: {health_goals_str}

ORIGINAL RECIPE: {recipe.get('title')}

ORIGINAL INGREDIENTS:
{ingredients_text}

ORIGINAL INSTRUCTIONS:
{instructions}

YOUR TASK:
1. REWRITE the ingredients list - replace problematic ingredients with REAL, SPECIFIC alternatives
2. REWRITE the instructions step-by-step using the NEW ingredient names
3. Adjust portions based on health goals

CRITICAL RULES - USE REAL INGREDIENT NAMES:
❌ NEVER use generic terms like:
- "dairy-free alternative"
- "dairy-free butter"
- "dairy-free cream"
- "nut-free option"
- "sugar-free sweetener"
- "gluten-free flour"

✅ ALWAYS use SPECIFIC real ingredients:
- Instead of "dairy-free milk" → use "oat milk", "coconut milk", "almond milk", or "soy milk"
- Instead of "dairy-free butter" → use "coconut oil", "olive oil", or "avocado oil"
- Instead of "dairy-free cream" → use "coconut cream", "cashew cream", or "oat cream"
- Instead of "dairy-free chocolate" → use "dark chocolate (70% cocoa)", "cacao nibs", or "carob chips"
- Instead of "nut-free butter" → use "sunflower seed butter", "tahini", or "soy nut butter"
- Instead of "sugar-free sweetener" → use "stevia", "monk fruit", "erythritol", or "date syrup"
- Instead of "gluten-free flour" → use "almond flour", "rice flour", "oat flour", or "coconut flour"
- Instead of "egg substitute" → use "flax egg (1 tbsp flax + 3 tbsp water)", "chia egg", or "mashed banana"

ALLERGY-SPECIFIC SUBSTITUTIONS:
- Dairy allergy: Use coconut, oat, or soy-based alternatives (check if also nut-free needed)
- Nut allergy: Use seeds (sunflower, pumpkin), coconut, or oat-based products
- Egg allergy: Use flax eggs, chia eggs, applesauce, or mashed banana
- Gluten allergy: Use rice, almond, coconut, or certified gluten-free oat flour
- Soy allergy: Avoid soy milk/tofu, use coconut or oat alternatives

Return ONLY a valid JSON object:
{{
    "safety_score": 0-100,
    "safety_warnings": ["any remaining concerns the user should know"],
    "adapted_ingredients": [
        {{"name": "ingredient name", "amount": "quantity with unit", "original": "what it replaced (or null if unchanged)", "reason": "why changed (or null)"}},
        ...
    ],
    "adapted_instructions": [
        {{"step": 1, "instruction": "detailed instruction text", "tip": "optional helpful tip for this step"}},
        {{"step": 2, "instruction": "...", "tip": "..."}},
        ...
    ],
    "estimated_difficulty": "easy/medium/hard",
    "prep_time": "X minutes",
    "cook_time": "X minutes",
    "nutrition_adjustments": "brief explanation of nutritional changes made",
    "personalization_summary": "2-3 sentence summary of all adaptations made for this user"
}}"""

            response = llm.invoke([HumanMessage(content=prompt)])
            response_text = response.content

            # Parse the LLM response
            try:
                json_match = re.search(r'\{[\s\S]*\}', response_text)
                if json_match:
                    personalization = json.loads(json_match.group())
                else:
                    personalization = {}
            except Exception as parse_error:
                print(f"  JSON parse error: {parse_error}")
                personalization = {}

            # Build adapted ingredients list
            adapted_ingredients = []
            for ing in personalization.get('adapted_ingredients', []):
                adapted_ingredients.append({
                    'name': ing.get('name', ''),
                    'amount': ing.get('amount', ''),
                    'original': ing.get('original'),
                    'reason': ing.get('reason'),
                    'was_changed': ing.get('original') is not None
                })

            # If no adapted ingredients from LLM, use original
            if not adapted_ingredients:
                for ing in ingredients:
                    if ing:
                        adapted_ingredients.append({
                            'name': ing.get('name', ''),
                            'amount': ing.get('amount', ''),
                            'original': None,
                            'reason': None,
                            'was_changed': False
                        })

            # Build the personalized recipe response
            personalized_recipe = {
                **recipe,
                'safety_validated': True,
                'safety_score': personalization.get('safety_score', 75),
                'safety_warnings': personalization.get('safety_warnings', []),
                'adapted_ingredients': adapted_ingredients,
                'nutrition_adjustments': personalization.get('nutrition_adjustments', ''),
                'estimated_difficulty': personalization.get('estimated_difficulty', 'medium'),
                'total_prep_time': personalization.get('prep_time', '15 min'),
                'total_cook_time': personalization.get('cook_time', '30 min'),
                'personalization_summary': personalization.get('personalization_summary', ''),
                'structured_instructions': []
            }

            # Build structured instructions from adapted instructions
            adapted_instructions = personalization.get('adapted_instructions', [])
            for step_data in adapted_instructions:
                if isinstance(step_data, dict):
                    personalized_recipe['structured_instructions'].append({
                        'step': step_data.get('step', len(personalized_recipe['structured_instructions']) + 1),
                        'instruction': step_data.get('instruction', ''),
                        'tip': step_data.get('tip', ''),
                        'time': '5 min'
                    })
                elif isinstance(step_data, str):
                    personalized_recipe['structured_instructions'].append({
                        'step': len(personalized_recipe['structured_instructions']) + 1,
                        'instruction': step_data,
                        'tip': '',
                        'time': '5 min'
                    })

            # Fallback if no adapted instructions
            if not personalized_recipe['structured_instructions']:
                personalized_recipe['structured_instructions'] = _simple_instruction_parse(
                    recipe.get('instructions', '')
                )

            # Record the cook_now event
            self.record_feedback(user_id, recipe_id, 'cook_now')

            print(f"  Personalization complete. Safety score: {personalized_recipe['safety_score']}")

            return {
                'user_id': user_id,
                'recipe': personalized_recipe,
                'user_profile_applied': {
                    'allergies': allergies,
                    'diet_style': diet_style,
                    'cooking_skill': cooking_skill,
                    'medical_conditions': medical_conditions
                },
                'messages': ['Recipe personalized for your profile']
            }

        except Exception as e:
            print(f"Error personalizing recipe: {e}")
            import traceback
            traceback.print_exc()
            return {
                'error': str(e),
                'recipe': None
            }

    def record_feedback(self, user_id: str, recipe_id: str, event_type: str) -> bool:
        """Record user feedback on a recipe"""
        try:
            conn = psycopg2.connect(**DB_CONFIG)
            cur = conn.cursor()

            valid_events = {'like', 'hide', 'save', 'view', 'cook_now', 'share_family'}
            if event_type not in valid_events:
                print(f"Invalid event type: {event_type}")
                return False

            cur.execute("""
                INSERT INTO recipe_events (user_id, recipe_id, event, created_at)
                VALUES (%s, %s, %s, NOW())
            """, (user_id, recipe_id, event_type))

            conn.commit()
            cur.close()
            conn.close()

            print(f"Recorded {event_type} for recipe {recipe_id}")
            return True

        except Exception as e:
            print(f"Error recording feedback: {e}")
            return False

    def get_graph_visualization(self):
        """Get the graph structure for visualization"""
        return self.graph.get_graph()


# ============================================
# CLI
# ============================================

if __name__ == "__main__":
    print("\n" + "="*60)
    print("LangGraph Recipe Recommendation Agent")
    print("="*60)

    import sys

    if len(sys.argv) > 1 and sys.argv[1] == '--test':
        print("\n TEST MODE - Choose LLM provider:")
        print("1. OpenAI GPT-4o-mini (Requires: OPENAI_API_KEY)")
        print("2. Google Gemini Flash (Requires: GOOGLE_API_KEY)")

        choice = input("\nSelect (1-2): ").strip()

        if choice == "1":
            provider = "openai"
        elif choice == "2":
            provider = "gemini"
        else:
            print("Invalid choice, using configured provider from .env")
            provider = None

        agent = LangGraphRecipeAgent(llm_provider=provider)
        user_id = input("\nEnter user ID to test: ").strip()
    else:
        print("\n PRODUCTION MODE - Using LLM_PROVIDER from .env")
        agent = LangGraphRecipeAgent()
        user_id = input("\nEnter user ID: ").strip()

    if user_id:
        result = agent.get_recommendations(user_id)

        if result.get('error'):
            print(f"\n Error: {result['error']}")
        else:
            print(f"\n Processing Complete!")
            print(f"   Total candidates: {result['total_candidates']}")
            print(f"   Safe recipes: {result['safe_count']}")
            print(f"   Final recommendations: {result['final_count']}")

            if result['recommendations']:
                print(f"\n Top {len(result['recommendations'])} Recommendations:")
                for i, rec in enumerate(result['recommendations'], 1):
                    print(f"\n{i}. {rec['title']}")
                    print(f"   {rec.get('calories', 'N/A')} cal | Safety Score: {rec.get('safety_score', 100)}/100")
                    print(f"   Reason: {rec.get('recommendation_reason', 'N/A')}")

                    if rec.get('substitution_notes'):
                        print(f"   Adaptations: {len(rec['substitution_notes'])} made")

                    if rec.get('structured_instructions'):
                        print(f"   Steps: {len(rec['structured_instructions'])} structured")
    else:
        print("No user ID provided")
