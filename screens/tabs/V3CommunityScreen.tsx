import React, { useState } from 'react'
import { View, Text, ScrollView, StyleSheet, Pressable, TouchableOpacity, TextInput, Alert, Modal } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { ChallengeCard, Challenge } from '@/components/v3/community/ChallengeCard'
import { CommunityPost, Post } from '@/components/v3/community/CommunityPost'
import { LeaderboardCard, LeaderboardUser } from '@/components/v3/community/LeaderboardCard'
import FamilyChoiceScreen from '@/screens/FamilyChoiceScreen'

type TabType = 'challenges' | 'feed' | 'leaderboard' | 'voting' | 'connections'

interface CircleMember {
  id: string
  name: string
  email: string
  avatar: string
  isOnline?: boolean
  lastActive?: string
}

interface CircleGroup {
  id: string
  name: string
  emoji: string
  members: string[]
  color: string
}

interface Vote {
  id: string
  title: string
  description: string
  type: 'recipe' | 'meal-plan' | 'restaurant'
  status: 'ongoing' | 'completed'
  createdBy: string
  createdAt: string
  endsAt: string
  participants: string[]
  options: VoteOption[]
  totalVotes: number
}

interface VoteOption {
  id: string
  title: string
  description?: string
  image?: string
  votes: number
  voters: string[]
}

