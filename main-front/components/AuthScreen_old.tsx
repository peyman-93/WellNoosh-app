import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { supabase } from '../src/services/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthScreenProps {
  onAuthenticated: (mode: 'login' | 'signup' | 'google', userInfo: any) => void;
  initialMode: 'login' | 'signup' | 'google';
}

export function AuthScreen({ onAuthenticated, initialMode }: AuthScreenProps) {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleSubmit = async () => {
    if (mode === 'signup') {
      if (!email || !password || !fullName || !country || !city || !postalCode) {
        Alert.alert('Error', 'Please fill in all fields');
        return;
      }
      
      try {
        console.log('🔄 Attempting to sign up with Supabase...');
        console.log('Email:', email);
        console.log('Email length:', email.length);
        console.log('Email trimmed:', email.trim());
        console.log('Supabase URL:', process.env.EXPO_PUBLIC_SUPABASE_URL);
        
        // Clean and validate email
        const cleanEmail = email.trim().toLowerCase();
        
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(cleanEmail)) {
          Alert.alert('Invalid Email', 'Please enter a valid email address.');
          return;
        }
        
        // Sign up with Supabase
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            emailRedirectTo: 'http://localhost:3000',
            data: {
              full_name: fullName,
              country,
              city,
              postal_code: postalCode
            }
          }
        });

        console.log('Supabase response:', { data, error });

        if (error) {
          console.error('Supabase signup error:', error);
          Alert.alert('Signup Error', error.message);
          return;
        }

        if (data.user && data.session) {
          // Store session for API client
          const session = {
            access_token: data.session.access_token,
            user: {
              id: data.user.id,
              email: data.user.email,
              fullName
            },
            expires_at: Date.now() + (24 * 60 * 60 * 1000)
          };

          await AsyncStorage.setItem('wellnoosh_session', JSON.stringify(session));
          
          // Create user profile in backend database
          try {
            console.log('🔄 Creating user profile in database...');
            const profileResponse = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/auth/signup`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${data.session.access_token}`
              },
              body: JSON.stringify({
                userId: data.user.id,
                fullName,
                email: cleanEmail,
                country,
                city,
                postalCode
              })
            });

            if (profileResponse.ok) {
              console.log('✅ User profile created in database');
            } else {
              console.log('⚠️ Profile creation failed but continuing with auth');
            }
          } catch (error) {
            console.log('⚠️ Profile creation error but continuing with auth:', error);
          }
          
          const userInfo = {
            fullName,
            email,
            country,
            city,
            postalCode,
            userId: data.user.id
          };

          onAuthenticated(mode, userInfo);
        } else if (data.user && !data.session) {
          // User created but needs email confirmation
          Alert.alert(
            'Check Your Email!', 
            'We sent you a confirmation link. Please check your email and click the link to activate your account. Once confirmed, you can sign in with your credentials.',
            [{ text: 'OK', onPress: () => setMode('login') }]
          );
        }
      } catch (error: any) {
        console.error('Full signup error:', error);
        console.error('Error stack:', error.stack);
        Alert.alert('Error', `Failed to create account: ${error.message}`);
      }
    } else {
      // Login mode
      if (!email || !password) {
        Alert.alert('Error', 'Please fill in all fields');
        return;
      }
      
      try {
        // Clean and validate email
        const cleanEmail = email.trim().toLowerCase();
        
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(cleanEmail)) {
          Alert.alert('Invalid Email', 'Please enter a valid email address.');
          return;
        }
        
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password
        });

        if (error) {
          Alert.alert('Login Error', error.message);
          return;
        }

        if (data.user) {
          // Store session for API client
          const session = {
            access_token: data.session?.access_token || '',
            user: {
              id: data.user.id,
              email: data.user.email,
              fullName: data.user.user_metadata?.full_name || 'User'
            },
            expires_at: Date.now() + (24 * 60 * 60 * 1000)
          };

          await AsyncStorage.setItem('wellnoosh_session', JSON.stringify(session));
          
          const userInfo = {
            fullName: data.user.user_metadata?.full_name || 'User',
            email: data.user.email,
            country: data.user.user_metadata?.country || '',
            city: data.user.user_metadata?.city || '',
            postalCode: data.user.user_metadata?.postal_code || '',
            userId: data.user.id
          };

          onAuthenticated(mode, userInfo);
        }
      } catch (error: any) {
        Alert.alert('Error', 'Failed to login');
        console.error('Login error:', error);
      }
    }
  };

  const handleGoogleSignIn = () => {
    // Mock Google authentication
    const userInfo = {
      fullName: 'Google User',
      email: 'user@gmail.com',
      country: 'United States',
      city: 'San Francisco',
      postalCode: '94102',
    };
    
    // Pass the appropriate mode based on current form state
    if (mode === 'login') {
      // User is in Sign In mode - treat as login
      onAuthenticated('login', userInfo);
    } else {
      // User is in Sign Up mode - treat as Google signup (needs profile completion)
      onAuthenticated('google', userInfo);
    }
  };

  const handleForgotPassword = () => {
    if (!email) {
      Alert.alert('Email Required', 'Please enter your email address to reset your password.');
      return;
    }
    
    // Mock password reset functionality
    Alert.alert(
      'Password Reset Sent',
      `A password reset link has been sent to ${email}. Please check your email and follow the instructions to reset your password.`,
      [
        {
          text: 'OK',
          onPress: () => setShowForgotPassword(false)
        }
      ]
    );
  };


  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {mode === 'signup' ? 'Create Account' : 'Welcome Back'}
          </Text>
          <Text style={styles.subtitle}>
            {mode === 'signup' 
              ? 'Join WellNoosh and start your healthy cooking journey'
              : 'Sign in to continue your wellness journey'
            }
          </Text>
        </View>
        
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
          autoComplete="email"
          textContentType="emailAddress"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {mode === 'login' && (
          <TouchableOpacity
            style={styles.forgotPasswordButton}
            onPress={handleForgotPassword}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>
        )}

        {mode === 'signup' && (
          <>
            <TextInput
              style={styles.input}
              placeholder="Country"
              value={country}
              onChangeText={setCountry}
              autoCapitalize="words"
            />
            
            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="City"
                value={city}
                onChangeText={setCity}
                autoCapitalize="words"
              />
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="Postal Code"
                value={postalCode}
                onChangeText={setPostalCode}
                autoCapitalize="characters"
              />
            </View>
          </>
        )}
        
        {mode === 'login' && (
          <>
            <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignIn}>
              <Text style={styles.googleButtonText}>
                🔗 Continue with Google
              </Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>
          </>
        )}

        <TouchableOpacity style={styles.primaryButton} onPress={handleSubmit}>
          <Text style={styles.primaryButtonText}>
            {mode === 'signup' ? 'Create Account' : 'Sign In'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.switchButton}
          onPress={() => setMode(mode === 'signup' ? 'login' : 'signup')}
        >
          <Text style={styles.switchButtonText}>
            {mode === 'signup' 
              ? 'Already have an account? Sign In' 
              : "Don't have an account? Sign Up"
            }
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 40,
    minHeight: '100%',
    justifyContent: 'center',
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#111827',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#6b7280',
    lineHeight: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#f9fafb',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    paddingHorizontal: 16,
    color: '#6b7280',
    fontSize: 14,
  },
  googleButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  googleButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '500',
  },
  switchButton: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 16,
  },
  switchButtonText: {
    color: '#6b7280',
    fontSize: 14,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: 16,
    marginTop: -8,
  },
  forgotPasswordText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '500',
  },
});