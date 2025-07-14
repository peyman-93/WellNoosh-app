import React from 'react'
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  Image 
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'

interface LandingScreenProps {
  onGetStarted: () => void
  onSignIn: () => void
}

export const LandingScreen: React.FC<LandingScreenProps> = ({ 
  onGetStarted, 
  onSignIn 
}) => {
  return (
    <LinearGradient
      colors={['#F0FDF4', '#DBEAFE', '#FAF5FF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
        {/* Header with Logo */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoEmoji}>🥗</Text>
            </View>
          </View>
          <Text style={styles.brandTitle}>WellNoosh</Text>
          <Text style={styles.brandSubtitle}>Your Smart Cooking Pal</Text>
        </View>

        {/* Main Content */}
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.maxWidth}>
            {/* Welcome Section */}
            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeTitle}>
                Welcome to <Text style={styles.welcomeTitleAccent}>WellNoosh</Text>
              </Text>
              <Text style={styles.welcomeDescription}>
                Stop wasting food. Stay healthy. Save money.{'\n'}
                All with your personal AI nutrition assistant.
              </Text>
            </View>

            {/* Feature Cards */}
            <View style={styles.featureGrid}>
              {/* Stop Waste */}
              <View style={styles.featureCard}>
                <View style={[styles.featureIcon, { backgroundColor: '#DCFCE7' }]}>
                  <View style={[styles.featureCircle, { backgroundColor: '#10B981' }]}>
                    <Text style={styles.featureEmoji}>🥬</Text>
                  </View>
                </View>
                <Text style={styles.featureTitle}>Stop Waste</Text>
                <Text style={[styles.featureMetric, { color: '#10B981' }]}>40% Reduction</Text>
              </View>

              {/* Stay Healthy */}
              <View style={styles.featureCard}>
                <View style={[styles.featureIcon, { backgroundColor: '#FEE2E2' }]}>
                  <View style={[styles.featureCircle, { backgroundColor: '#EF4444' }]}>
                    <Text style={styles.featureEmoji}>❤️</Text>
                  </View>
                </View>
                <Text style={styles.featureTitle}>Stay Healthy</Text>
                <Text style={[styles.featureMetric, { color: '#EF4444' }]}>Personalized</Text>
              </View>

              {/* Save Money */}
              <View style={styles.featureCard}>
                <View style={[styles.featureIcon, { backgroundColor: '#FEF3C7' }]}>
                  <View style={[styles.featureCircle, { backgroundColor: '#F59E0B' }]}>
                    <Text style={styles.featureEmoji}>💰</Text>
                  </View>
                </View>
                <Text style={styles.featureTitle}>Save Money</Text>
                <Text style={[styles.featureMetric, { color: '#F59E0B' }]}>$250+ Monthly</Text>
              </View>
            </View>

            {/* CTA Buttons */}
            <View style={styles.ctaSection}>
              {/* Get Started Free Button */}
              <TouchableOpacity
                onPress={onGetStarted}
                style={styles.primaryButton}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#10B981', '#3B82F6', '#8B5CF6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.primaryButtonGradient}
                >
                  <Text style={styles.primaryButtonText}>Get Started Free</Text>
                  <Text style={styles.primaryButtonIcon}>→</Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Already Have Account Link */}
              <TouchableOpacity
                onPress={onSignIn}
                style={styles.secondaryButton}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryButtonText}>I Already Have an Account</Text>
              </TouchableOpacity>
            </View>

            {/* Social Proof */}
            <View style={styles.socialProof}>
              <Text style={styles.socialProofText}>
                Join 50,000+ families eating smarter
              </Text>
            </View>
          </View>
        </ScrollView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 48,
    paddingBottom: 32,
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 12,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  logoEmoji: {
    fontSize: 32,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
    fontFamily: 'System',
  },
  brandSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'System',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  maxWidth: {
    maxWidth: 320,
    alignSelf: 'center',
    width: '100%',
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'System',
  },
  welcomeTitleAccent: {
    color: '#3B82F6',
  },
  welcomeDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: 'System',
  },
  featureGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    gap: 12,
  },
  featureCard: {
    flex: 1,
    alignItems: 'center',
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  featureCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureEmoji: {
    fontSize: 12,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 4,
    fontFamily: 'System',
  },
  featureMetric: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    fontFamily: 'System',
  },
  ctaSection: {
    marginBottom: 32,
    gap: 16,
  },
  primaryButton: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    fontFamily: 'System',
  },
  primaryButtonIcon: {
    fontSize: 20,
    color: 'white',
    fontWeight: '700',
  },
  secondaryButton: {
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    fontFamily: 'System',
  },
  socialProof: {
    alignItems: 'center',
  },
  socialProofText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    fontFamily: 'System',
  },
})