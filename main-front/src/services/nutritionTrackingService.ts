// ================================================================================================
// Nutrition Tracking Service
// Purpose: Database operations for nutrition tracking and dashboard visualization
// Author: Claude AI Assistant
// Date: August 5, 2025
// ================================================================================================

import { supabase } from './supabase'
import type {
  DailyNutritionData,
  NutritionGoals,
  NutritionHistory,
  NutritionChartData,
  NutritionDashboardSummary,
  GetNutritionHistoryParams,
  GetNutritionSummaryParams,
  BatchNutritionResponse,
  NutritionChartDataPoint,
  MacroBreakdown
} from '../types/nutrition-tracking.types'

// ================================================================================================
// DAILY NUTRITION SUMMARY OPERATIONS
// ================================================================================================

/**
 * Get daily nutrition summary for a specific date
 */
export const getDailyNutritionSummary = async (
  userId: string, 
  date?: string
): Promise<DailyNutritionData | null> => {
  try {
    const targetDate = date || new Date().toISOString().split('T')[0]
    console.log('📊 Fetching daily nutrition summary for:', userId, targetDate)

    const { data, error } = await supabase
      .from('daily_nutrition_summary')
      .select('*')
      .eq('user_id', userId)
      .eq('log_date', targetDate)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No data found - this is normal for days without completed meals
        console.log('ℹ️ No nutrition data found for date:', targetDate)
        return null
      }
      console.error('❌ Error fetching daily nutrition summary:', error)
      throw error
    }

    console.log('✅ Retrieved daily nutrition summary:', data)
    return data
  } catch (error) {
    console.error('💥 Error in getDailyNutritionSummary:', error)
    throw error
  }
}

/**
 * Get nutrition history for a date range
 */
export const getNutritionHistory = async (
  params: GetNutritionHistoryParams
): Promise<NutritionHistory> => {
  try {
    console.log('📈 Fetching nutrition history:', params)

    // Get daily nutrition summaries for the date range
    const { data: dailyData, error: dailyError } = await supabase
      .from('daily_nutrition_summary')
      .select('*')
      .eq('user_id', params.userId)
      .gte('log_date', params.startDate)
      .lte('log_date', params.endDate)
      .order('log_date', { ascending: true })

    if (dailyError) {
      console.error('❌ Error fetching nutrition history:', dailyError)
      throw dailyError
    }

    // Get user goals if requested
    let goals: NutritionGoals
    if (params.includeGoals) {
      goals = await getNutritionGoals(params.userId)
    } else {
      goals = getDefaultNutritionGoals(params.userId)
    }

    // Calculate trends
    const trends = calculateNutritionTrends(dailyData || [])

    const history: NutritionHistory = {
      user_id: params.userId,
      date_range: {
        start_date: params.startDate,
        end_date: params.endDate
      },
      daily_data: dailyData || [],
      goals,
      trends
    }

    console.log('✅ Retrieved nutrition history:', history.daily_data.length, 'days')
    return history
  } catch (error) {
    console.error('💥 Error in getNutritionHistory:', error)
    throw error
  }
}

/**
 * Get nutrition data formatted for charts
 */
