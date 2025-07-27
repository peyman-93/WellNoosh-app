import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, StyleSheet, Pressable, Alert } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Button } from '../../src/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../src/components/ui/card'
import { useAuth } from '../../src/context/supabase-provider'
import { Colors, Typography, Spacing, BorderRadius } from '../../src/constants/DesignTokens'
import { useNavigation } from '@react-navigation/native'

interface WaterTrackerProps {
  waterCount: number
  onAddWater: () => void
}

function WaterTracker({ waterCount, onAddWater }: WaterTrackerProps) {
  const maxWater = 10
  const fillPercentage = (waterCount / maxWater) * 100
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>💧 Daily Water Intake</CardTitle>
      </CardHeader>
      <CardContent>
        <View style={styles.waterTracker}>
          <Text style={styles.waterProgress}>{waterCount}/{maxWater} glasses</Text>
          
          <View style={styles.waterGlassContainer}>
            {/* Water Glass */}
            <View style={styles.waterGlassOuter}>
              <View style={styles.waterGlassInner}>
                {/* Water fill */}
                <View 
                  style={[
                    styles.waterFill, 
                    { height: `${fillPercentage}%` }
                  ]} 
                />
                {/* Glass content indicator */}
                <Text style={styles.waterGlassIcon}>🥛</Text>
              </View>
            </View>
            
            {/* Plus Button */}
            <Pressable 
              style={styles.addWaterButton}
              onPress={onAddWater}
              disabled={waterCount >= maxWater}
            >
              <Text style={styles.addWaterButtonText}>+</Text>
            </Pressable>
          </View>
          
          {waterCount >= maxWater && (
            <Text style={styles.waterCompleteText}>🎉 Daily goal achieved!</Text>
          )}
        </View>
      </CardContent>
    </Card>
  )
}

interface QuickStatsProps {
  userData: any
}

function QuickStats({ userData }: QuickStatsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>📊 Today's Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>1,847</Text>
            <Text style={styles.statLabel}>Calories</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>3</Text>
            <Text style={styles.statLabel}>Meals Logged</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>7</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>89%</Text>
            <Text style={styles.statLabel}>Health Score</Text>
          </View>
        </View>
      </CardContent>
    </Card>
  )
}

interface QuickActionsProps {
  onNavigateToTab: (tab: string) => void
}

function QuickActions({ onNavigateToTab }: QuickActionsProps) {
  return (
    <View style={styles.actionsGrid}>
      <Pressable 
        style={styles.actionButton}
        onPress={() => onNavigateToTab('Planner')}
      >
        <Text style={styles.actionIcon}>📅</Text>
        <Text style={styles.actionText}>Plan Meals</Text>
      </Pressable>
      
      <Pressable 
        style={styles.actionButton}
        onPress={() => onNavigateToTab('Pantry')}
      >
        <Text style={styles.actionIcon}>🛒</Text>
        <Text style={styles.actionText}>Add to Pantry</Text>
      </Pressable>
      
      <Pressable 
        style={styles.actionButton}
        onPress={() => onNavigateToTab('Inspiration')}
      >
        <Text style={styles.actionIcon}>🍳</Text>
        <Text style={styles.actionText}>Find Recipes</Text>
      </Pressable>
      
      <Pressable 
        style={styles.actionButton}
        onPress={() => onNavigateToTab('Profile')}
      >
        <Text style={styles.actionIcon}>⚙️</Text>
        <Text style={styles.actionText}>Settings</Text>
      </Pressable>
    </View>
  )
}

