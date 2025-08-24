import React, { createContext, useContext, useEffect, useState } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '../services/supabase'
import { Linking } from 'react-native'

interface AuthContextType {
  session: Session | null
  user: User | null
  loading: boolean
  signUp: (email: string, password: string, userData: any) => Promise<{ data: any; error: any }>
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>
  signInWithGoogle: () => Promise<{ data: any; error: any }>
  signOut: () => Promise<void>
  updateProfile: (updates: any) => Promise<{ data: any; error: any }>
  resetPassword: (email: string) => Promise<{ data: any; error: any }>
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signUp: async () => ({ data: null, error: null }),
  signIn: async () => ({ data: null, error: null }),
  signInWithGoogle: async () => ({ data: null, error: null }),
  signOut: async () => {},
  updateProfile: async () => ({ data: null, error: null }),
  resetPassword: async () => ({ data: null, error: null }),
})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔍 Auth state change:', event, session?.user?.email || 'no user')
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Handle deep links for OAuth redirect
    const handleUrl = async (url: string) => {
      console.log('🔍 Deep link received:', url)
      
      if (url.includes('#access_token=') || url.includes('#error=')) {
        console.log('🔍 Processing OAuth redirect URL')
        try {
          // Parse the URL fragment manually
          const urlParts = url.split('#')[1]
          if (!urlParts) return
          
          const params = new URLSearchParams(urlParts)
          const accessToken = params.get('access_token')
          const refreshToken = params.get('refresh_token')
          const expiresIn = params.get('expires_in')
          
          console.log('🔍 Parsed tokens:', { 
            hasAccessToken: !!accessToken, 
            hasRefreshToken: !!refreshToken,
            expiresIn
          })
          
          if (accessToken && refreshToken) {
            // Set the session manually using the tokens
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            })
            
            console.log('🔍 Set session result:', { data: !!data.session, error })
            
            if (error) {
              console.error('❌ Error setting session:', error)
              return
            }
            
            if (data?.session) {
              console.log('✅ Successfully set session from OAuth redirect')
              setSession(data.session)
              setUser(data.session.user)
            }
          } else {
            console.log('⚠️ Missing required tokens in OAuth redirect')
          }
        } catch (err) {
          console.error('❌ Exception handling OAuth redirect:', err)
        }
      } else {
        console.log('🔍 URL does not match OAuth pattern, ignoring')
      }
    }

    // Listen for URL changes (OAuth redirects)
    const linkingSubscription = Linking.addEventListener('url', ({ url }) => {
      handleUrl(url)
    })

    // Check if app was opened with a URL
    Linking.getInitialURL().then(url => {
      if (url) {
        handleUrl(url)
      }
    })

    return () => {
      subscription.unsubscribe()
      linkingSubscription?.remove()
    }
  }, [])

  const signUp = async (email: string, password: string, userData: any) => {
    try {
      const cleanEmail = email.trim().toLowerCase()
      
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: userData.fullName,
            country: userData.country,
            city: userData.city,
            postal_code: userData.postalCode
          }
        }
      })

      if (data.user && data.session && !error) {
        // Create user profile in backend database
        // Skip if API URL is not configured
        if (process.env.EXPO_PUBLIC_API_URL) {
          try {
            const profileResponse = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/auth/signup`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${data.session.access_token}`
              },
              body: JSON.stringify({
                userId: data.user.id,
                fullName: userData.fullName,
                email: cleanEmail,
                country: userData.country,
                city: userData.city,
                postalCode: userData.postalCode
              })
            })

            if (!profileResponse.ok) {
              console.warn('Failed to create user profile in backend:', await profileResponse.text())
            }
          } catch (profileError) {
            console.error('Error creating user profile:', profileError)
          }
        } else {
          console.log('Backend API URL not configured, skipping profile creation in external API')
        }
      }

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const cleanEmail = email.trim().toLowerCase()
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      })

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  const signInWithGoogle = async () => {
    try {
      console.log('🔍 Starting Google Sign-In...')
      console.log('🔍 Google Client ID:', process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID)
      
      // Let Supabase handle the redirect automatically
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      })

      console.log('🔍 OAuth Response:', { data, error })

      if (error) {
        console.error('❌ OAuth Error:', error)
        throw error
      }

      // Check if we got a URL to open
      if (data?.url) {
        console.log('🔍 Opening OAuth URL:', data.url)
        const supported = await Linking.canOpenURL(data.url)
        if (supported) {
          await Linking.openURL(data.url)
          console.log('✅ OAuth URL opened successfully')
        } else {
          throw new Error('Cannot open OAuth URL')
        }
      } else {
        console.log('⚠️ No OAuth URL received')
      }

      console.log('✅ OAuth initiated successfully')
      return { data, error: null }
    } catch (error: any) {
      console.error('❌ Google Sign-In Error:', error)
      return { 
        data: null, 
        error: { 
          message: error.message || 'Google sign-in failed. Please try again.' 
        } 
      }
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const updateProfile = async (updates: any) => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: updates
      })

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  const resetPassword = async (email: string) => {
    try {
      const cleanEmail = email.trim().toLowerCase()
      
      const { data, error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: 'exp://localhost:8081/reset-password',
      })

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  const value = {
    session,
    user,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    updateProfile,
    resetPassword,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}