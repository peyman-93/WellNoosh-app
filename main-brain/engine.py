# engine.py
import json
import openai
from datetime import datetime
import config
from schemas import MealOption
from pydantic import ValidationError

DATABASE_FILE_PATH = "data/user_database.json"

def load_database():
    try:
        with open(DATABASE_FILE_PATH, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Error: Database file not found. Run 'database_generator.py' first.")
        return None

def get_user_profile(db, user_id):
    return db.get(user_id)

def get_meal_time():
    current_hour = datetime.now().hour
    if 5 <= current_hour < 12: return "Breakfast"
    elif 12 <= current_hour < 17: return "Lunch"
    else: return "Dinner"

def generate_one_meal(profile, rejected_options=None):
    meal_time = get_meal_time()
    
    # ###--- UPDATED PROMPT ---###
    prompt = f"""
    You are an expert AI Medical Dietitian and Chef for the "WellNoosh" app. Your primary responsibility is to create a recipe that is medically safe and precisely tailored to the user's complex health profile.

    **USER'S COMPLETE PROFILE:**
    {json.dumps(profile, indent=2)}

    **YOUR THOUGHT PROCESS:**
    1.  **Holistic Analysis:** Analyze ALL aspects of the user's profile to find a recipe that satisfies every single constraint simultaneously.
    2.  **Constraint Checklist:** The recipe must be compliant with:
        - Gender: **{profile.get('gender', 'Not specified')}**
        - Diet: **{profile['diet']['name']}**
        - Allergies to Exclude: **{profile['health_profile']['allergies']}**
        - Medical Conditions to Consider: **{profile['health_profile']['medical_conditions']}**
        - Biometrics: Consider age, weight, and height for portioning.

    **REJECTED MEALS (If any):**
    {f"The user has previously rejected these options, do not suggest them again: {rejected_options}" if rejected_options else "None."}

    **CRITICAL TASK & JSON STRUCTURE:**
    Your response MUST be a single, clean JSON object. Follow this structure with NO deviations. The `suitability_reasoning` field has been removed.

    **REQUIRED STRUCTURE:**
    {{
      "meal_summary": {{
        "meal_name": "Example Dish Name",
        "description": "A short, enticing description.",
        "macros": {{ "calories": "450 kcal", "protein": "30g", "carbohydrates": "10g", "fat": "32g" }}
      }},
      "full_recipe": {{
        "prep_time": "15 minutes",
        "cook_time": "20 minutes",
        "servings": {profile['family_size']},
        "ingredients": [ {{ "item": "Salmon Fillet", "quantity": "150g" }} ],
        "instructions": [ "Step 1:...", "Step 2:..." ]
      }}
    }}
    """
    
    for model_info in config.MODEL_PREFERENCE:
        try:
            print(f"\nAttempting model: {model_info['model_name']}...")
            response = openai.chat.completions.create(
                model=model_info['model_name'],
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": "You are a medical dietitian that responds only in the exact JSON structure requested."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=config.MAX_TOKENS
            )
            raw_data = json.loads(response.choices[0].message.content)
            validated_meal = MealOption.model_validate(raw_data)
            print(f"✅ Success & Validated with {model_info['model_name']}!")
            return validated_meal
            
        except ValidationError as e:
            print(f"❌ Validation Error: The AI's response did not match the required structure. Details: {e}")
            continue
        except Exception as e:
            print(f"❌ API Error: {e}. Trying next model...")
            continue
    
    print("All models failed to provide a valid response.")
    return None

def display_recipe_details(meal: MealOption):
    summary = meal.meal_summary
    recipe = meal.full_recipe
    
    print("\n" + "="*60)
    print(f"  Here is your recipe for: {summary.meal_name}")
    print("="*60)
    
    # ###--- REMOVED THE REASONING DISPLAY BLOCK ---###
    
    print(f"\n- Description: {summary.description}")
    print(f"- Prep time: {recipe.prep_time} | Cook time: {recipe.cook_time}")
    print(f"- Nutrition: {summary.macros.calories}, {summary.macros.protein} protein, {summary.macros.carbohydrates} carbs, {summary.macros.fat} fat")
    
    print("\n--- Ingredients ---")
    for ing in recipe.ingredients:
        print(f"  - {ing.item} ({ing.quantity})")
        
    print("\n--- Instructions ---")
    for i, instruction in enumerate(recipe.instructions):
        print(f"  {i+1}. {instruction}")
    print("\n" + "="*60)

def start_interactive_session(user_id):
    user_database = load_database()
    if not user_database: return
    user_profile = get_user_profile(user_database, user_id)
    if not user_profile:
        print(f"User '{user_id}' not found.")
        return
        
    rejected_options_list = []
    while True:
        meal_idea = generate_one_meal(user_profile, rejected_options_list)
        if not meal_idea:
            print("Sorry, I couldn't come up with a meal idea for you right now.")
            break
        
        meal_name = meal_idea.meal_summary.meal_name
        print(f"\nHere is a suggestion for you: ✨ {meal_name} ✨")
        feedback = input("Do you like this idea? (yes/no): ").lower().strip()
        
        if feedback == "yes":
            display_recipe_details(meal_idea)
            print("Enjoy your meal!")
            break
        elif feedback == "no":
            rejected_options_list.append(meal_name)
            print("\nNo problem. Let me think of something else...")
        else:
            print("\nInvalid input. Exiting session.")
            break

if __name__ == "__main__":
    test_user_id = "user_1"
    start_interactive_session(test_user_id)