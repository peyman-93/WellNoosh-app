import { supabase } from './supabase'

export type TimePeriod = 'day' | 'week' | 'month' | 'year'

export interface PeriodRange {
  startDate: string
  endDate: string
  label: string
}

export interface NutritionAnalytics {
  period: TimePeriod
  range: PeriodRange
  dailyData: DailyNutritionData[]
  averages: NutritionAverages
  totals: NutritionTotals
  trends: NutritionTrends
}

export interface DailyNutritionData {
  date: string
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number
  completedMeals: number
  totalMeals: number
}

export interface NutritionAverages {
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number
  mealCompletionRate: number
}

export interface NutritionTotals {
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number
  daysTracked: number
  mealsCompleted: number
  totalMeals: number
}

export interface NutritionTrends {
  caloriesTrend: 'up' | 'down' | 'stable'
  proteinTrend: 'up' | 'down' | 'stable'
  completionTrend: 'up' | 'down' | 'stable'
}

export interface MoodAnalytics {
  period: TimePeriod
  range: PeriodRange
  dailyData: DailyMoodData[]
  averages: MoodAverages
  insights: string[]
}

export interface DailyMoodData {
  date: string
  mood: number | null
  energyLevel: string | null
  stressLevel: number | null
  sleepHours: number | null
}

export interface MoodAverages {
  mood: number
  stressLevel: number
  sleepHours: number
  daysWithData: number
}

export interface WellnessAnalytics {
  period: TimePeriod
  range: PeriodRange
  hydration: HydrationAnalytics
  breathing: BreathingAnalytics
}

export interface HydrationAnalytics {
  dailyData: { date: string; glasses: number; goal: number }[]
  averageGlasses: number
  daysOnTarget: number
  totalDays: number
}

export interface BreathingAnalytics {
  dailyData: { date: string; sessions: number; goal: number }[]
  averageSessions: number
  daysOnTarget: number
  totalDays: number
}

export interface ComprehensiveAnalytics {
  nutrition: NutritionAnalytics
  mood: MoodAnalytics | null
  wellness: WellnessAnalytics | null
  summary: AnalyticsSummary
}

export interface AnalyticsSummary {
  overallScore: number
  streakDays: number
  bestDay: string | null
  insights: string[]
}

