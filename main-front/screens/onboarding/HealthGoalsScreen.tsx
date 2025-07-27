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
import { useUserData } from '../../src/context/user-data-provider'

const healthGoals = [
  { id: 'lose-weight', name: 'Lose Weight', emoji: '📉', bgColor: '#FEE2E2' },
  { id: 'gain-weight', name: 'Gain Weight', emoji: '📈', bgColor: '#D1FAE5' },
  { id: 'maintain-weight', name: 'Maintain Weight', emoji: '⚖️', bgColor: '#DBEAFE' },
  { id: 'build-muscle', name: 'Build Muscle', emoji: '💪', bgColor: '#EDE9FE' },
  { id: 'improve-energy', name: 'Improve Energy', emoji: '⚡', bgColor: '#FEF3C7' },
  { id: 'better-digestion', name: 'Better Digestion', emoji: '🫄', bgColor: '#D1FAE5' },
  { id: 'reduce-inflammation', name: 'Reduce Inflammation', emoji: '🌿', bgColor: '#ECFDF5' },
  { id: 'heart-health', name: 'Heart Health', emoji: '❤️', bgColor: '#FEE2E2' },
  { id: 'better-sleep', name: 'Better Sleep', emoji: '😴', bgColor: '#EDE9FE' },
  { id: 'general-wellness', name: 'General Wellness', emoji: '🌟', bgColor: '#FEF3C7' },
]

interface HealthGoalsScreenProps {
  navigation: any
}

export default function HealthGoalsScreen({ navigation }: HealthGoalsScreenProps) {
  const [selectedGoals, setSelectedGoals] = useState<string[]>([])
  const { updateUserData } = useUserData()

  const handleGoalToggle = (goalId: string) => {
    if (selectedGoals.includes(goalId)) {
      setSelectedGoals(selectedGoals.filter(id => id !== goalId))
    } else {
      setSelectedGoals([...selectedGoals, goalId])
    }
  }

  const handleContinue = async () => {
    console.log('Selected health goals:', selectedGoals)
    
    try {
      // Save health goals data to UserDataContext
      await updateUserData({
        healthGoals: selectedGoals
      })
      console.log('📚 HealthGoalsScreen: Saved health goals data:', selectedGoals)
    } catch (error) {
      console.error('📚 HealthGoalsScreen: Error saving health goals:', error)
    }
    
    navigation.navigate('CookingPreferences')
  }

  const goBack = () => {
    navigation.goBack()
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={goBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </Pressable>
        
        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '83.33%' }]} />
          </View>
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.titleSection}>
          <View style={styles.iconContainer}>
            <Text style={styles.iconEmoji}>🎯</Text>
          </View>
          <Text style={styles.title}>Health Goals</Text>
          <Text style={styles.subtitle}>
            What are your main health objectives?
          </Text>
          <Text style={styles.description}>
            Select your primary health goals (you can choose multiple)
          </Text>
        </View>

        {/* Health Goals Grid */}
        <View style={styles.optionsContainer}>
          {healthGoals.map((goal) => (
            <Pressable
              key={goal.id}
              style={[
                styles.optionCard,
                { backgroundColor: goal.bgColor },
                selectedGoals.includes(goal.id) && styles.selectedCard
              ]}
              onPress={() => handleGoalToggle(goal.id)}
            >
              <View style={styles.optionContent}>
                <Text style={styles.optionEmoji}>{goal.emoji}</Text>
                <Text style={styles.optionName}>{goal.name}</Text>
              </View>

              {selectedGoals.includes(goal.id) && (
                <View style={styles.checkmarkContainer}>
                  <Text style={styles.checkmark}>✓</Text>
                </View>
              )}
            </Pressable>
          ))}
        </View>

        {/* Selected Goals Summary */}
        {selectedGoals.length > 0 && (
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryTitle}>
              Selected Goals ({selectedGoals.length})
            </Text>
            <View style={styles.selectedGoalsContainer}>
              {selectedGoals.map((goalId) => {
                const goal = healthGoals.find(g => g.id === goalId)
                return (
                  <View key={goalId} style={styles.selectedGoalChip}>
                    <Text style={styles.selectedGoalEmoji}>{goal?.emoji}</Text>
                    <Text style={styles.selectedGoalText}>{goal?.name}</Text>
                  </View>
                )
              })}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        <Pressable 
          style={styles.buttonContainer}
          onPress={handleContinue}
        >
          <LinearGradient
            colors={['#10B981', '#3B82F6', '#8B5CF6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientButton}
          >
            <Text style={styles.buttonText}>Continue</Text>
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
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  iconEmoji: {
    fontSize: 40,
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
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  optionCard: {
    width: '48%',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
    alignItems: 'center',
  },
  selectedCard: {
    borderColor: '#3B82F6',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  optionContent: {
    alignItems: 'center',
  },
  optionEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  optionName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    textAlign: 'center',
  },
  checkmarkContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  summaryContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  selectedGoalsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectedGoalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  selectedGoalEmoji: {
    fontSize: 12,
  },
  selectedGoalText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1F2937',
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 16,
  },
  buttonContainer: {
    width: '100%',
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
})