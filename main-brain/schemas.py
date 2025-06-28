# schemas.py
from pydantic import BaseModel
from typing import List

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