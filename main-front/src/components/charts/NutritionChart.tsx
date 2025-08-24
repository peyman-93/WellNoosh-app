import React from 'react'
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native'
import type { NutritionChartProps, NoDataState } from '../../types/nutrition-tracking.types'

const { width } = Dimensions.get('window')
const CHART_WIDTH = width - 40
const CHART_HEIGHT = 200

// Simple nutrition chart component for macro breakdown
export const NutritionChart: React.FC<NutritionChartProps> = ({
  data,
  loading,
  error,
  period = 'week',
  height = CHART_HEIGHT,
  showGoals = true
}) => {
  
  // No data state component
  const NoDataDisplay: React.FC<{ state: NoDataState }> = ({ state }) => (
    <View style={[styles.container, styles.noDataContainer]}>
      <Text style={styles.noDataTitle}>{state.title}</Text>
      <Text style={styles.noDataMessage}>{state.message}</Text>
      {state.action && (
        <TouchableOpacity onPress={state.action.onPress}>
          <Text style={styles.noDataAction}>
            {state.action.text}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  )

  // Loading state
  if (loading) {
    return (
      <NoDataDisplay 
        state={{
          type: 'loading',
          title: 'Loading nutrition data...',
          message: 'Please wait while we fetch your nutrition information.'
        }}
      />
    )
  }

  // Error state
  if (error) {
    return (
      <NoDataDisplay 
        state={{
          type: 'error',
          title: 'Unable to load data',
          message: error,
          action: {
            text: 'Tap to retry',
            onPress: () => console.log('Retry loading nutrition data')
          }
        }}
      />
    )
  }

  // No data available
  if (!data || data.data_points.length === 0) {
    return (
      <NoDataDisplay 
        state={{
          type: 'no_data',
          title: 'No nutrition data available',
          message: 'Complete your meals to see nutrition trends here. Start by planning and completing meals in your meal planner.',
          action: {
            text: 'Plan meals →',
            onPress: () => console.log('Navigate to meal planner')
          }
        }}
      />
    )
  }

  // Get latest data point for current display
  const latestData = data.data_points[data.data_points.length - 1]
  const goals = data.goals

  // Safety check for latestData
  if (!latestData) {
    return (
      <NoDataDisplay 
        state={{
          type: 'no_data',
          title: 'No nutrition data available',
          message: 'Complete your meals to see nutrition trends here. Start by planning and completing meals in your meal planner.',
          action: {
            text: 'Plan meals →',
            onPress: () => console.log('Navigate to meal planner')
          }
        }}
      />
    )
  }

  // Calculate macro percentages with safety checks
  const protein = latestData.protein || 0
  const carbs = latestData.carbs || 0
  const fat = latestData.fat || 0
  const calories = latestData.calories || 0
  const fiber = latestData.fiber || 0
  const completionPercentage = latestData.completion_percentage || 0

  const totalMacroCalories = (protein * 4) + (carbs * 4) + (fat * 9)
  const proteinPercentage = totalMacroCalories > 0 ? Math.round((protein * 4 / totalMacroCalories) * 100) : 0
  const carbsPercentage = totalMacroCalories > 0 ? Math.round((carbs * 4 / totalMacroCalories) * 100) : 0
  const fatPercentage = totalMacroCalories > 0 ? Math.round((fat * 9 / totalMacroCalories) * 100) : 0

  return (
    <View style={[styles.container, { height }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Today's Nutrition</Text>
        <Text style={styles.subtitle}>
          {calories} / {goals?.daily_calories || 0} calories
        </Text>
      </View>

      {/* Macro breakdown */}
      <View style={styles.macroContainer}>
        {/* Protein */}
        <View style={styles.macroItem}>
          <View style={[styles.macroBar, { width: `${Math.max(proteinPercentage, 5)}%`, backgroundColor: '#10B981' }]} />
          <View style={styles.macroDetails}>
            <Text style={styles.macroLabel}>Protein</Text>
            <Text style={styles.macroValue}>{Math.round(protein)}g ({proteinPercentage}%)</Text>
            {showGoals && (
              <Text style={styles.macroGoal}>Goal: {goals?.daily_protein_g || 0}g</Text>
            )}
          </View>
        </View>

        {/* Carbs */}
        <View style={styles.macroItem}>
          <View style={[styles.macroBar, { width: `${Math.max(carbsPercentage, 5)}%`, backgroundColor: '#3B82F6' }]} />
          <View style={styles.macroDetails}>
            <Text style={styles.macroLabel}>Carbs</Text>
            <Text style={styles.macroValue}>{Math.round(carbs)}g ({carbsPercentage}%)</Text>
            {showGoals && (
              <Text style={styles.macroGoal}>Goal: {goals?.daily_carbs_g || 0}g</Text>
            )}
          </View>
        </View>

        {/* Fat */}
        <View style={styles.macroItem}>
          <View style={[styles.macroBar, { width: `${Math.max(fatPercentage, 5)}%`, backgroundColor: '#F59E0B' }]} />
          <View style={styles.macroDetails}>
            <Text style={styles.macroLabel}>Fat</Text>
            <Text style={styles.macroValue}>{Math.round(fat)}g ({fatPercentage}%)</Text>
            {showGoals && (
              <Text style={styles.macroGoal}>Goal: {goals?.daily_fat_g || 0}g</Text>
            )}
          </View>
        </View>
      </View>

      {/* Summary stats */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Completion</Text>
          <Text style={styles.summaryValue}>{completionPercentage}%</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Days with data</Text>
          <Text style={styles.summaryValue}>{data.days_with_data}/{data.total_days}</Text>
        </View>
        {fiber > 0 && (
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Fiber</Text>
            <Text style={styles.summaryValue}>{Math.round(fiber)}g</Text>
          </View>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  noDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 150,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    fontFamily: 'Inter',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter',
    marginTop: 2,
  },
  macroContainer: {
    marginBottom: 16,
  },
  macroItem: {
    marginBottom: 12,
  },
  macroBar: {
    height: 6,
    borderRadius: 3,
    marginBottom: 4,
  },
  macroDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  macroLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Inter',
    flex: 1,
  },
  macroValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Inter',
    marginRight: 8,
  },
  macroGoal: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Inter',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Inter',
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Inter',
  },
  noDataTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Inter',
    marginBottom: 8,
    textAlign: 'center',
  },
  noDataMessage: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
  },
  noDataAction: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B8E23',
    fontFamily: 'Inter',
  },
})

export default NutritionChart