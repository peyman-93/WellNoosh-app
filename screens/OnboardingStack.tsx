import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

// Import onboarding screens
import OnboardingWelcomeScreen from '@/screens/onboarding/OnboardingIntroScreen'
import DietPreferencesScreen from '@/screens/onboarding/DietPreferencesScreen'
import BasicHealthProfileScreen from '@/screens/onboarding/BasicHealthProfileScreen'
import AllergiesScreen from '@/screens/onboarding/AllergiesScreen'
import MedicalConditionsScreen from '@/screens/onboarding/MedicalConditionsScreen'
import ActivityLevelScreen from '@/screens/onboarding/ActivityLevelScreen'
import HealthGoalsScreen from '@/screens/onboarding/HealthGoalsScreen'
import CookingPreferencesScreen from '@/screens/onboarding/CookingPreferencesScreen'
import OnboardingCompleteScreen from '@/screens/onboarding/OnboardingCompleteScreen'

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
        name="BasicHealthProfile" 
        component={BasicHealthProfileScreen}
        initialParams={{ userCredentials }}
      />
      <Stack.Screen 
        name="Allergies" 
        component={AllergiesScreen}
        initialParams={{ userCredentials }}
      />
      <Stack.Screen 
        name="MedicalConditions" 
        component={MedicalConditionsScreen}
        initialParams={{ userCredentials }}
      />
      <Stack.Screen 
        name="ActivityLevel" 
        component={ActivityLevelScreen}
        initialParams={{ userCredentials }}
      />
      <Stack.Screen 
        name="HealthGoals" 
        component={HealthGoalsScreen}
        initialParams={{ userCredentials }}
      />
      <Stack.Screen 
        name="CookingPreferences" 
        component={CookingPreferencesScreen}
        initialParams={{ userCredentials }}
      />
      <Stack.Screen 
        name="OnboardingComplete" 
        component={OnboardingCompleteScreen}
        initialParams={{ userCredentials }}
      />
    </Stack.Navigator>
  )
}