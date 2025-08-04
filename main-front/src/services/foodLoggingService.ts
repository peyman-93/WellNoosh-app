/**
 * Food Logging Service
 * Handles all food logging operations with the scalable partitioned database system
 */

import { supabase } from './supabase'
import type {
  FoodLogEntry,
  CreateFoodLogEntry,
  UpdateFoodLogEntry,
  DailyNutritionSummary,
  DailyFoodLog,
  FoodLogQueryParams,
  FoodLogQueryResponse,
  CreateDailyMealPlan,
  QuickAddFood,
  WeeklyNutritionTrends,
  FoodLogServiceResponse,
  MealCardData,
  NutritionWheelData,
  FoodCategoryData,
  MealType,
} from '../types/food-logging.types'

// ================================================================================================
// FOOD LOG ENTRY OPERATIONS
// ================================================================================================

/**
 * Create a new food log entry
 */
export const createFoodLogEntry = async (
  entry: CreateFoodLogEntry
): Promise<FoodLogServiceResponse<FoodLogEntry>> => {
  try {
    const { data, error } = await supabase
      .from('user_food_logs')
      .insert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        entry_type: entry.entry_type,
        meal_type: entry.meal_type,
        food_name: entry.food_name,
        meal_plan_recipe_id: entry.meal_plan_recipe_id,
        recipe_id: entry.recipe_id,
        calories: entry.calories,
        protein_g: entry.protein_g || 0,
        carbs_g: entry.carbs_g || 0,
        fat_g: entry.fat_g || 0,
        fiber_g: entry.fiber_g || 0,
        sugar_g: entry.sugar_g || 0,
        sodium_mg: entry.sodium_mg || 0,
        planned_serving_size: entry.planned_serving_size || 1,
        actual_serving_size: entry.actual_serving_size,
        food_category: entry.food_category,
        preparation_method: entry.preparation_method,
        brand_name: entry.brand_name,
        barcode: entry.barcode,
        notes: entry.notes,
        photo_url: entry.photo_url,
        confidence_score: entry.confidence_score || 1.0
      })
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }
  }
}

/**
 * Update an existing food log entry
 */
export const updateFoodLogEntry = async (
  entryId: number,
  updates: UpdateFoodLogEntry
): Promise<FoodLogServiceResponse<FoodLogEntry>> => {
  try {
    const { data, error } = await supabase
      .from('user_food_logs')
      .update(updates)
      .eq('id', entryId)
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }
  }
}

/**
 * Mark a planned meal as completed
 */
export const completeMeal = async (
  entryId: number,
  actualServingSize?: number
): Promise<FoodLogServiceResponse<FoodLogEntry>> => {
  try {
    const updates: UpdateFoodLogEntry = {
      is_completed: true,
      actual_serving_size: actualServingSize
    }

    // If actual serving size is different, recalculate nutrition
    if (actualServingSize && actualServingSize !== 1) {
      // Get the original entry to recalculate nutrition
      const { data: originalEntry } = await supabase
        .from('user_food_logs')
        .select('*')
        .eq('id', entryId)
        .single()

      if (originalEntry) {
        updates.calories = Math.round(originalEntry.calories * actualServingSize)
        updates.protein_g = originalEntry.protein_g * actualServingSize
        updates.carbs_g = originalEntry.carbs_g * actualServingSize
        updates.fat_g = originalEntry.fat_g * actualServingSize
        updates.fiber_g = originalEntry.fiber_g * actualServingSize
        updates.sugar_g = originalEntry.sugar_g * actualServingSize
        updates.sodium_mg = Math.round(originalEntry.sodium_mg * actualServingSize)
      }
    }

    return updateFoodLogEntry(entryId, updates)
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }
  }
}

/**
 * Delete a food log entry
 */
export const deleteFoodLogEntry = async (
  entryId: number
): Promise<FoodLogServiceResponse<void>> => {
  try {
    const { error } = await supabase
      .from('user_food_logs')
      .delete()
      .eq('id', entryId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }
  }
}

