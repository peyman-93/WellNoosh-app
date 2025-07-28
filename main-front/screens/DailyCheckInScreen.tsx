import React, { useState } from 'react'
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Modal,
  SafeAreaView,
  Switch
} from 'react-native'
import { ScreenWrapper } from '../src/components/layout/ScreenWrapper'

interface DailyCheckInScreenProps {
  onClose: () => void
}

interface CheckInData {
  // Physical Health
  weight: number
  waterIntake: number
  sleepHours: number
  exerciseMinutes: number
  
  // Lifestyle Factors
  smokingStatus: 'never' | 'former' | 'occasional' | 'regular'
  alcoholIntake: number // drinks per week
  stressLevel: number
  energyLevel: number
  
  // Nutrition Goals
  dietaryGoal: 'maintain' | 'lose' | 'gain' | 'muscle'
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
  
  // Health Conditions
  hasConditions: boolean
  medicationsAffectAppetite: boolean
}

const activityLevels = [
  { id: 'sedentary', label: 'Sedentary', description: 'Little to no exercise', icon: '🛋️' },
  { id: 'light', label: 'Light', description: '1-3 days/week', icon: '🚶' },
  { id: 'moderate', label: 'Moderate', description: '3-5 days/week', icon: '🏃' },
  { id: 'active', label: 'Active', description: '6-7 days/week', icon: '💪' },
  { id: 'very_active', label: 'Very Active', description: '2x daily/intense', icon: '🏋️' }
]

const dietaryGoals = [
  { id: 'maintain', label: 'Maintain Weight', icon: '⚖️', color: '#6B8E23' },
  { id: 'lose', label: 'Lose Weight', icon: '📉', color: '#DC6B3F' },
  { id: 'gain', label: 'Gain Weight', icon: '📈', color: '#8BA654' },
  { id: 'muscle', label: 'Build Muscle', icon: '💪', color: '#E6A245' }
]

const smokingOptions = [
  { id: 'never', label: 'Never', icon: '🚫' },
  { id: 'former', label: 'Former Smoker', icon: '✋' },
  { id: 'occasional', label: 'Occasional', icon: '🟡' },
  { id: 'regular', label: 'Regular', icon: '🚬' }
]

