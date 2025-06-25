// screens/RegistrationScreen.tsx
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface RegistrationScreenProps {
  navigation?: any;
}

const RegistrationScreen: React.FC<RegistrationScreenProps> = ({ navigation }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    country: '',
    city: '',
    postalCode: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleStartFreeTrial = () => {
    // Basic validation
    if (!formData.fullName.trim() || !formData.email.trim() || !formData.password.trim()) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    // TODO: Add proper email validation and API call
    console.log('Registration data:', formData);
    
    // Navigate to onboarding welcome
    Alert.alert(
      'Success!', 
      'Account created! Starting personalization...',
      [
        {
          text: 'Continue',
          onPress: () => {
            // navigation?.navigate('OnboardingWelcome');
            Alert.alert('Coming Next', 'Onboarding screens coming up!');
          }
        }
      ]
    );
  };

  const handleSignIn = () => {
    navigation?.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Overlay background */}
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
                <View style={styles.logoContainer}>
                  <View style={styles.logoIcon}>
                    <Text style={styles.logoEmoji}>🍏</Text>
                  </View>
                </View>
                <Text style={styles.title}>Start your journey</Text>
                <Text style={styles.subtitle}>
                  Join 50,000+ families eating smarter with{'\n'}WellNoosh
                </Text>
              </View>

              {/* Form */}
              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Full Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your name"
                    placeholderTextColor="#9CA3AF"
                    value={formData.fullName}
                    onChangeText={(value) => handleInputChange('fullName', value)}
                    autoComplete="name"
                    textContentType="name"
                    returnKeyType="next"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>
                    📍 Location (for local grocery stores & pricing)
                  </Text>
                  <Text style={styles.subLabel}>Country</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Select your country"
                    placeholderTextColor="#9CA3AF"
                    value={formData.country}
                    onChangeText={(value) => handleInputChange('country', value)}
                    returnKeyType="next"
                  />
                  
                  <Text style={styles.subLabel}>City</Text>
                  <View style={styles.row}>
                    <TextInput
                      style={[styles.input, styles.flexInput]}
                      placeholder="e.g. Madrid"
                      placeholderTextColor="#9CA3AF"
                      value={formData.city}
                      onChangeText={(value) => handleInputChange('city', value)}
                      returnKeyType="next"
                    />
                    <View style={styles.spacer} />
                    <TextInput
                      style={[styles.input, styles.postalInput]}
                      placeholder="e.g. 28001"
                      placeholderTextColor="#9CA3AF"
                      value={formData.postalCode}
                      onChangeText={(value) => handleInputChange('postalCode', value)}
                      keyboardType="numeric"
                      returnKeyType="next"
                    />
                  </View>
                </View>

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
                    textContentType="emailAddress"
                    autoCapitalize="none"
                    returnKeyType="next"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Password</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your password"
                    placeholderTextColor="#9CA3AF"
                    value={formData.password}
                    onChangeText={(value) => handleInputChange('password', value)}
                    secureTextEntry
                    autoComplete="password-new"
                    textContentType="newPassword"
                    returnKeyType="done"
                    onSubmitEditing={handleStartFreeTrial}
                  />
                </View>

                {/* CTA Button */}
                <TouchableOpacity 
                  style={styles.primaryButtonContainer}
                  onPress={handleStartFreeTrial}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#10B981', '#3B82F6', '#8B5CF6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.primaryButton}
                  >
                    <Text style={styles.primaryButtonText}>Start Free Trial</Text>
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
    marginBottom: 32,
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
  subLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '400',
    marginTop: 12,
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
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
    marginTop: 16,
  },
  primaryButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
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

export default RegistrationScreen;