"""
Nutrition Goals Agent
Calculates personalized daily nutrition goals based on user profile, health goals, and activity level.
Uses Mifflin-St Jeor equation for BMR and adjusts macros based on health goals.
"""

from typing import Dict, Any, Optional
from pydantic import BaseModel, Field
import math


class UserPhysicalProfile(BaseModel):
    """User's physical attributes for nutrition calculation"""
    age: int = Field(default=30, description="User's age in years")
    sex: str = Field(default="female", description="biological sex: 'male' or 'female'")
    weight_kg: float = Field(default=70.0, description="Weight in kilograms")
    height_cm: float = Field(default=165.0, description="Height in centimeters")
    activity_level: str = Field(default="moderate", description="sedentary, light, moderate, active, very_active")
    health_goal: str = Field(default="maintain", description="weight_loss, maintain, muscle_gain, general_health")
    diet_style: str = Field(default="balanced", description="balanced, keto, low-carb, high-protein, vegan, vegetarian")


class NutritionGoals(BaseModel):
    """Calculated daily nutrition goals"""
    calorie_goal: int = Field(description="Daily calorie target")
    protein_goal_g: int = Field(description="Daily protein target in grams")
    carbs_goal_g: int = Field(description="Daily carbohydrates target in grams")
    fat_goal_g: int = Field(description="Daily fat target in grams")
    fiber_goal_g: int = Field(description="Daily fiber target in grams")
    water_goal_ml: int = Field(default=2000, description="Daily water intake target in ml")
    calculation_method: str = Field(default="mifflin_st_jeor", description="Formula used for calculation")
    notes: str = Field(default="", description="Additional notes about the goals")


