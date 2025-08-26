"""
================================================================================
RECIPE FETCHER FOR SUPABASE
================================================================================
Location: main-brain/src/fetch_recipes.py
Purpose: Fetch recipes from TheMealDB and nutrition from USDA, store in Supabase
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
# This section finds and loads your .env file from main-brain folder

# Add parent directory (main-brain) to Python path
sys.path.append(str(Path(__file__).parent.parent))

try:
    from dotenv import load_dotenv
    
    # Build path to .env file: main-brain/src/../.env = main-brain/.env
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
# This section sets up all configuration variables from your .env file

# Database connection parameters
DB_PARAMS = {
    'host': os.getenv('SUPABASE_HOST'),        # db.yourproject.supabase.co
    'dbname': os.getenv('SUPABASE_DB', 'postgres'),
    'user': os.getenv('SUPABASE_USER', 'postgres'),
    'password': os.getenv('SUPABASE_PASSWORD'), # Your database password
    'port': int(os.getenv('SUPABASE_PORT', '5432')),
    'sslmode': os.getenv('SUPABASE_SSLMODE', 'require')
}

# API Keys
THEMEALDB_KEY = os.getenv('THEMEALDB_KEY', '1')  # '1' is free test key
USDA_API_KEY = os.getenv('USDA_API_KEY', '')     # Optional for nutrition

# API URLs
BASE_URL = f"https://www.themealdb.com/api/json/v1/{THEMEALDB_KEY}"
FDC_BASE_URL = "https://api.nal.usda.gov/fdc/v1"

# This is what you'll get - meals per category
CATEGORY_COUNTS = {
    "Beef": 42, "Chicken": 35, "Dessert": 65, "Lamb": 7,
    "Miscellaneous": 19, "Pasta": 10, "Pork": 10, "Seafood": 32,
    "Side": 13, "Starter": 25, "Vegan": 6, "Vegetarian": 33,
    "Breakfast": 7, "Goat": 1
}

print(f"📁 Script location: {Path(__file__)}")
print(f"📁 .env location: {env_path}")

# ============================
# SECTION 3: DATABASE CONNECTION
# ============================
# This section handles connecting to your Supabase PostgreSQL database

def get_db_connection():
    """
    Create a direct database connection to Supabase PostgreSQL
    This bypasses the API and RLS policies for bulk operations
    """
    try:
        # Validate credentials exist
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
# This prevents hitting API rate limits by controlling request frequency

class RateLimiter:
    """
    Ensures we don't exceed API rate limits
    TheMealDB and USDA allow ~5 requests per second
    """
    def __init__(self, calls_per_second=5):
        self.calls_per_second = calls_per_second
        self.min_interval = 1.0 / calls_per_second  # Time between requests
        self.last_call = 0
    
    def wait(self):
        """Wait if necessary before making next API call"""
        elapsed = time.time() - self.last_call
        if elapsed < self.min_interval:
            sleep_time = self.min_interval - elapsed
            time.sleep(sleep_time)
        self.last_call = time.time()

# Create rate limiters for each API
mealdb_limiter = RateLimiter(5)  # 5 requests/second
fdc_limiter = RateLimiter(5)     # 5 requests/second

# ============================
# SECTION 5: INGREDIENT PARSING
# ============================
# This section parses ingredient text like "2 cups flour" into structured data

def parse_quantity_unit(measure_text: str) -> Tuple[Optional[float], Optional[str], Optional[float]]:
    """
    Parse measurement text to extract quantity, unit, and estimated grams
    
    Examples:
    "2 cups" → qty=2, unit="cup", grams=480
    "1½ tsp" → qty=1.5, unit="tsp", grams=7.5
    "500g" → qty=500, unit="g", grams=500
    
    Returns: (quantity, unit, grams)
    """
    if not measure_text:
        return None, None, None
    
    measure = measure_text.lower().strip()
    
    # Clean up text - remove extra spaces
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
    
    # Try different number patterns
    patterns = [
        r'^(\d+\.?\d*)\s*(.*)$',           # "2.5 cups" or "2 cups"
        r'^(\d+)/(\d+)\s*(.*)$',           # "1/2 cup"
        r'^(\d+)\s+(\d+)/(\d+)\s*(.*)$',   # "1 1/2 cups"
    ]
    
    rest = measure  # What's left after extracting number
    
    for pattern in patterns:
        match = re.match(pattern, measure)
        if match:
            groups = match.groups()
            if len(groups) == 2:  # Decimal number
                qty = float(groups[0])
                rest = groups[1]
            elif len(groups) == 3:  # Fraction
                qty = float(groups[0]) / float(groups[1])
                rest = groups[2]
            elif len(groups) == 4:  # Mixed number
                whole = float(groups[0])
                fraction = float(groups[1]) / float(groups[2])
                qty = whole + fraction
                rest = groups[3]
            break
    
    # Extract unit from remaining text
    if rest:
        # Map variations to standard units
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
        
        # Check if first word matches a known unit
        words = rest.split()
        if words:
            first_word = words[0].lower()
            for standard_unit, variations in unit_mapping.items():
                if first_word in variations:
                    unit = standard_unit
                    break
    
    # Convert to grams (approximate for volume measurements)
    if qty and unit:
        gram_conversions = {
            'tsp': 5,      # 1 teaspoon ≈ 5g (for water/similar)
            'tbsp': 15,    # 1 tablespoon ≈ 15g
            'cup': 240,    # 1 cup ≈ 240g
            'oz': 28.35,   # 1 ounce = 28.35g
            'lb': 453.6,   # 1 pound = 453.6g
            'g': 1,        # Already in grams
            'kg': 1000,    # 1 kilogram = 1000g
            'ml': 1,       # 1 ml ≈ 1g (for water)
            'l': 1000,     # 1 liter ≈ 1000g
        }
        
        if unit in gram_conversions:
            grams = qty * gram_conversions[unit]
    
    return qty, unit, grams

# ============================
# SECTION 6: NUTRITION DATA (USDA)
# ============================
# This section fetches nutritional information from USDA FoodData Central

def search_fdc_food(ingredient_name: str) -> Optional[Dict]:
    """
    Search USDA FoodData Central for nutritional information
    
    Example: "chicken breast" → Returns calories, protein, fat, etc.
    
    Returns: Dictionary with nutrition data or None
    """
    if not USDA_API_KEY:
        return None  # Skip if no API key provided
    
    try:
        # Rate limit the request
        fdc_limiter.wait()
        
        # Search for the ingredient
        params = {
            'query': ingredient_name,
            'limit': 1,  # Get best match only
            'api_key': USDA_API_KEY
        }
        
        response = requests.get(
            f"{FDC_BASE_URL}/foods/search",
            params=params,
            timeout=10
        )
        response.raise_for_status()
        data = response.json()
        
        # Extract first (best) match
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
    """
    Store USDA food data in foods_fdc table for caching
    This avoids repeated API calls for same ingredients
    """
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
            Json(fdc_data['nutrients']),  # Store as JSONB
            Json(fdc_data['portions'])
        ))
        conn.commit()
    except Exception as e:
        conn.rollback()
        print(f"    ⚠️  Error storing FDC data: {e}")
    finally:
        cur.close()

def calculate_recipe_nutrition(conn, recipe_id: str):
    """
    Calculate total nutrition for a recipe by summing all ingredients
    Fixed to handle Decimal type from PostgreSQL
    """
    cur = conn.cursor()
    
    try:
        # Get ingredients with nutrition data
        cur.execute("""
            SELECT ri.grams, f.nutrients
            FROM recipe_ingredients ri
            JOIN foods_fdc f ON f.fdc_id = ri.fdc_id
            WHERE ri.recipe_id = %s AND ri.grams IS NOT NULL
        """, (recipe_id,))
        
        ingredients = cur.fetchall()
        
        # Initialize nutrient totals
        total_nutrients = {
            'kcal': 0, 'protein_g': 0, 'fat_g': 0,
            'carbs_g': 0, 'fiber_g': 0, 'sugar_g': 0, 'sodium_mg': 0
        }
        
        # Map USDA nutrient names to our schema
        nutrient_mapping = {
            'Energy': 'kcal',
            'Protein': 'protein_g',
            'Total lipid (fat)': 'fat_g',
            'Carbohydrate, by difference': 'carbs_g',
            'Fiber, total dietary': 'fiber_g',
            'Sugars, total including NLEA': 'sugar_g',
            'Sodium, Na': 'sodium_mg'
        }
        
        # Sum nutrients from all ingredients
        for grams, nutrients_json in ingredients:
            if not nutrients_json:
                continue
            
            # Convert Decimal to float
            grams = float(grams)
            
            # Process each nutrient
            for nutrient in nutrients_json:
                name = nutrient.get('nutrientName', '')
                value = nutrient.get('value', 0)
                
                if name in nutrient_mapping:
                    key = nutrient_mapping[name]
                    # Scale by grams (USDA data is per 100g)
                    total_nutrients[key] += (float(value) * grams / 100)
        
        # Round to 2 decimal places
        total_nutrients = {k: round(v, 2) for k, v in total_nutrients.items()}
        
        # Calculate per-serving (assuming 4 servings per recipe)
        servings = 4
        per_serving = {k: round(v / servings, 2) for k, v in total_nutrients.items()}
        
        # Store in recipe_nutrients table
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
# SECTION 7: MEALDB API FUNCTIONS
# ============================
# This section fetches recipe data from TheMealDB API

def fetch_with_retry(url: str, retries: int = 3) -> Optional[Dict]:
    """
    Fetch data from URL with retry logic for reliability
    If request fails, wait and try again (up to 3 times)
    """
    for attempt in range(retries):
        try:
            # Rate limit
            mealdb_limiter.wait()
            
            # Make request
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            return response.json()
            
        except Exception as e:
            if attempt == retries - 1:  # Last attempt
                print(f"    ❌ Failed after {retries} attempts: {e}")
                return None
            # Wait before retry (exponential backoff)
            time.sleep(2 ** attempt)
    
    return None

def fetch_all_categories() -> List[Dict]:
    """
    Get all meal categories from TheMealDB
    Returns: List of categories (Beef, Chicken, Dessert, etc.)
    """
    print("\n📁 Fetching categories from TheMealDB...")
    data = fetch_with_retry(f"{BASE_URL}/categories.php")
    if data and 'categories' in data:
        return data['categories']
    return []

def fetch_meals_by_category(category: str) -> List[Dict]:
    """
    Get all meals in a specific category
    Example: "Beef" → Returns 42 beef recipes (summary only)
    """
    data = fetch_with_retry(f"{BASE_URL}/filter.php?c={category}")
    if data and 'meals' in data:
        return data['meals']
    return []

def fetch_meal_details(meal_id: str) -> Optional[Dict]:
    """
    Get complete details for a specific meal
    Includes ingredients, instructions, image URL, etc.
    """
    data = fetch_with_retry(f"{BASE_URL}/lookup.php?i={meal_id}")
    if data and 'meals' in data and data['meals']:
        return data['meals'][0]
    return None

# ============================
# SECTION 8: DATABASE OPERATIONS
# ============================
# This section handles storing data in Supabase

def upsert_recipe(conn, meal: Dict) -> Optional[str]:
    """
    Insert or update a recipe in the database
    Uses source_id to prevent duplicates (idempotent)
    
    Returns: UUID of the recipe
    """
    cur = conn.cursor()
    
    # Parse tags from comma-separated string to PostgreSQL array
    tags = None
    if meal.get('strTags'):
        tags = [tag.strip() for tag in meal['strTags'].split(',') if tag.strip()]
    
    try:
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
                category = EXCLUDED.category,
                area = EXCLUDED.area,
                tags = EXCLUDED.tags,
                youtube_url = EXCLUDED.youtube_url,
                instructions = EXCLUDED.instructions,
                updated_at = NOW()
            RETURNING id
        """, (
            'TheMealDB',                      # source
            meal['idMeal'],                   # source_id (TheMealDB's ID)
            meal['strMeal'],                  # title
            meal.get('strMealThumb'),         # image_url
            meal.get('strCategory'),          # category
            meal.get('strArea'),              # area (cuisine)
            tags,                             # tags array
            meal.get('strYoutube'),           # youtube_url
            meal.get('strInstructions'),      # instructions
            meal.get('strSource'),            # source URL
            4                                 # default servings
        ))
        
        recipe_id = cur.fetchone()[0]  # Get the UUID
        conn.commit()
        return recipe_id
        
    except Exception as e:
        conn.rollback()
        print(f"    ❌ Error inserting recipe: {e}")
        return None
    finally:
        cur.close()

