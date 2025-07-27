import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './supabase-provider'

interface UserData {
  fullName: string
  email: string
  country: string
  city: string
  postalCode: string
  age?: number
  gender?: string
  weight?: number
  weightUnit?: 'kg' | 'lbs'
  height?: number
  heightUnit?: 'cm' | 'ft'
  dietStyle?: string[]
  healthGoals?: string[]
  activityLevel?: string
  allergies?: string[]
  medicalConditions?: string[]
  cookingSkill?: string
  // Onboarding completion flags
  onboardingCompleted?: boolean
  profileCompleted?: boolean
  slidesCompleted?: boolean
  mealsCompleted?: boolean
}

interface UserDataContextType {
  userData: UserData | null
  loading: boolean
  updateUserData: (updates: Partial<UserData>) => Promise<void>
  saveToSupabase: () => Promise<void>
}

const UserDataContext = createContext<UserDataContextType>({
  userData: null,
  loading: true,
  updateUserData: async () => {},
  saveToSupabase: async () => {},
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
    if (user) {
      // Initialize user data from Supabase user metadata
      const initialData: UserData = {
        fullName: user.user_metadata?.full_name || '',
        email: user.email || '',
        country: user.user_metadata?.country || '',
        city: user.user_metadata?.city || '',
        postalCode: user.user_metadata?.postal_code || '',
        // Add any other metadata from Supabase
        ...user.user_metadata,
      }
      setUserData(initialData)
    } else {
      setUserData(null)
    }
    setLoading(false)
  }, [user])

  const updateUserData = async (updates: Partial<UserData>) => {
    if (!userData) return
    
    const newUserData = { ...userData, ...updates }
    setUserData(newUserData)
  }

  const saveToSupabase = async () => {
    if (!userData || !session) return

    try {
      // For now, just save to local storage until backend is configured
      console.log('User data would be saved:', userData)
      
      // TODO: Uncomment when backend is properly configured
      // const apiUrl = process.env.EXPO_PUBLIC_API_URL
      // if (apiUrl) {
      //   const response = await fetch(`${apiUrl}/users/profile`, {
      //     method: 'PUT',
      //     headers: {
      //       'Content-Type': 'application/json',
      //       'Authorization': `Bearer ${session.access_token}`
      //     },
      //     body: JSON.stringify(userData)
      //   })
      //   if (!response.ok) {
      //     console.warn('Failed to save user data to backend:', await response.text())
      //   }
      // }
    } catch (error) {
      console.error('Error saving user data:', error)
    }
  }

  const value = {
    userData,
    loading,
    updateUserData,
    saveToSupabase,
  }

  return (
    <UserDataContext.Provider value={value}>
      {children}
    </UserDataContext.Provider>
  )
}