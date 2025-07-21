import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function Navigation({ activeTab, onTabChange }: NavigationProps) {
  const tabs = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'cuisines', label: 'Cuisines', icon: '🍽️' },
    { id: 'scan', label: 'Tracker', icon: '📊' },
    { id: 'shop', label: 'Smart List', icon: '🛒' },
    { id: 'community', label: 'Community', icon: '👥' },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={styles.tab}
          onPress={() => onTabChange(tab.id)}
        >
          <Text style={[
            styles.icon,
            activeTab === tab.id && styles.activeIcon
          ]}>
            {tab.icon}
          </Text>
          <Text style={[
            styles.label,
            activeTab === tab.id && styles.activeLabel
          ]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
    paddingBottom: 20,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  icon: {
    fontSize: 20,
    marginBottom: 4,
  },
  activeIcon: {
    opacity: 1,
  },
  label: {
    fontSize: 12,
    color: '#6b7280',
  },
  activeLabel: {
    color: '#2563eb',
    fontWeight: '600',
  },
});