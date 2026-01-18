import React, { useState, useRef, useEffect } from 'react'
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image
} from 'react-native'
import { useUserData } from '../../context/user-data-provider'
import { useAuth } from '../../context/supabase-provider'
import { mealPlanAIService, ChatMessage, UserHealthContext, GeneratedMeal } from '../../services/mealPlanAIService'
import { mealPlannerService } from '../../services/mealPlannerService'

const logoImage = require('../../../assets/logo.jpeg')

interface MealPlanChatModalProps {
  visible: boolean
  onClose: () => void
  onPlanGenerated: () => void
  weekStartDate?: Date
}

interface DisplayMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

type DayCount = 1 | 3 | 5 | 7
type MealsPerDay = 3 | 4 | 5
type FastingOption = 'none' | '16:8' | '18:6' | '20:4' | 'omad'

const FASTING_OPTIONS: { value: FastingOption; label: string; description: string; maxMeals: MealsPerDay }[] = [
  { value: 'none', label: 'None', description: 'No fasting - eat throughout the day', maxMeals: 5 },
  { value: '16:8', label: '16:8', description: 'Fast 16 hours, eat within 8 hours', maxMeals: 4 },
  { value: '18:6', label: '18:6', description: 'Fast 18 hours, eat within 6 hours', maxMeals: 3 },
  { value: '20:4', label: '20:4', description: 'Fast 20 hours, eat within 4 hours', maxMeals: 3 },
  { value: 'omad', label: 'OMAD', description: 'One Meal A Day', maxMeals: 3 }
]

const getMaxMealsForFasting = (fasting: FastingOption): MealsPerDay => {
  const option = FASTING_OPTIONS.find(o => o.value === fasting)
  return option?.maxMeals || 5
}

const isMealsCountValidForFasting = (meals: MealsPerDay, fasting: FastingOption): boolean => {
  if (fasting === 'none') return true
  if (fasting === '16:8') return meals <= 4
  if (fasting === '18:6') return meals <= 3
  if (fasting === '20:4') return meals <= 3
  if (fasting === 'omad') return meals <= 3
  return true
}

