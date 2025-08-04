// Meal Plan Service - Database operations for meal planning system

import { supabase } from './supabase'
import type { 
  UserMealPlan, 
  PlannedMeal, 
  MealPlanWithMeals,
  CreateMealPlanRequest,
  CreatePlannedMealRequest,
  UpdatePlannedMealRequest,
  CompleteMealRequest,
  DashboardMealPlan,
  MealPlanFilters,
  MealPlanSortOptions
} from '../types/mealPlan'

// ================================================================================================
// MEAL PLAN CRUD OPERATIONS
// ================================================================================================

export const getMealPlan = async (userId: string, date: string): Promise<MealPlanWithMeals | null> => {
  try {
    console.log('🔍 Fetching meal plan for user:', userId, 'date:', date)
    console.log('🗓️ Date type:', typeof date, 'Date string length:', date.length)

    // First try the RPC function
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('get_meal_plan_with_status', {
        target_user_id: userId,
        target_date: date
      })

    if (!rpcError && rpcData && rpcData.length > 0) {
      const result = rpcData[0]
      return {
        mealPlan: result.meal_plan,
        plannedMeals: result.planned_meals || [],
        completionSummary: result.completion_summary
      }
    }

    // If RPC fails or returns no data, try direct query
    console.log('ℹ️ RPC function failed or returned no data, trying direct query')
    console.log('🔍 RPC Error:', rpcError)
    console.log('🔍 RPC Data:', rpcData)

    // Get meal plan
    const { data: mealPlan, error: mealPlanError } = await supabase
      .from('user_meal_plans')
      .select('*')
      .eq('user_id', userId)
      .eq('plan_date', date)
      .single()

    if (mealPlanError || !mealPlan) {
      console.log('ℹ️ No meal plan found for date:', date)
      console.log('🔍 Direct query error:', mealPlanError)
      
      // Let's also check what meal plans exist for this user
      const { data: userPlans, error: userPlansError } = await supabase
        .from('user_meal_plans')
        .select('id, plan_date, plan_status')
        .eq('user_id', userId)
        .order('plan_date', { ascending: false })
        .limit(5)
      
      console.log('📅 User\'s recent meal plans:', userPlans)
      return null
    }

    // Get planned meals
    const { data: plannedMeals, error: mealsError } = await supabase
      .from('planned_meals')
      .select('*')
      .eq('meal_plan_id', mealPlan.id)
      .order('meal_type')
      .order('meal_order')

    if (mealsError) {
      console.error('❌ Error fetching planned meals:', mealsError)
      throw mealsError
    }

    // Calculate completion summary
    const totalMeals = plannedMeals?.length || 0
    const completedMeals = plannedMeals?.filter(meal => meal.is_completed).length || 0
    const totalPlannedCalories = plannedMeals?.reduce((sum, meal) => sum + meal.calories, 0) || 0
    const completedCalories = plannedMeals?.filter(meal => meal.is_completed).reduce((sum, meal) => sum + meal.calories, 0) || 0

    return {
      mealPlan,
      plannedMeals: plannedMeals || [],
      completionSummary: {
        total_meals: totalMeals,
        completed_meals: completedMeals,
        completion_percentage: totalMeals > 0 ? Math.round((completedMeals / totalMeals) * 100) : 0,
        total_planned_calories: totalPlannedCalories,
        completed_calories: completedCalories
      }
    }

  } catch (error) {
    console.error('💥 Error in getMealPlan:', error)
    throw error
  }
}

