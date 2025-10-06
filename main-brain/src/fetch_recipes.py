"""
================================================================================
ENHANCED RECIPE FETCHER FOR SUPABASE - WITH EDAMAM INTEGRATION
================================================================================
Location: main-brain/src/fetch_recipes.py
Purpose: Fetch recipes from TheMealDB, Edamam + nutrition from USDA & Edamam
================================================================================
"""

import os
import sys
import re
import time
import json
import requests
import psycopg2
from psycopg2.extras import Json
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from pathlib import Path

# ============================
# SECTION 1: ENVIRONMENT SETUP
# ============================

sys.path.append(str(Path(__file__).parent.parent))

try:
    from dotenv import load_dotenv
    
    env_path = Path(__file__).parent.parent / '.env'
    
    if env_path.exists():
        load_dotenv(env_path)
        print(f"✅ Loaded environment from: {env_path}")
    else:
        print(f"❌ No .env file found at: {env_path}")
        print("Please create main-brain/.env with your database credentials")
        sys.exit(1)
        
except ImportError:
    print("❌ Please install python-dotenv:")
    print("   pip install python-dotenv")
    sys.exit(1)

# ============================
# SECTION 2: CONFIGURATION
# ============================

# Database connection parameters
DB_PARAMS = {
    'host': os.getenv('SUPABASE_HOST'),
    'dbname': os.getenv('SUPABASE_DB', 'postgres'),
    'user': os.getenv('SUPABASE_USER', 'postgres'),
    'password': os.getenv('SUPABASE_PASSWORD'),
    'port': int(os.getenv('SUPABASE_PORT', '5432')),
    'sslmode': os.getenv('SUPABASE_SSLMODE', 'require')
}

# API Keys
THEMEALDB_KEY = os.getenv('THEMEALDB_KEY', '1')
USDA_API_KEY = os.getenv('USDA_API_KEY', '')
EDAMAM_APP_ID = os.getenv('EDAMAM_APP_ID', '')       # NEW: Edamam App ID
EDAMAM_APP_KEY = os.getenv('EDAMAM_APP_KEY', '')     # NEW: Edamam App Key

# API URLs
BASE_URL = f"https://www.themealdb.com/api/json/v1/{THEMEALDB_KEY}"
FDC_BASE_URL = "https://api.nal.usda.gov/fdc/v1"
EDAMAM_BASE_URL = "https://api.edamam.com/api/recipes/v2"  # NEW: Edamam API

# MealDB category counts
CATEGORY_COUNTS = {
    "Beef": 42, "Chicken": 35, "Dessert": 65, "Lamb": 7,
    "Miscellaneous": 19, "Pasta": 10, "Pork": 10, "Seafood": 32,
    "Side": 13, "Starter": 25, "Vegan": 6, "Vegetarian": 33,
    "Breakfast": 7, "Goat": 1
}

# NEW: Edamam search queries for diversity
EDAMAM_QUERIES = {
    'breakfast': ['pancakes', 'omelette', 'breakfast burrito', 'french toast', 'smoothie bowl'],
    'lunch': ['salad', 'sandwich', 'wrap', 'soup', 'burger'],
    'dinner': ['pasta', 'steak', 'chicken', 'fish', 'curry', 'stir fry'],
    'dessert': ['cake', 'cookies', 'ice cream', 'pie', 'brownies'],
    'snack': ['muffins', 'energy balls', 'nachos', 'hummus'],
    'cuisine': ['italian', 'mexican', 'chinese', 'indian', 'thai', 'japanese', 'mediterranean']
}

print(f"📂 Script location: {Path(__file__)}")
print(f"📂 .env location: {env_path}")

# ============================
# SECTION 3: DATABASE CONNECTION
# ============================

def get_db_connection():
    """Create a direct database connection to Supabase PostgreSQL"""
    try:
        if not DB_PARAMS['host'] or not DB_PARAMS['password']:
            print("\n❌ Database credentials missing!")
            print("\nYour main-brain/.env should contain:")
            print("SUPABASE_HOST=db.yourproject.supabase.co")
            print("SUPABASE_PASSWORD=your-database-password")
            print("\nTo get these:")
            print("1. Go to Supabase Dashboard → Settings → Database")
            print("2. Reset database password if needed")
            print("3. Use the new password in .env")
            sys.exit(1)
        
        print(f"🔌 Connecting to: {DB_PARAMS['host']}")
        conn = psycopg2.connect(**DB_PARAMS)
        print("✅ Database connected successfully")
        return conn
        
    except psycopg2.OperationalError as e:
        print(f"\n❌ Connection failed: {e}")
        print("\nPossible issues:")
        print("1. Wrong password - Reset it in Supabase Dashboard")
        print("2. Wrong host - Should be db.yourproject.supabase.co")
        print("3. Network issues - Check your internet connection")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        sys.exit(1)

