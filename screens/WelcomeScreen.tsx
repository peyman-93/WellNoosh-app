import React, { useState } from 'react'
import { Alert } from 'react-native'
import { LandingScreen } from '@/screens/v3/LandingScreen'
import { useAuth } from '@/context/supabase-provider'

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
        // Navigation will be handled automatically by auth state change
        // For demo mode, we might need to manually navigate
        if (result.session) {
          // Session is available immediately, navigation should happen
          console.log('Session available, navigation should occur automatically')
        } else {
          // For OAuth flow, wait a bit for auth state change
          console.log('Waiting for OAuth callback...')
          setTimeout(() => {
            // If still no session after 5 seconds, show message
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
    <LandingScreen 
      onGetStarted={handleGetStarted}
      onSignIn={handleSignIn}
    />
  )
}

