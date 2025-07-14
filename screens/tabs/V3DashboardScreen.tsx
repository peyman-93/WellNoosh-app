import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, StyleSheet, Pressable, Alert, TouchableOpacity, Modal, TextInput } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useAuth } from '@/context/supabase-provider'
import { useNavigation } from '@react-navigation/native'
import { CommonActions } from '@react-navigation/native'

// Components
import { WaterTracker } from '@/components/v3/WaterTracker'
import { BreathingExercises } from '@/components/v3/BreathingExercises'
import { QuickStats } from '@/components/v3/QuickStats'
import { DailyCheckIn } from '@/components/v3/DailyCheckIn'
import { MealHub } from '@/components/v3/MealHub'
import { RecentActivity } from '@/components/v3/RecentActivity'
import { QuickActions } from '@/components/v3/QuickActions'
import DailyCheckInScreen from '@/screens/DailyCheckInScreen'

// Detail History Modal Component
interface DetailHistoryModalProps {
  visible: boolean
  onClose: () => void
  events: Array<{ id: string, time: string, title: string, icon: string, completed: boolean, calories?: number }>
  onToggleEvent: (eventId: string) => void
  completedCalories: number
  dailyCalorieGoal: number
  nutritionData: {
    protein: { completed: number, goal: number, unit: string }
    carbs: { completed: number, goal: number, unit: string }
    fat: { completed: number, goal: number, unit: string }
    fiber: { completed: number, goal: number, unit: string }
    sugar: { completed: number, goal: number, unit: string }
    sodium: { completed: number, goal: number, unit: string }
  }
}