def upsert_ingredients(conn, recipe_id: str, meal: Dict, fetch_nutrition: bool = False):
    """
    Insert ingredients for a recipe
    
    Process:
    1. Delete existing ingredients (for clean update)
    2. Loop through 20 possible ingredients (MealDB format)
    3. Parse each ingredient's measurement
    4. Optionally fetch nutrition data from USDA
    5. Store in recipe_ingredients table
    """
    cur = conn.cursor()
    
    try:
        # Clean existing ingredients
        cur.execute("DELETE FROM recipe_ingredients WHERE recipe_id = %s", (recipe_id,))
        
        # MealDB stores up to 20 ingredients
        for i in range(1, 21):
            ingredient = (meal.get(f'strIngredient{i}') or '').strip()
            measure = (meal.get(f'strMeasure{i}') or '').strip()
            
            if ingredient:  # Only process if ingredient exists
                # Parse the measurement
                qty, unit, grams = parse_quantity_unit(measure)
                
                # Create raw text for display
                raw_text = f"{measure} {ingredient}".strip() if measure else ingredient
                
                # Fetch nutrition data if enabled
                fdc_id = None
                if fetch_nutrition and USDA_API_KEY:
                    fdc_data = search_fdc_food(ingredient)
                    if fdc_data:
                        fdc_id = fdc_data['fdc_id']
                        store_fdc_food(conn, fdc_data)  # Cache it
                
                # Insert ingredient
                cur.execute("""
                    INSERT INTO recipe_ingredients (
                        recipe_id, position, raw, ingredient_name, 
                        measure_text, qty, unit, grams, fdc_id
                    ) VALUES (
                        %s, %s, %s, %s, %s, %s, %s, %s, %s
                    )
                """, (
                    recipe_id,      # Link to recipe
                    i,              # Position (1-20)
                    raw_text,       # Full text "2 cups flour"
                    ingredient,     # Just "flour"
                    measure,        # Just "2 cups"
                    qty,            # 2.0
                    unit,           # "cup"
                    grams,          # 480
                    fdc_id          # USDA food ID
                ))
        
        conn.commit()
        
    except Exception as e:
        conn.rollback()
        print(f"    ❌ Error inserting ingredients: {e}")
    finally:
        cur.close()

