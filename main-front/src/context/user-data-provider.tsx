import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './supabase-provider'
import { supabase } from '../services/supabase'

// Health calculation utilities
const calculateBMI = (weightKg: number, heightCm: number): number => {
  const heightM = heightCm / 100
  return Number((weightKg / (heightM * heightM)).toFixed(2))
}

const calculateBMR = (weightKg: number, heightCm: number, age: number, gender: string): number => {
  // Mifflin-St Jeor Equation
  let bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age)
  
  if (gender === 'Male') {
    bmr += 5
  } else if (gender === 'Female') {
    bmr -= 161
  } else {
    // For non-binary or prefer not to say, use average
    bmr -= 78
  }
  
  return Math.round(bmr)
}

const calculateDailyCalories = (bmr: number, activityLevel: string): number => {
  const activityMultipliers = {
    'Sedentary (little/no exercise)': 1.2,
    'Lightly Active (1-3 days/week)': 1.375,
    'Moderately Active (3-5 days/week)': 1.55,
    'Very Active (5-7 days/week)': 1.725,
    'Extremely Active (physical job)': 1.9
  }
  
  const multiplier = activityMultipliers[activityLevel as keyof typeof activityMultipliers] || 1.2
  return Math.round(bmr * multiplier)
}

interface UserData {
  fullName: string
  email: string
  country: string
  city: string
  postalCode: string
  address?: string
  age?: number
  gender?: string
  weight?: number
  weightUnit?: 'kg' | 'lbs'
  height?: number
  heightUnit?: 'cm' | 'ft'
  targetWeight?: number
  targetWeightUnit?: 'kg' | 'lbs'
  medications?: string[]
  healthNotes?: string
  dietStyle?: string | string[] // Support both formats for backward compatibility
  healthGoals?: string[]
  activityLevel?: string
  allergies?: string[]
  medicalConditions?: string[]
  cookingSkill?: string
  cookingFrequency?: string
  mealPreference?: string
  // Onboarding completion flags
  onboardingCompleted?: boolean
  profileCompleted?: boolean
  slidesCompleted?: boolean
  mealsCompleted?: boolean
}

interface UserDataContextType {
  userData: UserData | null
  loading: boolean
  updateUserData: (updates: Partial<UserData>) => Promise<UserData | undefined>
  saveToSupabase: () => Promise<void>
  saveToSupabaseWithData: (data: UserData) => Promise<void>
}

const UserDataContext = createContext<UserDataContextType>({
  userData: null,
  loading: true,
  updateUserData: async () => undefined,
  saveToSupabase: async () => {},
  saveToSupabaseWithData: async () => {},
})

export const useUserData = () => {
  const context = useContext(UserDataContext)
  if (!context) {
    throw new Error('useUserData must be used within a UserDataProvider')
  }
  return context
}