// ================================================================================================
// QUERY OPERATIONS
// ================================================================================================

/**
 * Get food log entries with filtering and pagination
 */
export const getFoodLogEntries = async (
  params: FoodLogQueryParams = {}
): Promise<FoodLogServiceResponse<FoodLogQueryResponse>> => {
  try {
    const user = await supabase.auth.getUser()
    const userId = params.user_id || user.data.user?.id

    if (!userId) {
      return { success: false, error: 'User not authenticated' }
    }

    let query = supabase
      .from('user_food_logs')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('logged_at', { ascending: false })

    // Apply filters
    if (params.start_date) {
      query = query.gte('log_date', params.start_date)
    }
    if (params.end_date) {
      query = query.lte('log_date', params.end_date)
    }
    if (params.entry_type) {
      query = query.eq('entry_type', params.entry_type)
    }
    if (params.meal_type) {
      query = query.eq('meal_type', params.meal_type)
    }
    if (params.food_category) {
      query = query.eq('food_category', params.food_category)
    }
    if (params.is_completed !== undefined) {
      query = query.eq('is_completed', params.is_completed)
    }

    // Apply pagination
    if (params.limit) {
      query = query.limit(params.limit)
    }
    if (params.offset) {
      query = query.range(params.offset, params.offset + (params.limit || 50) - 1)
    }

    const { data, error, count } = await query

    if (error) {
      return { success: false, error: error.message }
    }

    const result: FoodLogQueryResponse = {
      data: data || [],
      total_count: count || 0,
      has_more: params.limit ? (count || 0) > (params.offset || 0) + (params.limit || 0) : false
    }

    return { success: true, data: result }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }
  }
}

/**
 * Get daily food log (summary + detailed entries)
 */
export const getDailyFoodLog = async (
  date: string = new Date().toISOString().split('T')[0]
): Promise<FoodLogServiceResponse<DailyFoodLog>> => {
  try {
    const user = await supabase.auth.getUser()
    const userId = user.data.user?.id

    if (!userId) {
      return { success: false, error: 'User not authenticated' }
    }

    // Use the optimized database function
    const { data, error } = await supabase
      .rpc('get_user_daily_food_log', {
        target_user_id: userId,
        target_date: date
      })

    if (error) {
      return { success: false, error: error.message }
    }

    if (!data || data.length === 0) {
      // Return empty structure if no data found
      const emptyLog: DailyFoodLog = {
        summary: {
          user_id: userId,
          log_date: date,
          planned_calories: 0,
          planned_protein_g: 0,
          planned_carbs_g: 0,
          planned_fat_g: 0,
          planned_fiber_g: 0,
          planned_sugar_g: 0,
          planned_sodium_mg: 0,
          planned_meals_count: 0,
          completed_meals_count: 0,
          additional_calories: 0,
          additional_protein_g: 0,
          additional_carbs_g: 0,
          additional_fat_g: 0,
          additional_fiber_g: 0,
          additional_sugar_g: 0,
          additional_sodium_mg: 0,
          additional_entries_count: 0,
          total_calories: 0,
          total_protein_g: 0,
          total_carbs_g: 0,
          total_fat_g: 0,
          total_fiber_g: 0,
          total_sugar_g: 0,
          total_sodium_mg: 0,
          total_entries_count: 0,
          completion_percentage: 0,
          whole_foods_percentage: 0,
          meal_plan_adherence_percentage: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        planned_meals: [],
        additional_food: []
      }
      return { success: true, data: emptyLog }
    }

    const result = data[0]
    const dailyLog: DailyFoodLog = {
      summary: result.summary,
      planned_meals: result.planned_meals || [],
      additional_food: result.additional_food || []
    }

    return { success: true, data: dailyLog }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }
  }
}

/**
 * Get daily nutrition summary only (fast dashboard query)
 */
