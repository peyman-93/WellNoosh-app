import React, { useState } from 'react'
import { View, Text, SafeAreaView, ScrollView, StyleSheet, Pressable } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Card, CardContent, CardHeader, CardTitle } from '../../src/components/ui/card'
import { Button } from '../../src/components/ui/button'
import { useAuth } from '../../src/context/supabase-provider'
import { Colors, Typography, Spacing, BorderRadius } from '../../src/constants/DesignTokens'

interface Achievement {
  id: string
  title: string
  description: string
  emoji: string
  completed: boolean
  progress?: number
  maxProgress?: number
}

interface HealthMetric {
  id: string
  label: string
  value: number
  unit: string
  emoji: string
  trend: 'up' | 'down' | 'stable'
  color: string
}

interface ProfileHeaderProps {
  user: any
  healthScore: number
}

function ProfileHeader({ user, healthScore }: ProfileHeaderProps) {
  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return Colors.success
    if (score >= 60) return Colors.warning
    return Colors.destructive
  }

  return (
    <Card style={styles.profileCard}>
      <LinearGradient
        colors={['#10B981', '#3B82F6']}
        style={styles.profileGradient}
      >
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.email?.charAt(0).toUpperCase() || '👤'}
              </Text>
            </View>
            <View style={styles.healthScoreBadge}>
              <Text style={styles.healthScoreText}>{healthScore}</Text>
            </View>
          </View>
          
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {user?.email?.split('@')[0] || 'Guest User'}
            </Text>
            <Text style={styles.userEmail}>{user?.email || 'guest@wellnoosh.com'}</Text>
            <View style={styles.healthScoreContainer}>
              <Text style={styles.healthScoreLabel}>Health Score</Text>
              <View style={styles.healthScoreBar}>
                <View 
                  style={[
                    styles.healthScoreFill, 
                    { 
                      width: `${healthScore}%`,
                      backgroundColor: getHealthScoreColor(healthScore)
                    }
                  ]} 
                />
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>
    </Card>
  )
}

interface QuickStatsProps {
  stats: { streak: number; meals: number; recipes: number; savings: number }
}

function QuickStats({ stats }: QuickStatsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>📊 Your Journey</CardTitle>
      </CardHeader>
      <CardContent>
        <View style={styles.quickStatsGrid}>
          <View style={styles.quickStat}>
            <Text style={styles.quickStatNumber}>{stats.streak}</Text>
            <Text style={styles.quickStatLabel}>Day Streak</Text>
            <Text style={styles.quickStatEmoji}>🔥</Text>
          </View>
          <View style={styles.quickStat}>
            <Text style={styles.quickStatNumber}>{stats.meals}</Text>
            <Text style={styles.quickStatLabel}>Meals Logged</Text>
            <Text style={styles.quickStatEmoji}>🍽️</Text>
          </View>
          <View style={styles.quickStat}>
            <Text style={styles.quickStatNumber}>{stats.recipes}</Text>
            <Text style={styles.quickStatLabel}>Recipes Saved</Text>
            <Text style={styles.quickStatEmoji}>❤️</Text>
          </View>
          <View style={styles.quickStat}>
            <Text style={styles.quickStatNumber}>€{stats.savings}</Text>
            <Text style={styles.quickStatLabel}>Money Saved</Text>
            <Text style={styles.quickStatEmoji}>💰</Text>
          </View>
        </View>
      </CardContent>
    </Card>
  )
}

interface AchievementsProps {
  achievements: Achievement[]
}

