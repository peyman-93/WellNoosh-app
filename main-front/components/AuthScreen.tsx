import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native'
import { useAuth } from '../src/context/supabase-provider'
import { CountryCityPicker } from '../src/components/CountryCityPicker'

interface AuthScreenProps {
  onAuthenticated: () => void
  initialMode: 'login' | 'signup' | 'google'
}

// Postal code validation patterns by country
const postalCodePatterns: { [key: string]: { pattern: RegExp; example: string } } = {
  'United States': { pattern: /^\d{5}(-\d{4})?$/, example: '12345 or 12345-6789' },
  'Canada': { pattern: /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/, example: 'A1B 2C3' },
  'United Kingdom': { pattern: /^[A-Za-z]{1,2}\d[A-Za-z\d]?\s?\d[A-Za-z]{2}$/, example: 'SW1A 1AA' },
  'Germany': { pattern: /^\d{5}$/, example: '12345' },
  'France': { pattern: /^\d{5}$/, example: '75001' },
  'Australia': { pattern: /^\d{4}$/, example: '2000' },
  'Netherlands': { pattern: /^\d{4}\s?[A-Za-z]{2}$/, example: '1234 AB' },
  'Italy': { pattern: /^\d{5}$/, example: '00100' },
  'Spain': { pattern: /^\d{5}$/, example: '28001' },
  'Belgium': { pattern: /^\d{4}$/, example: '1000' },
};

// City-specific postal code prefixes
const cityPostalPrefixes: { [country: string]: { [city: string]: { prefixes: string[]; example: string } } } = {
  'Spain': {
    'Madrid': { prefixes: ['28'], example: '28001-28054' },
    'Barcelona': { prefixes: ['08'], example: '08001-08042' },
    'Valencia': { prefixes: ['46'], example: '46001-46026' },
    'Seville': { prefixes: ['41'], example: '41001-41020' },
    'Bilbao': { prefixes: ['48'], example: '48001-48015' },
  },
  'Italy': {
    'Rome': { prefixes: ['00'], example: '00100-00199' },
    'Milan': { prefixes: ['20'], example: '20100-20199' },
    'Naples': { prefixes: ['80'], example: '80100-80147' },
    'Turin': { prefixes: ['10'], example: '10100-10156' },
    'Florence': { prefixes: ['50'], example: '50100-50145' },
  },
  'Germany': {
    'Berlin': { prefixes: ['10', '12', '13', '14'], example: '10115-14199' },
    'Munich': { prefixes: ['80', '81'], example: '80331-81929' },
    'Hamburg': { prefixes: ['20', '21', '22'], example: '20095-22769' },
    'Frankfurt': { prefixes: ['60', '65'], example: '60306-65936' },
    'Cologne': { prefixes: ['50', '51'], example: '50667-51149' },
  },
  'France': {
    'Paris': { prefixes: ['75'], example: '75001-75020' },
    'Lyon': { prefixes: ['69'], example: '69001-69009' },
    'Marseille': { prefixes: ['13'], example: '13001-13016' },
    'Toulouse': { prefixes: ['31'], example: '31000-31500' },
    'Nice': { prefixes: ['06'], example: '06000-06300' },
  },
  'Netherlands': {
    'Amsterdam': { prefixes: ['10', '11'], example: '1011 AB' },
    'Rotterdam': { prefixes: ['30', '31'], example: '3011 AB' },
    'The Hague': { prefixes: ['25'], example: '2511 AB' },
    'Utrecht': { prefixes: ['35'], example: '3511 AB' },
    'Eindhoven': { prefixes: ['56'], example: '5611 AB' },
  },
  'Belgium': {
    'Brussels': { prefixes: ['10', '11', '12'], example: '1000-1210' },
    'Antwerp': { prefixes: ['20', '21'], example: '2000-2180' },
    'Ghent': { prefixes: ['90'], example: '9000-9052' },
    'Bruges': { prefixes: ['80'], example: '8000-8380' },
    'Liège': { prefixes: ['40'], example: '4000-4102' },
  },
  'Australia': {
    'Sydney': { prefixes: ['20'], example: '2000-2234' },
    'Melbourne': { prefixes: ['30', '31', '32'], example: '3000-3207' },
    'Brisbane': { prefixes: ['40'], example: '4000-4179' },
    'Perth': { prefixes: ['60'], example: '6000-6169' },
    'Adelaide': { prefixes: ['50'], example: '5000-5173' },
  },
  'United Kingdom': {
    'London': { prefixes: ['E', 'EC', 'N', 'NW', 'SE', 'SW', 'W', 'WC'], example: 'SW1A 1AA' },
    'Manchester': { prefixes: ['M'], example: 'M1 1AA' },
    'Birmingham': { prefixes: ['B'], example: 'B1 1AA' },
    'Liverpool': { prefixes: ['L'], example: 'L1 1AA' },
    'Edinburgh': { prefixes: ['EH'], example: 'EH1 1AA' },
  },
  'Canada': {
    'Toronto': { prefixes: ['M'], example: 'M5V 1A1' },
    'Vancouver': { prefixes: ['V'], example: 'V6B 1A1' },
    'Montreal': { prefixes: ['H'], example: 'H3A 1A1' },
    'Calgary': { prefixes: ['T'], example: 'T2P 1A1' },
    'Ottawa': { prefixes: ['K'], example: 'K1A 0A1' },
  },
  'United States': {
    'New York': { prefixes: ['100', '101', '102', '103', '104', '110', '111', '112', '113', '114'], example: '10001-11499' },
    'Los Angeles': { prefixes: ['900', '901', '902', '903', '904', '905', '906', '907', '908', '910', '911', '912', '913', '914', '915', '916', '917', '918'], example: '90001-91899' },
    'Chicago': { prefixes: ['606', '607', '608'], example: '60601-60827' },
    'Houston': { prefixes: ['770', '771', '772', '773', '774', '775'], example: '77001-77599' },
    'Miami': { prefixes: ['331', '332', '333'], example: '33101-33299' },
  },
};

