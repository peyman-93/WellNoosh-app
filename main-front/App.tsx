import React from 'react'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import 'react-native-url-polyfill/auto'
import { View, Text, StyleSheet } from 'react-native'

import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

// Providers
import { AuthProvider, useAuth } from './src/context/supabase-provider'
import { UserDataProvider, useUserData } from './src/context/user-data-provider'
import { BadgeProvider } from './src/context/BadgeContext'

// Screens
import MainTabs from './screens/MainTabs'
import { AuthScreen } from './components/AuthScreen'
import { LandingPage } from './components/LandingPage'
import { PostAuthSlides } from './components/PostAuthSlides'
import { OnboardingFlow } from './components/OnboardingFlow'
import { MealRecommendations } from './components/MealRecommendations'
import { LeftoversScreen } from './components/LeftoversScreen'
import { FamilyVoteShare } from './components/FamilyVoteShare'
import { FamilyVoteLanding } from './components/FamilyVoteLanding'
import { VoteResults } from './components/VoteResults'
import { ProfileSummaryLoading } from './components/ProfileSummaryLoading'
import { ProfileCompletion } from './components/ProfileCompletion'
import RecipeSwipeScreen from './screens/RecipeSwipeScreen'

const Stack = createNativeStackNavigator()

type AppState = 'landing' | 'auth' | 'profileCompletion' | 'onboarding' | 'profileSummary' | 'recipeSwipe' | 'authenticated' | 'familyVoteShare' | 'familyVoteLanding' | 'voteResults'
type AuthMode = 'login' | 'signup' | 'google'

// Track if recommendations were shown for the current user in this app session
// This resets when user logs out OR when the app/module reloads
let shownRecommendationsForUserId: string | null = null

interface Recipe {
  id: string
  name: string
  image: string
  cookTime: string
  servings: number
  difficulty: 'Easy' | 'Medium' | 'Hard'
  rating: number
  tags: string[]
  description: string
  ingredients: {
    name: string
    amount: string
    category: string
  }[]
  instructions: string[]
  nutrition: {
    calories: number
    protein: number
    carbs: number
    fat: number
  }
}

