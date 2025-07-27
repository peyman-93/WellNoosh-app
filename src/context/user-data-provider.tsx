import React, {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from "react"
import AsyncStorage from '@react-native-async-storage/async-storage'

interface UserData {
  // Basic info
  fullName?: string
  email?: string
  age?: number
  gender?: string
  weight?: number
  weightUnit?: 'kg' | 'lbs'
  height?: number
  heightUnit?: 'cm' | 'ft'
  
  // Onboarding data
  dietStyle?: string[]
  allergies?: string[]
  healthGoals?: string[]
  activityLevel?: string
  medicalConditions?: string[]
  cookingSkill?: string
  mealPreferences?: string[]
  
  // Completion status
  onboardingCompleted?: boolean
  onboardingCompletedAt?: string
}

type UserDataState = {
  userData: UserData | null
  loading: boolean
  updateUserData: (data: Partial<UserData>) => Promise<void>
  clearUserData: () => Promise<void>
  saveOnboardingData: (data: Partial<UserData>) => Promise<void>
}

export const UserDataContext = createContext<UserDataState>({
  userData: null,
  loading: true,
  updateUserData: async () => {},
  clearUserData: async () => {},
  saveOnboardingData: async () => {},
})

export const useUserData = () => useContext(UserDataContext)

const USER_DATA_KEY = 'wellnoosh_user_data'

export function UserDataProvider({ children }: PropsWithChildren) {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)

  // Load user data from AsyncStorage on initialization
  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      const stored = await AsyncStorage.getItem(USER_DATA_KEY)
      if (stored) {
        const parsedData = JSON.parse(stored)
        console.log('📚 UserData: Loaded user data:', Object.keys(parsedData))
        setUserData(parsedData)
      } else {
        console.log('📚 UserData: No stored user data found')
      }
    } catch (error) {
      console.error('📚 UserData: Error loading user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveUserDataToStorage = async (data: UserData) => {
    try {
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(data))
      console.log('📚 UserData: Saved user data successfully')
    } catch (error) {
      console.error('📚 UserData: Error saving user data:', error)
      throw error
    }
  }

  const updateUserData = async (updates: Partial<UserData>) => {
    try {
      const newUserData = { ...userData, ...updates }
      setUserData(newUserData)
      await saveUserDataToStorage(newUserData)
      console.log('📚 UserData: Updated user data with:', Object.keys(updates))
    } catch (error) {
      console.error('📚 UserData: Error updating user data:', error)
      throw error
    }
  }

  const saveOnboardingData = async (onboardingData: Partial<UserData>) => {
    try {
      const updatedData = {
        ...userData,
        ...onboardingData,
        onboardingCompleted: true,
        onboardingCompletedAt: new Date().toISOString(),
      }
      setUserData(updatedData)
      await saveUserDataToStorage(updatedData)
      console.log('📚 UserData: Saved onboarding data:', Object.keys(onboardingData))
    } catch (error) {
      console.error('📚 UserData: Error saving onboarding data:', error)
      throw error
    }
  }

  const clearUserData = async () => {
    try {
      await AsyncStorage.removeItem(USER_DATA_KEY)
      setUserData(null)
      console.log('📚 UserData: Cleared user data')
    } catch (error) {
      console.error('📚 UserData: Error clearing user data:', error)
      throw error
    }
  }

  const contextValue = React.useMemo(() => ({
    userData,
    loading,
    updateUserData,
    clearUserData,
    saveOnboardingData,
  }), [userData, loading])

  return (
    <UserDataContext.Provider value={contextValue}>
      {children}
    </UserDataContext.Provider>
  )
}