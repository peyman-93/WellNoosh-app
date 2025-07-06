import React from 'react'
import {
  View,
  Text,
  SafeAreaView,
  Pressable,
  StyleSheet,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'

interface OnboardingWelcomeScreenProps {
  navigation: any
}

export default function OnboardingWelcomeScreen({ navigation }: OnboardingWelcomeScreenProps) {
  const handleContinue = () => {
    navigation.navigate('DietPreferences')
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress Indicator */}
      <View style={styles.progressSection}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '16.67%' }]} />
        </View>
        <Text style={styles.stepText}>Step 1</Text>
        <Text style={styles.stepCount}>6 Steps</Text>
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoBox}>
            <Text style={styles.logoEmoji}>🍏</Text>
          </View>
        </View>

        {/* Welcome Content */}
        <View style={styles.welcomeContent}>
          <Text style={styles.title}>
            Welcome to WellNoosh
          </Text>
          <Text style={styles.subtitle}>
            Your AI Chef Nutritionist is Here to Help
          </Text>

          <View style={styles.featuresContainer}>
            <View style={styles.feature}>
              <Text style={styles.checkmark}>✓</Text>
              <Text style={styles.featureText}>Personalized for You</Text>
            </View>
            <View style={styles.feature}>
              <Text style={styles.checkmark}>✓</Text>
              <Text style={styles.featureText}>Family-Friendly</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        <Text style={styles.bottomText}>
          Let's Personalize Your Experience
        </Text>
        
        <Pressable 
          style={styles.buttonContainer}
          onPress={handleContinue}
        >
          <LinearGradient
            colors={['#10B981', '#3B82F6', '#8B5CF6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientButton}
          >
            <Text style={styles.buttonText}>Continue</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  progressSection: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 2,
  },
  stepText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  stepCount: {
    fontSize: 12,
    color: '#6B7280',
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    marginBottom: 48,
  },
  logoBox: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoEmoji: {
    fontSize: 36,
  },
  welcomeContent: {
    alignItems: 'center',
    maxWidth: 320,
  },
  title: {
    fontSize: 28,
    textAlign: 'center',
    color: '#1F2937',
    fontWeight: 'bold',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#6B7280',
    marginBottom: 32,
    lineHeight: 24,
  },
  featuresContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  checkmark: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
  featureText: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    alignItems: 'center',
  },
  bottomText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonContainer: {
    width: '100%',
  },
  gradientButton: {
    height: 56,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
})