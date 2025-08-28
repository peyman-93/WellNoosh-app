import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Image } from 'react-native';

interface UserData {
  fullName: string;
  email: string;
  country: string;
  city: string;
  postalCode: string;
  age?: number;
  gender?: string;
  weight?: number;
  weightUnit?: 'kg' | 'lbs';
  height?: number;
  heightUnit?: 'cm' | 'ft';
  heightFeet?: number;
  heightInches?: number;
  dietStyle?: string | string[]; // Support both formats
  customDietStyle?: string;
  allergies?: string[];
  medicalConditions?: string[];
  activityLevel?: string;
  healthGoals?: string[];
  foodRestrictions?: string[];
  cookingSkill?: string;
  mealPreference?: string;
  subscriptionTier?: 'free' | 'premium';
  dailySwipesUsed?: number;
  lastSwipeDate?: string;
  favoriteRecipes?: string[];
  selectedRecipes?: string[];
}

interface ProfileSummaryLoadingProps {
  userData: UserData;
  onComplete: () => void;
}

export function ProfileSummaryLoading({ userData, onComplete }: ProfileSummaryLoadingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));

  const getUserFirstName = () => {
    if (!userData?.fullName) return 'User';
    return userData.fullName.split(' ')[0];
  };

  const loadingSteps = [
    {
      title: "Analyzing Your Profile",
      description: "Processing your dietary preferences and health goals...",
      icon: "🔍",
      color: "#3b82f6"
    },
    {
      title: "Personalizing Recommendations",
      description: "Creating your custom meal recommendations...",
      icon: "🍽️",
      color: "#10b981"
    },
    {
      title: "Optimizing Nutrition",
      description: "Calculating optimal nutrition for your goals...",
      icon: "⚖️",
      color: "#f59e0b"
    },
    {
      title: "Finding Perfect Matches",
      description: "Discovering meals you'll absolutely love...",
      icon: "❤️",
      color: "#ef4444"
    }
  ];

  useEffect(() => {
    // Animate in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Progress through steps
    const stepInterval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev < loadingSteps.length - 1) {
          return prev + 1;
        } else {
          clearInterval(stepInterval);
          // Complete after a short delay
          setTimeout(() => {
            onComplete();
          }, 1500);
          return prev;
        }
      });
    }, 2000);

    return () => clearInterval(stepInterval);
  }, [fadeAnim, scaleAnim, onComplete]);

  const formatDietStyle = () => {
    if (!userData.dietStyle) return 'Balanced';
    // Handle both string and array formats for backward compatibility
    if (typeof userData.dietStyle === 'string') {
      return userData.dietStyle;
    }
    if (Array.isArray(userData.dietStyle) && userData.dietStyle.length === 0) return 'Balanced';
    if (Array.isArray(userData.dietStyle)) {
      return userData.dietStyle.slice(0, 2).join(', ') + 
             (userData.dietStyle.length > 2 ? ` +${userData.dietStyle.length - 2} more` : '');
    }
    return 'Balanced';
  };

  const formatHealthGoals = () => {
    if (!userData.healthGoals || userData.healthGoals.length === 0) return 'General Wellness';
    return userData.healthGoals.slice(0, 2).join(', ') +
           (userData.healthGoals.length > 2 ? ` +${userData.healthGoals.length - 2} more` : '');
  };

  const formatAllergies = () => {
    if (!userData.allergies || userData.allergies.length === 0 || userData.allergies.includes('None')) {
      return 'No allergies reported';
    }
    return userData.allergies.slice(0, 2).join(', ') +
           (userData.allergies.length > 2 ? ` +${userData.allergies.length - 2} more` : '');
  };

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('../assets/SLnew.jpg')} 
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.title}>Setting Up Your Kitchen</Text>
          <Text style={styles.subtitle}>
            Welcome {getUserFirstName()}! We're personalizing your WellNoosh experience...
          </Text>
        </View>

        {/* Profile Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={[styles.summaryCard, styles.summaryCardBlue]}>
            <Text style={styles.summaryCardIcon}>👤</Text>
            <Text style={styles.summaryCardTitle}>Profile</Text>
            <Text style={styles.summaryCardText}>
              {userData.age && `${userData.age} years old`}
              {userData.age && userData.gender && ', '}
              {userData.gender}
            </Text>
          </View>

          <View style={[styles.summaryCard, styles.summaryCardGreen]}>
            <Text style={styles.summaryCardIcon}>🥗</Text>
            <Text style={styles.summaryCardTitle}>Diet Style</Text>
            <Text style={styles.summaryCardText}>{formatDietStyle()}</Text>
          </View>

          <View style={[styles.summaryCard, styles.summaryCardYellow]}>
            <Text style={styles.summaryCardIcon}>🎯</Text>
            <Text style={styles.summaryCardTitle}>Health Goals</Text>
            <Text style={styles.summaryCardText}>{formatHealthGoals()}</Text>
          </View>

          <View style={[styles.summaryCard, styles.summaryCardRed]}>
            <Text style={styles.summaryCardIcon}>⚠️</Text>
            <Text style={styles.summaryCardTitle}>Allergies</Text>
            <Text style={styles.summaryCardText}>{formatAllergies()}</Text>
          </View>

          <View style={[styles.summaryCard, styles.summaryCardPurple]}>
            <Text style={styles.summaryCardIcon}>👨‍🍳</Text>
            <Text style={styles.summaryCardTitle}>Cooking Level</Text>
            <Text style={styles.summaryCardText}>
              {userData.cookingSkill || 'Intermediate'}
            </Text>
          </View>

          <View style={[styles.summaryCard, styles.summaryCardOrange]}>
            <Text style={styles.summaryCardIcon}>⏱️</Text>
            <Text style={styles.summaryCardTitle}>Meal Preference</Text>
            <Text style={styles.summaryCardText}>
              {userData.mealPreference || 'Quick & Easy'}
            </Text>
          </View>
        </View>

        {/* Loading Progress */}
        <View style={styles.loadingContainer}>
          <View style={[styles.loadingIcon, { backgroundColor: loadingSteps[currentStep].color }]}>
            <Text style={styles.loadingIconText}>{loadingSteps[currentStep].icon}</Text>
          </View>
          <Text style={styles.loadingTitle}>{loadingSteps[currentStep].title}</Text>
          <Text style={styles.loadingDescription}>{loadingSteps[currentStep].description}</Text>
          
          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View 
              style={[
                styles.progressBar, 
                { width: `${((currentStep + 1) / loadingSteps.length) * 100}%` }
              ]} 
            />
          </View>
          
          {/* Step Indicators */}
          <View style={styles.stepIndicators}>
            {loadingSteps.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.stepDot,
                  index <= currentStep && styles.stepDotActive
                ]}
              />
            ))}
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F0', // Match dashboard warm off-white background
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 124,
    height: 124,
    borderRadius: 62,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#6B8E23',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  logoText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'Inter',
  },
  logoImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A', // Match dashboard soft black
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  subtitle: {
    fontSize: 16,
    color: '#4A4A4A', // Match dashboard warm charcoal
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: 'Inter',
  },
  summaryContainer: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 40,
  },
  summaryCard: {
    width: '47%',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    minHeight: 100,
    justifyContent: 'center',
  },
  summaryCardBlue: {
    backgroundColor: '#dbeafe',
  },
  summaryCardGreen: {
    backgroundColor: '#dcfce7',
  },
  summaryCardYellow: {
    backgroundColor: '#fef3c7',
  },
  summaryCardRed: {
    backgroundColor: '#fee2e2',
  },
  summaryCardPurple: {
    backgroundColor: '#f3e8ff',
  },
  summaryCardOrange: {
    backgroundColor: '#fed7aa',
  },
  summaryCardIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  summaryCardTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1A1A1A', // Match dashboard soft black
    marginBottom: 4,
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  summaryCardText: {
    fontSize: 11,
    color: '#4A4A4A', // Match dashboard warm charcoal
    textAlign: 'center',
    lineHeight: 16,
    fontFamily: 'Inter',
  },
  loadingContainer: {
    alignItems: 'center',
    width: '100%',
  },
  loadingIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loadingIconText: {
    fontSize: 32,
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A', // Match dashboard soft black
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  loadingDescription: {
    fontSize: 16,
    color: '#4A4A4A', // Match dashboard warm charcoal
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: 'Inter',
  },
  progressContainer: {
    width: '100%',
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    marginBottom: 16,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#6B8E23', // Match dashboard primary green
    borderRadius: 3,
  },
  stepIndicators: {
    flexDirection: 'row',
    gap: 8,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#d1d5db',
  },
  stepDotActive: {
    backgroundColor: '#6B8E23', // Match dashboard primary green
  },
});