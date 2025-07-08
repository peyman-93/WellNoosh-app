import React, { useState } from 'react'
import { View, Text, SafeAreaView, Pressable, StyleSheet, Alert } from 'react-native'
import { Button } from '@/components/ui/button'
import { Colors } from '@/constants/DesignTokens'
import { useAuth } from '@/context/supabase-provider'

interface WelcomeScreenProps {
  navigation: any
}

export default function WelcomeScreen({ navigation }: WelcomeScreenProps) {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const { signInWithGoogle } = useAuth()

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
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>WellNoosh</Text>
          <Text style={styles.subtitle}>Your Personal Meal Planning Assistant</Text>
          <Text style={styles.description}>
            Set dietary goals, discover recipes, track pantry items, and minimize food waste
          </Text>
        </View>
        
        <View style={styles.buttonContainer}>
          <Button 
            size="lg" 
            onPress={handleGoogleSignIn}
            disabled={isGoogleLoading}
            style={[styles.buttonWrapper, styles.googleButton]}
          >
            {isGoogleLoading ? 'Signing in...' : '🔍 Continue with Google'}
          </Button>
          
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>
          
          <Button size="lg" onPress={() => navigation.navigate('SignUpScreen')} style={[styles.buttonWrapper, styles.getStartedButton]}>
            Get Started with Email
          </Button>
          
          <Button variant="outline" size="lg" onPress={() => navigation.navigate('SignInScreen')} style={styles.buttonWrapper}>
            Sign In with Email
          </Button>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 32,
    maxWidth: 320,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#1F2937',
    fontFamily: 'System', // Will use system font, can be replaced with custom font
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 22,
    textAlign: 'center',
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: '#6B7280',
    lineHeight: 24,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 320,
    gap: 16,
  },
  buttonWrapper: {
    width: '100%',
  },
  getStartedButton: {
    backgroundColor: Colors.success, // Health-focused green
  },
  googleButton: {
    backgroundColor: '#4285f4', // Google blue
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#6B7280',
  },
})