function Achievements({ achievements }: AchievementsProps) {
  const completedCount = achievements.filter(a => a.completed).length

  return (
    <Card>
      <CardHeader>
        <CardTitle>🏆 Achievements ({completedCount}/{achievements.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <View style={styles.achievementsList}>
          {achievements.slice(0, 3).map(achievement => (
            <View key={achievement.id} style={styles.achievementItem}>
              <View style={styles.achievementInfo}>
                <Text style={styles.achievementEmoji}>{achievement.emoji}</Text>
                <View style={styles.achievementDetails}>
                  <Text style={[
                    styles.achievementTitle,
                    !achievement.completed && styles.achievementIncomplete
                  ]}>
                    {achievement.title}
                  </Text>
                  <Text style={styles.achievementDescription}>
                    {achievement.description}
                  </Text>
                  {achievement.progress !== undefined && (
                    <View style={styles.achievementProgress}>
                      <View style={styles.achievementProgressBar}>
                        <View 
                          style={[
                            styles.achievementProgressFill,
                            { width: `${(achievement.progress / (achievement.maxProgress || 1)) * 100}%` }
                          ]} 
                        />
                      </View>
                      <Text style={styles.achievementProgressText}>
                        {achievement.progress}/{achievement.maxProgress}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              {achievement.completed && (
                <Text style={styles.achievementCheck}>✅</Text>
              )}
            </View>
          ))}
        </View>
        <Button variant="outline" size="sm" style={styles.viewAllButton}>
          View All Achievements
        </Button>
      </CardContent>
    </Card>
  )
}

interface HealthMetricsProps {
  metrics: HealthMetric[]
}

function HealthMetrics({ metrics }: HealthMetricsProps) {
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '↗️'
      case 'down': return '↘️'
      default: return '➡️'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>📈 Health Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        <View style={styles.healthMetricsList}>
          {metrics.map(metric => (
            <View key={metric.id} style={styles.healthMetricItem}>
              <Text style={styles.healthMetricEmoji}>{metric.emoji}</Text>
              <View style={styles.healthMetricInfo}>
                <Text style={styles.healthMetricLabel}>{metric.label}</Text>
                <View style={styles.healthMetricValueContainer}>
                  <Text style={[styles.healthMetricValue, { color: metric.color }]}>
                    {metric.value}{metric.unit}
                  </Text>
                  <Text style={styles.healthMetricTrend}>
                    {getTrendIcon(metric.trend)}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </CardContent>
    </Card>
  )
}

interface SettingsSectionProps {
  onNavigate: (section: string) => void
  onSignOut: () => void
}

function SettingsSection({ onNavigate, onSignOut }: SettingsSectionProps) {
  const settingsItems = [
    { id: 'dietary', title: 'Dietary Preferences', emoji: '🥗', description: 'Update your diet and allergies' },
    { id: 'notifications', title: 'Notifications', emoji: '🔔', description: 'Manage your alerts' },
    { id: 'privacy', title: 'Privacy & Security', emoji: '🔒', description: 'Control your data' },
    { id: 'support', title: 'Help & Support', emoji: '❓', description: 'Get assistance' }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>⚙️ Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <View style={styles.settingsList}>
          {settingsItems.map(item => (
            <Pressable 
              key={item.id}
              style={styles.settingsItem}
              onPress={() => onNavigate(item.id)}
            >
              <Text style={styles.settingsEmoji}>{item.emoji}</Text>
              <View style={styles.settingsInfo}>
                <Text style={styles.settingsTitle}>{item.title}</Text>
                <Text style={styles.settingsDescription}>{item.description}</Text>
              </View>
              <Text style={styles.settingsArrow}>›</Text>
            </Pressable>
          ))}
        </View>
        
        <View style={styles.signOutSection}>
          <Button variant="destructive" onPress={onSignOut} style={styles.signOutButton}>
            Sign Out
          </Button>
        </View>
      </CardContent>
    </Card>
  )
}

export default function ProfileTabScreen() {
  const { session, signOut } = useAuth()
  
  const userStats = {
    streak: 7,
    meals: 156,
    recipes: 43,
    savings: 89
  }

  const achievements: Achievement[] = [
    {
      id: '1',
      title: 'First Week',
      description: 'Log meals for 7 consecutive days',
      emoji: '📅',
      completed: true
    },
    {
      id: '2',
      title: 'Recipe Explorer',
      description: 'Save 10 recipes',
      emoji: '🔍',
      completed: false,
      progress: 7,
      maxProgress: 10
    },
    {
      id: '3',
      title: 'Zero Waste Hero',
      description: 'Use 95% of your pantry items',
      emoji: '🌱',
      completed: false,
      progress: 87,
      maxProgress: 95
    }
  ]

  const healthMetrics: HealthMetric[] = [
    {
      id: '1',
      label: 'Weight',
      value: 72.5,
      unit: 'kg',
      emoji: '⚖️',
      trend: 'down',
      color: Colors.success
    },
    {
      id: '2',
      label: 'BMI',
      value: 22.1,
      unit: '',
      emoji: '📏',
      trend: 'stable',
      color: Colors.success
    },
    {
      id: '3',
      label: 'Daily Calories',
      value: 1847,
      unit: 'kcal',
      emoji: '🔥',
      trend: 'up',
      color: Colors.accent
    }
  ]

  const navigateToSetting = (section: string) => {
    console.log('Navigate to setting:', section)
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={Colors.gradientBackground}
        style={styles.backgroundGradient}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {/* Profile Header */}
            <ProfileHeader user={session?.user} healthScore={89} />

            {/* Quick Stats */}
            <QuickStats stats={userStats} />

            {/* Achievements */}
            <Achievements achievements={achievements} />

            {/* Health Metrics */}
            <HealthMetrics metrics={healthMetrics} />

            {/* Settings */}
            <SettingsSection onNavigate={navigateToSetting} onSignOut={signOut} />
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

  // Profile Header
  profileCard: {
    overflow: 'hidden',
  },
  profileGradient: {
    padding: Spacing.cardPadding,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.primaryForeground,
  },
  avatarText: {
    fontSize: Typography.sizes.section,
    color: Colors.primaryForeground,
    fontWeight: Typography.weights.bold,
  },
  healthScoreBadge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: Colors.success,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primaryForeground,
  },
  healthScoreText: {
    fontSize: Typography.sizes.small,
    color: Colors.primaryForeground,
    fontWeight: Typography.weights.bold,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: Typography.sizes.subsection,
    fontWeight: Typography.weights.bold,
    color: Colors.primaryForeground,
    marginBottom: Spacing.xs,
  },
  userEmail: {
    fontSize: Typography.sizes.caption,
    color: Colors.primaryForeground,
    opacity: 0.8,
    marginBottom: Spacing.md,
  },
  healthScoreContainer: {
    gap: Spacing.xs,
  },
  healthScoreLabel: {
    fontSize: Typography.sizes.small,
    color: Colors.primaryForeground,
    fontWeight: Typography.weights.medium,
  },
  healthScoreBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  healthScoreFill: {
    height: '100%',
    borderRadius: 4,
  },

  // Quick Stats
  quickStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  quickStat: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.brand.gray50,
    borderRadius: BorderRadius.md,
  },
  quickStatEmoji: {
    fontSize: 24,
    marginBottom: Spacing.sm,
  },
  quickStatNumber: {
    fontSize: Typography.sizes.subsection,
    fontWeight: Typography.weights.bold,
    color: Colors.accent,
  },
  quickStatLabel: {
    fontSize: Typography.sizes.small,
    color: Colors.mutedForeground,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },

  // Achievements
  achievementsList: {
    gap: Spacing.md,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.brand.violet50,
    borderRadius: BorderRadius.sm,
  },
  achievementInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.md,
  },
  achievementEmoji: {
    fontSize: 24,
  },
  achievementDetails: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.semibold,
    color: Colors.foreground,
  },
  achievementIncomplete: {
    opacity: 0.6,
  },
  achievementDescription: {
    fontSize: Typography.sizes.small,
    color: Colors.mutedForeground,
    marginTop: Spacing.xs,
  },
  achievementProgress: {
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  achievementProgressBar: {
    height: 4,
    backgroundColor: Colors.muted,
    borderRadius: 2,
    overflow: 'hidden',
  },
  achievementProgressFill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 2,
  },
  achievementProgressText: {
    fontSize: Typography.sizes.small,
    color: Colors.mutedForeground,
  },
  achievementCheck: {
    fontSize: 20,
  },
  viewAllButton: {
    marginTop: Spacing.md,
    alignSelf: 'center',
  },

  // Health Metrics
  healthMetricsList: {
    gap: Spacing.md,
  },
  healthMetricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.brand.emerald50,
    borderRadius: BorderRadius.sm,
    gap: Spacing.md,
  },
  healthMetricEmoji: {
    fontSize: 24,
  },
  healthMetricInfo: {
    flex: 1,
  },
  healthMetricLabel: {
    fontSize: Typography.sizes.caption,
    color: Colors.foreground,
    fontWeight: Typography.weights.medium,
  },
  healthMetricValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  healthMetricValue: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
  },
  healthMetricTrend: {
    fontSize: 16,
  },

  // Settings
  settingsList: {
    gap: Spacing.sm,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  settingsEmoji: {
    fontSize: 20,
  },
  settingsInfo: {
    flex: 1,
  },
  settingsTitle: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.medium,
    color: Colors.foreground,
  },
  settingsDescription: {
    fontSize: Typography.sizes.small,
    color: Colors.mutedForeground,
    marginTop: Spacing.xs,
  },
  settingsArrow: {
    fontSize: 20,
    color: Colors.mutedForeground,
  },
  signOutSection: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  signOutButton: {
    width: '100%',
  },
})