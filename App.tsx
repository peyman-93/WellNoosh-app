import React, { useEffect, useRef } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { StatusBar } from 'expo-status-bar'

// Context Providers
import { QueryProvider } from '@/context/query-provider'
import { AuthProvider, setGlobalNavigationRef } from '@/context/supabase-provider'

// Screens
import WelcomeScreen from '@/screens/WelcomeScreen'
import SignUpScreen from '@/screens/SignUpScreen'
import SignInScreen from '@/screens/SignInScreen'
import OnboardingStack from '@/screens/OnboardingStack'
import MainTabs from '@/screens/MainTabs'
import { useAuth } from '@/context/supabase-provider'

const Stack = createNativeStackNavigator()

function AppNavigator() {
  const { session, initialized } = useAuth()
  const navigationRef = useRef<any>(null)

  // Set global navigation reference for auth provider to use
  useEffect(() => {
    if (navigationRef.current) {
      console.log('🔗 Setting global navigation ref...')
      setGlobalNavigationRef(navigationRef.current)
    }
  }, [])

  // Also set it when navigation container is ready
  const onNavigationReady = () => {
    console.log('🔗 Navigation container ready, setting global ref...')
    setGlobalNavigationRef(navigationRef.current)
  }

  // Force re-render debug
  console.log('=== APP NAVIGATOR DEBUG ===')
  console.log('Render timestamp:', new Date().toISOString())
  console.log('Initialized:', initialized)
  console.log('Session exists:', !!session)
  console.log('Session user:', session?.user?.email)

  if (!initialized) {
    console.log('App not initialized yet, showing splash...')
    return null // Show splash screen while initializing
  }

  console.log('Navigation decision:', session ? 'MAIN_TABS' : 'AUTH_STACK')

  return (
    <NavigationContainer 
      ref={navigationRef}
      onReady={onNavigationReady}
    >
      <StatusBar style="auto" />
      <Stack.Navigator 
        initialRouteName={session ? 'MainTabs' : 'Welcome'}
        screenOptions={{ headerShown: false }}
      >
        {/* Always include all screens - navigation is handled by auth provider */}
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="SignIn" component={SignInScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingStack} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}

export default function App() {
  console.log('🚀 APP: Main App component rendering...')
  
  return (
    <QueryProvider>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </QueryProvider>
  )
}