# schemas.py
from pydantic import BaseModel, Field
from typing import List, Optional

class Macros(BaseModel):
    """Nutritional macros for a meal."""
    calories: str = Field(..., description="Calories in format 'XXX kcal'")
    protein: str = Field(..., description="Protein in format 'XXg'")
    carbohydrates: str = Field(..., description="Carbohydrates in format 'XXg'")
    fat: str = Field(..., description="Fat in format 'XXg'")

class MealSummary(BaseModel):
    """Summary information about a meal."""
    meal_name: str = Field(..., description="Name of the meal")
    description: str = Field(..., description="Brief description of the meal")
    macros: Macros = Field(..., description="Nutritional information")

class Ingredient(BaseModel):
    """Individual ingredient with quantity."""
    item: str = Field(..., description="Name of the ingredient")
    quantity: str = Field(..., description="Amount needed (e.g., '2 cups', '1 tbsp')")

class FullRecipe(BaseModel):
    """Complete recipe with all details."""
    prep_time: str = Field(..., description="Preparation time in format 'XX minutes'")
    cook_time: str = Field(..., description="Cooking time in format 'XX minutes'")
    servings: int = Field(..., description="Number of servings this recipe makes", ge=1)
    ingredients: List[Ingredient] = Field(..., description="List of ingredients needed")
    instructions: List[str] = Field(..., description="Step-by-step cooking instructions")

class MealOption(BaseModel):
    """Complete meal option with summary and full recipe."""
    meal_summary: MealSummary = Field(..., description="Summary of the meal")
    full_recipe: FullRecipe = Field(..., description="Complete recipe details")
    
    class Config:
        """Pydantic configuration."""
        # Enable validation of default values
        validate_assignment = True
        # Use enum values instead of enum objects
        use_enum_values = True
        # Allow extra fields (for future extensibility)
        extra = "forbid"