export const getDailyNutritionSummary = async (
  date: string = new Date().toISOString().split('T')[0]
): Promise<FoodLogServiceResponse<DailyNutritionSummary>> => {
  try {
    const user = await supabase.auth.getUser()
    const userId = user.data.user?.id

    if (!userId) {
      return { success: false, error: 'User not authenticated' }
    }

    const { data, error } = await supabase
      .from('daily_nutrition_summary')
      .select('*')
      .eq('user_id', userId)
      .eq('log_date', date)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      return { success: false, error: error.message }
    }

    if (!data) {
      // Create empty summary if none exists
      const emptySummary: DailyNutritionSummary = {
        user_id: userId,
        log_date: date,
        planned_calories: 0,
        planned_protein_g: 0,
        planned_carbs_g: 0,
        planned_fat_g: 0,
        planned_fiber_g: 0,
        planned_sugar_g: 0,
        planned_sodium_mg: 0,
        planned_meals_count: 0,
        completed_meals_count: 0,
        additional_calories: 0,
        additional_protein_g: 0,
        additional_carbs_g: 0,
        additional_fat_g: 0,
        additional_fiber_g: 0,
        additional_sugar_g: 0,
        additional_sodium_mg: 0,
        additional_entries_count: 0,
        total_calories: 0,
        total_protein_g: 0,
        total_carbs_g: 0,
        total_fat_g: 0,
        total_fiber_g: 0,
        total_sugar_g: 0,
        total_sodium_mg: 0,
        total_entries_count: 0,
        completion_percentage: 0,
        whole_foods_percentage: 0,
        meal_plan_adherence_percentage: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      return { success: true, data: emptySummary }
    }

    return { success: true, data }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }
  }
}

// ================================================================================================
// DASHBOARD UTILITIES
// ================================================================================================

/**
 * Convert food log entries to meal cards for dashboard display
 */
export const convertToMealCards = (
  foodEntries: FoodLogEntry[],
  plannedMeals: FoodLogEntry[] = []
): MealCardData[] => {
  const mealCards: MealCardData[] = []

  // Helper function to format time
  const formatTime = (isoString: string): string => {
    const date = new Date(isoString)
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
  }

  // Helper function to get meal icon
  const getMealIcon = (mealType: MealType): string => {
    const icons = {
      breakfast: '🍳',
      lunch: '🥪',
      dinner: '🍽️',
      snack: '🍎',
      brunch: '🥐',
      other: '🍴'
    }
    return icons[mealType] || '🍴'
  }

  // Process planned meals
  plannedMeals.forEach(entry => {
    mealCards.push({
      id: `planned_${entry.id}`,
      time: formatTime(entry.logged_at),
      title: entry.food_name,
      icon: getMealIcon(entry.meal_type),
      completed: entry.is_completed,
      calories: entry.is_completed ? entry.calories : undefined,
      meal_type: entry.meal_type,
      food_log_entry: entry
    })
  })

  // Process additional food entries
  foodEntries.filter(entry => entry.entry_type === 'additional_food').forEach(entry => {
    mealCards.push({
      id: `additional_${entry.id}`,
      time: formatTime(entry.logged_at),
      title: entry.food_name,
      icon: getMealIcon(entry.meal_type),
      completed: true, // Additional food is always "completed"
      calories: entry.calories,
      meal_type: entry.meal_type,
      food_log_entry: entry
    })
  })

  // Sort by meal type order and time
  const mealOrder = { breakfast: 1, brunch: 2, lunch: 3, snack: 4, dinner: 5, other: 6 }
  return mealCards.sort((a, b) => {
    const orderA = mealOrder[a.meal_type] || 6
    const orderB = mealOrder[b.meal_type] || 6
    if (orderA !== orderB) return orderA - orderB
    return a.time.localeCompare(b.time)
  })
}

/**
 * Convert daily nutrition summary to nutrition wheel data
 */
