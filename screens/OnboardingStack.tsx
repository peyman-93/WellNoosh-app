import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

// Import onboarding screens (we'll convert the expo-router ones)
import OnboardingWelcomeScreen from '@/screens/onboarding/OnboardingIntroScreen'
import DietPreferencesScreen from '@/screens/onboarding/DietPreferencesScreen'
import AllergiesScreen from '@/screens/onboarding/AllergiesScreen'

const Stack = createNativeStackNavigator()

export default function OnboardingStack({ route }: any) {
  const userCredentials = route.params?.userCredentials;
  
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="OnboardingWelcome" 
        component={OnboardingWelcomeScreen}
        initialParams={{ userCredentials }}
      />
      <Stack.Screen 
        name="DietPreferences" 
        component={DietPreferencesScreen}
        initialParams={{ userCredentials }}
      />
      <Stack.Screen 
        name="Allergies" 
        component={AllergiesScreen}
        initialParams={{ userCredentials }}
      />
    </Stack.Navigator>
  )
}