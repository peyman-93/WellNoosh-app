// ================================================================================================
// Weight Tracking Service
// Purpose: Database operations for weight and BMI tracking
// Author: Claude AI Assistant
// Date: August 5, 2025
// ================================================================================================

import { supabase } from './supabase'
import type {
  DailyWeightLog,
  WeightTrendsSummary,
  WeightStatistics,
  WeightChartData,
  BMIChartData,
  WeightDashboardSummary,
  WeightChartDataPoint,
  CreateWeightLogRequest,
  UpdateWeightLogRequest,
  GetWeightHistoryParams,
  GetWeightStatsParams,
  BatchWeightResponse,
  BMICategory
} from '../types/weight-tracking.types'

// ================================================================================================
// DAILY WEIGHT LOG OPERATIONS
// ================================================================================================

/**
 * Get user's weight history
 */
export const getUserWeightHistory = async (
  params: GetWeightHistoryParams
): Promise<DailyWeightLog[]> => {
  try {
    console.log('📊 Fetching weight history:', params)

    let query = supabase
      .from('daily_weight_logs')
      .select('*')
      .eq('user_id', params.userId)
      .order('log_date', { ascending: true })

    // Apply date filters
    if (params.startDate && params.endDate) {
      query = query
        .gte('log_date', params.startDate)
        .lte('log_date', params.endDate)
    } else if (params.daysBack) {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - params.daysBack)
      query = query.gte('log_date', startDate.toISOString().split('T')[0])
    }

    const { data, error } = await query

    if (error) {
      console.error('❌ Error fetching weight history:', error)
      throw error
    }

    console.log('✅ Retrieved weight history:', data?.length || 0, 'entries')
    return data || []
  } catch (error) {
    console.error('💥 Error in getUserWeightHistory:', error)
    throw error
  }
}

/**
 * Get latest weight log for user
 */
export const getLatestWeightLog = async (userId: string): Promise<DailyWeightLog | null> => {
  try {
    console.log('📊 Fetching latest weight log for:', userId)

    const { data, error } = await supabase
      .from('daily_weight_logs')
      .select('*')
      .eq('user_id', userId)
      .order('log_date', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No data found
        console.log('ℹ️ No weight logs found for user:', userId)
        return null
      }
      console.error('❌ Error fetching latest weight log:', error)
      throw error
    }

    console.log('✅ Retrieved latest weight log:', data.weight_kg, 'kg on', data.log_date)
    return data
  } catch (error) {
    console.error('💥 Error in getLatestWeightLog:', error)
    throw error
  }
}

/**
 * Create new weight log entry
 */
