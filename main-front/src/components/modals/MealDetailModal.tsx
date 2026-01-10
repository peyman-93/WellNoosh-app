import React, { useState } from 'react'
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { MealPlanEntry, mealPlannerService } from '../../services/mealPlannerService'
import { groceryListService } from '../../services/groceryListService'
import { logCookedMealNutrition } from '../../services/nutritionTrackingService'

interface Ingredient {
  name: string
  amount: string
  category: string
}

interface MealDetailModalProps {
  visible: boolean
  onClose: () => void
  meal: MealPlanEntry | null
  onMealCooked?: (mealId: string) => void
  onMealRemoved?: (mealId: string) => void
}

const MEAL_SLOT_ICONS: Record<string, string> = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snack: '🍎'
}

interface StructuredIngredient {
  name: string
  amount?: string | number
  unit?: string
  category?: string
}

const parseIngredients = (meal: MealPlanEntry): Ingredient[] => {
  // First, try to get ingredients from structured data (ingredients_json or generated_recipe)
  const mealAny = meal as any
  
  // Check for ingredients_json field (common for AI-generated meals)
  if (mealAny.ingredients_json && Array.isArray(mealAny.ingredients_json)) {
    return mealAny.ingredients_json.map((ing: StructuredIngredient) => ({
      name: ing.name || '',
      amount: ing.amount ? `${ing.amount}${ing.unit ? ' ' + ing.unit : ''}` : '1',
      category: ing.category || 'General'
    })).filter((ing: Ingredient) => ing.name)
  }
  
  // Check for generated_recipe.ingredients
  if (mealAny.generated_recipe?.ingredients && Array.isArray(mealAny.generated_recipe.ingredients)) {
    return mealAny.generated_recipe.ingredients.map((ing: StructuredIngredient) => ({
      name: ing.name || '',
      amount: ing.amount ? `${ing.amount}${ing.unit ? ' ' + ing.unit : ''}` : '1',
      category: ing.category || 'General'
    })).filter((ing: Ingredient) => ing.name)
  }
  
  // Fallback: Try to parse from notes field
  const notes = meal.notes
  if (!notes) return []
  
  const ingredients: Ingredient[] = []
  const lines = notes.split('\n')
  let inIngredients = false
  
  for (const line of lines) {
    if (line.toLowerCase().includes('ingredients:')) {
      inIngredients = true
      continue
    }
    if (line.toLowerCase().includes('instructions:') || line.toLowerCase().includes('directions:')) {
      break
    }
    if (inIngredients && line.trim()) {
      const cleaned = line.replace(/^[-•*]\s*/, '').trim()
      if (cleaned) {
        const parts = cleaned.match(/^([\d\/\.\s]+)?\s*(.+)$/i)
        if (parts) {
          ingredients.push({
            name: parts[2]?.trim() || cleaned,
            amount: parts[1]?.trim() || '1',
            category: 'General'
          })
        } else {
          ingredients.push({
            name: cleaned,
            amount: '1',
            category: 'General'
          })
        }
      }
    }
  }
  
  return ingredients
}

const parseInstructions = (notes: string | undefined): string[] => {
  if (!notes) return []
  
  const instructions: string[] = []
  const lines = notes.split('\n')
  let inInstructions = false
  
  for (const line of lines) {
    if (line.toLowerCase().includes('instructions:') || line.toLowerCase().includes('directions:')) {
      inInstructions = true
      continue
    }
    if (inInstructions && line.trim()) {
      const cleaned = line.replace(/^[\d]+[.)\-]\s*/, '').replace(/^[-•*]\s*/, '').trim()
      if (cleaned) {
        instructions.push(cleaned)
      }
    }
  }
  
  return instructions
}

