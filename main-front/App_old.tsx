import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-url-polyfill/auto';
import { View, StyleSheet } from 'react-native';
import { mockAuth } from './src/utils/mockAuth';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainTabs from './screens/MainTabs';
import { AuthScreen } from './components/AuthScreen';
import { LandingPage } from './components/LandingPage';
import { PostAuthSlides } from './components/PostAuthSlides';
import { OnboardingFlow } from './components/OnboardingFlow';
import { MealRecommendations } from './components/MealRecommendations';
import { ProfileScreen } from './components/ProfileScreen';
import { ShopScreen } from './components/ShopScreen';
import { ScheduleScreen } from './components/ScheduleScreen';
import { AnalysisScreen } from './components/AnalysisScreen';
import { LeftoversScreen } from './components/LeftoversScreen';
import { FamilyVoteShare } from './components/FamilyVoteShare';
import { FamilyVoteLanding } from './components/FamilyVoteLanding';
import { VoteResults } from './components/VoteResults';
import { ProfileSummaryLoading } from './components/ProfileSummaryLoading';
import { ProfileCompletion } from './components/ProfileCompletion';

type AppState = 'landing' | 'auth' | 'postAuthSlides' | 'profileCompletion' | 'onboarding' | 'profileSummaryLoading' | 'mealRecommendations' | 'authenticated' | 'leftovers' | 'familyVoteShare' | 'familyVoteLanding' | 'voteResults';
type AuthMode = 'login' | 'signup' | 'google';

interface CookedRecipe {
  id: string;
  name: string;
  image: string;
  cookedDate: string;
  rating?: number;
}

interface GroceryItem {
  id: string;
  name: string;
  amount: string;
  category: string;
  addedDate: string;
  fromRecipe?: string;
  completed?: boolean;
}

interface Recipe {
  id: string;
  name: string;
  image: string;
  cookTime: string;
  servings: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  rating: number;
  tags: string[];
  description: string;
  ingredients: {
    name: string;
    amount: string;
    category: string;
  }[];
  instructions: string[];
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
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
  leftovers?: string[];
  groceryList?: GroceryItem[];
}

