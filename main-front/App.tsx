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

type AppState = 'landing' | 'auth' | 'onboarding' | 'profileCompletion' | 'profileSummary' | 'recipeSwipe' | 'authenticated' | 'familyVoteShare' | 'familyVoteLanding' | 'voteResults'
type AuthMode = 'login' | 'signup' | 'google'

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
    if (!loading && !userDataLoading) {
      if (session) {
        // User is authenticated, check onboarding status
        if (userData?.onboardingCompleted) {
          setAppState('authenticated')
        } else {
          setAppState('onboarding')
        }
      } else {
        // User is not authenticated
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

  const handleOnboardingComplete = (userData: any) => {
    setOnboardingData(userData)
    setAppState('profileCompletion')
  }

  const handleProfileCompletionComplete = (completeUserData: any) => {
    // Merge the profile completion data with existing onboarding data
    setOnboardingData(prev => ({ ...prev, ...completeUserData }))
    setAppState('profileSummary')
  }

  const handleProfileSummaryComplete = async () => {
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
      
      // Go to recipe swipe screen before main dashboard
      setAppState('recipeSwipe')
    } catch (error) {
      console.error('❌ Error saving onboarding data:', error)
      // Still continue to recipe swipe even if save fails
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

  if (appState === 'onboarding') {
    return (
      <SafeAreaProvider>
        <View style={styles.container}>
          <StatusBar style="dark" />
          <OnboardingFlow 
            onComplete={handleOnboardingComplete} 
            onSkip={handleOnboardingComplete}
            userData={userData}
          />
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
            userData={onboardingData}
          />
        </View>
      </SafeAreaProvider>
    )
  }

  if (appState === 'profileSummary') {
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
    return (
      <SafeAreaProvider>
        <View style={styles.container}>
          <StatusBar style="dark" />
          <RecipeSwipeScreen 
            onNavigateBack={handleRecipeSwipeComplete}
          />
        </View>
      </SafeAreaProvider>
    )
  }

  // Authenticated state - main app
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
        <AppContent />
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