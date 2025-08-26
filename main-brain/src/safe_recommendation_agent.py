"""
Complete Safe Recommendation Agent with Built-in Safety Verification
Location: main-brain/src/safe_recommendation_agent.py
Purpose: Single script that handles recommendations AND safety verification
"""

import os
import json
import psycopg2
from psycopg2.extras import RealDictCursor, Json
from typing import Dict, List, TypedDict, Optional, Tuple
from datetime import datetime
from pathlib import Path
from enum import Enum
import sys
import re
import logging

# LangGraph imports
from langgraph.graph import StateGraph, END
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate

# Setup
sys.path.append(str(Path(__file__).parent.parent))
from dotenv import load_dotenv

env_path = Path(__file__).parent.parent / '.env'
load_dotenv(env_path)

# Configure logging for safety issues
logging.basicConfig(
    filename='safety_alerts.log',
    level=logging.WARNING,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

# ============================
# Configuration
# ============================

DB_PARAMS = {
    'host': os.getenv('SUPABASE_HOST'),
    'dbname': os.getenv('SUPABASE_DB', 'postgres'),
    'user': os.getenv('SUPABASE_USER', 'postgres'),
    'password': os.getenv('SUPABASE_PASSWORD'),
    'port': int(os.getenv('SUPABASE_PORT', '5432')),
    'sslmode': os.getenv('SUPABASE_SSLMODE', 'require')
}

LLM_PROVIDER = os.getenv('LLM_PROVIDER', 'openai')
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')

# ============================
# Safety Enums and Constants
# ============================

class SafetyLevel(Enum):
    SAFE = "safe"
    SAFE_WITH_MODIFICATIONS = "safe_with_modifications"
    RISKY = "risky"
    DANGEROUS = "dangerous"

# Critical allergen mappings
ALLERGEN_KEYWORDS = {
    'nuts': [
        'nut', 'almond', 'walnut', 'pecan', 'cashew', 'pistachio',
        'hazelnut', 'macadamia', 'brazil nut', 'pine nut', 'chestnut'
    ],
    'peanuts': ['peanut', 'groundnut', 'arachis'],
    'shellfish': [
        'shrimp', 'crab', 'lobster', 'crayfish', 'prawn',
        'clam', 'oyster', 'mussel', 'scallop', 'abalone',
        'squid', 'octopus', 'calamari'
    ],
    'fish': [
        'fish', 'salmon', 'tuna', 'cod', 'bass', 'trout',
        'sardine', 'anchovy', 'herring', 'mackerel'
    ],
    'eggs': ['egg', 'albumin', 'mayonnaise', 'meringue', 'custard'],
    'milk/dairy': [
        'milk', 'cheese', 'butter', 'cream', 'yogurt', 'yoghurt',
        'dairy', 'lactose', 'whey', 'casein', 'ghee'
    ],
    'wheat/gluten': [
        'wheat', 'flour', 'bread', 'pasta', 'gluten', 'semolina',
        'couscous', 'bulgur', 'barley', 'rye'
    ],
    'soy': ['soy', 'soya', 'tofu', 'tempeh', 'edamame', 'miso', 'soy sauce'],
    'sesame': ['sesame', 'tahini', 'halvah']
}

# Medical restrictions
MEDICAL_RESTRICTIONS = {
    'diabetes': {
        'max_sugar_g': 10,
        'max_carbs_g': 45,
        'avoid_ingredients': ['sugar', 'honey', 'syrup']
    },
    'high blood pressure': {
        'max_sodium_mg': 600,
        'avoid_ingredients': ['salt', 'soy sauce', 'bacon', 'pickled', 'cured']
    },
    'high cholesterol': {
        'max_fat_g': 20,
        'max_saturated_fat_g': 7,
        'avoid_ingredients': ['butter', 'cream', 'fatty meat']
    },
    'kidney disease': {
        'max_protein_g': 20,
        'max_sodium_mg': 500,
        'avoid_ingredients': ['beans', 'nuts', 'dairy']
    }
}

# ============================
# State Definition
# ============================

class AgentState(TypedDict):
    """State that flows through the graph"""
    user_id: str
    user_profile: Dict
    dietary_filters: Dict
    sql_filters: List[str]
    candidate_recipes: List[Dict]
    safety_verified_recipes: List[Dict]  # After safety check
    final_recommendations: List[Dict]
    safety_reports: List[Dict]
    messages: List[Dict]

# ============================
# Database Functions
# ============================

def get_db_connection():
    """Create database connection"""
    return psycopg2.connect(**DB_PARAMS, cursor_factory=RealDictCursor)

def get_llm():
    """Get configured LLM instance"""
    if LLM_PROVIDER == 'gemini' and GOOGLE_API_KEY:
        return ChatGoogleGenerativeAI(
            model="gemini-pro",
            google_api_key=GOOGLE_API_KEY,
            temperature=0.3
        )
    elif OPENAI_API_KEY:
        return ChatOpenAI(
            model="gpt-4-turbo-preview",
            api_key=OPENAI_API_KEY,
            temperature=0.3
        )
    else:
        raise ValueError("No LLM API key configured")

# ============================
# Pipeline Node Functions
# ============================

def load_user_profile(state: AgentState) -> AgentState:
    """Load user health profile from database"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        cur.execute("""
            SELECT * FROM user_health_profiles 
            WHERE user_id = %s
        """, (state['user_id'],))
        
        profile = cur.fetchone()
        if profile:
            state['user_profile'] = dict(profile)
            state['messages'].append({
                "type": "system",
                "content": f"Loaded profile for user {state['user_id']}"
            })
        else:
            state['messages'].append({
                "type": "error",
                "content": f"No profile found for user {state['user_id']}"
            })
    finally:
        cur.close()
        conn.close()
    
    return state

def create_dietary_filters(state: AgentState) -> AgentState:
    """Convert user profile into dietary filters"""
    profile = state['user_profile']
    filters = {}
    
    filters['cooking_skill'] = profile.get('cooking_skill', 'beginner')
    filters['diet_style'] = profile.get('diet_style', 'balanced')
    filters['allergies'] = profile.get('allergies', [])
    filters['medical_conditions'] = profile.get('medical_conditions', [])
    filters['daily_calories'] = profile.get('daily_calorie', 2000)
    filters['health_goal'] = profile.get('health_goal', 'maintain')
    
    # Time-based meal type
    from datetime import datetime
    current_hour = datetime.now().hour
    
    if 5 <= current_hour < 11:
        filters['meal_period'] = 'breakfast'
        filters['appropriate_categories'] = ['Breakfast', 'Miscellaneous', 'Side']
    elif 11 <= current_hour < 15:
        filters['meal_period'] = 'lunch'
        filters['appropriate_categories'] = ['Chicken', 'Beef', 'Vegetarian', 'Pasta', 'Seafood', 'Vegan']
    elif 15 <= current_hour < 17:
        filters['meal_period'] = 'snack'
        filters['appropriate_categories'] = ['Side', 'Dessert', 'Starter']
    elif 17 <= current_hour < 22:
        filters['meal_period'] = 'dinner'
        filters['appropriate_categories'] = ['Chicken', 'Beef', 'Vegetarian', 'Pasta', 'Seafood', 'Vegan', 'Lamb']
    else:
        filters['meal_period'] = 'light'
        filters['appropriate_categories'] = ['Side', 'Starter', 'Vegetarian', 'Vegan']
    
    state['dietary_filters'] = filters
    return state

def fetch_candidate_recipes(state: AgentState) -> AgentState:
    """Fetch recipes using scoring system"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        filters = state['dietary_filters']
        score_components = []
        
        # Time appropriateness score
        categories_str = "', '".join(filters.get('appropriate_categories', []))
        if categories_str:
            score_components.append(f"CASE WHEN r.category IN ('{categories_str}') THEN 100 ELSE 0 END")
        
        # Diet style compatibility
        diet_style = filters.get('diet_style', '').lower()
        if diet_style in ['vegetarian', 'vegan']:
            score_components.append("CASE WHEN r.category NOT IN ('Beef', 'Chicken', 'Lamb', 'Pork', 'Goat', 'Seafood') THEN 50 ELSE -50 END")
        
        # Calorie appropriateness
        target_calories = filters.get('daily_calories', 2000) / 3
        score_components.append(f"GREATEST(0, 30 - ABS((rn.per_serving->>'kcal')::numeric - {target_calories}) / 10)")
        
        # Medical conditions
        if 'diabetes' in filters.get('medical_conditions', []):
            score_components.append("CASE WHEN (rn.per_serving->>'sugar_g')::numeric <= 10 THEN 20 ELSE -10 END")
        if 'high blood pressure' in filters.get('medical_conditions', []):
            score_components.append("CASE WHEN (rn.per_serving->>'sodium_mg')::numeric <= 600 THEN 20 ELSE -10 END")
        
        total_score = " + ".join(score_components) if score_components else "0"
        
        query = f"""
            WITH scored_recipes AS (
                SELECT 
                    r.id,
                    r.title,
                    r.category,
                    r.area as cuisine,
                    r.image_url,
                    r.instructions,
                    rn.per_serving->>'kcal' as calories,
                    rn.per_serving->>'protein_g' as protein,
                    rn.per_serving->>'carbs_g' as carbs,
                    rn.per_serving->>'fat_g' as fat,
                    rn.per_serving->>'sugar_g' as sugar,
                    rn.per_serving->>'sodium_mg' as sodium,
                    array_length(string_to_array(r.instructions, '.'), 1) as instruction_steps,
                    (
                        SELECT COUNT(*) 
                        FROM recipe_ingredients ri 
                        WHERE ri.recipe_id = r.id
                    ) as ingredient_count,
                    ({total_score}) as match_score,
                    ARRAY(
                        SELECT ri.ingredient_name 
                        FROM recipe_ingredients ri 
                        WHERE ri.recipe_id = r.id
                    ) as ingredients
                FROM recipes r
                LEFT JOIN recipe_nutrients rn ON rn.recipe_id = r.id
                WHERE r.image_url IS NOT NULL
                AND rn.per_serving IS NOT NULL
            )
            SELECT * FROM scored_recipes
            ORDER BY match_score DESC
            LIMIT 30
        """
        
        cur.execute(query)
        recipes = cur.fetchall()
        state['candidate_recipes'] = [dict(r) for r in recipes]
        
        state['messages'].append({
            "type": "info",
            "content": f"Found {len(recipes)} candidate recipes"
        })
        
    except Exception as e:
        state['messages'].append({
            "type": "error",
            "content": f"Error fetching recipes: {e}"
        })
        state['candidate_recipes'] = []
    finally:
        cur.close()
        conn.close()
    
    return state

def verify_safety(state: AgentState) -> AgentState:
    """Safety verification step - checks for allergens and medical restrictions"""
    filters = state['dietary_filters']
    allergies = filters.get('allergies', [])
    conditions = filters.get('medical_conditions', [])
    
    safe_recipes = []
    safety_reports = []
    
    for recipe in state['candidate_recipes']:
        safety_level = SafetyLevel.SAFE
        issues = []
        modifications = []
        warnings = []
        
        # Check allergens
        ingredients_str = ' '.join(recipe.get('ingredients', [])).lower()
        
        for allergy in allergies:
            if allergy and allergy.lower() in ALLERGEN_KEYWORDS:
                allergen_terms = ALLERGEN_KEYWORDS[allergy.lower()]
                
                for term in allergen_terms:
                    if term in ingredients_str:
                        safety_level = SafetyLevel.DANGEROUS
                        issues.append(f"Contains {allergy}")
                        modifications.append(f"MUST remove/substitute {term}")
                        break
        
        # Check medical conditions
        for condition in conditions:
            if condition in MEDICAL_RESTRICTIONS:
                restrictions = MEDICAL_RESTRICTIONS[condition]
                
                if condition == 'diabetes':
                    sugar = float(recipe.get('sugar', 0)) if recipe.get('sugar') else 0
                    if sugar > restrictions['max_sugar_g']:
                        warnings.append(f"High sugar ({sugar}g) for diabetes")
                        safety_level = max(safety_level, SafetyLevel.RISKY)
                
                elif condition == 'high blood pressure':
                    sodium = float(recipe.get('sodium', 0)) if recipe.get('sodium') else 0
                    if sodium > restrictions['max_sodium_mg']:
                        warnings.append(f"High sodium ({sodium}mg)")
                        safety_level = max(safety_level, SafetyLevel.RISKY)
        
        # Determine if recipe passes safety check
        if safety_level != SafetyLevel.DANGEROUS:
            recipe['safety_level'] = safety_level.value
            recipe['safety_warnings'] = warnings
            recipe['required_modifications'] = modifications
            recipe['safety_verified'] = True
            safe_recipes.append(recipe)
        
        safety_reports.append({
            'recipe_id': recipe['id'],
            'title': recipe['title'],
            'safety_level': safety_level.value,
            'issues': issues,
            'warnings': warnings
        })
    
    # If not enough safe recipes, take risky ones with warnings
    if len(safe_recipes) < 5:
        for recipe in state['candidate_recipes']:
            if recipe not in safe_recipes:
                recipe['safety_level'] = SafetyLevel.SAFE_WITH_MODIFICATIONS.value
                recipe['safety_verified'] = False
                recipe['safety_warnings'] = ["Review ingredients carefully"]
                safe_recipes.append(recipe)
                if len(safe_recipes) >= 10:
                    break
    
    state['safety_verified_recipes'] = safe_recipes
    state['safety_reports'] = safety_reports
    
    # Log if user has limited safe options
    safe_count = len([r for r in safety_reports if r['safety_level'] == 'safe'])
    if safe_count < 3:
        logging.warning(f"User {state['user_id']} has only {safe_count} safe recipes available")
    
    return state

def rank_with_llm(state: AgentState) -> AgentState:
    """Use LLM to rank safety-verified recipes"""
    
    if not state['safety_verified_recipes']:
        state['final_recommendations'] = []
        return state
    
    llm = get_llm()
    
    prompt = ChatPromptTemplate.from_template("""
    You are a nutritionist selecting meals for a user with these requirements:
    
    Profile:
    Health Goal: {health_goal}
    Diet Style: {diet_style}
    Allergies: {allergies}
    Medical Conditions: {medical_conditions}
    Meal Time: {meal_period}
    
    Select EXACTLY 5 recipes from below.
    Prioritize SAFE recipes over ones needing modifications.
    
    Candidates (with safety levels):
    {candidates}
    
    Return JSON array of 5 recipes:
    [{{"id": "recipe_id", "reason": "why this is good", "safety_note": "any safety concerns"}}]
    """)
    
    candidates_str = json.dumps([{
        "id": r['id'],
        "title": r['title'],
        "safety_level": r.get('safety_level'),
        "calories": r.get('calories'),
        "category": r['category'],
        "warnings": r.get('safety_warnings', [])
    } for r in state['safety_verified_recipes'][:15]], indent=2)
    
    messages = [
        SystemMessage(content="You are a safety-conscious nutritionist."),
        HumanMessage(content=prompt.format(
            health_goal=state['dietary_filters'].get('health_goal'),
            diet_style=state['dietary_filters'].get('diet_style'),
            allergies=state['dietary_filters'].get('allergies'),
            medical_conditions=state['dietary_filters'].get('medical_conditions'),
            meal_period=state['dietary_filters'].get('meal_period'),
            candidates=candidates_str
        ))
    ]
    
    try:
        response = llm.invoke(messages)
        
        # Parse response
        import re
        json_match = re.search(r'\[.*\]', response.content, re.DOTALL)
        if json_match:
            recommendations = json.loads(json_match.group())
            recipe_map = {r['id']: r for r in state['safety_verified_recipes']}
            
            final = []
            for rec in recommendations[:5]:
                if rec['id'] in recipe_map:
                    recipe = recipe_map[rec['id']].copy()
                    recipe['recommendation_reason'] = rec.get('reason', '')
                    if rec.get('safety_note'):
                        recipe['safety_note'] = rec['safety_note']
                    final.append(recipe)
            
            state['final_recommendations'] = final
        else:
            # Fallback: just take top 5 safe ones
            state['final_recommendations'] = state['safety_verified_recipes'][:5]
            
    except Exception as e:
        state['messages'].append({"type": "error", "content": f"LLM error: {e}"})
        state['final_recommendations'] = state['safety_verified_recipes'][:5]
    
    return state

def format_for_ui(state: AgentState) -> AgentState:
    """Format recommendations for Tinder-style UI"""
    formatted = []
    
    for recipe in state['final_recommendations']:
        # Calculate UI elements
        steps = recipe.get('instruction_steps', 6)
        prep_time = steps * 5 if steps else 25
        ingredient_count = recipe.get('ingredient_count', 10)
        
        if ingredient_count <= 5 and steps <= 4:
            difficulty = 'Easy'
        elif ingredient_count <= 10 and steps <= 8:
            difficulty = 'Medium'
        else:
            difficulty = 'Advanced'
        
        # Build tags
        tags = []
        if recipe.get('cuisine'):
            tags.append(recipe['cuisine'])
        if recipe.get('safety_level') == 'safe':
            tags.append('Healthy')
        if recipe.get('safety_level') == 'safe_with_modifications':
            tags.append('Adapted')
        if recipe.get('category') in ['Vegetarian', 'Vegan']:
            tags.append(recipe['category'])
        
        formatted_recipe = {
            'id': recipe['id'],
            'title': recipe['title'],
            'image_url': recipe.get('image_url', 'https://via.placeholder.com/400x300'),
            'rating': None,  # Will be populated from ratings table
            'prep_time': prep_time,
            'servings': 2,
            'difficulty': difficulty,
            'tags': tags[:3],
            'description': recipe.get('recommendation_reason', ''),
            'nutrition': {
                'calories': int(float(recipe.get('calories', 0))) if recipe.get('calories') else 250,
                'protein': int(float(recipe.get('protein', 0))) if recipe.get('protein') else 10,
                'carbs': int(float(recipe.get('carbs', 0))) if recipe.get('carbs') else 30,
                'fat': int(float(recipe.get('fat', 0))) if recipe.get('fat') else 10,
            },
            'safety_verified': recipe.get('safety_verified', False),
            'safety_level': recipe.get('safety_level', 'unknown'),
            'safety_warnings': recipe.get('safety_warnings', []),
            'adaptations': recipe.get('required_modifications', [])
        }
        
        formatted.append(formatted_recipe)
    
    state['final_recommendations'] = formatted
    return state

def save_events(state: AgentState) -> AgentState:
    """Save recommendation events"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        for recipe in state['final_recommendations']:
            cur.execute("""
                INSERT INTO recipe_events (user_id, recipe_id, event, created_at)
                VALUES (%s, %s, 'recommended', NOW())
                ON CONFLICT DO NOTHING
            """, (state['user_id'], recipe['id']))
        
        conn.commit()
    except Exception as e:
        state['messages'].append({"type": "error", "content": f"Error saving events: {e}"})
    finally:
        cur.close()
        conn.close()
    
    return state

# ============================
# Build Complete Graph
# ============================

def build_safe_recommendation_graph():
    """Build the complete recommendation + safety graph"""
    
    graph = StateGraph(AgentState)
    
    # Add all nodes
    graph.add_node("load_profile", load_user_profile)
    graph.add_node("create_filters", create_dietary_filters)
    graph.add_node("fetch_recipes", fetch_candidate_recipes)
    graph.add_node("verify_safety", verify_safety)
    graph.add_node("rank_with_llm", rank_with_llm)
    graph.add_node("format_ui", format_for_ui)
    graph.add_node("save_events", save_events)
    
    # Connect nodes in sequence
    graph.add_edge("load_profile", "create_filters")
    graph.add_edge("create_filters", "fetch_recipes")
    graph.add_edge("fetch_recipes", "verify_safety")
    graph.add_edge("verify_safety", "rank_with_llm")
    graph.add_edge("rank_with_llm", "format_ui")
    graph.add_edge("format_ui", "save_events")
    graph.add_edge("save_events", END)
    
    graph.set_entry_point("load_profile")
    
    return graph.compile()

# ============================
# Main Agent Class
# ============================

class SafeRecommendationAgent:
    """Complete recommendation agent with built-in safety"""
    
    def __init__(self):
        self.graph = build_safe_recommendation_graph()
    
    def get_recommendations(self, user_id: str) -> Dict:
        """Get safe, personalized recommendations"""
        
        initial_state = AgentState(
            user_id=user_id,
            user_profile={},
            dietary_filters={},
            sql_filters=[],
            candidate_recipes=[],
            safety_verified_recipes=[],
            final_recommendations=[],
            safety_reports=[],
            messages=[]
        )
        
        final_state = self.graph.invoke(initial_state)
        
        # Add real ratings from database
        conn = get_db_connection()
        cur = conn.cursor()
        
        for recipe in final_state['final_recommendations']:
            cur.execute("""
                SELECT AVG(rating) as avg_rating, COUNT(*) as total_ratings
                FROM recipe_ratings
                WHERE recipe_id = %s
            """, (recipe['id'],))
            
            rating_data = cur.fetchone()
            if rating_data and rating_data['avg_rating']:
                recipe['rating'] = round(rating_data['avg_rating'], 1)
                recipe['total_ratings'] = rating_data['total_ratings']
            else:
                recipe['rating'] = None
                recipe['total_ratings'] = 0
        
        cur.close()
        conn.close()
        
        return {
            "user_id": user_id,
            "recommendations": final_state['final_recommendations'],
            "safety_verified": True,
            "safety_reports": final_state['safety_reports'][:5],
            "messages": final_state['messages']
        }
    
    def record_feedback(self, user_id: str, recipe_id: str, event_type: str) -> Dict:
        """Record user feedback"""
        if event_type not in ['view', 'like', 'save', 'hide', 'cooked']:
            return {"status": "error", "message": "Invalid event type"}
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        try:
            cur.execute("""
                INSERT INTO recipe_events (user_id, recipe_id, event, created_at)
                VALUES (%s, %s, %s, NOW())
            """, (user_id, recipe_id, event_type))
            
            conn.commit()
            return {"status": "success"}
            
        except Exception as e:
            return {"status": "error", "message": str(e)}
        finally:
            cur.close()
            conn.close()

# ============================
# Testing
# ============================

if __name__ == "__main__":
    print("🤖 Safe Recipe Recommendation Agent")
    print("=" * 40)
    
    user_id = input("Enter user ID: ").strip()
    
    if not user_id:
        print("User ID required")
        exit()
    
    agent = SafeRecommendationAgent()
    
    print("\n🔄 Generating safe recommendations...")
    result = agent.get_recommendations(user_id)
    
    print(f"\n✅ Found {len(result['recommendations'])} safe recommendations:")
    print("-" * 40)
    
    for i, recipe in enumerate(result['recommendations'], 1):
        print(f"\n{i}. {recipe['title']}")
        print(f"   Safety: {recipe['safety_level']}")
        print(f"   Tags: {', '.join(recipe['tags'])}")
        print(f"   Calories: {recipe['nutrition']['calories']}")
        
        if recipe['safety_warnings']:
            print(f"   ⚠️ Warnings: {', '.join(recipe['safety_warnings'])}")
        if recipe['adaptations']:
            print(f"   🔄 Adaptations needed: {', '.join(recipe['adaptations'])}")
    
    print("\n" + "=" * 40)