import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  Switch,
  ActivityIndicator
} from 'react-native'
import Slider from '@react-native-community/slider'
import { ScreenWrapper } from '../src/components/layout/ScreenWrapper'
import { useAuth } from '../src/context/supabase-provider'
import { supabase } from '../src/services/supabase'
import { WeightPicker } from '../src/components/WeightPicker'
import { SleepTimeEntry } from '../src/components/SleepTimeEntry'
import { ExerciseEntry } from '../src/components/ExerciseEntry'

interface DailyCheckInScreenProps {
  onClose: () => void
}

interface CheckInData {
  // Physical Health
  weight: number
  waterIntake: number
  sleepHours: number
  exerciseMinutes: number

  // Lifestyle Factors with sliders
  cigarettesPerDay: number // 0-30+
  alcoholDrinksPerWeek: number // 0-21+
  coffeeCupsPerDay: number // 0-10+
  stressLevel: number // 1-10
  energyLevel: number // 1-10
}

interface UserHealthProfile {
  id?: string
  user_id: string
  age?: number
  gender?: string
  weight_kg?: number
  height_cm?: number
  activity_level?: string
  cooking_skill?: string
  diet_style?: string
  allergies?: string[]
  medical_conditions?: string[]
  health_goals?: string[]
  target_weight_kg?: number
  timeline?: string
  bmi?: number
  daily_calorie_goal?: number
  created_at?: string
  updated_at?: string
}

// Removed unused constants - now using cleaner implementation

