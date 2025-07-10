import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { QueryProvider } from './context/query-provider';
import { AuthProvider } from './context/supabase-provider';

// Import the screens
import WelcomeScreen from './screens/WelcomeScreen';
import SignUpScreen from './screens/SignUpScreen';
import SignInScreen from './screens/SignInScreen';
import OnboardingStack from './screens/OnboardingStack';
import MainTabs from './screens/MainTabs';

export type RootStackParamList = {
  WelcomeScreen: undefined;
  SignUpScreen: undefined;
  SignInScreen: undefined;
  OnboardingStack: { userCredentials?: { email: string; password: string } };
  MainTabs: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function DeveloperApp() {
  return (
    <QueryProvider>
      <AuthProvider>
        <NavigationContainer>
          <StatusBar style="auto" />
          <Stack.Navigator 
            screenOptions={{ headerShown: false }}
            initialRouteName="WelcomeScreen"
          >
            <Stack.Screen name="WelcomeScreen" component={WelcomeScreen} />
            <Stack.Screen name="SignUpScreen" component={SignUpScreen} />
            <Stack.Screen name="SignInScreen" component={SignInScreen} />
            <Stack.Screen name="OnboardingStack" component={OnboardingStack} />
            <Stack.Screen name="MainTabs" component={MainTabs} />
          </Stack.Navigator>
        </NavigationContainer>
      </AuthProvider>
    </QueryProvider>
  );
}