import React, { useEffect, useRef } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { StatusBar } from 'expo-status-bar'

// Context Providers
import { QueryProvider } from '@/context/query-provider'
import { AuthProvider, setGlobalNavigationRef } from '@/context/supabase-provider'
import { UserDataProvider } from '@/context/user-data-provider'

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

  // Handle navigation when session changes  
  useEffect(() => {
    // Wait a bit after initialization to ensure navigation is ready
    const timer = setTimeout(() => {
      if (!initialized || !navigationRef.current?.isReady()) {
        return
      }

      const currentRoute = navigationRef.current.getCurrentRoute()?.name
      console.log('Current route:', currentRoute, 'Session:', !!session)

      // Navigate to MainTabs when authenticated
      if (session && currentRoute !== 'MainTabs') {
        console.log('User authenticated, navigating to MainTabs')
        navigationRef.current.reset({
          index: 0,
          routes: [{ name: 'MainTabs' }],
        })
      }
      // Navigate to WelcomeScreen when signed out (but only if we're on MainTabs)
      else if (!session && currentRoute === 'MainTabs') {
        console.log('User signed out, navigating to WelcomeScreen')
        navigationRef.current.reset({
          index: 0,
          routes: [{ name: 'WelcomeScreen' }],
        })
      }
    }, 500) // Wait 500ms to ensure navigation is ready

    return () => clearTimeout(timer)
  }, [session, initialized])

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
      onStateChange={(state) => {
        console.log('Navigation state changed:', state?.routes[state.index]?.name)
      }}
    >
      <StatusBar style="auto" />
      <Stack.Navigator 
        initialRouteName={session ? 'MainTabs' : 'WelcomeScreen'}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="WelcomeScreen" component={WelcomeScreen} />
        <Stack.Screen name="SignUpScreen" component={SignUpScreen} />
        <Stack.Screen name="SignInScreen" component={SignInScreen} />
        <Stack.Screen name="OnboardingStack" component={OnboardingStack} />
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
        <UserDataProvider>
          <AppNavigator />
        </UserDataProvider>
      </AuthProvider>
    </QueryProvider>
  )
}