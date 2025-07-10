import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, StyleSheet, Pressable, Alert } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useAuth } from '@/context/supabase-provider'
import { useNavigation } from '@react-navigation/native'

// Components
import { WaterTracker } from '@/components/v3/WaterTracker'
import { BreathingExercises } from '@/components/v3/BreathingExercises'
import { QuickStats } from '@/components/v3/QuickStats'
import { DailyCheckIn } from '@/components/v3/DailyCheckIn'
import { MealHub } from '@/components/v3/MealHub'
import { RecentActivity } from '@/components/v3/RecentActivity'
import { QuickActions } from '@/components/v3/QuickActions'

export default function V3DashboardScreen() {
  const { session, signOut } = useAuth()
  const navigation = useNavigation()
  const [isSigningOut, setIsSigningOut] = useState(false)
  
  // Water tracking state
  const [waterIntake, setWaterIntake] = useState<boolean[]>(Array(10).fill(false))
  
  // Breathing exercises state
  const [breathingExercises, setBreathingExercises] = useState<boolean[]>(Array(6).fill(false))
  
  // Daily check-in state
  const [showDailyCheckIn, setShowDailyCheckIn] = useState(false)
  const [showMealHub, setShowMealHub] = useState(false)
  
  // Initialize tracking on component mount
  useEffect(() => {
    const today = new Date().toDateString()
    // TODO: Load from AsyncStorage or Supabase
  }, [])
  
  // Monitor session changes
  useEffect(() => {
    if (!session && !isSigningOut) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'SignInScreen' as never }],
      })
    }
  }, [session, navigation, isSigningOut])
  
  const handleSignOut = async () => {
    if (isSigningOut) return
    
    setIsSigningOut(true)
    try {
      await signOut()
    } catch (error: any) {
      Alert.alert('Error', 'Failed to sign out. Please try again.')
      setIsSigningOut(false)
    }
  }
  
  const handleGlassClick = (index: number) => {
    const newIntake = [...waterIntake]
    newIntake[index] = !newIntake[index]
    setWaterIntake(newIntake)
    // TODO: Save to storage
  }
  
  const handleBreathingCircleClick = (index: number) => {
    const newExercises = [...breathingExercises]
    newExercises[index] = !newExercises[index]
    setBreathingExercises(newExercises)
    // TODO: Save to storage
  }
  
  const startBreathingGuide = () => {
    // TODO: Navigate to breathing guide screen
    Alert.alert('Breathing Exercise', '30-second guided breathing coming soon!')
  }
  
  const userName = session?.user?.email?.split('@')[0] || 'there'
  const completedGlasses = waterIntake.filter(Boolean).length
  const completedBreathingExercises = breathingExercises.filter(Boolean).length
  
  // Mock data - replace with real data
  const favoriteRecipes = [
    { id: '1', name: 'Mediterranean Quinoa Bowl', rating: 4.8 },
    { id: '2', name: 'Honey Garlic Salmon', rating: 4.9 },
    { id: '3', name: 'Thai Basil Chicken', rating: 4.6 },
    { id: '4', name: 'Avocado Toast Deluxe', rating: 4.4 }
  ]
  
  const cookedRecipes = []
  
  return (
    <LinearGradient
      colors={['#F0FDF4', '#DBEAFE', '#FAF5FF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Header with WellNoosh branding */}
          <View style={styles.header}>
            <View style={styles.brandContainer}>
              <View style={styles.logoCircle}>
                <Text style={styles.logoEmoji}>🥗</Text>
              </View>
              <Text style={styles.brandTitle}>WellNoosh</Text>
              <Text style={styles.welcomeText}>Welcome back, {userName}!</Text>
            </View>
            
            {/* Profile button */}
            <Pressable 
              style={styles.profileButton}
              onPress={() => navigation.navigate('Profile' as never)}
            >
              <Text style={styles.profileIcon}>👤</Text>
            </Pressable>
          </View>
          
          {/* Quick Stats */}
          <QuickStats 
            favoriteCount={favoriteRecipes.length}
            cookedCount={cookedRecipes.length}
          />
          
          {/* Water Tracker */}
          <WaterTracker
            waterIntake={waterIntake}
            onGlassClick={handleGlassClick}
            completedGlasses={completedGlasses}
          />
          
          {/* Breathing Exercises */}
          <BreathingExercises
            breathingExercises={breathingExercises}
            onCircleClick={handleBreathingCircleClick}
            onStartGuide={startBreathingGuide}
            completedExercises={completedBreathingExercises}
          />
          
          {/* Quick Actions Grid */}
          <QuickActions />
          
          {/* Daily Check-In */}
          <DailyCheckIn 
            showExpanded={showDailyCheckIn}
            onToggle={() => setShowDailyCheckIn(!showDailyCheckIn)}
          />
          
          {/* Meal Hub */}
          <MealHub
            showExpanded={showMealHub}
            onToggle={() => setShowMealHub(!showMealHub)}
          />
          
          {/* Recent Activity */}
          <RecentActivity cookedRecipes={cookedRecipes} />
          
          {/* Sign Out Button */}
          <View style={styles.signOutSection}>
            <Pressable 
              style={styles.signOutButton}
              onPress={handleSignOut}
              disabled={isSigningOut}
            >
              <Text style={styles.signOutText}>
                {isSigningOut ? 'Signing Out...' : 'Sign Out'}
              </Text>
            </Pressable>
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingTop: 48,
    gap: 24,
  },
  header: {
    marginBottom: 16,
    position: 'relative',
  },
  brandContainer: {
    alignItems: 'center',
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
    marginBottom: 12,
  },
  logoEmoji: {
    fontSize: 32,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
    fontFamily: 'System',
  },
  welcomeText: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'System',
  },
  profileButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  profileIcon: {
    fontSize: 18,
  },
  signOutSection: {
    marginTop: 32,
    paddingBottom: 32,
  },
  signOutButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily: 'System',
  },
})