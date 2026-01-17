import { supabase } from './supabase';
import { getLocalDateString } from './nutritionService';

export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'snack_am' | 'snack_pm' | 'snack_evening';

export interface MealPlanEntry {
  id: string;
  user_id: string;
  plan_date: string;
  meal_slot: MealSlot;
  recipe_id?: string;
  recipe_title?: string;
  recipe_image?: string;
  custom_title?: string;
  notes?: string;
  servings: number;
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  fiber_g?: number;
  is_completed?: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateMealPlanEntry {
  plan_date: string;
  meal_slot: MealSlot;
  recipe_id?: string;
  recipe_title?: string;
  recipe_image?: string;
  custom_title?: string;
  notes?: string;
  servings?: number;
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
}

export interface UpdateMealPlanEntry {
  recipe_id?: string;
  recipe_title?: string;
  recipe_image?: string;
  custom_title?: string;
  notes?: string;
  servings?: number;
}

export const mealPlannerService = {
  async getMealPlanForWeek(startDate: Date): Promise<MealPlanEntry[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);

    const startDateStr = getLocalDateString(startDate);
    const endDateStr = getLocalDateString(endDate);

    const { data, error } = await supabase
      .from('meal_plans')
      .select('*')
      .eq('user_id', user.id)
      .gte('plan_date', startDateStr)
      .lte('plan_date', endDateStr)
      .order('plan_date', { ascending: true });

    if (error) {
      console.error('Error fetching meal plan:', error);
      throw error;
    }

    return data || [];
  },

  async getMealPlanForDate(date: Date): Promise<MealPlanEntry[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const dateStr = getLocalDateString(date);

    const { data, error } = await supabase
      .from('meal_plans')
      .select('*')
      .eq('user_id', user.id)
      .eq('plan_date', dateStr)
      .order('meal_slot', { ascending: true });

    if (error) {
      console.error('Error fetching meal plan for date:', error);
      throw error;
    }

    return data || [];
  },

  async addMealSlot(entry: CreateMealPlanEntry): Promise<MealPlanEntry> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('meal_plans')
      .insert({
        user_id: user.id,
        plan_date: entry.plan_date,
        meal_slot: entry.meal_slot,
        recipe_id: entry.recipe_id,
        recipe_title: entry.recipe_title,
        recipe_image: entry.recipe_image,
        custom_title: entry.custom_title,
        notes: entry.notes,
        servings: entry.servings || 1
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding meal slot:', error);
      throw error;
    }

    return data;
  },

  async bulkAddMeals(entries: CreateMealPlanEntry[]): Promise<MealPlanEntry[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const mealsToInsert = entries.map(entry => ({
      user_id: user.id,
      plan_date: entry.plan_date,
      meal_slot: entry.meal_slot,
      recipe_id: entry.recipe_id,
      recipe_title: entry.recipe_title,
      recipe_image: entry.recipe_image,
      custom_title: entry.custom_title,
      notes: entry.notes,
      servings: entry.servings || 1,
      calories: entry.calories,
      protein_g: entry.protein_g,
      carbs_g: entry.carbs_g,
      fat_g: entry.fat_g
    }));

    const { data, error } = await supabase
      .from('meal_plans')
      .insert(mealsToInsert)
      .select();

    if (error) {
      console.error('Error bulk adding meals:', error);
      throw error;
    }

    return data || [];
  },

  async updateMealSlot(id: string, updates: UpdateMealPlanEntry): Promise<void> {
    const { error } = await supabase
      .from('meal_plans')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Error updating meal slot:', error);
      throw error;
    }
  },

  async removeMealSlot(id: string): Promise<void> {
    const { error } = await supabase
      .from('meal_plans')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error removing meal slot:', error);
      throw error;
    }
  },

  async clearWeek(startDate: Date): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);

    const startDateStr = getLocalDateString(startDate);
    const endDateStr = getLocalDateString(endDate);

    const { error } = await supabase
      .from('meal_plans')
      .delete()
      .eq('user_id', user.id)
      .gte('plan_date', startDateStr)
      .lte('plan_date', endDateStr);

    if (error) {
      console.error('Error clearing week:', error);
      throw error;
    }
  },

  async clearDay(date: Date): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const dateStr = getLocalDateString(date);

    const { error } = await supabase
      .from('meal_plans')
      .delete()
      .eq('user_id', user.id)
      .eq('plan_date', dateStr);

    if (error) {
      console.error('Error clearing day:', error);
      throw error;
    }
  },

  async markMealAsCooked(id: string): Promise<void> {
    const cookedDate = getLocalDateString()
    
    const { error } = await supabase
      .from('meal_plans')
      .update({ 
        is_completed: true,
        cooked_date: cookedDate,
        cooked_at: new Date().toISOString(),
        updated_at: new Date().toISOString() 
      })
      .eq('id', id);

    if (error) {
      console.error('Error marking meal as cooked:', error);
      throw error;
    }
  }
};