function DetailHistoryModal({ 
  visible, 
  onClose, 
  events, 
  onToggleEvent, 
  completedCalories, 
  dailyCalorieGoal,
  nutritionData
}: DetailHistoryModalProps) {
  const sortedEvents = [...events].sort((a, b) => a.time.localeCompare(b.time))

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={detailHistoryStyles.modalOverlay}>
        <View style={detailHistoryStyles.modalContainer}>
          <View style={detailHistoryStyles.modalHeader}>
            <Text style={detailHistoryStyles.modalTitle}>Today's Nutrition History</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={detailHistoryStyles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={detailHistoryStyles.modalContent}>
            {/* Progress Summary */}
            <View style={detailHistoryStyles.summarySection}>
              <Text style={detailHistoryStyles.summaryTitle}>🍎 Daily Nutrition Progress</Text>
              
              {/* Nutrition Grid */}
              <View style={detailHistoryStyles.nutritionGrid}>
                {/* Calories */}
                <View style={detailHistoryStyles.nutritionItem}>
                  <View style={detailHistoryStyles.nutritionHeader}>
                    <View style={[detailHistoryStyles.nutritionIcon, { backgroundColor: '#FEF3C7' }]}>
                      <Text style={detailHistoryStyles.nutritionIconText}>🔥</Text>
                    </View>
                    <Text style={detailHistoryStyles.nutritionLabel}>Calories</Text>
                  </View>
                  <View style={detailHistoryStyles.nutritionValues}>
                    <Text style={detailHistoryStyles.nutritionValue}>{completedCalories}</Text>
                    <Text style={detailHistoryStyles.nutritionGoal}>/ {dailyCalorieGoal}</Text>
                  </View>
                  <View style={detailHistoryStyles.nutritionProgressBar}>
                    <View 
                      style={[
                        detailHistoryStyles.nutritionProgressFill,
                        { 
                          width: `${Math.min((completedCalories / dailyCalorieGoal) * 100, 100)}%`,
                          backgroundColor: '#F59E0B'
                        }
                      ]}
                    />
                  </View>
                  <Text style={detailHistoryStyles.nutritionPercentage}>
                    {Math.round((completedCalories / dailyCalorieGoal) * 100)}%
                  </Text>
                </View>

                {/* Other Nutrition Metrics */}
                {Object.entries(nutritionData).map(([key, data]) => {
                  const nutritionConfig = {
                    protein: { icon: '💪', color: '#EF4444', bgColor: '#FEE2E2' },
                    carbs: { icon: '🌾', color: '#F59E0B', bgColor: '#FEF3C7' },
                    fat: { icon: '🥑', color: '#8B5CF6', bgColor: '#EDE9FE' },
                    fiber: { icon: '🥬', color: '#10B981', bgColor: '#D1FAE5' },
                    sugar: { icon: '🍯', color: '#EC4899', bgColor: '#FCE7F3' },
                    sodium: { icon: '🧂', color: '#6B7280', bgColor: '#F3F4F6' }
                  }
                  const config = nutritionConfig[key as keyof typeof nutritionConfig]
                  
                  return (
                    <View key={key} style={detailHistoryStyles.nutritionItem}>
                      <View style={detailHistoryStyles.nutritionHeader}>
                        <View style={[detailHistoryStyles.nutritionIcon, { backgroundColor: config.bgColor }]}>
                          <Text style={detailHistoryStyles.nutritionIconText}>{config.icon}</Text>
                        </View>
                        <Text style={detailHistoryStyles.nutritionLabel}>
                          {key.charAt(0).toUpperCase() + key.slice(1)}
                        </Text>
                      </View>
                      <View style={detailHistoryStyles.nutritionValues}>
                        <Text style={detailHistoryStyles.nutritionValue}>{data.completed}</Text>
                        <Text style={detailHistoryStyles.nutritionGoal}>/ {data.goal} {data.unit}</Text>
                      </View>
                      <View style={detailHistoryStyles.nutritionProgressBar}>
                        <View 
                          style={[
                            detailHistoryStyles.nutritionProgressFill,
                            { 
                              width: `${Math.min((data.completed / data.goal) * 100, 100)}%`,
                              backgroundColor: config.color
                            }
                          ]}
                        />
                      </View>
                      <Text style={detailHistoryStyles.nutritionPercentage}>
                        {Math.round((data.completed / data.goal) * 100)}%
                      </Text>
                    </View>
                  )
                })}
              </View>
            </View>
            {/* Events List */}
            <View style={detailHistoryStyles.eventsSection}>
              <Text style={detailHistoryStyles.eventsTitle}>Events Timeline</Text>
              {sortedEvents.map((event) => (
                <TouchableOpacity
                  key={event.id}
                  style={[
                    detailHistoryStyles.eventItem,
                    event.completed && detailHistoryStyles.eventItemCompleted
                  ]}
                  onPress={() => onToggleEvent(event.id)}
                >
                  <View style={detailHistoryStyles.eventTime}>
                    <Text style={detailHistoryStyles.eventTimeText}>{event.time}</Text>
                  </View>
                  
                  <View style={[
                    detailHistoryStyles.eventIconContainer,
                    event.completed && detailHistoryStyles.eventIconContainerCompleted
                  ]}>
                    <Text style={detailHistoryStyles.eventIconText}>{event.icon}</Text>
                  </View>
                  
                  <View style={detailHistoryStyles.eventContent}>
                    <Text style={[
                      detailHistoryStyles.eventTitle,
                      event.completed && detailHistoryStyles.eventTitleCompleted
                    ]}>
                      {event.title}
                    </Text>
                    {event.calories && event.calories > 0 && (
                      <Text style={detailHistoryStyles.eventCalories}>
                        {event.calories} calories
                      </Text>
                    )}
                  </View>
                  
                  <View style={detailHistoryStyles.eventStatus}>
                    <Text style={detailHistoryStyles.eventStatusIcon}>
                      {event.completed ? '✅' : '⏳'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Daily Summary */}
            <View style={detailHistoryStyles.dailySummary}>
              <Text style={detailHistoryStyles.dailySummaryTitle}>Daily Summary</Text>
              <View style={detailHistoryStyles.summaryStats}>
                <View style={detailHistoryStyles.summaryStatItem}>
                  <Text style={detailHistoryStyles.summaryStatValue}>
                    {events.filter(e => e.completed).length}
                  </Text>
                  <Text style={detailHistoryStyles.summaryStatLabel}>Completed</Text>
                </View>
                <View style={detailHistoryStyles.summaryStatItem}>
                  <Text style={detailHistoryStyles.summaryStatValue}>
                    {events.length - events.filter(e => e.completed).length}
                  </Text>
                  <Text style={detailHistoryStyles.summaryStatLabel}>Remaining</Text>
                </View>
                <View style={detailHistoryStyles.summaryStatItem}>
                  <Text style={detailHistoryStyles.summaryStatValue}>
                    {dailyCalorieGoal - completedCalories}
                  </Text>
                  <Text style={detailHistoryStyles.summaryStatLabel}>Calories Left</Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

// Event Log Modal Component
interface EventLogModalProps {
  visible: boolean
  onClose: () => void
  onAddEvent: (event: { time: string, title: string, icon: string, calories?: number }) => void
}

function EventLogModal({ visible, onClose, onAddEvent }: EventLogModalProps) {
  const [selectedTime, setSelectedTime] = useState('')
  const [selectedTitle, setSelectedTitle] = useState('')
  const [selectedIcon, setSelectedIcon] = useState('')
  const [selectedCalories, setSelectedCalories] = useState('')
  
  const eventCategories = [
    { title: 'Breakfast', icon: '🍳', suggestedCalories: 450 },
    { title: 'Morning Snack', icon: '🍎', suggestedCalories: 150 },
    { title: 'Lunch', icon: '🥗', suggestedCalories: 520 },
    { title: 'Afternoon Snack', icon: '☕', suggestedCalories: 120 },
    { title: 'Dinner', icon: '🍽️', suggestedCalories: 680 },
    { title: 'Water', icon: '💧', suggestedCalories: 0 },
    { title: 'Exercise', icon: '💪', suggestedCalories: 0 },
    { title: 'Meditation', icon: '🧘', suggestedCalories: 0 },
    { title: 'Fruit', icon: '🍊', suggestedCalories: 80 },
    { title: 'Coffee', icon: '☕', suggestedCalories: 25 },
    { title: 'Tea', icon: '🍵', suggestedCalories: 5 },
    { title: 'Vitamins', icon: '💊', suggestedCalories: 0 },
  ]

  const handleSubmit = () => {
    if (!selectedTime || !selectedTitle) {
      Alert.alert('Missing Information', 'Please enter time and title')
      return
    }
    
    const finalIcon = selectedIcon || '🍴' // Default icon if none selected
    
    onAddEvent({
      time: selectedTime,
      title: selectedTitle,
      icon: finalIcon,
      calories: selectedCalories ? parseInt(selectedCalories) : 0
    })
    
    // Reset form
    setSelectedTime('')
    setSelectedTitle('')
    setSelectedIcon('')
    setSelectedCalories('')
    onClose()
  }

  const getCurrentTime = () => {
    const now = new Date()
    const hours = now.getHours().toString().padStart(2, '0')
    const minutes = now.getMinutes().toString().padStart(2, '0')
    return `${hours}:${minutes}`
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={eventLogStyles.modalOverlay}>
        <View style={eventLogStyles.modalContainer}>
          <View style={eventLogStyles.modalHeader}>
            <Text style={eventLogStyles.modalTitle}>Log Daily Event</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={eventLogStyles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={eventLogStyles.modalContent}>
            {/* Time Input */}
            <View style={eventLogStyles.inputSection}>
              <Text style={eventLogStyles.inputLabel}>Time</Text>
              <View style={eventLogStyles.timeContainer}>
                <TextInput
                  style={eventLogStyles.timeInput}
                  value={selectedTime}
                  onChangeText={setSelectedTime}
                  placeholder="HH:MM"
                  maxLength={5}
                />
                <TouchableOpacity 
                  style={eventLogStyles.nowButton}
                  onPress={() => setSelectedTime(getCurrentTime())}
                >
                  <Text style={eventLogStyles.nowButtonText}>Now</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Event Categories */}
            <View style={eventLogStyles.inputSection}>
              <Text style={eventLogStyles.inputLabel}>What did you have?</Text>
              <View style={eventLogStyles.categoriesGrid}>
                {eventCategories.map((category, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      eventLogStyles.categoryItem,
                      selectedTitle === category.title && eventLogStyles.categoryItemSelected
                    ]}
                    onPress={() => {
                      setSelectedTitle(category.title)
                      setSelectedIcon(category.icon)
                      setSelectedCalories(category.suggestedCalories.toString())
                    }}
                  >
                    <Text style={eventLogStyles.categoryIcon}>{category.icon}</Text>
                    <Text style={eventLogStyles.categoryTitle}>{category.title}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Custom Entry */}
            <View style={eventLogStyles.inputSection}>
              <Text style={eventLogStyles.inputLabel}>Or add custom</Text>
              <TextInput
                style={eventLogStyles.customInput}
                value={selectedTitle}
                onChangeText={(text) => {
                  setSelectedTitle(text)
                  if (text && !selectedIcon) {
                    setSelectedIcon('🍴') // Default icon for custom entries
                  }
                }}
                placeholder="e.g., Green smoothie, Dark chocolate..."
              />
            </View>

            {/* Calories Input */}
            <View style={eventLogStyles.inputSection}>
              <Text style={eventLogStyles.inputLabel}>Calories (optional)</Text>
              <TextInput
                style={eventLogStyles.caloriesInput}
                value={selectedCalories}
                onChangeText={setSelectedCalories}
                placeholder="0"
                keyboardType="numeric"
                maxLength={4}
              />
            </View>

            {/* Action Buttons */}
            <View style={eventLogStyles.buttonContainer}>
              <TouchableOpacity
                style={eventLogStyles.cancelButton}
                onPress={onClose}
              >
                <Text style={eventLogStyles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  eventLogStyles.submitButton,
                  (!selectedTime || !selectedTitle) && eventLogStyles.submitButtonDisabled
                ]}
                onPress={handleSubmit}
                disabled={!selectedTime || !selectedTitle}
              >
                <Text style={eventLogStyles.submitButtonText}>Add Event</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

export default function V3DashboardScreen() {
  const { session, signOut } = useAuth()
  const navigation = useNavigation()
  const [isSigningOut, setIsSigningOut] = useState(false)
  
  // Water tracking state
  const [waterIntake, setWaterIntake] = useState<boolean[]>(Array(8).fill(false))
  const [wellnessScore, setWellnessScore] = useState(75)
  const [streakDays, setStreakDays] = useState(5)
  
  // Breathing exercises state
  const [breathingExercises, setBreathingExercises] = useState<boolean[]>(Array(6).fill(false))
  
  // Daily check-in state
  const [showDailyCheckIn, setShowDailyCheckIn] = useState(false)
  const [showMealHub, setShowMealHub] = useState(false)
  const [showEventLogModal, setShowEventLogModal] = useState(false)
  
  // Timeline events state with calories
  const [timelineEvents, setTimelineEvents] = useState([
    { id: '1', time: '08:30', title: 'Breakfast', icon: '🍳', completed: true, calories: 450 },
    { id: '2', time: '10:45', title: 'Morning Snack', icon: '🍎', completed: true, calories: 120 },
    { id: '3', time: '12:30', title: 'Lunch', icon: '🥗', completed: false, calories: 520 },
    { id: '4', time: '15:00', title: 'Afternoon Snack', icon: '☕', completed: false, calories: 150 },
    { id: '5', time: '19:00', title: 'Dinner', icon: '🍽️', completed: false, calories: 680 },
    { id: '6', time: '21:00', title: 'Evening Tea', icon: '🍵', completed: false, calories: 25 },
  ])
  const [showDetailHistory, setShowDetailHistory] = useState(false)
  const [eventsExpanded, setEventsExpanded] = useState(true)
  
  // Daily nutrition goals and completed values
  const dailyCalorieGoal = 2000
  const dailyProteinGoal = 150 // grams
  const dailyCarbGoal = 250 // grams
  const dailyFatGoal = 67 // grams
  const dailyFiberGoal = 25 // grams
  const dailySugarGoal = 50 // grams
  const dailySodiumGoal = 2300 // mg
  
  const completedCalories = timelineEvents
    .filter(event => event.completed)
    .reduce((total, event) => total + (event.calories || 0), 0)
  
  // Mock completed nutrition values based on completed meals
  const completedProtein = Math.round(completedCalories * 0.075) // ~30% of calories from protein (4 cal/g)
  const completedCarbs = Math.round(completedCalories * 0.1125) // ~45% of calories from carbs (4 cal/g)
  const completedFat = Math.round(completedCalories * 0.0278) // ~25% of calories from fat (9 cal/g)
  const completedFiber = Math.round(completedCalories * 0.014) // rough estimate
  const completedSugar = Math.round(completedCalories * 0.02) // rough estimate
  const completedSodium = Math.round(completedCalories * 1.15) // rough estimate
  
  // Initialize tracking on component mount
  useEffect(() => {
    const today = new Date().toDateString()
    // TODO: Load from AsyncStorage or Supabase
  }, [])
  
  // Monitor session changes
  useEffect(() => {
    if (!session && !isSigningOut) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'SignInScreen' as never }],
      })
    }
  }, [session, navigation, isSigningOut])
  
  const handleSignOut = async () => {
    if (isSigningOut) return
    
    setIsSigningOut(true)
    try {
      await signOut()
    } catch (error: any) {
      Alert.alert('Error', 'Failed to sign out. Please try again.')
      setIsSigningOut(false)
    }
  }
  
  const handleGlassClick = (index: number) => {
    const newIntake = [...waterIntake]
    newIntake[index] = !newIntake[index]
    setWaterIntake(newIntake)
    // TODO: Save to storage
  }
  
  const handleBreathingCircleClick = (index: number) => {
    const newExercises = [...breathingExercises]
    newExercises[index] = !newExercises[index]
    setBreathingExercises(newExercises)
    // TODO: Save to storage
  }
  
  const startBreathingGuide = () => {
    // TODO: Navigate to breathing guide screen
    Alert.alert('Breathing Exercise', '30-second guided breathing coming soon!')
  }

  const toggleTimelineEvent = (eventId: string) => {
    setTimelineEvents(prev => prev.map(event => 
      event.id === eventId 
        ? { ...event, completed: !event.completed }
        : event
    ))
  }

  const addNewTimelineEvent = (event: { time: string, title: string, icon: string, calories?: number }) => {
    const newEvent = {
      id: Date.now().toString(),
      ...event,
      calories: event.calories || 0,
      completed: false
    }
    setTimelineEvents(prev => [...prev, newEvent].sort((a, b) => a.time.localeCompare(b.time)))
    setEventsExpanded(true) // Expand events when new event is added
  }

  // Helper function to convert time to percentage of day
  const timeToPercentage = (timeString: string) => {
    const [hours, minutes] = timeString.split(':').map(Number)
    const totalMinutes = hours * 60 + minutes
    return (totalMinutes / (24 * 60)) * 100
  }

  const getTimeOfDay = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'morning'
    if (hour < 18) return 'afternoon'
    return 'evening'
  }

  const getHydrationMessage = (completed: number, goal: number) => {
    const percentage = (completed / goal) * 100
    if (percentage === 0) return '💧 Start your hydration journey!'
    if (percentage < 25) return '🌱 Great start! Keep it up!'
    if (percentage < 50) return '🌟 You\'re doing amazing!'
    if (percentage < 75) return '💪 Almost there! Push forward!'
    if (percentage < 100) return '🔥 So close to your goal!'
    return '🏆 Daily hydration goal achieved! Excellent!'
  }
  
  const userName = session?.user?.email?.split('@')[0] || 'there'
  const completedGlasses = waterIntake.filter(Boolean).length
  const completedBreathingExercises = breathingExercises.filter(Boolean).length
  const hydrationGoal = 8 // 8 glasses per day
  const hydrationPercentage = (completedGlasses / hydrationGoal) * 100
  
  // Mock data - replace with real data
  const favoriteRecipes = [
    { id: '1', name: 'Mediterranean Quinoa Bowl', rating: 4.8 },
    { id: '2', name: 'Honey Garlic Salmon', rating: 4.9 },
    { id: '3', name: 'Thai Basil Chicken', rating: 4.6 },
    { id: '4', name: 'Avocado Toast Deluxe', rating: 4.4 }
  ]
  
  const cookedRecipes = []
  
  return (
    <LinearGradient
      colors={['#F0FDF4', '#DBEAFE', '#FAF5FF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Header with Wellness Focus */}
          <View style={styles.header}>
            <View style={styles.brandContainer}>
              <View style={styles.logoCircle}>
                <Text style={styles.logoEmoji}>🌿</Text>
              </View>
              <Text style={styles.brandTitle}>WellNoosh</Text>
              <Text style={styles.tagline}>Your Wellness Journey</Text>
            </View>
            
            {/* Profile & Notifications */}
            <View style={styles.headerButtons}>
              <TouchableOpacity style={styles.notificationButton}>
                <Text style={styles.notificationIcon}>🔔</Text>
              </TouchableOpacity>
              <Pressable 
                style={styles.profileButton}
                onPress={() => {
                  console.log('🔍 Profile button pressed - navigating to Profile...');
                  navigation.navigate('Profile' as never);
                }}
              >
                <Text style={styles.profileIcon}>👤</Text>
              </Pressable>
            </View>
          </View>

          {/* Welcome Message & Wellness Stats */}
          <View style={styles.welcomeCard}>
            <View style={styles.welcomeHeader}>
              <View style={styles.welcomeTextContainer}>
                <Text style={styles.welcomeTitle}>Good {getTimeOfDay()}, {userName}! 🌟</Text>
                <Text style={styles.welcomeSubtitle}>
                  Ready to continue your wellness journey?
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.checkInButton}
                onPress={() => setShowDailyCheckIn(true)}
              >
                <Text style={styles.checkInButtonText}>Check-in</Text>
              </TouchableOpacity>
            </View>
            
            {/* Daily Check-In Compact Grid */}
            <View style={styles.compactCheckInGrid}>
              <View style={[styles.compactCheckInItem, { backgroundColor: '#EFF6FF' }]}>
                <Text style={styles.compactCheckInEmoji}>⚖️</Text>
                <Text style={styles.compactCheckInValue}>72.5</Text>
                <Text style={styles.compactCheckInLabel}>Weight</Text>
              </View>
              
              <View style={[styles.compactCheckInItem, { backgroundColor: '#F0FDF4' }]}>
                <Text style={styles.compactCheckInEmoji}>😊</Text>
                <Text style={styles.compactCheckInValue}>8/10</Text>
                <Text style={styles.compactCheckInLabel}>Mood</Text>
              </View>
              
              <View style={[styles.compactCheckInItem, { backgroundColor: '#FAF5FF' }]}>
                <Text style={styles.compactCheckInEmoji}>😴</Text>
                <Text style={styles.compactCheckInValue}>7.5h</Text>
                <Text style={styles.compactCheckInLabel}>Sleep</Text>
              </View>
              
              <View style={[styles.compactCheckInItem, { backgroundColor: '#FFF7ED' }]}>
                <Text style={styles.compactCheckInEmoji}>😰</Text>
                <Text style={styles.compactCheckInValue}>3/10</Text>
                <Text style={styles.compactCheckInLabel}>Stress</Text>
              </View>
            </View>
            
            {/* Hydration Progress Bar */}
            <View style={styles.progressBarSection}>
              <View style={styles.progressBarRow}>
                <View style={styles.progressBarInfo}>
                  <Text style={styles.progressBarIcon}>💧</Text>
                  <Text style={styles.progressBarLabel}>Hydration</Text>
                  <Text style={styles.progressBarCount}>{completedGlasses}/{hydrationGoal}</Text>
                </View>
                <View style={styles.compactProgressContainer}>
                  <View style={styles.compactProgressBackground}>
                    <View 
                      style={[
                        styles.compactProgressFill,
                        { width: `${hydrationPercentage}%` }
                      ]} 
                    />
                  </View>
                </View>
                <TouchableOpacity 
                  style={styles.progressAddButton}
                  onPress={() => {
                    const nextGlassIndex = waterIntake.findIndex(glass => !glass)
                    if (nextGlassIndex !== -1) {
                      handleGlassClick(nextGlassIndex)
                    }
                  }}
                >
                  <Text style={styles.progressAddButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Breathing Progress Bar */}
            <View style={styles.progressBarSection}>
              <View style={styles.progressBarRow}>
                <View style={styles.progressBarInfo}>
                  <Text style={styles.progressBarIcon}>🧘</Text>
                  <Text style={styles.progressBarLabel}>Breathing</Text>
                  <Text style={styles.progressBarCount}>{completedBreathingExercises}/6</Text>
                </View>
                <View style={styles.compactProgressContainer}>
                  <View style={styles.compactProgressBackground}>
                    <View 
                      style={[
                        styles.compactProgressFill,
                        styles.breathingProgressFill,
                        { width: `${(completedBreathingExercises / 6) * 100}%` }
                      ]} 
                    />
                  </View>
                </View>
                <TouchableOpacity 
                  style={styles.progressAddButton}
                  onPress={() => {
                    const nextExerciseIndex = breathingExercises.findIndex(exercise => !exercise)
                    if (nextExerciseIndex !== -1) {
                      handleBreathingCircleClick(nextExerciseIndex)
                    }
                  }}
                >
                  <Text style={styles.progressAddButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Daily Progress Timeline */}
          <View style={styles.progressTimelineSection}>
            <View style={styles.timelineHeader}>
              <Text style={styles.sectionTitle}>Today's Nutrition Progress</Text>
              <TouchableOpacity 
                style={styles.addEventButton}
                onPress={() => setShowEventLogModal(true)}
              >
                <Text style={styles.addEventText}>+ Add</Text>
              </TouchableOpacity>
            </View>
            
            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground}>
                {/* Progress fill */}
                <View 
                  style={[
                    styles.progressBarFill, 
                    { width: `${Math.min((completedCalories / dailyCalorieGoal) * 100, 100)}%` }
                  ]} 
                />
                
              </View>
              
              {/* Progress stats */}
              <View style={styles.progressStats}>
                <View style={styles.progressStatsContent}>
                  <Text style={styles.progressStatsText}>
                    {completedCalories} / {dailyCalorieGoal} calories
                  </Text>
                  <Text style={styles.progressPercentage}>
                    {Math.round((completedCalories / dailyCalorieGoal) * 100)}% of daily goal
                  </Text>
                </View>
                <TouchableOpacity style={styles.moreButton} onPress={() => setShowDetailHistory(true)}>
                  <Text style={styles.moreButtonText}>more</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Events List */}
            <View style={styles.eventsListContainer}>
              <TouchableOpacity 
                style={styles.eventsListHeader}
                onPress={() => setEventsExpanded(!eventsExpanded)}
              >
                <View style={styles.eventsHeaderLeft}>
                  <Text style={[
                    styles.expandArrow,
                    eventsExpanded && styles.expandArrowRotated
                  ]}>
                    ▼
                  </Text>
                  <Text style={styles.eventsHeaderText}>Today's events</Text>
                </View>
              </TouchableOpacity>
              
              {eventsExpanded && (
                <View style={styles.eventsList}>
                  {timelineEvents.map((event) => (
                    <TouchableOpacity
                      key={event.id}
                      style={[
                        styles.eventListItem,
                        event.completed && styles.eventListItemCompleted
                      ]}
                      onPress={() => toggleTimelineEvent(event.id)}
                    >
                      <View style={styles.eventListTime}>
                        <Text style={styles.eventListTimeText}>{event.time}</Text>
                      </View>
                      
                      <View style={[
                        styles.eventListIcon,
                        event.completed && styles.eventListIconCompleted
                      ]}>
                        <Text style={styles.eventListIconText}>{event.icon}</Text>
                      </View>
                      
                      <View style={styles.eventListContent}>
                        <Text style={[
                          styles.eventListTitle,
                          event.completed && styles.eventListTitleCompleted
                        ]}>
                          {event.title}
                        </Text>
                        {event.calories && event.calories > 0 && (
                          <Text style={styles.eventListCalories}>
                            {event.calories} cal
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>


          {/* Quick Access Links */}
          <View style={styles.quickLinksSection}>
            <Text style={styles.sectionTitle}>Quick Access</Text>
            <View style={styles.quickLinksGrid}>
              <TouchableOpacity 
                style={styles.quickLink}
                onPress={() => navigation.navigate('Cooking' as never)}
              >
                <Text style={styles.quickLinkIcon}>🍳</Text>
                <Text style={styles.quickLinkTitle}>Discover Recipes</Text>
                <Text style={styles.quickLinkSubtitle}>Find new favorites</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.quickLink}
                onPress={() => navigation.navigate('Planner' as never)}
              >
                <Text style={styles.quickLinkIcon}>📅</Text>
                <Text style={styles.quickLinkTitle}>Meal Planner</Text>
                <Text style={styles.quickLinkSubtitle}>Plan your week</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.quickLink}
                onPress={() => navigation.navigate('Fridge' as never)}
              >
                <Text style={styles.quickLinkIcon}>❄️</Text>
                <Text style={styles.quickLinkTitle}>My Fridge</Text>
                <Text style={styles.quickLinkSubtitle}>Track leftovers</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.quickLink}
                onPress={() => navigation.navigate('Community' as never)}
              >
                <Text style={styles.quickLinkIcon}>👥</Text>
                <Text style={styles.quickLinkTitle}>Community</Text>
                <Text style={styles.quickLinkSubtitle}>Connect & share</Text>
              </TouchableOpacity>
            </View>
          </View>
          

          {/* Sign Out Button */}
          <View style={styles.signOutSection}>
            <Pressable 
              style={styles.signOutButton}
              onPress={handleSignOut}
              disabled={isSigningOut}
            >
              <Text style={styles.signOutText}>
                {isSigningOut ? 'Signing Out...' : 'Sign Out'}
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Event Log Modal */}
      {showEventLogModal && (
        <EventLogModal
          visible={showEventLogModal}
          onClose={() => setShowEventLogModal(false)}
          onAddEvent={addNewTimelineEvent}
        />
      )}

      {/* Detail History Modal */}
      {showDetailHistory && (
        <DetailHistoryModal
          visible={showDetailHistory}
          onClose={() => setShowDetailHistory(false)}
          events={timelineEvents}
          onToggleEvent={toggleTimelineEvent}
          completedCalories={completedCalories}
          dailyCalorieGoal={dailyCalorieGoal}
          nutritionData={{
            protein: { completed: completedProtein, goal: dailyProteinGoal, unit: 'g' },
            carbs: { completed: completedCarbs, goal: dailyCarbGoal, unit: 'g' },
            fat: { completed: completedFat, goal: dailyFatGoal, unit: 'g' },
            fiber: { completed: completedFiber, goal: dailyFiberGoal, unit: 'g' },
            sugar: { completed: completedSugar, goal: dailySugarGoal, unit: 'g' },
            sodium: { completed: completedSodium, goal: dailySodiumGoal, unit: 'mg' }
          }}
        />
      )}
      
      {/* Daily Check-In Modal */}
      <DailyCheckInScreen
        visible={showDailyCheckIn}
        onClose={() => setShowDailyCheckIn(false)}
        onSave={(data) => {
          // TODO: Save check-in data to storage/backend
          console.log('Check-in data:', data)
          Alert.alert('Success', 'Your daily check-in has been saved!')
        }}
      />
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 48,
    gap: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  brandContainer: {
    alignItems: 'center',
  },
  logoCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 8,
  },
  logoEmoji: {
    fontSize: 28,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
    fontFamily: 'System',
  },
  tagline: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'System',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  notificationIcon: {
    fontSize: 18,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  profileIcon: {
    fontSize: 18,
  },
  welcomeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  welcomeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  welcomeTextContainer: {
    flex: 1,
  },
  checkInButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  checkInButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
    fontFamily: 'System',
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'System',
  },
  hydrationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  minusButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  minusButtonText: {
    fontSize: 18,
    color: '#6B7280',
    fontWeight: '600',
  },
  plusButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusButtonText: {
    fontSize: 18,
    color: 'white',
    fontWeight: '600',
  },
  wellnessRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  wellnessStat: {
    alignItems: 'center',
    flex: 1,
  },
  wellnessStatEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  wellnessStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
    fontFamily: 'System',
  },
  wellnessStatLabel: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
    fontFamily: 'System',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
    fontFamily: 'System',
  },
  
  // Daily Check-In Styles
  dailyCheckInSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  checkInHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkInTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    fontFamily: 'System',
  },
  updateCheckInButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  updateCheckInText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
    fontFamily: 'System',
  },
  checkInGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  checkInItem: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  checkInEmoji: {
    fontSize: 18,
    marginBottom: 6,
  },
  checkInValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
    fontFamily: 'System',
  },
  checkInLabel: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
    fontFamily: 'System',
  },
  hydrationSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  hydrationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  hydrationCount: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    fontFamily: 'System',
  },
  glassContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  largeGlass: {
    alignItems: 'center',
    marginBottom: 16,
  },
  glassBody: {
    width: 80,
    height: 120,
    borderWidth: 3,
    borderColor: '#3B82F6',
    borderRadius: 8,
    backgroundColor: '#F0F9FF',
    position: 'relative',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  waterLevel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#3B82F6',
    borderRadius: 5,
    opacity: 0.8,
  },
  glassRim: {
    position: 'absolute',
    top: -3,
    left: -6,
    right: -6,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
  },
  glassEmoji: {
    position: 'absolute',
    top: 10,
    alignSelf: 'center',
    fontSize: 20,
    zIndex: 1,
  },
  glassLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    fontFamily: 'System',
  },
  smallGlassesContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  smallGlass: {
    width: 24,
    height: 32,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 4,
    backgroundColor: 'white',
    justifyContent: 'flex-end',
  },
  smallGlassFilled: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  smallGlassInner: {
    height: 0,
    backgroundColor: 'transparent',
    borderRadius: 2,
    margin: 1,
  },
  smallGlassInnerFilled: {
    height: '80%',
    backgroundColor: '#3B82F6',
  },
  hydrationMessage: {
    textAlign: 'center',
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'System',
  },
  quickLinksSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  quickLinksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickLink: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  quickLinkIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickLinkTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
    textAlign: 'center',
    fontFamily: 'System',
  },
  quickLinkSubtitle: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
    fontFamily: 'System',
  },
  achievementsSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  achievementsList: {
    gap: 12,
  },
  achievement: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  achievementCompleted: {
    backgroundColor: '#F0FDF4',
    borderColor: '#22C55E',
  },
  achievementIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
    fontFamily: 'System',
  },
  achievementProgress: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'System',
  },
  achievementStatus: {
    fontSize: 16,
  },
  signOutSection: {
    marginTop: 20,
    paddingBottom: 32,
  },
  signOutButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily: 'System',
  },
  
  // Compact Hydration Styles
  compactHydrationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: -10,
    marginBottom: 10,
  },
  compactGlass: {
    alignItems: 'center',
  },
  compactGlassBody: {
    width: 30,
    height: 40,
    borderWidth: 2,
    borderColor: '#3B82F6',
    borderRadius: 6,
    backgroundColor: '#F0F9FF',
    position: 'relative',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  compactWaterLevel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#3B82F6',
    borderRadius: 4,
    opacity: 0.8,
  },
  compactGlassEmoji: {
    position: 'absolute',
    top: 2,
    alignSelf: 'center',
    fontSize: 12,
    zIndex: 1,
  },
  compactGlassLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 4,
    fontFamily: 'System',
  },

  // Compact Check-In Styles
  compactCheckInGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  compactCheckInItem: {
    flex: 1,
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  compactCheckInEmoji: {
    fontSize: 14,
    marginBottom: 4,
  },
  compactCheckInValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
    fontFamily: 'System',
  },
  compactCheckInLabel: {
    fontSize: 9,
    color: '#6B7280',
    textAlign: 'center',
    fontFamily: 'System',
  },

  // Compact Progress Bar Styles
  progressBarSection: {
    marginTop: 12,
  },
  progressBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBarInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 100,
  },
  progressBarIcon: {
    fontSize: 16,
  },
  progressBarLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'System',
  },
  progressBarCount: {
    fontSize: 11,
    color: '#9CA3AF',
    fontFamily: 'System',
  },
  compactProgressContainer: {
    flex: 1,
  },
  compactProgressBackground: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  compactProgressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 4,
  },
  breathingProgressFill: {
    backgroundColor: '#8B5CF6',
  },
  progressAddButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressAddButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },

  // Timeline Styles
  timelineSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addEventButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  addEventText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
    fontFamily: 'System',
  },
  timelineContainer: {
    position: 'relative',
  },
  timelineItemContainer: {
    position: 'relative',
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  timelineItemCompleted: {
    backgroundColor: '#F0FDF4',
  },
  timelineTime: {
    width: 50,
    marginRight: 12,
  },
  timelineTimeText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    fontFamily: 'System',
  },
  timelineIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  timelineIconCompleted: {
    backgroundColor: '#10B981',
  },
  timelineIconText: {
    fontSize: 16,
  },
  timelineTitle: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
    fontFamily: 'System',
  },
  timelineStatus: {
    marginLeft: 8,
  },
  timelineStatusIcon: {
    fontSize: 16,
  },
  timelineConnector: {
    position: 'absolute',
    left: 73,
    top: 32,
    width: 2,
    height: 16,
    backgroundColor: '#E5E7EB',
  },
  timelineConnectorCompleted: {
    backgroundColor: '#10B981',
  },
  completedText: {
    opacity: 0.7,
    textDecorationLine: 'line-through',
  },

  // Progress Timeline Styles
  progressTimelineSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  progressBarContainer: {
    marginBottom: 20,
  },
  progressBarBackground: {
    position: 'relative',
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressBarFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  timeMarkers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  timeMarkerText: {
    fontSize: 10,
    color: '#9CA3AF',
    fontFamily: 'System',
  },
  progressStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 0,
  },
  progressStatsContent: {
    alignItems: 'center',
    flex: 1,
  },
  progressStatsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    fontFamily: 'System',
  },
  progressPercentage: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'System',
  },
  eventsListContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 0,
  },
  eventsListHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  eventsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewDetailsText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
    fontFamily: 'System',
  },
  expandArrow: {
    fontSize: 18,
    color: '#6B7280',
    fontWeight: '600',
    transform: [{ rotate: '0deg' }],
  },
  expandArrowRotated: {
    transform: [{ rotate: '180deg' }],
  },
  eventsList: {
    gap: 4,
  },
  eventListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  eventListItemCompleted: {
    backgroundColor: '#F0FDF4',
    borderColor: '#22C55E',
  },
  eventListTime: {
    width: 38,
    marginRight: 8,
  },
  eventListTimeText: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
    fontFamily: 'System',
  },
  eventListIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  eventListIconCompleted: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  eventListIconText: {
    fontSize: 12,
  },
  eventListContent: {
    flex: 1,
  },
  eventListTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1F2937',
    fontFamily: 'System',
  },
  eventListTitleCompleted: {
    color: '#16A34A',
  },
  eventListCalories: {
    fontSize: 10,
    color: '#6B7280',
    fontFamily: 'System',
    marginTop: 1,
  },
  eventsHeaderText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    fontFamily: 'System',
  },
  moreButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  moreButtonText: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
    fontFamily: 'System',
  },
})

