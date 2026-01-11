import { supabase } from './supabase'

export interface NutritionGoals {
  calorie_goal: number
  protein_goal_g: number
  carbs_goal_g: number
  fat_goal_g: number
  fiber_goal_g: number
}

export interface DailyNutritionTotals {
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number
  completedMeals: number
  totalMeals: number
}

export interface NutritionDashboard {
  totals: DailyNutritionTotals
  goals: NutritionGoals
}

const DEFAULT_GOALS: NutritionGoals = {
  calorie_goal: 2000,
  protein_goal_g: 50,
  carbs_goal_g: 250,
  fat_goal_g: 65,
  fiber_goal_g: 25
}

export const getUserNutritionGoals = async (userId: string): Promise<NutritionGoals> => {
  try {
    const { data, error } = await supabase
      .from('user_nutrition_goals')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error || !data) {
      return DEFAULT_GOALS
    }

    return {
      calorie_goal: data.calorie_goal || DEFAULT_GOALS.calorie_goal,
      protein_goal_g: data.protein_goal_g || DEFAULT_GOALS.protein_goal_g,
      carbs_goal_g: data.carbs_goal_g || DEFAULT_GOALS.carbs_goal_g,
      fat_goal_g: data.fat_goal_g || DEFAULT_GOALS.fat_goal_g,
      fiber_goal_g: data.fiber_goal_g || DEFAULT_GOALS.fiber_goal_g
    }
  } catch (error) {
    console.error('Error fetching nutrition goals:', error)
    return DEFAULT_GOALS
  }
}

export const updateUserNutritionGoals = async (userId: string, goals: Partial<NutritionGoals>): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('user_nutrition_goals')
      .upsert({
        user_id: userId,
        ...goals,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })

    if (error) {
      console.error('Error updating nutrition goals:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error updating nutrition goals:', error)
    return false
  }
}

export const getDailyNutritionTotals = async (userId: string, date: string): Promise<DailyNutritionTotals> => {
  try {
    console.log('📊 getDailyNutritionTotals - querying for cooked_date:', date, 'userId:', userId)
    
    // Fetch from both meal_plans (completed meals by cooked_date) and daily_nutrition_summary (cooked recipes)
    const [mealPlansResult, summaryResult] = await Promise.all([
      supabase
        .from('meal_plans')
        .select('calories, protein_g, carbs_g, fat_g, fiber_g, is_completed, cooked_date')
        .eq('user_id', userId)
        .eq('cooked_date', date),
      supabase
        .from('daily_nutrition_summary')
        .select('total_calories, total_protein_g, total_carbs_g, total_fat_g, total_fiber_g, completed_meals_count')
        .eq('user_id', userId)
        .eq('log_date', date)
        .single()
    ])

    // Get completed meals from meal_plans
    const meals = mealPlansResult.data || []
    console.log('📊 meal_plans query result:', meals.length, 'meals found, error:', mealPlansResult.error)
    console.log('📊 Meals data:', JSON.stringify(meals))
    const completedMeals = meals.filter(m => m.is_completed)
    console.log('📊 Completed meals:', completedMeals.length)
    
    const mealPlanNutrition = {
      calories: completedMeals.reduce((sum, m) => sum + (m.calories || 0), 0),
      protein_g: completedMeals.reduce((sum, m) => sum + (Number(m.protein_g) || 0), 0),
      carbs_g: completedMeals.reduce((sum, m) => sum + (Number(m.carbs_g) || 0), 0),
      fat_g: completedMeals.reduce((sum, m) => sum + (Number(m.fat_g) || 0), 0),
      fiber_g: completedMeals.reduce((sum, m) => sum + (Number(m.fiber_g) || 0), 0),
      completedMeals: completedMeals.length
    }

    // Get nutrition from daily_nutrition_summary (recipes cooked outside meal plans)
    const summary = summaryResult.data
    const summaryNutrition = summary ? {
      calories: summary.total_calories || 0,
      protein_g: summary.total_protein_g || 0,
      carbs_g: summary.total_carbs_g || 0,
      fat_g: summary.total_fat_g || 0,
      fiber_g: summary.total_fiber_g || 0,
      completedMeals: summary.completed_meals_count || 0
    } : { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0, completedMeals: 0 }

    // Combine both sources:
    // - meal_plans: Nutrition from meal plans marked as completed (is_completed = true)
    // - daily_nutrition_summary: Nutrition from standalone recipes cooked (not from meal plans)
    // These are SEPARATE sources, so we ADD them together
    // Meal plan completions do NOT write to daily_nutrition_summary, so no double-counting
    return {
      calories: mealPlanNutrition.calories + summaryNutrition.calories,
      protein_g: mealPlanNutrition.protein_g + summaryNutrition.protein_g,
      carbs_g: mealPlanNutrition.carbs_g + summaryNutrition.carbs_g,
      fat_g: mealPlanNutrition.fat_g + summaryNutrition.fat_g,
      fiber_g: mealPlanNutrition.fiber_g + summaryNutrition.fiber_g,
      completedMeals: mealPlanNutrition.completedMeals + summaryNutrition.completedMeals,
      totalMeals: meals.length || 4 // Default to 4 meals if no meal plan
    }
  } catch (error) {
    console.error('Error fetching daily nutrition:', error)
    return {
      calories: 0,
      protein_g: 0,
      carbs_g: 0,
      fat_g: 0,
      fiber_g: 0,
      completedMeals: 0,
      totalMeals: 0
    }
  }
}

