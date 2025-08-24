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
import { useAuth } from '../src/context/supabase-provider'
import { useUserData } from '../src/context/user-data-provider'
import { useNavigation } from '@react-navigation/native'
import { ScreenWrapper } from '../src/components/layout/ScreenWrapper'
import RecipeSwipeScreen from './RecipeSwipeScreen'

interface MembershipInfo {
  tier: string
  status: string
  joinDate: string
  nextBilling?: string
}

export default function ProfileScreen() {
  const { session, signOut } = useAuth()
  const { userData } = useUserData()
  const navigation = useNavigation()
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [showRecipeSwipe, setShowRecipeSwipe] = useState(false)

  // Mock membership data - replace with actual API call when implemented
  const membershipInfo: MembershipInfo = {
    tier: 'Premium',
    status: 'Active',
    joinDate: 'January 2025',
    nextBilling: 'February 1, 2025'
  }


  const menuSections = [
    {
      title: 'Health & Wellness',
      items: [
        { emoji: '📊', label: 'Health Tracker', action: () => navigation.navigate('TrackerScreen' as never) },
        { emoji: '🎯', label: 'Update Health Goals', action: () => Alert.alert('Health Goals', 'Navigate to onboarding to update your health goals.') }
      ]
    },
    {
      title: 'Account',
      items: [
        { emoji: '✏️', label: 'Edit Profile', action: () => setShowEditProfile(true) },
        { emoji: '🔔', label: 'Notifications', action: () => Alert.alert('Notifications', 'Coming soon!') },
        { emoji: '🔒', label: 'Privacy & Security', action: () => Alert.alert('Privacy', 'Coming soon!') }
      ]
    },
    {
      title: 'App',
      items: [
        { emoji: '📱', label: 'App Settings', action: () => Alert.alert('App Settings', 'Coming soon!') },
        { emoji: '❓', label: 'Help & Support', action: () => Alert.alert('Help & Support', 'Coming soon!') },
        { emoji: '⚙️', label: 'Advanced Settings', action: () => Alert.alert('Advanced Settings', 'Coming soon!') }
      ]
    },
    {
      title: 'Developer',
      items: [
        { emoji: '🧪', label: 'Test Recipe Swipe', action: () => setShowRecipeSwipe(true) }
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

  const userName = userData?.fullName || session?.user?.email?.split('@')[0] || 'Guest User'
  const userEmail = session?.user?.email || 'guest@wellnoosh.com'

  return (
    <ScreenWrapper>
      {/* Header */}
      <View style={styles.header}>
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
          
          <View style={styles.membershipBadge}>
            <Text style={styles.membershipText}>
              ✨ {membershipInfo.tier} Member
            </Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Membership Info */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionEmoji}>👑</Text>
              <Text style={styles.sectionTitle}>Membership</Text>
            </View>
            
            <View style={styles.infoCard}>
              <View style={styles.infoItem}>
                <Text style={styles.infoEmoji}>✨</Text>
                <View style={styles.infoContent}>
                  <Text style={styles.infoValue}>{membershipInfo.tier}</Text>
                  <Text style={styles.infoLabel}>Plan Type</Text>
                </View>
              </View>
              
              <View style={styles.infoItem}>
                <Text style={styles.infoEmoji}>📅</Text>
                <View style={styles.infoContent}>
                  <Text style={styles.infoValue}>{membershipInfo.joinDate}</Text>
                  <Text style={styles.infoLabel}>Member Since</Text>
                </View>
              </View>
              
              <View style={styles.infoItem}>
                <Text style={styles.infoEmoji}>🔄</Text>
                <View style={styles.infoContent}>
                  <Text style={styles.infoValue}>{membershipInfo.status}</Text>
                  <Text style={styles.infoLabel}>Status</Text>
                </View>
              </View>
              
              {membershipInfo.nextBilling && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoEmoji}>💳</Text>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoValue}>{membershipInfo.nextBilling}</Text>
                    <Text style={styles.infoLabel}>Next Billing</Text>
                  </View>
                </View>
              )}
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
                  <Text style={styles.infoValue}>
                    {userData?.city || 'City not specified'}, {userData?.country || 'Country not specified'}
                  </Text>
                  <Text style={styles.infoLabel}>Location</Text>
                </View>
              </View>
              
              <View style={styles.infoItem}>
                <Text style={styles.infoEmoji}>🏠</Text>
                <View style={styles.infoContent}>
                  <Text style={styles.infoValue}>
                    {userData?.address || userData?.postalCode || 'Not specified'}
                  </Text>
                  <Text style={styles.infoLabel}>Address</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Cooking Profile */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionEmoji}>👨‍🍳</Text>
              <Text style={styles.sectionTitle}>Cooking Profile</Text>
            </View>
            
            <View style={styles.infoCard}>
              <View style={styles.infoItem}>
                <Text style={styles.infoEmoji}>🌱</Text>
                <View style={styles.infoContent}>
                  <Text style={styles.infoValue}>
                    {userData?.dietStyle || 'Not specified'}
                  </Text>
                  <Text style={styles.infoLabel}>Diet Style</Text>
                </View>
              </View>
              
              <View style={styles.infoItem}>
                <Text style={styles.infoEmoji}>🍳</Text>
                <View style={styles.infoContent}>
                  <Text style={styles.infoValue}>
                    {userData?.cookingSkill || 'Not specified'}
                  </Text>
                  <Text style={styles.infoLabel}>Cooking Experience</Text>
                </View>
              </View>
              
              <View style={styles.infoItem}>
                <Text style={styles.infoEmoji}>⏱️</Text>
                <View style={styles.infoContent}>
                  <Text style={styles.infoValue}>
                    {userData?.mealPreference || 'Not specified'}
                  </Text>
                  <Text style={styles.infoLabel}>Cooking Time Preference</Text>
                </View>
              </View>
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
                    editable={false}
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Location</Text>
                  <TextInput
                    style={styles.textInput}
                    defaultValue={`${userData?.city || ''}, ${userData?.country || ''}`}
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

      {/* Recipe Swipe Modal */}
      {showRecipeSwipe && (
        <Modal
          visible={showRecipeSwipe}
          transparent={false}
          animationType="slide"
          onRequestClose={() => setShowRecipeSwipe(false)}
        >
          <RecipeSwipeScreen
            onNavigateBack={() => setShowRecipeSwipe(false)}
          />
        </Modal>
      )}
    </ScreenWrapper>
  )
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#6B8E23',
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
    fontFamily: 'Inter',
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
    fontFamily: 'Inter',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
    fontFamily: 'Inter',
  },
  userEmail: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 16,
    fontFamily: 'Inter',
  },
  membershipBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    marginTop: 8,
  },
  membershipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFD700',
    fontFamily: 'Inter',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#FAF7F0',
    marginTop: -20,
  },
  content: {
    padding: 20,
    gap: 20,
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
    color: '#1A1A1A',
    fontFamily: 'Inter',
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
    color: '#1A1A1A',
    fontFamily: 'Inter',
  },
  infoLabel: {
    fontSize: 14,
    color: '#4A4A4A',
    marginTop: 2,
    fontFamily: 'Inter',
  },
  menuSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A4A4A',
    fontFamily: 'Inter',
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
    color: '#1A1A1A',
    fontFamily: 'Inter',
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
    fontFamily: 'Inter',
  },
  versionInfo: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  versionText: {
    fontSize: 14,
    color: '#4A4A4A',
    fontWeight: '500',
    fontFamily: 'Inter',
  },
  versionSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
    fontFamily: 'Inter',
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
    color: '#1A1A1A',
    fontFamily: 'Inter',
  },
  modalCloseButton: {
    fontSize: 20,
    color: '#4A4A4A',
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
    color: '#1A1A1A',
    fontFamily: 'Inter',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
    fontFamily: 'Inter',
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
    color: '#4A4A4A',
    fontFamily: 'Inter',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#6B8E23',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Inter',
  },
})