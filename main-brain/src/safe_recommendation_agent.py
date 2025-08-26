"""
Safe Recommendation Agent - Fixed Version with Debugging
Location: main-brain/src/safe_recommendation_agent.py
"""

import os
import json
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, List, TypedDict, Optional
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
    recommended_recipes: List[Dict]
    error: Optional[str]
    messages: List[str]

class SafeRecommendationAgent:
    def __init__(self, llm_provider: str = None):
        """Initialize with chosen LLM provider"""
        # Test database connection first
        self._test_connection()
        self.llm = self._setup_llm(llm_provider)
        self.graph = self._build_graph()
    
    def _test_connection(self):
        """Test database connection on initialization"""
        try:
            print(f"🔄 Connecting to Supabase at {DB_CONFIG['host']}...")
            conn = psycopg2.connect(**DB_CONFIG)
            cur = conn.cursor()
            
            # Test basic connection
            cur.execute("SELECT 1")
            
            # Check if we have recipes
            cur.execute("SELECT COUNT(*) FROM recipes")
            recipe_count = cur.fetchone()[0]
            
            cur.close()
            conn.close()
            print(f"✅ Connected to Supabase! Found {recipe_count} recipes")
            
        except Exception as e:
            print(f"❌ Connection failed: {e}")
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
        """Build the LangGraph workflow"""
        workflow = StateGraph(GraphState)
        
        # Add nodes
        workflow.add_node("load_profile", self.load_user_profile)
        workflow.add_node("create_filters", self.create_dietary_filters)
        workflow.add_node("build_query", self.build_sql_query)
        workflow.add_node("fetch_recipes", self.fetch_candidate_recipes)
        workflow.add_node("rank_recipes", self.llm_ranking)
        workflow.add_node("save_events", self.save_recommendation_events)
        workflow.add_node("handle_error", self.handle_error)
        
        # Add edges
        workflow.add_edge("load_profile", "create_filters")
        workflow.add_edge("create_filters", "build_query")
        workflow.add_edge("build_query", "fetch_recipes")
        workflow.add_edge("fetch_recipes", "rank_recipes")
        workflow.add_edge("rank_recipes", "save_events")
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
            state['messages'].append(f"✅ Loaded profile for {profile.get('full_name', profile.get('email'))}")
            
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
        state['messages'].append(f"📋 Applied filters: {filters['diet_style']} diet, {len(allergies)} allergies")
        
        return state
    
    def build_sql_query(self, state: GraphState) -> GraphState:
        """Build SQL query matching your exact schema"""
        filters = state['dietary_filters']
        
        # Base query - simplified to avoid parameter issues
        query = """
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
                rn.per_serving->>'protein_g' as protein,
                rn.per_serving->>'carbs_g' as carbs,
                rn.per_serving->>'fat_g' as fat,
                rn.per_serving->>'fiber_g' as fiber,
                rn.per_serving->>'sugar_g' as sugar,
                rn.per_serving->>'sodium_mg' as sodium,
                COUNT(DISTINCT ri.id) as ingredient_count,
                LENGTH(r.instructions) - LENGTH(REPLACE(r.instructions, E'\n', '')) + 1 as instruction_steps
            FROM recipes r
            LEFT JOIN recipe_nutrients rn ON r.id = rn.recipe_id
            LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id
            WHERE r.instructions IS NOT NULL
            AND r.instructions != ''
        """
        
        conditions = []
        
        # Apply allergen filters using proper SQL escaping
        if filters['allergies']:
            for allergen in filters['allergies']:
                if allergen:
                    allergen_lower = allergen.lower().replace("'", "''")  # Escape single quotes
                    
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
                    
                    # Get the correct search terms
                    terms = allergen_patterns.get(allergen_lower, [allergen_lower.split('/')[0]])
                    
                    # Build exclusion conditions
                    exclusion_conditions = []
                    for term in terms:
                        term_escaped = term.replace("'", "''")
                        exclusion_conditions.append(
                            f"LOWER(ri2.ingredient_name) LIKE '%{term_escaped}%'"
                        )
                    
                    if exclusion_conditions:
                        conditions.append(f"""
                            NOT EXISTS (
                                SELECT 1 FROM recipe_ingredients ri2 
                                WHERE ri2.recipe_id = r.id 
                                AND ({' OR '.join(exclusion_conditions)})
                            )
                        """)
        
        # Medical condition filters
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
            ORDER BY RANDOM()
            LIMIT 50
        """
        
        state['sql_query'] = query
        state['messages'].append("🔍 Built safety-first query")
        
        return state
    
    def fetch_candidate_recipes(self, state: GraphState) -> GraphState:
        """Fetch recipes matching filters with better error handling"""
        try:
            conn = psycopg2.connect(**DB_CONFIG)
            cur = conn.cursor(cursor_factory=RealDictCursor)
            
            # Debug: Print the query
            print("\n📝 SQL Query being executed:")
            print(state['sql_query'][:500] + "..." if len(state['sql_query']) > 500 else state['sql_query'])
            
            # Execute the query without parameters since we're not using placeholders
            cur.execute(state['sql_query'])
            recipes = cur.fetchall()
            
            state['candidate_recipes'] = [dict(r) for r in recipes] if recipes else []
            state['messages'].append(f"📚 Found {len(state['candidate_recipes'])} safe recipes")
            
            # Debug: Show sample recipe if found
            if state['candidate_recipes']:
                print(f"\n✅ Sample recipe found: {state['candidate_recipes'][0]['title']}")
            else:
                print("\n⚠️ No recipes found matching criteria")
            
            cur.close()
            conn.close()
            
        except psycopg2.Error as e:
            error_msg = f"Database error: {e.pgerror if hasattr(e, 'pgerror') else str(e)}"
            state['error'] = error_msg
            state['candidate_recipes'] = []
            print(f"\n❌ SQL Error: {error_msg}")
            
        except Exception as e:
            error_msg = f"Failed to fetch recipes: {str(e)}"
            state['error'] = error_msg
            state['candidate_recipes'] = []
            print(f"\n❌ Error: {error_msg}")
            print(f"Traceback: {traceback.format_exc()}")
            
        return state
    
    def llm_ranking(self, state: GraphState) -> GraphState:
        """Use LLM to rank and select best recipes"""
        if not state['candidate_recipes']:
            # If no recipes due to strict filters, try to get some without filters
            try:
                conn = psycopg2.connect(**DB_CONFIG)
                cur = conn.cursor(cursor_factory=RealDictCursor)
                
                # Get ANY recipes as fallback
                cur.execute("""
                    SELECT 
                        r.id, r.title, r.category, r.area as cuisine,
                        r.image_url, r.instructions,
                        COALESCE(rn.per_serving->>'kcal', '0') as calories,
                        rn.per_serving->>'protein_g' as protein
                    FROM recipes r
                    LEFT JOIN recipe_nutrients rn ON r.id = rn.recipe_id
                    WHERE r.instructions IS NOT NULL
                    ORDER BY RANDOM()
                    LIMIT 5
                """)
                
                fallback_recipes = cur.fetchall()
                if fallback_recipes:
                    state['recommended_recipes'] = [dict(r) for r in fallback_recipes]
                    for rec in state['recommended_recipes']:
                        rec['recommendation_reason'] = "General recommendation (filters were too restrictive)"
                    state['messages'].append("📋 Using general recipes (filters too restrictive)")
                else:
                    state['recommended_recipes'] = []
                    state['messages'].append("⚠️ No recipes available")
                
                cur.close()
                conn.close()
            except:
                state['recommended_recipes'] = []
                state['messages'].append("⚠️ No recipes found")
            
            return state
        
        # Normal LLM ranking for found recipes
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
            "category": r.get('category', 'N/A')
        } for r in state['candidate_recipes'][:20]], indent=2)
        
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
                    recipe = next((r for r in state['candidate_recipes'] 
                                 if str(r['id']) == str(rec['id'])), None)
                    if recipe:
                        recipe['recommendation_reason'] = rec.get('reason', 'Matches preferences')
                        recommended_recipes.append(recipe)
                
                state['recommended_recipes'] = recommended_recipes
                state['messages'].append(f"✨ LLM selected {len(recommended_recipes)} recipes")
            else:
                # Fallback: just use top 5
                state['recommended_recipes'] = state['candidate_recipes'][:5]
                for rec in state['recommended_recipes']:
                    rec['recommendation_reason'] = "Matches dietary preferences"
                state['messages'].append("📋 Using top 5 recipes")
                
        except Exception as e:
            # Fallback on error
            state['recommended_recipes'] = state['candidate_recipes'][:5]
            for rec in state['recommended_recipes']:
                rec['recommendation_reason'] = "Selected based on filters"
            state['messages'].append(f"⚠️ LLM ranking skipped: {str(e)}")
            
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
            
            state['messages'].append("💾 Saved events")
            
        except Exception as e:
            state['messages'].append(f"⚠️ Failed to save events: {str(e)}")
            
        return state
    
    def handle_error(self, state: GraphState) -> GraphState:
        """Handle errors"""
        print(f"❌ Error: {state['error']}")
        return state
    
    def get_recommendations(self, user_id: str) -> Dict:
        """Get recommendations for a user"""
        initial_state = {
            "user_id": user_id,
            "user_profile": None,
            "dietary_filters": {},
            "sql_query": None,
            "candidate_recipes": [],
            "recommended_recipes": [],
            "error": None,
            "messages": []
        }
        
        try:
            final_state = self.graph.invoke(initial_state)
        except Exception as e:
            print(f"❌ Graph execution error: {str(e)}")
            print(f"Traceback: {traceback.format_exc()}")
            final_state = initial_state
            final_state['error'] = str(e)
        
        return {
            "user_id": user_id,
            "recommendations": [
                {
                    "id": str(r['id']),
                    "title": r['title'],
                    "image_url": r.get('image_url'),
                    "category": r.get('category'),
                    "cuisine": r.get('cuisine'),
                    "calories": r.get('calories'),
                    "protein": r.get('protein'),
                    "recommendation_reason": r.get('recommendation_reason', 'Matches your preferences')
                }
                for r in final_state.get('recommended_recipes', [])
            ],
            "filters_applied": final_state.get('dietary_filters', {}),
            "messages": final_state.get('messages', []),
            "error": final_state.get('error')
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
    print("🤖 Safe Recommendation Agent (Debug Version)")
    print("=" * 50)
    
    try:
        agent = SafeRecommendationAgent()
        
        test_user_id = input("\nEnter user ID (UUID) to test: ").strip()
        
        if test_user_id:
            print(f"\n📋 Getting recommendations for: {test_user_id}")
            
            result = agent.get_recommendations(test_user_id)
            
            if result['error']:
                print(f"\n❌ Error: {result['error']}")
            else:
                print(f"\n✅ Process:")
                for msg in result['messages']:
                    print(f"   {msg}")
                
                if result['recommendations']:
                    print(f"\n🍽️ Recommendations ({len(result['recommendations'])} recipes):")
                    for i, rec in enumerate(result['recommendations'], 1):
                        print(f"\n{i}. {rec['title']}")
                        if rec.get('calories'):
                            print(f"   📊 {rec['calories']} cal | {rec.get('protein', 'N/A')}g protein")
                        print(f"   💡 {rec['recommendation_reason']}")
                else:
                    print("\n⚠️ No recipes recommended")
    except Exception as e:
        print(f"\n❌ Failed: {e}")