import { apiClient } from './apiClient';
import { CreateMealPlanEntry, MealSlot } from './mealPlannerService';

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

export interface GeneratedMealPlan {
  meals: CreateMealPlanEntry[];
  summary: string;
}

export const mealPlanAIService = {
  async chat(
    messages: ChatMessage[],
    healthContext: UserHealthContext
  ): Promise<string> {
    const response = await apiClient.post<{ content: string }>('/meal-plans/ai-chat', {
      messages,
      healthContext
    });
    
    return response.content;
  },

  async generateMealPlan(
    messages: ChatMessage[],
    healthContext: UserHealthContext,
    startDate: Date,
    numberOfDays: number = 7
  ): Promise<GeneratedMealPlan> {
    const response = await apiClient.post<GeneratedMealPlan>('/meal-plans/ai-generate', {
      messages,
      healthContext,
      startDate: startDate.toISOString().split('T')[0],
      numberOfDays
    });
    
    return response;
  }
};
