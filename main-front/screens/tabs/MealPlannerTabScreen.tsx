import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { ScreenWrapper } from '../../src/components/layout/ScreenWrapper'
import { mealPlannerService, MealPlanEntry, MealSlot } from '../../src/services/mealPlannerService'
import { MealPlanChatModal } from '../../src/components/modals/MealPlanChatModal'
import { MealDetailModal } from '../../src/components/modals/MealDetailModal'

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
  const [selectedMeal, setSelectedMeal] = useState<MealPlanEntry | null>(null)
  const [showMealDetail, setShowMealDetail] = useState(false)
  
  const currentDate = new Date()
  currentDate.setHours(0, 0, 0, 0)
  
  const startDate = new Date(currentDate)
  startDate.setDate(currentDate.getDate() + (currentWeek * 7))
  
  const weekDays = []
  for (let i = 0; i < 7; i++) {
    const day = new Date(startDate)
    day.setDate(startDate.getDate() + i)
    weekDays.push({
      date: day,
      dateStr: day.toISOString().split('T')[0],
      dayName: day.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNumber: day.getDate(),
      isToday: day.toDateString() === new Date().toDateString()
    })
  }
  
  const startOfWeek = startDate

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
    setSelectedMeal(meal)
    setShowMealDetail(true)
  }

  const handleMealCooked = async (mealId: string) => {
    try {
      await mealPlannerService.markMealAsCooked(mealId)
      setMealPlan(prev => prev.map(m => 
        m.id === mealId ? { ...m, is_completed: true } : m
      ))
    } catch (error) {
      console.error('Error marking meal as cooked:', error)
    }
  }

  const handleMealRemovedFromModal = async (mealId: string) => {
    await handleRemoveMeal(mealId)
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
                  <TouchableOpacity 
                    style={styles.wellnooshCard}
                    onPress={() => setShowChatModal(true)}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#6B8E23', '#556B2F']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.wellnooshGradient}
                    >
                      <View style={styles.wellnooshIconContainer}>
                        <Text style={styles.wellnooshMainIcon}>🥗</Text>
                      </View>
                      <Text style={styles.wellnooshTitle}>WellNoosh Meals Planner</Text>
                      <Text style={styles.wellnooshDescription}>
                        Tap to chat with our AI and create a personalized meal plan based on your health profile, goals, and preferences.
                      </Text>
                      <View style={styles.wellnooshFeatures}>
                        <View style={styles.featureItem}>
                          <Text style={styles.featureIcon}>✓</Text>
                          <Text style={styles.featureText}>Based on your profile</Text>
                        </View>
                        <View style={styles.featureItem}>
                          <Text style={styles.featureIcon}>✓</Text>
                          <Text style={styles.featureText}>Respects allergies</Text>
                        </View>
                        <View style={styles.featureItem}>
                          <Text style={styles.featureIcon}>✓</Text>
                          <Text style={styles.featureText}>Meets your goals</Text>
                        </View>
                      </View>
                      <View style={styles.startChatButton}>
                        <Text style={styles.startChatText}>Start Planning</Text>
                        <Text style={styles.startChatArrow}>→</Text>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
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
                    <TouchableOpacity 
                      style={styles.regenerateButton}
                      onPress={() => setShowChatModal(true)}
                    >
                      <Text style={styles.regenerateButtonIcon}>🥗</Text>
                      <Text style={styles.regenerateButtonText}>Update Plan with AI</Text>
                    </TouchableOpacity>
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

      <MealDetailModal
        visible={showMealDetail}
        onClose={() => {
          setShowMealDetail(false)
          setSelectedMeal(null)
        }}
        meal={selectedMeal}
        onMealCooked={handleMealCooked}
        onMealRemoved={handleMealRemovedFromModal}
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
  wellnooshCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#6B8E23',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  wellnooshGradient: {
    padding: 24,
    alignItems: 'center',
  },
  wellnooshIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  wellnooshMainIcon: {
    fontSize: 40,
  },
  wellnooshTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  wellnooshDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
    fontFamily: 'Inter',
    paddingHorizontal: 10,
  },
  wellnooshFeatures: {
    width: '100%',
    marginBottom: 20,
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureIcon: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  featureText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.95)',
    fontFamily: 'Inter',
  },
  startChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 25,
    gap: 10,
  },
  startChatText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  startChatArrow: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
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
  regenerateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6B8E23',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 16,
    gap: 8,
  },
  regenerateButtonIcon: {
    fontSize: 18,
  },
  regenerateButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
})