export function MealDetailModal({ visible, onClose, meal, onMealCooked, onMealRemoved }: MealDetailModalProps) {
  const [isAddingToGrocery, setIsAddingToGrocery] = useState(false)
  const [addedIngredients, setAddedIngredients] = useState<Set<number>>(new Set())
  const [isCooking, setIsCooking] = useState(false)

  if (!meal) return null

  const mealTitle = meal.custom_title || meal.recipe_title || 'Meal'
  const ingredients = parseIngredients(meal)
  const instructions = parseInstructions(meal.notes)
  const mealIcon = MEAL_SLOT_ICONS[meal.meal_slot] || '🍽️'
  const mealDate = new Date(meal.plan_date).toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'short', 
    day: 'numeric' 
  })

  const handleAddIngredientToGrocery = async (ingredient: Ingredient, index: number) => {
    try {
      await groceryListService.addItem({
        name: ingredient.name,
        amount: ingredient.amount,
        category: ingredient.category,
        from_recipe: mealTitle
      })
      setAddedIngredients(prev => new Set([...prev, index]))
      Alert.alert('Added!', `${ingredient.name} added to your grocery list.`)
    } catch (error) {
      console.error('Error adding to grocery list:', error)
      Alert.alert('Error', 'Failed to add ingredient to grocery list.')
    }
  }

  const handleAddAllToGrocery = async () => {
    if (ingredients.length === 0) {
      Alert.alert('No Ingredients', 'This meal does not have detailed ingredients to add.')
      return
    }

    setIsAddingToGrocery(true)
    try {
      const itemsToAdd = ingredients.map(ing => ({
        name: ing.name,
        amount: ing.amount,
        category: ing.category,
        from_recipe: mealTitle
      }))
      await groceryListService.addMultipleItems(itemsToAdd)
      setAddedIngredients(new Set(ingredients.map((_, i) => i)))
      Alert.alert('Success!', `${ingredients.length} ingredients added to your grocery list.`)
    } catch (error) {
      console.error('Error adding all ingredients:', error)
      Alert.alert('Error', 'Failed to add ingredients to grocery list.')
    } finally {
      setIsAddingToGrocery(false)
    }
  }

  const handleCookMeal = async () => {
    setIsCooking(true)
    try {
      // Handle both Date objects and ISO strings for plan_date
      // Use local date to avoid UTC timezone drift
      let planDateStr: string
      if (typeof meal.plan_date === 'string') {
        planDateStr = meal.plan_date.split('T')[0]
      } else {
        const d = new Date(meal.plan_date)
        const year = d.getFullYear()
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        planDateStr = `${year}-${month}-${day}`
      }
      
      // CRITICAL: Mark the meal as completed in meal_plans table
      // This is what the nutrition dashboard reads from
      await mealPlannerService.markMealAsCooked(meal.id)
      console.log('✅ Marked meal as completed in meal_plans:', meal.id)
      
      // Also log nutrition data to daily_nutrition_summary for detailed tracking
      if (meal.calories || meal.protein_g || meal.carbs_g || meal.fat_g) {
        const nutritionResult = await logCookedMealNutrition({
          mealId: meal.id,
          mealSlot: meal.meal_slot as 'breakfast' | 'lunch' | 'dinner' | 'snack',
          mealName: mealTitle,
          calories: meal.calories || 0,
          protein_g: meal.protein_g || 0,
          carbs_g: meal.carbs_g || 0,
          fat_g: meal.fat_g || 0,
          date: planDateStr
        })

        if (!nutritionResult.success) {
          console.warn('Could not log nutrition:', nutritionResult.error)
        }
      }

      if (onMealCooked) {
        onMealCooked(meal.id)
      }
      Alert.alert('Meal Cooked!', `Great job cooking ${mealTitle}! Nutrition logged for today.`)
      onClose()
    } catch (error) {
      console.error('Error marking meal as cooked:', error)
      Alert.alert('Error', 'Failed to mark meal as cooked.')
    } finally {
      setIsCooking(false)
    }
  }

  const handleRemoveMeal = () => {
    Alert.alert(
      'Remove Meal',
      `Are you sure you want to remove ${mealTitle} from your meal plan?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => {
            if (onMealRemoved) {
              onMealRemoved(meal.id)
            }
            onClose()
          }
        }
      ]
    )
  }

  const handleClose = () => {
    setAddedIngredients(new Set())
    onClose()
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <LinearGradient
          colors={['#6B8E23', '#556B2F']}
          style={styles.header}
        >
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <Text style={styles.mealIcon}>{mealIcon}</Text>
            <Text style={styles.mealTitle}>{mealTitle}</Text>
            <View style={styles.mealMeta}>
              <Text style={styles.mealSlot}>{meal.meal_slot.charAt(0).toUpperCase() + meal.meal_slot.slice(1)}</Text>
              <Text style={styles.metaDot}>•</Text>
              <Text style={styles.mealDate}>{mealDate}</Text>
            </View>
          </View>

          {(meal.calories != null || meal.protein_g != null || meal.carbs_g != null || meal.fat_g != null) ? (
            <View style={styles.nutritionBar}>
              {meal.calories != null && (
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{meal.calories}</Text>
                  <Text style={styles.nutritionLabel}>kcal</Text>
                </View>
              )}
              {meal.protein_g != null && (
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{meal.protein_g}g</Text>
                  <Text style={styles.nutritionLabel}>protein</Text>
                </View>
              )}
              {meal.carbs_g != null && (
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{meal.carbs_g}g</Text>
                  <Text style={styles.nutritionLabel}>carbs</Text>
                </View>
              )}
              {meal.fat_g != null && (
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionValue}>{meal.fat_g}g</Text>
                  <Text style={styles.nutritionLabel}>fat</Text>
                </View>
              )}
            </View>
          ) : null}
        </LinearGradient>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {ingredients.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Ingredients</Text>
                <TouchableOpacity 
                  style={styles.addAllButton}
                  onPress={handleAddAllToGrocery}
                  disabled={isAddingToGrocery}
                >
                  {isAddingToGrocery ? (
                    <ActivityIndicator size="small" color="#6B8E23" />
                  ) : (
                    <View style={styles.addAllContent}>
                      <Text style={styles.addAllIcon}>🛒</Text>
                      <Text style={styles.addAllText}>Add All</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
              
              {ingredients.map((ingredient, index) => (
                <View key={index} style={styles.ingredientRow}>
                  <View style={styles.ingredientInfo}>
                    <Text style={styles.ingredientAmount}>{ingredient.amount}</Text>
                    <Text style={styles.ingredientName}>{ingredient.name}</Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.addButton,
                      addedIngredients.has(index) && styles.addedButton
                    ]}
                    onPress={() => handleAddIngredientToGrocery(ingredient, index)}
                    disabled={addedIngredients.has(index)}
                  >
                    <Text style={[
                      styles.addButtonText,
                      addedIngredients.has(index) && styles.addedButtonText
                    ]}>
                      {addedIngredients.has(index) ? '✓' : '+'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {instructions.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Instructions</Text>
              {instructions.map((instruction, index) => (
                <View key={index} style={styles.instructionRow}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.instructionText}>{instruction}</Text>
                </View>
              ))}
            </View>
          )}

          {ingredients.length === 0 && instructions.length === 0 && (
            <View style={styles.noDetailsContainer}>
              <Text style={styles.noDetailsIcon}>📝</Text>
              <Text style={styles.noDetailsTitle}>No detailed recipe</Text>
              <Text style={styles.noDetailsText}>
                This meal doesn't have detailed ingredients or instructions yet.
              </Text>
            </View>
          )}

          <View style={styles.servingsInfo}>
            <Text style={styles.servingsLabel}>Servings: {meal.servings || 1}</Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.cookButton}
            onPress={handleCookMeal}
            disabled={isCooking}
          >
            {isCooking ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <View style={styles.cookButtonContent}>
                <Text style={styles.cookButtonIcon}>👨‍🍳</Text>
                <Text style={styles.cookButtonText}>I Cooked This!</Text>
              </View>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.removeButton}
            onPress={handleRemoveMeal}
          >
            <Text style={styles.removeButtonText}>Remove</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F0',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerContent: {
    alignItems: 'center',
    paddingTop: 20,
  },
  mealIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  mealTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  mealMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mealSlot: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  metaDot: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  mealDate: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  nutritionBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    gap: 24,
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  nutritionLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  addAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F7E6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  addAllContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addAllIcon: {
    fontSize: 14,
  },
  addAllText: {
    fontSize: 13,
    color: '#6B8E23',
    fontWeight: '600',
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  ingredientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  ingredientAmount: {
    fontSize: 14,
    color: '#6B8E23',
    fontWeight: '600',
    minWidth: 50,
  },
  ingredientName: {
    fontSize: 15,
    color: '#1A1A1A',
    flex: 1,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6B8E23',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addedButton: {
    backgroundColor: '#E8F5E9',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  addedButtonText: {
    color: '#4CAF50',
  },
  instructionRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#6B8E23',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  instructionText: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A1A',
    lineHeight: 22,
  },
  noDetailsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noDetailsIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  noDetailsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  noDetailsText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  servingsInfo: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  servingsLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  cookButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6B8E23',
    paddingVertical: 14,
    borderRadius: 12,
  },
  cookButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cookButtonIcon: {
    fontSize: 18,
  },
  cookButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  removeButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    paddingVertical: 14,
    borderRadius: 12,
  },
  removeButtonText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '600',
  },
})
