import { supabase } from './supabase'
import { 
  Recipe, 
  RecipeFilters, 
  MealPlan, 
  MealPlanInput, 
  MealPlanRecipe,
  MealPlanRecipeInput,
  UserFavoriteRecipe,
  UserRecipeRating,
  Ingredient
} from '../types/recipe.types'
import { 
  allRecipes, 
  mockIngredients, 
  getRecipeById as getMockRecipeById,
  searchRecipes as searchMockRecipes
} from '../mocks/recipes'

// Configuration for development vs production
const USE_MOCK_DATA = process.env.NODE_ENV === 'development' || !process.env.EXPO_PUBLIC_API_URL

class RecipeService {
  // Recipe CRUD Operations
  
  async getRecipes(filters?: RecipeFilters): Promise<Recipe[]> {
    if (USE_MOCK_DATA) {
      return this.getMockRecipes(filters)
    }

    try {
      let query = supabase
        .from('recipes')
        .select(`
          *,
          recipe_ingredients (
            amount,
            unit,
            notes,
            ingredient_order,
            is_optional,
            ingredients (
              id,
              name,
              category,
              default_unit
            )
          )
        `)

      // Apply filters
      if (filters?.mealType) {
        query = query.eq('meal_type', filters.mealType)
      }
      if (filters?.cuisineType) {
        query = query.eq('cuisine_type', filters.cuisineType)
      }
      if (filters?.difficulty) {
        query = query.eq('difficulty', filters.difficulty)
      }
      if (filters?.maxPrepTime) {
        query = query.lte('prep_time_minutes', filters.maxPrepTime)
      }
      if (filters?.maxCookTime) {
        query = query.lte('cook_time_minutes', filters.maxCookTime)
      }
      if (filters?.maxCalories) {
        query = query.lte('calories_per_serving', filters.maxCalories)
      }
      if (filters?.minProtein) {
        query = query.gte('protein_g', filters.minProtein)
      }
      if (filters?.dietCategories) {
        query = query.overlaps('diet_categories', filters.dietCategories)
      }
      if (filters?.excludeAllergens) {
        query = query.not('allergen_info', 'cs', `{${filters.excludeAllergens.join(',')}}`)
      }
      if (filters?.tags) {
        query = query.overlaps('tags', filters.tags)
      }

      const { data, error } = await query.order('rating', { ascending: false })

      if (error) throw error
      return this.transformRecipeData(data || [])
    } catch (error) {
      console.error('Error fetching recipes:', error)
      return this.getMockRecipes(filters)
    }
  }

