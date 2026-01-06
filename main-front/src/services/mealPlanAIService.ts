import { supabase } from './supabase';

// Use relative URL on Replit (proxy handles it), use env var or localhost for local dev
const API_URL = process.env.EXPO_PUBLIC_API_URL || '/api';

export interface UserHealthContext {
  allergies?: string[];
  medicalConditions?: string[];
  dietStyle?: string;
  healthGoals?: string[];
  dailyCalorieGoal?: number;
  cookingSkill?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface GeneratedMeal {
  plan_date: string;
  meal_slot: MealSlot;
  recipe_id?: string;
  recipe_title: string;
  recipe_image?: string;
  notes?: string;
  servings?: number;
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
}

// DSPy Enhanced Meal Types (matching RecommendationCard format)
export interface DSPyIngredient {
  name: string;
  amount: string;
  category: string;
}

export interface DSPyNutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface DSPyMeal {
  id: string;
  name: string;
  image?: string;
  cookTime: string;
  servings: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  rating: number;
  tags: string[];
  description: string;
  ingredients: DSPyIngredient[];
  instructions: string[];
  nutrition: DSPyNutrition;
  meal_slot: MealSlot;
  plan_date: string;
}

export interface DSPyMealPlan {
  meals: DSPyMeal[];
  summary: string;
  stats?: {
    total_meals: number;
    average_daily_calories: number;
    days_planned: number;
  };
  error?: string;
}

export interface GeneratedMealPlan {
  meals: GeneratedMeal[];
  summary: string;
  error?: string;
}

class MealPlanAIService {
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
    return headers;
  }

  async chat(
    userId: string,
    messages: ChatMessage[],
    healthContext: UserHealthContext
  ): Promise<string> {
    try {
      console.log('🤖 Sending chat to meal planner AI...');

      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_URL}/meal-plans/ai-chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          user_id: userId,
          messages,
          healthContext
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Chat API error:', response.status, errorText);
        throw new Error(`Chat failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Received chat response');
      return data.content;
    } catch (error) {
      console.error('❌ Error in meal plan chat:', error);
      throw error;
    }
  }

  async generateMealPlan(
    userId: string,
    messages: ChatMessage[],
    healthContext: UserHealthContext,
    startDate: Date,
    numberOfDays: number = 7
  ): Promise<GeneratedMealPlan> {
    try {
      console.log('🍽️ Generating meal plan...');

      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_URL}/meal-plans/ai-generate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          user_id: userId,
          messages,
          healthContext,
          startDate: startDate.toISOString().split('T')[0],
          numberOfDays
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Generate API error:', response.status, errorText);
        throw new Error(`Generate failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Generated meal plan with', data.meals?.length || 0, 'meals');

      // Map response to expected format (backend uses custom_title, frontend expects recipe_title)
      const mappedMeals: GeneratedMeal[] = (data.meals || []).map((meal: any) => ({
        plan_date: meal.plan_date,
        meal_slot: meal.meal_slot,
        recipe_title: meal.custom_title || meal.recipe_title || 'Unnamed Meal',
        notes: meal.notes,
        servings: meal.servings || 1,
        calories: meal.calories,
        protein_g: meal.protein_g,
        carbs_g: meal.carbs_g,
        fat_g: meal.fat_g
      }));

      return {
        meals: mappedMeals,
        summary: data.summary || 'Your personalized meal plan is ready!'
      };
    } catch (error) {
      console.error('❌ Error generating meal plan:', error);
      throw error;
    }
  }

  async checkHealthStatus(): Promise<boolean> {
    try {
      const baseUrl = API_URL.replace('/api', '');
      const response = await fetch(`${baseUrl}/health`);
      const data = await response.json();
      return data.status === 'OK';
    } catch (error) {
      console.error('Meal planner API health check failed:', error);
      return false;
    }
  }

  // DSPy Enhanced meal plan generation with full recipe details
  async generateMealPlanDSPy(
    userId: string,
    messages: ChatMessage[],
    healthContext: UserHealthContext,
    startDate: Date,
    numberOfDays: number = 7
  ): Promise<DSPyMealPlan> {
    try {
      console.log('🍽️ Generating DSPy meal plan with full recipe details...');

      const headers = await this.getAuthHeaders();
      const response = await fetch(`${API_URL}/meal-plans/dspy-generate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          user_id: userId,
          messages,
          healthContext,
          startDate: startDate.toISOString().split('T')[0],
          numberOfDays
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('DSPy Generate API error:', response.status, errorText);
        throw new Error(`DSPy Generate failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ DSPy Generated meal plan with', data.meals?.length || 0, 'meals');

      return {
        meals: data.meals || [],
        summary: data.summary || 'Your personalized meal plan is ready!',
        stats: data.stats
      };
    } catch (error) {
      console.error('❌ Error generating DSPy meal plan:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const mealPlanAIService = new MealPlanAIService();
