import React from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { useNavigation } from '@react-navigation/native'

export function QuickActions() {
  const navigation = useNavigation()
  
  const actions = [
    {
      id: 'community',
      icon: '👥',
      title: 'Community',
      subtitle: 'Join challenges',
      color: '#8B5CF6',
      bgColor: '#F3E8FF',
    },
    {
      id: 'scan',
      icon: '📸',
      title: 'Zero-Left Chief',
      subtitle: 'Track your food',
      color: '#F97316',
      bgColor: '#FFF7ED',
    },
    {
      id: 'schedule',
      icon: '📅',
      title: 'Meal Plan',
      subtitle: 'Weekly schedule',
      color: '#10B981',
      bgColor: '#F0FDF4',
    },
    {
      id: 'shop',
      icon: '🛒',
      title: 'Groceries',
      subtitle: 'Smart lists',
      color: '#EC4899',
      bgColor: '#FDF2F8',
    },
  ]
  
  const handlePress = (actionId: string) => {
    // Navigate to appropriate tab
    switch(actionId) {
      case 'community':
        navigation.navigate('Community' as never)
        break
      case 'schedule':
        navigation.navigate('Planner' as never)
        break
      case 'shop':
        navigation.navigate('GroceryList' as never)
        break
      case 'scan':
        // TODO: Implement scan functionality
        break
    }
  }
  
  return (
    <View style={styles.container}>
      {actions.map((action) => (
        <Pressable
          key={action.id}
          style={[styles.actionCard, { backgroundColor: action.bgColor }]}
          onPress={() => handlePress(action.id)}
        >
          <View style={[styles.iconContainer, { backgroundColor: action.color }]}>
            <Text style={styles.icon}>{action.icon}</Text>
          </View>
          <Text style={styles.title}>{action.title}</Text>
          <Text style={styles.subtitle}>{action.subtitle}</Text>
        </Pressable>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    minWidth: '47%',
    padding: 16,
    borderRadius: 20,
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  icon: {
    fontSize: 24,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    fontFamily: 'System',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'System',
  },
})