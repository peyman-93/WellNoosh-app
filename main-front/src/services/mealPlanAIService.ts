// Configuration for meal planner AI API (same as recommendation API)
const MEAL_PLAN_API_URL = process.env.EXPO_PUBLIC_RECOMMENDATION_API_URL || 'http://localhost:8000';

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

export interface GeneratedMealPlan {
  meals: GeneratedMeal[];
  summary: string;
  error?: string;
}

class MealPlanAIService {
  private apiUrl: string;

  constructor() {
    this.apiUrl = MEAL_PLAN_API_URL;
  }

  async chat(
    userId: string,
    messages: ChatMessage[],
    healthContext: UserHealthContext
  ): Promise<string> {
    try {
      console.log('🤖 Sending chat to meal planner AI...');

      const response = await fetch(`${this.apiUrl}/api/meal-plans/ai-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          messages,
          healthContext
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Chat failed: ${response.status}`);
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

      const response = await fetch(`${this.apiUrl}/api/meal-plans/ai-generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          messages,
          healthContext,
          startDate: startDate.toISOString().split('T')[0],
          numberOfDays
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Generate failed: ${response.status}`);
      }

      const data: GeneratedMealPlan = await response.json();
      console.log('✅ Generated meal plan with', data.meals?.length || 0, 'meals');

      return data;
    } catch (error) {
      console.error('❌ Error generating meal plan:', error);
      throw error;
    }
  }

  async checkHealthStatus(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/health`);
      const data = await response.json();
      return data.status === 'healthy';
    } catch (error) {
      console.error('Meal planner API health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const mealPlanAIService = new MealPlanAIService();