# ============================
# SECTION 9: MAIN FETCHING FUNCTION
# ============================
# This orchestrates the entire fetching process

def fetch_all_mealdb_recipes(with_nutrition: bool = False):
    """
    Main function that coordinates the entire fetch process
    
    Steps:
    1. Connect to database
    2. Fetch all categories
    3. For each category, fetch all meals
    4. For each meal, fetch full details
    5. Store recipe and ingredients
    6. Optionally calculate nutrition
    """
    print("\n" + "=" * 60)
    print("🍽️  FETCHING ALL RECIPES FROM THEMEALDB")
    if with_nutrition:
        print("🥗 WITH NUTRITION DATA FROM USDA")
    print("=" * 60)
    
    # Check for USDA API key if nutrition requested
    if with_nutrition and not USDA_API_KEY:
        print("\n⚠️  No USDA API key found!")
        print("To get nutrition data:")
        print("1. Go to: https://fdc.nal.usda.gov/api-guide.html")
        print("2. Sign up for free API key")
        print("3. Add to main-brain/.env: USDA_API_KEY=your-key")
        
        cont = input("\nContinue without nutrition? (y/n): ").strip().lower()
        if cont != 'y':
            return
        with_nutrition = False
    
    # Connect to database
    conn = get_db_connection()
    
    try:
        # Step 1: Get all categories
        categories = fetch_all_categories()
        print(f"✅ Found {len(categories)} categories\n")
        
        total_recipes = 0
        total_new = 0
        total_updated = 0
        
        # Step 2: Process each category
        for category_data in categories:
            category_name = category_data['strCategory']
            expected_count = CATEGORY_COUNTS.get(category_name, 0)
            
            # Get all meals in this category
            meals = fetch_meals_by_category(category_name)
            print(f"\n📁 Processing {category_name}: {len(meals)} meals")
            
            # Step 3: Process each meal
            for idx, meal_summary in enumerate(meals, 1):
                meal_id = meal_summary['idMeal']
                meal_name = meal_summary['strMeal']
                
                # Progress indicator
                if idx % 10 == 0:
                    print(f"    Progress: {idx}/{len(meals)}")
                
                # Step 4: Get full meal details
                meal_details = fetch_meal_details(meal_id)
                if not meal_details:
                    continue
                
                # Check if recipe already exists
                cur = conn.cursor()
                cur.execute("SELECT id FROM recipes WHERE source_id = %s", (meal_id,))
                existing = cur.fetchone()
                cur.close()
                
                # Step 5: Store recipe
                recipe_uuid = upsert_recipe(conn, meal_details)
                if recipe_uuid:
                    # Store ingredients
                    upsert_ingredients(conn, recipe_uuid, meal_details, with_nutrition)
                    
                    # Calculate nutrition if we have the data
                    if with_nutrition:
                        calculate_recipe_nutrition(conn, recipe_uuid)
                    
                    # Track statistics
                    if existing:
                        total_updated += 1
                    else:
                        total_new += 1
                    
                    total_recipes += 1
        
        # Show final statistics
        print("\n" + "=" * 60)
        print("✅ FETCH COMPLETE!")
        print("=" * 60)
        print(f"📊 Total recipes processed: {total_recipes}")
        print(f"🆕 New recipes added: {total_new}")
        print(f"📝 Existing recipes updated: {total_updated}")
        
        # Database statistics
        cur = conn.cursor()
        
        cur.execute("SELECT COUNT(*) FROM recipes")
        recipes_count = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(*) FROM recipe_ingredients")
        ingredients_count = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(*) FROM foods_fdc")
        fdc_count = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(*) FROM recipe_nutrients")
        nutrition_count = cur.fetchone()[0]
        
        print(f"\n📚 Database Status:")
        print(f"  • Total recipes: {recipes_count}")
        print(f"  • Total ingredients: {ingredients_count}")
        if with_nutrition:
            print(f"  • FDC foods cached: {fdc_count}")
            print(f"  • Recipes with nutrition: {nutrition_count}")
        
        # Show sample recipes
        cur.execute("""
            SELECT title, category, area 
            FROM recipes 
            ORDER BY RANDOM() 
            LIMIT 5
        """)
        
        print(f"\n🎲 Random Sample:")
        for title, category, area in cur.fetchall():
            print(f"  • {title} ({category}, {area or 'Unknown'})")
        
        cur.close()
        
    except Exception as e:
        print(f"\n❌ Fatal error: {e}")
        conn.rollback()
    finally:
        conn.close()

