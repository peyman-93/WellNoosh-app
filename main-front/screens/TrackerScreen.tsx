import React, { useState, useEffect, useCallback } from 'react'
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity,
  Dimensions,
  Alert,
  RefreshControl,
  Modal,
  TextInput
} from 'react-native'
import { useAuth } from '../src/context/supabase-provider'
import { useUserData } from '../src/context/user-data-provider'
import { useNavigation } from '@react-navigation/native'
import { ScreenWrapper } from '../src/components/layout/ScreenWrapper'
import { supabase } from '../src/services/supabase'
import { CalorieChart } from '../src/components/charts/CalorieChart'
import { WeightChart } from '../src/components/charts/WeightChart'
import { BMIChart } from '../src/components/charts/BMIChart'
import { NutritionChart } from '../src/components/charts/NutritionChart'

// Import nutrition and weight tracking services
import { 
  getNutritionDashboardSummary, 
  getNutritionChartData,
  getBatchNutritionData 
} from '../src/services/nutritionTrackingService'
import { 
  getWeightChartData, 
  getBMIChartData,
  getWeightDashboardSummary,
  createWeightLog 
} from '../src/services/weightTrackingService'
import type { 
  NutritionDashboardSummary, 
  NutritionChartData,
  BatchNutritionResponse 
} from '../src/types/nutrition-tracking.types'
import type { 
  WeightChartData, 
  BMIChartData,
  WeightDashboardSummary 
} from '../src/types/weight-tracking.types'

const { width } = Dimensions.get('window')

interface HealthProfile {
  age?: number
  gender?: string
  height_cm?: number
  weight_kg?: number
  target_weight_kg?: number
  activity_level?: string
  health_goals?: any
  medical_conditions?: any
  medications?: any
  bmi?: number
  bmr?: number
  daily_calorie_goal?: number
  notes?: string
}

interface DietaryPreferences {
  dietary_restrictions?: string[]
  allergies?: string[]
  intolerances?: string[]
  cooking_time_preference?: string
}

interface HealthMetric {
  label: string
  value: string
  emoji: string
  color: string
  unit: string
  trend?: 'up' | 'down' | 'stable'
}

interface Achievement {
  id: string
  title: string
  description: string
  emoji: string
  earned: boolean
  date?: string
}