export const convertToNutritionWheels = (
  summary: DailyNutritionSummary,
  userGoals?: { calories?: number; protein?: number; carbs?: number; fat?: number; fiber?: number }
): NutritionWheelData => {
  return {
    calories: {
      completed: summary.total_calories,
      goal: userGoals?.calories || summary.calorie_goal || 2000,
      unit: ''
    },
    protein: {
      completed: Math.round(summary.total_protein_g),
      goal: userGoals?.protein || 60,
      unit: 'g'
    },
    carbs: {
      completed: Math.round(summary.total_carbs_g),
      goal: userGoals?.carbs || 250,
      unit: 'g'
    },
    fat: {
      completed: Math.round(summary.total_fat_g),
      goal: userGoals?.fat || 65,
      unit: 'g'
    },
    fiber: {
      completed: Math.round(summary.total_fiber_g),
      goal: userGoals?.fiber || 25,
      unit: 'g'
    },
    sugar: {
      completed: Math.round(summary.total_sugar_g),
      goal: 50,
      unit: 'g'
    },
    sodium: {
      completed: Math.round(summary.total_sodium_mg),
      goal: 2300,
      unit: 'mg'
    },
    water: {
      completed: 5, // This would come from a separate water tracking system
      goal: 8,
      unit: ' cups'
    }
  }
}

// ================================================================================================
// QUICK ADD OPERATIONS
// ================================================================================================

/**
 * Quick add food with simplified input
 */
export const quickAddFood = async (
  food: QuickAddFood
): Promise<FoodLogServiceResponse<FoodLogEntry>> => {
  const foodEntry: CreateFoodLogEntry = {
    entry_type: 'additional_food',
    meal_type: food.meal_type,
    food_name: food.food_name,
    calories: food.calories,
    photo_url: food.photo_url,
    notes: food.serving_description,
    confidence_score: 1.0 // Manual entry
  }

  return createFoodLogEntry(foodEntry)
}

// ================================================================================================
// MEAL PLAN INTEGRATION
// ================================================================================================

/**
 * Create daily meal plan entries from a meal plan
 */
export const createDailyMealPlanEntries = async (
  mealPlan: CreateDailyMealPlan
): Promise<FoodLogServiceResponse<FoodLogEntry[]>> => {
  try {
    const entries: CreateFoodLogEntry[] = []

    // Get recipe details for each meal plan recipe
    for (const mealPlanRecipe of mealPlan.meal_plan_recipes) {
      const { data: recipeData } = await supabase
        .from('meal_plan_recipes')
        .select(`
          *,
          recipes (
            name,
            calories_per_serving,
            protein_g,
            carbs_g,
            fat_g,
            fiber_g,
            sugar_g,
            sodium_mg
          )
        `)
        .eq('id', mealPlanRecipe.meal_plan_recipe_id)
        .single()

      if (recipeData?.recipes) {
        const recipe = recipeData.recipes
        entries.push({
          entry_type: 'planned_meal',
          meal_type: mealPlanRecipe.meal_type,
          food_name: recipe.name,
          meal_plan_recipe_id: mealPlanRecipe.meal_plan_recipe_id,
          recipe_id: recipeData.recipe_id,
          calories: recipe.calories_per_serving || 0,
          protein_g: recipe.protein_g || 0,
          carbs_g: recipe.carbs_g || 0,
          fat_g: recipe.fat_g || 0,
          fiber_g: recipe.fiber_g || 0,
          sugar_g: recipe.sugar_g || 0,
          sodium_mg: recipe.sodium_mg || 0,
          planned_serving_size: recipeData.servings || 1
        })
      }
    }

    // Create all entries
    const results: FoodLogEntry[] = []
    for (const entry of entries) {
      const result = await createFoodLogEntry(entry)
      if (result.success && result.data) {
        results.push(result.data)
      }
    }

    return { success: true, data: results }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }
  }
}

// ================================================================================================
// FOOD CATEGORIES
// ================================================================================================

/**
 * Get all food categories
 */
