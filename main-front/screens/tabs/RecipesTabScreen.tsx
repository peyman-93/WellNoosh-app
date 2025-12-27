import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native'
import { Colors } from '../../src/constants/DesignTokens'
import { ScreenWrapper } from '../../src/components/layout/ScreenWrapper'
import { supabase } from '../../src/services/supabase'
import { useAuth } from '../../src/context/supabase-provider'
import RecipeDetailScreen from '../RecipeDetailScreen'
import { recipeCacheService, CachedRecipe } from '../../src/services/recipeCacheService'
import { recommendationService } from '../../src/services/recommendationService'

interface Recipe {
  id: string
  title: string
  image_url?: string
  category?: string
  area?: string
  calories?: string | number
  protein?: string | number
  carbs?: number
  fat?: number
  fiber?: number
  servings?: number
  instructions?: string | string[]
  ingredients?: { name: string; amount: string; category: string }[]
  cookTime?: string
  difficulty?: 'Easy' | 'Medium' | 'Hard'
  rating?: number
  tags?: string[]
  description?: string
  liked_at?: string
}

interface DetailRecipe {
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
  fiber: number
}

export default function RecipesTabScreen({ route, navigation }: { route: any, navigation: any }) {
  const { session } = useAuth()
  const [likedRecipes, setLikedRecipes] = useState<Recipe[]>([])
  const [cookedRecipes, setCookedRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'liked' | 'cooked'>('liked')
  const [selectedRecipe, setSelectedRecipe] = useState<DetailRecipe | null>(null)
  const [isPersonalizing, setIsPersonalizing] = useState(false)

  // Handle start cooking - personalize the recipe based on user profile
  const handleStartCooking = async () => {
    if (!selectedRecipe || !session?.user?.id) return

    setIsPersonalizing(true)
    try {
      console.log('🍳 Personalizing recipe for cooking:', selectedRecipe.name)
      const result = await recommendationService.personalizeForCooking(
        session.user.id,
        selectedRecipe.id
      )

      if (result.error || !result.recipe) {
        Alert.alert('Note', 'Could not personalize recipe. Using default instructions.')
        return
      }

      // Update the selected recipe with personalized instructions
      const personalizedRecipe = result.recipe
      setSelectedRecipe(prev => {
        if (!prev) return null
        return {
          ...prev,
          instructions: personalizedRecipe.structured_instructions?.map(s => s.instruction) || prev.instructions,
          cookTime: personalizedRecipe.total_cook_time || prev.cookTime,
          difficulty: (personalizedRecipe.estimated_difficulty as 'Easy' | 'Medium' | 'Hard') || prev.difficulty
        }
      })

      // Show personalization info
      if (result.recipe.safety_warnings && result.recipe.safety_warnings.length > 0) {
        Alert.alert(
          '⚠️ Safety Note',
          result.recipe.safety_warnings.join('\n'),
          [{ text: 'OK', style: 'default' }]
        )
      } else if (result.recipe.substitution_notes && result.recipe.substitution_notes.length > 0) {
        Alert.alert(
          '✨ Personalized for You',
          `Suggestions:\n${result.recipe.substitution_notes.join('\n')}`,
          [{ text: 'Got it!', style: 'default' }]
        )
      }

      console.log('✅ Recipe personalized successfully')
    } catch (error) {
      console.error('Error personalizing recipe:', error)
      Alert.alert('Error', 'Failed to personalize recipe. Using default instructions.')
    } finally {
      setIsPersonalizing(false)
    }
  }

  const convertToDetailRecipe = (recipe: Recipe): DetailRecipe => {
    let instructionsList: string[]
    if (Array.isArray(recipe.instructions)) {
      instructionsList = recipe.instructions.filter(line => line.trim().length > 0)
    } else if (typeof recipe.instructions === 'string') {
      instructionsList = recipe.instructions.split('\n').filter(line => line.trim().length > 0)
    } else {
      instructionsList = ['No instructions available']
    }
    
    const getCategoryEmoji = (category?: string): string => {
      const emojiMap: Record<string, string> = {
        'Beef': '🥩',
        'Chicken': '🍗',
        'Dessert': '🍰',
        'Lamb': '🐑',
        'Miscellaneous': '🍽️',
        'Pasta': '🍝',
        'Pork': '🥓',
        'Seafood': '🐟',
        'Side': '🥗',
        'Starter': '🥗',
        'Vegan': '🥬',
        'Vegetarian': '🥕',
        'Breakfast': '🍳',
        'Goat': '🐐'
      }
      return emojiMap[category || ''] || '🍽️'
    }

    const ingredients = recipe.ingredients && recipe.ingredients.length > 0
      ? recipe.ingredients.map(ing => ({
          name: ing.name,
          amount: ing.amount,
          unit: '',
          category: ing.category || 'Other'
        }))
      : [{ name: 'See full recipe for ingredients', amount: '-', unit: '', category: 'Info' }]

    const calories = typeof recipe.calories === 'number' ? recipe.calories : parseInt(String(recipe.calories) || '400')
    const protein = typeof recipe.protein === 'number' ? recipe.protein : parseInt(String(recipe.protein) || '20')
    
    return {
      id: recipe.id,
      name: recipe.title,
      image: recipe.image_url || getCategoryEmoji(recipe.category),
      cookTime: recipe.cookTime || '30 mins',
      difficulty: recipe.difficulty || 'Medium',
      rating: recipe.rating || 4.5,
      tags: recipe.tags || [recipe.category || 'General', recipe.area || 'International'].filter(Boolean),
      description: recipe.description || `A delicious ${recipe.category || ''} recipe${recipe.area ? ` from ${recipe.area}` : ''}.`,
      baseServings: recipe.servings || 4,
      ingredients,
      instructions: instructionsList,
      calories,
      protein,
      carbs: recipe.carbs || 45,
      fat: recipe.fat || 15,
      fiber: recipe.fiber || 5
    }
  }

  useEffect(() => {
    if (session?.user?.id) {
      loadRecipes()
    }
  }, [session?.user?.id])

  const loadRecipes = async () => {
    try {
      setLoading(true)

      // Load from local cache (has full recipe data including ingredients)
      const cachedLiked = await recipeCacheService.getLikedRecipes()
      const cachedCooked = await recipeCacheService.getCookedRecipes()

      console.log('📦 Cache check - Liked:', cachedLiked.length, 'Cooked:', cachedCooked.length)

      // Convert cached recipes to Recipe format
      const convertCachedToRecipe = (cached: CachedRecipe): Recipe => ({
        id: cached.id,
        title: cached.title,
        image_url: cached.image_url,
        category: cached.category,
        area: cached.area,
        calories: cached.calories,
        protein: cached.protein,
        carbs: cached.carbs,
        fat: cached.fat,
        fiber: cached.fiber,
        servings: cached.servings,
        instructions: cached.instructions,
        ingredients: cached.ingredients,
        cookTime: cached.cookTime,
        difficulty: cached.difficulty,
        rating: cached.rating,
        tags: cached.tags,
        description: cached.description
      })

      // Create maps for quick lookup of cached recipes
      const cachedLikedMap = new Map(cachedLiked.map(r => [r.id, r]))
      const cachedCookedMap = new Map(cachedCooked.map(r => [r.id, r]))

      // Try to fetch from Supabase to get the authoritative list of liked/cooked recipes
      // Then merge with cache (cache has full data, Supabase has IDs)
      // If Supabase fails, fall back to cache only
      const { data: likedData, error: likedError } = await supabase
        .from('recipe_events')
        .select('recipe_id, created_at')
        .eq('user_id', session?.user?.id)
        .eq('event', 'like')
        .order('created_at', { ascending: false })

      if (likedError) {
        console.error('❌ Error loading liked recipes from Supabase:', likedError)
        // Fall back to cache only when Supabase fails
        if (cachedLiked.length > 0) {
          console.log('📦 Using cached liked recipes (offline mode):', cachedLiked.length)
          setLikedRecipes(cachedLiked.map(convertCachedToRecipe))
        } else {
          setLikedRecipes([])
        }
      } else {
        const likedRecipeIds = [...new Set(likedData?.map(item => item.recipe_id) || [])]
        console.log('📡 Supabase liked IDs:', likedRecipeIds.length)

        // Build liked recipes list: prefer cache (has full data), fallback to Supabase fetch
        const finalLikedRecipes: Recipe[] = []
        const missingLikedIds: string[] = []
        const supabaseIdSet = new Set(likedRecipeIds)

        // First add recipes from Supabase list, preferring cached versions
        for (const id of likedRecipeIds) {
          const cached = cachedLikedMap.get(id)
          if (cached) {
            finalLikedRecipes.push(convertCachedToRecipe(cached))
          } else {
            missingLikedIds.push(id)
          }
        }

        // Also add cached-only recipes (liked offline, not yet synced to Supabase)
        for (const cached of cachedLiked) {
          if (!supabaseIdSet.has(cached.id)) {
            console.log('📦 Adding cached-only liked recipe:', cached.title)
            finalLikedRecipes.push(convertCachedToRecipe(cached))
          }
        }

        // Fetch missing liked recipes from Supabase
        if (missingLikedIds.length > 0) {
          console.log('📡 Fetching', missingLikedIds.length, 'missing liked recipes from Supabase')
          const { data: recipesData, error: recipesError } = await supabase
            .from('recipes')
            .select('id, title, image_url, category, area, servings, instructions')
            .in('id', missingLikedIds)

          if (recipesError) {
            console.error('❌ Error fetching recipe details:', recipesError)
          }

          if (recipesData) {
            finalLikedRecipes.push(...recipesData)
          }
        }

        setLikedRecipes(finalLikedRecipes)
        console.log('✅ Liked recipes loaded:', finalLikedRecipes.length)
      }

      // Same for cooked recipes
      const { data: cookedData, error: cookedError } = await supabase
        .from('recipe_events')
        .select('recipe_id, created_at')
        .eq('user_id', session?.user?.id)
        .eq('event', 'cook_now')
        .order('created_at', { ascending: false })

      if (cookedError) {
        console.error('❌ Error loading cooked recipes from Supabase:', cookedError)
        // Fall back to cache only when Supabase fails
        if (cachedCooked.length > 0) {
          console.log('📦 Using cached cooked recipes (offline mode):', cachedCooked.length)
          setCookedRecipes(cachedCooked.map(convertCachedToRecipe))
        } else {
          setCookedRecipes([])
        }
      } else {
        const cookedRecipeIds = [...new Set(cookedData?.map(item => item.recipe_id) || [])]
        console.log('📡 Supabase cooked IDs:', cookedRecipeIds.length)

        const finalCookedRecipes: Recipe[] = []
        const missingCookedIds: string[] = []
        const supabaseCookedIdSet = new Set(cookedRecipeIds)

        // First add recipes from Supabase list, preferring cached versions
        for (const id of cookedRecipeIds) {
          const cached = cachedCookedMap.get(id)
          if (cached) {
            finalCookedRecipes.push(convertCachedToRecipe(cached))
          } else {
            missingCookedIds.push(id)
          }
        }

        // Also add cached-only recipes (cooked offline, not yet synced to Supabase)
        for (const cached of cachedCooked) {
          if (!supabaseCookedIdSet.has(cached.id)) {
            console.log('📦 Adding cached-only cooked recipe:', cached.title)
            finalCookedRecipes.push(convertCachedToRecipe(cached))
          }
        }

        // Fetch missing cooked recipes from Supabase
        if (missingCookedIds.length > 0) {
          console.log('📡 Fetching', missingCookedIds.length, 'missing cooked recipes from Supabase')
          const { data: recipesData, error: recipesError } = await supabase
            .from('recipes')
            .select('id, title, image_url, category, area, servings, instructions')
            .in('id', missingCookedIds)

          if (!recipesError && recipesData) {
            finalCookedRecipes.push(...recipesData)
          }
        }

        setCookedRecipes(finalCookedRecipes)
        console.log('✅ Cooked recipes loaded:', finalCookedRecipes.length)
      }

    } catch (error) {
      console.error('Error loading recipes:', error)
    } finally {
      setLoading(false)
    }
  }

  const displayedRecipes = activeTab === 'liked' ? likedRecipes : cookedRecipes

  if (loading) {
    return (
      <ScreenWrapper>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading your favorite recipes...</Text>
        </View>
      </ScreenWrapper>
    )
  }

  if (selectedRecipe) {
    return (
      <RecipeDetailScreen
        recipe={selectedRecipe}
        onNavigateBack={() => setSelectedRecipe(null)}
        onStartCooking={handleStartCooking}
      />
    )
  }

  return (
    <ScreenWrapper>
      <ScrollView style={styles.content}>
        <Text style={styles.title}>My Recipes</Text>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'liked' && styles.activeTab
            ]}
            onPress={() => setActiveTab('liked')}
          >
            <Text style={[
              styles.tabText,
              activeTab === 'liked' && styles.activeTabText
            ]}>
              💚 Liked ({likedRecipes.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'cooked' && styles.activeTab
            ]}
            onPress={() => setActiveTab('cooked')}
          >
            <Text style={[
              styles.tabText,
              activeTab === 'cooked' && styles.activeTabText
            ]}>
              🍳 Cooked ({cookedRecipes.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Recipe List */}
        {displayedRecipes.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>{activeTab === 'liked' ? '💚' : '🍳'}</Text>
            <Text style={styles.emptyTitle}>
              {activeTab === 'liked' ? 'No liked recipes yet' : 'No cooked recipes yet'}
            </Text>
            <Text style={styles.emptyText}>
              {activeTab === 'liked'
                ? 'Start swiping on recipes to build your collection!'
                : 'Click "Cook This Now" on recipes you want to try!'}
            </Text>
          </View>
        ) : (
          <View style={styles.recipeList}>
            {displayedRecipes.map((recipe) => (
              <TouchableOpacity
                key={recipe.id}
                style={styles.recipeCard}
                onPress={() => {
                  const detailRecipe = convertToDetailRecipe(recipe)
                  setSelectedRecipe(detailRecipe)
                }}
              >
                {recipe.image_url ? (
                  <Image
                    source={{ uri: recipe.image_url }}
                    style={styles.recipeImage}
                  />
                ) : (
                  <View style={[styles.recipeImage, styles.placeholderImage]}>
                    <Text style={styles.placeholderText}>🍽️</Text>
                  </View>
                )}

                <View style={styles.recipeInfo}>
                  <Text style={styles.recipeName} numberOfLines={2}>
                    {recipe.title}
                  </Text>

                  <View style={styles.recipeMetaContainer}>
                    {recipe.category && (
                      <View style={styles.metaTag}>
                        <Text style={styles.metaText}>{recipe.category}</Text>
                      </View>
                    )}
                    {recipe.area && (
                      <View style={styles.metaTag}>
                        <Text style={styles.metaText}>{recipe.area}</Text>
                      </View>
                    )}
                  </View>

                  {recipe.servings && (
                    <Text style={styles.servingsText}>
                      🍽️ {recipe.servings} servings
                    </Text>
                  )}
                </View>

                <View style={styles.likedBadge}>
                  <Text style={styles.likedIcon}>💚</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenWrapper>
  )
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  activeTabText: {
    color: 'white',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  recipeList: {
    paddingHorizontal: 20,
    gap: 16,
    paddingBottom: 100,
  },
  recipeCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 16,
  },
  recipeImage: {
    width: 120,
    height: 120,
    backgroundColor: Colors.surface,
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 40,
  },
  recipeInfo: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  recipeName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  recipeMetaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  metaTag: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  metaText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  servingsText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  likedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  likedIcon: {
    fontSize: 20,
  },
})
