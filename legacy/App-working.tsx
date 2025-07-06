import React from 'react'
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
  const { session, initialized } = useAuth()

  if (!initialized) {
    return null // Show splash screen while initializing
  }

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {session ? (
          // User is signed in
          <Stack.Screen name="MainTabs" component={MainTabs} />
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

export default function App() {
  return (
    <QueryProvider>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </QueryProvider>
  )
}