import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RecommendationCard } from '../components/RecommendationCard';
import { recommendationService } from '../src/services/recommendationService';
import { recipeCacheService } from '../src/services/recipeCacheService';
import { useAuth } from '../src/context/supabase-provider';

interface Recipe {
  id: string;
  name: string;
  image: string;
  cookTime: string;
  servings: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  rating: number;
  tags: string[];
  description: string;
  ingredients: {
    name: string;
    amount: string;
    category: string;
  }[];
  instructions: string[];
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

interface RecipeSwipeScreenProps {
  navigation?: any;
  onNavigateBack?: () => void;
  onRecipeLiked?: (recipe: Recipe) => void;
  onRecipeDisliked?: (recipe: Recipe) => void;
  showSkipButton?: boolean;
  onSkip?: () => void;
}

// Helper function to extract time from instructions or use default
const extractCookTime = (recipe: any): string => {
  const instructions = recipe.instructions || '';
  const timeMatch = instructions.match(/(\d+)\s*(min|minute|hour|hr)/i);
  if (timeMatch) {
    const number = timeMatch[1];
    const unit = timeMatch[2].toLowerCase();
    if (unit.startsWith('hour') || unit === 'hr') {
      return `${number} hr`;
    }
    return `${number} min`;
  }
  
  // Default based on instruction steps
  const stepCount = Array.isArray(instructions) ? instructions.length : 3;
  return `${stepCount * 10} min`;
};

// Helper function to determine difficulty based on steps and time
const determineDifficulty = (recipe: any): 'Easy' | 'Medium' | 'Hard' => {
  const instructions = recipe.instructions || '';
  const steps = Array.isArray(instructions) ? instructions.length : instructions.split(/\d+\.|\n/).filter((s: string) => s.trim()).length;
  
  if (steps <= 3) return 'Easy';
  if (steps <= 6) return 'Medium';
  return 'Hard';
};

// Helper function to convert API recipe to component format
const convertApiRecipeToCardFormat = (apiRecipe: any): Recipe => {
  // Parse instructions if they're a string
  const parseInstructions = (instructions: string | string[]): string[] => {
    if (Array.isArray(instructions)) return instructions;
    if (!instructions || instructions === '') {
      return ['No instructions available'];
    }
    
    // First try to split by numbered steps (1., 2., etc.)
    let steps = instructions.split(/(?=\d+\.)/).filter(s => s.trim());
    
    // If no numbered steps, try newlines
    if (steps.length <= 1) {
      steps = instructions.split('\n').filter(s => s.trim());
    }
    
    // If still no good split, try periods followed by capital letters
    if (steps.length <= 1) {
      steps = instructions.split(/\.(?=\s*[A-Z])/).map(s => s.trim() + '.').filter(s => s.length > 2);
    }
    
    // Clean up the steps
    steps = steps.map(step => {
      // Remove leading numbers and dots
      step = step.replace(/^\d+\.\s*/, '');
      // Ensure the step starts with a capital letter
      return step.charAt(0).toUpperCase() + step.slice(1);
    });
    
    return steps.length > 0 ? steps : [instructions];
  };

  // Parse ingredients from API response
  const parseIngredients = (apiRecipe: any): any[] => {
    // Check if we have ingredients from the safe_recommendation_agent
    if (apiRecipe.ingredients && Array.isArray(apiRecipe.ingredients)) {
      return apiRecipe.ingredients.map((ing: any) => ({
        name: ing.name || 'Unknown ingredient',
        amount: `${ing.amount || ''} ${ing.unit || ''}`.trim() || 'As needed',
        category: ing.category || 'Other'
      }));
    }
    
    // Check if we have structured ingredients from Supabase
    if (apiRecipe.recipe_ingredients && Array.isArray(apiRecipe.recipe_ingredients)) {
      return apiRecipe.recipe_ingredients
        .sort((a: any, b: any) => (a.ingredient_order || 0) - (b.ingredient_order || 0))
        .map((ri: any) => ({
          name: ri.ingredients?.name || `Ingredient ${ri.ingredient_id}`,
          amount: `${ri.amount || ''} ${ri.unit || ''}`.trim() || 'As needed',
          category: ri.ingredients?.category || 'Ingredients'
        }));
    }
    
    // Try to parse ingredients from instructions and title
    const instructionText = apiRecipe.instructions || '';
    const title = apiRecipe.title || '';
    const ingredients: any[] = [];
    
    // Common ingredient patterns with measurements
    const patterns = [
      // Pattern: "2 cups of flour" or "2 cups flour"
      /(\d+(?:\.\d+)?(?:\/\d+)?)\s*(cup|cups|tbsp|tablespoon|tablespoons|tsp|teaspoon|teaspoons|oz|ounce|ounces|lb|lbs|pound|pounds|g|gram|grams|ml|liter|liters|L)\s+(?:of\s+)?([a-zA-Z\s]+?)(?:,|\.|\n|$)/gi,
      // Pattern: "flour (2 cups)"
      /([a-zA-Z\s]+?)\s*\((\d+(?:\.\d+)?(?:\/\d+)?)\s*(cup|cups|tbsp|tablespoon|tablespoons|tsp|teaspoon|teaspoons|oz|ounce|ounces|lb|lbs|pound|pounds|g|gram|grams|ml|liter|liters|L)\)/gi,
      // Pattern: "2 chicken breasts" or "1 onion"
      /(\d+(?:\.\d+)?(?:\/\d+)?)\s+([a-zA-Z\s]+?)(?:,|\.|\n|$)/gi
    ];
    
    const foundIngredients = new Set<string>();
    
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(instructionText)) !== null) {
        let amount, unit, name;
        
        if (match.length === 4) {
          // First pattern
          amount = match[1];
          unit = match[2];
          name = match[3].trim();
        } else if (match.length === 4 && match[1].match(/[a-zA-Z]/)) {
          // Second pattern
          name = match[1].trim();
          amount = match[2];
          unit = match[3];
        } else if (match.length === 3) {
          // Third pattern
          amount = match[1];
          name = match[2].trim();
          unit = '';
        }
        
        if (name && !foundIngredients.has(name.toLowerCase())) {
          foundIngredients.add(name.toLowerCase());
          
          // Clean up the name
          name = name.replace(/\s+/g, ' ').trim();
          if (name.length > 2 && name.length < 30) {
            ingredients.push({
              name: name.charAt(0).toUpperCase() + name.slice(1),
              amount: `${amount}${unit ? ' ' + unit : ''}`,
              category: categorizeIngredient(name)
            });
          }
        }
      }
    });
    
    // If we found ingredients, return them
    if (ingredients.length > 0) {
      return ingredients.slice(0, 15); // Limit to 15 ingredients
    }
    
    // Try to extract ingredients from the title
    const titleWords = title.toLowerCase().split(' ');
    const commonIngredients = ['chicken', 'beef', 'pork', 'fish', 'salmon', 'shrimp', 'tofu', 'rice', 'pasta', 'noodles', 'quinoa', 'vegetables', 'tomato', 'onion', 'garlic', 'cheese', 'egg'];
    
    titleWords.forEach((word: string) => {
      if (commonIngredients.includes(word)) {
        ingredients.push({
          name: word.charAt(0).toUpperCase() + word.slice(1),
          amount: 'As needed',
          category: categorizeIngredient(word)
        });
      }
    });
    
    // If we still don't have ingredients, use smart defaults based on category
    if (ingredients.length === 0) {
      const category = apiRecipe.category?.toLowerCase() || '';
      const cuisine = apiRecipe.cuisine?.toLowerCase() || '';
      
      if (category.includes('breakfast')) {
        return [
          { name: 'Eggs', amount: '2', category: 'Protein' },
          { name: 'Bread', amount: '2 slices', category: 'Grains' },
          { name: 'Butter', amount: '1 tbsp', category: 'Dairy' },
          { name: 'Salt', amount: 'To taste', category: 'Spices' },
          { name: 'Black pepper', amount: 'To taste', category: 'Spices' }
        ];
      } else if (category.includes('salad')) {
        return [
          { name: 'Mixed greens', amount: '2 cups', category: 'Vegetables' },
          { name: 'Tomatoes', amount: '1 cup', category: 'Vegetables' },
          { name: 'Cucumber', amount: '1', category: 'Vegetables' },
          { name: 'Olive oil', amount: '2 tbsp', category: 'Pantry' },
          { name: 'Vinegar', amount: '1 tbsp', category: 'Pantry' }
        ];
      } else if (cuisine.includes('italian')) {
        return [
          { name: 'Pasta', amount: '8 oz', category: 'Grains' },
          { name: 'Tomato sauce', amount: '2 cups', category: 'Pantry' },
          { name: 'Garlic', amount: '3 cloves', category: 'Vegetables' },
          { name: 'Olive oil', amount: '2 tbsp', category: 'Pantry' },
          { name: 'Parmesan cheese', amount: '1/2 cup', category: 'Dairy' }
        ];
      } else {
        return [
          { name: 'Main protein', amount: '1 lb', category: 'Protein' },
          { name: 'Vegetables', amount: '2 cups', category: 'Vegetables' },
          { name: 'Cooking oil', amount: '2 tbsp', category: 'Pantry' },
          { name: 'Salt', amount: 'To taste', category: 'Spices' },
          { name: 'Seasonings', amount: 'To taste', category: 'Spices' }
        ];
      }
    }
    
    return ingredients;
  };
  
  // Helper function to categorize ingredients
  const categorizeIngredient = (name: string): string => {
    const lowerName = name.toLowerCase();
    
    if (lowerName.includes('chicken') || lowerName.includes('beef') || lowerName.includes('pork') || lowerName.includes('fish') || lowerName.includes('egg')) {
      return 'Protein';
    } else if (lowerName.includes('milk') || lowerName.includes('cheese') || lowerName.includes('yogurt') || lowerName.includes('butter')) {
      return 'Dairy';
    } else if (lowerName.includes('flour') || lowerName.includes('bread') || lowerName.includes('rice') || lowerName.includes('pasta')) {
      return 'Grains';
    } else if (lowerName.includes('oil') || lowerName.includes('sauce') || lowerName.includes('vinegar')) {
      return 'Pantry';
    } else if (lowerName.includes('salt') || lowerName.includes('pepper') || lowerName.includes('spice')) {
      return 'Spices';
    } else {
      return 'Vegetables';
    }
  };

  return {
    id: apiRecipe.id,
    name: apiRecipe.title || 'Delicious Recipe',
    image: apiRecipe.image_url || 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop',
    cookTime: extractCookTime(apiRecipe),
    servings: parseInt(apiRecipe.servings) || 4,
    difficulty: determineDifficulty(apiRecipe),
    rating: 4.5, // Default rating since API doesn't provide it
    tags: apiRecipe.tags || [apiRecipe.category, apiRecipe.cuisine].filter(Boolean).slice(0, 4),
    description: apiRecipe.recommendation_reason || 'A delicious recipe recommended just for you!',
    ingredients: parseIngredients(apiRecipe),
    instructions: parseInstructions(apiRecipe.instructions),
    nutrition: {
      calories: parseInt(apiRecipe.calories) || 0,
      protein: parseInt(apiRecipe.protein) || 0,
      carbs: parseInt(apiRecipe.carbs) || 0,
      fat: parseInt(apiRecipe.fat) || 0
    }
  };
};

