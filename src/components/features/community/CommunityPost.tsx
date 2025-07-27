import React from 'react'
import { View, Text, StyleSheet, Pressable, Image } from 'react-native'

export interface Post {
  id: string
  userId: string
  userName: string
  userLevel: number
  userAvatar?: string
  postType: 'victory' | 'struggle' | 'learning' | 'checkin'
  content: string
  image?: string
  recipe?: {
    id: string
    name: string
    image: string
  }
  likes: number
  comments: number
  shares: number
  hasLiked?: boolean
  needsSupport?: boolean
  timestamp: string
}

interface CommunityPostProps {
  post: Post
  onLike: () => void
  onComment: () => void
  onShare: () => void
  onUserPress: () => void
}

export function CommunityPost({ 
  post, 
  onLike, 
  onComment, 
  onShare,
  onUserPress 
}: CommunityPostProps) {
  const getPostTypeIcon = (type: string) => {
    switch (type) {
      case 'victory': return '🎉'
      case 'struggle': return '💪'
      case 'learning': return '💡'
      case 'checkin': return '✅'
      default: return '📝'
    }
  }

  const getPostTypeColor = (type: string) => {
    switch (type) {
      case 'victory': return '#10B981'
      case 'struggle': return '#EF4444'
      case 'learning': return '#F59E0B'
      case 'checkin': return '#3B82F6'
      default: return '#6B7280'
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000)
    
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  const postTypeIcon = getPostTypeIcon(post.postType)
  const postTypeColor = getPostTypeColor(post.postType)

  return (
    <View style={styles.container}>
      {/* Header */}
      <Pressable style={styles.header} onPress={onUserPress}>
        <View style={styles.userAvatar}>
          {post.userAvatar ? (
            <Image source={{ uri: post.userAvatar }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarEmoji}>👤</Text>
          )}
        </View>
        
        <View style={styles.headerInfo}>
          <View style={styles.userRow}>
            <Text style={styles.userName}>{post.userName}</Text>
            <View style={styles.userBadge}>
              <Text style={styles.userLevel}>Lvl {post.userLevel}</Text>
            </View>
          </View>
          <View style={styles.postMeta}>
            <View style={[styles.postTypeBadge, { backgroundColor: `${postTypeColor}20` }]}>
              <Text style={styles.postTypeIcon}>{postTypeIcon}</Text>
              <Text style={[styles.postTypeText, { color: postTypeColor }]}>
                {post.postType}
              </Text>
            </View>
            <Text style={styles.timestamp}>{formatTimestamp(post.timestamp)}</Text>
          </View>
        </View>
        
        {post.needsSupport && (
          <View style={styles.supportBadge}>
            <Text style={styles.supportIcon}>🤗</Text>
            <Text style={styles.supportText}>Needs support</Text>
          </View>
        )}
      </Pressable>
      
      {/* Content */}
      <Text style={styles.content}>{post.content}</Text>
      
      {/* Image */}
      {post.image && (
        <Image source={{ uri: post.image }} style={styles.postImage} />
      )}
      
      {/* Recipe Card */}
      {post.recipe && (
        <View style={styles.recipeCard}>
          <Image source={{ uri: post.recipe.image }} style={styles.recipeImage} />
          <View style={styles.recipeInfo}>
            <Text style={styles.recipeLabel}>Recipe Shared</Text>
            <Text style={styles.recipeName}>{post.recipe.name}</Text>
          </View>
          <Text style={styles.recipeArrow}>→</Text>
        </View>
      )}
      
      {/* Interaction Bar */}
      <View style={styles.interactionBar}>
        <Pressable 
          style={[styles.interactionButton, post.hasLiked && styles.liked]} 
          onPress={onLike}
        >
          <Text style={styles.interactionIcon}>{post.hasLiked ? '❤️' : '🤍'}</Text>
          <Text style={[styles.interactionText, post.hasLiked && styles.likedText]}>
            {post.likes}
          </Text>
        </Pressable>
        
        <Pressable style={styles.interactionButton} onPress={onComment}>
          <Text style={styles.interactionIcon}>💬</Text>
          <Text style={styles.interactionText}>{post.comments}</Text>
        </Pressable>
        
        <Pressable style={styles.interactionButton} onPress={onShare}>
          <Text style={styles.interactionIcon}>📤</Text>
          <Text style={styles.interactionText}>{post.shares}</Text>
        </Pressable>
        
        {post.needsSupport && (
          <Pressable style={styles.supportButton}>
            <Text style={styles.supportButtonText}>Send Encouragement 💪</Text>
          </Pressable>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarEmoji: {
    fontSize: 20,
  },
  headerInfo: {
    flex: 1,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    fontFamily: 'System',
  },
  userBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  userLevel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    fontFamily: 'System',
  },
  postMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  postTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  postTypeIcon: {
    fontSize: 12,
  },
  postTypeText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'System',
  },
  timestamp: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'System',
  },
  supportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  supportIcon: {
    fontSize: 12,
  },
  supportText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#F59E0B',
    fontFamily: 'System',
  },
  content: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
    marginBottom: 12,
    fontFamily: 'System',
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
  },
  recipeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  recipeImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  recipeInfo: {
    flex: 1,
  },
  recipeLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'System',
  },
  recipeName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    fontFamily: 'System',
  },
  recipeArrow: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  interactionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  interactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  interactionIcon: {
    fontSize: 16,
  },
  interactionText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'System',
  },
  liked: {
    // Style for liked state
  },
  likedText: {
    color: '#EF4444',
    fontWeight: '500',
  },
  supportButton: {
    marginLeft: 'auto',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  supportButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#F59E0B',
    fontFamily: 'System',
  },
})