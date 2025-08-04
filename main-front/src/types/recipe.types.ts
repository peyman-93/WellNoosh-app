// Recipe and Meal Planning Type Definitions

export interface NutritionInfo {
  caloriesPerServing: number
  proteinG: number
  carbsG: number
  fatG: number
  fiberG?: number
  sugarG?: number
  sodiumMg?: number
}

export interface Ingredient {
  id: string
  name: string
  category: 'Vegetables' | 'Fruits' | 'Proteins' | 'Dairy' | 'Grains' | 
           'Legumes' | 'Nuts & Seeds' | 'Oils & Fats' | 'Herbs & Spices' | 
           'Condiments' | 'Beverages' | 'Other'
  defaultUnit?: string
  caloriesPer100g?: number
  proteinPer100g?: number
  carbsPer100g?: number
  fatPer100g?: number
  fiberPer100g?: number
  sugarPer100g?: number
  sodiumPer100g?: number
  commonAllergens?: string[]
  isVegetarian?: boolean
  isVegan?: boolean
  isGlutenFree?: boolean
  isDairyFree?: boolean
}

export interface RecipeIngredient {
  id?: string
  ingredientId: string
  name: string
  amount: number
  unit: string
  notes?: string
  ingredientOrder?: number
  isOptional?: boolean
}

export interface Recipe {
  id: string
  name: string
  description?: string
  imageUrl?: string
  prepTimeMinutes: number
  cookTimeMinutes: number
  totalTimeMinutes: number
  servings: number
  difficulty: 'Easy' | 'Medium' | 'Hard'
  cuisineType?: string
  mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack' | 'Dessert'
  dietCategories?: string[]
  allergenInfo?: string[]
  tags?: string[]
  rating?: number
  ratingCount?: number
  nutrition: NutritionInfo
  instructions: string[]
  tips?: string
  videoUrl?: string
  sourceUrl?: string
  isFeatured?: boolean
  isPremium?: boolean
  ingredients: RecipeIngredient[]
  createdAt?: Date
  updatedAt?: Date
}

export interface MealPlan {
  id: string
  userId: string
  name: string
  description?: string
  startDate: Date
  endDate: Date
  totalRecipes?: number
  totalCalories?: number
  averageDailyCalories?: number
  isActive: boolean
  preferences?: any
  recipes?: MealPlanRecipe[]
  createdAt?: Date
  updatedAt?: Date
}

export interface MealPlanRecipe {
  id?: string
  mealPlanId?: string
  recipeId: string
  recipe?: Recipe
  scheduledDate: Date
  mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack' | 'Dessert'
  servings: number
  isCompleted: boolean
  completedAt?: Date
  notes?: string
  createdAt?: Date
  updatedAt?: Date
}

export interface UserFavoriteRecipe {
  id: string
  userId: string
  recipeId: string
  recipe?: Recipe
  notes?: string
  tags?: string[]
  addedAt: Date
}

export interface UserRecipeRating {
  id: string
  userId: string
  recipeId: string
  rating: number // 1-5
  review?: string
  madeCount?: number
  lastMadeDate?: Date
  difficultyRating?: 'Too Easy' | 'Just Right' | 'Too Hard'
  wouldMakeAgain?: boolean
  photos?: string[]
  createdAt: Date
  updatedAt?: Date
}

// Filter interfaces for searching recipes
export interface RecipeFilters {
  mealType?: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack' | 'Dessert'
  cuisineType?: string
  difficulty?: 'Easy' | 'Medium' | 'Hard'
  dietCategories?: string[]
  excludeAllergens?: string[]
  maxPrepTime?: number
  maxCookTime?: number
  maxCalories?: number
  minProtein?: number
  tags?: string[]
  searchQuery?: string
}

// Input types for creating/updating
export interface RecipeInput {
  name: string
  description?: string
  imageUrl?: string
  prepTimeMinutes: number
  cookTimeMinutes: number
  servings: number
  difficulty: 'Easy' | 'Medium' | 'Hard'
  cuisineType?: string
  mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack' | 'Dessert'
  dietCategories?: string[]
  allergenInfo?: string[]
  tags?: string[]
  nutrition: NutritionInfo
  instructions: string[]
  tips?: string
  videoUrl?: string
  sourceUrl?: string
  ingredients: RecipeIngredientInput[]
}

export interface RecipeIngredientInput {
  ingredientId: string
  amount: number
  unit: string
  notes?: string
  ingredientOrder?: number
  isOptional?: boolean
}

export interface MealPlanInput {
  name: string
  description?: string
  startDate: Date
  endDate: Date
  preferences?: any
}

export interface MealPlanRecipeInput {
  recipeId: string
  scheduledDate: Date
  mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack' | 'Dessert'
  servings: number
  notes?: string
}