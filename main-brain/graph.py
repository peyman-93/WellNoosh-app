# graph.py
import json
import openai
from datetime import datetime
from typing import List, TypedDict, Optional

from langgraph.graph import StateGraph, END
from pydantic import ValidationError

import config
from schemas import MealOption

# --- 1. Define the State of our Graph ---
# This is the "memory" of our application. It holds all the data that needs to be
# passed between the different steps (nodes) of our graph.
class GraphState(TypedDict):
    user_id: str
    user_profile: dict
    rejected_meals: List[str]
    current_suggestion: Optional[MealOption]
    image_url: Optional[str]
    final_recipe: Optional[MealOption]

# --- 2. Define the Nodes of our Graph ---
# Each node is a function that performs a specific action and updates the state.

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
    meal_time = "dinner"  # Hardcoding for consistency in prompts

    # This is the "Ultimate Schema Enforcement Prompt" we developed.
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
    print("Enjoy your meal!")
    
    return {}

# --- 3. Define the Edges of our Graph ---
def should_continue_edge(state: GraphState) -> str:
    """The conditional edge that controls the feedback loop."""
    print("---EDGE: Checking for next step---")
    
    if state.get("final_recipe"):
        return "display_recipe"
    elif state.get("current_suggestion") is None:
        print("Ending graph because generation failed.")
        return END
    else:
        return "generate_suggestion"

# --- 4. Assemble the Graph ---
workflow = StateGraph(GraphState)

# Add the nodes
workflow.set_entry_point("get_profile")
workflow.add_node("get_profile", get_user_profile_node)
workflow.add_node("generate_suggestion", generate_meal_suggestion_node)
workflow.add_node("generate_image", generate_image_node)
workflow.add_node("get_feedback", get_user_feedback_node)
workflow.add_node("display_recipe", display_final_recipe_node)

# Add the edges to define the flow
workflow.add_edge("get_profile", "generate_suggestion")
workflow.add_edge("generate_suggestion", "generate_image")
workflow.add_edge("generate_image", "get_feedback")

# The conditional edge creates the feedback loop or ends the process
workflow.add_conditional_edges(
    "get_feedback",
    should_continue_edge,
    {
        "display_recipe": "display_recipe",
        "generate_suggestion": "generate_suggestion",
        END: END
    }
)
workflow.add_edge("display_recipe", END)

# Compile the graph into a runnable application object
app = workflow.compile()