# ============================
# SECTION 4: RATE LIMITING
# ============================

class RateLimiter:
    """Ensures we don't exceed API rate limits"""
    def __init__(self, calls_per_second=5):
        self.calls_per_second = calls_per_second
        self.min_interval = 1.0 / calls_per_second
        self.last_call = 0
    
    def wait(self):
        """Wait if necessary before making next API call"""
        elapsed = time.time() - self.last_call
        if elapsed < self.min_interval:
            sleep_time = self.min_interval - elapsed
            time.sleep(sleep_time)
        self.last_call = time.time()

# Create rate limiters for each API
mealdb_limiter = RateLimiter(5)
fdc_limiter = RateLimiter(5)
edamam_limiter = RateLimiter(10)  # NEW: Edamam allows 10/min on free tier

# ============================
# SECTION 5: INGREDIENT PARSING
# ============================

def parse_quantity_unit(measure_text: str) -> Tuple[Optional[float], Optional[str], Optional[float]]:
    """Parse measurement text to extract quantity, unit, and estimated grams"""
    if not measure_text:
        return None, None, None
    
    measure = measure_text.lower().strip()
    measure = re.sub(r'\s+', ' ', measure)
    
    # Convert Unicode fractions to decimals
    fraction_map = {
        '½': '0.5', '¼': '0.25', '¾': '0.75',
        '⅓': '0.333', '⅔': '0.667',
        '⅛': '0.125', '⅜': '0.375', '⅝': '0.625', '⅞': '0.875'
    }
    for frac, decimal in fraction_map.items():
        measure = measure.replace(frac, decimal)
    
    qty = None
    unit = None
    grams = None
    
    patterns = [
        r'^(\d+\.?\d*)\s*(.*)$',
        r'^(\d+)/(\d+)\s*(.*)$',
        r'^(\d+)\s+(\d+)/(\d+)\s*(.*)$',
    ]
    
    rest = measure
    
    for pattern in patterns:
        match = re.match(pattern, measure)
        if match:
            groups = match.groups()
            if len(groups) == 2:
                qty = float(groups[0])
                rest = groups[1]
            elif len(groups) == 3:
                qty = float(groups[0]) / float(groups[1])
                rest = groups[2]
            elif len(groups) == 4:
                whole = float(groups[0])
                fraction = float(groups[1]) / float(groups[2])
                qty = whole + fraction
                rest = groups[3]
            break
    
    if rest:
        unit_mapping = {
            'tsp': ['tsp', 'teaspoon', 'teaspoons', 't'],
            'tbsp': ['tbsp', 'tablespoon', 'tablespoons', 'tbs'],
            'cup': ['cup', 'cups', 'c'],
            'oz': ['oz', 'ounce', 'ounces'],
            'lb': ['lb', 'pound', 'pounds', 'lbs'],
            'g': ['g', 'gram', 'grams', 'gr'],
            'kg': ['kg', 'kilogram', 'kilograms'],
            'ml': ['ml', 'milliliter', 'milliliters'],
            'l': ['l', 'liter', 'liters'],
        }
        
        words = rest.split()
        if words:
            first_word = words[0].lower()
            for standard_unit, variations in unit_mapping.items():
                if first_word in variations:
                    unit = standard_unit
                    break
    
    if qty and unit:
        gram_conversions = {
            'tsp': 5, 'tbsp': 15, 'cup': 240, 'oz': 28.35,
            'lb': 453.6, 'g': 1, 'kg': 1000, 'ml': 1, 'l': 1000,
        }
        
        if unit in gram_conversions:
            grams = qty * gram_conversions[unit]
    
    return qty, unit, grams

# ============================
# SECTION 6: USDA NUTRITION DATA
# ============================

