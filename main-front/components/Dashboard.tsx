import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Image,
  Dimensions,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useHealthTracking } from '../src/hooks/useHealthTracking';

interface CookedRecipe {
  id: string;
  name: string;
  image: string;
  cookedDate: string;
  rating?: number;
}

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
  dietStyle?: string[];
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
  cookedRecipes?: CookedRecipe[];
  waterIntake?: {
    date: string;
    glasses: boolean[];
    dailyGoal: number;
  };
}

interface DashboardProps {
  onNavigateToProfile: () => void;
  onNavigateToTab: (tab: string) => void;
  isFirstLogin: boolean;
  onWelcomeComplete: () => void;
  userData: UserData | null;
}

const { width: screenWidth } = Dimensions.get('window');

export function Dashboard({ 
  onNavigateToProfile, 
  onNavigateToTab, 
  isFirstLogin, 
  onWelcomeComplete,
  userData 
}: DashboardProps) {
  // Use the health tracking hook for backend integration
  const {
    waterIntake,
    breathingExercises,
    loading: healthLoading,
    error: healthError,
    updateWaterIntake: updateWaterIntakeBackend,
    updateBreathingExercises: updateBreathingExercisesBackend,
    addBreathingExercise,
    waterProgress,
    breathingProgress
  } = useHealthTracking();

  const [showBreathingGuide, setShowBreathingGuide] = useState(false);
  const [breathingCycle, setBreathingCycle] = useState(0);
  const [breathingPhase, setBreathingPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');

  // Health tracking is now handled by the useHealthTracking hook

  // Handle glass click - now uses backend
  const handleGlassClick = async (index: number) => {
    await updateWaterIntakeBackend(index);
    
    if (healthError) {
      Alert.alert('Sync Error', 'Failed to sync water intake. Changes saved locally.');
    }
  };

  // Get user's first name for personalized greeting
  const getUserFirstName = () => {
    if (!userData?.fullName) return 'there';
    return userData.fullName.split(' ')[0];
  };

  // Handle breathing exercise circle click - now uses backend
  const handleBreathingCircleClick = async (index: number) => {
    await updateBreathingExercisesBackend(index);
    
    if (healthError) {
      Alert.alert('Sync Error', 'Failed to sync breathing exercises. Changes saved locally.');
    }
  };

  // Start breathing guide
  const startBreathingGuide = () => {
    setShowBreathingGuide(true);
    setBreathingCycle(0);
    setBreathingPhase('inhale');
    
    // Start breathing cycle
    const runBreathingCycle = (cycleCount: number) => {
      if (cycleCount >= 5) {
        // Complete the breathing exercise
        setTimeout(() => {
          setShowBreathingGuide(false);
          handleAddBreathingExercise();
        }, 1000);
        return;
      }
      
      // Inhale phase (4 seconds)
      setBreathingPhase('inhale');
      setTimeout(() => {
        // Hold phase (2 seconds)
        setBreathingPhase('hold');
        setTimeout(() => {
          // Exhale phase (4 seconds)
          setBreathingPhase('exhale');
          setTimeout(() => {
            setBreathingCycle(cycleCount + 1);
            runBreathingCycle(cycleCount + 1);
          }, 4000);
        }, 2000);
      }, 4000);
    };
    
    runBreathingCycle(0);
  };

  // Add breathing exercise automatically after guide - now uses backend
  const handleAddBreathingExercise = async () => {
    await addBreathingExercise();
    
    if (healthError) {
      Alert.alert('Sync Error', 'Failed to sync breathing exercise. Changes saved locally.');
    }
  };

  // Progress data comes from the hook
  const completedGlasses = waterProgress.completed;
  const waterPercentage = waterProgress.percentage;
  const completedBreathingExercises = breathingProgress.completed;
  const breathingPercentage = breathingProgress.percentage;

  // Mock favorite and cooked recipes count for stats
  const favoriteRecipesCount = userData?.favoriteRecipes?.length || 3;
  const cookedRecipesCount = userData?.cookedRecipes?.length || 12;

  // Show Breathing Guide if active
  if (showBreathingGuide) {
    const getPhaseText = () => {
      switch (breathingPhase) {
        case 'inhale': return 'Breathe in slowly...';
        case 'hold': return 'Hold...';
        case 'exhale': return 'Breathe out slowly...';
        default: return '';
      }
    };

    const getCircleScale = () => {
      switch (breathingPhase) {
        case 'inhale': return 1.2;
        case 'hold': return 1.2;
        case 'exhale': return 1.0;
        default: return 1.0;
      }
    };

    return (
      <View style={styles.breathingGuideContainer}>
        <LinearGradient
          colors={['#f0fdf4', '#dcfce7', '#bbf7d0']}
          style={styles.breathingGuideContent}
        >
          {/* Breathing Circle Animation */}
          <View style={styles.breathingCircleContainer}>
            <View style={[
              styles.breathingCircle, 
              { transform: [{ scale: getCircleScale() }] }
            ]}>
              <Text style={styles.breathingCircleIcon}>💨</Text>
            </View>
          </View>

          {/* Breathing Instruction */}
          <View style={styles.breathingInstructionContainer}>
            <Text style={styles.breathingInstructionText}>
              {getPhaseText()}
            </Text>
            <Text style={styles.breathingCycleText}>
              Cycle {breathingCycle + 1} of 5
            </Text>
          </View>

          {/* Progress Indicator */}
          <View style={styles.breathingProgressContainer}>
            {Array.from({ length: 5 }).map((_, index) => (
              <View
                key={index}
                style={[
                  styles.breathingProgressDot,
                  index <= breathingCycle && styles.breathingProgressDotActive
                ]}
              />
            ))}
          </View>

          {/* Skip Button */}
          <TouchableOpacity
            onPress={() => {
              setShowBreathingGuide(false);
              handleAddBreathingExercise();
            }}
            style={styles.breathingSkipButton}
          >
            <Text style={styles.breathingSkipText}>Skip exercise</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#ffffff', '#f8fafc']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          {/* WellNoosh Branding */}
          <View style={styles.brandingContainer}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>W</Text>
            </View>
            <Text style={styles.brandTitle}>WellNoosh</Text>
            <Text style={styles.welcomeText}>Welcome back, {getUserFirstName()}!</Text>
          </View>


          {/* Quick Stats */}
          <View style={styles.quickStats}>
            <View style={[styles.statCard, styles.statCardGreen]}>
              <Text style={styles.statNumber}>{favoriteRecipesCount}</Text>
              <Text style={styles.statLabel}>Favorites</Text>
            </View>
            <View style={[styles.statCard, styles.statCardBlue]}>
              <Text style={styles.statNumber}>{cookedRecipesCount}</Text>
              <Text style={styles.statLabel}>Cooked</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Main Content */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        
        {/* Daily Water Tracker */}
        <View style={styles.sectionContainer}>
          <View style={styles.cardContainer}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <Text style={styles.waterIcon}>💧</Text>
                <Text style={styles.cardTitle}>Daily Hydration</Text>
                {healthLoading && <Text style={styles.loadingIcon}>⏳</Text>}
                {completedGlasses === 8 && (
                  <Text style={styles.trophyIcon}>🏆</Text>
                )}
              </View>
              <Text style={styles.cardCounter}>{completedGlasses}/8</Text>
            </View>
            
            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground}>
                <View style={[styles.progressBarFill, { width: `${waterPercentage}%` }]} />
              </View>
            </View>

            {/* Water Glasses Grid */}
            <View style={styles.waterGlassesContainer}>
              {waterIntake.map((filled, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleGlassClick(index)}
                  style={[styles.waterGlass, filled && styles.waterGlassFilled]}
                >
                  <View style={[styles.waterGlassInner, filled && styles.waterGlassInnerFilled]}>
                    {filled && <View style={styles.waterLevel} />}
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Motivational Message */}
            <View style={styles.motivationContainer}>
              {completedGlasses === 0 && (
                <Text style={styles.motivationText}>💧 Start your day with water!</Text>
              )}
              {completedGlasses > 0 && completedGlasses < 4 && (
                <Text style={styles.motivationText}>🌟 Great start! Keep going!</Text>
              )}
              {completedGlasses >= 4 && completedGlasses < 8 && (
                <Text style={styles.motivationText}>💪 Almost there!</Text>
              )}
              {completedGlasses === 8 && (
                <Text style={[styles.motivationText, styles.motivationTextSuccess]}>
                  🏆 Daily goal achieved!
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Deep Breathing Tracker */}
        <View style={styles.sectionContainer}>
          <View style={styles.cardContainer}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <Text style={styles.breathingIcon}>💨</Text>
                <Text style={styles.cardTitle}>Deep Breathing</Text>
                {healthLoading && <Text style={styles.loadingIcon}>⏳</Text>}
                {completedBreathingExercises === 6 && (
                  <Text style={styles.trophyIcon}>🏆</Text>
                )}
              </View>
              <Text style={styles.cardCounter}>{completedBreathingExercises}/6</Text>
            </View>
            
            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground}>
                <View style={[styles.progressBarFillGreen, { width: `${breathingPercentage}%` }]} />
              </View>
            </View>

            {/* Main Breathing Action Button */}
            <TouchableOpacity
              onPress={startBreathingGuide}
              style={styles.breathingActionButton}
            >
              <LinearGradient
                colors={['#f0fdf4', '#dcfce7']}
                style={styles.breathingActionGradient}
              >
                <View style={styles.breathingActionIconContainer}>
                  <LinearGradient
                    colors={['#10b981', '#059669']}
                    style={styles.breathingActionIcon}
                  >
                    <Text style={styles.breathingActionIconText}>💨</Text>
                  </LinearGradient>
                </View>
                <View style={styles.breathingActionTextContainer}>
                  <Text style={styles.breathingActionTitle}>Take Deep Breaths</Text>
                  <Text style={styles.breathingActionSubtitle}>30-second guided breathing</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* Breathing Circles Grid */}
            <View style={styles.breathingCirclesContainer}>
              {breathingExercises.map((completed, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleBreathingCircleClick(index)}
                  style={[styles.breathingCircle, completed && styles.breathingCircleFilled]}
                >
                  <View style={[styles.breathingCircleInner, completed && styles.breathingCircleInnerFilled]}>
                    {completed && <View style={styles.breathingDot} />}
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Motivational Message */}
            <View style={styles.motivationContainer}>
              {completedBreathingExercises === 0 && (
                <Text style={styles.motivationText}>🌬️ Take a moment to breathe deeply</Text>
              )}
              {completedBreathingExercises > 0 && completedBreathingExercises < 3 && (
                <Text style={styles.motivationText}>🌟 Great start! Keep breathing mindfully</Text>
              )}
              {completedBreathingExercises >= 3 && completedBreathingExercises < 6 && (
                <Text style={styles.motivationText}>💚 You're doing amazing!</Text>
              )}
              {completedBreathingExercises === 6 && (
                <Text style={[styles.motivationText, styles.motivationTextSuccess]}>
                  🏆 Daily breathing goal achieved!
                </Text>
              )}
            </View>
          </View>
        </View>


        {/* Health Metrics Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.cardContainer}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <Text style={styles.heartIcon}>❤️</Text>
                <Text style={styles.cardTitle}>Today's Health</Text>
              </View>
              <TouchableOpacity style={styles.updateMetricsButton}>
                <Text style={styles.updateMetricsText}>Update</Text>
              </TouchableOpacity>
            </View>

            {/* Quick Health Metrics */}
            <View style={styles.healthMetricsContainer}>
              <View style={styles.healthMetricsRow}>
                <View style={[styles.healthMetric, styles.healthMetricBlue]}>
                  <Text style={styles.healthMetricIcon}>⚖️</Text>
                  <Text style={styles.healthMetricLabel}>Weight</Text>
                  <Text style={styles.healthMetricValue}>72.5 kg</Text>
                </View>
                <View style={[styles.healthMetric, styles.healthMetricGreen]}>
                  <Text style={styles.healthMetricIcon}>🧠</Text>
                  <Text style={styles.healthMetricLabel}>Mood</Text>
                  <Text style={styles.healthMetricValue}>8/10</Text>
                </View>
              </View>
              <View style={styles.healthMetricsRow}>
                <View style={[styles.healthMetric, styles.healthMetricPurple]}>
                  <Text style={styles.healthMetricIcon}>🌙</Text>
                  <Text style={styles.healthMetricLabel}>Sleep</Text>
                  <Text style={styles.healthMetricValue}>7.5h</Text>
                </View>
                <View style={[styles.healthMetric, styles.healthMetricOrange]}>
                  <Text style={styles.healthMetricIcon}>⚡</Text>
                  <Text style={styles.healthMetricLabel}>Energy</Text>
                  <Text style={styles.healthMetricValue}>High</Text>
                </View>
              </View>
            </View>

            {/* MoodFood Button */}
            <TouchableOpacity style={styles.moodFoodButton}>
              <LinearGradient
                colors={['#8b5cf6', '#a855f7']}
                style={styles.moodFoodButtonGradient}
              >
                <Text style={styles.moodFoodButtonIcon}>🍽️✨</Text>
                <Text style={styles.moodFoodButtonText}>MoodFood</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Meal of the Day Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.cardContainer}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <Text style={styles.mealIcon}>🍽️</Text>
                <Text style={styles.cardTitle}>Today's Meal Plan</Text>
              </View>
            </View>

            {/* Today's Planned Meal */}
            <View style={styles.plannedMealContainer}>
              <Image 
                source={{ uri: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=200&h=150&fit=crop' }}
                style={styles.plannedMealImage}
              />
              <View style={styles.plannedMealInfo}>
                <Text style={styles.plannedMealTitle}>Mediterranean Quinoa Bowl</Text>
                <Text style={styles.plannedMealTime}>Lunch • 1:30 PM</Text>
                <View style={styles.plannedMealMeta}>
                  <Text style={styles.plannedMealCookTime}>⏰ 25 min</Text>
                  <Text style={styles.plannedMealCalories}>🔥 420 cal</Text>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.mealActionButtons}>
              <TouchableOpacity style={styles.mealActionButtonPrimary}>
                <LinearGradient
                  colors={['#10b981', '#059669']}
                  style={styles.mealActionButtonGradient}
                >
                  <Text style={styles.mealActionButtonTextPrimary}>Start Cooking</Text>
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => onNavigateToTab('schedule')}
                style={styles.mealActionButtonSecondary}
              >
                <Text style={styles.mealActionButtonTextSecondary}>View Meal Plan</Text>
              </TouchableOpacity>
            </View>

            {/* No Meal Planned State */}
            {/* <View style={styles.noMealContainer}>
              <Text style={styles.noMealIcon}>📅</Text>
              <Text style={styles.noMealTitle}>No meal planned for today</Text>
              <Text style={styles.noMealSubtitle}>Let's create your meal plan</Text>
              
              <TouchableOpacity 
                onPress={() => onNavigateToTab('schedule')}
                style={styles.createPlanButton}
              >
                <LinearGradient
                  colors={['#3b82f6', '#1d4ed8']}
                  style={styles.createPlanButtonGradient}
                >
                  <Text style={styles.createPlanButtonText}>Create Meal Plan</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View> */}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerContent: {
    position: 'relative',
  },
  brandingContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoText: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  welcomeText: {
    fontSize: 16,
    color: '#6b7280',
  },
  profileButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  profileButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileButtonText: {
    fontSize: 18,
  },
  quickStats: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  statCardGreen: {
    backgroundColor: '#dcfce7',
  },
  statCardBlue: {
    backgroundColor: '#dbeafe',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  cardContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  cardCounter: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  waterIcon: {
    fontSize: 20,
  },
  trophyIcon: {
    fontSize: 16,
  },
  loadingIcon: {
    fontSize: 16,
  },
  heartIcon: {
    fontSize: 20,
  },
  chevronIcon: {
    fontSize: 12,
    color: '#6b7280',
  },
  progressBarContainer: {
    marginBottom: 16,
  },
  progressBarBackground: {
    width: '100%',
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 3,
  },
  waterGlassesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 16,
  },
  waterGlass: {
    width: 32,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  waterGlassFilled: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  waterGlassInner: {
    width: 24,
    height: 32,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#d1d5db',
    position: 'relative',
    overflow: 'hidden',
  },
  waterGlassInnerFilled: {
    borderColor: '#3b82f6',
  },
  waterLevel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '80%',
    backgroundColor: '#3b82f6',
    opacity: 0.6,
  },
  motivationContainer: {
    alignItems: 'center',
  },
  motivationText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  motivationTextSuccess: {
    color: '#10b981',
    fontWeight: '600',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  actionCard: {
    width: (screenWidth - 64) / 2, // Account for padding and gap
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionIcon: {
    fontSize: 24,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  checkInContent: {
    paddingTop: 16,
  },
  healthMetricsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  healthMetricsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  healthMetric: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  healthMetricBlue: {
    backgroundColor: '#eff6ff',
  },
  healthMetricGreen: {
    backgroundColor: '#f0fdf4',
  },
  healthMetricPurple: {
    backgroundColor: '#faf5ff',
  },
  healthMetricOrange: {
    backgroundColor: '#fff7ed',
  },
  healthMetricIcon: {
    fontSize: 16,
    marginBottom: 4,
  },
  healthMetricLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  healthMetricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  mealTimesContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  mealTimesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  mealTimeCard: {
    flex: 1,
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  mealTimeCardOrange: {
    backgroundColor: '#fff7ed',
  },
  mealTimeCardGreen: {
    backgroundColor: '#f0fdf4',
  },
  mealTimeCardPurple: {
    backgroundColor: '#faf5ff',
  },
  mealTimeIcon: {
    fontSize: 12,
    marginBottom: 2,
  },
  mealTimeLabel: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 2,
  },
  mealTimeValue: {
    fontSize: 10,
    fontWeight: '600',
    color: '#111827',
  },
  updateButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  updateButtonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  updateButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  activityList: {
    marginVertical: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    marginBottom: 8,
  },
  activityImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  activityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  starsContainer: {
    flexDirection: 'row',
  },
  star: {
    fontSize: 12,
  },
  activityDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  viewAllButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  breathingIcon: {
    fontSize: 20,
  },
  progressBarFillGreen: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 3,
  },
  breathingActionButton: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  breathingActionGradient: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  breathingActionIconContainer: {
    marginRight: 16,
  },
  breathingActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  breathingActionIconText: {
    fontSize: 24,
    color: 'white',
  },
  breathingActionTextContainer: {
    flex: 1,
  },
  breathingActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  breathingActionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  breathingCirclesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 16,
  },
  breathingCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  breathingCircleFilled: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  breathingCircleInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    position: 'relative',
    overflow: 'hidden',
  },
  breathingCircleInnerFilled: {
    borderColor: '#10b981',
  },
  breathingDot: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#10b981',
    borderRadius: 12,
    opacity: 0.6,
  },
  breathingGuideContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  breathingGuideContent: {
    width: '90%',
    maxWidth: 320,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
  },
  breathingCircleContainer: {
    marginBottom: 32,
  },
  breathingInstructionContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  breathingInstructionText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  breathingCycleText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  breathingProgressContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  breathingProgressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#d1d5db',
  },
  breathingProgressDotActive: {
    backgroundColor: '#10b981',
  },
  breathingSkipButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(107, 114, 128, 0.2)',
    borderRadius: 8,
  },
  breathingSkipText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  breathingCircleIcon: {
    fontSize: 32,
    color: '#10b981',
  },
  updateMetricsButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  updateMetricsText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  mealIcon: {
    fontSize: 20,
  },
  plannedMealContainer: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  plannedMealImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  plannedMealInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  plannedMealTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  plannedMealTime: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  plannedMealMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  plannedMealCookTime: {
    fontSize: 12,
    color: '#6b7280',
  },
  plannedMealCalories: {
    fontSize: 12,
    color: '#6b7280',
  },
  mealActionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  mealActionButtonPrimary: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  mealActionButtonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  mealActionButtonTextPrimary: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  mealActionButtonSecondary: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  mealActionButtonTextSecondary: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  noMealContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  noMealIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  noMealTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  noMealSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
  },
  createPlanButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  createPlanButtonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  createPlanButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  moodFoodButton: {
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  moodFoodButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 8,
  },
  moodFoodButtonIcon: {
    fontSize: 18,
  },
  moodFoodButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});