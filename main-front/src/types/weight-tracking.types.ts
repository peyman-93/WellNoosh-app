// ================================================================================================
// Weight Tracking Type Definitions
// Purpose: TypeScript interfaces for weight and BMI tracking
// Author: Claude AI Assistant
// Date: August 5, 2025
// ================================================================================================

// ================================================================================================
// CORE WEIGHT DATA TYPES
// ================================================================================================

/**
 * Daily weight log entry from database
 * Maps to daily_weight_logs table
 */
export interface DailyWeightLog {
  id: number
  user_id: string
  log_date: string // ISO date string (YYYY-MM-DD)
  
  // Weight measurements
  weight_kg: number
  body_fat_percentage?: number
  muscle_mass_kg?: number
  water_percentage?: number
  
  // Calculated values
  bmi?: number
  height_cm?: number // Reference height for BMI calculation
  
  // Measurement context
  measurement_time?: string // HH:MM format
  measurement_method: 'manual' | 'smart_scale' | 'gym_scale' | 'medical'
  measurement_conditions?: string[] // ['fasted', 'morning', 'after_meal', etc.]
  
  // Progress tracking
  weight_change_kg?: number
  weight_change_percentage?: number
  days_since_last_measurement?: number
  
  // Measurement quality
  confidence_level: 'low' | 'medium' | 'high'
  notes?: string
  
  // Timestamps
  created_at: string
  updated_at: string
}

/**
 * Weight trends summary for performance
 * Maps to weight_trends_summary table
 */
export interface WeightTrendsSummary {
  user_id: string
  period_type: 'week' | 'month' | 'quarter' | 'year'
  period_start: string
  period_end: string
  
  // Weight statistics
  starting_weight_kg?: number
  ending_weight_kg?: number
  min_weight_kg?: number
  max_weight_kg?: number
  avg_weight_kg?: number
  
  // Changes and trends
  total_weight_change_kg?: number
  avg_daily_change_kg?: number
  weight_trend?: 'gaining' | 'losing' | 'maintaining' | 'fluctuating'
  
  // BMI statistics
  starting_bmi?: number
  ending_bmi?: number
  avg_bmi?: number
  
  // Progress tracking
  measurements_count: number
  goal_progress_percentage?: number
  target_weight_kg?: number
  
  calculated_at: string
}

/**
 * Weight statistics calculation result
 */
export interface WeightStatistics {
  current_weight?: number
  starting_weight?: number
  min_weight?: number
  max_weight?: number
  avg_weight?: number
  total_change?: number
  avg_daily_change?: number
  measurement_count: number
  trend_direction: 'gaining' | 'losing' | 'maintaining'
}

// ================================================================================================
// CHART DATA TYPES
// ================================================================================================

/**
 * Chart data point for weight visualization
 */
export interface WeightChartDataPoint {
  date: string // ISO date string
  weight: number
  bmi?: number
  change?: number // Change from previous measurement
  target?: number // Target weight if available
  day?: string // Display name like 'Today', 'Mon', etc.
}

/**
 * Chart-ready data for weight visualization
 */
export interface WeightChartData {
  period: 'week' | 'month' | 'quarter' | 'year'
  data_points: WeightChartDataPoint[]
  target_weight?: number
  starting_weight?: number
  
  // Chart metadata
  min_weight: number
  max_weight: number
  weight_range: number
  
  // Summary stats
  total_days: number
  days_with_data: number
  total_change: number
  avg_daily_change: number
  trend_direction: 'gaining' | 'losing' | 'maintaining'
}

/**
 * BMI-specific chart data
 */
export interface BMIChartData {
  period: 'week' | 'month' | 'quarter' | 'year'
  data_points: Array<{
    date: string
    bmi: number
    weight: number
    category: 'underweight' | 'normal' | 'overweight' | 'obese'
    day?: string
  }>
  
  // BMI ranges for visualization
  underweight_max: number // 18.5
  normal_max: number // 25.0
  overweight_max: number // 30.0
  
  current_bmi?: number
  target_bmi?: number
  bmi_change: number
}

// ================================================================================================
// UI COMPONENT TYPES
// ================================================================================================

/**
 * Weight dashboard summary
 */
export interface WeightDashboardSummary {
  current_log: DailyWeightLog | null
  target_weight_kg?: number
  
  // Progress indicators
  weight_progress: {
    current: number
    target?: number
    change_today?: number
    change_week?: number
    change_month?: number
    progress_percentage?: number
    trend: 'gaining' | 'losing' | 'maintaining'
  }
  
  bmi_status: {
    current?: number
    category: 'underweight' | 'normal' | 'overweight' | 'obese'
    target?: number
    healthy_range: { min: number; max: number }
  }
  
