// screens/LandingScreen.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth } = Dimensions.get('window');

interface LandingScreenProps {
  navigation?: any;
}

const LandingScreen: React.FC<LandingScreenProps> = ({ navigation }) => {
  
  const handleStartTrial = () => {
    navigation?.navigate('SignUp');
  };

  const handleSignIn = () => {
    navigation?.navigate('SignIn');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Logo - Exactly like your Figma */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}>
              <Text style={styles.logoEmoji}>🍏</Text>
            </View>
            <Text style={styles.logoText}>WellNoosh</Text>
          </View>
          <Text style={styles.tagline}>Smart Nutrition Assistant</Text>
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          <Text style={styles.headline}>
            The Smarter Way to{' '}
            <Text style={styles.highlightText}>Eat Well</Text>
          </Text>
          
          <Text style={styles.subheadline}>
            Stop wasting food. Stay healthy. Save money.
          </Text>
          
          <Text style={styles.description}>
            All with your personal nutrition assistant.
          </Text>

          {/* Value Propositions - From your Figma */}
          <View style={styles.valuePropsContainer}>
            <View style={styles.valueProp}>
              <View style={[styles.valueIcon, { backgroundColor: '#10B981' }]}>
                <Text style={styles.iconEmoji}>🌱</Text>
              </View>
              <Text style={styles.valueTitle}>Stop Waste</Text>
              <Text style={styles.valueSubtitle}>40% Less Food Waste</Text>
            </View>

            <View style={styles.valueProp}>
              <View style={[styles.valueIcon, { backgroundColor: '#8B5CF6' }]}>
                <Text style={styles.iconEmoji}>💜</Text>
              </View>
              <Text style={styles.valueTitle}>Stay Healthy</Text>
              <Text style={styles.valueSubtitle}>Personalized Nutrition</Text>
            </View>

            <View style={styles.valueProp}>
              <View style={[styles.valueIcon, { backgroundColor: '#3B82F6' }]}>
                <Text style={styles.iconEmoji}>💰</Text>
              </View>
              <Text style={styles.valueTitle}>Save Money</Text>
              <Text style={styles.valueSubtitle}>€120+ Monthly Savings</Text>
            </View>
          </View>
        </View>

        {/* CTA Section - Updated with new navigation */}
        <View style={styles.ctaSection}>
          <TouchableOpacity 
            style={styles.primaryButtonContainer}
            onPress={handleStartTrial}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#10B981', '#3B82F6', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>Start Your Free Trial</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.trialInfo}>
            <Text style={styles.trialText}>✓ 7 Days Free</Text>
            <Text style={styles.trialText}>✓ Cancel Anytime</Text>
          </View>

          <TouchableOpacity onPress={handleSignIn} style={styles.signInContainer}>
            <Text style={styles.signInText}>
              Already have an account?{' '}
              <Text style={styles.signInLink}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
  },
  header: {
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 32,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  logoIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoEmoji: {
    fontSize: 24,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  tagline: {
    fontSize: 14,
    color: '#6B7280',
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 32,
  },
  headline: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 40,
  },
  highlightText: {
    color: '#3B82F6',
  },
  subheadline: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 64,
  },
  valuePropsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 8,
  },
  valueProp: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 8,
  },
  valueIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconEmoji: {
    fontSize: 20,
  },
  valueTitle: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  valueSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  ctaSection: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  primaryButtonContainer: {
    width: '100%',
    marginBottom: 24,
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
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 24,
  },
  trialText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '500',
  },
  signInContainer: {
    paddingVertical: 8,
  },
  signInText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  signInLink: {
    color: '#3B82F6',
    fontWeight: '600',
  },
});

export default LandingScreen;