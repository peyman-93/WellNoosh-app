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
import AsyncStorage from '@react-native-async-storage/async-storage'
import { ScreenWrapper } from '../../src/components/layout/ScreenWrapper'

interface MealPlan {
  id: string
  date: string
  meals: {
    breakfast?: { name: string; calories: number; time: string }
    lunch?: { name: string; calories: number; time: string }
    dinner?: { name: string; calories: number; time: string }
  }
}

interface UserData {
  fullName: string
  email: string
  age?: number
  gender?: string
  weight?: number
  weightUnit?: 'kg' | 'lbs'
  height?: number
  heightUnit?: 'cm' | 'ft'
  dietStyle?: string[]
  healthGoals?: string[]
  activityLevel?: string
}

const { width: screenWidth } = Dimensions.get('window')

export default function PlannerScreen() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [userData, setUserData] = useState<UserData | null>(null)
  const [dailyCalories, setDailyCalories] = useState(2000)
  const [isGenerating, setIsGenerating] = useState(false)
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
    try {
      const savedPlans = await AsyncStorage.getItem('mealPlans')
      if (savedPlans) {
        setMealPlans(JSON.parse(savedPlans))
      }
    } catch (error) {
      console.error('Error loading meal plans:', error)
    }
  }

  const loadUserData = async () => {
    try {
      const savedUserData = await AsyncStorage.getItem('userData')
      if (savedUserData) {
        setUserData(JSON.parse(savedUserData))
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    }
  }

  const saveMealPlans = async (plans: MealPlan[]) => {
    try {
      await AsyncStorage.setItem('mealPlans', JSON.stringify(plans))
      setMealPlans(plans)
    } catch (error) {
      console.error('Error saving meal plans:', error)
    }
  }

  const generateMealsForDate = (date: Date): MealPlan => {
    const dateString = date.toISOString().split('T')[0]
    
    const mealOptions = {
      breakfast: [
        { name: 'Overnight Oats with Berries', calories: 320 },
        { name: 'Greek Yogurt Parfait', calories: 280 },
        { name: 'Avocado Toast with Eggs', calories: 380 },
        { name: 'Smoothie Bowl', calories: 300 },
        { name: 'Whole Grain Pancakes', calories: 420 }
      ],
      lunch: [
        { name: 'Mediterranean Quinoa Salad', calories: 450 },
        { name: 'Grilled Chicken Wrap', calories: 520 },
        { name: 'Lentil Soup with Bread', calories: 390 },
        { name: 'Buddha Bowl', calories: 480 },
        { name: 'Turkey Club Sandwich', calories: 510 }
      ],
      dinner: [
        { name: 'Salmon with Roasted Vegetables', calories: 580 },
        { name: 'Chicken Stir-Fry', calories: 540 },
        { name: 'Pasta Primavera', calories: 620 },
        { name: 'Beef and Vegetable Curry', calories: 590 },
        { name: 'Stuffed Bell Peppers', calories: 460 }
      ]
    }

    const getRandomMeal = (mealType: keyof typeof mealOptions) => {
      const options = mealOptions[mealType]
      return options[Math.floor(Math.random() * options.length)]
    }

    return {
      id: `plan-${dateString}`,
      date: dateString,
      meals: {
        breakfast: { ...getRandomMeal('breakfast'), time: '08:00' },
        lunch: { ...getRandomMeal('lunch'), time: '12:30' },
        dinner: { ...getRandomMeal('dinner'), time: '19:00' }
      }
    }
  }

  const generateMealPlan = async () => {
    setIsGenerating(true)
    setShowGenerateMeals(false)
    
    try {
      // Generate meals for all 21 days
      const newPlans = allDates.map(date => generateMealsForDate(date))
      await saveMealPlans(newPlans)
    } catch (error) {
      Alert.alert('Error', 'Failed to generate meal plan. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const regenerateMealPlan = async () => {
    setIsGenerating(true)
    setShowRegenerateOptions(false)
    
    try {
      let datesToRegenerate = []
      
      if (regenerateOptions.regenerateAll) {
        // Regenerate all 21 days
        datesToRegenerate = allDates
      } else {
        // Regenerate only selected date
        datesToRegenerate = [new Date(selectedDate)]
      }
      
      // Generate new meals based on options
      const newPlans = datesToRegenerate.map(date => {
        const plan = generateMealsForDate(date)
        
        // If using fridge ingredients, modify meal names to indicate this
        if (regenerateOptions.useFridgeIngredients) {
          Object.keys(plan.meals).forEach(mealType => {
            const meal = plan.meals[mealType as keyof typeof plan.meals]
            if (meal) {
              meal.name = `${meal.name} (using fridge ingredients)`
            }
          })
        }
        
        return plan
      })
      
      // Update existing plans or create new ones
      const updatedPlans = [...mealPlans]
      newPlans.forEach(newPlan => {
        const existingIndex = updatedPlans.findIndex(plan => plan.date === newPlan.date)
        if (existingIndex >= 0) {
          updatedPlans[existingIndex] = newPlan
        } else {
          updatedPlans.push(newPlan)
        }
      })
      
      await saveMealPlans(updatedPlans)
      
      // Reset options
      setRegenerateOptions({
        useFridgeIngredients: false,
        updateGoals: false,
        regenerateAll: false
      })
      
    } catch (error) {
      Alert.alert('Error', 'Failed to regenerate meal plan. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  useEffect(() => {
    loadMealPlans()
    loadUserData()
  }, [])

  const selectedMealPlan = mealPlans.find(plan => plan.date === selectedDate)
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

    return (
      <View style={[styles.mealCard, { borderLeftColor: mealColors[mealType] }]}>
        <View style={styles.mealHeader}>
          <View style={styles.mealTitleRow}>
            <Text style={styles.mealTypeLabel}>
              {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
            </Text>
            <Text style={styles.mealTime}>{meal.time}</Text>
          </View>
        </View>
        <Text style={styles.mealName}>{meal.name}</Text>
        <Text style={styles.mealCalories}>{meal.calories} cal</Text>
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
      const planDate = new Date(plan.date)
      return planDate.getMonth() === currentMonth && 
             planDate.getFullYear() === currentYear &&
             plan.meals && Object.keys(plan.meals).length > 0
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
    const hasMeals = mealPlans.some(plan => plan.date === dateString)

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
              {selectedMealPlan.meals.breakfast && renderMealCard('breakfast', selectedMealPlan.meals.breakfast)}
              {selectedMealPlan.meals.lunch && renderMealCard('lunch', selectedMealPlan.meals.lunch)}
              {selectedMealPlan.meals.dinner && renderMealCard('dinner', selectedMealPlan.meals.dinner)}
            </View>
          </View>
        )}

        {/* No meals selected state */}
        {!selectedMealPlan && mealPlans.length > 0 && (
          <View style={styles.noMealsContainer}>
            <Text style={styles.noMealsTitle}>No meals planned</Text>
            <Text style={styles.noMealsText}>Select a day with meal plans to view details</Text>
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