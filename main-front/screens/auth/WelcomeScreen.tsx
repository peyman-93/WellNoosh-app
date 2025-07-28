import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useAuth } from '../../src/context/supabase-provider'
import { ScreenWrapper } from '../../src/components/layout/ScreenWrapper'

interface WelcomeScreenProps {
  navigation: any
}

export default function WelcomeScreen({ navigation }: WelcomeScreenProps) {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const { signInWithGoogle } = useAuth()

  const handleGetStarted = () => {
    console.log('WelcomeScreen: Navigating to SignUpScreen')
    navigation.navigate('SignUpScreen')
  }

  const handleSignIn = () => {
    console.log('WelcomeScreen: Navigating to SignInScreen')
    navigation.navigate('SignInScreen')
  }

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true)
    try {
      const result = await signInWithGoogle()
      
      if (result.type === 'success') {
        console.log('Google sign-in successful')
        if (result.session) {
          console.log('Session available, navigation should occur automatically')
        } else {
          console.log('Waiting for OAuth callback...')
          setTimeout(() => {
            Alert.alert('Info', 'Please complete the authentication in your browser, then return to the app.')
          }, 5000)
        }
      } else if (result.type === 'cancel') {
        console.log('Google sign-in cancelled')
        Alert.alert('Cancelled', 'Google sign-in was cancelled')
      } else {
        Alert.alert('Error', result.error || 'Google sign-in failed')
      }
    } catch (error: any) {
      console.error('Google sign-in error:', error)
      Alert.alert('Error', error.message || 'Google sign-in failed')
    } finally {
      setIsGoogleLoading(false)
    }
  }

  return (
    <ScreenWrapper>
      <LinearGradient
        colors={['#F0FDF4', '#DBEAFE', '#FAF5FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
      <View style={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.title}>🥗</Text>
          <Text style={styles.heading}>Welcome to WellNoosh</Text>
          <Text style={styles.subtitle}>
            Your smart meal planning companion for healthy, delicious meals
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.primaryButton} 
            onPress={handleGetStarted}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryButton} 
            onPress={handleSignIn}
          >
            <Text style={styles.secondaryButtonText}>Sign In</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.googleButton} 
            onPress={handleGoogleSignIn}
            disabled={isGoogleLoading}
          >
            <Text style={styles.googleButtonText}>
              {isGoogleLoading ? 'Loading...' : '🔍 Continue with Google'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      </LinearGradient>
    </ScreenWrapper>
  )
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  hero: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 64,
    marginBottom: 16,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  actions: {
    gap: 16,
  },
  primaryButton: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  secondaryButtonText: {
    color: '#1F2937',
    fontSize: 18,
    fontWeight: '600',
  },
  googleButton: {
    backgroundColor: 'white',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  googleButtonText: {
    color: '#1F2937',
    fontSize: 16,
    fontWeight: '500',
  },
})