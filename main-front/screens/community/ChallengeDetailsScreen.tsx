import React, { useState } from 'react'
import { View, Text, ScrollView, StyleSheet, Pressable, Image } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Challenge } from '@/components/features/community/ChallengeCard'

interface ChallengeDetailsScreenProps {
  route: {
    params: {
      challenge: Challenge
    }
  }
  navigation: any
}

interface TeamMember {
  id: string
  name: string
  avatar?: string
  level: number
  progress: number
  streak: number
}

export default function ChallengeDetailsScreen({ route, navigation }: ChallengeDetailsScreenProps) {
  const { challenge } = route.params
  const [isJoined, setIsJoined] = useState(challenge.isJoined || false)
  
  // Mock team members data
  const teamMembers: TeamMember[] = [
    { id: '1', name: 'Sarah M.', level: 8, progress: 85, streak: 5 },
    { id: '2', name: 'Mike R.', level: 6, progress: 72, streak: 3 },
    { id: '3', name: 'Emma C.', level: 12, progress: 90, streak: 7 },
    { id: '4', name: 'Alex R.', level: 9, progress: 65, streak: 4 },
    { id: '5', name: 'Lisa T.', level: 7, progress: 78, streak: 6 },
  ]
  
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'nutrition': return '#10B981'
      case 'cooking': return '#F59E0B'
      case 'wellness': return '#8B5CF6'
      case 'budget': return '#3B82F6'
      case 'family': return '#EC4899'
      default: return '#6B7280'
    }
  }
  
  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return { text: 'Beginner', color: '#10B981' }
      case 'medium': return { text: 'Intermediate', color: '#F59E0B' }
      case 'hard': return { text: 'Advanced', color: '#EF4444' }
      default: return { text: 'All Levels', color: '#6B7280' }
    }
  }
  
  const handleJoinChallenge = () => {
    setIsJoined(!isJoined)
    // TODO: Implement join/leave challenge logic
  }
  
  const handleCheckIn = () => {
    // TODO: Navigate to daily check-in
    console.log('Check in pressed')
  }
  
  const categoryColor = getCategoryColor(challenge.category)
  const difficultyBadge = getDifficultyBadge(challenge.difficulty)
  
  return (
    <LinearGradient
      colors={['#F0FDF4', '#DBEAFE', '#FAF5FF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Challenge Details</Text>
        <View style={styles.placeholder} />
      </View>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Challenge Info Card */}
          <View style={styles.challengeCard}>
            <View style={[styles.categoryBar, { backgroundColor: categoryColor }]} />
            
            <View style={styles.challengeContent}>
              <Text style={styles.challengeTitle}>{challenge.title}</Text>
              
              <View style={styles.badges}>
                <View style={[styles.badge, { backgroundColor: `${difficultyBadge.color}20` }]}>
                  <Text style={[styles.badgeText, { color: difficultyBadge.color }]}>
                    {difficultyBadge.text}
                  </Text>
                </View>
                <View style={styles.durationBadge}>
                  <Text style={styles.durationText}>{challenge.duration} days</Text>
                </View>
                <View style={styles.categoryBadge}>
                  <Text style={[styles.categoryText, { color: categoryColor }]}>
                    {challenge.category}
                  </Text>
                </View>
              </View>
              
              <Text style={styles.challengeDescription}>{challenge.description}</Text>
              
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Text style={styles.statNumber}>{challenge.participants}</Text>
                  <Text style={styles.statLabel}>Participants</Text>
                </View>
                {isJoined && challenge.progress !== undefined && (
                  <View style={styles.stat}>
                    <Text style={styles.statNumber}>{challenge.progress}%</Text>
                    <Text style={styles.statLabel}>Your Progress</Text>
                  </View>
                )}
                {isJoined && challenge.currentStreak !== undefined && (
                  <View style={styles.stat}>
                    <Text style={styles.statNumber}>{challenge.currentStreak}</Text>
                    <Text style={styles.statLabel}>Day Streak</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
          
          {/* Action Button */}
          <View style={styles.actionSection}>
            <Pressable 
              style={[styles.actionButton, isJoined && styles.leaveButton]} 
              onPress={handleJoinChallenge}
            >
              <Text style={[styles.actionButtonText, isJoined && styles.leaveButtonText]}>
                {isJoined ? 'Leave Challenge' : 'Join Challenge'}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 20,
    color: '#1F2937',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    fontFamily: 'System',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  challengeCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 20,
  },
  categoryBar: {
    height: 6,
  },
  challengeContent: {
    padding: 20,
  },
  challengeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
    fontFamily: 'System',
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'System',
  },
  durationBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  durationText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily: 'System',
  },
  categoryBadge: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'System',
    textTransform: 'capitalize',
  },
  challengeDescription: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    marginBottom: 20,
    fontFamily: 'System',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 24,
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    fontFamily: 'System',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'System',
  },
  actionSection: {
    paddingBottom: 20,
  },
  actionButton: {
    backgroundColor: '#10B981',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'System',
  },
  leaveButton: {
    backgroundColor: '#EF4444',
  },
  leaveButtonText: {
    color: 'white',
  },
})