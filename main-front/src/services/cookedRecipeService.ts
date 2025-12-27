import { supabase } from './supabase';

export interface CookedRecipeData {
  id: string;
  user_id: string;
  recipe_id: string;
  rating: number;
  review?: string;
  made_count: number;
  last_made_date: string;
  difficulty_rating?: 'Too Easy' | 'Just Right' | 'Too Hard';
  would_make_again?: boolean;
  created_at: string;
  updated_at: string;
}

export interface SaveCookedRecipeInput {
  recipe_id: string;
  rating: number;
  review?: string;
  difficulty_rating?: 'Too Easy' | 'Just Right' | 'Too Hard';
  would_make_again?: boolean;
}

class CookedRecipeService {
  async saveCookedRecipe(input: SaveCookedRecipeInput): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { data: existing, error: fetchError } = await supabase
        .from('user_recipe_ratings')
        .select('id, made_count')
        .eq('user_id', user.id)
        .eq('recipe_id', input.recipe_id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error checking existing rating:', fetchError);
        return { success: false, error: fetchError.message };
      }

      if (existing) {
        const { error: updateError } = await supabase
          .from('user_recipe_ratings')
          .update({
            rating: input.rating,
            review: input.review,
            made_count: existing.made_count + 1,
            last_made_date: new Date().toISOString().split('T')[0],
            difficulty_rating: input.difficulty_rating,
            would_make_again: input.would_make_again,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (updateError) {
          console.error('Error updating cooked recipe:', updateError);
          return { success: false, error: updateError.message };
        }
      } else {
        const { error: insertError } = await supabase
          .from('user_recipe_ratings')
          .insert({
            user_id: user.id,
            recipe_id: input.recipe_id,
            rating: input.rating,
            review: input.review,
            made_count: 1,
            last_made_date: new Date().toISOString().split('T')[0],
            difficulty_rating: input.difficulty_rating,
            would_make_again: input.would_make_again
          });

        if (insertError) {
          console.error('Error saving cooked recipe:', insertError);
          return { success: false, error: insertError.message };
        }
      }

      console.log('✅ Cooked recipe saved to Supabase:', input.recipe_id);
      return { success: true };
    } catch (error) {
      console.error('Error in saveCookedRecipe:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getCookedRecipes(): Promise<CookedRecipeData[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user authenticated');
        return [];
      }

      const { data, error } = await supabase
        .from('user_recipe_ratings')
        .select('*')
        .eq('user_id', user.id)
        .order('last_made_date', { ascending: false });

      if (error) {
        console.error('Error fetching cooked recipes:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getCookedRecipes:', error);
      return [];
    }
  }

  async getCookedRecipeCount(): Promise<number> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      const { count, error } = await supabase
        .from('user_recipe_ratings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error counting cooked recipes:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error in getCookedRecipeCount:', error);
      return 0;
    }
  }

  async getRecipeRating(recipeId: string): Promise<number | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_recipe_ratings')
        .select('rating')
        .eq('user_id', user.id)
        .eq('recipe_id', recipeId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error getting recipe rating:', error);
        return null;
      }

      return data?.rating || null;
    } catch (error) {
      console.error('Error in getRecipeRating:', error);
      return null;
    }
  }

  async removeCookedRecipe(recipeId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { error } = await supabase
        .from('user_recipe_ratings')
        .delete()
        .eq('user_id', user.id)
        .eq('recipe_id', recipeId);

      if (error) {
        console.error('Error removing cooked recipe:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Cooked recipe removed from Supabase:', recipeId);
      return { success: true };
    } catch (error) {
      console.error('Error in removeCookedRecipe:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async removeLikeEvent(recipeId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { error } = await supabase
        .from('recipe_events')
        .delete()
        .eq('user_id', user.id)
        .eq('recipe_id', recipeId)
        .eq('event', 'like');

      if (error) {
        console.error('Error removing like event:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Like event removed from Supabase:', recipeId);
      return { success: true };
    } catch (error) {
      console.error('Error in removeLikeEvent:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

export const cookedRecipeService = new CookedRecipeService();
export default cookedRecipeService;
