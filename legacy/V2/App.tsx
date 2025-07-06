import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Alert, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Import our screens and components
import LandingScreen from './src/screens/LandingScreen';
import AuthModal from './src/components/AuthModal';
import OnboardingFlow from './src/screens/OnboardingFlow';
import MainApp from './src/screens/MainApp';

const Stack = createStackNavigator();

interface User {
  name: string;
  fullName: string; // Keep full name for records
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

  // FIXED: Extract first name and remove Alert message
  const handleAuthenticated = (userData: { name: string; email: string; mode: string }) => {
    console.log('🎉 Authentication successful!');
    console.log('📧 Email:', userData.email);
    console.log('👤 Full Name:', userData.name);
    console.log('🔐 Mode:', userData.mode);
    
    // Extract first name (first word before space)
    const firstName = userData.name.split(' ')[0] || 'User';
    console.log('✨ First Name:', firstName);
    
    const newUser: User = {
      name: firstName, // Use first name for display
      fullName: userData.name, // Keep full name for records
      email: userData.email,
      onboardingComplete: false,
      onboardingData: null
    };

    console.log('✅ Created user object:', newUser);
    
    setUser(newUser);
    setIsAuthenticated(true);
    setShowAuth(false);
    
    // FIXED: Removed Alert.alert - smooth transition to onboarding
  };

  const handleOnboardingComplete = (onboardingData: any) => {
    if (user) {
      const updatedUser: User = {
        ...user,
        onboardingComplete: true,
        onboardingData: onboardingData
      };
      
      console.log('📋 Onboarding completed with data:', onboardingData);
      console.log('👤 Updated user:', updatedUser);
      
      setUser(updatedUser);
      
      // FIXED: Simplified completion message - no popup, just console log
      console.log('🌟 Setup complete! User entering main app...');
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            console.log('🚪 User signed out');
            setUser(null);
            setIsAuthenticated(false);
            setShowAuth(false);
          }
        }
      ]
    );
  };

  // Show onboarding if user is authenticated but hasn't completed onboarding
  if (isAuthenticated && user && !user.onboardingComplete) {
    return (
      <View style={styles.container}>
        <StatusBar style="auto" />
        <OnboardingFlow 
          onComplete={handleOnboardingComplete}
          userName={user.name} // Pass first name to onboarding
        />
      </View>
    );
  }

  // Show main app if user has completed onboarding
  if (isAuthenticated && user && user.onboardingComplete) {
    return (
      <View style={styles.container}>
        <StatusBar style="auto" />
        <MainApp 
          user={user}
          onSignOut={handleSignOut}
        />
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
});