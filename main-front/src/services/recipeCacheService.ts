import AsyncStorage from '@react-native-async-storage/async-storage';

const LIKED_RECIPES_KEY = 'wellnoosh_liked_recipes';
const COOKED_RECIPES_KEY = 'wellnoosh_cooked_recipes';

export interface CachedRecipe {
  id: string;
  title: string;
  image_url?: string;
  category?: string;
  area?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  servings?: number;
  instructions?: string[];
  ingredients?: {
    name: string;
    amount: string;
    category: string;
  }[];
  tags?: string[];
  description?: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  cookTime?: string;
  rating?: number;
  cachedAt: string;
}

class RecipeCacheService {
  async saveLikedRecipe(recipe: Omit<CachedRecipe, 'cachedAt'>): Promise<void> {
    try {
      const existing = await this.getLikedRecipes();
      const filtered = existing.filter(r => r.id !== recipe.id);
      const updated: CachedRecipe[] = [
        { ...recipe, cachedAt: new Date().toISOString() },
        ...filtered
      ];
      await AsyncStorage.setItem(LIKED_RECIPES_KEY, JSON.stringify(updated));
      console.log('✅ Recipe cached locally:', recipe.title);
    } catch (error) {
      console.error('❌ Failed to cache recipe:', error);
    }
  }

  async saveCookedRecipe(recipe: Omit<CachedRecipe, 'cachedAt'>): Promise<void> {
    try {
      const existing = await this.getCookedRecipes();
      const filtered = existing.filter(r => r.id !== recipe.id);
      const updated: CachedRecipe[] = [
        { ...recipe, cachedAt: new Date().toISOString() },
        ...filtered
      ];
      await AsyncStorage.setItem(COOKED_RECIPES_KEY, JSON.stringify(updated));
      console.log('✅ Cooked recipe cached locally:', recipe.title);
    } catch (error) {
      console.error('❌ Failed to cache cooked recipe:', error);
    }
  }

  async getLikedRecipes(): Promise<CachedRecipe[]> {
    try {
      const data = await AsyncStorage.getItem(LIKED_RECIPES_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('❌ Failed to get cached liked recipes:', error);
      return [];
    }
  }

  async getCookedRecipes(): Promise<CachedRecipe[]> {
    try {
      const data = await AsyncStorage.getItem(COOKED_RECIPES_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('❌ Failed to get cached cooked recipes:', error);
      return [];
    }
  }

  async removeLikedRecipe(recipeId: string): Promise<void> {
    try {
      const existing = await this.getLikedRecipes();
      const filtered = existing.filter(r => r.id !== recipeId);
      await AsyncStorage.setItem(LIKED_RECIPES_KEY, JSON.stringify(filtered));
      console.log('✅ Recipe removed from cache:', recipeId);
    } catch (error) {
      console.error('❌ Failed to remove recipe from cache:', error);
    }
  }

  async getRecipeById(recipeId: string): Promise<CachedRecipe | null> {
    try {
      const liked = await this.getLikedRecipes();
      const found = liked.find(r => r.id === recipeId);
      if (found) return found;
      
      const cooked = await this.getCookedRecipes();
      return cooked.find(r => r.id === recipeId) || null;
    } catch (error) {
      console.error('❌ Failed to get recipe by ID:', error);
      return null;
    }
  }

  async clearCache(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([LIKED_RECIPES_KEY, COOKED_RECIPES_KEY]);
      console.log('✅ Recipe cache cleared');
    } catch (error) {
      console.error('❌ Failed to clear cache:', error);
    }
  }
}

export const recipeCacheService = new RecipeCacheService();
export default recipeCacheService;
