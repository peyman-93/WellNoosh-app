import React, { useState, useRef, useEffect } from 'react'
import { View, Text, SafeAreaView, Dimensions, StyleSheet, TouchableOpacity, Animated, PanResponder, ActivityIndicator, Image, ScrollView } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Colors, Typography, Spacing, BorderRadius } from '../src/constants/DesignTokens'
import { ScreenWrapper } from '../src/components/layout/ScreenWrapper'
import { recommendationService, RecipeRecommendation } from '../src/services/recommendationService'
import { supabase } from '../src/services/supabase'

interface Recipe {
  id: string
  name: string
  image: string
  imageUrl?: string
  cookTime: string
  servings: number
  difficulty: 'Easy' | 'Medium' | 'Hard'
  rating: number
  tags: string[]
  description: string
  ingredients: {
    name: string
    amount: string
    category: string
  }[]
  instructions: string[]
  nutrition: {
    calories: number
    protein: number
    carbs: number
    fat: number
    fiber?: number
    sugar?: number
    sodium?: number
  }
  recommendation_reason?: string
}

interface RecipeSwipeScreenProps {
  navigation?: any
  onNavigateBack?: () => void
  onRecipeLiked?: (recipe: Recipe) => void
  onRecipeDisliked?: (recipe: Recipe) => void
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window')

export default function RecipeSwipeScreen({ navigation, onNavigateBack, onRecipeLiked, onRecipeDisliked }: RecipeSwipeScreenProps) {
  const [currentRecipeIndex, setCurrentRecipeIndex] = useState(0)
  const [isCardFlipped, setIsCardFlipped] = useState(false)
  const [likedRecipes, setLikedRecipes] = useState<string[]>([])
  const [dislikedRecipes, setDislikedRecipes] = useState<string[]>([])
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [servingsMultiplier, setServingsMultiplier] = useState(1)
  const [missingIngredients, setMissingIngredients] = useState<string[]>([])
  
  const translateX = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(0)).current
  const rotate = useRef(new Animated.Value(0)).current

  // Fetch user and recommendations
  useEffect(() => {
    loadRecommendations()
  }, [])

