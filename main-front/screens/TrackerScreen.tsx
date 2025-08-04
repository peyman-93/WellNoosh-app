import React, { useState, useEffect } from 'react'
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity,
  Dimensions,
  Alert
} from 'react-native'
import { useAuth } from '../src/context/supabase-provider'
import { useUserData } from '../src/context/user-data-provider'
import { useNavigation } from '@react-navigation/native'
import { ScreenWrapper } from '../src/components/layout/ScreenWrapper'
import { supabase } from '../src/services/supabase'
import { CalorieChart } from '../src/components/charts/CalorieChart'
import { WeightChart } from '../src/components/charts/WeightChart'
import { BMIChart } from '../src/components/charts/BMIChart'

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

  // Mock chart data - replace with real data later
  const mockCalorieData = [
    { date: '2025-01-26', consumed: 1850, goal: 2000, day: 'Sun' },
    { date: '2025-01-27', consumed: 2100, goal: 2000, day: 'Mon' },
    { date: '2025-01-28', consumed: 1950, goal: 2000, day: 'Tue' },
    { date: '2025-01-29', consumed: 2200, goal: 2000, day: 'Wed' },
    { date: '2025-01-30', consumed: 1800, goal: 2000, day: 'Thu' },
    { date: '2025-01-31', consumed: 2050, goal: 2000, day: 'Fri' },
    { date: '2025-02-01', consumed: 1750, goal: 2000, day: 'Today' },
  ]

  const mockWeightData = [
    { date: '2025-01-26', weight: 75.2, day: 'Sun' },
    { date: '2025-01-27', weight: 75.0, day: 'Mon' },
    { date: '2025-01-28', weight: 74.8, day: 'Tue' },
    { date: '2025-01-29', weight: 74.9, day: 'Wed' },
    { date: '2025-01-30', weight: 74.5, day: 'Thu' },
    { date: '2025-01-31', weight: 74.3, day: 'Fri' },
    { date: '2025-02-01', weight: 74.1, day: 'Today' },
  ]

  const mockBMIData = [
    { date: '2025-01-26', bmi: 24.8, day: 'Sun' },
    { date: '2025-01-27', bmi: 24.7, day: 'Mon' },
    { date: '2025-01-28', bmi: 24.6, day: 'Tue' },
    { date: '2025-01-29', bmi: 24.7, day: 'Wed' },
    { date: '2025-01-30', bmi: 24.5, day: 'Thu' },
    { date: '2025-01-31', bmi: 24.4, day: 'Fri' },
    { date: '2025-02-01', bmi: 24.3, day: 'Today' },
  ]

  // Fetch health profile and dietary preferences from Supabase
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!session?.user?.id) return

      try {
        // Fetch health profile
        const { data: healthData, error: healthError } = await supabase
          .from('user_health_profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single()

        if (healthData && !healthError) {
          setHealthProfile(healthData)
        }

        // Fetch dietary preferences
        const { data: dietData, error: dietError } = await supabase
          .from('user_dietary_preferences')
          .select('*')
          .eq('user_id', session.user.id)
          .single()

        if (dietData && !dietError) {
          setDietaryPrefs(dietData)
        }
      } catch (error) {
        console.error('Error fetching profile data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProfileData()
  }, [session])

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
      label: 'Daily Calories',
      value: healthProfile.daily_calorie_goal?.toString() || '--',
      emoji: '🔥',
      color: '#F59E0B',
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
      title: 'Weight Goal',
      current: healthProfile.weight_kg || 0,
      target: healthProfile.target_weight_kg || 0,
      unit: 'kg',
      emoji: '🎯',
      color: '#6B8E23'
    },
    {
      title: 'Daily Steps',
      current: 8500, // Mock data
      target: 10000,
      unit: 'steps',
      emoji: '👟',
      color: '#3B82F6'
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

  // Calculate weight progress
  const currentWeight = mockWeightData[mockWeightData.length - 1]?.weight || healthProfile.weight_kg || 0
  const weightProgress = calculateWeightProgress(healthProfile.weight_kg, healthProfile.target_weight_kg)
  const bmiStatus = calculateBMIStatus(healthProfile.bmi)

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

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Charts Section - First */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionEmoji}>📈</Text>
              <Text style={styles.sectionTitle}>Health Trends</Text>
            </View>
            
            {/* Calorie Chart */}
            <CalorieChart data={mockCalorieData} />
            
            {/* Weight Chart */}
            <WeightChart 
              data={mockWeightData} 
              targetWeight={healthProfile.target_weight_kg || 70} 
              startWeight={76}
            />
            
            {/* BMI Chart */}
            <BMIChart data={mockBMIData} />
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
                onPress={() => Alert.alert('Log Weight', 'Weight logging feature coming soon!')}
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
})