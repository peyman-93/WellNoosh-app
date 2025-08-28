import React from 'react';
import {
  View,
  StyleSheet,
} from 'react-native';
import { RecommendationCard } from '../components/RecommendationCard';

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

const demoRecipes: Recipe[] = [
  {
    id: '1',
    name: 'Mediterranean Quinoa Bowl',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop',
    cookTime: '25 min',
    servings: 2,
    difficulty: 'Easy',
    rating: 4.8,
    tags: ['Mediterranean', 'Healthy', 'Vegetarian', 'Gluten-Free'],
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
    tags: ['Protein-Rich', 'Heart-Healthy', 'Gluten-Free', 'Quick'],
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
  },
  {
    id: '3',
    name: 'Thai Basil Chicken Stir-Fry',
    image: 'https://images.unsplash.com/photo-1559847844-d724ce23f162?w=400&h=300&fit=crop',
    cookTime: '15 min',
    servings: 3,
    difficulty: 'Easy',
    rating: 4.6,
    tags: ['Thai', 'Spicy', 'Quick', 'High-Protein'],
    description: 'Aromatic Thai stir-fry with tender chicken, fresh basil, and bold flavors.',
    ingredients: [
      { name: 'Chicken breast', amount: '1 lb', category: 'Protein' },
      { name: 'Thai basil', amount: '1 cup', category: 'Herbs' },
      { name: 'Bell peppers', amount: '2 medium', category: 'Vegetables' },
      { name: 'Thai chilies', amount: '2-3 pieces', category: 'Spices' },
      { name: 'Fish sauce', amount: '2 tbsp', category: 'Pantry' },
      { name: 'Soy sauce', amount: '1 tbsp', category: 'Pantry' },
      { name: 'Brown sugar', amount: '1 tsp', category: 'Pantry' },
      { name: 'Garlic', amount: '4 cloves', category: 'Vegetables' },
      { name: 'Vegetable oil', amount: '2 tbsp', category: 'Pantry' }
    ],
    instructions: [
      'Slice chicken into thin strips and season lightly.',
      'Heat oil in a wok or large skillet over high heat.',
      'Add minced garlic and chilies, stir-fry for 30 seconds.',
      'Add chicken and cook until nearly done, about 4-5 minutes.',
      'Add sliced bell peppers and stir-fry for 2 minutes.',
      'Mix in fish sauce, soy sauce, and brown sugar.',
      'Add Thai basil leaves and toss until wilted.',
      'Serve immediately over steamed rice.'
    ],
    nutrition: {
      calories: 320,
      protein: 32,
      carbs: 12,
      fat: 16
    }
  },
  {
    id: '4',
    name: 'Avocado Toast with Poached Egg',
    image: 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=400&h=300&fit=crop',
    cookTime: '10 min',
    servings: 1,
    difficulty: 'Easy',
    rating: 4.5,
    tags: ['Breakfast', 'Quick', 'Healthy', 'Vegetarian'],
    description: 'Classic avocado toast topped with a perfectly poached egg and fresh herbs.',
    ingredients: [
      { name: 'Whole grain bread', amount: '2 slices', category: 'Grains' },
      { name: 'Ripe avocado', amount: '1 large', category: 'Fruits' },
      { name: 'Eggs', amount: '2 pieces', category: 'Protein' },
      { name: 'Lemon juice', amount: '1 tbsp', category: 'Pantry' },
      { name: 'Salt', amount: 'to taste', category: 'Pantry' },
      { name: 'Black pepper', amount: 'to taste', category: 'Spices' },
      { name: 'Red pepper flakes', amount: 'pinch', category: 'Spices' },
      { name: 'Fresh herbs', amount: '2 tbsp', category: 'Herbs' }
    ],
    instructions: [
      'Toast the bread slices until golden brown.',
      'Bring a pot of water to a gentle simmer for poaching eggs.',
      'Mash the avocado with lemon juice, salt, and pepper.',
      'Crack eggs into the simmering water and poach for 3-4 minutes.',
      'Spread mashed avocado evenly on toast.',
      'Top with poached eggs and season with salt and pepper.',
      'Garnish with red pepper flakes and fresh herbs.',
      'Serve immediately while eggs are warm.'
    ],
    nutrition: {
      calories: 340,
      protein: 18,
      carbs: 30,
      fat: 20
    }
  }
];

export function RecipeRecommendationDemo() {
  const handleReject = () => {
    console.log('Recipe rejected!');
  };

  const handleLike = () => {
    console.log('Recipe liked!');
  };

  const handleRefresh = () => {
    console.log('Refreshing recipe...');
  };

  return (
    <View style={styles.container}>
      <RecommendationCard
        recipe={demoRecipes[0]} // Show the Mediterranean Quinoa Bowl
        onReject={handleReject}
        onLike={handleLike}
        onRefresh={handleRefresh}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});