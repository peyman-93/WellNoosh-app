import React, { useState } from 'react'
import { View, Text, SafeAreaView, Alert, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useAuth } from '@/context/supabase-provider'

interface SignUpScreenProps {
  navigation: any
}

export default function SignUpScreen({ navigation }: SignUpScreenProps) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [country, setCountry] = useState('')
  const [city, setCity] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { signUp, signInWithGoogle } = useAuth()

  const handleInputChange = (field: string, value: string) => {
    if (field === 'fullName') setFullName(value)
    if (field === 'email') setEmail(value)
    if (field === 'password') setPassword(value)
    if (field === 'confirmPassword') setConfirmPassword(value)
    if (field === 'country') setCountry(value)
    if (field === 'city') setCity(value)
    if (field === 'postalCode') setPostalCode(value)
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!fullName) {
      newErrors.fullName = 'Full name is required'
    }

    if (!email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email'
    }

    if (!password) {
      newErrors.password = 'Password is required'
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    if (!country) {
      newErrors.country = 'Country is required'
    }

    if (!city) {
      newErrors.city = 'City is required'
    }

    if (!postalCode) {
      newErrors.postalCode = 'Postal code is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSignUp = async () => {
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    try {
      // For now, just validate inputs and proceed to onboarding
      // We'll handle actual account creation after onboarding is complete
      console.log('User info validated:', { email, password, fullName, country, city, postalCode })
      Alert.alert('Success', 'Account info validated! Let\'s complete your profile.')
      navigation.navigate('OnboardingStack', { 
        userCredentials: { email, password, fullName, country, city, postalCode } 
      })
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to validate account info')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    setIsLoading(true)
    try {
      console.log('SignUpScreen: Starting Google sign up...')
      const result = await signInWithGoogle()
      if (result.type === 'error') {
        Alert.alert('Error', result.error || 'Google sign-up failed')
      }
    } catch (error: any) {
      console.error('SignUpScreen: Google sign up failed:', error)
      Alert.alert('Error', 'Failed to sign up with Google')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <LinearGradient
      colors={['#F0FDF4', '#DBEAFE', '#FAF5FF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>🌿</Text>
            </View>
            <Text style={styles.brandTitle}>WellNoosh</Text>
            <Text style={styles.brandSubtitle}>Your AI-powered nutrition companion</Text>
          </View>
        </View>

        {/* Auth Form */}
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.formContainer}>
            <View style={styles.formWrapper}>
              {/* Google Sign-Up Button */}
              <TouchableOpacity
                onPress={handleGoogleSignUp}
                disabled={isLoading}
                style={styles.googleButton}
              >
                <Text style={styles.googleIcon}>🌐</Text>
                <Text style={styles.googleButtonText}>
                  {isLoading ? 'Signing up...' : 'Continue with Google'}
                </Text>
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>Or continue with email</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Full Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputIcon}>👤</Text>
                  <TextInput
                    style={[styles.input, errors.fullName && styles.inputError]}
                    placeholder="Enter your full name"
                    value={fullName}
                    onChangeText={(value) => handleInputChange('fullName', value)}
                    autoCapitalize="words"
                    autoComplete="name"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}
              </View>

              {/* Email */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputIcon}>📧</Text>
                  <TextInput
                    style={[styles.input, errors.email && styles.inputError]}
                    placeholder="Enter your email"
                    value={email}
                    onChangeText={(value) => handleInputChange('email', value)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
              </View>

              {/* Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputIcon}>🔒</Text>
                  <TextInput
                    style={[styles.input, errors.password && styles.inputError]}
                    placeholder="Create a password"
                    value={password}
                    onChangeText={(value) => handleInputChange('password', value)}
                    secureTextEntry={!showPassword}
                    autoComplete="new-password"
                    placeholderTextColor="#9CA3AF"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeButton}
                  >
                    <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
                  </TouchableOpacity>
                </View>
                {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
              </View>

              {/* Confirm Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm Password</Text>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputIcon}>🔒</Text>
                  <TextInput
                    style={[styles.input, errors.confirmPassword && styles.inputError]}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChangeText={(value) => handleInputChange('confirmPassword', value)}
                    secureTextEntry={!showConfirmPassword}
                    autoComplete="new-password"
                    placeholderTextColor="#9CA3AF"
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeButton}
                  >
                    <Text style={styles.eyeIcon}>{showConfirmPassword ? '🙈' : '👁️'}</Text>
                  </TouchableOpacity>
                </View>
                {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
              </View>

              {/* Location Fields */}
              <View style={styles.locationContainer}>
                <View style={styles.locationRow}>
                  <View style={[styles.inputGroup, styles.locationInputHalf]}>
                    <Text style={styles.label}>Country</Text>
                    <View style={styles.inputContainer}>
                      <TextInput
                        style={[styles.input, errors.country && styles.inputError]}
                        placeholder="Country"
                        value={country}
                        onChangeText={(value) => handleInputChange('country', value)}
                        autoCapitalize="words"
                        placeholderTextColor="#9CA3AF"
                      />
                    </View>
                    {errors.country && <Text style={styles.errorText}>{errors.country}</Text>}
                  </View>

                  <View style={[styles.inputGroup, styles.locationInputHalf]}>
                    <Text style={styles.label}>City</Text>
                    <View style={styles.inputContainer}>
                      <TextInput
                        style={[styles.input, errors.city && styles.inputError]}
                        placeholder="City"
                        value={city}
                        onChangeText={(value) => handleInputChange('city', value)}
                        autoCapitalize="words"
                        placeholderTextColor="#9CA3AF"
                      />
                    </View>
                    {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Postal Code</Text>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputIcon}>📍</Text>
                    <TextInput
                      style={[styles.input, errors.postalCode && styles.inputError]}
                      placeholder="Enter postal code"
                      value={postalCode}
                      onChangeText={(value) => handleInputChange('postalCode', value)}
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                  {errors.postalCode && <Text style={styles.errorText}>{errors.postalCode}</Text>}
                </View>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                onPress={handleSignUp}
                disabled={isLoading}
                style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
              >
                <LinearGradient
                  colors={['#10B981', '#3B82F6', '#8B5CF6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitButtonGradient}
                >
                  {isLoading ? (
                    <View style={styles.loadingContainer}>
                      <View style={styles.loadingSpinner} />
                      <Text style={styles.submitButtonText}>Creating Account...</Text>
                    </View>
                  ) : (
                    <Text style={styles.submitButtonText}>Create Account</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Terms */}
              <View style={styles.termsContainer}>
                <Text style={styles.termsText}>
                  By creating an account, you agree to our{' '}
                  <Text style={styles.termsLink}>Terms of Service</Text>
                  {' '}and{' '}
                  <Text style={styles.termsLink}>Privacy Policy</Text>
                </Text>
              </View>

              {/* Footer */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  Already have an account?{' '}
                </Text>
                <TouchableOpacity onPress={() => navigation.navigate('SignInScreen')}>
                  <Text style={styles.footerLink}>Sign In</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingTop: 32,
    paddingBottom: 24,
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  logoText: {
    fontSize: 36,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    fontFamily: 'System',
  },
  brandSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'System',
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  formWrapper: {
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  googleIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    fontFamily: 'System',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'System',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    fontFamily: 'System',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  inputIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    paddingVertical: 12,
    fontFamily: 'System',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  eyeButton: {
    padding: 4,
  },
  eyeIcon: {
    fontSize: 20,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
    fontFamily: 'System',
  },
  locationContainer: {
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  locationInputHalf: {
    flex: 1,
    marginBottom: 0,
  },
  submitButton: {
    marginTop: 8,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingSpinner: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderTopColor: '#FFFFFF',
    borderRadius: 10,
    marginRight: 8,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'System',
  },
  termsContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  termsText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
    fontFamily: 'System',
  },
  termsLink: {
    color: '#3B82F6',
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'System',
  },
  footerLink: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
    fontFamily: 'System',
  },
})