export default function App() {
  const [appState, setAppState] = useState<AppState>('landing');
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [currentRecipeForVote, setCurrentRecipeForVote] = useState<Recipe | null>(null);
  const [currentVoteId, setCurrentVoteId] = useState<string | null>(null);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Check if user has a real session first
        const existingSession = await AsyncStorage.getItem('wellnoosh_session');
        
        if (!existingSession) {
          // Only create mock session if no real session exists
          await mockAuth.createMockSession();
        } else {
          const session = JSON.parse(existingSession);
          console.log('🔑 Using existing authenticated session');
          console.log('🔍 Session details:', {
            user_id: session.user?.id,
            email: session.user?.email,
            is_mock: session.access_token === 'mock-jwt-token-for-testing'
          });
          
          // If it's a mock session, clear it and require real authentication
          if (session.access_token === 'mock-jwt-token-for-testing') {
            console.log('🧹 Clearing mock session - requiring real authentication');
            await AsyncStorage.removeItem('wellnoosh_session');
            await AsyncStorage.removeItem('wellnoosh_user_data');
            setAppState('landing');
            return;
          }
          
          // Check if session is expired or user no longer exists
          if (session.expires_at && Date.now() > session.expires_at) {
            console.log('🧹 Session expired - clearing and requiring re-authentication');
            await AsyncStorage.removeItem('wellnoosh_session');
            await AsyncStorage.removeItem('wellnoosh_user_data');
            await AsyncStorage.removeItem('wellnoosh_onboarding_completed');
            await AsyncStorage.removeItem('wellnoosh_feature_slides_seen');
            await AsyncStorage.removeItem('wellnoosh_profile_completion_completed');
            await AsyncStorage.removeItem('wellnoosh_meal_recommendations_completed');
            setAppState('landing');
            return;
          }
        }
        
        const hasCompletedOnboarding = await AsyncStorage.getItem('wellnoosh_onboarding_completed');
        const hasSeenFeatureSlides = await AsyncStorage.getItem('wellnoosh_feature_slides_seen');
        const hasCompletedProfileCompletion = await AsyncStorage.getItem('wellnoosh_profile_completion_completed');
        const hasCompletedMealRecommendations = await AsyncStorage.getItem('wellnoosh_meal_recommendations_completed');
        const storedUserData = await AsyncStorage.getItem('wellnoosh_user_data');
        
        if (storedUserData) {
          const parsedUserData = JSON.parse(storedUserData);
          if (!parsedUserData.subscriptionTier) {
            parsedUserData.subscriptionTier = 'free';
            parsedUserData.dailySwipesUsed = 0;
            parsedUserData.lastSwipeDate = new Date().toDateString();
            parsedUserData.favoriteRecipes = [];
            parsedUserData.selectedRecipes = [];
            parsedUserData.cookedRecipes = [];
            parsedUserData.leftovers = [];
            parsedUserData.groceryList = [];
          }
          setUserData(parsedUserData);
          
          if (hasCompletedOnboarding && hasSeenFeatureSlides && hasCompletedProfileCompletion && hasCompletedMealRecommendations) {
            // For demo purposes, we'll still show landing page but this could be configured
            // setAppState('authenticated');
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    loadUserData();
  }, []);

  useEffect(() => {
    const updateSwipeCount = async () => {
      if (userData && userData.subscriptionTier === 'free') {
        const today = new Date().toDateString();
        if (userData.lastSwipeDate !== today) {
          const updatedUserData = {
            ...userData,
            dailySwipesUsed: 0,
            lastSwipeDate: today
          };
          setUserData(updatedUserData);
          await AsyncStorage.setItem('wellnoosh_user_data', JSON.stringify(updatedUserData));
        }
      }
    };

    updateSwipeCount();
  }, [userData]);

  const handleGetStarted = () => {
    setAuthMode('signup');
    setAppState('auth');
  };

  const handleSignIn = () => {
    setAuthMode('login');
    setAppState('auth');
  };

  const handleAuthSuccess = async (mode: AuthMode, userInfo: UserData) => {
    setAuthMode(mode);
    
    const userWithSubscription = {
      ...userInfo,
      subscriptionTier: 'free' as const,
      dailySwipesUsed: 0,
      lastSwipeDate: new Date().toDateString(),
      favoriteRecipes: [],
      selectedRecipes: [],
      cookedRecipes: [],
      leftovers: [],
      groceryList: []
    };
    
    setUserData(userWithSubscription);
    await AsyncStorage.setItem('wellnoosh_user_data', JSON.stringify(userWithSubscription));
    
    // Check if user has completed the full flow before
    const hasCompletedOnboarding = await AsyncStorage.getItem('wellnoosh_onboarding_completed');
    const hasSeenFeatureSlides = await AsyncStorage.getItem('wellnoosh_feature_slides_seen');
    const hasCompletedProfileCompletion = await AsyncStorage.getItem('wellnoosh_profile_completion_completed');
    const hasCompletedMealRecommendations = await AsyncStorage.getItem('wellnoosh_meal_recommendations_completed');
    
    if (mode === 'login') {
      // Existing user logging in
      if (hasCompletedOnboarding && hasSeenFeatureSlides && hasCompletedProfileCompletion && hasCompletedMealRecommendations) {
        // User has completed all onboarding - go directly to meal recommendations
        setAppState('mealRecommendations');
        setIsFirstTimeUser(false);
      } else {
        // User has account but hasn't completed onboarding - continue where they left off
        if (!hasSeenFeatureSlides) {
          setAppState('postAuthSlides');
          setIsFirstTimeUser(true);
        } else if (!hasCompletedProfileCompletion) {
          setAppState('profileCompletion');
          setIsFirstTimeUser(true);
        } else if (!hasCompletedOnboarding) {
          setAppState('onboarding');
          setIsFirstTimeUser(true);
        } else {
          setAppState('mealRecommendations');
          setIsFirstTimeUser(true);
        }
      }
    } else if (mode === 'google') {
      // Google user - check if they've been here before
      if (hasCompletedOnboarding && hasSeenFeatureSlides && hasCompletedProfileCompletion && hasCompletedMealRecommendations) {
        // Returning Google user - go directly to meal recommendations
        setAppState('mealRecommendations');
        setIsFirstTimeUser(false);
      } else {
        // New Google user - show feature slides first
        setAppState('postAuthSlides');
        setIsFirstTimeUser(true);
      }
    } else if (mode === 'signup') {
      // New user signing up - show feature slides first
      setAppState('postAuthSlides');
      setIsFirstTimeUser(true);
    }
  };

  const handleFeatureSlidesComplete = async (completeUserData: UserData) => {
    setUserData(completeUserData);
    await AsyncStorage.setItem('wellnoosh_user_data', JSON.stringify(completeUserData));
    await AsyncStorage.setItem('wellnoosh_feature_slides_seen', 'true');
    setAppState('profileCompletion');
  };

  const handleFeatureSlidesSkip = async () => {
    await AsyncStorage.setItem('wellnoosh_feature_slides_seen', 'true');
    setAppState('profileCompletion');
  };

  const handleProfileCompletionComplete = async (completeUserData: UserData) => {
    setUserData(completeUserData);
    await AsyncStorage.setItem('wellnoosh_user_data', JSON.stringify(completeUserData));
    await AsyncStorage.setItem('wellnoosh_profile_completion_completed', 'true');
    setAppState('onboarding');
  };

  const handleOnboardingComplete = async (completeUserData: UserData) => {
    setUserData(completeUserData);
    await AsyncStorage.setItem('wellnoosh_user_data', JSON.stringify(completeUserData));
    await AsyncStorage.setItem('wellnoosh_onboarding_completed', 'true');
    
    // Save onboarding data to database
    try {
      console.log('🔄 Saving onboarding data to database...');
      console.log('📋 Onboarding data to save:', JSON.stringify(completeUserData, null, 2));
      
      const session = await AsyncStorage.getItem('wellnoosh_session');
      
      if (session) {
        const parsedSession = JSON.parse(session);
        console.log('🔑 Using session with user ID:', parsedSession.user?.id);
        
        const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/users/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${parsedSession.access_token}`
          },
          body: JSON.stringify(completeUserData)
        });

        console.log('📡 Response status:', response.status);
        
        if (response.ok) {
          const responseData = await response.json();
          console.log('✅ Onboarding data saved to database:', responseData);
        } else {
          const errorText = await response.text();
          console.log('⚠️ Failed to save onboarding data. Status:', response.status);
          console.log('⚠️ Error details:', errorText);
        }
      } else {
        console.log('❌ No session found, cannot save to database');
      }
    } catch (error) {
      console.log('⚠️ Error saving onboarding data:', error);
    }
    
    setAppState('profileSummaryLoading');
  };

  const handleProfileSummaryLoadingComplete = () => {
    setAppState('mealRecommendations');
  };

  const handleOnboardingSkip = async () => {
    const hasCompletedOnboarding = await AsyncStorage.getItem('wellnoosh_onboarding_completed');
    if (!hasCompletedOnboarding) {
      await AsyncStorage.setItem('wellnoosh_onboarding_completed', 'true');
    }
    setAppState('mealRecommendations');
  };

  const handleMealRecommendationsComplete = async (updatedUserData: UserData) => {
    setUserData(updatedUserData);
    await AsyncStorage.setItem('wellnoosh_user_data', JSON.stringify(updatedUserData));
    await AsyncStorage.setItem('wellnoosh_meal_recommendations_completed', 'true');
    setAppState('authenticated');
    setIsFirstTimeUser(false);
  };

  const handleMealRecommendationsSkip = async () => {
    await AsyncStorage.setItem('wellnoosh_meal_recommendations_completed', 'true');
    setAppState('authenticated');
    setIsFirstTimeUser(false);
  };

  const handleLeftoversBack = () => {
    setAppState('authenticated');
  };

  const handleShareWithFamily = (recipe: Recipe) => {
    setCurrentRecipeForVote(recipe);
    setAppState('familyVoteShare');
  };

  const handleVoteCreated = (voteId: string) => {
    setCurrentVoteId(voteId);
    setAppState('mealRecommendations');
  };

  const handleVoteComplete = (voteId: string) => {
    setCurrentVoteId(voteId);
    setAppState('voteResults');
  };

  const handleStartCooking = () => {
    setCurrentRecipeForVote(null);
    setCurrentVoteId(null);
    setAppState('authenticated');
  };

  const handleCreateNewVote = () => {
    setCurrentRecipeForVote(null);
    setCurrentVoteId(null);
    setAppState('mealRecommendations');
  };

  const handleFamilyVoteBack = () => {
    setAppState('mealRecommendations');
  };

  if (appState === 'familyVoteShare') {
    return (
      <SafeAreaProvider>
        <View style={styles.container}>
          <StatusBar style="dark" />
          {currentRecipeForVote && (
            <FamilyVoteShare 
              recipe={currentRecipeForVote}
              onBack={handleFamilyVoteBack}
              onVoteCreated={handleVoteCreated}
            />
          )}
        </View>
      </SafeAreaProvider>
    );
  }

  if (appState === 'familyVoteLanding') {
    return (
      <SafeAreaProvider>
        <View style={styles.container}>
          <StatusBar style="dark" />
          {currentVoteId && (
            <FamilyVoteLanding 
              voteId={currentVoteId}
              onVoteComplete={handleVoteComplete}
            />
          )}
        </View>
      </SafeAreaProvider>
    );
  }

  if (appState === 'voteResults') {
    return (
      <SafeAreaProvider>
        <View style={styles.container}>
          <StatusBar style="dark" />
          {currentVoteId && (
            <VoteResults 
              voteId={currentVoteId}
              onStartCooking={handleStartCooking}
              onCreateNewVote={handleCreateNewVote}
            />
          )}
        </View>
      </SafeAreaProvider>
    );
  }

  if (appState === 'leftovers') {
    return (
      <SafeAreaProvider>
        <View style={styles.container}>
          <StatusBar style="dark" />
          <LeftoversScreen 
            userData={userData}
            onBack={handleLeftoversBack}
          />
        </View>
      </SafeAreaProvider>
    );
  }

  if (appState === 'landing') {
    return (
      <SafeAreaProvider>
        <View style={styles.container}>
          <StatusBar style="dark" />
          <LandingPage onGetStarted={handleGetStarted} onSignIn={handleSignIn} />
        </View>
      </SafeAreaProvider>
    );
  }

  if (appState === 'auth') {
    return (
      <SafeAreaProvider>
        <View style={styles.container}>
          <StatusBar style="dark" />
          <AuthScreen onAuthenticated={handleAuthSuccess} initialMode={authMode} />
        </View>
      </SafeAreaProvider>
    );
  }

  if (appState === 'postAuthSlides') {
    return (
      <SafeAreaProvider>
        <View style={styles.container}>
          <StatusBar style="dark" />
          <PostAuthSlides 
            onComplete={handleFeatureSlidesComplete}
            onSkip={handleFeatureSlidesSkip}
            userData={userData}
          />
        </View>
      </SafeAreaProvider>
    );
  }

  if (appState === 'profileCompletion') {
    return (
      <SafeAreaProvider>
        <View style={styles.container}>
          <StatusBar style="dark" />
          <ProfileCompletion 
            onComplete={handleProfileCompletionComplete}
            userData={userData}
          />
        </View>
      </SafeAreaProvider>
    );
  }

  if (appState === 'onboarding') {
    return (
      <SafeAreaProvider>
        <View style={styles.container}>
          <StatusBar style="dark" />
          <OnboardingFlow 
            onComplete={handleOnboardingComplete}
            onSkip={handleOnboardingSkip}
            userData={userData}
          />
        </View>
      </SafeAreaProvider>
    );
  }

  if (appState === 'profileSummaryLoading') {
    return (
      <SafeAreaProvider>
        <View style={styles.container}>
          <StatusBar style="dark" />
          <ProfileSummaryLoading 
            userData={userData!}
            onComplete={handleProfileSummaryLoadingComplete}
          />
        </View>
      </SafeAreaProvider>
    );
  }

  if (appState === 'mealRecommendations') {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <View style={styles.container}>
            <StatusBar style="dark" />
            <MealRecommendations 
              onComplete={handleMealRecommendationsComplete}
              onSkip={handleMealRecommendationsSkip}
              userData={userData}
              onUpdateUserData={setUserData}
              onShareWithFamily={handleShareWithFamily}
            />
          </View>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar style="dark" />
          <MainTabs />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  navigation: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});