export const getNutritionChartData = async (
  userId: string,
  period: 'week' | 'month' | 'quarter'
): Promise<NutritionChartData> => {
  try {
    console.log('📊 Fetching nutrition chart data for:', userId, period)

    // Calculate date range based on period
    const endDate = new Date()
    const startDate = new Date()
    
    switch (period) {
      case 'week':
        startDate.setDate(endDate.getDate() - 7)
        break
      case 'month':
        startDate.setDate(endDate.getDate() - 30)
        break
      case 'quarter':
        startDate.setDate(endDate.getDate() - 90)
        break
    }

    const history = await getNutritionHistory({
      userId,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      includeGoals: true
    })

    // Transform to chart data points
    const dataPoints: NutritionChartDataPoint[] = history.daily_data.map(day => ({
      date: day.log_date,
      calories: day.total_calories,
      protein: day.total_protein_g,
      carbs: day.total_carbs_g,
      fat: day.total_fat_g,
      fiber: day.total_fiber_g,
      completion_percentage: day.completion_percentage,
      goal_calories: history.goals.daily_calories,
      is_complete_day: day.total_entries_count > 0
    }))

    // Calculate chart metadata
    const maxCalories = Math.max(...dataPoints.map(p => p.calories), history.goals.daily_calories)
    const maxProtein = Math.max(...dataPoints.map(p => p.protein), history.goals.daily_protein_g)
    const maxCarbs = Math.max(...dataPoints.map(p => p.carbs), history.goals.daily_carbs_g)
    const maxFat = Math.max(...dataPoints.map(p => p.fat), history.goals.daily_fat_g)

    const chartData: NutritionChartData = {
      period,
      data_points: dataPoints,
      goals: history.goals,
      max_calories: maxCalories,
      max_protein: maxProtein,
      max_carbs: maxCarbs,
      max_fat: maxFat,
      total_days: dataPoints.length,
      days_with_data: dataPoints.filter(p => p.is_complete_day).length,
      avg_completion_rate: dataPoints.length > 0 
        ? dataPoints.reduce((sum, p) => sum + p.completion_percentage, 0) / dataPoints.length 
        : 0
    }

    console.log('✅ Generated nutrition chart data:', chartData.days_with_data, '/', chartData.total_days, 'days with data')
    return chartData
  } catch (error) {
    console.error('💥 Error in getNutritionChartData:', error)
    throw error
  }
}

/**
 * Get comprehensive nutrition dashboard summary
 */
export const getNutritionDashboardSummary = async (
  userId: string
): Promise<NutritionDashboardSummary> => {
  try {
    console.log('🏠 Fetching nutrition dashboard summary for:', userId)

    // Get today's data and goals in parallel
    const [todayData, goals, recentHistory] = await Promise.all([
      getDailyNutritionSummary(userId),
      getNutritionGoals(userId),
      getNutritionHistory({
        userId,
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        includeGoals: false
      })
    ])

    // Calculate progress indicators
    const calorieProgress = {
      current: todayData?.total_calories || 0,
      goal: goals.daily_calories,
      percentage: todayData ? Math.round((todayData.total_calories / goals.daily_calories) * 100) : 0,
      status: getProgressStatus(todayData?.total_calories || 0, goals.daily_calories)
    }

    const proteinProgress = {
      current: todayData?.total_protein_g || 0,
      goal: goals.daily_protein_g,
      percentage: todayData ? Math.round((todayData.total_protein_g / goals.daily_protein_g) * 100) : 0,
      status: getProgressStatus(todayData?.total_protein_g || 0, goals.daily_protein_g)
    }

    const mealCompletion = {
      completed: todayData?.completed_meals_count || 0,
      total: todayData?.planned_meals_count || 0,
      percentage: todayData?.completion_percentage || 0
    }

    // Calculate recent trends
    const recentAvgCalories = recentHistory.daily_data.length > 0
      ? recentHistory.daily_data.reduce((sum, day) => sum + day.total_calories, 0) / recentHistory.daily_data.length
      : 0

    const recentAvgCompletion = recentHistory.daily_data.length > 0
      ? recentHistory.daily_data.reduce((sum, day) => sum + day.completion_percentage, 0) / recentHistory.daily_data.length
      : 0

    const dashboardSummary: NutritionDashboardSummary = {
      today: todayData,
      goals,
      calorie_progress: calorieProgress,
      protein_progress: proteinProgress,
      meal_completion: mealCompletion,
      recent_trends: {
        avg_calories: Math.round(recentAvgCalories),
        avg_completion_rate: Math.round(recentAvgCompletion),
        trend_direction: recentHistory.trends.calories_trend === 'increasing' ? 'up' : 
                        recentHistory.trends.calories_trend === 'decreasing' ? 'down' : 'stable'
      }
    }

    console.log('✅ Generated nutrition dashboard summary')
    return dashboardSummary
  } catch (error) {
    console.error('💥 Error in getNutritionDashboardSummary:', error)
    throw error
  }
}

