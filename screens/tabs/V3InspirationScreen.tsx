import React, { useState, useEffect } from 'react'
import { View, Text, SafeAreaView, ScrollView, StyleSheet, Pressable, Image, TouchableOpacity, Alert } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/DesignTokens'
import RecipeSwipeScreen from '../RecipeSwipeScreen'
import RecipeDetailScreen from '../RecipeDetailScreen'
import FamilyChoiceScreen from '../FamilyChoiceScreen'
import StarRating from '@/components/StarRating'

interface Recipe {
  id: string
  name: string
  image: string
  cookTime: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  calories: number
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
  protein: number
  carbs: number
  fat: number
}

interface RecipeCardProps {
  recipe: Recipe
  onSave: (id: string) => void
  onCook: (id: string) => void
  onViewDetails: (recipe: Recipe) => void
  isFavorite?: boolean
  onRateRecipe?: (recipeId: string, rating: number) => void
  userRating?: number
}

function RecipeCard({ recipe, onSave, onCook, onViewDetails, isFavorite = false, onRateRecipe, userRating }: RecipeCardProps) {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return Colors.success
      case 'Medium': return Colors.warning
      case 'Hard': return Colors.destructive
      default: return Colors.mutedForeground
    }
  }

  return (
    <TouchableOpacity onPress={() => onViewDetails(recipe)}>
      <Card style={styles.recipeCard}>
        <View style={styles.recipeImageContainer}>
          <View style={styles.recipePlaceholderImage}>
            <Text style={styles.recipeImageEmoji}>🍽️</Text>
          </View>
          <View style={styles.recipeOverlay}>
            <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(recipe.difficulty) }]}>
              <Text style={styles.difficultyText}>{recipe.difficulty}</Text>
            </View>
            <Pressable style={styles.saveButton} onPress={(e) => {
              e.stopPropagation()
              onSave(recipe.id)
            }}>
              <Text style={styles.saveButtonText}>{isFavorite ? '❤️' : '🤍'}</Text>
            </Pressable>
          </View>
        </View>
        
        <CardContent style={styles.recipeContent}>
          <Text style={styles.recipeName}>{recipe.name}</Text>
          <Text style={styles.recipeDescription}>{recipe.description}</Text>
          
          <View style={styles.recipeStats}>
            <View style={styles.recipeStat}>
              <Text style={styles.recipeStatEmoji}>⏱️</Text>
              <Text style={styles.recipeStatText}>{recipe.cookTime}</Text>
            </View>
            <View style={styles.recipeStat}>
              <Text style={styles.recipeStatEmoji}>🔥</Text>
              <Text style={styles.recipeStatText}>{recipe.calories} cal</Text>
            </View>
            <View style={styles.recipeStat}>
              <StarRating 
                rating={recipe.rating}
                size="small"
                interactive={false}
                showRating={false}
              />
            </View>
          </View>
          
          <View style={styles.recipeTags}>
            {recipe.tags.slice(0, 3).map((tag, index) => (
              <View key={index} style={styles.recipeTag}>
                <Text style={styles.recipeTagText}>{tag}</Text>
              </View>
            ))}
          </View>
          
          <Button size="sm" onPress={(e) => {
            e.stopPropagation()
            onCook(recipe.id)
          }} style={styles.cookButton}>
            Start Cooking
          </Button>
        </CardContent>
      </Card>
    </TouchableOpacity>
  )
}

interface FilterBarProps {
  activeFilters: string[]
  activeCuisineFilters: string[]
  onFilterToggle: (filter: string) => void
  onCuisineFilterToggle: (filter: string) => void
}

