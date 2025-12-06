import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Dimensions } from 'react-native'
import Svg, { Rect, Line, Text as SvgText, Circle } from 'react-native-svg'
import { useAuth } from '../../context/supabase-provider'
import { 
  getComprehensiveAnalytics, 
  type TimePeriod, 
  type ComprehensiveAnalytics,
  type DailyNutritionData
} from '../../services/analyticsService'

const { width: screenWidth } = Dimensions.get('window')

interface AnalyticsDashboardProps {
  onClose?: () => void
}

const PERIOD_OPTIONS: { key: TimePeriod; label: string }[] = [
  { key: 'day', label: 'Today' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' }
]

export function AnalyticsDashboard({ onClose }: AnalyticsDashboardProps) {
  const { session } = useAuth()
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('week')
  const [analytics, setAnalytics] = useState<ComprehensiveAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadAnalytics = useCallback(async () => {
    if (!session?.user?.id) return

    setLoading(true)
    setError(null)

    try {
      const data = await getComprehensiveAnalytics(session.user.id, selectedPeriod)
      setAnalytics(data)
    } catch (err) {
      console.error('Error loading analytics:', err)
      setError('Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id, selectedPeriod])

  useEffect(() => {
    loadAnalytics()
  }, [loadAnalytics])

  const renderPeriodSelector = () => (
    <View style={styles.periodSelector}>
      {PERIOD_OPTIONS.map((option) => (
        <TouchableOpacity
          key={option.key}
          style={[
            styles.periodButton,
            selectedPeriod === option.key && styles.periodButtonActive
          ]}
          onPress={() => setSelectedPeriod(option.key)}
        >
          <Text style={[
            styles.periodButtonText,
            selectedPeriod === option.key && styles.periodButtonTextActive
          ]}>
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  )

  const renderNutritionChart = () => {
    if (!analytics?.nutrition.dailyData.length) {
      return (
        <View style={styles.emptyChart}>
          <Text style={styles.emptyChartIcon}>📊</Text>
          <Text style={styles.emptyChartText}>No meal data for this period</Text>
          <Text style={styles.emptyChartSubtext}>Start planning meals to see your trends</Text>
        </View>
      )
    }

    const data = analytics.nutrition.dailyData
    const maxMeals = Math.max(...data.map(d => d.totalMeals), 1)
    const chartWidth = screenWidth - 80
    const chartHeight = 120
    const barWidth = Math.min(30, (chartWidth - 20) / data.length - 4)

    return (
      <View style={styles.chartContainer}>
        <Svg width={chartWidth} height={chartHeight + 30}>
          {data.map((day, index) => {
            const barHeight = (day.completedMeals / maxMeals) * chartHeight
            const x = 10 + index * ((chartWidth - 20) / data.length)
            const completionRate = day.totalMeals > 0 ? day.completedMeals / day.totalMeals : 0
            const barColor = completionRate >= 0.8 ? '#6B8E23' : completionRate >= 0.5 ? '#E6A245' : '#DC6B3F'
            
            return (
              <React.Fragment key={day.date}>
                <Rect
                  x={x}
                  y={chartHeight - barHeight}
                  width={barWidth}
                  height={Math.max(barHeight, 4)}
                  rx={4}
                  fill={barColor}
                />
                <SvgText
                  x={x + barWidth / 2}
                  y={chartHeight + 15}
                  fontSize={10}
                  fill="#4A4A4A"
                  textAnchor="middle"
                >
                  {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2)}
                </SvgText>
              </React.Fragment>
            )
          })}
        </Svg>
      </View>
    )
  }

  const renderStatCard = (
    title: string, 
    value: string | number, 
    subtitle: string, 
    icon: string,
    trend?: 'up' | 'down' | 'stable'
  ) => (
    <View style={styles.statCard}>
      <View style={styles.statCardHeader}>
        <Text style={styles.statCardIcon}>{icon}</Text>
        {trend && (
          <Text style={[
            styles.trendIcon,
            trend === 'up' && styles.trendUp,
            trend === 'down' && styles.trendDown
          ]}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
          </Text>
        )}
      </View>
      <Text style={styles.statCardValue}>{value}</Text>
      <Text style={styles.statCardTitle}>{title}</Text>
      <Text style={styles.statCardSubtitle}>{subtitle}</Text>
    </View>
  )

  const renderOverallScore = () => {
    if (!analytics) return null
    
    const score = analytics.summary.overallScore
    const circumference = 2 * Math.PI * 40
    const strokeDashoffset = circumference - (score / 100) * circumference
    
    return (
      <View style={styles.scoreContainer}>
        <View style={styles.scoreCircle}>
          <Svg width={100} height={100}>
            <Circle
              cx={50}
              cy={50}
              r={40}
              stroke="#E0E0E0"
              strokeWidth={8}
              fill="none"
            />
            <Circle
              cx={50}
              cy={50}
              r={40}
              stroke={score >= 70 ? '#6B8E23' : score >= 40 ? '#E6A245' : '#DC6B3F'}
              strokeWidth={8}
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              rotation={-90}
              origin="50, 50"
            />
          </Svg>
          <View style={styles.scoreTextContainer}>
            <Text style={styles.scoreValue}>{score}</Text>
            <Text style={styles.scoreLabel}>Score</Text>
          </View>
        </View>
        
        <View style={styles.scoreDetails}>
          <Text style={styles.scorePeriod}>{analytics.nutrition.range.label}</Text>
          {analytics.summary.streakDays > 0 && (
            <View style={styles.streakBadge}>
              <Text style={styles.streakIcon}>🔥</Text>
              <Text style={styles.streakText}>{analytics.summary.streakDays} day streak</Text>
            </View>
          )}
        </View>
      </View>
    )
  }

  const renderInsights = () => {
    if (!analytics) return null
    
    const allInsights = [
      ...analytics.summary.insights,
      ...(analytics.mood?.insights || [])
    ]
    
    if (allInsights.length === 0) return null
    
    return (
      <View style={styles.insightsContainer}>
        <Text style={styles.sectionTitle}>Insights</Text>
        {allInsights.slice(0, 3).map((insight, index) => (
          <View key={index} style={styles.insightCard}>
            <Text style={styles.insightIcon}>💡</Text>
            <Text style={styles.insightText}>{insight}</Text>
          </View>
        ))}
      </View>
    )
  }

  const renderMoodSection = () => {
    if (!analytics?.mood || analytics.mood.dailyData.length === 0) return null
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mood & Wellness</Text>
        <View style={styles.moodGrid}>
          {analytics.mood.averages.mood > 0 && (
            <View style={styles.moodCard}>
              <Text style={styles.moodEmoji}>
                {analytics.mood.averages.mood >= 4 ? '😊' : 
                 analytics.mood.averages.mood >= 3 ? '😐' : '😔'}
              </Text>
              <Text style={styles.moodValue}>{analytics.mood.averages.mood.toFixed(1)}/5</Text>
              <Text style={styles.moodLabel}>Avg Mood</Text>
            </View>
          )}
          {analytics.mood.averages.sleepHours > 0 && (
            <View style={styles.moodCard}>
              <Text style={styles.moodEmoji}>😴</Text>
              <Text style={styles.moodValue}>{analytics.mood.averages.sleepHours.toFixed(1)}h</Text>
              <Text style={styles.moodLabel}>Avg Sleep</Text>
            </View>
          )}
          {analytics.mood.averages.stressLevel > 0 && (
            <View style={styles.moodCard}>
              <Text style={styles.moodEmoji}>
                {analytics.mood.averages.stressLevel <= 2 ? '🧘' : 
                 analytics.mood.averages.stressLevel <= 3 ? '😤' : '😰'}
              </Text>
              <Text style={styles.moodValue}>{analytics.mood.averages.stressLevel.toFixed(1)}/5</Text>
              <Text style={styles.moodLabel}>Avg Stress</Text>
            </View>
          )}
        </View>
      </View>
    )
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Analytics Dashboard</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6B8E23" />
          <Text style={styles.loadingText}>Loading your analytics...</Text>
        </View>
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Analytics Dashboard</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadAnalytics}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {renderPeriodSelector()}
      
      {renderOverallScore()}
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Meal Tracking Overview</Text>
        {renderNutritionChart()}
        
        <View style={styles.statsGrid}>
          {renderStatCard(
            'Completion',
            `${analytics?.nutrition.averages.mealCompletionRate || 0}%`,
            'meal tracking',
            '✅',
            analytics?.nutrition.trends.completionTrend
          )}
          {renderStatCard(
            'Meals Done',
            analytics?.nutrition.totals.mealsCompleted || 0,
            'completed meals',
            '🍽️'
          )}
          {renderStatCard(
            'Total Meals',
            analytics?.nutrition.totals.totalMeals || 0,
            'planned meals',
            '📋'
          )}
          {renderStatCard(
            'Days Tracked',
            analytics?.nutrition.totals.daysTracked || 0,
            'this period',
            '📅'
          )}
        </View>
      </View>
      
      {renderMoodSection()}
      
      {renderInsights()}
      
      <View style={styles.bottomPadding} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Inter',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#4A4A4A',
    fontFamily: 'Inter',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#DC6B3F',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'Inter',
  },
  retryButton: {
    backgroundColor: '#6B8E23',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  periodSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#6B8E23',
    borderColor: '#6B8E23',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4A4A4A',
    fontFamily: 'Inter',
  },
  periodButtonTextActive: {
    color: '#FFFFFF',
  },
  scoreContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  scoreCircle: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreTextContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    fontFamily: 'Inter',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#4A4A4A',
    fontFamily: 'Inter',
  },
  scoreDetails: {
    alignItems: 'center',
    marginTop: 12,
  },
  scorePeriod: {
    fontSize: 14,
    color: '#4A4A4A',
    fontFamily: 'Inter',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF4E6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 8,
  },
  streakIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E6A245',
    fontFamily: 'Inter',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
    fontFamily: 'Inter',
  },
  chartContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  emptyChart: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyChartIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyChartText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: 4,
    fontFamily: 'Inter',
  },
  emptyChartSubtext: {
    fontSize: 14,
    color: '#4A4A4A',
    fontFamily: 'Inter',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    minWidth: '47%',
    flex: 1,
  },
  statCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statCardIcon: {
    fontSize: 20,
  },
  trendIcon: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  trendUp: {
    color: '#6B8E23',
  },
  trendDown: {
    color: '#DC6B3F',
  },
  statCardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    fontFamily: 'Inter',
  },
  statCardTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
    marginTop: 4,
    fontFamily: 'Inter',
  },
  statCardSubtitle: {
    fontSize: 12,
    color: '#4A4A4A',
    fontFamily: 'Inter',
  },
  moodGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  moodCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  moodEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  moodValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    fontFamily: 'Inter',
  },
  moodLabel: {
    fontSize: 12,
    color: '#4A4A4A',
    marginTop: 4,
    fontFamily: 'Inter',
  },
  insightsContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  insightIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    color: '#1A1A1A',
    lineHeight: 20,
    fontFamily: 'Inter',
  },
  bottomPadding: {
    height: 40,
  },
})

export default AnalyticsDashboard