export default function DailyCheckInScreen({ onClose }: DailyCheckInScreenProps) {
  const [data, setData] = useState<CheckInData>({
    weight: 70,
    waterIntake: 8,
    sleepHours: 7,
    exerciseMinutes: 30,
    smokingStatus: 'never',
    alcoholIntake: 2,
    stressLevel: 5,
    energyLevel: 7,
    dietaryGoal: 'maintain',
    activityLevel: 'moderate',
    hasConditions: false,
    medicationsAffectAppetite: false
  })

  const [currentSection, setCurrentSection] = useState(0)
  const sections = ['basics', 'lifestyle', 'goals', 'health']

  const handleSave = () => {
    // Save data logic here
    console.log('Saving check-in data:', data)
    onClose()
  }

  const renderBasicsSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Daily Basics</Text>
      <Text style={styles.sectionSubtitle}>Track your fundamental health metrics</Text>
      
      {/* Weight */}
      <View style={styles.metricCard}>
        <View style={styles.metricHeader}>
          <Text style={styles.metricIcon}>⚖️</Text>
          <Text style={styles.metricLabel}>Weight (kg)</Text>
        </View>
        <View style={styles.weightControls}>
          <TouchableOpacity
            onPress={() => setData(prev => ({ ...prev, weight: Math.max(30, prev.weight - 0.5) }))}
            style={styles.controlButton}
          >
            <Text style={styles.controlButtonText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.weightValue}>{data.weight}</Text>
          <TouchableOpacity
            onPress={() => setData(prev => ({ ...prev, weight: Math.min(200, prev.weight + 0.5) }))}
            style={styles.controlButton}
          >
            <Text style={styles.controlButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Sleep */}
      <View style={styles.metricCard}>
        <View style={styles.metricHeader}>
          <Text style={styles.metricIcon}>😴</Text>
          <Text style={styles.metricLabel}>Sleep Hours</Text>
        </View>
        <View style={styles.weightControls}>
          <TouchableOpacity
            onPress={() => setData(prev => ({ ...prev, sleepHours: Math.max(0, prev.sleepHours - 0.5) }))}
            style={styles.controlButton}
          >
            <Text style={styles.controlButtonText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.weightValue}>{data.sleepHours}h</Text>
          <TouchableOpacity
            onPress={() => setData(prev => ({ ...prev, sleepHours: Math.min(12, prev.sleepHours + 0.5) }))}
            style={styles.controlButton}
          >
            <Text style={styles.controlButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Exercise */}
      <View style={styles.metricCard}>
        <View style={styles.metricHeader}>
          <Text style={styles.metricIcon}>🏃</Text>
          <Text style={styles.metricLabel}>Exercise Minutes</Text>
        </View>
        <View style={styles.weightControls}>
          <TouchableOpacity
            onPress={() => setData(prev => ({ ...prev, exerciseMinutes: Math.max(0, prev.exerciseMinutes - 15) }))}
            style={styles.controlButton}
          >
            <Text style={styles.controlButtonText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.weightValue}>{data.exerciseMinutes}min</Text>
          <TouchableOpacity
            onPress={() => setData(prev => ({ ...prev, exerciseMinutes: Math.min(300, prev.exerciseMinutes + 15) }))}
            style={styles.controlButton}
          >
            <Text style={styles.controlButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )

  const renderLifestyleSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Lifestyle Factors</Text>
      <Text style={styles.sectionSubtitle}>These factors affect your nutritional needs</Text>
      
      {/* Smoking Status */}
      <View style={styles.metricCard}>
        <Text style={styles.cardTitle}>Smoking Status</Text>
        <View style={styles.optionsGrid}>
          {smokingOptions.map(option => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionButton,
                data.smokingStatus === option.id && styles.optionButtonSelected
              ]}
              onPress={() => setData(prev => ({ ...prev, smokingStatus: option.id as any }))}
            >
              <Text style={styles.optionIcon}>{option.icon}</Text>
              <Text style={[
                styles.optionLabel,
                data.smokingStatus === option.id && styles.optionLabelSelected
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Alcohol Intake */}
      <View style={styles.metricCard}>
        <View style={styles.metricHeader}>
          <Text style={styles.metricIcon}>🍷</Text>
          <Text style={styles.metricLabel}>Alcohol (drinks/week)</Text>
        </View>
        <View style={styles.weightControls}>
          <TouchableOpacity
            onPress={() => setData(prev => ({ ...prev, alcoholIntake: Math.max(0, prev.alcoholIntake - 1) }))}
            style={styles.controlButton}
          >
            <Text style={styles.controlButtonText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.weightValue}>{data.alcoholIntake}</Text>
          <TouchableOpacity
            onPress={() => setData(prev => ({ ...prev, alcoholIntake: Math.min(21, prev.alcoholIntake + 1) }))}
            style={styles.controlButton}
          >
            <Text style={styles.controlButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stress Level */}
      <View style={styles.metricCard}>
        <Text style={styles.cardTitle}>Stress Level (1-10)</Text>
        <View style={styles.scaleButtons}>
          {[1,2,3,4,5,6,7,8,9,10].map(level => (
            <TouchableOpacity
              key={level}
              style={[
                styles.scaleButton,
                data.stressLevel === level && styles.scaleButtonSelected
              ]}
              onPress={() => setData(prev => ({ ...prev, stressLevel: level }))}
            >
              <Text style={[
                styles.scaleButtonText,
                data.stressLevel === level && styles.scaleButtonTextSelected
              ]}>
                {level}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Energy Level */}
      <View style={styles.metricCard}>
        <Text style={styles.cardTitle}>Energy Level (1-10)</Text>
        <View style={styles.scaleButtons}>
          {[1,2,3,4,5,6,7,8,9,10].map(level => (
            <TouchableOpacity
              key={level}
              style={[
                styles.scaleButton,
                data.energyLevel === level && styles.scaleButtonSelected
              ]}
              onPress={() => setData(prev => ({ ...prev, energyLevel: level }))}
            >
              <Text style={[
                styles.scaleButtonText,
                data.energyLevel === level && styles.scaleButtonTextSelected
              ]}>
                {level}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  )

  const renderGoalsSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Health Goals</Text>
      <Text style={styles.sectionSubtitle}>Help us personalize your nutrition plan</Text>
      
      {/* Dietary Goal */}
      <View style={styles.metricCard}>
        <Text style={styles.cardTitle}>Primary Goal</Text>
        <View style={styles.goalsGrid}>
          {dietaryGoals.map(goal => (
            <TouchableOpacity
              key={goal.id}
              style={[
                styles.goalButton,
                data.dietaryGoal === goal.id && styles.goalButtonSelected,
                { borderColor: goal.color }
              ]}
              onPress={() => setData(prev => ({ ...prev, dietaryGoal: goal.id as any }))}
            >
              <Text style={styles.goalIcon}>{goal.icon}</Text>
              <Text style={[
                styles.goalLabel,
                data.dietaryGoal === goal.id && { color: goal.color }
              ]}>
                {goal.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Activity Level */}
      <View style={styles.metricCard}>
        <Text style={styles.cardTitle}>Activity Level</Text>
        <View style={styles.activityList}>
          {activityLevels.map(level => (
            <TouchableOpacity
              key={level.id}
              style={[
                styles.activityButton,
                data.activityLevel === level.id && styles.activityButtonSelected
              ]}
              onPress={() => setData(prev => ({ ...prev, activityLevel: level.id as any }))}
            >
              <Text style={styles.activityIcon}>{level.icon}</Text>
              <View style={styles.activityInfo}>
                <Text style={[
                  styles.activityLabel,
                  data.activityLevel === level.id && styles.activityLabelSelected
                ]}>
                  {level.label}
                </Text>
                <Text style={styles.activityDescription}>{level.description}</Text>
              </View>
              {data.activityLevel === level.id && (
                <Text style={styles.checkIcon}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  )

  const renderHealthSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Health Factors</Text>
      <Text style={styles.sectionSubtitle}>Important for accurate nutrition tracking</Text>
      
      {/* Health Conditions */}
      <View style={styles.metricCard}>
        <View style={styles.switchRow}>
          <View>
            <Text style={styles.switchLabel}>Health Conditions</Text>
            <Text style={styles.switchDescription}>Diabetes, thyroid, heart conditions, etc.</Text>
          </View>
          <Switch
            value={data.hasConditions}
            onValueChange={(value) => setData(prev => ({ ...prev, hasConditions: value }))}
            trackColor={{ false: '#E0E0E0', true: '#6B8E23' }}
            thumbColor={'#FFFFFF'}
          />
        </View>
      </View>

      {/* Medications */}
      <View style={styles.metricCard}>
        <View style={styles.switchRow}>
          <View>
            <Text style={styles.switchLabel}>Appetite-Affecting Medications</Text>
            <Text style={styles.switchDescription}>Medications that change hunger or metabolism</Text>
          </View>
          <Switch
            value={data.medicationsAffectAppetite}
            onValueChange={(value) => setData(prev => ({ ...prev, medicationsAffectAppetite: value }))}
            trackColor={{ false: '#E0E0E0', true: '#6B8E23' }}
            thumbColor={'#FFFFFF'}
          />
        </View>
      </View>

      <View style={styles.aiInsightCard}>
        <Text style={styles.aiInsightIcon}>🤖</Text>
        <Text style={styles.aiInsightTitle}>AI Nutrition Insights</Text>
        <Text style={styles.aiInsightText}>
          Based on your responses, our AI will provide personalized calorie recommendations, 
          suggest optimal meal timing, and adjust nutrient targets for your lifestyle and goals.
        </Text>
      </View>
    </View>
  )

  const renderCurrentSection = () => {
    switch (sections[currentSection]) {
      case 'basics': return renderBasicsSection()
      case 'lifestyle': return renderLifestyleSection()
      case 'goals': return renderGoalsSection()
      case 'health': return renderHealthSection()
      default: return renderBasicsSection()
    }
  }

  const getSectionProgress = () => ((currentSection + 1) / sections.length) * 100

  return (
    <Modal
      visible={true}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <ScreenWrapper>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Reflect</Text>
            <Text style={styles.headerSubtitle}>Personalize your wellness journey</Text>
          </View>

          <View style={styles.headerSpacer} />
        </View>

        {/* Progress */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${getSectionProgress()}%` }]} />
          </View>
          <Text style={styles.progressText}>{currentSection + 1} of {sections.length}</Text>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {renderCurrentSection()}
        </ScrollView>

        {/* Navigation */}
        <View style={styles.navigation}>
          <TouchableOpacity
            onPress={() => currentSection === 0 ? onClose() : setCurrentSection(prev => prev - 1)}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>
              {currentSection === 0 ? 'Cancel' : 'Back'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => currentSection === sections.length - 1 ? handleSave() : setCurrentSection(prev => prev + 1)}
            style={styles.nextButton}
          >
            <Text style={styles.nextButtonText}>
              {currentSection === sections.length - 1 ? 'Complete' : 'Continue'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScreenWrapper>
    </Modal>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#4A4A4A',
    fontWeight: '600',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    fontFamily: 'Inter',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#4A4A4A',
    fontFamily: 'Inter',
    marginTop: 2,
  },
  headerSpacer: {
    width: 32,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6B8E23',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#4A4A4A',
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    fontFamily: 'Inter',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#4A4A4A',
    fontFamily: 'Inter',
    marginBottom: 32,
    lineHeight: 22,
  },
  metricCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  metricIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  metricLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Inter',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Inter',
    marginBottom: 16,
  },
  weightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6B8E23',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlButtonText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  weightValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    fontFamily: 'Inter',
    minWidth: 80,
    textAlign: 'center',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  optionButtonSelected: {
    borderColor: '#6B8E23',
    backgroundColor: '#F8FAF5',
  },
  optionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  optionLabelSelected: {
    color: '#6B8E23',
    fontWeight: '600',
  },
  scaleButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  scaleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  scaleButtonSelected: {
    borderColor: '#6B8E23',
    backgroundColor: '#6B8E23',
  },
  scaleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A4A4A',
    fontFamily: 'Inter',
  },
  scaleButtonTextSelected: {
    color: '#FFFFFF',
  },
  goalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  goalButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
  },
  goalButtonSelected: {
    backgroundColor: '#F8FAF5',
  },
  goalIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  goalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  activityList: {
    gap: 12,
  },
  activityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  activityButtonSelected: {
    borderColor: '#6B8E23',
    backgroundColor: '#F8FAF5',
  },
  activityIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  activityInfo: {
    flex: 1,
  },
  activityLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Inter',
  },
  activityLabelSelected: {
    color: '#6B8E23',
  },
  activityDescription: {
    fontSize: 14,
    color: '#4A4A4A',
    fontFamily: 'Inter',
    marginTop: 2,
  },
  checkIcon: {
    fontSize: 18,
    color: '#6B8E23',
    fontWeight: '700',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Inter',
  },
  switchDescription: {
    fontSize: 14,
    color: '#4A4A4A',
    fontFamily: 'Inter',
    marginTop: 4,
    maxWidth: 250,
  },
  aiInsightCard: {
    backgroundColor: '#E8F4FD',
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#4A90E2',
    alignItems: 'center',
    marginTop: 16,
  },
  aiInsightIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  aiInsightTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    fontFamily: 'Inter',
    marginBottom: 12,
    textAlign: 'center',
  },
  aiInsightText: {
    fontSize: 14,
    color: '#1A1A1A',
    fontFamily: 'Inter',
    lineHeight: 20,
    textAlign: 'center',
  },
  navigation: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  backButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A4A4A',
    fontFamily: 'Inter',
  },
  nextButton: {
    flex: 2,
    backgroundColor: '#6B8E23',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
})