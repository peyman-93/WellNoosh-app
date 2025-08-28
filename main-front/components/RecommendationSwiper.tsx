import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { RecommendationCard } from './RecommendationCard';

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

interface RecommendationSwiperProps {
  recipes: Recipe[];
  onRecipeLiked?: (recipe: Recipe) => void;
  onRecipeRejected?: (recipe: Recipe) => void;
  onComplete?: () => void;
}

const { width: screenWidth } = Dimensions.get('window');

const sampleRecipes: Recipe[] = [
  {
    id: '1',
    name: 'Mediterranean Quinoa Bowl',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop',
    cookTime: '25 min',
    servings: 2,
    difficulty: 'Easy',
    rating: 4.8,
    tags: ['Mediterranean', 'Healthy', 'Vegetarian'],
    description: 'A colorful, nutrient-packed bowl with quinoa, fresh vegetables, olives, and tahini dressing.',
    ingredients: [
      { name: 'Quinoa', amount: '1 cup', category: 'Grains' },
      { name: 'Cherry tomatoes', amount: '1 cup', category: 'Vegetables' },
      { name: 'Cucumber', amount: '1 medium', category: 'Vegetables' },
      { name: 'Red onion', amount: '1/4 cup', category: 'Vegetables' },
      { name: 'Kalamata olives', amount: '1/3 cup', category: 'Pantry' },
      { name: 'Feta cheese', amount: '1/2 cup', category: 'Dairy' },
      { name: 'Tahini', amount: '3 tbsp', category: 'Pantry' },
      { name: 'Lemon juice', amount: '2 tbsp', category: 'Pantry' },
      { name: 'Olive oil', amount: '2 tbsp', category: 'Pantry' }
    ],
    instructions: [
      'Cook quinoa according to package directions and let cool.',
      'Dice cucumber, halve cherry tomatoes, and thinly slice red onion.',
      'Whisk together tahini, lemon juice, olive oil, and a pinch of salt.',
      'Combine quinoa with vegetables and olives in a bowl.',
      'Top with crumbled feta and drizzle with tahini dressing.',
      'Serve immediately or chill for later.'
    ],
    nutrition: {
      calories: 420,
      protein: 16,
      carbs: 45,
      fat: 22
    }
  },
  {
    id: '2',
    name: 'Honey Garlic Salmon',
    image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=300&fit=crop',
    cookTime: '20 min',
    servings: 4,
    difficulty: 'Medium',
    rating: 4.9,
    tags: ['Protein-Rich', 'Heart-Healthy', 'Gluten-Free'],
    description: 'Perfectly glazed salmon with a sweet and savory honey garlic sauce.',
    ingredients: [
      { name: 'Salmon fillets', amount: '4 pieces', category: 'Protein' },
      { name: 'Honey', amount: '1/4 cup', category: 'Pantry' },
      { name: 'Soy sauce', amount: '2 tbsp', category: 'Pantry' },
      { name: 'Garlic', amount: '4 cloves', category: 'Vegetables' },
      { name: 'Ginger', amount: '1 tsp', category: 'Spices' },
      { name: 'Olive oil', amount: '2 tbsp', category: 'Pantry' },
      { name: 'Green onions', amount: '2 stalks', category: 'Vegetables' },
      { name: 'Sesame seeds', amount: '1 tbsp', category: 'Pantry' }
    ],
    instructions: [
      'Pat salmon fillets dry and season with salt and pepper.',
      'Heat olive oil in a large skillet over medium-high heat.',
      'Cook salmon skin-side up for 4-5 minutes until golden.',
      'Flip and cook for another 3-4 minutes.',
      'Mix honey, soy sauce, minced garlic, and ginger in a small bowl.',
      'Pour sauce over salmon and cook for 2 minutes until thickened.',
      'Garnish with green onions and sesame seeds before serving.'
    ],
    nutrition: {
      calories: 380,
      protein: 35,
      carbs: 18,
      fat: 20
    }
  }
];

export function RecommendationSwiper({ 
  recipes = sampleRecipes, 
  onRecipeLiked,
  onRecipeRejected,
  onComplete 
}: RecommendationSwiperProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedRecipes, setLikedRecipes] = useState<Recipe[]>([]);
  const [rejectedRecipes, setRejectedRecipes] = useState<Recipe[]>([]);

  const currentRecipe = recipes[currentIndex];
  const hasMoreRecipes = currentIndex < recipes.length;

  const handleSwipeLeft = () => {
    if (currentRecipe) {
      setRejectedRecipes(prev => [...prev, currentRecipe]);
      onRecipeRejected?.(currentRecipe);
      nextRecipe();
    }
  };

  const handleSwipeRight = () => {
    if (currentRecipe) {
      setLikedRecipes(prev => [...prev, currentRecipe]);
      onRecipeLiked?.(currentRecipe);
      nextRecipe();
    }
  };

  const nextRecipe = () => {
    if (currentIndex + 1 >= recipes.length) {
      onComplete?.();
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  if (!hasMoreRecipes) {
    return (
      <LinearGradient
        colors={['#f0fdf4', '#dcfce7', '#bbf7d0']}
        style={styles.container}
      >
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        <View style={styles.completionContainer}>
          <View style={styles.completionIcon}>
            <Text style={styles.completionIconText}>🎉</Text>
          </View>
          
          <Text style={styles.completionTitle}>
            Great choices!
          </Text>
          <Text style={styles.completionSubtitle}>
            You've reviewed {recipes.length} recipes and liked {likedRecipes.length} of them.
          </Text>
          
          <TouchableOpacity style={styles.doneButton} onPress={onComplete}>
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#fef3c7', '#fed7aa', '#fb923c']}
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover Recipes</Text>
        <Text style={styles.headerSubtitle}>
          {currentIndex + 1} of {recipes.length}
        </Text>
      </View>

      {/* Card Area */}
      <View style={styles.cardArea}>
        <RecommendationCard
          key={currentRecipe.id}
          recipe={currentRecipe}
          onSwipeLeft={handleSwipeLeft}
          onSwipeRight={handleSwipeRight}
          isTopCard={true}
        />
      </View>

      {/* Action Buttons */}
      <View style={styles.actionBar}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.rejectButton]} 
          onPress={handleSwipeLeft}
        >
          <Text style={styles.rejectButtonIcon}>✕</Text>
        </TouchableOpacity>
        
        <View style={styles.progressDots}>
          {recipes.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                index === currentIndex && styles.progressDotActive,
                index < currentIndex && styles.progressDotCompleted,
              ]}
            />
          ))}
        </View>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.likeButton]} 
          onPress={handleSwipeRight}
        >
          <Text style={styles.likeButtonIcon}>💖</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  cardArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  actionButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  rejectButton: {
    backgroundColor: '#ff6b6b',
  },
  rejectButtonIcon: {
    fontSize: 28,
    color: 'white',
    fontWeight: 'bold',
  },
  likeButton: {
    backgroundColor: '#51cf66',
  },
  likeButtonIcon: {
    fontSize: 28,
  },
  progressDots: {
    flexDirection: 'row',
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  progressDotActive: {
    backgroundColor: '#333',
    width: 24,
  },
  progressDotCompleted: {
    backgroundColor: '#51cf66',
  },
  completionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  completionIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  completionIconText: {
    fontSize: 48,
  },
  completionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  completionSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  doneButton: {
    backgroundColor: '#333',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  doneButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
});