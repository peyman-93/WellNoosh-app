import React, { useState, useCallback } from 'react'
import { View, Text, Modal, TouchableOpacity, ScrollView, TextInput, StyleSheet } from 'react-native'

interface AddMealModalProps {
  visible: boolean
  onClose: () => void
  onSave: (mealData: any) => void
}

interface MealData {
  type: string
  title: string
  description: string
  calories: string
  time: string
  drinkOptions: {
    withSugar: boolean
    withMilk: boolean
    size: string
  }
  isRecording: boolean
  recordedText: string
}

export function AddMealModal({ visible, onClose, onSave }: AddMealModalProps) {
  const [mealData, setMealData] = useState<MealData>({
    type: '',
    title: '',
    description: '',
    calories: '',
    time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
    drinkOptions: {
      withSugar: false,
      withMilk: false,
      size: 'medium'
    },
    isRecording: false,
    recordedText: ''
  })

  const foodCategories = [
    {
      title: "MEALS",
      items: [
        { id: 'breakfast', label: 'Breakfast', icon: '🌅' },
        { id: 'lunch', label: 'Lunch', icon: '☀️' },
        { id: 'dinner', label: 'Dinner', icon: '🌙' },
        { id: 'brunch', label: 'Brunch', icon: '🥞' }
      ]
    },
    {
      title: "SNACKS",
      items: [
        { id: 'snack', label: 'Snack', icon: '🥜' },
        { id: 'light-snack', label: 'Light Snack', icon: '🍎' },
        { id: 'protein-snack', label: 'Protein Snack', icon: '🥩' }
      ]
    },
    {
      title: "BEVERAGES",
      items: [
        { id: 'water', label: 'Water', icon: '💧' },
        { id: 'coffee', label: 'Coffee', icon: '☕' },
        { id: 'tea', label: 'Tea', icon: '🍵' },
        { id: 'soda', label: 'Soda', icon: '🥤' },
        { id: 'juice', label: 'Juice', icon: '🧃' },
        { id: 'energy-drink', label: 'Energy Drink', icon: '⚡' },
        { id: 'smoothie', label: 'Smoothie', icon: '🥤' },
        { id: 'sports-drink', label: 'Sports Drink', icon: '🏃' }
      ]
    },
    {
      title: "ALCOHOL",
      items: [
        { id: 'beer', label: 'Beer', icon: '🍺' },
        { id: 'wine', label: 'Wine', icon: '🍷' },
        { id: 'cocktail', label: 'Cocktail', icon: '🍸' },
        { id: 'spirits', label: 'Spirits', icon: '🥃' }
      ]
    },
    {
      title: "DESSERTS",
      items: [
        { id: 'dessert', label: 'Dessert', icon: '🍰' },
        { id: 'ice-cream', label: 'Ice Cream', icon: '🍦' },
        { id: 'cake', label: 'Cake', icon: '🎂' },
        { id: 'pastry', label: 'Pastry', icon: '🥐' }
      ]
    },
    {
      title: "FAST FOOD",
      items: [
        { id: 'fast-food', label: 'Fast Food', icon: '🍟' },
        { id: 'pizza', label: 'Pizza', icon: '🍕' },
        { id: 'burger', label: 'Burger', icon: '🍔' }
      ]
    },
    {
      title: "SUPPLEMENTS",
      items: [
        { id: 'supplement', label: 'Supplement', icon: '💊' },
        { id: 'protein-shake', label: 'Protein Shake', icon: '🥤' },
        { id: 'vitamins', label: 'Vitamins', icon: '💊' }
      ]
    },
    {
      title: "OTHER",
      items: [
        { id: 'gum', label: 'Gum', icon: '🍬' },
        { id: 'candy', label: 'Candy', icon: '🍭' }
      ]
    }
  ]

  const updateMealType = useCallback((type: string) => {
    setMealData(prev => ({ ...prev, type }))
  }, [])

  const updateDrinkOption = useCallback((option: string, value: any) => {
    setMealData(prev => ({
      ...prev,
      drinkOptions: { ...prev.drinkOptions, [option]: value }
    }))
  }, [])

  const handleStartRecording = useCallback(() => {
    setMealData(prev => ({ ...prev, isRecording: true }))
    // Simulate voice recording
    setTimeout(() => {
      setMealData(prev => ({ 
        ...prev, 
        isRecording: false,
        recordedText: "I had a delicious grilled chicken salad with avocado and mixed greens"
      }))
    }, 3000)
  }, [])

  const handleSave = useCallback(() => {
    if (mealData.type || mealData.title || mealData.description || mealData.recordedText) {
      onSave(mealData)
      
      // Reset form
      setMealData({
        type: '',
        title: '',
        description: '',
        calories: '',
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
        drinkOptions: {
          withSugar: false,
          withMilk: false,
          size: 'medium'
        },
        isRecording: false,
        recordedText: ''
      })
      
      onClose()
    }
  }, [mealData, onSave, onClose])

  const handleClose = useCallback(() => {
    // Reset form when closing
    setMealData({
      type: '',
      title: '',
      description: '',
      calories: '',
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      drinkOptions: {
        withSugar: false,
        withMilk: false,
        size: 'medium'
      },
      isRecording: false,
      recordedText: ''
    })
    onClose()
  }, [onClose])

  if (!visible) return null

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modal}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Add Food Entry</Text>
              <TouchableOpacity onPress={handleClose}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Food Categories */}
            {foodCategories.map((category, categoryIndex) => (
              <View key={categoryIndex} style={styles.section}>
                <Text style={styles.sectionTitle}>{category.title}</Text>
                <View style={styles.categoryGrid}>
                  {category.items.map(item => (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.categoryItem,
                        mealData.type === item.id && styles.categoryItemSelected
                      ]}
                      onPress={() => updateMealType(item.id)}
                    >
                      <Text style={styles.categoryItemIcon}>{item.icon}</Text>
                      <Text style={[
                        styles.categoryItemLabel,
                        mealData.type === item.id && styles.categoryItemLabelSelected
                      ]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}

            {/* Drink Options */}
            {['coffee', 'tea', 'soda', 'smoothie'].includes(mealData.type) && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>DRINK OPTIONS</Text>
                <View style={styles.drinkOptionsContainer}>
                  <TouchableOpacity
                    style={[
                      styles.drinkOption,
                      mealData.drinkOptions.withSugar && styles.drinkOptionSelected
                    ]}
                    onPress={() => updateDrinkOption('withSugar', !mealData.drinkOptions.withSugar)}
                  >
                    <Text style={styles.drinkOptionText}>With Sugar</Text>
                    {mealData.drinkOptions.withSugar && (
                      <Text style={styles.drinkOptionCheck}>✓</Text>
                    )}
                  </TouchableOpacity>
                  
                  {['coffee', 'tea'].includes(mealData.type) && (
                    <TouchableOpacity
                      style={[
                        styles.drinkOption,
                        mealData.drinkOptions.withMilk && styles.drinkOptionSelected
                      ]}
                      onPress={() => updateDrinkOption('withMilk', !mealData.drinkOptions.withMilk)}
                    >
                      <Text style={styles.drinkOptionText}>With Milk</Text>
                      {mealData.drinkOptions.withMilk && (
                        <Text style={styles.drinkOptionCheck}>✓</Text>
                      )}
                    </TouchableOpacity>
                  )}
                  
                  <View style={styles.sizeContainer}>
                    <Text style={styles.sizeLabel}>Size:</Text>
                    {['small', 'medium', 'large'].map(size => (
                      <TouchableOpacity
                        key={size}
                        style={[
                          styles.sizeOption,
                          mealData.drinkOptions.size === size && styles.sizeOptionSelected
                        ]}
                        onPress={() => updateDrinkOption('size', size)}
                      >
                        <Text style={[
                          styles.sizeOptionText,
                          mealData.drinkOptions.size === size && styles.sizeOptionTextSelected
                        ]}>
                          {size.charAt(0).toUpperCase() + size.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {/* Custom Input Fields */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>DETAILS</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter food name"
                value={mealData.title}
                onChangeText={(text) => setMealData(prev => ({ ...prev, title: text }))}
                placeholderTextColor="#4A4A4A"
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Add description (optional)"
                value={mealData.description}
                onChangeText={(text) => setMealData(prev => ({ ...prev, description: text }))}
                multiline={true}
                numberOfLines={3}
                placeholderTextColor="#4A4A4A"
              />
              <TextInput
                style={styles.input}
                placeholder="Calories (optional)"
                value={mealData.calories}
                onChangeText={(text) => setMealData(prev => ({ ...prev, calories: text }))}
                keyboardType="numeric"
                placeholderTextColor="#4A4A4A"
              />
            </View>

            {/* Voice Recording Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>VOICE NOTES</Text>
              {mealData.recordedText ? (
                <View style={styles.recordedTextContainer}>
                  <Text style={styles.recordedText}>{mealData.recordedText}</Text>
                  <TouchableOpacity 
                    style={styles.clearRecordingButton}
                    onPress={() => setMealData(prev => ({ ...prev, recordedText: '' }))}
                  >
                    <Text style={styles.clearRecordingText}>Clear</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity 
                  style={[
                    styles.recordButton,
                    mealData.isRecording && styles.recordButtonActive
                  ]}
                  onPress={handleStartRecording}
                  disabled={mealData.isRecording}
                >
                  <Text style={styles.recordButtonIcon}>
                    {mealData.isRecording ? '🔴' : '🎤'}
                  </Text>
                  <Text style={styles.recordButtonText}>
                    {mealData.isRecording ? 'Recording...' : 'Add Voice Note'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveText}>Add Entry</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
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
    backgroundColor: '#FAF7F0', // Warm off-white background
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A', // Soft black - primary text
    fontFamily: 'Inter',
  },
  closeButton: {
    fontSize: 24,
    color: '#4A4A4A', // Warm charcoal - secondary text
    fontWeight: '600',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A', // Soft black - primary text
    marginBottom: 12,
    fontFamily: 'Inter',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0', // Light gray - borders & dividers
    minWidth: 85,
    flex: 1,
    maxWidth: '30%',
  },
  categoryItemSelected: {
    borderColor: '#6B8E23', // Organic leaf green - accent
    backgroundColor: '#F8FAF5',
  },
  categoryItemIcon: {
    fontSize: 20,
    marginBottom: 6,
  },
  categoryItemLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1A1A1A', // Soft black - primary text
    fontFamily: 'Inter',
    textAlign: 'center',
    lineHeight: 16,
  },
  categoryItemLabelSelected: {
    color: '#6B8E23', // Organic leaf green - accent
    fontWeight: '600',
  },
  drinkOptionsContainer: {
    gap: 12,
  },
  drinkOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0', // Light gray - borders & dividers
  },
  drinkOptionSelected: {
    borderColor: '#6B8E23', // Organic leaf green - accent
    backgroundColor: '#F8FAF5',
  },
  drinkOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A', // Soft black - primary text
    fontFamily: 'Inter',
  },
  drinkOptionCheck: {
    fontSize: 16,
    color: '#6B8E23', // Organic leaf green - accent
    fontWeight: '700',
  },
  sizeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  sizeLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A', // Soft black - primary text
    fontFamily: 'Inter',
    marginRight: 8,
  },
  sizeOption: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0', // Light gray - borders & dividers
  },
  sizeOptionSelected: {
    borderColor: '#6B8E23', // Organic leaf green - accent
    backgroundColor: '#F8FAF5',
  },
  sizeOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4A4A4A', // Warm charcoal - secondary text
    fontFamily: 'Inter',
  },
  sizeOptionTextSelected: {
    color: '#6B8E23', // Organic leaf green - accent
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#1A1A1A', // Soft black - primary text
    borderWidth: 1,
    borderColor: '#E0E0E0', // Light gray - borders & dividers
    marginBottom: 12,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0', // Light gray - borders & dividers
    gap: 12,
  },
  recordButtonActive: {
    borderColor: '#6B8E23', // Organic leaf green - accent
    backgroundColor: '#F8FAF5',
  },
  recordButtonIcon: {
    fontSize: 24,
  },
  recordButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A', // Soft black - primary text
    fontFamily: 'Inter',
  },
  recordedTextContainer: {
    backgroundColor: '#F8FAF5',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#6B8E23', // Organic leaf green - accent
  },
  recordedText: {
    fontSize: 16,
    color: '#1A1A1A', // Soft black - primary text
    fontFamily: 'Inter',
    lineHeight: 22.4,
    marginBottom: 12,
  },
  clearRecordingButton: {
    alignSelf: 'flex-end',
  },
  clearRecordingText: {
    fontSize: 14,
    color: '#6B8E23', // Organic leaf green - accent
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0', // Light gray - borders & dividers
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A4A4A', // Warm charcoal - secondary text
    fontFamily: 'Inter',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#6B8E23', // Organic leaf green - accent
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
})