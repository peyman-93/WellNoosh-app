import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native'
import { Colors } from '../../src/constants/DesignTokens'
import { ScreenWrapper } from '../../src/components/layout/ScreenWrapper'
import { supabase } from '../../src/services/supabase'
import { useAuth } from '../../src/context/supabase-provider'

interface Recipe {
  id: string
  title: string
  image_url?: string
  category?: string
  area?: string
  calories?: string
  protein?: string
  servings?: number
  instructions?: string
  liked_at?: string
}

export default function RecipesTabScreen({ route, navigation }: { route: any, navigation: any }) {
  const { session } = useAuth()
  const [likedRecipes, setLikedRecipes] = useState<Recipe[]>([])
  const [cookedRecipes, setCookedRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'liked' | 'cooked'>('liked')

  useEffect(() => {
    if (session?.user?.id) {
      loadRecipes()
    }
  }, [session?.user?.id])

  const loadRecipes = async () => {
    try {
      setLoading(true)

      // Fetch liked recipes from recipe_events
      const { data: likedData, error: likedError } = await supabase
        .from('recipe_events')
        .select('recipe_id, created_at')
        .eq('user_id', session?.user?.id)
        .eq('event', 'like')
        .order('created_at', { ascending: false })

      console.log('📋 Liked recipes query result:', { likedData, likedError, userId: session?.user?.id })

      if (likedError) {
        console.error('❌ Error loading liked recipes:', likedError)
      }

      // Fetch cooked recipes from recipe_events
      const { data: cookedData, error: cookedError } = await supabase
        .from('recipe_events')
        .select('recipe_id, created_at')
        .eq('user_id', session?.user?.id)
        .eq('event', 'cook_now')
        .order('created_at', { ascending: false })

      console.log('🍳 Cooked recipes query result:', { cookedData, cookedError, userId: session?.user?.id })

      if (cookedError) {
        console.error('❌ Error loading cooked recipes:', cookedError)
      }

      // Get unique recipe IDs
      const likedRecipeIds = [...new Set(likedData?.map(item => item.recipe_id) || [])]
      const cookedRecipeIds = [...new Set(cookedData?.map(item => item.recipe_id) || [])]

      console.log('🔍 Unique recipe IDs:', { likedRecipeIds, cookedRecipeIds })

      // Fetch recipe details for liked recipes
      if (likedRecipeIds.length > 0) {
        console.log('🔍 Searching for recipes with IDs:', likedRecipeIds)
        console.log('🔍 ID type check:', typeof likedRecipeIds[0], likedRecipeIds[0])

        const { data: recipesData, error: recipesError } = await supabase
          .from('recipes')
          .select('id, title, image_url, category, area, servings, instructions')
          .in('id', likedRecipeIds)

        console.log('📝 Liked recipes details:', { recipesData, recipesError })

        if (recipesError) {
          console.error('❌ Error fetching recipe details:', recipesError)
        }

        if (recipesData) {
          console.log('✅ Found', recipesData.length, 'recipes out of', likedRecipeIds.length, 'requested')
          if (recipesData.length === 0) {
            console.error('❌ Recipe IDs exist in recipe_events but NOT found in recipes table!')
            console.error('❌ This likely means recipe IDs don\'t match - check data types')

            // Try to fetch a sample recipe to see what IDs look like
            const { data: sampleRecipes } = await supabase
              .from('recipes')
              .select('id, title')
              .limit(3)
            console.log('📋 Sample recipes in database:', sampleRecipes)
          }
          setLikedRecipes(recipesData)
        }
      } else {
        setLikedRecipes([])
      }

      // Fetch recipe details for cooked recipes
      if (cookedRecipeIds.length > 0) {
        const { data: recipesData, error: recipesError } = await supabase
          .from('recipes')
          .select('id, title, image_url, category, area, servings, instructions')
          .in('id', cookedRecipeIds)

        console.log('📝 Cooked recipes details:', { recipesData, recipesError })

        if (!recipesError && recipesData) {
          setCookedRecipes(recipesData)
        }
      } else {
        setCookedRecipes([])
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
                  // TODO: Navigate to recipe detail screen
                  console.log('View recipe:', recipe.title)
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
