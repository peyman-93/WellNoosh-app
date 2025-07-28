import React, { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  Modal,
  Pressable
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { ScreenWrapper } from '../../src/components/layout/ScreenWrapper'

interface FamilyMember {
  id: string
  name: string
  email: string
  avatar: string
  isOnline?: boolean
  lastActive?: string
}

interface FamilyGroup {
  id: string
  name: string
  emoji: string
  members: string[] // member IDs
  color: string
}

interface FamilyMemberSelectionScreenProps {
  onBack: () => void
  onSelectMembers: (memberIds: string[], groupId?: string) => void
  preSelectedMembers?: string[]
}

export default function FamilyMemberSelectionScreen({
  onBack,
  onSelectMembers,
  preSelectedMembers = []
}: FamilyMemberSelectionScreenProps) {
  const [selectedMembers, setSelectedMembers] = useState<string[]>(preSelectedMembers)
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddMember, setShowAddMember] = useState(false)
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupEmoji, setNewGroupEmoji] = useState('👨‍👩‍👧‍👦')
  const [activeTab, setActiveTab] = useState<'members' | 'groups'>('members')

  // Mock data - replace with real data
  const [familyMembers] = useState<FamilyMember[]>([
    {
      id: '1',
      name: 'Sarah Johnson',
      email: 'sarah@example.com',
      avatar: '👩',
      isOnline: true,
    },
    {
      id: '2',
      name: 'Mike Johnson',
      email: 'mike@example.com',
      avatar: '👨',
      isOnline: false,
      lastActive: '2 hours ago'
    },
    {
      id: '3',
      name: 'Emma Johnson',
      email: 'emma@example.com',
      avatar: '👧',
      isOnline: true,
    },
    {
      id: '4',
      name: 'Grandma Rose',
      email: 'rose@example.com',
      avatar: '👵',
      isOnline: false,
      lastActive: '1 day ago'
    },
    {
      id: '5',
      name: 'Uncle Tom',
      email: 'tom@example.com',
      avatar: '👨‍🦱',
      isOnline: true,
    }
  ])

  const [familyGroups] = useState<FamilyGroup[]>([
    {
      id: 'g1',
      name: 'Immediate Family',
      emoji: '👨‍👩‍👧',
      members: ['1', '2', '3'],
      color: '#10B981'
    },
    {
      id: 'g2',
      name: 'Extended Family',
      emoji: '👨‍👩‍👧‍👦',
      members: ['1', '2', '3', '4', '5'],
      color: '#3B82F6'
    },
    {
      id: 'g3',
      name: 'Kids Only',
      emoji: '👶',
      members: ['3'],
      color: '#F59E0B'
    }
  ])

  const filteredMembers = familyMembers.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const toggleMemberSelection = (memberId: string) => {
    setSelectedMembers(prev => {
      if (prev.includes(memberId)) {
        return prev.filter(id => id !== memberId)
      } else {
        return [...prev, memberId]
      }
    })
    setSelectedGroup(null) // Clear group selection when manually selecting members
  }

  const selectGroup = (groupId: string) => {
    const group = familyGroups.find(g => g.id === groupId)
    if (group) {
      setSelectedMembers(group.members)
      setSelectedGroup(groupId)
    }
  }

  const handleAddMember = () => {
    if (!newMemberEmail.trim()) {
      Alert.alert('Error', 'Please enter an email address')
      return
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newMemberEmail)) {
      Alert.alert('Error', 'Please enter a valid email address')
      return
    }

    Alert.alert(
      'Invitation Sent',
      `An invitation has been sent to ${newMemberEmail} to join your WellNoosh family.`,
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
        setNewGroupEmoji('👨‍👩‍👧‍👦')
        setShowCreateGroup(false)
      }}]
    )
  }

  const handleDone = () => {
    if (selectedMembers.length === 0) {
      Alert.alert('Select Members', 'Please select at least one family member to share with')
      return
    }

    onSelectMembers(selectedMembers, selectedGroup || undefined)
  }

  const groupEmojis = ['👨‍👩‍👧‍👦', '👨‍👩‍👧', '👶', '🏠', '❤️', '🍽️', '🎉', '⭐']

  return (
    <ScreenWrapper>
      <LinearGradient
        colors={['#E6F7FF', '#FFFFFF']}
        style={styles.backgroundGradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Share with Family</Text>
          
          <TouchableOpacity
            style={[
              styles.doneButton,
              selectedMembers.length === 0 && styles.doneButtonDisabled
            ]}
            onPress={handleDone}
            disabled={selectedMembers.length === 0}
          >
            <Text style={[
              styles.doneButtonText,
              selectedMembers.length === 0 && styles.doneButtonTextDisabled
            ]}>
              Done ({selectedMembers.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search family members..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'members' && styles.activeTab]}
            onPress={() => setActiveTab('members')}
          >
            <Text style={[styles.tabText, activeTab === 'members' && styles.activeTabText]}>
              Members
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'groups' && styles.activeTab]}
            onPress={() => setActiveTab('groups')}
          >
            <Text style={[styles.tabText, activeTab === 'groups' && styles.activeTabText]}>
              Groups
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {activeTab === 'members' ? (
            <>
              {/* Add New Member Button */}
              <TouchableOpacity style={styles.addButton} onPress={() => setShowAddMember(true)}>
                <View style={styles.addButtonIcon}>
                  <Text style={styles.addButtonIconText}>+</Text>
                </View>
                <View style={styles.addButtonContent}>
                  <Text style={styles.addButtonTitle}>Invite Family Member</Text>
                  <Text style={styles.addButtonSubtitle}>Send invitation via email</Text>
                </View>
              </TouchableOpacity>

              {/* Family Members List */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Family Members</Text>
                {filteredMembers.map((member) => (
                  <TouchableOpacity
                    key={member.id}
                    style={[
                      styles.memberCard,
                      selectedMembers.includes(member.id) && styles.selectedMemberCard
                    ]}
                    onPress={() => toggleMemberSelection(member.id)}
                  >
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
                    
                    <View style={[
                      styles.checkbox,
                      selectedMembers.includes(member.id) && styles.checkboxSelected
                    ]}>
                      {selectedMembers.includes(member.id) && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          ) : (
            <>
              {/* Create New Group Button */}
              <TouchableOpacity style={styles.addButton} onPress={() => setShowCreateGroup(true)}>
                <View style={styles.addButtonIcon}>
                  <Text style={styles.addButtonIconText}>+</Text>
                </View>
                <View style={styles.addButtonContent}>
                  <Text style={styles.addButtonTitle}>Create New Group</Text>
                  <Text style={styles.addButtonSubtitle}>Organize family members into groups</Text>
                </View>
              </TouchableOpacity>

              {/* Family Groups List */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Family Groups</Text>
                {familyGroups.map((group) => (
                  <TouchableOpacity
                    key={group.id}
                    style={[
                      styles.groupCard,
                      selectedGroup === group.id && styles.selectedGroupCard,
                      { borderLeftColor: group.color }
                    ]}
                    onPress={() => selectGroup(group.id)}
                  >
                    <View style={styles.groupHeader}>
                      <Text style={styles.groupEmoji}>{group.emoji}</Text>
                      <View style={styles.groupInfo}>
                        <Text style={styles.groupName}>{group.name}</Text>
                        <Text style={styles.groupMemberCount}>
                          {group.members.length} member{group.members.length !== 1 ? 's' : ''}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.groupMembers}>
                      {group.members.slice(0, 4).map((memberId) => {
                        const member = familyMembers.find(m => m.id === memberId)
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

                    <View style={[
                      styles.radio,
                      selectedGroup === group.id && styles.radioSelected
                    ]} />
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </ScrollView>
      </LinearGradient>

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
              <Text style={styles.modalTitle}>Invite Family Member</Text>
              <TouchableOpacity onPress={() => setShowAddMember(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalDescription}>
              Enter the email address of the family member you want to invite to WellNoosh.
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
              <Text style={styles.modalTitle}>Create Family Group</Text>
              <TouchableOpacity onPress={() => setShowCreateGroup(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalDescription}>
              Create a group to easily share with specific family members.
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
    </ScreenWrapper>
  )
}

const styles = StyleSheet.create({
  backgroundGradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 16,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#10B981',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  doneButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  doneButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  doneButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  doneButtonTextDisabled: {
    color: '#9CA3AF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    marginTop: 0,
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#1F2937',
  },
  scrollView: {
    flex: 1,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
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
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedMemberCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#10B981',
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
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  checkmark: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  groupCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedGroupCard: {
    backgroundColor: '#F0FDF4',
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
  groupMembers: {
    flexDirection: 'row',
    marginBottom: 8,
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
  radio: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  radioSelected: {
    borderColor: '#10B981',
    backgroundColor: '#10B981',
  },
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
})