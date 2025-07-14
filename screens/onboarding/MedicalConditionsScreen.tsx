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

const medicalConditions = [
  { id: 'diabetes', name: 'Diabetes', emoji: '🩺' },
  { id: 'high-blood-pressure', name: 'High Blood Pressure', emoji: '💓' },
  { id: 'high-cholesterol', name: 'High Cholesterol', emoji: '🧈' },
  { id: 'heart-disease', name: 'Heart Disease', emoji: '❤️' },
  { id: 'kidney-disease', name: 'Kidney Disease', emoji: '🫘' },
  { id: 'liver-disease', name: 'Liver Disease', emoji: '🫀' },
  { id: 'thyroid-issues', name: 'Thyroid Issues', emoji: '🦋' },
  { id: 'digestive-issues', name: 'Digestive Issues', emoji: '🫄' },
  { id: 'eating-disorder', name: 'Eating Disorder', emoji: '🧠' },
  { id: 'other', name: 'Other', emoji: '📋' },
  { id: 'none', name: 'None', emoji: '✅' },
]

interface MedicalConditionsScreenProps {
  navigation: any
}

export default function MedicalConditionsScreen({ navigation }: MedicalConditionsScreenProps) {
  const [selectedConditions, setSelectedConditions] = useState<string[]>([])
  const { updateUserData } = useUserData()

  const handleConditionToggle = (conditionId: string) => {
    if (conditionId === 'none') {
      // If "None" is selected, clear all other selections
      setSelectedConditions(['none'])
    } else {
      // If any other condition is selected, remove "None"
      const updatedConditions = selectedConditions.filter(id => id !== 'none')
      
      if (selectedConditions.includes(conditionId)) {
        setSelectedConditions(updatedConditions.filter(id => id !== conditionId))
      } else {
        setSelectedConditions([...updatedConditions, conditionId])
      }
    }
  }

  const handleContinue = async () => {
    console.log('Selected medical conditions:', selectedConditions)
    
    try {
      // Save medical conditions data to UserDataContext
      await updateUserData({
        medicalConditions: selectedConditions
      })
      console.log('📚 MedicalConditionsScreen: Saved medical conditions data:', selectedConditions)
    } catch (error) {
      console.error('📚 MedicalConditionsScreen: Error saving medical conditions:', error)
    }
    
    navigation.navigate('ActivityLevel')
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
            <View style={[styles.progressFill, { width: '50%' }]} />
          </View>
          <Text style={styles.stepText}>Step 3</Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.titleSection}>
          <View style={styles.iconContainer}>
            <Text style={styles.iconEmoji}>🏥</Text>
          </View>
          <Text style={styles.title}>Medical Conditions</Text>
          <Text style={styles.subtitle}>
            Any conditions we should consider for your nutrition plan?
          </Text>
          <Text style={styles.description}>
            This helps us provide better nutrition recommendations
          </Text>
        </View>

        {/* Medical Conditions Grid */}
        <View style={styles.optionsContainer}>
          {medicalConditions.map((condition) => (
            <Pressable
              key={condition.id}
              style={[
                styles.optionCard,
                selectedConditions.includes(condition.id) && styles.selectedCard
              ]}
              onPress={() => handleConditionToggle(condition.id)}
            >
              <View style={styles.optionContent}>
                <Text style={styles.optionEmoji}>{condition.emoji}</Text>
                <Text style={styles.optionName}>{condition.name}</Text>
              </View>

              {selectedConditions.includes(condition.id) && (
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
    backgroundColor: '#FEE2E2',
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
    backgroundColor: '#F9FAFB',
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