class NutritionGoalsAgent:
    """
    Agent that calculates personalized daily nutrition goals based on user profile.
    
    Uses scientifically-backed formulas:
    - BMR: Mifflin-St Jeor equation (more accurate than Harris-Benedict)
    - TDEE: BMR × Activity Factor
    - Macros: Adjusted based on health goals and diet style
    """
    
    ACTIVITY_MULTIPLIERS = {
        "sedentary": 1.2,       # Little or no exercise
        "light": 1.375,          # Light exercise 1-3 days/week
        "moderate": 1.55,        # Moderate exercise 3-5 days/week
        "active": 1.725,         # Hard exercise 6-7 days/week
        "very_active": 1.9       # Very hard exercise, physical job
    }
    
    GOAL_CALORIE_ADJUSTMENTS = {
        "weight_loss": -0.20,      # 20% deficit for sustainable weight loss
        "aggressive_loss": -0.25,  # 25% deficit (max recommended)
        "maintain": 0.0,           # No adjustment
        "lean_gain": 0.10,         # 10% surplus for lean muscle gain
        "muscle_gain": 0.15,       # 15% surplus for muscle gain
        "general_health": 0.0      # Maintain with balanced macros
    }
    
    def __init__(self):
        print("NutritionGoalsAgent initialized")
    
    def calculate_bmr(self, profile: UserPhysicalProfile) -> float:
        """
        Calculate Basal Metabolic Rate using Mifflin-St Jeor equation.
        
        Men: BMR = (10 × weight in kg) + (6.25 × height in cm) - (5 × age) + 5
        Women: BMR = (10 × weight in kg) + (6.25 × height in cm) - (5 × age) - 161
        """
        base = (10 * profile.weight_kg) + (6.25 * profile.height_cm) - (5 * profile.age)
        
        if profile.sex.lower() in ['male', 'm']:
            return base + 5
        else:
            return base - 161
    
    def calculate_tdee(self, bmr: float, activity_level: str) -> float:
        """Calculate Total Daily Energy Expenditure"""
        multiplier = self.ACTIVITY_MULTIPLIERS.get(activity_level.lower(), 1.55)
        return bmr * multiplier
    
    def adjust_for_goal(self, tdee: float, health_goal: str) -> int:
        """Adjust calories based on health goal"""
        adjustment = self.GOAL_CALORIE_ADJUSTMENTS.get(health_goal.lower(), 0.0)
        adjusted = tdee * (1 + adjustment)
        
        # Ensure minimum safe calorie intake
        min_calories = 1200 if health_goal in ['weight_loss', 'aggressive_loss'] else 1500
        return max(int(adjusted), min_calories)
    
    def calculate_macros(self, calorie_goal: int, profile: UserPhysicalProfile) -> Dict[str, int]:
        """
        Calculate macro targets based on calories, goal, and diet style.
        
        Protein: Based on body weight and goal
        - Weight loss: 1.6-2.0 g/kg (higher to preserve muscle)
        - Muscle gain: 1.8-2.2 g/kg
        - Maintain/General: 1.2-1.6 g/kg
        
        Fat: 25-35% of calories (9 cal/g)
        Carbs: Remainder of calories (4 cal/g)
        """
        weight = profile.weight_kg
        goal = profile.health_goal.lower()
        diet = profile.diet_style.lower()
        
        # Calculate protein based on goal and weight
        if goal in ['muscle_gain', 'lean_gain']:
            protein_per_kg = 2.0
        elif goal in ['weight_loss', 'aggressive_loss']:
            protein_per_kg = 1.8  # Higher protein for muscle preservation
        else:
            protein_per_kg = 1.4
        
        # Adjust for high-protein diet
        if diet == 'high-protein':
            protein_per_kg = max(protein_per_kg, 2.0)
        
        protein_g = int(weight * protein_per_kg)
        protein_calories = protein_g * 4
        
        # Calculate fat based on diet style
        remaining_calories = calorie_goal - protein_calories
        
        if diet == 'keto':
            # Keto: 70-75% fat, very low carb
            fat_percent = 0.70
            fat_calories = calorie_goal * fat_percent
            fat_g = int(fat_calories / 9)
            carbs_g = max(20, int((calorie_goal - protein_calories - fat_calories) / 4))
        elif diet == 'low-carb':
            # Low carb: 40% fat, limited carbs
            fat_percent = 0.35
            fat_calories = calorie_goal * fat_percent
            fat_g = int(fat_calories / 9)
            carbs_g = int((calorie_goal - protein_calories - fat_calories) / 4)
        else:
            # Balanced: 25-30% fat
            fat_percent = 0.28
            fat_calories = calorie_goal * fat_percent
            fat_g = int(fat_calories / 9)
            carbs_g = int((calorie_goal - protein_calories - fat_calories) / 4)
        
        # Ensure minimums
        fat_g = max(fat_g, 40)  # Minimum fat for hormone health
        carbs_g = max(carbs_g, 50)  # Minimum carbs for brain function (except keto)
        
        return {
            "protein_g": protein_g,
            "carbs_g": carbs_g,
            "fat_g": fat_g
        }
    
    def calculate_fiber(self, calorie_goal: int, profile: UserPhysicalProfile) -> int:
        """
        Calculate fiber goal: ~14g per 1000 calories, with minimums.
        Men: 30-38g, Women: 21-25g
        """
        base_fiber = (calorie_goal / 1000) * 14
        
        if profile.sex.lower() in ['male', 'm']:
            return max(int(base_fiber), 30)
        else:
            return max(int(base_fiber), 25)
    
    def calculate_water(self, profile: UserPhysicalProfile) -> int:
        """
        Calculate water goal based on weight and activity.
        Base: 30-35ml per kg body weight
        """
        base_ml = profile.weight_kg * 33
        
        # Adjust for activity level
        activity_adjustments = {
            "sedentary": 1.0,
            "light": 1.1,
            "moderate": 1.2,
            "active": 1.3,
            "very_active": 1.4
        }
        multiplier = activity_adjustments.get(profile.activity_level.lower(), 1.2)
        
        return int(base_ml * multiplier)
    
    def calculate_goals(self, profile: UserPhysicalProfile) -> NutritionGoals:
        """
        Main method to calculate all nutrition goals for a user.
        
        Args:
            profile: User's physical profile with age, sex, weight, height, activity, goals
            
        Returns:
            NutritionGoals with all calculated daily targets
        """
        print(f"📊 Calculating nutrition goals for: {profile.health_goal}, {profile.activity_level} activity")
        
        # Step 1: Calculate BMR
        bmr = self.calculate_bmr(profile)
        print(f"   BMR: {int(bmr)} calories")
        
        # Step 2: Calculate TDEE
        tdee = self.calculate_tdee(bmr, profile.activity_level)
        print(f"   TDEE: {int(tdee)} calories")
        
        # Step 3: Adjust for goal
        calorie_goal = self.adjust_for_goal(tdee, profile.health_goal)
        print(f"   Calorie Goal (adjusted for {profile.health_goal}): {calorie_goal}")
        
        # Step 4: Calculate macros
        macros = self.calculate_macros(calorie_goal, profile)
        
        # Step 5: Calculate fiber
        fiber_goal = self.calculate_fiber(calorie_goal, profile)
        
        # Step 6: Calculate water
        water_goal = self.calculate_water(profile)
        
        # Build notes
        notes = []
        if profile.health_goal == 'weight_loss':
            notes.append("20% calorie deficit for sustainable weight loss (~0.5kg/week)")
        elif profile.health_goal == 'muscle_gain':
            notes.append("15% calorie surplus for muscle building")
        if profile.diet_style == 'keto':
            notes.append("Keto diet: High fat, very low carb (<50g)")
        
        return NutritionGoals(
            calorie_goal=calorie_goal,
            protein_goal_g=macros["protein_g"],
            carbs_goal_g=macros["carbs_g"],
            fat_goal_g=macros["fat_g"],
            fiber_goal_g=fiber_goal,
            water_goal_ml=water_goal,
            calculation_method="mifflin_st_jeor",
            notes="; ".join(notes) if notes else "Balanced nutrition based on your profile"
        )
    
    def calculate_from_dict(self, profile_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Convenience method to calculate goals from a dictionary.
        Useful for API endpoints.
        """
        profile = UserPhysicalProfile(
            age=profile_data.get('age', 30),
            sex=profile_data.get('sex', 'female'),
            weight_kg=profile_data.get('weight_kg', profile_data.get('weight', 70)),
            height_cm=profile_data.get('height_cm', profile_data.get('height', 165)),
            activity_level=profile_data.get('activity_level', 'moderate'),
            health_goal=profile_data.get('health_goal', profile_data.get('goal', 'maintain')),
            diet_style=profile_data.get('diet_style', 'balanced')
        )
        
        goals = self.calculate_goals(profile)
        return goals.model_dump()


# Singleton instance for easy import
nutrition_goals_agent = NutritionGoalsAgent()


def calculate_nutrition_goals(profile_data: Dict[str, Any]) -> Dict[str, Any]:
    """Convenience function to calculate nutrition goals from profile data"""
    return nutrition_goals_agent.calculate_from_dict(profile_data)
