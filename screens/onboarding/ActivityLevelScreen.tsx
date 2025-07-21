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
import { useUserData } from '@/context/user-data-provider'

const activityLevels = [
  {
    id: 'sedentary',
    name: 'Sedentary',
    description: 'Little/no exercise',
    detail: 'Desk job, minimal physical activity',
    emoji: '🪑',
    bgColor: '#FEE2E2',
  },
  {
    id: 'lightly-active',
    name: 'Lightly Active',
    description: 'Light exercise 1-3 days/week',
    detail: 'Walking, light yoga, occasional workouts',
    emoji: '🚶',
    bgColor: '#FEF3C7',
  },
  {
    id: 'moderately-active',
    name: 'Moderately Active',
    description: 'Moderate exercise 3-5 days/week',
    detail: 'Regular gym sessions, sports, running',
    emoji: '🏃',
    bgColor: '#D1FAE5',
  },
  {
    id: 'very-active',
    name: 'Very Active',
    description: 'Hard exercise 6-7 days/week',
    detail: 'Daily intensive workouts, training',
    emoji: '💪',
    bgColor: '#DBEAFE',
  },
  {
    id: 'extremely-active',
    name: 'Extremely Active',
    description: 'Very hard exercise + physical job',
    detail: 'Professional athlete level activity',
    emoji: '🏋️',
    bgColor: '#EDE9FE',
  },
]

interface ActivityLevelScreenProps {
  navigation: any
}

export default function ActivityLevelScreen({ navigation }: ActivityLevelScreenProps) {
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null)
  const { updateUserData } = useUserData()

  const handleLevelSelect = (levelId: string) => {
    setSelectedLevel(levelId)
  }

  const handleContinue = async () => {
    if (!selectedLevel) return
    console.log('Selected activity level:', selectedLevel)
    
    try {
      // Save activity level data to UserDataContext
      await updateUserData({
        activityLevel: selectedLevel
      })
      console.log('📚 ActivityLevelScreen: Saved activity level data:', selectedLevel)
    } catch (error) {
      console.error('📚 ActivityLevelScreen: Error saving activity level:', error)
    }
    
    navigation.navigate('HealthGoals')
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
            <View style={[styles.progressFill, { width: '66.67%' }]} />
          </View>
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.titleSection}>
          <View style={styles.iconContainer}>
            <Text style={styles.iconEmoji}>🎯</Text>
          </View>
          <Text style={styles.title}>Activity Level</Text>
          <Text style={styles.subtitle}>
            How active are you?
          </Text>
          <Text style={styles.description}>
            This helps calculate your nutritional needs
          </Text>
        </View>

        {/* Activity Level Options */}
        <View style={styles.optionsContainer}>
          {activityLevels.map((level) => (
            <Pressable
              key={level.id}
              style={[
                styles.optionCard,
                { backgroundColor: level.bgColor },
                selectedLevel === level.id && styles.selectedCard
              ]}
              onPress={() => handleLevelSelect(level.id)}
            >
              <View style={styles.optionContent}>
                <Text style={styles.optionEmoji}>{level.emoji}</Text>
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionName}>{level.name}</Text>
                  <Text style={styles.optionDescription}>{level.description}</Text>
                  <Text style={styles.optionDetail}>{level.detail}</Text>
                </View>
              </View>

              {selectedLevel === level.id && (
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
          style={[styles.buttonContainer, !selectedLevel && styles.disabledButton]}
          onPress={handleContinue}
          disabled={!selectedLevel}
        >
          <LinearGradient
            colors={selectedLevel ? ['#10B981', '#3B82F6', '#8B5CF6'] : ['#E5E7EB', '#E5E7EB', '#E5E7EB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientButton}
          >
            <Text style={[styles.buttonText, !selectedLevel && styles.disabledButtonText]}>
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
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#DBEAFE',
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
    gap: 16,
    marginBottom: 32,
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
    backgroundColor: 'rgba(59, 130, 246, 0.1) !important',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  optionEmoji: {
    fontSize: 32,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 2,
  },
  optionDetail: {
    fontSize: 12,
    color: '#9CA3AF',
    lineHeight: 16,
  },
  checkmarkContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
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