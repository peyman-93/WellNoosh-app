# graph.py
import json
import openai
from datetime import datetime
from typing import List, TypedDict, Optional
import pandas as pd

from langgraph.graph import StateGraph, END
from pydantic import ValidationError

import config
from schemas import MealOption

# --- 1. Define the State of our Graph ---
class GraphState(TypedDict):
    user_id: str
    user_profile: dict
    rejected_meals: List[str]
    current_suggestion: Optional[MealOption]
    image_url: Optional[str]
    final_recipe: Optional[MealOption]
    grocery_run: bool
    grocery_stores: List[str]
    shopping_list_comparison: List[dict]
    cheapest_store: str
    total_cost: float

# --- 2. Define the Nodes of our Graph ---

def get_user_profile_node(state: GraphState) -> GraphState:
    """Node to load the user's profile from the 'database'."""
    print("---NODE: Getting User Profile---")
    db_path = "data/user_database.json"
    with open(db_path, 'r') as f:
        db = json.load(f)
    profile = db.get(state["user_id"])
    if not profile:
        raise ValueError(f"User {state['user_id']} not found in database.")
    return {"user_profile": profile}

def generate_meal_suggestion_node(state: GraphState) -> GraphState:
    """Node that calls the LLM to generate a single meal idea using the robust prompt."""
    print("---NODE: Generating Meal Suggestion---")
    profile = state["user_profile"]
    rejected = state["rejected_meals"]
    meal_time = "dinner"

    prompt = f"""
    You are a backend AI model responsible for generating a JSON object for the WellNoosh app.
    Your response will be validated against a strict Pydantic schema. You MUST follow the structure exactly.
    Do not add extra fields, do not change field names, do not use the wrong data types.

    Here is the Pydantic schema you MUST adhere to:
    ```python
    class Macros(BaseModel):
        calories: str
        protein: str
        carbohydrates: str
        fat: str

    class MealSummary(BaseModel):
        meal_name: str
        description: str
        macros: Macros

    class Ingredient(BaseModel):
        item: str
        quantity: str

    class FullRecipe(BaseModel):
        prep_time: str
        cook_time: str
        servings: int
        ingredients: List[Ingredient]
        instructions: List[str]

    class MealOption(BaseModel):
        meal_summary: MealSummary
        full_recipe: FullRecipe
    ```

    Now, based on the following user profile, generate ONE meal suggestion for {meal_time} that is medically safe and appropriate.
    USER PROFILE:
    {json.dumps(profile, indent=2)}

    REJECTED MEALS (Do not suggest these again):
    {rejected if rejected else "None."}

    Your final output must be a single, valid JSON object that conforms to the `MealOption` schema provided above.
    """

    for model_info in config.MODEL_PREFERENCE:
        try:
            print(f"Attempting model: {model_info['model_name']}...")
            response = openai.chat.completions.create(
                model=model_info['model_name'],
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": "You are a JSON generation expert that strictly follows Pydantic schemas."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=config.MAX_TOKENS
            )
            raw_data = json.loads(response.choices[0].message.content)
            validated_meal = MealOption.model_validate(raw_data)
            print(f"✅ Success & Validated with {model_info['model_name']}!")
            return {"current_suggestion": validated_meal}
        except Exception as e:
            print(f"❌ Error with model {model_info['model_name']}: {e}")
            continue
            
    print("All models failed to provide a valid, structured response.")
    return {"current_suggestion": None}

def generate_image_node(state: GraphState) -> GraphState:
    """Node that calls the DALL-E 3 API to generate an image of the meal."""
    print("---NODE: Generating Meal Image---")
    suggestion = state["current_suggestion"]
    if not suggestion:
        return {"image_url": None}

    meal_name = suggestion.meal_summary.meal_name
    description = suggestion.meal_summary.description
    
    image_prompt = f"A vibrant, photorealistic photo of '{meal_name}'. {description}. The dish is plated beautifully on a rustic wooden table, with soft, natural lighting, looking delicious and healthy."
    
    try:
        print(f"Generating image for: {meal_name}...")
        response = openai.images.generate(
            model="dall-e-3",
            prompt=image_prompt,
            size="1024x1024",
            quality="standard",
            n=1,
        )
        image_url = response.data[0].url
        print("✅ Image generated successfully.")
        return {"image_url": image_url}
    except Exception as e:
        print(f"❌ DALL-E Error: Could not generate image. {e}")
        return {"image_url": None}