def search_fdc_food(ingredient_name: str) -> Optional[Dict]:
    """Search USDA FoodData Central for nutritional information"""
    if not USDA_API_KEY:
        return None
    
    try:
        fdc_limiter.wait()
        
        params = {
            'query': ingredient_name,
            'limit': 1,
            'api_key': USDA_API_KEY
        }
        
        response = requests.get(
            f"{FDC_BASE_URL}/foods/search",
            params=params,
            timeout=10
        )
        response.raise_for_status()
        data = response.json()
        
        if data.get('foods') and len(data['foods']) > 0:
            food = data['foods'][0]
            return {
                'fdc_id': food.get('fdcId'),
                'description': food.get('description'),
                'data_type': food.get('dataType'),
                'brand_owner': food.get('brandOwner'),
                'nutrients': food.get('foodNutrients', []),
                'portions': food.get('foodPortions', [])
            }
    except Exception as e:
        print(f"    ⚠️  FDC search failed for {ingredient_name}: {e}")
    
    return None

def store_fdc_food(conn, fdc_data: Dict):
    """Store USDA food data in foods_fdc table for caching"""
    if not fdc_data:
        return
    
    cur = conn.cursor()
    try:
        cur.execute("""
            INSERT INTO foods_fdc (
                fdc_id, description, data_type, brand_owner, nutrients, portions
            ) VALUES (%s, %s, %s, %s, %s, %s)
            ON CONFLICT (fdc_id) DO UPDATE SET
                description = EXCLUDED.description,
                nutrients = EXCLUDED.nutrients,
                updated_at = NOW()
        """, (
            fdc_data['fdc_id'],
            fdc_data['description'],
            fdc_data['data_type'],
            fdc_data['brand_owner'],
            Json(fdc_data['nutrients']),
            Json(fdc_data['portions'])
        ))
        conn.commit()
    except Exception as e:
        conn.rollback()
        print(f"    ⚠️  Error storing FDC data: {e}")
    finally:
        cur.close()

def calculate_recipe_nutrition(conn, recipe_id: str):
    """Calculate total nutrition for a recipe by summing all ingredients"""
    cur = conn.cursor()
    
    try:
        cur.execute("""
            SELECT ri.grams, f.nutrients
            FROM recipe_ingredients ri
            JOIN foods_fdc f ON f.fdc_id = ri.fdc_id
            WHERE ri.recipe_id = %s AND ri.grams IS NOT NULL
        """, (recipe_id,))
        
        ingredients = cur.fetchall()
        
        total_nutrients = {
            'kcal': 0, 'protein_g': 0, 'fat_g': 0,
            'carbs_g': 0, 'fiber_g': 0, 'sugar_g': 0, 'sodium_mg': 0
        }
        
        nutrient_mapping = {
            'Energy': 'kcal',
            'Protein': 'protein_g',
            'Total lipid (fat)': 'fat_g',
            'Carbohydrate, by difference': 'carbs_g',
            'Fiber, total dietary': 'fiber_g',
            'Sugars, total including NLEA': 'sugar_g',
            'Sodium, Na': 'sodium_mg'
        }
        
        for grams, nutrients_json in ingredients:
            if not nutrients_json:
                continue
            
            grams = float(grams)
            
            for nutrient in nutrients_json:
                name = nutrient.get('nutrientName', '')
                value = nutrient.get('value', 0)
                
                if name in nutrient_mapping:
                    key = nutrient_mapping[name]
                    total_nutrients[key] += (float(value) * grams / 100)
        
        total_nutrients = {k: round(v, 2) for k, v in total_nutrients.items()}
        
        servings = 4
        per_serving = {k: round(v / servings, 2) for k, v in total_nutrients.items()}
        
        cur.execute("""
            INSERT INTO recipe_nutrients (
                recipe_id, total, per_serving, servings
            ) VALUES (%s, %s, %s, %s)
            ON CONFLICT (recipe_id) DO UPDATE SET
                total = EXCLUDED.total,
                per_serving = EXCLUDED.per_serving,
                updated_at = NOW()
        """, (recipe_id, Json(total_nutrients), Json(per_serving), servings))
        
        conn.commit()
        
    except Exception as e:
        conn.rollback()
        print(f"    ⚠️  Error calculating nutrition: {e}")
    finally:
        cur.close()

# ============================
# NEW SECTION 6B: EDAMAM NUTRITION
# ============================

