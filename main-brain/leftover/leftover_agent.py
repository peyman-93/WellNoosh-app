# leftover/leftover_agent.py

import sys
import os
import json
import shutil
from datetime import datetime
from typing import TypedDict, List, Literal, Optional

# Add parent directory to path for imports
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

try:
    import openai
    from langgraph.checkpoint.sqlite import SqliteSaver
    from langgraph.checkpoint.memory import MemorySaver
    from langgraph.graph import StateGraph, END
    import config
    from schemas import MealOption
except ImportError as e:
    print(f"Import error: {e}")
    print("Please ensure all required packages are installed:")
    print("pip install openai langgraph langgraph-checkpoint-sqlite pydantic python-dotenv")
    print("For a quick fix, you can also try: pip install --upgrade langgraph langgraph-checkpoint-sqlite")
    sys.exit(1)

# --- 1. Define the State (Expanded for the new flow) ---
class LeftoverAgentState(TypedDict):
    user_id: str
    user_profile: Optional[dict]
    input_type: Literal["text", "audio", "confirmation"]
    input_data: str
    
    # State Management
    inventory: List[str]
    parsed_items: List[str]
    rejected_recipes: List[str] # For the Tinder-style loop
    recommendation_count: int # To limit free recommendations
    
    # Current Suggestion
    recipe_suggestion: Optional[MealOption]
    recipe_image_url: Optional[str]
    
    # Final Choice
    final_recipe: Optional[MealOption]
    confirmation_response: Optional[str]

# --- Helper functions ---
def ensure_directory_exists(path):
    """Ensure directory exists for a given file path."""
    directory = os.path.dirname(path)
    if directory and not os.path.exists(directory):
        os.makedirs(directory, exist_ok=True)

# --- 2. Define the Nodes for the Agent ---

def get_user_data_node(state: LeftoverAgentState) -> dict:
    """Loads user profile, inventory, and initializes session state."""
    print("---NODE: Getting User Data & Initializing Session---")
    user_id = state["user_id"]
    db_path = "data/user_database.json"
    
    # Create data directory if it doesn't exist
    ensure_directory_exists(db_path)
    
    try:
        if not os.path.exists(db_path):
            # Create a default user profile if database doesn't exist
            default_data = {
                user_id: {
                    "name": "Default User",
                    "dietary_preferences": [],
                    "allergies": [],
                    "cooking_skill": "beginner"
                }
            }
            with open(db_path, 'w') as f:
                json.dump(default_data, f, indent=4)
        
        with open(db_path, 'r') as f:
            database = json.load(f)
            profile = database.get(user_id)
            
        if not profile:
            print(f"Warning: User {user_id} not found. Creating default profile.")
            profile = {
                "name": "Default User",
                "dietary_preferences": [],
                "allergies": [],
                "cooking_skill": "beginner"
            }
    except Exception as e:
        print(f"Error loading user data: {e}")
        profile = {
            "name": "Default User",
            "dietary_preferences": [],
            "allergies": [],
            "cooking_skill": "beginner"
        }

    inventory_path = "data/leftover_data/user_inventory.json"
    ensure_directory_exists(inventory_path)
    
    try:
        if os.path.exists(inventory_path):
            with open(inventory_path, 'r') as f:
                try: 
                    inventories = json.load(f)
                except json.JSONDecodeError: 
                    inventories = {}
        else: 
            inventories = {}
        
        user_inventory = inventories.get(user_id, [])
        print(f"Current inventory: {user_inventory}")
    except Exception as e:
        print(f"Error loading inventory: {e}")
        user_inventory = []
    
    # Initialize session-specific state
    return {
        "user_profile": profile, 
        "inventory": user_inventory,
        "rejected_recipes": state.get("rejected_recipes", []),
        "recommendation_count": state.get("recommendation_count", 0)
    }

