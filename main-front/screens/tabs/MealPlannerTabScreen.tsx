import React, { useState, useEffect, useRef } from 'react'
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  Modal, 
  TextInput, 
  Dimensions,
  SafeAreaView
} from 'react-native'
import { PanGestureHandler, GestureHandlerRootView, State } from 'react-native-gesture-handler'
import { LinearGradient } from 'expo-linear-gradient'
import { ScreenWrapper } from '../../src/components/layout/ScreenWrapper'
import { useAuth } from '../../src/context/supabase-provider'

// Services  
import { getUserMealPlans, getDashboardMealPlan, hasMealPlanForDate } from '../../src/services/mealPlanService'
import { generateAndSaveMealPlan, getUserCalorieTarget, getUserDietaryRestrictions } from '../../src/services/mealPlanGenerator'
import type { UserMealPlan, DashboardMealPlan } from '../../src/types/mealPlan'

const { width: screenWidth } = Dimensions.get('window')

export default function PlannerScreen() {
  const { session } = useAuth()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [mealPlans, setMealPlans] = useState<UserMealPlan[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedMealPlan, setSelectedMealPlan] = useState<DashboardMealPlan | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [loading, setLoading] = useState(true)
  const [currentDayIndex, setCurrentDayIndex] = useState(0) // For 3-day pagination
  const [showGenerateMeals, setShowGenerateMeals] = useState(false)
  const [showRegenerateOptions, setShowRegenerateOptions] = useState(false)
  const [regenerateOptions, setRegenerateOptions] = useState({
    useFridgeIngredients: false,
    updateGoals: false,
    regenerateAll: false
  })

  const scrollViewRef = useRef<ScrollView>(null)

  // Generate array of dates for the next 21 days (7 sets of 3 days)
  const generateDates = () => {
    const dates = []
    const today = new Date()
    for (let i = 0; i < 21; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      dates.push(date)
    }
    return dates
  }

  const allDates = generateDates()

  // Get current 3 days based on currentDayIndex
  const getCurrentThreeDays = () => {
    return allDates.slice(currentDayIndex, currentDayIndex + 3)
  }

  const getCurrentWeekDays = () => {
    const startIndex = Math.floor(currentDayIndex / 3) * 3
    return allDates.slice(startIndex, startIndex + 3)
  }

  const isToday = (dateString: string) => {
    return dateString === new Date().toISOString().split('T')[0]
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const formatShortDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      day: 'numeric' 
    })
  }

  const navigateDays = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentDayIndex > 0) {
      setCurrentDayIndex(prev => prev - 3)
    } else if (direction === 'next' && currentDayIndex < allDates.length - 3) {
      setCurrentDayIndex(prev => prev + 3)
    }
  }

  const onSwipeGesture = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX } = event.nativeEvent
      const swipeThreshold = 50
      
      if (translationX > swipeThreshold) {
        // Swipe right - go to previous days
        navigateDays('prev')
      } else if (translationX < -swipeThreshold) {
        // Swipe left - go to next days  
        navigateDays('next')
      }
    }
  }

  const loadMealPlans = async () => {
    if (!session?.user?.id) return

    try {
      setLoading(true)
      console.log('🔄 Loading meal plans from database...')

      // Get meal plans for the next 21 days
      const today = new Date().toISOString().split('T')[0]
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 21)
      const futureDateStr = futureDate.toISOString().split('T')[0]

      const plans = await getUserMealPlans(session.user.id, {
        date_from: today,
        date_to: futureDateStr,
        status: ['active', 'draft']
      }, {
        field: 'plan_date',
        direction: 'asc'
      })

      setMealPlans(plans)
      console.log('✅ Loaded', plans.length, 'meal plans from database')

    } catch (error) {
      console.error('❌ Error loading meal plans:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadSelectedMealPlan = async (date: string) => {
    if (!session?.user?.id) return

    try {
      console.log('🔄 Loading meal plan for date:', date)
      const mealPlan = await getDashboardMealPlan(session.user.id, date)
      setSelectedMealPlan(mealPlan)
      console.log(mealPlan ? '✅ Loaded meal plan' : 'ℹ️ No meal plan found for date')
    } catch (error) {
      console.error('❌ Error loading selected meal plan:', error)
      setSelectedMealPlan(null)
    }
  }

  const generateMealPlan = async () => {
    if (!session?.user?.id) return

    setIsGenerating(true)
    setShowGenerateMeals(false)
    
    try {
      console.log('🤖 Generating meal plans for 21 days...')

      const [targetCalories, dietaryRestrictions] = await Promise.all([
        getUserCalorieTarget(session.user.id),
        getUserDietaryRestrictions(session.user.id)
      ])

      // Generate meal plans for the next 21 days
      const generatePromises = allDates.map(async (date) => {
        const dateString = date.toISOString().split('T')[0]
        
        // Check if meal plan already exists for this date
        const exists = await hasMealPlanForDate(session.user.id, dateString)
        if (exists) {
          console.log('⏭️ Skipping', dateString, '- meal plan already exists')
          return
        }

        return generateAndSaveMealPlan({
          userId: session.user.id,
          planDate: date,
          targetCalories,
          dietaryRestrictions,
          mealsPerDay: 3,
          includeSnacks: true
        })
      })

      await Promise.all(generatePromises)
      
      // Reload meal plans
      await loadMealPlans()
      
      console.log('✅ Generated meal plans for 21 days')
      Alert.alert('Success', 'Generated your meal plans for the next 3 weeks!')

    } catch (error) {
      console.error('❌ Error generating meal plan:', error)
      Alert.alert('Error', 'Failed to generate meal plan. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const regenerateMealPlan = async () => {
    if (!session?.user?.id) return

    setIsGenerating(true)
    setShowRegenerateOptions(false)
    
    try {
      console.log('🔄 Regenerating meal plan with options:', regenerateOptions)

      const [targetCalories, dietaryRestrictions] = await Promise.all([
        getUserCalorieTarget(session.user.id),
        getUserDietaryRestrictions(session.user.id)
      ])

      let datesToRegenerate = []
      
      if (regenerateOptions.regenerateAll) {
        // Regenerate all dates that have meal plans
        datesToRegenerate = allDates.filter(date => {
          const dateString = date.toISOString().split('T')[0]
          return mealPlans.some(plan => plan.plan_date === dateString)
        })
      } else {
        // Regenerate only selected date
        datesToRegenerate = [new Date(selectedDate)]
      }
      
      // Delete existing meal plans and regenerate
      const regeneratePromises = datesToRegenerate.map(async (date) => {
        try {
          const existingPlan = mealPlans.find(plan => plan.plan_date === date.toISOString().split('T')[0])
          if (existingPlan) {
            // Delete existing plan (this will cascade delete planned meals)
            const { deleteMealPlan } = await import('../../src/services/mealPlanService')
            await deleteMealPlan(existingPlan.id)
          }

          // Generate new plan
          return generateAndSaveMealPlan({
            userId: session.user.id,
            planDate: date,
            targetCalories,
            dietaryRestrictions,
            mealsPerDay: 3,
            includeSnacks: true
          })
        } catch (error) {
          console.error('Error regenerating plan for', date.toISOString().split('T')[0], error)
        }
      })

      await Promise.all(regeneratePromises)
      
      // Reload meal plans and selected meal plan
      await loadMealPlans()
      await loadSelectedMealPlan(selectedDate)
      
      // Reset options
      setRegenerateOptions({
        useFridgeIngredients: false,
        updateGoals: false,
        regenerateAll: false
      })

      console.log('✅ Regenerated meal plans')
      Alert.alert('Success', 'Regenerated your meal plans!')
      
    } catch (error) {
      console.error('❌ Error regenerating meal plan:', error)
      Alert.alert('Error', 'Failed to regenerate meal plan. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  useEffect(() => {
    if (session?.user?.id) {
      loadMealPlans()
    }
  }, [session?.user?.id])

  // Load selected meal plan when date changes
  useEffect(() => {
    if (session?.user?.id && selectedDate) {
      loadSelectedMealPlan(selectedDate)
    }
  }, [selectedDate, session?.user?.id])
  const threeDays = getCurrentThreeDays()

  const renderMealCard = (mealType: 'breakfast' | 'lunch' | 'dinner', meal: any) => {
    const mealIcons = {
      breakfast: '🌅',
      lunch: '☀️',
      dinner: '🌙'
    }

    const mealColors = {
      breakfast: '#E6A245', // Golden wheat
      lunch: '#6B8E23',     // Organic leaf green  
      dinner: '#8BA654'     // Fresh sage green
    }

    // Format time to HH:MM
    const formatTime = (timeString: string): string => {
      if (!timeString) return '12:00'
      const parts = timeString.split(':')
      if (parts.length >= 2) {
        return `${parts[0]}:${parts[1]}`
      }
      return timeString
    }

    return (
      <View style={[
        styles.mealCard, 
        { borderLeftColor: mealColors[mealType] },
        meal.isCompleted && styles.mealCardCompleted
      ]}>
        <View style={styles.mealHeader}>
          <View style={styles.mealTitleRow}>
            <Text style={[
              styles.mealTypeLabel,
              meal.isCompleted && styles.mealTypeLabelCompleted
            ]}>
              {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
              {meal.isCompleted && ' ✓'}
            </Text>
            <Text style={[
              styles.mealTime,
              meal.isCompleted && styles.mealTimeCompleted
            ]}>
              {formatTime(meal.time)}
            </Text>
          </View>
        </View>
        <Text style={[
          styles.mealName,
          meal.isCompleted && styles.mealNameCompleted
        ]}>
          {meal.name}
        </Text>
        <Text style={[
          styles.mealCalories,
          meal.isCompleted && styles.mealCaloriesCompleted
        ]}>
          {meal.calories} cal
        </Text>
      </View>
    )
  }

  // Progress calculation functions
  const getDaysInCurrentMonth = () => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  }

  const getDaysLeftInMonth = () => {
    const now = new Date()
    const daysInMonth = getDaysInCurrentMonth()
    return daysInMonth - now.getDate() + 1
  }

  const getPlannedDaysCount = () => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    
    return mealPlans.filter(plan => {
      const planDate = new Date(plan.plan_date)
      return planDate.getMonth() === currentMonth && 
             planDate.getFullYear() === currentYear &&
             plan.total_meals_count > 0
    }).length
  }

  const getPlannedPercentage = () => {
    const daysInMonth = getDaysInCurrentMonth()
    const plannedDays = getPlannedDaysCount()
    return Math.round((plannedDays / daysInMonth) * 100)
  }

  const renderDayCard = (date: Date, index: number) => {
    const dateString = date.toISOString().split('T')[0]
    const isSelected = dateString === selectedDate
    const isTodayDate = isToday(dateString)
    const hasMeals = mealPlans.some(plan => plan.plan_date === dateString && plan.total_meals_count > 0)

    return (
      <TouchableOpacity
        key={dateString}
        style={[
          styles.dayCard,
          isSelected && styles.selectedDayCard,
          isTodayDate && styles.todayCard
        ]}
        onPress={() => setSelectedDate(dateString)}
      >
        <Text style={[
          styles.dayLabel,
          isSelected && styles.selectedDayLabel,
          isTodayDate && styles.todayDayLabel
        ]}>
          {date.toLocaleDateString('en-US', { weekday: 'short' })}
        </Text>
        <Text style={[
          styles.dayNumber,
          isSelected && styles.selectedDayNumber,
          isTodayDate && styles.todayDayNumber
        ]}>
          {date.getDate()}
        </Text>
        {isTodayDate && (
          <View style={styles.todayIndicator}>
            <Text style={styles.todayDot}>●</Text>
          </View>
        )}
        {isSelected && (
          <View style={styles.selectedIndicator}>
            <Text style={styles.selectedIcon}>◆</Text>
          </View>
        )}
      </TouchableOpacity>
    )
  }

  return (
    <ScreenWrapper>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Meal Plan</Text>
            <Text style={styles.subtitle}>Your personalized nutrition journey</Text>
          </View>
        </View>

        {/* Progress Card */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <View>
              <Text style={styles.progressTitle}>MEAL PLAN PROGRESS</Text>
              <Text style={styles.progressSubtext}>{getPlannedDaysCount()} of {getDaysInCurrentMonth()} days planned</Text>
            </View>
            <Text style={styles.progressPercentage}>{getPlannedPercentage()}%</Text>
          </View>
          
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { width: `${getPlannedPercentage()}%` }
                ]} 
              />
            </View>
          </View>
        </View>

        {/* 3-Day Navigation with Swipe Support */}
        <View style={styles.navigationContainer}>
          <TouchableOpacity
            style={[styles.navButton, currentDayIndex === 0 && styles.navButtonDisabled]}
            onPress={() => navigateDays('prev')}
            disabled={currentDayIndex === 0}
          >
            <Text style={[styles.navButtonText, currentDayIndex === 0 && styles.navButtonTextDisabled]}>‹</Text>
          </TouchableOpacity>

          <PanGestureHandler onHandlerStateChange={onSwipeGesture}>
            <View style={styles.daysContainer}>
              {threeDays.map((date, index) => renderDayCard(date, index))}
            </View>
          </PanGestureHandler>

          <TouchableOpacity
            style={[styles.navButton, currentDayIndex >= allDates.length - 3 && styles.navButtonDisabled]}
            onPress={() => navigateDays('next')}
            disabled={currentDayIndex >= allDates.length - 3}
          >
            <Text style={[styles.navButtonText, currentDayIndex >= allDates.length - 3 && styles.navButtonTextDisabled]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Generate Meal Plan Button */}
        {mealPlans.length === 0 && (
          <TouchableOpacity
            style={styles.generateButton}
            onPress={() => setShowGenerateMeals(true)}
            disabled={isGenerating}
          >
            <Text style={styles.generateButtonIcon}>
              {isGenerating ? '⏳' : '✨'}
            </Text>
            <Text style={styles.generateButtonText}>
              {isGenerating ? 'Creating your meal plan...' : 'Create Meal Plan'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Selected Day Meals */}
        {selectedMealPlan && (
          <View style={styles.mealsContainer}>
            <View style={styles.selectedDateHeader}>
              <Text style={styles.selectedDateTitle}>{formatDate(new Date(selectedDate))}</Text>
              <View style={styles.dateHeaderActions}>
                <TouchableOpacity
                  style={styles.regenerateButton}
                  onPress={() => setShowRegenerateOptions(true)}
                >
                  <Text style={styles.regenerateButtonText}>Regenerate</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.todayButton}
                  onPress={() => {
                    const today = new Date().toISOString().split('T')[0]
                    setSelectedDate(today)
                    // Navigate to the correct 3-day view that contains today
                    const todayIndex = allDates.findIndex(date => date.toISOString().split('T')[0] === today)
                    if (todayIndex >= 0) {
                      const newDayIndex = Math.floor(todayIndex / 3) * 3
                      setCurrentDayIndex(newDayIndex)
                    }
                  }}
                >
                  <Text style={styles.todayButtonIcon}>◉</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.mealsGrid}>
              {selectedMealPlan.meals
                .filter(meal => meal.mealType === 'breakfast')
                .map(meal => renderMealCard('breakfast', {
                  name: meal.foodName,
                  calories: meal.calories,
                  time: meal.scheduledTime || '08:00',
                  isCompleted: meal.isCompleted
                }))}
              {selectedMealPlan.meals
                .filter(meal => meal.mealType === 'lunch')
                .map(meal => renderMealCard('lunch', {
                  name: meal.foodName,
                  calories: meal.calories,
                  time: meal.scheduledTime || '12:30',
                  isCompleted: meal.isCompleted
                }))}
              {selectedMealPlan.meals
                .filter(meal => meal.mealType === 'dinner')
                .map(meal => renderMealCard('dinner', {
                  name: meal.foodName,
                  calories: meal.calories,
                  time: meal.scheduledTime || '19:00',
                  isCompleted: meal.isCompleted
                }))}
            </View>
          </View>
        )}

        {/* No meals selected state */}
        {!selectedMealPlan && !loading && mealPlans.length > 0 && (
          <View style={styles.noMealsContainer}>
            <Text style={styles.noMealsTitle}>No meals planned</Text>
            <Text style={styles.noMealsText}>Select a day with meal plans to view details</Text>
          </View>
        )}

        {/* Loading state */}
        {loading && (
          <View style={styles.noMealsContainer}>
            <Text style={styles.noMealsTitle}>Loading meal plans...</Text>
          </View>
        )}
      </ScrollView>

      {/* Generate Meals Modal */}
      <Modal
        visible={showGenerateMeals}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowGenerateMeals(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Generate Meal Plan</Text>
            <Text style={styles.modalText}>
              Create personalized meals for the next 3 weeks based on your preferences and dietary goals.
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowGenerateMeals(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={generateMealPlan}
              >
                <Text style={styles.modalConfirmText}>Generate</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Regenerate Options Modal */}
      <Modal
        visible={showRegenerateOptions}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowRegenerateOptions(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Regenerate Options</Text>
            <Text style={styles.modalText}>
              Customize how you'd like to regenerate your meal plan.
            </Text>
            
            {/* Options */}
            <View style={styles.optionsContainer}>
              <TouchableOpacity
                style={[styles.optionRow, regenerateOptions.useFridgeIngredients && styles.optionRowSelected]}
                onPress={() => setRegenerateOptions(prev => ({ 
                  ...prev, 
                  useFridgeIngredients: !prev.useFridgeIngredients 
                }))}
              >
                <View style={styles.optionInfo}>
                  <Text style={styles.optionIcon}>🥬</Text>
                  <View style={styles.optionTextContainer}>
                    <Text style={styles.optionTitle}>Use Fridge Ingredients</Text>
                    <Text style={styles.optionDescription}>Optimize meals with items from your fridge</Text>
                  </View>
                </View>
                <View style={[styles.checkbox, regenerateOptions.useFridgeIngredients && styles.checkboxSelected]}>
                  {regenerateOptions.useFridgeIngredients && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.optionRow, regenerateOptions.updateGoals && styles.optionRowSelected]}
                onPress={() => setRegenerateOptions(prev => ({ 
                  ...prev, 
                  updateGoals: !prev.updateGoals 
                }))}
              >
                <View style={styles.optionInfo}>
                  <Text style={styles.optionIcon}>🎯</Text>
                  <View style={styles.optionTextContainer}>
                    <Text style={styles.optionTitle}>Update Nutrition Goals</Text>
                    <Text style={styles.optionDescription}>Adjust calories and macros based on recent check-ins</Text>
                  </View>
                </View>
                <View style={[styles.checkbox, regenerateOptions.updateGoals && styles.checkboxSelected]}>
                  {regenerateOptions.updateGoals && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.optionRow, regenerateOptions.regenerateAll && styles.optionRowSelected]}
                onPress={() => setRegenerateOptions(prev => ({ 
                  ...prev, 
                  regenerateAll: !prev.regenerateAll 
                }))}
              >
                <View style={styles.optionInfo}>
                  <Text style={styles.optionIcon}>📅</Text>
                  <View style={styles.optionTextContainer}>
                    <Text style={styles.optionTitle}>Regenerate All Days</Text>
                    <Text style={styles.optionDescription}>Apply changes to entire 3-week meal plan</Text>
                  </View>
                </View>
                <View style={[styles.checkbox, regenerateOptions.regenerateAll && styles.checkboxSelected]}>
                  {regenerateOptions.regenerateAll && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </View>
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowRegenerateOptions(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={regenerateMealPlan}
                disabled={isGenerating}
              >
                <Text style={styles.modalConfirmText}>
                  {isGenerating ? 'Updating...' : 'Regenerate'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      </GestureHandlerRootView>
    </ScreenWrapper>
  )
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    fontFamily: 'Inter',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#4A4A4A',
    fontFamily: 'Inter',
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4A4A4A',
    fontFamily: 'Inter',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  progressSubtext: {
    fontSize: 12,
    color: '#4A4A4A',
    fontFamily: 'Inter',
  },
  progressPercentage: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6B8E23',
    fontFamily: 'Inter',
  },
  progressBarContainer: {
    width: '100%',
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: '#F0F0F0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#6B8E23',
    borderRadius: 2,
  },
  navigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  navButtonDisabled: {
    backgroundColor: '#F5F5F5',
    borderColor: '#F0F0F0',
  },
  navButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#6B8E23',
  },
  navButtonTextDisabled: {
    color: '#C0C0C0',
  },
  daysContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
  },
  dayCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    minWidth: 80,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    position: 'relative',
  },
  selectedDayCard: {
    borderColor: '#6B8E23',
    backgroundColor: '#F8FAF5',
    borderWidth: 2,
  },
  todayCard: {
    borderColor: '#DC6B3F',
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4A4A4A',
    fontFamily: 'Inter',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  selectedDayLabel: {
    color: '#6B8E23',
    fontWeight: '600',
  },
  todayDayLabel: {
    color: '#DC6B3F',
  },
  dayNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    fontFamily: 'Inter',
  },
  selectedDayNumber: {
    color: '#6B8E23',
  },
  todayDayNumber: {
    color: '#DC6B3F',
  },
  todayIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  todayDot: {
    fontSize: 8,
    color: '#DC6B3F',
  },
  selectedIndicator: {
    position: 'absolute',
    bottom: 6,
    alignSelf: 'center',
  },
  selectedIcon: {
    fontSize: 8,
    color: '#6B8E23',
  },
  generateButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 20,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  generateButtonIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  generateButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  mealsContainer: {
    paddingHorizontal: 20,
  },
  selectedDateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  dateHeaderActions: {
    flexDirection: 'row',
    gap: 8,
  },
  selectedDateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    fontFamily: 'Inter',
  },
  regenerateButton: {
    backgroundColor: '#6B8E23',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  regenerateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  todayButton: {
    backgroundColor: '#E6A245',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  todayButtonIcon: {
    fontSize: 22,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  mealsGrid: {
    gap: 16,
  },
  mealCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderLeftWidth: 4,
  },
  mealHeader: {
    marginBottom: 12,
  },
  mealTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mealTypeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Inter',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mealTime: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4A4A4A',
    fontFamily: 'Inter',
  },
  mealName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Inter',
    marginBottom: 8,
    lineHeight: 24,
  },
  mealCalories: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B8E23',
    fontFamily: 'Inter',
  },
  // Completed meal styles
  mealCardCompleted: {
    backgroundColor: '#F8F8F8',
    borderColor: '#D0D0D0',
    opacity: 0.7,
  },
  mealTypeLabelCompleted: {
    color: '#7A7A7A',
  },
  mealTimeCompleted: {
    color: '#7A7A7A',
  },
  mealNameCompleted: {
    color: '#7A7A7A',
    textDecorationLine: 'line-through',
  },
  mealCaloriesCompleted: {
    color: '#7A7A7A',
  },
  noMealsContainer: {
    padding: 40,
    alignItems: 'center',
  },
  noMealsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Inter',
    marginBottom: 8,
  },
  noMealsText: {
    fontSize: 14,
    color: '#4A4A4A',
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    fontFamily: 'Inter',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    color: '#4A4A4A',
    fontFamily: 'Inter',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A4A4A',
    fontFamily: 'Inter',
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: '#6B8E23',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  optionRowSelected: {
    borderColor: '#6B8E23',
    backgroundColor: '#F8FAF5',
  },
  optionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Inter',
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 14,
    color: '#4A4A4A',
    fontFamily: 'Inter',
    lineHeight: 18,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    borderColor: '#6B8E23',
    backgroundColor: '#6B8E23',
  },
  checkmark: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
  },
})