import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { View, Text, ScrollView, StyleSheet, Pressable, Alert, TouchableOpacity, Modal, TextInput, Dimensions, RefreshControl } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useNavigation } from '@react-navigation/native'
import { CommonActions } from '@react-navigation/native'
import Svg, { Circle, G, Text as SvgText } from 'react-native-svg'
import { useAuth } from '../../src/context/supabase-provider'

// Components
import { WaterTracker } from '../../src/components/features/WaterTracker'
import { BreathingExercises } from '../../src/components/features/BreathingExercises'
import { AddMealModal } from '../../src/components/modals/AddMealModal'
import DailyCheckInScreen from '../DailyCheckInScreen'
import { HealthyPlateIcon } from '../../src/components/Icons/HealthyPlateIcon'
import { ScreenWrapper } from '../../src/components/layout/ScreenWrapper'

// Services
import { getTodaysMealPlan, completePlannedMeal, uncompletePlannedMeal, addPlannedMeal } from '../../src/services/mealPlanService'
import { generateAndSaveMealPlan, getUserCalorieTarget, getUserDietaryRestrictions } from '../../src/services/mealPlanGenerator'
import type { DashboardMealPlan, DashboardMeal } from '../../src/types/mealPlan'

const { width: screenWidth } = Dimensions.get('window')

// Circular Progress Component
interface CircularProgressProps {
  value: number
  maxValue: number
  size: number
  strokeWidth: number
  primaryColor: string
  secondaryColor: string
  label: string
  unit: string
}

