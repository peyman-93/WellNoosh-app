"""
Interactive Test - Using Your SUPABASE_* Environment Variables
Location: main-brain/src/interactive_test.py
"""

import os
import sys
import psycopg2
from psycopg2.extras import RealDictCursor
from safe_recommendation_agent import SafeRecommendationAgent
from dotenv import load_dotenv

load_dotenv()

# Database configuration using YOUR exact variable names
DB_CONFIG = {
    'host': os.getenv('SUPABASE_HOST'),
    'port': os.getenv('SUPABASE_PORT', 5432),
    'database': os.getenv('SUPABASE_DB', 'postgres'),
    'user': os.getenv('SUPABASE_USER', 'postgres'),
    'password': os.getenv('SUPABASE_PASSWORD'),
    'sslmode': os.getenv('SUPABASE_SSLMODE', 'require')
}

def check_environment():
    """Check if all required environment variables are set"""
    missing = []
    
    if not os.getenv('SUPABASE_HOST'):
        missing.append('SUPABASE_HOST')
    if not os.getenv('SUPABASE_PASSWORD'):
        missing.append('SUPABASE_PASSWORD')
    
    if not os.getenv('OPENAI_API_KEY') and not os.getenv('GOOGLE_API_KEY'):
        missing.append('OPENAI_API_KEY or GOOGLE_API_KEY')
    
    if missing:
        print("\n❌ Missing required environment variables:")
        for var in missing:
            print(f"   - {var}")
        print("\n💡 To fix:")
        print("1. Get your Supabase credentials from app.supabase.com")
        print("2. Update your .env file:")
        print("   SUPABASE_HOST=db.xxxxxxxxxxxx.supabase.co")
        print("   SUPABASE_PASSWORD=your-password")
        print("   OPENAI_API_KEY=sk-...")
        return False
    return True

def create_sample_health_profile(user_id: str, full_name: str):
    """Create a sample health profile for testing"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        
        # Check if health profile already exists
        cur.execute("SELECT id FROM user_health_profiles WHERE user_id = %s", (user_id,))
        if cur.fetchone():
            print(f"   ℹ️  Health profile already exists for {full_name}")
            cur.close()
            conn.close()
            return True
        
        # Create sample health profile
        cur.execute("""
            INSERT INTO user_health_profiles (
                user_id, age, gender, weight_kg, height_cm, activity_level,
                cooking_skill, diet_style, allergies, medical_conditions,
                health_goals, target_weight_kg, timeline, bmi, daily_calorie_goal
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
            )
        """, (
            user_id,
            25,  # age
            'male',  # gender
            70.0,  # weight_kg
            175.0,  # height_cm
            'moderate',  # activity_level
            'intermediate',  # cooking_skill
            'balanced',  # diet_style
            [],  # allergies (empty array)
            [],  # medical_conditions (empty array)
            ['maintain'],  # health_goals (array with one goal)
            70.0,  # target_weight_kg
            '3 months',  # timeline
            22.9,  # bmi
            2200,  # daily_calorie_goal
        ))
        
        conn.commit()
        print(f"   ✅ Created sample health profile for {full_name}")
        cur.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"   ❌ Failed to create health profile: {e}")
        return False

def get_users():
    """Get all users from the database"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Get users with their health profile status
        cur.execute("""
            SELECT 
                up.user_id as id,
                up.full_name,
                up.email,
                CASE 
                    WHEN uhp.id IS NOT NULL THEN true
                    ELSE false
                END as has_profile,
                uhp.diet_style,
                uhp.health_goals,
                uhp.cooking_skill,
                uhp.allergies,
                uhp.medical_conditions,
                uhp.daily_calorie_goal
            FROM user_profiles up
            LEFT JOIN user_health_profiles uhp ON up.user_id = uhp.user_id
            ORDER BY up.created_at DESC
        """)
        
        users = cur.fetchall()
        cur.close()
        conn.close()
        return users
        
    except Exception as e:
        print(f"Failed to get users: {e}")
        return []

def display_user_info(user):
    """Display detailed user information"""
    print(f"\n📋 User Details:")
    print(f"   Name: {user['full_name'] or 'Not set'}")
    print(f"   Email: {user['email']}")
    print(f"   Has Health Profile: {'✅ Yes' if user['has_profile'] else '❌ No'}")
    
    if user['has_profile']:
        print(f"   Diet Style: {user['diet_style'] or 'Not set'}")
        
        if user['health_goals']:
            print(f"   Health Goals: {', '.join(user['health_goals'])}")
        
        print(f"   Cooking Skill: {user['cooking_skill'] or 'Not set'}")
        print(f"   Daily Calories: {user['daily_calorie_goal'] or 'Not set'}")
        
        if user['allergies']:
            print(f"   Allergies: {', '.join(user['allergies'])}")
        
        if user['medical_conditions']:
            print(f"   Medical Conditions: {', '.join(user['medical_conditions'])}")