const validatePostalCode = (countryName: string, code: string, cityName?: string): { valid: boolean; message: string } => {
  if (!code || code.trim() === '') {
    return { valid: false, message: 'Postal code is required' };
  }

  const trimmedCode = code.trim().toUpperCase();
  const normalizedCountry = countryName.trim().toLowerCase();
  const countryEntry = Object.entries(postalCodePatterns).find(
    ([key]) => key.toLowerCase() === normalizedCountry
  );
  
  if (!countryEntry) {
    return { valid: true, message: '' };
  }

  const [countryKey, countryPattern] = countryEntry;

  if (!countryPattern.pattern.test(trimmedCode)) {
    return { 
      valid: false, 
      message: `Invalid postal code for ${countryKey}. Example: ${countryPattern.example}` 
    };
  }

  // Validate city-specific prefix if city is provided
  if (cityName) {
    const countryPrefixes = cityPostalPrefixes[countryKey];
    if (countryPrefixes) {
      const normalizedCity = cityName.trim().toLowerCase();
      const cityEntry = Object.entries(countryPrefixes).find(
        ([key]) => key.toLowerCase() === normalizedCity
      );
      
      if (cityEntry) {
        const [cityKey, cityData] = cityEntry;
        const codeStart = trimmedCode.replace(/\s/g, '');
        const hasValidPrefix = cityData.prefixes.some(prefix => 
          codeStart.toUpperCase().startsWith(prefix.toUpperCase())
        );
        
        if (!hasValidPrefix) {
          return {
            valid: false,
            message: `Invalid postal code for ${cityKey}. Valid range: ${cityData.example}`
          };
        }
      }
    }
  }

  return { valid: true, message: '' };
};

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
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async () => {
    if (mode === 'signup') {
      const newErrors: Record<string, string> = {}
      
      if (!email) newErrors.email = 'Email is required'
      if (!password) newErrors.password = 'Password is required'
      if (!fullName) newErrors.fullName = 'Full name is required'
      if (!country) newErrors.country = 'Country is required'
      if (!city) newErrors.city = 'City is required'
      
      if (!postalCode) {
        newErrors.postalCode = 'Postal code is required'
      } else if (country) {
        const postalValidation = validatePostalCode(country, postalCode, city)
        if (!postalValidation.valid) {
          newErrors.postalCode = postalValidation.message
        }
      }
      
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors)
        return
      }
      
      setErrors({})
      
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
    console.log('🔍 Google button pressed')
    setLoading(true)
    try {
      console.log('🔍 Calling signInWithGoogle...')
      const { data, error } = await signInWithGoogle()

      console.log('🔍 signInWithGoogle result:', { data, error })

      if (error) {
        console.error('❌ Error from signInWithGoogle:', error)
        Alert.alert('Google Sign In Error', error.message)
        setLoading(false)
        return
      }

      // OAuth flow will open in browser
      // Don't call onAuthenticated here - it will be handled by the auth state change listener
      // when the user returns from Google OAuth
      
      console.log('✅ Google Sign-In initiated successfully')
      setLoading(false)
    } catch (error) {
      console.error('❌ Unexpected error in handleGoogleSignIn:', error)
      Alert.alert('Error', 'An unexpected error occurred. Please try again.')
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
          <>
            <TextInput
              style={[styles.input, errors.fullName && styles.inputError]}
              placeholder="Full Name"
              value={fullName}
              onChangeText={(text) => {
                setFullName(text)
                if (errors.fullName) {
                  setErrors(prev => ({ ...prev, fullName: '' }))
                }
              }}
              autoCapitalize="words"
            />
            {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}
          </>
        )}

        <TextInput
          style={[styles.input, errors.email && styles.inputError]}
          placeholder="Email"
          value={email}
          onChangeText={(text) => {
            setEmail(text)
            if (errors.email) {
              setErrors(prev => ({ ...prev, email: '' }))
            }
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

        <TextInput
          style={[styles.input, errors.password && styles.inputError]}
          placeholder="Password"
          value={password}
          onChangeText={(text) => {
            setPassword(text)
            if (errors.password) {
              setErrors(prev => ({ ...prev, password: '' }))
            }
          }}
          secureTextEntry
        />
        {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

        {mode === 'signup' && (
          <>
            <CountryCityPicker
              selectedCountry={country}
              selectedCity={city}
              onCountryChange={(selectedCountry) => {
                setCountry(selectedCountry)
                if (errors.country) {
                  setErrors(prev => ({ ...prev, country: '' }))
                }
              }}
              onCityChange={(selectedCity) => {
                setCity(selectedCity)
                if (errors.city) {
                  setErrors(prev => ({ ...prev, city: '' }))
                }
              }}
              countryError={errors.country}
              cityError={errors.city}
            />

            <TextInput
              style={[styles.input, errors.postalCode && styles.inputError]}
              placeholder="Postal Code"
              value={postalCode}
              onChangeText={(text) => {
                setPostalCode(text)
                if (errors.postalCode) {
                  setErrors(prev => ({ ...prev, postalCode: '' }))
                }
              }}
              autoCapitalize="characters"
            />
            {errors.postalCode && <Text style={styles.errorText}>{errors.postalCode}</Text>}
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
  inputError: {
    borderColor: '#FF6B6B',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
    marginTop: -12,
    marginBottom: 16,
    marginLeft: 4,
  },
})