import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DeveloperDashboard from '../screens/DeveloperDashboard';
import { OnboardingTest } from './OnboardingTest';
import { RecipeRecommendationDemo } from '../screens/RecipeRecommendationDemo';
import { debugSupabase, isSupabaseConfigured } from '../src/utils/supabase-debug';

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

export function LandingPage({ onGetStarted, onSignIn }: LandingPageProps) {
  const [showDeveloperModal, setShowDeveloperModal] = useState(false);
  const [showOnboardingTest, setShowOnboardingTest] = useState(false);
  const [showRecipeDemo, setShowRecipeDemo] = useState(false);
  const clearAllData = async () => {
    try {
      await AsyncStorage.removeItem('wellnoosh_session');
      await AsyncStorage.removeItem('wellnoosh_user_data');
      await AsyncStorage.removeItem('wellnoosh_onboarding_completed');
      await AsyncStorage.removeItem('wellnoosh_feature_slides_seen');
      await AsyncStorage.removeItem('wellnoosh_profile_completion_completed');
      await AsyncStorage.removeItem('wellnoosh_meal_recommendations_completed');
      
      Alert.alert(
        'Data Cleared',
        'All cached data has been cleared. You can now sign up fresh.',
        [{ text: 'OK' }]
      );
      
      console.log('🧹 All cached data cleared successfully');
    } catch (error) {
      console.error('Error clearing data:', error);
      Alert.alert('Error', 'Failed to clear data');
    }
  };

  const handleSupabaseDebug = async () => {
    const isConfigured = isSupabaseConfigured();
    
    if (!isConfigured) {
      Alert.alert(
        'Supabase Not Configured',
        'Please add your Supabase credentials to the .env file. Check SUPABASE_SETUP.md for instructions.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Testing Supabase Connection',
      'Check the development console for detailed results.',
      [{ text: 'OK' }]
    );

    await debugSupabase();
  };

  if (showRecipeDemo) {
    return (
      <View style={styles.container}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => setShowRecipeDemo(false)}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <RecipeRecommendationDemo />
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#f0fdf4', '#dbeafe', '#faf5ff']}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Header with Logo */}
        <View style={styles.header}>
          <Image
            source={require('../assets/SLnew.jpg')}
            style={styles.logo}
            contentFit="contain"
          />
          <Text style={styles.title}>WellNoosh</Text>
          <Text style={styles.subtitle}>Your Smart Cooking Pal</Text>
        </View>

        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>
            Welcome to <Text style={styles.brandText}>WellNoosh</Text>
          </Text>
          <Text style={styles.welcomeText}>
            Stop wasting food. Stay healthy. Save money.{'\n'}
            All with your personal AI nutrition assistant.
          </Text>
        </View>

        {/* Feature Cards */}
        <View style={styles.featureGrid}>
          <View style={styles.featureCard}>
            <View style={[styles.featureIcon, { backgroundColor: '#dcfce7' }]}>
              <Text style={styles.featureEmoji}>🥬</Text>
            </View>
            <Text style={styles.featureTitle}>Stop Waste</Text>
            <Text style={[styles.featureSubtitle, { color: '#16a34a' }]}>40% Reduction</Text>
          </View>

          <View style={styles.featureCard}>
            <View style={[styles.featureIcon, { backgroundColor: '#dbeafe' }]}>
              <Text style={styles.featureEmoji}>💪</Text>
            </View>
            <Text style={styles.featureTitle}>Stay Healthy</Text>
            <Text style={[styles.featureSubtitle, { color: '#2563eb' }]}>AI Powered</Text>
          </View>

          <View style={styles.featureCard}>
            <View style={[styles.featureIcon, { backgroundColor: '#fef3c7' }]}>
              <Text style={styles.featureEmoji}>💰</Text>
            </View>
            <Text style={styles.featureTitle}>Save Money</Text>
            <Text style={[styles.featureSubtitle, { color: '#d97706' }]}>Smart Budget</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.primaryButton} onPress={onGetStarted}>
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryButton} onPress={onSignIn}>
            <Text style={styles.secondaryButtonText}>Already have an account? Sign In</Text>
          </TouchableOpacity>
          
          {/* Debug Recipe Demo Button */}
          <TouchableOpacity 
            style={[styles.secondaryButton, { backgroundColor: '#ff6b6b', marginTop: 10 }]} 
            onPress={() => setShowRecipeDemo(true)}
          >
            <Text style={[styles.secondaryButtonText, { color: 'white' }]}>Test Recipe Card Demo</Text>
          </TouchableOpacity>
          
          {/* Development buttons */}
          {__DEV__ && (
            <>
              <TouchableOpacity 
                style={styles.developerButton} 
                onPress={() => setShowOnboardingTest(true)}
              >
                <Text style={styles.developerButtonText}>🎯 Test Onboarding Flow</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.supabaseButton}
                onPress={handleSupabaseDebug}
              >
                <Text style={styles.supabaseButtonText}>🔧 Test Supabase Connection</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.clearButton} onPress={clearAllData}>
                <Text style={styles.clearButtonText}>🧹 Clear Cached Data</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>

      {/* Developer Onboarding Test Modal */}
      <Modal
        visible={showOnboardingTest}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowOnboardingTest(false)}
      >
        <OnboardingTest onBack={() => setShowOnboardingTest(false)} />
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 32,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 32,
    maxWidth: 300,
    alignSelf: 'center',
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  brandText: {
    color: '#2563eb',
  },
  welcomeText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  featureGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  featureCard: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  featureEmoji: {
    fontSize: 20,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
    textAlign: 'center',
  },
  featureSubtitle: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  buttonContainer: {
    marginTop: 16,
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: '#6b7280',
    fontSize: 14,
  },
  developerButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 16,
    backgroundColor: '#dcfce7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#6B8E23',
  },
  developerButtonText: {
    color: '#6B8E23',
    fontSize: 14,
    fontWeight: '600',
  },
  supabaseButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
    backgroundColor: '#dbeafe',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  supabaseButtonText: {
    color: '#1d4ed8',
    fontSize: 14,
    fontWeight: '600',
  },
  clearButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d97706',
  },
  clearButtonText: {
    color: '#92400e',
    fontSize: 12,
    fontWeight: '500',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 10,
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
  },
  backButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
});