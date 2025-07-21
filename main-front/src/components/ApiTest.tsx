import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { apiClient } from '../services/apiClient';
import { healthService } from '../services/healthService';
import { supabase } from '../services/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function ApiTest() {
  const [testResult, setTestResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testHealthEndpoint = async () => {
    setLoading(true);
    try {
      const result = await apiClient.healthCheck();
      setTestResult(`✅ Backend Connected!\nStatus: ${result.status}\nService: ${result.service}\nTime: ${new Date(result.timestamp).toLocaleTimeString()}`);
      Alert.alert('Success!', 'Backend connection successful!');
    } catch (error: any) {
      setTestResult(`❌ Connection Failed:\n${error.message}`);
      Alert.alert('Error', `Failed to connect: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testWaterTracking = async () => {
    setLoading(true);
    try {
      // First get current water intake
      const currentIntake = await healthService.getWaterIntake();
      setTestResult(`📊 Current Water Intake:\n${JSON.stringify(currentIntake, null, 2)}`);
      
      // Then update with a test glass
      const updateData = {
        date: new Date().toISOString().split('T')[0],
        glasses: [true, false, false, false, false, false, false, false],
        dailyGoal: 8
      };
      
      const updated = await healthService.updateWaterIntake(updateData);
      setTestResult(prev => prev + `\n\n✅ Updated Water Intake:\n${JSON.stringify(updated, null, 2)}`);
      Alert.alert('Success!', 'Water tracking test completed!');
    } catch (error: any) {
      setTestResult(`❌ Water Tracking Failed:\n${error.message}`);
      Alert.alert('Error', `Failed to test water tracking: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testBreathingTracking = async () => {
    setLoading(true);
    try {
      // First get current breathing exercises
      const currentExercises = await healthService.getBreathingExercises();
      setTestResult(`🧘 Current Breathing Exercises:\n${JSON.stringify(currentExercises, null, 2)}`);
      
      // Then update with a test session
      const updateData = {
        date: new Date().toISOString().split('T')[0],
        exercises: [true, false, false, false, false, false],
        dailyGoal: 6
      };
      
      const updated = await healthService.updateBreathingExercises(updateData);
      setTestResult(prev => prev + `\n\n✅ Updated Breathing Exercises:\n${JSON.stringify(updated, null, 2)}`);
      Alert.alert('Success!', 'Breathing exercises test completed!');
    } catch (error: any) {
      setTestResult(`❌ Breathing Tracking Failed:\n${error.message}`);
      Alert.alert('Error', `Failed to test breathing tracking: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testUserRegistration = async () => {
    setLoading(true);
    try {
      const testEmail = 'test@wellnoosh.com';
      const testPassword = 'testpassword123';
      
      setTestResult('🔄 Creating new user account...');
      
      // Sign up with Supabase
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
          data: {
            full_name: 'Test User'
          }
        }
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        // Store session for our API client
        const session = {
          access_token: data.session?.access_token || '',
          user: {
            id: data.user.id,
            email: data.user.email,
            fullName: 'Test User'
          },
          expires_at: Date.now() + (24 * 60 * 60 * 1000)
        };

        await AsyncStorage.setItem('wellnoosh_session', JSON.stringify(session));
        
        setTestResult(`✅ User Created Successfully!\nUser ID: ${data.user.id}\nEmail: ${data.user.email}\nNow you can test water/breathing tracking!`);
        Alert.alert('Success!', 'User created! Now try the water/breathing tests.');
      }
    } catch (error: any) {
      setTestResult(`❌ User Registration Failed:\n${error.message}`);
      Alert.alert('Error', `Registration failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🔗 Health Tracking Test</Text>
      
      <TouchableOpacity 
        style={styles.testButton} 
        onPress={testHealthEndpoint}
        disabled={loading}
      >
        <Text style={styles.testButtonText}>
          {loading ? '⏳ Testing...' : '🚀 Test Backend Connection'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.testButton, styles.registerButton]} 
        onPress={testUserRegistration}
        disabled={loading}
      >
        <Text style={styles.testButtonText}>
          {loading ? '⏳ Testing...' : '👤 Create Test User'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.testButton, styles.waterButton]} 
        onPress={testWaterTracking}
        disabled={loading}
      >
        <Text style={styles.testButtonText}>
          {loading ? '⏳ Testing...' : '💧 Test Water Tracking'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.testButton, styles.breathingButton]} 
        onPress={testBreathingTracking}
        disabled={loading}
      >
        <Text style={styles.testButtonText}>
          {loading ? '⏳ Testing...' : '🧘 Test Breathing Exercises'}
        </Text>
      </TouchableOpacity>

      {testResult && (
        <View style={styles.resultContainer}>
          <ScrollView style={styles.resultScroll}>
            <Text style={styles.resultText}>{testResult}</Text>
          </ScrollView>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    margin: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  testButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  registerButton: {
    backgroundColor: '#10b981',
  },
  waterButton: {
    backgroundColor: '#06b6d4',
  },
  breathingButton: {
    backgroundColor: '#8b5cf6',
  },
  testButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resultContainer: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    maxHeight: 300,
  },
  resultScroll: {
    maxHeight: 280,
  },
  resultText: {
    fontSize: 14,
    color: '#374151',
    fontFamily: 'monospace',
  },
});