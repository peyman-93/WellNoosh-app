import React, { useState, useEffect } from 'react'
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView,
  Dimensions,
  Alert,
  Modal
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Colors, Typography, Spacing, BorderRadius } from '../src/constants/DesignTokens'
import StarRating from '../src/components/shared/StarRating'
import CookingStepsScreen from './CookingStepsScreen'
import { ScreenWrapper } from '../src/components/layout/ScreenWrapper'

interface Recipe {
  id: string
  name: string
  image: string
  cookTime: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  rating: number
  tags: string[]
  description: string
  baseServings: number
  ingredients: {
    name: string
    amount: string
    unit: string
    category: string
  }[]
  instructions: string[]
  calories: number
  protein: number
  carbs: number
  fat: number
}

interface FridgeItem {
  id: string
  name: string
  category: string
  quantity: number
  unit: string
}

interface RecipeDetailScreenProps {
  recipe: Recipe
  onNavigateBack: () => void
  fridgeItems?: FridgeItem[]
  onAddToGroceryList?: (ingredient: any) => void
  onStartFamilyChoice?: (recipe: Recipe) => void
  onStartCooking?: () => void
  onRateRecipe?: (recipeId: string, rating: number) => void
  userRating?: number
}

const { width: screenWidth } = Dimensions.get('window')