def process_user_input_node(state: LeftoverAgentState) -> dict:
    """Processes user input to extract food items."""
    print(f"---NODE: Processing User Input ({state['input_type']})---")
    input_type, input_data = state["input_type"], state["input_data"]
    
    if input_type == "confirmation" or not input_data: 
        return {"parsed_items": []}
    
    try:
        if input_type == "text":
            prompt = f"Extract food items from this text as a JSON list. Text: '{input_data}'"
            messages = [{"role": "user", "content": prompt}]
            
        elif input_type == "audio":
            if not os.path.exists(input_data):
                print(f"Error: Audio file {input_data} not found")
                return {"parsed_items": []}
                
            try:
                print(f"🎵 Processing audio file: {input_data}")
                file_size = os.path.getsize(input_data)
                print(f"📊 Audio file size: {file_size} bytes")
                
                with open(input_data, "rb") as audio_file:
                    print("🔄 Sending to OpenAI Whisper for transcription...")
                    transcription_response = openai.audio.transcriptions.create(
                        model="whisper-1", 
                        file=audio_file
                    )
                    text = transcription_response.text
                    
                print(f"✅ Transcription successful: '{text}'")
                
                if not text.strip():
                    print("⚠️  Transcription is empty - no speech detected")
                    return {"parsed_items": []}
                    
                prompt = f"Extract food items from transcribed text as a JSON list. Text: '{text}'"
                messages = [{"role": "user", "content": prompt}]
                
            except Exception as e:
                print(f"❌ Error transcribing audio: {e}")
                print(f"🔍 Error details: {type(e).__name__}: {str(e)}")
                return {"parsed_items": []}
        else: 
            return {"parsed_items": []}
            
        response = openai.chat.completions.create(
            model="gpt-4o-mini", 
            response_format={"type": "json_object"}, 
            messages=[
                {"role": "system", "content": "You return JSON `{\"items\": [...]}`."}, 
                *messages
            ]
        )
        
        parsed_items = json.loads(response.choices[0].message.content).get("items", [])
        print(f"✅ Parsed Items: {parsed_items}")
        return {"parsed_items": parsed_items}
        
    except Exception as e:
        print(f"❌ Error processing input: {e}")
        return {"parsed_items": []}

def update_inventory_node(state: LeftoverAgentState) -> dict:
    """Adds newly parsed items to the persistent inventory."""
    print("---NODE: Updating Inventory (Adding Items)---")
    user_id = state["user_id"]
    current_inventory = state.get("inventory", [])
    new_items = state.get("parsed_items", [])
    
    if not new_items: 
        return {"inventory": current_inventory}
    
    updated_inventory = list(current_inventory)
    added_count = 0
    
    for item in new_items:
        if item.lower() not in [i.lower() for i in updated_inventory]:
            updated_inventory.append(item)
            added_count += 1
    
    print(f"Added {added_count} new items.")
    
    # Save updated inventory
    inventory_path = "data/leftover_data/user_inventory.json"
    ensure_directory_exists(inventory_path)
    
    try:
        if os.path.exists(inventory_path):
            with open(inventory_path, 'r') as f:
                try: 
                    inventories = json.load(f)
                except json.JSONDecodeError: 
                    inventories = {}
        else: 
            inventories = {}
        
        inventories[user_id] = updated_inventory
        
        with open(inventory_path, 'w') as f:
            json.dump(inventories, f, indent=4)
            
    except Exception as e:
        print(f"Error saving inventory: {e}")
    
    return {"inventory": updated_inventory}

def generate_recipe_node(state: LeftoverAgentState) -> dict:
    """Generates a single recipe suggestion, avoiding rejected ones."""
    print(f"---NODE: Generating Recipe (Attempt {state.get('recommendation_count', 0) + 1})---")
    
    inventory = state.get("inventory", [])
    if not inventory:
        print("Inventory is empty. Cannot generate a recipe.")
        return {"recipe_suggestion": None}

    user_profile = state.get("user_profile", {})
    rejected_recipes = state.get("rejected_recipes", [])
    
    prompt = f"""
    Create a recipe JSON object from the user's inventory and profile. The JSON must conform to the `MealOption` schema.
    
    USER PROFILE: {json.dumps(user_profile, indent=2)}
    FOOD INVENTORY: {json.dumps(inventory, indent=2)}
    REJECTED RECIPES (Do not suggest these again): {json.dumps(rejected_recipes)}
    
    Return a JSON object with this structure:
    {{
        "meal_summary": {{
            "meal_name": "Recipe Name",
            "description": "Brief description",
            "macros": {{
                "calories": "XXX kcal",
                "protein": "XXg",
                "carbohydrates": "XXg", 
                "fat": "XXg"
            }}
        }},
        "full_recipe": {{
            "prep_time": "XX minutes",
            "cook_time": "XX minutes",
            "servings": 2,
            "ingredients": [
                {{"item": "ingredient name", "quantity": "amount"}}
            ],
            "instructions": [
                "Step 1 instructions",
                "Step 2 instructions"
            ]
        }}
    }}
    """
    
    try:
        response = openai.chat.completions.create(
            model="gpt-4o-mini", 
            response_format={"type": "json_object"}, 
            messages=[
                {"role": "system", "content": "You are a JSON recipe generation expert."}, 
                {"role": "user", "content": prompt}
            ]
        )
        
        recipe_data = json.loads(response.choices[0].message.content)
        recipe = MealOption.model_validate(recipe_data)
        print(f"✅ Suggestion: {recipe.meal_summary.meal_name}")
        
        return {
            "recipe_suggestion": recipe, 
            "recommendation_count": state.get("recommendation_count", 0) + 1
        }
        
    except Exception as e:
        print(f"❌ Failed to generate recipe: {e}")
        return {"recipe_suggestion": None}