def extract_edamam_nutrition(recipe_data: Dict) -> Tuple[Dict, Dict, int]:
    """
    Extract nutrition data from Edamam recipe response
    Returns: (total_nutrients, per_serving_nutrients, servings)
    """
    nutrition = recipe_data.get('totalNutrients', {})
    servings = recipe_data.get('yield', 4)  # Edamam provides serving count
    
    # Map Edamam nutrients to our schema
    total_nutrients = {
        'kcal': round(nutrition.get('ENERC_KCAL', {}).get('quantity', 0), 2),
        'protein_g': round(nutrition.get('PROCNT', {}).get('quantity', 0), 2),
        'fat_g': round(nutrition.get('FAT', {}).get('quantity', 0), 2),
        'carbs_g': round(nutrition.get('CHOCDF', {}).get('quantity', 0), 2),
        'fiber_g': round(nutrition.get('FIBTG', {}).get('quantity', 0), 2),
        'sugar_g': round(nutrition.get('SUGAR', {}).get('quantity', 0), 2),
        'sodium_mg': round(nutrition.get('NA', {}).get('quantity', 0), 2)
    }
    
    # Calculate per serving
    per_serving = {k: round(v / servings, 2) for k, v in total_nutrients.items()}
    
    return total_nutrients, per_serving, servings

def store_edamam_nutrition(conn, recipe_id: str, recipe_data: Dict):
    """Store Edamam nutrition data directly (no ingredient calculation needed)"""
    cur = conn.cursor()
    
    try:
        total_nutrients, per_serving, servings = extract_edamam_nutrition(recipe_data)
        
        cur.execute("""
            INSERT INTO recipe_nutrients (
                recipe_id, total, per_serving, servings, source
            ) VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (recipe_id) DO UPDATE SET
                total = EXCLUDED.total,
                per_serving = EXCLUDED.per_serving,
                servings = EXCLUDED.servings,
                source = EXCLUDED.source,
                updated_at = NOW()
        """, (recipe_id, Json(total_nutrients), Json(per_serving), servings, 'Edamam'))
        
        conn.commit()
        
    except Exception as e:
        conn.rollback()
        print(f"    ⚠️  Error storing Edamam nutrition: {e}")
    finally:
        cur.close()

# ============================
# SECTION 7: MEALDB API FUNCTIONS
# ============================

def fetch_with_retry(url: str, retries: int = 3) -> Optional[Dict]:
    """Fetch data from URL with retry logic"""
    for attempt in range(retries):
        try:
            mealdb_limiter.wait()
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            if attempt == retries - 1:
                print(f"    ❌ Failed after {retries} attempts: {e}")
                return None
            time.sleep(2 ** attempt)
    return None

def fetch_all_categories() -> List[Dict]:
    """Get all meal categories from TheMealDB"""
    print("\n🔍 Fetching categories from TheMealDB...")
    data = fetch_with_retry(f"{BASE_URL}/categories.php")
    if data and 'categories' in data:
        return data['categories']
    return []

def fetch_meals_by_category(category: str) -> List[Dict]:
    """Get all meals in a specific category"""
    data = fetch_with_retry(f"{BASE_URL}/filter.php?c={category}")
    if data and 'meals' in data:
        return data['meals']
    return []

def fetch_meal_details(meal_id: str) -> Optional[Dict]:
    """Get complete details for a specific meal"""
    data = fetch_with_retry(f"{BASE_URL}/lookup.php?i={meal_id}")
    if data and 'meals' in data and data['meals']:
        return data['meals'][0]
    return None

# ============================
# NEW SECTION 7B: EDAMAM API FUNCTIONS
# ============================