export default function RecipeSwipeScreen({ onNavigateBack, showSkipButton = true, onSkip }: RecipeSwipeScreenProps) {
  const { session } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [currentRecipeIndex, setCurrentRecipeIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.id) {
      recipeCacheService.setUserId(session.user.id);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const userId = session?.user?.id;
      if (!userId) {
        throw new Error('No user ID found');
      }

      console.log('Loading recommendations for user:', userId);
      const recommendations = await recommendationService.getRecommendations(userId, 10);
      
      if (recommendations.length === 0) {
        throw new Error('No recommendations available');
      }

      // Convert API recipes to card format
      const formattedRecipes = recommendations.map(convertApiRecipeToCardFormat);
      setRecipes(formattedRecipes);
      
    } catch (err: any) {
      console.error('Failed to load recommendations:', err);
      setError(err.message || 'Failed to load recommendations');
      
      // Use demo recipes as fallback
      const demoRecipes: Recipe[] = [
        {
          id: '1',
          name: 'Mediterranean Quinoa Bowl',
          image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop',
          cookTime: '25 min',
          servings: 2,
          difficulty: 'Easy',
          rating: 4.8,
          tags: ['Mediterranean', 'Healthy', 'Vegetarian'],
          description: 'A colorful, nutrient-packed bowl with fresh vegetables.',
          ingredients: [
            { name: 'Quinoa', amount: '1 cup', category: 'Grains' },
            { name: 'Cherry tomatoes', amount: '1 cup', category: 'Vegetables' },
            { name: 'Cucumber', amount: '1 medium', category: 'Vegetables' },
          ],
          instructions: [
            'Cook quinoa according to package directions.',
            'Dice vegetables and mix with quinoa.',
            'Add dressing and serve.'
          ],
          nutrition: { calories: 420, protein: 16, carbs: 45, fat: 22 }
        }
      ];
      setRecipes(demoRecipes);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    const currentRecipe = recipes[currentRecipeIndex];
    if (currentRecipe && session?.user?.id) {
      await recommendationService.recordFeedback(session.user.id, currentRecipe.id, 'dislike');
    }
    
    // Go to next recipe or complete
    if (currentRecipeIndex < recipes.length - 1) {
      setCurrentRecipeIndex(prev => prev + 1);
    } else {
      // Completed all recipes, go back
      if (onNavigateBack) {
        onNavigateBack();
      }
    }
  };

  const handleLike = async () => {
    const currentRecipe = recipes[currentRecipeIndex];
    if (currentRecipe && session?.user?.id) {
      await recommendationService.recordFeedback(session.user.id, currentRecipe.id, 'like');
      console.log('💚 Liked recipe:', currentRecipe.name);

      await recipeCacheService.saveLikedRecipe({
        id: currentRecipe.id,
        title: currentRecipe.name,
        image_url: currentRecipe.image,
        category: currentRecipe.tags?.[0],
        area: currentRecipe.tags?.[1],
        calories: currentRecipe.nutrition.calories,
        protein: currentRecipe.nutrition.protein,
        carbs: currentRecipe.nutrition.carbs,
        fat: currentRecipe.nutrition.fat,
        servings: currentRecipe.servings,
        instructions: currentRecipe.instructions,
        ingredients: currentRecipe.ingredients,
        tags: currentRecipe.tags,
        description: currentRecipe.description,
        difficulty: currentRecipe.difficulty,
        cookTime: currentRecipe.cookTime,
        rating: currentRecipe.rating,
      });

      if (currentRecipeIndex < recipes.length - 1) {
        setCurrentRecipeIndex(prev => prev + 1);
      } else {
        onNavigateBack?.();
      }
    }
  };

  const handleCookNow = async () => {
    const currentRecipe = recipes[currentRecipeIndex];
    if (currentRecipe && session?.user?.id) {
      await recommendationService.recordFeedback(session.user.id, currentRecipe.id, 'cook_now');
      console.log('🍳 Starting cooking mode for:', currentRecipe.name);

      await recipeCacheService.saveCookedRecipe({
        id: currentRecipe.id,
        title: currentRecipe.name,
        image_url: currentRecipe.image,
        category: currentRecipe.tags?.[0],
        area: currentRecipe.tags?.[1],
        calories: currentRecipe.nutrition.calories,
        protein: currentRecipe.nutrition.protein,
        carbs: currentRecipe.nutrition.carbs,
        fat: currentRecipe.nutrition.fat,
        servings: currentRecipe.servings,
        instructions: currentRecipe.instructions,
        ingredients: currentRecipe.ingredients,
        tags: currentRecipe.tags,
        description: currentRecipe.description,
        difficulty: currentRecipe.difficulty,
        cookTime: currentRecipe.cookTime,
        rating: currentRecipe.rating,
      });

      if (currentRecipeIndex < recipes.length - 1) {
        setCurrentRecipeIndex(prev => prev + 1);
      } else {
        onNavigateBack?.();
      }
    }
  };

  const handleShareFamily = async () => {
    const currentRecipe = recipes[currentRecipeIndex];
    if (currentRecipe && session?.user?.id) {
      await recommendationService.recordFeedback(session.user.id, currentRecipe.id, 'share_family');
      console.log('👥 Sharing with family:', currentRecipe.name);
      // TODO: Open family share dialog
      // For now, just advance to next recipe
      if (currentRecipeIndex < recipes.length - 1) {
        setCurrentRecipeIndex(prev => prev + 1);
      } else {
        onNavigateBack?.();
      }
    }
  };

  const handleSaveToFavorite = async () => {
    const currentRecipe = recipes[currentRecipeIndex];
    if (currentRecipe && session?.user?.id) {
      await recommendationService.recordFeedback(session.user.id, currentRecipe.id, 'save');
      console.log('⭐ Saved to favorites:', currentRecipe.name);
      // Advance to next recipe
      if (currentRecipeIndex < recipes.length - 1) {
        setCurrentRecipeIndex(prev => prev + 1);
      } else {
        onNavigateBack?.();
      }
    }
  };

  const handleRefresh = async () => {
    console.log('Refreshing recipes...');
    await loadRecommendations();
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading recommendations...</Text>
      </View>
    );
  }

  if (error || recipes.length === 0) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>
          {error || 'No recommendations available'}
        </Text>
      </View>
    );
  }

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    } else if (onNavigateBack) {
      onNavigateBack();
    }
  };

  return (
    <View style={styles.container}>
      {showSkipButton && (
        <SafeAreaView edges={['top']} style={styles.skipContainer}>
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>
        </SafeAreaView>
      )}
      <RecommendationCard
        key={recipes[currentRecipeIndex].id}
        recipe={recipes[currentRecipeIndex]}
        onReject={handleReject}
        onLike={handleLike}
        onRefresh={handleRefresh}
        onCookNow={handleCookNow}
        onShareFamily={handleShareFamily}
        onSaveToFavorite={handleSaveToFavorite}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  skipContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 100,
    paddingRight: 16,
    paddingTop: 8,
  },
  skipButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B8E23',
  },
});