export default function RecipeDetailScreen({ 
  recipe, 
  onNavigateBack, 
  fridgeItems = [], 
  onAddToGroceryList,
  onStartFamilyChoice,
  onStartCooking,
  onRateRecipe,
  userRating = 0
}: RecipeDetailScreenProps) {
  const [servings, setServings] = useState(recipe.baseServings)
  const [showNutritionModal, setShowNutritionModal] = useState(false)
  const [currentUserRating, setCurrentUserRating] = useState(userRating)
  const [showCookingSteps, setShowCookingSteps] = useState(false)
  const [selectedIngredients, setSelectedIngredients] = useState<Set<string>>(new Set())
  
  const servingMultiplier = servings / recipe.baseServings

  // Check if ingredient is available in fridge
  const checkIngredientAvailability = (ingredientName: string) => {
    return fridgeItems.some(item => 
      item.name.toLowerCase().includes(ingredientName.toLowerCase()) ||
      ingredientName.toLowerCase().includes(item.name.toLowerCase())
    )
  }

  // Calculate adjusted ingredient amounts
  const getAdjustedAmount = (amount: string) => {
    const numericAmount = parseFloat(amount)
    if (!isNaN(numericAmount)) {
      const adjusted = numericAmount * servingMultiplier
      return adjusted % 1 === 0 ? adjusted.toString() : adjusted.toFixed(1)
    }
    return amount
  }

  // Get difficulty color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return Colors.success
      case 'Medium': return Colors.warning
      case 'Hard': return Colors.destructive
      default: return Colors.mutedForeground
    }
  }

  // Handle rating
  const handleRating = (rating: number) => {
    setCurrentUserRating(rating)
    onRateRecipe?.(recipe.id, rating)
  }

  // Handle adding ingredient to grocery list
  const handleAddToGroceryList = (ingredient: any) => {
    if (onAddToGroceryList) {
      onAddToGroceryList({
        ...ingredient,
        amount: getAdjustedAmount(ingredient.amount),
        recipeId: recipe.id,
        recipeName: recipe.name
      })
    }
  }

  // Toggle ingredient selection
  const toggleIngredientSelection = (ingredientName: string) => {
    setSelectedIngredients(prev => {
      const newSet = new Set(prev)
      if (newSet.has(ingredientName)) {
        newSet.delete(ingredientName)
      } else {
        newSet.add(ingredientName)
      }
      return newSet
    })
  }

  // Add all selected ingredients to grocery list
  const handleAddSelectedToGroceryList = () => {
    if (onAddToGroceryList && selectedIngredients.size > 0) {
      recipe.ingredients.forEach(ingredient => {
        if (selectedIngredients.has(ingredient.name)) {
          handleAddToGroceryList(ingredient)
        }
      })
      setSelectedIngredients(new Set())
    }
  }

  // Get count of missing (unavailable) ingredients
  const missingIngredientsCount = recipe.ingredients.filter(
    ingredient => !checkIngredientAvailability(ingredient.name)
  ).length

  // Calculate nutrition per serving
  const nutritionPerServing = {
    calories: Math.round((recipe.calories * servingMultiplier) / servings),
    protein: Math.round((recipe.protein * servingMultiplier) / servings),
    carbs: Math.round((recipe.carbs * servingMultiplier) / servings),
    fat: Math.round((recipe.fat * servingMultiplier) / servings)
  }

  if (showCookingSteps) {
    return (
      <CookingStepsScreen
        recipe={recipe}
        onNavigateBack={() => setShowCookingSteps(false)}
        onCookingComplete={onStartCooking}
      />
    )
  }

  return (
    <ScreenWrapper>
      <LinearGradient
        colors={Colors.gradientBackground}
        style={styles.backgroundGradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          
          {/* Actions and Star Rating */}
          <View style={styles.headerActionsContainer}>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.headerActionButton} onPress={() => {
                Alert.alert(
                  'Share Recipe',
                  `Share "${recipe.name}" with your friends and family!`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Share', onPress: () => console.log('Sharing recipe:', recipe.name) }
                  ]
                )
              }}>
                <Text style={styles.headerActionText}>↗️</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerActionButton} onPress={() => {
                if (onStartFamilyChoice) {
                  onStartFamilyChoice(recipe)
                } else {
                  Alert.alert(
                    'Vote on Recipe',
                    `Start a family vote for "${recipe.name}"!`,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Start Vote', onPress: () => console.log('Starting vote for recipe:', recipe.name) }
                    ]
                  )
                }
              }}>
                <Text style={styles.headerActionText}>🗳️</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.headerRatingContainer}>
              <StarRating 
                rating={currentUserRating || 0}
                onRatingChange={handleRating}
                size="small"
                interactive={!!onRateRecipe}
                showRating={false}
              />
            </View>
          </View>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {/* Recipe Hero Section */}
            <View style={styles.heroSection}>
              <View style={styles.recipeImageContainer}>
                <Text style={styles.recipeEmoji}>{recipe.image}</Text>
                <View style={styles.heroOverlay}>
                  <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(recipe.difficulty) }]}>
                    <Text style={styles.difficultyText}>{recipe.difficulty}</Text>
                  </View>
                  <View style={styles.ratingContainer}>
                    <Text style={styles.ratingText}>⭐ {recipe.rating}</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.recipeInfo}>
                <Text style={styles.recipeName}>{recipe.name}</Text>
                <Text style={styles.recipeDescription}>{recipe.description}</Text>
                
                {/* Recipe Stats and Tags Combined */}
                <View style={styles.recipeMetaContainer}>
                  <View style={styles.recipeStats}>
                    <View style={styles.recipeStat}>
                      <Text style={styles.recipeStatEmoji}>⏱️</Text>
                      <Text style={styles.recipeStatText}>{recipe.cookTime}</Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.recipeStat}
                      onPress={() => setShowNutritionModal(true)}
                    >
                      <Text style={styles.recipeStatEmoji}>🔥</Text>
                      <Text style={[styles.recipeStatText, styles.clickableText]}>
                        {nutritionPerServing.calories} cal/serving
                      </Text>
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.recipeTags}>
                    {recipe.tags.map((tag, index) => (
                      <View key={index} style={styles.recipeTag}>
                        <Text style={styles.recipeTagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            </View>

            {/* Compact Info Bar */}
            <View style={styles.infoBar}>
              <View style={styles.infoBarItem}>
                <Text style={styles.infoBarLabel}>Servings</Text>
                <View style={styles.servingControls}>
                  <TouchableOpacity
                    style={[styles.servingButton, servings <= 1 && styles.servingButtonDisabled]}
                    onPress={() => setServings(Math.max(1, servings - 1))}
                    disabled={servings <= 1}
                  >
                    <Text style={styles.servingButtonText}>−</Text>
                  </TouchableOpacity>
                  
                  <View style={styles.servingDisplay}>
                    <Text style={styles.servingNumber}>{servings}</Text>
                  </View>
                  
                  <TouchableOpacity
                    style={[styles.servingButton, servings >= 12 && styles.servingButtonDisabled]}
                    onPress={() => setServings(Math.min(12, servings + 1))}
                    disabled={servings >= 12}
                  >
                    <Text style={styles.servingButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Ingredients Section */}
            <View style={styles.ingredientsSection}>
              <View style={styles.ingredientsHeader}>
                <Text style={styles.sectionTitle}>Ingredients</Text>
                {missingIngredientsCount > 0 && (
                  <Text style={styles.missingCount}>
                    {missingIngredientsCount} missing
                  </Text>
                )}
              </View>
              <Text style={styles.ingredientHint}>
                Tap items you don't have to select them for your grocery list
              </Text>
              {recipe.ingredients.map((ingredient, index) => {
                const isAvailable = checkIngredientAvailability(ingredient.name)
                const adjustedAmount = getAdjustedAmount(ingredient.amount)
                const isSelected = selectedIngredients.has(ingredient.name)
                
                return (
                  <TouchableOpacity 
                    key={index} 
                    style={[
                      styles.ingredientItem,
                      isSelected && styles.ingredientItemSelected
                    ]}
                    onPress={() => !isAvailable && toggleIngredientSelection(ingredient.name)}
                    disabled={isAvailable}
                  >
                    <View style={styles.ingredientCheckbox}>
                      {isAvailable ? (
                        <Text style={styles.checkboxAvailable}>✓</Text>
                      ) : (
                        <View style={[
                          styles.checkbox,
                          isSelected && styles.checkboxSelected
                        ]}>
                          {isSelected && <Text style={styles.checkboxCheck}>✓</Text>}
                        </View>
                      )}
                    </View>
                    <View style={styles.ingredientInfo}>
                      <View style={styles.ingredientHeader}>
                        <Text style={[
                          styles.ingredientName,
                          isAvailable && styles.availableIngredient
                        ]}>
                          {ingredient.name}
                        </Text>
                        {isAvailable && (
                          <Text style={styles.inStockBadge}>In Stock</Text>
                        )}
                      </View>
                      <Text style={styles.ingredientAmount}>
                        {adjustedAmount} {ingredient.unit}
                      </Text>
                      <Text style={styles.ingredientCategory}>{ingredient.category}</Text>
                    </View>
                  </TouchableOpacity>
                )
              })}
              
              {selectedIngredients.size > 0 && onAddToGroceryList && (
                <TouchableOpacity
                  style={styles.addSelectedButton}
                  onPress={handleAddSelectedToGroceryList}
                >
                  <Text style={styles.addSelectedText}>
                    🛒 Add {selectedIngredients.size} item{selectedIngredients.size > 1 ? 's' : ''} to Grocery List
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Instructions Section */}
            <View style={styles.instructionsSection}>
              <Text style={styles.sectionTitle}>Instructions</Text>
              {recipe.instructions.map((instruction, index) => (
                <View key={index} style={styles.instructionItem}>
                  <View style={styles.instructionNumber}>
                    <Text style={styles.instructionNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.instructionText}>{instruction}</Text>
                </View>
              ))}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionSection}>
              <TouchableOpacity 
                style={styles.startCookingButton}
                onPress={() => setShowCookingSteps(true)}
              >
                <LinearGradient
                  colors={['#10B981', '#3B82F6']}
                  style={styles.startCookingGradient}
                >
                  <Text style={styles.startCookingText}>Start Cooking 👨‍🍳</Text>
                </LinearGradient>
              </TouchableOpacity>
              
              {onStartFamilyChoice && (
                <TouchableOpacity 
                  style={styles.familyChoiceButton}
                  onPress={() => onStartFamilyChoice(recipe)}
                >
                  <Text style={styles.familyChoiceText}>🗳️ Add to Community Choice</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>

        {/* Nutrition Modal */}
        <Modal
          visible={showNutritionModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowNutritionModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.nutritionModal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Nutrition Facts</Text>
                <TouchableOpacity onPress={() => setShowNutritionModal(false)}>
                  <Text style={styles.modalCloseButton}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <Text style={styles.nutritionServingInfo}>Per serving ({servings} servings total)</Text>
              
              <View style={styles.nutritionGrid}>
                <View style={styles.nutritionItem}>
                  <View style={styles.nutritionIconContainer}>
                    <Text style={styles.nutritionIcon}>🔥</Text>
                  </View>
                  <Text style={styles.nutritionValue}>{nutritionPerServing.calories}</Text>
                  <Text style={styles.nutritionLabel}>Calories</Text>
                  <View style={styles.nutritionBar}>
                    <View style={[styles.nutritionFill, { 
                      width: `${Math.min((nutritionPerServing.calories / 800) * 100, 100)}%`,
                      backgroundColor: '#EF4444'
                    }]} />
                  </View>
                </View>
                <View style={styles.nutritionItem}>
                  <View style={styles.nutritionIconContainer}>
                    <Text style={styles.nutritionIcon}>💪</Text>
                  </View>
                  <Text style={styles.nutritionValue}>{nutritionPerServing.protein}g</Text>
                  <Text style={styles.nutritionLabel}>Protein</Text>
                  <View style={styles.nutritionBar}>
                    <View style={[styles.nutritionFill, { 
                      width: `${Math.min((nutritionPerServing.protein / 50) * 100, 100)}%`,
                      backgroundColor: '#10B981'
                    }]} />
                  </View>
                </View>
                <View style={styles.nutritionItem}>
                  <View style={styles.nutritionIconContainer}>
                    <Text style={styles.nutritionIcon}>🌾</Text>
                  </View>
                  <Text style={styles.nutritionValue}>{nutritionPerServing.carbs}g</Text>
                  <Text style={styles.nutritionLabel}>Carbs</Text>
                  <View style={styles.nutritionBar}>
                    <View style={[styles.nutritionFill, { 
                      width: `${Math.min((nutritionPerServing.carbs / 100) * 100, 100)}%`,
                      backgroundColor: '#F59E0B'
                    }]} />
                  </View>
                </View>
                <View style={styles.nutritionItem}>
                  <View style={styles.nutritionIconContainer}>
                    <Text style={styles.nutritionIcon}>🥑</Text>
                  </View>
                  <Text style={styles.nutritionValue}>{nutritionPerServing.fat}g</Text>
                  <Text style={styles.nutritionLabel}>Fat</Text>
                  <View style={styles.nutritionBar}>
                    <View style={[styles.nutritionFill, { 
                      width: `${Math.min((nutritionPerServing.fat / 30) * 100, 100)}%`,
                      backgroundColor: '#8B5CF6'
                    }]} />
                  </View>
                </View>
              </View>
              
              <View style={styles.nutritionSummary}>
                <View style={styles.nutritionBadges}>
                  {nutritionPerServing.calories < 400 && (
                    <View style={styles.nutritionBadge}>
                      <Text style={styles.nutritionBadgeText}>Low Calorie</Text>
                    </View>
                  )}
                  {nutritionPerServing.protein >= 20 && (
                    <View style={styles.nutritionBadge}>
                      <Text style={styles.nutritionBadgeText}>High Protein</Text>
                    </View>
                  )}
                  {nutritionPerServing.fat < 10 && (
                    <View style={styles.nutritionBadge}>
                      <Text style={styles.nutritionBadgeText}>Low Fat</Text>
                    </View>
                  )}
                  {(nutritionPerServing.protein + nutritionPerServing.carbs + nutritionPerServing.fat) && (
                    <View style={styles.nutritionBadge}>
                      <Text style={styles.nutritionBadgeText}>
                        {Math.round((nutritionPerServing.protein * 4 + nutritionPerServing.carbs * 4 + nutritionPerServing.fat * 9) / nutritionPerServing.calories * 100) < 80 ? 'Light' : 'Hearty'}
                      </Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.macroDistribution}>
                  <Text style={styles.macroTitle}>Macro Distribution</Text>
                  <View style={styles.macroBar}>
                    <View style={[styles.macroSegment, { 
                      flex: nutritionPerServing.protein * 4,
                      backgroundColor: '#10B981'
                    }]} />
                    <View style={[styles.macroSegment, { 
                      flex: nutritionPerServing.carbs * 4,
                      backgroundColor: '#F59E0B'
                    }]} />
                    <View style={[styles.macroSegment, { 
                      flex: nutritionPerServing.fat * 9,
                      backgroundColor: '#8B5CF6'
                    }]} />
                  </View>
                  <View style={styles.macroLabels}>
                    <Text style={styles.macroLabel}>
                      <Text style={[styles.macroColorDot, { color: '#10B981' }]}>●</Text> Protein ({Math.round((nutritionPerServing.protein * 4) / nutritionPerServing.calories * 100)}%)
                    </Text>
                    <Text style={styles.macroLabel}>
                      <Text style={[styles.macroColorDot, { color: '#F59E0B' }]}>●</Text> Carbs ({Math.round((nutritionPerServing.carbs * 4) / nutritionPerServing.calories * 100)}%)
                    </Text>
                    <Text style={styles.macroLabel}>
                      <Text style={[styles.macroColorDot, { color: '#8B5CF6' }]}>●</Text> Fat ({Math.round((nutritionPerServing.fat * 9) / nutritionPerServing.calories * 100)}%)
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      </LinearGradient>
    </ScreenWrapper>
  )
}

const styles = StyleSheet.create({
  backgroundGradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.screenPadding,
    paddingTop: 16,
    paddingTop: Spacing.lg,
  },
  backButton: {
    padding: Spacing.sm,
  },
  backButtonText: {
    fontSize: Typography.sizes.base,
    color: Colors.accent,
    fontWeight: Typography.weights.medium,
  },
  headerActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  headerActionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerActionText: {
    fontSize: 16,
  },
  headerRatingContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.screenPadding,
    gap: Spacing.xl,
  },
  heroSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  recipeMetaContainer: {
    gap: Spacing.md,
  },
  infoBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  infoBarItem: {
    flex: 1,
    alignItems: 'center',
  },
  infoBarLabel: {
    fontSize: Typography.sizes.small,
    color: Colors.mutedForeground,
    fontWeight: Typography.weights.medium,
    marginBottom: Spacing.xs,
  },
  recipeImageContainer: {
    height: 200,
    backgroundColor: Colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  recipeEmoji: {
    fontSize: 80,
  },
  heroOverlay: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
    right: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  difficultyBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  difficultyText: {
    fontSize: Typography.sizes.small,
    color: Colors.primaryForeground,
    fontWeight: Typography.weights.medium,
  },
  ratingContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  ratingText: {
    fontSize: Typography.sizes.small,
    color: Colors.primaryForeground,
    fontWeight: Typography.weights.medium,
  },
  recipeInfo: {
    padding: Spacing.lg,
  },
  recipeName: {
    fontSize: Typography.sizes.subsection,
    fontWeight: Typography.weights.bold,
    color: Colors.foreground,
    marginBottom: Spacing.sm,
  },
  recipeDescription: {
    fontSize: Typography.sizes.caption,
    color: Colors.mutedForeground,
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  recipeStats: {
    flexDirection: 'row',
    gap: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  recipeStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  recipeStatEmoji: {
    fontSize: 16,
  },
  recipeStatText: {
    fontSize: Typography.sizes.small,
    color: Colors.mutedForeground,
  },
  clickableText: {
    color: Colors.accent,
    textDecorationLine: 'underline',
  },
  recipeTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  recipeTag: {
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  recipeTagText: {
    fontSize: Typography.sizes.small,
    color: Colors.primaryForeground,
    fontWeight: Typography.weights.medium,
  },
  servingSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.foreground,
    marginBottom: Spacing.md,
  },
  servingControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  servingButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  servingButtonDisabled: {
    backgroundColor: Colors.muted,
    opacity: 0.5,
  },
  servingButtonText: {
    fontSize: 16,
    color: Colors.primaryForeground,
    fontWeight: Typography.weights.bold,
  },
  servingDisplay: {
    alignItems: 'center',
    minWidth: 60,
  },
  servingNumber: {
    fontSize: 24,
    fontWeight: Typography.weights.bold,
    color: Colors.foreground,
  },
  servingLabel: {
    fontSize: Typography.sizes.small,
    color: Colors.mutedForeground,
  },
  ingredientsSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  ingredientsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  addAllButton: {
    backgroundColor: Colors.success,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  addAllText: {
    fontSize: Typography.sizes.small,
    color: Colors.primaryForeground,
    fontWeight: Typography.weights.semibold,
  },
  missingCount: {
    fontSize: Typography.sizes.small,
    color: Colors.destructive,
    fontWeight: Typography.weights.medium,
  },
  ingredientHint: {
    fontSize: Typography.sizes.small,
    color: Colors.mutedForeground,
    marginBottom: Spacing.md,
    fontStyle: 'italic',
  },
  ingredientItemSelected: {
    backgroundColor: '#e8f5e9',
    borderColor: Colors.success,
    borderWidth: 1,
  },
  ingredientCheckbox: {
    marginRight: Spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    width: 24,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  checkboxCheck: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  checkboxAvailable: {
    color: Colors.success,
    fontSize: 18,
    fontWeight: 'bold',
  },
  inStockBadge: {
    fontSize: 10,
    color: Colors.success,
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
    fontWeight: '600',
  },
  addSelectedButton: {
    backgroundColor: Colors.success,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    marginTop: Spacing.lg,
    alignItems: 'center',
  },
  addSelectedText: {
    color: Colors.primaryForeground,
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
  },
  ingredientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  ingredientInfo: {
    flex: 1,
  },
  ingredientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  ingredientName: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.medium,
    color: Colors.foreground,
    flex: 1,
  },
  availableIngredient: {
    color: Colors.success,
  },
  ingredientAmount: {
    fontSize: Typography.sizes.caption,
    color: Colors.mutedForeground,
    marginBottom: Spacing.xs,
  },
  ingredientCategory: {
    fontSize: Typography.sizes.small,
    color: Colors.accent,
    fontWeight: Typography.weights.medium,
  },
  addToListButton: {
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginLeft: Spacing.md,
  },
  addToListText: {
    fontSize: Typography.sizes.small,
    color: Colors.primaryForeground,
    fontWeight: Typography.weights.medium,
  },
  instructionsSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  instructionItem: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
  },
  instructionNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    marginTop: 2,
  },
  instructionNumberText: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.bold,
    color: Colors.primaryForeground,
  },
  instructionText: {
    fontSize: Typography.sizes.caption,
    color: Colors.foreground,
    flex: 1,
    lineHeight: 20,
  },
  actionSection: {
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  startCookingButton: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  startCookingGradient: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  startCookingText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    color: Colors.primaryForeground,
  },
  familyChoiceButton: {
    backgroundColor: 'rgba(139, 69, 19, 0.1)',
    borderWidth: 2,
    borderColor: '#8B4513',
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  familyChoiceText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: '#8B4513',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.screenPadding,
  },
  nutritionModal: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: Typography.sizes.subsection,
    fontWeight: Typography.weights.bold,
    color: Colors.foreground,
  },
  modalCloseButton: {
    fontSize: 24,
    color: Colors.mutedForeground,
  },
  nutritionServingInfo: {
    fontSize: Typography.sizes.caption,
    color: Colors.mutedForeground,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  nutritionItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.muted,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
  },
  nutritionIconContainer: {
    marginBottom: Spacing.xs,
  },
  nutritionIcon: {
    fontSize: 24,
  },
  nutritionLabel: {
    fontSize: Typography.sizes.small,
    color: Colors.mutedForeground,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  nutritionValue: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    color: Colors.foreground,
    marginBottom: Spacing.xs,
  },
  nutritionBar: {
    width: '100%',
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  nutritionFill: {
    height: '100%',
    borderRadius: 2,
  },
  nutritionSummary: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  nutritionBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    justifyContent: 'center',
  },
  nutritionBadge: {
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  nutritionBadgeText: {
    fontSize: Typography.sizes.small,
    color: Colors.primaryForeground,
    fontWeight: Typography.weights.medium,
  },
  macroDistribution: {
    alignItems: 'center',
  },
  macroTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.foreground,
    marginBottom: Spacing.sm,
  },
  macroBar: {
    flexDirection: 'row',
    height: 8,
    width: '100%',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  macroSegment: {
    height: '100%',
  },
  macroLabels: {
    gap: Spacing.xs,
  },
  macroLabel: {
    fontSize: Typography.sizes.small,
    color: Colors.foreground,
    textAlign: 'center',
  },
  macroColorDot: {
    fontSize: 12,
  },
})