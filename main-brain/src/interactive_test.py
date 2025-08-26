# main-brain/src/interactive_test.py
from safe_recommendation_agent import SafeRecommendationAgent
import psycopg2
from safe_recommendation_agent import DB_PARAMS

def list_users():
    """List all users with profiles"""
    conn = psycopg2.connect(**DB_PARAMS)
    cur = conn.cursor()
    
    cur.execute("""
        SELECT 
            up.id,
            up.full_name,
            up.email,
            uhp.diet_style,
            uhp.health_goal
        FROM user_profiles up
        LEFT JOIN user_health_profiles uhp ON uhp.user_id = up.id
        ORDER BY up.full_name
    """)
    
    users = cur.fetchall()
    cur.close()
    conn.close()
    
    return users

def interactive_test():
    print("\n🤖 Interactive Recipe Recommendation Test")
    print("=" * 50)
    
    # List available users
    users = list_users()
    
    print("\nAvailable users:")
    for i, (uid, name, email, diet, goal) in enumerate(users, 1):
        print(f"{i}. {name or email} (Diet: {diet}, Goal: {goal})")
    
    # Find Moha
    moha_index = None
    for i, (uid, name, email, diet, goal) in enumerate(users, 1):
        if name and 'moha' in name.lower():
            moha_index = i
            print(f"\n✨ Found Moha at position {i}")
            break
    
    # Select user
    if moha_index:
        choice = input(f"\nPress Enter to test with Moha, or enter another number: ").strip()
        if not choice:
            choice = str(moha_index)
    else:
        choice = input("\nSelect user number: ").strip()
    
    try:
        selected_index = int(choice) - 1
        selected_user = users[selected_index]
        user_id, name, email = selected_user[:3]
        
        print(f"\n📋 Testing with: {name or email}")
        print("-" * 50)
        
        # Get recommendations
        agent = SafeRecommendationAgent()
        result = agent.get_recommendations(user_id)
        
        # Display results
        print(f"\n✅ Recommendations for {name or email}:")
        for i, recipe in enumerate(result['recommendations'], 1):
            print(f"\n{i}. {recipe['title']}")
            print(f"   🏷️ {', '.join(recipe['tags'])}")
            print(f"   🔒 Safety: {recipe['safety_level']}")
            print(f"   📊 {recipe['nutrition']['calories']} cal")
            
            # Interactive options
            print("\n   Actions: [v]iew details, [l]ike, [s]kip, [n]ext")
            action = input("   Choose: ").strip().lower()
            
            if action == 'v':
                print(f"\n   Full Details:")
                print(f"   Description: {recipe.get('description', 'N/A')}")
                print(f"   Nutrition: {json.dumps(recipe['nutrition'], indent=6)}")
                if recipe.get('safety_warnings'):
                    print(f"   Warnings: {recipe['safety_warnings']}")
            elif action == 'l':
                agent.record_feedback(user_id, recipe['id'], 'like')
                print("   ✅ Liked!")
            elif action == 's':
                agent.record_feedback(user_id, recipe['id'], 'hide')
                print("   ⏭️ Skipped")
            
    except (IndexError, ValueError):
        print("Invalid selection")

if __name__ == "__main__":
    interactive_test()