function CircularProgress({ 
  value, 
  maxValue, 
  size, 
  strokeWidth, 
  primaryColor, 
  secondaryColor, 
  label, 
  unit 
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const percentage = Math.min((value / maxValue) * 100, 100)
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <View style={styles.progressContainer}>
      <Svg width={size} height={size} style={styles.progressSvg}>
        <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
          {/* Background Circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={secondaryColor}
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress Circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={primaryColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </G>
      </Svg>
      <View style={[styles.progressContent, { width: size, height: size }]}>
        <Text style={styles.progressValue}>{Math.round(value)}</Text>
        <Text style={styles.progressUnit}>/{maxValue}{unit}</Text>
      </View>
      <Text style={styles.progressLabel}>{label}</Text>
    </View>
  )
}

// Meal Card Component
interface MealCardProps {
  meal: {
    id: string
    time: string
    title: string
    icon: string
    completed: boolean
    calories?: number
  }
  onToggle: () => void
}

function MealCard({ meal, onToggle }: MealCardProps) {
  return (
    <TouchableOpacity 
      style={[styles.mealCard, meal.completed && styles.mealCardCompleted]}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <View style={styles.mealCardContent}>
        <View style={styles.mealCardLeft}>
          <Text style={styles.mealTime}>{meal.time}</Text>
          <Text style={styles.mealTitle}>{meal.title}</Text>
          {meal.calories && meal.completed && (
            <Text style={styles.mealCalories}>{meal.calories} cal</Text>
          )}
        </View>
        <View style={styles.mealCardRight}>
          <Text style={styles.mealIcon}>{meal.icon}</Text>
          <View style={[styles.mealCheckbox, meal.completed && styles.mealCheckboxCompleted]}>
            {meal.completed && <Text style={styles.checkmark}>✓</Text>}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  )
}


export default function DashboardScreen() {
  const { session, signOut } = useAuth()
  const navigation = useNavigation()
  
  // State
  const [showDailyCheckIn, setShowDailyCheckIn] = useState(false)
  const [showAddMeal, setShowAddMeal] = useState(false)
  // Customizable nutrition wheels
  const [selectedWheels, setSelectedWheels] = useState(['calories', 'protein', 'fiber'])
  const [showNutritionModal, setShowNutritionModal] = useState(false)
  const [showAllMeals, setShowAllMeals] = useState(false)
  
  // Meal plan state
  const [dashboardMealPlan, setDashboardMealPlan] = useState<DashboardMealPlan | null>(null)
  const [loadingMealPlan, setLoadingMealPlan] = useState(true)
  const [generatingMealPlan, setGeneratingMealPlan] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  
  // Greeting state
  const [greeting, setGreeting] = useState('')

  // Water tracking state
  const [waterIntake, setWaterIntake] = useState<boolean[]>(new Array(10).fill(false))
  const completedGlasses = waterIntake.filter(glass => glass).length

  // Breathing exercises state
  const [showBreathingExercise, setShowBreathingExercise] = useState(false)
  const [breathingExercises, setBreathingExercises] = useState<boolean[]>(new Array(6).fill(false))
  const completedBreathingExercises = breathingExercises.filter(exercise => exercise).length

  // Update greeting based on current time
  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours()
      
      let newGreeting
      if (hour < 12) {
        newGreeting = 'Good morning'
      } else if (hour < 17) {
        newGreeting = 'Good afternoon'
      } else {
        newGreeting = 'Good evening'
      }
      
      setGreeting(newGreeting)
    }
    
    updateGreeting() // Set initial greeting
  }, [])

  // Load today's meal plan on component mount
  useEffect(() => {
    const loadTodaysMealPlan = async () => {
      if (!session?.user?.id) return

      try {
        setLoadingMealPlan(true)
        const today = new Date().toISOString().split('T')[0]
        console.log('🔄 Loading meal plan for today:', today, 'User:', session.user.id)
        console.log('🌍 Current timezone offset:', new Date().getTimezoneOffset())
        console.log('📅 Current date object:', new Date())
        
        const mealPlan = await getTodaysMealPlan(session.user.id)
        
        if (mealPlan) {
          console.log('✅ Loaded meal plan:', mealPlan)
          setDashboardMealPlan(mealPlan)
        } else {
          console.log('ℹ️ No meal plan found for today:', today)
          setDashboardMealPlan(null)
        }
      } catch (error) {
        console.error('❌ Error loading meal plan (expected due to simplified database):', error)
        // Gracefully handle missing meal plan services - show no meal plan state
        setDashboardMealPlan(null)
      } finally {
        setLoadingMealPlan(false)
      }
    }

    loadTodaysMealPlan()
  }, [session?.user?.id])

  // Generate meal plan for today
  const handleGenerateMealPlan = async () => {
    if (!session?.user?.id || generatingMealPlan) return

    try {
      setGeneratingMealPlan(true)
      console.log('🤖 Generating meal plan for today...')

      const [targetCalories, dietaryRestrictions] = await Promise.all([
        getUserCalorieTarget(session.user.id),
        getUserDietaryRestrictions(session.user.id)
      ])

      const planDate = new Date()
      console.log('🗓️ Generating meal plan for date:', planDate)
      console.log('🗓️ Plan date ISO:', planDate.toISOString().split('T')[0])
      
      await generateAndSaveMealPlan({
        userId: session.user.id,
        planDate,
        targetCalories,
        dietaryRestrictions,
        mealsPerDay: 3,
        includeSnacks: true
      })

      // Reload meal plan with a small delay to ensure database has propagated
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const newMealPlan = await getTodaysMealPlan(session.user.id)
      console.log('🔄 Reloaded meal plan after generation:', newMealPlan)
      setDashboardMealPlan(newMealPlan)
      
      if (newMealPlan) {
        console.log('✅ Generated and loaded meal plan successfully')
        Alert.alert('Success', 'Generated your meal plan for today!')
      } else {
        console.log('⚠️ Meal plan was generated but not loaded properly')
        Alert.alert('Success', 'Meal plan generated! Pull down to refresh.')
      }

    } catch (error) {
      console.error('❌ Error generating meal plan:', error)
      Alert.alert('Error', 'Failed to generate meal plan. Please try again.')
    } finally {
      setGeneratingMealPlan(false)
    }
  }

  // Refresh meal plan data
  const onRefresh = useCallback(async () => {
    if (!session?.user?.id) return

    try {
      setRefreshing(true)
      console.log('🔄 Refreshing meal plan data...')
      
      const today = new Date().toISOString().split('T')[0]
      const mealPlan = await getTodaysMealPlan(session.user.id)
      
      console.log('🔄 Refreshed meal plan:', mealPlan)
      setDashboardMealPlan(mealPlan)
      
    } catch (error) {
      console.error('❌ Error refreshing meal plan:', error)
    } finally {
      setRefreshing(false)
    }
  }, [session?.user?.id])

  // Utility function to format time from HH:MM:SS to HH:MM
  const formatTime = (timeString: string): string => {
    if (!timeString) return '12:00'
    
    // If already in HH:MM format, return as is
    if (timeString.split(':').length === 2) return timeString
    
    // If in HH:MM:SS format, extract HH:MM
    const parts = timeString.split(':')
    if (parts.length >= 2) {
      return `${parts[0]}:${parts[1]}`
    }
    
    return timeString || '12:00'
  }

  // Calculate nutrition data from completed meals
  const calculateCompletedCalories = () => {
    if (dashboardMealPlan) {
      const calories = dashboardMealPlan.completionStats.caloriesCompleted
      console.log('🍽️ Dashboard calculated calories:', calories, 'from', dashboardMealPlan.completionStats.completedMeals, 'completed meals')
      return calories
    }
    return 0
  }

  const calculateCompletedNutrition = () => {
    if (!dashboardMealPlan) return { protein: 0, carbs: 0, fat: 0, fiber: 0 }
    
    const completedMeals = dashboardMealPlan.meals.filter(meal => meal.isCompleted)
    const totalCalories = completedMeals.reduce((sum, meal) => sum + meal.calories, 0)
    
    // Rough estimates based on calories (these would be more accurate with real nutrition data)
    return {
      protein: Math.round(totalCalories * 0.05), // ~20% of calories from protein
      carbs: Math.round(totalCalories * 0.12),   // ~50% of calories from carbs  
      fat: Math.round(totalCalories * 0.04),     // ~30% of calories from fat
      fiber: Math.round(totalCalories * 0.01)    // Rough fiber estimate
    }
  }

  const completedNutrition = calculateCompletedNutrition()
  const nutritionData = {
    calories: { completed: calculateCompletedCalories(), goal: dashboardMealPlan?.mealPlan.target_calories || 2000, unit: '' },
    protein: { completed: completedNutrition.protein, goal: dashboardMealPlan?.mealPlan.target_protein_g || 60, unit: 'g' },
    fiber: { completed: completedNutrition.fiber, goal: 25, unit: 'g' },
    carbs: { completed: completedNutrition.carbs, goal: dashboardMealPlan?.mealPlan.target_carbs_g || 250, unit: 'g' },
    fat: { completed: completedNutrition.fat, goal: dashboardMealPlan?.mealPlan.target_fat_g || 65, unit: 'g' },
    sugar: { completed: Math.round(calculateCompletedCalories() * 0.03), goal: 50, unit: 'g' },
    sodium: { completed: Math.round(calculateCompletedCalories() * 1.4), goal: 2300, unit: 'mg' },
    water: { completed: completedGlasses, goal: 10, unit: '' }
  }

  const handleToggleMeal = async (mealId: string) => {
    if (!dashboardMealPlan) return

    const meal = dashboardMealPlan.meals.find(m => m.id === mealId)
    if (!meal) return

    try {
      console.log('🔄 Toggling meal completion:', mealId, 'current state:', meal.isCompleted)

      if (meal.isCompleted) {
        // Uncomplete the meal
        await uncompletePlannedMeal(mealId)
      } else {
        // Complete the meal
        await completePlannedMeal({ meal_id: mealId })
      }

      // Reload meal plan to get updated completion status
      const updatedMealPlan = await getTodaysMealPlan(session!.user!.id)
      setDashboardMealPlan(updatedMealPlan)
      
      // Give the database trigger time to update daily_nutrition_summary
      // This ensures Health Tracker will show updated data
      setTimeout(() => {
        console.log('📊 Meal completion should now be reflected in nutrition tracking')
      }, 100)

      console.log('✅ Meal completion toggled successfully')

    } catch (error) {
      console.error('❌ Error toggling meal completion:', error)
      Alert.alert('Error', 'Failed to update meal status. Please try again.')
    }
  }


  const handleAddMeal = () => {
    if (!dashboardMealPlan) {
      Alert.alert(
        'No Meal Plan',
        'You need a meal plan to add meals. Would you like to generate one?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Generate Plan', onPress: handleGenerateMealPlan }
        ]
      )
      return
    }
    setShowAddMeal(true)
  }

  // Wellness wheel handlers
  const handleWaterWheelPress = () => {
    // Add one glass of water when the wheel is pressed
    const nextIncompleteIndex = waterIntake.findIndex(glass => !glass)
    if (nextIncompleteIndex !== -1) {
      setWaterIntake(prev => {
        const newIntake = [...prev]
        newIntake[nextIncompleteIndex] = true
        return newIntake
      })
    }
  }

  const handleBreathingExerciseComplete = () => {
    // Complete one breathing exercise
    const nextIncompleteIndex = breathingExercises.findIndex(exercise => !exercise)
    if (nextIncompleteIndex !== -1) {
      setBreathingExercises(prev => {
        const newExercises = [...prev]
        newExercises[nextIncompleteIndex] = true
        return newExercises
      })
    }
    setShowBreathingExercise(false)
  }

  const handleBreathingCircleClick = (index: number) => {
    setBreathingExercises(prev => {
      const newExercises = [...prev]
      newExercises[index] = !newExercises[index]
      return newExercises
    })
  }

  const handleSaveMealFromModal = useCallback(async (mealData: any) => {
    if (!session?.user?.id || !dashboardMealPlan) {
      Alert.alert('Error', 'Please generate a meal plan first or try again later.')
      return
    }

    try {
      console.log('🔄 Adding manual meal to meal plan:', mealData)

      const getCaloriesForType = () => {
        if (mealData.calories) return parseInt(mealData.calories)
        
        const calorieMap = {
          // Meals
          breakfast: 400, lunch: 550, dinner: 650, brunch: 500,
          // Snacks
          snack: 150, 'light-snack': 80, 'protein-snack': 200,
          // Beverages
          water: 0, coffee: 5, tea: 2, soda: 150, juice: 110, 
          'energy-drink': 160, smoothie: 250, 'sports-drink': 80,
          // Alcohol
          beer: 150, wine: 120, cocktail: 200, spirits: 100,
          // Desserts
          dessert: 350, 'ice-cream': 250, cake: 400, pastry: 300,
          // Supplements
          supplement: 25, 'protein-shake': 120, vitamins: 5,
          // Fast Food
          'fast-food': 600, pizza: 285, burger: 540,
          // Other
          gum: 5, candy: 50
        }
        
        let baseCalories = calorieMap[mealData.type] || 300
        
        // Adjust for drink options
        if (['coffee', 'tea', 'soda', 'smoothie'].includes(mealData.type)) {
          const sizeMultiplier = { small: 0.8, medium: 1, large: 1.3 }[mealData.drinkOptions?.size || 'medium']
          baseCalories *= sizeMultiplier
          if (mealData.drinkOptions?.withSugar) baseCalories += 20
          if (mealData.drinkOptions?.withMilk) baseCalories += 30
        }
        
        return Math.round(baseCalories)
      }

      const getTitleForType = () => {
        if (mealData.title) return mealData.title
        if (mealData.recordedText) return mealData.recordedText.slice(0, 30) + '...'
        
        const titleMap = {
          // Meals
          breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', brunch: 'Brunch',
          // Snacks
          snack: 'Snack', 'light-snack': 'Light Snack', 'protein-snack': 'Protein Snack',
          // Beverages
          water: 'Water', coffee: 'Coffee', tea: 'Tea', soda: 'Soda', juice: 'Juice',
          'energy-drink': 'Energy Drink', smoothie: 'Smoothie', 'sports-drink': 'Sports Drink',
          // Alcohol
          beer: 'Beer', wine: 'Wine', cocktail: 'Cocktail', spirits: 'Spirits',
          // Desserts
          dessert: 'Dessert', 'ice-cream': 'Ice Cream', cake: 'Cake', pastry: 'Pastry',
          // Supplements
          supplement: 'Supplement', 'protein-shake': 'Protein Shake', vitamins: 'Vitamins',
          // Fast Food
          'fast-food': 'Fast Food', pizza: 'Pizza', burger: 'Burger',
          // Other
          gum: 'Gum', candy: 'Candy'
        }
        
        let title = titleMap[mealData.type] || 'Food Entry'
        
        // Add drink modifiers
        if (['coffee', 'tea', 'soda', 'smoothie'].includes(mealData.type)) {
          const modifiers = []
          if (mealData.drinkOptions?.size) {
            modifiers.push(mealData.drinkOptions.size.charAt(0).toUpperCase() + mealData.drinkOptions.size.slice(1))
          }
          if (mealData.drinkOptions?.withMilk) modifiers.push('with Milk')
          if (mealData.drinkOptions?.withSugar) modifiers.push('with Sugar')
          if (modifiers.length > 0) title += ` (${modifiers.join(', ')})`
        }
        
        return title
      }

      // Map meal type to our standard meal types
      const mapMealType = (type: string) => {
        const mealTypeMap: { [key: string]: string } = {
          'breakfast': 'breakfast',
          'lunch': 'lunch', 
          'dinner': 'dinner',
          'brunch': 'brunch',
          'snack': 'snack',
          'light-snack': 'snack',
          'protein-snack': 'snack',
          // All other types default to 'other'
        }
        return mealTypeMap[type] || 'other'
      }

      // Add the meal to the current meal plan
      await addPlannedMeal({
        meal_plan_id: dashboardMealPlan.mealPlan.id,
        meal_type: mapMealType(mealData.type) as any,
        meal_order: 1,
        scheduled_time: mealData.time,
        food_name: getTitleForType(),
        calories: getCaloriesForType(),
        serving_size: 1,
        serving_unit: 'serving',
        food_category: mealData.type,
        preparation_method: 'Manual entry',
        difficulty_level: 'easy',
        notes: mealData.description || mealData.recordedText || null
      })

      // Reload meal plan to show the new meal
      const updatedMealPlan = await getTodaysMealPlan(session.user.id)
      setDashboardMealPlan(updatedMealPlan)

      console.log('✅ Added manual meal to meal plan')
      Alert.alert('Success', 'Added meal to your plan!')

    } catch (error) {
      console.error('❌ Error adding manual meal:', error)
      Alert.alert('Error', 'Failed to add meal. Please try again.')
    }
  }, [session?.user?.id, dashboardMealPlan])



  const getWheelColor = (wheelId: string) => {
    const colors = {
      calories: '#6B8E23',      // Organic leaf green - primary
      protein: '#DC6B3F',       // Warm terracotta red - protein
      fiber: '#8BA654',         // Fresh sage green - fiber  
      carbs: '#E6A245',         // Golden wheat - carbs
      fat: '#B8860B',           // Dark golden - healthy fats
      sugar: '#9B6BA6',         // Muted berry purple - sugar
      sodium: '#708090',        // Slate gray - sodium
      water: '#4A90E2'          // Ocean blue - water
    }
    return colors[wheelId as keyof typeof colors] || '#6B8E23'
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'WelcomeScreen' as never }],
        })
      )
    } catch (error) {
      console.error('Error signing out:', error)
      Alert.alert('Error', 'Failed to sign out. Please try again.')
    }
  }

  const handleProfilePress = () => {
    navigation.navigate('Profile' as never)
  }

  // Get meal statistics from dashboard meal plan
  const completedMeals = dashboardMealPlan?.completionStats.completedMeals || 0
  const totalMeals = dashboardMealPlan?.completionStats.totalMeals || 0

  // Get the 2 meals closest to current time
  const getContextualMeals = () => {
    if (!dashboardMealPlan?.meals) return []

    const now = new Date()
    const currentTime = now.getHours() * 60 + now.getMinutes() // Current time in minutes

    // Calculate time distance for each meal
    const mealsWithTimeDistance = dashboardMealPlan.meals.map(meal => {
      const [hours, minutes] = meal.scheduledTime.split(':').map(Number)
      const mealTimeInMinutes = hours * 60 + minutes
      
      // Calculate absolute time difference
      let timeDiff = Math.abs(currentTime - mealTimeInMinutes)
      
      // Handle wrap-around for meals near midnight
      if (timeDiff > 720) { // More than 12 hours
        timeDiff = 1440 - timeDiff // 24 hours - difference
      }
      
      return {
        ...meal,
        timeDistance: timeDiff,
        mealTimeInMinutes
      }
    })

    // Sort by time distance (closest first)
    const sortedByDistance = [...mealsWithTimeDistance].sort((a, b) => a.timeDistance - b.timeDistance)
    
    // Take the 2 closest meals
    const closestMeals = sortedByDistance.slice(0, 2)
    
    // Sort these 2 meals by actual scheduled time for display
    const recentMeals = closestMeals.sort((a, b) => a.mealTimeInMinutes - b.mealTimeInMinutes)
      .map((meal, index) => ({
        ...meal,
        contextLabel: meal.isCompleted ? 'Completed' : 
                     meal.mealTimeInMinutes < currentTime ? 'Recent' : 'Upcoming',
        isContextual: true
      }))
    
    console.log(`🍽️ Current time: ${Math.floor(currentTime/60)}:${String(currentTime%60).padStart(2, '0')}`)
    console.log('🍽️ Showing 2 meals closest to current time:')
    recentMeals.forEach((meal, index) => {
      console.log(`  ${index + 1}. ${meal.foodName} at ${meal.scheduledTime} - ${meal.contextLabel} (${meal.timeDistance} min away)`)
    })
    
    return recentMeals
  }

  const contextualMeals = getContextualMeals()

  // Meal plan progress calculations
  const getMealPlanPercentage = () => {
    if (!dashboardMealPlan) return 0
    return dashboardMealPlan.completionStats.percentage
  }

  const getMealPlanDaysPlanned = () => {
    // This would come from a separate query in a real app
    return dashboardMealPlan ? 1 : 0
  }


  return (
    <ScreenWrapper>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting}, {session?.user?.user_metadata?.name || session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || 'Guest'}</Text>
            <Text style={styles.date}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.profileButton}>
              <Text style={styles.profileIcon}>👤</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Nutrition Wheels */}
        <View style={styles.wheelsContainer}>
          {selectedWheels.map((wheelId, index) => {
            const data = nutritionData[wheelId as keyof typeof nutritionData]
            const color = getWheelColor(wheelId)
            return (
              <TouchableOpacity
                key={wheelId}
                onPress={() => setShowNutritionModal(true)}
                activeOpacity={0.8}
              >
                <CircularProgress
                  value={data.completed}
                  maxValue={data.goal}
                  size={100}
                  strokeWidth={8}
                  primaryColor={color}
                  secondaryColor={`${color}20`}
                  label={wheelId.charAt(0).toUpperCase() + wheelId.slice(1)}
                  unit={data.unit}
                />
              </TouchableOpacity>
            )
          })}
        </View>

        {/* Wellness Action Wheels */}
        <View style={styles.wellnessWheelsContainer}>
          {/* Breathing Exercise Wheel */}
          <TouchableOpacity
            style={styles.wellnessWheel}
            onPress={() => setShowBreathingExercise(true)}
            activeOpacity={0.8}
          >
            <View style={styles.wellnessWheelInner}>
              <View style={styles.wellnessTextContainer}>
                <Text style={styles.wellnessLabel}>Breathe</Text>
              </View>
            </View>
            <View style={styles.wellnessProgressRing}>
              <Svg width={60} height={60} style={styles.wellnessRingSvg}>
                <Circle
                  cx={30}
                  cy={30}
                  r={25}
                  stroke="#E0E0E0"
                  strokeWidth={3}
                  fill="none"
                />
                <Circle
                  cx={30}
                  cy={30}
                  r={25}
                  stroke="#6B8E23"
                  strokeWidth={3}
                  fill="none"
                  strokeDasharray={`${(completedBreathingExercises / 6) * 157} 157`}
                  strokeDashoffset={-39.25}
                  strokeLinecap="round"
                />
              </Svg>
              <View style={styles.wellnessProgressText}>
                <Text style={styles.wellnessProgressNumber}>{completedBreathingExercises}</Text>
                <Text style={styles.wellnessProgressTotal}>/6</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Water Tracking Wheel */}
          <TouchableOpacity
            style={styles.wellnessWheel}
            onPress={handleWaterWheelPress}
            activeOpacity={0.8}
          >
            <View style={styles.wellnessWheelInner}>
              <View style={styles.wellnessTextContainer}>
                <Text style={styles.wellnessLabel}>Hydrate</Text>
              </View>
            </View>
            <View style={styles.wellnessProgressRing}>
              <Svg width={60} height={60} style={styles.wellnessRingSvg}>
                <Circle
                  cx={30}
                  cy={30}
                  r={25}
                  stroke="#E0E0E0"
                  strokeWidth={3}
                  fill="none"
                />
                <Circle
                  cx={30}
                  cy={30}
                  r={25}
                  stroke="#4A90E2"
                  strokeWidth={3}
                  fill="none"
                  strokeDasharray={`${(completedGlasses / 10) * 157} 157`}
                  strokeDashoffset={-39.25}
                  strokeLinecap="round"
                />
              </Svg>
              <View style={styles.wellnessProgressText}>
                <Text style={styles.wellnessProgressNumber}>{completedGlasses}</Text>
                <Text style={styles.wellnessProgressTotal}>/10</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Meal's Plan Section */}
        <View style={styles.mealPlanSection}>
          <View style={styles.mealPlanningHeader}>
            <View style={styles.mealPlanningTitleSection}>
              <Text style={styles.mealPlanningTitle}>Meal's Plan</Text>
              {dashboardMealPlan ? (
                <Text style={styles.mealPlanningSubtitle}>{greeting}! {completedMeals} of {totalMeals} completed today</Text>
              ) : (
                <Text style={styles.mealPlanningSubtitle}>{greeting}! Plan your daily nutrition</Text>
              )}
            </View>
            
            <View style={styles.mealPlanningActions}>
              {/* Generate/Add Button */}
              {dashboardMealPlan ? (
                <TouchableOpacity 
                  style={styles.addMealButton} 
                  onPress={handleAddMeal}
                  activeOpacity={0.7}
                >
                  <Text style={styles.addMealIcon}>+</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={[styles.generateMealButton, { opacity: generatingMealPlan ? 0.5 : 1 }]}
                  onPress={handleGenerateMealPlan}
                  activeOpacity={0.7}
                  disabled={generatingMealPlan}
                >
                  <Text style={styles.generateMealButtonText}>
                    {generatingMealPlan ? 'Generating...' : 'Generate Plan'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          
          
          {dashboardMealPlan ? (
            <View style={styles.mealsCompactGrid}>
              {(showAllMeals ? dashboardMealPlan.meals : contextualMeals).map(meal => (
                <TouchableOpacity
                  key={meal.id}
                  style={[styles.mealCompactCard, meal.isCompleted && styles.mealCompactCardCompleted]}
                  onPress={() => handleToggleMeal(meal.id)}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.mealCompactLeft,
                    meal.isCompleted ? styles.mealCompactLeftCompleted : styles.mealCompactLeftIncomplete
                  ]}>
                    <Text style={[
                      styles.mealCompactTimeLeft,
                      !meal.isCompleted && { color: '#4A4A4A' }
                    ]}>{formatTime(meal.scheduledTime)}</Text>
                  </View>
                  <View style={styles.mealCompactRight}>
                    <Text style={styles.mealCompactTitle}>{meal.foodName}</Text>
                    <View style={styles.mealCompactBottomRow}>
                      <Text style={styles.mealCompactCalories}>
                        {meal.calories} cal
                      </Text>
                      {!showAllMeals && meal.contextLabel && (
                        <Text style={[
                          styles.mealContextLabel,
                          meal.contextLabel === 'Completed' && styles.mealContextCompleted,
                          meal.contextLabel === 'Latest' && styles.mealContextCurrent,
                          meal.contextLabel === 'Recent' && styles.mealContextNext,
                        ]}>
                          {meal.contextLabel}
                        </Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
              
              {/* Show "more" indicator when there are hidden meals */}
              {!showAllMeals && dashboardMealPlan.meals.length > contextualMeals.length && (
                <TouchableOpacity 
                  style={styles.moreMealsButton}
                  onPress={() => setShowAllMeals(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.moreMealsText}>
                    +{dashboardMealPlan.meals.length - contextualMeals.length} more
                  </Text>
                </TouchableOpacity>
              )}
              
              {/* Show "show less" option when expanded */}
              {showAllMeals && (
                <TouchableOpacity 
                  style={styles.showLessButton}
                  onPress={() => setShowAllMeals(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.showLessText}>Show less</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : loadingMealPlan ? (
            <View style={styles.mealPlanLoading}>
              <Text style={styles.mealPlanLoadingText}>Loading meal plan...</Text>
            </View>
          ) : (
            <View style={styles.noMealPlan}>
              <Text style={styles.noMealPlanText}>No meal plan for today</Text>
              <Text style={styles.noMealPlanSubtext}>Generate a meal plan or manually add meals</Text>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          {/* Reflect Button - Wide */}
          <TouchableOpacity style={styles.reflectButton} onPress={() => setShowDailyCheckIn(true)}>
            <View style={styles.reflectButtonContent}>
              <View style={styles.reflectIconContainer}>
                <Text style={styles.reflectIcon}>✨</Text>
              </View>
              <View style={styles.reflectTextContainer}>
                <Text style={styles.reflectLabel}>Daily Reflection</Text>
                <Text style={styles.reflectSubtitle}>Track your wellness journey</Text>
              </View>
            </View>
          </TouchableOpacity>
          
          
          {/* Health Tracker Button */}
          <TouchableOpacity style={styles.healthTrackerButton} onPress={() => navigation.navigate('TrackerScreen' as never)}>
            <View style={styles.healthTrackerContent}>
              <View style={styles.healthTrackerIconContainer}>
                <Text style={styles.healthTrackerIcon}>📊</Text>
              </View>
              <View style={styles.healthTrackerTextContainer}>
                <Text style={styles.healthTrackerLabel}>Health Tracker</Text>
                <Text style={styles.healthTrackerSubtitle}>Monitor your wellness journey</Text>
              </View>
              <View style={styles.healthTrackerStats}>
                <Text style={styles.healthTrackerValue}>74.1</Text>
                <Text style={styles.healthTrackerUnit}>kg</Text>
              </View>
            </View>
          </TouchableOpacity>
          
          {/* Healthy Plate Button */}
          <TouchableOpacity style={styles.healthyPlateButton} onPress={() => navigation.navigate('V3Inspiration' as never)}>
            <View style={styles.healthyPlateContent}>
              <View style={styles.healthyPlateIconContainer}>
                <HealthyPlateIcon width={24} height={24} color="#8BA654" />
              </View>
              <View style={styles.healthyPlateTextContainer}>
                <Text style={styles.healthyPlateLabel}>Healthy New Plates</Text>
                <Text style={styles.healthyPlateSubtitle}>Discover zesty, guilt-free dishes</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

      </ScrollView>


      {/* Daily Check-in Modal */}
      {showDailyCheckIn && (
        <Modal
          visible={showDailyCheckIn}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowDailyCheckIn(false)}
        >
          <DailyCheckInScreen onClose={() => setShowDailyCheckIn(false)} />
        </Modal>
      )}

      {/* Add Meal Modal */}
      <AddMealModal 
        visible={showAddMeal}
        onClose={() => setShowAddMeal(false)}
        onSave={handleSaveMealFromModal}
      />
      
      {/* Nutrition Metrics Modal */}
      {showNutritionModal && (
        <Modal
          visible={showNutritionModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowNutritionModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.nutritionModal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Nutrition Metrics</Text>
                <TouchableOpacity onPress={() => setShowNutritionModal(false)}>
                  <Text style={styles.closeButton}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.metricsScrollView} showsVerticalScrollIndicator={false}>
                <Text style={styles.sectionTitle}>CURRENTLY DISPLAYED</Text>
                <View style={styles.modalWheelsGrid}>
                  {selectedWheels.map((wheelId) => {
                    const data = nutritionData[wheelId as keyof typeof nutritionData]
                    const color = getWheelColor(wheelId)
                    return (
                      <TouchableOpacity
                        key={wheelId}
                        style={styles.modalWheelContainer}
                        onPress={() => {
                          if (selectedWheels.length > 1) {
                            setSelectedWheels(prev => prev.filter(id => id !== wheelId))
                          }
                        }}
                      >
                        <View style={styles.modalWheelWrapper}>
                          <CircularProgress
                            value={data.completed}
                            maxValue={data.goal}
                            size={90}
                            strokeWidth={8}
                            primaryColor={color}
                            secondaryColor={`${color}15`}
                            label=""
                            unit=""
                          />
                          <View style={styles.modalWheelCheck}>
                            <Text style={styles.modalWheelCheckText}>✓</Text>
                          </View>
                        </View>
                        <Text style={styles.modalWheelLabel}>{wheelId.charAt(0).toUpperCase() + wheelId.slice(1)}</Text>
                        <Text style={styles.modalWheelValue}>{data.completed}/{data.goal}{data.unit}</Text>
                      </TouchableOpacity>
                    )
                  })}
                </View>

                <Text style={styles.sectionTitle}>AVAILABLE METRICS</Text>
                <View style={styles.modalWheelsGrid}>
                  {Object.keys(nutritionData)
                    .filter(wheelId => !selectedWheels.includes(wheelId))
                    .map((wheelId) => {
                      const data = nutritionData[wheelId as keyof typeof nutritionData]
                      const color = getWheelColor(wheelId)
                      return (
                        <TouchableOpacity
                          key={wheelId}
                          style={[
                            styles.modalWheelContainer,
                            selectedWheels.length >= 3 && styles.modalWheelDisabled
                          ]}
                          onPress={() => {
                            if (selectedWheels.length < 3) {
                              setSelectedWheels(prev => [...prev, wheelId])
                            }
                          }}
                          disabled={selectedWheels.length >= 3}
                        >
                          <View style={styles.modalWheelWrapper}>
                            <CircularProgress
                              value={data.completed}
                              maxValue={data.goal}
                              size={90}
                              strokeWidth={8}
                              primaryColor={color}
                              secondaryColor={`${color}15`}
                              label=""
                              unit=""
                            />
                            <View style={styles.modalWheelAdd}>
                              <Text style={styles.modalWheelAddText}>+</Text>
                            </View>
                          </View>
                          <Text style={styles.modalWheelLabel}>{wheelId.charAt(0).toUpperCase() + wheelId.slice(1)}</Text>
                          <Text style={styles.modalWheelValue}>{data.completed}/{data.goal}{data.unit}</Text>
                        </TouchableOpacity>
                      )
                    })}
                </View>

                <View style={styles.modalTip}>
                  <Text style={styles.tipText}>
                    You can display up to 3 nutrition metrics. Remove one to add a different metric. The more meals you log, the more accurate your tracking becomes!
                  </Text>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* Breathing Exercise Modal */}
      {showBreathingExercise && (
        <Modal
          visible={showBreathingExercise}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowBreathingExercise(false)}
        >
          <View style={styles.breathingModalOverlay}>
            <BreathingExercises
              breathingExercises={breathingExercises}
              onCircleClick={handleBreathingCircleClick}
              onStartGuide={handleBreathingExerciseComplete}
              completedExercises={completedBreathingExercises}
              autoStart={true}
            />
          </View>
        </Modal>
      )}
    </ScreenWrapper>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F0', // Warm off-white background
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
    fontFamily: 'Inter',
    lineHeight: 33.6,
    letterSpacing: 0.2,
  },
  date: {
    fontSize: 14,
    color: '#4A4A4A', // Warm charcoal - secondary text
    fontWeight: '500',
    fontFamily: 'Inter',
    lineHeight: 19.6,
    letterSpacing: 0.2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  profileIcon: {
    fontSize: 20,
  },
  
  // Nutrition Wheels
  wheelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressSvg: {
    transform: [{ rotate: '90deg' }],
  },
  progressContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1A1A', // Soft black - primary text
    fontFamily: 'Inter',
    lineHeight: 44.8,
    letterSpacing: 0.2,
  },
  progressUnit: {
    fontSize: 14,
    color: '#4A4A4A', // Warm charcoal - secondary text
    fontWeight: '500',
    marginTop: -2,
    fontFamily: 'Inter',
    lineHeight: 19.6,
    letterSpacing: 0.2,
  },
  progressLabel: {
    fontSize: 14,
    color: '#4A4A4A', // Warm charcoal - secondary text
    marginTop: 8,
    fontWeight: '500',
    fontFamily: 'Inter',
    lineHeight: 19.6,
    letterSpacing: 0.2,
  },
  
  // Sections
  section: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  mealPlanSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    marginHorizontal: 16,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  // New Meal Planning Header Styles
  mealPlanningHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAF5',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E8F0E3',
    marginBottom: 16,
  },
  mealPlanningTitleSection: {
    flex: 1,
  },
  mealPlanningTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    fontFamily: 'Inter',
    marginBottom: 4,
  },
  mealPlanningSubtitle: {
    fontSize: 12,
    color: '#4A4A4A',
    fontFamily: 'Inter',
    fontWeight: '500',
  },
  mealPlanningActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  moreMealsButton: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 8,
  },
  moreMealsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B8E23',
    fontFamily: 'Inter',
  },
  showLessButton: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 8,
  },
  showLessText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily: 'Inter',
  },
  mealPlanningTitleButton: {
    flex: 1,
    marginRight: 16,
  },
  mealPlanningTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mealPlanningArrow: {
    fontSize: 20,
    color: '#6B8E23',
    fontWeight: '600',
    marginLeft: 8,
  },
  generateMealButton: {
    backgroundColor: '#6B8E23',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  generateMealButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  sectionTitleArea: {
    flex: 1,
  },
  expandArrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  expandArrowIcon: {
    fontSize: 12,
    color: '#4A4A4A', // Warm charcoal - secondary text
    fontFamily: 'Inter',
    fontWeight: '600',
    transform: [{ rotate: '0deg' }],
  },
  expandArrowIconRotated: {
    transform: [{ rotate: '180deg' }],
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A', // Soft black - primary text
    marginBottom: 4,
    fontFamily: 'Inter',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    lineHeight: 22.4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#4A4A4A', // Warm charcoal - secondary text
    fontWeight: '500',
    fontFamily: 'Inter',
    lineHeight: 19.6,
    letterSpacing: 0.2,
  },
  addMealButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6B8E23', // Organic leaf green - accent
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  addMealIcon: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 18,
  },
  
  // Meals Grid
  mealsGrid: {
    gap: 12,
  },
  mealsCompactGrid: {
    gap: 8,
  },
  mealCompactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#D1D1D1', // Slightly darker border for better definition
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  mealCompactCardCompleted: {
    borderColor: '#6B8E23', // Organic leaf green - accent
    backgroundColor: '#F8FAF5',
  },
  mealCompactLeft: {
    backgroundColor: '#6B8E23', // Organic leaf green - accent
    borderRadius: 8,
    width: 70,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  mealCompactLeftCompleted: {
    backgroundColor: '#6B8E23', // Organic leaf green - accent
  },
  mealCompactLeftIncomplete: {
    backgroundColor: '#E0E0E0', // Light gray - borders & dividers
  },
  mealCompactIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  mealCompactValue: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    fontFamily: 'Inter',
    lineHeight: 20,
  },
  mealCompactUnit: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
    fontFamily: 'Inter',
    opacity: 0.9,
  },
  mealCompactRight: {
    flex: 1,
  },
  mealCompactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A', // Soft black - primary text
    fontFamily: 'Inter',
    lineHeight: 22.4,
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  mealCompactTimeLeft: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
    fontFamily: 'Inter',
    lineHeight: 16,
    letterSpacing: 0.2,
  },
  mealCompactCalories: {
    fontSize: 14,
    color: '#6B8E23', // Organic leaf green - accent
    fontWeight: '500',
    fontFamily: 'Inter',
    lineHeight: 19.6,
    letterSpacing: 0.2,
  },
  mealCompactTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
  },
  mealCompactBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  mealContextLabel: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mealContextCompleted: {
    color: '#4A4A4A', // Warm charcoal - secondary text
    backgroundColor: '#E0E0E0', // Light gray - borders & dividers
  },
  mealContextCurrent: {
    color: '#6B8E23', // Organic leaf green - accent
    backgroundColor: '#F8FAF5',
  },
  mealContextNext: {
    color: '#E94F4F', // Strawberry red
    backgroundColor: '#FFEAEA',
  },
  mealContextMissed: {
    color: '#FF8C00', // Orange
    backgroundColor: '#FFF4E6',
  },
  mealCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 16,
  },
  mealCardCompleted: {
    backgroundColor: '#FFFFFF',
    borderColor: '#6B8E23',
  },
  mealCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mealCardLeft: {
    flex: 1,
  },
  mealTime: {
    fontSize: 14,
    color: '#4A4A4A',
    marginBottom: 4,
    fontWeight: '500',
    fontFamily: 'Inter',
    lineHeight: 19.6,
    letterSpacing: 0.2,
  },
  mealTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Inter',
    lineHeight: 22.4,
    letterSpacing: 0.2,
  },
  mealCalories: {
    fontSize: 14,
    color: '#6B8E23',
    marginTop: 4,
    fontWeight: '500',
    fontFamily: 'Inter',
    lineHeight: 19.6,
    letterSpacing: 0.2,
  },
  mealCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mealIcon: {
    fontSize: 24,
  },
  mealCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealCheckboxCompleted: {
    backgroundColor: '#6B8E23',
    borderColor: '#6B8E23',
  },
  checkmark: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  
  // Reflect Button
  reflectButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  reflectButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 16,
  },
  reflectIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F8FAF5',
    borderWidth: 2,
    borderColor: '#6B8E23',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reflectIcon: {
    fontSize: 24,
    color: '#6B8E23',
  },
  reflectTextContainer: {
    flex: 1,
  },
  reflectLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B8E23',
    fontFamily: 'Inter',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  reflectSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4A4A4A',
    fontFamily: 'Inter',
    letterSpacing: 0.2,
  },
  
  // Meal Plan Progress
  mealPlanProgress: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  mealPlanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  mealPlanInfo: {
    flex: 1,
  },
  mealPlanTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B8E23',
    fontFamily: 'Inter',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  mealPlanSubtext: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4A4A4A',
    fontFamily: 'Inter',
    letterSpacing: 0.2,
  },
  mealPlanStats: {
    alignItems: 'flex-end',
  },
  mealPlanPercentage: {
    fontSize: 20,
    fontWeight: '700',
    color: '#6B8E23',
    fontFamily: 'Inter',
  },
  mealPlanDaysText: {
    fontSize: 14,
    color: '#4A4A4A',
    fontFamily: 'Inter',
  },
  mealPlanProgressBar: {
    height: 4,
    backgroundColor: '#F0F0F0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  mealPlanProgressFill: {
    height: '100%',
    backgroundColor: '#6B8E23',
    borderRadius: 2,
  },
  
  // Health Tracker Button
  healthTrackerButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  healthTrackerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  healthTrackerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F8FF',
    borderWidth: 2,
    borderColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  healthTrackerIcon: {
    fontSize: 24,
  },
  healthTrackerTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  healthTrackerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
    fontFamily: 'Inter',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  healthTrackerSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4A4A4A',
    fontFamily: 'Inter',
    letterSpacing: 0.2,
  },
  healthTrackerStats: {
    alignItems: 'flex-end',
  },
  healthTrackerValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3B82F6',
    fontFamily: 'Inter',
  },
  healthTrackerUnit: {
    fontSize: 12,
    color: '#4A4A4A',
    fontFamily: 'Inter',
    marginTop: 2,
  },
  
  // Healthy Plate Button
  healthyPlateButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  healthyPlateContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 16,
  },
  healthyPlateIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F8FAF5',
    borderWidth: 2,
    borderColor: '#8BA654',
    alignItems: 'center',
    justifyContent: 'center',
  },
  healthyPlateIcon: {
    fontSize: 24,
  },
  healthyPlateTextContainer: {
    flex: 1,
  },
  healthyPlateLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8BA654',
    fontFamily: 'Inter',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  healthyPlateSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4A4A4A',
    fontFamily: 'Inter',
    letterSpacing: 0.2,
  },
  
  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  quickActionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
    textAlign: 'center',
    fontFamily: 'Inter',
    lineHeight: 19.6,
    letterSpacing: 0.2,
  },
  
  // Settings Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  settingsModal: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    fontFamily: 'Inter',
    lineHeight: 33.6,
    letterSpacing: 0.2,
  },
  closeButton: {
    fontSize: 24,
    color: '#4A4A4A',
    padding: 4,
  },
  settingsDescription: {
    fontSize: 16,
    color: '#4A4A4A',
    marginBottom: 24,
    fontFamily: 'Inter',
    lineHeight: 22.4,
    letterSpacing: 0.2,
  },
  wheelOptions: {
    gap: 12,
    marginBottom: 24,
  },
  wheelOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  wheelOptionSelected: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  wheelOptionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  wheelOptionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    flex: 1,
    fontFamily: 'Inter',
    lineHeight: 22.4,
    letterSpacing: 0.2,
  },
  wheelOptionLabelSelected: {
    color: '#6B8E23',
  },
  wheelOptionCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#6B8E23',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelOptionCheckText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Inter',
  },
  saveButton: {
    backgroundColor: '#6B8E23',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
    lineHeight: 22.4,
    letterSpacing: 0.2,
  },

  // Add Meal Modal Styles
  addMealModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  addMealModal: {
    backgroundColor: '#FEFDFB',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  addMealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  addMealTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    fontFamily: 'Inter',
    lineHeight: 33.6,
    letterSpacing: 0.2,
  },
  addMealCloseButton: {
    fontSize: 24,
    color: '#4A4A4A',
    padding: 4,
  },
  addMealSection: {
    marginBottom: 24,
  },
  addMealSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4A4A4A',
    fontFamily: 'Inter',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  
  // Category Grid
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minWidth: 85,
    flex: 1,
    maxWidth: '30%',
  },
  categoryItemSelected: {
    borderColor: '#6B8E23', // Organic leaf green - accent
    backgroundColor: '#F8FAF5',
  },
  categoryItemIcon: {
    fontSize: 20,
    marginBottom: 6,
  },
  categoryItemLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1A1A1A',
    fontFamily: 'Inter',
    textAlign: 'center',
    lineHeight: 16,
  },
  categoryItemLabelSelected: {
    color: '#6B8E23', // Organic leaf green - accent
    fontWeight: '600',
  },
  
  // Drink Options
  drinkOptionsContainer: {
    gap: 12,
  },
  drinkOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  drinkOptionSelected: {
    borderColor: '#6B8E23', // Organic leaf green - accent
    backgroundColor: '#F8FAF5',
  },
  drinkOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    fontFamily: 'Inter',
  },
  drinkOptionCheck: {
    fontSize: 16,
    color: '#6B8E23', // Organic leaf green - accent
    fontWeight: '700',
  },
  sizeOptionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sizeOptionsLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    fontFamily: 'Inter',
    marginRight: 8,
  },
  sizeOption: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  sizeOptionSelected: {
    borderColor: '#6B8E23', // Organic leaf green - accent
    backgroundColor: '#F8FAF5',
  },
  sizeOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4A4A4A',
    fontFamily: 'Inter',
  },
  sizeOptionTextSelected: {
    color: '#6B8E23', // Organic leaf green - accent
    fontWeight: '600',
  },
  sizeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  sizeLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    fontFamily: 'Inter',
    marginRight: 8,
  },
  
  // Coffee Options
  coffeeOptions: {
    gap: 12,
  },
  coffeeOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  coffeeOptionSelected: {
    borderColor: '#6B8E23',
    backgroundColor: '#F8FAF5',
  },
  coffeeOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    fontFamily: 'Inter',
  },
  coffeeOptionCheck: {
    fontSize: 16,
    color: '#6B8E23',
    fontWeight: '700',
  },
  coffeeSizeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  coffeeSizeLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    fontFamily: 'Inter',
  },
  coffeeSizeOption: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  coffeeSizeSelected: {
    borderColor: '#6B8E23',
    backgroundColor: '#F8FAF5',
  },
  coffeeSizeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4A4A4A',
    fontFamily: 'Inter',
  },
  coffeeSizeTextSelected: {
    color: '#6B8E23',
    fontWeight: '600',
  },
  
  // Input Fields
  addMealInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 12,
  },
  addMealTextArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  
  // Voice Recording
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    gap: 12,
  },
  recordButtonActive: {
    borderColor: '#6B8E23',
    backgroundColor: '#F8FAF5',
  },
  recordButtonIcon: {
    fontSize: 24,
  },
  recordButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    fontFamily: 'Inter',
  },
  recordedTextContainer: {
    backgroundColor: '#F8FAF5',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#6B8E23',
  },
  recordedText: {
    fontSize: 16,
    color: '#1A1A1A',
    fontFamily: 'Inter',
    lineHeight: 22.4,
    marginBottom: 12,
  },
  clearRecordingButton: {
    alignSelf: 'flex-end',
  },
  clearRecordingText: {
    fontSize: 14,
    color: '#6B8E23',
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  
  // Action Buttons
  addMealActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  addMealCancelButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  addMealCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A4A4A',
    fontFamily: 'Inter',
  },
  addMealSaveButton: {
    flex: 1,
    backgroundColor: '#6B8E23', // Organic leaf green - accent
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  addMealSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },

  // Wellness Action Wheels
  wellnessWheelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 16,
    gap: 20,
  },
  wellnessWheel: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0', // Light gray - borders & dividers
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
  },
  wellnessWheelInner: {
    alignItems: 'center',
    marginBottom: 16,
  },
  wellnessTextContainer: {
    alignItems: 'center',
  },
  wellnessLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A', // Soft black - primary text
    fontFamily: 'Inter',
  },
  wellnessProgressRing: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wellnessRingSvg: {
    transform: [{ rotate: '-90deg' }],
  },
  wellnessProgressText: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  wellnessProgressNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A', // Soft black - primary text
    fontFamily: 'Inter',
  },
  wellnessProgressTotal: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4A4A4A', // Warm charcoal - secondary text
    fontFamily: 'Inter',
  },

  // Breathing Exercise Modal
  breathingModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  
  // Nutrition Modal
  nutritionModal: {
    backgroundColor: '#FAF7F0', // Warm off-white background
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '80%',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A', // Soft black - primary text
    fontFamily: 'Inter',
  },
  closeButton: {
    fontSize: 24,
    color: '#4A4A4A', // Warm charcoal - secondary text
    fontWeight: '600',
  },
  metricsScrollView: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A', // Soft black - primary text
    marginBottom: 12,
    marginTop: 8,
    fontFamily: 'Inter',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalWheelsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: 8,
    marginBottom: 20,
  },
  modalWheelContainer: {
    alignItems: 'center',
    width: '30%',
    paddingVertical: 8,
  },
  modalWheelDisabled: {
    opacity: 0.4,
  },
  modalWheelWrapper: {
    position: 'relative',
    marginBottom: 4,
  },
  modalWheelCheck: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#6B8E23', // Organic leaf green - accent
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalWheelCheckText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  modalWheelAdd: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4A4A4A', // Warm charcoal - secondary text
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalWheelAddText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '300',
  },
  modalWheelLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A', // Soft black - primary text
    fontFamily: 'Inter',
    textAlign: 'center',
    marginBottom: 4,
  },
  modalWheelValue: {
    fontSize: 12,
    color: '#4A4A4A', // Warm charcoal - secondary text
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  modalInfo: {
    backgroundColor: '#F8FAF5',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#4A4A4A', // Warm charcoal - secondary text
    fontFamily: 'Inter',
    lineHeight: 20,
  },
  modalTip: {
    backgroundColor: '#E8F4FD',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#4A90E2',
  },
  tipText: {
    fontSize: 14,
    color: '#1A1A1A', // Soft black - primary text
    fontFamily: 'Inter',
    lineHeight: 20,
    fontWeight: '500',
  },
  
  // Meal Plan Loading/Empty States
  mealPlanLoading: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealPlanLoadingText: {
    fontSize: 16,
    color: '#4A4A4A',
    fontFamily: 'Inter',
    fontWeight: '500',
  },
  noMealPlan: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  noMealPlanText: {
    fontSize: 16,
    color: '#1A1A1A',
    fontFamily: 'Inter',
    fontWeight: '600',
    marginBottom: 8,
  },
  noMealPlanSubtext: {
    fontSize: 14,
    color: '#4A4A4A',
    fontFamily: 'Inter',
    fontWeight: '500',
    textAlign: 'center',
  },
})