def get_user_feedback_node(state: GraphState) -> GraphState:
    """Node that presents the meal and image to the user and gets their feedback."""
    print("---NODE: Getting User Feedback---")
    suggestion = state["current_suggestion"]
    image_url = state["image_url"]

    if not suggestion:
        print("No suggestion was generated, so we cannot get feedback.")
        return {"final_recipe": None}

    meal_name = suggestion.meal_summary.meal_name
    print(f"\nHere is a suggestion for you: ✨ {meal_name} ✨")
    
    if image_url:
        print(f"🖼️ Here's how it could look: {image_url}")
    else:
        print("🖼️ (Could not generate an image preview)")

    feedback = input("Do you like this idea? (yes/no): ").lower().strip()
    
    if feedback == "yes":
        return {"final_recipe": suggestion}
    else:
        rejected_list = state.get("rejected_meals", [])
        rejected_list.append(meal_name)
        return {"rejected_meals": rejected_list, "final_recipe": None, "image_url": None}

def display_final_recipe_node(state: GraphState):
    """Node that displays the final approved recipe in a user-friendly format."""
    print("---NODE: Displaying Final Recipe---")
    final_recipe = state["final_recipe"]
    summary = final_recipe.meal_summary
    recipe = final_recipe.full_recipe
    
    print("\n" + "="*60)
    print(f"  Here is your recipe for: {summary.meal_name}")
    print("="*60)
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
    
    return {}

def get_grocery_decision_node(state: GraphState) -> GraphState:
    """Asks the user if they want to proceed with grocery shopping."""
    print("---NODE: Getting Grocery Decision---")
    feedback = input("\nWould you like me to price out a shopping list for this recipe? (yes/no): ").lower().strip()
    return {"grocery_run": feedback == "yes"}

def grocery_comparison_node(state: GraphState) -> GraphState:
    """Looks up prices from pre-scraped, country-specific CSV files and compares them."""
    print("---NODE: Comparing Local Grocery Prices---")
    recipe = state["final_recipe"]
    profile = state["user_profile"]
    if not recipe or not profile: return {}

    country_store_map = {
        "spain": ["lidl", "mercadona", "dia", "aldi"],
        "netherlands": ["lidl", "jumbo", "aldi", "plus"]
    }
    
    user_country = profile.get("location", {}).get("country", "").lower()
    if user_country not in country_store_map:
        print(f"Warning: No store information available for country: {user_country}")
        return {}
    
    available_stores = country_store_map[user_country]
    country_code_map = {"spain": "es", "netherlands": "nl"}
    country_code = country_code_map.get(user_country)

    store_data = {}
    for store in available_stores:
        filepath = f"data/{store}_{country_code}_products.csv"
        try:
            store_data[store] = pd.read_csv(filepath)
            print(f"  Successfully loaded price data for {store.capitalize()}.")
        except FileNotFoundError:
            print(f"  Info: Price data file not found for {store}, skipping.")
    
    if not store_data:
        print("Error: No local price data could be loaded. Please run the daily scraper.")
        return {}

    store_totals = {store: 0.0 for store in store_data.keys()}
    comparison_data = []

    for ingredient in recipe.full_recipe.ingredients:
        item_name_lower = ingredient.item.lower()
        price_row = {"ingredient": f"{ingredient.item} ({ingredient.quantity})"}
        
        for store, df in store_data.items():
            match = df[df["product_name"].str.contains(item_name_lower, case=False, na=False)]
            price = match.iloc[0]["price"] if not match.empty else None
            price_row[store] = f"€{price:.2f}" if price is not None else "N/A"
            if price is not None:
                store_totals[store] += price
        comparison_data.append(price_row)

    if not any(v > 0 for v in store_totals.values()):
        print("Could not find prices for any ingredients.")
        return {}
        
    cheapest_store_name = min(store_totals, key=lambda k: store_totals[k] if store_totals[k] > 0 else float('inf'))
    cheapest_cost = store_totals[cheapest_store_name]

    print(f"✅ Comparison complete.")
    return {
        "shopping_list_comparison": comparison_data,
        "cheapest_store": cheapest_store_name,
        "total_cost": cheapest_cost,
        "grocery_stores": list(store_data.keys())
    }

