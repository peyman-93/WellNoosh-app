import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from "react"
import * as SplashScreen from "expo-splash-screen"
import { Session } from "@supabase/supabase-js"
import { supabase, isSupabaseConfigured } from "@/config/supabase"

SplashScreen.preventAutoHideAsync()

type AuthState = {
  initialized: boolean
  session: Session | null
  signUp: (email: string, password: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthState>({
  initialized: false,
  session: null,
  signUp: async () => {},
  signIn: async () => {},
  signOut: async () => {},
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: PropsWithChildren) {
  const [initialized, setInitialized] = useState(false)
  const [session, setSession] = useState<Session | null>(null)

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

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      console.error("Error signing up:", error)
      throw error
    }

    if (data.session) {
      setSession(data.session)
      console.log("User signed up:", data.user)
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

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error("Error signing in:", error)
      throw error
    }

    if (data.session) {
      setSession(data.session)
      console.log("User signed in:", data.user)
    }
  }

  const signOut = async () => {
    if (!isSupabaseConfigured) {
      console.log("Demo mode: Signing out mock user")
      setSession(null)
      return
    }

    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error("Error signing out:", error)
      throw error
    } else {
      console.log("User signed out")
    }
  }

  useEffect(() => {
    if (!isSupabaseConfigured) {
      console.log("Demo mode: Supabase not configured, using mock auth")
      setInitialized(true)
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    setInitialized(true)
  }, [])

  useEffect(() => {
    if (initialized) {
      SplashScreen.hideAsync()
      // Navigation is now handled by App.tsx based on session state
    }
  }, [initialized])

  return (
    <AuthContext.Provider
      value={{
        initialized,
        session,
        signUp,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}