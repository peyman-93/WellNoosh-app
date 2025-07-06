import React, { useState } from 'react'
import { View, Text, SafeAreaView, ScrollView, StyleSheet, Pressable, Image } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/DesignTokens'

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
}

interface RecipeCardProps {
  recipe: Recipe
  onSave: (id: string) => void
  onCook: (id: string) => void
}

function RecipeCard({ recipe, onSave, onCook }: RecipeCardProps) {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return Colors.success
      case 'Medium': return Colors.warning
      case 'Hard': return Colors.destructive
      default: return Colors.mutedForeground
    }
  }

  return (
    <Card style={styles.recipeCard}>
      <View style={styles.recipeImageContainer}>
        <View style={styles.recipePlaceholderImage}>
          <Text style={styles.recipeImageEmoji}>🍽️</Text>
        </View>
        <View style={styles.recipeOverlay}>
          <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(recipe.difficulty) }]}>
            <Text style={styles.difficultyText}>{recipe.difficulty}</Text>
          </View>
          <Pressable style={styles.saveButton} onPress={() => onSave(recipe.id)}>
            <Text style={styles.saveButtonText}>🤍</Text>
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
            <Text style={styles.recipeStatEmoji}>⭐</Text>
            <Text style={styles.recipeStatText}>{recipe.rating}/5</Text>
          </View>
        </View>
        
        <View style={styles.recipeTags}>
          {recipe.tags.slice(0, 3).map((tag, index) => (
            <View key={index} style={styles.recipeTag}>
              <Text style={styles.recipeTagText}>{tag}</Text>
            </View>
          ))}
        </View>
        
        <Button size="sm" onPress={() => onCook(recipe.id)} style={styles.cookButton}>
          Start Cooking
        </Button>
      </CardContent>
    </Card>
  )
}

interface FilterBarProps {
  activeFilter: string
  onFilterChange: (filter: string) => void
}