export function MealPlanChatModal({ visible, onClose, onPlanGenerated, weekStartDate }: MealPlanChatModalProps) {
  const { userData } = useUserData()
  const { session } = useAuth()
  const userId = session?.user?.id || ''
  const [messages, setMessages] = useState<DisplayMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false)
  const [dayCount, setDayCount] = useState<DayCount>(7)
  const [mealsPerDay, setMealsPerDay] = useState<MealsPerDay>(3)
  const [fastingOption, setFastingOption] = useState<FastingOption>('none')
  const scrollViewRef = useRef<ScrollView>(null)
  const [pendingMeals, setPendingMeals] = useState<GeneratedMeal[]>([])
  const [pendingSummary, setPendingSummary] = useState<string>('')
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [isSavingPlan, setIsSavingPlan] = useState(false)
  const [pendingStartDate, setPendingStartDate] = useState<Date | null>(null)
  const [selectedStartDate, setSelectedStartDate] = useState<Date>(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return today
  })

  const getSelectableDates = (): Date[] => {
    const dates: Date[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    for (let i = 0; i < 14; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      dates.push(date)
    }
    return dates
  }

  const formatDateOption = (date: Date): string => {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  const getDateRangeText = (): string => {
    const endDate = new Date(selectedStartDate)
    endDate.setDate(selectedStartDate.getDate() + dayCount - 1)
    if (dayCount === 1) {
      return formatDateOption(selectedStartDate)
    }
    return `${formatDateOption(selectedStartDate)} - ${formatDateOption(endDate)}`
  }

  const healthContext: UserHealthContext = {
    allergies: userData?.allergies,
    medicalConditions: userData?.medicalConditions,
    dietStyle: userData?.dietStyle,
    healthGoals: userData?.healthGoals,
    dailyCalorieGoal: userData?.dailyCalorieGoal,
    cookingSkill: userData?.cookingSkill
  }

  useEffect(() => {
    if (visible && messages.length === 0) {
      const greeting = buildGreeting()
      setMessages([{
        id: Date.now().toString(),
        role: 'assistant',
        content: greeting,
        timestamp: new Date()
      }])
    }
  }, [visible])

  useEffect(() => {
    if (!isMealsCountValidForFasting(mealsPerDay, fastingOption)) {
      const maxMeals = getMaxMealsForFasting(fastingOption)
      setMealsPerDay(Math.min(mealsPerDay, maxMeals) as MealsPerDay)
    }
  }, [fastingOption])

  function buildGreeting(): string {
    const userName = userData?.fullName?.split(' ')[0] || ''
    let greeting = `Hi${userName ? ` ${userName}` : ''}! Welcome to WellNoosh Meals Planner.\n\n`

    if (userData?.dietStyle || userData?.allergies?.length || userData?.healthGoals?.length || userData?.cookingSkill) {
      greeting += "I already know some things about you:\n"
      
      if (userData?.dietStyle) {
        greeting += `• Diet: ${userData.dietStyle}\n`
      }
      if (userData?.allergies && userData.allergies.length > 0) {
        greeting += `• Allergies: ${userData.allergies.join(', ')}\n`
      }
      if (userData?.healthGoals && userData.healthGoals.length > 0) {
        greeting += `• Goals: ${userData.healthGoals.join(', ')}\n`
      }
      if (userData?.cookingSkill) {
        greeting += `• Cooking skill: ${userData.cookingSkill}\n`
      }
      if (userData?.dailyCalorieGoal) {
        greeting += `• Daily calorie target: ${userData.dailyCalorieGoal} kcal\n`
      }
      
      greeting += "\n"
    }

    greeting += "Configure your plan using the options below:\n"
    greeting += "• Select how many days to plan\n"
    greeting += "• Choose meals per day (3, 4, or 5)\n"
    greeting += "• Pick a fasting schedule if desired\n"
    greeting += "• Select your start date\n\n"
    greeting += "Then tell me about any special preferences (cuisines, budget, quick meals, etc.) or just click Generate!"

    return greeting
  }

  const shouldTriggerGeneration = (message: string): boolean => {
    const generateTriggers = [
      'create my plan',
      'generate my plan',
      'make my plan',
      'create a plan',
      'generate a plan',
      'make a meal plan',
      'create meal plan',
      'generate meals',
      'plan my meals',
      "let's go",
      'go ahead',
      'yes please',
      'yes, create',
      'sounds good',
      'do it',
      'make it',
      'start planning',
      'ready to plan'
    ]
    const lowerMessage = message.toLowerCase()
    return generateTriggers.some(trigger => lowerMessage.includes(trigger))
  }

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return

    const userMessage: DisplayMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    const messageText = inputText.trim()
    setInputText('')
    setIsLoading(true)

    try {
      // Check if user wants to generate a plan - trigger generation with confirmation
      if (shouldTriggerGeneration(messageText)) {
        setIsLoading(false)
        const confirmMessage: DisplayMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `Great! I'll generate a ${dayCount}-day meal plan starting ${formatDateOption(selectedStartDate)} based on our conversation. Click the "Generate Plan" button below to start, and you'll be able to preview the meals before adding them to your calendar.`,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, confirmMessage])
        return
      }

      const chatHistory: ChatMessage[] = messages.map(m => ({
        role: m.role,
        content: m.content
      }))
      chatHistory.push({ role: 'user', content: messageText })

      const response = await mealPlanAIService.chat(userId, chatHistory, healthContext)

      const assistantMessage: DisplayMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: DisplayMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm sorry, I encountered an error. Please try again.",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const generateAndPreviewPlan = async () => {
    if (isGeneratingPlan) return

    setIsGeneratingPlan(true)

    const modeText = `I'm generating your detailed ${dayCount}-day meal plan with full recipes, ingredients, and nutrition info. This uses our advanced AI and may take a bit longer...`

    const generatingMessage: DisplayMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      content: modeText,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, generatingMessage])

    try {
      const chatHistory: ChatMessage[] = messages.map(m => ({
        role: m.role,
        content: m.content
      }))

      const startDate = new Date(selectedStartDate)
      startDate.setHours(0, 0, 0, 0)

      // Build enhanced context with fasting info
      const enhancedContext: UserHealthContext = {
        ...healthContext,
        fastingSchedule: fastingOption !== 'none' ? fastingOption : undefined,
        mealsPerDay: mealsPerDay
      }

      const result = await mealPlanAIService.generateMealPlan(
        userId,
        chatHistory,
        enhancedContext,
        startDate,
        dayCount,
        'detailed',
        mealsPerDay,
        fastingOption
      )

      if (result.meals.length > 0) {
        setPendingMeals(result.meals)
        setPendingSummary(result.summary)
        setPendingStartDate(startDate)
        setShowConfirmation(true)

        const previewMessage: DisplayMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `I've generated ${result.meals.length} meals for your ${dayCount}-day plan! Please review the suggestions below and let me know if you're happy with them or would like me to regenerate.`,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, previewMessage])
      } else {
        const noMealsMessage: DisplayMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: "I couldn't generate a meal plan. Could you tell me more about what kind of meals you'd like?",
          timestamp: new Date()
        }
        setMessages(prev => [...prev, noMealsMessage])
      }
    } catch (error) {
      console.error('Error generating meal plan:', error)
      const errorMessage: DisplayMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm sorry, I encountered an error while generating your meal plan. Please try again.",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsGeneratingPlan(false)
    }
  }

  const confirmAndSavePlan = async () => {
    if (isSavingPlan || !pendingStartDate) return
    
    setIsSavingPlan(true)
    
    try {
      await mealPlannerService.clearWeek(pendingStartDate)
      
      const mealsToSave = pendingMeals.map(meal => ({
        plan_date: meal.plan_date,
        meal_slot: meal.meal_slot,
        custom_title: meal.recipe_title || meal.name,
        notes: meal.notes,
        servings: meal.servings || 1,
        calories: meal.calories,
        protein_g: meal.protein_g,
        carbs_g: meal.carbs_g,
        fat_g: meal.fat_g,
        fiber_g: meal.fiber_g
      }))
      
      await mealPlannerService.bulkAddMeals(mealsToSave)

      const successMessage: DisplayMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Your meal plan has been saved! ${pendingSummary}\n\nI've added ${pendingMeals.length} meals to your weekly planner.`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, successMessage])
      
      setShowConfirmation(false)
      setPendingMeals([])
      setPendingSummary('')
      setPendingStartDate(null)

      setTimeout(() => {
        onPlanGenerated()
        handleClose()
      }, 2000)
    } catch (error) {
      console.error('Error saving meal plan:', error)
      const errorMessage: DisplayMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm sorry, I encountered an error while saving your meal plan. Please try again.",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsSavingPlan(false)
    }
  }

  const regeneratePlan = () => {
    setShowConfirmation(false)
    setPendingMeals([])
    setPendingSummary('')
    setPendingStartDate(null)
    
    const regenMessage: DisplayMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      content: "No problem! Tell me what you'd like to change, or I can generate a completely new plan with the same preferences.",
      timestamp: new Date()
    }
    setMessages(prev => [...prev, regenMessage])
  }

  const formatMealPreview = (meals: GeneratedMeal[]): string => {
    const groupedByDate: { [date: string]: GeneratedMeal[] } = {}
    meals.forEach(meal => {
      if (!groupedByDate[meal.plan_date]) {
        groupedByDate[meal.plan_date] = []
      }
      groupedByDate[meal.plan_date].push(meal)
    })
    
    let preview = ''
    const dates = Object.keys(groupedByDate).sort()
    
    dates.forEach((date, idx) => {
      const d = new Date(date + 'T12:00:00')
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
      preview += `\n${dayName}:\n`
      
      groupedByDate[date].forEach(meal => {
        const name = meal.recipe_title || meal.name || 'Unnamed meal'
        preview += `  • ${meal.meal_slot}: ${name}\n`
      })
    })
    
    return preview
  }

  const handleClose = () => {
    setMessages([])
    setInputText('')
    setIsLoading(false)
    setIsGeneratingPlan(false)
    setShowConfirmation(false)
    setPendingMeals([])
    setPendingSummary('')
    setPendingStartDate(null)
    setIsSavingPlan(false)
    setMealsPerDay(3)
    setFastingOption('none')
    onClose()
  }

  useEffect(() => {
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true })
      }, 100)
    }
  }, [messages])

  if (!visible) return null

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView 
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.modal}>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Image source={logoImage} style={styles.headerLogo} />
              <View>
                <Text style={styles.title}>Meal Plan Assistant</Text>
                <Text style={styles.subtitle}>Let's plan your meals together</Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          {userData?.dietStyle && (
            <View style={styles.contextBanner}>
              <Text style={styles.contextText}>
                Profile: {userData.dietStyle}
                {userData.allergies && userData.allergies.length > 0 && ` | Allergies: ${userData.allergies.join(', ')}`}
              </Text>
            </View>
          )}

          <ScrollView 
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
          >
            {messages.map((message) => (
              <View 
                key={message.id} 
                style={[
                  styles.messageBubble,
                  message.role === 'user' ? styles.userBubble : styles.assistantBubble
                ]}
              >
                <Text style={[
                  styles.messageText,
                  message.role === 'user' ? styles.userText : styles.assistantText
                ]}>
                  {message.content}
                </Text>
              </View>
            ))}

            {isLoading && (
              <View style={[styles.messageBubble, styles.assistantBubble]}>
                <ActivityIndicator size="small" color="#6B8E23" />
              </View>
            )}

            {showConfirmation && pendingMeals.length > 0 && (
              <View style={styles.mealPreviewContainer}>
                <Text style={styles.mealPreviewTitle}>Your Meal Plan Preview:</Text>
                <Text style={styles.mealPreviewText}>
                  {formatMealPreview(pendingMeals)}
                </Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.inputSection}>
            <View style={styles.optionsRow}>
              <View style={styles.optionGroup}>
                <Text style={styles.optionLabel}>Plan Duration:</Text>
                <View style={styles.toggleGroup}>
                  <TouchableOpacity
                    style={[styles.toggleBtn, dayCount === 1 && styles.toggleBtnActive]}
                    onPress={() => setDayCount(1)}
                    disabled={isGeneratingPlan}
                  >
                    <Text style={[styles.toggleText, dayCount === 1 && styles.toggleTextActive]}>1 day</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.toggleBtn, dayCount === 3 && styles.toggleBtnActive]}
                    onPress={() => setDayCount(3)}
                    disabled={isGeneratingPlan}
                  >
                    <Text style={[styles.toggleText, dayCount === 3 && styles.toggleTextActive]}>3 days</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.toggleBtn, dayCount === 5 && styles.toggleBtnActive]}
                    onPress={() => setDayCount(5)}
                    disabled={isGeneratingPlan}
                  >
                    <Text style={[styles.toggleText, dayCount === 5 && styles.toggleTextActive]}>5 days</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.toggleBtn, dayCount === 7 && styles.toggleBtnActive]}
                    onPress={() => setDayCount(7)}
                    disabled={isGeneratingPlan}
                  >
                    <Text style={[styles.toggleText, dayCount === 7 && styles.toggleTextActive]}>7 days</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.optionsRow}>
              <View style={styles.optionGroup}>
                <Text style={styles.optionLabel}>Meals per Day:</Text>
                <View style={styles.toggleGroup}>
                  <TouchableOpacity
                    style={[styles.toggleBtn, mealsPerDay === 3 && styles.toggleBtnActive]}
                    onPress={() => setMealsPerDay(3)}
                    disabled={isGeneratingPlan}
                  >
                    <Text style={[styles.toggleText, mealsPerDay === 3 && styles.toggleTextActive]}>3 meals</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.toggleBtn, 
                      mealsPerDay === 4 && styles.toggleBtnActive,
                      !isMealsCountValidForFasting(4, fastingOption) && styles.toggleBtnDisabled
                    ]}
                    onPress={() => isMealsCountValidForFasting(4, fastingOption) && setMealsPerDay(4)}
                    disabled={isGeneratingPlan || !isMealsCountValidForFasting(4, fastingOption)}
                  >
                    <Text style={[
                      styles.toggleText, 
                      mealsPerDay === 4 && styles.toggleTextActive,
                      !isMealsCountValidForFasting(4, fastingOption) && styles.toggleTextDisabled
                    ]}>4 meals</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.toggleBtn, 
                      mealsPerDay === 5 && styles.toggleBtnActive,
                      !isMealsCountValidForFasting(5, fastingOption) && styles.toggleBtnDisabled
                    ]}
                    onPress={() => isMealsCountValidForFasting(5, fastingOption) && setMealsPerDay(5)}
                    disabled={isGeneratingPlan || !isMealsCountValidForFasting(5, fastingOption)}
                  >
                    <Text style={[
                      styles.toggleText, 
                      mealsPerDay === 5 && styles.toggleTextActive,
                      !isMealsCountValidForFasting(5, fastingOption) && styles.toggleTextDisabled
                    ]}>5 meals</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.optionsRow}>
              <View style={styles.optionGroup}>
                <Text style={styles.optionLabel}>Fasting Schedule:</Text>
                <View style={styles.toggleGroup}>
                  {FASTING_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[styles.toggleBtn, fastingOption === option.value && styles.toggleBtnActive]}
                      onPress={() => setFastingOption(option.value)}
                      disabled={isGeneratingPlan}
                    >
                      <Text style={[styles.toggleText, fastingOption === option.value && styles.toggleTextActive]}>{option.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.optionsRow}>
              <View style={styles.optionGroup}>
                <Text style={styles.optionLabel}>Start Date:</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.dateScrollView}
                  contentContainerStyle={styles.dateScrollContent}
                >
                  {getSelectableDates().map((date) => {
                    const isSelected = date.toDateString() === selectedStartDate.toDateString()
                    const isToday = date.toDateString() === new Date().toDateString()
                    return (
                      <TouchableOpacity
                        key={date.toISOString()}
                        style={[styles.dateBtn, isSelected && styles.dateBtnActive, showConfirmation && styles.dateBtnDisabled]}
                        onPress={() => setSelectedStartDate(date)}
                        disabled={isGeneratingPlan || showConfirmation}
                      >
                        <Text style={[styles.dateDayText, isSelected && styles.dateDayTextActive]}>
                          {date.toLocaleDateString('en-US', { weekday: 'short' })}
                        </Text>
                        <Text style={[styles.dateNumText, isSelected && styles.dateNumTextActive]}>
                          {date.getDate()}
                        </Text>
                        {isToday && <Text style={styles.todayLabel}>Today</Text>}
                      </TouchableOpacity>
                    )
                  })}
                </ScrollView>
                <Text style={styles.dateRangeText}>
                  Plan dates: {getDateRangeText()}
                </Text>
              </View>
            </View>

            {showConfirmation ? (
              <View style={styles.confirmationButtons}>
                <TouchableOpacity 
                  style={styles.regenerateButton}
                  onPress={regeneratePlan}
                  disabled={isSavingPlan}
                >
                  <Text style={styles.regenerateButtonText}>Regenerate</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.approveButton, isSavingPlan && styles.generateButtonDisabled]}
                  onPress={confirmAndSavePlan}
                  disabled={isSavingPlan}
                >
                  {isSavingPlan ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.approveButtonText}>Add to Calendar</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                style={[
                  styles.generateButton,
                  isGeneratingPlan && styles.generateButtonDisabled
                ]}
                onPress={generateAndPreviewPlan}
                disabled={isGeneratingPlan}
              >
                {isGeneratingPlan ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <View style={styles.generateButtonContent}>
                    <Text style={styles.generateButtonIcon}>✨</Text>
                    <Text style={styles.generateButtonText}>Generate Plan for {getDateRangeText()}</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Type your message..."
                value={inputText}
                onChangeText={setInputText}
                placeholderTextColor="#9CA3AF"
                multiline
                maxLength={500}
                editable={!isLoading && !isGeneratingPlan}
              />
              <TouchableOpacity 
                style={[
                  styles.sendButton,
                  (!inputText.trim() || isLoading) && styles.sendButtonDisabled
                ]}
                onPress={sendMessage}
                disabled={!inputText.trim() || isLoading}
              >
                <Text style={styles.sendButtonText}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#FAF7F0',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '90%',
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    fontFamily: 'Inter',
  },
  subtitle: {
    fontSize: 14,
    color: '#4A4A4A',
    fontFamily: 'Inter',
  },
  closeBtn: {
    padding: 8,
  },
  closeButton: {
    fontSize: 24,
    color: '#4A4A4A',
    fontWeight: '600',
  },
  contextBanner: {
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  contextText: {
    fontSize: 12,
    color: '#6B8E23',
    fontFamily: 'Inter',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 20,
    paddingBottom: 20,
  },
  messageBubble: {
    maxWidth: '85%',
    padding: 14,
    borderRadius: 16,
    marginBottom: 12,
  },
  userBubble: {
    backgroundColor: '#6B8E23',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'Inter',
  },
  userText: {
    color: '#FFFFFF',
  },
  assistantText: {
    color: '#1A1A1A',
  },
  inputSection: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12,
  },
  optionGroup: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 6,
    fontFamily: 'Inter',
  },
  toggleGroup: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 2,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: '#6B8E23',
  },
  toggleBtnDisabled: {
    backgroundColor: '#E5E7EB',
    opacity: 0.5,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    fontFamily: 'Inter',
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  toggleTextDisabled: {
    color: '#9CA3AF',
  },
  dateScrollView: {
    marginBottom: 8,
  },
  dateScrollContent: {
    paddingRight: 12,
    gap: 8,
  },
  dateBtn: {
    width: 56,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dateBtnActive: {
    backgroundColor: '#6B8E23',
    borderColor: '#4A6D1A',
  },
  dateBtnDisabled: {
    opacity: 0.5,
  },
  dateDayText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
    fontFamily: 'Inter',
    marginBottom: 2,
  },
  dateDayTextActive: {
    color: '#FFFFFF',
  },
  dateNumText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    fontFamily: 'Inter',
  },
  dateNumTextActive: {
    color: '#FFFFFF',
  },
  todayLabel: {
    fontSize: 8,
    fontWeight: '600',
    color: '#6B8E23',
    fontFamily: 'Inter',
    marginTop: 2,
  },
  dateRangeText: {
    fontSize: 12,
    color: '#4A6D1A',
    fontFamily: 'Inter',
    fontWeight: '500',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6B8E23',
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 12,
  },
  generateButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  generateButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  generateButtonIcon: {
    fontSize: 18,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#1A1A1A',
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  sendButton: {
    backgroundColor: '#6B8E23',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sendButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  headerLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  confirmationButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  regenerateButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  regenerateButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  approveButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6B8E23',
    borderRadius: 12,
    paddingVertical: 14,
  },
  approveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  mealPreviewContainer: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#6B8E23',
  },
  mealPreviewTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  mealPreviewText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#4A4A4A',
    fontFamily: 'Inter',
  },
})
