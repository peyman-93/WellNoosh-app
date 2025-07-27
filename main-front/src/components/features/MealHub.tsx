import React from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { useNavigation } from '@react-navigation/native'

interface MealHubProps {
  showExpanded: boolean
  onToggle: () => void
}

export function MealHub({ showExpanded, onToggle }: MealHubProps) {
  const navigation = useNavigation()
  
  return (
    <View style={styles.container}>
      <Pressable style={styles.header} onPress={onToggle}>
        <View style={styles.titleRow}>
          <Text style={styles.icon}>👨‍🍳</Text>
          <Text style={styles.title}>Meal Intelligence</Text>
        </View>
        <Text style={styles.chevron}>{showExpanded ? '⌃' : '⌄'}</Text>
      </Pressable>
      
      {showExpanded && (
        <View style={styles.content}>
          {/* Today's Plan */}
          <View style={styles.todaysPlan}>
            <Text style={styles.sectionTitle}>Today's Plan</Text>
            <Text style={styles.planText}>✅ Breakfast: Avocado Toast (8:30 AM)</Text>
            <Text style={styles.planText}>🍽️ Lunch: Quinoa Bowl (1:00 PM)</Text>
            <Text style={styles.planText}>🥘 Dinner: Salmon & Veggies (7:30 PM)</Text>
          </View>
          
          {/* Quick Suggestions */}
          <View style={styles.suggestionsGrid}>
            <Pressable style={styles.suggestionCard}>
              <Text style={styles.suggestionIcon}>🍳</Text>
              <Text style={styles.suggestionLabel}>Breakfast</Text>
            </Pressable>
            
            <Pressable style={styles.suggestionCard}>
              <Text style={styles.suggestionIcon}>🥗</Text>
              <Text style={styles.suggestionLabel}>Lunch</Text>
            </Pressable>
            
            <Pressable style={styles.suggestionCard}>
              <Text style={styles.suggestionIcon}>🍽️</Text>
              <Text style={styles.suggestionLabel}>Dinner</Text>
            </Pressable>
            
            <Pressable style={styles.suggestionCard}>
              <Text style={styles.suggestionIcon}>🍎</Text>
              <Text style={styles.suggestionLabel}>Snacks</Text>
            </Pressable>
            
            <Pressable style={styles.suggestionCard}>
              <Text style={styles.suggestionIcon}>🥤</Text>
              <Text style={styles.suggestionLabel}>Drinks</Text>
            </Pressable>
          </View>
          
          {/* Cooking Time */}
          <View style={styles.cookingTime}>
            <Text style={styles.sectionTitle}>Cooking Time Available</Text>
            <View style={styles.timeGrid}>
              <View style={styles.timeItem}>
                <Text style={styles.timeLabel}>Weekdays</Text>
                <Text style={styles.timeValue}>30-45 min</Text>
              </View>
              <View style={styles.timeItem}>
                <Text style={styles.timeLabel}>Weekends</Text>
                <Text style={styles.timeValue}>60+ min</Text>
              </View>
              <View style={styles.timeItem}>
                <Text style={styles.timeLabel}>Busy Days</Text>
                <Text style={styles.timeValue}>15-30 min</Text>
              </View>
            </View>
          </View>
          
          <Pressable 
            style={styles.openPlannerButton}
            onPress={() => navigation.navigate('Planner' as never)}
          >
            <Text style={styles.openPlannerText}>Open Meal Planner</Text>
          </Pressable>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    fontSize: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    fontFamily: 'System',
  },
  chevron: {
    fontSize: 16,
    color: '#6B7280',
  },
  content: {
    marginTop: 16,
    gap: 16,
  },
  todaysPlan: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    fontFamily: 'System',
    marginBottom: 8,
  },
  planText: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'System',
    lineHeight: 20,
  },
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    minWidth: 60,
  },
  suggestionIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  suggestionLabel: {
    fontSize: 11,
    color: '#1F2937',
    fontFamily: 'System',
  },
  cookingTime: {
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
    padding: 12,
  },
  timeGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeItem: {
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F97316',
    fontFamily: 'System',
  },
  timeValue: {
    fontSize: 11,
    color: '#6B7280',
    fontFamily: 'System',
  },
  openPlannerButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  openPlannerText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
  },
})