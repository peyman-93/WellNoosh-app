import React from 'react'
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useUserData } from '../../src/context/user-data-provider'

interface OnboardingCompleteScreenProps {
  navigation: any
}

export default function OnboardingCompleteScreen({ navigation }: OnboardingCompleteScreenProps) {
  const { saveOnboardingData } = useUserData()

  const handleComplete = async () => {
    try {
      // Mark onboarding as completed in UserDataContext
      await saveOnboardingData({})
      console.log('📚 OnboardingCompleteScreen: Onboarding marked as completed')
    } catch (error) {
      console.error('📚 OnboardingCompleteScreen: Error saving onboarding completion:', error)
    }

    // Navigate to main app and specifically the Cooking tab with swipe screen parameter
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs', params: { screen: 'Cooking', params: { showSwipeScreen: true } } }],
    })
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.contentContainer}>
          {/* Success Animation */}
          <View style={styles.successContainer}>
            <View style={styles.successCircle}>
              <Text style={styles.successEmoji}>🎉</Text>
            </View>
            <View style={styles.sparklesContainer}>
              <Text style={styles.sparkle1}>✨</Text>
              <Text style={styles.sparkle2}>⭐</Text>
              <Text style={styles.sparkle3}>✨</Text>
            </View>
          </View>

          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>You're All Set!</Text>
            <Text style={styles.subtitle}>
              Your personalized WellNoosh experience is ready
            </Text>
          </View>

          {/* Features Summary */}
          <View style={styles.featuresContainer}>
            <Text style={styles.featuresTitle}>🍎 Your Smart Kitchen Awaits!</Text>
            <Text style={styles.featuresDescription}>
              WellNoosh is now fully personalized with your dietary preferences, health goals, and cooking style. 
              Next, we'll show you some delicious meal recommendations!
            </Text>

            <View style={styles.featuresList}>
              <View style={[styles.featureCard, { backgroundColor: '#ECFDF5' }]}>
                <View style={styles.featureHeader}>
                  <Text style={styles.featureEmoji}>✅</Text>
                  <Text style={styles.featureTitle}>Complete Health Profile</Text>
                </View>
                <Text style={styles.featureDescription}>
                  Diet preferences and health goals saved
                </Text>
              </View>

              <View style={[styles.featureCard, { backgroundColor: '#EFF6FF' }]}>
                <View style={styles.featureHeader}>
                  <Text style={styles.featureEmoji}>🎯</Text>
                  <Text style={styles.featureTitle}>Personalized Goals</Text>
                </View>
                <Text style={styles.featureDescription}>
                  Health objectives configured for optimal results
                </Text>
              </View>

              <View style={[styles.featureCard, { backgroundColor: '#FAF5FF' }]}>
                <View style={styles.featureHeader}>
                  <Text style={styles.featureEmoji}>🍽️</Text>
                  <Text style={styles.featureTitle}>Meal Discovery</Text>
                </View>
                <Text style={styles.featureDescription}>
                  Ready to discover your perfect meals
                </Text>
              </View>
            </View>
          </View>

          {/* Welcome Message */}
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeText}>
              Welcome to your wellness journey! 🌟
            </Text>
            <Text style={styles.welcomeSubtext}>
              Let's start exploring recipes that match your lifestyle
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        <Pressable 
          style={styles.buttonContainer}
          onPress={handleComplete}
        >
          <LinearGradient
            colors={['#10B981', '#3B82F6', '#8B5CF6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientButton}
          >
            <Text style={styles.buttonText}>Continue to Meal Discovery</Text>
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
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 60,
    alignItems: 'center',
  },
  successContainer: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: 40,
  },
  successCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  successEmoji: {
    fontSize: 48,
  },
  sparklesContainer: {
    position: 'absolute',
    width: 200,
    height: 200,
  },
  sparkle1: {
    position: 'absolute',
    top: 20,
    left: 20,
    fontSize: 20,
  },
  sparkle2: {
    position: 'absolute',
    top: 30,
    right: 30,
    fontSize: 16,
  },
  sparkle3: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    fontSize: 18,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 26,
    maxWidth: 300,
  },
  featuresContainer: {
    width: '100%',
    marginBottom: 40,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  featuresDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  featuresList: {
    gap: 16,
  },
  featureCard: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'flex-start',
  },
  featureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  featureEmoji: {
    fontSize: 20,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  featureDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  welcomeContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    width: '100%',
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 24,
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