def fetch_edamam_recipes(query: str, meal_type: str = None, cuisine: str = None, max_results: int = 20) -> List[Dict]:
    """
    Fetch recipes from Edamam Recipe API
    
    Args:
        query: Search term (e.g., "chicken", "pasta")
        meal_type: breakfast, lunch, dinner, snack
        cuisine: italian, mexican, asian, etc.
        max_results: Number of recipes to fetch
    
    Returns: List of recipe dictionaries
    """
    if not EDAMAM_APP_ID or not EDAMAM_APP_KEY:
        print("⚠️  Edamam credentials missing. Add to .env:")
        print("EDAMAM_APP_ID=your_app_id")
        print("EDAMAM_APP_KEY=your_app_key")
        return []
    
    recipes = []
    
    try:
        edamam_limiter.wait()
        
        params = {
            'type': 'public',
            'q': query,
            'app_id': EDAMAM_APP_ID,
            'app_key': EDAMAM_APP_KEY,
            'to': max_results  # Fetch up to max_results
        }
        
        # Add optional filters
        if meal_type:
            params['mealType'] = meal_type
        if cuisine:
            params['cuisineType'] = cuisine
        
        print(f"    🔍 Searching Edamam: '{query}' (type: {meal_type or 'any'}, cuisine: {cuisine or 'any'})")
        
        response = requests.get(EDAMAM_BASE_URL, params=params, timeout=15)
        response.raise_for_status()
        data = response.json()
        
        # Extract recipes from hits
        for hit in data.get('hits', []):
            recipe = hit.get('recipe', {})
            if recipe:
                recipes.append(recipe)
        
        print(f"    ✅ Found {len(recipes)} recipes")
        
    except Exception as e:
        print(f"    ❌ Edamam fetch failed: {e}")
    
    return recipes

def parse_edamam_ingredients(recipe_data: Dict) -> List[Dict]:
    """
    Parse Edamam ingredient format to our format
    
    Edamam provides:
    - ingredients: [{text, quantity, measure, food, weight}]
    
    We convert to:
    - [{raw, ingredient_name, measure_text, qty, unit, grams}]
    """
    parsed_ingredients = []
    
    for idx, ingredient in enumerate(recipe_data.get('ingredients', []), 1):
        # Edamam provides better structured data
        raw_text = ingredient.get('text', '')
        food_name = ingredient.get('food', '')
        quantity = ingredient.get('quantity', 0)
        measure = ingredient.get('measure', '')
        weight = ingredient.get('weight', 0)  # Grams!
        
        # Build measure text
        measure_text = f"{quantity} {measure}".strip() if quantity and measure else measure
        
        parsed_ingredients.append({
            'position': idx,
            'raw': raw_text,
            'ingredient_name': food_name,
            'measure_text': measure_text,
            'qty': quantity if quantity else None,
            'unit': measure if measure else None,
            'grams': weight if weight > 0 else None
        })
    
    return parsed_ingredients

# ============================
# SECTION 8: DATABASE OPERATIONS
# ============================

def upsert_recipe(conn, meal: Dict, source: str = 'TheMealDB') -> Optional[str]:
    """
    Insert or update a recipe in the database
    Supports both MealDB and Edamam formats
    """
    cur = conn.cursor()
    
    try:
        if source == 'TheMealDB':
            # MealDB format
            tags = None
            if meal.get('strTags'):
                tags = [tag.strip() for tag in meal['strTags'].split(',') if tag.strip()]
            
            cur.execute("""
                INSERT INTO recipes (
                    source, source_id, title, image_url, category, area, 
                    tags, youtube_url, instructions, instructions_source_url, 
                    servings
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                )
                ON CONFLICT (source_id) DO UPDATE SET
                    title = EXCLUDED.title,
                    image_url = EXCLUDED.image_url,
                    updated_at = NOW()
                RETURNING id
            """, (
                'TheMealDB',
                meal['idMeal'],
                meal['strMeal'],
                meal.get('strMealThumb'),
                meal.get('strCategory'),
                meal.get('strArea'),
                tags,
                meal.get('strYoutube'),
                meal.get('strInstructions'),
                meal.get('strSource'),
                4
            ))
        
        elif source == 'Edamam':
            # Edamam format
            recipe = meal  # 'meal' is actually Edamam recipe object
            
            # Extract dietary/health labels as tags
            tags = []
            if recipe.get('healthLabels'):
                tags.extend(recipe['healthLabels'][:5])  # Top 5 health labels
            if recipe.get('dietLabels'):
                tags.extend(recipe['dietLabels'])
            
            # Map meal type to category
            meal_types = recipe.get('mealType', [])
            category = meal_types[0] if meal_types else 'Miscellaneous'
            
            # Map cuisine to area
            cuisines = recipe.get('cuisineType', [])
            area = cuisines[0] if cuisines else None
            
            # Create source_id from URI
            source_id = recipe.get('uri', '').split('#')[-1]
            
            cur.execute("""
                INSERT INTO recipes (
                    source, source_id, title, image_url, category, area, 
                    tags, youtube_url, instructions, instructions_source_url, 
                    servings
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                )
                ON CONFLICT (source_id) DO UPDATE SET
                    title = EXCLUDED.title,
                    image_url = EXCLUDED.image_url,
                    updated_at = NOW()
                RETURNING id
            """, (
                'Edamam',
                source_id,
                recipe.get('label'),  # Recipe name
                recipe.get('image'),
                category.capitalize(),
                area.capitalize() if area else None,
                tags,
                None,  # Edamam doesn't have YouTube links
                '\n'.join(recipe.get('ingredientLines', [])),  # Instructions as ingredient list
                recipe.get('url'),  # Source URL
                int(recipe.get('yield', 4))
            ))
        
        recipe_id = cur.fetchone()[0]
        conn.commit()
        return recipe_id
        
    except Exception as e:
        conn.rollback()
        print(f"    ❌ Error inserting recipe: {e}")
        return None
    finally:
        cur.close()

