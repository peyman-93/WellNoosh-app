import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useAuth } from '@/context/supabase-provider'
import { useUserData } from '@/context/user-data-provider'
import { useNavigation } from '@react-navigation/native'
import { supabase } from '../main-front/src/services/supabase'

// Types matching database structure
interface UserProfile {
  id?: string
  user_id: string
  full_name?: string
  email: string
  postal_code?: string
  country?: string
  created_at?: string
  updated_at?: string
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

export default function ProfileScreen() {
  const { session, signOut } = useAuth()
  const { userData } = useUserData()
  const navigation = useNavigation()

  const [isEditMode, setIsEditMode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // User Profile State (Section 1)
  const [userProfile, setUserProfile] = useState<UserProfile>({
    user_id: session?.user?.id || '',
    full_name: '',
    email: session?.user?.email || '',
    postal_code: '',
    country: ''
  })

  // Health Profile State (Section 2)
  const [healthProfile, setHealthProfile] = useState<UserHealthProfile>({
    user_id: session?.user?.id || '',
    age: undefined,
    gender: '',
    weight_kg: undefined,
    height_cm: undefined,
    activity_level: '',
    cooking_skill: '',
    diet_style: '',
    allergies: [],
    medical_conditions: [],
    health_goals: [],
    target_weight_kg: undefined,
    timeline: ''
  })

  // Load user data on mount
  useEffect(() => {
    if (session?.user?.id) {
      loadUserProfiles()
    }
  }, [session])

  const loadUserProfiles = async () => {
    setLoading(true)
    try {
      const userId = session?.user?.id
      if (!userId) return

      // Load user_profiles
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (profileData && !profileError) {
        setUserProfile(profileData)
      }

      // Load user_health_profiles
      const { data: healthData, error: healthError } = await supabase
        .from('user_health_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (healthData && !healthError) {
        setHealthProfile(healthData)
      }
    } catch (error) {
      console.error('Error loading profiles:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const userId = session?.user?.id
      if (!userId) return

      // Update user_profiles
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          ...userProfile,
          user_id: userId,
          updated_at: new Date().toISOString()
        })

      if (profileError) throw profileError

      // Calculate BMI if weight and height are present
      let bmi = undefined
      if (healthProfile.weight_kg && healthProfile.height_cm) {
        bmi = healthProfile.weight_kg / Math.pow(healthProfile.height_cm / 100, 2)
      }

      // Update user_health_profiles
      const { error: healthError } = await supabase
        .from('user_health_profiles')
        .upsert({
          ...healthProfile,
          user_id: userId,
          bmi: bmi,
          updated_at: new Date().toISOString()
        })

      if (healthError) throw healthError

      Alert.alert('Success', 'Profile updated successfully!')
      setIsEditMode(false)
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile. Please try again.')
      console.error('Error updating profile:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      Alert.alert('Error', 'Failed to sign out. Please try again.')
    }
  }

  const userName = userProfile.full_name || session?.user?.email?.split('@')[0] || 'User'
  const userInitial = userName.charAt(0).toUpperCase()

  // Options for select inputs
  const genderOptions = ['Male', 'Female', 'Other', 'Prefer not to say']
  const activityLevels = [
    'Sedentary (little/no exercise)',
    'Lightly Active (1-3 days/week)',
    'Moderately Active (3-5 days/week)',
    'Very Active (5-7 days/week)',
    'Extremely Active (physical job)'
  ]
  const cookingSkills = [
    'Beginner',
    'Intermediate',
    'Advanced',
    'Expert'
  ]
  const dietStyles = [
    'Balanced',
    'Omnivore',
    'Vegetarian',
    'Vegan',
    'Pescatarian',
    'Keto',
    'Paleo',
    'Mediterranean',
    'Low Carb'
  ]
  const healthGoals = [
    'Lose Weight',
    'Gain Weight',
    'Maintain Weight',
    'Build Muscle'
  ]
  const timelines = [
    '1-3 months',
    '3-6 months',
    '6-12 months',
    '1+ years'
  ]
  const commonAllergies = [
    'Nuts',
    'Peanuts',
    'Shellfish',
    'Fish',
    'Eggs',
    'Milk/Dairy',
    'Soy',
    'Wheat/Gluten',
    'Sesame'
  ]
  const medicalConditions = [
    'Diabetes',
    'High Blood Pressure',
    'High Cholesterol',
    'Heart Disease',
    'Kidney Disease',
    'Liver Disease',
    'Thyroid Issues',
    'Digestive Issues'
  ]

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Compact Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <View style={styles.avatarSmall}>
            <Text style={styles.avatarTextSmall}>{userInitial}</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{userName}</Text>
            <Text style={styles.headerEmail}>{userProfile.email}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.editButton}
          onPress={() => isEditMode ? handleSave() : setIsEditMode(true)}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#10B981" />
          ) : (
            <Text style={styles.editButtonText}>
              {isEditMode ? 'Save' : 'Edit'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>

          {/* Section 1: User Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>User Information</Text>
            <View style={styles.sectionContent}>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                {isEditMode ? (
                  <TextInput
                    style={styles.textInput}
                    value={userProfile.full_name}
                    onChangeText={(text) => setUserProfile({...userProfile, full_name: text})}
                    placeholder="Enter your name"
                  />
                ) : (
                  <Text style={styles.displayText}>{userProfile.full_name || 'Not specified'}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <Text style={[styles.displayText, styles.readOnlyText]}>{userProfile.email}</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Postal Code</Text>
                {isEditMode ? (
                  <TextInput
                    style={styles.textInput}
                    value={userProfile.postal_code}
                    onChangeText={(text) => setUserProfile({...userProfile, postal_code: text})}
                    placeholder="Enter postal code"
                  />
                ) : (
                  <Text style={styles.displayText}>{userProfile.postal_code || 'Not specified'}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Country</Text>
                {isEditMode ? (
                  <TextInput
                    style={styles.textInput}
                    value={userProfile.country}
                    onChangeText={(text) => setUserProfile({...userProfile, country: text})}
                    placeholder="Enter country"
                  />
                ) : (
                  <Text style={styles.displayText}>{userProfile.country || 'Not specified'}</Text>
                )}
              </View>

            </View>
          </View>

          {/* Section 2: Health Profile */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Health Profile</Text>
            <View style={styles.sectionContent}>

              <View style={styles.rowGroup}>
                <View style={[styles.inputGroup, {flex: 1}]}>
                  <Text style={styles.inputLabel}>Age</Text>
                  {isEditMode ? (
                    <TextInput
                      style={styles.textInput}
                      value={healthProfile.age?.toString()}
                      onChangeText={(text) => setHealthProfile({...healthProfile, age: parseInt(text) || undefined})}
                      placeholder="Age"
                      keyboardType="numeric"
                    />
                  ) : (
                    <Text style={styles.displayText}>{healthProfile.age || 'Not set'}</Text>
                  )}
                </View>

                <View style={[styles.inputGroup, {flex: 1}]}>
                  <Text style={styles.inputLabel}>Gender</Text>
                  {isEditMode ? (
                    <View style={styles.selectContainer}>
                      {genderOptions.map((option) => (
                        <TouchableOpacity
                          key={option}
                          style={[
                            styles.selectOption,
                            healthProfile.gender === option && styles.selectOptionActive
                          ]}
                          onPress={() => setHealthProfile({...healthProfile, gender: option})}
                        >
                          <Text style={[
                            styles.selectOptionText,
                            healthProfile.gender === option && styles.selectOptionTextActive
                          ]}>
                            {option}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.displayText}>{healthProfile.gender || 'Not set'}</Text>
                  )}
                </View>
              </View>

              <View style={styles.rowGroup}>
                <View style={[styles.inputGroup, {flex: 1}]}>
                  <Text style={styles.inputLabel}>Weight (kg)</Text>
                  {isEditMode ? (
                    <TextInput
                      style={styles.textInput}
                      value={healthProfile.weight_kg?.toString()}
                      onChangeText={(text) => setHealthProfile({...healthProfile, weight_kg: parseFloat(text) || undefined})}
                      placeholder="Weight"
                      keyboardType="numeric"
                    />
                  ) : (
                    <Text style={styles.displayText}>
                      {healthProfile.weight_kg ? `${healthProfile.weight_kg} kg` : 'Not set'}
                    </Text>
                  )}
                </View>

                <View style={[styles.inputGroup, {flex: 1}]}>
                  <Text style={styles.inputLabel}>Height (cm)</Text>
                  {isEditMode ? (
                    <TextInput
                      style={styles.textInput}
                      value={healthProfile.height_cm?.toString()}
                      onChangeText={(text) => setHealthProfile({...healthProfile, height_cm: parseFloat(text) || undefined})}
                      placeholder="Height"
                      keyboardType="numeric"
                    />
                  ) : (
                    <Text style={styles.displayText}>
                      {healthProfile.height_cm ? `${healthProfile.height_cm} cm` : 'Not set'}
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Activity Level</Text>
                {isEditMode ? (
                  <View style={styles.selectContainer}>
                    {activityLevels.map((level) => (
                      <TouchableOpacity
                        key={level}
                        style={[
                          styles.selectOption,
                          healthProfile.activity_level === level && styles.selectOptionActive
                        ]}
                        onPress={() => setHealthProfile({...healthProfile, activity_level: level})}
                      >
                        <Text style={[
                          styles.selectOptionText,
                          healthProfile.activity_level === level && styles.selectOptionTextActive
                        ]}>
                          {level}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.displayText}>{healthProfile.activity_level || 'Not specified'}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Cooking Skill</Text>
                {isEditMode ? (
                  <View style={styles.selectContainer}>
                    {cookingSkills.map((skill) => (
                      <TouchableOpacity
                        key={skill}
                        style={[
                          styles.selectOption,
                          healthProfile.cooking_skill === skill && styles.selectOptionActive
                        ]}
                        onPress={() => setHealthProfile({...healthProfile, cooking_skill: skill})}
                      >
                        <Text style={[
                          styles.selectOptionText,
                          healthProfile.cooking_skill === skill && styles.selectOptionTextActive
                        ]}>
                          {skill}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.displayText}>{healthProfile.cooking_skill || 'Not specified'}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Diet Style</Text>
                {isEditMode ? (
                  <View style={styles.selectContainer}>
                    {dietStyles.map((diet) => (
                      <TouchableOpacity
                        key={diet}
                        style={[
                          styles.selectOption,
                          healthProfile.diet_style === diet && styles.selectOptionActive
                        ]}
                        onPress={() => setHealthProfile({...healthProfile, diet_style: diet})}
                      >
                        <Text style={[
                          styles.selectOptionText,
                          healthProfile.diet_style === diet && styles.selectOptionTextActive
                        ]}>
                          {diet}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.displayText}>{healthProfile.diet_style || 'Not specified'}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Allergies</Text>
                {isEditMode ? (
                  <View style={styles.selectContainer}>
                    {commonAllergies.map((allergy) => (
                      <TouchableOpacity
                        key={allergy}
                        style={[
                          styles.selectOption,
                          healthProfile.allergies?.includes(allergy) && styles.selectOptionActive
                        ]}
                        onPress={() => {
                          const current = healthProfile.allergies || []
                          if (current.includes(allergy)) {
                            setHealthProfile({
                              ...healthProfile,
                              allergies: current.filter(a => a !== allergy)
                            })
                          } else {
                            setHealthProfile({
                              ...healthProfile,
                              allergies: [...current, allergy]
                            })
                          }
                        }}
                      >
                        <Text style={[
                          styles.selectOptionText,
                          healthProfile.allergies?.includes(allergy) && styles.selectOptionTextActive
                        ]}>
                          {allergy}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.displayText}>
                    {healthProfile.allergies?.length ? healthProfile.allergies.join(', ') : 'None'}
                  </Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Medical Conditions</Text>
                {isEditMode ? (
                  <View style={styles.selectContainer}>
                    {medicalConditions.map((condition) => (
                      <TouchableOpacity
                        key={condition}
                        style={[
                          styles.selectOption,
                          healthProfile.medical_conditions?.includes(condition) && styles.selectOptionActive
                        ]}
                        onPress={() => {
                          const current = healthProfile.medical_conditions || []
                          if (current.includes(condition)) {
                            setHealthProfile({
                              ...healthProfile,
                              medical_conditions: current.filter(c => c !== condition)
                            })
                          } else {
                            setHealthProfile({
                              ...healthProfile,
                              medical_conditions: [...current, condition]
                            })
                          }
                        }}
                      >
                        <Text style={[
                          styles.selectOptionText,
                          healthProfile.medical_conditions?.includes(condition) && styles.selectOptionTextActive
                        ]}>
                          {condition}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.displayText}>
                    {healthProfile.medical_conditions?.length ? healthProfile.medical_conditions.join(', ') : 'None'}
                  </Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Health Goals</Text>
                {isEditMode ? (
                  <View style={styles.selectContainer}>
                    {healthGoals.map((goal) => (
                      <TouchableOpacity
                        key={goal}
                        style={[
                          styles.selectOption,
                          healthProfile.health_goals?.includes(goal) && styles.selectOptionActive
                        ]}
                        onPress={() => {
                          const current = healthProfile.health_goals || []
                          if (current.includes(goal)) {
                            setHealthProfile({
                              ...healthProfile,
                              health_goals: current.filter(g => g !== goal)
                            })
                          } else {
                            setHealthProfile({
                              ...healthProfile,
                              health_goals: [...current, goal]
                            })
                          }
                        }}
                      >
                        <Text style={[
                          styles.selectOptionText,
                          healthProfile.health_goals?.includes(goal) && styles.selectOptionTextActive
                        ]}>
                          {goal}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.displayText}>
                    {healthProfile.health_goals?.length ? healthProfile.health_goals.join(', ') : 'Not specified'}
                  </Text>
                )}
              </View>

              <View style={styles.rowGroup}>
                <View style={[styles.inputGroup, {flex: 1}]}>
                  <Text style={styles.inputLabel}>Target Weight (kg)</Text>
                  {isEditMode ? (
                    <TextInput
                      style={styles.textInput}
                      value={healthProfile.target_weight_kg?.toString()}
                      onChangeText={(text) => setHealthProfile({...healthProfile, target_weight_kg: parseFloat(text) || undefined})}
                      placeholder="Target"
                      keyboardType="numeric"
                    />
                  ) : (
                    <Text style={styles.displayText}>
                      {healthProfile.target_weight_kg ? `${healthProfile.target_weight_kg} kg` : 'Not set'}
                    </Text>
                  )}
                </View>

                <View style={[styles.inputGroup, {flex: 1}]}>
                  <Text style={styles.inputLabel}>Timeline</Text>
                  {isEditMode ? (
                    <View style={styles.selectContainer}>
                      {timelines.map((timeline) => (
                        <TouchableOpacity
                          key={timeline}
                          style={[
                            styles.selectOption,
                            healthProfile.timeline === timeline && styles.selectOptionActive
                          ]}
                          onPress={() => setHealthProfile({...healthProfile, timeline: timeline})}
                        >
                          <Text style={[
                            styles.selectOptionText,
                            healthProfile.timeline === timeline && styles.selectOptionTextActive
                          ]}>
                            {timeline}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.displayText}>{healthProfile.timeline || 'Not set'}</Text>
                  )}
                </View>
              </View>

              {healthProfile.bmi && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>BMI</Text>
                  <Text style={styles.displayText}>{healthProfile.bmi.toFixed(1)}</Text>
                </View>
              )}

            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {isEditMode && (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setIsEditMode(false)
                  loadUserProfiles() // Reload to discard changes
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: '600',
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  avatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTextSmall: {
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
  },
  headerInfo: {
    marginLeft: 12,
    flex: 1,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerEmail: {
    fontSize: 14,
    color: '#6B7280',
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#10B981',
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  editButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 20,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sectionContent: {
    padding: 16,
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  rowGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
  },
  displayText: {
    fontSize: 16,
    color: '#1F2937',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  readOnlyText: {
    color: '#6B7280',
  },
  selectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: 'white',
  },
  selectOptionActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  selectOptionText: {
    fontSize: 14,
    color: '#374151',
  },
  selectOptionTextActive: {
    color: 'white',
  },
  actionButtons: {
    gap: 12,
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  signOutButton: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  signOutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
})