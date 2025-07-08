import React, { useState, useEffect } from 'react'
import { View, Text, SafeAreaView, Alert, Pressable, StyleSheet, ScrollView } from 'react-native'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/context/supabase-provider'

interface SignInScreenProps {
  navigation: any
}

export default function SignInScreen({ navigation }: SignInScreenProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { signIn, session } = useAuth()

  // Monitor session changes and navigate manually if needed
  useEffect(() => {
    console.log('SignInScreen: Session changed:', session ? 'AUTHENTICATED' : 'NOT_AUTHENTICATED')
    
    if (session) {
      console.log('SignInScreen: User is authenticated - attempting manual navigation as fallback')
      // Give App.tsx a chance, then navigate manually
      setTimeout(() => {
        console.log('SignInScreen: Force navigating to MainTabs...')
        try {
          navigation.reset({
            index: 0,
            routes: [{ name: 'MainTabs' }],
          })
        } catch (error) {
          console.error('SignInScreen: Navigation failed:', error)
        }
      }, 1000)
    }
  }, [session, navigation])

  const handleSignIn = async () => {
    setIsLoading(true)
    try {
      console.log('SignInScreen: Starting sign in process...')
      await signIn(email, password)
      console.log('SignInScreen: Sign in completed, waiting for automatic navigation...')
      // Navigation will be handled automatically by the auth state change via useEffect above
    } catch (error: any) {
      console.error('SignInScreen: Sign in failed:', error)
      Alert.alert('Error', error.message || 'Failed to sign in')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Back Button */}
          <View style={styles.backButtonContainer}>
            <Pressable
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Text style={styles.backButtonText}>←</Text>
            </Pressable>
          </View>

          <View style={styles.header}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>
              Sign in to your WellNoosh account
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <Input
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <Input
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="current-password"
              />
            </View>
          </View>

          <View style={styles.actions}>
            <Button
              size="lg"
              onPress={handleSignIn}
              disabled={isLoading || !email || !password}
              style={styles.buttonWrapper}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Don't have an account?{' '}
              </Text>
              <Pressable onPress={() => navigation.navigate('SignUpScreen')}>
                <Text style={styles.link}>Sign Up</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    justifyContent: 'center',
    minHeight: 500,
  },
  backButtonContainer: {
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 18,
    color: '#6B7280',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#6B7280',
    lineHeight: 24,
  },
  form: {
    gap: 20,
    marginBottom: 32,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  actions: {
    gap: 24,
  },
  buttonWrapper: {
    width: '100%',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
  },
  link: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
})