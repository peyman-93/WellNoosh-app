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
  ActivityIndicator
} from 'react-native'
import { useUserData } from '../../context/user-data-provider'
import { mealPlanAIService, ChatMessage, UserHealthContext } from '../../services/mealPlanAIService'
import { mealPlannerService, CreateMealPlanEntry } from '../../services/mealPlannerService'

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

export function MealPlanChatModal({ visible, onClose, onPlanGenerated, weekStartDate }: MealPlanChatModalProps) {
  const { userData } = useUserData()
  const [messages, setMessages] = useState<DisplayMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false)
  const scrollViewRef = useRef<ScrollView>(null)

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

  function buildGreeting(): string {
    let greeting = "Hi! I'm your AI meal planning assistant. "

    if (userData?.dietStyle || userData?.allergies?.length || userData?.healthGoals?.length) {
      greeting += "I can see from your profile that "
      const parts: string[] = []
      
      if (userData?.dietStyle) {
        parts.push(`you follow a ${userData.dietStyle} diet`)
      }
      if (userData?.allergies && userData.allergies.length > 0) {
        parts.push(`you have allergies to ${userData.allergies.join(', ')}`)
      }
      if (userData?.healthGoals && userData.healthGoals.length > 0) {
        parts.push(`your goals include ${userData.healthGoals.join(', ')}`)
      }
      
      greeting += parts.join(' and ') + ". "
    }

    greeting += "\n\nHow can I help you plan your meals this week? You can tell me things like:\n"
    greeting += "- \"I want easy weeknight dinners\"\n"
    greeting += "- \"Plan meals for weight loss\"\n"
    greeting += "- \"I need quick breakfast ideas\"\n"
    greeting += "- \"Create a balanced weekly plan\"\n\n"
    greeting += "Just let me know what you're looking for!"

    return greeting
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
    setInputText('')
    setIsLoading(true)

    try {
      const chatHistory: ChatMessage[] = messages.map(m => ({
        role: m.role,
        content: m.content
      }))
      chatHistory.push({ role: 'user', content: userMessage.content })

      const response = await mealPlanAIService.chat(chatHistory, healthContext)

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

  const generateAndSavePlan = async () => {
    if (isGeneratingPlan) return

    setIsGeneratingPlan(true)

    const generatingMessage: DisplayMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      content: "Perfect! I'm now generating your personalized meal plan based on our conversation. This may take a moment...",
      timestamp: new Date()
    }
    setMessages(prev => [...prev, generatingMessage])

    try {
      const chatHistory: ChatMessage[] = messages.map(m => ({
        role: m.role,
        content: m.content
      }))

      const startOfWeek = weekStartDate ? new Date(weekStartDate) : (() => {
        const today = new Date()
        today.setDate(today.getDate() - today.getDay())
        today.setHours(0, 0, 0, 0)
        return today
      })()

      const result = await mealPlanAIService.generateMealPlan(
        chatHistory,
        healthContext,
        startOfWeek,
        7
      )

      if (result.meals.length > 0) {
        await mealPlannerService.clearWeek(startOfWeek)
        await mealPlannerService.bulkAddMeals(result.meals)

        const successMessage: DisplayMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `Your meal plan has been saved! ${result.summary}\n\nI've added ${result.meals.length} meals to your weekly planner. You can view and edit them in the Meal Planner tab.`,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, successMessage])

        setTimeout(() => {
          onPlanGenerated()
          handleClose()
        }, 2000)
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

  const handleClose = () => {
    setMessages([])
    setInputText('')
    setIsLoading(false)
    setIsGeneratingPlan(false)
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
              <Text style={styles.headerIcon}>🤖</Text>
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
          </ScrollView>

          <View style={styles.inputSection}>
            <TouchableOpacity 
              style={[
                styles.generateButton,
                (isGeneratingPlan || messages.length < 2) && styles.generateButtonDisabled
              ]}
              onPress={generateAndSavePlan}
              disabled={isGeneratingPlan || messages.length < 2}
            >
              {isGeneratingPlan ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.generateButtonIcon}>✨</Text>
                  <Text style={styles.generateButtonText}>Generate Plan</Text>
                </>
              )}
            </TouchableOpacity>

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
  headerIcon: {
    fontSize: 32,
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
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6B8E23',
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 12,
    gap: 8,
  },
  generateButtonDisabled: {
    backgroundColor: '#D1D5DB',
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
})
