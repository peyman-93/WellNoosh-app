import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  Pressable,
  Alert,
  StyleSheet,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useAuth } from '@/context/supabase-provider'
import { useUserData } from '@/context/user-data-provider'

type AllergyType = 'gluten' | 'dairy' | 'nuts' | 'shellfish' | 'soy' | 'eggs' | 'fish' | 'sesame'

interface AllergyOption {
  id: AllergyType
  name: string
  emoji: string
  bgColor: string
}

const allergyOptions: AllergyOption[] = [
  { id: 'gluten', name: 'Gluten / Gluten Sensitivity', emoji: '🌾', bgColor: '#FEF3C7' },
  { id: 'dairy', name: 'Dairy', emoji: '🥛', bgColor: '#DBEAFE' },
  { id: 'nuts', name: 'Tree Nuts', emoji: '🥜', bgColor: '#D1FAE5' },
  { id: 'shellfish', name: 'Shellfish', emoji: '🦐', bgColor: '#FEE2E2' },
  { id: 'soy', name: 'Soy', emoji: '🫘', bgColor: '#F3E8FF' },
  { id: 'eggs', name: 'Eggs', emoji: '🥚', bgColor: '#FCE7F3' },
  { id: 'fish', name: 'Fish', emoji: '🐟', bgColor: '#E0F2FE' },
  { id: 'sesame', name: 'Sesame', emoji: '🌰', bgColor: '#F3F4F6' },
]

interface AllergiesScreenProps {
  navigation: any
  route: any
}