def upsert_ingredients(conn, recipe_id: str, meal: Dict, source: str = 'TheMealDB', fetch_nutrition: bool = False):
    """Insert ingredients - supports both MealDB and Edamam formats"""
    cur = conn.cursor()
    
    try:
        cur.execute("DELETE FROM recipe_ingredients WHERE recipe_id = %s", (recipe_id,))
        
        if source == 'TheMealDB':
            # Original MealDB logic
            for i in range(1, 21):
                ingredient = (meal.get(f'strIngredient{i}') or '').strip()
                measure = (meal.get(f'strMeasure{i}') or '').strip()
                
                if ingredient:
                    qty, unit, grams = parse_quantity_unit(measure)
                    raw_text = f"{measure} {ingredient}".strip() if measure else ingredient
                    
                    fdc_id = None
                    if fetch_nutrition and USDA_API_KEY:
                        fdc_data = search_fdc_food(ingredient)
                        if fdc_data:
                            fdc_id = fdc_data['fdc_id']
                            store_fdc_food(conn, fdc_data)
                    
                    cur.execute("""
                        INSERT INTO recipe_ingredients (
                            recipe_id, position, raw, ingredient_name, 
                            measure_text, qty, unit, grams, fdc_id
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, (recipe_id, i, raw_text, ingredient, measure, qty, unit, grams, fdc_id))
        
        elif source == 'Edamam':
            # Edamam format - already well structured!
            parsed = parse_edamam_ingredients(meal)
            
            for ing in parsed:
                cur.execute("""
                    INSERT INTO recipe_ingredients (
                        recipe_id, position, raw, ingredient_name, 
                        measure_text, qty, unit, grams, fdc_id
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    recipe_id,
                    ing['position'],
                    ing['raw'],
                    ing['ingredient_name'],
                    ing['measure_text'],
                    ing['qty'],
                    ing['unit'],
                    ing['grams'],
                    None  # Edamam provides nutrition at recipe level, not ingredient
                ))
        
        conn.commit()
        
    except Exception as e:
        conn.rollback()
        print(f"    ❌ Error inserting ingredients: {e}")
    finally:
        cur.close()

# ============================
# SECTION 9: MAIN FETCHING FUNCTIONS
# ============================

def fetch_all_mealdb_recipes(with_nutrition: bool = False):
    """Main function for MealDB recipes"""
    print("\n" + "=" * 60)
    print("🍽️  FETCHING ALL RECIPES FROM THEMEALDB")
    if with_nutrition:
        print("🥗 WITH NUTRITION DATA FROM USDA")
    print("=" * 60)
    
    if with_nutrition and not USDA_API_KEY:
        print("\n⚠️  No USDA API key found!")
        cont = input("\nContinue without nutrition? (y/n): ").strip().lower()
        if cont != 'y':
            return
        with_nutrition = False
    
    conn = get_db_connection()
    
    try:
        categories = fetch_all_categories()
        print(f"✅ Found {len(categories)} categories\n")
        
        total_recipes = 0
        
        for category_data in categories:
            category_name = category_data['strCategory']
            meals = fetch_meals_by_category(category_name)
            print(f"\n🔍 Processing {category_name}: {len(meals)} meals")
            
            for idx, meal_summary in enumerate(meals, 1):
                if idx % 10 == 0:
                    print(f"    Progress: {idx}/{len(meals)}")
                
                meal_details = fetch_meal_details(meal_summary['idMeal'])
                if not meal_details:
                    continue
                
                recipe_uuid = upsert_recipe(conn, meal_details, 'TheMealDB')
                if recipe_uuid:
                    upsert_ingredients(conn, recipe_uuid, meal_details, 'TheMealDB', with_nutrition)
                    
                    if with_nutrition:
                        calculate_recipe_nutrition(conn, recipe_uuid)
                    
                    total_recipes += 1
        
        print(f"\n✅ Fetched {total_recipes} recipes from TheMealDB")
        
    except Exception as e:
        print(f"\n❌ Fatal error: {e}")
        conn.rollback()
    finally:
        conn.close()

