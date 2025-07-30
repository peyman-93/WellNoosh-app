import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native'
import { useAuth } from '../src/context/supabase-provider'

interface AuthScreenProps {
  onAuthenticated: () => void
  initialMode: 'login' | 'signup' | 'google'
}

export function AuthScreen({ onAuthenticated, initialMode }: AuthScreenProps) {
  const { signUp, signIn, signInWithGoogle, resetPassword } = useAuth()
  const [mode, setMode] = useState(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [country, setCountry] = useState('')
  const [city, setCity] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (mode === 'signup') {
      if (!email || !password || !fullName || !country || !city || !postalCode) {
        Alert.alert('Error', 'Please fill in all fields')
        return
      }
      
      setLoading(true)
      try {
        const { data, error } = await signUp(email, password, {
          fullName,
          country,
          city,
          postalCode
        })

        if (error) {
          Alert.alert('Signup Error', error.message)
          return
        }

        if (data.user && data.session) {
          Alert.alert('Success', 'Account created successfully!')
          onAuthenticated()
        } else if (data.user && !data.session) {
          Alert.alert('Check your email', 'Please check your email for a confirmation link to complete your registration.')
        }
      } catch (error) {
        Alert.alert('Error', 'An unexpected error occurred. Please try again.')
      } finally {
        setLoading(false)
      }
    } else {
      // Login
      if (!email || !password) {
        Alert.alert('Error', 'Please enter email and password')
        return
      }

      setLoading(true)
      try {
        const { data, error } = await signIn(email, password)

        if (error) {
          Alert.alert('Login Error', error.message)
          return
        }

        if (data.session) {
          onAuthenticated()
        }
      } catch (error) {
        Alert.alert('Error', 'An unexpected error occurred. Please try again.')
      } finally {
        setLoading(false)
      }
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    try {
      const { data, error } = await signInWithGoogle()

      if (error) {
        Alert.alert('Google Sign In Error', error.message)
        return
      }

      // Google OAuth will handle the redirect
      onAuthenticated()
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Enter Email', 'Please enter your email address first')
      return
    }

    setLoading(true)
    try {
      const { data, error } = await resetPassword(email)

      if (error) {
        Alert.alert('Reset Password Error', error.message)
        return
      }

      Alert.alert(
        'Reset Email Sent', 
        'Please check your email for password reset instructions.',
        [{ text: 'OK', onPress: () => setShowForgotPassword(false) }]
      )
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>
          {mode === 'signup' ? 'Create Account' : 'Welcome Back'}
        </Text>
        <Text style={styles.subtitle}>
          {mode === 'signup' 
            ? 'Join WellNoosh to start your wellness journey' 
            : 'Sign in to your WellNoosh account'
          }
        </Text>

        {mode === 'signup' && (
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
          />
        )}

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {mode === 'signup' && (
          <>
            <TextInput
              style={styles.input}
              placeholder="Country"
              value={country}
              onChangeText={setCountry}
              autoCapitalize="words"
            />

            <TextInput
              style={styles.input}
              placeholder="City"
              value={city}
              onChangeText={setCity}
              autoCapitalize="words"
            />

            <TextInput
              style={styles.input}
              placeholder="Postal Code"
              value={postalCode}
              onChangeText={setPostalCode}
              autoCapitalize="characters"
            />
          </>
        )}

        <TouchableOpacity 
          style={[styles.primaryButton, loading && styles.buttonDisabled]} 
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.primaryButtonText}>
            {loading ? 'Loading...' : (mode === 'signup' ? 'Create Account' : 'Sign In')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.googleButton, loading && styles.buttonDisabled]} 
          onPress={handleGoogleSignIn}
          disabled={loading}
        >
          <Text style={styles.googleButtonText}>Continue with Google</Text>
        </TouchableOpacity>

        {mode === 'login' && (
          <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotButton}>
            <Text style={styles.forgotButtonText}>Forgot Password?</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={() => setMode(mode === 'signup' ? 'login' : 'signup')}
          style={styles.switchButton}
        >
          <Text style={styles.switchButtonText}>
            {mode === 'signup' 
              ? 'Already have an account? Sign In' 
              : "Don't have an account? Sign Up"
            }
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    backgroundColor: '#FAF7F0',
    padding: 20,
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#4A4A4A',
    textAlign: 'center',
    marginBottom: 32,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  primaryButton: {
    backgroundColor: '#6B8E23',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  googleButtonText: {
    color: '#1A1A1A',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  forgotButton: {
    alignItems: 'center',
    marginBottom: 16,
  },
  forgotButtonText: {
    color: '#6B8E23',
    fontSize: 14,
    fontWeight: '500',
  },
  switchButton: {
    alignItems: 'center',
  },
  switchButtonText: {
    color: '#4A4A4A',
    fontSize: 14,
  },
})