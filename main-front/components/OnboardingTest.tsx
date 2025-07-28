import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { OnboardingFlow } from './OnboardingFlow';

interface OnboardingTestProps {
  onBack: () => void;
}

export function OnboardingTest({ onBack }: OnboardingTestProps) {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [testUserData, setTestUserData] = useState({
    fullName: 'Test User',
    email: 'test@wellnoosh.com',
    country: 'United States',
    city: 'San Francisco',
    postalCode: '94102',
  });

  const handleStartOnboarding = () => {
    setShowOnboarding(true);
  };

  const handleOnboardingComplete = (userData: any) => {
    console.log('✅ Onboarding completed with data:', userData);
    setShowOnboarding(false);
  };

  const handleOnboardingSkip = () => {
    console.log('⏭️ Onboarding skipped');
    setShowOnboarding(false);
  };

  if (showOnboarding) {
    return (
      <OnboardingFlow
        onComplete={handleOnboardingComplete}
        onSkip={handleOnboardingSkip}
        userData={testUserData}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Onboarding Test</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🎯 Test Onboarding Flow</Text>
          <Text style={styles.cardDescription}>
            Test the complete onboarding experience with the updated styling and skip button functionality.
          </Text>
          
          <View style={styles.features}>
            <Text style={styles.featureItem}>✅ Updated color scheme (green theme)</Text>
            <Text style={styles.featureItem}>✅ Always visible skip button</Text>
            <Text style={styles.featureItem}>✅ Dashboard-consistent styling</Text>
            <Text style={styles.featureItem}>✅ Improved button design</Text>
          </View>

          <TouchableOpacity 
            style={styles.startButton} 
            onPress={handleStartOnboarding}
          >
            <Text style={styles.startButtonText}>Start Onboarding Flow</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>💡 Test Instructions</Text>
          <Text style={styles.infoText}>
            1. Tap "Start Onboarding Flow" to begin{'\n'}
            2. Navigate through all screens{'\n'}
            3. Test the skip button functionality{'\n'}
            4. Check color consistency with dashboard{'\n'}
            5. Verify button styles and responsiveness
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: '#6B8E23',
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginLeft: 16,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  cardDescription: {
    fontSize: 16,
    color: '#4A4A4A',
    lineHeight: 24,
    marginBottom: 20,
  },
  features: {
    marginBottom: 24,
  },
  featureItem: {
    fontSize: 14,
    color: '#4A4A4A',
    marginBottom: 8,
    lineHeight: 20,
  },
  startButton: {
    backgroundColor: '#6B8E23',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#6B8E23',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoCard: {
    backgroundColor: '#E8F4FD',
    borderRadius: 12,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#4A90E2',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#4A4A4A',
    lineHeight: 20,
  },
});