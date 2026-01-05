import React, { useState, useRef, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Dimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Camera, CameraView, CameraType } from 'expo-camera'
import * as ImagePicker from 'expo-image-picker'
import { useNavigation } from '@react-navigation/native'
import { useAuth } from '../src/context/supabase-provider'
import { supabase } from '../src/services/supabase'

const { width: screenWidth } = Dimensions.get('window')

interface NutritionInfo {
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number
  food_name: string
  serving_size: string
  confidence: number
}

type ScreenState = 'camera' | 'analyzing' | 'results'

export default function FoodDetectionScreen() {
  const navigation = useNavigation()
  const { session } = useAuth()
  const cameraRef = useRef<CameraView>(null)
  
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [screenState, setScreenState] = useState<ScreenState>('camera')
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [nutritionInfo, setNutritionInfo] = useState<NutritionInfo | null>(null)
  const [isLogging, setIsLogging] = useState(false)

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync()
      setHasPermission(status === 'granted')
    })()
  }, [])

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.7,
          base64: true,
        })
        if (photo) {
          setCapturedImage(photo.uri)
          analyzeFood(photo.uri)
        }
      } catch (error) {
        console.error('Error taking picture:', error)
        Alert.alert('Error', 'Failed to take picture')
      }
    }
  }

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      base64: true,
    })

    if (!result.canceled && result.assets[0]) {
      setCapturedImage(result.assets[0].uri)
      analyzeFood(result.assets[0].uri)
    }
  }

  const analyzeFood = async (imageUri: string) => {
    setScreenState('analyzing')
    
    try {
      // Simulated food detection - in production, this would call an AI service
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Mock nutrition data based on common foods
      const mockFoods: NutritionInfo[] = [
        { food_name: 'Grilled Chicken Salad', calories: 350, protein_g: 35, carbs_g: 15, fat_g: 18, fiber_g: 5, serving_size: '1 bowl', confidence: 0.92 },
        { food_name: 'Pasta with Tomato Sauce', calories: 450, protein_g: 12, carbs_g: 75, fat_g: 10, fiber_g: 4, serving_size: '1 plate', confidence: 0.88 },
        { food_name: 'Mixed Fruit Bowl', calories: 180, protein_g: 2, carbs_g: 45, fat_g: 0.5, fiber_g: 6, serving_size: '1 bowl', confidence: 0.95 },
        { food_name: 'Vegetable Stir Fry', calories: 280, protein_g: 8, carbs_g: 35, fat_g: 12, fiber_g: 7, serving_size: '1 plate', confidence: 0.85 },
        { food_name: 'Scrambled Eggs with Toast', calories: 380, protein_g: 18, carbs_g: 30, fat_g: 22, fiber_g: 2, serving_size: '1 serving', confidence: 0.90 },
      ]
      
      const randomFood = mockFoods[Math.floor(Math.random() * mockFoods.length)]
      setNutritionInfo(randomFood)
      setScreenState('results')
    } catch (error) {
      console.error('Error analyzing food:', error)
      Alert.alert('Error', 'Failed to analyze food. Please try again.')
      setScreenState('camera')
    }
  }

  const logMeal = async () => {
    if (!nutritionInfo || !session?.user?.id) return
    
    setIsLogging(true)
    
    try {
      const today = new Date().toISOString().split('T')[0]
      const hour = new Date().getHours()
      let mealSlot = 'snack'
      if (hour >= 5 && hour < 11) mealSlot = 'breakfast'
      else if (hour >= 11 && hour < 15) mealSlot = 'lunch'
      else if (hour >= 17 && hour < 21) mealSlot = 'dinner'
      
      const { error } = await supabase.from('meal_plans').insert({
        user_id: session.user.id,
        plan_date: today,
        meal_slot: mealSlot,
        custom_title: nutritionInfo.food_name,
        calories: nutritionInfo.calories,
        protein_g: nutritionInfo.protein_g,
        carbs_g: nutritionInfo.carbs_g,
        fat_g: nutritionInfo.fat_g,
        servings: 1,
        is_completed: true,
        notes: `Captured via food detection. Serving: ${nutritionInfo.serving_size}`,
      })
      
      if (error) throw error
      
      Alert.alert(
        'Meal Logged!',
        `${nutritionInfo.food_name} has been added to your daily nutrition.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      )
    } catch (error) {
      console.error('Error logging meal:', error)
      Alert.alert('Error', 'Failed to log meal. Please try again.')
    } finally {
      setIsLogging(false)
    }
  }

  const retake = () => {
    setCapturedImage(null)
    setNutritionInfo(null)
    setScreenState('camera')
  }

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6B8E23" />
      </View>
    )
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionIcon}>📷</Text>
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionText}>
            Please enable camera access in your device settings to use food detection.
          </Text>
          <TouchableOpacity style={styles.galleryButton} onPress={pickImage}>
            <Text style={styles.galleryButtonText}>Choose from Gallery</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  if (screenState === 'analyzing') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.analyzingContainer}>
          {capturedImage && (
            <Image source={{ uri: capturedImage }} style={styles.analyzingImage} />
          )}
          <View style={styles.analyzingOverlay}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.analyzingText}>Analyzing your food...</Text>
            <Text style={styles.analyzingSubtext}>Identifying ingredients and nutrition</Text>
          </View>
        </View>
      </SafeAreaView>
    )
  }

  if (screenState === 'results' && nutritionInfo) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView style={styles.resultsContainer} contentContainerStyle={styles.resultsContent}>
          <View style={styles.resultsHeader}>
            <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
            <Text style={styles.resultsTitle}>Food Detected</Text>
            <View style={{ width: 40 }} />
          </View>

          {capturedImage && (
            <Image source={{ uri: capturedImage }} style={styles.resultImage} />
          )}

          <View style={styles.foodInfoCard}>
            <Text style={styles.foodName}>{nutritionInfo.food_name}</Text>
            <View style={styles.confidenceBadge}>
              <Text style={styles.confidenceText}>
                {Math.round(nutritionInfo.confidence * 100)}% match
              </Text>
            </View>
            <Text style={styles.servingSize}>{nutritionInfo.serving_size}</Text>
          </View>

          <View style={styles.nutritionCard}>
            <Text style={styles.nutritionTitle}>Nutrition Facts</Text>
            
            <View style={styles.caloriesRow}>
              <Text style={styles.caloriesLabel}>Calories</Text>
              <Text style={styles.caloriesValue}>{nutritionInfo.calories}</Text>
            </View>

            <View style={styles.macrosGrid}>
              <View style={styles.macroItem}>
                <View style={[styles.macroCircle, { backgroundColor: '#4CAF50' }]}>
                  <Text style={styles.macroValue}>{nutritionInfo.protein_g}g</Text>
                </View>
                <Text style={styles.macroLabel}>Protein</Text>
              </View>
              <View style={styles.macroItem}>
                <View style={[styles.macroCircle, { backgroundColor: '#FF9800' }]}>
                  <Text style={styles.macroValue}>{nutritionInfo.carbs_g}g</Text>
                </View>
                <Text style={styles.macroLabel}>Carbs</Text>
              </View>
              <View style={styles.macroItem}>
                <View style={[styles.macroCircle, { backgroundColor: '#F44336' }]}>
                  <Text style={styles.macroValue}>{nutritionInfo.fat_g}g</Text>
                </View>
                <Text style={styles.macroLabel}>Fat</Text>
              </View>
              <View style={styles.macroItem}>
                <View style={[styles.macroCircle, { backgroundColor: '#9C27B0' }]}>
                  <Text style={styles.macroValue}>{nutritionInfo.fiber_g}g</Text>
                </View>
                <Text style={styles.macroLabel}>Fiber</Text>
              </View>
            </View>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.retakeButton} onPress={retake}>
              <Text style={styles.retakeButtonText}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.logButton, isLogging && styles.logButtonDisabled]} 
              onPress={logMeal}
              disabled={isLogging}
            >
              {isLogging ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.logButtonText}>Log This Meal</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    )
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back">
        <SafeAreaView style={styles.cameraOverlay}>
          <View style={styles.cameraHeader}>
            <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
            <Text style={styles.cameraTitle}>Capture Your Food</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.cameraGuide}>
            <View style={styles.cameraFrame} />
            <Text style={styles.cameraGuideText}>Position your food in the frame</Text>
          </View>

          <View style={styles.cameraControls}>
            <TouchableOpacity style={styles.galleryIconButton} onPress={pickImage}>
              <Text style={styles.galleryIconText}>🖼️</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
            <View style={{ width: 50 }} />
          </View>
        </SafeAreaView>
      </CameraView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cameraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '300',
  },
  cameraTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  cameraGuide: {
    alignItems: 'center',
  },
  cameraFrame: {
    width: screenWidth - 80,
    height: screenWidth - 80,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 24,
    borderStyle: 'dashed',
  },
  cameraGuideText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginTop: 16,
    opacity: 0.8,
  },
  cameraControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 40,
    paddingHorizontal: 40,
  },
  galleryIconButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryIconText: {
    fontSize: 24,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#FAF7F0',
  },
  permissionIcon: {
    fontSize: 64,
    marginBottom: 24,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: '#6B6B6B',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  galleryButton: {
    backgroundColor: '#6B8E23',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  galleryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  backButtonText: {
    color: '#6B8E23',
    fontSize: 16,
    fontWeight: '600',
  },
  analyzingContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  analyzingImage: {
    flex: 1,
    width: '100%',
  },
  analyzingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  analyzingText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    marginTop: 24,
  },
  analyzingSubtext: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    marginTop: 8,
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: '#FAF7F0',
  },
  resultsContent: {
    paddingBottom: 40,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  resultImage: {
    width: '100%',
    height: 250,
    backgroundColor: '#E0E0E0',
  },
  foodInfoCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  foodName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  confidenceBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  confidenceText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '600',
  },
  servingSize: {
    color: '#6B6B6B',
    fontSize: 14,
    marginTop: 8,
  },
  nutritionCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  nutritionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  caloriesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  caloriesLabel: {
    fontSize: 16,
    color: '#6B6B6B',
  },
  caloriesValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  macrosGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  macroItem: {
    alignItems: 'center',
  },
  macroCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  macroValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  macroLabel: {
    fontSize: 12,
    color: '#6B6B6B',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  retakeButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  retakeButtonText: {
    color: '#1A1A1A',
    fontSize: 16,
    fontWeight: '600',
  },
  logButton: {
    flex: 2,
    backgroundColor: '#6B8E23',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  logButtonDisabled: {
    opacity: 0.7,
  },
  logButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
})
