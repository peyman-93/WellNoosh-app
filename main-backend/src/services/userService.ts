import { supabase, supabaseAdmin } from '../config/supabase';
import { User, HealthMetrics, WaterIntake, BreathingExercises } from '../types';
import { createError } from '../middleware/errorHandler';

class UserService {
  async getProfile(userId: string, userSupabase?: any): Promise<User | null> {
    try {
      const client = userSupabase || supabase;
      const { data, error } = await client
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user profile:', error);
        throw createError('Failed to fetch user profile', 500);
      }

      if (!data) {
        return null; // No profile found
      }

      return {
        id: data.id,
        fullName: data.full_name,
        email: '', // Will be filled from auth.users if needed
        country: data.country,
        city: data.city,
        postalCode: data.postal_code,
        age: data.age,
        gender: data.gender,
        weight: data.weight,
        weightUnit: data.weight_unit,
        height: data.height,
        heightUnit: data.height_unit,
        heightFeet: data.height_feet,
        heightInches: data.height_inches,
        dietStyle: data.diet_style,
        customDietStyle: data.custom_diet_style,
        allergies: data.allergies,
        medicalConditions: data.medical_conditions,
        activityLevel: data.activity_level,
        healthGoals: data.health_goals,
        foodRestrictions: data.food_restrictions,
        cookingSkill: data.cooking_skill,
        mealPreference: data.meal_preference,
        subscriptionTier: data.subscription_tier,
        dailySwipesUsed: data.daily_swipes_used,
        lastSwipeDate: data.last_swipe_date,
        favoriteRecipes: data.favorite_recipes,
        selectedRecipes: data.selected_recipes,
        cookedRecipes: [], // This would come from a separate table
        leftovers: [], // This would come from a separate table
        groceryList: [], // This would come from a separate table
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Error in getProfile:', error);
      throw error;
    }
  }

