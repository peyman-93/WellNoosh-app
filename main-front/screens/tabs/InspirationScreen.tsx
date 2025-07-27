import React, { useState } from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native'
import { Colors } from '../../src/constants/DesignTokens'

interface Recipe {
  id: string
  name: string
  description: string
  cookTime: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  calories: number
  rating: number
  tags?: string[]
}

const SAFE_RECIPES: Recipe[] = [
  {
    id: '1',
    name: 'Mediterranean Quinoa Bowl',
    description: 'Fresh quinoa bowl with roasted vegetables',
    cookTime: '25 min',
    difficulty: 'Easy',
    calories: 456,
    rating: 4.8,
    tags: ['Healthy', 'Mediterranean', 'Vegetarian']
  },
  {
    id: '2',
    name: 'Spicy Thai Coconut Curry',
    description: 'Aromatic curry with coconut milk',
    cookTime: '35 min',
    difficulty: 'Medium',
    calories: 523,
    rating: 4.6,
    tags: ['Thai', 'Spicy', 'Coconut']
  }
]

export default function InspirationScreen({ route, navigation }: { route: any, navigation: any }) {
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [favoriteRecipes, setFavoriteRecipes] = useState<string[]>([])

  // Ensure all arrays are safely initialized
  const safeActiveFilters = activeFilters || []
  const safeFavoriteRecipes = favoriteRecipes || []
  const safeRecipes = SAFE_RECIPES || []

  // Safe filtering with null checks
  const filteredRecipes = safeRecipes.filter(recipe => {
    if (!recipe) return false
    
    // Safe tags check
    const recipeTags = recipe.tags || []
    
    if (safeActiveFilters.length === 0) {
      return true
    }

    return safeActiveFilters.some(filter => {
      if (filter === 'favourites') {
        return safeFavoriteRecipes.includes(recipe.id)
      }
      if (filter === 'healthy') {
        return recipeTags.includes('Healthy') || recipe.calories < 400
      }
      return false
    })
  })

  const toggleFilter = (filter: string) => {
    setActiveFilters(prev => {
      const safePrev = prev || []
      return safePrev.includes(filter) 
        ? safePrev.filter(f => f !== filter)
        : [...safePrev, filter]
    })
  }

  const toggleFavorite = (recipeId: string) => {
    setFavoriteRecipes(prev => {
      const safePrev = prev || []
      return safePrev.includes(recipeId)
        ? safePrev.filter(id => id !== recipeId)
        : [...safePrev, recipeId]
    })
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.title}>Cooking Inspiration</Text>

        {/* Filters */}
        <View style={styles.filterContainer}>
          <TouchableOpacity 
            style={[
              styles.filterButton,
              safeActiveFilters.includes('healthy') && styles.activeFilter
            ]}
            onPress={() => toggleFilter('healthy')}
          >
            <Text style={styles.filterText}>🥗 Healthy</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.filterButton,
              safeActiveFilters.includes('favourites') && styles.activeFilter
            ]}
            onPress={() => toggleFilter('favourites')}
          >
            <Text style={styles.filterText}>❤️ Favorites</Text>
          </TouchableOpacity>
        </View>

        {/* Recipes */}
        <View style={styles.recipesContainer}>
          {(filteredRecipes || []).map((recipe) => {
            if (!recipe) return null
            
            const isFavorite = safeFavoriteRecipes.includes(recipe.id)
            const recipeTags = recipe.tags || []
            
            return (
              <View key={recipe.id} style={styles.recipeCard}>
                <View style={styles.recipeHeader}>
                  <Text style={styles.recipeName}>{recipe.name}</Text>
                  <TouchableOpacity onPress={() => toggleFavorite(recipe.id)}>
                    <Text style={styles.favoriteIcon}>
                      {isFavorite ? '❤️' : '🤍'}
                    </Text>
                  </TouchableOpacity>
                </View>
                
                <Text style={styles.recipeDescription}>{recipe.description}</Text>
                
                <View style={styles.recipeStats}>
                  <Text style={styles.statText}>⏱️ {recipe.cookTime}</Text>
                  <Text style={styles.statText}>🔥 {recipe.calories} cal</Text>
                  <Text style={styles.statText}>⭐ {recipe.rating}</Text>
                </View>

                {recipeTags.length > 0 && (
                  <View style={styles.tagsContainer}>
                    {recipeTags.slice(0, 3).map((tag, index) => (
                      <View key={`${recipe.id}-tag-${index}`} style={styles.tag}>
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )
          })}
        </View>

        {filteredRecipes.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No recipes found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  activeFilter: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    fontSize: 14,
    color: Colors.text,
  },
  recipesContainer: {
    gap: 16,
  },
  recipeCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recipeName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  favoriteIcon: {
    fontSize: 20,
  },
  recipeDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  recipeStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  statText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  tagsContainer: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: Colors.muted,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
})