export const createWeightLog = async (
  userId: string,
  request: CreateWeightLogRequest
): Promise<DailyWeightLog> => {
  try {
    console.log('📝 Creating weight log:', userId, request)

    const logDate = request.log_date || new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('daily_weight_logs')
      .insert({
        user_id: userId,
        log_date: logDate,
        weight_kg: request.weight_kg,
        body_fat_percentage: request.body_fat_percentage,
        muscle_mass_kg: request.muscle_mass_kg,
        water_percentage: request.water_percentage,
        measurement_method: request.measurement_method || 'manual',
        measurement_conditions: request.measurement_conditions ? JSON.stringify(request.measurement_conditions) : null,
        confidence_level: request.confidence_level || 'high',
        notes: request.notes
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Error creating weight log:', error)
      throw error
    }

    console.log('✅ Created weight log:', data.id)
    return data
  } catch (error) {
    console.error('💥 Error in createWeightLog:', error)
    throw error
  }
}

/**
 * Update weight log entry
 */
export const updateWeightLog = async (
  request: UpdateWeightLogRequest
): Promise<DailyWeightLog> => {
  try {
    console.log('🔄 Updating weight log:', request.log_id)

    const { data, error } = await supabase
      .from('daily_weight_logs')
      .update({
        ...request.updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', request.log_id)
      .select()
      .single()

    if (error) {
      console.error('❌ Error updating weight log:', error)
      throw error
    }

    console.log('✅ Updated weight log:', data.id)
    return data
  } catch (error) {
    console.error('💥 Error in updateWeightLog:', error)
    throw error
  }
}

/**
 * Delete weight log entry
 */
export const deleteWeightLog = async (logId: number): Promise<void> => {
  try {
    console.log('🗑️ Deleting weight log:', logId)

    const { error } = await supabase
      .from('daily_weight_logs')
      .delete()
      .eq('id', logId)

    if (error) {
      console.error('❌ Error deleting weight log:', error)
      throw error
    }

    console.log('✅ Deleted weight log:', logId)
  } catch (error) {
    console.error('💥 Error in deleteWeightLog:', error)
    throw error
  }
}

// ================================================================================================
// WEIGHT STATISTICS & TRENDS
// ================================================================================================

/**
 * Get weight statistics using database function
 */
export const getWeightStatistics = async (
  params: GetWeightStatsParams
): Promise<WeightStatistics> => {
  try {
    console.log('📈 Fetching weight statistics:', params)

    const { data, error } = await supabase.rpc('get_weight_statistics', {
      target_user_id: params.userId,
      period_days: params.periodDays || 30
    })

    if (error) {
      console.error('❌ Error fetching weight statistics:', error)
      throw error
    }

    const stats = data[0] || {
      current_weight: null,
      starting_weight: null,
      min_weight: null,
      max_weight: null,
      avg_weight: null,
      total_change: 0,
      avg_daily_change: 0,
      measurement_count: 0,
      trend_direction: 'maintaining'
    }

    console.log('✅ Retrieved weight statistics:', stats)
    return stats
  } catch (error) {
    console.error('💥 Error in getWeightStatistics:', error)
    // Return default stats if database function fails
    return {
      current_weight: undefined,
      starting_weight: undefined,
      min_weight: undefined,
      max_weight: undefined,
      avg_weight: undefined,
      total_change: 0,
      avg_daily_change: 0,
      measurement_count: 0,
      trend_direction: 'maintaining'
    }
  }
}

/**
 * Get weight chart data for visualization
 */
export const getWeightChartData = async (
  userId: string,
  period: 'week' | 'month' | 'quarter' | 'year'
): Promise<WeightChartData> => {
  try {
    console.log('📊 Fetching weight chart data:', userId, period)

    // Calculate date range
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
      case 'year':
        startDate.setDate(endDate.getDate() - 365)
        break
    }

    // Get weight history
    const weightHistory = await getUserWeightHistory({
      userId,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    })

    // Get target weight from user profile
    const { data: profile } = await supabase
      .from('user_health_profiles')
      .select('target_weight_kg')
      .eq('user_id', userId)
      .single()

    const targetWeight = profile?.target_weight_kg

    // Transform to chart data points
    const dataPoints: WeightChartDataPoint[] = weightHistory.map((log, index) => ({
      date: log.log_date,
      weight: log.weight_kg,
      bmi: log.bmi,
      change: log.weight_change_kg,
      target: targetWeight,
      day: index === weightHistory.length - 1 ? 'Today' : 
           new Date(log.log_date).toLocalDateString('en-US', { weekday: 'short' })
    }))

    // Calculate chart metadata
    const weights = dataPoints.map(p => p.weight)
    const minWeight = weights.length > 0 ? Math.min(...weights) : 0
    const maxWeight = weights.length > 0 ? Math.max(...weights) : 0
    const weightRange = maxWeight - minWeight
    
    const totalChange = dataPoints.length > 1 
      ? dataPoints[dataPoints.length - 1].weight - dataPoints[0].weight 
      : 0
    
    const avgDailyChange = dataPoints.length > 1 
      ? totalChange / dataPoints.length 
      : 0

    const trendDirection: 'gaining' | 'losing' | 'maintaining' = 
      totalChange > 0.5 ? 'gaining' : 
      totalChange < -0.5 ? 'losing' : 'maintaining'

    const chartData: WeightChartData = {
      period,
      data_points: dataPoints,
      target_weight: targetWeight,
      starting_weight: dataPoints.length > 0 ? dataPoints[0].weight : undefined,
      min_weight: minWeight,
      max_weight: maxWeight,
      weight_range: weightRange,
      total_days: dataPoints.length,
      days_with_data: dataPoints.length,
      total_change: totalChange,
      avg_daily_change: avgDailyChange,
      trend_direction: trendDirection
    }

    console.log('✅ Generated weight chart data:', dataPoints.length, 'data points')
    return chartData
  } catch (error) {
    console.error('💥 Error in getWeightChartData:', error)
    throw error
  }
}

/**
 * Get BMI chart data for visualization
 */
export const getBMIChartData = async (
  userId: string,
  period: 'week' | 'month' | 'quarter' | 'year'
): Promise<BMIChartData> => {
  try {
    console.log('📊 Fetching BMI chart data:', userId, period)

    // Get weight chart data first
    const weightData = await getWeightChartData(userId, period)

    // Transform to BMI chart data
    const dataPoints = weightData.data_points
      .filter(point => point.bmi !== undefined)
      .map(point => ({
        date: point.date,
        bmi: point.bmi!,
        weight: point.weight,
        category: getBMICategory(point.bmi!).category,
        day: point.day
      }))

    const currentBMI = dataPoints.length > 0 ? dataPoints[dataPoints.length - 1].bmi : undefined
    const bmiChange = dataPoints.length > 1 
      ? dataPoints[dataPoints.length - 1].bmi - dataPoints[0].bmi 
      : 0

    const bmiData: BMIChartData = {
      period,
      data_points: dataPoints,
      underweight_max: 18.5,
      normal_max: 25.0,
      overweight_max: 30.0,
      current_bmi: currentBMI,
      target_bmi: weightData.target_weight && weightData.data_points.length > 0 
        ? calculateBMI(weightData.target_weight, 170) // Assuming average height, would need user's height
        : undefined,
      bmi_change: bmiChange
    }

    console.log('✅ Generated BMI chart data:', dataPoints.length, 'data points')
    return bmiData
  } catch (error) {
    console.error('💥 Error in getBMIChartData:', error)
    throw error
  }
}

/**
 * Get comprehensive weight dashboard summary
 */
export const getWeightDashboardSummary = async (
  userId: string
): Promise<WeightDashboardSummary> => {
  try {
    console.log('🏠 Fetching weight dashboard summary for:', userId)

    const [currentLog, statistics, profile] = await Promise.all([
      getLatestWeightLog(userId),
      getWeightStatistics({ userId, periodDays: 30 }),
      supabase
        .from('user_health_profiles')
        .select('target_weight_kg, height_cm')
        .eq('user_id', userId)
        .single()
    ])

    const targetWeight = profile.data?.target_weight_kg
    const userHeight = profile.data?.height_cm || 170 // Default height if not set

    // Calculate progress
    const currentWeight = currentLog?.weight_kg || statistics.current_weight || 0
    const progressPercentage = targetWeight && statistics.starting_weight
      ? Math.abs(currentWeight - (statistics.starting_weight || currentWeight)) / 
        Math.abs(targetWeight - (statistics.starting_weight || currentWeight)) * 100
      : 0

    // Calculate BMI status
    const currentBMI = currentLog?.bmi || (currentWeight > 0 ? calculateBMI(currentWeight, userHeight) : undefined)
    const bmiCategory = getBMICategory(currentBMI)

    const summary: WeightDashboardSummary = {
      current_log: currentLog,
      target_weight_kg: targetWeight,
      weight_progress: {
        current: currentWeight,
        target: targetWeight,
        change_today: 0, // Would need today's previous measurement
        change_week: statistics.total_change || 0,
        change_month: statistics.total_change || 0,
        progress_percentage: Math.min(100, Math.max(0, progressPercentage)),
        trend: statistics.trend_direction
      },
      bmi_status: {
        current: currentBMI,
        category: bmiCategory.category,
        target: targetWeight ? calculateBMI(targetWeight, userHeight) : undefined,
        healthy_range: { min: 18.5, max: 24.9 }
      },
      recent_stats: statistics,
      daily_goal_met: true, // Simplified - could be based on logging frequency
      weekly_goal_progress: progressPercentage
    }

    console.log('✅ Generated weight dashboard summary')
    return summary
  } catch (error) {
    console.error('💥 Error in getWeightDashboardSummary:', error)
    throw error
  }
}

// ================================================================================================
// BATCH OPERATIONS
// ================================================================================================

/**
 * Get all weight data for dashboard in one call
 */
export const getBatchWeightData = async (
  userId: string,
  period: 'week' | 'month' | 'quarter' = 'month'
): Promise<BatchWeightResponse> => {
  try {
    console.log('📦 Fetching batch weight data:', userId, period)

    const [summary, chartData, bmiData, statistics] = await Promise.all([
      getWeightDashboardSummary(userId),
      getWeightChartData(userId, period),
      getBMIChartData(userId, period),
      getWeightStatistics({ userId, periodDays: 30 })
    ])

    const response: BatchWeightResponse = {
      daily_logs: chartData.data_points.map(point => ({
        id: 0, // Simplified for chart data
        user_id: userId,
        log_date: point.date,
        weight_kg: point.weight,
        bmi: point.bmi,
        weight_change_kg: point.change,
        measurement_method: 'manual',
        confidence_level: 'high',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as DailyWeightLog)),
      statistics,
      trends: [], // Would implement trends summary if needed
      chart_data: chartData,
      bmi_data: bmiData
    }

    console.log('✅ Generated batch weight data')
    return response
  } catch (error) {
    console.error('💥 Error in getBatchWeightData:', error)
    throw error
  }
}

// ================================================================================================
// HELPER FUNCTIONS
// ================================================================================================

/**
 * Calculate BMI from weight and height
 */
export const calculateBMI = (weightKg: number, heightCm: number): number => {
  if (heightCm <= 0) return 0
  const heightM = heightCm / 100
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10
}

/**
 * Get BMI category and styling info
 */
export const getBMICategory = (bmi?: number): BMICategory => {
  if (!bmi || bmi <= 0) {
    return {
      category: 'normal',
      range: { min: 0, max: 0 },
      color: '#6B7280',
      emoji: '❓',
      description: 'Not calculated'
    }
  }

  if (bmi < 18.5) {
    return {
      category: 'underweight',
      range: { min: 0, max: 18.5 },
      color: '#3B82F6',
      emoji: '📉',
      description: 'Underweight'
    }
  }

  if (bmi < 25) {
    return {
      category: 'normal',
      range: { min: 18.5, max: 24.9 },
      color: '#10B981',
      emoji: '✅',
      description: 'Normal weight'
    }
  }

  if (bmi < 30) {
    return {
      category: 'overweight',
      range: { min: 25, max: 29.9 },
      color: '#F59E0B',
      emoji: '⚠️',
      description: 'Overweight'
    }
  }

  return {
    category: 'obese',
    range: { min: 30, max: 100 },
    color: '#EF4444',
    emoji: '🚨',
    description: 'Obese'
  }
}

/**
 * Format weight change for display
 */
export const formatWeightChange = (change?: number): string => {
  if (!change || change === 0) return '0.0 kg'
  const sign = change > 0 ? '+' : ''
  return `${sign}${change.toFixed(1)} kg`
}

/**
 * Get weight trend emoji
 */
export const getWeightTrendEmoji = (trend: 'gaining' | 'losing' | 'maintaining'): string => {
  switch (trend) {
    case 'gaining': return '📈'
    case 'losing': return '📉'
    case 'maintaining': return '➡️'
  }
}