// ================================================================================================
// NUTRITION GOALS MANAGEMENT
// ================================================================================================

/**
 * Get user's nutrition goals
 */
export const getNutritionGoals = async (userId: string): Promise<NutritionGoals> => {
  try {
    console.log('🎯 Fetching nutrition goals for:', userId)

    // Try to get goals from user health profile
    const { data: healthProfile, error } = await supabase
      .from('user_health_profiles')
      .select('daily_calorie_goal, activity_level, fitness_goals')
      .eq('user_id', userId)
      .single()

    if (error || !healthProfile?.daily_calorie_goal) {
      console.log('ℹ️ No custom goals found, using defaults')
      return getDefaultNutritionGoals(userId)
    }

    // Calculate macro goals based on calorie goal
    const calorieGoal = healthProfile.daily_calorie_goal
    const goals: NutritionGoals = {
      user_id: userId,
      daily_calories: calorieGoal,
      daily_protein_g: Math.round(calorieGoal * 0.25 / 4), // 25% of calories from protein
      daily_carbs_g: Math.round(calorieGoal * 0.45 / 4),   // 45% of calories from carbs
      daily_fat_g: Math.round(calorieGoal * 0.30 / 9),     // 30% of calories from fat
      daily_fiber_g: Math.round(calorieGoal / 1000 * 14),  // 14g per 1000 calories
      daily_sodium_mg: 2300, // Standard recommendation
      daily_sugar_g: Math.round(calorieGoal * 0.10 / 4),   // 10% of calories from added sugar
      source: 'calculated',
      last_updated: new Date().toISOString()
    }

    console.log('✅ Retrieved calculated nutrition goals:', goals)
    return goals
  } catch (error) {
    console.error('💥 Error in getNutritionGoals:', error)
    return getDefaultNutritionGoals(userId)
  }
}

/**
 * Get default nutrition goals when user hasn't set custom ones
 */
export const getDefaultNutritionGoals = (userId: string): NutritionGoals => {
  return {
    user_id: userId,
    daily_calories: 2000,
    daily_protein_g: 125,  // 25% of 2000 calories
    daily_carbs_g: 225,    // 45% of 2000 calories  
    daily_fat_g: 67,       // 30% of 2000 calories
    daily_fiber_g: 28,     // 14g per 1000 calories
    daily_sodium_mg: 2300,
    daily_sugar_g: 50,     // 10% of 2000 calories
    source: 'default',
    last_updated: new Date().toISOString()
  }
}

// ================================================================================================
// HELPER FUNCTIONS
// ================================================================================================

/**
 * Calculate nutrition trends from daily data
 */
const calculateNutritionTrends = (dailyData: DailyNutritionData[]) => {
  if (dailyData.length === 0) {
    return {
      avg_calories: 0,
      avg_protein_g: 0,
      avg_carbs_g: 0,
      avg_fat_g: 0,
      avg_completion_rate: 0,
      calories_trend: 'stable' as const,
      completion_trend: 'stable' as const
    }
  }

  const avgCalories = dailyData.reduce((sum, day) => sum + day.total_calories, 0) / dailyData.length
  const avgProtein = dailyData.reduce((sum, day) => sum + day.total_protein_g, 0) / dailyData.length
  const avgCarbs = dailyData.reduce((sum, day) => sum + day.total_carbs_g, 0) / dailyData.length
  const avgFat = dailyData.reduce((sum, day) => sum + day.total_fat_g, 0) / dailyData.length
  const avgCompletion = dailyData.reduce((sum, day) => sum + day.completion_percentage, 0) / dailyData.length

  // Calculate trends (simple linear trend)
  const caloriesTrend = calculateLinearTrend(dailyData.map(d => d.total_calories))
  const completionTrendRaw = calculateLinearTrend(dailyData.map(d => d.completion_percentage))
  
  // Map to expected completion trend values
  const completionTrend: 'improving' | 'declining' | 'stable' = 
    completionTrendRaw === 'increasing' ? 'improving' :
    completionTrendRaw === 'decreasing' ? 'declining' : 'stable'

  return {
    avg_calories: Math.round(avgCalories),
    avg_protein_g: Math.round(avgProtein),
    avg_carbs_g: Math.round(avgCarbs),
    avg_fat_g: Math.round(avgFat),
    avg_completion_rate: Math.round(avgCompletion),
    calories_trend: caloriesTrend,
    completion_trend: completionTrend
  }
}

