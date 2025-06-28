import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  StatusBar,
  SafeAreaView,
  PanResponder
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface LandingScreenProps {
  onShowLogin: () => void;
  onShowSignup: () => void;
}

export default function LandingScreen({ onShowLogin, onShowSignup }: LandingScreenProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    'hero',
    'stop-waste', 
    'stay-healthy',
    'save-money',
    'cta'
  ];

  // Swipe gesture handling
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 20;
    },
    onPanResponderRelease: (evt, gestureState) => {
      const swipeThreshold = 50;
      
      if (gestureState.dx > swipeThreshold) {
        // Swipe right - go to previous slide
        prevSlide();
      } else if (gestureState.dx < -swipeThreshold) {
        // Swipe left - go to next slide  
        nextSlide();
      }
    },
  });

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  // FIXED: Removed Alert.alert - directly call onShowSignup
  const handleSignup = () => {
    onShowSignup();
  };

  // FIXED: Removed Alert.alert - directly call onShowLogin
  const handleLogin = () => {
    onShowLogin();
  };

  const renderHeroSlide = () => (
    <View style={styles.slideContainer}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={styles.logoContainer}>
          <View style={styles.logoIcon}>
            <Text style={styles.logoEmoji}>🍏</Text>
          </View>
          <View style={styles.logoTextContainer}>
            <Text style={styles.logoTitle}>WellNoosh</Text>
            <Text style={styles.logoSubtitle}>Smart Nutrition Assistant</Text>
          </View>
        </View>
      </View>

      {/* Hero Content */}
      <ScrollView style={styles.heroContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroTextSection}>
          <Text style={styles.heroTitle}>
            The Smarter Way to{' '}
            <Text style={styles.heroHighlight}>Eat Well</Text>
          </Text>
          <Text style={styles.heroSubtitle}>
            Stop wasting food. Stay healthy. Save money. All with your personal nutrition assistant.
          </Text>
        </View>

        {/* Three Pillars */}
        <View style={styles.pillarsContainer}>
          <View style={styles.pillar}>
            <View style={[styles.pillarIcon, { backgroundColor: '#DCFCE7' }]}>
              <Text style={styles.pillarEmoji}>🌱</Text>
            </View>
            <Text style={styles.pillarTitle}>Stop Waste</Text>
            <Text style={styles.pillarSubtitle}>40% Less Food Waste</Text>
          </View>
          
          <View style={styles.pillar}>
            <View style={[styles.pillarIcon, { backgroundColor: '#F3E8FF' }]}>
              <Text style={styles.pillarEmoji}>💜</Text>
            </View>
            <Text style={styles.pillarTitle}>Stay Healthy</Text>
            <Text style={styles.pillarSubtitle}>Personalized Nutrition</Text>
          </View>
          
          <View style={styles.pillar}>
            <View style={[styles.pillarIcon, { backgroundColor: '#DBEAFE' }]}>
              <Text style={styles.pillarEmoji}>💰</Text>
            </View>
            <Text style={styles.pillarTitle}>Save Money</Text>
            <Text style={styles.pillarSubtitle}>€120+ Monthly Savings</Text>
          </View>
        </View>

        <View style={styles.ctaSection}>
          <TouchableOpacity 
            style={styles.primaryButtonContainer}
            onPress={handleSignup}
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
          
          <View style={styles.benefitsContainer}>
            <View style={styles.benefit}>
              <Text style={styles.checkmark}>✓</Text>
              <Text style={styles.benefitText}>7 Days Free</Text>
            </View>
            <View style={styles.benefit}>
              <Text style={styles.checkmark}>✓</Text>
              <Text style={styles.benefitText}>Cancel Anytime</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Auth Options */}
      <View style={styles.authSection}>
        <View style={styles.authContainer}>
          <Text style={styles.authText}>Already Have an Account?</Text>
          <TouchableOpacity onPress={handleLogin}>
            <Text style={styles.signInLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderStopWasteSlide = () => (
    <View style={styles.slideContainer}>
      <View style={styles.featureHeader}>
        <Text style={styles.featureTitle}>Stop Wasting Food</Text>
        <Text style={styles.featureSubtitle}>Reduce food waste by 40% with smart management</Text>
      </View>

      <View style={styles.featureContent}>
        <LinearGradient
          colors={['#F0FDF4', '#DCFCE7']}
          style={styles.featureCard}
        >
          <View style={[styles.featureIconLarge, { backgroundColor: '#10B981' }]}>
            <Text style={styles.featureEmojiLarge}>🌱</Text>
          </View>
          <Text style={styles.featureCardTitle}>Stop Wasting Food</Text>
          <Text style={styles.featureCardSubtitle}>Reduce Waste by 40%</Text>
          
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Text style={styles.checkmark}>✓</Text>
              <Text style={styles.featureItemText}>Smart leftover recipes and suggestions</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.checkmark}>✓</Text>
              <Text style={styles.featureItemText}>Expiry date tracking and reminders</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.checkmark}>✓</Text>
              <Text style={styles.featureItemText}>Perfect portion planning for families</Text>
            </View>
          </View>
        </LinearGradient>
      </View>
    </View>
  );

  const renderStayHealthySlide = () => (
    <View style={styles.slideContainer}>
      <View style={styles.featureHeader}>
        <Text style={styles.featureTitle}>Stay Healthy</Text>
        <Text style={styles.featureSubtitle}>Personalized nutrition for your wellness goals</Text>
      </View>

      <View style={styles.featureContent}>
        <LinearGradient
          colors={['#FAF5FF', '#F3E8FF']}
          style={styles.featureCard}
        >
          <View style={[styles.featureIconLarge, { backgroundColor: '#8B5CF6' }]}>
            <Text style={styles.featureEmojiLarge}>💜</Text>
          </View>
          <Text style={styles.featureCardTitle}>Stay Healthy</Text>
          <Text style={styles.featureCardSubtitle}>Personalized Nutrition</Text>
          
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Text style={styles.checkmark}>✓</Text>
              <Text style={styles.featureItemText}>Tailored meal plans for your goals</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.checkmark}>✓</Text>
              <Text style={styles.featureItemText}>Nutrition tracking and balance</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.checkmark}>✓</Text>
              <Text style={styles.featureItemText}>Allergy-safe recipe suggestions</Text>
            </View>
          </View>
        </LinearGradient>
      </View>
    </View>
  );

  const renderSaveMoneySlide = () => (
    <View style={styles.slideContainer}>
      <View style={styles.featureHeader}>
        <Text style={styles.featureTitle}>Save Money</Text>
        <Text style={styles.featureSubtitle}>Smart shopping saves €120+ monthly</Text>
      </View>

      <View style={styles.featureContent}>
        <LinearGradient
          colors={['#EFF6FF', '#DBEAFE']}
          style={styles.featureCard}
        >
          <View style={[styles.featureIconLarge, { backgroundColor: '#3B82F6' }]}>
            <Text style={styles.featureEmojiLarge}>💰</Text>
          </View>
          <Text style={styles.featureCardTitle}>Save Money</Text>
          <Text style={styles.featureCardSubtitle}>€120+ Monthly Savings</Text>
          
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Text style={styles.checkmark}>✓</Text>
              <Text style={styles.featureItemText}>Smart grocery lists with price optimization</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.checkmark}>✓</Text>
              <Text style={styles.featureItemText}>Direct ordering from cheapest stores</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.checkmark}>✓</Text>
              <Text style={styles.featureItemText}>Budget tracking and insights</Text>
            </View>
          </View>
        </LinearGradient>
      </View>
    </View>
  );

  const renderCTASlide = () => (
    <View style={styles.slideContainer}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={styles.logoContainer}>
          <View style={styles.logoIcon}>
            <Text style={styles.logoEmoji}>🍏</Text>
          </View>
          <View style={styles.logoTextContainer}>
            <Text style={styles.logoTitle}>WellNoosh</Text>
            <Text style={styles.logoSubtitle}>Ready to Transform Your Kitchen?</Text>
          </View>
        </View>
      </View>

      {/* CTA Content */}
      <ScrollView style={styles.heroContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroTextSection}>
          <Text style={styles.heroTitle}>Join 50,000+ Families</Text>
          <Text style={styles.heroSubtitle}>
            Start your journey to healthier eating, zero waste, and smart savings today.
          </Text>

          {/* Benefits Summary */}
          <View style={styles.benefitsSummary}>
            <View style={styles.benefitSummaryItem}>
              <Text style={styles.benefitSummaryValue}>40%</Text>
              <Text style={styles.benefitSummaryLabel}>Less Food Waste</Text>
            </View>
            <View style={styles.benefitSummaryItem}>
              <Text style={styles.benefitSummaryValue}>100%</Text>
              <Text style={styles.benefitSummaryLabel}>Personalized</Text>
            </View>
            <View style={styles.benefitSummaryItem}>
              <Text style={styles.benefitSummaryValue}>€120+</Text>
              <Text style={styles.benefitSummaryLabel}>Monthly Savings</Text>
            </View>
          </View>
        </View>

        <View style={styles.ctaSection}>
          <TouchableOpacity 
            style={styles.primaryButtonContainer}
            onPress={handleSignup}
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
          
          <View style={styles.benefitsContainer}>
            <View style={styles.benefit}>
              <Text style={styles.checkmark}>✓</Text>
              <Text style={styles.benefitText}>7 Days Completely Free</Text>
            </View>
            <View style={styles.benefit}>
              <Text style={styles.checkmark}>✓</Text>
              <Text style={styles.benefitText}>Cancel Anytime</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.authSection}>
        <View style={styles.authContainer}>
          <Text style={styles.authText}>Already Have an Account?</Text>
          <TouchableOpacity onPress={handleLogin}>
            <Text style={styles.signInLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.footerText}>
          © 2024 WellNoosh. Making Kitchens Smarter, Healthier, and More Sustainable.
        </Text>
      </View>
    </View>
  );

  const renderCurrentSlide = () => {
    switch (slides[currentSlide]) {
      case 'hero':
        return renderHeroSlide();
      case 'stop-waste':
        return renderStopWasteSlide();
      case 'stay-healthy':
        return renderStayHealthySlide();
      case 'save-money':
        return renderSaveMoneySlide();
      case 'cta':
        return renderCTASlide();
      default:
        return renderHeroSlide();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Slide Container with Swipe Gestures */}
      <View style={styles.slideWrapper} {...panResponder.panHandlers}>
        {renderCurrentSlide()}
      </View>

      {/* Navigation */}
      <View style={styles.navigation}>
        <View style={styles.navContainer}>
          {/* Previous Button */}
          <TouchableOpacity
            onPress={prevSlide}
            disabled={currentSlide === 0}
            style={[styles.navButton, currentSlide === 0 && styles.navButtonDisabled]}
          >
            <Text style={[styles.navButtonText, currentSlide === 0 && styles.navButtonTextDisabled]}>
              ←
            </Text>
          </TouchableOpacity>

          {/* Slide Indicators */}
          <View style={styles.indicators}>
            {slides.map((_, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => goToSlide(index)}
                style={[
                  styles.indicator,
                  index === currentSlide ? styles.indicatorActive : styles.indicatorInactive
                ]}
              />
            ))}
          </View>

          {/* Next Button */}
          <TouchableOpacity
            onPress={nextSlide}
            disabled={currentSlide === slides.length - 1}
            style={[styles.navButton, currentSlide === slides.length - 1 && styles.navButtonDisabled]}
          >
            <Text style={[styles.navButtonText, currentSlide === slides.length - 1 && styles.navButtonTextDisabled]}>
              →
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  slideWrapper: {
    flex: 1,
  },
  slideContainer: {
    flex: 1,
  },
  headerContainer: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoEmoji: {
    fontSize: 20,
  },
  logoTextContainer: {
    alignItems: 'center',
  },
  logoTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  logoSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  heroContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  heroTextSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 36,
  },
  heroHighlight: {
    color: '#3B82F6',
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  pillarsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    marginBottom: 48,
  },
  pillar: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 8,
  },
  pillarIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  pillarEmoji: {
    fontSize: 20,
  },
  pillarTitle: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  pillarSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  ctaSection: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  primaryButtonContainer: {
    marginBottom: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  benefitsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkmark: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
    marginRight: 4,
  },
  benefitText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '500',
  },
  authSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  authContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  authText: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 8,
  },
  signInLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  footerText: {
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  // Feature slides styles
  featureHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  featureTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  featureSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  featureContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  featureCard: {
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    padding: 32,
    alignItems: 'center',
  },
  featureIconLarge: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  featureEmojiLarge: {
    fontSize: 32,
    color: '#FFFFFF',
  },
  featureCardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  featureCardSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#16A34A',
    marginBottom: 24,
  },
  featureList: {
    alignSelf: 'stretch',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  featureItemText: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginLeft: 8,
  },
  // Benefits summary for CTA
  benefitsSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 32,
    marginBottom: 32,
  },
  benefitSummaryItem: {
    alignItems: 'center',
  },
  benefitSummaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10B981',
    marginBottom: 4,
  },
  benefitSummaryLabel: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
  },
  // Navigation styles
  navigation: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  navContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonDisabled: {
    backgroundColor: '#F9FAFB',
  },
  navButtonText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#6B7280',
  },
  navButtonTextDisabled: {
    color: '#D1D5DB',
  },
  indicators: {
    flexDirection: 'row',
  },
  indicator: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  indicatorActive: {
    width: 24,
    backgroundColor: '#3B82F6',
  },
  indicatorInactive: {
    width: 8,
    backgroundColor: '#D1D5DB',
  },
});