def generate_recipe_image_node(state: LeftoverAgentState) -> dict:
    """Generates an image for the current recipe suggestion using DALL-E 3."""
    print("---NODE: Generating Recipe Image---")
    recipe_suggestion = state.get("recipe_suggestion")
    
    if not recipe_suggestion:
        return {"recipe_image_url": None}
    
    meal_name = recipe_suggestion.meal_summary.meal_name
    description = recipe_suggestion.meal_summary.description
    
    # Use the same style as the profile-based system for consistency
    prompt = f"A vibrant, photorealistic photo of '{meal_name}'. {description}. The dish is plated beautifully on a rustic wooden table, with soft, natural lighting, looking delicious and healthy."
    
    try:
        response = openai.images.generate(
            model="dall-e-3", 
            prompt=prompt, 
            size="1024x1024", 
            n=1
        )
        image_url = response.data[0].url
        print("✅ Consistent-style food photo generated.")
        return {"recipe_image_url": image_url}
        
    except Exception as e:
        print(f"❌ DALL-E Error: {e}")
        return {"recipe_image_url": None}

def get_tinder_feedback_node(state: LeftoverAgentState) -> dict:
    """Presents the recipe and image to the user for yes/no feedback."""
    print("\n" + "="*60)
    print("💡 HERE IS A RECIPE IDEA FOR YOU 💡")
    
    suggestion = state.get("recipe_suggestion")
    if not suggestion:
        print("I couldn't think of a recipe with your current ingredients. Try adding more items!")
        return {"final_recipe": None} 

    image_url = state.get("recipe_image_url")
    
    print(f"\n✨ {suggestion.meal_summary.meal_name} ✨")
    print(f"📝 {suggestion.meal_summary.description}")
    
    if image_url:
        print(f"🖼️  Take a look: {image_url}")
    else:
        print("🖼️  (Image preview could not be generated)")
        
    try:
        response = input("\nDo you like this idea? (yes/no/quit): ").lower().strip()
    except (EOFError, KeyboardInterrupt):
        response = "quit"
    
    if response == "yes":
        return {"final_recipe": suggestion}
    elif response == "quit":
        print("Goodbye!")
        return {"final_recipe": None}
    else:
        rejected = state.get("rejected_recipes", [])
        rejected.append(suggestion.meal_summary.meal_name)
        return {"final_recipe": None, "rejected_recipes": rejected}

def display_and_confirm_final_recipe_node(state: LeftoverAgentState) -> dict:
    """Displays the chosen recipe and asks to consume ingredients."""
    print("\n" + "="*60 + "\n✅ GREAT! HERE IS YOUR RECIPE ✅\n" + "="*60)
    recipe = state.get("final_recipe")
    
    if not recipe:
        return {"confirmation_response": "no"}
    
    summary, full_recipe = recipe.meal_summary, recipe.full_recipe
    print(f"\nRecipe: {summary.meal_name}")
    print(f"- Description: {summary.description}")
    print(f"- Prep Time: {full_recipe.prep_time}")
    print(f"- Cook Time: {full_recipe.cook_time}")
    print(f"- Servings: {full_recipe.servings}")
    
    print("\n--- Nutritional Info ---")
    macros = summary.macros
    print(f"  Calories: {macros.calories}")
    print(f"  Protein: {macros.protein}")
    print(f"  Carbs: {macros.carbohydrates}")
    print(f"  Fat: {macros.fat}")
    
    print("\n--- Ingredients ---")
    for ing in full_recipe.ingredients:
        print(f"  - {ing.item} ({ing.quantity})")
        
    print("\n--- Instructions ---")
    for i, instruction in enumerate(full_recipe.instructions, 1):
        print(f"  {i}. {instruction}")
        
    print("\n" + "="*60)
    
    try:
        response = input("❓ Shall I mark the main ingredients as used? (yes/no): ").lower().strip()
    except (EOFError, KeyboardInterrupt):
        response = "no"
        
    return {"confirmation_response": response}

