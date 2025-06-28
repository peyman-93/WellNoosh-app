# database_generator.py
import json
import os
import random

# --- Data Pools for Random Generation ---
GENDERS = ["Male", "Female"] # ###--- NEW ---###
DIETS = [
    {"name": "Mediterranean", "custom_preference": ""},
    {"name": "Vegetarian", "custom_preference": ""},
    {"name": "Vegan", "custom_preference": ""},
    {"name": "Ketogenic", "custom_preference": ""},
    {"name": "Paleo", "custom_preference": ""},
    {"name": "Balanced", "custom_preference": ""},
    {"name": "Custom", "custom_preference": "Loves spicy food, avoids red meat."}
]
ALLERGIES = ["Gluten", "Dairy", "Nuts", "Shellfish", "Egg", "Soy", "Sesame", "Fish", "Lactose Intolerance", "Histamine Intolerance"]
MEDICAL_CONDITIONS = ["Cardiovascular Disease", "Celiac Disease", "Irritable Bowel Syndrome (IBS)", "Gout", "Chronic Kidney Disease", "Anemia"]
NAMES = ["Alice", "Bob", "Charlie", "Diana", "Ethan", "Fiona", "George", "Hannah"]

def create_random_user_profile(user_id):
    """Generates a single, randomized user profile."""
    num_allergies = random.randint(0, 2)
    num_conditions = random.randint(0, 2)

    profile = {
        "user_id": f"user_{user_id}",
        "name": random.choice(NAMES),
        "gender": random.choice(GENDERS), # ###--- ADDED GENDER ---###
        "health_profile": {
            "allergies": random.sample(ALLERGIES, num_allergies),
            "medical_conditions": random.sample(MEDICAL_CONDITIONS, num_conditions),
            "biometrics": {
                "age": random.randint(18, 70),
                "weight": {"value": random.randint(50, 100), "unit": "kg"},
                "height": {"value": random.randint(150, 190), "unit": "cm"}
            }
        },
        "diet": random.choice(DIETS),
        "family_size": random.randint(1, 4)
    }
    return profile

def generate_database_file(num_users=10, filename="user_database.json"):
    """Creates a JSON file with a specified number of random user profiles."""
    if not os.path.exists("data"):
        os.makedirs("data")
    filepath = os.path.join("data", filename)
    
    users_database = {}
    for i in range(num_users):
        user_profile = create_random_user_profile(i)
        users_database[user_profile["user_id"]] = user_profile
        
    with open(filepath, 'w') as f:
        json.dump(users_database, f, indent=4)
        
    print(f"✅ Successfully generated '{filepath}' with {num_users} users (including gender).")

if __name__ == "__main__":
    generate_database_file(num_users=10)