/**
 * Calculate linear trend direction
 */
const calculateLinearTrend = (values: number[]): 'increasing' | 'decreasing' | 'stable' => {
  if (values.length < 2) return 'stable'
  
  const firstHalf = values.slice(0, Math.floor(values.length / 2))
  const secondHalf = values.slice(Math.floor(values.length / 2))
  
  const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length
  const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length
  
  const percentChange = ((secondAvg - firstAvg) / firstAvg) * 100
  
  if (percentChange > 5) return 'increasing'
  if (percentChange < -5) return 'decreasing'
  return 'stable'
}

/**
 * Get progress status based on current vs goal
 */
const getProgressStatus = (current: number, goal: number): 'under' | 'on_track' | 'over' => {
  const percentage = (current / goal) * 100
  if (percentage < 80) return 'under'
  if (percentage > 120) return 'over'
  return 'on_track'
}

/**
 * Calculate macro breakdown percentages
 */
export const calculateMacroBreakdown = (
  protein_g: number,
  carbs_g: number,
  fat_g: number
): MacroBreakdown => {
  const proteinCalories = protein_g * 4
  const carbsCalories = carbs_g * 4
  const fatCalories = fat_g * 9
  const totalCalories = proteinCalories + carbsCalories + fatCalories

  if (totalCalories === 0) {
    return {
      protein_percentage: 0,
      carbs_percentage: 0,
      fat_percentage: 0,
      total_calories: 0
    }
  }

  return {
    protein_percentage: Math.round((proteinCalories / totalCalories) * 100),
    carbs_percentage: Math.round((carbsCalories / totalCalories) * 100),
    fat_percentage: Math.round((fatCalories / totalCalories) * 100),
    total_calories: totalCalories
  }
}

// ================================================================================================
// BATCH OPERATIONS FOR PERFORMANCE
// ================================================================================================

/**
 * Get all nutrition data needed for dashboard in one call
 */
export const getBatchNutritionData = async (
  userId: string,
  period: 'week' | 'month' = 'week'
): Promise<BatchNutritionResponse> => {
  try {
    console.log('📦 Fetching batch nutrition data for:', userId, period)

    const [dashboardSummary, chartData] = await Promise.all([
      getNutritionDashboardSummary(userId),
      getNutritionChartData(userId, period)
    ])

    const batchResponse: BatchNutritionResponse = {
      daily_summaries: chartData.data_points.map(point => ({
        user_id: userId,
        log_date: point.date,
        total_calories: point.calories,
        total_protein_g: point.protein,
        total_carbs_g: point.carbs,
        total_fat_g: point.fat,
        total_fiber_g: point.fiber || 0,
        completion_percentage: point.completion_percentage,
        // Simplified - only include essential fields for charts
      } as DailyNutritionData)),
      goals: dashboardSummary.goals,
      trends: {
        avg_calories: dashboardSummary.recent_trends.avg_calories,
        avg_protein_g: 0, // Will be calculated from chart data
        avg_carbs_g: 0,
        avg_fat_g: 0,
        avg_completion_rate: dashboardSummary.recent_trends.avg_completion_rate,
        calories_trend: dashboardSummary.recent_trends.trend_direction === 'up' ? 'increasing' : 
                       dashboardSummary.recent_trends.trend_direction === 'down' ? 'decreasing' : 'stable',
        completion_trend: 'stable'
      },
      chart_data: chartData
    }

    console.log('✅ Generated batch nutrition data')
    return batchResponse
  } catch (error) {
    console.error('💥 Error in getBatchNutritionData:', error)
    throw error
  }
}