export function UserDataProvider({ children }: { children: React.ReactNode }) {
  const { user, session } = useAuth()
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          // First try to fetch complete user profile from database
          const { data: profileData, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', user.id)
            .single()

          // Fetch health profile
          const { data: healthData, error: healthError } = await supabase
            .from('user_health_profiles')
            .select('*')
            .eq('user_id', user.id)
            .single()

          // Fetch dietary preferences
          const { data: dietaryData, error: dietaryError } = await supabase
            .from('user_dietary_preferences')
            .select('*')
            .eq('user_id', user.id)
            .single()

          if (profileData && !profileError) {
            // User profile exists in database, build complete user data
            const completeUserData: UserData = {
              fullName: profileData.full_name || user.user_metadata?.full_name || '',
              email: user.email || '',
              country: profileData.country || user.user_metadata?.country || '',
              city: profileData.city || user.user_metadata?.city || '',
              postalCode: profileData.postal_code || user.user_metadata?.postal_code || '',
              address: profileData.address || '',
              cookingSkill: profileData.cooking_experience_level || '',
              cookingFrequency: profileData.cooking_frequency || '',
              onboardingCompleted: true, // If profile exists, onboarding is completed
              
              // Add health data if available
              ...(healthData && !healthError && {
                age: healthData.age,
                gender: healthData.gender,
                weight: healthData.weight_kg,
                weightUnit: 'kg' as const,
                height: healthData.height_cm,
                heightUnit: 'cm' as const,
                targetWeight: healthData.target_weight_kg,
                targetWeightUnit: 'kg' as const,
                activityLevel: healthData.activity_level,
                healthGoals: healthData.health_goals ? JSON.parse(healthData.health_goals) : undefined,
                medicalConditions: healthData.medical_conditions ? JSON.parse(healthData.medical_conditions) : undefined,
                medications: healthData.medications ? JSON.parse(healthData.medications) : undefined,
                healthNotes: healthData.notes,
              }),

              // Add dietary data if available
              ...(dietaryData && !dietaryError && {
                dietStyle: dietaryData.dietary_restrictions || [],
                allergies: dietaryData.allergies || [],
                mealPreference: dietaryData.cooking_time_preference,
              }),

              // Add any other metadata from Supabase
              ...user.user_metadata,
            }
            console.log('✅ Complete user profile loaded from database:', completeUserData)
            setUserData(completeUserData)
          } else {
            // No profile in database, use basic metadata (onboarding not completed)
            const initialData: UserData = {
              fullName: user.user_metadata?.full_name || '',
              email: user.email || '',
              country: user.user_metadata?.country || '',
              city: user.user_metadata?.city || '',
              postalCode: user.user_metadata?.postal_code || '',
              onboardingCompleted: false,
              // Add any other metadata from Supabase
              ...user.user_metadata,
            }
            console.log('ℹ️ No profile found in database, using basic metadata for onboarding')
            setUserData(initialData)
          }
        } catch (error) {
          console.error('Error fetching user profile:', error)
          // Fallback to basic metadata
          const initialData: UserData = {
            fullName: user.user_metadata?.full_name || '',
            email: user.email || '',
            country: user.user_metadata?.country || '',
            city: user.user_metadata?.city || '',
            postalCode: user.user_metadata?.postal_code || '',
            onboardingCompleted: false,
            ...user.user_metadata,
          }
          setUserData(initialData)
        }
      } else {
        setUserData(null)
      }
      setLoading(false)
    }

    fetchUserData()
  }, [user])

  const updateUserData = async (updates: Partial<UserData>) => {
    if (!userData) return
    
    const newUserData = { ...userData, ...updates }
    setUserData(newUserData)
    return newUserData // Return the merged data so caller can use it immediately
  }

  const saveToSupabase = async () => {
    if (!userData || !session?.user) return

    try {
      const userId = session.user.id
      console.log('💾 Saving user data to Supabase:', userData)
      console.log('🔍 Debug - userData.cookingSkill:', userData.cookingSkill)
      console.log('🔍 Debug - userData.address:', userData.address)

      // Convert weight to kg if needed
      const weightInKg = userData.weight && userData.weightUnit === 'lbs' 
        ? Number((userData.weight * 0.453592).toFixed(2))
        : userData.weight

      // Convert height to cm if needed
      let heightInCm = userData.height
      if (userData.heightUnit === 'ft' && userData.height) {
        heightInCm = Number((userData.height * 30.48).toFixed(2))
      }

      // 1. Save user profile
      const profileData = {
        user_id: userId,
        email: userData.email || session.user.email || null,
        full_name: userData.fullName || null,
        country: userData.country || null,
        city: userData.city || null,
        postal_code: userData.postalCode || null,
        address: userData.address || null,
        cooking_experience_level: userData.cookingSkill || null,
        cooking_frequency: userData.cookingFrequency || null,
      }

      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert(profileData, { onConflict: 'user_id' })

      if (profileError) {
        console.error('❌ Error saving user profile:', profileError)
        throw profileError
      }
      console.log('✅ User profile saved successfully')

      // Convert target weight to kg if needed
      const targetWeightInKg = userData.targetWeight && userData.targetWeightUnit === 'lbs' 
        ? Number((userData.targetWeight * 0.453592).toFixed(2))
        : userData.targetWeight

      // Calculate BMI if we have weight and height
      let bmi = null
      if (weightInKg && heightInCm) {
        bmi = calculateBMI(weightInKg, heightInCm)
      }

      // Calculate BMR if we have weight, height, age, and gender
      let bmr = null
      let dailyCalorieGoal = null
      if (weightInKg && heightInCm && userData.age && userData.gender) {
        bmr = calculateBMR(weightInKg, heightInCm, userData.age, userData.gender)
        if (userData.activityLevel) {
          dailyCalorieGoal = calculateDailyCalories(bmr, userData.activityLevel)
        }
      }

      // 2. Save health profile
      if (userData.age || userData.gender || weightInKg || heightInCm || userData.activityLevel || userData.healthGoals) {
        const healthData = {
          user_id: userId,
          age: userData.age || null,
          gender: userData.gender || null,
          height_cm: heightInCm || null,
          weight_kg: weightInKg || null,
          target_weight_kg: targetWeightInKg || null,
          activity_level: userData.activityLevel || null,
          health_goals: userData.healthGoals ? JSON.stringify(userData.healthGoals) : null,
          medical_conditions: userData.medicalConditions ? JSON.stringify(userData.medicalConditions) : null,
          medications: userData.medications ? JSON.stringify(userData.medications) : null,
          bmi: bmi,
          bmr: bmr,
          daily_calorie_goal: dailyCalorieGoal,
          notes: userData.healthNotes || null,
        }

        const { error: healthError } = await supabase
          .from('user_health_profiles')
          .upsert(healthData, { onConflict: 'user_id' })

        if (healthError) {
          console.error('❌ Error saving health profile:', healthError)
          throw healthError
        }
        console.log('✅ Health profile saved successfully')
      }

      // 3. Save dietary preferences
      if (userData.dietStyle || userData.allergies || userData.medicalConditions) {
        // Handle both string and array formats for dietStyle
        const dietStyleArray = userData.dietStyle 
          ? (typeof userData.dietStyle === 'string' ? [userData.dietStyle] : userData.dietStyle)
          : [];

        const dietaryData = {
          user_id: userId,
          dietary_restrictions: dietStyleArray,
          allergies: userData.allergies || [],
          intolerances: userData.medicalConditions || [], // Using medicalConditions as intolerances for now
          liked_cuisines: [],
          disliked_cuisines: [],
          preferred_meal_types: dietStyleArray,
          cooking_time_preference: userData.mealPreference || null,
          spice_tolerance: null,
        }

        const { error: dietaryError } = await supabase
          .from('user_dietary_preferences')
          .upsert(dietaryData, { onConflict: 'user_id' })

        if (dietaryError) {
          console.error('❌ Error saving dietary preferences:', dietaryError)
          throw dietaryError
        }
        console.log('✅ Dietary preferences saved successfully')
      }

      console.log('🎉 All user data saved to Supabase successfully!')
      
    } catch (error) {
      console.error('💥 Error saving user data to Supabase:', error)
      throw error
    }
  }

  const saveToSupabaseWithData = async (dataToSave: UserData) => {
    if (!session?.user) return

    try {
      const userId = session.user.id
      console.log('💾 Saving specific user data to Supabase:', dataToSave)
      console.log('🔍 Debug - dataToSave.cookingSkill:', dataToSave.cookingSkill)
      console.log('🔍 Debug - dataToSave.mealPreference:', dataToSave.mealPreference)
      console.log('🔍 Debug - dataToSave.address:', dataToSave.address)

      // Convert weight to kg if needed
      const weightInKg = dataToSave.weight && dataToSave.weightUnit === 'lbs' 
        ? Number((dataToSave.weight * 0.453592).toFixed(2))
        : dataToSave.weight

      // Convert height to cm if needed
      let heightInCm = dataToSave.height
      if (dataToSave.heightUnit === 'ft' && dataToSave.height) {
        heightInCm = Number((dataToSave.height * 30.48).toFixed(2))
      }

      // 1. Save user profile
      const profileData = {
        user_id: userId,
        email: dataToSave.email || session.user.email || null,
        full_name: dataToSave.fullName || null,
        country: dataToSave.country || null,
        city: dataToSave.city || null,
        postal_code: dataToSave.postalCode || null,
        address: dataToSave.address || null,
        cooking_experience_level: dataToSave.cookingSkill || null,
        cooking_frequency: dataToSave.cookingFrequency || null,
      }

      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert(profileData, { onConflict: 'user_id' })

      if (profileError) {
        console.error('❌ Error saving user profile:', profileError)
        throw profileError
      }
      console.log('✅ User profile saved successfully')

      // Convert target weight to kg if needed
      const targetWeightInKg = dataToSave.targetWeight && dataToSave.targetWeightUnit === 'lbs' 
        ? Number((dataToSave.targetWeight * 0.453592).toFixed(2))
        : dataToSave.targetWeight

      // Calculate BMI if we have weight and height
      let bmi = null
      if (weightInKg && heightInCm) {
        bmi = calculateBMI(weightInKg, heightInCm)
      }

      // Calculate BMR if we have weight, height, age, and gender
      let bmr = null
      let dailyCalorieGoal = null
      if (weightInKg && heightInCm && dataToSave.age && dataToSave.gender) {
        bmr = calculateBMR(weightInKg, heightInCm, dataToSave.age, dataToSave.gender)
        if (dataToSave.activityLevel) {
          dailyCalorieGoal = calculateDailyCalories(bmr, dataToSave.activityLevel)
        }
      }

      // 2. Save health profile
      if (dataToSave.age || dataToSave.gender || weightInKg || heightInCm || dataToSave.activityLevel || dataToSave.healthGoals) {
        const healthData = {
          user_id: userId,
          age: dataToSave.age || null,
          gender: dataToSave.gender || null,
          height_cm: heightInCm || null,
          weight_kg: weightInKg || null,
          target_weight_kg: targetWeightInKg || null,
          activity_level: dataToSave.activityLevel || null,
          health_goals: dataToSave.healthGoals ? JSON.stringify(dataToSave.healthGoals) : null,
          medical_conditions: dataToSave.medicalConditions ? JSON.stringify(dataToSave.medicalConditions) : null,
          medications: dataToSave.medications ? JSON.stringify(dataToSave.medications) : null,
          bmi: bmi,
          bmr: bmr,
          daily_calorie_goal: dailyCalorieGoal,
          notes: dataToSave.healthNotes || null,
        }

        const { error: healthError } = await supabase
          .from('user_health_profiles')
          .upsert(healthData, { onConflict: 'user_id' })

        if (healthError) {
          console.error('❌ Error saving health profile:', healthError)
          throw healthError
        }
        console.log('✅ Health profile saved successfully')
      }

      // 3. Save dietary preferences
      if (dataToSave.dietStyle || dataToSave.allergies || dataToSave.medicalConditions) {
        // Handle both string and array formats for dietStyle
        const dietStyleArray = dataToSave.dietStyle 
          ? (typeof dataToSave.dietStyle === 'string' ? [dataToSave.dietStyle] : dataToSave.dietStyle)
          : [];

        const dietaryData = {
          user_id: userId,
          dietary_restrictions: dietStyleArray,
          allergies: dataToSave.allergies || [],
          intolerances: dataToSave.medicalConditions || [], // Using medicalConditions as intolerances for now
          liked_cuisines: [],
          disliked_cuisines: [],
          preferred_meal_types: dietStyleArray,
          cooking_time_preference: dataToSave.mealPreference || null,
          spice_tolerance: null,
        }

        const { error: dietaryError } = await supabase
          .from('user_dietary_preferences')
          .upsert(dietaryData, { onConflict: 'user_id' })

        if (dietaryError) {
          console.error('❌ Error saving dietary preferences:', dietaryError)
          throw dietaryError
        }
        console.log('✅ Dietary preferences saved successfully')
      }

      console.log('🎉 All user data saved to Supabase successfully!')
      
    } catch (error) {
      console.error('💥 Error saving user data to Supabase:', error)
      throw error
    }
  }

  const value = {
    userData,
    loading,
    updateUserData,
    saveToSupabase,
    saveToSupabaseWithData,
  }

  return (
    <UserDataContext.Provider value={value}>
      {children}
    </UserDataContext.Provider>
  )
}