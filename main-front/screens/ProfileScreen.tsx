import React, { useState } from 'react'
import { 
  View, 
  Text, 
  SafeAreaView, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  Modal,
  TextInput,
  Alert
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useAuth } from '../src/context/supabase-provider'
import { useUserData } from '../src/context/user-data-provider'
import { useNavigation } from '@react-navigation/native'
import { ScreenWrapper } from '../src/components/layout/ScreenWrapper'

interface Achievement {
  id: string
  title: string
  description: string
  emoji: string
  earned: boolean
  date?: string
}

interface ProfileMetric {
  label: string
  value: string
  emoji: string
  color: string
}

export default function ProfileScreen() {
  const { session, signOut } = useAuth()
  const { userData } = useUserData()
  const navigation = useNavigation()
  const [showEditProfile, setShowEditProfile] = useState(false)

  const profileMetrics: ProfileMetric[] = [
    {
      label: 'Meals Logged',
      value: '127',
      emoji: '🍽️',
      color: '#3B82F6'
    },
    {
      label: 'Streak Days', 
      value: '12',
      emoji: '🔥',
      color: '#10B981'
    },
    {
      label: 'Achievements',
      value: '8',
      emoji: '🏆', 
      color: '#8B5CF6'
    },
    {
      label: 'Health Score',
      value: '4.9',
      emoji: '⭐',
      color: '#F59E0B'
    }
  ]

  const achievements: Achievement[] = [
    {
      id: 'week-streak',
      title: '7-Day Streak',
      description: 'Logged meals for 7 consecutive days',
      emoji: '🔥',
      earned: true,
      date: '2 days ago'
    },
    {
      id: 'healthy-choices',
      title: 'Healthy Choice Master',
      description: 'Made 50 healthy meal choices',
      emoji: '🥗',
      earned: true,
      date: '1 week ago'
    },
    {
      id: 'chef-assistant',
      title: 'AI Chef Pal',
      description: 'Used AI Chef for 25 recipes',
      emoji: '👨‍🍳',
      earned: true,
      date: '2 weeks ago'
    },
    {
      id: 'zero-waste',
      title: 'Zero Waste Hero',
      description: 'Prevented 10kg of food waste',
      emoji: '🌱',
      earned: false
    },
    {
      id: 'budget-master',
      title: 'Budget Master',
      description: 'Saved €500 on groceries',
      emoji: '💰',
      earned: false
    },
    {
      id: 'meal-planner',
      title: 'Meal Planning Pro',
      description: 'Planned 30 weekly meal schedules',
      emoji: '📅',
      earned: false
    }
  ]

  const menuSections = [
    {
      title: 'Account',
      items: [
        { emoji: '✏️', label: 'Edit Profile', action: () => setShowEditProfile(true) },
        { emoji: '🔔', label: 'Notifications', action: () => Alert.alert('Notifications', 'Coming soon!') },
        { emoji: '🔒', label: 'Privacy & Security', action: () => Alert.alert('Privacy', 'Coming soon!') }
      ]
    },
    {
      title: 'Preferences', 
      items: [
        { emoji: '🥗', label: 'Edit Diet Style', action: () => Alert.alert('Diet Style', 'Tap to edit your dietary preferences and cooking style.') },
        { emoji: '⚠️', label: 'Edit Allergies', action: () => Alert.alert('Allergies', 'Tap to update your allergies and dietary restrictions.') },
        { emoji: '🎯', label: 'Edit Health Goals', action: () => Alert.alert('Health Goals', 'Tap to modify your health and wellness goals.') },
        { emoji: '🏃‍♂️', label: 'Edit Activity Level', action: () => Alert.alert('Activity Level', 'Tap to update your activity and exercise information.') },
        { emoji: '📱', label: 'App Settings', action: () => Alert.alert('App Settings', 'Coming soon!') }
      ]
    },
    {
      title: 'Support',
      items: [
        { emoji: '❓', label: 'Help & Support', action: () => Alert.alert('Help & Support', 'Coming soon!') },
        { emoji: '⚙️', label: 'Advanced Settings', action: () => Alert.alert('Advanced Settings', 'Coming soon!') }
      ]
    }
  ]

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      Alert.alert('Error', 'Failed to sign out. Please try again.')
    }
  }

  const userName = session?.user?.email?.split('@')[0] || 'Guest User'
  const userEmail = session?.user?.email || 'guest@wellnoosh.com'

  return (
    <ScreenWrapper>
      {/* Header */}
      <LinearGradient
        colors={['#10B981', '#3B82F6']}
        style={styles.header}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        
        <View style={styles.profileInfo}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {userName.charAt(0).toUpperCase()}
              </Text>
            </View>
          </View>
          
          <Text style={styles.userName}>{userName}</Text>
          <Text style={styles.userEmail}>{userEmail}</Text>
          
          <View style={styles.healthScore}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Text key={star} style={styles.star}>⭐</Text>
            ))}
            <Text style={styles.healthScoreText}>4.9 Health Score</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Quick Stats */}
          <View style={styles.statsCard}>
            <View style={styles.statsGrid}>
              {profileMetrics.map((metric) => (
                <View key={metric.label} style={styles.statItem}>
                  <Text style={styles.statEmoji}>{metric.emoji}</Text>
                  <Text style={[styles.statValue, { color: metric.color }]}>
                    {metric.value}
                  </Text>
                  <Text style={styles.statLabel}>{metric.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Personal Information */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionEmoji}>👤</Text>
              <Text style={styles.sectionTitle}>Personal Information</Text>
            </View>
            
            <View style={styles.infoCard}>
              <View style={styles.infoItem}>
                <Text style={styles.infoEmoji}>📧</Text>
                <View style={styles.infoContent}>
                  <Text style={styles.infoValue}>{userEmail}</Text>
                  <Text style={styles.infoLabel}>Email Address</Text>
                </View>
              </View>
              
              <View style={styles.infoItem}>
                <Text style={styles.infoEmoji}>📍</Text>
                <View style={styles.infoContent}>
                  <Text style={styles.infoValue}>Barcelona, Spain</Text>
                  <Text style={styles.infoLabel}>Location</Text>
                </View>
              </View>
              
              <View style={styles.infoItem}>
                <Text style={styles.infoEmoji}>📅</Text>
                <View style={styles.infoContent}>
                  <Text style={styles.infoValue}>Member since Dec 2024</Text>
                  <Text style={styles.infoLabel}>Join Date</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Diet & Preferences */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionEmoji}>🥗</Text>
              <Text style={styles.sectionTitle}>Diet & Preferences</Text>
            </View>
            
            <View style={styles.infoCard}>
              <View style={styles.infoItem}>
                <Text style={styles.infoEmoji}>🌱</Text>
                <View style={styles.infoContent}>
                  <Text style={styles.infoValue}>
                    {userData?.dietStyle?.join(', ') || 'Not specified'}
                  </Text>
                  <Text style={styles.infoLabel}>Diet Style</Text>
                </View>
              </View>
              
              <View style={styles.infoItem}>
                <Text style={styles.infoEmoji}>⚠️</Text>
                <View style={styles.infoContent}>
                  <Text style={styles.infoValue}>
                    {userData?.allergies?.length ? userData.allergies.join(', ') : 'None reported'}
                  </Text>
                  <Text style={styles.infoLabel}>Allergies & Restrictions</Text>
                </View>
              </View>
              
              <View style={styles.infoItem}>
                <Text style={styles.infoEmoji}>👨‍🍳</Text>
                <View style={styles.infoContent}>
                  <Text style={styles.infoValue}>
                    {userData?.cookingSkill || 'Not specified'}
                  </Text>
                  <Text style={styles.infoLabel}>Cooking Skill Level</Text>
                </View>
              </View>
              
              <View style={styles.infoItem}>
                <Text style={styles.infoEmoji}>⏱️</Text>
                <View style={styles.infoContent}>
                  <Text style={styles.infoValue}>
                    {userData?.mealPreferences?.join(', ') || 'Not specified'}
                  </Text>
                  <Text style={styles.infoLabel}>Meal Preferences</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Health & Wellness */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionEmoji}>💪</Text>
              <Text style={styles.sectionTitle}>Health & Wellness</Text>
            </View>
            
            <View style={styles.infoCard}>
              <View style={styles.infoItem}>
                <Text style={styles.infoEmoji}>🎯</Text>
                <View style={styles.infoContent}>
                  <Text style={styles.infoValue}>
                    {userData?.healthGoals?.join(', ') || 'Not specified'}
                  </Text>
                  <Text style={styles.infoLabel}>Health Goals</Text>
                </View>
              </View>
              
              <View style={styles.infoItem}>
                <Text style={styles.infoEmoji}>🏃‍♂️</Text>
                <View style={styles.infoContent}>
                  <Text style={styles.infoValue}>
                    {userData?.activityLevel || 'Not specified'}
                  </Text>
                  <Text style={styles.infoLabel}>Activity Level</Text>
                </View>
              </View>
              
              <View style={styles.infoItem}>
                <Text style={styles.infoEmoji}>🏥</Text>
                <View style={styles.infoContent}>
                  <Text style={styles.infoValue}>
                    {userData?.medicalConditions?.length ? userData.medicalConditions.join(', ') : 'None reported'}
                  </Text>
                  <Text style={styles.infoLabel}>Medical Conditions</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Achievements */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionEmoji}>🏆</Text>
              <Text style={styles.sectionTitle}>Achievements</Text>
            </View>
            
            <View style={styles.achievementsGrid}>
              {achievements.map((achievement) => (
                <View 
                  key={achievement.id} 
                  style={[
                    styles.achievementItem,
                    achievement.earned ? styles.achievementEarned : styles.achievementLocked
                  ]}
                >
                  <Text style={styles.achievementEmoji}>{achievement.emoji}</Text>
                  <Text style={styles.achievementTitle}>{achievement.title}</Text>
                  {achievement.earned && achievement.date && (
                    <Text style={styles.achievementDate}>{achievement.date}</Text>
                  )}
                </View>
              ))}
            </View>
          </View>

          {/* Menu Sections */}
          {menuSections.map((section) => (
            <View key={section.title} style={styles.section}>
              <Text style={styles.menuSectionTitle}>{section.title}</Text>
              <View style={styles.menuCard}>
                {section.items.map((item, index) => (
                  <TouchableOpacity
                    key={item.label}
                    style={[
                      styles.menuItem,
                      index !== section.items.length - 1 && styles.menuItemBorder
                    ]}
                    onPress={item.action}
                  >
                    <Text style={styles.menuEmoji}>{item.emoji}</Text>
                    <Text style={styles.menuLabel}>{item.label}</Text>
                    <Text style={styles.menuArrow}>›</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}

          {/* Sign Out */}
          <View style={styles.section}>
            <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>

          {/* App Version */}
          <View style={styles.versionInfo}>
            <Text style={styles.versionText}>WellNoosh v1.0.0</Text>
            <Text style={styles.versionSubtext}>Your Personal AI Chef Nutritionist</Text>
          </View>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <Modal
          visible={showEditProfile}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowEditProfile(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Profile</Text>
                <TouchableOpacity onPress={() => setShowEditProfile(false)}>
                  <Text style={styles.modalCloseButton}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.modalContent}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Full Name</Text>
                  <TextInput
                    style={styles.textInput}
                    defaultValue={userName}
                    placeholder="Enter your name"
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email</Text>
                  <TextInput
                    style={styles.textInput}
                    defaultValue={userEmail}
                    placeholder="Enter your email"
                    keyboardType="email-address"
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Location</Text>
                  <TextInput
                    style={styles.textInput}
                    defaultValue="Barcelona, Spain"
                    placeholder="Enter your location"
                  />
                </View>
                
                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={() => setShowEditProfile(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.saveButton}
                    onPress={() => {
                      Alert.alert('Success', 'Profile updated successfully!')
                      setShowEditProfile(false)
                    }}
                  >
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </ScreenWrapper>
  )
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 16,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 8,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  profileInfo: {
    alignItems: 'center',
    marginTop: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  avatarText: {
    fontSize: 32,
    color: 'white',
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 16,
  },
  healthScore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  star: {
    fontSize: 16,
  },
  healthScoreText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
    marginTop: -20,
  },
  content: {
    padding: 20,
    gap: 20,
  },
  statsCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionEmoji: {
    fontSize: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
  },
  infoEmoji: {
    fontSize: 20,
  },
  infoContent: {
    flex: 1,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  achievementItem: {
    flex: 1,
    minWidth: '30%',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
  },
  achievementEarned: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  achievementLocked: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
    opacity: 0.6,
  },
  achievementEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  achievementTitle: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    color: '#1F2937',
    marginBottom: 4,
  },
  achievementDate: {
    fontSize: 10,
    color: '#F59E0B',
    fontWeight: '500',
  },
  menuSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  menuCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuEmoji: {
    fontSize: 20,
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  menuArrow: {
    fontSize: 20,
    color: '#9CA3AF',
  },
  signOutButton: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  signOutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  versionInfo: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  versionText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  versionSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  modalCloseButton: {
    fontSize: 20,
    color: '#6B7280',
    padding: 4,
  },
  modalContent: {
    padding: 20,
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#10B981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
})