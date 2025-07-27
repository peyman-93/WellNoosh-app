import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { View, Text, ScrollView, StyleSheet, Pressable, Alert, TouchableOpacity, Modal, TextInput, Dimensions } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useAuth } from '@/context/supabase-provider'
import { useNavigation } from '@react-navigation/native'
import { CommonActions } from '@react-navigation/native'
import Svg, { Circle, G, Text as SvgText } from 'react-native-svg'

// Components
import { WaterTracker } from '@/components/features/WaterTracker'
import { BreathingExercises } from '@/components/features/BreathingExercises'
import { AddMealModal } from '@/components/modals/AddMealModal'
import DailyCheckInScreen from '@/screens/DailyCheckInScreen'
import { HealthyPlateIcon } from '@/components/Icons/HealthyPlateIcon'

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

// Settings Modal Component
interface SettingsModalProps {
  visible: boolean
  onClose: () => void
  selectedWheels: string[]
  onUpdateWheels: (wheels: string[]) => void
}

function SettingsModal({ visible, onClose, selectedWheels, onUpdateWheels }: SettingsModalProps) {
  const [tempSelection, setTempSelection] = useState(selectedWheels)
  
  const availableWheels = [
    { id: 'calories', label: 'Calories', icon: '🔥' },
    { id: 'protein', label: 'Protein', icon: '🥩' },
    { id: 'fiber', label: 'Fiber', icon: '🌾' },
    { id: 'carbs', label: 'Carbohydrates', icon: '🍞' },
    { id: 'fat', label: 'Fat', icon: '🥑' },
    { id: 'sugar', label: 'Sugar', icon: '🍬' },
    { id: 'sodium', label: 'Sodium', icon: '🧂' },
    { id: 'water', label: 'Water', icon: '💧' }
  ]

  const toggleWheel = (wheelId: string) => {
    if (tempSelection.includes(wheelId)) {
      if (tempSelection.length > 1) {
        setTempSelection(tempSelection.filter(id => id !== wheelId))
      }
    } else {
      if (tempSelection.length < 3) {
        setTempSelection([...tempSelection, wheelId])
      }
    }
  }

  const handleSave = () => {
    onUpdateWheels(tempSelection)
    onClose()
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.settingsModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Customize Dashboard</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.settingsDescription}>
            Select up to 3 metrics to display on your dashboard
          </Text>
          
          <View style={styles.wheelOptions}>
            {availableWheels.map(wheel => (
              <TouchableOpacity
                key={wheel.id}
                style={[
                  styles.wheelOption,
                  tempSelection.includes(wheel.id) && styles.wheelOptionSelected
                ]}
                onPress={() => toggleWheel(wheel.id)}
              >
                <Text style={styles.wheelOptionIcon}>{wheel.icon}</Text>
                <Text style={[
                  styles.wheelOptionLabel,
                  tempSelection.includes(wheel.id) && styles.wheelOptionLabelSelected
                ]}>
                  {wheel.label}
                </Text>
                {tempSelection.includes(wheel.id) && (
                  <View style={styles.wheelOptionCheck}>
                    <Text style={styles.wheelOptionCheckText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
          
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

export default function DashboardScreen() {
  const { session, signOut } = useAuth()
  const navigation = useNavigation()
  
  // State
  const [selectedWheels, setSelectedWheels] = useState(['calories', 'protein', 'fiber'])
  const [showSettings, setShowSettings] = useState(false)
  const [showDailyCheckIn, setShowDailyCheckIn] = useState(false)
  const [showAddMeal, setShowAddMeal] = useState(false)
  const [showNutritionModal, setShowNutritionModal] = useState(false)
  const [showAllMeals, setShowAllMeals] = useState(false)
  
  // Meal tracking state
  const [mealEvents, setMealEvents] = useState([
    { id: '1', time: '07:00', title: 'Breakfast', icon: '🌅', completed: false, calories: 350 },
    { id: '2', time: '10:00', title: 'Morning Snack', icon: '🥜', completed: false, calories: 150 },
    { id: '3', time: '12:30', title: 'Lunch', icon: '☀️', completed: false, calories: 450 },
    { id: '4', time: '15:30', title: 'Afternoon Snack', icon: '🍎', completed: false, calories: 100 },
    { id: '5', time: '19:00', title: 'Dinner', icon: '🌙', completed: false, calories: 550 },
    { id: '6', time: '21:00', title: 'Evening Snack', icon: '🌃', completed: false, calories: 100 }
  ])

  // Water tracking state
  const [waterIntake, setWaterIntake] = useState<boolean[]>(new Array(10).fill(false))
  const completedGlasses = waterIntake.filter(glass => glass).length

  // Breathing exercises state
  const [showBreathingExercise, setShowBreathingExercise] = useState(false)
  const [breathingExercises, setBreathingExercises] = useState<boolean[]>(new Array(6).fill(false))
  const completedBreathingExercises = breathingExercises.filter(exercise => exercise).length

  // Calculate nutrition data from completed meals
  const calculateCompletedCalories = () => {
    return mealEvents
      .filter(meal => meal.completed)
      .reduce((total, meal) => total + (meal.calories || 0), 0)
  }

  const nutritionData = {
    calories: { completed: calculateCompletedCalories(), goal: 2000, unit: '' },
    protein: { completed: Math.round(calculateCompletedCalories() * 0.05), goal: 60, unit: 'g' },
    fiber: { completed: Math.round(calculateCompletedCalories() * 0.01), goal: 25, unit: 'g' },
    carbs: { completed: Math.round(calculateCompletedCalories() * 0.12), goal: 250, unit: 'g' },
    fat: { completed: Math.round(calculateCompletedCalories() * 0.04), goal: 65, unit: 'g' },
    sugar: { completed: Math.round(calculateCompletedCalories() * 0.03), goal: 50, unit: 'g' },
    sodium: { completed: Math.round(calculateCompletedCalories() * 1.4), goal: 2300, unit: 'mg' },
    water: { completed: 5, goal: 8, unit: ' cups' }
  }

  const handleToggleMeal = (mealId: string) => {
    console.log('Toggling meal:', mealId)
    setMealEvents(prevEvents => {
      const updatedEvents = prevEvents.map(event => {
        if (event.id === mealId) {
          const updatedEvent = { ...event, completed: !event.completed }
          console.log('Updated meal:', updatedEvent)
          return updatedEvent
        }
        return event
      })
      console.log('All events after toggle:', updatedEvents)
      return updatedEvents
    })
  }


  const handleAddMeal = () => {
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

  const handleSaveMealFromModal = useCallback((mealData: any) => {
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

    const getIconForType = () => {
      const iconMap = {
        // Meals
        breakfast: '🌅', lunch: '☀️', dinner: '🌙', brunch: '🥞',
        // Snacks
        snack: '🥜', 'light-snack': '🍎', 'protein-snack': '🥩',
        // Beverages
        water: '💧', coffee: '☕', tea: '🍵', soda: '🥤', juice: '🧃',
        'energy-drink': '⚡', smoothie: '🥤', 'sports-drink': '🏃',
        // Alcohol
        beer: '🍺', wine: '🍷', cocktail: '🍸', spirits: '🥃',
        // Desserts
        dessert: '🍰', 'ice-cream': '🍦', cake: '🎂', pastry: '🥐',
        // Supplements
        supplement: '💊', 'protein-shake': '🥤', vitamins: '💊',
        // Fast Food
        'fast-food': '🍟', pizza: '🍕', burger: '🍔',
        // Other
        gum: '🍬', candy: '🍭'
      }
      return iconMap[mealData.type] || '🍽️'
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

    const newMeal = {
      id: Date.now().toString(),
      time: mealData.time,
      title: getTitleForType(),
      icon: getIconForType(),
      completed: false,
      calories: getCaloriesForType(),
      description: mealData.description || mealData.recordedText
    }
    
    console.log('Adding new meal:', newMeal)
    setMealEvents(prev => [...prev, newMeal])
  }, [])



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

  const completedMeals = mealEvents.filter(meal => meal.completed).length
  const totalMeals = mealEvents.length
  
  // Sort meals by time (earliest first)
  const sortedMealEvents = [...mealEvents].sort((a, b) => {
    const timeA = a.time.split(':').map(Number)
    const timeB = b.time.split(':').map(Number)
    const dateA = new Date()
    dateA.setHours(timeA[0], timeA[1], 0, 0)
    const dateB = new Date()
    dateB.setHours(timeB[0], timeB[1], 0, 0)
    return dateA.getTime() - dateB.getTime()
  })

  // Get contextual meals (previous and next based on current time)
  const getContextualMeals = () => {
    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    const currentTime = currentHour * 60 + currentMinute // Convert to minutes for easier comparison
    
    let previousMeal = null
    let nextMeal = null
    
    for (let i = 0; i < sortedMealEvents.length; i++) {
      const meal = sortedMealEvents[i]
      const [mealHour, mealMinute] = meal.time.split(':').map(Number)
      const mealTime = mealHour * 60 + mealMinute
      
      if (mealTime <= currentTime) {
        previousMeal = meal // This meal has passed or is current
      } else if (mealTime > currentTime && !nextMeal) {
        nextMeal = meal // This is the next upcoming meal
        break
      }
    }
    
    // If no next meal found (all meals have passed), show the last meal as previous
    // and potentially the first meal of next day
    if (!nextMeal && sortedMealEvents.length > 0) {
      nextMeal = sortedMealEvents[0] // Next day's first meal
    }
    
    // Return meals with context labels
    const contextualMeals = []
    if (previousMeal) {
      contextualMeals.push({ 
        ...previousMeal, 
        contextLabel: previousMeal.completed ? 'Completed' : 'Current',
        isContextual: true 
      })
    }
    if (nextMeal && nextMeal !== previousMeal) {
      const isNextDay = nextMeal === sortedMealEvents[0] && !nextMeal
      contextualMeals.push({ 
        ...nextMeal, 
        contextLabel: isNextDay ? 'Tomorrow' : 'Next',
        isContextual: true 
      })
    }
    
    return contextualMeals
  }

  const contextualMeals = getContextualMeals()

  // Meal plan progress calculations
  const getMealPlanPercentage = () => {
    // For demo purposes, using a mock value
    // In production, this would calculate from actual meal plan data
    return 65
  }

  const getMealPlanDaysPlanned = () => {
    // For demo purposes
    return 20
  }


  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning, {session?.user?.email?.split('@')[0] || 'Guest'}</Text>
            <Text style={styles.date}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => setShowSettings(true)} style={styles.settingsButton}>
              <Text style={styles.settingsIcon}>⚙️</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleProfilePress} style={styles.profileButton}>
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

        {/* Today's Meals Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleArea}>
              <Text style={styles.sectionTitle}>Today's Meals</Text>
              <TouchableOpacity 
                style={styles.expandArrow}
                onPress={() => setShowAllMeals(!showAllMeals)}
                activeOpacity={0.7}
              >
                <Text style={styles.sectionSubtitle}>{completedMeals} of {totalMeals} completed</Text>
                <Text style={[styles.expandArrowIcon, showAllMeals && styles.expandArrowIconRotated]}>▼</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity 
              style={styles.addMealButton} 
              onPress={handleAddMeal}
              activeOpacity={0.7}
            >
              <Text style={styles.addMealIcon}>+</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.mealsCompactGrid}>
            {(showAllMeals ? sortedMealEvents : contextualMeals).map(meal => (
              <TouchableOpacity
                key={meal.id}
                style={[styles.mealCompactCard, meal.completed && styles.mealCompactCardCompleted]}
                onPress={() => handleToggleMeal(meal.id)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.mealCompactLeft,
                  meal.completed ? styles.mealCompactLeftCompleted : styles.mealCompactLeftIncomplete
                ]}>
                  <Text style={[
                    styles.mealCompactTimeLeft,
                    !meal.completed && { color: '#4A4A4A' }
                  ]}>{meal.time}</Text>
                </View>
                <View style={styles.mealCompactRight}>
                  <View style={styles.mealCompactTitleRow}>
                    <Text style={styles.mealCompactTitle}>{meal.title}</Text>
                    {!showAllMeals && meal.contextLabel && (
                      <Text style={[
                        styles.mealContextLabel,
                        meal.contextLabel === 'Completed' && styles.mealContextCompleted,
                        meal.contextLabel === 'Current' && styles.mealContextCurrent,
                        meal.contextLabel === 'Next' && styles.mealContextNext,
                      ]}>
                        {meal.contextLabel}
                      </Text>
                    )}
                  </View>
                  <Text style={styles.mealCompactCalories}>
                    {meal.calories} cal
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
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
          
          {/* Meal Plan Progress */}
          <TouchableOpacity style={styles.mealPlanProgress} onPress={() => navigation.navigate('Planner' as never)}>
            <View style={styles.mealPlanHeader}>
              <View style={styles.mealPlanInfo}>
                <Text style={styles.mealPlanTitle}>Meal Planning</Text>
                <Text style={styles.mealPlanDaysText}>{getMealPlanDaysPlanned()} days planned</Text>
              </View>
            </View>
            <View style={styles.mealPlanProgressBar}>
              <View 
                style={[
                  styles.mealPlanProgressFill, 
                  { width: `${getMealPlanPercentage()}%` }
                ]} 
              />
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

      {/* Settings Modal */}
      <SettingsModal
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        selectedWheels={selectedWheels}
        onUpdateWheels={setSelectedWheels}
      />

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
    </View>
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
    paddingTop: 60,
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
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  settingsIcon: {
    fontSize: 20,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
    borderWidth: 1,
    borderColor: '#E0E0E0', // Light gray - borders & dividers
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 60,
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
})