  async createProfile(userId: string, profileData: Partial<User>, userSupabase?: any): Promise<User> {
    try {
      // Always use the authenticated user's context when provided
      const client = userSupabase || supabaseAdmin;
      
      const insertData = {
        id: userId,
        full_name: profileData.fullName || '',
        country: profileData.country || '',
        city: profileData.city || '',
        postal_code: profileData.postalCode || '',
        age: profileData.age,
        gender: profileData.gender,
        weight: profileData.weight,
        weight_unit: profileData.weightUnit || 'kg',
        height: profileData.height,
        height_unit: profileData.heightUnit || 'cm',
        height_feet: profileData.heightFeet,
        height_inches: profileData.heightInches,
        diet_style: profileData.dietStyle,
        custom_diet_style: profileData.customDietStyle,
        allergies: profileData.allergies,
        medical_conditions: profileData.medicalConditions,
        activity_level: profileData.activityLevel,
        health_goals: profileData.healthGoals,
        food_restrictions: profileData.foodRestrictions,
        cooking_skill: profileData.cookingSkill,
        meal_preference: profileData.mealPreference,
        subscription_tier: profileData.subscriptionTier || 'free',
        daily_swipes_used: profileData.dailySwipesUsed || 0,
        last_swipe_date: profileData.lastSwipeDate || new Date().toISOString().split('T')[0],
        favorite_recipes: profileData.favoriteRecipes,
        selected_recipes: profileData.selectedRecipes
      };

      // Use UPSERT instead of INSERT to handle existing profiles
      const { data, error } = await client
        .from('user_profiles')
        .upsert(insertData, { onConflict: 'id' })
        .select()
        .single();

      if (error) {
        console.error('Error creating/updating user profile:', error);
        console.error('Profile data:', insertData);
        throw createError(`Failed to create user profile: ${error.message}`, 500);
      }

      return {
        id: data.id,
        fullName: data.full_name,
        email: '',
        country: data.country,
        city: data.city,
        postalCode: data.postal_code,
        age: data.age,
        gender: data.gender,
        weight: data.weight,
        weightUnit: data.weight_unit,
        height: data.height,
        heightUnit: data.height_unit,
        heightFeet: data.height_feet,
        heightInches: data.height_inches,
        dietStyle: data.diet_style,
        customDietStyle: data.custom_diet_style,
        allergies: data.allergies,
        medicalConditions: data.medical_conditions,
        activityLevel: data.activity_level,
        healthGoals: data.health_goals,
        foodRestrictions: data.food_restrictions,
        cookingSkill: data.cooking_skill,
        mealPreference: data.meal_preference,
        subscriptionTier: data.subscription_tier,
        dailySwipesUsed: data.daily_swipes_used,
        lastSwipeDate: data.last_swipe_date,
        favoriteRecipes: data.favorite_recipes,
        selectedRecipes: data.selected_recipes,
        cookedRecipes: [],
        leftovers: [],
        groceryList: [],
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Error in createProfile:', error);
      throw error;
    }
  }

  async updateProfile(userId: string, updateData: Partial<User>, userSupabase?: any): Promise<User> {
    try {
      const client = userSupabase || supabaseAdmin;
      
      const updatePayload: any = {};
      
      // Map frontend field names to database column names
      if (updateData.fullName !== undefined) updatePayload.full_name = updateData.fullName;
      if (updateData.country !== undefined) updatePayload.country = updateData.country;
      if (updateData.city !== undefined) updatePayload.city = updateData.city;
      if (updateData.postalCode !== undefined) updatePayload.postal_code = updateData.postalCode;
      if (updateData.age !== undefined) updatePayload.age = updateData.age;
      if (updateData.gender !== undefined) updatePayload.gender = updateData.gender;
      if (updateData.weight !== undefined) updatePayload.weight = updateData.weight;
      if (updateData.weightUnit !== undefined) updatePayload.weight_unit = updateData.weightUnit;
      if (updateData.height !== undefined) updatePayload.height = updateData.height;
      if (updateData.heightUnit !== undefined) updatePayload.height_unit = updateData.heightUnit;
      if (updateData.heightFeet !== undefined) updatePayload.height_feet = updateData.heightFeet;
      if (updateData.heightInches !== undefined) updatePayload.height_inches = updateData.heightInches;
      if (updateData.dietStyle !== undefined) updatePayload.diet_style = updateData.dietStyle;
      if (updateData.customDietStyle !== undefined) updatePayload.custom_diet_style = updateData.customDietStyle;
      if (updateData.allergies !== undefined) updatePayload.allergies = updateData.allergies;
      if (updateData.medicalConditions !== undefined) updatePayload.medical_conditions = updateData.medicalConditions;
      if (updateData.activityLevel !== undefined) updatePayload.activity_level = updateData.activityLevel;
      if (updateData.healthGoals !== undefined) updatePayload.health_goals = updateData.healthGoals;
      if (updateData.foodRestrictions !== undefined) updatePayload.food_restrictions = updateData.foodRestrictions;
      if (updateData.cookingSkill !== undefined) updatePayload.cooking_skill = updateData.cookingSkill;
      if (updateData.mealPreference !== undefined) updatePayload.meal_preference = updateData.mealPreference;
      if (updateData.subscriptionTier !== undefined) updatePayload.subscription_tier = updateData.subscriptionTier;
      if (updateData.dailySwipesUsed !== undefined) updatePayload.daily_swipes_used = updateData.dailySwipesUsed;
      if (updateData.lastSwipeDate !== undefined) updatePayload.last_swipe_date = updateData.lastSwipeDate;
      if (updateData.favoriteRecipes !== undefined) updatePayload.favorite_recipes = updateData.favoriteRecipes;
      if (updateData.selectedRecipes !== undefined) updatePayload.selected_recipes = updateData.selectedRecipes;

      const { data, error } = await client
        .from('user_profiles')
        .update(updatePayload)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating user profile:', error);
        throw createError('Failed to update user profile', 500);
      }

      return {
        id: data.id,
        fullName: data.full_name,
        email: updateData.email || '',
        country: data.country,
        city: data.city,
        postalCode: data.postal_code,
        age: data.age,
        gender: data.gender,
        weight: data.weight,
        weightUnit: data.weight_unit,
        height: data.height,
        heightUnit: data.height_unit,
        heightFeet: data.height_feet,
        heightInches: data.height_inches,
        dietStyle: data.diet_style,
        customDietStyle: data.custom_diet_style,
        allergies: data.allergies,
        medicalConditions: data.medical_conditions,
        activityLevel: data.activity_level,
        healthGoals: data.health_goals,
        foodRestrictions: data.food_restrictions,
        cookingSkill: data.cooking_skill,
        mealPreference: data.meal_preference,
        subscriptionTier: data.subscription_tier,
        dailySwipesUsed: data.daily_swipes_used,
        lastSwipeDate: data.last_swipe_date,
        favoriteRecipes: data.favorite_recipes,
        selectedRecipes: data.selected_recipes,
        cookedRecipes: [],
        leftovers: [],
        groceryList: [],
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Error in updateProfile:', error);
      throw error;
    }
  }

  async deleteProfile(userId: string): Promise<void> {
    // TODO: Implement with Supabase
    throw createError('Not implemented yet', 501);
  }

  async getHealthMetrics(userId: string, options: {
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<HealthMetrics[]> {
    // TODO: Implement with Supabase
    throw createError('Not implemented yet', 501);
  }

  async createHealthMetrics(userId: string, data: Omit<HealthMetrics, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<HealthMetrics> {
    // TODO: Implement with Supabase
    throw createError('Not implemented yet', 501);
  }

  async updateHealthMetrics(userId: string, date: string, updateData: Partial<HealthMetrics>): Promise<HealthMetrics> {
    // TODO: Implement with Supabase
    throw createError('Not implemented yet', 501);
  }

  async getWaterIntake(userId: string, date?: string, userSupabase?: any): Promise<WaterIntake | null> {
    const targetDate = date ?? new Date().toISOString().split('T')[0];
    
    try {
      const client = userSupabase || supabase;
      const { data, error } = await client
        .from('water_intake')
        .select('*')
        .eq('user_id', userId)
        .eq('date', targetDate)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching water intake:', error);
        throw createError('Failed to fetch water intake', 500);
      }
      
      if (data) {
        return {
          id: data.id,
          userId: data.user_id,
          date: data.date,
          amount: data.amount || 0,
          goal: data.goal || 2000,
          unit: data.unit || 'ml',
          glasses: data.glasses || Array(8).fill(false),
          dailyGoal: data.daily_goal || 8,
          createdAt: data.created_at,
          updatedAt: data.updated_at
        };
      }
      
      // Return default water intake for the day if no record exists
      return {
        id: `${userId}-${targetDate}`,
        userId,
        date: targetDate as string,
        amount: 0,
        goal: 2000,
        unit: 'ml' as const,
        glasses: Array(8).fill(false),
        dailyGoal: 8,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error in getWaterIntake:', error);
      throw error;
    }
  }

  async updateWaterIntake(userId: string, data: Partial<WaterIntake>, userSupabase?: any): Promise<WaterIntake> {
    const targetDate = data.date ?? new Date().toISOString().split('T')[0];
    
    try {
      // First try to get existing record
      const existing = await this.getWaterIntake(userId, targetDate, userSupabase);
      
      const updateData = {
        user_id: userId,
        date: targetDate,
        amount: data.amount !== undefined ? data.amount : existing?.amount || 0,
        goal: data.goal !== undefined ? data.goal : existing?.goal || 2000,
        unit: data.unit || existing?.unit || 'ml',
        glasses: data.glasses || existing?.glasses || Array(8).fill(false),
        daily_goal: data.dailyGoal !== undefined ? data.dailyGoal : existing?.dailyGoal || 8
      };
      
      // Use upsert to insert or update
      const client = userSupabase || supabase;
      const { data: result, error } = await client
        .from('water_intake')
        .upsert(updateData, {
          onConflict: 'user_id,date'
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error updating water intake:', error);
        throw createError('Failed to update water intake', 500);
      }
      
      return {
        id: result.id,
        userId: result.user_id,
        date: result.date,
        amount: result.amount,
        goal: result.goal,
        unit: result.unit,
        glasses: result.glasses,
        dailyGoal: result.daily_goal,
        createdAt: result.created_at,
        updatedAt: result.updated_at
      };
    } catch (error) {
      console.error('Error in updateWaterIntake:', error);
      throw error;
    }
  }

  async getBreathingExercises(userId: string, date?: string, userSupabase?: any): Promise<BreathingExercises | null> {
    const targetDate = date ?? new Date().toISOString().split('T')[0];
    
    try {
      const client = userSupabase || supabase;
      const { data, error } = await client
        .from('breathing_exercises')
        .select('*')
        .eq('user_id', userId)
        .eq('date', targetDate)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching breathing exercises:', error);
        throw createError('Failed to fetch breathing exercises', 500);
      }
      
      if (data) {
        return {
          id: data.id,
          userId: data.user_id,
          date: data.date,
          sessions: data.sessions || 0,
          totalMinutes: data.total_minutes || 0,
          goal: data.goal || 3,
          exercises: data.exercises || Array(6).fill(false),
          dailyGoal: data.daily_goal || 6,
          createdAt: data.created_at,
          updatedAt: data.updated_at
        };
      }
      
      // Return default breathing exercises for the day if no record exists
      return {
        id: `${userId}-${targetDate}`,
        userId,
        date: targetDate as string,
        sessions: 0,
        totalMinutes: 0,
        goal: 3,
        exercises: Array(6).fill(false),
        dailyGoal: 6,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error in getBreathingExercises:', error);
      throw error;
    }
  }

  async updateBreathingExercises(userId: string, data: Partial<BreathingExercises>, userSupabase?: any): Promise<BreathingExercises> {
    const targetDate = data.date ?? new Date().toISOString().split('T')[0];
    
    try {
      // First try to get existing record
      const existing = await this.getBreathingExercises(userId, targetDate, userSupabase);
      
      const updateData = {
        user_id: userId,
        date: targetDate,
        sessions: data.sessions !== undefined ? data.sessions : existing?.sessions || 0,
        total_minutes: data.totalMinutes !== undefined ? data.totalMinutes : existing?.totalMinutes || 0,
        goal: data.goal !== undefined ? data.goal : existing?.goal || 3,
        exercises: data.exercises || existing?.exercises || Array(6).fill(false),
        daily_goal: data.dailyGoal !== undefined ? data.dailyGoal : existing?.dailyGoal || 6
      };
      
      // Use upsert to insert or update
      const client = userSupabase || supabase;
      const { data: result, error } = await client
        .from('breathing_exercises')
        .upsert(updateData, {
          onConflict: 'user_id,date'
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error updating breathing exercises:', error);
        throw createError('Failed to update breathing exercises', 500);
      }
      
      return {
        id: result.id,
        userId: result.user_id,
        date: result.date,
        sessions: result.sessions,
        totalMinutes: result.total_minutes,
        goal: result.goal,
        exercises: result.exercises,
        dailyGoal: result.daily_goal,
        createdAt: result.created_at,
        updatedAt: result.updated_at
      };
    } catch (error) {
      console.error('Error in updateBreathingExercises:', error);
      throw error;
    }
  }

  async getPreferences(userId: string): Promise<any> {
    // TODO: Implement with Supabase
    throw createError('Not implemented yet', 501);
  }

  async updatePreferences(userId: string, data: any): Promise<any> {
    // TODO: Implement with Supabase
    throw createError('Not implemented yet', 501);
  }

  async getSubscription(userId: string): Promise<any> {
    // TODO: Implement with Supabase
    throw createError('Not implemented yet', 501);
  }

  async updateSubscription(userId: string, data: any): Promise<any> {
    // TODO: Implement with Supabase
    throw createError('Not implemented yet', 501);
  }

  async getUsage(userId: string): Promise<any> {
    // TODO: Implement with Supabase
    throw createError('Not implemented yet', 501);
  }
}

export const userService = new UserService();