export default function V3HomeScreen() {
  const { session, signOut } = useAuth()
  const navigation = useNavigation()
  const [waterCount, setWaterCount] = useState<number>(0)
  const [isSigningOut, setIsSigningOut] = useState(false)
  
  // Monitor session changes and navigate manually if needed
  useEffect(() => {
    console.log('V3HomeScreen: Session state changed:', session ? 'AUTHENTICATED' : 'NOT_AUTHENTICATED')
    console.log('V3HomeScreen: isSigningOut state:', isSigningOut)
    
    if (!session) {
      console.log('V3HomeScreen: No session detected - starting navigation to Welcome')
      setTimeout(() => {
        console.log('V3HomeScreen: Force navigating to Welcome...')
        try {
          // Navigate up the navigation hierarchy to find root
          let currentNav = navigation
          let rootNav = navigation
          let levels = 0
          
          // Walk up the navigation tree to find the root
          while (currentNav.getParent()) {
            currentNav = currentNav.getParent()
            rootNav = currentNav
            levels++
            console.log(`V3HomeScreen: Found parent navigator level ${levels}`)
          }
          
          console.log(`V3HomeScreen: Found root navigator after ${levels} levels`)
          
          // Try to get the state to see what screens are available
          const state = rootNav.getState()
          console.log('V3HomeScreen: Root navigator state:', state)
          console.log('V3HomeScreen: Available routes:', state?.routeNames || 'No route names found')
          
          // Try both possible screen names
          const screenName = state?.routeNames?.includes('SignIn') ? 'SignIn' : 'SignInScreen'
          console.log(`V3HomeScreen: Using root-most navigator to reset to ${screenName}`)
          rootNav.reset({
            index: 0,
            routes: [{ name: screenName }],
          })
          
          setIsSigningOut(false) // Reset loading state
          console.log('V3HomeScreen: Navigation after sign out completed')
        } catch (error) {
          console.error('V3HomeScreen: Navigation failed:', error)
          setIsSigningOut(false)
          // Show alert with manual instruction  
          Alert.alert(
            'Signed Out Successfully',
            'You have been signed out. Please use the app navigation to sign in again.',
            [{ text: 'OK' }]
          )
        }
      }, 1000)
    }
  }, [session, navigation])
  
  // Get current time for greeting
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const addWater = () => {
    setWaterCount(prev => Math.min(prev + 1, 10))
  }

  const handleSignOut = async () => {
    if (isSigningOut) {
      console.log('V3HomeScreen: Sign out already in progress, ignoring...')
      return
    }
    
    setIsSigningOut(true)
    try {
      console.log('V3HomeScreen: Starting sign out process...')
      await signOut()
      console.log('V3HomeScreen: Sign out completed - App.tsx should handle navigation automatically')
      // Navigation is now handled by App.tsx useEffect, no manual fallback needed
      
    } catch (error: any) {
      console.error('V3HomeScreen: Sign out failed:', error)
      Alert.alert('Error', 'Failed to sign out. Please try again.')
      setIsSigningOut(false)
    }
  }

  const userName = session?.user?.email?.split('@')[0] || 'there'

  return (
    <LinearGradient
      colors={['#F0FDF4', '#DBEAFE', '#FAF5FF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.backgroundGradient}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
            {/* Header with v3 design */}
            <View style={styles.header}>
              <View style={styles.brandHeader}>
                <View style={styles.logoContainer}>
                  <View style={styles.logoCircle}>
                    <Text style={styles.logoEmoji}>🥗</Text>
                  </View>
                </View>
                <Text style={styles.brandTitle}>WellNoosh</Text>
                <Text style={styles.welcomeText}>Welcome back, {userName}!</Text>
              </View>
              <Pressable style={styles.profileButton}>
                <Text style={styles.profileIcon}>👤</Text>
              </Pressable>
            </View>

            {/* Quick Stats */}
            <QuickStats userData={session?.user} />

            {/* Quick Actions */}
            <QuickActions onNavigateToTab={() => {}} />

            {/* Water Tracker */}
            <WaterTracker 
              waterCount={waterCount} 
              onAddWater={addWater} 
            />

            {/* Today's Meals */}
            <Card>
              <CardHeader>
                <CardTitle>🍽️ Today's Meals</CardTitle>
              </CardHeader>
              <CardContent>
                <View style={styles.mealsList}>
                  <View style={styles.mealItem}>
                    <Text style={styles.mealTime}>Breakfast</Text>
                    <Text style={styles.mealName}>Avocado Toast with Eggs</Text>
                    <Text style={styles.mealCalories}>387 cal</Text>
                  </View>
                  <View style={styles.mealItem}>
                    <Text style={styles.mealTime}>Lunch</Text>
                    <Text style={styles.mealName}>Mediterranean Quinoa Bowl</Text>
                    <Text style={styles.mealCalories}>542 cal</Text>
                  </View>
                  <View style={styles.mealPlaceholder}>
                    <Text style={styles.mealPlaceholderText}>+ Add dinner</Text>
                  </View>
                </View>
              </CardContent>
            </Card>

            {/* Sign Out */}
            <View style={styles.signOutSection}>
              <Button 
                variant="outline" 
                onPress={handleSignOut} 
                disabled={isSigningOut}
                style={styles.signOutButton}
              >
                {isSigningOut ? 'Signing Out...' : 'Sign Out'}
              </Button>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
  )
}

const styles = StyleSheet.create({
  backgroundGradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
    gap: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingTop: 16,
  },
  brandHeader: {
    alignItems: 'center',
    flex: 1,
  },
  logoContainer: {
    marginBottom: 8,
  },
  logoCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  logoEmoji: {
    fontSize: 24,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
    fontFamily: 'System',
  },
  welcomeText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'System',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    position: 'absolute',
    top: 16,
    right: 0,
  },
  profileIcon: {
    fontSize: 18,
  },
  
  // Water Tracker
  waterTracker: {
    gap: Spacing.md,
    alignItems: 'center',
  },
  waterProgress: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.foreground,
    textAlign: 'center',
  },
  waterGlassContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  waterGlassOuter: {
    width: 80,
    height: 100,
    borderRadius: BorderRadius.md,
    borderWidth: 3,
    borderColor: Colors.brand.blue300,
    backgroundColor: Colors.background,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  waterGlassInner: {
    flex: 1,
    width: '100%',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  waterFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.brand.blue200,
    borderBottomLeftRadius: BorderRadius.sm,
    borderBottomRightRadius: BorderRadius.sm,
  },
  waterGlassIcon: {
    fontSize: 24,
    position: 'absolute',
  },
  addWaterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addWaterButtonText: {
    fontSize: 24,
    color: Colors.primaryForeground,
    fontWeight: Typography.weights.bold,
  },
  waterCompleteText: {
    fontSize: Typography.sizes.caption,
    color: Colors.success,
    fontWeight: Typography.weights.semibold,
    textAlign: 'center',
  },
  
  // Quick Stats
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.brand.gray50,
    borderRadius: BorderRadius.sm,
  },
  statNumber: {
    fontSize: Typography.sizes.subsection,
    fontWeight: Typography.weights.bold,
    color: Colors.accent,
  },
  statLabel: {
    fontSize: Typography.sizes.small,
    color: Colors.mutedForeground,
    marginTop: Spacing.xs,
  },
  
  // Quick Actions
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: Spacing.sm,
  },
  actionText: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.medium,
    color: Colors.foreground,
    textAlign: 'center',
  },
  
  // Meals
  mealsList: {
    gap: Spacing.md,
  },
  mealItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.brand.emerald50,
    borderRadius: BorderRadius.sm,
  },
  mealTime: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.semibold,
    color: Colors.success,
    width: 80,
  },
  mealName: {
    flex: 1,
    fontSize: Typography.sizes.caption,
    color: Colors.foreground,
    marginLeft: Spacing.sm,
  },
  mealCalories: {
    fontSize: Typography.sizes.small,
    color: Colors.mutedForeground,
  },
  mealPlaceholder: {
    padding: Spacing.lg,
    backgroundColor: Colors.muted,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  mealPlaceholderText: {
    fontSize: Typography.sizes.caption,
    color: Colors.mutedForeground,
    fontStyle: 'italic',
  },
  
  signOutSection: {
    paddingTop: Spacing.lg,
  },
  signOutButton: {
    width: '100%',
  },
})