def check_database_status():
    """Check the status of the database"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        
        # Check recipes
        cur.execute("SELECT COUNT(*) FROM recipes")
        recipe_count = cur.fetchone()[0]
        
        # Check recipe nutrients
        cur.execute("SELECT COUNT(*) FROM recipe_nutrients WHERE per_serving != '{}'")
        nutrient_count = cur.fetchone()[0]
        
        # Check recipe events
        cur.execute("SELECT COUNT(*) FROM recipe_events")
        event_count = cur.fetchone()[0]
        
        # Check users
        cur.execute("SELECT COUNT(*) FROM user_profiles")
        user_count = cur.fetchone()[0]
        
        cur.close()
        conn.close()
        
        return recipe_count, nutrient_count, event_count, user_count
        
    except psycopg2.OperationalError as e:
        print(f"❌ Connection failed: {e}")
        print("\n💡 Check your .env file:")
        print("   SUPABASE_HOST should be: db.xxxxxxxxxxxx.supabase.co")
        print("   SUPABASE_PASSWORD should be your database password")
        return 0, 0, 0, 0
    except Exception as e:
        print(f"Database check failed: {e}")
        return 0, 0, 0, 0

def interactive_test():
    """Run interactive test"""
    print("\n🤖 Interactive Recipe Recommendation Test")
    print("=" * 50)
    
    # Check environment first
    if not check_environment():
        return
    
    print("\n🔄 Connecting to Supabase...")
    print(f"   Host: {DB_CONFIG['host']}")
    
    # Check database status
    recipe_count, nutrient_count, event_count, user_count = check_database_status()
    
    if recipe_count == 0 and nutrient_count == 0:
        print("\n❌ Could not connect to database or no data found")
        return
    
    print(f"\n📊 Database Status:")
    print(f"   Users: {user_count}")
    print(f"   Recipes: {recipe_count}")
    print(f"   With Nutrition: {nutrient_count}")
    print(f"   Events Logged: {event_count}")
    
    if recipe_count == 0:
        print("\n⚠️  WARNING: No recipes found!")
        print("   Please run the TheMealDB import script first")
        cont = input("\nContinue anyway? (y/n): ").strip().lower()
        if cont != 'y':
            return
    
    # Get users
    users = get_users()
    
    if not users:
        print("\n❌ No users found in user_profiles table")
        print("💡 Make sure you have users registered through Supabase Auth")
        return
    
    # Display users
    print(f"\n👥 Found {len(users)} users:")
    for i, user in enumerate(users, 1):
        profile_status = "✅" if user['has_profile'] else "❌"
        name = user['full_name'] or user['email'].split('@')[0]
        
        diet_info = ""
        if user['has_profile'] and user['diet_style']:
            diet_info = f" - {user['diet_style']}"
            if user['allergies']:
                diet_info += f" (⚠️ {len(user['allergies'])} allergies)"
        else:
            diet_info = " - No profile"
            
        print(f"{i}. {profile_status} {name}{diet_info}")
    
    # Find Moha
    moha_index = None
    for i, user in enumerate(users, 1):
        if user['full_name'] and 'moha' in user['full_name'].lower():
            moha_index = i
            print(f"\n✨ Found Moha at position {i}")
            break
    
    # Get user selection
    if moha_index:
        choice = input(f"Press Enter for Moha, or enter number: ").strip()
        if not choice:
            choice = str(moha_index)
    else:
        choice = input("\nEnter user number: ").strip()
    
    try:
        user_index = int(choice) - 1
        if 0 <= user_index < len(users):
            selected_user = users[user_index]
            user_id = selected_user['id']
            name = selected_user['full_name'] or selected_user['email'].split('@')[0]
            
            print(f"\n📋 Testing with: {name}")
            print("-" * 50)
            
            # Display user info
            display_user_info(selected_user)
            
            # Handle missing health profile
            if not selected_user['has_profile']:
                print(f"\n⚠️  No health profile found")
                action = input("Create sample profile? (y/n): ").strip().lower()
                if action == 'y':
                    if not create_sample_health_profile(user_id, name):
                        return
            
            # Initialize agent
            print("\n🔄 Initializing recommendation agent...")
            try:
                agent = SafeRecommendationAgent()
            except ValueError as e:
                print(f"❌ {e}")
                return
            
            # Get recommendations
            print("🔍 Getting personalized recommendations...")
            result = agent.get_recommendations(user_id)
            
            # Display results
            if result['error']:
                print(f"\n❌ Error: {result['error']}")
            else:
                print(f"\n✅ Process Log:")
                for msg in result['messages']:
                    print(f"   {msg}")
                
                if result['recommendations']:
                    print(f"\n🍽️  Recommended Recipes ({len(result['recommendations'])} recipes):")
                    print("-" * 50)
                    
                    for i, rec in enumerate(result['recommendations'], 1):
                        print(f"\n{i}. {rec['title']}")
                        
                        calories = rec.get('calories', 'N/A')
                        protein = rec.get('protein', 'N/A')
                        if calories != 'N/A' and protein != 'N/A':
                            print(f"   📊 {calories} cal | {protein}g protein")
                        
                        if rec.get('category') or rec.get('cuisine'):
                            print(f"   🌍 {rec.get('category', '')} | {rec.get('cuisine', '')}")
                        
                        print(f"   💡 {rec.get('recommendation_reason', 'Matches your preferences')}")
                        
                        if rec.get('image_url'):
                            print(f"   🖼️  {rec['image_url'][:60]}...")
                    
                    # Test feedback
                    print("\n" + "=" * 50)
                    feedback = input("\nLike the first recipe? (y/n): ").strip().lower()
                    
                    if feedback == 'y' and result['recommendations']:
                        first_recipe = result['recommendations'][0]
                        success = agent.record_feedback(user_id, first_recipe['id'], 'like')
                        if success:
                            print(f"✅ Recorded 'like' for: {first_recipe['title']}")
                        else:
                            print("❌ Failed to record feedback")
                else:
                    print("\n⚠️  No recommendations generated")
        else:
            print("❌ Invalid selection")
            
    except ValueError:
        print("❌ Invalid input")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    interactive_test()