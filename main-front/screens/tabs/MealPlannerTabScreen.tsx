import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { ScreenWrapper } from '../../src/components/layout/ScreenWrapper'
import { mealPlannerService, MealPlanEntry, MealSlot } from '../../src/services/mealPlannerService'
import { MealPlanChatModal } from '../../src/components/modals/MealPlanChatModal'

const MEAL_SLOTS: { key: MealSlot; label: string; icon: string }[] = [
  { key: 'breakfast', label: 'Breakfast', icon: '🌅' },
  { key: 'lunch', label: 'Lunch', icon: '☀️' },
  { key: 'dinner', label: 'Dinner', icon: '🌙' },
  { key: 'snack', label: 'Snack', icon: '🍎' },
]

export default function MealPlannerTabScreen() {
  const [currentWeek, setCurrentWeek] = useState(0)
  const [mealPlan, setMealPlan] = useState<MealPlanEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showChatModal, setShowChatModal] = useState(false)
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  
  const currentDate = new Date()
  const startOfWeek = new Date(currentDate)
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + (currentWeek * 7))
  startOfWeek.setHours(0, 0, 0, 0)
  
  const weekDays = []
  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek)
    day.setDate(startOfWeek.getDate() + i)
    weekDays.push({
      date: day,
      dateStr: day.toISOString().split('T')[0],
      dayName: day.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNumber: day.getDate(),
      isToday: day.toDateString() === currentDate.toDateString()
    })
  }

  const loadMealPlan = useCallback(async () => {
    try {
      const data = await mealPlannerService.getMealPlanForWeek(startOfWeek)
      setMealPlan(data)
    } catch (error) {
      console.error('Error loading meal plan:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [startOfWeek.toISOString()])

  useEffect(() => {
    setLoading(true)
    loadMealPlan()
  }, [currentWeek])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    loadMealPlan()
  }, [loadMealPlan])

  const getMealForSlot = (dateStr: string, slot: MealSlot): MealPlanEntry | undefined => {
    return mealPlan.find(m => m.plan_date === dateStr && m.meal_slot === slot)
  }

  const handleRemoveMeal = async (mealId: string) => {
    try {
      await mealPlannerService.removeMealSlot(mealId)
      setMealPlan(prev => prev.filter(m => m.id !== mealId))
    } catch (error) {
      console.error('Error removing meal:', error)
      Alert.alert('Error', 'Failed to remove meal')
    }
  }

  const handleMealPress = (meal: MealPlanEntry) => {
    Alert.alert(
      meal.custom_title || meal.recipe_title || 'Meal',
      meal.notes || 'No notes',
      [
        { text: 'OK', style: 'default' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => handleRemoveMeal(meal.id)
        }
      ]
    )
  }

  const handlePlanGenerated = () => {
    loadMealPlan()
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

  const hasMealsForWeek = mealPlan.length > 0

  return (
    <ScreenWrapper>
      <LinearGradient colors={['#FAF7F0', '#F5F5F0']} style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerTitle}>Meal Planner</Text>
              <Text style={styles.headerSubtitle}>Plan your weekly meals</Text>
            </View>
            <TouchableOpacity 
              style={styles.generateBtn}
              onPress={() => setShowChatModal(true)}
            >
              <Text style={styles.generateBtnIcon}>🤖</Text>
              <Text style={styles.generateBtnText}>AI Plan</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
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

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#6B8E23" />
              <Text style={styles.loadingText}>Loading meal plan...</Text>
            </View>
          ) : (
            <>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.weekScrollContainer}
              >
                {weekDays.map((day, index) => (
                  <View key={index} style={styles.dayColumn}>
                    <View style={[styles.dayHeader, day.isToday && styles.todayHeader]}>
                      <Text style={[styles.dayName, day.isToday && styles.todayText]}>
                        {day.dayName}
                      </Text>
                      <Text style={[styles.dayNumber, day.isToday && styles.todayText]}>
                        {day.dayNumber}
                      </Text>
                    </View>
                    
                    <View style={styles.mealsList}>
                      {MEAL_SLOTS.map((slot) => {
                        const meal = getMealForSlot(day.dateStr, slot.key)
                        return (
                          <View key={slot.key} style={styles.mealSlotContainer}>
                            <Text style={styles.mealType}>{slot.label}</Text>
                            {meal ? (
                              <TouchableOpacity 
                                style={styles.mealCard}
                                onPress={() => handleMealPress(meal)}
                              >
                                <Text style={styles.mealTitle} numberOfLines={2}>
                                  {meal.custom_title || meal.recipe_title || 'Meal'}
                                </Text>
                              </TouchableOpacity>
                            ) : (
                              <View style={styles.mealPlaceholder}>
                                <Text style={styles.mealPlaceholderIcon}>{slot.icon}</Text>
                              </View>
                            )}
                          </View>
                        )
                      })}
                    </View>
                  </View>
                ))}
              </ScrollView>

              {!hasMealsForWeek && (
                <View style={styles.emptyStateContainer}>
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyIcon}>📅</Text>
                    <Text style={styles.emptyTitle}>No meals planned</Text>
                    <Text style={styles.emptyDescription}>
                      Use the AI assistant to generate a personalized meal plan for this week.
                    </Text>
                    <TouchableOpacity 
                      style={styles.emptyButton}
                      onPress={() => setShowChatModal(true)}
                    >
                      <Text style={styles.emptyButtonIcon}>🤖</Text>
                      <Text style={styles.emptyButtonText}>Generate Meal Plan</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {hasMealsForWeek && (
                <View style={styles.summaryContainer}>
                  <View style={styles.summaryCard}>
                    <Text style={styles.summaryTitle}>This Week</Text>
                    <View style={styles.summaryRow}>
                      <View style={styles.summaryItem}>
                        <Text style={styles.summaryNumber}>{mealPlan.length}</Text>
                        <Text style={styles.summaryLabel}>Meals Planned</Text>
                      </View>
                      <View style={styles.summaryDivider} />
                      <View style={styles.summaryItem}>
                        <Text style={styles.summaryNumber}>
                          {new Set(mealPlan.map(m => m.plan_date)).size}
                        </Text>
                        <Text style={styles.summaryLabel}>Days Covered</Text>
                      </View>
                    </View>
                  </View>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </LinearGradient>

      <MealPlanChatModal
        visible={showChatModal}
        onClose={() => setShowChatModal(false)}
        onPlanGenerated={handlePlanGenerated}
        weekStartDate={startOfWeek}
      />
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6B8E23',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  generateBtnIcon: {
    fontSize: 16,
  },
  generateBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
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
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#4A4A4A',
    fontFamily: 'Inter',
  },
  weekScrollContainer: {
    paddingHorizontal: 16,
    gap: 10,
  },
  dayColumn: {
    width: 110,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  dayHeader: {
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  todayHeader: {
    backgroundColor: '#6B8E23',
  },
  dayName: {
    fontSize: 13,
    color: '#4A4A4A',
    fontWeight: '500',
    fontFamily: 'Inter',
  },
  dayNumber: {
    fontSize: 18,
    color: '#1A1A1A',
    fontWeight: '600',
    fontFamily: 'Inter',
    marginTop: 2,
  },
  todayText: {
    color: '#FFFFFF',
  },
  mealsList: {
    gap: 10,
  },
  mealSlotContainer: {
    alignItems: 'center',
  },
  mealType: {
    fontSize: 11,
    color: '#4A4A4A',
    fontFamily: 'Inter',
    marginBottom: 6,
  },
  mealCard: {
    width: '100%',
    backgroundColor: '#F8FAF5',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#6B8E23',
    minHeight: 44,
    justifyContent: 'center',
  },
  mealTitle: {
    fontSize: 11,
    color: '#1A1A1A',
    fontFamily: 'Inter',
    textAlign: 'center',
    fontWeight: '500',
  },
  mealPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  mealPlaceholderIcon: {
    fontSize: 18,
    opacity: 0.5,
  },
  emptyStateContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  emptyCard: {
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
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  emptyDescription: {
    fontSize: 14,
    color: '#4A4A4A',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    fontFamily: 'Inter',
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6B8E23',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  emptyButtonIcon: {
    fontSize: 18,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  summaryContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Inter',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#6B8E23',
    fontFamily: 'Inter',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#4A4A4A',
    fontFamily: 'Inter',
    marginTop: 4,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E0E0E0',
  },
})