export const createMealPlan = async (userId: string, request: CreateMealPlanRequest): Promise<string> => {
  try {
    console.log('🔄 Creating meal plan for user:', userId, request)

    const { data, error } = await supabase
      .from('user_meal_plans')
      .insert({
        user_id: userId,
        plan_date: request.plan_date,
        plan_name: request.plan_name || `Daily Meal Plan - ${new Date(request.plan_date).toLocaleDateString()}`,
        generation_method: 'manual',
        plan_status: 'draft',
        target_calories: request.target_calories,
        target_protein_g: request.target_protein_g,
        target_carbs_g: request.target_carbs_g,
        target_fat_g: request.target_fat_g,
        meals_per_day: request.meals_per_day || 3,
        include_snacks: request.include_snacks ?? true,
        dietary_preferences: request.dietary_preferences,
        excluded_ingredients: request.excluded_ingredients,
        notes: request.notes
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Error creating meal plan:', error)
      throw error
    }

    console.log('✅ Created meal plan:', data.id)
    return data.id

  } catch (error) {
    console.error('💥 Error in createMealPlan:', error)
    throw error
  }
}

export const updateMealPlan = async (mealPlanId: string, updates: Partial<UserMealPlan>): Promise<void> => {
  try {
    console.log('🔄 Updating meal plan:', mealPlanId, updates)

    const { error } = await supabase
      .from('user_meal_plans')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', mealPlanId)

    if (error) {
      console.error('❌ Error updating meal plan:', error)
      throw error
    }

    console.log('✅ Updated meal plan:', mealPlanId)

  } catch (error) {
    console.error('💥 Error in updateMealPlan:', error)
    throw error
  }
}

export const deleteMealPlan = async (mealPlanId: string): Promise<void> => {
  try {
    console.log('🗑️ Deleting meal plan:', mealPlanId)

    const { error } = await supabase
      .from('user_meal_plans')
      .delete()
      .eq('id', mealPlanId)

    if (error) {
      console.error('❌ Error deleting meal plan:', error)
      throw error
    }

    console.log('✅ Deleted meal plan:', mealPlanId)

  } catch (error) {
    console.error('💥 Error in deleteMealPlan:', error)
    throw error
  }
}

// ================================================================================================
// PLANNED MEAL CRUD OPERATIONS  
// ================================================================================================

export const addPlannedMeal = async (request: CreatePlannedMealRequest): Promise<string> => {
  try {
    console.log('🔄 Adding planned meal:', request)

    const { data, error } = await supabase
      .from('planned_meals')
      .insert({
        meal_plan_id: request.meal_plan_id,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        plan_date: (await supabase
          .from('user_meal_plans')
          .select('plan_date')
          .eq('id', request.meal_plan_id)
          .single()).data?.plan_date,
        meal_type: request.meal_type,
        meal_order: request.meal_order || 1,
        scheduled_time: request.scheduled_time,
        food_name: request.food_name,
        recipe_id: request.recipe_id,
        serving_size: request.serving_size || 1,
        serving_unit: request.serving_unit || 'serving',
        calories: request.calories,
        protein_g: request.protein_g || 0,
        carbs_g: request.carbs_g || 0,
        fat_g: request.fat_g || 0,
        fiber_g: request.fiber_g || 0,
        sugar_g: request.sugar_g || 0,
        sodium_mg: request.sodium_mg || 0,
        food_category: request.food_category,
        preparation_method: request.preparation_method,
        cooking_time_minutes: request.cooking_time_minutes,
        difficulty_level: request.difficulty_level || 'easy',
        substitutable: request.substitutable ?? true,
        priority_level: request.priority_level || 3,
        tags: request.tags ? JSON.stringify(request.tags) : null,
        notes: request.notes
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Error adding planned meal:', error)
      throw error
    }

    console.log('✅ Added planned meal:', data.id)
    return data.id

  } catch (error) {
    console.error('💥 Error in addPlannedMeal:', error)
    throw error
  }
}

export const updatePlannedMeal = async (request: UpdatePlannedMealRequest): Promise<void> => {
  try {
    console.log('🔄 Updating planned meal:', request)

    const { error } = await supabase
      .from('planned_meals')
      .update({
        ...request.updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', request.meal_id)

    if (error) {
      console.error('❌ Error updating planned meal:', error)
      throw error
    }

    console.log('✅ Updated planned meal:', request.meal_id)

  } catch (error) {
    console.error('💥 Error in updatePlannedMeal:', error)
    throw error
  }
}

export const deletePlannedMeal = async (mealId: string): Promise<void> => {
  try {
    console.log('🗑️ Deleting planned meal:', mealId)

    const { error } = await supabase
      .from('planned_meals')
      .delete()
      .eq('id', mealId)

    if (error) {
      console.error('❌ Error deleting planned meal:', error)
      throw error
    }

    console.log('✅ Deleted planned meal:', mealId)

  } catch (error) {
    console.error('💥 Error in deletePlannedMeal:', error)
    throw error
  }
}

// ================================================================================================
// MEAL COMPLETION OPERATIONS
// ================================================================================================

export const completePlannedMeal = async (request: CompleteMealRequest): Promise<void> => {
  try {
    console.log('✅ Completing planned meal:', request)

    const updates: any = {
      is_completed: true,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    if (request.actual_serving_size) {
      updates.serving_size = request.actual_serving_size
    }

    if (request.actual_calories) {
      updates.calories = request.actual_calories
    }

    if (request.completion_notes) {
      updates.notes = request.completion_notes
    }

    const { error } = await supabase
      .from('planned_meals')
      .update(updates)
      .eq('id', request.meal_id)

    if (error) {
      console.error('❌ Error completing planned meal:', error)
      throw error
    }

    console.log('✅ Completed planned meal:', request.meal_id)

  } catch (error) {
    console.error('💥 Error in completePlannedMeal:', error)
    throw error
  }
}

export const uncompletePlannedMeal = async (mealId: string): Promise<void> => {
  try {
    console.log('↩️ Uncompleting planned meal:', mealId)

    const { error } = await supabase
      .from('planned_meals')
      .update({
        is_completed: false,
        completed_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', mealId)

    if (error) {
      console.error('❌ Error uncompleting planned meal:', error)
      throw error
    }

    console.log('✅ Uncompleted planned meal:', mealId)

  } catch (error) {
    console.error('💥 Error in uncompletePlannedMeal:', error)
    throw error
  }
}

// ================================================================================================
// DASHBOARD & QUERY OPERATIONS  
// ================================================================================================

export const getTodaysMealPlan = async (userId: string): Promise<DashboardMealPlan | null> => {
  const today = new Date().toISOString().split('T')[0]
  return getDashboardMealPlan(userId, today)
}

export const getDashboardMealPlan = async (userId: string, date: string): Promise<DashboardMealPlan | null> => {
  try {
    console.log('📊 Fetching dashboard meal plan for:', userId, date)

    const mealPlanData = await getMealPlan(userId, date)
    
    if (!mealPlanData) {
      return null
    }

    const { mealPlan, plannedMeals, completionSummary } = mealPlanData

    // Transform planned meals for dashboard display
    const dashboardMeals = plannedMeals.map(meal => ({
      id: meal.id,
      mealType: meal.meal_type,
      mealOrder: meal.meal_order,
      scheduledTime: meal.scheduled_time,
      foodName: meal.food_name,
      calories: meal.calories,
      isCompleted: meal.is_completed,
      canComplete: !meal.is_completed, // Can complete if not already completed
      tags: meal.tags ? (typeof meal.tags === 'string' ? JSON.parse(meal.tags) : meal.tags) : undefined,
      difficultyLevel: meal.difficulty_level,
      cookingTimeMinutes: meal.cooking_time_minutes
    }))

    // Sort meals by scheduled time, then by meal type order
    const mealTypeOrder = { breakfast: 1, lunch: 2, dinner: 3, snack: 4, brunch: 1.5, other: 5 }
    dashboardMeals.sort((a, b) => {
      if (a.scheduledTime && b.scheduledTime) {
        return a.scheduledTime.localeCompare(b.scheduledTime)
      }
      return (mealTypeOrder[a.mealType as keyof typeof mealTypeOrder] || 5) - 
             (mealTypeOrder[b.mealType as keyof typeof mealTypeOrder] || 5)
    })

    return {
      date,
      mealPlan,
      meals: dashboardMeals,
      completionStats: {
        totalMeals: completionSummary?.total_meals || 0,
        completedMeals: completionSummary?.completed_meals || 0,
        percentage: completionSummary?.completion_percentage || 0,
        caloriesCompleted: completionSummary?.completed_calories || 0,
        caloriesRemaining: (completionSummary?.total_planned_calories || 0) - (completionSummary?.completed_calories || 0)
      }
    }

  } catch (error) {
    console.error('💥 Error in getDashboardMealPlan:', error)
    throw error
  }
}

export const getUserMealPlans = async (
  userId: string, 
  filters?: MealPlanFilters,
  sort?: MealPlanSortOptions,
  limit = 50,
  offset = 0
): Promise<UserMealPlan[]> => {
  try {
    console.log('📋 Fetching user meal plans:', { userId, filters, sort, limit, offset })

    let query = supabase
      .from('user_meal_plans')
      .select('*')
      .eq('user_id', userId)

    // Apply filters
    if (filters?.status) {
      query = query.in('plan_status', filters.status)
    }
    if (filters?.generation_method) {
      query = query.in('generation_method', filters.generation_method)
    }
    if (filters?.date_from) {
      query = query.gte('plan_date', filters.date_from)
    }
    if (filters?.date_to) {
      query = query.lte('plan_date', filters.date_to)
    }

    // Apply sorting
    if (sort) {
      query = query.order(sort.field, { ascending: sort.direction === 'asc' })
    } else {
      query = query.order('plan_date', { ascending: false }) // Default: newest first
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data, error } = await query

    if (error) {
      console.error('❌ Error fetching user meal plans:', error)
      throw error
    }

    console.log('✅ Fetched', data?.length || 0, 'meal plans')
    return data || []

  } catch (error) {
    console.error('💥 Error in getUserMealPlans:', error)
    throw error
  }
}

export const getUpcomingMealPlans = async (userId: string, days = 7): Promise<UserMealPlan[]> => {
  const today = new Date().toISOString().split('T')[0]
  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + days)
  const futureDateStr = futureDate.toISOString().split('T')[0]

  return getUserMealPlans(userId, {
    date_from: today,
    date_to: futureDateStr,
    status: ['active', 'draft']
  }, {
    field: 'plan_date',
    direction: 'asc'
  })
}

// ================================================================================================
// MEAL PLAN STATISTICS & ANALYTICS
// ================================================================================================

export const getMealPlanStats = async (userId: string, dateFrom?: string, dateTo?: string) => {
  try {
    const fromDate = dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 30 days ago
    const toDate = dateTo || new Date().toISOString().split('T')[0] // today

    console.log('📊 Fetching meal plan stats:', { userId, fromDate, toDate })

    const { data, error } = await supabase
      .from('user_meal_plans')
      .select(`
        id,
        plan_date,
        plan_status,
        total_planned_calories,
        total_meals_count,
        planned_meals!inner(
          id,
          is_completed,
          calories
        )
      `)
      .eq('user_id', userId)
      .gte('plan_date', fromDate)
      .lte('plan_date', toDate)

    if (error) {
      console.error('❌ Error fetching meal plan stats:', error)
      throw error
    }

    // Calculate statistics
    const totalPlans = data.length
    const completedPlans = data.filter(plan => 
      plan.planned_meals.every(meal => meal.is_completed)
    ).length
    
    const totalPlannedMeals = data.reduce((sum, plan) => sum + plan.total_meals_count, 0)
    const completedMeals = data.reduce((sum, plan) => 
      sum + plan.planned_meals.filter(meal => meal.is_completed).length, 0
    )
    
    const totalPlannedCalories = data.reduce((sum, plan) => sum + (plan.total_planned_calories || 0), 0)
    const completedCalories = data.reduce((sum, plan) => 
      sum + plan.planned_meals
        .filter(meal => meal.is_completed)
        .reduce((mealSum, meal) => mealSum + meal.calories, 0), 0
    )

    const stats = {
      dateRange: { from: fromDate, to: toDate },
      totalPlans,
      completedPlans,
      planCompletionRate: totalPlans > 0 ? (completedPlans / totalPlans) * 100 : 0,
      totalPlannedMeals,
      completedMeals,
      mealCompletionRate: totalPlannedMeals > 0 ? (completedMeals / totalPlannedMeals) * 100 : 0,
      totalPlannedCalories,
      completedCalories,
      calorieCompletionRate: totalPlannedCalories > 0 ? (completedCalories / totalPlannedCalories) * 100 : 0,
      averageCaloriesPerDay: totalPlans > 0 ? totalPlannedCalories / totalPlans : 0,
      averageMealsPerDay: totalPlans > 0 ? totalPlannedMeals / totalPlans : 0
    }

    console.log('✅ Calculated meal plan stats:', stats)
    return stats

  } catch (error) {
    console.error('💥 Error in getMealPlanStats:', error)
    throw error
  }
}

// ================================================================================================
// UTILITY FUNCTIONS
// ================================================================================================

export const duplicateMealPlan = async (sourcePlanId: string, newDate: string): Promise<string> => {
  try {
    console.log('📋 Duplicating meal plan:', sourcePlanId, 'to date:', newDate)

    // Get source meal plan and meals
    const { data: sourcePlan, error: planError } = await supabase
      .from('user_meal_plans')
      .select('*')
      .eq('id', sourcePlanId)
      .single()

    if (planError) throw planError

    const { data: sourceMeals, error: mealsError } = await supabase
      .from('planned_meals')
      .select('*')
      .eq('meal_plan_id', sourcePlanId)

    if (mealsError) throw mealsError

    // Create new meal plan
    const { data: newPlan, error: newPlanError } = await supabase
      .from('user_meal_plans')
      .insert({
        ...sourcePlan,
        id: undefined, // Let DB generate new ID
        plan_date: newDate,
        plan_name: `${sourcePlan.plan_name} (Copy)`,
        plan_status: 'draft',
        created_at: undefined,
        updated_at: undefined
      })
      .select()
      .single()

    if (newPlanError) throw newPlanError

    // Create new planned meals
    if (sourceMeals && sourceMeals.length > 0) {
      const newMeals = sourceMeals.map(meal => ({
        ...meal,
        id: undefined, // Let DB generate new ID
        meal_plan_id: newPlan.id,
        plan_date: newDate,
        is_completed: false,
        completed_at: null,
        food_log_entry_id: null,
        created_at: undefined,
        updated_at: undefined
      }))

      const { error: newMealsError } = await supabase
        .from('planned_meals')
        .insert(newMeals)

      if (newMealsError) throw newMealsError
    }

    console.log('✅ Duplicated meal plan to:', newPlan.id)
    return newPlan.id

  } catch (error) {
    console.error('💥 Error in duplicateMealPlan:', error)
    throw error
  }
}

export const activateMealPlan = async (mealPlanId: string): Promise<void> => {
  return updateMealPlan(mealPlanId, { plan_status: 'active' })
}

export const archiveMealPlan = async (mealPlanId: string): Promise<void> => {
  return updateMealPlan(mealPlanId, { plan_status: 'archived' })
}

// Check if user has meal plan for specific date
export const hasMealPlanForDate = async (userId: string, date: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('user_meal_plans')
      .select('id')
      .eq('user_id', userId)
      .eq('plan_date', date)
      .limit(1)

    if (error) throw error
    return data.length > 0

  } catch (error) {
    console.error('💥 Error in hasMealPlanForDate:', error)
    return false
  }
}