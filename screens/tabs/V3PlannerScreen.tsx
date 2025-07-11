import React, { useState, useEffect, useRef } from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Modal, TextInput, Dimensions } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Slider from '@react-native-community/slider'

interface LeftoverItem {
  id: string
  name: string
  addedDate: string
  quantity?: string
  expiryDate?: string
  fromMeal?: string
  category: 'vegetables' | 'proteins' | 'grains' | 'dairy' | 'condiments' | 'other'
  status: 'fresh' | 'expiring' | 'expired'
}

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

export default function V3PlannerScreen() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [userData, setUserData] = useState<UserData | null>(null)
  const [showGoalSettings, setShowGoalSettings] = useState(false)
  const [dailyCalories, setDailyCalories] = useState(2000)
  const [isGenerating, setIsGenerating] = useState(false)
  const [weightGoal, setWeightGoal] = useState(70)
  const [currentBMI, setCurrentBMI] = useState(0)
  const [currentCookingMode, setCurrentCookingMode] = useState('Weekdays') // 'Weekdays', 'Weekends', 'Busy Days'
  const [showGoalUpdate, setShowGoalUpdate] = useState(false)
  const [currentGoalStep, setCurrentGoalStep] = useState(0)
  const [goalUpdateData, setGoalUpdateData] = useState({
    healthGoals: userData?.healthGoals || [],
    activityLevel: userData?.activityLevel || '',
    dietStyle: userData?.dietStyle || []
  })
  const [showRegenerateOptions, setShowRegenerateOptions] = useState(false)
  const [regenerationProgress, setRegenerationProgress] = useState(0)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [currentRegenerationType, setCurrentRegenerationType] = useState('complete')
  const [leftovers, setLeftovers] = useState<LeftoverItem[]>([])
  const [showCustomMealPlan, setShowCustomMealPlan] = useState(false)
  const [leftoverOptimizationEnabled, setLeftoverOptimizationEnabled] = useState(true)
  const [dailyCookingTimes, setDailyCookingTimes] = useState({
    Monday: 30,
    Tuesday: 30,
    Wednesday: 30,
    Thursday: 30,
    Friday: 30,
    Saturday: 45,
    Sunday: 45
  })
  const [healthinessLevel, setHealthinessLevel] = useState(50) // 0-100 scale
  const [veggiesMeatRatio, setVeggiesMeatRatio] = useState(50) // 0-100 scale (0 = no meat, 100 = lots of meat)
  const [selectedDays, setSelectedDays] = useState<string[]>(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])
  const weekScrollRef = useRef<ScrollView>(null)
  const [weekOffset, setWeekOffset] = useState(0) // 0 = current week, -1 = last week, 1 = next week
  const [showMealLogging, setShowMealLogging] = useState(false)
  const [mealLogText, setMealLogText] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [mealSuggestions, setMealSuggestions] = useState<string[]>([])
  const [selectedMealType, setSelectedMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast')
  const [currentScrollX, setCurrentScrollX] = useState(0)

  useEffect(() => {
    loadMealPlans()
    loadUserData()
    loadLeftovers()
    
    // Set default user data if none exists
    if (!userData) {
      const defaultUser: UserData = {
        fullName: 'Demo User',
        email: 'demo@wellnoosh.com',
        age: 30,
        gender: 'male',
        weight: 75,
        weightUnit: 'kg',
        height: 175,
        heightUnit: 'cm',
        dietStyle: ['Balanced'],
        healthGoals: ['Maintain Weight'],
        activityLevel: 'Moderately Active'
      }
      setUserData(defaultUser)
      calculateDailyCalories(defaultUser)
    }
  }, [])

  // Scroll to today's date when component mounts
  useEffect(() => {
    const scrollToToday = () => {
      const today = new Date()
      const dayOfWeek = today.getDay()
      // Current week starts at index 14 (third week)
      // Card width (80) + margin (8) = 88 per card
      const todayIndex = 14 + dayOfWeek
      const scrollPosition = Math.max(0, todayIndex * 88 - 100)
      
      setTimeout(() => {
        weekScrollRef.current?.scrollTo({ x: scrollPosition, animated: false })
      }, 100)
    }
    
    scrollToToday()
  }, [])

  const loadMealPlans = async () => {
    try {
      const stored = await AsyncStorage.getItem('meal_plans')
      if (stored) {
        setMealPlans(JSON.parse(stored))
      } else {
        // Generate initial week
        generateWeeklyMeals()
      }
    } catch (error) {
      console.error('Error loading meal plans:', error)
    }
  }

  const saveMealPlans = async (plans: MealPlan[]) => {
    try {
      await AsyncStorage.setItem('meal_plans', JSON.stringify(plans))
    } catch (error) {
      console.error('Error saving meal plans:', error)
    }
  }

  const loadUserData = async () => {
    try {
      const stored = await AsyncStorage.getItem('user_data')
      if (stored) {
        const data = JSON.parse(stored)
        setUserData(data)
        calculateDailyCalories(data)
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    }
  }

  const loadLeftovers = async () => {
    try {
      const stored = await AsyncStorage.getItem('leftovers')
      if (stored) {
        setLeftovers(JSON.parse(stored))
      }
    } catch (error) {
      console.error('Error loading leftovers:', error)
    }
  }

  const calculateDailyCalories = (user: UserData) => {
    if (!user.weight || !user.height || !user.age) {
      setDailyCalories(2000)
      return
    }

    // Basic BMR calculation (Mifflin-St Jeor Equation)
    let bmr = 0
    const weight = user.weight
    const height = user.heightUnit === 'ft' ? user.height * 30.48 : user.height
    const age = user.age

    if (user.gender === 'male') {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161
    }

    // Activity level multiplier
    const activityMultipliers = {
      'Sedentary': 1.2,
      'Lightly Active': 1.375,
      'Moderately Active': 1.55,
      'Very Active': 1.725,
      'Extremely Active': 1.9
    }

    const multiplier = activityMultipliers[user.activityLevel as keyof typeof activityMultipliers] || 1.2
    const calories = Math.round(bmr * multiplier)
    
    setDailyCalories(calories)
    setWeightGoal(user.weight || 70)

    // Calculate BMI
    if (user.weight && user.height) {
      const bmi = calculateBMI(user.weight, user.height, user.heightUnit)
      setCurrentBMI(bmi)
    }
  }

  const calculateBMI = (weight: number, height: number, heightUnit?: string) => {
    let heightInMeters = height
    if (heightUnit === 'ft') {
      heightInMeters = height * 0.3048
    } else if (heightUnit === 'cm') {
      heightInMeters = height / 100
    }
    
    const bmi = weight / (heightInMeters * heightInMeters)
    return Math.round(bmi * 10) / 10
  }

  const generateLeftoverBasedMeals = () => {
    if (leftovers.length === 0) {
      // Return default leftover-style meals if no actual leftovers
      return [
        {
          breakfast: { name: 'Leftover Veggie Scramble', calories: 360, time: '8:00 AM' },
          lunch: { name: 'Leftover Rice & Bean Bowl', calories: 480, time: '1:00 PM' },
          dinner: { name: 'Leftover Chicken Stir-fry', calories: 420, time: '7:30 PM' }
        },
        {
          breakfast: { name: 'French Toast with Leftover Bread', calories: 340, time: '8:00 AM' },
          lunch: { name: 'Leftover Pasta Salad', calories: 450, time: '1:00 PM' },
          dinner: { name: 'Leftover Soup & Grilled Cheese', calories: 510, time: '7:30 PM' }
        },
        {
          breakfast: { name: 'Smoothie Bowl with Leftover Fruits', calories: 320, time: '8:00 AM' },
          lunch: { name: 'Leftover Roast Wrap', calories: 460, time: '1:00 PM' },
          dinner: { name: 'Leftover Curry with Rice', calories: 480, time: '7:30 PM' }
        },
        {
          breakfast: { name: 'Leftover Quinoa Breakfast Bowl', calories: 370, time: '8:00 AM' },
          lunch: { name: 'Leftover Pizza Salad', calories: 410, time: '1:00 PM' },
          dinner: { name: 'Leftover Fish Tacos', calories: 440, time: '7:30 PM' }
        },
        {
          breakfast: { name: 'Leftover Pancake Parfait', calories: 350, time: '8:00 AM' },
          lunch: { name: 'Leftover Chicken Salad', calories: 390, time: '1:00 PM' },
          dinner: { name: 'Leftover Stew & Crusty Bread', calories: 520, time: '7:30 PM' }
        },
        {
          breakfast: { name: 'Leftover Muffin & Yogurt', calories: 310, time: '8:00 AM' },
          lunch: { name: 'Leftover Grain Bowl', calories: 470, time: '1:00 PM' },
          dinner: { name: 'Leftover Casserole', calories: 490, time: '7:30 PM' }
        },
        {
          breakfast: { name: 'Leftover Fruit Compote Toast', calories: 330, time: '9:00 AM' },
          lunch: { name: 'Leftover Sandwich & Soup', calories: 440, time: '1:30 PM' },
          dinner: { name: 'Leftover Roast Dinner', calories: 500, time: '7:30 PM' }
        }
      ]
    }

    // Generate meals based on actual leftovers
    const freshLeftovers = leftovers.filter(item => item.status === 'fresh' || item.status === 'expiring')
    const mealIdeas = []

    for (let day = 0; day < 7; day++) {
      const dayMeals = {
        breakfast: { name: 'Energizing Breakfast', calories: 350, time: '8:00 AM' },
        lunch: { name: 'Balanced Lunch', calories: 480, time: '1:00 PM' },
        dinner: { name: 'Hearty Dinner', calories: 450, time: '7:30 PM' }
      }

      // Try to incorporate leftovers into meals
      if (freshLeftovers.length > 0) {
        const leftoverForMeal = freshLeftovers[day % freshLeftovers.length]
        
        if (leftoverForMeal.category === 'vegetables') {
          dayMeals.breakfast.name = `Veggie Scramble with ${leftoverForMeal.name}`
          dayMeals.lunch.name = `${leftoverForMeal.name} Salad Bowl`
          dayMeals.dinner.name = `Roasted ${leftoverForMeal.name} & Protein`
        } else if (leftoverForMeal.category === 'proteins') {
          dayMeals.breakfast.name = `Protein-Rich Breakfast`
          dayMeals.lunch.name = `${leftoverForMeal.name} Wrap`
          dayMeals.dinner.name = `${leftoverForMeal.name} Stir-Fry`
        } else if (leftoverForMeal.category === 'grains') {
          dayMeals.breakfast.name = `${leftoverForMeal.name} Porridge`
          dayMeals.lunch.name = `${leftoverForMeal.name} Power Bowl`
          dayMeals.dinner.name = `${leftoverForMeal.name} Pilaf`
        } else {
          dayMeals.lunch.name = `Creative ${leftoverForMeal.name} Dish`
          dayMeals.dinner.name = `${leftoverForMeal.name} Fusion`
        }
      }

      mealIdeas.push(dayMeals)
    }

    return mealIdeas
  }


  const generateWeeklyMeals = (regenerationType = 'complete') => {
    setIsGenerating(true)
    setIsRegenerating(true)
    setRegenerationProgress(0)
    setShowRegenerateOptions(false)
    setCurrentRegenerationType(regenerationType)
    
    // Progress animation
    const progressInterval = setInterval(() => {
      setRegenerationProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          return 100
        }
        return prev + 2 // 2% every 100ms = 5 seconds total
      })
    }, 100)
    
    // Sample meal plans for a week - adjusted for regeneration type
    const mealTemplates = regenerationType === 'leftovers' ? generateLeftoverBasedMeals() : [
      {
        breakfast: { name: 'Avocado Toast Bowl', calories: 380, time: '8:00 AM' },
        lunch: { name: 'Quinoa Buddha Bowl', calories: 520, time: '1:00 PM' },
        dinner: { name: 'Herb-Crusted Salmon', calories: 480, time: '7:30 PM' }
      },
      {
        breakfast: { name: 'Greek Yogurt Parfait', calories: 320, time: '8:00 AM' },
        lunch: { name: 'Mediterranean Wrap', calories: 450, time: '1:00 PM' },
        dinner: { name: 'Grilled Chicken & Veggies', calories: 520, time: '7:30 PM' }
      },
      {
        breakfast: { name: 'Protein Smoothie Bowl', calories: 350, time: '8:00 AM' },
        lunch: { name: 'Asian Noodle Salad', calories: 480, time: '1:00 PM' },
        dinner: { name: 'Stuffed Bell Peppers', calories: 460, time: '7:30 PM' }
      },
      {
        breakfast: { name: 'Overnight Oats', calories: 340, time: '8:00 AM' },
        lunch: { name: 'Turkey & Hummus Wrap', calories: 420, time: '1:00 PM' },
        dinner: { name: 'Baked Cod with Rice', calories: 490, time: '7:30 PM' }
      },
      {
        breakfast: { name: 'Veggie Scramble', calories: 360, time: '8:00 AM' },
        lunch: { name: 'Caprese Salad Bowl', calories: 380, time: '1:00 PM' },
        dinner: { name: 'Lean Beef Stir-fry', calories: 540, time: '7:30 PM' }
      },
      {
        breakfast: { name: 'Chia Pudding', calories: 300, time: '8:00 AM' },
        lunch: { name: 'Poke Bowl', calories: 520, time: '1:00 PM' },
        dinner: { name: 'Vegetarian Pasta', calories: 480, time: '7:30 PM' }
      },
      {
        breakfast: { name: 'Pancakes with Berries', calories: 420, time: '9:00 AM' },
        lunch: { name: 'Gourmet Sandwich', calories: 480, time: '1:30 PM' },
        dinner: { name: 'Roasted Vegetable Medley', calories: 440, time: '7:30 PM' }
      }
    ]

    setTimeout(() => {
      const week: MealPlan[] = []
      const today = new Date()
      
      for (let i = 0; i < 7; i++) {
        const date = new Date(today)
        date.setDate(today.getDate() + i)
        
        const mealPlan: MealPlan = {
          id: `plan-${i}`,
          date: date.toISOString().split('T')[0],
          meals: mealTemplates[i]
        }
        
        week.push(mealPlan)
      }
      
      setMealPlans(week)
      saveMealPlans(week)
      setIsGenerating(false)
      setIsRegenerating(false)
      setRegenerationProgress(0)
    }, 5000)
  }

  const getExtendedWeeks = () => {
    const today = new Date()
    const weeks = []
    
    // Generate 5 weeks total (2 previous, current, 2 next)
    for (let weekNum = -2; weekNum <= 2; weekNum++) {
      const weekStart = new Date(today)
      weekStart.setDate(today.getDate() - today.getDay() + (weekNum * 7))
      
      for (let dayNum = 0; dayNum < 7; dayNum++) {
        const date = new Date(weekStart)
        date.setDate(weekStart.getDate() + dayNum)
        weeks.push(date)
      }
    }
    
    return weeks
  }

  const getCurrentWeekIndex = () => {
    // The current week starts at index 14 (third week of 5)
    return 14
  }

  const getSelectedMealPlan = () => {
    return mealPlans.find(plan => plan.date === selectedDate)
  }

  const getTotalCaloriesForDay = (date: string) => {
    const plan = mealPlans.find(p => p.date === date)
    if (!plan) return 0
    
    const breakfast = plan.meals.breakfast?.calories || 0
    const lunch = plan.meals.lunch?.calories || 0
    const dinner = plan.meals.dinner?.calories || 0
    
    return breakfast + lunch + dinner
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const isToday = (dateString: string) => {
    return dateString === new Date().toISOString().split('T')[0]
  }

  const getWeekLabel = (date: Date) => {
    const today = new Date()
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const diffTime = startOfDate.getTime() - startOfToday.getTime()
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))
    
    // Check if this is the start of current week
    const todayDayOfWeek = today.getDay()
    const startOfThisWeek = new Date(startOfToday)
    startOfThisWeek.setDate(startOfToday.getDate() - todayDayOfWeek)
    
    const weekDiff = Math.floor((diffDays + todayDayOfWeek) / 7)
    
    if (weekDiff === 0) {
      return 'This Week'
    } else if (weekDiff === -1) {
      return 'Last Week'
    } else if (weekDiff === 1) {
      return 'Next Week'
    } else if (weekDiff < -1) {
      return `${Math.abs(weekDiff)} Weeks Ago`
    } else if (weekDiff > 1) {
      return `In ${weekDiff} Weeks`
    }
    return ''
  }

  const getWeekRangeText = () => {
    const today = new Date()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay() + (weekOffset * 7))
    
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)
    
    const formatDateShort = (date: Date) => {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      return `${date.getDate()} ${months[date.getMonth()]}`
    }
    
    return `${formatDateShort(startOfWeek)} - ${formatDateShort(endOfWeek)}`
  }

  const generateMealSuggestions = (text: string) => {
    if (text.length < 3) {
      setMealSuggestions([])
      return
    }

    const commonMeals = [
      'Grilled chicken with rice and vegetables',
      'Caesar salad with grilled chicken',
      'Pasta with marinara sauce',
      'Avocado toast with eggs',
      'Greek yogurt with berries',
      'Quinoa bowl with vegetables',
      'Salmon with roasted vegetables',
      'Turkey sandwich',
      'Smoothie bowl with fruits',
      'Oatmeal with banana and nuts',
      'Stir-fry with tofu and vegetables',
      'Pizza margherita',
      'Burrito bowl',
      'Soup and salad',
      'Protein shake with banana'
    ]

    const filtered = commonMeals.filter(meal => 
      meal.toLowerCase().includes(text.toLowerCase())
    ).slice(0, 3)

    setMealSuggestions(filtered)
  }

  const startVoiceRecording = () => {
    setIsRecording(true)
    // Simulate voice recording - in real app, would use expo-av or react-native-voice
    setTimeout(() => {
      setIsRecording(false)
      setMealLogText('Grilled chicken with quinoa and steamed broccoli')
      Alert.alert('Voice Recorded', 'Your meal description has been transcribed!')
    }, 3000)
  }

  const stopVoiceRecording = () => {
    setIsRecording(false)
  }

  const takeMealPhoto = () => {
    // Simulate photo capture - in real app, would use expo-camera or expo-image-picker
    Alert.alert(
      'Photo Feature',
      'Camera functionality would be implemented here. For now, we\'ll add a sample meal.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Add Sample', 
          onPress: () => setMealLogText('Mixed green salad with grilled salmon and olive oil dressing')
        }
      ]
    )
  }

  const saveMealLog = async () => {
    if (!mealLogText.trim()) return

    const mealLog = {
      id: Date.now().toString(),
      date: selectedDate,
      mealType: selectedMealType,
      description: mealLogText,
      timestamp: new Date().toISOString(),
      estimatedCalories: Math.floor(Math.random() * 400) + 200 // Mock calorie estimation
    }

    try {
      const existingLogs = await AsyncStorage.getItem('meal_logs')
      const logs = existingLogs ? JSON.parse(existingLogs) : []
      logs.push(mealLog)
      await AsyncStorage.setItem('meal_logs', JSON.stringify(logs))
      
      Alert.alert('Meal Logged!', `Your ${selectedMealType} has been saved successfully.`)
      setShowMealLogging(false)
      setMealLogText('')
      setMealSuggestions([])
    } catch (error) {
      Alert.alert('Error', 'Failed to save meal log. Please try again.')
    }
  }

  const getCookingTimeData = () => {
    const modes = [
      { name: 'Busy Days', icon: '🏃‍♂️', time: 20, minTime: 15, maxTime: 30 },
      { name: 'Weekdays', icon: '⏰', time: 37.5, minTime: 30, maxTime: 45 },
      { name: 'Weekends', icon: '🏖️', time: 75, minTime: 60, maxTime: 90 }
    ]
    
    const currentMode = modes.find(mode => mode.name === currentCookingMode) || modes[1]
    return { modes, currentMode }
  }

  const getCookingTimePosition = (time: number) => {
    // Position on bar from 0 to 100% based on time range (15-90 minutes)
    const minTime = 15
    const maxTime = 90
    const position = ((time - minTime) / (maxTime - minTime)) * 100
    return Math.max(0, Math.min(100, position))
  }

  const getDailyNutritionStats = (date: string) => {
    const plan = mealPlans.find(p => p.date === date)
    if (!plan) return null
    
    // Mock nutrition data based on meal types
    const nutritionStats = {
      protein: Math.floor(Math.random() * 40) + 60, // 60-100g
      fiber: Math.floor(Math.random() * 15) + 20,   // 20-35g
      vitamins: Math.floor(Math.random() * 30) + 70, // 70-100% daily value
    }
    
    return nutritionStats
  }

  const goalUpdateSteps = [
    {
      title: "Update Your Health Goals",
      subtitle: "What are your current health objectives?",
      field: 'healthGoals',
      options: [
        'Lose Weight', 'Gain Weight', 'Maintain Weight', 'Build Muscle',
        'Improve Energy', 'Better Digestion', 'Reduce Inflammation',
        'Heart Health', 'Better Sleep', 'General Wellness'
      ],
      multiSelect: true
    },
    {
      title: "Activity Level",
      subtitle: "How active are you currently?",
      field: 'activityLevel',
      options: [
        'Sedentary',
        'Lightly Active',
        'Moderately Active',
        'Very Active',
        'Extremely Active'
      ],
      multiSelect: false
    },
    {
      title: "Diet Style",
      subtitle: "Any changes to your dietary preferences?",
      field: 'dietStyle',
      options: [
        'Balanced', 'Omnivore', 'Vegetarian', 'Vegan', 'Pescatarian', 'Keto', 'Paleo', 
        'Mediterranean', 'Low Carb', 'Gluten-Free', 'Dairy-Free'
      ],
      multiSelect: true
    }
  ]

  const getDietStyleIcon = (dietStyle: string) => {
    const icons: { [key: string]: string } = {
      'Balanced': '⚖️',
      'Omnivore': '🍽️',
      'Vegetarian': '🥗',
      'Vegan': '🌱',
      'Pescatarian': '🐟',
      'Keto': '🥑',
      'Paleo': '🦴',
      'Mediterranean': '🫒',
      'Low Carb': '🥩',
      'Gluten-Free': '🌾',
      'Dairy-Free': '🥛'
    }
    return icons[dietStyle] || '🍽️'
  }

  const handleGoalUpdateAnswer = (field: string, value: string, isMultiSelect: boolean) => {
    if (isMultiSelect) {
      setGoalUpdateData(prev => ({
        ...prev,
        [field]: prev[field as keyof typeof prev].includes(value)
          ? (prev[field as keyof typeof prev] as string[]).filter(item => item !== value)
          : [...(prev[field as keyof typeof prev] as string[]), value]
      }))
    } else {
      setGoalUpdateData(prev => ({ ...prev, [field]: value }))
    }
  }

  const handleGoalUpdateNext = () => {
    if (currentGoalStep < goalUpdateSteps.length - 1) {
      setCurrentGoalStep(prev => prev + 1)
    } else {
      // Save the updated goals
      if (userData) {
        const updatedUserData = {
          ...userData,
          healthGoals: goalUpdateData.healthGoals,
          activityLevel: goalUpdateData.activityLevel,
          dietStyle: goalUpdateData.dietStyle
        }
        setUserData(updatedUserData)
        calculateDailyCalories(updatedUserData)
        // You could save to AsyncStorage here if needed
      }
      setShowGoalUpdate(false)
      setCurrentGoalStep(0)
      Alert.alert('Goals Updated', 'Your health goals have been successfully updated!')
    }
  }

  const handleGoalUpdateBack = () => {
    if (currentGoalStep > 0) {
      setCurrentGoalStep(prev => prev - 1)
    } else {
      setShowGoalUpdate(false)
      setCurrentGoalStep(0)
    }
  }

  const selectedMealPlan = getSelectedMealPlan()
  const selectedDateTotalCalories = getTotalCaloriesForDay(selectedDate)

  return (
    <LinearGradient
      colors={['#F0FDF4', '#DBEAFE', '#FAF5FF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <View style={styles.wellnessLogo}>
                <Text style={styles.wellnessLogoIcon}>🌿</Text>
              </View>
              <Text style={styles.title}>Meal Planner</Text>
            </View>
          </View>

          {/* Calories Overview */}
          <View style={styles.caloriesOverviewContainer}>
            <View style={styles.caloriesCard}>
              <Text style={styles.caloriesIcon}>🔥</Text>
              <View style={styles.caloriesTextContainer}>
                <Text style={styles.currentCaloriesText}>
                  {getTotalCaloriesForDay(selectedDate)}
                </Text>
                <Text style={styles.caloriesDivider}>/</Text>
                <Text style={styles.dailyCaloriesText}>
                  {userData?.dailyCalories || dailyCalories || 2000} cal
                </Text>
              </View>
              <TouchableOpacity
                style={styles.logMealButton}
                onPress={() => setShowMealLogging(true)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#10B981', '#059669', '#047857']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.logMealButtonGradient}
                >
                  <View style={styles.logMealButtonContent}>
                    <View style={styles.logMealButtonIconContainer}>
                      <Text style={styles.logMealButtonIcon}>🍽️</Text>
                      <View style={styles.logMealButtonSparkle}>
                        <Text style={styles.logMealButtonSparkleText}>✨</Text>
                      </View>
                    </View>
                    <Text style={styles.logMealButtonText}>Log Meal</Text>
                    <Text style={styles.logMealButtonSubtext}>What did you eat?</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          {/* Week Navigation */}
          <View style={styles.weekContainer}>
            <View style={styles.weekHeader}>
              <TouchableOpacity
                style={styles.weekArrowButton}
                onPress={() => {
                  // Move by 5 days instead of 7
                  const cardWidth = 88;
                  const newScrollX = Math.max(0, currentScrollX - (5 * cardWidth));
                  
                  weekScrollRef.current?.scrollTo({ 
                    x: newScrollX, 
                    animated: true 
                  });
                }}
              >
                <Text style={styles.weekArrowText}>‹</Text>
              </TouchableOpacity>
              
              <Text style={styles.weekTitle}>{getWeekRangeText()}</Text>
              
              <TouchableOpacity
                style={styles.weekArrowButton}
                onPress={() => {
                  // Move by 5 days instead of 7
                  const cardWidth = 88;
                  const screenWidth = Dimensions.get('window').width;
                  const totalWidth = 35 * cardWidth; // 35 days total
                  const maxScrollX = totalWidth - screenWidth;
                  const newScrollX = Math.min(maxScrollX, currentScrollX + (5 * cardWidth));
                  
                  weekScrollRef.current?.scrollTo({ 
                    x: newScrollX, 
                    animated: true 
                  });
                }}
              >
                <Text style={styles.weekArrowText}>›</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.todayButton}
                onPress={() => {
                  setWeekOffset(0);
                  const today = new Date();
                  setSelectedDate(today.toISOString().split('T')[0]);
                  const dayOfWeek = today.getDay();
                  const todayIndex = 14 + dayOfWeek;
                  
                  // Calculate scroll position to center today's date
                  // Each day card is 88px wide (60px + 8px margin on each side)
                  const cardWidth = 88;
                  const screenWidth = Dimensions.get('window').width;
                  const screenCenter = screenWidth / 2;
                  const scrollX = (todayIndex * cardWidth) - screenCenter + (cardWidth / 2);
                  
                  weekScrollRef.current?.scrollTo({ 
                    x: Math.max(0, scrollX), // Ensure we don't scroll to negative values
                    animated: true 
                  });
                }}
              >
                <Text style={styles.todayButtonIcon}>📍</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.regenerateButton}
                onPress={() => setShowRegenerateOptions(true)}
                disabled={isGenerating}
              >
                <Text style={styles.regenerateButtonIcon}>🍽️</Text>
                <Text style={styles.regenerateButtonText}>New Plan</Text>
              </TouchableOpacity>
            </View>
            <ScrollView 
              ref={weekScrollRef}
              horizontal 
              showsHorizontalScrollIndicator={false} 
              style={styles.weekScroll}
              pagingEnabled={false}
              decelerationRate="fast"
              snapToInterval={88}
              snapToAlignment="start"
              onScroll={(event) => {
                setCurrentScrollX(event.nativeEvent.contentOffset.x);
              }}
              scrollEventThrottle={16}
            >
              {getExtendedWeeks().map((date, index) => {
                const dateString = date.toISOString().split('T')[0]
                const isSelected = dateString === selectedDate
                const hasPlans = mealPlans.some(plan => plan.date === dateString)
                
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dayCard,
                      isSelected && styles.selectedDayCard,
                      isToday(dateString) && styles.todayCard
                    ]}
                    onPress={() => {
                      setSelectedDate(dateString);
                      
                      // Center the selected day card
                      const cardWidth = 88;
                      const screenWidth = Dimensions.get('window').width;
                      const screenCenter = screenWidth / 2;
                      const scrollX = (index * cardWidth) - screenCenter + (cardWidth / 2);
                      
                      weekScrollRef.current?.scrollTo({ 
                        x: Math.max(0, scrollX),
                        animated: true 
                      });
                    }}
                  >
                    <Text style={[
                      styles.dayLabel,
                      isSelected && styles.selectedDayLabel
                    ]}>
                      {date.toLocaleDateString('en-US', { weekday: 'short' })}
                    </Text>
                    <Text style={[
                      styles.dayNumber,
                      isSelected && styles.selectedDayNumber,
                      isToday(dateString) && styles.todayNumber
                    ]}>
                      {date.getDate()}
                    </Text>
                    {isToday(dateString) && <Text style={styles.todayLabel}>Today</Text>}
                  </TouchableOpacity>
                )
              })}
            </ScrollView>
          </View>

          {/* Generate Meals Button */}
          {mealPlans.length === 0 && (
            <TouchableOpacity
              style={styles.generateButton}
              onPress={generateWeeklyMeals}
              disabled={isGenerating}
            >
              <Text style={styles.generateButtonIcon}>
                {isGenerating ? '⏳' : '✨'}
              </Text>
              <Text style={styles.generateButtonText}>
                {isGenerating ? 'Generating Your Meal Plan...' : 'Generate Weekly Meal Plan'}
              </Text>
            </TouchableOpacity>
          )}

          {/* Selected Day Meals */}
          {selectedMealPlan && (
            <View style={styles.selectedDayContainer}>
              <Text style={styles.selectedDayTitle}>
                {formatDate(new Date(selectedDate))}
              </Text>
              
              {/* Compact Nutrition Card - Single Line */}
              {(() => {
                const nutritionStats = getDailyNutritionStats(selectedDate);
                return nutritionStats ? (
                  <View style={styles.compactNutritionCard}>
                    <LinearGradient
                      colors={['#F0FDF4', '#DCFCE7', '#BBF7D0']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.nutritionCardGradient}
                    >
                      <View style={styles.singleLineNutritionRow}>
                        {/* Calories */}
                        <View style={styles.nutritionPill}>
                          <Text style={styles.nutritionEmoji}>🔥</Text>
                          <Text style={styles.nutritionValue}>{selectedDateTotalCalories}</Text>
                        </View>
                        
                        {/* Goal Progress */}
                        <View style={[
                          styles.nutritionPill,
                          styles.goalPill,
                          selectedDateTotalCalories > dailyCalories * 1.1 ? styles.goalPillOver :
                          selectedDateTotalCalories < dailyCalories * 0.9 ? styles.goalPillUnder :
                          styles.goalPillOnTarget
                        ]}>
                          <Text style={styles.nutritionEmoji}>🎯</Text>
                          <Text style={styles.nutritionValue}>
                            {Math.round((selectedDateTotalCalories / dailyCalories) * 100)}%
                          </Text>
                        </View>
                        
                        {/* Protein */}
                        <View style={styles.nutritionPill}>
                          <Text style={styles.nutritionEmoji}>💪</Text>
                          <Text style={styles.nutritionValue}>{nutritionStats.protein}g</Text>
                        </View>
                        
                        {/* Fiber */}
                        <View style={styles.nutritionPill}>
                          <Text style={styles.nutritionEmoji}>🌾</Text>
                          <Text style={styles.nutritionValue}>{nutritionStats.fiber}g</Text>
                        </View>
                        
                        {/* Vitamins */}
                        <View style={styles.nutritionPill}>
                          <Text style={styles.nutritionEmoji}>🍎</Text>
                          <Text style={styles.nutritionValue}>{nutritionStats.vitamins}%</Text>
                        </View>
                      </View>
                    </LinearGradient>
                  </View>
                ) : null;
              })()}

              {/* Meals */}
              <View style={styles.mealsContainer}>
                {['breakfast', 'lunch', 'dinner'].map((mealType) => {
                  const meal = selectedMealPlan.meals[mealType as keyof typeof selectedMealPlan.meals]
                  const mealEmojis = {
                    breakfast: '🌅',
                    lunch: '🌞',
                    dinner: '🌙'
                  }
                  
                  return (
                    <View key={mealType} style={styles.mealCard}>
                      <View style={styles.mealHeader}>
                        <Text style={styles.mealEmoji}>
                          {mealEmojis[mealType as keyof typeof mealEmojis]}
                        </Text>
                        <Text style={styles.mealType}>
                          {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
                        </Text>
                        {meal && <Text style={styles.mealTime}>{meal.time}</Text>}
                      </View>
                      
                      {meal ? (
                        <View style={styles.mealDetails}>
                          <Text style={styles.mealName}>{meal.name}</Text>
                          <Text style={styles.mealCalories}>{meal.calories} cal</Text>
                        </View>
                      ) : (
                        <View style={styles.emptyMeal}>
                          <Text style={styles.emptyMealText}>No meal planned</Text>
                          <TouchableOpacity style={styles.addMealButton}>
                            <Text style={styles.addMealText}>+ Add Meal</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  )
                })}
              </View>
            </View>
          )}



          {/* Health Tips */}
          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>💡 Today's Tip</Text>
            <Text style={styles.tipText}>
              Plan your meals in advance to maintain consistent nutrition and save time during busy days.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Goal Update Modal */}
      <Modal
        visible={showGoalUpdate}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <LinearGradient
          colors={['#10B981', '#3B82F6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.goalUpdateHeader}
        >
          <View style={styles.goalUpdateHeaderContent}>
            <Text style={styles.goalUpdateTitle}>Goal Check-In</Text>
            <Text style={styles.goalUpdateSubtitle}>Let's make sure your goals are still aligned</Text>
            <View style={styles.progressIndicator}>
              {goalUpdateSteps.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.progressDot,
                    index <= currentGoalStep ? styles.progressDotActive : styles.progressDotInactive
                  ]}
                />
              ))}
            </View>
          </View>
        </LinearGradient>

        <ScrollView style={styles.goalUpdateContent}>
          <View style={styles.goalUpdateCard}>
            <View style={styles.goalUpdateCardHeader}>
              <View style={styles.goalUpdateIcon}>
                <Text style={styles.goalUpdateIconText}>🎯</Text>
              </View>
              <Text style={styles.goalUpdateStepTitle}>
                {goalUpdateSteps[currentGoalStep].title}
              </Text>
              <Text style={styles.goalUpdateStepSubtitle}>
                {goalUpdateSteps[currentGoalStep].subtitle}
              </Text>
            </View>

            <View style={styles.goalUpdateOptions}>
              {goalUpdateSteps[currentGoalStep].options.map((option, index) => {
                const currentStep = goalUpdateSteps[currentGoalStep]
                const isSelected = currentStep.multiSelect 
                  ? goalUpdateData[currentStep.field as keyof typeof goalUpdateData].includes(option)
                  : goalUpdateData[currentStep.field as keyof typeof goalUpdateData] === option

                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.goalUpdateOption,
                      isSelected && styles.goalUpdateOptionSelected
                    ]}
                    onPress={() => handleGoalUpdateAnswer(currentStep.field, option, currentStep.multiSelect)}
                  >
                    {currentStep.field === 'dietStyle' && (
                      <Text style={styles.goalUpdateOptionIcon}>
                        {getDietStyleIcon(option)}
                      </Text>
                    )}
                    <Text style={[
                      styles.goalUpdateOptionText,
                      isSelected && styles.goalUpdateOptionTextSelected
                    ]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>

            <View style={styles.goalUpdateButtons}>
              <TouchableOpacity
                style={styles.goalUpdateBackButton}
                onPress={handleGoalUpdateBack}
              >
                <Text style={styles.goalUpdateBackButtonText}>
                  {currentGoalStep === 0 ? 'Cancel' : 'Back'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.goalUpdateNextButton}
                onPress={handleGoalUpdateNext}
              >
                <Text style={styles.goalUpdateNextButtonText}>
                  {currentGoalStep === goalUpdateSteps.length - 1 ? 'Save Changes' : 'Next'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </Modal>

      {/* Regenerate Options Modal */}
      <Modal
        visible={showRegenerateOptions}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <LinearGradient
          colors={['#059669', '#10B981', '#34D399']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.regenerateHeader}
        >
          <View style={styles.regenerateHeaderContent}>
            <Text style={styles.regenerateTitle}>Create New Meal Plan</Text>
            <Text style={styles.regenerateSubtitle}>Choose how you'd like to regenerate your weekly meals</Text>
          </View>
        </LinearGradient>

        <ScrollView style={styles.regenerateContent}>
          <View style={styles.regenerateCard}>
            <View style={styles.regenerateCardHeader}>
              <View style={styles.regenerateIcon}>
                <Text style={styles.regenerateIconText}>👨‍🍳</Text>
              </View>
              <Text style={styles.regenerateCardTitle}>
                Meal Plan Options
              </Text>
              <Text style={styles.regenerateCardSubtitle}>
                Select your preferred regeneration method
              </Text>
            </View>

            <View style={styles.regenerateOptions}>
              <TouchableOpacity
                style={styles.regenerateOption}
                onPress={() => {
                  setCurrentRegenerationType('complete');
                  setShowRegenerateOptions(false);
                  setShowCustomMealPlan(true);
                }}
              >
                <View style={styles.regenerateOptionIcon}>
                  <Text style={styles.regenerateOptionIconText}>🔄</Text>
                </View>
                <View style={styles.regenerateOptionContent}>
                  <Text style={styles.regenerateOptionTitle}>Complete Refresh</Text>
                  <Text style={styles.regenerateOptionDescription}>
                    Generate a brand new meal plan for the entire week
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.regenerateOption}
                onPress={() => {
                  setCurrentRegenerationType('partial');
                  setShowRegenerateOptions(false);
                  setShowCustomMealPlan(true);
                }}
              >
                <View style={styles.regenerateOptionIcon}>
                  <Text style={styles.regenerateOptionIconText}>🎯</Text>
                </View>
                <View style={styles.regenerateOptionContent}>
                  <Text style={styles.regenerateOptionTitle}>Smart Refresh</Text>
                  <Text style={styles.regenerateOptionDescription}>
                    Keep today's meals, refresh the rest of the week
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.regenerateOption}
                onPress={() => {
                  setCurrentRegenerationType('balanced');
                  setShowRegenerateOptions(false);
                  setShowCustomMealPlan(true);
                }}
              >
                <View style={styles.regenerateOptionIcon}>
                  <Text style={styles.regenerateOptionIconText}>⚖️</Text>
                </View>
                <View style={styles.regenerateOptionContent}>
                  <Text style={styles.regenerateOptionTitle}>Balanced Refresh</Text>
                  <Text style={styles.regenerateOptionDescription}>
                    Focus on nutrition balance and variety
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.regenerateOption}
                onPress={() => {
                  setCurrentRegenerationType('quick');
                  setShowRegenerateOptions(false);
                  setShowCustomMealPlan(true);
                }}
              >
                <View style={styles.regenerateOptionIcon}>
                  <Text style={styles.regenerateOptionIconText}>⚡</Text>
                </View>
                <View style={styles.regenerateOptionContent}>
                  <Text style={styles.regenerateOptionTitle}>Quick Meals</Text>
                  <Text style={styles.regenerateOptionDescription}>
                    Prioritize fast cooking times and simple recipes
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.regenerateOption}
                onPress={() => {
                  setCurrentRegenerationType('leftovers');
                  setShowRegenerateOptions(false);
                  setShowCustomMealPlan(true);
                }}
              >
                <View style={styles.regenerateOptionIcon}>
                  <Text style={styles.regenerateOptionIconText}>♻️</Text>
                </View>
                <View style={styles.regenerateOptionContent}>
                  <Text style={styles.regenerateOptionTitle}>Optimize with Leftovers</Text>
                  <Text style={styles.regenerateOptionDescription}>
                    Smart meal planning that uses your leftover ingredients
                    {leftovers.length > 0 && ` (${leftovers.length} items available)`}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.regenerateOption}
                onPress={() => {
                  setCurrentRegenerationType('custom');
                  setShowRegenerateOptions(false);
                  setShowCustomMealPlan(true);
                }}
              >
                <View style={styles.regenerateOptionIcon}>
                  <Text style={styles.regenerateOptionIconText}>🎯</Text>
                </View>
                <View style={styles.regenerateOptionContent}>
                  <Text style={styles.regenerateOptionTitle}>Custom Meal Plan</Text>
                  <Text style={styles.regenerateOptionDescription}>
                    Personalize your meal plan with detailed preferences
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.regenerateCancelButton}
              onPress={() => setShowRegenerateOptions(false)}
            >
              <Text style={styles.regenerateCancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Modal>

      {/* Custom Meal Plan Modal */}
      <Modal
        visible={showCustomMealPlan}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <LinearGradient
          colors={['#F0FDF4', '#DBEAFE', '#FAF5FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.customMealPlanContainer}
        >
          <ScrollView style={styles.customMealPlanScrollView} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.customMealPlanHeader}>
              <TouchableOpacity
                style={styles.customMealPlanBackButton}
                onPress={() => setShowCustomMealPlan(false)}
              >
                <Text style={styles.customMealPlanBackButtonText}>←</Text>
              </TouchableOpacity>
              <Text style={styles.customMealPlanTitle}>
                {currentRegenerationType === 'complete' ? 'Complete Refresh' :
                 currentRegenerationType === 'partial' ? 'Smart Refresh' :
                 currentRegenerationType === 'balanced' ? 'Balanced Refresh' :
                 currentRegenerationType === 'quick' ? 'Quick Meals' :
                 currentRegenerationType === 'leftovers' ? 'Leftover Optimization' :
                 'Custom Meal Plan'}
              </Text>
              <View style={styles.customMealPlanHeaderSpacer} />
            </View>

            <View style={styles.customMealPlanContent}>
              {/* Leftover Optimization Toggle - Always show */}
              <View style={styles.customMealPlanSection}>
                <Text style={styles.customMealPlanSectionTitle}>♻️ Leftover Optimization</Text>
                <Text style={styles.customMealPlanSectionDescription}>
                  Reduce food waste and save money by incorporating your leftover ingredients
                </Text>
                <TouchableOpacity
                  style={[
                    styles.customMealPlanToggle,
                    leftoverOptimizationEnabled && styles.customMealPlanToggleActive
                  ]}
                  onPress={() => setLeftoverOptimizationEnabled(!leftoverOptimizationEnabled)}
                >
                  <View style={[
                    styles.customMealPlanToggleCircle,
                    leftoverOptimizationEnabled && styles.customMealPlanToggleCircleActive
                  ]} />
                  <View style={styles.toggleTextContainer}>
                    <Text style={[
                      styles.customMealPlanToggleText,
                      leftoverOptimizationEnabled && styles.customMealPlanToggleTextActive
                    ]}>
                      Leftover Optimization
                    </Text>
                    {leftoverOptimizationEnabled && (
                      <Text style={styles.customMealPlanToggleSubtext}>
                        Est. savings: ${Math.floor(leftovers.length * 3.50 + Math.random() * 15).toFixed(2)}/week
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              </View>

              {/* Daily Cooking Times */}
              <View style={styles.customMealPlanSection}>
                <Text style={styles.customMealPlanSectionTitle}>⏰ Daily Cooking Times</Text>
                {Object.entries(dailyCookingTimes).map(([day, time]) => (
                  <View key={day} style={styles.dailyCookingTimeItem}>
                    <View style={styles.dailyCookingTimeHeader}>
                      <TouchableOpacity 
                        style={[
                          styles.daySelectButton,
                          selectedDays.includes(day) && styles.daySelectButtonActive
                        ]}
                        onPress={() => {
                          if (selectedDays.includes(day)) {
                            setSelectedDays(prev => prev.filter(d => d !== day));
                          } else {
                            setSelectedDays(prev => [...prev, day]);
                          }
                        }}
                      >
                        <Text style={[
                          styles.daySelectButtonText,
                          selectedDays.includes(day) && styles.daySelectButtonTextActive
                        ]}>
                          {day}
                        </Text>
                      </TouchableOpacity>
                      <Text style={styles.dailyCookingTimeValue}>{time} min</Text>
                    </View>
                    {selectedDays.includes(day) && (
                      <View style={styles.dailyCookingTimeSliderWrapper}>
                        <Text style={styles.dailyCookingTimeMinLabel}>10</Text>
                        <View style={styles.sliderWithMarks}>
                          <Slider
                            style={styles.slider}
                            value={time}
                            onValueChange={(value) => {
                              // Snap to nearest 10-minute increment
                              const snappedValue = Math.round(value / 10) * 10;
                              setDailyCookingTimes(prev => ({ ...prev, [day]: snappedValue }));
                            }}
                            minimumValue={10}
                            maximumValue={90}
                            step={10}
                            minimumTrackTintColor="#10B981"
                            maximumTrackTintColor="#E5E7EB"
                            thumbTintColor="#10B981"
                          />
                          <View style={styles.sliderMarks}>
                            {[20, 30, 40, 50, 60, 70, 80].map((mark) => (
                              <View 
                                key={mark} 
                                style={[
                                  styles.sliderMark, 
                                  { left: `${((mark - 10) / 80) * 100}%` }
                                ]} 
                              />
                            ))}
                          </View>
                        </View>
                        <Text style={styles.dailyCookingTimeMaxLabel}>90</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>

              {/* Healthiness Level - Only show for custom */}
              {currentRegenerationType === 'custom' && (
                <View style={styles.customMealPlanSection}>
                  <Text style={styles.customMealPlanSectionTitle}>💪 Healthiness Level</Text>
                  <Text style={styles.customMealPlanSectionDescription}>
                    From super healthy to allowing some indulgent treats
                  </Text>
                  <View style={styles.sliderContainer}>
                    <Text style={styles.sliderLabel}>Super Healthy</Text>
                    <Slider
                      style={styles.customSlider}
                      value={healthinessLevel}
                      onValueChange={setHealthinessLevel}
                      minimumValue={0}
                      maximumValue={100}
                      minimumTrackTintColor="#10B981"
                      maximumTrackTintColor="#E5E7EB"
                      thumbTintColor="#10B981"
                    />
                    <Text style={styles.sliderLabel}>Few Extras</Text>
                  </View>
                  <Text style={styles.sliderValue}>
                    {healthinessLevel <= 25 ? 'Super Healthy' :
                     healthinessLevel <= 50 ? 'Mostly Healthy' :
                     healthinessLevel <= 75 ? 'Balanced' : 'Some Indulgences'}
                  </Text>
                  {userData?.healthGoals && (
                    <View style={styles.goalComparisonContainer}>
                      <Text style={styles.goalComparisonText}>
                        📊 Alignment with your goals: {
                          userData.healthGoals.includes('Lose Weight') && healthinessLevel <= 50 ? 'Excellent' :
                          userData.healthGoals.includes('Build Muscle') && healthinessLevel >= 50 ? 'Good' :
                          'Moderate'
                        }
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* Veggies & Meat Ratio - Only show for custom */}
              {currentRegenerationType === 'custom' && (
                <View style={styles.customMealPlanSection}>
                  <Text style={styles.customMealPlanSectionTitle}>🥗 Veggies & Meat Balance</Text>
                  <Text style={styles.customMealPlanSectionDescription}>
                    Choose your preferred balance of vegetables and meat
                  </Text>
                  <View style={styles.sliderContainer}>
                    <Text style={styles.sliderLabel}>More Veggies</Text>
                    <Slider
                      style={styles.customSlider}
                      value={veggiesMeatRatio}
                      onValueChange={setVeggiesMeatRatio}
                      minimumValue={0}
                      maximumValue={100}
                      minimumTrackTintColor="#10B981"
                      maximumTrackTintColor="#E5E7EB"
                      thumbTintColor="#10B981"
                    />
                    <Text style={styles.sliderLabel}>More Meat</Text>
                  </View>
                  <Text style={styles.sliderValue}>
                    {veggiesMeatRatio <= 25 ? 'Mostly Vegetables' :
                     veggiesMeatRatio <= 50 ? 'Balanced' :
                     veggiesMeatRatio <= 75 ? 'Meat & Veggies' : 'Meat Focus'}
                  </Text>
                  {userData?.dietStyle && (
                    <View style={styles.goalComparisonContainer}>
                      <Text style={styles.goalComparisonText}>
                        📊 Matches your diet style: {
                          userData.dietStyle.includes('Vegetarian') && veggiesMeatRatio <= 25 ? 'Perfect' :
                          userData.dietStyle.includes('Vegan') && veggiesMeatRatio <= 25 ? 'Perfect' :
                          userData.dietStyle.includes('Balanced') && veggiesMeatRatio >= 40 && veggiesMeatRatio <= 60 ? 'Excellent' :
                          'Good'
                        }
                      </Text>
                    </View>
                  )}
                </View>
              )}


              {/* Generate Button */}
              <TouchableOpacity
                style={styles.customMealPlanGenerateButton}
                onPress={() => {
                  setShowCustomMealPlan(false);
                  generateWeeklyMeals(currentRegenerationType);
                }}
              >
                <Text style={styles.customMealPlanGenerateButtonText}>
                  Generate {currentRegenerationType === 'complete' ? 'Complete' :
                           currentRegenerationType === 'partial' ? 'Smart' :
                           currentRegenerationType === 'balanced' ? 'Balanced' :
                           currentRegenerationType === 'quick' ? 'Quick' :
                           currentRegenerationType === 'leftovers' ? 'Leftover' :
                           'Custom'} Plan
                </Text>
                <Text style={styles.customMealPlanGenerateButtonIcon}>✨</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </LinearGradient>
      </Modal>

      {/* Meal Logging Modal */}
      <Modal
        visible={showMealLogging}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <LinearGradient
          colors={['#F0FDF4', '#DBEAFE', '#FAF5FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.mealLoggingContainer}
        >
          <ScrollView style={styles.mealLoggingScrollView} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.mealLoggingHeader}>
              <TouchableOpacity
                style={styles.mealLoggingBackButton}
                onPress={() => {
                  setShowMealLogging(false);
                  setMealLogText('');
                  setMealSuggestions([]);
                }}
              >
                <Text style={styles.mealLoggingBackButtonText}>←</Text>
              </TouchableOpacity>
              <Text style={styles.mealLoggingTitle}>Log Your Meal</Text>
              <View style={styles.mealLoggingHeaderSpacer} />
            </View>

            <View style={styles.mealLoggingContent}>
              {/* Meal Type Selection */}
              <View style={styles.mealTypeSection}>
                <Text style={styles.mealTypeSectionTitle}>Meal Type</Text>
                <View style={styles.mealTypeButtons}>
                  {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.mealTypeButton,
                        selectedMealType === type && styles.mealTypeButtonSelected
                      ]}
                      onPress={() => setSelectedMealType(type)}
                    >
                      <Text style={styles.mealTypeEmoji}>
                        {type === 'breakfast' ? '🌅' :
                         type === 'lunch' ? '🌞' :
                         type === 'dinner' ? '🌙' : '🍪'}
                      </Text>
                      <Text style={[
                        styles.mealTypeButtonText,
                        selectedMealType === type && styles.mealTypeButtonTextSelected
                      ]}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Input Methods */}
              <View style={styles.inputMethodsSection}>
                <Text style={styles.inputMethodsSectionTitle}>How would you like to log your meal?</Text>
                
                {/* Text Input */}
                <View style={styles.inputMethodCard}>
                  <View style={styles.inputMethodHeader}>
                    <Text style={styles.inputMethodIcon}>✍️</Text>
                    <Text style={styles.inputMethodTitle}>Type Your Meal</Text>
                  </View>
                  <TextInput
                    style={styles.mealTextInput}
                    value={mealLogText}
                    onChangeText={(text) => {
                      setMealLogText(text);
                      generateMealSuggestions(text);
                    }}
                    placeholder="e.g., Grilled chicken with rice and vegetables"
                    placeholderTextColor="#9CA3AF"
                    multiline
                  />
                  
                  {/* Suggestions */}
                  {mealSuggestions.length > 0 && (
                    <View style={styles.suggestionsContainer}>
                      <Text style={styles.suggestionsTitle}>Quick suggestions:</Text>
                      <View style={styles.suggestionsList}>
                        {mealSuggestions.map((suggestion, index) => (
                          <TouchableOpacity
                            key={index}
                            style={styles.suggestionItem}
                            onPress={() => setMealLogText(suggestion)}
                          >
                            <Text style={styles.suggestionText}>{suggestion}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}
                </View>

                {/* Voice Recording */}
                <TouchableOpacity 
                  style={[
                    styles.inputMethodCard,
                    isRecording && styles.inputMethodCardActive
                  ]}
                  onPress={() => {
                    if (isRecording) {
                      stopVoiceRecording();
                    } else {
                      startVoiceRecording();
                    }
                  }}
                >
                  <View style={styles.inputMethodHeader}>
                    <Text style={styles.inputMethodIcon}>🎤</Text>
                    <Text style={styles.inputMethodTitle}>Voice Recording</Text>
                  </View>
                  <Text style={styles.inputMethodDescription}>
                    {isRecording ? 'Recording... Tap to stop' : 'Tap to describe your meal with voice'}
                  </Text>
                  {isRecording && (
                    <View style={styles.recordingIndicator}>
                      <View style={styles.recordingDot} />
                      <Text style={styles.recordingText}>Recording</Text>
                    </View>
                  )}
                </TouchableOpacity>

                {/* Photo Upload */}
                <TouchableOpacity 
                  style={styles.inputMethodCard}
                  onPress={takeMealPhoto}
                >
                  <View style={styles.inputMethodHeader}>
                    <Text style={styles.inputMethodIcon}>📸</Text>
                    <Text style={styles.inputMethodTitle}>Take a Photo</Text>
                  </View>
                  <Text style={styles.inputMethodDescription}>
                    Snap a picture of your meal for automatic recognition
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Save Button */}
              <TouchableOpacity
                style={[
                  styles.saveMealButton,
                  !mealLogText && styles.saveMealButtonDisabled
                ]}
                onPress={saveMealLog}
                disabled={!mealLogText}
              >
                <Text style={styles.saveMealButtonText}>Save Meal</Text>
                <Text style={styles.saveMealButtonIcon}>✅</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </LinearGradient>
      </Modal>

      {/* Loading Screen Modal */}
      <Modal
        visible={isRegenerating}
        animationType="fade"
        presentationStyle="overFullScreen"
      >
        <View style={styles.loadingContainer}>
          <LinearGradient
            colors={['#F0FDF4', '#DCFCE7', '#BBF7D0']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.loadingBackground}
          >
            <View style={styles.loadingContent}>
              <View style={styles.loadingIconContainer}>
                <Text style={styles.loadingIcon}>👨‍🍳</Text>
              </View>
              
              <Text style={styles.loadingTitle}>Creating Your Meal Plan</Text>
              <Text style={styles.loadingSubtitle}>
                Our AI chef is crafting personalized meals just for you...
              </Text>

              <View style={styles.progressContainer}>
                <View style={styles.progressTrack}>
                  <View 
                    style={[
                      styles.progressBar,
                      { width: `${regenerationProgress}%` }
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>{Math.round(regenerationProgress)}%</Text>
              </View>

              <View style={styles.loadingSteps}>
                {isRegenerating && regenerationProgress > 0 && (
                  <>
                    <View style={styles.loadingStep}>
                      <Text style={styles.loadingStepIcon}>🧠</Text>
                      <Text style={styles.loadingStepText}>Analyzing your preferences</Text>
                    </View>
                    {currentRegenerationType === 'leftovers' ? (
                      <>
                        <View style={styles.loadingStep}>
                          <Text style={styles.loadingStepIcon}>♻️</Text>
                          <Text style={styles.loadingStepText}>Scanning for leftover ingredients</Text>
                        </View>
                        <View style={styles.loadingStep}>
                          <Text style={styles.loadingStepIcon}>🥗</Text>
                          <Text style={styles.loadingStepText}>Creating leftover-friendly recipes</Text>
                        </View>
                        <View style={styles.loadingStep}>
                          <Text style={styles.loadingStepIcon}>⚖️</Text>
                          <Text style={styles.loadingStepText}>Balancing nutrition & reducing waste</Text>
                        </View>
                        <View style={styles.loadingStep}>
                          <Text style={styles.loadingStepIcon}>✨</Text>
                          <Text style={styles.loadingStepText}>Optimizing your eco-friendly meal plan</Text>
                        </View>
                      </>
                    ) : (
                      <>
                        <View style={styles.loadingStep}>
                          <Text style={styles.loadingStepIcon}>🥗</Text>
                          <Text style={styles.loadingStepText}>Selecting fresh ingredients</Text>
                        </View>
                        <View style={styles.loadingStep}>
                          <Text style={styles.loadingStepIcon}>⚖️</Text>
                          <Text style={styles.loadingStepText}>Balancing nutrition</Text>
                        </View>
                        <View style={styles.loadingStep}>
                          <Text style={styles.loadingStepIcon}>✨</Text>
                          <Text style={styles.loadingStepText}>Adding the perfect touch</Text>
                        </View>
                      </>
                    )}
                  </>
                )}
              </View>
            </View>
          </LinearGradient>
        </View>
      </Modal>
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
    padding: 24,
    paddingTop: 48,
  },
  header: {
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wellnessLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#22C55E',
  },
  wellnessLogoIcon: {
    fontSize: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    fontFamily: 'System',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'System',
  },
  nutritionPlanContainer: {
    backgroundColor: 'rgba(34, 197, 94, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#22C55E',
    position: 'relative',
  },
  settingsWheel: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
    zIndex: 10,
  },
  settingsWheelIcon: {
    fontSize: 16,
  },
  objectivesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  objectiveCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  objectiveEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  objectiveLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 4,
    textAlign: 'center',
  },
  objectiveValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    textAlign: 'center',
  },
  bmiValueContainer: {
    alignItems: 'center',
  },
  bmiColorIndicator: {
    width: 12,
    height: 4,
    borderRadius: 2,
    marginTop: 4,
  },
  bmiGreen: {
    backgroundColor: '#22C55E',
  },
  bmiYellow: {
    backgroundColor: '#F59E0B',
  },
  bmiRed: {
    backgroundColor: '#EF4444',
  },
  bmiBlue: {
    backgroundColor: '#3B82F6',
  },
  cookingTimeContainer: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginBottom: 8,
  },
  cookingModeIcons: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
    gap: 20,
  },
  cookingModeIcon: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    width: 44,
    height: 44,
    justifyContent: 'center',
  },
  cookingModeIconActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    transform: [{ scale: 1.1 }],
  },
  cookingModeEmoji: {
    fontSize: 22,
  },
  timeBarContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  timeBar: {
    position: 'relative',
    width: '100%',
    height: 24,
    marginBottom: 6,
  },
  timeBarLabel: {
    position: 'absolute',
    top: -18,
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: -8,
  },
  timeBarTrack: {
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
  },
  timeBarIndicator: {
    position: 'absolute',
    top: 6,
    width: 12,
    height: 12,
    backgroundColor: '#22C55E',
    borderRadius: 6,
    marginLeft: -6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  currentTimeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
    textAlign: 'center',
  },
  caloriesCard: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  caloriesTitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  caloriesAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  caloriesSubtext: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  weekContainer: {
    marginBottom: 24,
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  weekTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  regenerateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#22C55E',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    gap: 6,
  },
  regenerateButtonIcon: {
    fontSize: 16,
  },
  regenerateButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  weekScroll: {
    marginHorizontal: -8,
  },
  weekLabelContainer: {
    position: 'absolute',
    top: -20,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  weekLabelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  dayCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
    alignItems: 'center',
    minWidth: 60,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedDayCard: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  todayCard: {
    borderColor: '#10B981',
    borderWidth: 2,
  },
  dayLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  selectedDayLabel: {
    color: '#FFFFFF',
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  selectedDayNumber: {
    color: '#FFFFFF',
  },
  todayNumber: {
    color: '#10B981',
    fontWeight: '700',
  },
  todayLabel: {
    fontSize: 10,
    color: '#10B981',
    fontWeight: '600',
    marginTop: 2,
  },
  generateButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  generateButtonIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  selectedDayContainer: {
    marginBottom: 24,
  },
  selectedDayTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  compactNutritionCard: {
    borderRadius: 16,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 16,
  },
  nutritionCardGradient: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  singleLineNutritionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  nutritionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  goalPill: {
    borderWidth: 1.5,
  },
  goalPillOnTarget: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: '#10B981',
  },
  goalPillOver: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: '#DC2626',
  },
  goalPillUnder: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: '#F59E0B',
  },
  nutritionEmoji: {
    fontSize: 10,
    marginRight: 3,
  },
  nutritionValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1F2937',
  },
  overGoal: {
    color: '#DC2626',
  },
  underGoal: {
    color: '#F59E0B',
  },
  onTarget: {
    color: '#10B981',
  },
  mealsContainer: {
    gap: 12,
  },
  mealCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  mealEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  mealType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  mealTime: {
    fontSize: 14,
    color: '#6B7280',
  },
  mealDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mealName: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  mealCalories: {
    fontSize: 14,
    fontWeight: '500',
    color: '#059669',
  },
  emptyMeal: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  emptyMealText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  addMealButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  addMealText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  tipsContainer: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#22C55E',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  goalUpdateHeader: {
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: 24,
  },
  goalUpdateHeaderContent: {
    alignItems: 'center',
  },
  goalUpdateTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  goalUpdateSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 24,
  },
  progressIndicator: {
    flexDirection: 'row',
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  progressDotActive: {
    backgroundColor: '#FFFFFF',
  },
  progressDotInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  goalUpdateContent: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    marginTop: -16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  goalUpdateCard: {
    backgroundColor: '#FFFFFF',
    margin: 24,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  goalUpdateCardHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  goalUpdateIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#10B981',
  },
  goalUpdateIconText: {
    fontSize: 32,
  },
  goalUpdateStepTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  goalUpdateStepSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  goalUpdateOptions: {
    gap: 12,
    marginBottom: 32,
  },
  goalUpdateOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  goalUpdateOptionSelected: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  goalUpdateOptionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  goalUpdateOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    flex: 1,
  },
  goalUpdateOptionTextSelected: {
    color: '#059669',
    fontWeight: '600',
  },
  goalUpdateButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  goalUpdateBackButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
  },
  goalUpdateBackButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  goalUpdateNextButton: {
    flex: 2,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#10B981',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  goalUpdateNextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Regenerate Options Styles
  regenerateHeader: {
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: 24,
  },
  regenerateHeaderContent: {
    alignItems: 'center',
  },
  regenerateTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  regenerateSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  regenerateContent: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    marginTop: -16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  regenerateCard: {
    backgroundColor: '#FFFFFF',
    margin: 24,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  regenerateCardHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  regenerateIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#059669',
  },
  regenerateIconText: {
    fontSize: 32,
  },
  regenerateCardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  regenerateCardSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  regenerateOptions: {
    gap: 16,
    marginBottom: 24,
  },
  regenerateOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  regenerateOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  regenerateOptionIconText: {
    fontSize: 20,
  },
  regenerateOptionContent: {
    flex: 1,
  },
  regenerateOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  regenerateOptionDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 18,
  },
  regenerateCancelButton: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
  },
  regenerateCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  // Calories Overview Styles
  caloriesOverviewContainer: {
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  caloriesCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 246, 255, 0.8)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    gap: 12,
  },
  caloriesIcon: {
    fontSize: 24,
  },
  caloriesTextContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  currentCaloriesText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  caloriesDivider: {
    fontSize: 20,
    color: '#9CA3AF',
    fontWeight: '400',
  },
  dailyCaloriesText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#6B7280',
  },
  // Week Navigation Styles
  weekArrowButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  weekArrowText: {
    fontSize: 20,
    color: '#374151',
    fontWeight: '600',
  },
  todayButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    marginLeft: 8,
  },
  todayButtonIcon: {
    fontSize: 16,
  },
  // Leftover Optimization Box Styles
  leftoverOptimizationBox: {
    marginTop: 24,
    marginBottom: 24,
    marginHorizontal: 0,
  },
  leftoverOptimizationGradient: {
    borderRadius: 20,
    padding: 20,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  leftoverOptimizationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftoverOptimizationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  leftoverOptimizationIcon: {
    fontSize: 28,
    marginRight: 16,
  },
  leftoverOptimizationTextContainer: {
    flex: 1,
  },
  leftoverOptimizationTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  leftoverOptimizationSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  leftoverOptimizationButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  leftoverOptimizationButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Loading Screen Styles
  loadingContainer: {
    flex: 1,
  },
  loadingBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
    paddingHorizontal: 32,
    maxWidth: 350,
  },
  loadingIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  loadingIcon: {
    fontSize: 48,
  },
  loadingTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  loadingSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 40,
  },
  progressTrack: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#059669',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  loadingSteps: {
    width: '100%',
    gap: 16,
  },
  loadingStep: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  loadingStepIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  loadingStepText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    flex: 1,
  },
  // Custom Meal Plan Styles
  customMealPlanContainer: {
    flex: 1,
  },
  customMealPlanScrollView: {
    flex: 1,
  },
  customMealPlanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  customMealPlanBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customMealPlanBackButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
  },
  customMealPlanTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    flex: 1,
  },
  customMealPlanHeaderSpacer: {
    width: 40,
  },
  customMealPlanContent: {
    padding: 24,
  },
  customMealPlanSection: {
    marginBottom: 32,
  },
  customMealPlanSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  customMealPlanSectionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  customMealPlanToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  customMealPlanToggleActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: '#10B981',
  },
  customMealPlanToggleCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#D1D5DB',
    marginRight: 12,
  },
  customMealPlanToggleCircleActive: {
    backgroundColor: '#10B981',
  },
  customMealPlanToggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  customMealPlanToggleTextActive: {
    color: '#059669',
  },
  dailyCookingTimeItem: {
    marginBottom: 20,
  },
  dailyCookingTimeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dailyCookingTimeDayLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  dailyCookingTimeValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10B981',
  },
  dailyCookingTimeSliderWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dailyCookingTimeMinLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
    minWidth: 20,
  },
  dailyCookingTimeMaxLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
    minWidth: 20,
  },
  dailyCookingTimeSlider: {
    flex: 1,
    height: 8,
    position: 'relative',
    justifyContent: 'center',
  },
  dailyCookingTimeTrack: {
    position: 'absolute',
    height: 8,
    width: '100%',
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
  dailyCookingTimeProgress: {
    position: 'absolute',
    height: 8,
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  dailyCookingTimeThumb: {
    position: 'absolute',
    width: 24,
    height: 24,
    backgroundColor: '#10B981',
    borderRadius: 12,
    marginLeft: -12,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  daySelectButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    minWidth: 100,
  },
  daySelectButtonActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: '#10B981',
  },
  daySelectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  daySelectButtonTextActive: {
    color: '#059669',
  },
  slider: {
    flex: 1,
    height: 40,
  },
  customSlider: {
    flex: 1,
    height: 40,
  },
  sliderWithMarks: {
    flex: 1,
    position: 'relative',
  },
  sliderMarks: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 40,
    pointerEvents: 'none',
  },
  sliderMark: {
    position: 'absolute',
    width: 1,
    height: 8,
    backgroundColor: '#D1D5DB',
    top: 16,
  },
  toggleTextContainer: {
    flex: 1,
  },
  customMealPlanToggleSubtext: {
    fontSize: 12,
    color: '#059669',
    marginTop: 2,
    fontWeight: '500',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  sliderLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    minWidth: 80,
  },
  slider: {
    flex: 1,
    height: 40,
    position: 'relative',
    justifyContent: 'center',
  },
  sliderTrack: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
  },
  sliderThumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    backgroundColor: '#10B981',
    borderRadius: 10,
    marginLeft: -10,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  sliderValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
    textAlign: 'center',
    marginTop: 8,
  },
  daySelectionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  dayToggleButton: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  dayToggleButtonSelected: {
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    borderColor: '#10B981',
  },
  dayToggleCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayToggleCircleSelected: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  dayToggleCheck: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  dayToggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    flex: 1,
  },
  dayToggleTextSelected: {
    color: '#059669',
  },
  customMealPlanGenerateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    marginTop: 24,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    gap: 8,
  },
  customMealPlanGenerateButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  customMealPlanGenerateButtonIcon: {
    fontSize: 20,
  },
  // Log Meal Button Styles
  logMealButton: {
    borderRadius: 16,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    transform: [{ scale: 1 }],
  },
  logMealButtonGradient: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  logMealButtonContent: {
    alignItems: 'center',
    gap: 2,
  },
  logMealButtonIconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logMealButtonIcon: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  logMealButtonSparkle: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  logMealButtonSparkleText: {
    fontSize: 10,
  },
  logMealButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  logMealButtonSubtext: {
    fontSize: 9,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  // Meal Logging Modal Styles
  mealLoggingContainer: {
    flex: 1,
  },
  mealLoggingScrollView: {
    flex: 1,
  },
  mealLoggingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  mealLoggingBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealLoggingBackButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
  },
  mealLoggingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    flex: 1,
  },
  mealLoggingHeaderSpacer: {
    width: 40,
  },
  mealLoggingContent: {
    padding: 24,
  },
  mealTypeSection: {
    marginBottom: 24,
  },
  mealTypeSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  mealTypeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  mealTypeButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  mealTypeButtonSelected: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: '#10B981',
  },
  mealTypeEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  mealTypeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  mealTypeButtonTextSelected: {
    color: '#059669',
  },
  inputMethodsSection: {
    marginBottom: 24,
  },
  inputMethodsSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  inputMethodCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputMethodCardActive: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.02)',
  },
  inputMethodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  inputMethodIcon: {
    fontSize: 20,
  },
  inputMethodTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  inputMethodDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  mealTextInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  suggestionsContainer: {
    marginTop: 12,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  suggestionsList: {
    gap: 6,
  },
  suggestionItem: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  suggestionText: {
    fontSize: 14,
    color: '#5B21B6',
    fontWeight: '500',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  recordingText: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '600',
  },
  saveMealButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    gap: 8,
  },
  saveMealButtonDisabled: {
    backgroundColor: '#D1D5DB',
    shadowOpacity: 0,
  },
  saveMealButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  saveMealButtonIcon: {
    fontSize: 18,
  },
  moneySavedContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  moneySavedText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 4,
  },
  moneySavedSubtext: {
    fontSize: 12,
    color: '#6B7280',
  },
  goalComparisonContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  goalComparisonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E40AF',
  },
})