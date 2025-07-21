import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface SlideOutMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToProfile?: () => void;
  userData?: any;
}

const { width: screenWidth } = Dimensions.get('window');
const MENU_WIDTH = screenWidth * 0.8;

export function SlideOutMenu({ isOpen, onClose, onNavigateToProfile, userData }: SlideOutMenuProps) {
  const handleNavigateToProfile = () => {
    onNavigateToProfile?.();
    onClose();
  };

  const handleSignOut = () => {
    // Handle sign out logic
    console.log('Sign out');
    onClose();
  };

  const getUserName = () => {
    return userData?.fullName || 'User';
  };


  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        {/* Backdrop */}
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        
        {/* Slide out menu */}
        <View style={styles.menuContainer}>
          <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <LinearGradient
              colors={['#3b82f6', '#8b5cf6']}
              style={styles.header}
            >
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
              
              <View style={styles.profileSection}>
                <View style={styles.profileImageContainer}>
                  <Text style={styles.profileImagePlaceholder}>👤</Text>
                </View>
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>{getUserName()}</Text>
                  <View style={styles.premiumBadge}>
                    <Text style={styles.premiumIcon}>👑</Text>
                    <Text style={styles.premiumText}>Premium</Text>
                  </View>
                </View>
              </View>
              
              <Text style={styles.memberSince}>
                Member since December 2024
              </Text>
            </LinearGradient>

            {/* Menu Content */}
            <ScrollView style={styles.menuContent}>
              {/* Quick Actions */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <View style={styles.menuItems}>
                  <TouchableOpacity 
                    style={styles.menuItem}
                    onPress={handleNavigateToProfile}
                  >
                    <View style={[styles.menuIcon, { backgroundColor: '#dbeafe' }]}>
                      <Text style={styles.iconText}>👤</Text>
                    </View>
                    <View style={styles.menuItemContent}>
                      <Text style={styles.menuItemTitle}>Profile Settings</Text>
                      <Text style={styles.menuItemSubtitle}>Personal info & preferences</Text>
                    </View>
                    <Text style={styles.chevron}>›</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.menuItem}>
                    <View style={[styles.menuIcon, { backgroundColor: '#fef3c7' }]}>
                      <Text style={styles.iconText}>👑</Text>
                    </View>
                    <View style={styles.menuItemContent}>
                      <Text style={styles.menuItemTitle}>Subscription</Text>
                      <Text style={styles.menuItemSubtitle}>Premium plan & billing</Text>
                    </View>
                    <Text style={styles.chevron}>›</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Account Management */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Account</Text>
                <View style={styles.menuItems}>
                  <TouchableOpacity style={styles.simpleMenuItem}>
                    <Text style={styles.simpleMenuIcon}>📧</Text>
                    <Text style={styles.simpleMenuText}>Account Info</Text>
                    <Text style={styles.chevron}>›</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.simpleMenuItem}>
                    <Text style={styles.simpleMenuIcon}>❤️</Text>
                    <Text style={styles.simpleMenuText}>Dietary Preferences</Text>
                    <Text style={styles.chevron}>›</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.simpleMenuItem}>
                    <Text style={styles.simpleMenuIcon}>💳</Text>
                    <Text style={styles.simpleMenuText}>Payment Methods</Text>
                    <Text style={styles.chevron}>›</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Settings */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Settings</Text>
                <View style={styles.menuItems}>
                  <TouchableOpacity style={styles.simpleMenuItem}>
                    <Text style={styles.simpleMenuIcon}>🌐</Text>
                    <Text style={styles.simpleMenuText}>Language</Text>
                    <View style={styles.languageInfo}>
                      <Text style={styles.languageText}>English</Text>
                      <Text style={styles.chevron}>›</Text>
                    </View>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.simpleMenuItem}>
                    <Text style={styles.simpleMenuIcon}>⚙️</Text>
                    <Text style={styles.simpleMenuText}>App Settings</Text>
                    <Text style={styles.chevron}>›</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.simpleMenuItem}>
                    <Text style={styles.simpleMenuIcon}>🛡️</Text>
                    <Text style={styles.simpleMenuText}>Privacy & Security</Text>
                    <Text style={styles.chevron}>›</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Help & Support */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Support</Text>
                <View style={styles.menuItems}>
                  <TouchableOpacity style={styles.simpleMenuItem}>
                    <Text style={styles.simpleMenuIcon}>❓</Text>
                    <Text style={styles.simpleMenuText}>Help Center</Text>
                    <Text style={styles.chevron}>›</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.simpleMenuItem}>
                    <Text style={styles.simpleMenuIcon}>💬</Text>
                    <Text style={styles.simpleMenuText}>Contact Support</Text>
                    <Text style={styles.chevron}>›</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.simpleMenuItem}>
                    <Text style={styles.simpleMenuIcon}>💡</Text>
                    <Text style={styles.simpleMenuText}>Feature Requests</Text>
                    <Text style={styles.chevron}>›</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.simpleMenuItem}>
                    <Text style={styles.simpleMenuIcon}>⭐</Text>
                    <Text style={styles.simpleMenuText}>Rate WellNoosh</Text>
                    <Text style={styles.chevron}>›</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Legal */}
              <View style={[styles.section, { borderBottomWidth: 0 }]}>
                <View style={styles.menuItems}>
                  <TouchableOpacity style={styles.simpleMenuItem}>
                    <Text style={styles.simpleMenuIcon}>📄</Text>
                    <Text style={styles.simpleMenuText}>Privacy Policy</Text>
                    <Text style={styles.chevron}>›</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.simpleMenuItem}>
                    <Text style={styles.simpleMenuIcon}>📄</Text>
                    <Text style={styles.simpleMenuText}>Terms of Service</Text>
                    <Text style={styles.chevron}>›</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>

            {/* Footer Actions */}
            <View style={styles.footer}>
              <TouchableOpacity 
                style={styles.signOutButton}
                onPress={handleSignOut}
              >
                <Text style={styles.signOutIcon}>🚪</Text>
                <Text style={styles.signOutText}>Sign Out</Text>
              </TouchableOpacity>
              
              <Text style={styles.versionText}>
                App Version 1.2.4
              </Text>
            </View>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  menuContainer: {
    width: MENU_WIDTH,
    backgroundColor: 'white',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 20,
  },
  profileImageContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  profileImagePlaceholder: {
    fontSize: 32,
    color: 'white',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 6,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fbbf24',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  premiumIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  premiumText: {
    color: '#92400e',
    fontSize: 12,
    fontWeight: '600',
  },
  memberSince: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  menuContent: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  menuItems: {
    gap: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 16,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  simpleMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  simpleMenuIcon: {
    fontSize: 16,
    marginRight: 12,
    width: 24,
    textAlign: 'center',
  },
  simpleMenuText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  chevron: {
    fontSize: 16,
    color: '#9ca3af',
  },
  languageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageText: {
    fontSize: 14,
    color: '#6b7280',
    marginRight: 8,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    backgroundColor: '#f9fafb',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  signOutIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  signOutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#6b7280',
  },
});