import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';

interface QuickLoginScreenProps {
  onShowLogin: () => void;
  onShowSignup: () => void;
  onShowFullExperience: () => void;
}

export function QuickLoginScreen({ onShowLogin, onShowSignup, onShowFullExperience }: QuickLoginScreenProps) {
  return (
    <LinearGradient
      colors={['#4ade80', '#3b82f6', '#8b5cf6']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* Logo */}
          <View style={styles.logoSection}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../assets/logo.jpeg')}
                style={styles.logoImage}
                contentFit="cover"
              />
            </View>
            <Text style={styles.title}>WellNoosh</Text>
            <Text style={styles.subtitle}>Your Smart Cooking Pal</Text>
          </View>

          {/* Quick Actions */}
          <View style={styles.actionsContainer}>
            {/* Login Button - Prominent for returning users */}
            <TouchableOpacity 
              style={styles.loginButton}
              onPress={onShowLogin}
              activeOpacity={0.9}
            >
              <Text style={styles.loginButtonText}>Welcome Back - Sign In</Text>
            </TouchableOpacity>

            {/* Sign Up Button */}
            <TouchableOpacity 
              style={styles.signupButton}
              onPress={onShowSignup}
              activeOpacity={0.9}
            >
              <Text style={styles.signupButtonText}>New to WellNoosh? Sign Up</Text>
            </TouchableOpacity>

            {/* Learn More Link */}
            <TouchableOpacity 
              style={styles.learnMoreButton}
              onPress={onShowFullExperience}
              activeOpacity={0.8}
            >
              <Text style={styles.learnMoreText}>Learn More About WellNoosh</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Making kitchens smarter, healthier, and more sustainable
          </Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    padding: 24,
  },
  logoImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    textAlign: 'center',
  },
  actionsContainer: {
    width: '100%',
    maxWidth: 320,
    gap: 16,
  },
  loginButton: {
    width: '100%',
    paddingVertical: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loginButtonText: {
    color: '#1f2937',
    fontSize: 18,
    fontWeight: 'bold',
  },
  signupButton: {
    width: '100%',
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
  },
  signupButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  learnMoreButton: {
    width: '100%',
    paddingVertical: 12,
    alignItems: 'center',
  },
  learnMoreText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    alignItems: 'center',
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    textAlign: 'center',
  },
});