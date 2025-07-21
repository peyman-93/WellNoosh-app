import React from 'react'
import { View, Text, StyleSheet, Pressable, Image } from 'react-native'

export interface Challenge {
  id: string
  title: string
  description: string
  category: 'nutrition' | 'cooking' | 'wellness' | 'budget' | 'family'
  duration: 7 | 12 | 21 | 30
  difficulty: 'easy' | 'medium' | 'hard'
  participants: number
  image?: string
  currentStreak?: number
  isJoined?: boolean
  progress?: number
  rating?: number // Overall challenge rating
}

interface ChallengeCardProps {
  challenge: Challenge
  onPress: () => void
  onJoin?: () => void
}

export function ChallengeCard({ challenge, onPress, onJoin }: ChallengeCardProps) {
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

  const categoryColor = getCategoryColor(challenge.category)
  const difficultyBadge = getDifficultyBadge(challenge.difficulty)

  const renderStars = (rating: number) => {
    const stars = []
    for (let i = 1; i <= 5; i++) {
      const filled = i <= rating
      stars.push(
        <Text key={i} style={[styles.star, filled && styles.starFilled]}>
          {filled ? '★' : '☆'}
        </Text>
      )
    }
    return stars
  }

  return (
    <Pressable style={styles.container} onPress={onPress}>
      <View style={[styles.categoryBar, { backgroundColor: categoryColor }]} />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleSection}>
            <Text style={styles.title}>{challenge.title}</Text>
            <View style={styles.badges}>
              <View style={[styles.badge, { backgroundColor: `${difficultyBadge.color}20` }]}>
                <Text style={[styles.badgeText, { color: difficultyBadge.color }]}>
                  {difficultyBadge.text}
                </Text>
              </View>
              <View style={styles.durationBadge}>
                <Text style={styles.durationText}>{challenge.duration} days</Text>
              </View>
            </View>
          </View>
          
          {challenge.image && (
            <Image source={{ uri: challenge.image }} style={styles.image} />
          )}
        </View>
        
        <Text style={styles.description} numberOfLines={2}>
          {challenge.description}
        </Text>
        
        {challenge.rating && (
          <View style={styles.ratingContainer}>
            <View style={styles.starsContainer}>
              {renderStars(Math.round(challenge.rating))}
            </View>
            <Text style={styles.ratingText}>
              {challenge.rating.toFixed(1)} stars
            </Text>
          </View>
        )}
        
        <View style={styles.footer}>
          <View style={styles.stats}>
            <View style={styles.participantsContainer}>
              <Text style={styles.participantsIcon}>👥</Text>
              <Text style={styles.participantsText}>{challenge.participants} joined</Text>
            </View>
            
            {challenge.isJoined && challenge.progress !== undefined && (
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View 
                    style={[styles.progressFill, { width: `${challenge.progress}%` }]} 
                  />
                </View>
                <Text style={styles.progressText}>{challenge.progress}%</Text>
              </View>
            )}
          </View>
          
          {!challenge.isJoined && onJoin && (
            <Pressable style={styles.joinButton} onPress={onJoin}>
              <Text style={styles.joinButtonText}>Join Challenge</Text>
            </Pressable>
          )}
          
          {challenge.isJoined && challenge.currentStreak !== undefined && (
            <View style={styles.streakContainer}>
              <Text style={styles.streakIcon}>🔥</Text>
              <Text style={styles.streakText}>{challenge.currentStreak} day streak</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 16,
  },
  categoryBar: {
    height: 4,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleSection: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    fontFamily: 'System',
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'System',
  },
  durationBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  durationText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    fontFamily: 'System',
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
    fontFamily: 'System',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stats: {
    flex: 1,
  },
  participantsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  participantsIcon: {
    fontSize: 14,
  },
  participantsText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'System',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    fontFamily: 'System',
  },
  joinButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  joinButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  streakIcon: {
    fontSize: 16,
  },
  streakText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#F59E0B',
    fontFamily: 'System',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 1,
  },
  star: {
    fontSize: 14,
    color: '#D1D5DB',
  },
  starFilled: {
    color: '#F59E0B',
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    fontFamily: 'System',
  },
})