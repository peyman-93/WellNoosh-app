import React, { useState } from 'react'
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'

type DietType = 'mediterranean' | 'vegetarian' | 'vegan' | 'pescatarian' | 'paleo' | 'ketogenic' | 'balanced' | 'custom'

interface DietOption {
  id: DietType
  name: string
  description: string
  emoji: string
  popular?: boolean
  bgColor: string
}

const dietOptions: DietOption[] = [
  {
    id: 'mediterranean',
    name: 'Mediterranean',
    description: 'Fish, Olive Oil, Vegetables, Whole Grains',
    emoji: '🐟',
    popular: true,
    bgColor: '#FEF3C7',
  },
  {
    id: 'vegetarian',
    name: 'Vegetarian',
    description: 'Plant-Based with Dairy and Eggs',
    emoji: '🥗',
    popular: true,
    bgColor: '#D1FAE5',
  },
  {
    id: 'vegan',
    name: 'Vegan',
    description: 'Completely Plant-Based Nutrition',
    emoji: '🌱',
    bgColor: '#A7F3D0',
  },
  {
    id: 'pescatarian',
    name: 'Pescatarian',
    description: 'Vegetarian with Fish and Seafood',
    emoji: '🍤',
    bgColor: '#DBEAFE',
  },
  {
    id: 'paleo',
    name: 'Paleo',
    description: 'Whole Foods, No Processed Ingredients',
    emoji: '🥩',
    bgColor: '#FEE2E2',
  },
  {
    id: 'ketogenic',
    name: 'Ketogenic',
    description: 'High Fat, Very Low Carb Approach',
    emoji: '🥑',
    bgColor: '#F3E8FF',
  },
  {
    id: 'balanced',
    name: 'Balanced',
    description: 'Everything in Moderation',
    emoji: '⚖️',
    bgColor: '#E0F2FE',
  },
  {
    id: 'custom',
    name: 'Custom',
    description: 'Tell Me AI About My Preferences',
    emoji: '🎯',
    bgColor: '#FCE7F3',
  },
]

interface DietPreferencesScreenProps {
  navigation: any
}

export default function DietPreferencesScreen({ navigation }: DietPreferencesScreenProps) {
  const [selectedDiet, setSelectedDiet] = useState<DietType | null>(null)

  const handleDietSelect = (dietId: DietType) => {
    setSelectedDiet(dietId)
  }

  const handleContinue = () => {
    if (!selectedDiet) return
    console.log('Selected diet:', selectedDiet)
    navigation.navigate('Allergies')
  }

  const goBack = () => {
    navigation.goBack()
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={goBack}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>←</Text>
        </Pressable>
        
        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '33.33%' }]} />
          </View>
          <Text style={styles.stepText}>Step 2</Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>Diet Preferences</Text>
          <Text style={styles.subtitle}>
            What are Your Eating Habits?
          </Text>
          <Text style={styles.description}>
            Choose the Diet that Best Describes Your Preferences
          </Text>
        </View>

        {/* Diet Options Grid */}
        <View style={styles.optionsContainer}>
          {dietOptions.map((option) => (
            <Pressable
              key={option.id}
              style={[
                styles.optionCard,
                { backgroundColor: option.bgColor },
                selectedDiet === option.id && styles.selectedCard
              ]}
              onPress={() => handleDietSelect(option.id)}
            >
              {option.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularText}>Popular</Text>
                </View>
              )}
              
              <View style={styles.optionContent}>
                <Text style={styles.optionEmoji}>{option.emoji}</Text>
                <Text style={styles.optionName}>{option.name}</Text>
                <Text style={styles.optionDescription}>
                  {option.description}
                </Text>
              </View>

              {selectedDiet === option.id && (
                <View style={styles.checkmarkContainer}>
                  <Text style={styles.checkmark}>✓</Text>
                </View>
              )}
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        <Pressable 
          style={[styles.buttonContainer, !selectedDiet && styles.disabledButton]}
          onPress={handleContinue}
          disabled={!selectedDiet}
        >
          <LinearGradient
            colors={selectedDiet ? ['#10B981', '#3B82F6', '#8B5CF6'] : ['#E5E7EB', '#E5E7EB', '#E5E7EB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientButton}
          >
            <Text style={[styles.buttonText, !selectedDiet && styles.disabledButtonText]}>
              Continue
            </Text>
          </LinearGradient>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
    gap: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 18,
    color: '#6B7280',
  },
  progressContainer: {
    flex: 1,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 2,
  },
  stepText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 24,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  optionsContainer: {
    gap: 16,
  },
  optionCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  selectedCard: {
    borderColor: '#3B82F6',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  popularBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  popularText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  optionContent: {
    alignItems: 'center',
  },
  optionEmoji: {
    fontSize: 32,
    marginBottom: 12,
  },
  optionName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  optionDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  checkmarkContainer: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 16,
  },
  buttonContainer: {
    width: '100%',
  },
  disabledButton: {
    opacity: 0.6,
  },
  gradientButton: {
    height: 56,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  disabledButtonText: {
    color: '#6B7280',
  },
})