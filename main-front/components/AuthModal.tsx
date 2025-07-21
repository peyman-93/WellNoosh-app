import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'login' | 'signup';
  onSwitchMode: () => void;
  onAuthenticated: () => void;
}

export function AuthModal({ isOpen, onClose, mode, onSwitchMode, onAuthenticated }: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password || (mode === 'signup' && !name)) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      onAuthenticated();
    }, 1500);
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    
    // Simulate Google OAuth flow
    setTimeout(() => {
      setIsGoogleLoading(false);
      onAuthenticated();
    }, 2000);
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.modalContainer}>
          {/* Backdrop */}
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={onClose}
          />
          
          {/* Modal */}
          <View style={styles.modal}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerContent}>
                <Text style={styles.title}>
                  {mode === 'login' ? 'Welcome Back' : 'Join WellNoosh'}
                </Text>
                <Text style={styles.subtitle}>
                  {mode === 'login' 
                    ? 'Sign in to your account' 
                    : 'Create your account to get started'
                  }
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView 
              style={styles.content}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.contentContainer}>
                {/* Google Sign In Button */}
                <TouchableOpacity
                  style={[styles.googleButton, isGoogleLoading && styles.disabledButton]}
                  onPress={handleGoogleSignIn}
                  disabled={isGoogleLoading}
                >
                  {isGoogleLoading ? (
                    <ActivityIndicator color="#4285F4" size="small" />
                  ) : (
                    <Text style={styles.googleIcon}>G</Text>
                  )}
                  <Text style={styles.googleButtonText}>
                    {isGoogleLoading 
                      ? 'Connecting to Google...' 
                      : 'Continue with Google'
                    }
                  </Text>
                </TouchableOpacity>

                {/* Divider */}
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or continue with email</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Form */}
                <View style={styles.form}>
                  {mode === 'signup' && (
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Full Name</Text>
                      <View style={styles.inputContainer}>
                        <Text style={styles.inputIcon}>👤</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="Enter your full name"
                          value={name}
                          onChangeText={setName}
                          autoComplete="name"
                          textContentType="name"
                        />
                      </View>
                    </View>
                  )}

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Email Address</Text>
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputIcon}>📧</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Enter your email"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoComplete="email"
                        textContentType="emailAddress"
                        autoCapitalize="none"
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Password</Text>
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputIcon}>🔒</Text>
                      <TextInput
                        style={[styles.input, styles.passwordInput]}
                        placeholder="Enter your password"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                        autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                        textContentType={mode === 'signup' ? 'newPassword' : 'password'}
                      />
                      <TouchableOpacity
                        style={styles.eyeButton}
                        onPress={() => setShowPassword(!showPassword)}
                      >
                        <Text style={styles.eyeIcon}>
                          {showPassword ? '🙈' : '👁️'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {mode === 'signup' && (
                    <View style={styles.benefitsContainer}>
                      <View style={styles.benefitsHeader}>
                        <Text style={styles.benefitsIcon}>✓</Text>
                        <Text style={styles.benefitsTitle}>You'll get access to:</Text>
                      </View>
                      <View style={styles.benefitsList}>
                        <Text style={styles.benefitItem}>• Personalized meal planning</Text>
                        <Text style={styles.benefitItem}>• AI nutrition coaching</Text>
                        <Text style={styles.benefitItem}>• Smart grocery optimization</Text>
                        <Text style={styles.benefitItem}>• Family meal coordination</Text>
                      </View>
                    </View>
                  )}

                  <TouchableOpacity
                    style={[styles.submitButton, isLoading && styles.disabledButton]}
                    onPress={handleSubmit}
                    disabled={isLoading}
                  >
                    <LinearGradient
                      colors={['#10b981', '#3b82f6', '#8b5cf6']}
                      style={styles.submitButtonGradient}
                    >
                      {isLoading ? (
                        <View style={styles.loadingContainer}>
                          <ActivityIndicator color="white" size="small" />
                          <Text style={styles.submitButtonText}>
                            {mode === 'login' ? 'Signing In...' : 'Creating Account...'}
                          </Text>
                        </View>
                      ) : (
                        <Text style={styles.submitButtonText}>
                          {mode === 'login' ? 'Sign In' : 'Create Account'}
                        </Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                  <Text style={styles.footerText}>
                    {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
                    <Text
                      style={styles.switchModeText}
                      onPress={onSwitchMode}
                    >
                      {mode === 'login' ? 'Sign Up' : 'Sign In'}
                    </Text>
                  </Text>
                </View>

                {mode === 'signup' && (
                  <View style={styles.legalText}>
                    <Text style={styles.legalTextContent}>
                      By creating an account, you agree to our{' '}
                      <Text style={styles.legalLink}>Terms of Service</Text>
                      {' '}and{' '}
                      <Text style={styles.legalLink}>Privacy Policy</Text>
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modal: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  headerContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  closeButton: {
    position: 'absolute',
    top: 24,
    right: 24,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#6b7280',
  },
  content: {
    maxHeight: '70%',
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    alignItems: 'center',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 320,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    backgroundColor: 'white',
    marginBottom: 24,
  },
  googleIcon: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4285F4',
    marginRight: 12,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  disabledButton: {
    opacity: 0.5,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#6b7280',
    backgroundColor: 'white',
  },
  form: {
    width: '100%',
    maxWidth: 320,
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    backgroundColor: '#f9fafb',
  },
  inputIcon: {
    fontSize: 20,
    marginLeft: 12,
    marginRight: 8,
    color: '#9ca3af',
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    paddingRight: 12,
    fontSize: 16,
    color: '#111827',
  },
  passwordInput: {
    paddingRight: 48,
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    padding: 4,
  },
  eyeIcon: {
    fontSize: 20,
  },
  benefitsContainer: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  benefitsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  benefitsIcon: {
    fontSize: 20,
    color: '#2563eb',
    marginRight: 8,
  },
  benefitsTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e40af',
  },
  benefitsList: {
    gap: 4,
  },
  benefitItem: {
    fontSize: 12,
    color: '#1e40af',
  },
  submitButton: {
    width: '100%',
    borderRadius: 12,
    marginTop: 8,
  },
  submitButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footer: {
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
    color: '#6b7280',
  },
  switchModeText: {
    fontWeight: '600',
    color: '#2563eb',
  },
  legalText: {
    marginTop: 16,
    paddingHorizontal: 8,
  },
  legalTextContent: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 18,
  },
  legalLink: {
    color: '#2563eb',
  },
});