import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { ScreenWrapper } from '../../src/components/layout/ScreenWrapper'
import { groceryListService, GroceryItem } from '../../src/services/groceryListService'

interface StorePrice {
  store: string
  price: number
  currency: string
  unit: string
  isLowestPrice?: boolean
  distance?: string
  inStock?: boolean
}

interface ItemPrices {
  itemName: string
  normalizedName: string
  prices: StorePrice[]
  category: string
}

export default function GroceryListScreen() {
  const [groceryList, setGroceryList] = useState<GroceryItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [newItemName, setNewItemName] = useState('')
  const [newItemAmount, setNewItemAmount] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [showPriceComparison, setShowPriceComparison] = useState(true)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [selectedStore, setSelectedStore] = useState('All Stores')
  const [isRecording, setIsRecording] = useState(false)
  const [recordedAudio, setRecordedAudio] = useState<string | null>(null)
  const [recordingDuration, setRecordingDuration] = useState(0)

  // Smart shopping suggestions
  const shoppingSuggestions = [
    { name: 'Bananas', category: 'Fruits', reason: 'Great source of potassium' },
    { name: 'Greek Yogurt', category: 'Dairy', reason: 'High protein breakfast' },
    { name: 'Spinach', category: 'Vegetables', reason: 'Iron and vitamins' },
    { name: 'Salmon', category: 'Protein', reason: 'Omega-3 fatty acids' },
    { name: 'Quinoa', category: 'Grains', reason: 'Complete protein grain' },
    { name: 'Avocados', category: 'Fruits', reason: 'Healthy fats' },
    { name: 'Sweet Potatoes', category: 'Vegetables', reason: 'Complex carbohydrates' },
    { name: 'Almonds', category: 'Nuts', reason: 'Healthy snack option' },
    { name: 'Olive Oil', category: 'Pantry', reason: 'Healthy cooking oil' },
    { name: 'Blueberries', category: 'Fruits', reason: 'Antioxidants' },
    { name: 'Oats', category: 'Grains', reason: 'Fiber-rich breakfast' },
    { name: 'Broccoli', category: 'Vegetables', reason: 'Vitamin C and fiber' },
  ]

  // Enhanced mock price data for common grocery items
  const mockPriceData: ItemPrices[] = [
    {
      itemName: 'Chicken Breast',
      normalizedName: 'chicken breast',
      category: 'Protein',
      prices: [
        { store: 'Lidl', price: 4.99, currency: '€', unit: 'per kg', isLowestPrice: true, distance: '0.8 km', inStock: true },
        { store: 'Jumbo', price: 6.49, currency: '€', unit: 'per kg', distance: '1.2 km', inStock: true },
        { store: 'Albert Heijn', price: 7.99, currency: '€', unit: 'per kg', distance: '0.5 km', inStock: true },
      ]
    },
    {
      itemName: 'Broccoli',
      normalizedName: 'broccoli',
      category: 'Vegetables',
      prices: [
        { store: 'Lidl', price: 1.29, currency: '€', unit: 'per piece', distance: '0.8 km', inStock: true },
        { store: 'Jumbo', price: 1.19, currency: '€', unit: 'per piece', isLowestPrice: true, distance: '1.2 km', inStock: true },
        { store: 'Albert Heijn', price: 1.49, currency: '€', unit: 'per piece', distance: '0.5 km', inStock: true },
      ]
    },
    {
      itemName: 'Milk',
      normalizedName: 'milk',
      category: 'Dairy',
      prices: [
        { store: 'Lidl', price: 1.09, currency: '€', unit: 'per 1L', isLowestPrice: true, distance: '0.8 km', inStock: true },
        { store: 'Jumbo', price: 1.19, currency: '€', unit: 'per 1L', distance: '1.2 km', inStock: true },
        { store: 'Albert Heijn', price: 1.29, currency: '€', unit: 'per 1L', distance: '0.5 km', inStock: true },
      ]
    },
    {
      itemName: 'Quinoa',
      normalizedName: 'quinoa',
      category: 'Grains',
      prices: [
        { store: 'Lidl', price: 3.49, currency: '€', unit: 'per 500g', distance: '0.8 km', inStock: true },
        { store: 'Jumbo', price: 4.29, currency: '€', unit: 'per 500g', distance: '1.2 km', inStock: true },
        { store: 'Albert Heijn', price: 2.99, currency: '€', unit: 'per 500g', isLowestPrice: true, distance: '0.5 km', inStock: true },
      ]
    },
    {
      itemName: 'Avocados',
      normalizedName: 'avocado',
      category: 'Fruits',
      prices: [
        { store: 'Lidl', price: 1.99, currency: '€', unit: 'per piece', distance: '0.8 km', inStock: true },
        { store: 'Jumbo', price: 2.49, currency: '€', unit: 'per piece', distance: '1.2 km', inStock: true },
        { store: 'Albert Heijn', price: 1.79, currency: '€', unit: 'per piece', isLowestPrice: true, distance: '0.5 km', inStock: true },
      ]
    },
    {
      itemName: 'Greek Yogurt',
      normalizedName: 'greek yogurt',
      category: 'Dairy',
      prices: [
        { store: 'Lidl', price: 2.29, currency: '€', unit: 'per 500g', isLowestPrice: true, distance: '0.8 km', inStock: true },
        { store: 'Jumbo', price: 2.79, currency: '€', unit: 'per 500g', distance: '1.2 km', inStock: true },
        { store: 'Albert Heijn', price: 3.19, currency: '€', unit: 'per 500g', distance: '0.5 km', inStock: true },
      ]
    },
    {
      itemName: 'Salmon',
      normalizedName: 'salmon',
      category: 'Protein',
      prices: [
        { store: 'Lidl', price: 12.99, currency: '€', unit: 'per kg', distance: '0.8 km', inStock: true },
        { store: 'Jumbo', price: 14.49, currency: '€', unit: 'per kg', distance: '1.2 km', inStock: true },
        { store: 'Albert Heijn', price: 11.99, currency: '€', unit: 'per kg', isLowestPrice: true, distance: '0.5 km', inStock: true },
      ]
    },
    {
      itemName: 'Spinach',
      normalizedName: 'spinach',
      category: 'Vegetables',
      prices: [
        { store: 'Lidl', price: 1.49, currency: '€', unit: 'per 200g bag', isLowestPrice: true, distance: '0.8 km', inStock: true },
        { store: 'Jumbo', price: 1.79, currency: '€', unit: 'per 200g bag', distance: '1.2 km', inStock: true },
        { store: 'Albert Heijn', price: 1.99, currency: '€', unit: 'per 200g bag', distance: '0.5 km', inStock: true },
      ]
    },
    {
      itemName: 'Sweet Potatoes',
      normalizedName: 'sweet potato',
      category: 'Vegetables',
      prices: [
        { store: 'Lidl', price: 2.49, currency: '€', unit: 'per kg', distance: '0.8 km', inStock: true },
        { store: 'Jumbo', price: 2.99, currency: '€', unit: 'per kg', distance: '1.2 km', inStock: true },
        { store: 'Albert Heijn', price: 2.29, currency: '€', unit: 'per kg', isLowestPrice: true, distance: '0.5 km', inStock: true },
      ]
    },
    {
      itemName: 'Almonds',
      normalizedName: 'almond',
      category: 'Nuts',
      prices: [
        { store: 'Lidl', price: 4.99, currency: '€', unit: 'per 200g', isLowestPrice: true, distance: '0.8 km', inStock: true },
        { store: 'Jumbo', price: 6.49, currency: '€', unit: 'per 200g', distance: '1.2 km', inStock: true },
        { store: 'Albert Heijn', price: 7.29, currency: '€', unit: 'per 200g', distance: '0.5 km', inStock: true },
      ]
    },
    {
      itemName: 'Blueberries',
      normalizedName: 'blueberry',
      category: 'Fruits',
      prices: [
        { store: 'Lidl', price: 2.99, currency: '€', unit: 'per 125g', distance: '0.8 km', inStock: true },
        { store: 'Jumbo', price: 3.49, currency: '€', unit: 'per 125g', distance: '1.2 km', inStock: true },
        { store: 'Albert Heijn', price: 2.79, currency: '€', unit: 'per 125g', isLowestPrice: true, distance: '0.5 km', inStock: true },
      ]
    },
    {
      itemName: 'Oats',
      normalizedName: 'oats',
      category: 'Grains',
      prices: [
        { store: 'Lidl', price: 1.99, currency: '€', unit: 'per 500g', isLowestPrice: true, distance: '0.8 km', inStock: true },
        { store: 'Jumbo', price: 2.49, currency: '€', unit: 'per 500g', distance: '1.2 km', inStock: true },
        { store: 'Albert Heijn', price: 2.79, currency: '€', unit: 'per 500g', distance: '0.5 km', inStock: true },
      ]
    },
  ]

  const categories = ['All', 'Vegetables', 'Fruits', 'Protein', 'Dairy', 'Grains', 'Pantry', 'Spices', 'Fresh', 'Bakery', 'Nuts']
  const stores = ['All Stores', 'Lidl', 'Jumbo', 'Albert Heijn']

  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadGroceryList()
  }, [])

  const loadGroceryList = async () => {
    try {
      setIsLoading(true)
      const items = await groceryListService.getGroceryList()
      setGroceryList(items)
    } catch (error) {
      console.error('Error loading grocery list:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const findPriceData = (itemName: string): ItemPrices | undefined => {
    return mockPriceData.find(priceData => 
      itemName.toLowerCase().includes(priceData.normalizedName) ||
      priceData.normalizedName.includes(itemName.toLowerCase())
    )
  }

  const filteredItems = groceryList.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const pendingItems = filteredItems.filter(item => !item.completed)
  const completedItems = filteredItems.filter(item => item.completed)

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
    setRecordedAudio(`grocery-voice-note-${Date.now()}.m4a`)
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
    // Simulate transcription for grocery items
    const mockTranscriptions = [
      "2 pounds organic chicken breast",
      "1 dozen free-range eggs",
      "3 bags of spinach for salads",
      "1 bottle olive oil extra virgin",
      "2 avocados and some bananas",
      "whole wheat bread 2 loaves",
      "greek yogurt plain 32 ounces"
    ]
    const transcribed = mockTranscriptions[Math.floor(Math.random() * mockTranscriptions.length)]
    
    // Parse the transcription to fill the form
    // Extract item name and amount from transcription
    const parts = transcribed.split(' ')
    const amount = parts.slice(0, 2).join(' ') // First two words as amount
    const name = parts.slice(2).join(' ') // Rest as item name
    
    setNewItemName(name || transcribed)
    setNewItemAmount(amount || '1')
    
    Alert.alert('Voice Transcribed! ✨', `Added: "${name}" with amount "${amount}"`)
    setRecordedAudio(null)
  }
  
  const deleteRecording = () => {
    setRecordedAudio(null)
    setRecordingDuration(0)
  }

  const handleAddItem = async () => {
    if (newItemName.trim() && newItemAmount.trim()) {
      try {
        const newItem = await groceryListService.addItem({
          name: newItemName.trim(),
          amount: newItemAmount.trim(),
          category: 'Pantry'
        })
        setGroceryList([newItem, ...groceryList])
        setNewItemName('')
        setNewItemAmount('')
        setShowAddForm(false)
      } catch (error) {
        console.error('Error adding item:', error)
        Alert.alert('Error', 'Failed to add item. Please try again.')
      }
    }
  }

  const toggleItemCompletion = async (itemId: string) => {
    const item = groceryList.find(i => i.id === itemId)
    if (!item) return
    
    try {
      await groceryListService.toggleItemCompletion(itemId, !item.completed)
      const updatedList = groceryList.map(i => 
        i.id === itemId ? { ...i, completed: !i.completed } : i
      )
      setGroceryList(updatedList)
    } catch (error) {
      console.error('Error toggling item:', error)
    }
  }

  const clearCompletedItems = async () => {
    try {
      await groceryListService.clearCompletedItems()
      const updatedList = groceryList.filter(item => !item.completed)
      setGroceryList(updatedList)
    } catch (error) {
      console.error('Error clearing completed items:', error)
    }
  }

  const removeItem = (itemId: string) => {
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: async () => {
            try {
              await groceryListService.removeItem(itemId)
              const updatedList = groceryList.filter(item => item.id !== itemId)
              setGroceryList(updatedList)
            } catch (error) {
              console.error('Error removing item:', error)
            }
          }
        }
      ]
    )
  }

  const addSuggestionToList = async (suggestion: { name: string; category: string; reason: string }) => {
    try {
      const newItem = await groceryListService.addItem({
        name: suggestion.name,
        amount: '1',
        category: suggestion.category
      })
      setGroceryList([newItem, ...groceryList])
    } catch (error) {
      console.error('Error adding suggestion:', error)
    }
  }

  // Calculate savings and store analysis
  const calculateSavings = () => {
    const itemsWithPrices = groceryList
      .filter(item => !item.completed)
      .map(item => ({
        ...item,
        priceData: findPriceData(item.name)
      }))
      .filter(item => item.priceData)

    let totalBest = 0
    let totalAverage = 0
    let storeAverages: { [store: string]: { total: number; count: number; savings: number } } = {}

    itemsWithPrices.forEach(item => {
      if (item.priceData) {
        const prices = item.priceData.prices.map(p => p.price)
        const bestPrice = Math.min(...prices)
        const averagePrice = prices.reduce((sum, p) => sum + p, 0) / prices.length
        
        totalBest += bestPrice
        totalAverage += averagePrice

        // Calculate per-store averages
        item.priceData.prices.forEach(price => {
          if (!storeAverages[price.store]) {
            storeAverages[price.store] = { total: 0, count: 0, savings: 0 }
          }
          storeAverages[price.store].total += price.price
          storeAverages[price.store].count += 1
          storeAverages[price.store].savings += (averagePrice - price.price)
        })
      }
    })

    // Calculate average prices per store
    const storeAnalysis = Object.entries(storeAverages).map(([store, data]) => ({
      store,
      averagePrice: data.total / data.count,
      totalSavings: data.savings,
      itemCount: data.count
    })).sort((a, b) => a.averagePrice - b.averagePrice)

    const bestStore = storeAnalysis[0]?.store || ''

    return {
      total: totalBest,
      savings: totalAverage - totalBest,
      bestStore,
      itemCount: itemsWithPrices.length,
      storeAnalysis
    }
  }

  const { total, savings, bestStore, itemCount, storeAnalysis } = calculateSavings()

  return (
    <ScreenWrapper>
      <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.title}>🛒</Text>
          <Text style={styles.subtitle}>Smart shopping lists based on your meal plans</Text>
          
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search grocery items..."
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Category Filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryContainer}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                onPress={() => setSelectedCategory(category)}
                style={[
                  styles.categoryButton,
                  selectedCategory === category && styles.categoryButtonActive
                ]}
              >
                <Text style={[
                  styles.categoryText,
                  selectedCategory === category && styles.categoryTextActive
                ]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Enhanced Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{pendingItems.length}</Text>
              <Text style={styles.statLabel}>To Buy</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{completedItems.length}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            {savings > 0 && (
              <View style={[styles.statCard, styles.savingsCard]}>
                <Text style={[styles.statNumber, styles.savingsNumber]}>€{savings.toFixed(2)}</Text>
                <Text style={styles.statLabel}>Savings</Text>
              </View>
            )}
          </View>

          {/* Best Store Recommendation */}
          {bestStore && itemCount > 0 && (
            <View style={styles.recommendationCard}>
              <Text style={styles.recommendationTitle}>🏆 Best Store: {bestStore}</Text>
              <Text style={styles.recommendationText}>
                Shop here for {itemCount} items and save €{savings.toFixed(2)}
              </Text>
            </View>
          )}

          {/* Smart Suggestions */}
          {showSuggestions && groceryList.length < 5 && (
            <View style={styles.suggestionsContainer}>
              <View style={styles.suggestionsHeader}>
                <Text style={styles.suggestionsTitle}>💡 Smart Suggestions</Text>
                <TouchableOpacity onPress={() => setShowSuggestions(false)}>
                  <Text style={styles.hideSuggestions}>Hide</Text>
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestionsScroll}>
                {shoppingSuggestions
                  .filter(suggestion => !groceryList.some(item => item.name.toLowerCase() === suggestion.name.toLowerCase()))
                  .slice(0, 6)
                  .map((suggestion, index) => {
                    const priceData = findPriceData(suggestion.name)
                    const bestPrice = priceData ? Math.min(...priceData.prices.map(p => p.price)) : null
                    
                    return (
                      <TouchableOpacity
                        key={index}
                        style={styles.suggestionCard}
                        onPress={() => addSuggestionToList(suggestion)}
                      >
                        <Text style={styles.suggestionName}>{suggestion.name}</Text>
                        <Text style={styles.suggestionReason}>{suggestion.reason}</Text>
                        {bestPrice && (
                          <Text style={styles.suggestionPrice}>From €{bestPrice.toFixed(2)}</Text>
                        )}
                        <View style={styles.suggestionAddButton}>
                          <Text style={styles.suggestionAddText}>+ Add</Text>
                        </View>
                      </TouchableOpacity>
                    )
                  })
                }
              </ScrollView>
            </View>
          )}

          {/* Price Comparison Toggle */}
          {pendingItems.length > 0 && !showPriceComparison && (
            <TouchableOpacity
              style={styles.priceComparisonToggle}
              onPress={() => setShowPriceComparison(true)}
            >
              <Text style={styles.priceComparisonToggleText}>💰 Show Price Comparison</Text>
            </TouchableOpacity>
          )}

          {/* Enhanced Price Comparison */}
          {showPriceComparison && pendingItems.length > 0 && storeAnalysis.length > 0 && (
            <View style={styles.priceComparisonContainer}>
              <View style={styles.priceComparisonHeader}>
                <Text style={styles.priceComparisonTitle}>💰 Store Comparison</Text>
                <TouchableOpacity onPress={() => setShowPriceComparison(false)}>
                  <Text style={styles.hidePrices}>Hide</Text>
                </TouchableOpacity>
              </View>
              
              <Text style={styles.comparisonSubtitle}>
                Average prices for your {itemCount} items with price data
              </Text>

              {/* Store Rankings */}
              <View style={styles.storeRankings}>
                {storeAnalysis.map((store, index) => (
                  <View 
                    key={store.store} 
                    style={[
                      styles.storeRankingCard,
                      index === 0 && styles.bestStoreCard
                    ]}
                  >
                    <View style={styles.storeRankingHeader}>
                      <View style={styles.storeInfo}>
                        <Text style={[
                          styles.storeRankingName,
                          index === 0 && styles.bestStoreName
                        ]}>
                          {index === 0 ? '🏆 ' : `${index + 1}. `}{store.store}
                        </Text>
                        {index === 0 && (
                          <Text style={styles.bestStoreLabel}>Best Overall</Text>
                        )}
                      </View>
                      <Text style={[
                        styles.storeAveragePrice,
                        index === 0 && styles.bestStorePrice
                      ]}>
                        €{store.averagePrice.toFixed(2)}
                      </Text>
                    </View>
                    
                    <View style={styles.storeDetails}>
                      <Text style={styles.storeDetailText}>
                        {store.itemCount} items
                      </Text>
                      {store.totalSavings > 0 ? (
                        <Text style={styles.storeSavings}>
                          Save €{store.totalSavings.toFixed(2)}
                        </Text>
                      ) : (
                        <Text style={styles.storeExtra}>
                          +€{Math.abs(store.totalSavings).toFixed(2)} more
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>

              {/* Summary */}
              <View style={styles.comparisonSummary}>
                <Text style={styles.summaryText}>
                  💡 Shopping at {bestStore} saves you €{savings.toFixed(2)} compared to average prices
                </Text>
              </View>
            </View>
          )}

          {/* Add Item Button */}
          {!showAddForm && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddForm(true)}
            >
              <Text style={styles.addButtonIcon}>➕</Text>
              <Text style={styles.addButtonText}>Add Item to List</Text>
            </TouchableOpacity>
          )}

          {/* Add Item Form */}
          {showAddForm && (
            <View style={styles.addForm}>
              <Text style={styles.addFormTitle}>Add New Item</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Item name..."
                value={newItemName}
                onChangeText={setNewItemName}
                placeholderTextColor="#9CA3AF"
              />
              <TextInput
                style={styles.formInput}
                placeholder="Amount (e.g., 2 lbs, 1 cup)..."
                value={newItemAmount}
                onChangeText={setNewItemAmount}
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
              
              <View style={styles.formButtons}>
                <TouchableOpacity
                  style={[styles.formButton, styles.addFormButton]}
                  onPress={handleAddItem}
                  disabled={!newItemName.trim() || !newItemAmount.trim()}
                >
                  <Text style={styles.addFormButtonText}>Add Item</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.formButton, styles.cancelButton]}
                  onPress={() => {
                    setShowAddForm(false)
                    setNewItemName('')
                    setNewItemAmount('')
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Pending Items */}
          {pendingItems.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🛒 To Buy ({pendingItems.length})</Text>
              {pendingItems.map((item) => {
                const priceData = findPriceData(item.name)
                const bestPrice = priceData ? Math.min(...priceData.prices.map(p => p.price)) : null
                const bestStore = priceData?.prices.find(p => p.price === bestPrice)

                return (
                  <View key={item.id} style={styles.itemCard}>
                    <View style={styles.itemContent}>
                      <TouchableOpacity
                        style={styles.checkbox}
                        onPress={() => toggleItemCompletion(item.id)}
                      >
                        {item.completed && <Text style={styles.checkmark}>✓</Text>}
                      </TouchableOpacity>
                      
                      <View style={styles.itemDetails}>
                        <View style={styles.itemHeader}>
                          <Text style={styles.itemName}>{item.name}</Text>
                          <Text style={styles.itemAmount}>{item.amount}</Text>
                        </View>
                        <View style={styles.itemTags}>
                          <View style={styles.categoryTag}>
                            <Text style={styles.categoryTagText}>{item.category}</Text>
                          </View>
                          {bestPrice && bestStore && (
                            <View style={styles.priceTag}>
                              <Text style={styles.priceTagText}>
                                💰 {bestStore.store} €{bestPrice.toFixed(2)}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                      
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => removeItem(item.id)}
                      >
                        <Text style={styles.removeButtonText}>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )
              })}
            </View>
          )}

          {/* Completed Items */}
          {completedItems.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>✅ Completed ({completedItems.length})</Text>
                <TouchableOpacity style={styles.clearButton} onPress={clearCompletedItems}>
                  <Text style={styles.clearButtonText}>Clear All</Text>
                </TouchableOpacity>
              </View>
              {completedItems.map((item) => (
                <View key={item.id} style={[styles.itemCard, styles.completedItemCard]}>
                  <View style={styles.itemContent}>
                    <TouchableOpacity
                      style={[styles.checkbox, styles.completedCheckbox]}
                      onPress={() => toggleItemCompletion(item.id)}
                    >
                      <Text style={styles.checkmark}>✓</Text>
                    </TouchableOpacity>
                    
                    <View style={styles.itemDetails}>
                      <View style={styles.itemHeader}>
                        <Text style={[styles.itemName, styles.completedItemName]}>{item.name}</Text>
                        <Text style={[styles.itemAmount, styles.completedItemAmount]}>{item.amount}</Text>
                      </View>
                      <View style={styles.itemTags}>
                        <View style={[styles.categoryTag, styles.completedCategoryTag]}>
                          <Text style={styles.categoryTagText}>{item.category}</Text>
                        </View>
                      </View>
                    </View>
                    
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeItem(item.id)}
                    >
                      <Text style={styles.removeButtonText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Empty State */}
          {filteredItems.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>🛒</Text>
              <Text style={styles.emptyStateTitle}>
                {searchTerm || selectedCategory !== 'All' ? 'No items found' : 'Your grocery list is empty'}
              </Text>
              <Text style={styles.emptyStateText}>
                {searchTerm || selectedCategory !== 'All' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Add items from recipes or create your own shopping list'
                }
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
      </View>
    </ScreenWrapper>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F0',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingTop: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  subtitle: {
    fontSize: 16,
    color: '#4A4A4A',
    marginBottom: 24,
    fontFamily: 'Inter',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
  },
  categoryContainer: {
    marginBottom: 16,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryButtonActive: {
    backgroundColor: '#6B8E23',
    borderColor: '#6B8E23',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4A4A4A',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#4A4A4A',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6B8E23',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  addForm: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  addFormTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  formInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 16,
    color: '#1A1A1A',
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  formButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addFormButton: {
    backgroundColor: '#6B8E23',
  },
  addFormButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A4A4A',
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Inter',
  },
  clearButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  clearButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  completedItemCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    opacity: 0.7,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  completedCheckbox: {
    backgroundColor: '#6B8E23',
    borderColor: '#6B8E23',
  },
  checkmark: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  itemDetails: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
  },
  completedItemName: {
    textDecorationLine: 'line-through',
    color: '#4A4A4A',
  },
  itemAmount: {
    fontSize: 14,
    color: '#4A4A4A',
  },
  completedItemAmount: {
    color: '#9CA3AF',
  },
  itemTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryTag: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  completedCategoryTag: {
    backgroundColor: '#F9FAFB',
    opacity: 0.6,
  },
  categoryTagText: {
    fontSize: 12,
    color: '#4A4A4A',
    fontWeight: '500',
  },
  priceTag: {
    backgroundColor: '#DCFCE7',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  priceTagText: {
    fontSize: 12,
    color: '#166534',
    fontWeight: '500',
  },
  removeButton: {
    padding: 8,
    marginLeft: 8,
  },
  removeButtonText: {
    fontSize: 20,
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
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#4A4A4A',
    textAlign: 'center',
    lineHeight: 24,
  },
  savingsCard: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderWidth: 1,
    borderColor: '#22C55E',
  },
  savingsNumber: {
    color: '#22C55E',
  },
  recommendationCard: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#6B8E23',
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  recommendationText: {
    fontSize: 14,
    color: '#4A4A4A',
  },
  suggestionsContainer: {
    marginBottom: 24,
  },
  suggestionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  suggestionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  hideSuggestions: {
    fontSize: 14,
    color: '#4A4A4A',
  },
  suggestionsScroll: {
    marginBottom: 8,
  },
  suggestionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    width: 160,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  suggestionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  suggestionReason: {
    fontSize: 12,
    color: '#4A4A4A',
    marginBottom: 8,
    lineHeight: 16,
  },
  suggestionPrice: {
    fontSize: 14,
    fontWeight: '500',
    color: '#059669',
    marginBottom: 8,
  },
  suggestionAddButton: {
    backgroundColor: '#6B8E23',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  suggestionAddText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  priceComparisonToggle: {
    backgroundColor: '#6B8E23',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  priceComparisonToggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  priceComparisonContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  priceComparisonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  priceComparisonTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  hidePrices: {
    fontSize: 14,
    color: '#4A4A4A',
  },
  storeFilterContainer: {
    marginBottom: 16,
  },
  storeFilterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  storeFilterButtonActive: {
    backgroundColor: '#6B8E23',
    borderColor: '#6B8E23',
  },
  storeFilterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4A4A4A',
  },
  storeFilterTextActive: {
    color: '#FFFFFF',
  },
  priceComparisonItems: {
    gap: 12,
  },
  priceComparisonItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  priceItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  priceGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  priceCell: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  bestPriceCell: {
    backgroundColor: '#DCFCE7',
    borderColor: '#22C55E',
  },
  storeName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4A4A4A',
    marginBottom: 4,
  },
  priceAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  bestPriceAmount: {
    color: '#059669',
  },
  priceUnit: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  singleStorePrice: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  singleStoreName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4A4A4A',
    marginBottom: 4,
  },
  singleStoreAmount: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  singleStoreUnit: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  comparisonSubtitle: {
    fontSize: 14,
    color: '#4A4A4A',
    marginBottom: 16,
    textAlign: 'center',
  },
  storeRankings: {
    gap: 12,
    marginBottom: 16,
  },
  storeRankingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  bestStoreCard: {
    backgroundColor: '#DCFCE7',
    borderColor: '#22C55E',
    borderWidth: 2,
  },
  storeRankingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  storeInfo: {
    flex: 1,
  },
  storeRankingName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  bestStoreName: {
    color: '#059669',
  },
  bestStoreLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#059669',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  storeAveragePrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  bestStorePrice: {
    color: '#059669',
  },
  storeDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  storeDetailText: {
    fontSize: 14,
    color: '#4A4A4A',
  },
  storeSavings: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  storeExtra: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
  },
  comparisonSummary: {
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#0EA5E9',
  },
  summaryText: {
    fontSize: 14,
    color: '#0C4A6E',
    textAlign: 'center',
    lineHeight: 20,
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
    backgroundColor: '#6B8E23',
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
    backgroundColor: '#6B8E23',
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