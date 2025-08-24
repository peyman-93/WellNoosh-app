// ================================================================================================
// Nutrition Tracking Type Definitions
// Purpose: TypeScript interfaces for nutrition tracking and visualization
// Author: Claude AI Assistant
// Date: August 5, 2025
// ================================================================================================

// ================================================================================================
// CORE NUTRITION DATA TYPES
// ================================================================================================

/**
 * Daily nutrition summary from database
 * Maps to daily_nutrition_summary table
 */
export interface DailyNutritionData {
  user_id: string
  log_date: string // ISO date string (YYYY-MM-DD)
  
  // Planned meal totals (from meal plan)
  planned_calories: number
  planned_protein_g: number
  planned_carbs_g: number
  planned_fat_g: number
  planned_fiber_g: number
  planned_sugar_g: number
  planned_sodium_mg: number
  planned_meals_count: number
  completed_meals_count: number
  
  // Additional food totals (user added)
  additional_calories: number
  additional_protein_g: number
  additional_carbs_g: number
  additional_fat_g: number
  additional_fiber_g: number
  additional_sugar_g: number
  additional_sodium_mg: number
  additional_entries_count: number
  
  // Daily totals (computed columns)
  total_calories: number
  total_protein_g: number
  total_carbs_g: number
  total_fat_g: number
  total_fiber_g: number
  total_sugar_g: number
  total_sodium_mg: number
  total_entries_count: number
  
  // Progress tracking
  completion_percentage: number
  calorie_goal?: number
  calorie_deficit_surplus?: number
  
  // Meal timing analysis
  first_meal_time?: string // HH:MM format
  last_meal_time?: string // HH:MM format
  eating_window_hours?: number
  
  // Quality metrics
  whole_foods_percentage: number
  meal_plan_adherence_percentage: number
  
  // Timestamps
  created_at: string
  updated_at: string
}

/**
 * User's daily nutrition goals/targets
 */
export interface NutritionGoals {
  user_id: string
  daily_calories: number
  daily_protein_g: number
  daily_carbs_g: number
  daily_fat_g: number
  daily_fiber_g: number
  daily_sodium_mg?: number
  daily_sugar_g?: number
  
  // Goal source
  source: 'user_set' | 'calculated' | 'default'
  last_updated: string
}

/**
 * Historical nutrition data for trends and charts
 */
export interface NutritionHistory {
  user_id: string
  date_range: {
    start_date: string
    end_date: string
  }
  daily_data: DailyNutritionData[]
  goals: NutritionGoals
  
  // Calculated trends
  trends: {
    avg_calories: number
    avg_protein_g: number
    avg_carbs_g: number
    avg_fat_g: number
    avg_completion_rate: number
    
    // Weekly comparisons
    calories_trend: 'increasing' | 'decreasing' | 'stable'
    completion_trend: 'improving' | 'declining' | 'stable'
  }
}

// ================================================================================================
// CHART DATA TYPES
// ================================================================================================

/**
 * Chart data point for nutrition visualization
 */
export interface NutritionChartDataPoint {
  date: string // ISO date string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber?: number
  
  // Additional context
  completion_percentage: number
  goal_calories?: number
  is_complete_day: boolean // Has any nutrition data
}

/**
 * Chart-ready data for nutrition visualization
 */
export interface NutritionChartData {
  period: 'week' | 'month' | 'quarter'
  data_points: NutritionChartDataPoint[]
  goals: NutritionGoals
  
  // Chart metadata
  max_calories: number
  max_protein: number
  max_carbs: number
  max_fat: number
  
  // Summary stats
  total_days: number
  days_with_data: number
  avg_completion_rate: number
}

// ================================================================================================
// UI COMPONENT TYPES
// ================================================================================================

/**
 * Nutrition summary for dashboard display
 */
export interface NutritionDashboardSummary {
  today: DailyNutritionData | null
  goals: NutritionGoals
  
  // Progress indicators
  calorie_progress: {
    current: number
    goal: number
    percentage: number
    status: 'under' | 'on_track' | 'over'
  }
  
  protein_progress: {
    current: number
    goal: number
    percentage: number
    status: 'under' | 'on_track' | 'over'
  }
  
  // Today's meal completion
  meal_completion: {
    completed: number
    total: number
    percentage: number
  }
  
  // Recent trends (last 7 days)
  recent_trends: {
    avg_calories: number
    avg_completion_rate: number
    trend_direction: 'up' | 'down' | 'stable'
  }
}

/**
 * Chart component props
 */
export interface NutritionChartProps {
  data: NutritionChartData | null
  loading: boolean
  error?: string | null
  period: 'week' | 'month' | 'quarter'
  onPeriodChange?: (period: 'week' | 'month' | 'quarter') => void
  height?: number
  showGoals?: boolean
}

/**
 * No data state for charts
 */
export interface NoDataState {
  type: 'no_data' | 'loading' | 'error'
  title: string
  message: string
  action?: {
    text: string
    onPress: () => void
  }
}

// ================================================================================================
// SERVICE FUNCTION TYPES
// ================================================================================================

/**
 * Nutrition service function parameters
 */
export interface GetNutritionHistoryParams {
  userId: string
  startDate: string // ISO date
  endDate: string // ISO date
  includeGoals?: boolean
}

export interface GetNutritionSummaryParams {
  userId: string
  date?: string // ISO date, defaults to today
}

export interface UpdateNutritionGoalsParams {
  userId: string
  goals: Partial<NutritionGoals>
}

// ================================================================================================
// API RESPONSE TYPES
// ================================================================================================

/**
 * Standard API response wrapper
 */
export interface NutritionApiResponse<T> {
  data: T | null
  error: string | null
  loading: boolean
  lastUpdated?: string
}

/**
 * Batch nutrition data response
 */
export interface BatchNutritionResponse {
  daily_summaries: DailyNutritionData[]
  goals: NutritionGoals
  trends: NutritionHistory['trends']
  chart_data: NutritionChartData
}

// ================================================================================================
// UTILITY TYPES
// ================================================================================================

/**
 * Nutrition calculation helpers
 */
export type NutrientType = 'calories' | 'protein' | 'carbs' | 'fat' | 'fiber' | 'sugar' | 'sodium'

export interface NutrientValue {
  current: number
  goal?: number
  unit: string
  percentage?: number
}

export interface MacroBreakdown {
  protein_percentage: number
  carbs_percentage: number
  fat_percentage: number
  total_calories: number
}

/**
 * Time period for nutrition analysis
 */
export type NutritionPeriod = 'today' | 'week' | 'month' | 'quarter' | 'year'

/**
 * Nutrition trend direction
 */
export type TrendDirection = 'increasing' | 'decreasing' | 'stable'

// ================================================================================================
// VALIDATION TYPES
// ================================================================================================

/**
 * Validation schema for nutrition goals
 */
export interface NutritionGoalsValidation {
  daily_calories: { min: number; max: number; required: true }
  daily_protein_g: { min: number; max: number; required: true }
  daily_carbs_g: { min: number; max: number; required: true }
  daily_fat_g: { min: number; max: number; required: true }
  daily_fiber_g: { min: number; max: number; required: false }
}

export default {
  DailyNutritionData,
  NutritionGoals,
  NutritionHistory,
  NutritionChartData,
  NutritionDashboardSummary,
  NutritionChartProps,
  NoDataState
}