def consume_ingredients_node(state: LeftoverAgentState) -> dict:
    """Removes the used ingredients from the inventory."""
    print("---NODE: Consuming Used Ingredients---")
    user_id = state["user_id"]
    current_inventory = state.get("inventory", [])
    recipe = state.get("final_recipe")
    
    if not recipe:
        return {"inventory": current_inventory}
    
    used_items_lower = [ing.item.lower() for ing in recipe.full_recipe.ingredients]
    remaining_inventory = [item for item in current_inventory if item.lower() not in used_items_lower]
    removed_count = len(current_inventory) - len(remaining_inventory)
    print(f"Removed {removed_count} item(s).")
    
    # Save updated inventory
    inventory_path = "data/leftover_data/user_inventory.json"
    ensure_directory_exists(inventory_path)
    
    try:
        if os.path.exists(inventory_path):
            with open(inventory_path, 'r') as f: 
                inventories = json.load(f)
        else:
            inventories = {}
            
        inventories[user_id] = remaining_inventory
        
        with open(inventory_path, 'w') as f: 
            json.dump(inventories, f, indent=4)
            
    except Exception as e:
        print(f"Error saving updated inventory: {e}")
    
    return {"inventory": remaining_inventory}

# --- 3. Define Edges (Conditional Logic) ---

def route_after_input(state: LeftoverAgentState) -> str:
    """If user added items, update inventory. Otherwise, go straight to recipe generation."""
    parsed_items = state.get("parsed_items", [])
    return "update_inventory" if parsed_items else "generate_recipe"

def route_after_feedback(state: LeftoverAgentState) -> str:
    """Handle the Tinder-style feedback loop."""
    final_recipe = state.get("final_recipe")
    recommendation_count = state.get("recommendation_count", 0)
    
    if final_recipe:
        return "display_final_recipe"
    
    if recommendation_count < 3:
        print("Okay, let me think of another idea...")
        return "generate_recipe"
    
    print("Sorry I couldn't find a recipe you liked. You've reached the recommendation limit.")
    return END

def did_user_confirm_consumption(state: LeftoverAgentState) -> str:
    """Check the final yes/no for consuming ingredients."""
    confirmation = state.get("confirmation_response", "no")
    return "consume_ingredients" if confirmation == "yes" else END

# --- 4. Assemble the Graph ---
def create_workflow():
    """Create and compile the workflow graph."""
    workflow = StateGraph(LeftoverAgentState)

    # Add nodes
    workflow.add_node("get_user_data", get_user_data_node)
    workflow.add_node("process_user_input", process_user_input_node)
    workflow.add_node("update_inventory", update_inventory_node)
    workflow.add_node("generate_recipe", generate_recipe_node)
    workflow.add_node("generate_image", generate_recipe_image_node)
    workflow.add_node("get_feedback", get_tinder_feedback_node)
    workflow.add_node("display_final_recipe", display_and_confirm_final_recipe_node)
    workflow.add_node("consume_ingredients", consume_ingredients_node)

    # Set entry point
    workflow.set_entry_point("get_user_data")

    # Add edges
    workflow.add_edge("get_user_data", "process_user_input")
    workflow.add_conditional_edges("process_user_input", route_after_input, {
        "update_inventory": "update_inventory",
        "generate_recipe": "generate_recipe"
    })
    workflow.add_edge("update_inventory", "generate_recipe")
    workflow.add_edge("generate_recipe", "generate_image")
    workflow.add_edge("generate_image", "get_feedback")

    workflow.add_conditional_edges("get_feedback", route_after_feedback, {
        "display_final_recipe": "display_final_recipe",
        "generate_recipe": "generate_recipe",
        END: END
    })

    workflow.add_conditional_edges("display_final_recipe", did_user_confirm_consumption, {
        "consume_ingredients": "consume_ingredients",
        END: END
    })

    workflow.add_edge("consume_ingredients", END)

    return workflow

# Create workflow and compile with memory
try:
    workflow = create_workflow()
    
    # Ensure memory database directory exists
    memory_db_path = "data/leftover_data/leftover_memory.db"
    ensure_directory_exists(memory_db_path)
    
    # Try different approaches for creating the checkpointer
    try:
        import sqlite3
        # Method 1: Use direct connection (more reliable)
        conn = sqlite3.connect(memory_db_path, check_same_thread=False)
        memory = SqliteSaver(conn)
        print("✅ Using SQLite checkpointer")
    except Exception as sqlite_error:
        print(f"⚠️  SQLite checkpointer failed: {sqlite_error}")
        try:
            # Method 2: Try from_conn_string
            memory = SqliteSaver.from_conn_string(f"sqlite:///{memory_db_path}")
            print("✅ Using SQLite checkpointer (conn_string method)")
        except Exception as conn_string_error:
            print(f"⚠️  SQLite conn_string failed: {conn_string_error}")
            # Method 3: Fallback to MemorySaver
            from langgraph.checkpoint.memory import MemorySaver
            memory = MemorySaver()
            print("✅ Using in-memory checkpointer (fallback)")
    
    app = workflow.compile(checkpointer=memory)
    print("✅ Workflow compiled successfully!")
    
except Exception as e:
    print(f"❌ Error compiling workflow: {e}")
    import traceback
    traceback.print_exc()
    app = None