def fetch_edamam_recipes_diverse(max_per_query: int = 20):
    """
    Fetch diverse recipes from Edamam using multiple queries
    Edamam provides BOTH recipes AND nutrition in one call!
    """
    print("\n" + "=" * 60)
    print("🌟 FETCHING DIVERSE RECIPES FROM EDAMAM")
    print("📊 WITH BUILT-IN NUTRITION DATA")
    print("=" * 60)
    
    if not EDAMAM_APP_ID or not EDAMAM_APP_KEY:
        print("\n❌ Edamam credentials missing!")
        print("\nAdd to main-brain/.env:")
        print("EDAMAM_APP_ID=your_app_id")
        print("EDAMAM_APP_KEY=your_app_key")
        print("\nGet free API key at: https://developer.edamam.com/")
        return
    
    conn = get_db_connection()
    total_recipes = 0
    
    try:
        # Fetch from multiple categories for diversity
        for category, queries in EDAMAM_QUERIES.items():
            print(f"\n📂 Category: {category.upper()}")
            
            for query in queries:
                # Determine meal type
                meal_type = category if category in ['breakfast', 'lunch', 'dinner', 'snack'] else None
                
                # Fetch recipes
                recipes = fetch_edamam_recipes(
                    query=query,
                    meal_type=meal_type,
                    max_results=max_per_query
                )
                
                # Store each recipe
                for recipe in recipes:
                    recipe_id = upsert_recipe(conn, recipe, 'Edamam')
                    
                    if recipe_id:
                        # Store ingredients (Edamam format)
                        upsert_ingredients(conn, recipe_id, recipe, 'Edamam', fetch_nutrition=False)
                        
                        # Store nutrition (Edamam provides this directly!)
                        store_edamam_nutrition(conn, recipe_id, recipe)
                        
                        total_recipes += 1
                
                # Rate limit between queries
                time.sleep(1)
        
        print("\n" + "=" * 60)
        print("✅ EDAMAM FETCH COMPLETE!")
        print("=" * 60)
        print(f"📊 Total recipes from Edamam: {total_recipes}")
        
    except Exception as e:
        print(f"\n❌ Fatal error: {e}")
        conn.rollback()
    finally:
        conn.close()

def fetch_all_sources_combined(mealdb_nutrition: bool = False, edamam_count: int = 20):
    """
    Fetch from BOTH MealDB and Edamam for maximum diversity
    
    Result: 300+ MealDB recipes + 1000+ Edamam recipes = 1300+ total!
    """
    print("\n" + "=" * 80)
    print("🚀 FETCHING FROM ALL SOURCES - MEALDB + EDAMAM")
    print("=" * 80)
    
    # First fetch MealDB
    print("\n📍 STEP 1: Fetching TheMealDB recipes...")
    fetch_all_mealdb_recipes(with_nutrition=mealdb_nutrition)
    
    # Then fetch Edamam
    print("\n📍 STEP 2: Fetching Edamam recipes...")
    fetch_edamam_recipes_diverse(max_per_query=edamam_count)
    
    # Show final stats
    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute("SELECT source, COUNT(*) FROM recipes GROUP BY source")
    stats = cur.fetchall()
    
    print("\n" + "=" * 80)
    print("🎉 ALL SOURCES FETCHED SUCCESSFULLY!")
    print("=" * 80)
    print("\n📊 Final Database Statistics:")
    
    total = 0
    for source, count in stats:
        print(f"  • {source}: {count} recipes")
        total += count
    
    print(f"\n  🏆 TOTAL RECIPES: {total}")
    
    cur.execute("SELECT COUNT(*) FROM recipe_nutrients")
    nutrition_count = cur.fetchone()[0]
    print(f"  📊 Recipes with nutrition: {nutrition_count}")
    
    cur.close()
    conn.close()

