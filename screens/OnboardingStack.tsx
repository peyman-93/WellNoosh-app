import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

// Import onboarding screens (we'll convert the expo-router ones)
import OnboardingWelcomeScreen from '@/screens/onboarding/WelcomeScreen'
import DietPreferencesScreen from '@/screens/onboarding/DietPreferencesScreen'
import AllergiesScreen from '@/screens/onboarding/AllergiesScreen'

const Stack = createNativeStackNavigator()

export default function OnboardingStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OnboardingWelcome" component={OnboardingWelcomeScreen} />
      <Stack.Screen name="DietPreferences" component={DietPreferencesScreen} />
      <Stack.Screen name="Allergies" component={AllergiesScreen} />
    </Stack.Navigator>
  )
}