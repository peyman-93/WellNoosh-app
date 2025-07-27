import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Modal, TextInput } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import AsyncStorage from '@react-native-async-storage/async-storage'
import RecipeDetailScreen from '@/screens/RecipeDetailScreen'

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

interface MealCompletionItem {
  mealName: string
  date: string
  portions: {
    consumed: number
    leftover: number
    total: number
  }
  leftovers: LeftoverItem[]
}

export default function FridgeScreen() {
  const [leftovers, setLeftovers] = useState<LeftoverItem[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showMealCompletionModal, setShowMealCompletionModal] = useState(false)
  const [showRecipeDetail, setShowRecipeDetail] = useState(false)
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null)
  const [showRecipeGeneratorModal, setShowRecipeGeneratorModal] = useState(false)
  const [showCookingPreferencesModal, setShowCookingPreferencesModal] = useState(false)
  const [newLeftover, setNewLeftover] = useState({
    name: '',
    quantity: '',
    category: 'other' as LeftoverItem['category'],
    expiryDays: 3
  })
  const [isRecording, setIsRecording] = useState(false)
  const [recordedAudio, setRecordedAudio] = useState<string | null>(null)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [currentMeal, setCurrentMeal] = useState<MealCompletionItem | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<'all' | LeftoverItem['category']>('all')
  const [selectedLeftovers, setSelectedLeftovers] = useState<string[]>([])
  const [isGeneratingRecipe, setIsGeneratingRecipe] = useState(false)
  const [generatedRecipe, setGeneratedRecipe] = useState<any>(null)
  const [recipeGenerationProgress, setRecipeGenerationProgress] = useState(0)
  const [cookingPreferences, setCookingPreferences] = useState({
    timePreference: 'medium' as 'short' | 'medium' | 'long',
    healthFocus: 'balanced' as 'healthy' | 'balanced' | 'delicious',
    difficulty: 'easy' as 'easy' | 'medium' | 'challenging'
  })
  const [userRatings, setUserRatings] = useState<{[key: string]: number}>({})

  useEffect(() => {
    loadLeftovers()
  }, [])

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

  const saveLeftovers = async (items: LeftoverItem[]) => {
    try {
      await AsyncStorage.setItem('leftovers', JSON.stringify(items))
    } catch (error) {
      console.error('Error saving leftovers:', error)
    }
  }

  const simulateCompletedMeal = () => {
    // Simulate a meal completion notification
    setTimeout(() => {
      const mockMeal: MealCompletionItem = {
        mealName: "Herb-Crusted Salmon",
        date: new Date().toISOString().split('T')[0],
        portions: {
          consumed: 3,
          leftover: 1,
          total: 4
        },
        leftovers: [
          {
            id: `leftover-${Date.now()}`,
            name: "Roasted vegetables",
            addedDate: new Date().toISOString(),
            quantity: "1 portion",
            category: 'vegetables',
            status: 'fresh'
          }
        ]
      }
      setCurrentMeal(mockMeal)
      setShowMealCompletionModal(true)
    }, 2000)
  }

  const getCategoryIcon = (category: LeftoverItem['category']) => {
    const icons = {
      vegetables: '🥕',
      proteins: '🍖',
      grains: '🌾',
      dairy: '🥛',
      condiments: '🍯',
      other: '🍽️'
    }
    return icons[category]
  }

  const getCategoryColor = (category: LeftoverItem['category']) => {
    const colors = {
      vegetables: '#22C55E',
      proteins: '#EF4444',
      grains: '#F59E0B',
      dairy: '#3B82F6',
      condiments: '#8B5CF6',
      other: '#6B7280'
    }
    return colors[category]
  }

  const getStatusColor = (status: LeftoverItem['status']) => {
    const colors = {
      fresh: '#22C55E',
      expiring: '#F59E0B',
      expired: '#EF4444'
    }
    return colors[status]
  }

  const getStatusIcon = (status: LeftoverItem['status']) => {
    const icons = {
      fresh: '✨',
      expiring: '⚠️',
      expired: '🚫'
    }
    return icons[status]
  }

  // Voice recording functions
  const startRecording = async () => {
    setIsRecording(true)
    setRecordingDuration(0)
    
    // Simulate recording duration counter
    const interval = setInterval(() => {
      setRecordingDuration(prev => prev + 1)
    }, 1000)
    
    // Store interval reference for cleanup
    setTimeout(() => {
      clearInterval(interval)
    }, 30000) // Max 30 seconds
  }
  
  const stopRecording = () => {
    setIsRecording(false)
    // Simulate recorded audio file
    setRecordedAudio(`voice-note-${Date.now()}.m4a`)
    Alert.alert(
      'Voice Note Recorded! 🎤', 
      `Recorded ${recordingDuration} seconds of audio. You can transcribe it or save as is.`,
      [
        { text: 'Transcribe to Text', onPress: transcribeAudio },
        { text: 'Keep as Voice Note', onPress: () => {} }
      ]
    )
  }
  
  const transcribeAudio = () => {
    // Simulate transcription - in real app, this would call a speech-to-text service
    const mockTranscriptions = [
      "leftover chicken from dinner, about 2 portions",
      "half a bowl of rice from lunch",
      "some vegetables from yesterday's stir fry",
      "pasta with tomato sauce, 1 serving",
      "grilled salmon, one piece"
    ]
    const transcribed = mockTranscriptions[Math.floor(Math.random() * mockTranscriptions.length)]
    
    // Parse the transcription to fill the form
    setNewLeftover(prev => ({
      ...prev,
      name: transcribed
    }))
    
    Alert.alert('Voice Transcribed! ✨', `"${transcribed}" has been added to the item name.`)
    setRecordedAudio(null)
  }
  
  const deleteRecording = () => {
    setRecordedAudio(null)
    setRecordingDuration(0)
  }

  const addLeftover = () => {
    if (!newLeftover.name.trim()) return

    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + newLeftover.expiryDays)

    const leftover: LeftoverItem = {
      id: `leftover-${Date.now()}`,
      name: newLeftover.name,
      addedDate: new Date().toISOString(),
      quantity: newLeftover.quantity,
      expiryDate: expiryDate.toISOString(),
      category: newLeftover.category,
      status: 'fresh'
    }

    const updatedLeftovers = [...leftovers, leftover]
    setLeftovers(updatedLeftovers)
    saveLeftovers(updatedLeftovers)

    setNewLeftover({ name: '', quantity: '', category: 'other', expiryDays: 3 })
    setShowAddModal(false)
  }

  const removeLeftover = (id: string) => {
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this leftover?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const updatedLeftovers = leftovers.filter(item => item.id !== id)
            setLeftovers(updatedLeftovers)
            saveLeftovers(updatedLeftovers)
          }
        }
      ]
    )
  }

  const confirmMealCompletion = () => {
    if (currentMeal) {
      const updatedLeftovers = [...leftovers, ...currentMeal.leftovers]
      setLeftovers(updatedLeftovers)
      saveLeftovers(updatedLeftovers)
    }
    setShowMealCompletionModal(false)
    setCurrentMeal(null)
  }

  const toggleLeftoverSelection = (leftoverId: string) => {
    setSelectedLeftovers(prev => 
      prev.includes(leftoverId) 
        ? prev.filter(id => id !== leftoverId)
        : [...prev, leftoverId]
    )
  }

  const generateRecipeFromLeftovers = () => {
    if (selectedLeftovers.length === 0) return
    setShowCookingPreferencesModal(true)
  }

  const startRecipeGeneration = () => {
    setShowCookingPreferencesModal(false)
    setIsGeneratingRecipe(true)
    setRecipeGenerationProgress(0)
    setShowRecipeGeneratorModal(true)

    // Progress animation
    const progressInterval = setInterval(() => {
      setRecipeGenerationProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          return 100
        }
        return prev + 10 // 10% every 100ms = 1 second total
      })
    }, 100)

    // Generate recipe after 1.5 seconds
    setTimeout(() => {
      const selectedItems = leftovers.filter(item => selectedLeftovers.includes(item.id))
      const recipe = createRecipeFromLeftovers(selectedItems)
      setSelectedRecipe(recipe)
      setIsGeneratingRecipe(false)
      setRecipeGenerationProgress(0)
      setShowRecipeGeneratorModal(false)
      setShowRecipeDetail(true)
      clearSelection()
    }, 1500)
  }

  const handleStartCooking = () => {
    // This will trigger the meal completion screen after cooking
    setShowRecipeDetail(false)
    setSelectedRecipe(null)
    
    // Simulate cooking completion and show meal completion modal
    setTimeout(() => {
      const mockMeal: MealCompletionItem = {
        mealName: selectedRecipe?.name || "Your Recipe",
        date: new Date().toISOString().split('T')[0],
        portions: {
          consumed: selectedRecipe?.baseServings - 1 || 3,
          leftover: 1,
          total: selectedRecipe?.baseServings || 4
        },
        leftovers: [
          {
            id: `leftover-${Date.now()}`,
            name: `${selectedRecipe?.name} leftovers`,
            addedDate: new Date().toISOString(),
            quantity: "1 portion",
            category: 'other',
            status: 'fresh'
          }
        ]
      }
      setCurrentMeal(mockMeal)
      setShowMealCompletionModal(true)
    }, 1000)
  }

  const handleAddToGroceryList = (ingredient: any) => {
    console.log('Adding to grocery list:', ingredient)
    Alert.alert('Added to Grocery List', `${ingredient.name} has been added to your grocery list.`)
  }

  const createRecipeFromLeftovers = (items: LeftoverItem[]) => {
    // Create a recipe based on selected leftovers and preferences
    const mainIngredients = items.map(item => item.name).join(', ')
    const categories = [...new Set(items.map(item => item.category))]
    
    let recipeName = ''
    let cookingMethod = ''
    let additionalIngredients: string[] = []

    // Determine recipe type based on categories and preferences
    const { timePreference, healthFocus, difficulty } = cookingPreferences

    if (categories.includes('proteins') && categories.includes('vegetables')) {
      if (timePreference === 'short') {
        recipeName = `Quick ${mainIngredients} Scramble`
        cookingMethod = 'quick-sauté'
        additionalIngredients = healthFocus === 'healthy' 
          ? ['olive oil', 'herbs', 'lemon', 'salt & pepper']
          : ['butter', 'garlic', 'cream', 'cheese']
      } else if (timePreference === 'long') {
        recipeName = `Slow-Cooked ${mainIngredients} Stew`
        cookingMethod = 'slow-cook'
        additionalIngredients = healthFocus === 'healthy'
          ? ['vegetable broth', 'tomatoes', 'herbs', 'onion']
          : ['wine', 'butter', 'cream', 'bacon']
      } else {
        recipeName = `${mainIngredients} Stir-Fry`
        cookingMethod = 'stir-fry'
        additionalIngredients = healthFocus === 'healthy'
          ? ['ginger', 'garlic', 'low-sodium soy sauce', 'sesame oil']
          : ['garlic', 'soy sauce', 'oyster sauce', 'sesame oil']
      }
    } else if (categories.includes('grains') && categories.includes('vegetables')) {
      if (timePreference === 'short') {
        recipeName = `Quick ${mainIngredients} Bowl`
        cookingMethod = 'assembly'
        additionalIngredients = healthFocus === 'healthy'
          ? ['lemon juice', 'olive oil', 'herbs', 'seeds']
          : ['dressing', 'cheese', 'nuts', 'dried fruit']
      } else {
        recipeName = `Baked ${mainIngredients} Casserole`
        cookingMethod = 'bake'
        additionalIngredients = healthFocus === 'healthy'
          ? ['vegetable broth', 'herbs', 'nutritional yeast']
          : ['cheese', 'cream', 'butter', 'breadcrumbs']
      }
    } else if (categories.includes('proteins')) {
      if (timePreference === 'short') {
        recipeName = `${mainIngredients} Wrap`
        cookingMethod = 'wrap'
        additionalIngredients = healthFocus === 'healthy'
          ? ['lettuce', 'tomato', 'avocado', 'whole grain tortilla']
          : ['cheese', 'sauce', 'crispy toppings', 'regular tortilla']
      } else {
        recipeName = `Braised ${mainIngredients} with Sauce`
        cookingMethod = 'braise'
        additionalIngredients = healthFocus === 'healthy'
          ? ['herbs', 'vegetables', 'broth', 'wine']
          : ['cream', 'butter', 'wine', 'rich sauce']
      }
    } else if (categories.includes('vegetables')) {
      if (timePreference === 'short') {
        recipeName = `Flash-Seared ${mainIngredients}`
        cookingMethod = 'sear'
        additionalIngredients = healthFocus === 'healthy'
          ? ['olive oil', 'lemon', 'herbs', 'garlic']
          : ['butter', 'cream', 'cheese', 'nuts']
      } else {
        recipeName = `Roasted ${mainIngredients} Medley`
        cookingMethod = 'roast'
        additionalIngredients = healthFocus === 'healthy'
          ? ['olive oil', 'herbs', 'balsamic', 'seeds']
          : ['olive oil', 'herbs', 'cheese', 'nuts']
      }
    } else {
      recipeName = `Creative ${mainIngredients} Fusion`
      cookingMethod = 'sauté'
      additionalIngredients = healthFocus === 'healthy'
        ? ['onion', 'garlic', 'herbs', 'vegetable broth']
        : ['onion', 'garlic', 'cream', 'wine']
    }

    const instructions = generateInstructions(cookingMethod, items, additionalIngredients)
    const nutrition = getNutritionInfo(healthFocus, items.length)
    
    const tags = ['leftover-friendly', 'sustainable', cookingMethod]
    if (healthFocus === 'healthy') tags.push('healthy', 'nutritious')
    if (healthFocus === 'delicious') tags.push('indulgent', 'flavorful')
    if (timePreference === 'short') tags.push('quick', 'easy')
    if (timePreference === 'long') tags.push('slow-cooked', 'rich')
    
    let description = `A delicious way to transform your leftovers into a fresh, exciting meal!`
    if (healthFocus === 'healthy') {
      description = `A nutritious and wholesome recipe that makes the most of your leftovers while keeping you healthy!`
    } else if (healthFocus === 'delicious') {
      description = `An indulgent and flavorful recipe that transforms your leftovers into something truly special!`
    }

    // Format recipe for RecipeDetailScreen compatibility
    return {
      id: `recipe-${Date.now()}`,
      name: recipeName,
      image: getRecipeImage(cookingMethod, healthFocus),
      cookTime: getCookTime(cookingMethod, timePreference),
      difficulty: getDifficulty(difficulty),
      rating: 4.2 + Math.random() * 0.6,
      tags,
      description,
      baseServings: Math.max(2, Math.ceil(items.length / 2)),
      ingredients: [
        ...items.map(item => ({ 
          name: item.name, 
          amount: item.quantity || '1', 
          unit: 'portion', 
          category: item.category 
        })),
        ...additionalIngredients.map(ingredient => ({ 
          name: ingredient, 
          amount: 'to', 
          unit: 'taste', 
          category: 'pantry' 
        }))
      ],
      instructions,
      calories: nutrition.calories,
      protein: nutrition.protein,
      carbs: nutrition.carbs,
      fat: nutrition.fat,
      usesLeftovers: items.map(item => item.name)
    }
  }

  const generateInstructions = (method: string, items: LeftoverItem[], additional: string[]) => {
    const baseInstructions = {
      'stir-fry': [
        'Heat oil in a large pan or wok over medium-high heat',
        'Add garlic and ginger, stir-fry for 30 seconds until fragrant',
        `Add your leftover ${items.map(i => i.name).join(' and ')} to the pan`,
        'Stir-fry for 3-4 minutes until heated through',
        'Season with soy sauce, sesame oil, salt and pepper',
        'Serve hot over rice or noodles'
      ],
      'bowl': [
        'Arrange your leftover ingredients in a large bowl',
        'Drizzle with olive oil and lemon juice',
        'Season with herbs, salt, and pepper',
        'Toss gently to combine all flavors',
        'Let sit for 5 minutes to allow flavors to meld',
        'Serve at room temperature or slightly warmed'
      ],
      'wrap': [
        'Warm tortillas in a dry pan or microwave',
        'Layer lettuce and tomato on each tortilla',
        `Add your leftover ${items.map(i => i.name).join(' and ')}`,
        'Drizzle with your favorite sauce',
        'Roll tightly and slice in half',
        'Serve immediately'
      ],
      'roast': [
        'Preheat oven to 400°F (200°C)',
        `Toss leftover ${items.map(i => i.name).join(' and ')} with olive oil`,
        'Season with herbs, garlic, salt, and pepper',
        'Spread on a baking sheet in a single layer',
        'Roast for 15-20 minutes until heated through and slightly crispy',
        'Serve hot as a side or main dish'
      ],
      'sauté': [
        'Heat oil in a large pan over medium heat',
        'Add onion and garlic, cook until softened',
        `Add your leftover ${items.map(i => i.name).join(' and ')}`,
        'Pour in a splash of broth to prevent sticking',
        'Cook for 5-7 minutes, stirring occasionally',
        'Season with herbs and serve hot'
      ]
    }
    
    return baseInstructions[method as keyof typeof baseInstructions] || baseInstructions.sauté
  }

  const getCookTime = (method: string, timePreference?: string) => {
    const baseTimes = {
      'stir-fry': { short: '10 mins', medium: '15 mins', long: '20 mins' },
      'bowl': { short: '5 mins', medium: '10 mins', long: '15 mins' },
      'wrap': { short: '3 mins', medium: '5 mins', long: '8 mins' },
      'roast': { short: '15 mins', medium: '25 mins', long: '45 mins' },
      'sauté': { short: '8 mins', medium: '15 mins', long: '25 mins' },
      'quick-sauté': { short: '5 mins', medium: '8 mins', long: '12 mins' },
      'slow-cook': { short: '30 mins', medium: '45 mins', long: '90 mins' },
      'assembly': { short: '3 mins', medium: '5 mins', long: '8 mins' },
      'bake': { short: '20 mins', medium: '35 mins', long: '60 mins' },
      'braise': { short: '25 mins', medium: '40 mins', long: '75 mins' },
      'sear': { short: '5 mins', medium: '8 mins', long: '12 mins' }
    }
    
    const methodTimes = baseTimes[method as keyof typeof baseTimes] || baseTimes.sauté
    return methodTimes[timePreference as keyof typeof methodTimes] || methodTimes.medium
  }

  const getDifficulty = (preferredDifficulty: string): 'Easy' | 'Medium' | 'Hard' => {
    if (preferredDifficulty === 'easy') return 'Easy'
    if (preferredDifficulty === 'medium') return 'Medium'
    if (preferredDifficulty === 'challenging') return 'Hard'
    return 'Easy'
  }

  const getRecipeImage = (method: string, healthFocus: string) => {
    const healthyImages = {
      'stir-fry': '🥗', 'bowl': '🥙', 'wrap': '🌯', 'roast': '🥕',
      'sauté': '🥬', 'quick-sauté': '🥬', 'slow-cook': '🍲',
      'assembly': '🥗', 'bake': '🥦', 'braise': '🍲', 'sear': '🥕'
    }
    
    const deliciousImages = {
      'stir-fry': '🍜', 'bowl': '🍝', 'wrap': '🌯', 'roast': '🍖',
      'sauté': '🍳', 'quick-sauté': '🍳', 'slow-cook': '🍲',
      'assembly': '🍽️', 'bake': '🧄', 'braise': '🍖', 'sear': '🥩'
    }
    
    const balancedImages = {
      'stir-fry': '🍛', 'bowl': '🍲', 'wrap': '🌯', 'roast': '🍽️',
      'sauté': '🍳', 'quick-sauté': '🍳', 'slow-cook': '🍲',
      'assembly': '🍽️', 'bake': '🥘', 'braise': '🍲', 'sear': '🍳'
    }
    
    if (healthFocus === 'healthy') return healthyImages[method as keyof typeof healthyImages] || '🥗'
    if (healthFocus === 'delicious') return deliciousImages[method as keyof typeof deliciousImages] || '🍽️'
    return balancedImages[method as keyof typeof balancedImages] || '🍽️'
  }

  const getNutritionInfo = (healthFocus: string, itemCount: number) => {
    const baseCalories = Math.floor(Math.random() * 150) + 250
    const multiplier = itemCount * 50
    
    if (healthFocus === 'healthy') {
      return {
        calories: Math.min(baseCalories + multiplier * 0.8, 400),
        protein: Math.floor(Math.random() * 25) + 20,
        carbs: Math.floor(Math.random() * 35) + 30,
        fat: Math.floor(Math.random() * 12) + 8
      }
    } else if (healthFocus === 'delicious') {
      return {
        calories: baseCalories + multiplier * 1.3,
        protein: Math.floor(Math.random() * 20) + 15,
        carbs: Math.floor(Math.random() * 40) + 35,
        fat: Math.floor(Math.random() * 25) + 15
      }
    } else {
      return {
        calories: baseCalories + multiplier,
        protein: Math.floor(Math.random() * 20) + 15,
        carbs: Math.floor(Math.random() * 30) + 25,
        fat: Math.floor(Math.random() * 15) + 10
      }
    }
  }

  const clearSelection = () => {
    setSelectedLeftovers([])
  }

  const removeSelectedItems = () => {
    Alert.alert(
      'Remove Items',
      `Are you sure you want to remove ${selectedLeftovers.length} selected items?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const updatedLeftovers = leftovers.filter(item => !selectedLeftovers.includes(item.id))
            setLeftovers(updatedLeftovers)
            saveLeftovers(updatedLeftovers)
            setSelectedLeftovers([])
          }
        }
      ]
    )
  }

  const filteredLeftovers = selectedCategory === 'all' 
    ? leftovers 
    : leftovers.filter(item => item.category === selectedCategory)

  const categories: Array<'all' | LeftoverItem['category']> = ['all', 'vegetables', 'proteins', 'grains', 'dairy', 'condiments', 'other']

  // Create a custom Start Cooking handler that triggers meal completion
  const handleCustomStartCooking = () => {
    // Hide recipe detail and trigger meal completion
    setShowRecipeDetail(false)
    
    // Simulate cooking completion after a brief delay
    setTimeout(() => {
      const mockMeal: MealCompletionItem = {
        mealName: selectedRecipe.name,
        date: new Date().toISOString().split('T')[0],
        portions: {
          consumed: selectedRecipe.baseServings - 1,
          leftover: 1,
          total: selectedRecipe.baseServings
        },
        leftovers: [
          {
            id: `leftover-${Date.now()}`,
            name: `${selectedRecipe.name} leftovers`,
            addedDate: new Date().toISOString(),
            quantity: "1 portion",
            category: 'other',
            status: 'fresh'
          }
        ]
      }
      setCurrentMeal(mockMeal)
      setShowMealCompletionModal(true)
    }, 1000)
  }

  const handleRateRecipe = (recipeId: string, rating: number) => {
    setUserRatings(prev => ({
      ...prev,
      [recipeId]: rating
    }))
  }

  // Create a custom RecipeDetailScreen with meal completion integration
  const CustomRecipeDetailScreen = () => (
    <RecipeDetailScreen
      recipe={selectedRecipe}
      onNavigateBack={() => setShowRecipeDetail(false)}
      fridgeItems={leftovers.map(item => ({
        id: item.id,
        name: item.name,
        category: item.category,
        quantity: 1,
        unit: 'item'
      }))}
      onAddToGroceryList={handleAddToGroceryList}
      onStartCooking={handleCustomStartCooking}
      onRateRecipe={handleRateRecipe}
      userRating={userRatings[selectedRecipe?.id]}
    />
  )

  // Show recipe detail screen if recipe is selected
  if (showRecipeDetail && selectedRecipe) {
    return <CustomRecipeDetailScreen />
  }

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
              <Text style={styles.headerIcon}>❄️</Text>
            </View>
          </View>

          {/* Stats Cards */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{leftovers.length}</Text>
              <Text style={styles.statLabel}>Items Tracked</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{leftovers.filter(item => item.status === 'fresh').length}</Text>
              <Text style={styles.statLabel}>Fresh Items</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{leftovers.filter(item => item.status === 'expiring').length}</Text>
              <Text style={styles.statLabel}>Use Soon</Text>
            </View>
          </View>

          {/* Category Filter */}
          <View style={styles.filterContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.filterButton,
                    selectedCategory === category && styles.filterButtonActive
                  ]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Text style={styles.filterIcon}>
                    {category === 'all' ? '🍽️' : getCategoryIcon(category)}
                  </Text>
                  <Text style={[
                    styles.filterText,
                    selectedCategory === category && styles.filterTextActive
                  ]}>
                    {category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[selectedLeftovers.length > 0 ? styles.removeSelectedButton : styles.addButton, { flex: 1 }]}
              onPress={() => selectedLeftovers.length > 0 ? removeSelectedItems() : setShowAddModal(true)}
            >
              <Text style={styles.addButtonIcon}>{selectedLeftovers.length > 0 ? '🗑️' : '➕'}</Text>
              <Text style={styles.addButtonText}>{selectedLeftovers.length > 0 ? 'Remove Items' : 'Add Item'}</Text>
            </TouchableOpacity>

            {selectedLeftovers.length > 0 && (
              <TouchableOpacity
                style={[styles.generateRecipeButton, { flex: 1 }]}
                onPress={generateRecipeFromLeftovers}
              >
                <Text style={styles.generateRecipeButtonIcon}>👨‍🍳</Text>
                <Text style={styles.generateRecipeButtonText}>
                  Recipe ({selectedLeftovers.length})
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {selectedLeftovers.length > 0 && (
            <View style={styles.selectionBar}>
              <Text style={styles.selectionText}>
                {selectedLeftovers.length} items selected
              </Text>
              <TouchableOpacity
                style={styles.clearSelectionButton}
                onPress={clearSelection}
              >
                <Text style={styles.clearSelectionText}>Clear</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Leftovers List */}
          <View style={styles.leftoversList}>
            {filteredLeftovers.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateIcon}>🥶</Text>
                <Text style={styles.emptyStateTitle}>No leftovers found</Text>
                <Text style={styles.emptyStateText}>
                  {selectedCategory === 'all' 
                    ? 'Your fridge is empty! Add some leftovers to track them.'
                    : `No ${selectedCategory} leftovers found.`
                  }
                </Text>
              </View>
            ) : (
              filteredLeftovers.map((item) => {
                const isSelected = selectedLeftovers.includes(item.id)
                return (
                  <TouchableOpacity 
                    key={item.id} 
                    style={[
                      styles.leftoverCard,
                      isSelected && styles.leftoverCardSelected
                    ]}
                    onPress={() => toggleLeftoverSelection(item.id)}
                  >
                    <View style={styles.leftoverHeader}>
                      <View style={styles.leftoverTitleRow}>
                        <Text style={styles.leftoverIcon}>{getCategoryIcon(item.category)}</Text>
                        <Text style={styles.leftoverName}>{item.name}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                          <Text style={styles.statusBadgeText}>{getStatusIcon(item.status)}</Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={(e) => {
                          e.stopPropagation()
                          removeLeftover(item.id)
                        }}
                      >
                        <Text style={styles.removeButtonText}>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  
                    <View style={styles.leftoverDetails}>
                      {item.quantity && (
                        <Text style={styles.leftoverDetail}>📏 {item.quantity}</Text>
                      )}
                      <Text style={styles.leftoverDetail}>
                        📅 Added {new Date(item.addedDate).toLocaleDateString()}
                      </Text>
                      {item.fromMeal && (
                        <Text style={styles.leftoverDetail}>🍽️ From: {item.fromMeal}</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                )
              })
            )}
          </View>
        </View>
      </ScrollView>

      {/* Add Leftover Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <LinearGradient
          colors={['#059669', '#10B981']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.modalHeader}
        >
          <View style={styles.modalHeaderContent}>
            <Text style={styles.modalTitle}>Add Leftover Item</Text>
            <Text style={styles.modalSubtitle}>Track your food to reduce waste</Text>
          </View>
        </LinearGradient>

        <ScrollView style={styles.modalContent}>
          <View style={styles.modalCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Item Name</Text>
              <TextInput
                style={styles.textInput}
                value={newLeftover.name}
                onChangeText={(text) => setNewLeftover(prev => ({ ...prev, name: text }))}
                placeholder="e.g., Leftover pasta, Roasted vegetables"
                placeholderTextColor="#9CA3AF"
              />
              
              {/* Voice Recording Section */}
              <View style={styles.voiceRecordingSection}>
                <Text style={styles.voiceRecordingLabel}>or record a voice note</Text>
                
                {!isRecording && !recordedAudio && (
                  <TouchableOpacity 
                    style={styles.voiceRecordButton}
                    onPress={startRecording}
                  >
                    <Text style={styles.voiceRecordIcon}>🎤</Text>
                    <Text style={styles.voiceRecordText}>Tap to record</Text>
                  </TouchableOpacity>
                )}
                
                {isRecording && (
                  <View style={styles.recordingActive}>
                    <View style={styles.recordingIndicator}>
                      <View style={styles.recordingDot} />
                      <Text style={styles.recordingText}>Recording... {recordingDuration}s</Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.stopRecordButton}
                      onPress={stopRecording}
                    >
                      <Text style={styles.stopRecordText}>Stop</Text>
                    </TouchableOpacity>
                  </View>
                )}
                
                {recordedAudio && (
                  <View style={styles.recordedAudioContainer}>
                    <View style={styles.audioInfo}>
                      <Text style={styles.audioIcon}>🎵</Text>
                      <View style={styles.audioDetails}>
                        <Text style={styles.audioFileName}>Voice note recorded</Text>
                        <Text style={styles.audioDuration}>{recordingDuration} seconds</Text>
                      </View>
                    </View>
                    <View style={styles.audioActions}>
                      <TouchableOpacity 
                        style={styles.transcribeButton}
                        onPress={transcribeAudio}
                      >
                        <Text style={styles.transcribeButtonText}>Transcribe</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.deleteAudioButton}
                        onPress={deleteRecording}
                      >
                        <Text style={styles.deleteAudioText}>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Quantity (Optional)</Text>
              <TextInput
                style={styles.textInput}
                value={newLeftover.quantity}
                onChangeText={(text) => setNewLeftover(prev => ({ ...prev, quantity: text }))}
                placeholder="e.g., 2 portions, 1 cup, 300g"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Category</Text>
              <View style={styles.categoryGrid}>
                {(['vegetables', 'proteins', 'grains', 'dairy', 'condiments', 'other'] as LeftoverItem['category'][]).map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryOption,
                      newLeftover.category === category && styles.categoryOptionSelected
                    ]}
                    onPress={() => setNewLeftover(prev => ({ ...prev, category }))}
                  >
                    <Text style={styles.categoryOptionIcon}>{getCategoryIcon(category)}</Text>
                    <Text style={[
                      styles.categoryOptionText,
                      newLeftover.category === category && styles.categoryOptionTextSelected
                    ]}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Expiry (Days)</Text>
              <View style={styles.expirySelector}>
                {[1, 3, 7, 14].map((days) => (
                  <TouchableOpacity
                    key={days}
                    style={[
                      styles.expiryOption,
                      newLeftover.expiryDays === days && styles.expiryOptionSelected
                    ]}
                    onPress={() => setNewLeftover(prev => ({ ...prev, expiryDays: days }))}
                  >
                    <Text style={[
                      styles.expiryOptionText,
                      newLeftover.expiryDays === days && styles.expiryOptionTextSelected
                    ]}>
                      {days}d
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={addLeftover}
              >
                <Text style={styles.modalSaveButtonText}>Add Item</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </Modal>

      {/* Meal Completion Modal */}
      <Modal
        visible={showMealCompletionModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <LinearGradient
          colors={['#7C3AED', '#A855F7']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.modalHeader}
        >
          <View style={styles.modalHeaderContent}>
            <Text style={styles.modalTitle}>Meal Completed! 🎉</Text>
            <Text style={styles.modalSubtitle}>Help us track your leftovers</Text>
          </View>
        </LinearGradient>

        <ScrollView style={styles.modalContent}>
          {currentMeal && (
            <View style={styles.modalCard}>
              <View style={styles.mealCompletionHeader}>
                <Text style={styles.mealCompletionTitle}>{currentMeal.mealName}</Text>
                <Text style={styles.mealCompletionDate}>
                  {new Date(currentMeal.date).toLocaleDateString()}
                </Text>
              </View>

              <View style={styles.portionInfo}>
                <Text style={styles.portionTitle}>Portion Summary</Text>
                <View style={styles.portionStats}>
                  <View style={styles.portionStat}>
                    <Text style={styles.portionStatIcon}>✅</Text>
                    <Text style={styles.portionStatValue}>{currentMeal.portions.consumed}</Text>
                    <Text style={styles.portionStatLabel}>Consumed</Text>
                  </View>
                  <View style={styles.portionStat}>
                    <Text style={styles.portionStatIcon}>📦</Text>
                    <Text style={styles.portionStatValue}>{currentMeal.portions.leftover}</Text>
                    <Text style={styles.portionStatLabel}>Leftover</Text>
                  </View>
                  <View style={styles.portionStat}>
                    <Text style={styles.portionStatIcon}>🍽️</Text>
                    <Text style={styles.portionStatValue}>{currentMeal.portions.total}</Text>
                    <Text style={styles.portionStatLabel}>Total</Text>
                  </View>
                </View>
              </View>

              <View style={styles.leftoverDetectedSection}>
                <Text style={styles.leftoverDetectedTitle}>Detected Leftovers</Text>
                {currentMeal.leftovers.map((leftover, index) => (
                  <View key={index} style={styles.detectedLeftoverCard}>
                    <Text style={styles.detectedLeftoverIcon}>{getCategoryIcon(leftover.category)}</Text>
                    <View style={styles.detectedLeftoverInfo}>
                      <Text style={styles.detectedLeftoverName}>{leftover.name}</Text>
                      <Text style={styles.detectedLeftoverQuantity}>{leftover.quantity}</Text>
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setShowMealCompletionModal(false)}
                >
                  <Text style={styles.modalCancelButtonText}>Skip</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalSaveButton}
                  onPress={confirmMealCompletion}
                >
                  <Text style={styles.modalSaveButtonText}>Add to Fridge</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </Modal>

      {/* Cooking Preferences Modal */}
      <Modal
        visible={showCookingPreferencesModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <LinearGradient
          colors={['#7C3AED', '#A855F7', '#C084FC']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.preferencesHeader}
        >
          <View style={styles.preferencesHeaderContent}>
            <Text style={styles.preferencesTitle}>Cooking Preferences</Text>
            <Text style={styles.preferencesSubtitle}>
              Tell us how you'd like to cook with your {selectedLeftovers.length} selected leftovers
            </Text>
          </View>
        </LinearGradient>

        <ScrollView style={styles.preferencesContent}>
          <View style={styles.preferencesCard}>
            {/* Time Preference */}
            <View style={styles.preferenceSection}>
              <Text style={styles.preferenceSectionTitle}>⏱️ Cooking Time</Text>
              <Text style={styles.preferenceSectionSubtitle}>How much time do you have?</Text>
              <View style={styles.preferenceOptions}>
                {[
                  { id: 'short', label: 'Quick & Easy', subtitle: '5-15 minutes', icon: '⚡' },
                  { id: 'medium', label: 'Moderate', subtitle: '15-30 minutes', icon: '⏰' },
                  { id: 'long', label: 'Slow & Rich', subtitle: '30+ minutes', icon: '🍲' }
                ].map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.preferenceOption,
                      cookingPreferences.timePreference === option.id && styles.preferenceOptionSelected
                    ]}
                    onPress={() => setCookingPreferences(prev => ({ ...prev, timePreference: option.id as any }))}
                  >
                    <Text style={styles.preferenceOptionIcon}>{option.icon}</Text>
                    <View style={styles.preferenceOptionContent}>
                      <Text style={[
                        styles.preferenceOptionTitle,
                        cookingPreferences.timePreference === option.id && styles.preferenceOptionTitleSelected
                      ]}>
                        {option.label}
                      </Text>
                      <Text style={styles.preferenceOptionSubtitle}>{option.subtitle}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Health Focus */}
            <View style={styles.preferenceSection}>
              <Text style={styles.preferenceSectionTitle}>🥗 Health Focus</Text>
              <Text style={styles.preferenceSectionSubtitle}>What's your priority?</Text>
              <View style={styles.preferenceOptions}>
                {[
                  { id: 'healthy', label: 'Healthy', subtitle: 'Nutritious & light', icon: '🥗' },
                  { id: 'balanced', label: 'Balanced', subtitle: 'Best of both worlds', icon: '⚖️' },
                  { id: 'delicious', label: 'Delicious', subtitle: 'Rich & indulgent', icon: '😋' }
                ].map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.preferenceOption,
                      cookingPreferences.healthFocus === option.id && styles.preferenceOptionSelected
                    ]}
                    onPress={() => setCookingPreferences(prev => ({ ...prev, healthFocus: option.id as any }))}
                  >
                    <Text style={styles.preferenceOptionIcon}>{option.icon}</Text>
                    <View style={styles.preferenceOptionContent}>
                      <Text style={[
                        styles.preferenceOptionTitle,
                        cookingPreferences.healthFocus === option.id && styles.preferenceOptionTitleSelected
                      ]}>
                        {option.label}
                      </Text>
                      <Text style={styles.preferenceOptionSubtitle}>{option.subtitle}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Difficulty */}
            <View style={styles.preferenceSection}>
              <Text style={styles.preferenceSectionTitle}>👨‍🍳 Difficulty Level</Text>
              <Text style={styles.preferenceSectionSubtitle}>How challenging should it be?</Text>
              <View style={styles.preferenceOptions}>
                {[
                  { id: 'easy', label: 'Easy', subtitle: 'Simple steps', icon: '🟢' },
                  { id: 'medium', label: 'Medium', subtitle: 'Some technique', icon: '🟡' },
                  { id: 'challenging', label: 'Challenging', subtitle: 'Complex cooking', icon: '🔴' }
                ].map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.preferenceOption,
                      cookingPreferences.difficulty === option.id && styles.preferenceOptionSelected
                    ]}
                    onPress={() => setCookingPreferences(prev => ({ ...prev, difficulty: option.id as any }))}
                  >
                    <Text style={styles.preferenceOptionIcon}>{option.icon}</Text>
                    <View style={styles.preferenceOptionContent}>
                      <Text style={[
                        styles.preferenceOptionTitle,
                        cookingPreferences.difficulty === option.id && styles.preferenceOptionTitleSelected
                      ]}>
                        {option.label}
                      </Text>
                      <Text style={styles.preferenceOptionSubtitle}>{option.subtitle}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.preferencesButtons}>
              <TouchableOpacity
                style={styles.preferencesCancelButton}
                onPress={() => setShowCookingPreferencesModal(false)}
              >
                <Text style={styles.preferencesCancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.preferencesGenerateButton}
                onPress={startRecipeGeneration}
              >
                <Text style={styles.preferencesGenerateButtonIcon}>👨‍🍳</Text>
                <Text style={styles.preferencesGenerateButtonText}>Generate Recipe</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </Modal>

      {/* Recipe Generator Modal */}
      <Modal
        visible={showRecipeGeneratorModal}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        {isGeneratingRecipe ? (
          <LinearGradient
            colors={['#F0FDF4', '#DCFCE7', '#BBF7D0']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.recipeLoadingContainer}
          >
            <View style={styles.recipeLoadingContent}>
              <View style={styles.recipeLoadingIconContainer}>
                <Text style={styles.recipeLoadingIcon}>👨‍🍳</Text>
              </View>
              
              <Text style={styles.recipeLoadingTitle}>Creating Your Recipe</Text>
              <Text style={styles.recipeLoadingSubtitle}>
                Our AI chef is crafting a delicious recipe using your selected leftovers...
              </Text>

              <View style={styles.recipeProgressContainer}>
                <View style={styles.recipeProgressTrack}>
                  <View 
                    style={[
                      styles.recipeProgressBar,
                      { width: `${recipeGenerationProgress}%` }
                    ]}
                  />
                </View>
                <Text style={styles.recipeProgressText}>{Math.round(recipeGenerationProgress)}%</Text>
              </View>

              <View style={styles.recipeLoadingSteps}>
                <View style={styles.recipeLoadingStep}>
                  <Text style={styles.recipeLoadingStepIcon}>🔍</Text>
                  <Text style={styles.recipeLoadingStepText}>Analyzing your leftovers</Text>
                </View>
                <View style={styles.recipeLoadingStep}>
                  <Text style={styles.recipeLoadingStepIcon}>🧠</Text>
                  <Text style={styles.recipeLoadingStepText}>Finding perfect combinations</Text>
                </View>
                <View style={styles.recipeLoadingStep}>
                  <Text style={styles.recipeLoadingStepIcon}>📝</Text>
                  <Text style={styles.recipeLoadingStepText}>Writing cooking instructions</Text>
                </View>
                <View style={styles.recipeLoadingStep}>
                  <Text style={styles.recipeLoadingStepIcon}>✨</Text>
                  <Text style={styles.recipeLoadingStepText}>Adding the perfect touch</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        ) : generatedRecipe ? (
          <LinearGradient
            colors={['#F0FDF4', '#DBEAFE', '#FAF5FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.recipeContainer}
          >
            <ScrollView style={styles.recipeScrollView}>
              <View style={styles.recipeContent}>
                {/* Recipe Header */}
                <View style={styles.recipeHeader}>
                  <TouchableOpacity
                    style={styles.recipeCloseButton}
                    onPress={() => {
                      setShowRecipeGeneratorModal(false)
                      setGeneratedRecipe(null)
                      clearSelection()
                    }}
                  >
                    <Text style={styles.recipeCloseButtonText}>✕</Text>
                  </TouchableOpacity>
                  
                  <View style={styles.recipeImageContainer}>
                    <Text style={styles.recipeImage}>{generatedRecipe.image}</Text>
                  </View>
                  
                  <Text style={styles.recipeName}>{generatedRecipe.name}</Text>
                  <Text style={styles.recipeDescription}>{generatedRecipe.description}</Text>
                  
                  <View style={styles.recipeMetrics}>
                    <View style={styles.recipeMetric}>
                      <Text style={styles.recipeMetricIcon}>⏱️</Text>
                      <Text style={styles.recipeMetricText}>{generatedRecipe.cookTime}</Text>
                    </View>
                    <View style={styles.recipeMetric}>
                      <Text style={styles.recipeMetricIcon}>👥</Text>
                      <Text style={styles.recipeMetricText}>{generatedRecipe.servings} servings</Text>
                    </View>
                    <View style={styles.recipeMetric}>
                      <Text style={styles.recipeMetricIcon}>⭐</Text>
                      <Text style={styles.recipeMetricText}>{generatedRecipe.rating.toFixed(1)}</Text>
                    </View>
                    <View style={styles.recipeMetric}>
                      <Text style={styles.recipeMetricIcon}>👨‍🍳</Text>
                      <Text style={styles.recipeMetricText}>{generatedRecipe.difficulty}</Text>
                    </View>
                  </View>

                  <View style={styles.recipeTags}>
                    {generatedRecipe.tags.map((tag: string, index: number) => (
                      <View key={index} style={styles.recipeTag}>
                        <Text style={styles.recipeTagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Ingredients */}
                <View style={styles.recipeSection}>
                  <Text style={styles.recipeSectionTitle}>🧄 Ingredients</Text>
                  <View style={styles.ingredientsList}>
                    {generatedRecipe.ingredients.map((ingredient: any, index: number) => (
                      <View key={index} style={styles.ingredientItem}>
                        <Text style={styles.ingredientIcon}>
                          {ingredient.category === 'pantry' ? '🥄' : getCategoryIcon(ingredient.category)}
                        </Text>
                        <Text style={styles.ingredientText}>
                          {ingredient.amount} {ingredient.name}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Instructions */}
                <View style={styles.recipeSection}>
                  <Text style={styles.recipeSectionTitle}>👨‍🍳 Instructions</Text>
                  <View style={styles.instructionsList}>
                    {generatedRecipe.instructions.map((instruction: string, index: number) => (
                      <View key={index} style={styles.instructionItem}>
                        <View style={styles.instructionNumber}>
                          <Text style={styles.instructionNumberText}>{index + 1}</Text>
                        </View>
                        <Text style={styles.instructionText}>{instruction}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Nutrition */}
                <View style={styles.recipeSection}>
                  <Text style={styles.recipeSectionTitle}>🥗 Nutrition (per serving)</Text>
                  <View style={styles.nutritionGrid}>
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionValue}>{generatedRecipe.nutrition.calories}</Text>
                      <Text style={styles.nutritionLabel}>Calories</Text>
                    </View>
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionValue}>{generatedRecipe.nutrition.protein}g</Text>
                      <Text style={styles.nutritionLabel}>Protein</Text>
                    </View>
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionValue}>{generatedRecipe.nutrition.carbs}g</Text>
                      <Text style={styles.nutritionLabel}>Carbs</Text>
                    </View>
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionValue}>{generatedRecipe.nutrition.fat}g</Text>
                      <Text style={styles.nutritionLabel}>Fat</Text>
                    </View>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.recipeActions}>
                  <TouchableOpacity
                    style={styles.recipeSaveButton}
                    onPress={() => {
                      // Save recipe functionality
                      Alert.alert('Recipe Saved!', 'This delicious leftover recipe has been saved to your collection.')
                    }}
                  >
                    <Text style={styles.recipeSaveButtonIcon}>💾</Text>
                    <Text style={styles.recipeSaveButtonText}>Save Recipe</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.recipeStartButton}
                    onPress={() => {
                      // Start cooking functionality
                      Alert.alert('Happy Cooking!', 'Enjoy making this delicious recipe with your leftovers!')
                      setShowRecipeGeneratorModal(false)
                      setGeneratedRecipe(null)
                      clearSelection()
                    }}
                  >
                    <Text style={styles.recipeStartButtonIcon}>🔥</Text>
                    <Text style={styles.recipeStartButtonText}>Start Cooking</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </LinearGradient>
        ) : null}
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
    marginBottom: 24,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  headerIcon: {
    fontSize: 28,
  },
  fridgeLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  fridgeLogoIcon: {
    fontSize: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    fontFamily: 'System',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    fontFamily: 'System',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: {
    fontSize: 16,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  filterContainer: {
    marginBottom: 20,
  },
  filterScroll: {
    marginHorizontal: -8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  filterButtonActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  filterIcon: {
    fontSize: 16,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  filterTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    gap: 8,
  },
  removeSelectedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    gap: 8,
  },
  generateRecipeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7C3AED',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    gap: 8,
  },
  generateRecipeButtonIcon: {
    fontSize: 18,
  },
  generateRecipeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  selectionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#7C3AED',
  },
  selectionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7C3AED',
  },
  clearSelectionButton: {
    padding: 4,
  },
  clearSelectionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  addButtonIcon: {
    fontSize: 18,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  leftoversList: {
    gap: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  leftoverCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  leftoverCardSelected: {
    borderColor: '#7C3AED',
    borderWidth: 2,
    backgroundColor: 'rgba(124, 58, 237, 0.05)',
  },
  leftoverHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  leftoverTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  leftoverIcon: {
    fontSize: 16,
  },
  leftoverName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  statusBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadgeText: {
    fontSize: 10,
  },
  removeButton: {
    padding: 4,
  },
  removeButtonText: {
    fontSize: 16,
  },
  leftoverDetails: {
    gap: 4,
  },
  leftoverDetail: {
    fontSize: 14,
    color: '#6B7280',
  },
  // Modal Styles
  modalHeader: {
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: 24,
  },
  modalHeaderContent: {
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    marginTop: -16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  modalCard: {
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
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
    minWidth: '47%',
    gap: 6,
  },
  categoryOptionSelected: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  categoryOptionIcon: {
    fontSize: 16,
  },
  categoryOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  categoryOptionTextSelected: {
    color: '#059669',
    fontWeight: '600',
  },
  expirySelector: {
    flexDirection: 'row',
    gap: 8,
  },
  expiryOption: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
  },
  expiryOptionSelected: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  expiryOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  expiryOptionTextSelected: {
    color: '#059669',
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalCancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  modalSaveButton: {
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
  modalSaveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Meal Completion Modal Styles
  mealCompletionHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  mealCompletionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  mealCompletionDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  portionInfo: {
    marginBottom: 24,
  },
  portionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  portionStats: {
    flexDirection: 'row',
    gap: 12,
  },
  portionStat: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
  },
  portionStatIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  portionStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  portionStatLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  leftoverDetectedSection: {
    marginBottom: 24,
  },
  leftoverDetectedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  detectedLeftoverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10B981',
    marginBottom: 8,
    gap: 12,
  },
  detectedLeftoverIcon: {
    fontSize: 18,
  },
  detectedLeftoverInfo: {
    flex: 1,
  },
  detectedLeftoverName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  detectedLeftoverQuantity: {
    fontSize: 12,
    color: '#6B7280',
  },
  // Cooking Preferences Styles
  preferencesHeader: {
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: 24,
  },
  preferencesHeaderContent: {
    alignItems: 'center',
  },
  preferencesTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  preferencesSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  preferencesContent: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    marginTop: -16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  preferencesCard: {
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
  preferenceSection: {
    marginBottom: 32,
  },
  preferenceSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  preferenceSectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  preferenceOptions: {
    gap: 12,
  },
  preferenceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  preferenceOptionSelected: {
    borderColor: '#7C3AED',
    backgroundColor: 'rgba(124, 58, 237, 0.05)',
  },
  preferenceOptionIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  preferenceOptionContent: {
    flex: 1,
  },
  preferenceOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  preferenceOptionTitleSelected: {
    color: '#7C3AED',
  },
  preferenceOptionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  preferencesButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  preferencesCancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
  },
  preferencesCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  preferencesGenerateButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7C3AED',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    gap: 8,
  },
  preferencesGenerateButtonIcon: {
    fontSize: 16,
  },
  preferencesGenerateButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Recipe Generator Styles
  recipeLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recipeLoadingContent: {
    alignItems: 'center',
    paddingHorizontal: 32,
    maxWidth: 350,
  },
  recipeLoadingIconContainer: {
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
  recipeLoadingIcon: {
    fontSize: 48,
  },
  recipeLoadingTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  recipeLoadingSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  recipeProgressContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 40,
  },
  recipeProgressTrack: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  recipeProgressBar: {
    height: '100%',
    backgroundColor: '#7C3AED',
    borderRadius: 4,
  },
  recipeProgressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7C3AED',
  },
  recipeLoadingSteps: {
    width: '100%',
    gap: 16,
  },
  recipeLoadingStep: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  recipeLoadingStepIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  recipeLoadingStepText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    flex: 1,
  },
  // Recipe Display Styles
  recipeContainer: {
    flex: 1,
  },
  recipeScrollView: {
    flex: 1,
  },
  recipeContent: {
    padding: 24,
    paddingTop: 60,
  },
  recipeHeader: {
    alignItems: 'center',
    marginBottom: 32,
    position: 'relative',
  },
  recipeCloseButton: {
    position: 'absolute',
    top: -20,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 10,
  },
  recipeCloseButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
  },
  recipeImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  recipeImage: {
    fontSize: 60,
  },
  recipeName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  recipeDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  recipeMetrics: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 16,
  },
  recipeMetric: {
    alignItems: 'center',
  },
  recipeMetricIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  recipeMetricText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  recipeTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  recipeTag: {
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#7C3AED',
  },
  recipeTagText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#7C3AED',
  },
  recipeSection: {
    marginBottom: 32,
  },
  recipeSectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  ingredientsList: {
    gap: 12,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  ingredientIcon: {
    fontSize: 18,
  },
  ingredientText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  instructionsList: {
    gap: 16,
  },
  instructionItem: {
    flexDirection: 'row',
    gap: 12,
  },
  instructionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  instructionText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    flex: 1,
  },
  nutritionGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  nutritionItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  nutritionValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  nutritionLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  recipeActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  recipeSaveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#7C3AED',
    gap: 8,
  },
  recipeSaveButtonIcon: {
    fontSize: 16,
  },
  recipeSaveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7C3AED',
  },
  recipeStartButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    gap: 8,
  },
  recipeStartButtonIcon: {
    fontSize: 16,
  },
  recipeStartButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  
  // Voice Recording Styles
  voiceRecordingSection: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  voiceRecordingLabel: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  voiceRecordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    gap: 8,
  },
  voiceRecordIcon: {
    fontSize: 20,
  },
  voiceRecordText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  recordingActive: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  recordingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
  },
  stopRecordButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#EF4444',
    borderRadius: 8,
  },
  stopRecordText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  recordedAudioContainer: {
    padding: 16,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  audioInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  audioIcon: {
    fontSize: 24,
  },
  audioDetails: {
    flex: 1,
  },
  audioFileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#166534',
  },
  audioDuration: {
    fontSize: 14,
    color: '#16A34A',
  },
  audioActions: {
    flexDirection: 'row',
    gap: 12,
  },
  transcribeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#10B981',
    borderRadius: 8,
    alignItems: 'center',
  },
  transcribeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  deleteAudioButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#F87171',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteAudioText: {
    fontSize: 16,
  },
})