def display_smart_shopping_list_node(state: GraphState) -> GraphState:
    """Displays the price comparison and provides the final, actionable shopping list."""
    print("---NODE: Displaying Smart Shopping List---")
    comparison = state.get("shopping_list_comparison")
    cheapest_store = state.get("cheapest_store")
    total_cost = state.get("total_cost")
    stores = state.get("grocery_stores", [])

    if not comparison:
        print("Could not generate a shopping list.")
        return {}

    headers = ["Ingredient"] + [s.capitalize() for s in stores]
    header_str = " | ".join([f"{h:<25}" for h in headers])
    print("\n" + "#"*len(header_str))
    print("  Price Comparison")
    print("#"*len(header_str))
    print(header_str)
    print("-" * len(header_str))
    for row in comparison:
        row_str = " | ".join([f"{row.get(s, 'N/A'):<25}" for s in [h.lower() for h in headers]])
        print(row_str)
    print("#"*len(header_str))

    print(f"\n✨ Best Option: Shop at {cheapest_store.capitalize()} for an estimated total of €{total_cost:.2f}")
    
    print("\n--- Your Shopping List for Glovo/Instacart ---")
    final_recipe_ingredients = state["final_recipe"].full_recipe.ingredients
    order_text = f"Custom order for {cheapest_store.capitalize()}:\n"
    for item in final_recipe_ingredients:
        order_text += f"- {item.item} ({item.quantity})\n"
    print(order_text.strip())
    print("---------------------------------------------")
    return {}

# --- 3. Define the Edges of our Graph ---
def should_continue_edge(state: GraphState) -> str:
    """The conditional edge that controls the recipe feedback loop."""
    print("---EDGE: Checking recipe feedback---")
    if state.get("final_recipe"): return "display_recipe"
    elif state.get("current_suggestion") is None: return END
    else: return "generate_suggestion"

def should_get_groceries_edge(state: GraphState) -> str:
    """The conditional edge that controls the grocery workflow."""
    print("---EDGE: Checking grocery decision---")
    if state.get("grocery_run"): return "compare_groceries"
    else:
        print("Ok, ending session. Enjoy your recipe!")
        return END

# --- 4. Assemble the Graph ---
workflow = StateGraph(GraphState)

workflow.set_entry_point("get_profile")
workflow.add_node("get_profile", get_user_profile_node)
workflow.add_node("generate_suggestion", generate_meal_suggestion_node)
workflow.add_node("generate_image", generate_image_node)
workflow.add_node("get_feedback", get_user_feedback_node)
workflow.add_node("display_recipe", display_final_recipe_node)
workflow.add_node("get_grocery_decision", get_grocery_decision_node)
workflow.add_node("compare_groceries", grocery_comparison_node)
workflow.add_node("display_smart_list", display_smart_shopping_list_node)

workflow.add_edge("get_profile", "generate_suggestion")
workflow.add_edge("generate_suggestion", "generate_image")
workflow.add_edge("generate_image", "get_feedback")
workflow.add_conditional_edges("get_feedback", should_continue_edge, {
    "display_recipe": "display_recipe",
    "generate_suggestion": "generate_suggestion",
    END: END
})
workflow.add_edge("display_recipe", "get_grocery_decision")
workflow.add_conditional_edges("get_grocery_decision", should_get_groceries_edge, {
    "compare_groceries": "compare_groceries",
    END: END
})
workflow.add_edge("compare_groceries", "display_smart_list")
workflow.add_edge("display_smart_list", END)

app = workflow.compile()