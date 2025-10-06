import apiClient from './apiClient'
import { supabase } from './supabase'

// Configuration for recommendation API
const RECOMMENDATION_API_URL = process.env.EXPO_PUBLIC_RECOMMENDATION_API_URL || 'http://localhost:8000'

export interface RecipeRecommendation {
  id: string
  title: string
  image_url?: string
  category?: string
  cuisine?: string
  calories?: string
  protein?: string
  carbs?: string
  fat?: string
  fiber?: string
  sugar?: string
  sodium?: string
  servings?: number
  instructions?: string
  recommendation_reason: string
  tags?: string[]
}

export interface RecommendationResponse {
  user_id: string
  recommendations: RecipeRecommendation[]
  filters_applied: Record<string, any>
  messages: string[]
  generated_at: string
}

export interface FeedbackRequest {
  user_id: string
  recipe_id: string
  event_type: 'like' | 'dislike' | 'save' | 'pass'
}

class RecommendationService {
  private apiUrl: string

  constructor() {
    this.apiUrl = RECOMMENDATION_API_URL
  }

  async getRecommendations(userId: string, limit: number = 10): Promise<RecipeRecommendation[]> {
    try {
      console.log('🔄 Fetching recommendations for user:', userId)
      
      const response = await fetch(`${this.apiUrl}/api/recommendations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          limit: limit,
          refresh: false
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || `Failed to fetch recommendations: ${response.status}`)
      }

      const data: RecommendationResponse = await response.json()
      console.log('✅ Received recommendations:', data.recommendations.length)
      
      // Fetch full recipe details from Supabase for each recommendation
      const enrichedRecommendations = await this.enrichRecommendationsWithSupabaseData(data.recommendations)
      
      return enrichedRecommendations
    } catch (error) {
      console.error('❌ Error fetching recommendations:', error)
      
      // Fallback to Supabase recipes if recommendation API fails
      return this.getFallbackRecipes(limit)
    }
  }

  async enrichRecommendationsWithSupabaseData(recommendations: RecipeRecommendation[]): Promise<RecipeRecommendation[]> {
    try {
      const recipeIds = recommendations.map(r => r.id)
      
      const { data: recipes, error } = await supabase
        .from('recipes')
        .select(`
          id,
          title,
          category,
          area,
          instructions,
          image_url,
          servings,
          tags,
          recipe_nutrients (
            per_serving
          )
        `)
        .in('id', recipeIds)
      
      if (error) throw error
      
      // Merge Supabase data with recommendations
      return recommendations.map(rec => {
        const supabaseRecipe = recipes?.find(r => r.id === rec.id)
        
        if (supabaseRecipe) {
          const nutrients = supabaseRecipe.recipe_nutrients?.[0]?.per_serving || {}
          
          return {
            ...rec,
            image_url: supabaseRecipe.image_url || rec.image_url,
            category: supabaseRecipe.category || rec.category,
            cuisine: supabaseRecipe.area || rec.cuisine,
            instructions: supabaseRecipe.instructions || rec.instructions,
            servings: supabaseRecipe.servings || rec.servings,
            tags: supabaseRecipe.tags || rec.tags,
            // Nutritional data from Supabase
            calories: nutrients.kcal || nutrients.calories || rec.calories,
            protein: nutrients.protein_g || rec.protein,
            carbs: nutrients.carbs_g || rec.carbs,
            fat: nutrients.fat_g || rec.fat,
            fiber: nutrients.fiber_g || rec.fiber,
            sugar: nutrients.sugar_g || rec.sugar,
            sodium: nutrients.sodium_mg || rec.sodium
          }
        }
        
        return rec
      })
    } catch (error) {
      console.error('Error enriching recommendations:', error)
      return recommendations
    }
  }

  async getFallbackRecipes(limit: number): Promise<RecipeRecommendation[]> {
    try {
      console.log('📋 Using fallback recipes from Supabase')
      
      const { data: recipes, error } = await supabase
        .from('recipes')
        .select(`
          id,
          title,
          category,
          area,
          instructions,
          image_url,
          servings,
          tags,
          recipe_nutrients (
            per_serving
          )
        `)
        .not('instructions', 'is', null)
        .order('id', { ascending: false })
        .limit(limit)
      
      if (error) throw error
      
      return recipes?.map(recipe => {
        const nutrients = recipe.recipe_nutrients?.[0]?.per_serving || {}
        
        return {
          id: recipe.id,
          title: recipe.title,
          image_url: recipe.image_url,
          category: recipe.category,
          cuisine: recipe.area,
          calories: nutrients.kcal || nutrients.calories,
          protein: nutrients.protein_g,
          carbs: nutrients.carbs_g,
          fat: nutrients.fat_g,
          fiber: nutrients.fiber_g,
          sugar: nutrients.sugar_g,
          sodium: nutrients.sodium_mg,
          servings: recipe.servings,
          instructions: recipe.instructions,
          recommendation_reason: 'Popular recipe',
          tags: recipe.tags || []
        }
      }) || []
    } catch (error) {
      console.error('Error fetching fallback recipes:', error)
      return []
    }
  }

  async recordFeedback(userId: string, recipeId: string, eventType: 'like' | 'dislike' | 'save' | 'pass' | 'cook_now' | 'share_family'): Promise<boolean> {
    try {
      const mappedEvent = eventType === 'dislike' ? 'hide' : eventType

      console.log('💾 Attempting to save to Supabase:', { userId, recipeId, event: mappedEvent })

      // ALWAYS save to Supabase recipe_events table first (primary source of truth)
      const { data, error: supabaseError } = await supabase
        .from('recipe_events')
        .insert({
          user_id: userId,
          recipe_id: recipeId,
          event: mappedEvent,
          created_at: new Date().toISOString()
        })
        .select()

      if (supabaseError) {
        console.error('❌ FAILED to save to Supabase:', supabaseError)
        console.error('❌ Error details:', JSON.stringify(supabaseError, null, 2))
        return false
      }

      console.log('✅ SUCCESS - Saved to Supabase:', data)

      // Try to send to recommendation API (optional, for ML training)
      try {
        const response = await fetch(`${this.apiUrl}/api/feedback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            user_id: userId,
            recipe_id: recipeId,
            event_type: eventType
          })
        })

        if (!response.ok) {
          console.warn('⚠️ API feedback failed, but Supabase saved successfully')
        } else {
          console.log('✅ Also sent to recommendation API')
        }
      } catch (apiError) {
        console.warn('⚠️ API not available, but Supabase saved successfully')
      }

      return true
    } catch (error) {
      console.error('❌ Error recording feedback:', error)
      return false
    }
  }

  async checkHealthStatus(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/health`)
      const data = await response.json()
      return data.status === 'healthy' && data.agent_available
    } catch (error) {
      console.error('Recommendation API health check failed:', error)
      return false
    }
  }
}

// Export singleton instance
export const recommendationService = new RecommendationService()
export default recommendationService