export default function V3CommunityScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('challenges')
  const [connectionsSubTab, setConnectionsSubTab] = useState<'members' | 'groups'>('members')
  const [showAddMember, setShowAddMember] = useState(false)
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [showEditGroup, setShowEditGroup] = useState(false)
  const [showCreateVote, setShowCreateVote] = useState(false)
  const [showFamilyChoice, setShowFamilyChoice] = useState(false)
  const [editingGroup, setEditingGroup] = useState<CircleGroup | null>(null)
  const [tempGroupMembers, setTempGroupMembers] = useState<string[]>([])
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupEmoji, setNewGroupEmoji] = useState('👨‍👩‍👧‍👦')
  const [searchQuery, setSearchQuery] = useState('')
  const [voteTitle, setVoteTitle] = useState('')
  const [voteDescription, setVoteDescription] = useState('')
  const [voteType, setVoteType] = useState<'recipe' | 'meal-plan' | 'restaurant'>('recipe')
  const [voteOptions, setVoteOptions] = useState<string[]>(['', ''])
  
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
      rating: 4.2,
    },
    {
      id: '2',
      title: 'Zero Waste Kitchen',
      description: 'Use up all ingredients before they expire. Share your creative leftover recipes!',
      category: 'budget',
      duration: 21,
      difficulty: 'medium',
      participants: 189,
      rating: 3.8,
    },
    {
      id: '3',
      title: 'Family Cooking Together',
      description: 'Cook one meal together as a family every day. Build bonds through food!',
      category: 'family',
      duration: 12,
      difficulty: 'easy',
      participants: 156,
      rating: 4.7,
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

  const [circleMembers] = useState<CircleMember[]>([
    {
      id: '1',
      name: 'Sarah',
      email: 'sarah@example.com',
      avatar: '👩',
      isOnline: true,
    },
    {
      id: '2',
      name: 'Mike',
      email: 'mike@example.com',
      avatar: '👨',
      isOnline: false,
      lastActive: '2 hours ago'
    },
    {
      id: '3',
      name: 'Emma',
      email: 'emma@example.com',
      avatar: '👧',
      isOnline: true,
    },
    {
      id: '4',
      name: 'Rose',
      email: 'rose@example.com',
      avatar: '👵',
      isOnline: false,
      lastActive: '1 day ago'
    },
    {
      id: '5',
      name: 'Tom',
      email: 'tom@example.com',
      avatar: '👨‍🦱',
      isOnline: true,
    },
    {
      id: '6',
      name: 'Alex',
      email: 'alex@example.com',
      avatar: '👦',
      isOnline: true,
    },
    {
      id: '7',
      name: 'Maria',
      email: 'maria@example.com',
      avatar: '👩‍🦱',
      isOnline: false,
      lastActive: '3 hours ago'
    }
  ])

  const [circleGroups, setCircleGroups] = useState<CircleGroup[]>([
    {
      id: 'g1',
      name: 'Close Friends',
      emoji: '🤝',
      members: ['1', '2', '3'],
      color: '#10B981'
    },
    {
      id: 'g2',
      name: 'Cooking Buddies',
      emoji: '👨‍🍳',
      members: ['1', '2', '3', '4', '5'],
      color: '#3B82F6'
    },
    {
      id: 'g3',
      name: 'Weekend Squad',
      emoji: '🎉',
      members: ['3', '6', '7'],
      color: '#F59E0B'
    },
    {
      id: 'g4',
      name: 'Health Partners',
      emoji: '💪',
      members: ['1', '5', '7'],
      color: '#8B5CF6'
    }
  ])

  // Mock voting data
  const [votes] = useState<Vote[]>([
    {
      id: 'v1',
      title: 'What should we cook for dinner tonight?',
      description: 'Help us decide what to make for our family dinner!',
      type: 'recipe',
      status: 'ongoing',
      createdBy: '1',
      createdAt: '2024-01-15T10:00:00Z',
      endsAt: '2024-01-15T18:00:00Z',
      participants: ['1', '2', '3', '4'],
      totalVotes: 3,
      options: [
        {
          id: 'o1',
          title: 'Mediterranean Quinoa Bowl',
          description: 'Fresh quinoa bowl with roasted vegetables',
          votes: 2,
          voters: ['1', '2']
        },
        {
          id: 'o2',
          title: 'Chicken Tikka Masala',
          description: 'Creamy curry with basmati rice',
          votes: 1,
          voters: ['3']
        },
        {
          id: 'o3',
          title: 'Veggie Pasta Primavera',
          description: 'Light pasta with seasonal vegetables',
          votes: 0,
          voters: []
        }
      ]
    },
    {
      id: 'v2',
      title: 'Weekend meal prep options',
      description: 'What should we prep for next week?',
      type: 'meal-plan',
      status: 'completed',
      createdBy: '2',
      createdAt: '2024-01-14T09:00:00Z',
      endsAt: '2024-01-14T20:00:00Z',
      participants: ['1', '2', '3', '4', '5'],
      totalVotes: 5,
      options: [
        {
          id: 'o4',
          title: 'Asian-inspired bowls',
          description: 'Teriyaki chicken, rice, and vegetables',
          votes: 3,
          voters: ['1', '2', '5']
        },
        {
          id: 'o5',
          title: 'Mediterranean salads',
          description: 'Greek salad variations with protein',
          votes: 2,
          voters: ['3', '4']
        }
      ]
    },
    {
      id: 'v3',
      title: 'Restaurant choice for birthday celebration',
      description: 'Where should we go for Sarah\'s birthday?',
      type: 'restaurant',
      status: 'ongoing',
      createdBy: '3',
      createdAt: '2024-01-15T14:00:00Z',
      endsAt: '2024-01-16T12:00:00Z',
      participants: ['1', '2', '3', '4', '5', '6'],
      totalVotes: 4,
      options: [
        {
          id: 'o6',
          title: 'Italian Bistro',
          description: 'Authentic Italian cuisine downtown',
          votes: 2,
          voters: ['1', '4']
        },
        {
          id: 'o7',
          title: 'Sushi Palace',
          description: 'Fresh sushi and Japanese dishes',
          votes: 2,
          voters: ['2', '3']
        },
        {
          id: 'o8',
          title: 'Farm-to-Table',
          description: 'Organic local ingredients',
          votes: 0,
          voters: []
        }
      ]
    }
  ])
  
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

  const handleVoteOption = (voteId: string, optionId: string) => {
    console.log('Voting for option:', optionId, 'in vote:', voteId)
    // TODO: Implement vote logic
  }

  const handleCreateVote = () => {
    setShowFamilyChoice(true)
  }

  const handleSubmitVote = () => {
    if (!voteTitle.trim()) {
      Alert.alert('Error', 'Please enter a vote title')
      return
    }
    
    if (!voteDescription.trim()) {
      Alert.alert('Error', 'Please enter a vote description')
      return
    }
    
    const validOptions = voteOptions.filter(option => option.trim())
    if (validOptions.length < 2) {
      Alert.alert('Error', 'Please add at least 2 options')
      return
    }
    
    // If it's a recipe vote, navigate to family choice screen
    if (voteType === 'recipe') {
      setShowCreateVote(false)
      setShowFamilyChoice(true)
    } else {
      // For meal-plan and restaurant votes, create directly
      Alert.alert(
        'Vote Created',
        `"${voteTitle}" has been created successfully!`,
        [{ text: 'OK', onPress: () => {
          setVoteTitle('')
          setVoteDescription('')
          setVoteType('recipe')
          setVoteOptions(['', ''])
          setShowCreateVote(false)
        }}]
      )
    }
  }

  const addVoteOption = () => {
    setVoteOptions([...voteOptions, ''])
  }

  const removeVoteOption = (index: number) => {
    if (voteOptions.length > 2) {
      setVoteOptions(voteOptions.filter((_, i) => i !== index))
    }
  }

  const updateVoteOption = (index: number, value: string) => {
    const newOptions = [...voteOptions]
    newOptions[index] = value
    setVoteOptions(newOptions)
  }

  const handleCreateRecipeVote = (selectedRecipes: any[], title: string, description: string) => {
    Alert.alert(
      'Recipe Vote Created',
      `"${title}" has been created with ${selectedRecipes.length} recipe options!`,
      [{ text: 'OK', onPress: () => {
        setVoteTitle('')
        setVoteDescription('')
        setVoteType('recipe')
        setVoteOptions(['', ''])
        setShowFamilyChoice(false)
      }}]
    )
  }

  const handleAddMember = () => {
    if (!newMemberEmail.trim()) {
      Alert.alert('Error', 'Please enter an email address')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newMemberEmail)) {
      Alert.alert('Error', 'Please enter a valid email address')
      return
    }

    Alert.alert(
      'Invitation Sent',
      `An invitation has been sent to ${newMemberEmail} to join your WellNoosh circle.`,
      [{ text: 'OK', onPress: () => {
        setNewMemberEmail('')
        setShowAddMember(false)
      }}]
    )
  }

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) {
      Alert.alert('Error', 'Please enter a group name')
      return
    }

    Alert.alert(
      'Group Created',
      `"${newGroupName}" group has been created. You can now add members to it.`,
      [{ text: 'OK', onPress: () => {
        setNewGroupName('')
        setNewGroupEmoji('🤝')
        setShowCreateGroup(false)
      }}]
    )
  }

  const handleEditGroup = (group: CircleGroup) => {
    setEditingGroup(group)
    setTempGroupMembers([...group.members])
    setNewGroupName(group.name)
    setNewGroupEmoji(group.emoji)
    setShowEditGroup(true)
  }

  const handleUpdateGroup = () => {
    if (!newGroupName.trim()) {
      Alert.alert('Error', 'Please enter a group name')
      return
    }

    if (editingGroup) {
      const updatedGroups = circleGroups.map(group =>
        group.id === editingGroup.id
          ? { ...group, name: newGroupName, emoji: newGroupEmoji, members: tempGroupMembers }
          : group
      )
      setCircleGroups(updatedGroups)
      
      Alert.alert(
        'Group Updated',
        `"${newGroupName}" group has been updated successfully.`,
        [{ text: 'OK', onPress: () => {
          setNewGroupName('')
          setNewGroupEmoji('🤝')
          setEditingGroup(null)
          setTempGroupMembers([])
          setShowEditGroup(false)
        }}]
      )
    }
  }

  const handleToggleGroupMember = (memberId: string) => {
    const memberExists = tempGroupMembers.includes(memberId)
    const newMembers = memberExists
      ? tempGroupMembers.filter(id => id !== memberId)
      : [...tempGroupMembers, memberId]
    
    setTempGroupMembers(newMembers)
  }

  const filteredMembers = circleMembers.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const groupEmojis = ['🤝', '👨‍🍳', '🎉', '💪', '🏠', '❤️', '🍽️', '⭐']
  
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
      
      case 'voting':
        return (
          <View style={styles.tabContent}>
            <View style={styles.votingHeader}>
              <Text style={styles.sectionTitle}>Voting</Text>
              <TouchableOpacity style={styles.createVoteButton} onPress={handleCreateVote}>
                <Text style={styles.createVoteButtonText}>+ Create Vote</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.sectionSubtitle}>Participate in community decisions</Text>
            
            {/* Active Votes */}
            <View style={styles.votingSection}>
              <Text style={styles.votingSectionTitle}>🗳️ Active Votes</Text>
              {votes.filter(vote => vote.status === 'ongoing').map((vote) => (
                <View key={vote.id} style={styles.voteCard}>
                  <View style={styles.voteHeader}>
                    <View style={styles.voteInfo}>
                      <Text style={styles.voteTitle}>{vote.title}</Text>
                      <Text style={styles.voteDescription}>{vote.description}</Text>
                      <View style={styles.voteMetadata}>
                        <Text style={styles.voteType}>
                          {vote.type === 'recipe' ? '🍽️' : vote.type === 'meal-plan' ? '📋' : '🏪'} {vote.type}
                        </Text>
                        <Text style={styles.voteParticipants}>
                          {vote.participants.length} participants
                        </Text>
                        <Text style={styles.voteTimeLeft}>
                          Ends in 4h
                        </Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.voteOptions}>
                    {vote.options.map((option) => (
                      <TouchableOpacity
                        key={option.id}
                        style={styles.voteOption}
                        onPress={() => handleVoteOption(vote.id, option.id)}
                      >
                        <View style={styles.voteOptionContent}>
                          <Text style={styles.voteOptionTitle}>{option.title}</Text>
                          <Text style={styles.voteOptionDescription}>{option.description}</Text>
                        </View>
                        <View style={styles.voteOptionStats}>
                          <Text style={styles.voteOptionCount}>{option.votes}</Text>
                          <View style={[styles.voteOptionProgress, { width: `${(option.votes / vote.totalVotes) * 100}%` }]} />
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}
            </View>
            
            {/* Completed Votes */}
            <View style={styles.votingSection}>
              <Text style={styles.votingSectionTitle}>✅ Recent Results</Text>
              {votes.filter(vote => vote.status === 'completed').map((vote) => (
                <View key={vote.id} style={[styles.voteCard, styles.completedVoteCard]}>
                  <View style={styles.voteHeader}>
                    <View style={styles.voteInfo}>
                      <Text style={styles.voteTitle}>{vote.title}</Text>
                      <Text style={styles.voteDescription}>{vote.description}</Text>
                      <View style={styles.voteMetadata}>
                        <Text style={styles.voteType}>
                          {vote.type === 'recipe' ? '🍽️' : vote.type === 'meal-plan' ? '📋' : '🏪'} {vote.type}
                        </Text>
                        <Text style={styles.voteStatus}>Completed</Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.voteOptions}>
                    {vote.options.map((option) => {
                      const isWinner = option.votes === Math.max(...vote.options.map(o => o.votes))
                      return (
                        <View
                          key={option.id}
                          style={[styles.voteOption, styles.completedVoteOption, isWinner && styles.winningOption]}
                        >
                          <View style={styles.voteOptionContent}>
                            <Text style={styles.voteOptionTitle}>
                              {isWinner ? '🏆 ' : ''}{option.title}
                            </Text>
                            <Text style={styles.voteOptionDescription}>{option.description}</Text>
                          </View>
                          <View style={styles.voteOptionStats}>
                            <Text style={styles.voteOptionCount}>{option.votes}</Text>
                            <View style={[styles.voteOptionProgress, { width: `${(option.votes / vote.totalVotes) * 100}%` }]} />
                          </View>
                        </View>
                      )
                    })}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )
      
      case 'connections':
        return (
          <View style={styles.tabContent}>
            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search circle members..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Sub-tab Navigation */}
            <View style={styles.subTabContainer}>
              <TouchableOpacity
                style={[styles.subTab, connectionsSubTab === 'members' && styles.activeSubTab]}
                onPress={() => setConnectionsSubTab('members')}
              >
                <Text style={[styles.subTabText, connectionsSubTab === 'members' && styles.activeSubTabText]}>
                  Circle Members
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.subTab, connectionsSubTab === 'groups' && styles.activeSubTab]}
                onPress={() => setConnectionsSubTab('groups')}
              >
                <Text style={[styles.subTabText, connectionsSubTab === 'groups' && styles.activeSubTabText]}>
                  Groups
                </Text>
              </TouchableOpacity>
            </View>

            {connectionsSubTab === 'members' ? (
              <>
                {/* Add Member Button */}
                <TouchableOpacity style={styles.addButton} onPress={() => setShowAddMember(true)}>
                  <View style={styles.addButtonIcon}>
                    <Text style={styles.addButtonIconText}>+</Text>
                  </View>
                  <View style={styles.addButtonContent}>
                    <Text style={styles.addButtonTitle}>Invite Circle Member</Text>
                    <Text style={styles.addButtonSubtitle}>Send invitation via email</Text>
                  </View>
                </TouchableOpacity>

                {/* Circle Members List */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Circle Members ({circleMembers.length})</Text>
                  {filteredMembers.map((member) => (
                    <View key={member.id} style={styles.memberCard}>
                      <View style={styles.memberAvatar}>
                        <Text style={styles.memberAvatarText}>{member.avatar}</Text>
                        {member.isOnline && <View style={styles.onlineIndicator} />}
                      </View>
                      
                      <View style={styles.memberInfo}>
                        <Text style={styles.memberName}>{member.name}</Text>
                        <Text style={styles.memberEmail}>{member.email}</Text>
                        {!member.isOnline && member.lastActive && (
                          <Text style={styles.memberLastActive}>Last active: {member.lastActive}</Text>
                        )}
                      </View>
                      
                      <TouchableOpacity style={styles.memberAction}>
                        <Text style={styles.memberActionText}>Message</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </>
            ) : (
              <>
                {/* Create Group Button */}
                <TouchableOpacity style={styles.addButton} onPress={() => setShowCreateGroup(true)}>
                  <View style={styles.addButtonIcon}>
                    <Text style={styles.addButtonIconText}>+</Text>
                  </View>
                  <View style={styles.addButtonContent}>
                    <Text style={styles.addButtonTitle}>Create New Group</Text>
                    <Text style={styles.addButtonSubtitle}>Organize circle members</Text>
                  </View>
                </TouchableOpacity>

                {/* Circle Groups List */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Circle Groups ({circleGroups.length})</Text>
                  {circleGroups.map((group) => (
                    <View key={group.id} style={[styles.groupCard, { borderLeftColor: group.color }]}>
                      <View style={styles.groupHeader}>
                        <Text style={styles.groupEmoji}>{group.emoji}</Text>
                        <View style={styles.groupInfo}>
                          <Text style={styles.groupName}>{group.name}</Text>
                          <Text style={styles.groupMemberCount}>
                            {group.members.length} member{group.members.length !== 1 ? 's' : ''}
                          </Text>
                        </View>
                        <TouchableOpacity style={styles.groupAction} onPress={() => handleEditGroup(group)}>
                          <Text style={styles.groupActionText}>Edit</Text>
                        </TouchableOpacity>
                      </View>
                      
                      <View style={styles.groupMembers}>
                        {group.members.slice(0, 4).map((memberId) => {
                          const member = circleMembers.find(m => m.id === memberId)
                          return member ? (
                            <View key={memberId} style={styles.groupMemberAvatar}>
                              <Text style={styles.groupMemberAvatarText}>{member.avatar}</Text>
                            </View>
                          ) : null
                        })}
                        {group.members.length > 4 && (
                          <View style={styles.groupMemberAvatar}>
                            <Text style={styles.groupMemberAvatarText}>+{group.members.length - 4}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>
        )
      
      default:
        return null
    }
  }
  
  // If showing family choice screen, render it instead
  if (showFamilyChoice) {
    return (
      <FamilyChoiceScreen
        onNavigateBack={() => setShowFamilyChoice(false)}
        onCreateVote={handleCreateRecipeVote}
        voteTitle={voteTitle}
        voteDescription={voteDescription}
      />
    )
  }
  
  return (
    <LinearGradient
      colors={['#F0FDF4', '#DBEAFE', '#FAF5FF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.title}>👥</Text>
        <Text style={styles.subtitle}>Join challenges and connect with others</Text>
        
        {/* Tab Navigation */}
        <View style={styles.tabBar}>
          {[
            { key: 'challenges', label: 'Challenges', icon: '🏆' },
            { key: 'feed', label: 'Feed', icon: '📝' },
            { key: 'leaderboard', label: 'Leaders', icon: '🏅' },
            { key: 'voting', label: 'Voting', icon: '🗳️' },
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

      {/* Add Member Modal */}
      <Modal
        visible={showAddMember}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddMember(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Invite Circle Member</Text>
              <TouchableOpacity onPress={() => setShowAddMember(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalDescription}>
              Enter the email address of the person you want to invite to your WellNoosh circle.
            </Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Email address"
              value={newMemberEmail}
              onChangeText={setNewMemberEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#9CA3AF"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowAddMember(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalPrimaryButton}
                onPress={handleAddMember}
              >
                <Text style={styles.modalPrimaryButtonText}>Send Invite</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Create Group Modal */}
      <Modal
        visible={showCreateGroup}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCreateGroup(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Circle Group</Text>
              <TouchableOpacity onPress={() => setShowCreateGroup(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalDescription}>
              Create a group to easily share with specific circle members.
            </Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Group name"
              value={newGroupName}
              onChangeText={setNewGroupName}
              placeholderTextColor="#9CA3AF"
            />
            
            <Text style={styles.emojiPickerLabel}>Choose an emoji:</Text>
            <View style={styles.emojiPicker}>
              {groupEmojis.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={[
                    styles.emojiOption,
                    newGroupEmoji === emoji && styles.emojiOptionSelected
                  ]}
                  onPress={() => setNewGroupEmoji(emoji)}
                >
                  <Text style={styles.emojiOptionText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowCreateGroup(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalPrimaryButton}
                onPress={handleCreateGroup}
              >
                <Text style={styles.modalPrimaryButtonText}>Create Group</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Group Modal */}
      <Modal
        visible={showEditGroup}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEditGroup(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.editModalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Group</Text>
              <TouchableOpacity onPress={() => setShowEditGroup(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalDescription}>
                Update group details and manage members.
              </Text>
              
              <TextInput
                style={styles.modalInput}
                placeholder="Group name"
                value={newGroupName}
                onChangeText={setNewGroupName}
                placeholderTextColor="#9CA3AF"
              />
              
              <Text style={styles.emojiPickerLabel}>Choose an emoji:</Text>
              <View style={styles.emojiPicker}>
                {groupEmojis.map((emoji) => (
                  <TouchableOpacity
                    key={emoji}
                    style={[
                      styles.emojiOption,
                      newGroupEmoji === emoji && styles.emojiOptionSelected
                    ]}
                    onPress={() => setNewGroupEmoji(emoji)}
                  >
                    <Text style={styles.emojiOptionText}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Members Management */}
              {editingGroup && (
                <View style={styles.membersSection}>
                  <Text style={styles.membersSectionTitle}>Group Members:</Text>
                  <View style={styles.membersGrid}>
                    {circleMembers.map((member) => {
                      const isMember = tempGroupMembers.includes(member.id)
                      return (
                        <TouchableOpacity
                          key={member.id}
                          style={[
                            styles.memberToggle,
                            isMember && styles.memberToggleSelected
                          ]}
                          onPress={() => handleToggleGroupMember(member.id)}
                        >
                          <Text style={styles.memberToggleAvatar}>{member.avatar}</Text>
                          <Text style={[
                            styles.memberToggleName,
                            isMember && styles.memberToggleNameSelected
                          ]}>
                            {member.name}
                          </Text>
                          {isMember && (
                            <View style={styles.memberToggleCheck}>
                              <Text style={styles.memberToggleCheckText}>✓</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      )
                    })}
                  </View>
                </View>
              )}
            </ScrollView>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowEditGroup(false)
                  setTempGroupMembers([])
                }}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalPrimaryButton}
                onPress={handleUpdateGroup}
              >
                <Text style={styles.modalPrimaryButtonText}>Update Group</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Create Vote Modal */}
      <Modal
        visible={showCreateVote}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCreateVote(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.createVoteModalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Vote</Text>
              <TouchableOpacity onPress={() => setShowCreateVote(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalDescription}>
                Create a vote for your community to decide on meals, restaurants, or activities.
                {voteType === 'recipe' && ' For recipe votes, you\'ll be able to select specific recipes after creating the vote.'}
              </Text>
              
              {/* Vote Type Selection */}
              <View style={styles.voteTypeSection}>
                <Text style={styles.inputLabel}>Vote Type</Text>
                <View style={styles.voteTypeButtons}>
                  {[
                    { key: 'recipe', label: 'Recipe', icon: '🍽️' },
                    { key: 'meal-plan', label: 'Meal Plan', icon: '📋' },
                    { key: 'restaurant', label: 'Restaurant', icon: '🏪' }
                  ].map((type) => (
                    <TouchableOpacity
                      key={type.key}
                      style={[
                        styles.voteTypeButton,
                        voteType === type.key && styles.voteTypeButtonSelected
                      ]}
                      onPress={() => setVoteType(type.key as 'recipe' | 'meal-plan' | 'restaurant')}
                    >
                      <Text style={styles.voteTypeIcon}>{type.icon}</Text>
                      <Text style={[
                        styles.voteTypeLabel,
                        voteType === type.key && styles.voteTypeLabelSelected
                      ]}>
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              {/* Vote Title */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Vote Title</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="What are you voting on?"
                  value={voteTitle}
                  onChangeText={setVoteTitle}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              
              {/* Vote Description */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={[styles.modalInput, styles.textArea]}
                  placeholder="Add more details about this vote..."
                  value={voteDescription}
                  onChangeText={setVoteDescription}
                  multiline
                  numberOfLines={3}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              
              {/* Vote Options */}
              <View style={styles.inputGroup}>
                <View style={styles.optionsHeader}>
                  <Text style={styles.inputLabel}>Options</Text>
                  <TouchableOpacity
                    style={styles.addOptionButton}
                    onPress={addVoteOption}
                  >
                    <Text style={styles.addOptionButtonText}>+ Add Option</Text>
                  </TouchableOpacity>
                </View>
                
                {voteOptions.map((option, index) => (
                  <View key={index} style={styles.optionRow}>
                    <TextInput
                      style={[styles.modalInput, styles.optionInput]}
                      placeholder={`Option ${index + 1}`}
                      value={option}
                      onChangeText={(value) => updateVoteOption(index, value)}
                      placeholderTextColor="#9CA3AF"
                    />
                    {voteOptions.length > 2 && (
                      <TouchableOpacity
                        style={styles.removeOptionButton}
                        onPress={() => removeVoteOption(index)}
                      >
                        <Text style={styles.removeOptionButtonText}>✕</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            </ScrollView>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowCreateVote(false)
                  setVoteTitle('')
                  setVoteDescription('')
                  setVoteType('recipe')
                  setVoteOptions(['', ''])
                }}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalPrimaryButton}
                onPress={handleSubmitVote}
              >
                <Text style={styles.modalPrimaryButtonText}>
                  {voteType === 'recipe' ? 'Select Recipes' : 'Create Vote'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  
  // Family Management Styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  subTabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  subTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeSubTab: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  subTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeSubTabText: {
    color: '#1F2937',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#10B981',
    borderStyle: 'dashed',
  },
  addButtonIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  addButtonIconText: {
    fontSize: 24,
    color: '#10B981',
  },
  addButtonContent: {
    flex: 1,
  },
  addButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  addButtonSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    position: 'relative',
  },
  memberAvatarText: {
    fontSize: 24,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: 'white',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  memberEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  memberLastActive: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  memberAction: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  memberActionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  groupCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  groupEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  groupMemberCount: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  groupAction: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  groupActionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  groupMembers: {
    flexDirection: 'row',
  },
  groupMemberAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -8,
    borderWidth: 2,
    borderColor: 'white',
  },
  groupMemberAvatarText: {
    fontSize: 14,
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    margin: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  editModalContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    margin: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    maxHeight: '85%',
  },
  modalScrollView: {
    maxHeight: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalClose: {
    fontSize: 24,
    color: '#6B7280',
    padding: 4,
  },
  modalDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
    lineHeight: 20,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 20,
  },
  emojiPickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  emojiPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  emojiOption: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  emojiOptionSelected: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  emojiOptionText: {
    fontSize: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  modalPrimaryButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#10B981',
    alignItems: 'center',
  },
  modalPrimaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  
  // Edit Group Modal Styles
  membersSection: {
    marginBottom: 20,
  },
  membersSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  membersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  memberToggle: {
    width: '48%',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  memberToggleSelected: {
    backgroundColor: '#F0FDF4',
    borderColor: '#10B981',
  },
  memberToggleAvatar: {
    fontSize: 24,
    marginBottom: 4,
  },
  memberToggleName: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
  },
  memberToggleNameSelected: {
    color: '#059669',
  },
  memberToggleCheck: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberToggleCheckText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
  
  // Voting Styles
  votingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  createVoteButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createVoteButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  votingSection: {
    marginBottom: 24,
  },
  votingSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  voteCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  completedVoteCard: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  voteHeader: {
    marginBottom: 12,
  },
  voteInfo: {
    flex: 1,
  },
  voteTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  voteDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  voteMetadata: {
    flexDirection: 'row',
    gap: 12,
  },
  voteType: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  voteParticipants: {
    fontSize: 12,
    color: '#6B7280',
  },
  voteTimeLeft: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '500',
  },
  voteStatus: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  voteOptions: {
    gap: 8,
  },
  voteOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  completedVoteOption: {
    backgroundColor: '#F3F4F6',
  },
  winningOption: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  voteOptionContent: {
    flex: 1,
  },
  voteOptionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  voteOptionDescription: {
    fontSize: 12,
    color: '#6B7280',
  },
  voteOptionStats: {
    alignItems: 'flex-end',
    minWidth: 40,
  },
  voteOptionCount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10B981',
    marginBottom: 4,
  },
  voteOptionProgress: {
    height: 4,
    backgroundColor: '#10B981',
    borderRadius: 2,
    minWidth: 2,
  },
  
  // Create Vote Modal Styles
  createVoteModalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    flex: 1,
    marginTop: 50,
  },
  voteTypeSection: {
    marginBottom: 20,
  },
  voteTypeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  voteTypeButton: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  voteTypeButtonSelected: {
    backgroundColor: '#F0FDF4',
    borderColor: '#10B981',
  },
  voteTypeIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  voteTypeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  voteTypeLabelSelected: {
    color: '#10B981',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  optionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addOptionButton: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  addOptionButtonText: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '600',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionInput: {
    flex: 1,
    marginBottom: 0,
  },
  removeOptionButton: {
    marginLeft: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  removeOptionButtonText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
  },
})