function AppContent() {
  const { session, loading } = useAuth()
  const { userData, loading: userDataLoading, updateUserData, saveToSupabase, saveToSupabaseWithData } = useUserData()
  const [appState, setAppState] = React.useState<AppState>('landing')
  const [authMode, setAuthMode] = React.useState<AuthMode>('login')
  const [currentRecipeForVote, setCurrentRecipeForVote] = React.useState<Recipe | null>(null)
  const [currentVoteId, setCurrentVoteId] = React.useState<string | null>(null)
  const [onboardingData, setOnboardingData] = React.useState<any>(null)

  React.useEffect(() => {
    const currentUserId = session?.user?.id || null
    // Show recommendations if user is authenticated and hasn't seen them this app session
    const shouldShowRecommendations = currentUserId && shownRecommendationsForUserId !== currentUserId
    
    console.log('🔍 App State Effect - Initial Check:', {
      loading,
      userDataLoading,
      hasSession: !!session,
      onboardingCompleted: userData?.onboardingCompleted,
      currentAppState: appState,
      currentUserId,
      shownRecommendationsForUserId,
      shouldShowRecommendations
    })
    
    if (!loading && !userDataLoading) {
      if (session) {
        // User is authenticated, check onboarding status
        if (userData?.onboardingCompleted) {
          // Don't override recipeSwipe state - let it complete naturally
          if (appState !== 'recipeSwipe') {
            // Show recipe recommendations if not already shown for this user this session
            if (shouldShowRecommendations) {
              console.log('🍽️ Showing recipe recommendations for sign-in')
              setAppState('recipeSwipe')
            } else {
              console.log('✅ User onboarding completed, setting to authenticated')
              setAppState('authenticated')
            }
          } else {
            console.log('🍽️ User in recipe swipe, not overriding state')
          }
        } else {
          console.log('🔄 User needs onboarding, setting to profileCompletion')
          setAppState('profileCompletion')
        }
      } else {
        // User is not authenticated - reset recommendation tracking
        shownRecommendationsForUserId = null
        console.log('🚪 No session, setting to landing')
        setAppState('landing')
      }
    }
  }, [session, loading, userData, userDataLoading])

  const handleGetStarted = () => {
    setAuthMode('signup')
    setAppState('auth')
  }

  const handleSignIn = () => {
    setAuthMode('login')
    setAppState('auth')
  }

  const handleAuthSuccess = () => {
    // After successful auth, Supabase will trigger session change
    // and useEffect will handle the state transition
  }

  const handleProfileCompletionComplete = (userData: any) => {
    console.log('🔄 Profile Completion Complete:', {
      userData: userData,
      currentState: appState,
      nextState: 'onboarding'
    })
    setOnboardingData(userData)
    setAppState('onboarding')
  }

  const handleOnboardingComplete = (completeUserData: any) => {
    console.log('🔄 Onboarding Complete:', {
      completeUserData: completeUserData,
      currentOnboardingData: onboardingData,
      currentState: appState,
      nextState: 'profileSummary'
    })
    // Merge the onboarding data with existing profile completion data
    setOnboardingData(prev => ({ ...prev, ...completeUserData }))
    setAppState('profileSummary')
  }

  const handleProfileSummaryComplete = async () => {
    console.log('🔄 Profile Summary Complete - Starting:', {
      currentState: appState,
      hasOnboardingData: !!onboardingData,
      onboardingDataKeys: onboardingData ? Object.keys(onboardingData) : [],
      expectedNextState: 'recipeSwipe'
    })
    
    try {
      // Update user data with onboarding data
      if (onboardingData) {
        console.log('🔍 Debug - onboardingData being saved:', onboardingData)
        console.log('🔍 Debug - current userData before merge:', userData)
        
        // Get the merged data directly and pass it to save function
        const mergedData = await updateUserData(onboardingData)
        if (mergedData) {
          console.log('🔍 Debug - merged data for save:', mergedData)
          // Save the merged data directly instead of relying on state update
          await saveToSupabaseWithData(mergedData)
        }
        console.log('✅ Onboarding data saved to Supabase')
      }
      
      // Mark onboarding as completed
      await updateUserData({ onboardingCompleted: true })
      console.log('✅ Onboarding marked as completed')
      
      // Go to recipe swipe screen before main dashboard
      console.log('🍽️ Setting state to recipeSwipe')
      setAppState('recipeSwipe')
    } catch (error) {
      console.error('❌ Error saving onboarding data:', error)
      // Still continue to recipe swipe even if save fails
      console.log('🍽️ Error occurred, still setting state to recipeSwipe')
      setAppState('recipeSwipe')
    }
  }

  const handleShareWithFamily = (recipe: Recipe) => {
    setCurrentRecipeForVote(recipe)
    setAppState('familyVoteShare')
  }

  const handleVoteCreated = (voteId: string) => {
    setCurrentVoteId(voteId)
    setAppState('authenticated')
  }

  const handleVoteComplete = (voteId: string) => {
    setCurrentVoteId(voteId)
    setAppState('voteResults')
  }

  const handleStartCooking = () => {
    setCurrentRecipeForVote(null)
    setCurrentVoteId(null)
    setAppState('authenticated')
  }

  const handleCreateNewVote = () => {
    setCurrentRecipeForVote(null)
    setCurrentVoteId(null)
    setAppState('authenticated')
  }

  const handleFamilyVoteBack = () => {
    setAppState('authenticated')
  }

  const handleRecipeSwipeComplete = () => {
    console.log('🔄 Recipe Swipe Complete:', {
      currentState: appState,
      nextState: 'authenticated'
    })
    // Mark that we've shown recommendations for this user
    if (session?.user?.id) {
      shownRecommendationsForUserId = session.user.id
    }
    setAppState('authenticated')
  }

  const handleRecipeSwipeSkip = () => {
    console.log('🔄 Recipe Swipe Skipped:', {
      currentState: appState,
      nextState: 'authenticated'
    })
    // Mark that we've shown recommendations for this user (even if skipped)
    if (session?.user?.id) {
      shownRecommendationsForUserId = session.user.id
    }
    setAppState('authenticated')
  }


  if (loading || userDataLoading) {
    return (
      <SafeAreaProvider>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaProvider>
    )
  }

  // Family voting states
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
    )
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
    )
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
    )
  }

  // Main app states
  if (appState === 'landing') {
    return (
      <SafeAreaProvider>
        <View style={styles.container}>
          <StatusBar style="dark" />
          <LandingPage onGetStarted={handleGetStarted} onSignIn={handleSignIn} />
        </View>
      </SafeAreaProvider>
    )
  }

  if (appState === 'auth') {
    return (
      <SafeAreaProvider>
        <View style={styles.container}>
          <StatusBar style="dark" />
          <AuthScreen onAuthenticated={handleAuthSuccess} initialMode={authMode} />
        </View>
      </SafeAreaProvider>
    )
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
    )
  }

  if (appState === 'onboarding') {
    return (
      <SafeAreaProvider>
        <View style={styles.container}>
          <StatusBar style="dark" />
          <OnboardingFlow 
            onComplete={handleOnboardingComplete} 
            onSkip={handleOnboardingComplete}
            userData={onboardingData}
          />
        </View>
      </SafeAreaProvider>
    )
  }

  if (appState === 'profileSummary') {
    console.log('📊 Rendering ProfileSummaryLoading state')
    return (
      <SafeAreaProvider>
        <View style={styles.container}>
          <StatusBar style="dark" />
          <ProfileSummaryLoading 
            userData={onboardingData}
            onComplete={handleProfileSummaryComplete}
          />
        </View>
      </SafeAreaProvider>
    )
  }

  if (appState === 'recipeSwipe') {
    console.log('🍽️ Rendering RecipeSwipeScreen state')
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <View style={styles.container}>
            <StatusBar style="dark" />
            <RecipeSwipeScreen 
              onNavigateBack={handleRecipeSwipeComplete}
              showSkipButton={true}
              onSkip={handleRecipeSwipeSkip}
            />
          </View>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    )
  }

  // Authenticated state - main app
  console.log('🏠 Rendering MainTabs authenticated state - appState:', appState)
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar style="dark" />
          <MainTabs />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <UserDataProvider>
        <BadgeProvider>
          <AppContent />
        </BadgeProvider>
      </UserDataProvider>
    </AuthProvider>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAF7F0',
  },
  loadingText: {
    fontSize: 18,
    color: '#1A1A1A',
    fontFamily: 'Inter',
  },
})