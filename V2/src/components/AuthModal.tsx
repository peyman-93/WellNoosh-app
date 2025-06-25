import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth } = Dimensions.get('window');

interface AuthModalProps {
  isVisible: boolean;
  mode: 'login' | 'signup';
  onClose: () => void;
  onSwitchMode: () => void;
  onAuthenticated: (userData: { name: string; email: string; mode: string }) => void; // FIX: Add userData parameter
}

export default function AuthModal({ 
  isVisible, 
  mode, 
  onClose, 
  onSwitchMode, 
  onAuthenticated 
}: AuthModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    country: '',
    city: '',
    postalCode: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!formData.email.trim()) {
      Alert.alert('Error', 'Email is required');
      return false;
    }
    if (!formData.password) {
      Alert.alert('Error', 'Password is required');
      return false;
    }
    if (mode === 'signup') {
      if (!formData.name.trim()) {
        Alert.alert('Error', 'Name is required');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        Alert.alert('Error', 'Passwords do not match');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    console.log(`🔐 ${mode} completed with data:`, {
      name: formData.name,
      email: formData.email,
      country: formData.country,
      city: formData.city,
      postalCode: formData.postalCode
    });

    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      
      // Create userData object to pass to parent
      const userData = {
        name: mode === 'signup' ? formData.name : 'User',
        email: formData.email,
        mode: mode
      };
      
      console.log('✅ Authentication successful - passing user data:', userData);
      
      // FIX: Remove success popup, directly call callback
      onAuthenticated(userData);
      clearForm();
    }, 1500);
  };

  const handleGoogleAuth = () => {
    Alert.alert('Google Auth', 'Google authentication would be implemented here');
  };

  const clearForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      country: '',
      city: '',
      postalCode: ''
    });
  };

  const handleClose = () => {
    clearForm();
    onClose();
  };

  const countries = [
    'Spain', 'France', 'Italy', 'Germany', 'United Kingdom', 
    'United States', 'Canada', 'Australia', 'Netherlands', 
    'Belgium', 'Switzerland', 'Austria', 'Portugal'
  ];

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={[styles.header, mode === 'login' ? styles.loginHeader : styles.signupHeader]}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            
            <View style={styles.headerContent}>
              <View style={[styles.logoIcon, mode === 'login' ? styles.loginLogo : styles.signupLogo]}>
                <Text style={styles.logoEmoji}>🍏</Text>
              </View>
              
              <Text style={styles.headerTitle}>
                {mode === 'login' ? 'Welcome back' : 'Start your journey'}
              </Text>
              <Text style={styles.headerSubtitle}>
                {mode === 'login' 
                  ? 'Your WellNoosh AI nutritionist missed you' 
                  : 'Join 50,000+ families eating smarter with WellNoosh'
                }
              </Text>
            </View>
          </View>

          {/* Form Container */}
          <View style={styles.formContainer}>
            {/* Google Auth Button */}
            <TouchableOpacity 
              style={styles.googleButton}
              onPress={handleGoogleAuth}
              activeOpacity={0.8}
            >
              <View style={styles.googleContent}>
                <Text style={styles.googleIcon}>🌐</Text>
                <Text style={styles.googleText}>Continue with Google</Text>
              </View>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Form Fields */}
            <View style={styles.form}>
              {mode === 'signup' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Full Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your name"
                    placeholderTextColor="#9CA3AF"
                    value={formData.name}
                    onChangeText={(value) => handleInputChange('name', value)}
                    autoComplete="name"
                    returnKeyType="next"
                  />
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor="#9CA3AF"
                  value={formData.email}
                  onChangeText={(value) => handleInputChange('email', value)}
                  keyboardType="email-address"
                  autoComplete="email"
                  autoCapitalize="none"
                  returnKeyType="next"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder={mode === 'login' ? 'Enter your password' : 'Create a password'}
                    placeholderTextColor="#9CA3AF"
                    value={formData.password}
                    onChangeText={(value) => handleInputChange('password', value)}
                    secureTextEntry={!showPassword}
                    autoComplete={mode === 'login' ? 'password' : 'password-new'}
                    returnKeyType={mode === 'signup' ? 'next' : 'done'}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeButton}
                  >
                    <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {mode === 'signup' && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Confirm Password</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Confirm your password"
                      placeholderTextColor="#9CA3AF"
                      value={formData.confirmPassword}
                      onChangeText={(value) => handleInputChange('confirmPassword', value)}
                      secureTextEntry={!showPassword}
                      returnKeyType="next"
                    />
                  </View>

                  {/* Location Fields */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.subLabel}>Country</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Select your country"
                      placeholderTextColor="#9CA3AF"
                      value={formData.country}
                      onChangeText={(value) => handleInputChange('country', value)}
                      returnKeyType="next"
                    />
                    
                    <Text style={styles.subLabel}>City & Postal Code</Text>
                    <View style={styles.row}>
                      <TextInput
                        style={[styles.input, styles.cityInput]}
                        placeholder="e.g. Madrid"
                        placeholderTextColor="#9CA3AF"
                        value={formData.city}
                        onChangeText={(value) => handleInputChange('city', value)}
                        returnKeyType="next"
                      />
                      <TextInput
                        style={[styles.input, styles.postalInput]}
                        placeholder="e.g. 28001"
                        placeholderTextColor="#9CA3AF"
                        value={formData.postalCode}
                        onChangeText={(value) => handleInputChange('postalCode', value)}
                        keyboardType="numeric"
                        returnKeyType="done"
                      />
                    </View>
                  </View>
                </>
              )}

              {mode === 'login' && (
                <TouchableOpacity style={styles.forgotButton}>
                  <Text style={styles.forgotText}>Forgot Password?</Text>
                </TouchableOpacity>
              )}

              {/* Submit Button */}
              <TouchableOpacity 
                style={styles.submitButtonContainer}
                onPress={handleSubmit}
                activeOpacity={0.8}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={mode === 'login' 
                    ? ['#3B82F6', '#8B5CF6'] 
                    : ['#10B981', '#3B82F6', '#8B5CF6']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.submitButton, isLoading && styles.disabledButton]}
                >
                  {isLoading ? (
                    <View style={styles.loadingContainer}>
                      <Text style={styles.loadingText}>Please wait...</Text>
                    </View>
                  ) : (
                    <Text style={styles.submitButtonText}>
                      {mode === 'login' ? 'Sign In' : 'Create Account & Start Trial'}
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {mode === 'signup' && (
                <View style={styles.trialInfo}>
                  <Text style={styles.trialText}>
                    ✓ Free for 7 days, then €9.99/month. Cancel anytime.
                  </Text>
                </View>
              )}

              {/* Switch Mode */}
              <TouchableOpacity onPress={onSwitchMode} style={styles.switchButton}>
                <Text style={styles.switchText}>
                  {mode === 'login' 
                    ? "Don't have an account? " 
                    : "Already have an account? "
                  }
                  <Text style={styles.switchLink}>
                    {mode === 'login' ? 'Sign up' : 'Sign in'}
                  </Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: 24,
    position: 'relative',
  },
  loginHeader: {
    backgroundColor: '#EFF6FF',
  },
  signupHeader: {
    backgroundColor: '#F0FDF4',
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 24,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#6B7280',
    fontWeight: '500',
  },
  headerContent: {
    alignItems: 'center',
  },
  logoIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  loginLogo: {
    backgroundColor: '#DBEAFE',
  },
  signupLogo: {
    backgroundColor: '#DCFCE7',
  },
  logoEmoji: {
    fontSize: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  formContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
    marginTop: -12,
  },
  googleButton: {
    height: 56,
    borderRadius: 12,
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
  },
  googleIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  googleText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
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
  subLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '400',
    marginTop: 12,
  },
  input: {
    height: 56,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    fontSize: 16,
    color: '#111827',
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    height: 56,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingRight: 50,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    fontSize: 16,
    color: '#111827',
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    padding: 4,
  },
  eyeIcon: {
    fontSize: 20,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  cityInput: {
    flex: 2,
  },
  postalInput: {
    flex: 1,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    paddingVertical: 4,
  },
  forgotText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  submitButtonContainer: {
    marginTop: 8,
    borderRadius: 12,
  },
  submitButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  trialInfo: {
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 16,
  },
  trialText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 16,
  },
  switchButton: {
    alignItems: 'center',
    marginTop: 24,
    paddingVertical: 8,
  },
  switchText: {
    fontSize: 14,
    color: '#6B7280',
  },
  switchLink: {
    color: '#3B82F6',
    fontWeight: '600',
  },
});