function FilterBar({ activeFilter, onFilterChange }: FilterBarProps) {
  const filters = [
    { id: 'all', label: 'All', emoji: '🍽️' },
    { id: 'quick', label: 'Quick', emoji: '⚡' },
    { id: 'healthy', label: 'Healthy', emoji: '🥗' },
    { id: 'trending', label: 'Trending', emoji: '🔥' },
    { id: 'saved', label: 'Saved', emoji: '🤍' }
  ]

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false} 
      style={styles.filterScrollView}
      contentContainerStyle={styles.filterContainer}
    >
      {filters.map(filter => (
        <Pressable
          key={filter.id}
          style={[
            styles.filterButton,
            activeFilter === filter.id && styles.activeFilterButton
          ]}
          onPress={() => onFilterChange(filter.id)}
        >
          <Text style={styles.filterEmoji}>{filter.emoji}</Text>
          <Text style={[
            styles.filterText,
            activeFilter === filter.id && styles.activeFilterText
          ]}>
            {filter.label}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  )
}

export default function V3InspirationScreen() {
  const [activeFilter, setActiveFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const recipes: Recipe[] = [
    {
      id: '1',
      name: 'Mediterranean Quinoa Bowl',
      image: '',
      cookTime: '25 min',
      difficulty: 'Easy',
      calories: 456,
      rating: 4.8,
      tags: ['Healthy', 'Mediterranean', 'Vegetarian'],
      description: 'Fresh quinoa bowl with roasted vegetables, feta cheese, and lemon dressing'
    },
    {
      id: '2',
      name: 'Spicy Thai Coconut Curry',
      image: '',
      cookTime: '35 min',
      difficulty: 'Medium',
      calories: 523,
      rating: 4.6,
      tags: ['Thai', 'Spicy', 'Coconut'],
      description: 'Aromatic curry with coconut milk, fresh herbs, and your choice of protein'
    },
    {
      id: '3',
      name: 'Quick Avocado Toast',
      image: '',
      cookTime: '5 min',
      difficulty: 'Easy',
      calories: 287,
      rating: 4.3,
      tags: ['Quick', 'Breakfast', 'Healthy'],
      description: 'Perfectly ripe avocado on sourdough with a sprinkle of everything seasoning'
    },
    {
      id: '4',
      name: 'Homemade Beef Ragu',
      image: '',
      cookTime: '2 hours',
      difficulty: 'Hard',
      calories: 658,
      rating: 4.9,
      tags: ['Italian', 'Comfort Food', 'Slow Cook'],
      description: 'Rich, slow-cooked beef ragu with fresh herbs and parmesan cheese'
    }
  ]

  const filteredRecipes = recipes.filter(recipe => {
    if (activeFilter === 'all') return true
    if (activeFilter === 'quick') return recipe.cookTime.includes('5 min') || recipe.cookTime.includes('10 min')
    if (activeFilter === 'healthy') return recipe.tags.includes('Healthy')
    if (activeFilter === 'trending') return recipe.rating >= 4.5
    return false
  })

  const saveRecipe = (id: string) => {
    console.log('Saving recipe:', id)
  }

  const startCooking = (id: string) => {
    console.log('Starting to cook recipe:', id)
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={Colors.gradientBackground}
        style={styles.backgroundGradient}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Recipe Inspiration</Text>
              <Text style={styles.subtitle}>Discover delicious recipes tailored for you</Text>
            </View>

            {/* Daily Inspiration */}
            <Card style={styles.dailyCard}>
              <LinearGradient
                colors={['#10B981', '#3B82F6']}
                style={styles.dailyGradient}
              >
                <View style={styles.dailyContent}>
                  <Text style={styles.dailyTitle}>🌟 Today's Inspiration</Text>
                  <Text style={styles.dailyRecipe}>Mediterranean Salmon with Herbs</Text>
                  <Text style={styles.dailyDescription}>
                    Perfect for your health goals • 30 min • 420 cal
                  </Text>
                  <Button variant="secondary" size="sm" style={styles.dailyButton}>
                    View Recipe
                  </Button>
                </View>
              </LinearGradient>
            </Card>

            {/* Filter Bar */}
            <FilterBar activeFilter={activeFilter} onFilterChange={setActiveFilter} />

            {/* AI Suggestions */}
            <Card>
              <CardHeader>
                <CardTitle>🤖 AI Recipe Suggestions</CardTitle>
              </CardHeader>
              <CardContent>
                <Text style={styles.aiDescription}>
                  Based on your pantry items and dietary preferences
                </Text>
                <View style={styles.aiSuggestions}>
                  <Pressable style={styles.aiSuggestion}>
                    <Text style={styles.aiSuggestionEmoji}>🥛</Text>
                    <Text style={styles.aiSuggestionText}>Use your milk (expires in 2 days)</Text>
                  </Pressable>
                  <Pressable style={styles.aiSuggestion}>
                    <Text style={styles.aiSuggestionEmoji}>🍗</Text>
                    <Text style={styles.aiSuggestionText}>Leftover chicken recipes</Text>
                  </Pressable>
                  <Pressable style={styles.aiSuggestion}>
                    <Text style={styles.aiSuggestionEmoji}>🥗</Text>
                    <Text style={styles.aiSuggestionText}>Mediterranean diet matches</Text>
                  </Pressable>
                </View>
              </CardContent>
            </Card>

            {/* Recipe Grid */}
            <View style={styles.recipesGrid}>
              {filteredRecipes.map(recipe => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onSave={saveRecipe}
                  onCook={startCooking}
                />
              ))}
            </View>

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

  // AI Suggestions
  aiDescription: {
    fontSize: Typography.sizes.caption,
    color: Colors.mutedForeground,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  aiSuggestions: {
    gap: Spacing.sm,
  },
  aiSuggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.brand.violet50,
    borderRadius: BorderRadius.sm,
    gap: Spacing.md,
  },
  aiSuggestionEmoji: {
    fontSize: 20,
  },
  aiSuggestionText: {
    fontSize: Typography.sizes.caption,
    color: Colors.foreground,
    fontWeight: Typography.weights.medium,
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
})