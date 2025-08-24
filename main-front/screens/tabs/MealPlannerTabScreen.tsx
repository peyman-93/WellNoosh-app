import React, { useState } from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { ScreenWrapper } from '../../src/components/layout/ScreenWrapper'

export default function MealPlannerTabScreen() {
  const [currentWeek, setCurrentWeek] = useState(0)
  
  const currentDate = new Date()
  const startOfWeek = new Date(currentDate)
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + (currentWeek * 7))
  
  const weekDays = []
  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek)
    day.setDate(startOfWeek.getDate() + i)
    weekDays.push({
      date: day,
      dayName: day.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNumber: day.getDate(),
      isToday: day.toDateString() === currentDate.toDateString()
    })
  }

  const goToPreviousWeek = () => {
    setCurrentWeek(prev => prev - 1)
  }

  const goToNextWeek = () => {
    setCurrentWeek(prev => prev + 1)
  }

  const goToCurrentWeek = () => {
    setCurrentWeek(0)
  }

  return (
    <ScreenWrapper>
      <LinearGradient colors={['#FAF7F0', '#F5F5F0']} style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Meal Planner</Text>
          <Text style={styles.headerSubtitle}>Plan your weekly meals</Text>
        </View>

        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
        >
          {/* Week Navigation */}
          <View style={styles.weekNavigation}>
            <TouchableOpacity onPress={goToPreviousWeek} style={styles.navButton}>
              <Text style={styles.navButtonText}>‹</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={goToCurrentWeek} style={styles.weekTitleContainer}>
              <Text style={styles.weekTitle}>
                {startOfWeek.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </Text>
              <Text style={styles.weekSubtitle}>
                {weekDays[0].date.getDate()}-{weekDays[6].date.getDate()}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={goToNextWeek} style={styles.navButton}>
              <Text style={styles.navButtonText}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Week View */}
          <View style={styles.weekContainer}>
            {weekDays.map((day, index) => (
              <View key={index} style={styles.dayContainer}>
                <View style={[styles.dayHeader, day.isToday && styles.todayHeader]}>
                  <Text style={[styles.dayName, day.isToday && styles.todayText]}>
                    {day.dayName}
                  </Text>
                  <Text style={[styles.dayNumber, day.isToday && styles.todayText]}>
                    {day.dayNumber}
                  </Text>
                </View>
                
                {/* Meal Placeholders */}
                <View style={styles.mealsList}>
                  {['Breakfast', 'Lunch', 'Dinner'].map((mealType, mealIndex) => (
                    <View key={mealIndex} style={styles.mealSlot}>
                      <Text style={styles.mealType}>{mealType}</Text>
                      <View style={styles.mealPlaceholder}>
                        <Text style={styles.mealPlaceholderIcon}>🍽️</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>

          {/* Main Placeholder */}
          <View style={styles.mainPlaceholderContainer}>
            <View style={styles.placeholderCard}>
              <View style={styles.placeholderIconContainer}>
                <Text style={styles.placeholderIcon}>📅</Text>
              </View>
              <Text style={styles.placeholderTitle}>Meal Planning Coming Soon!</Text>
              <Text style={styles.placeholderDescription}>
                We're building an amazing meal planning experience that will help you organize your weekly meals, 
                generate smart meal plans, and make grocery shopping effortless.
              </Text>
              
              <View style={styles.featuresList}>
                <View style={styles.featureItem}>
                  <Text style={styles.featureIcon}>🤖</Text>
                  <Text style={styles.featureText}>AI-Generated Meal Plans</Text>
                </View>
                <View style={styles.featureItem}>
                  <Text style={styles.featureIcon}>📋</Text>
                  <Text style={styles.featureText}>Auto-Generated Grocery Lists</Text>
                </View>
                <View style={styles.featureItem}>
                  <Text style={styles.featureIcon}>🍎</Text>
                  <Text style={styles.featureText}>Nutrition-Optimized Meals</Text>
                </View>
                <View style={styles.featureItem}>
                  <Text style={styles.featureIcon}>📱</Text>
                  <Text style={styles.featureText}>Drag & Drop Planning</Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </ScreenWrapper>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: 'transparent',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    fontFamily: 'Inter',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#4A4A4A',
    fontFamily: 'Inter',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  weekNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 20,
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonText: {
    fontSize: 20,
    color: '#4A4A4A',
    fontWeight: '600',
  },
  weekTitleContainer: {
    alignItems: 'center',
  },
  weekTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Inter',
  },
  weekSubtitle: {
    fontSize: 14,
    color: '#4A4A4A',
    fontFamily: 'Inter',
  },
  weekContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 24,
  },
  dayContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  dayHeader: {
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  todayHeader: {
    backgroundColor: '#6B8E23',
  },
  dayName: {
    fontSize: 12,
    color: '#4A4A4A',
    fontWeight: '500',
    fontFamily: 'Inter',
  },
  dayNumber: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '600',
    fontFamily: 'Inter',
    marginTop: 2,
  },
  todayText: {
    color: '#FFFFFF',
  },
  mealsList: {
    gap: 6,
  },
  mealSlot: {
    alignItems: 'center',
  },
  mealType: {
    fontSize: 10,
    color: '#4A4A4A',
    fontFamily: 'Inter',
    marginBottom: 4,
  },
  mealPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  mealPlaceholderIcon: {
    fontSize: 14,
    opacity: 0.5,
  },
  mainPlaceholderContainer: {
    paddingHorizontal: 20,
  },
  placeholderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  placeholderIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  placeholderIcon: {
    fontSize: 28,
  },
  placeholderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  placeholderDescription: {
    fontSize: 14,
    color: '#4A4A4A',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    fontFamily: 'Inter',
  },
  featuresList: {
    alignSelf: 'stretch',
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F8FAF5',
    borderRadius: 8,
  },
  featureIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#1A1A1A',
    fontFamily: 'Inter',
  },
})