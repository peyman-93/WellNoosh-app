import React, { useState, useEffect } from 'react'
import { View, Text, SafeAreaView, ScrollView, StyleSheet, Pressable, Alert } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/context/supabase-provider'
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/DesignTokens'
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
  
  // Monitor session changes for debugging
  useEffect(() => {
    console.log('V3HomeScreen: Session state changed:', session ? 'AUTHENTICATED' : 'NOT_AUTHENTICATED')
    
    if (!session && isSigningOut) {
      console.log('V3HomeScreen: Session cleared, should navigate to Welcome')
    }
  }, [session, isSigningOut])
  
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
      console.log('V3HomeScreen: Sign out completed, waiting for automatic navigation...')
      
      // Wait for automatic navigation, then fallback to manual if needed
      setTimeout(() => {
        console.log('V3HomeScreen: Automatic navigation timeout - forcing manual navigation...')
        try {
          // Force navigation reset to Welcome screen
          (navigation as any).reset({
            index: 0,
            routes: [{ name: 'Welcome' }],
          })
          console.log('V3HomeScreen: Manual navigation to Welcome completed')
        } catch (navError: any) {
          console.error('V3HomeScreen: Manual navigation failed:', navError)
          // Force reload as last resort
          Alert.alert(
            'Signed Out',
            'You have been signed out successfully. Please restart the app.',
            [{ text: 'OK' }]
          )
        }
      }, 2000)
      
    } catch (error: any) {
      console.error('V3HomeScreen: Sign out failed:', error)
      Alert.alert('Error', 'Failed to sign out. Please try again.')
      setIsSigningOut(false)
    }
  }

  const userName = session?.user?.email?.split('@')[0] || 'there'

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={Colors.gradientBackground}
        style={styles.backgroundGradient}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.greeting}>
                  {getGreeting()}, {userName}! 👋
                </Text>
                <Text style={styles.subtitle}>
                  Ready to nourish your body and mind?
                </Text>
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
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.screenPadding,
    gap: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  greeting: {
    fontSize: Typography.sizes.section,
    fontWeight: Typography.weights.bold,
    color: Colors.foreground,
    fontFamily: Typography.fontBrand,
  },
  subtitle: {
    fontSize: Typography.sizes.caption,
    color: Colors.mutedForeground,
    marginTop: Spacing.xs,
    fontFamily: Typography.fontBody,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileIcon: {
    fontSize: 20,
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