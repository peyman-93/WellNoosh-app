import React from 'react'
import { View, Text, StyleSheet, Image } from 'react-native'

export interface LeaderboardUser {
  id: string
  rank: number
  name: string
  avatar?: string
  points: number
  level: number
  change?: 'up' | 'down' | 'same'
}

interface LeaderboardCardProps {
  users: LeaderboardUser[]
  currentUserId?: string
}

export function LeaderboardCard({ users, currentUserId }: LeaderboardCardProps) {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇'
      case 2: return '🥈'
      case 3: return '🥉'
      default: return null
    }
  }

  const getChangeIcon = (change?: string) => {
    switch (change) {
      case 'up': return '↗️'
      case 'down': return '↘️'
      default: return '➡️'
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.icon}>🏆</Text>
        <Text style={styles.title}>Leaderboard</Text>
        <Text style={styles.subtitle}>This Week</Text>
      </View>
      
      <View style={styles.leaderboard}>
        {users.map((user) => {
          const rankIcon = getRankIcon(user.rank)
          const isCurrentUser = user.id === currentUserId
          
          return (
            <View 
              key={user.id} 
              style={[
                styles.userRow,
                isCurrentUser && styles.currentUserRow,
                user.rank === 1 && styles.firstPlace
              ]}
            >
              <View style={styles.rankContainer}>
                {rankIcon ? (
                  <Text style={styles.rankIcon}>{rankIcon}</Text>
                ) : (
                  <Text style={styles.rankNumber}>{user.rank}</Text>
                )}
              </View>
              
              <View style={styles.userInfo}>
                <View style={styles.avatar}>
                  {user.avatar ? (
                    <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
                  ) : (
                    <Text style={styles.avatarEmoji}>👤</Text>
                  )}
                </View>
                
                <View style={styles.nameContainer}>
                  <Text style={[styles.userName, isCurrentUser && styles.currentUserName]}>
                    {user.name} {isCurrentUser && '(You)'}
                  </Text>
                  <View style={styles.userBadge}>
                    <Text style={styles.userLevel}>Lvl {user.level}</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.pointsContainer}>
                <Text style={styles.points}>{user.points.toLocaleString()}</Text>
                <Text style={styles.pointsLabel}>points</Text>
              </View>
              
              {user.change && (
                <Text style={styles.changeIcon}>{getChangeIcon(user.change)}</Text>
              )}
            </View>
          )
        })}
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>Updated hourly</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  icon: {
    fontSize: 32,
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    fontFamily: 'System',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'System',
  },
  leaderboard: {
    gap: 8,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
  },
  currentUserRow: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  firstPlace: {
    backgroundColor: '#FEF3C7',
  },
  rankContainer: {
    width: 32,
    alignItems: 'center',
    marginRight: 12,
  },
  rankIcon: {
    fontSize: 24,
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily: 'System',
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarEmoji: {
    fontSize: 18,
  },
  nameContainer: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    fontFamily: 'System',
    marginBottom: 2,
  },
  currentUserName: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  userBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  userLevel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#6B7280',
    fontFamily: 'System',
  },
  pointsContainer: {
    alignItems: 'flex-end',
    marginRight: 8,
  },
  points: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    fontFamily: 'System',
  },
  pointsLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'System',
  },
  changeIcon: {
    fontSize: 14,
  },
  footer: {
    alignItems: 'center',
    marginTop: 12,
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'System',
  },
})