export const getNutritionDashboard = async (userId: string, date?: string): Promise<NutritionDashboard> => {
  const targetDate = date || new Date().toISOString().split('T')[0]
  
  const [totals, goals] = await Promise.all([
    getDailyNutritionTotals(userId, targetDate),
    getUserNutritionGoals(userId)
  ])

  return { totals, goals }
}

export const markMealCompleted = async (mealId: string, completed: boolean): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('meal_plans')
      .update({ 
        is_completed: completed,
        updated_at: new Date().toISOString()
      })
      .eq('id', mealId)

    if (error) {
      console.error('Error marking meal completed:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error marking meal completed:', error)
    return false
  }
}

export interface UserPhysicalProfile {
  age?: number
  sex?: string
  weight_kg?: number
  height_cm?: number
  activity_level?: string
  health_goal?: string
  diet_style?: string
}

export const calculateAndSaveNutritionGoals = async (
  userId: string, 
  profile: UserPhysicalProfile
): Promise<NutritionGoals | null> => {
  try {
    const brainApiUrl = process.env.EXPO_PUBLIC_BRAIN_API_URL || 'http://localhost:8000'
    
    const response = await fetch(`${brainApiUrl}/api/nutrition/calculate-goals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        age: profile.age || 30,
        sex: profile.sex || 'female',
        weight_kg: profile.weight_kg || 70,
        height_cm: profile.height_cm || 165,
        activity_level: profile.activity_level || 'moderate',
        health_goal: profile.health_goal || 'maintain',
        diet_style: profile.diet_style || 'balanced'
      })
    })

    if (!response.ok) {
      console.error('Failed to calculate nutrition goals from AI')
      return null
    }

    const data = await response.json()
    
    if (data.success && data.goals) {
      const goals: NutritionGoals = {
        calorie_goal: data.goals.calorie_goal,
        protein_goal_g: data.goals.protein_goal_g,
        carbs_goal_g: data.goals.carbs_goal_g,
        fat_goal_g: data.goals.fat_goal_g,
        fiber_goal_g: data.goals.fiber_goal_g
      }
      
      const saved = await updateUserNutritionGoals(userId, goals)
      if (saved) {
        console.log('✅ Calculated and saved personalized nutrition goals:', goals)
        return goals
      } else {
        console.error('❌ Failed to save nutrition goals to database, but returning calculated goals')
        return goals // Still return calculated goals even if save failed
      }
    }
    
    return null
  } catch (error) {
    console.error('Error calculating nutrition goals:', error)
    return null
  }
}

export const getOrCalculateNutritionGoals = async (
  userId: string,
  profile?: UserPhysicalProfile
): Promise<NutritionGoals> => {
  const existingGoals = await getUserNutritionGoals(userId)
  
  if (existingGoals.calorie_goal !== DEFAULT_GOALS.calorie_goal) {
    return existingGoals
  }
  
  if (profile) {
    const calculatedGoals = await calculateAndSaveNutritionGoals(userId, profile)
    if (calculatedGoals) {
      return calculatedGoals
    }
  }
  
  return existingGoals
}
