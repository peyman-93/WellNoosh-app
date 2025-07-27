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

const cookingSkills = [
  {
    id: 'beginner',
    name: 'Beginner',
    description: 'Basic cooking skills',
    detail: 'Simple recipes, minimal prep time',
    emoji: '👶',
    bgColor: '#FEE2E2',
  },
  {
    id: 'intermediate',
    name: 'Intermediate',
    description: 'Comfortable with recipes',
    detail: 'Following recipes, basic techniques',
    emoji: '👨‍🍳',
    bgColor: '#FEF3C7',
  },
  {
    id: 'advanced',
    name: 'Advanced',
    description: 'Creative cooking',
    detail: 'Experimenting, complex dishes',
    emoji: '🧑‍🍳',
    bgColor: '#D1FAE5',
  },
  {
    id: 'expert',
    name: 'Expert',
    description: 'Professional level',
    detail: 'Master chef skills, innovation',
    emoji: '👨‍🍳',
    bgColor: '#DBEAFE',
  },
]

const mealPreferences = [
  {
    id: 'quick-easy',
    name: 'Quick & Easy',
    description: '15-30 minutes',
    emoji: '⚡',
    bgColor: '#FEF3C7',
  },
  {
    id: 'moderate',
    name: 'Moderate',
    description: '30-60 minutes',
    emoji: '⏰',
    bgColor: '#DBEAFE',
  },
  {
    id: 'elaborate',
    name: 'Elaborate',
    description: '60+ minutes',
    emoji: '🎨',
    bgColor: '#EDE9FE',
  },
  {
    id: 'meal-prep',
    name: 'Meal Prep Friendly',
    description: 'Batch cooking',
    emoji: '📦',
    bgColor: '#D1FAE5',
  },
  {
    id: 'one-pot',
    name: 'One-Pot Meals',
    description: 'Minimal cleanup',
    emoji: '🍲',
    bgColor: '#FCE7F3',
  },
]

interface CookingPreferencesScreenProps {
  navigation: any
}

export default function CookingPreferencesScreen({ navigation }: CookingPreferencesScreenProps) {
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null)
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([])
  const { updateUserData } = useUserData()

  const handleSkillSelect = (skillId: string) => {
    setSelectedSkill(skillId)
  }

  const handlePreferenceToggle = (preferenceId: string) => {
    if (selectedPreferences.includes(preferenceId)) {
      setSelectedPreferences(selectedPreferences.filter(id => id !== preferenceId))
    } else {
      setSelectedPreferences([...selectedPreferences, preferenceId])
    }
  }

  const handleContinue = async () => {
    console.log('Selected cooking skill:', selectedSkill)
    console.log('Selected meal preferences:', selectedPreferences)
    
    try {
      // Save cooking preferences data to UserDataContext
      await updateUserData({
        cookingSkill: selectedSkill,
        mealPreferences: selectedPreferences
      })
      console.log('📚 CookingPreferencesScreen: Saved cooking data:', { 
        cookingSkill: selectedSkill, 
        mealPreferences: selectedPreferences 
      })
    } catch (error) {
      console.error('📚 CookingPreferencesScreen: Error saving cooking preferences:', error)
    }
    
    navigation.navigate('OnboardingComplete')
  }

  const goBack = () => {
    navigation.goBack()
  }

  const canContinue = selectedSkill && selectedPreferences.length > 0

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
            <View style={[styles.progressFill, { width: '100%' }]} />
          </View>
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.titleSection}>
          <View style={styles.iconContainer}>
            <Text style={styles.iconEmoji}>🍳</Text>
          </View>
          <Text style={styles.title}>Cooking Preferences</Text>
          <Text style={styles.subtitle}>
            What's your cooking skill level and meal preference?
          </Text>
          <Text style={styles.description}>
            Help us recommend the right recipes for you
          </Text>
        </View>

        {/* Cooking Skill Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Cooking Skill Level</Text>
          <View style={styles.skillsContainer}>
            {cookingSkills.map((skill) => (
              <Pressable
                key={skill.id}
                style={[
                  styles.skillCard,
                  { backgroundColor: skill.bgColor },
                  selectedSkill === skill.id && styles.selectedCard
                ]}
                onPress={() => handleSkillSelect(skill.id)}
              >
                <View style={styles.skillContent}>
                  <Text style={styles.skillEmoji}>{skill.emoji}</Text>
                  <View style={styles.skillTextContainer}>
                    <Text style={styles.skillName}>{skill.name}</Text>
                    <Text style={styles.skillDescription}>{skill.description}</Text>
                    <Text style={styles.skillDetail}>{skill.detail}</Text>
                  </View>
                </View>

                {selectedSkill === skill.id && (
                  <View style={styles.checkmarkContainer}>
                    <Text style={styles.checkmark}>✓</Text>
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        </View>

        {/* Meal Preferences Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Meal Preparation Time</Text>
          <View style={styles.preferencesContainer}>
            {mealPreferences.map((preference) => (
              <Pressable
                key={preference.id}
                style={[
                  styles.preferenceCard,
                  { backgroundColor: preference.bgColor },
                  selectedPreferences.includes(preference.id) && styles.selectedCard
                ]}
                onPress={() => handlePreferenceToggle(preference.id)}
              >
                <View style={styles.preferenceContent}>
                  <Text style={styles.preferenceEmoji}>{preference.emoji}</Text>
                  <Text style={styles.preferenceName}>{preference.name}</Text>
                  <Text style={styles.preferenceDescription}>
                    {preference.description}
                  </Text>
                </View>

                {selectedPreferences.includes(preference.id) && (
                  <View style={styles.checkmarkContainer}>
                    <Text style={styles.checkmark}>✓</Text>
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        <Pressable 
          style={[styles.buttonContainer, !canContinue && styles.disabledButton]}
          onPress={handleContinue}
          disabled={!canContinue}
        >
          <LinearGradient
            colors={canContinue ? ['#10B981', '#3B82F6', '#8B5CF6'] : ['#E5E7EB', '#E5E7EB', '#E5E7EB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientButton}
          >
            <Text style={[styles.buttonText, !canContinue && styles.disabledButtonText]}>
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
    backgroundColor: '#FEF3C7',
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
  sectionContainer: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  skillsContainer: {
    gap: 12,
  },
  skillCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  selectedCard: {
    borderColor: '#3B82F6',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  skillContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  skillEmoji: {
    fontSize: 24,
  },
  skillTextContainer: {
    flex: 1,
  },
  skillName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  skillDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 2,
  },
  skillDetail: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  preferencesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  preferenceCard: {
    width: '48%',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
    alignItems: 'center',
  },
  preferenceContent: {
    alignItems: 'center',
  },
  preferenceEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  preferenceName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 4,
  },
  preferenceDescription: {
    fontSize: 12,
    color: '#6B7280',
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