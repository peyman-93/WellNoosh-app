import React, { useEffect, useRef } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { StatusBar } from 'expo-status-bar'

// Context Providers
import { QueryProvider } from '@/context/query-provider'
import { AuthProvider } from '@/context/supabase-provider'

// Screens
import WelcomeScreen from '@/screens/WelcomeScreen'
import SignUpScreen from '@/screens/SignUpScreen'
import SignInScreen from '@/screens/SignInScreen'
import OnboardingStack from '@/screens/OnboardingStack'
import MainTabs from '@/screens/MainTabs'
import { useAuth } from '@/context/supabase-provider'

const Stack = createNativeStackNavigator()

function AppNavigator() {
  const authContext = useAuth()
  const { session, initialized } = authContext

  // Monitor session changes and force re-renders
  useEffect(() => {
    console.log('🔄 AppNavigator: Session changed!', {
      hasSession: !!session,
      userEmail: session?.user?.email,
      timestamp: new Date().toISOString(),
      renderKey: (authContext as any)._renderKey
    })
    
    // Force re-render by logging the decision
    if (session) {
      console.log('🔄 AppNavigator: Should show MAIN_TABS')
    } else {
      console.log('🔄 AppNavigator: Should show AUTH_STACK')
    }
  }, [session, (authContext as any)._renderKey])

  // Force re-render debug
  console.log('=== APP NAVIGATOR DEBUG ===')
  console.log('Render timestamp:', new Date().toISOString())
  console.log('Initialized:', initialized)
  console.log('Session exists:', !!session)
  console.log('Session user:', session?.user?.email)
  console.log('Session object:', session ? 'HAS_SESSION' : 'NO_SESSION')

  if (!initialized) {
    console.log('App not initialized yet, showing splash...')
    return null // Show splash screen while initializing
  }

  console.log('Navigation decision:', session ? 'MAIN_TABS' : 'AUTH_STACK')

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator 
        key={`${session ? 'authenticated' : 'unauthenticated'}-${(authContext as any)._renderKey || 0}`}
        screenOptions={{ headerShown: false }}
      >
        {session ? (
          // User is signed in
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            {/* Add Welcome to authenticated stack for sign out fallback */}
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
          </>
        ) : (
          // User is not signed in
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
            <Stack.Screen name="SignIn" component={SignInScreen} />
            <Stack.Screen name="Onboarding" component={OnboardingStack} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}

// Wrapper component to ensure AuthProvider is properly connected
function AppContent() {
  console.log('=== APP CONTENT RENDER ===')
  const { session, initialized } = useAuth()
  
  console.log('AppContent render - Session:', !!session, 'Initialized:', initialized)
  
  return <AppNavigator />
}

export default function App() {
  return (
    <QueryProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </QueryProvider>
  )
}