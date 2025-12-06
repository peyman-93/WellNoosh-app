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
    const { data, error } = await supabase
      .from('meal_plans')
      .select('calories, protein_g, carbs_g, fat_g, fiber_g, is_completed')
      .eq('user_id', userId)
      .eq('plan_date', date)

    if (error) {
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

    const meals = data || []
    const completedMeals = meals.filter(m => m.is_completed)

    return {
      calories: completedMeals.reduce((sum, m) => sum + (m.calories || 0), 0),
      protein_g: completedMeals.reduce((sum, m) => sum + (Number(m.protein_g) || 0), 0),
      carbs_g: completedMeals.reduce((sum, m) => sum + (Number(m.carbs_g) || 0), 0),
      fat_g: completedMeals.reduce((sum, m) => sum + (Number(m.fat_g) || 0), 0),
      fiber_g: completedMeals.reduce((sum, m) => sum + (Number(m.fiber_g) || 0), 0),
      completedMeals: completedMeals.length,
      totalMeals: meals.length
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