// Event Log Modal Styles
const eventLogStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    fontFamily: 'System',
  },
  closeButton: {
    fontSize: 20,
    color: '#6B7280',
    padding: 4,
  },
  modalContent: {
    padding: 20,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    fontFamily: 'System',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontFamily: 'System',
  },
  nowButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  nowButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryItem: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    minWidth: 80,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryItemSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  categoryTitle: {
    fontSize: 12,
    color: '#1F2937',
    fontWeight: '500',
    textAlign: 'center',
    fontFamily: 'System',
  },
  customInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontFamily: 'System',
  },
  caloriesInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontFamily: 'System',
    width: 100,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
    fontFamily: 'System',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#10B981',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  submitButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
    fontFamily: 'System',
  },
})

// Detail History Modal Styles
const detailHistoryStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '100%',
    height: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    fontFamily: 'System',
  },
  closeButton: {
    fontSize: 20,
    color: '#6B7280',
    padding: 4,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 0,
  },
  summarySection: {
    padding: 20,
    backgroundColor: '#F8FAFC',
    minHeight: 200,
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
    fontFamily: 'System',
    textAlign: 'center',
  },
  summaryCalories: {
    fontSize: 24,
    fontWeight: '700',
    color: '#10B981',
    marginBottom: 8,
    fontFamily: 'System',
  },
  summaryProgressBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginBottom: 8,
    overflow: 'hidden',
  },
  summaryProgressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  summaryPercentage: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'System',
  },
  eventsSection: {
    padding: 20,
  },
  eventsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
    fontFamily: 'System',
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  eventItemCompleted: {
    backgroundColor: '#F0FDF4',
    borderColor: '#22C55E',
  },
  eventTime: {
    width: 60,
    marginRight: 12,
  },
  eventTimeText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    fontFamily: 'System',
  },
  eventIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  eventIconContainerCompleted: {
    backgroundColor: '#10B981',
  },
  eventIconText: {
    fontSize: 16,
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
    fontFamily: 'System',
  },
  eventTitleCompleted: {
    color: '#16A34A',
  },
  eventCalories: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'System',
  },
  eventStatus: {
    marginLeft: 8,
  },
  eventStatusIcon: {
    fontSize: 16,
  },
  dailySummary: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#F8FAFC',
  },
  dailySummaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
    fontFamily: 'System',
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryStatItem: {
    alignItems: 'center',
  },
  summaryStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
    fontFamily: 'System',
  },
  summaryStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'System',
  },
  nutritionItem: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    alignItems: 'center',
  },
  nutritionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  nutritionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nutritionIconText: {
    fontSize: 14,
  },
  nutritionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    fontFamily: 'System',
  },
  nutritionValues: {
    alignItems: 'center',
    marginBottom: 8,
  },
  nutritionValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    fontFamily: 'System',
  },
  nutritionGoal: {
    fontSize: 10,
    color: '#6B7280',
    fontFamily: 'System',
  },
  nutritionProgressBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  nutritionProgressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  nutritionPercentage: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
    fontFamily: 'System',
    textAlign: 'center',
  },
})