function FilterBar({ activeFilters, activeCuisineFilters, onFilterToggle, onCuisineFilterToggle }: FilterBarProps) {
  const mainFilters = [
    { id: 'favourites', label: 'Favourites', emoji: '❤️' },
    { id: 'healthy', label: 'Healthy', emoji: '🥗' }
  ]

  const cuisineFilters = [
    { id: 'asian', label: 'Asian', emoji: '🥢' },
    { id: 'french', label: 'French', emoji: '🥐' },
    { id: 'persian', label: 'Persian', emoji: '🧿' },
    { id: 'italian', label: 'Italian', emoji: '🍝' },
    { id: 'mexican', label: 'Mexican', emoji: '🌮' },
    { id: 'indian', label: 'Indian', emoji: '🍛' },
    { id: 'mediterranean', label: 'Mediterranean', emoji: '🫒' }
  ]

  return (
    <View style={styles.filtersContainer}>
      {/* Main Filters */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.filterScrollView}
        contentContainerStyle={styles.filterContainer}
      >
        {mainFilters.map(filter => (
          <Pressable
            key={filter.id}
            style={[
              styles.filterButton,
              activeFilters.includes(filter.id) && styles.activeFilterButton
            ]}
            onPress={() => onFilterToggle(filter.id)}
          >
            <Text style={styles.filterEmoji}>{filter.emoji}</Text>
            <Text style={[
              styles.filterText,
              activeFilters.includes(filter.id) && styles.activeFilterText
            ]}>
              {filter.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Cuisine Filters */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.filterScrollView}
        contentContainerStyle={styles.filterContainer}
      >
        {cuisineFilters.map(filter => (
          <Pressable
            key={filter.id}
            style={[
              styles.cuisineFilterButton,
              activeCuisineFilters.includes(filter.id) && styles.activeCuisineFilterButton
            ]}
            onPress={() => onCuisineFilterToggle(filter.id)}
          >
            <Text style={styles.filterEmoji}>{filter.emoji}</Text>
            <Text style={[
              styles.cuisineFilterText,
              activeCuisineFilters.includes(filter.id) && styles.activeCuisineFilterText
            ]}>
              {filter.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  )
}

export default function V3InspirationScreen({ route, navigation }: { route: any, navigation: any }) {
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [activeCuisineFilters, setActiveCuisineFilters] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showSwipeScreen, setShowSwipeScreen] = useState(false)
  const [showRecipeDetail, setShowRecipeDetail] = useState(false)
  const [showFamilyChoice, setShowFamilyChoice] = useState(false)
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [favoriteRecipes, setFavoriteRecipes] = useState<string[]>([])
  const [likedRecipes, setLikedRecipes] = useState<Recipe[]>([])
  const [userRatings, setUserRatings] = useState<{[key: string]: number}>({})
  
  // Check for navigation parameter to show swipe screen
  useEffect(() => {
    if (route.params?.showSwipeScreen) {
      setShowSwipeScreen(true)
      // Clear the parameter to prevent showing again on subsequent navigations
      navigation.setParams({ showSwipeScreen: false })
    }
  }, [route.params?.showSwipeScreen, navigation])
  
  // Mock fridge items - you can replace this with actual fridge data
  const fridgeItems = [
    { id: '1', name: 'Quinoa', category: 'Grains', quantity: 2, unit: 'cups' },
    { id: '2', name: 'Olive oil', category: 'Pantry', quantity: 1, unit: 'bottle' },
    { id: '3', name: 'Onion', category: 'Vegetables', quantity: 3, unit: 'pieces' },
    { id: '4', name: 'Chicken breast', category: 'Protein', quantity: 2, unit: 'lbs' },
  ]

  const recipes: Recipe[] = [
    {
      id: '1',
      name: 'Mediterranean Quinoa Bowl',
      image: '🥗',
      cookTime: '25 min',
      difficulty: 'Easy',
      calories: 456,
      rating: 4.8,
      tags: ['Healthy', 'Mediterranean', 'Vegetarian'],
      description: 'Fresh quinoa bowl with roasted vegetables, feta cheese, and lemon dressing',
      baseServings: 2,
      protein: 16,
      carbs: 58,
      fat: 14,
      ingredients: [
        { name: 'Quinoa', amount: '1', unit: 'cup', category: 'Grains' },
        { name: 'Cherry tomatoes', amount: '1', unit: 'cup', category: 'Vegetables' },
        { name: 'Cucumber', amount: '1', unit: 'medium', category: 'Vegetables' },
        { name: 'Feta cheese', amount: '0.5', unit: 'cup', category: 'Dairy' },
        { name: 'Olive oil', amount: '2', unit: 'tbsp', category: 'Pantry' }
      ],
      instructions: [
        'Cook quinoa according to package directions',
        'Dice vegetables and combine with quinoa',
        'Add feta cheese and drizzle with olive oil',
        'Serve immediately'
      ]
    },
    {
      id: '2',
      name: 'Spicy Thai Coconut Curry',
      image: '🍛',
      cookTime: '35 min',
      difficulty: 'Medium',
      calories: 523,
      rating: 4.6,
      tags: ['Thai', 'Spicy', 'Coconut'],
      description: 'Aromatic curry with coconut milk, fresh herbs, and your choice of protein',
      baseServings: 4,
      protein: 28,
      carbs: 12,
      fat: 26,
      ingredients: [
        { name: 'Coconut milk', amount: '1', unit: 'can', category: 'Pantry' },
        { name: 'Thai red curry paste', amount: '2', unit: 'tbsp', category: 'Pantry' },
        { name: 'Chicken breast', amount: '1', unit: 'lb', category: 'Protein' },
        { name: 'Bell peppers', amount: '2', unit: 'medium', category: 'Vegetables' },
        { name: 'Basil leaves', amount: '0.25', unit: 'cup', category: 'Herbs' }
      ],
      instructions: [
        'Heat curry paste in a large pan',
        'Add coconut milk and bring to simmer',
        'Add chicken and cook until done',
        'Add vegetables and cook until tender',
        'Garnish with fresh basil'
      ]
    },
    {
      id: '3',
      name: 'Classic French Ratatouille',
      image: '🍆',
      cookTime: '45 min',
      difficulty: 'Medium',
      calories: 320,
      rating: 4.7,
      tags: ['French', 'Vegetarian', 'Traditional', 'Healthy'],
      description: 'Traditional French vegetable stew with herbs de Provence',
      baseServings: 4,
      protein: 8,
      carbs: 45,
      fat: 12,
      ingredients: [
        { name: 'Eggplant', amount: '1', unit: 'large', category: 'Vegetables' },
        { name: 'Zucchini', amount: '2', unit: 'medium', category: 'Vegetables' },
        { name: 'Tomatoes', amount: '4', unit: 'large', category: 'Vegetables' },
        { name: 'Onion', amount: '1', unit: 'large', category: 'Vegetables' },
        { name: 'Herbs de Provence', amount: '2', unit: 'tsp', category: 'Spices' }
      ],
      instructions: [
        'Dice all vegetables into uniform pieces',
        'Sauté onions until translucent',
        'Add eggplant and cook for 5 minutes',
        'Add remaining vegetables and herbs',
        'Simmer for 30 minutes until tender'
      ]
    },
    {
      id: '4',
      name: 'Homemade Beef Ragu',
      image: '🍝',
      cookTime: '2 hours',
      difficulty: 'Hard',
      calories: 658,
      rating: 4.9,
      tags: ['Italian', 'Comfort Food', 'Slow Cook', 'Leftover-Friendly'],
      description: 'Rich, slow-cooked beef ragu with fresh herbs and parmesan cheese',
      baseServings: 6,
      protein: 35,
      carbs: 45,
      fat: 28,
      ingredients: [
        { name: 'Ground beef', amount: '2', unit: 'lbs', category: 'Protein' },
        { name: 'Onion', amount: '1', unit: 'large', category: 'Vegetables' },
        { name: 'Carrots', amount: '2', unit: 'medium', category: 'Vegetables' },
        { name: 'Celery stalks', amount: '3', unit: 'pieces', category: 'Vegetables' },
        { name: 'Crushed tomatoes', amount: '28', unit: 'oz can', category: 'Pantry' },
        { name: 'Red wine', amount: '1', unit: 'cup', category: 'Pantry' }
      ],
      instructions: [
        'Brown ground beef in large pot',
        'Add diced vegetables and cook until soft',
        'Add wine and cook until reduced',
        'Add tomatoes and simmer for 2 hours',
        'Season and serve over pasta'
      ]
    },
    {
      id: '5',
      name: 'Persian Saffron Rice',
      image: '🍚',
      cookTime: '40 min',
      difficulty: 'Medium',
      calories: 385,
      rating: 4.5,
      tags: ['Persian', 'Rice', 'Aromatic', 'Healthy'],
      description: 'Fragrant basmati rice with saffron, barberries, and almonds',
      baseServings: 6,
      protein: 6,
      carbs: 52,
      fat: 6,
      ingredients: [
        { name: 'Basmati rice', amount: '2', unit: 'cups', category: 'Grains' },
        { name: 'Saffron threads', amount: '0.25', unit: 'tsp', category: 'Spices' },
        { name: 'Barberries', amount: '0.33', unit: 'cup', category: 'Pantry' },
        { name: 'Sliced almonds', amount: '0.25', unit: 'cup', category: 'Nuts' },
        { name: 'Butter', amount: '3', unit: 'tbsp', category: 'Dairy' }
      ],
      instructions: [
        'Soak saffron in warm water',
        'Cook rice until tender',
        'Sauté barberries and almonds in butter',
        'Mix saffron water with rice',
        'Top with barberry mixture'
      ]
    },
    {
      id: '6',
      name: 'Chicken Tikka Masala',
      image: '🍛',
      cookTime: '50 min',
      difficulty: 'Medium',
      calories: 542,
      rating: 4.8,
      tags: ['Indian', 'Spicy', 'Curry', 'Comfort Food'],
      description: 'Creamy tomato-based curry with tender chicken and aromatic spices',
      baseServings: 4,
      protein: 32,
      carbs: 18,
      fat: 22,
      ingredients: [
        { name: 'Chicken breast', amount: '2', unit: 'lbs', category: 'Protein' },
        { name: 'Yogurt', amount: '1', unit: 'cup', category: 'Dairy' },
        { name: 'Garam masala', amount: '2', unit: 'tsp', category: 'Spices' },
        { name: 'Tomato sauce', amount: '1', unit: 'can', category: 'Pantry' },
        { name: 'Heavy cream', amount: '0.5', unit: 'cup', category: 'Dairy' }
      ],
      instructions: [
        'Marinate chicken in yogurt and spices',
        'Cook chicken until browned',
        'Prepare tomato-cream sauce',
        'Combine chicken with sauce',
        'Simmer until flavors blend'
      ]
    },
    {
      id: '7',
      name: 'Fish Tacos with Mango Salsa',
      image: '🌮',
      cookTime: '20 min',
      difficulty: 'Easy',
      calories: 410,
      rating: 4.6,
      tags: ['Mexican', 'Seafood', 'Fresh', 'Quick', 'Healthy'],
      description: 'Grilled fish tacos with fresh mango salsa and lime crema',
      baseServings: 4,
      protein: 25,
      carbs: 35,
      fat: 15,
      ingredients: [
        { name: 'White fish fillets', amount: '1.5', unit: 'lbs', category: 'Protein' },
        { name: 'Mango', amount: '1', unit: 'large', category: 'Fruits' },
        { name: 'Red onion', amount: '0.25', unit: 'cup', category: 'Vegetables' },
        { name: 'Lime', amount: '2', unit: 'pieces', category: 'Fruits' },
        { name: 'Corn tortillas', amount: '8', unit: 'pieces', category: 'Grains' }
      ],
      instructions: [
        'Season and grill fish fillets',
        'Dice mango and mix with onion',
        'Add lime juice to mango salsa',
        'Warm tortillas on grill',
        'Assemble tacos with fish and salsa'
      ]
    }
  ]

  const toggleFilter = (filter: string) => {
    setActiveFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    )
  }

  const toggleCuisineFilter = (filter: string) => {
    setActiveCuisineFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    )
  }

  const filteredRecipes = recipes.filter(recipe => {
    // Apply main filters (if none selected, show all)
    let passesMainFilter = true
    if (activeFilters.length > 0) {
      passesMainFilter = activeFilters.some(filter => {
        if (filter === 'favourites') {
          return favoriteRecipes.includes(recipe.id)
        } else if (filter === 'leftover-opti') {
          return recipe.tags.some(tag => ['Quick', 'Leftover-Friendly', 'Easy'].includes(tag)) || 
                 parseInt(recipe.cookTime) <= 30
        } else if (filter === 'healthy') {
          return recipe.tags.includes('Healthy') || recipe.calories < 400
        }
        return false
      })
    }

    // Apply cuisine filters (if none selected, show all)
    let passesCuisineFilter = true
    if (activeCuisineFilters.length > 0) {
      passesCuisineFilter = activeCuisineFilters.some(filter => {
        if (filter === 'asian') {
          return recipe.tags.some(tag => ['Thai', 'Chinese', 'Japanese', 'Korean', 'Vietnamese'].includes(tag))
        } else if (filter === 'persian') {
          return recipe.tags.includes('Persian')
        } else if (filter === 'italian') {
          return recipe.tags.includes('Italian')
        } else if (filter === 'mexican') {
          return recipe.tags.includes('Mexican')
        } else if (filter === 'french') {
          return recipe.tags.includes('French')
        } else if (filter === 'indian') {
          return recipe.tags.includes('Indian')
        } else if (filter === 'mediterranean') {
          return recipe.tags.includes('Mediterranean')
        }
        return false
      })
    }

    return passesMainFilter && passesCuisineFilter
  })

  const handleViewRecipeDetail = (recipe: Recipe) => {
    setSelectedRecipe(recipe)
    setShowRecipeDetail(true)
  }

  const handleAddToGroceryList = (ingredient: any) => {
    console.log('Adding to grocery list:', ingredient)
    // TODO: Implement actual grocery list functionality
  }

  const handleRateRecipe = (recipeId: string, rating: number) => {
    setUserRatings(prev => ({
      ...prev,
      [recipeId]: rating
    }))
  }

  const handleStartFamilyChoice = (recipe: Recipe) => {
    setSelectedRecipe(recipe)
    setShowRecipeDetail(false)
    setShowFamilyChoice(true)
  }

  const handleCreateFamilyVote = (selectedRecipes: Recipe[]) => {
    console.log('Creating family vote with recipes:', selectedRecipes)
    // TODO: Implement actual family voting system
    // For now, just show an alert
    Alert.alert(
      'Family Vote Created! 🗳️',
      `Your family can now vote between ${selectedRecipes.length} delicious recipes!`,
      [{ text: 'OK', onPress: () => setShowFamilyChoice(false) }]
    )
  }

  const saveRecipe = (id: string) => {
    if (favoriteRecipes.includes(id)) {
      setFavoriteRecipes(favoriteRecipes.filter(recipeId => recipeId !== id))
    } else {
      setFavoriteRecipes([...favoriteRecipes, id])
    }
  }

  const startCooking = (id: string) => {
    const recipe = recipes.find(r => r.id === id)
    if (recipe) {
      handleViewRecipeDetail(recipe)
    }
  }

  const handleRecipeLiked = (recipe: Recipe) => {
    setLikedRecipes([...likedRecipes, recipe])
    if (!favoriteRecipes.includes(recipe.id)) {
      setFavoriteRecipes([...favoriteRecipes, recipe.id])
    }
  }

  const handleRecipeDisliked = (recipe: Recipe) => {
    console.log('Recipe disliked:', recipe.name)
  }

  const openSwipeScreen = () => {
    setShowSwipeScreen(true)
  }

  const closeSwipeScreen = () => {
    setShowSwipeScreen(false)
  }


  const displayRecipes = filteredRecipes

  if (showSwipeScreen) {
    return (
      <RecipeSwipeScreen
        onNavigateBack={closeSwipeScreen}
        onRecipeLiked={handleRecipeLiked}
        onRecipeDisliked={handleRecipeDisliked}
      />
    )
  }

  if (showRecipeDetail && selectedRecipe) {
    return (
      <RecipeDetailScreen
        recipe={selectedRecipe}
        onNavigateBack={() => setShowRecipeDetail(false)}
        fridgeItems={fridgeItems}
        onAddToGroceryList={handleAddToGroceryList}
        onStartFamilyChoice={handleStartFamilyChoice}
        onRateRecipe={handleRateRecipe}
        userRating={userRatings[selectedRecipe.id]}
      />
    )
  }

  if (showFamilyChoice) {
    return (
      <FamilyChoiceScreen
        onNavigateBack={() => setShowFamilyChoice(false)}
        onCreateVote={handleCreateFamilyVote}
        initialRecipe={selectedRecipe || undefined}
      />
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={Colors.gradientBackground}
        style={styles.backgroundGradient}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>

            {/* Daily Inspiration */}
            <Card style={styles.dailyCard}>
              <LinearGradient
                colors={['#10B981', '#3B82F6']}
                style={styles.dailyGradient}
              >
                <View style={styles.dailyContent}>
                  <Text style={styles.dailyTitle}>🌟 Discover More Delicious Recipes</Text>
                  <Text style={styles.dailyRecipe}>Mediterranean Salmon with Herbs</Text>
                  <Text style={styles.dailyDescription}>
                    Swipe, like, and find your next favorite dish!
                  </Text>
                  <Button variant="secondary" size="sm" style={styles.dailyButton} onPress={openSwipeScreen}>
                    More Recipes
                  </Button>
                </View>
              </LinearGradient>
            </Card>

            {/* Filter Bar */}
            <FilterBar 
              activeFilters={activeFilters} 
              activeCuisineFilters={activeCuisineFilters}
              onFilterToggle={toggleFilter} 
              onCuisineFilterToggle={toggleCuisineFilter}
            />


            {/* Recipe Grid */}
            {activeFilters.includes('favourites') && favoriteRecipes.length === 0 ? (
              <View style={styles.emptyFavorites}>
                <Text style={styles.emptyFavoritesEmoji}>💔</Text>
                <Text style={styles.emptyFavoritesTitle}>No Favorites Yet</Text>
                <Text style={styles.emptyFavoritesText}>
                  Use the recipe swipe feature to discover and like recipes!
                </Text>
                <Button variant="outline" onPress={openSwipeScreen}>
                  Discover Recipes
                </Button>
              </View>
            ) : (
              <View style={styles.recipesGrid}>
                {displayRecipes.map(recipe => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    onSave={saveRecipe}
                    onCook={startCooking}
                    onViewDetails={handleViewRecipeDetail}
                    isFavorite={favoriteRecipes.includes(recipe.id)}
                  />
                ))}
              </View>
            )}

            {/* Load More */}
            <Button variant="outline" size="lg" style={styles.loadMoreButton}>
              Load More Recipes
            </Button>
          </View>
        </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.screenPadding,
    gap: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: Typography.sizes.section,
    fontWeight: Typography.weights.bold,
    color: Colors.foreground,
    fontFamily: Typography.fontBrand,
  },
  subtitle: {
    fontSize: Typography.sizes.caption,
    color: Colors.mutedForeground,
    marginTop: Spacing.xs,
    fontFamily: Typography.fontBody,
  },

  // Daily Inspiration
  dailyCard: {
    overflow: 'hidden',
  },
  dailyGradient: {
    padding: Spacing.cardPadding,
    borderRadius: BorderRadius.lg,
  },
  dailyContent: {
    alignItems: 'center',
  },
  dailyTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.primaryForeground,
    marginBottom: Spacing.sm,
  },
  dailyRecipe: {
    fontSize: Typography.sizes.subsection,
    fontWeight: Typography.weights.bold,
    color: Colors.primaryForeground,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  dailyDescription: {
    fontSize: Typography.sizes.caption,
    color: Colors.primaryForeground,
    textAlign: 'center',
    opacity: 0.9,
    marginBottom: Spacing.lg,
  },
  dailyButton: {
    backgroundColor: Colors.primaryForeground,
  },

  // Filter Bar
  filtersContainer: {
    gap: Spacing.md,
  },
  filterScrollView: {
    marginHorizontal: -Spacing.screenPadding,
  },
  filterContainer: {
    paddingHorizontal: Spacing.screenPadding,
    gap: Spacing.sm,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.muted,
    gap: Spacing.sm,
  },
  activeFilterButton: {
    backgroundColor: Colors.accent,
  },
  cuisineFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.brand.gray100,
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  activeCuisineFilterButton: {
    backgroundColor: Colors.brand.blue50,
    borderColor: Colors.brand.blue500,
  },
  filterEmoji: {
    fontSize: 16,
  },
  filterText: {
    fontSize: Typography.sizes.caption,
    color: Colors.foreground,
    fontWeight: Typography.weights.medium,
  },
  activeFilterText: {
    color: Colors.primaryForeground,
  },
  cuisineFilterText: {
    fontSize: Typography.sizes.small,
    color: Colors.mutedForeground,
    fontWeight: Typography.weights.medium,
  },
  activeCuisineFilterText: {
    color: Colors.brand.blue600,
    fontWeight: Typography.weights.semibold,
  },


  // Recipe Cards
  recipesGrid: {
    gap: Spacing.lg,
  },
  recipeCard: {
    overflow: 'hidden',
  },
  recipeImageContainer: {
    position: 'relative',
    height: 180,
  },
  recipePlaceholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.brand.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipeImageEmoji: {
    fontSize: 48,
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
  saveButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 16,
  },
  recipeContent: {
    gap: Spacing.sm,
  },
  recipeName: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.foreground,
  },
  recipeDescription: {
    fontSize: Typography.sizes.caption,
    color: Colors.mutedForeground,
    lineHeight: Typography.sizes.caption * Typography.lineHeights.normal,
  },
  recipeStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  recipeStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  recipeStatEmoji: {
    fontSize: 14,
  },
  recipeStatText: {
    fontSize: Typography.sizes.small,
    color: Colors.mutedForeground,
  },
  recipeTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  recipeTag: {
    backgroundColor: Colors.brand.blue50,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  recipeTagText: {
    fontSize: Typography.sizes.small,
    color: Colors.accent,
    fontWeight: Typography.weights.medium,
  },
  cookButton: {
    marginTop: Spacing.sm,
  },
  loadMoreButton: {
    width: '100%',
  },
  emptyFavorites: {
    alignItems: 'center',
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  emptyFavoritesEmoji: {
    fontSize: 60,
  },
  emptyFavoritesTitle: {
    fontSize: Typography.sizes.subsection,
    fontWeight: Typography.weights.bold,
    color: Colors.foreground,
  },
  emptyFavoritesText: {
    fontSize: Typography.sizes.base,
    color: Colors.mutedForeground,
    textAlign: 'center',
    lineHeight: 22,
  },
})