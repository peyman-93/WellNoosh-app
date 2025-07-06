// screens/SignInScreen.tsx
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

interface SignInScreenProps {
  navigation?: any;
}

const SignInScreen: React.FC<SignInScreenProps> = ({ navigation }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
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

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = () => {
    if (!validateForm()) {
      return;
    }

    console.log('Sign in data:', formData);
    
    // TODO: API call to authenticate user
    Alert.alert(
      'Welcome Back!', 
      'Signed in successfully!',
      [
        {
          text: 'Continue',
          onPress: () => {
            // Navigate to main app (user already onboarded)
            // navigation?.navigate('MainApp');
            Alert.alert('Success', 'Redirecting to main app...');
          }
        }
      ]
    );
  };

  const handleGoogleSignIn = async () => {
    const success = await signInWithGoogle();
    
    if (success) {
      Alert.alert(
        'Welcome Back!', 
        'Successfully signed in with Google!',
        [
          {
            text: 'Continue',
            onPress: () => {
              // Navigate to main app for existing users
              Alert.alert('Success', 'Redirecting to main app...');
            }
          }
        ]
      );
    }
  };

  const handleForgotPassword = () => {
    Alert.alert('Forgot Password', 'Password reset coming soon!');
  };

  const handleSignUp = () => {
    navigation?.navigate('SignUp');
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
                <Text style={styles.title}>Welcome Back</Text>
                <Text style={styles.subtitle}>
                  Sign in to your WellNoosh account
                </Text>
              </View>

              {/* Google Sign In Option */}
              <TouchableOpacity 
                style={[styles.googleButton, googleLoading && styles.disabledButton]}
                onPress={handleGoogleSignIn}
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
                    placeholder="Enter your password"
                    placeholderTextColor="#9CA3AF"
                    value={formData.password}
                    onChangeText={(value) => handleInputChange('password', value)}
                    secureTextEntry
                    autoComplete="password"
                    textContentType="password"
                    returnKeyType="done"
                    onSubmitEditing={handleSignIn}
                  />
                  {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
                </View>

                {/* Forgot Password */}
                <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotContainer}>
                  <Text style={styles.forgotText}>Forgot Password?</Text>
                </TouchableOpacity>

                {/* Sign In Button */}
                <TouchableOpacity 
                  style={styles.primaryButtonContainer}
                  onPress={handleSignIn}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#10B981', '#3B82F6', '#8B5CF6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.primaryButton}
                  >
                    <Text style={styles.primaryButtonText}>Sign In</Text>
                  </LinearGradient>
                </TouchableOpacity>

                {/* Sign up link */}
                <TouchableOpacity onPress={handleSignUp} style={styles.signUpContainer}>
                  <Text style={styles.signUpText}>
                    Don't have an account? <Text style={styles.signUpLink}>Sign Up</Text>
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
    marginBottom: 32,
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
    marginBottom: 32,
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
    gap: 24,
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
  forgotContainer: {
    alignItems: 'flex-end',
    marginTop: -8,
  },
  forgotText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
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
  signUpContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  signUpText: {
    fontSize: 14,
    color: '#6B7280',
  },
  signUpLink: {
    color: '#3B82F6',
    fontWeight: '600',
  },
});

export default SignInScreen;