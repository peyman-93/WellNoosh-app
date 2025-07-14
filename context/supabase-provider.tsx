import React, {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from "react"
import * as SplashScreen from "expo-splash-screen"
import { Session } from "@supabase/supabase-js"
import { supabase, isSupabaseConfigured } from "@/config/supabase"
import { createGoogleAuthService, GoogleAuthResult } from "@/services/GoogleAuthService"

// Global navigation reference for direct navigation control
let globalNavigationRef: any = null
export const setGlobalNavigationRef = (ref: any) => {
  globalNavigationRef = ref
  console.log('Global navigation ref set:', !!ref)
}

SplashScreen.preventAutoHideAsync()

type AuthState = {
  initialized: boolean
  session: Session | null
  signUp: (email: string, password: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<GoogleAuthResult>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthState>({
  initialized: false,
  session: null,
  signUp: async () => {},
  signIn: async () => {},
  signInWithGoogle: async () => ({ type: 'error', error: 'Not implemented' }),
  signOut: async () => {},
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: PropsWithChildren) {
  const [initialized, setInitialized] = useState(false)
  const [session, setSession] = useState<Session | null>(null)
  const [forceRender, setForceRender] = useState(0)

  const signUp = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      console.log("Demo mode: Creating mock user session")
      // Create a mock session for development
      const mockSession = {
        access_token: 'mock-token',
        user: { id: 'mock-user-id', email }
      } as Session
      setSession(mockSession)
      return
    }

    console.log("=== SUPABASE SIGNUP DEBUG ===")
    console.log("Email attempting to sign up:", email)
    console.log("Email length:", email.length)
    console.log("Email includes @:", email.includes('@'))
    console.log("Email domain:", email.split('@')[1])
    console.log("Supabase URL:", process.env.EXPO_PUBLIC_SUPABASE_URL)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      console.error("=== SUPABASE ERROR DEBUG ===")
      console.error("Full error object:", JSON.stringify(error, null, 2))
      console.error("Error message:", error.message)
      console.error("Error status:", error.status)
      console.error("Error statusCode:", error.statusCode)
      console.error("Error name:", error.name)
      console.error("Error __isAuthError:", (error as any).__isAuthError)
      
      // Check for specific error types
      if (error.message.includes('invalid')) {
        console.error("❌ Email validation failed - this is likely a Supabase configuration issue")
        console.error("💡 Suggestions:")
        console.error("  1. Check if email confirmations are enabled in Supabase dashboard")
        console.error("  2. Check if there are domain restrictions")
        console.error("  3. Try a different email domain")
        console.error("  4. Check rate limiting")
      }
      
      throw error
    }

    if (data.session) {
      setSession(data.session)
      console.log("✅ User signed up successfully:", data.user?.email)
    } else if (data.user) {
      console.log("📧 User created, email confirmation may be required:", data.user.email)
      console.log("Confirmation sent at:", data.user.email_confirmed_at)
    }
  }

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      console.log("Demo mode: Creating mock user session")
      // Create a mock session for development
      const mockSession = {
        access_token: 'mock-token',
        user: { id: 'mock-user-id', email }
      } as Session
      setSession(mockSession)
      return
    }

    console.log("=== SUPABASE SIGNIN DEBUG ===")
    console.log("Email attempting to sign in:", email)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error("=== SUPABASE SIGNIN ERROR ===")
      console.error("Full error object:", JSON.stringify(error, null, 2))
      console.error("Error message:", error.message)
      console.error("Error status:", error.status)
      
      if (error.message.includes('Invalid login credentials')) {
        console.error("❌ Invalid credentials - either:")
        console.error("  1. Email/password combination is wrong")
        console.error("  2. Account doesn't exist yet (need to sign up first)")
        console.error("  3. Email confirmation is required but not completed")
      }
      
      throw error
    }

    if (data.session) {
      setSession(data.session)
      console.log("✅ User signed in successfully:", data.user?.email)
    }
  }

  const signInWithGoogle = async (): Promise<GoogleAuthResult> => {
    if (!isSupabaseConfigured) {
      console.log("Demo mode: Creating mock Google user session")
      const mockSession = {
        access_token: 'mock-google-token',
        user: { id: 'mock-google-user-id', email: 'mock-google@example.com' }
      } as Session
      setSession(mockSession)
      return { type: 'success', session: mockSession }
    }

    try {
      const googleAuthService = createGoogleAuthService()
      const result = await googleAuthService.signInWithGoogleDirect()
      
      if (result.type === 'success') {
        // Check if we already got a session
        if (result.session) {
          setSession(result.session)
        } else {
          // Wait a moment for the auth state change to trigger
          console.log('Waiting for auth state change after OAuth...')
          // The session will be set by the auth state listener in useEffect
        }
      }
      
      return result
    } catch (error: any) {
      console.error("Error with Google sign-in:", error)
      return { type: 'error', error: error.message || 'Google authentication failed' }
    }
  }

  const signOut = async () => {
    if (!isSupabaseConfigured) {
      console.log("Demo mode: Signing out mock user")
      setSession(null)
      setForceRender(prev => prev + 1)
      return
    }

    console.log("=== SUPABASE SIGNOUT DEBUG ===")
    console.log("Starting sign out process...")

    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error("Error signing out:", error)
      throw error
    } else {
      console.log("✅ User signed out successfully")
      // Force clear session state immediately
      setSession(null)
      setForceRender(prev => prev + 1)
      
      // The auth state change should also trigger, but ensure immediate update
      setTimeout(() => {
        console.log("Sign out complete, navigation should switch to auth stack")
      }, 100)
    }
  }

  useEffect(() => {
    if (!isSupabaseConfigured) {
      console.log("Demo mode: Supabase not configured, using mock auth")
      setInitialized(true)
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session ? 'Session found' : 'No session')
      console.log('Initial session user:', session?.user?.email)
      setSession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('=== AUTH STATE CHANGE ===')
      console.log('Event:', event)
      console.log('Session present:', !!session)
      console.log('Session user:', session?.user?.email)
      console.log('Setting session in state...')
      
      // Force state update with multiple state changes to ensure re-renders
      setSession(session)
      setForceRender(prev => prev + 1)
      
      // Navigation is now handled by conditional rendering in App.tsx
      console.log('AUTH: Session state changed, navigation will be handled by conditional rendering')
      
      // Force multiple renders to ensure all components update (especially for sign out)
      setTimeout(() => {
        console.log('Session state updated, current session:', !!session)
        console.log('Forcing context re-render... Render count:', forceRender + 1)
        setForceRender(prev => prev + 1)
        
        // For sign out, force additional re-renders
        if (event === 'SIGNED_OUT') {
          console.log('SIGNED_OUT detected - forcing extra re-renders...')
          setTimeout(() => {
            setForceRender(prev => prev + 1)
            console.log('Extra re-render forced for sign out')
          }, 50)
        }
      }, 100)
    })

    setInitialized(true)
    
    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (initialized) {
      SplashScreen.hideAsync()
      // Navigation is now handled by App.tsx based on session state
    }
  }, [initialized])

  // Create context value that changes when forceRender changes
  const contextValue = React.useMemo(() => ({
    initialized,
    session,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    _renderKey: forceRender, // This will force re-renders
  }), [initialized, session, forceRender])

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}