export default function DailyCheckInScreen({ onClose }: DailyCheckInScreenProps) {
  const { session } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingGoals, setEditingGoals] = useState(false)
  const [editingHealth, setEditingHealth] = useState(false)

  const [data, setData] = useState<CheckInData>({
    weight: 70,
    waterIntake: 8,
    sleepHours: 7,
    exerciseMinutes: 30,
    cigarettesPerDay: 0,
    alcoholDrinksPerWeek: 0,
    coffeeCupsPerDay: 2,
    stressLevel: 5,
    energyLevel: 7,
  })

  // User health profile from database
  const [userHealthProfile, setUserHealthProfile] = useState<UserHealthProfile>({
    user_id: session?.user?.id || '',
    health_goals: [],
    allergies: [],
    medical_conditions: [],
    diet_style: '',
    activity_level: '',
    cooking_skill: ''
  })

  const [currentSection, setCurrentSection] = useState(0)
  const sections = ['basics', 'lifestyle', 'health'] // Combined goals and health into one section

  // Load user health profile from database
  useEffect(() => {
    loadUserHealthProfile()
  }, [])

  const loadUserHealthProfile = async () => {
    if (!session?.user?.id) return

    try {
      setLoading(true)
      const { data: profile, error } = await supabase
        .from('user_health_profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading health profile:', error)
        return
      }

      if (profile) {
        setUserHealthProfile(profile)
        // Initialize weight from database
        if (profile.weight_kg) {
          setData(prev => ({ ...prev, weight: profile.weight_kg }))
        }
      }
    } catch (error) {
      console.error('Error loading health profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateHealthProfile = async (updates: Partial<UserHealthProfile>) => {
    if (!session?.user?.id) return

    try {
      setSaving(true)
      const { error } = await supabase
        .from('user_health_profiles')
        .upsert({
          ...userHealthProfile,
          ...updates,
          user_id: session.user.id,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      setUserHealthProfile(prev => ({ ...prev, ...updates }))
    } catch (error) {
      console.error('Error updating health profile:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleSave = async () => {
    // Save weight to user health profile
    if (data.weight !== userHealthProfile.weight_kg) {
      await updateHealthProfile({ weight_kg: data.weight })
    }

    // Save daily check-in data
    if (session?.user?.id) {
      try {
        const checkInData = {
          user_id: session.user.id,
          weight_kg: data.weight,
          water_intake: data.waterIntake,
          sleep_hours: data.sleepHours,
          exercise_minutes: data.exerciseMinutes,
          cigarettes_per_day: data.cigarettesPerDay,
          alcohol_drinks_per_week: data.alcoholDrinksPerWeek,
          coffee_cups_per_day: data.coffeeCupsPerDay,
          stress_level: data.stressLevel,
          energy_level: data.energyLevel,
          created_at: new Date().toISOString()
        }

        // Save to a daily_check_ins table (if exists) or create weight log
        const { error: checkInError } = await supabase
          .from('daily_check_ins')
          .insert(checkInData)

        if (checkInError && checkInError.code === '42P01') {
          // If daily_check_ins table doesn't exist, at least save weight
          const { error: weightError } = await supabase
            .from('weight_logs')
            .insert({
              user_id: session.user.id,
              weight_kg: data.weight,
              logged_at: new Date().toISOString()
            })

          if (weightError && weightError.code !== '42P01') {
            console.error('Error saving weight:', weightError)
          }
        }
      } catch (error) {
        console.error('Error saving check-in data:', error)
      }
    }

    console.log('Saving check-in data:', data)
    onClose()
  }

  // Update weight in real-time when changed
  const updateWeight = async (newWeight: number) => {
    setData(prev => ({ ...prev, weight: newWeight }))

    // Also update in database immediately
    if (session?.user?.id && newWeight !== userHealthProfile.weight_kg) {
      try {
        const { error } = await supabase
          .from('user_health_profiles')
          .upsert({
            user_id: session.user.id,
            weight_kg: newWeight,
            updated_at: new Date().toISOString()
          })

        if (!error) {
          setUserHealthProfile(prev => ({ ...prev, weight_kg: newWeight }))
        }
      } catch (error) {
        console.error('Error updating weight:', error)
      }
    }
  }

  const renderBasicsSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Daily Basics</Text>
      <Text style={styles.sectionSubtitle}>Track your fundamental health metrics</Text>

      {/* Weight */}
      <View style={styles.weightPickerCard}>
        <WeightPicker
          value={data.weight}
          onValueChange={updateWeight}
          minWeight={30}
          maxWeight={200}
        />
      </View>

      {/* Sleep & Exercise - Side by Side */}
      <View style={styles.compactRow}>
        <View style={styles.compactColumn}>
          <SleepTimeEntry
            value={data.sleepHours}
            onValueChange={(value) => setData(prev => ({ ...prev, sleepHours: value }))}
            minHours={4}
            maxHours={12}
          />
        </View>

        <View style={styles.compactColumn}>
          <ExerciseEntry
            value={data.exerciseMinutes}
            onValueChange={(value) => setData(prev => ({ ...prev, exerciseMinutes: value }))}
            minMinutes={0}
            maxMinutes={180}
          />
        </View>
      </View>
    </View>
  )

  const renderLifestyleSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Lifestyle Factors</Text>
      <Text style={styles.sectionSubtitle}>These factors affect your nutritional needs</Text>

      {/* Smoking - Cigarettes per day */}
      <View style={styles.metricCard}>
        <Text style={styles.cardTitle}>Cigarettes per day</Text>
        <View style={styles.sliderContainer}>
          <Text style={styles.sliderValue}>
            {data.cigarettesPerDay === 0 ? 'No smoking' :
             data.cigarettesPerDay >= 30 ? '30+ per day' :
             `${data.cigarettesPerDay} per day`}
          </Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={30}
            value={data.cigarettesPerDay}
            onValueChange={(value) => setData(prev => ({ ...prev, cigarettesPerDay: Math.round(value) }))}
            minimumTrackTintColor="#6B8E23"
            maximumTrackTintColor="#E0E0E0"
            thumbStyle={styles.sliderThumb}
          />
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>No smoking</Text>
            <Text style={styles.sliderLabel}>30+</Text>
          </View>
        </View>
      </View>

      {/* Alcohol - Drinks per week */}
      <View style={styles.metricCard}>
        <Text style={styles.cardTitle}>Alcohol drinks per week</Text>
        <View style={styles.sliderContainer}>
          <Text style={styles.sliderValue}>
            {data.alcoholDrinksPerWeek === 0 ? 'No alcohol' :
             data.alcoholDrinksPerWeek >= 21 ? '21+ per week' :
             `${data.alcoholDrinksPerWeek} per week`}
          </Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={21}
            value={data.alcoholDrinksPerWeek}
            onValueChange={(value) => setData(prev => ({ ...prev, alcoholDrinksPerWeek: Math.round(value) }))}
            minimumTrackTintColor="#6B8E23"
            maximumTrackTintColor="#E0E0E0"
            thumbStyle={styles.sliderThumb}
          />
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>None</Text>
            <Text style={styles.sliderLabel}>21+</Text>
          </View>
        </View>
      </View>

      {/* Coffee - Cups per day */}
      <View style={styles.metricCard}>
        <Text style={styles.cardTitle}>Coffee cups per day</Text>
        <View style={styles.sliderContainer}>
          <Text style={styles.sliderValue}>
            {data.coffeeCupsPerDay === 0 ? 'No coffee' :
             data.coffeeCupsPerDay >= 10 ? '10+ per day' :
             `${data.coffeeCupsPerDay} per day`}
          </Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={10}
            value={data.coffeeCupsPerDay}
            onValueChange={(value) => setData(prev => ({ ...prev, coffeeCupsPerDay: Math.round(value) }))}
            minimumTrackTintColor="#6B8E23"
            maximumTrackTintColor="#E0E0E0"
            thumbStyle={styles.sliderThumb}
          />
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>None</Text>
            <Text style={styles.sliderLabel}>10+</Text>
          </View>
        </View>
      </View>

      {/* Stress and Energy Section */}
      <View style={styles.separatorSection}>
        <Text style={styles.separatorTitle}>Wellness Levels</Text>

        {/* Stress Level */}
        <View style={styles.metricCard}>
          <Text style={styles.cardTitle}>Stress Level</Text>
          <View style={styles.sliderContainer}>
            <Text style={styles.sliderValue}>
              {data.stressLevel}/10 - {
                data.stressLevel <= 3 ? 'Low stress' :
                data.stressLevel <= 6 ? 'Moderate stress' :
                data.stressLevel <= 8 ? 'High stress' : 'Very high stress'
              }
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={10}
              value={data.stressLevel}
              onValueChange={(value) => setData(prev => ({ ...prev, stressLevel: Math.round(value) }))}
              minimumTrackTintColor="#6B8E23"
              maximumTrackTintColor="#E0E0E0"
              thumbStyle={styles.sliderThumb}
            />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabel}>Low</Text>
              <Text style={styles.sliderLabel}>High</Text>
            </View>
          </View>
        </View>

        {/* Energy Level */}
        <View style={styles.metricCard}>
          <Text style={styles.cardTitle}>Energy Level</Text>
          <View style={styles.sliderContainer}>
            <Text style={styles.sliderValue}>
              {data.energyLevel}/10 - {
                data.energyLevel <= 3 ? 'Low energy' :
                data.energyLevel <= 6 ? 'Moderate energy' :
                data.energyLevel <= 8 ? 'High energy' : 'Very high energy'
              }
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={10}
              value={data.energyLevel}
              onValueChange={(value) => setData(prev => ({ ...prev, energyLevel: Math.round(value) }))}
              minimumTrackTintColor="#6B8E23"
              maximumTrackTintColor="#E0E0E0"
              thumbStyle={styles.sliderThumb}
            />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabel}>Low</Text>
              <Text style={styles.sliderLabel}>High</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  )

  const renderGoalsSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Health Goals</Text>
      <Text style={styles.sectionSubtitle}>Your current goals from your profile</Text>

      <View style={styles.metricCard}>
        <View style={styles.summaryHeader}>
          <Text style={styles.cardTitle}>Current Health Goals</Text>
          <TouchableOpacity
            onPress={() => setEditingGoals(!editingGoals)}
            style={styles.editButton}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#6B8E23" />
            ) : (
              <Text style={styles.editButtonText}>
                {editingGoals ? 'Save' : 'Edit'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {!editingGoals ? (
          <View style={styles.summaryContent}>
            <Text style={styles.summaryText}>
              {userHealthProfile.health_goals?.length
                ? userHealthProfile.health_goals.join(', ')
                : 'No health goals set yet'
              }
            </Text>
          </View>
        ) : (
          <View style={styles.editContent}>
            {['Lose Weight', 'Gain Weight', 'Maintain Weight', 'Build Muscle', 'Improve Fitness', 'Eat Healthier'].map((goal) => (
              <TouchableOpacity
                key={goal}
                style={[
                  styles.goalOption,
                  userHealthProfile.health_goals?.includes(goal) && styles.goalOptionSelected
                ]}
                onPress={() => {
                  const currentGoals = userHealthProfile.health_goals || []
                  let updatedGoals = [...currentGoals]

                  if (currentGoals.includes(goal)) {
                    updatedGoals = updatedGoals.filter(g => g !== goal)
                  } else {
                    // Prevent selecting both lose weight and gain weight
                    if (goal === 'Lose Weight' && currentGoals.includes('Gain Weight')) {
                      updatedGoals = updatedGoals.filter(g => g !== 'Gain Weight')
                    } else if (goal === 'Gain Weight' && currentGoals.includes('Lose Weight')) {
                      updatedGoals = updatedGoals.filter(g => g !== 'Lose Weight')
                    }
                    updatedGoals.push(goal)
                  }

                  updateHealthProfile({ health_goals: updatedGoals })
                }}
              >
                <Text style={[
                  styles.goalOptionText,
                  userHealthProfile.health_goals?.includes(goal) && styles.goalOptionTextSelected
                ]}>
                  {goal}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </View>
  )

  const renderHealthSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Health Factors</Text>
      <Text style={styles.sectionSubtitle}>Your current health information from your profile</Text>

      {/* Diet Type */}
      <View style={styles.metricCard}>
        <View style={styles.summaryHeader}>
          <Text style={styles.cardTitle}>Diet & Lifestyle</Text>
          <TouchableOpacity
            onPress={() => setEditingHealth(!editingHealth)}
            style={styles.editButton}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#6B8E23" />
            ) : (
              <Text style={styles.editButtonText}>
                {editingHealth ? 'Save' : 'Edit'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {!editingHealth ? (
          <View style={styles.summaryContent}>
            <View style={styles.healthSummaryItem}>
              <Text style={styles.healthSummaryLabel}>Diet Style:</Text>
              <Text style={styles.healthSummaryValue}>
                {userHealthProfile.diet_style || 'Not specified'}
              </Text>
            </View>

            <View style={styles.healthSummaryItem}>
              <Text style={styles.healthSummaryLabel}>Activity Level:</Text>
              <Text style={styles.healthSummaryValue}>
                {userHealthProfile.activity_level || 'Not specified'}
              </Text>
            </View>

            <View style={styles.healthSummaryItem}>
              <Text style={styles.healthSummaryLabel}>Cooking Skill:</Text>
              <Text style={styles.healthSummaryValue}>
                {userHealthProfile.cooking_skill || 'Not specified'}
              </Text>
            </View>

            <View style={styles.healthSummaryItem}>
              <Text style={styles.healthSummaryLabel}>Allergies:</Text>
              <Text style={styles.healthSummaryValue}>
                {userHealthProfile.allergies?.length
                  ? userHealthProfile.allergies.join(', ')
                  : 'None'
                }
              </Text>
            </View>

            <View style={styles.healthSummaryItem}>
              <Text style={styles.healthSummaryLabel}>Medical Conditions:</Text>
              <Text style={styles.healthSummaryValue}>
                {userHealthProfile.medical_conditions?.length
                  ? userHealthProfile.medical_conditions.join(', ')
                  : 'None'
                }
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.editContent}>
            {/* Diet Style */}
            <View style={styles.editSection}>
              <Text style={styles.editSectionTitle}>Diet Style</Text>
              <View style={styles.optionsRow}>
                {['Vegetarian', 'Vegan', 'Pescatarian', 'Keto', 'Mediterranean', 'Paleo', 'No Restrictions'].map((diet) => (
                  <TouchableOpacity
                    key={diet}
                    style={[
                      styles.optionChip,
                      userHealthProfile.diet_style === diet && styles.optionChipSelected
                    ]}
                    onPress={() => updateHealthProfile({ diet_style: diet })}
                  >
                    <Text style={[
                      styles.optionChipText,
                      userHealthProfile.diet_style === diet && styles.optionChipTextSelected
                    ]}>
                      {diet}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Activity Level */}
            <View style={styles.editSection}>
              <Text style={styles.editSectionTitle}>Activity Level</Text>
              <View style={styles.optionsRow}>
                {['Sedentary', 'Light', 'Moderate', 'Active', 'Very Active'].map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.optionChip,
                      userHealthProfile.activity_level === level && styles.optionChipSelected
                    ]}
                    onPress={() => updateHealthProfile({ activity_level: level })}
                  >
                    <Text style={[
                      styles.optionChipText,
                      userHealthProfile.activity_level === level && styles.optionChipTextSelected
                    ]}>
                      {level}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Cooking Skill */}
            <View style={styles.editSection}>
              <Text style={styles.editSectionTitle}>Cooking Skill</Text>
              <View style={styles.optionsRow}>
                {['Beginner', 'Intermediate', 'Advanced', 'Expert'].map((skill) => (
                  <TouchableOpacity
                    key={skill}
                    style={[
                      styles.optionChip,
                      userHealthProfile.cooking_skill === skill && styles.optionChipSelected
                    ]}
                    onPress={() => updateHealthProfile({ cooking_skill: skill })}
                  >
                    <Text style={[
                      styles.optionChipText,
                      userHealthProfile.cooking_skill === skill && styles.optionChipTextSelected
                    ]}>
                      {skill}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}
      </View>
    </View>
  )

  const renderCombinedHealthSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Health Profile</Text>
      <Text style={styles.sectionSubtitle}>Your health goals and lifestyle information</Text>

      {/* Health Goals Section */}
      <View style={styles.metricCard}>
        <View style={styles.summaryHeader}>
          <Text style={styles.cardTitle}>Health Goals</Text>
          <TouchableOpacity
            onPress={() => setEditingGoals(!editingGoals)}
            style={styles.editButton}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#6B8E23" />
            ) : (
              <Text style={styles.editButtonText}>
                {editingGoals ? 'Save' : 'Edit'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {!editingGoals ? (
          <View style={styles.summaryContent}>
            <Text style={styles.summaryText}>
              {userHealthProfile.health_goals?.length
                ? userHealthProfile.health_goals.join(', ')
                : 'No health goals set yet'
              }
            </Text>
          </View>
        ) : (
          <View style={styles.editContent}>
            {['Lose Weight', 'Gain Weight', 'Maintain Weight', 'Build Muscle', 'Improve Fitness', 'Eat Healthier'].map((goal) => (
              <TouchableOpacity
                key={goal}
                style={[
                  styles.goalOption,
                  userHealthProfile.health_goals?.includes(goal) && styles.goalOptionSelected
                ]}
                onPress={() => {
                  const currentGoals = userHealthProfile.health_goals || []
                  let updatedGoals = [...currentGoals]

                  if (currentGoals.includes(goal)) {
                    updatedGoals = updatedGoals.filter(g => g !== goal)
                  } else {
                    // Prevent selecting both lose weight and gain weight
                    if (goal === 'Lose Weight' && currentGoals.includes('Gain Weight')) {
                      updatedGoals = updatedGoals.filter(g => g !== 'Gain Weight')
                    } else if (goal === 'Gain Weight' && currentGoals.includes('Lose Weight')) {
                      updatedGoals = updatedGoals.filter(g => g !== 'Lose Weight')
                    }
                    updatedGoals.push(goal)
                  }

                  updateHealthProfile({ health_goals: updatedGoals })
                }}
              >
                <Text style={[
                  styles.goalOptionText,
                  userHealthProfile.health_goals?.includes(goal) && styles.goalOptionTextSelected
                ]}>
                  {goal}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Health Factors Section */}
      <View style={styles.metricCard}>
        <View style={styles.summaryHeader}>
          <Text style={styles.cardTitle}>Diet & Lifestyle</Text>
          <TouchableOpacity
            onPress={() => setEditingHealth(!editingHealth)}
            style={styles.editButton}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#6B8E23" />
            ) : (
              <Text style={styles.editButtonText}>
                {editingHealth ? 'Save' : 'Edit'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {!editingHealth ? (
          <View style={styles.summaryContent}>
            <View style={styles.healthSummaryItem}>
              <Text style={styles.healthSummaryLabel}>Diet Style:</Text>
              <Text style={styles.healthSummaryValue}>
                {userHealthProfile.diet_style || 'Not specified'}
              </Text>
            </View>

            <View style={styles.healthSummaryItem}>
              <Text style={styles.healthSummaryLabel}>Activity Level:</Text>
              <Text style={styles.healthSummaryValue}>
                {userHealthProfile.activity_level || 'Not specified'}
              </Text>
            </View>

            <View style={styles.healthSummaryItem}>
              <Text style={styles.healthSummaryLabel}>Cooking Skill:</Text>
              <Text style={styles.healthSummaryValue}>
                {userHealthProfile.cooking_skill || 'Not specified'}
              </Text>
            </View>

            <View style={styles.healthSummaryItem}>
              <Text style={styles.healthSummaryLabel}>Allergies:</Text>
              <Text style={styles.healthSummaryValue}>
                {userHealthProfile.allergies?.length
                  ? userHealthProfile.allergies.join(', ')
                  : 'None'
                }
              </Text>
            </View>

            <View style={styles.healthSummaryItem}>
              <Text style={styles.healthSummaryLabel}>Medical Conditions:</Text>
              <Text style={styles.healthSummaryValue}>
                {userHealthProfile.medical_conditions?.length
                  ? userHealthProfile.medical_conditions.join(', ')
                  : 'None'
                }
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.editContent}>
            {/* Diet Style */}
            <View style={styles.editSection}>
              <Text style={styles.editSectionTitle}>Diet Style</Text>
              <View style={styles.optionsRow}>
                {['Vegetarian', 'Vegan', 'Pescatarian', 'Keto', 'Mediterranean', 'Paleo', 'No Restrictions'].map((diet) => (
                  <TouchableOpacity
                    key={diet}
                    style={[
                      styles.optionChip,
                      userHealthProfile.diet_style === diet && styles.optionChipSelected
                    ]}
                    onPress={() => updateHealthProfile({ diet_style: diet })}
                  >
                    <Text style={[
                      styles.optionChipText,
                      userHealthProfile.diet_style === diet && styles.optionChipTextSelected
                    ]}>
                      {diet}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Activity Level */}
            <View style={styles.editSection}>
              <Text style={styles.editSectionTitle}>Activity Level</Text>
              <View style={styles.optionsRow}>
                {['Sedentary', 'Light', 'Moderate', 'Active', 'Very Active'].map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.optionChip,
                      userHealthProfile.activity_level === level && styles.optionChipSelected
                    ]}
                    onPress={() => updateHealthProfile({ activity_level: level })}
                  >
                    <Text style={[
                      styles.optionChipText,
                      userHealthProfile.activity_level === level && styles.optionChipTextSelected
                    ]}>
                      {level}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Cooking Skill */}
            <View style={styles.editSection}>
              <Text style={styles.editSectionTitle}>Cooking Skill</Text>
              <View style={styles.optionsRow}>
                {['Beginner', 'Intermediate', 'Advanced', 'Expert'].map((skill) => (
                  <TouchableOpacity
                    key={skill}
                    style={[
                      styles.optionChip,
                      userHealthProfile.cooking_skill === skill && styles.optionChipSelected
                    ]}
                    onPress={() => updateHealthProfile({ cooking_skill: skill })}
                  >
                    <Text style={[
                      styles.optionChipText,
                      userHealthProfile.cooking_skill === skill && styles.optionChipTextSelected
                    ]}>
                      {skill}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}
      </View>
    </View>
  )

  const renderCurrentSection = () => {
    switch (sections[currentSection]) {
      case 'basics': return renderBasicsSection()
      case 'lifestyle': return renderLifestyleSection()
      case 'health': return renderCombinedHealthSection()
      default: return renderBasicsSection()
    }
  }

  const getSectionProgress = () => ((currentSection + 1) / sections.length) * 100

  if (loading) {
    return (
      <Modal
        visible={true}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={onClose}
      >
        <ScreenWrapper>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6B8E23" />
            <Text style={styles.loadingText}>Loading your profile...</Text>
          </View>
        </ScreenWrapper>
      </Modal>
    )
  }

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAF7F0',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#4A4A4A',
    fontFamily: 'Inter',
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
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#4A4A4A',
    fontFamily: 'Inter',
    marginBottom: 20,
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
  // Removed old weight control styles - using new WeightPicker component
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

  // New styles for sliders and improved sections
  sliderContainer: {
    paddingVertical: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderThumb: {
    backgroundColor: '#6B8E23',
    width: 24,
    height: 24,
  },
  sliderValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Inter',
    textAlign: 'center',
    marginBottom: 8,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sliderLabel: {
    fontSize: 12,
    color: '#4A4A4A',
    fontFamily: 'Inter',
  },
  separatorSection: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  separatorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B8E23',
    fontFamily: 'Inter',
    marginBottom: 16,
  },

  // Summary and edit styles
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#6B8E23',
    borderRadius: 6,
    minWidth: 50,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  summaryContent: {
    gap: 12,
  },
  summaryText: {
    fontSize: 16,
    color: '#1A1A1A',
    fontFamily: 'Inter',
    lineHeight: 22,
  },
  editContent: {
    gap: 16,
  },
  goalOption: {
    backgroundColor: '#F8FAF5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  goalOptionSelected: {
    borderColor: '#6B8E23',
    backgroundColor: '#6B8E23',
  },
  goalOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
    fontFamily: 'Inter',
  },
  goalOptionTextSelected: {
    color: '#FFFFFF',
  },

  // Health summary styles
  healthSummaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  healthSummaryLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4A4A4A',
    fontFamily: 'Inter',
    flex: 1,
  },
  healthSummaryValue: {
    fontSize: 14,
    color: '#1A1A1A',
    fontFamily: 'Inter',
    flex: 2,
    textAlign: 'right',
  },
  editSection: {
    marginBottom: 20,
  },
  editSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Inter',
    marginBottom: 8,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F8FAF5',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  optionChipSelected: {
    backgroundColor: '#6B8E23',
    borderColor: '#6B8E23',
  },
  optionChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1A1A1A',
    fontFamily: 'Inter',
  },
  optionChipTextSelected: {
    color: '#FFFFFF',
  },

  // Weight Picker Card
  weightPickerCard: {
    backgroundColor: 'transparent',
    marginBottom: 12,
    borderRadius: 16,
  },

  // Compact Layout
  compactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  compactColumn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
})