  async getRecipeById(id: string): Promise<Recipe | null> {
    if (USE_MOCK_DATA) {
      return getMockRecipeById(id) || null
    }

    try {
      const { data, error } = await supabase
        .from('recipes')
        .select(`
          *,
          recipe_ingredients (
            amount,
            unit,
            notes,
            ingredient_order,
            is_optional,
            ingredients (
              id,
              name,
              category,
              default_unit
            )
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return this.transformSingleRecipe(data)
    } catch (error) {
      console.error('Error fetching recipe:', error)
      return getMockRecipeById(id) || null
    }
  }

  async searchRecipes(query: string, filters?: RecipeFilters): Promise<Recipe[]> {
    if (USE_MOCK_DATA) {
      let results = searchMockRecipes(query)
      if (filters) {
        results = this.applyFiltersToMockData(results, filters)
      }
      return results
    }

    try {
      let supabaseQuery = supabase
        .from('recipes')
        .select(`
          *,
          recipe_ingredients (
            amount,
            unit,
            notes,
            ingredient_order,
            is_optional,
            ingredients (
              id,
              name,
              category,
              default_unit
            )
          )
        `)
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)

      // Apply additional filters if provided
      if (filters?.mealType) {
        supabaseQuery = supabaseQuery.eq('meal_type', filters.mealType)
      }
      if (filters?.cuisineType) {
        supabaseQuery = supabaseQuery.eq('cuisine_type', filters.cuisineType)
      }

      const { data, error } = await supabaseQuery.order('rating', { ascending: false })

      if (error) throw error
      return this.transformRecipeData(data || [])
    } catch (error) {
      console.error('Error searching recipes:', error)
      return searchMockRecipes(query)
    }
  }

  async getFeaturedRecipes(limit: number = 10): Promise<Recipe[]> {
    if (USE_MOCK_DATA) {
      return allRecipes
        .filter(recipe => recipe.rating && recipe.rating >= 4.7)
        .slice(0, limit)
    }

    try {
      const { data, error } = await supabase
        .from('recipes')
        .select(`
          *,
          recipe_ingredients (
            amount,
            unit,
            notes,
            ingredient_order,
            is_optional,
            ingredients (
              id,
              name,
              category,
              default_unit
            )
          )
        `)
        .or('is_featured.eq.true,rating.gte.4.7')
        .order('rating', { ascending: false })
        .limit(limit)

      if (error) throw error
      return this.transformRecipeData(data || [])
    } catch (error) {
      console.error('Error fetching featured recipes:', error)
      return allRecipes.slice(0, limit)
    }
  }

  // User Favorites
  
  async getUserFavoriteRecipes(userId: string): Promise<Recipe[]> {
    if (USE_MOCK_DATA) {
      // Return a sample of recipes as favorites for testing
      return allRecipes.slice(0, 5)
    }

    try {
      const { data, error } = await supabase
        .from('user_favorite_recipes')
        .select(`
          recipe_id,
          notes,
          tags,
          added_at,
          recipes (
            *,
            recipe_ingredients (
              amount,
              unit,
              notes,
              ingredient_order,
              is_optional,
              ingredients (
                id,
                name,
                category,
                default_unit
              )
            )
          )
        `)
        .eq('user_id', userId)
        .order('added_at', { ascending: false })

      if (error) throw error
      
      return data?.map(item => this.transformSingleRecipe(item.recipes)) || []
    } catch (error) {
      console.error('Error fetching user favorites:', error)
      return []
    }
  }

  async addToFavorites(userId: string, recipeId: string, notes?: string): Promise<void> {
    if (USE_MOCK_DATA) {
      console.log('Mock: Added recipe to favorites:', recipeId)
      return
    }

    try {
      const { error } = await supabase
        .from('user_favorite_recipes')
        .insert({
          user_id: userId,
          recipe_id: recipeId,
          notes: notes || null
        })

      if (error) throw error
    } catch (error) {
      console.error('Error adding to favorites:', error)
      throw error
    }
  }

  async removeFromFavorites(userId: string, recipeId: string): Promise<void> {
    if (USE_MOCK_DATA) {
      console.log('Mock: Removed recipe from favorites:', recipeId)
      return
    }

    try {
      const { error } = await supabase
        .from('user_favorite_recipes')
        .delete()
        .eq('user_id', userId)
        .eq('recipe_id', recipeId)

      if (error) throw error
    } catch (error) {
      console.error('Error removing from favorites:', error)
      throw error
    }
  }

  // Recipe Ratings
  
  async rateRecipe(
    userId: string, 
    recipeId: string, 
    rating: number, 
    review?: string
  ): Promise<void> {
    if (USE_MOCK_DATA) {
      console.log('Mock: Rated recipe:', { recipeId, rating, review })
      return
    }

    try {
      const { error } = await supabase
        .from('user_recipe_ratings')
        .upsert({
          user_id: userId,
          recipe_id: recipeId,
          rating,
          review: review || null,
          updated_at: new Date().toISOString()
        })

      if (error) throw error
    } catch (error) {
      console.error('Error rating recipe:', error)
      throw error
    }
  }

  async getUserRecipeRating(userId: string, recipeId: string): Promise<UserRecipeRating | null> {
    if (USE_MOCK_DATA) {
      return null
    }

    try {
      const { data, error } = await supabase
        .from('user_recipe_ratings')
        .select('*')
        .eq('user_id', userId)
        .eq('recipe_id', recipeId)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return data || null
    } catch (error) {
      console.error('Error fetching user rating:', error)
      return null
    }
  }

  // Meal Planning
  
  async createMealPlan(userId: string, mealPlan: MealPlanInput): Promise<MealPlan> {
    if (USE_MOCK_DATA) {
      const mockPlan: MealPlan = {
        id: `meal-plan-${Date.now()}`,
        userId,
        ...mealPlan,
        totalRecipes: 0,
        totalCalories: 0,
        averageDailyCalories: 0,
        isActive: true,
        recipes: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
      console.log('Mock: Created meal plan:', mockPlan)
      return mockPlan
    }

    try {
      const { data, error } = await supabase
        .from('meal_plans')
        .insert({
          user_id: userId,
          name: mealPlan.name,
          description: mealPlan.description,
          start_date: mealPlan.startDate.toISOString().split('T')[0],
          end_date: mealPlan.endDate.toISOString().split('T')[0],
          preferences: mealPlan.preferences
        })
        .select()
        .single()

      if (error) throw error
      return this.transformMealPlan(data)
    } catch (error) {
      console.error('Error creating meal plan:', error)
      throw error
    }
  }

  async getUserMealPlans(userId: string): Promise<MealPlan[]> {
    if (USE_MOCK_DATA) {
      return [] // Return empty array for mock data
    }

    try {
      const { data, error } = await supabase
        .from('meal_plans')
        .select(`
          *,
          meal_plan_recipes (
            *,
            recipes (
              id,
              name,
              image_url,
              calories_per_serving
            )
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data?.map(plan => this.transformMealPlan(plan)) || []
    } catch (error) {
      console.error('Error fetching meal plans:', error)
      return []
    }
  }

  async addRecipeToMealPlan(
    mealPlanId: string, 
    recipeInput: MealPlanRecipeInput
  ): Promise<void> {
    if (USE_MOCK_DATA) {
      console.log('Mock: Added recipe to meal plan:', { mealPlanId, recipeInput })
      return
    }

    try {
      const { error } = await supabase
        .from('meal_plan_recipes')
        .insert({
          meal_plan_id: mealPlanId,
          recipe_id: recipeInput.recipeId,
          scheduled_date: recipeInput.scheduledDate.toISOString().split('T')[0],
          meal_type: recipeInput.mealType,
          servings: recipeInput.servings,
          notes: recipeInput.notes || null
        })

      if (error) throw error
    } catch (error) {
      console.error('Error adding recipe to meal plan:', error)
      throw error
    }
  }

  // Ingredients
  
  async getIngredients(): Promise<Ingredient[]> {
    if (USE_MOCK_DATA) {
      return mockIngredients
    }

    try {
      const { data, error } = await supabase
        .from('ingredients')
        .select('*')
        .order('category', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching ingredients:', error)
      return mockIngredients
    }
  }

  // Helper methods for mock data
  
  private getMockRecipes(filters?: RecipeFilters): Recipe[] {
    let recipes = [...allRecipes]
    
    if (filters) {
      recipes = this.applyFiltersToMockData(recipes, filters)
    }
    
    return recipes
  }

  private applyFiltersToMockData(recipes: Recipe[], filters: RecipeFilters): Recipe[] {
    return recipes.filter(recipe => {
      if (filters.mealType && recipe.mealType !== filters.mealType) return false
      if (filters.cuisineType && recipe.cuisineType !== filters.cuisineType) return false
      if (filters.difficulty && recipe.difficulty !== filters.difficulty) return false
      if (filters.maxPrepTime && recipe.prepTimeMinutes > filters.maxPrepTime) return false
      if (filters.maxCookTime && recipe.cookTimeMinutes > filters.maxCookTime) return false
      if (filters.maxCalories && recipe.nutrition.caloriesPerServing > filters.maxCalories) return false
      if (filters.minProtein && recipe.nutrition.proteinG < filters.minProtein) return false
      if (filters.dietCategories && !filters.dietCategories.some(cat => 
        recipe.dietCategories?.includes(cat))) return false
      if (filters.excludeAllergens && filters.excludeAllergens.some(allergen => 
        recipe.allergenInfo?.includes(allergen))) return false
      if (filters.tags && !filters.tags.some(tag => 
        recipe.tags?.includes(tag))) return false
      
      return true
    })
  }

  // Transform database data to our types
  
  private transformRecipeData(data: any[]): Recipe[] {
    return data.map(item => this.transformSingleRecipe(item))
  }

  private transformSingleRecipe(data: any): Recipe {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      imageUrl: data.image_url,
      prepTimeMinutes: data.prep_time_minutes,
      cookTimeMinutes: data.cook_time_minutes,
      totalTimeMinutes: data.total_time_minutes,
      servings: data.servings,
      difficulty: data.difficulty,
      cuisineType: data.cuisine_type,
      mealType: data.meal_type,
      dietCategories: data.diet_categories || [],
      allergenInfo: data.allergen_info || [],
      tags: data.tags || [],
      rating: data.rating,
      ratingCount: data.rating_count,
      nutrition: {
        caloriesPerServing: data.calories_per_serving,
        proteinG: data.protein_g,
        carbsG: data.carbs_g,
        fatG: data.fat_g,
        fiberG: data.fiber_g,
        sugarG: data.sugar_g,
        sodiumMg: data.sodium_mg
      },
      instructions: data.instructions || [],
      tips: data.tips,
      videoUrl: data.video_url,
      sourceUrl: data.source_url,
      isFeatured: data.is_featured,
      isPremium: data.is_premium,
      ingredients: data.recipe_ingredients?.map((ri: any) => ({
        ingredientId: ri.ingredients.id,
        name: ri.ingredients.name,
        amount: ri.amount,
        unit: ri.unit,
        notes: ri.notes,
        ingredientOrder: ri.ingredient_order,
        isOptional: ri.is_optional
      })) || [],
      createdAt: data.created_at ? new Date(data.created_at) : undefined,
      updatedAt: data.updated_at ? new Date(data.updated_at) : undefined
    }
  }

  private transformMealPlan(data: any): MealPlan {
    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      description: data.description,
      startDate: new Date(data.start_date),
      endDate: new Date(data.end_date),
      totalRecipes: data.total_recipes,
      totalCalories: data.total_calories,
      averageDailyCalories: data.average_daily_calories,
      isActive: data.is_active,
      preferences: data.preferences,
      recipes: data.meal_plan_recipes?.map((mpr: any) => ({
        id: mpr.id,
        mealPlanId: mpr.meal_plan_id,
        recipeId: mpr.recipe_id,
        recipe: mpr.recipes ? {
          id: mpr.recipes.id,
          name: mpr.recipes.name,
          imageUrl: mpr.recipes.image_url,
          nutrition: {
            caloriesPerServing: mpr.recipes.calories_per_serving
          }
        } : undefined,
        scheduledDate: new Date(mpr.scheduled_date),
        mealType: mpr.meal_type,
        servings: mpr.servings,
        isCompleted: mpr.is_completed,
        completedAt: mpr.completed_at ? new Date(mpr.completed_at) : undefined,
        notes: mpr.notes
      })) || [],
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    }
  }
}

// Export singleton instance
export const recipeService = new RecipeService()
export default recipeService