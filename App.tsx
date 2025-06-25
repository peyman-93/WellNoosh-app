// App.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Import screens
import LandingScreen from './screens/LandingScreen';
import SignUpScreen from './screens/SignUpScreen';
import SignInScreen from './screens/SignInScreen';

// Onboarding screens
import OnboardingWelcomeScreen from './screens/OnboardingWelcomeScreen';
import DietPreferencesScreen from './screens/DietPreferencesScreen';

// Import remaining onboarding screens
import AllergiesScreen from './screens/AllergiesScreen';
// import MedicalConditionsScreen from './screens/MedicalConditionsScreen';
// import FamilySetupScreen from './screens/FamilySetupScreen';
// import PersonalizationScreen from './screens/PersonalizationScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Landing"
        screenOptions={{
          headerShown: false, // Hide default headers
          gestureEnabled: true,
          cardStyleInterpolator: ({ current, layouts }) => {
            return {
              cardStyle: {
                transform: [
                  {
                    translateX: current.progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [layouts.screen.width, 0],
                    }),
                  },
                ],
              },
            };
          },
        }}
      >
        {/* Authentication Screens */}
        <Stack.Screen 
          name="Landing" 
          component={LandingScreen}
        />
        <Stack.Screen 
          name="SignUp" 
          component={SignUpScreen}
        />
        <Stack.Screen 
          name="SignIn" 
          component={SignInScreen}
        />

        {/* Onboarding Screens */}
        <Stack.Screen 
          name="OnboardingWelcome" 
          component={OnboardingWelcomeScreen}
        />
        <Stack.Screen 
          name="DietPreferences" 
          component={DietPreferencesScreen}
        />
        <Stack.Screen 
          name="Allergies" 
          component={AllergiesScreen}
        />
        
        {/* TODO: Add remaining onboarding screens
        <Stack.Screen name="MedicalConditions" component={MedicalConditionsScreen} />
        <Stack.Screen name="FamilySetup" component={FamilySetupScreen} />
        <Stack.Screen name="Personalization" component={PersonalizationScreen} />
        */}

        {/* TODO: Add main app screens
        <Stack.Screen name="MainApp" component={MainTabNavigator} />
        */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}