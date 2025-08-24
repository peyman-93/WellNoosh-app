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
  // Basic profile info (user_profiles table)
  fullName: string
  email: string
  country: string
  postalCode: string
  // Health profile info (user_health_profiles table)
  age?: number
  gender?: string
  weight?: number
  weightUnit?: 'kg' | 'lbs'
  height?: number
  heightUnit?: 'cm' | 'ft'
  activityLevel?: string
  cookingSkill?: string
  dietStyle?: string
  allergies?: string[]
  medicalConditions?: string[]
  healthGoals?: string[]
  targetWeight?: number
  targetWeightUnit?: 'kg' | 'lbs'
  timeline?: string
  bmi?: number
  dailyCalorieGoal?: number
  // Onboarding completion flags
  onboardingCompleted?: boolean
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
          // Fetch basic user profile
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

          if (profileData && !profileError) {
            // User profile exists in database, build complete user data
            const completeUserData: UserData = {
              // Basic profile data
              fullName: profileData.full_name || user.user_metadata?.full_name || '',
              email: profileData.email || user.email || '',
              country: profileData.country || user.user_metadata?.country || '',
              postalCode: profileData.postal_code || user.user_metadata?.postal_code || '',
              onboardingCompleted: true, // If profile exists, onboarding is completed
              
              // Add health data if available
              ...(healthData && !healthError && {
                age: healthData.age,
                gender: healthData.gender,
                weight: healthData.weight_kg,
                weightUnit: 'kg' as const,
                height: healthData.height_cm,
                heightUnit: 'cm' as const,
                activityLevel: healthData.activity_level,
                cookingSkill: healthData.cooking_skill,
                dietStyle: healthData.diet_style,
                allergies: healthData.allergies || [],
                medicalConditions: healthData.medical_conditions || [],
                healthGoals: healthData.health_goals || [],
                targetWeight: healthData.target_weight_kg,
                targetWeightUnit: 'kg' as const,
                timeline: healthData.timeline,
                bmi: healthData.bmi,
                dailyCalorieGoal: healthData.daily_calorie_goal,
              }),
            }
            console.log('✅ Complete user profile loaded from database:', completeUserData)
            setUserData(completeUserData)
          } else {
            // No profile in database, use basic metadata (onboarding not completed)
            const initialData: UserData = {
              fullName: user.user_metadata?.full_name || '',
              email: user.email || '',
              country: user.user_metadata?.country || '',
              postalCode: user.user_metadata?.postal_code || '',
              onboardingCompleted: false,
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
            postalCode: user.user_metadata?.postal_code || '',
            onboardingCompleted: false,
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

      // 1. Save basic user profile
      const profileData = {
        user_id: userId,
        email: userData.email || session.user.email || null,
        full_name: userData.fullName || null,
        country: userData.country || null,
        postal_code: userData.postalCode || null,
      }

      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert(profileData, { onConflict: 'user_id' })

      if (profileError) {
        console.error('❌ Error saving user profile:', profileError)
        throw profileError
      }
      console.log('✅ User profile saved successfully')

      // 2. Save health profile if health data exists
      if (userData.age || userData.gender || userData.weight || userData.height || userData.activityLevel) {
        // Convert weight to kg if needed
        const weightInKg = userData.weight && userData.weightUnit === 'lbs' 
          ? Number((userData.weight * 0.453592).toFixed(2))
          : userData.weight

        // Convert height to cm if needed
        let heightInCm = userData.height
        if (userData.heightUnit === 'ft' && userData.height) {
          heightInCm = Number((userData.height * 30.48).toFixed(2))
        }

        // Convert target weight to kg if needed
        const targetWeightInKg = userData.targetWeight && userData.targetWeightUnit === 'lbs' 
          ? Number((userData.targetWeight * 0.453592).toFixed(2))
          : userData.targetWeight

        // Calculate BMI if we have weight and height
        let bmi = null
        if (weightInKg && heightInCm) {
          bmi = calculateBMI(weightInKg, heightInCm)
        }

        // Calculate BMR and daily calories if we have required data
        let dailyCalorieGoal = null
        if (weightInKg && heightInCm && userData.age && userData.gender) {
          const bmr = calculateBMR(weightInKg, heightInCm, userData.age, userData.gender)
          if (userData.activityLevel) {
            dailyCalorieGoal = calculateDailyCalories(bmr, userData.activityLevel)
          }
        }

        const healthData = {
          user_id: userId,
          age: userData.age || null,
          gender: userData.gender || null,
          weight_kg: weightInKg || null,
          height_cm: heightInCm || null,
          activity_level: userData.activityLevel || null,
          cooking_skill: userData.cookingSkill || null,
          diet_style: userData.dietStyle || null,
          allergies: userData.allergies || null,
          medical_conditions: userData.medicalConditions || null,
          health_goals: userData.healthGoals || null,
          target_weight_kg: targetWeightInKg || null,
          timeline: userData.timeline || null,
          bmi: bmi,
          daily_calorie_goal: dailyCalorieGoal,
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

      // 1. Save basic user profile
      const profileData = {
        user_id: userId,
        email: dataToSave.email || session.user.email || null,
        full_name: dataToSave.fullName || null,
        country: dataToSave.country || null,
        postal_code: dataToSave.postalCode || null,
      }

      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert(profileData, { onConflict: 'user_id' })

      if (profileError) {
        console.error('❌ Error saving user profile:', profileError)
        throw profileError
      }
      console.log('✅ User profile saved successfully')

      // 2. Save health profile if health data exists
      if (dataToSave.age || dataToSave.gender || dataToSave.weight || dataToSave.height || dataToSave.activityLevel) {
        // Convert weight to kg if needed
        const weightInKg = dataToSave.weight && dataToSave.weightUnit === 'lbs' 
          ? Number((dataToSave.weight * 0.453592).toFixed(2))
          : dataToSave.weight

        // Convert height to cm if needed
        let heightInCm = dataToSave.height
        if (dataToSave.heightUnit === 'ft' && dataToSave.height) {
          heightInCm = Number((dataToSave.height * 30.48).toFixed(2))
        }

        // Convert target weight to kg if needed
        const targetWeightInKg = dataToSave.targetWeight && dataToSave.targetWeightUnit === 'lbs' 
          ? Number((dataToSave.targetWeight * 0.453592).toFixed(2))
          : dataToSave.targetWeight

        // Calculate BMI if we have weight and height
        let bmi = null
        if (weightInKg && heightInCm) {
          bmi = calculateBMI(weightInKg, heightInCm)
        }

        // Calculate BMR and daily calories if we have required data
        let dailyCalorieGoal = null
        if (weightInKg && heightInCm && dataToSave.age && dataToSave.gender) {
          const bmr = calculateBMR(weightInKg, heightInCm, dataToSave.age, dataToSave.gender)
          if (dataToSave.activityLevel) {
            dailyCalorieGoal = calculateDailyCalories(bmr, dataToSave.activityLevel)
          }
        }

        const healthData = {
          user_id: userId,
          age: dataToSave.age || null,
          gender: dataToSave.gender || null,
          weight_kg: weightInKg || null,
          height_cm: heightInCm || null,
          activity_level: dataToSave.activityLevel || null,
          cooking_skill: dataToSave.cookingSkill || null,
          diet_style: dataToSave.dietStyle || null,
          allergies: dataToSave.allergies || null,
          medical_conditions: dataToSave.medicalConditions || null,
          health_goals: dataToSave.healthGoals || null,
          target_weight_kg: targetWeightInKg || null,
          timeline: dataToSave.timeline || null,
          bmi: bmi,
          daily_calorie_goal: dailyCalorieGoal,
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