import React, { useState, useRef } from 'react'
import { View, Text, SafeAreaView, Dimensions, StyleSheet, TouchableOpacity, Animated, PanResponder } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Colors, Typography, Spacing, BorderRadius } from '../src/constants/DesignTokens'

interface Recipe {
  id: string
  name: string
  image: string
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
  }
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
  
  const translateX = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(0)).current
  const rotate = useRef(new Animated.Value(0)).current
  
  const handleNavigateBack = () => {
    if (onNavigateBack) {
      onNavigateBack()
    } else if (navigation) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs', params: { screen: 'Cooking' } }],
      })
    }
  }
  
  const recipes: Recipe[] = [
    {
      id: '1',
      name: 'Mediterranean Quinoa Bowl',
      image: '🥗',
      cookTime: '25 min',
      servings: 2,
      difficulty: 'Easy',
      rating: 4.8,
      tags: ['Mediterranean', 'Healthy', 'Vegetarian'],
      description: 'A colorful, nutrient-packed bowl with quinoa, fresh vegetables, and tahini dressing.',
      ingredients: [
        { name: 'Quinoa', amount: '1 cup', category: 'Grains' },
        { name: 'Cherry tomatoes', amount: '1 cup', category: 'Vegetables' },
        { name: 'Cucumber', amount: '1 medium', category: 'Vegetables' },
        { name: 'Feta cheese', amount: '1/2 cup', category: 'Dairy' },
        { name: 'Olive oil', amount: '2 tbsp', category: 'Pantry' }
      ],
      instructions: [
        'Cook quinoa according to package directions',
        'Dice vegetables and combine with quinoa',
        'Add feta cheese and drizzle with olive oil',
        'Serve immediately'
      ],
      nutrition: {
        calories: 420,
        protein: 16,
        carbs: 58,
        fat: 14
      }
    },
    {
      id: '2',
      name: 'Spicy Thai Coconut Curry',
      image: '🍛',
      cookTime: '35 min',
      servings: 4,
      difficulty: 'Medium',
      rating: 4.6,
      tags: ['Thai', 'Spicy', 'Coconut'],
      description: 'Aromatic curry with coconut milk, fresh herbs, and your choice of protein.',
      ingredients: [
        { name: 'Coconut milk', amount: '1 can', category: 'Pantry' },
        { name: 'Thai red curry paste', amount: '2 tbsp', category: 'Pantry' },
        { name: 'Chicken breast', amount: '1 lb', category: 'Protein' },
        { name: 'Bell peppers', amount: '2 medium', category: 'Vegetables' },
        { name: 'Basil leaves', amount: '1/4 cup', category: 'Herbs' }
      ],
      instructions: [
        'Heat curry paste in a large pan',
        'Add coconut milk and bring to simmer',
        'Add chicken and cook until done',
        'Add vegetables and cook until tender',
        'Garnish with fresh basil'
      ],
      nutrition: {
        calories: 380,
        protein: 28,
        carbs: 12,
        fat: 26
      }
    },
    {
      id: '3',
      name: 'Persian Saffron Rice',
      image: '🍚',
      cookTime: '40 min',
      servings: 6,
      difficulty: 'Medium',
      rating: 4.5,
      tags: ['Persian', 'Rice', 'Aromatic'],
      description: 'Fragrant basmati rice with saffron, barberries, and almonds.',
      ingredients: [
        { name: 'Basmati rice', amount: '2 cups', category: 'Grains' },
        { name: 'Saffron threads', amount: '1/4 tsp', category: 'Spices' },
        { name: 'Barberries', amount: '1/3 cup', category: 'Pantry' },
        { name: 'Sliced almonds', amount: '1/4 cup', category: 'Nuts' },
        { name: 'Butter', amount: '3 tbsp', category: 'Dairy' }
      ],
      instructions: [
        'Soak saffron in warm water',
        'Cook rice until tender',
        'Sauté barberries and almonds in butter',
        'Mix saffron water with rice',
        'Top with barberry mixture'
      ],
      nutrition: {
        calories: 285,
        protein: 6,
        carbs: 52,
        fat: 6
      }
    }
  ]

  const currentRecipe = recipes[currentRecipeIndex]
  const hasMoreRecipes = currentRecipeIndex < recipes.length - 1

  const handleSwipeLeft = () => {
    if (currentRecipe) {
      setDislikedRecipes([...dislikedRecipes, currentRecipe.id])
      onRecipeDisliked?.(currentRecipe)
      nextRecipe()
    }
  }

  const handleSwipeRight = () => {
    if (currentRecipe) {
      setLikedRecipes([...likedRecipes, currentRecipe.id])
      onRecipeLiked?.(currentRecipe)
      nextRecipe()
    }
  }

  const nextRecipe = () => {
    if (hasMoreRecipes) {
      setCurrentRecipeIndex(currentRecipeIndex + 1)
      setIsCardFlipped(false)
      resetCardPosition()
    } else {
      // All recipes completed, automatically go back to cooking screen
      setTimeout(() => {
        handleNavigateBack()
      }, 2000) // Wait 2 seconds to show completion message
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

  if (!currentRecipe) {
    return (
      <SafeAreaView style={styles.container}>
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
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
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
                      <Text style={styles.recipeEmoji}>{currentRecipe.image}</Text>
                      <View style={styles.recipeOverlay}>
                        <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(currentRecipe.difficulty) }]}>
                          <Text style={styles.difficultyText}>{currentRecipe.difficulty}</Text>
                        </View>
                        <View style={styles.ratingContainer}>
                          <Text style={styles.ratingText}>⭐ {currentRecipe.rating}</Text>
                        </View>
                      </View>
                    </View>
                    
                    <View style={styles.recipeInfo}>
                      <Text style={styles.recipeName}>{currentRecipe.name}</Text>
                      <Text style={styles.recipeDescription}>{currentRecipe.description}</Text>
                      
                      <View style={styles.recipeStats}>
                        <View style={styles.recipeStat}>
                          <Text style={styles.recipeStatEmoji}>⏱️</Text>
                          <Text style={styles.recipeStatText}>{currentRecipe.cookTime}</Text>
                        </View>
                        <View style={styles.recipeStat}>
                          <Text style={styles.recipeStatEmoji}>👥</Text>
                          <Text style={styles.recipeStatText}>{currentRecipe.servings} servings</Text>
                        </View>
                        <View style={styles.recipeStat}>
                          <Text style={styles.recipeStatEmoji}>🔥</Text>
                          <Text style={styles.recipeStatText}>{currentRecipe.nutrition.calories} cal</Text>
                        </View>
                      </View>
                      
                      <View style={styles.recipeTags}>
                        {currentRecipe.tags.map((tag, index) => (
                          <View key={index} style={styles.recipeTag}>
                            <Text style={styles.recipeTagText}>{tag}</Text>
                          </View>
                        ))}
                      </View>
                      
                      <Text style={styles.flipHint}>Tap to see ingredients & instructions</Text>
                    </View>
                  </View>
                ) : (
                  // Back of card
                  <View style={styles.cardBack}>
                    <Text style={styles.cardBackTitle}>Recipe Details</Text>
                    
                    <View style={styles.ingredientsSection}>
                      <Text style={styles.sectionTitle}>Ingredients</Text>
                      {currentRecipe.ingredients.map((ingredient, index) => (
                        <View key={index} style={styles.ingredientItem}>
                          <Text style={styles.ingredientText}>• {ingredient.amount} {ingredient.name}</Text>
                        </View>
                      ))}
                    </View>
                    
                    <View style={styles.instructionsSection}>
                      <Text style={styles.sectionTitle}>Instructions</Text>
                      {currentRecipe.instructions.map((instruction, index) => (
                        <View key={index} style={styles.instructionItem}>
                          <Text style={styles.instructionNumber}>{index + 1}.</Text>
                          <Text style={styles.instructionText}>{instruction}</Text>
                        </View>
                      ))}
                    </View>
                    
                    <Text style={styles.flipHint}>Tap to go back</Text>
                  </View>
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
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.screenPadding,
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
})