# ============================
# SECTION 10: UTILITY FUNCTIONS
# ============================

def test_connection():
    """Test database connection and show current table status"""
    print("\n🔍 Testing database connection...")
    
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        tables = ['recipes', 'recipe_ingredients', 'foods_fdc', 'recipe_nutrients']
        
        print("\n📊 Recipe Tables:")
        for table in tables:
            try:
                cur.execute(f"SELECT COUNT(*) FROM {table}")
                count = cur.fetchone()[0]
                print(f"  • {table}: {count} rows")
            except:
                print(f"  • {table}: ❌ Not found")
        
        cur.close()
        conn.close()
        
        print("\n✅ Database connection successful!")
        return True
        
    except Exception as e:
        print(f"\n❌ Connection failed: {e}")
        return False

# ============================
# SECTION 11: MAIN PROGRAM
# ============================

if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("🤖 ENHANCED RECIPE FETCHER - MEALDB + EDAMAM")
    print("=" * 60)
    
    print("\n" + "=" * 60)
    print("OPTIONS:")
    print("1. Test database connection")
    print("2. Fetch TheMealDB only (no nutrition)")
    print("3. Fetch TheMealDB WITH USDA nutrition")
    print("4. Fetch Edamam recipes (with built-in nutrition)")
    print("5. 🌟 FETCH ALL SOURCES (MealDB + Edamam)")
    print("6. Quick test (5 recipes from each source)")
    print("=" * 60)
    
    choice = input("\nSelect option (1-6): ").strip()
    
    if choice == "1":
        test_connection()
    
    elif choice == "2":
        if test_connection():
            print(f"\n⚠️  This will fetch ~305 TheMealDB recipes")
            confirm = input("Continue? (y/n): ").strip().lower()
            if confirm == 'y':
                fetch_all_mealdb_recipes(with_nutrition=False)
    
    elif choice == "3":
        if test_connection():
            print(f"\n⚠️  This will fetch ~305 recipes + USDA nutrition")
            confirm = input("Continue? (y/n): ").strip().lower()
            if confirm == 'y':
                fetch_all_mealdb_recipes(with_nutrition=True)
    
    elif choice == "4":
        if test_connection():
            print(f"\n⚠️  This will fetch recipes from Edamam")
            print("Default: 20 recipes per category = ~1000 total")
            count = input("Recipes per query (default 20): ").strip() or "20"
            confirm = input("Continue? (y/n): ").strip().lower()
            if confirm == 'y':
                fetch_edamam_recipes_diverse(max_per_query=int(count))
    
    elif choice == "5":
        if test_connection():
            print(f"\n⭐ ULTIMATE FETCH - ALL SOURCES!")
            print("This will fetch:")
            print("  • ~305 recipes from TheMealDB")
            print("  • ~1000 recipes from Edamam")
            print("  • Total: ~1300+ recipes with nutrition")
            print("\nEstimated time: 20-30 minutes")
            
            confirm = input("\nContinue? (y/n): ").strip().lower()
            if confirm == 'y':
                fetch_all_sources_combined(mealdb_nutrition=True, edamam_count=20)
    
    elif choice == "6":
        if test_connection():
            print("\n🧪 Quick test with 5 recipes from each source...")
            
            conn = get_db_connection()
            
            # Test MealDB
            print("\n1️⃣ Testing TheMealDB...")
            meals = fetch_meals_by_category("Breakfast")
            for meal in meals[:5]:
                details = fetch_meal_details(meal['idMeal'])
                if details:
                    rid = upsert_recipe(conn, details, 'TheMealDB')
                    if rid:
                        upsert_ingredients(conn, rid, details, 'TheMealDB')
                        print(f"  ✅ {details['strMeal']}")
            
            # Test Edamam
            print("\n2️⃣ Testing Edamam...")
            recipes = fetch_edamam_recipes("chicken", max_results=5)
            for recipe in recipes:
                rid = upsert_recipe(conn, recipe, 'Edamam')
                if rid:
                    upsert_ingredients(conn, rid, recipe, 'Edamam')
                    store_edamam_nutrition(conn, rid, recipe)
                    print(f"  ✅ {recipe['label']}")
            
            conn.close()
            print("\n✅ Test complete! Check your database.")
    
    else:
        print("❌ Invalid option")
    
    print("\n🎉 Done!")