// Helper functions
const parseJSONBArray = (jsonbData: any): string[] => {
  if (!jsonbData) return []
  if (Array.isArray(jsonbData)) return jsonbData
  if (typeof jsonbData === 'string') {
    try {
      const parsed = JSON.parse(jsonbData)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

const calculateBMIStatus = (bmi: number | undefined): { status: string; color: string; emoji: string } => {
  if (!bmi) return { status: 'Not calculated', color: '#6B7280', emoji: '❓' }
  
  if (bmi < 18.5) return { status: 'Underweight', color: '#3B82F6', emoji: '📉' }
  if (bmi < 25) return { status: 'Normal weight', color: '#10B981', emoji: '✅' }
  if (bmi < 30) return { status: 'Overweight', color: '#F59E0B', emoji: '⚠️' }
  return { status: 'Obese', color: '#EF4444', emoji: '🚨' }
}

const calculateWeightProgress = (current: number | undefined, target: number | undefined): number => {
  if (!current || !target) return 0
  const difference = Math.abs(target - current)
  if (difference === 0) return 100
  // Simple progress calculation - can be enhanced with starting weight
  return Math.min(100, Math.max(0, 100 - (difference * 5))) // Example calculation
}

export default function TrackerScreen() {
  const { session } = useAuth()
  const { userData } = useUserData()
  const navigation = useNavigation()
  const [healthProfile, setHealthProfile] = useState<HealthProfile>({})
  const [dietaryPrefs, setDietaryPrefs] = useState<DietaryPreferences>({})
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  
  // Real nutrition tracking data
  const [nutritionSummary, setNutritionSummary] = useState<NutritionDashboardSummary | null>(null)
  const [nutritionChartData, setNutritionChartData] = useState<NutritionChartData | null>(null)
  const [nutritionLoading, setNutritionLoading] = useState(true)
  const [nutritionError, setNutritionError] = useState<string | null>(null)
  
  // Real weight tracking data
  const [weightSummary, setWeightSummary] = useState<WeightDashboardSummary | null>(null)
  const [weightChartData, setWeightChartData] = useState<WeightChartData | null>(null)
  const [bmiChartData, setBmiChartData] = useState<BMIChartData | null>(null)
  const [weightLoading, setWeightLoading] = useState(true)
  const [weightError, setWeightError] = useState<string | null>(null)
  
  // Weight logging modal state
  const [showWeightModal, setShowWeightModal] = useState(false)
  const [weightInput, setWeightInput] = useState('')
  const [loggingWeight, setLoggingWeight] = useState(false)

  // Load nutrition data from database
  const loadNutritionData = useCallback(async () => {
    if (!session?.user?.id) return

    try {
      setNutritionLoading(true)
      setNutritionError(null)
      console.log('📊 Loading nutrition data for TrackerScreen...')

      // Get batch nutrition data for dashboard
      const batchData = await getBatchNutritionData(session.user.id, 'week')
      
      // Get chart data separately for more detailed visualization
      const [summary, chartData] = await Promise.all([
        getNutritionDashboardSummary(session.user.id),
        getNutritionChartData(session.user.id, 'week')
      ])

      setNutritionSummary(summary)
      setNutritionChartData(chartData)

      console.log('✅ Loaded nutrition data:', {
        todayCalories: summary.today?.total_calories || 0,
        chartDays: chartData.days_with_data,
        goalCalories: summary.goals.daily_calories,
        completedMeals: summary.meal_completion.completed,
        completionPercentage: summary.meal_completion.percentage
      })
      
      console.log('📊 Health Tracker calories:', summary.today?.total_calories || 0, 'from nutrition summary')

    } catch (error) {
      console.error('❌ Error loading nutrition data:', error)
      setNutritionError('Failed to load nutrition data')
    } finally {
      setNutritionLoading(false)
    }
  }, [session?.user?.id])

  // Load weight data from database
  const loadWeightData = useCallback(async () => {
    if (!session?.user?.id) return

    try {
      setWeightLoading(true)
      setWeightError(null)
      console.log('⚖️ Loading weight data for TrackerScreen...')

      // Get weight data for charts and dashboard  
      const [summary, chartData, bmiData] = await Promise.all([
        getWeightDashboardSummary(session.user.id),
        getWeightChartData(session.user.id, 'week'),
        getBMIChartData(session.user.id, 'week')
      ])

      setWeightSummary(summary)
      setWeightChartData(chartData)
      setBmiChartData(bmiData)

      console.log('✅ Loaded weight data:', {
        currentWeight: summary.current_log?.weight_kg || 'No data',
        chartDays: chartData.days_with_data,
        targetWeight: summary.target_weight_kg || 'Not set'
      })

    } catch (error) {
      console.error('❌ Error loading weight data:', error)
      setWeightError('Failed to load weight data')
    } finally {
      setWeightLoading(false)
    }
  }, [session?.user?.id])

  // Transform nutrition chart data to format expected by CalorieChart
  const getCalorieChartData = () => {
    if (!nutritionChartData || nutritionChartData.data_points.length === 0) {
      return []
    }

    return nutritionChartData.data_points.map((point, index) => ({
      date: point.date,
      consumed: point.calories,
      goal: point.goal_calories || nutritionChartData.goals.daily_calories,
      day: index === nutritionChartData.data_points.length - 1 ? 'Today' : 
           new Date(point.date).toLocaleDateString('en-US', { weekday: 'short' })
    }))
  }

  // Transform weight chart data to format expected by WeightChart component
  const getWeightChartFormatted = () => {
    if (!weightChartData || weightChartData.data_points.length === 0) {
      return []
    }

    return weightChartData.data_points.map(point => ({
      date: point.date,
      weight: point.weight,
      day: point.day || new Date(point.date).toLocaleDateString('en-US', { weekday: 'short' })
    }))
  }

  // Transform BMI chart data to format expected by BMIChart component
  const getBMIChartFormatted = () => {
    if (!bmiChartData || bmiChartData.data_points.length === 0) {
      return []
    }

    return bmiChartData.data_points.map(point => ({
      date: point.date,
      bmi: point.bmi,
      day: point.day || new Date(point.date).toLocaleDateString('en-US', { weekday: 'short' })
    }))
  }

  // Fetch health profile, dietary preferences, and nutrition data from Supabase
  useEffect(() => {
    const fetchAllData = async () => {
      if (!session?.user?.id) return

      try {
        // Fetch health profile and dietary preferences in parallel
        const [
          { data: healthData, error: healthError },
          { data: dietData, error: dietError }
        ] = await Promise.all([
          supabase
            .from('user_health_profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .single(),
          supabase
            .from('user_dietary_preferences')
            .select('*')
            .eq('user_id', session.user.id)
            .single()
        ])

        if (healthData && !healthError) {
          setHealthProfile(healthData)
        }

        if (dietData && !dietError) {
          setDietaryPrefs(dietData)
        }

        // Load nutrition and weight data
        await Promise.all([
          loadNutritionData(),
          loadWeightData()
        ])

      } catch (error) {
        console.error('Error fetching tracker data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAllData()
  }, [session, loadNutritionData])

  // Pull-to-refresh functionality
  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await Promise.all([
        loadNutritionData(),
        loadWeightData()
      ])
    } catch (error) {
      console.error('Error refreshing tracker data:', error)
    } finally {
      setRefreshing(false)
    }
  }, [loadNutritionData, loadWeightData])

  // Handle weight logging
  const handleLogWeight = useCallback(async () => {
    if (!session?.user?.id || !weightInput.trim()) {
      Alert.alert('Error', 'Please enter a valid weight')
      return
    }

    const weight = parseFloat(weightInput)
    if (isNaN(weight) || weight < 20 || weight > 500) {
      Alert.alert('Error', 'Please enter a weight between 20 and 500 kg')
      return
    }

    try {
      setLoggingWeight(true)
      console.log('📝 Logging new weight:', weight, 'kg')
      
      await createWeightLog(session.user.id, {
        weight_kg: weight,
        measurement_method: 'manual',
        confidence_level: 'high'
      })

      console.log('✅ Weight logged successfully')
      
      // Refresh weight data and close modal
      await loadWeightData()
      setShowWeightModal(false)
      setWeightInput('')
      
      Alert.alert('Success', `Weight logged: ${weight} kg`)

    } catch (error) {
      console.error('❌ Error logging weight:', error)
      Alert.alert('Error', 'Failed to log weight. Please try again.')
    } finally {
      setLoggingWeight(false)
    }
  }, [session?.user?.id, weightInput, loadWeightData])

  const healthMetrics: HealthMetric[] = [
    {
      label: 'Current Weight',
      value: healthProfile.weight_kg?.toString() || '--',
      emoji: '⚖️',
      color: '#6B8E23',
      unit: 'kg',
      trend: 'stable'
    },
    {
      label: 'BMI',
      value: healthProfile.bmi?.toFixed(1) || '--',
      emoji: calculateBMIStatus(healthProfile.bmi).emoji,
      color: calculateBMIStatus(healthProfile.bmi).color,
      unit: '',
      trend: 'stable'
    },
    {
      label: 'Today\'s Calories',
      value: nutritionSummary?.today?.total_calories?.toString() || '0',
      emoji: '🔥',
      color: nutritionSummary?.calorie_progress.status === 'on_track' ? '#10B981' : 
             nutritionSummary?.calorie_progress.status === 'over' ? '#EF4444' : '#F59E0B',
      unit: 'kcal',
      trend: 'stable'
    },
    {
      label: 'BMR',
      value: healthProfile.bmr?.toString() || '--',
      emoji: '⚡',
      color: '#8B5CF6',
      unit: 'kcal/day',
      trend: 'stable'
    }
  ]

  const goals = [
    {
      title: 'Calorie Goal',
      current: nutritionSummary?.today?.total_calories || 0,
      target: nutritionSummary?.goals.daily_calories || 2000,
      unit: 'kcal',
      emoji: '🔥',
      color: '#F59E0B'
    },
    {
      title: 'Protein Goal',
      current: Math.round(nutritionSummary?.today?.total_protein_g || 0),
      target: nutritionSummary?.goals.daily_protein_g || 125,
      unit: 'g',
      emoji: '💪',
      color: '#10B981'
    },
    {
      title: 'Weight Goal',
      current: healthProfile.weight_kg || 0,
      target: healthProfile.target_weight_kg || 0,
      unit: 'kg',
      emoji: '🎯',
      color: '#6B8E23'
    },
    {
      title: 'Water Intake',
      current: 1.8, // Mock data
      target: 2.5,
      unit: 'L',
      emoji: '💧',
      color: '#06B6D4'
    }
  ]

  const achievements: Achievement[] = [
    {
      id: 'profile-complete',
      title: 'Profile Complete',
      description: 'Completed your health profile',
      emoji: '✅',
      earned: !!healthProfile.age && !!healthProfile.weight_kg,
      date: 'Today'
    },
    {
      id: 'goal-setter',
      title: 'Goal Setter',
      description: 'Set your health goals',
      emoji: '🎯',
      earned: !!healthProfile.health_goals && parseJSONBArray(healthProfile.health_goals).length > 0,
      date: 'Today'
    },
    {
      id: 'health-conscious',
      title: 'Health Conscious',
      description: 'Added dietary preferences',
      emoji: '🥗',
      earned: !!dietaryPrefs.dietary_restrictions && dietaryPrefs.dietary_restrictions.length > 0,
      date: 'Today'
    },
    {
      id: 'week-streak',
      title: '7-Day Streak',
      description: 'Tracked health for 7 days',
      emoji: '🔥',
      earned: false,
      date: undefined
    }
  ]

  // Parse JSONB fields
  const healthGoals = parseJSONBArray(healthProfile.health_goals)
  const medicalConditions = parseJSONBArray(healthProfile.medical_conditions)
  const medications = parseJSONBArray(healthProfile.medications)

  // Calculate weight progress using real data
  const currentWeight = weightSummary?.current_log?.weight_kg || 
                       weightChartData?.data_points[weightChartData.data_points.length - 1]?.weight || 
                       healthProfile.weight_kg || 0
  const weightProgress = calculateWeightProgress(currentWeight, weightSummary?.target_weight_kg || healthProfile.target_weight_kg)
  const bmiStatus = calculateBMIStatus(weightSummary?.current_log?.bmi || healthProfile.bmi)

  const userName = userData?.fullName || session?.user?.email?.split('@')[0] || 'Guest User'

  return (
    <ScreenWrapper>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Health Tracker</Text>
          <Text style={styles.headerSubtitle}>Track your wellness journey, {userName}</Text>
        </View>

        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => Alert.alert('Edit Health Data', 'Navigate to onboarding to update your health information.')}
        >
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.content}>
          {/* Charts Section - First */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionEmoji}>📈</Text>
              <Text style={styles.sectionTitle}>Health Trends</Text>
            </View>
            
            {/* Nutrition Chart - Real Data */}
            <NutritionChart 
              data={nutritionChartData}
              loading={nutritionLoading}
              error={nutritionError}
              period="week"
              showGoals={true}
            />

            {/* Calorie Chart - Real Data */}
            <CalorieChart 
              data={getCalorieChartData()} 
              loading={nutritionLoading}
              error={nutritionError}
            />
            
            {/* Weight Chart - Real Data */}
            <WeightChart 
              data={getWeightChartFormatted()} 
              loading={weightLoading}
              error={weightError}
              targetWeight={weightSummary?.target_weight_kg || healthProfile.target_weight_kg || 70} 
              startWeight={weightChartData?.starting_weight || 76}
            />
            
            {/* BMI Chart - Real Data */}
            <BMIChart 
              data={getBMIChartFormatted()}
              loading={weightLoading}
              error={weightError}
            />
          </View>

          {/* Compact Health Overview */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionEmoji}>📊</Text>
              <Text style={styles.sectionTitle}>Current Status</Text>
            </View>
            
            <View style={styles.compactMetrics}>
              <View style={styles.compactMetricRow}>
                <View style={styles.compactMetric}>
                  <Text style={styles.compactValue}>{currentWeight.toFixed(1)} kg</Text>
                  <Text style={styles.compactLabel}>Weight</Text>
                </View>
                <View style={styles.compactMetric}>
                  <Text style={[styles.compactValue, { color: bmiStatus.color }]}>
                    {healthProfile.bmi?.toFixed(1) || '--'}
                  </Text>
                  <Text style={styles.compactLabel}>BMI</Text>
                </View>
                <View style={styles.compactMetric}>
                  <Text style={styles.compactValue}>
                    {healthProfile.daily_calorie_goal?.toString() || '--'}
                  </Text>
                  <Text style={styles.compactLabel}>Cal Goal</Text>
                </View>
              </View>
              
              {healthProfile.bmi && (
                <View style={[styles.statusBadge, { backgroundColor: bmiStatus.color + '20' }]}>
                  <Text style={[styles.statusText, { color: bmiStatus.color }]}>
                    {bmiStatus.emoji} {bmiStatus.status}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Quick Goals */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionEmoji}>🎯</Text>
              <Text style={styles.sectionTitle}>Today's Goals</Text>
            </View>
            
            <View style={styles.compactGoals}>
              {goals.slice(0, 2).map((goal, index) => {
                const progress = goal.target > 0 ? (goal.current / goal.target) * 100 : 0
                const progressClamped = Math.min(100, Math.max(0, progress))
                
                return (
                  <View key={goal.title} style={styles.compactGoalCard}>
                    <View style={styles.compactGoalHeader}>
                      <Text style={styles.goalEmoji}>{goal.emoji}</Text>
                      <Text style={styles.compactGoalTitle}>{goal.title}</Text>
                      <Text style={[styles.compactGoalPercentage, { color: goal.color }]}>
                        {Math.round(progressClamped)}%
                      </Text>
                    </View>
                    <View style={styles.compactProgressBar}>
                      <View 
                        style={[
                          styles.compactProgressFill, 
                          { width: `${progressClamped}%`, backgroundColor: goal.color }
                        ]} 
                      />
                    </View>
                    <Text style={styles.compactGoalValues}>
                      {goal.current} / {goal.target} {goal.unit}
                    </Text>
                  </View>
                )
              })}
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionEmoji}>⚡</Text>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
            </View>
            
            <View style={styles.quickActionsGrid}>
              <TouchableOpacity 
                style={styles.quickActionButton}
                onPress={() => setShowWeightModal(true)}
              >
                <Text style={styles.quickActionEmoji}>⚖️</Text>
                <Text style={styles.quickActionText}>Log Weight</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.quickActionButton}
                onPress={() => Alert.alert('Track Calories', 'Calorie tracking feature coming soon!')}
              >
                <Text style={styles.quickActionEmoji}>🔥</Text>
                <Text style={styles.quickActionText}>Track Calories</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.quickActionButton}
                onPress={() => Alert.alert('Log Activity', 'Activity logging feature coming soon!')}
              >
                <Text style={styles.quickActionEmoji}>🏃</Text>
                <Text style={styles.quickActionText}>Log Activity</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.quickActionButton}
                onPress={() => Alert.alert('Add Note', 'Health notes feature coming soon!')}
              >
                <Text style={styles.quickActionEmoji}>📝</Text>
                <Text style={styles.quickActionText}>Add Note</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Weight Logging Modal */}
      <Modal
        visible={showWeightModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowWeightModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Log Your Weight</Text>
            <Text style={styles.modalSubtitle}>Enter your current weight in kilograms</Text>
            
            <TextInput
              style={styles.weightInput}
              value={weightInput}
              onChangeText={setWeightInput}
              placeholder="e.g. 75.5"
              keyboardType="decimal-pad"
              autoFocus={true}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowWeightModal(false)
                  setWeightInput('')
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalSaveButton, loggingWeight && styles.modalSaveButtonDisabled]}
                onPress={handleLogWeight}
                disabled={loggingWeight}
              >
                <Text style={styles.modalSaveText}>
                  {loggingWeight ? 'Saving...' : 'Save Weight'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  )
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#6B8E23',
    paddingTop: 16,
    paddingBottom: 32,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'Inter',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
    fontFamily: 'Inter',
  },
  editButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  editButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#FAF7F0',
    marginTop: -16,
  },
  content: {
    padding: 20,
    gap: 24,
  },
  section: {
    gap: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionEmoji: {
    fontSize: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Inter',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    minWidth: (width - 64) / 2,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 12,
  },
  metricEmoji: {
    fontSize: 24,
  },
  trendIcon: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
    fontFamily: 'Inter',
  },
  metricUnit: {
    fontSize: 14,
    fontWeight: 'normal',
    color: '#4A4A4A',
  },
  metricLabel: {
    fontSize: 12,
    color: '#4A4A4A',
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  bmiCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  bmiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  bmiTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Inter',
  },
  bmiValue: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'Inter',
  },
  bmiIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  bmiText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  goalsContainer: {
    gap: 16,
  },
  goalCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  goalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  goalEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  goalTitleContainer: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Inter',
  },
  goalValues: {
    fontSize: 14,
    color: '#4A4A4A',
    marginTop: 2,
    fontFamily: 'Inter',
  },
  goalPercentage: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Inter',
  },
  progressBarContainer: {
    marginTop: 8,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
  },
  summaryEmoji: {
    fontSize: 20,
  },
  summaryContent: {
    flex: 1,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
    fontFamily: 'Inter',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#4A4A4A',
    marginTop: 2,
    fontFamily: 'Inter',
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  achievementItem: {
    flex: 1,
    minWidth: (width - 64) / 2,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
  },
  achievementEarned: {
    backgroundColor: '#dcfce7',
    borderColor: '#6B8E23',
  },
  achievementLocked: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
    opacity: 0.7,
  },
  achievementEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  achievementTitle: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    color: '#1A1A1A',
    marginBottom: 4,
    fontFamily: 'Inter',
  },
  achievementDescription: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 4,
    fontFamily: 'Inter',
  },
  achievementDate: {
    fontSize: 9,
    color: '#6B8E23',
    fontWeight: '500',
    fontFamily: 'Inter',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    minWidth: (width - 64) / 2,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  quickActionEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  
  // Compact Styles
  compactMetrics: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  compactMetricRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  compactMetric: {
    alignItems: 'center',
  },
  compactValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    fontFamily: 'Inter',
  },
  compactLabel: {
    fontSize: 12,
    color: '#4A4A4A',
    marginTop: 4,
    fontFamily: 'Inter',
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  compactGoals: {
    gap: 12,
  },
  compactGoalCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  compactGoalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  compactGoalTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
    marginLeft: 8,
    fontFamily: 'Inter',
  },
  compactGoalPercentage: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Inter',
  },
  compactProgressBar: {
    height: 4,
    backgroundColor: '#F0F0F0',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  compactProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  compactGoalValues: {
    fontSize: 12,
    color: '#4A4A4A',
    fontFamily: 'Inter',
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    fontFamily: 'Inter',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter',
    textAlign: 'center',
    marginBottom: 24,
  },
  weightInput: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    fontFamily: 'Inter',
    textAlign: 'center',
    marginBottom: 24,
    backgroundColor: '#F9FAFB',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily: 'Inter',
  },
  modalSaveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#6B8E23',
    alignItems: 'center',
  },
  modalSaveButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Inter',
  },
})