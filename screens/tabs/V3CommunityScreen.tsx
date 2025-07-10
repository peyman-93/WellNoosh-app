import React, { useState } from 'react'
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { ChallengeCard, Challenge } from '@/components/v3/community/ChallengeCard'
import { CommunityPost, Post } from '@/components/v3/community/CommunityPost'
import { LeaderboardCard, LeaderboardUser } from '@/components/v3/community/LeaderboardCard'

type TabType = 'challenges' | 'feed' | 'leaderboard' | 'connections'

export default function V3CommunityScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('challenges')
  
  // Mock data - replace with real data
  const challenges: Challenge[] = [
    {
      id: '1',
      title: '7-Day Hydration Hero',
      description: 'Drink 8 glasses of water daily for a week. Track your progress and feel the energy boost!',
      category: 'wellness',
      duration: 7,
      difficulty: 'easy',
      participants: 234,
      progress: 42,
      isJoined: true,
      currentStreak: 3,
    },
    {
      id: '2',
      title: 'Zero Waste Kitchen',
      description: 'Use up all ingredients before they expire. Share your creative leftover recipes!',
      category: 'budget',
      duration: 21,
      difficulty: 'medium',
      participants: 189,
    },
    {
      id: '3',
      title: 'Family Cooking Together',
      description: 'Cook one meal together as a family every day. Build bonds through food!',
      category: 'family',
      duration: 12,
      difficulty: 'easy',
      participants: 156,
    },
  ]
  
  const posts: Post[] = [
    {
      id: '1',
      userId: 'user1',
      userName: 'Sarah M.',
      userLevel: 8,
      postType: 'victory',
      content: 'Just finished my first week of the Hydration Hero challenge! Feeling so much more energetic throughout the day. Who else is loving this challenge? 💪',
      likes: 24,
      comments: 8,
      shares: 3,
      hasLiked: false,
      timestamp: '2024-01-15T10:30:00Z',
    },
    {
      id: '2',
      userId: 'user2',
      userName: 'Mike R.',
      userLevel: 5,
      postType: 'struggle',
      content: 'Day 3 of Zero Waste Kitchen and I\'m struggling to use up these vegetables before they go bad. Any quick recipe ideas?',
      likes: 12,
      comments: 15,
      shares: 2,
      needsSupport: true,
      timestamp: '2024-01-15T09:15:00Z',
    },
  ]
  
  const leaderboardUsers: LeaderboardUser[] = [
    { id: '1', rank: 1, name: 'Emma Chen', points: 2450, level: 12, change: 'up' },
    { id: '2', rank: 2, name: 'Alex Rodriguez', points: 2340, level: 11, change: 'same' },
    { id: '3', rank: 3, name: 'Sarah Mitchell', points: 2190, level: 10, change: 'up' },
    { id: '4', rank: 4, name: 'David Kim', points: 2050, level: 9, change: 'down' },
    { id: '5', rank: 5, name: 'Lisa Thompson', points: 1980, level: 9, change: 'up' },
  ]
  
  const handleJoinChallenge = (challengeId: string) => {
    console.log('Joining challenge:', challengeId)
    // TODO: Implement join challenge logic
  }
  
  const handleChallengePress = (challenge: Challenge) => {
    console.log('Challenge pressed:', challenge.title)
    // TODO: Navigate to challenge details
  }
  
  const handlePostLike = (postId: string) => {
    console.log('Liking post:', postId)
    // TODO: Implement like logic
  }
  
  const handlePostComment = (postId: string) => {
    console.log('Commenting on post:', postId)
    // TODO: Navigate to post comments
  }
  
  const handlePostShare = (postId: string) => {
    console.log('Sharing post:', postId)
    // TODO: Implement share logic
  }
  
  const handleUserPress = (userId: string) => {
    console.log('User pressed:', userId)
    // TODO: Navigate to user profile
  }
  
  const renderTabContent = () => {
    switch (activeTab) {
      case 'challenges':
        return (
          <View style={styles.tabContent}>
            <View style={styles.challengeFilters}>
              <Text style={styles.sectionTitle}>Popular Challenges</Text>
              <Text style={styles.sectionSubtitle}>Join a challenge to start your journey</Text>
            </View>
            {challenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                onPress={() => handleChallengePress(challenge)}
                onJoin={() => handleJoinChallenge(challenge.id)}
              />
            ))}
          </View>
        )
      
      case 'feed':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Community Feed</Text>
            <Text style={styles.sectionSubtitle}>See what the community is up to</Text>
            {posts.map((post) => (
              <CommunityPost
                key={post.id}
                post={post}
                onLike={() => handlePostLike(post.id)}
                onComment={() => handlePostComment(post.id)}
                onShare={() => handlePostShare(post.id)}
                onUserPress={() => handleUserPress(post.userId)}
              />
            ))}
          </View>
        )
      
      case 'leaderboard':
        return (
          <View style={styles.tabContent}>
            <LeaderboardCard users={leaderboardUsers} currentUserId="user3" />
          </View>
        )
      
      case 'connections':
        return (
          <View style={styles.tabContent}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Find Connections</Text>
              <Text style={styles.cardText}>
                Connect with like-minded community members and support each other on your wellness journey.
              </Text>
              <Text style={styles.comingSoon}>Coming Soon!</Text>
            </View>
          </View>
        )
      
      default:
        return null
    }
  }
  
  return (
    <LinearGradient
      colors={['#F0FDF4', '#DBEAFE', '#FAF5FF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Community</Text>
        <Text style={styles.subtitle}>Join challenges and connect with others</Text>
        
        {/* Tab Navigation */}
        <View style={styles.tabBar}>
          {[
            { key: 'challenges', label: 'Challenges', icon: '🏆' },
            { key: 'feed', label: 'Feed', icon: '📝' },
            { key: 'leaderboard', label: 'Leaders', icon: '🏅' },
            { key: 'connections', label: 'Connect', icon: '👥' },
          ].map((tab) => (
            <Pressable
              key={tab.key}
              style={[
                styles.tab,
                activeTab === tab.key && styles.activeTab,
              ]}
              onPress={() => setActiveTab(tab.key as TabType)}
            >
              <Text style={styles.tabIcon}>{tab.icon}</Text>
              <Text style={[
                styles.tabLabel,
                activeTab === tab.key && styles.activeTabLabel,
              ]}>
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderTabContent()}
      </ScrollView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: 48,
    paddingBottom: 0,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    fontFamily: 'System',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
    fontFamily: 'System',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: '#10B981',
  },
  tabIcon: {
    fontSize: 16,
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    fontFamily: 'System',
  },
  activeTabLabel: {
    color: 'white',
  },
  scrollView: {
    flex: 1,
  },
  tabContent: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
    fontFamily: 'System',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
    fontFamily: 'System',
  },
  challengeFilters: {
    marginBottom: 8,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    fontFamily: 'System',
  },
  cardText: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    fontFamily: 'System',
    marginBottom: 16,
  },
  comingSoon: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
    textAlign: 'center',
    fontFamily: 'System',
  },
})