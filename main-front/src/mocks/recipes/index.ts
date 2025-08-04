// Recipe Mock Data Export
import { Recipe, Ingredient } from '../../types/recipe.types'
import { mockIngredients } from './ingredients'
import { breakfastRecipes } from './breakfast'
import { lunchRecipes } from './lunch'
import { dinnerRecipes } from './dinner'
import { snackRecipes } from './snacks'

// Export individual recipe categories
export { breakfastRecipes } from './breakfast'
export { lunchRecipes } from './lunch'
export { dinnerRecipes } from './dinner'
export { snackRecipes } from './snacks'
export { mockIngredients } from './ingredients'

// Combine all recipes into one array
export const allRecipes: Recipe[] = [
  ...breakfastRecipes,
  ...lunchRecipes,
  ...dinnerRecipes,
  ...snackRecipes
]

// Export by meal type for easy filtering
export const recipesByMealType = {
  Breakfast: breakfastRecipes,
  Lunch: lunchRecipes,
  Dinner: dinnerRecipes,
  Snack: snackRecipes
}

// Export by difficulty level
export const recipesByDifficulty = {
  Easy: allRecipes.filter(recipe => recipe.difficulty === 'Easy'),
  Medium: allRecipes.filter(recipe => recipe.difficulty === 'Medium'),
  Hard: allRecipes.filter(recipe => recipe.difficulty === 'Hard')
}

// Export by diet categories
export const recipesByDiet = {
  Vegetarian: allRecipes.filter(recipe => 
    recipe.dietCategories?.includes('Vegetarian')
  ),
  Vegan: allRecipes.filter(recipe => 
    recipe.dietCategories?.includes('Vegan') || 
    recipe.dietCategories?.includes('Vegan-Adaptable')
  ),
  'Gluten-Free': allRecipes.filter(recipe => 
    recipe.dietCategories?.includes('Gluten-Free')
  ),
  'High-Protein': allRecipes.filter(recipe => 
    recipe.dietCategories?.includes('High-Protein')
  ),
  'Low-Carb': allRecipes.filter(recipe => 
    recipe.dietCategories?.includes('Low-Carb') ||
    recipe.dietCategories?.includes('Keto-Friendly')
  )
}

// Export featured recipes (high rating or marked as featured)
export const featuredRecipes = allRecipes
  .filter(recipe => recipe.rating && recipe.rating >= 4.7)
  .slice(0, 10)

// Export quick recipes (30 minutes or less)
export const quickRecipes = allRecipes
  .filter(recipe => recipe.totalTimeMinutes <= 30)

// Recipe statistics
export const recipeStats = {
  total: allRecipes.length,
  byMealType: {
    breakfast: breakfastRecipes.length,
    lunch: lunchRecipes.length,
    dinner: dinnerRecipes.length,
    snack: snackRecipes.length
  },
  byDifficulty: {
    easy: recipesByDifficulty.Easy.length,
    medium: recipesByDifficulty.Medium.length,
    hard: recipesByDifficulty.Hard.length
  },
  averageRating: Number((
    allRecipes.reduce((sum, recipe) => sum + (recipe.rating || 0), 0) / allRecipes.length
  ).toFixed(1)),
  averagePrepTime: Math.round(
    allRecipes.reduce((sum, recipe) => sum + recipe.prepTimeMinutes, 0) / allRecipes.length
  ),
  averageCookTime: Math.round(
    allRecipes.reduce((sum, recipe) => sum + recipe.cookTimeMinutes, 0) / allRecipes.length
  )
}

// Ingredient statistics
export const ingredientStats = {
  total: mockIngredients.length,
  byCategory: mockIngredients.reduce((acc, ingredient) => {
    acc[ingredient.category] = (acc[ingredient.category] || 0) + 1
    return acc
  }, {} as Record<string, number>),
  vegetarianCount: mockIngredients.filter(ing => ing.isVegetarian).length,
  veganCount: mockIngredients.filter(ing => ing.isVegan).length,
  glutenFreeCount: mockIngredients.filter(ing => ing.isGlutenFree).length,
  dairyFreeCount: mockIngredients.filter(ing => ing.isDairyFree).length
}

// Helper functions for recipe filtering and searching
export const searchRecipes = (query: string): Recipe[] => {
  const searchTerm = query.toLowerCase()
  return allRecipes.filter(recipe => 
    recipe.name.toLowerCase().includes(searchTerm) ||
    recipe.description?.toLowerCase().includes(searchTerm) ||
    recipe.tags?.some(tag => tag.toLowerCase().includes(searchTerm)) ||
    recipe.cuisineType?.toLowerCase().includes(searchTerm)
  )
}

export const getRecipeById = (id: string): Recipe | undefined => {
  return allRecipes.find(recipe => recipe.id === id)
}

export const getRecipesByIds = (ids: string[]): Recipe[] => {
  return allRecipes.filter(recipe => ids.includes(recipe.id))
}

export const getIngredientById = (id: string): Ingredient | undefined => {
  return mockIngredients.find(ingredient => ingredient.id === id)
}

export const getRandomRecipes = (count: number, mealType?: string): Recipe[] => {
  const recipes = mealType 
    ? allRecipes.filter(recipe => recipe.mealType === mealType)
    : allRecipes
  
  const shuffled = [...recipes].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

// Sample meal plan data
export const sampleMealPlan = {
  id: 'meal-plan-001',
  name: 'Healthy Week Plan',
  description: 'A balanced 7-day meal plan with variety and nutrition',
  startDate: new Date(),
  endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  recipes: [
    {
      recipeId: 'recipe-breakfast-001',
      scheduledDate: new Date(),
      mealType: 'Breakfast' as const,
      servings: 2,
      isCompleted: false
    },
    {
      recipeId: 'recipe-lunch-001',
      scheduledDate: new Date(),
      mealType: 'Lunch' as const,
      servings: 4,
      isCompleted: false
    },
    {
      recipeId: 'recipe-dinner-001',
      scheduledDate: new Date(),
      mealType: 'Dinner' as const,
      servings: 4,
      isCompleted: false
    }
  ]
}

console.log('🍳 Recipe Mock Data Loaded:', {
  recipes: recipeStats.total,
  ingredients: ingredientStats.total,
  averageRating: recipeStats.averageRating
})