# ============================
# SECTION 10: UTILITY FUNCTIONS
# ============================
# Helper functions for testing and information

def show_category_breakdown():
    """Display how many meals are in each category"""
    print("\n📊 MEALS PER CATEGORY (Total: ~305)")
    print("=" * 40)
    for category, count in CATEGORY_COUNTS.items():
        bar = "█" * (count // 2)  # Visual bar chart
        print(f"{category:15} {count:3} {bar}")
    print("=" * 40)

def test_connection():
    """Test database connection and show current table status"""
    print("\n🔍 Testing database connection...")
    print(f"📁 .env location: {Path(__file__).parent.parent / '.env'}")
    print(f"🔌 Connecting to: {DB_PARAMS['host']}")
    
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Check our recipe tables
        tables = ['recipes', 'recipe_ingredients', 'foods_fdc', 'recipe_nutrients', 'recipe_events']
        
        print("\n📊 Recipe Tables:")
        for table in tables:
            try:
                cur.execute(f"SELECT COUNT(*) FROM {table}")
                count = cur.fetchone()[0]
                print(f"  • {table}: {count} rows")
            except:
                print(f"  • {table}: ❌ Not found")
        
        # Check for user tables (to confirm same database)
        cur.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name LIKE 'user%'
            ORDER BY table_name
        """)
        
        user_tables = cur.fetchall()
        if user_tables:
            print("\n👤 User Tables Found:")
            for (table,) in user_tables:
                cur.execute(f"SELECT COUNT(*) FROM {table}")
                count = cur.fetchone()[0]
                print(f"  • {table}: {count} rows")
        
        cur.close()
        conn.close()
        
        print("\n✅ Database connection successful!")
        print("✅ This is the same database your frontend uses!")
        return True
        
    except Exception as e:
        print(f"\n❌ Connection failed: {e}")
        return False

# ============================
# SECTION 11: MAIN PROGRAM
# ============================
# This is the entry point when you run the script

if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("🤖 MEALDB RECIPE FETCHER FOR SUPABASE")
    print("=" * 60)
    
    # Show what we'll fetch
    show_category_breakdown()
    
    # Show menu
    print("\n" + "=" * 40)
    print("OPTIONS:")
    print("1. Test database connection")
    print("2. Fetch all recipes (no nutrition)")
    print("3. Fetch all recipes WITH nutrition")
    print("4. Quick test (5 recipes only)")
    print("=" * 40)
    
    choice = input("\nSelect option (1-4): ").strip()
    
    if choice == "1":
        # Just test the connection
        test_connection()
    
    elif choice == "2":
        # Fetch all recipes without nutrition
        if test_connection():
            print(f"\n⚠️  This will fetch ~305 recipes")
            print("Time: ~5-10 minutes")
            print("Nutrition: NO")
            confirm = input("Continue? (y/n): ").strip().lower()
            if confirm == 'y':
                fetch_all_mealdb_recipes(with_nutrition=False)
    
    elif choice == "3":
        # Fetch all recipes with nutrition
        if test_connection():
            print(f"\n⚠️  This will fetch ~305 recipes + nutrition")
            print("Time: ~15-20 minutes")
            print("Nutrition: YES (requires USDA API key)")
            confirm = input("Continue? (y/n): ").strip().lower()
            if confirm == 'y':
                fetch_all_mealdb_recipes(with_nutrition=True)
    
    elif choice == "4":
        # Quick test with just 5 recipes
        if test_connection():
            print("\n🧪 Quick test with 5 Breakfast recipes...")
            conn = get_db_connection()
            
            # Get breakfast meals
            meals = fetch_meals_by_category("Breakfast")
            
            # Process first 5
            for meal_summary in meals[:5]:
                print(f"  Fetching: {meal_summary['strMeal']}")
                meal_details = fetch_meal_details(meal_summary['idMeal'])
                
                if meal_details:
                    recipe_id = upsert_recipe(conn, meal_details)
                    if recipe_id:
                        upsert_ingredients(conn, recipe_id, meal_details, True)
                        if USDA_API_KEY:
                            calculate_recipe_nutrition(conn, recipe_id)
                        print(f"    ✅ Stored successfully")
            
            conn.close()
            print("\n✅ Test complete! Check your database.")
    
    else:
        print("❌ Invalid option")
    
    print("\n🎉 Done!")
    print("To run again: python main-brain/src/fetch_recipes.py")