  const loadRecommendations = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('Please log in to get personalized recommendations')
      }
      
      setUserId(user.id)
      console.log('👤 Loading recommendations for user:', user.id)
      
      // Fetch recommendations
      const recommendations = await recommendationService.getRecommendations(user.id, 20)
      
      if (recommendations.length === 0) {
        throw new Error('No recommendations available at this time')
      }
      
      // Convert recommendations to Recipe format
      const convertedRecipes: Recipe[] = recommendations.map(rec => ({
        id: rec.id,
        name: rec.title,
        image: '🍽️', // Default emoji
        imageUrl: rec.image_url,
        cookTime: `${Math.floor(Math.random() * 30 + 15)} min`, // Estimate if not provided
        servings: rec.servings || 4,
        difficulty: 'Medium' as const, // Default difficulty
        rating: 4.5, // Default rating
        tags: rec.tags || [],
        description: rec.recommendation_reason,
        ingredients: [], // Will be loaded when card is flipped
        instructions: rec.instructions ? rec.instructions.split('\n').filter(i => i.trim()) : [],
        nutrition: {
          calories: parseInt(rec.calories || '0'),
          protein: parseInt(rec.protein || '0'),
          carbs: parseInt(rec.carbs || '0'),
          fat: parseInt(rec.fat || '0'),
          fiber: parseInt(rec.fiber || '0'),
          sugar: parseInt(rec.sugar || '0'),
          sodium: parseInt(rec.sodium || '0')
        },
        recommendation_reason: rec.recommendation_reason
      }))
      
      setRecipes(convertedRecipes)
      console.log('✅ Loaded', convertedRecipes.length, 'recommendations')
      
    } catch (err: any) {
      console.error('❌ Error loading recommendations:', err)
      setError(err.message || 'Failed to load recommendations')
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleNavigateBack = () => {
    console.log('🍽️ RecipeSwipeScreen - Navigate back called:', {
      hasOnNavigateBack: !!onNavigateBack,
      hasNavigation: !!navigation,
      likedRecipesCount: likedRecipes.length,
      dislikedRecipesCount: dislikedRecipes.length
    })
    
    if (onNavigateBack) {
      console.log('🍽️ Using onNavigateBack callback')
      onNavigateBack()
    } else if (navigation) {
      console.log('🍽️ Using navigation.reset')
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs', params: { screen: 'Cooking' } }],
      })
    }
  }

  const currentRecipe = recipes[currentRecipeIndex]
  const hasMoreRecipes = currentRecipeIndex < recipes.length - 1

  // Debug logging
  console.log('🔍 RecipeSwipeScreen Debug:', {
    currentRecipeIndex,
    recipesLength: recipes.length,
    hasCurrentRecipe: !!currentRecipe,
    currentRecipeName: currentRecipe?.name,
    hasMoreRecipes
  })

  const handleSwipeLeft = async () => {
    if (currentRecipe && userId) {
      setDislikedRecipes([...dislikedRecipes, currentRecipe.id])
      onRecipeDisliked?.(currentRecipe)
      
      // Record feedback
      await recommendationService.recordFeedback(userId, currentRecipe.id, 'dislike')
      
      nextRecipe()
    }
  }

  const handleSwipeRight = async () => {
    if (currentRecipe && userId) {
      setLikedRecipes([...likedRecipes, currentRecipe.id])
      onRecipeLiked?.(currentRecipe)
      
      // Record feedback
      await recommendationService.recordFeedback(userId, currentRecipe.id, 'like')
      
      nextRecipe()
    }
  }

  const nextRecipe = () => {
    console.log('🍽️ RecipeSwipeScreen - Next recipe:', {
      currentIndex: currentRecipeIndex,
      hasMoreRecipes: hasMoreRecipes,
      totalRecipes: recipes.length
    })
    
    if (hasMoreRecipes) {
      setCurrentRecipeIndex(currentRecipeIndex + 1)
      setIsCardFlipped(false)
      setServingsMultiplier(1) // Reset servings for new recipe
      setMissingIngredients([]) // Reset missing ingredients
      resetCardPosition()
    } else {
      // All recipes completed, automatically go back to cooking screen
      console.log('🍽️ All recipes completed, setting timeout for auto-navigation')
      setTimeout(() => {
        console.log('🍽️ Auto-navigation timeout triggered')
        handleNavigateBack()
      }, 2000) // Wait 2 seconds to show completion message
    }
  }

  const adjustServings = (increment: number) => {
    const newMultiplier = servingsMultiplier + increment
    if (newMultiplier >= 0.5 && newMultiplier <= 10) {
      setServingsMultiplier(newMultiplier)
    }
  }

  const toggleIngredient = (ingredientName: string) => {
    setMissingIngredients(prev => {
      if (prev.includes(ingredientName)) {
        return prev.filter(name => name !== ingredientName)
      } else {
        return [...prev, ingredientName]
      }
    })
  }

  const getAdjustedNutrition = () => {
    if (!currentRecipe) return null
    
    const baseNutrition = currentRecipe.nutrition
    const adjustedServings = (currentRecipe.servings * servingsMultiplier)
    
    return {
      calories: Math.round(baseNutrition.calories * servingsMultiplier),
      protein: Math.round(baseNutrition.protein * servingsMultiplier),
      carbs: Math.round(baseNutrition.carbs * servingsMultiplier),
      fat: Math.round(baseNutrition.fat * servingsMultiplier),
      fiber: Math.round((baseNutrition.fiber || 0) * servingsMultiplier),
      sugar: Math.round((baseNutrition.sugar || 0) * servingsMultiplier),
      sodium: Math.round((baseNutrition.sodium || 0) * servingsMultiplier)
    }
  }

  const resetCardPosition = () => {
    Animated.parallel([
      Animated.spring(translateX, { toValue: 0, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
      Animated.spring(rotate, { toValue: 0, useNativeDriver: true })
    ]).start()
  }

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      // Start of gesture
    },
    onPanResponderMove: (event, gestureState) => {
      translateX.setValue(gestureState.dx)
      translateY.setValue(gestureState.dy)
    },
    onPanResponderRelease: (event, gestureState) => {
      const { dx, vx } = gestureState
      
      if (Math.abs(dx) > screenWidth * 0.3 || Math.abs(vx) > 1000) {
        if (dx > 0) {
          handleSwipeRight()
        } else {
          handleSwipeLeft()
        }
      } else {
        resetCardPosition()
      }
    }
  })

  const toggleCardFlip = () => {
    setIsCardFlipped(!isCardFlipped)
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return Colors.success
      case 'Medium': return Colors.warning
      case 'Hard': return Colors.destructive
      default: return Colors.mutedForeground
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <ScreenWrapper>
        <LinearGradient colors={Colors.gradientBackground} style={styles.backgroundGradient}>
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={Colors.accent} />
            <Text style={styles.loadingText}>Loading personalized recommendations...</Text>
          </View>
        </LinearGradient>
      </ScreenWrapper>
    )
  }

  // Error state
  if (error) {
    return (
      <ScreenWrapper>
        <LinearGradient colors={Colors.gradientBackground} style={styles.backgroundGradient}>
          <View style={styles.centerContainer}>
            <Text style={styles.errorEmoji}>😕</Text>
            <Text style={styles.errorTitle}>Oops!</Text>
            <Text style={styles.errorMessage}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadRecommendations}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleNavigateBack} style={styles.backButton}>
              <Text style={styles.backButtonText}>← Back to Home</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </ScreenWrapper>
    )
  }

  // No recipes or all swiped
  if (!currentRecipe || recipes.length === 0) {
    return (
      <ScreenWrapper>
        <LinearGradient colors={Colors.gradientBackground} style={styles.backgroundGradient}>
          <View style={styles.completedContainer}>
            <Text style={styles.completedEmoji}>🎉</Text>
            <Text style={styles.completedTitle}>All Done!</Text>
            <Text style={styles.completedMessage}>
              You've swiped through all available recipes. 
              {likedRecipes.length > 0 && ` You liked ${likedRecipes.length} recipes!`}
            </Text>
            <Text style={styles.autoNavigateText}>
              Returning to Cooking tab...
            </Text>
          </View>
        </LinearGradient>
      </ScreenWrapper>
    )
  }

  return (
    <ScreenWrapper>
      <LinearGradient colors={Colors.gradientBackground} style={styles.backgroundGradient}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleNavigateBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Recipe Discovery</Text>
          <Text style={styles.recipeCounter}>{currentRecipeIndex + 1}/{recipes.length}</Text>
        </View>

        {/* Recipe Card */}
        <View style={styles.cardContainer}>
          <Animated.View
            style={[
              styles.recipeCard,
              {
                transform: [
                  { translateX },
                  { translateY },
                  { rotate: translateX.interpolate({
                    inputRange: [-screenWidth, 0, screenWidth],
                    outputRange: ['-30deg', '0deg', '30deg'],
                    extrapolate: 'clamp'
                  })}
                ]
              }
            ]}
            {...panResponder.panHandlers}
          >
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={toggleCardFlip}
              style={styles.cardContent}
            >
                {!isCardFlipped ? (
                  // Front of card
                  <View style={styles.cardFront}>
                    <View style={styles.recipeImageContainer}>
                      {currentRecipe.imageUrl ? (
                        <Image 
                          source={{ uri: currentRecipe.imageUrl }} 
                          style={styles.recipeImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <Text style={styles.recipeEmoji}>{currentRecipe.image}</Text>
                      )}
                    </View>
                    
                    <View style={styles.recipeInfo}>
                      <Text style={styles.recipeName}>{currentRecipe.name}</Text>
                      
                      <View style={styles.cookTimeContainer}>
                        <Text style={styles.cookTimeEmoji}>⏱️</Text>
                        <Text style={styles.cookTimeText}>{currentRecipe.cookTime}</Text>
                      </View>
                      
                      <View style={styles.servingsContainer}>
                        <Text style={styles.servingsLabel}>Servings:</Text>
                        <View style={styles.servingsControls}>
                          <TouchableOpacity 
                            style={styles.servingsButton} 
                            onPress={() => adjustServings(-0.5)}
                          >
                            <Text style={styles.servingsButtonText}>−</Text>
                          </TouchableOpacity>
                          <Text style={styles.servingsCount}>
                            {Math.round(currentRecipe.servings * servingsMultiplier)}
                          </Text>
                          <TouchableOpacity 
                            style={styles.servingsButton} 
                            onPress={() => adjustServings(0.5)}
                          >
                            <Text style={styles.servingsButtonText}>+</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                      
                      <Text style={styles.recipeDescription}>{currentRecipe.description}</Text>
                      
                      {currentRecipe.recommendation_reason && (
                        <View style={styles.recommendationBadge}>
                          <Text style={styles.recommendationText}>💡 {currentRecipe.recommendation_reason}</Text>
                        </View>
                      )}
                      
                      <Text style={styles.flipHint}>Tap to see ingredients & instructions</Text>
                    </View>
                  </View>
                ) : (
                  // Back of card
                  <ScrollView style={styles.cardBack} showsVerticalScrollIndicator={false}>
                    <View style={styles.cardBackContent}>
                      <View style={styles.ingredientsSection}>
                        <Text style={styles.sectionTitle}>Ingredients</Text>
                        <Text style={styles.ingredientsSubtitle}>
                          Tap items you don't have to add to shopping list
                        </Text>
                        {currentRecipe.ingredients.map((ingredient, index) => (
                          <TouchableOpacity 
                            key={index} 
                            style={[
                              styles.ingredientItem,
                              missingIngredients.includes(ingredient.name) && styles.ingredientItemMissing
                            ]}
                            onPress={() => toggleIngredient(ingredient.name)}
                          >
                            <View style={styles.ingredientCheckbox}>
                              {missingIngredients.includes(ingredient.name) && (
                                <Text style={styles.ingredientCheckmark}>✓</Text>
                              )}
                            </View>
                            <Text style={[
                              styles.ingredientText,
                              missingIngredients.includes(ingredient.name) && styles.ingredientTextMissing
                            ]}>
                              {ingredient.amount} {ingredient.name}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                      
                      <View style={styles.instructionsSection}>
                        <Text style={styles.sectionTitle}>Instructions</Text>
                        {currentRecipe.instructions.map((instruction, index) => (
                          <View key={index} style={styles.instructionItem}>
                            <View style={styles.instructionStepNumber}>
                              <Text style={styles.instructionNumber}>{index + 1}</Text>
                            </View>
                            <Text style={styles.instructionText}>{instruction}</Text>
                          </View>
                        ))}
                      </View>
                      
                      <View style={styles.nutritionSection}>
                        <Text style={styles.sectionTitle}>Nutrition per serving</Text>
                        <View style={styles.nutritionGrid}>
                          {(() => {
                            const nutrition = getAdjustedNutrition()
                            if (!nutrition) return null
                            return (
                              <>
                                <View style={styles.nutritionItem}>
                                  <Text style={styles.nutritionValue}>{nutrition.calories}</Text>
                                  <Text style={styles.nutritionLabel}>Calories</Text>
                                </View>
                                <View style={styles.nutritionItem}>
                                  <Text style={styles.nutritionValue}>{nutrition.protein}g</Text>
                                  <Text style={styles.nutritionLabel}>Protein</Text>
                                </View>
                                <View style={styles.nutritionItem}>
                                  <Text style={styles.nutritionValue}>{nutrition.carbs}g</Text>
                                  <Text style={styles.nutritionLabel}>Carbs</Text>
                                </View>
                                <View style={styles.nutritionItem}>
                                  <Text style={styles.nutritionValue}>{nutrition.fat}g</Text>
                                  <Text style={styles.nutritionLabel}>Fat</Text>
                                </View>
                                <View style={styles.nutritionItem}>
                                  <Text style={styles.nutritionValue}>{nutrition.fiber}g</Text>
                                  <Text style={styles.nutritionLabel}>Fiber</Text>
                                </View>
                                <View style={styles.nutritionItem}>
                                  <Text style={styles.nutritionValue}>{nutrition.sodium}mg</Text>
                                  <Text style={styles.nutritionLabel}>Sodium</Text>
                                </View>
                              </>
                            )
                          })()}
                        </View>
                      </View>
                      
                      {missingIngredients.length > 0 && (
                        <Text style={styles.shoppingListNote}>
                          {missingIngredients.length} item{missingIngredients.length > 1 ? 's' : ''} will be added to shopping list
                        </Text>
                      )}
                    </View>
                  </ScrollView>
                )}
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.dislikeButton]}
            onPress={handleSwipeLeft}
          >
            <Text style={styles.actionButtonText}>❌</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.flipButton}
            onPress={toggleCardFlip}
          >
            <Text style={styles.flipButtonText}>🔄</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.likeButton]}
            onPress={handleSwipeRight}
          >
            <Text style={styles.actionButtonText}>❤️</Text>
          </TouchableOpacity>
        </View>
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
  headerTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.foreground,
  },
  recipeCounter: {
    fontSize: Typography.sizes.caption,
    color: Colors.mutedForeground,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.screenPadding,
  },
  recipeCard: {
    width: screenWidth * 0.9,
    height: screenHeight * 0.65,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.background,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  cardContent: {
    flex: 1,
  },
  cardFront: {
    flex: 1,
  },
  cardBack: {
    flex: 1,
    padding: Spacing.lg,
  },
  recipeImageContainer: {
    height: '45%',
    backgroundColor: Colors.muted,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  recipeImage: {
    width: '100%',
    height: '100%',
  },
  recipeEmoji: {
    fontSize: 80,
  },
  recipeOverlay: {
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
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
    flex: 1,
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
    justifyContent: 'space-between',
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
  recipeTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
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
  flipHint: {
    fontSize: Typography.sizes.small,
    color: Colors.mutedForeground,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  cardBackTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    color: Colors.foreground,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  ingredientsSection: {
    marginBottom: Spacing.lg,
  },
  instructionsSection: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.foreground,
    marginBottom: Spacing.sm,
  },
  ingredientItem: {
    marginBottom: Spacing.xs,
  },
  ingredientText: {
    fontSize: Typography.sizes.caption,
    color: Colors.foreground,
  },
  instructionItem: {
    flexDirection: 'row',
    marginBottom: Spacing.xs,
  },
  instructionNumber: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.medium,
    color: Colors.accent,
    marginRight: Spacing.sm,
    minWidth: 20,
  },
  instructionText: {
    fontSize: Typography.sizes.caption,
    color: Colors.foreground,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xl,
    padding: Spacing.screenPadding,
  },
  actionButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  dislikeButton: {
    backgroundColor: '#FF6B6B',
  },
  likeButton: {
    backgroundColor: '#4ECDC4',
  },
  flipButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 24,
  },
  flipButtonText: {
    fontSize: 20,
  },
  completedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.screenPadding,
  },
  completedEmoji: {
    fontSize: 80,
    marginBottom: Spacing.lg,
  },
  completedTitle: {
    fontSize: Typography.sizes.section,
    fontWeight: Typography.weights.bold,
    color: Colors.foreground,
    marginBottom: Spacing.sm,
  },
  completedMessage: {
    fontSize: Typography.sizes.base,
    color: Colors.mutedForeground,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  autoNavigateText: {
    fontSize: Typography.sizes.sm,
    color: Colors.primary,
    textAlign: 'center',
    fontWeight: '600',
    marginTop: Spacing.md,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.cardPadding,
  },
  loadingText: {
    fontSize: Typography.sizes.base,
    color: Colors.mutedForeground,
    marginTop: Spacing.md,
  },
  errorEmoji: {
    fontSize: 80,
    marginBottom: Spacing.md,
  },
  errorTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.foreground,
    marginBottom: Spacing.sm,
  },
  errorMessage: {
    fontSize: Typography.sizes.base,
    color: Colors.mutedForeground,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  retryButtonText: {
    fontSize: Typography.sizes.base,
    color: Colors.surface,
    fontWeight: Typography.weights.medium,
  },
  cookTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  cookTimeEmoji: {
    fontSize: 20,
    marginRight: Spacing.xs,
  },
  cookTimeText: {
    fontSize: Typography.sizes.base,
    color: Colors.foreground,
    fontWeight: Typography.weights.medium,
  },
  servingsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
    backgroundColor: Colors.muted,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  servingsLabel: {
    fontSize: Typography.sizes.base,
    color: Colors.foreground,
    fontWeight: Typography.weights.medium,
  },
  servingsControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  servingsButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  servingsButtonText: {
    fontSize: 20,
    color: Colors.surface,
    fontWeight: Typography.weights.bold,
  },
  servingsCount: {
    fontSize: Typography.sizes.base,
    color: Colors.foreground,
    fontWeight: Typography.weights.semibold,
    minWidth: 30,
    textAlign: 'center',
  },
  recommendationBadge: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  recommendationText: {
    fontSize: Typography.sizes.sm,
    color: Colors.primary,
    fontWeight: Typography.weights.medium,
  },
  cardBackContent: {
    paddingBottom: Spacing.xl,
  },
  ingredientsSubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.mutedForeground,
    marginBottom: Spacing.md,
    fontStyle: 'italic',
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.xs,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ingredientItemMissing: {
    backgroundColor: Colors.destructive + '10',
    borderColor: Colors.destructive,
  },
  ingredientCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.mutedForeground,
    marginRight: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ingredientCheckmark: {
    fontSize: 14,
    color: Colors.destructive,
    fontWeight: Typography.weights.bold,
  },
  ingredientText: {
    fontSize: Typography.sizes.caption,
    color: Colors.foreground,
    flex: 1,
  },
  ingredientTextMissing: {
    textDecorationLine: 'line-through',
    color: Colors.mutedForeground,
  },
  instructionItem: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
    alignItems: 'flex-start',
  },
  instructionStepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  instructionNumber: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.bold,
    color: Colors.surface,
  },
  instructionText: {
    fontSize: Typography.sizes.caption,
    color: Colors.foreground,
    flex: 1,
    lineHeight: 20,
  },
  nutritionSection: {
    marginTop: Spacing.lg,
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  nutritionItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: Spacing.md,
    padding: Spacing.sm,
    backgroundColor: Colors.muted,
    borderRadius: BorderRadius.sm,
  },
  nutritionValue: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    color: Colors.foreground,
  },
  nutritionLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.mutedForeground,
    marginTop: 2,
  },
  shoppingListNote: {
    fontSize: Typography.sizes.sm,
    color: Colors.success,
    textAlign: 'center',
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.success + '20',
    borderRadius: BorderRadius.md,
  },
})