export default function AllergiesScreen({ navigation, route }: AllergiesScreenProps) {
  const [selectedAllergies, setSelectedAllergies] = useState<AllergyType[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasCompletedAuth, setHasCompletedAuth] = useState(false)
  const { signUp, signIn, session } = useAuth()
  const { updateUserData } = useUserData()

  // Monitor session changes and navigate to main app when authenticated
  useEffect(() => {
    console.log('AllergiesScreen: Session state changed:', session ? 'AUTHENTICATED' : 'NOT_AUTHENTICATED')
    
    if (session && !isLoading) {
      console.log('AllergiesScreen: User is authenticated, should navigate to main app')
      // The navigation will be handled by App.tsx, but we can reset the stack
      // Force navigation reset to ensure we go to MainTabs
      setTimeout(() => {
        console.log('AllergiesScreen: Attempting to reset navigation stack...')
        // This will trigger the App.tsx navigation logic to switch to MainTabs
      }, 1000)
    }
  }, [session, isLoading])

  const handleAllergyToggle = (allergyId: AllergyType) => {
    setSelectedAllergies(prev => {
      if (prev.includes(allergyId)) {
        return prev.filter(id => id !== allergyId)
      } else {
        return [...prev, allergyId]
      }
    })
  }

  const completeOnboarding = async () => {
    if (hasCompletedAuth) {
      console.log('Authentication already completed, skipping...')
      return
    }
    
    setIsLoading(true)
    try {
      // Get the user credentials from navigation params
      const userCredentials = route.params?.userCredentials;
      
      console.log('DEBUG: Route params:', route.params);
      console.log('DEBUG: User credentials:', userCredentials);
      
      // Check if user is already authenticated (e.g., Google OAuth)
      if (!userCredentials) {
        // User might be already authenticated via Google OAuth
        // Just save the preferences and continue
        console.log('No credentials found - user may be authenticated via OAuth');
        console.log('Onboarding completed with allergies:', selectedAllergies);
        
        Alert.alert(
          'Welcome to WellNoosh!', 
          `${selectedAllergies.length > 0 ? 'Your allergies have been saved!' : 'Profile setup complete!'} You're all set!`,
          [
            {
              text: 'Get Started',
              onPress: () => {
                // The auth state change will automatically navigate to MainTabs
              }
            }
          ]
        )
        return;
      }
      
      console.log('DEBUG: Attempting to create account with:', userCredentials.email);
      
      try {
        // Try to create the account first
        await signUp(userCredentials.email, userCredentials.password)
        setHasCompletedAuth(true)
        console.log('Account created and onboarding completed:', { 
          email: userCredentials.email,
          selectedAllergies 
        })
        
        Alert.alert(
          'Welcome to WellNoosh!', 
          `${selectedAllergies.length > 0 ? 'Your allergies have been saved!' : 'Account created successfully!'} You're all set!`,
          [
            {
              text: 'Get Started',
              onPress: () => {
                // The auth state change will automatically navigate to MainTabs
              }
            }
          ]
        )
      } catch (signUpError: any) {
        // If user already exists, try to sign them in instead
        if (signUpError.message?.includes('already registered') || signUpError.code === 'user_already_exists') {
          console.log('User already exists, attempting to sign in...');
          
          try {
            await signIn(userCredentials.email, userCredentials.password)
            setHasCompletedAuth(true)
            console.log('User signed in successfully, onboarding completed:', { 
              email: userCredentials.email,
              selectedAllergies 
            })
            
            Alert.alert(
              'Welcome back!', 
              `${selectedAllergies.length > 0 ? 'Your allergies have been updated!' : 'Profile updated!'} You're all set!`,
              [
                {
                  text: 'Continue',
                  onPress: () => {
                    console.log('User pressed Continue, checking if navigation will happen...')
                    // Check if the session exists after a delay
                    setTimeout(() => {
                      if (session) {
                        console.log('✅ Session exists, App.tsx should navigate to MainTabs')
                      } else {
                        console.log('❌ No session found, navigation will not occur')
                      }
                    }, 1000)
                  }
                }
              ]
            )
          } catch (signInError: any) {
            console.error('Sign in failed after existing user detected:', signInError);
            Alert.alert(
              'Sign In Required', 
              'This account already exists. Please check your password and try again, or use the Sign In screen.',
              [
                {
                  text: 'Go to Sign In',
                  onPress: () => navigation.navigate('MedicalConditions')
                },
                {
                  text: 'Try Again',
                  style: 'cancel'
                }
              ]
            )
          }
        } else {
          // Different error, rethrow
          throw signUpError;
        }
      }
    } catch (error: any) {
      Alert.alert('Error', `Failed to complete setup: ${error.message}. Please try again.`)
      console.error('Onboarding completion error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleContinue = async () => {
    console.log('Selected allergies:', selectedAllergies)
    
    try {
      // Save allergies data to UserDataContext
      await updateUserData({
        allergies: selectedAllergies
      })
      console.log('📚 AllergiesScreen: Saved allergies data:', selectedAllergies)
    } catch (error) {
      console.error('📚 AllergiesScreen: Error saving allergies:', error)
    }
    
    navigation.navigate('MedicalConditions')
  }

  const handleSkip = async () => {
    try {
      // Save empty allergies data to UserDataContext
      await updateUserData({
        allergies: []
      })
      console.log('📚 AllergiesScreen: Saved empty allergies data (skipped)')
    } catch (error) {
      console.error('📚 AllergiesScreen: Error saving allergies:', error)
    }
    
    completeOnboarding()
  }

  const goBack = () => {
    navigation.goBack()
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={goBack}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>←</Text>
        </Pressable>
        
        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '50%' }]} />
          </View>
          <Text style={styles.stepText}>Step 3</Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>Food Allergies</Text>
          <Text style={styles.subtitle}>
            Do You Have Any Food Allergies?
          </Text>
          <Text style={styles.description}>
            Select all that apply or skip if none
          </Text>
        </View>

        {/* Allergy Options Grid */}
        <View style={styles.optionsContainer}>
          {allergyOptions.map((option) => (
            <Pressable
              key={option.id}
              style={[
                styles.optionCard,
                { backgroundColor: option.bgColor },
                selectedAllergies.includes(option.id) && styles.selectedCard
              ]}
              onPress={() => handleAllergyToggle(option.id)}
            >
              <View style={styles.optionContent}>
                <Text style={styles.optionEmoji}>{option.emoji}</Text>
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionName}>{option.name}</Text>
                </View>
                
                {selectedAllergies.includes(option.id) && (
                  <View style={styles.checkmarkContainer}>
                    <Text style={styles.checkmark}>✓</Text>
                  </View>
                )}
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        <Pressable 
          style={[styles.buttonContainer, isLoading && styles.disabledButton]} 
          onPress={handleContinue}
          disabled={isLoading}
        >
          <LinearGradient
            colors={['#10B981', '#3B82F6', '#8B5CF6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientButton}
          >
            <Text style={styles.buttonText}>
              {isLoading 
                ? 'Setting up your account...' 
                : selectedAllergies.length > 0 
                  ? 'Complete Setup' 
                  : 'No Allergies - Complete Setup'
              }
            </Text>
          </LinearGradient>
        </Pressable>
        
        <Pressable 
          style={[styles.skipButtonContainer, isLoading && styles.disabledButton]} 
          onPress={handleSkip}
          disabled={isLoading}
        >
          <View style={styles.skipButton}>
            <Text style={styles.skipButtonText}>
              {isLoading ? 'Please wait...' : 'Skip This Step'}
            </Text>
          </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
    gap: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 18,
    color: '#6B7280',
  },
  progressContainer: {
    flex: 1,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 2,
  },
  stepText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 24,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  optionsContainer: {
    gap: 16,
  },
  optionCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  selectedCard: {
    borderColor: '#3B82F6',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionEmoji: {
    fontSize: 32,
    marginRight: 16,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  checkmarkContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 16,
    gap: 16,
  },
  buttonContainer: {
    width: '100%',
  },
  disabledButton: {
    opacity: 0.6,
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
  skipButtonContainer: {
    width: '100%',
  },
  skipButton: {
    height: 56,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
})