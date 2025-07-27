import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

// Import onboarding screens
import OnboardingWelcomeScreen from './onboarding/OnboardingIntroScreen'
import DietPreferencesScreen from './onboarding/DietPreferencesScreen'
import BasicHealthProfileScreen from './onboarding/BasicHealthProfileScreen'
import AllergiesScreen from './onboarding/AllergiesScreen'
import MedicalConditionsScreen from './onboarding/MedicalConditionsScreen'
import ActivityLevelScreen from './onboarding/ActivityLevelScreen'
import HealthGoalsScreen from './onboarding/HealthGoalsScreen'
import CookingPreferencesScreen from './onboarding/CookingPreferencesScreen'
import OnboardingCompleteScreen from './onboarding/OnboardingCompleteScreen'

const Stack = createNativeStackNavigator()

export default function OnboardingStack({ route, onComplete }: { route?: any, onComplete?: () => void }) {
  const userCredentials = route?.params?.userCredentials;
  
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
        initialParams={{ userCredentials, onComplete }}
      />
    </Stack.Navigator>
  )
}