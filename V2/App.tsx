import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Alert, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Import our screens and components
import LandingScreen from './src/screens/LandingScreen';
import AuthModal from './src/components/AuthModal';
import OnboardingFlow from './src/screens/OnboardingFlow';

const Stack = createStackNavigator();

interface User {
  name: string;
  email: string;
  onboardingComplete: boolean;
  onboardingData?: any;
}

export default function App() {
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleShowLogin = () => {
    setAuthMode('login');
    setShowAuth(true);
  };

  const handleShowSignup = () => {
    setAuthMode('signup');
    setShowAuth(true);
  };

  const handleCloseAuth = () => {
    setShowAuth(false);
  };

  const handleSwitchMode = () => {
    setAuthMode(authMode === 'login' ? 'signup' : 'login');
  };

  // FIX: This function now receives userData from AuthModal
  const handleAuthenticated = (userData: { name: string; email: string; mode: string }) => {
    console.log('🎉 Authentication successful!');
    console.log('📧 Email:', userData.email);
    console.log('👤 Name:', userData.name);
    console.log('🔐 Mode:', userData.mode);
    
    const newUser: User = {
      name: userData.name || 'User',
      email: userData.email,
      onboardingComplete: false,
      onboardingData: null
    };

    console.log('✅ Created user object:', newUser);
    
    setUser(newUser);
    setIsAuthenticated(true);
    setShowAuth(false);
    
    Alert.alert('Success!', `Welcome ${newUser.name}! 🎉`);
  };

  const handleOnboardingComplete = (onboardingData: any) => {
    if (user) {
      // Update user with onboarding data
      const updatedUser: User = {
        ...user,
        onboardingComplete: true,
        onboardingData: onboardingData
      };
      
      console.log('📋 Onboarding completed with data:', onboardingData);
      console.log('👤 Updated user:', updatedUser);
      
      setUser(updatedUser);
      
      Alert.alert(
        'Setup Complete!', 
        'Your personalized nutrition experience is ready! 🌟\n\nCheck the console to see your data.',
        [
          {
            text: 'Great!',
            onPress: () => {
              console.log('✅ User ready for main app');
            }
          }
        ]
      );
    }
  };

  // Show onboarding if user is authenticated but hasn't completed onboarding
  if (isAuthenticated && user && !user.onboardingComplete) {
    return (
      <View style={styles.container}>
        <StatusBar style="auto" />
        <OnboardingFlow 
          onComplete={handleOnboardingComplete}
          userName={user.name}
        />
      </View>
    );
  }

  // Show completion message if user has completed onboarding
  if (isAuthenticated && user && user.onboardingComplete) {
    return (
      <View style={styles.container}>
        <StatusBar style="auto" />
        <View style={styles.completionContainer}>
          <Text style={styles.completionTitle}>
            🎉 Onboarding Complete!
          </Text>
          <Text style={styles.completionText}>
            Welcome {user.name}!
          </Text>
          <Text style={styles.completionSubtext}>
            Your data has been logged to the console.
            {'\n\n'}Step 6 (Main App) will be implemented next.
          </Text>
          <Text style={styles.debugInfo}>
            Debug Info:{'\n'}
            Diet: {user.onboardingData?.dietType}{'\n'}
            Allergies: {user.onboardingData?.allergies?.length || 0}{'\n'}
            Medical: {user.onboardingData?.medicalConditions?.length || 0}{'\n'}
            Family: {user.onboardingData?.justMe ? 'Just Me' : `${user.onboardingData?.familyMembers?.length || 0} members`}
          </Text>
        </View>
      </View>
    );
  }

  // Show landing screen and auth if not authenticated
  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName="Landing"
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="Landing">
            {(props) => (
              <LandingScreen 
                {...props}
                onShowLogin={handleShowLogin}
                onShowSignup={handleShowSignup}
              />
            )}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>

      {/* Auth Modal */}
      <AuthModal
        isVisible={showAuth}
        mode={authMode}
        onClose={handleCloseAuth}
        onSwitchMode={handleSwitchMode}
        onAuthenticated={handleAuthenticated}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  completionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 32,
  },
  completionTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 16,
  },
  completionText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#3B82F6',
    textAlign: 'center',
    marginBottom: 16,
  },
  completionSubtext: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  debugInfo: {
    fontSize: 14,
    color: '#374151',
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
    fontFamily: 'monospace',
    textAlign: 'left',
  },
});