export const getFoodCategories = async (): Promise<FoodLogServiceResponse<FoodCategoryData[]>> => {
  try {
    const { data, error } = await supabase
      .from('food_categories')
      .select('*')
      .order('name')

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }
  }
}

// ================================================================================================
// ANALYTICS AND TRENDS
// ================================================================================================

/**
 * Get weekly nutrition trends
 */
export const getWeeklyNutritionTrends = async (
  weekStartDate: string
): Promise<FoodLogServiceResponse<WeeklyNutritionTrends>> => {
  try {
    const user = await supabase.auth.getUser()
    const userId = user.data.user?.id

    if (!userId) {
      return { success: false, error: 'User not authenticated' }
    }

    const weekEndDate = new Date(weekStartDate)
    weekEndDate.setDate(weekEndDate.getDate() + 6)

    const { data, error } = await supabase
      .from('daily_nutrition_summary')
      .select('*')
      .eq('user_id', userId)
      .gte('log_date', weekStartDate)
      .lte('log_date', weekEndDate.toISOString().split('T')[0])
      .order('log_date')

    if (error) {
      return { success: false, error: error.message }
    }

    const dailySummaries = (data || []).map(summary => ({
      log_date: summary.log_date,
      total_calories: summary.total_calories,
      calorie_goal: summary.calorie_goal || 2000,
      completion_percentage: summary.completion_percentage,
      planned_meals_count: summary.planned_meals_count,
      completed_meals_count: summary.completed_meals_count,
      additional_entries_count: summary.additional_entries_count,
      total_protein_g: summary.total_protein_g,
      total_carbs_g: summary.total_carbs_g,
      total_fat_g: summary.total_fat_g,
      total_fiber_g: summary.total_fiber_g
    }))

    // Calculate weekly averages
    const weeklyAverages = {
      avg_calories: Math.round(dailySummaries.reduce((sum, day) => sum + day.total_calories, 0) / 7),
      avg_protein_g: Math.round(dailySummaries.reduce((sum, day) => sum + day.total_protein_g, 0) / 7),
      avg_completion_percentage: Math.round(dailySummaries.reduce((sum, day) => sum + day.completion_percentage, 0) / 7),
      avg_meal_plan_adherence: 0 // Would need additional calculation
    }

    // Simple trend analysis
    const firstHalf = dailySummaries.slice(0, 3)
    const secondHalf = dailySummaries.slice(4, 7)
    const firstHalfAvgCalories = firstHalf.reduce((sum, day) => sum + day.total_calories, 0) / 3
    const secondHalfAvgCalories = secondHalf.reduce((sum, day) => sum + day.total_calories, 0) / 3
    
    const trends = {
      calorie_trend: Math.abs(secondHalfAvgCalories - firstHalfAvgCalories) < 50 
        ? 'stable' as const
        : secondHalfAvgCalories > firstHalfAvgCalories 
          ? 'increasing' as const 
          : 'decreasing' as const,
      completion_trend: 'stable' as const // Simplified for now
    }

    const result: WeeklyNutritionTrends = {
      week_start_date: weekStartDate,
      daily_summaries: dailySummaries,
      weekly_averages,
      trends
    }

    return { success: true, data: result }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }
  }
}

// ================================================================================================
// EXPORT SERVICE
// ================================================================================================

export const foodLoggingService = {
  // Entry operations
  createFoodLogEntry,
  updateFoodLogEntry,
  completeMeal,
  deleteFoodLogEntry,
  
  // Query operations
  getFoodLogEntries,
  getDailyFoodLog,
  getDailyNutritionSummary,
  
  // Dashboard utilities
  convertToMealCards,
  convertToNutritionWheels,
  
  // Quick operations
  quickAddFood,
  
  // Meal plan integration
  createDailyMealPlanEntries,
  
  // Categories
  getFoodCategories,
  
  // Analytics
  getWeeklyNutritionTrends
}

export default foodLoggingService