function getPeriodRange(period: TimePeriod, referenceDate: Date = new Date()): PeriodRange {
  const today = new Date(referenceDate)
  today.setHours(0, 0, 0, 0)
  
  let startDate: Date
  let endDate: Date
  let label: string
  
  switch (period) {
    case 'day':
      startDate = new Date(today)
      endDate = new Date(today)
      label = today.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
      break
      
    case 'week':
      startDate = new Date(today)
      startDate.setDate(today.getDate() - today.getDay())
      endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + 6)
      label = `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
      break
      
    case 'month':
      startDate = new Date(today.getFullYear(), today.getMonth(), 1)
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      label = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      break
      
    case 'year':
      startDate = new Date(today.getFullYear(), 0, 1)
      endDate = new Date(today.getFullYear(), 11, 31)
      label = today.getFullYear().toString()
      break
      
    default:
      startDate = new Date(today)
      endDate = new Date(today)
      label = 'Today'
  }
  
  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    label
  }
}

function calculateTrend(values: number[]): 'up' | 'down' | 'stable' {
  if (values.length < 2) return 'stable'
  
  const midpoint = Math.floor(values.length / 2)
  const firstHalf = values.slice(0, midpoint)
  const secondHalf = values.slice(midpoint)
  
  const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length || 0
  const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length || 0
  
  const threshold = avgFirst * 0.05
  
  if (avgSecond > avgFirst + threshold) return 'up'
  if (avgSecond < avgFirst - threshold) return 'down'
  return 'stable'
}

export const getNutritionAnalytics = async (
  userId: string,
  period: TimePeriod,
  referenceDate?: Date
): Promise<NutritionAnalytics> => {
  const range = getPeriodRange(period, referenceDate)
  
  try {
    const { data, error } = await supabase
      .from('meal_plans')
      .select('plan_date, meal_slot, is_completed')
      .eq('user_id', userId)
      .gte('plan_date', range.startDate)
      .lte('plan_date', range.endDate)
      .order('plan_date', { ascending: true })

    if (error) {
      console.error('Error fetching nutrition analytics:', error)
      throw error
    }

    const meals = data || []
    
    const dailyDataMap = new Map<string, DailyNutritionData>()
    
    meals.forEach(meal => {
      const date = meal.plan_date
      const existing = dailyDataMap.get(date) || {
        date,
        calories: 0,
        protein_g: 0,
        carbs_g: 0,
        fat_g: 0,
        fiber_g: 0,
        completedMeals: 0,
        totalMeals: 0
      }
      
      existing.totalMeals++
      
      if (meal.is_completed) {
        existing.completedMeals++
      }
      
      dailyDataMap.set(date, existing)
    })
    
    const dailyData = Array.from(dailyDataMap.values())
    
    const daysWithData = dailyData.length || 1
    const totals: NutritionTotals = {
      calories: 0,
      protein_g: 0,
      carbs_g: 0,
      fat_g: 0,
      fiber_g: 0,
      daysTracked: daysWithData,
      mealsCompleted: dailyData.reduce((sum, d) => sum + d.completedMeals, 0),
      totalMeals: dailyData.reduce((sum, d) => sum + d.totalMeals, 0)
    }
    
    const averages: NutritionAverages = {
      calories: 0,
      protein_g: 0,
      carbs_g: 0,
      fat_g: 0,
      fiber_g: 0,
      mealCompletionRate: totals.totalMeals > 0 
        ? Math.round((totals.mealsCompleted / totals.totalMeals) * 100)
        : 0
    }
    
    const trends: NutritionTrends = {
      caloriesTrend: 'stable',
      proteinTrend: 'stable',
      completionTrend: calculateTrend(dailyData.map(d => d.totalMeals > 0 ? d.completedMeals / d.totalMeals : 0))
    }
    
    return { period, range, dailyData, averages, totals, trends }
    
  } catch (error) {
    console.error('Error in getNutritionAnalytics:', error)
    return {
      period,
      range,
      dailyData: [],
      averages: { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0, mealCompletionRate: 0 },
      totals: { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0, daysTracked: 0, mealsCompleted: 0, totalMeals: 0 },
      trends: { caloriesTrend: 'stable', proteinTrend: 'stable', completionTrend: 'stable' }
    }
  }
}

export const getMoodAnalytics = async (
  userId: string,
  period: TimePeriod,
  referenceDate?: Date
): Promise<MoodAnalytics | null> => {
  const range = getPeriodRange(period, referenceDate)
  
  try {
    const { data, error } = await supabase
      .from('daily_reflections')
      .select('reflection_date, mood_rating, energy_level, stress_level, sleep_hours')
      .eq('user_id', userId)
      .gte('reflection_date', range.startDate)
      .lte('reflection_date', range.endDate)
      .order('reflection_date', { ascending: true })

    if (error) {
      if (error.code === '42P01') {
        return null
      }
      console.error('Error fetching mood analytics:', error)
      return null
    }

    const reflections = data || []
    
    if (reflections.length === 0) {
      return {
        period,
        range,
        dailyData: [],
        averages: { mood: 0, stressLevel: 0, sleepHours: 0, daysWithData: 0 },
        insights: ['Start logging your daily reflections to see mood trends!']
      }
    }
    
    const dailyData: DailyMoodData[] = reflections.map(r => ({
      date: r.reflection_date,
      mood: r.mood_rating,
      energyLevel: r.energy_level,
      stressLevel: r.stress_level,
      sleepHours: r.sleep_hours
    }))
    
    const moodValues = reflections.filter(r => r.mood_rating).map(r => r.mood_rating)
    const stressValues = reflections.filter(r => r.stress_level).map(r => r.stress_level)
    const sleepValues = reflections.filter(r => r.sleep_hours).map(r => r.sleep_hours)
    
    const averages: MoodAverages = {
      mood: moodValues.length > 0 ? Math.round(moodValues.reduce((a, b) => a + b, 0) / moodValues.length * 10) / 10 : 0,
      stressLevel: stressValues.length > 0 ? Math.round(stressValues.reduce((a, b) => a + b, 0) / stressValues.length * 10) / 10 : 0,
      sleepHours: sleepValues.length > 0 ? Math.round(sleepValues.reduce((a, b) => a + b, 0) / sleepValues.length * 10) / 10 : 0,
      daysWithData: reflections.length
    }
    
    const insights: string[] = []
    
    if (averages.mood >= 4) {
      insights.push('Your mood has been positive overall!')
    } else if (averages.mood < 3) {
      insights.push('Your mood could use a boost. Consider focusing on self-care.')
    }
    
    if (averages.sleepHours >= 7) {
      insights.push('Great job maintaining healthy sleep habits!')
    } else if (averages.sleepHours < 6) {
      insights.push('Try to get more sleep for better overall wellness.')
    }
    
    if (averages.stressLevel <= 3) {
      insights.push('Your stress levels are well-managed.')
    } else if (averages.stressLevel > 4) {
      insights.push('Consider stress-reduction activities like breathing exercises.')
    }
    
    return { period, range, dailyData, averages, insights }
    
  } catch (error) {
    console.error('Error in getMoodAnalytics:', error)
    return null
  }
}

export const getWellnessAnalytics = async (
  userId: string,
  period: TimePeriod,
  referenceDate?: Date
): Promise<WellnessAnalytics | null> => {
  const range = getPeriodRange(period, referenceDate)
  
  try {
    const [hydrationResult, breathingResult] = await Promise.all([
      supabase
        .from('hydration_logs')
        .select('log_date, glasses_count, daily_goal')
        .eq('user_id', userId)
        .gte('log_date', range.startDate)
        .lte('log_date', range.endDate)
        .order('log_date', { ascending: true }),
      supabase
        .from('breathing_sessions')
        .select('session_date, completed_count, daily_goal')
        .eq('user_id', userId)
        .gte('session_date', range.startDate)
        .lte('session_date', range.endDate)
        .order('session_date', { ascending: true })
    ])
    
    const hydrationData = hydrationResult.data || []
    const breathingData = breathingResult.data || []
    
    const hydration: HydrationAnalytics = {
      dailyData: hydrationData.map(h => ({
        date: h.log_date,
        glasses: h.glasses_count || 0,
        goal: h.daily_goal || 10
      })),
      averageGlasses: hydrationData.length > 0
        ? Math.round(hydrationData.reduce((sum, h) => sum + (h.glasses_count || 0), 0) / hydrationData.length * 10) / 10
        : 0,
      daysOnTarget: hydrationData.filter(h => (h.glasses_count || 0) >= (h.daily_goal || 10)).length,
      totalDays: hydrationData.length
    }
    
    const breathing: BreathingAnalytics = {
      dailyData: breathingData.map(b => ({
        date: b.session_date,
        sessions: b.completed_count || 0,
        goal: b.daily_goal || 6
      })),
      averageSessions: breathingData.length > 0
        ? Math.round(breathingData.reduce((sum, b) => sum + (b.completed_count || 0), 0) / breathingData.length * 10) / 10
        : 0,
      daysOnTarget: breathingData.filter(b => (b.completed_count || 0) >= (b.daily_goal || 6)).length,
      totalDays: breathingData.length
    }
    
    return { period, range, hydration, breathing }
    
  } catch (error) {
    console.error('Error in getWellnessAnalytics:', error)
    return null
  }
}

export const getComprehensiveAnalytics = async (
  userId: string,
  period: TimePeriod,
  referenceDate?: Date
): Promise<ComprehensiveAnalytics> => {
  const [nutrition, mood, wellness] = await Promise.all([
    getNutritionAnalytics(userId, period, referenceDate),
    getMoodAnalytics(userId, period, referenceDate),
    getWellnessAnalytics(userId, period, referenceDate)
  ])
  
  const insights: string[] = []
  let overallScore = 0
  let scoreFactors = 0
  
  if (nutrition.totals.totalMeals > 0) {
    const completionRate = nutrition.averages.mealCompletionRate
    overallScore += completionRate
    scoreFactors++
    
    if (completionRate >= 80) {
      insights.push('Excellent meal tracking consistency!')
    } else if (completionRate >= 50) {
      insights.push('Good progress! Keep completing your planned meals.')
    } else if (completionRate > 0) {
      insights.push('Try to complete more of your planned meals.')
    }
    
    const streakDays = calculateStreakDays(nutrition.dailyData)
    if (streakDays >= 7) {
      insights.push(`Amazing ${streakDays}-day streak! Keep it going!`)
    } else if (streakDays >= 3) {
      insights.push(`You're on a ${streakDays}-day streak!`)
    }
  } else {
    insights.push('Start planning meals to track your progress!')
  }
  
  if (mood?.averages.mood && mood.averages.mood > 0) {
    overallScore += (mood.averages.mood / 5) * 100
    scoreFactors++
  }
  
  if (wellness?.hydration.totalDays && wellness.hydration.totalDays > 0) {
    const hydrationScore = (wellness.hydration.daysOnTarget / wellness.hydration.totalDays) * 100
    overallScore += hydrationScore
    scoreFactors++
  }
  
  const summary: AnalyticsSummary = {
    overallScore: scoreFactors > 0 ? Math.round(overallScore / scoreFactors) : 0,
    streakDays: calculateStreakDays(nutrition.dailyData),
    bestDay: findBestDay(nutrition.dailyData),
    insights: insights.slice(0, 3)
  }
  
  return { nutrition, mood, wellness, summary }
}

function calculateStreakDays(dailyData: DailyNutritionData[]): number {
  if (dailyData.length === 0) return 0
  
  let streak = 0
  const sortedData = [...dailyData].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  
  for (const day of sortedData) {
    if (day.completedMeals > 0) {
      streak++
    } else {
      break
    }
  }
  
  return streak
}

function findBestDay(dailyData: DailyNutritionData[]): string | null {
  if (dailyData.length === 0) return null
  
  const bestDay = dailyData.reduce((best, current) => {
    const currentScore = current.totalMeals > 0 ? current.completedMeals / current.totalMeals : 0
    const bestScore = best.totalMeals > 0 ? best.completedMeals / best.totalMeals : 0
    return currentScore > bestScore ? current : best
  })
  
  return bestDay.completedMeals > 0 ? bestDay.date : null
}

export const analyticsService = {
  getNutritionAnalytics,
  getMoodAnalytics,
  getWellnessAnalytics,
  getComprehensiveAnalytics,
  getPeriodRange
}

export default analyticsService