// ================================================================================================
// DAILY NUTRITION LOGGING (When meals are cooked)
// ================================================================================================

export interface LogMealNutritionInput {
  mealId: string
  mealSlot: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  mealName: string
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g?: number
  date?: string // Defaults to today
}

/**
 * Log nutrition when a meal is marked as cooked.
 * This updates the daily_nutrition_summary table.
 */
export const logCookedMealNutrition = async (
  input: LogMealNutritionInput
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'User not authenticated' }
    }

    const logDate = input.date || new Date().toISOString().split('T')[0]
    console.log('📝 Logging cooked meal nutrition:', input.mealName, 'for date:', logDate)

    // First, check if there's already a daily_nutrition_summary entry for today
    const { data: existingSummary, error: fetchError } = await supabase
      .from('daily_nutrition_summary')
      .select('*')
      .eq('user_id', user.id)
      .eq('log_date', logDate)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('❌ Error fetching existing summary:', fetchError)
      return { success: false, error: fetchError.message }
    }

    if (existingSummary) {
      // Update existing summary by adding the new meal's nutrition
      const { error: updateError } = await supabase
        .from('daily_nutrition_summary')
        .update({
          total_calories: existingSummary.total_calories + input.calories,
          total_protein_g: existingSummary.total_protein_g + input.protein_g,
          total_carbs_g: existingSummary.total_carbs_g + input.carbs_g,
          total_fat_g: existingSummary.total_fat_g + input.fat_g,
          total_fiber_g: (existingSummary.total_fiber_g || 0) + (input.fiber_g || 0),
          completed_meals_count: existingSummary.completed_meals_count + 1,
          completion_percentage: Math.round(
            ((existingSummary.completed_meals_count + 1) / (existingSummary.planned_meals_count || 4)) * 100
          ),
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSummary.id)

      if (updateError) {
        console.error('❌ Error updating daily summary:', updateError)
        return { success: false, error: updateError.message }
      }

      console.log('✅ Updated daily nutrition summary for:', logDate)
    } else {
      // Create new summary for today
      const { error: insertError } = await supabase
        .from('daily_nutrition_summary')
        .insert({
          user_id: user.id,
          log_date: logDate,
          total_calories: input.calories,
          total_protein_g: input.protein_g,
          total_carbs_g: input.carbs_g,
          total_fat_g: input.fat_g,
          total_fiber_g: input.fiber_g || 0,
          completed_meals_count: 1,
          planned_meals_count: 4, // Default assumption: breakfast, lunch, dinner, snack
          completion_percentage: 25, // 1 out of 4 meals
          total_entries_count: 1
        })

      if (insertError) {
        console.error('❌ Error creating daily summary:', insertError)
        return { success: false, error: insertError.message }
      }

      console.log('✅ Created new daily nutrition summary for:', logDate)
    }

    // Also log individual meal entry for detailed tracking
    const { error: mealLogError } = await supabase
      .from('nutrition_meal_logs')
      .insert({
        user_id: user.id,
        log_date: logDate,
        meal_slot: input.mealSlot,
        meal_name: input.mealName,
        meal_plan_entry_id: input.mealId,
        calories: input.calories,
        protein_g: input.protein_g,
        carbs_g: input.carbs_g,
        fat_g: input.fat_g,
        fiber_g: input.fiber_g || 0,
        logged_at: new Date().toISOString()
      })

    if (mealLogError) {
      // Non-critical - summary was updated, just log the error
      console.warn('⚠️ Could not log individual meal entry:', mealLogError)
    }

    return { success: true }
  } catch (error) {
    console.error('💥 Error in logCookedMealNutrition:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Get today's nutrition summary for the current user
 */
export const getTodayNutritionSummary = async (): Promise<DailyNutritionData | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.log('No user authenticated')
      return null
    }

    const today = new Date().toISOString().split('T')[0]
    return await getDailyNutritionSummary(user.id, today)
  } catch (error) {
    console.error('💥 Error in getTodayNutritionSummary:', error)
    return null
  }
}