  // Recent trends
  recent_stats: WeightStatistics
  
  // Goals
  daily_goal_met: boolean
  weekly_goal_progress?: number
}

/**
 * Weight chart component props
 */
export interface WeightChartProps {
  data: WeightChartData | null
  loading: boolean
  error?: string | null
  period: 'week' | 'month' | 'quarter' | 'year'
  onPeriodChange?: (period: 'week' | 'month' | 'quarter' | 'year') => void
  height?: number
  showTarget?: boolean
  targetWeight?: number
  startWeight?: number
}

/**
 * BMI chart component props
 */
export interface BMIChartProps {
  data: BMIChartData | null
  loading: boolean
  error?: string | null
  period: 'week' | 'month' | 'quarter' | 'year'
  onPeriodChange?: (period: 'week' | 'month' | 'quarter' | 'year') => void
  height?: number
  showCategories?: boolean
}

/**
 * Weight logging modal props
 */
export interface WeightLogModalProps {
  visible: boolean
  onClose: () => void
  onSave: (weightData: CreateWeightLogRequest) => void
  loading?: boolean
  initialWeight?: number
}

// ================================================================================================
// SERVICE FUNCTION TYPES
// ================================================================================================

/**
 * Create weight log request
 */
export interface CreateWeightLogRequest {
  weight_kg: number
  body_fat_percentage?: number
  muscle_mass_kg?: number
  water_percentage?: number
  measurement_method?: 'manual' | 'smart_scale' | 'gym_scale' | 'medical'
  measurement_conditions?: string[]
  confidence_level?: 'low' | 'medium' | 'high'
  notes?: string
  log_date?: string // ISO date, defaults to today
}

/**
 * Update weight log request
 */
export interface UpdateWeightLogRequest {
  log_id: number
  updates: Partial<CreateWeightLogRequest>
}

/**
 * Get weight history parameters
 */
export interface GetWeightHistoryParams {
  userId: string
  startDate?: string // ISO date
  endDate?: string // ISO date
  daysBack?: number // Alternative to date range
}

/**
 * Get weight statistics parameters
 */
export interface GetWeightStatsParams {
  userId: string
  periodDays?: number
}

// ================================================================================================
// API RESPONSE TYPES
// ================================================================================================

/**
 * Standard API response wrapper for weight data
 */
export interface WeightApiResponse<T> {
  data: T | null
  error: string | null
  loading: boolean
  lastUpdated?: string
}

/**
 * Batch weight data response
 */
export interface BatchWeightResponse {
  daily_logs: DailyWeightLog[]
  statistics: WeightStatistics
  trends: WeightTrendsSummary[]
  chart_data: WeightChartData
  bmi_data: BMIChartData
}

// ================================================================================================
// UTILITY TYPES
// ================================================================================================

/**
 * BMI category calculation
 */
export interface BMICategory {
  category: 'underweight' | 'normal' | 'overweight' | 'obese'
  range: { min: number; max: number }
  color: string
  emoji: string
  description: string
}

/**
 * Weight goal types
 */
export type WeightGoalType = 'lose' | 'gain' | 'maintain'

/**
 * Weight change trend
 */
export type WeightTrend = 'gaining' | 'losing' | 'maintaining' | 'fluctuating'

/**
 * Time period for weight analysis
 */
export type WeightPeriod = 'week' | 'month' | 'quarter' | 'year'

/**
 * Measurement method types
 */
export type MeasurementMethod = 'manual' | 'smart_scale' | 'gym_scale' | 'medical'

/**
 * Measurement conditions
 */
export type MeasurementCondition = 'fasted' | 'after_meal' | 'morning' | 'evening' | 'before_workout' | 'after_workout'

// ================================================================================================
// VALIDATION TYPES
// ================================================================================================

/**
 * Weight log validation schema
 */
export interface WeightLogValidation {
  weight_kg: { min: number; max: number; required: true }
  body_fat_percentage: { min: number; max: number; required: false }
  muscle_mass_kg: { min: number; max: number; required: false }
  water_percentage: { min: number; max: number; required: false }
}

/**
 * Weight goal validation
 */
export interface WeightGoalValidation {
  target_weight_kg: { min: number; max: number; required: true }
  goal_type: { values: WeightGoalType[]; required: true }
  timeline_weeks: { min: number; max: number; required: false }
}

export default {
  DailyWeightLog,
  WeightTrendsSummary,
  WeightStatistics,
  WeightChartData,
  BMIChartData,
  WeightDashboardSummary,
  WeightChartProps,
  BMIChartProps
}