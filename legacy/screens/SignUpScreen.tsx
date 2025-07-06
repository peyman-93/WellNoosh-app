// screens/SignUpScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useGoogleAuth } from '../hooks/useGoogleAuth';

interface SignUpScreenProps {
  navigation?: any;
}

const SignUpScreen: React.FC<SignUpScreenProps> = ({ navigation }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    country: '',
    city: '',
    postalCode: '',
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const { isLoading: googleLoading, signInWithGoogle } = useGoogleAuth();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = () => {
    if (!validateForm()) {
      return;
    }

    console.log('Sign up data:', formData);
    
    // TODO: API call to create account
    Alert.alert(
      'Success!', 
      'Account created successfully!',
      [
        {
          text: 'Continue',
          onPress: () => {
            navigation?.navigate('OnboardingWelcome');
          }
        }
      ]
    );
  };

  const handleGoogleSignUp = async () => {
    const success = await signInWithGoogle();
    
    if (success) {
      Alert.alert(
        'Welcome to WellNoosh!', 
        'Your account has been created with Google. Let\'s personalize your experience!',
        [
          {
            text: 'Continue',
            onPress: () => {
              navigation?.navigate('OnboardingWelcome');
            }
          }
        ]
      );
    }
  };

  const handleSignIn = () => {
    navigation?.navigate('SignIn');
  };

  const goBack = () => {
    navigation?.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <View style={styles.overlay}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.formContainer}>
              {/* Header */}
              <View style={styles.header}>
                <TouchableOpacity onPress={goBack} style={styles.backButton}>
                  <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
                
                <View style={styles.logoContainer}>
                  <View style={styles.logoIcon}>
                    <Text style={styles.logoEmoji}>🍏</Text>
                  </View>
                </View>
                <Text style={styles.title}>Create Account</Text>
                <Text style={styles.subtitle}>
                  Join 50,000+ families eating smarter with WellNoosh
                </Text>
              </View>

              {/* Google Sign Up Option */}
              <TouchableOpacity 
                style={[styles.googleButton, googleLoading && styles.disabledButton]}
                onPress={handleGoogleSignUp}
                activeOpacity={0.8}
                disabled={googleLoading}
              >
                {googleLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#4285F4" />
                    <Text style={styles.googleText}>Signing in with Google...</Text>
                  </View>
                ) : (
                  <View style={styles.googleContent}>
                    <Text style={styles.googleIcon}>🌐</Text>
                    <Text style={styles.googleText}>Continue with Google</Text>
                  </View>
                )}
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Form */}
              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Full Name</Text>
                  <TextInput
                    style={[styles.input, errors.fullName && styles.inputError]}
                    placeholder="Enter your name"
                    placeholderTextColor="#9CA3AF"
                    value={formData.fullName}
                    onChangeText={(value) => handleInputChange('fullName', value)}
                    autoComplete="name"
                    textContentType="name"
                    returnKeyType="next"
                  />
                  {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email Address</Text>
                  <TextInput
                    style={[styles.input, errors.email && styles.inputError]}
                    placeholder="Enter your email"
                    placeholderTextColor="#9CA3AF"
                    value={formData.email}
                    onChangeText={(value) => handleInputChange('email', value)}
                    keyboardType="email-address"
                    autoComplete="email"
                    textContentType="emailAddress"
                    autoCapitalize="none"
                    returnKeyType="next"
                  />
                  {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Password</Text>
                  <TextInput
                    style={[styles.input, errors.password && styles.inputError]}
                    placeholder="Create a password"
                    placeholderTextColor="#9CA3AF"
                    value={formData.password}
                    onChangeText={(value) => handleInputChange('password', value)}
                    secureTextEntry
                    autoComplete="password-new"
                    textContentType="newPassword"
                    returnKeyType="next"
                  />
                  {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Confirm Password</Text>
                  <TextInput
                    style={[styles.input, errors.confirmPassword && styles.inputError]}
                    placeholder="Confirm your password"
                    placeholderTextColor="#9CA3AF"
                    value={formData.confirmPassword}
                    onChangeText={(value) => handleInputChange('confirmPassword', value)}
                    secureTextEntry
                    autoComplete="password-new"
                    textContentType="newPassword"
                    returnKeyType="next"
                  />
                  {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Location</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Country"
                    placeholderTextColor="#9CA3AF"
                    value={formData.country}
                    onChangeText={(value) => handleInputChange('country', value)}
                    returnKeyType="next"
                  />
                  
                  <View style={styles.row}>
                    <TextInput
                      style={[styles.input, styles.flexInput]}
                      placeholder="City"
                      placeholderTextColor="#9CA3AF"
                      value={formData.city}
                      onChangeText={(value) => handleInputChange('city', value)}
                      returnKeyType="next"
                    />
                    <View style={styles.spacer} />
                    <TextInput
                      style={[styles.input, styles.postalInput]}
                      placeholder="Postal Code"
                      placeholderTextColor="#9CA3AF"
                      value={formData.postalCode}
                      onChangeText={(value) => handleInputChange('postalCode', value)}
                      keyboardType="numeric"
                      returnKeyType="done"
                      onSubmitEditing={handleSignUp}
                    />
                  </View>
                </View>

                {/* Sign Up Button */}
                <TouchableOpacity 
                  style={styles.primaryButtonContainer}
                  onPress={handleSignUp}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#10B981', '#3B82F6', '#8B5CF6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.primaryButton}
                  >
                    <Text style={styles.primaryButtonText}>Create Account & Start Trial</Text>
                  </LinearGradient>
                </TouchableOpacity>

                {/* Trial info */}
                <View style={styles.trialInfo}>
                  <Text style={styles.trialText}>✓ Free for 7 days, then €9.99/month. Cancel anytime.</Text>
                </View>

                {/* Sign in link */}
                <TouchableOpacity onPress={handleSignIn} style={styles.signInContainer}>
                  <Text style={styles.signInText}>
                    Already have an account? <Text style={styles.signInLink}>Sign In</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardView: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 16,
    paddingVertical: 8,
  },
  backText: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '500',
  },
  logoContainer: {
    marginBottom: 16,
  },
  logoIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoEmoji: {
    fontSize: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  googleButton: {
    height: 56,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  googleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  googleIcon: {
    fontSize: 16,
  },
  googleText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  disabledButton: {
    opacity: 0.6,
  },
  divider: {
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
    marginHorizontal: 16,
    fontSize: 14,
    color: '#6B7280',
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  input: {
    height: 56,
    borderRadius: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    fontSize: 16,
    color: '#111827',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  flexInput: {
    flex: 2,
  },
  spacer: {
    width: 12,
  },
  postalInput: {
    flex: 1,
  },
  primaryButtonContainer: {
    marginTop: 8,
  },
  primaryButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  trialInfo: {
    alignItems: 'center',
    marginTop: 16,
  },
  trialText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 16,
  },
  signInContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  signInText: {
    fontSize: 14,
    color: '#6B7280',
  },
  signInLink: {
    color: '#3B82F6',
    fontWeight: '600',
  },
});

export default SignUpScreen;