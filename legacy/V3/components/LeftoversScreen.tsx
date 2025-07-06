import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Edit3, Mic, Camera, ChefHat, Heart, X, Clock, Users, Star, BookmarkPlus, RotateCcw, Trash2, Plus, Check, ShoppingCart, Minus, SkipForward, Share2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { ImageWithFallback } from './figma/ImageWithFallback';
import wellnooshIcon from 'figma:asset/4b28c64338ad95e8eae91615fbda6a4e2cc3d398.png';

interface GroceryItem {
  id: string;
  name: string;
  amount: string;
  category: string;
  addedDate: string;
  fromRecipe?: string;
  completed?: boolean;
}

interface UserData {
  fullName: string;
  email: string;
  country: string;
  city: string;
  postalCode: string;
  age?: number;
  gender?: string;
  weight?: number;
  weightUnit?: 'kg' | 'lbs';
  height?: number;
  heightUnit?: 'cm' | 'ft';
  heightFeet?: number;
  heightInches?: number;
  dietStyle?: string[];
  customDietStyle?: string;
  allergies?: string[];
  medicalConditions?: string[];
  activityLevel?: string;
  healthGoals?: string[];
  foodRestrictions?: string[];
  cookingSkill?: string;
  mealPreference?: string;
  subscriptionTier?: 'free' | 'premium';
  dailySwipesUsed?: number;
  lastSwipeDate?: string;
  favoriteRecipes?: string[];
  selectedRecipes?: string[];
  cookedRecipes?: any[];
  leftovers?: string[];
  groceryList?: GroceryItem[];
}

interface LeftoverItem {
  id: string;
  name: string;
  addedDate: string;
  quantity?: string;
  expiryDate?: string;
}

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
  usesLeftovers?: string[];
}

interface LeftoversScreenProps {
  userData: UserData | null;
  onBack: () => void;
  onUpdateUserData: (userData: UserData) => void;
  onShareWithFamily?: (recipe: Recipe) => void;
}

type ScreenState = 'main' | 'textInput' | 'voiceInput' | 'photoInput' | 'voiceRecommendations' | 'recommendations' | 'cookingConfirm';

export function LeftoversScreen({ userData, onBack, onUpdateUserData, onShareWithFamily }: LeftoversScreenProps) {
  const [screenState, setScreenState] = useState<ScreenState>('main');
  const [leftovers, setLeftovers] = useState<LeftoverItem[]>([]);
  const [textInput, setTextInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [currentRecipeIndex, setCurrentRecipeIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [justLiked, setJustLiked] = useState(false);
  const [cookedRecipe, setCookedRecipe] = useState<Recipe | null>(null);
  const [ingredientChecklist, setIngredientChecklist] = useState<{[recipeId: string]: {[ingredientIndex: number]: boolean}}>({});
  const [recipeServings, setRecipeServings] = useState<{[recipeId: string]: number}>({});
  
  const cardRef = useRef<HTMLDivElement>(null);
  const startPos = useRef({ x: 0, y: 0 });
  const recordingInterval = useRef<NodeJS.Timeout | null>(null);

  // Helper function to parse text input into individual leftover items
  const parseTextInput = (input: string): string[] => {
    if (!input.trim()) return [];
    
    // Split by various delimiters: commas, semicolons, "and", newlines
    const items = input
      .split(/[,;+\n]|\sand\s/i) // Split by comma, semicolon, plus, newline, or " and "
      .map(item => item.trim()) // Remove whitespace
      .filter(item => item.length > 0) // Remove empty items
      .map(item => {
        // Clean up common prefixes/suffixes
        return item
          .replace(/^(leftover\s+|left\s+over\s+)/i, '') // Remove "leftover" prefix
          .replace(/\s+(left\s*over|leftovers?)$/i, '') // Remove "leftover" suffix
          .replace(/^(some\s+|a\s+|an\s+)/i, '') // Remove articles
          .trim()
          .toLowerCase();
      })
      .filter(item => item.length > 0); // Final filter for non-empty items
    
    // Remove duplicates while preserving order
    return [...new Set(items)];
  };

  // Helper function to parse and scale ingredient amounts
  const scaleIngredientAmount = (originalAmount: string, originalServings: number, newServings: number): string => {
    const scaleFactor = newServings / originalServings;
    
    // Extract numbers and units from the amount string
    const match = originalAmount.match(/^(\d+(?:\.\d+)?(?:\/\d+)?)\s*(.*)$/);
    
    if (!match) {
      // If we can't parse it, return original
      return originalAmount;
    }
    
    const [, numberPart, unit] = match;
    let number = parseFloat(numberPart);
    
    // Handle fractions like "1/2"
    if (numberPart.includes('/')) {
      const [numerator, denominator] = numberPart.split('/');
      number = parseFloat(numerator) / parseFloat(denominator);
    }
    
    const scaledNumber = number * scaleFactor;
    
    // Format the scaled number nicely
    let formattedNumber: string;
    if (scaledNumber < 0.1) {
      formattedNumber = scaledNumber.toFixed(2).replace(/\.?0+$/, '');
    } else if (scaledNumber < 1) {
      formattedNumber = scaledNumber.toFixed(1).replace(/\.?0+$/, '');
    } else if (scaledNumber % 1 === 0) {
      formattedNumber = scaledNumber.toString();
    } else {
      formattedNumber = scaledNumber.toFixed(1).replace(/\.?0+$/, '');
    }
    
    return `${formattedNumber} ${unit}`.trim();
  };

  // Helper function to scale nutrition info
  const scaleNutrition = (originalNutrition: any, originalServings: number, newServings: number) => {
    const scaleFactor = newServings / originalServings;
    return {
      calories: Math.round(originalNutrition.calories * scaleFactor),
      protein: Math.round(originalNutrition.protein * scaleFactor),
      carbs: Math.round(originalNutrition.carbs * scaleFactor),
      fat: Math.round(originalNutrition.fat * scaleFactor)
    };
  };

  // Get current servings for a recipe
  const getCurrentServings = (recipeId: string, originalServings: number) => {
    return recipeServings[recipeId] || originalServings;
  };

  // Update servings for a recipe
  const updateServings = (recipeId: string, newServings: number) => {
    if (newServings < 1) return; // Don't allow less than 1 serving
    if (newServings > 20) return; // Don't allow more than 20 servings
    
    setRecipeServings(prev => ({
      ...prev,
      [recipeId]: newServings
    }));
  };

  // Load leftovers from localStorage
  useEffect(() => {
    const storedLeftovers = localStorage.getItem('wellnoosh_leftovers');
    if (storedLeftovers) {
      try {
        setLeftovers(JSON.parse(storedLeftovers));
      } catch (error) {
        console.error('Error parsing leftovers:', error);
      }
    }
  }, []);

  // Save leftovers to localStorage
  const saveLeftovers = (updatedLeftovers: LeftoverItem[]) => {
    setLeftovers(updatedLeftovers);
    localStorage.setItem('wellnoosh_leftovers', JSON.stringify(updatedLeftovers));
  };

  const handleIngredientToggle = (ingredientIndex: number, hasIngredient: boolean) => {
    const recipes = screenState === 'voiceRecommendations' ? voiceRecommendationRecipes : leftoverRecipes;
    const currentRecipe = recipes[currentRecipeIndex];
    const recipeId = currentRecipe.id;
    const currentServings = getCurrentServings(recipeId, currentRecipe.servings);
    
    setIngredientChecklist(prev => ({
      ...prev,
      [recipeId]: {
        ...prev[recipeId],
        [ingredientIndex]: hasIngredient
      }
    }));

    // If user doesn't have the ingredient, add to grocery list
    if (!hasIngredient && userData) {
      const ingredient = currentRecipe.ingredients[ingredientIndex];
      const scaledAmount = scaleIngredientAmount(ingredient.amount, currentRecipe.servings, currentServings);
      const newGroceryItem: GroceryItem = {
        id: Date.now().toString() + Math.random(),
        name: ingredient.name,
        amount: scaledAmount,
        category: ingredient.category,
        addedDate: new Date().toISOString(),
        fromRecipe: currentRecipe.name,
        completed: false
      };

      const updatedUserData = {
        ...userData,
        groceryList: [...(userData.groceryList || []), newGroceryItem]
      };

      onUpdateUserData(updatedUserData);
      localStorage.setItem('wellnoosh_user_data', JSON.stringify(updatedUserData));
    } else if (hasIngredient && userData) {
      // If user now has the ingredient, remove from grocery list
      const ingredient = currentRecipe.ingredients[ingredientIndex];
      const updatedGroceryList = (userData.groceryList || []).filter(item => 
        !(item.name.toLowerCase() === ingredient.name.toLowerCase() && item.fromRecipe === currentRecipe.name)
      );

      const updatedUserData = {
        ...userData,
        groceryList: updatedGroceryList
      };

      onUpdateUserData(updatedUserData);
      localStorage.setItem('wellnoosh_user_data', JSON.stringify(updatedUserData));
    }
  };

  // Voice recommendation recipes (3 quick suggestions)
  const voiceRecommendationRecipes: Recipe[] = [
    {
      id: 'voice-1',
      name: 'Quick Chicken Stir Fry',
      image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&h=300&fit=crop',
      cookTime: '12 min',
      servings: 2,
      difficulty: 'Easy',
      rating: 4.7,
      tags: ['Quick', 'Voice Suggested', 'Asian', 'Healthy'],
      description: 'Perfect for your leftover chicken and fresh ingredients. A quick and delicious meal.',
      ingredients: [
        { name: 'Leftover chicken breast', amount: '1 cup', category: 'Leftovers' },
        { name: 'Mixed vegetables', amount: '2 cups', category: 'Fresh' },
        { name: 'Soy sauce', amount: '2 tbsp', category: 'Pantry' },
        { name: 'Garlic', amount: '2 cloves', category: 'Fresh' },
        { name: 'Ginger', amount: '1 tsp', category: 'Spices' },
        { name: 'Sesame oil', amount: '1 tsp', category: 'Pantry' }
      ],
      instructions: [
        'Heat oil in a large pan or wok over high heat.',
        'Add minced garlic and ginger, stir-fry for 30 seconds.',
        'Add leftover chicken and cook for 2-3 minutes.',
        'Add vegetables and stir-fry for 3-4 minutes.',
        'Add soy sauce and sesame oil, toss everything together.',
        'Serve immediately over rice or noodles.'
      ],
      nutrition: {
        calories: 280,
        protein: 24,
        carbs: 18,
        fat: 12
      }
    },
    {
      id: 'voice-2',
      name: 'Leftover Veggie Rice Bowl',
      image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop',
      cookTime: '8 min',
      servings: 1,
      difficulty: 'Easy',
      rating: 4.5,
      tags: ['Quick', 'Voice Suggested', 'Healthy', 'Vegetarian'],
      description: 'Transform your leftover vegetables into a nutritious and satisfying bowl.',
      ingredients: [
        { name: 'Leftover vegetables', amount: '1.5 cups', category: 'Leftovers' },
        { name: 'Cooked rice', amount: '1 cup', category: 'Grains' },
        { name: 'Egg', amount: '1 large', category: 'Protein' },
        { name: 'Soy sauce', amount: '1 tbsp', category: 'Pantry' },
        { name: 'Sesame seeds', amount: '1 tsp', category: 'Pantry' },
        { name: 'Green onions', amount: '2 stalks', category: 'Fresh' }
      ],
      instructions: [
        'Heat rice in microwave or pan until warm.',
        'Fry an egg sunny-side up or scrambled.',
        'Quickly sauté leftover vegetables if needed.',
        'Place rice in a bowl, top with vegetables and egg.',
        'Drizzle with soy sauce and sprinkle sesame seeds.',
        'Garnish with chopped green onions and serve.'
      ],
      nutrition: {
        calories: 320,
        protein: 14,
        carbs: 48,
        fat: 10
      }
    },
    {
      id: 'voice-3',
      name: 'Leftover Protein Wrap',
      image: 'https://images.unsplash.com/photo-1574672280600-4accfa5b6f98?w=400&h=300&fit=crop',
      cookTime: '5 min',
      servings: 1,
      difficulty: 'Easy',
      rating: 4.6,
      tags: ['Quick', 'Voice Suggested', 'Portable', 'Protein-Rich'],
      description: 'A quick wrap using your leftover protein and fresh ingredients for a perfect meal.',
      ingredients: [
        { name: 'Leftover protein', amount: '0.5 cup', category: 'Leftovers' },
        { name: 'Large tortilla', amount: '1 piece', category: 'Bakery' },
        { name: 'Lettuce leaves', amount: '3-4 leaves', category: 'Fresh' },
        { name: 'Tomato', amount: '0.5 medium', category: 'Fresh' },
        { name: 'Cheese', amount: '2 tbsp', category: 'Dairy' },
        { name: 'Mayo or sauce', amount: '1 tbsp', category: 'Condiments' }
      ],
      instructions: [
        'Warm the tortilla in microwave for 20 seconds.',
        'Spread mayo or your favorite sauce on the tortilla.',
        'Add lettuce leaves and sliced tomato.',
        'Add leftover protein and cheese.',
        'Roll tightly, tucking in the sides as you go.',
        'Cut in half and serve immediately.'
      ],
      nutrition: {
        calories: 350,
        protein: 20,
        carbs: 28,
        fat: 18
      }
    }
  ];

  // Mock leftover recipes (for full recommendations) - Enhanced with more recipes
  const leftoverRecipes: Recipe[] = [
    {
      id: 'leftover-1',
      name: 'Leftover Veggie Fried Rice',
      image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&h=300&fit=crop',
      cookTime: '15 min',
      servings: 2,
      difficulty: 'Easy',
      rating: 4.6,
      tags: ['Quick', 'Leftover Magic', 'Asian', 'One-Pan'],
      description: 'Transform your leftover vegetables and rice into a delicious fried rice with simple seasonings.',
      usesLeftovers: ['rice', 'vegetables', 'chicken', 'beef'],
      ingredients: [
        { name: 'Leftover cooked rice', amount: '2 cups', category: 'Leftovers' },
        { name: 'Mixed leftover vegetables', amount: '1 cup', category: 'Leftovers' },
        { name: 'Eggs', amount: '2 large', category: 'Protein' },
        { name: 'Soy sauce', amount: '2 tbsp', category: 'Pantry' },
        { name: 'Sesame oil', amount: '1 tsp', category: 'Pantry' },
        { name: 'Green onions', amount: '2 stalks', category: 'Fresh' },
        { name: 'Garlic', amount: '2 cloves', category: 'Fresh' }
      ],
      instructions: [
        'Heat oil in a large pan or wok over medium-high heat.',
        'Add minced garlic and cook for 30 seconds until fragrant.',
        'Add leftover vegetables and stir-fry for 2-3 minutes.',
        'Push vegetables to one side, scramble eggs on the other side.',
        'Add leftover rice, breaking up any clumps.',
        'Mix everything together and add soy sauce and sesame oil.',
        'Stir-fry for 3-4 minutes until heated through.',
        'Garnish with chopped green onions and serve immediately.'
      ],
      nutrition: {
        calories: 320,
        protein: 12,
        carbs: 45,
        fat: 11
      }
    },
    {
      id: 'leftover-2',
      name: 'Leftover Shepherd\'s Pie',
      image: 'https://images.unsplash.com/photo-1574672280600-4accfa5b6f98?w=400&h=300&fit=crop',
      cookTime: '35 min',
      servings: 6,
      difficulty: 'Medium',
      rating: 4.8,
      tags: ['Comfort Food', 'Leftover Magic', 'British', 'Hearty'],
      description: 'A comforting dish that transforms leftover meat and vegetables into a satisfying family meal.',
      usesLeftovers: ['meat', 'vegetables', 'mashed potatoes'],
      ingredients: [
        { name: 'Leftover cooked meat', amount: '2 cups', category: 'Leftovers' },
        { name: 'Leftover mashed potatoes', amount: '3 cups', category: 'Leftovers' },
        { name: 'Mixed leftover vegetables', amount: '1.5 cups', category: 'Leftovers' },
        { name: 'Onion', amount: '1 medium', category: 'Vegetables' },
        { name: 'Beef stock', amount: '1 cup', category: 'Pantry' },
        { name: 'Worcestershire sauce', amount: '2 tbsp', category: 'Pantry' },
        { name: 'Tomato paste', amount: '2 tbsp', category: 'Pantry' },
        { name: 'Butter', amount: '2 tbsp', category: 'Dairy' }
      ],
      instructions: [
        'Preheat oven to 400°F (200°C).',
        'Sauté diced onion in butter until soft.',
        'Add leftover meat and vegetables to the pan.',
        'Stir in tomato paste, Worcestershire sauce, and stock.',
        'Simmer for 5 minutes until slightly thickened.',
        'Transfer mixture to a baking dish.',
        'Top with leftover mashed potatoes, spreading evenly.',
        'Bake for 25 minutes until golden on top.',
        'Let rest for 5 minutes before serving.'
      ],
      nutrition: {
        calories: 385,
        protein: 22,
        carbs: 35,
        fat: 18
      }
    },
    {
      id: 'leftover-3',
      name: 'Leftover Pasta Salad',
      image: 'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=400&h=300&fit=crop',
      cookTime: '10 min',
      servings: 4,
      difficulty: 'Easy',
      rating: 4.4,
      tags: ['Quick', 'Cold', 'Leftover Magic', 'Refreshing'],
      description: 'Turn leftover pasta into a refreshing cold salad perfect for lunch or light dinner.',
      usesLeftovers: ['pasta', 'vegetables', 'cheese'],
      ingredients: [
        { name: 'Leftover cooked pasta', amount: '3 cups', category: 'Leftovers' },
        { name: 'Leftover vegetables', amount: '1 cup', category: 'Leftovers' },
        { name: 'Cherry tomatoes', amount: '1 cup', category: 'Vegetables' },
        { name: 'Mozzarella cheese', amount: '1/2 cup', category: 'Dairy' },
        { name: 'Olive oil', amount: '3 tbsp', category: 'Pantry' },
        { name: 'Balsamic vinegar', amount: '2 tbsp', category: 'Pantry' },
        { name: 'Fresh basil', amount: '1/4 cup', category: 'Herbs' },
        { name: 'Salt and pepper', amount: 'to taste', category: 'Seasonings' }
      ],
      instructions: [
        'If pasta is warm, let it cool to room temperature.',
        'Halve the cherry tomatoes and cube the mozzarella.',
        'In a large bowl, combine pasta, leftover vegetables, tomatoes, and cheese.',
        'Whisk together olive oil, balsamic vinegar, salt, and pepper.',
        'Pour dressing over pasta mixture and toss well.',
        'Add fresh basil leaves and gently mix.',
        'Chill for at least 30 minutes before serving.',
        'Taste and adjust seasoning before serving.'
      ],
      nutrition: {
        calories: 295,
        protein: 12,
        carbs: 38,
        fat: 12
      }
    },
    {
      id: 'leftover-4',
      name: 'Leftover Soup Supreme',
      image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop',
      cookTime: '25 min',
      servings: 4,
      difficulty: 'Easy',
      rating: 4.7,
      tags: ['Warm', 'Comfort', 'Leftover Magic', 'Healthy'],
      description: 'A hearty soup that makes the most of various leftovers for a warming, nutritious meal.',
      usesLeftovers: ['vegetables', 'meat', 'rice', 'pasta'],
      ingredients: [
        { name: 'Mixed leftover vegetables', amount: '2 cups', category: 'Leftovers' },
        { name: 'Leftover meat (optional)', amount: '1 cup', category: 'Leftovers' },
        { name: 'Vegetable or chicken broth', amount: '4 cups', category: 'Pantry' },
        { name: 'Canned tomatoes', amount: '1 can', category: 'Pantry' },
        { name: 'Onion', amount: '1 medium', category: 'Vegetables' },
        { name: 'Garlic', amount: '3 cloves', category: 'Vegetables' },
        { name: 'Italian herbs', amount: '1 tsp', category: 'Spices' },
        { name: 'Olive oil', amount: '2 tbsp', category: 'Pantry' }
      ],
      instructions: [
        'Heat olive oil in a large pot over medium heat.',
        'Sauté diced onion and minced garlic until fragrant.',
        'Add canned tomatoes and Italian herbs, cook for 2 minutes.',
        'Pour in broth and bring to a boil.',
        'Add harder leftover vegetables first, simmer for 10 minutes.',
        'Add softer vegetables and any leftover meat.',
        'Simmer for another 10 minutes until heated through.',
        'Season with salt and pepper to taste before serving.'
      ],
      nutrition: {
        calories: 180,
        protein: 8,
        carbs: 25,
        fat: 6
      }
    }
  ];

  const getCurrentRecipes = () => {
    return screenState === 'voiceRecommendations' ? voiceRecommendationRecipes : leftoverRecipes;
  };

  const currentRecipe = getCurrentRecipes()[currentRecipeIndex];
  const currentServings = currentRecipe ? getCurrentServings(currentRecipe.id, currentRecipe.servings) : 1;
  const getUserFirstName = () => {
    if (!userData?.fullName) return '';
    return userData.fullName.split(' ')[0];
  };

  // Enhanced text input handler with smart parsing
  const handleAddTextLeftover = () => {
    if (textInput.trim()) {
      const parsedItems = parseTextInput(textInput);
      
      if (parsedItems.length === 0) {
        // If parsing failed, fall back to treating the entire input as one item
        const newLeftover: LeftoverItem = {
          id: Date.now().toString(),
          name: textInput.trim().toLowerCase(),
          addedDate: new Date().toISOString(),
        };
        saveLeftovers([...leftovers, newLeftover]);
      } else {
        // Create individual leftover items for each parsed item
        const newLeftovers = parsedItems.map((item, index) => ({
          id: (Date.now() + index).toString(),
          name: item,
          addedDate: new Date().toISOString(),
        }));
        saveLeftovers([...leftovers, ...newLeftovers]);
      }
      
      setTextInput('');
      setScreenState('main');
    }
  };

  const handleRemoveLeftover = (id: string) => {
    const updatedLeftovers = leftovers.filter(item => item.id !== id);
    saveLeftovers(updatedLeftovers);
  };

  const startRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
    recordingInterval.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (recordingInterval.current) {
      clearInterval(recordingInterval.current);
    }
    
    // Simulate voice processing and add leftover
    setTimeout(() => {
      const mockVoiceResults = ['chicken breast', 'broccoli', 'rice'];
      const newLeftovers = mockVoiceResults.map(item => ({
        id: Date.now().toString() + Math.random(),
        name: item,
        addedDate: new Date().toISOString(),
      }));
      saveLeftovers([...leftovers, ...newLeftovers]);
      
      // Show voice recommendations instead of going to main
      setCurrentRecipeIndex(0);
      setScreenState('voiceRecommendations');
    }, 2000);
  };

  const handleSwipe = (direction: 'left' | 'right') => {
    if (direction === 'right') {
      setJustLiked(true);
      setIsCardFlipped(true);
      return;
    }

    setSwipeDirection(direction);
    setTimeout(() => {
      setSwipeDirection(null);
      const nextIndex = currentRecipeIndex + 1;
      const maxRecipes = getCurrentRecipes().length;
      
      if (nextIndex >= maxRecipes) {
        if (screenState === 'voiceRecommendations') {
          setScreenState('main');
        } else if (screenState === 'recommendations') {
          setScreenState('main');
        } else {
          setCurrentRecipeIndex(0);
        }
      } else {
        setCurrentRecipeIndex(nextIndex);
      }
      
      setIsCardFlipped(false);
      setJustLiked(false);
    }, 300);
  };

  // Handle skip functionality - moves to next recipe without any action
  const handleSkip = () => {
    setSwipeDirection(null);
    setTimeout(() => {
      const nextIndex = currentRecipeIndex + 1;
      const maxRecipes = getCurrentRecipes().length;
      
      if (nextIndex >= maxRecipes) {
        if (screenState === 'voiceRecommendations') {
          setScreenState('main');
        } else if (screenState === 'recommendations') {
          setScreenState('main');
        } else {
          setCurrentRecipeIndex(0);
        }
      } else {
        setCurrentRecipeIndex(nextIndex);
      }
      
      setIsCardFlipped(false);
      setJustLiked(false);
    }, 200);
  };

  const handleCookNow = () => {
    setCookedRecipe(currentRecipe);
    setScreenState('cookingConfirm');
  };

  const handleShareWithFamily = () => {
    if (onShareWithFamily && currentRecipe) {
      onShareWithFamily(currentRecipe);
    }
  };

  const handleCookingConfirm = (confirm: boolean) => {
    if (confirm && cookedRecipe) {
      const usedLeftovers = cookedRecipe.usesLeftovers || [];
      const updatedLeftovers = leftovers.filter(leftover => 
        !usedLeftovers.some(used => 
          leftover.name.toLowerCase().includes(used.toLowerCase()) || 
          used.toLowerCase().includes(leftover.name.toLowerCase())
        )
      );
      saveLeftovers(updatedLeftovers);
    }
    
    setCookedRecipe(null);
    const returnState = screenState === 'cookingConfirm' && cookedRecipe ? 
      (cookedRecipe.id.startsWith('voice-') ? 'voiceRecommendations' : 'recommendations') : 'recommendations';
    setScreenState(returnState);
    setTimeout(() => {
      const nextIndex = currentRecipeIndex + 1;
      const maxRecipes = getCurrentRecipes().length;
      
      if (nextIndex >= maxRecipes) {
        if (returnState === 'voiceRecommendations') {
          setScreenState('main');
        } else {
          setScreenState('main');
        }
      } else {
        setCurrentRecipeIndex(nextIndex);
      }
      setIsCardFlipped(false);
      setJustLiked(false);
    }, 300);
  };

  const handleCardFlip = () => {
    if (!justLiked) {
      setIsCardFlipped(!isCardFlipped);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (justLiked) return;
    setIsDragging(true);
    startPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || justLiked) return;
    const deltaX = e.clientX - startPos.current.x;
    const deltaY = e.clientY - startPos.current.y;
    setDragOffset({ x: deltaX, y: deltaY });
  };

  const handleMouseUp = () => {
    if (!isDragging || justLiked) return;
    setIsDragging(false);
    if (Math.abs(dragOffset.x) > 100) {
      if (dragOffset.x > 0) {
        handleSwipe('right');
      } else {
        handleSwipe('left');
      }
    }
    setDragOffset({ x: 0, y: 0 });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Main leftover management screen
  if (screenState === 'main') {
    return (
      <div className="flex flex-col h-full bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
        <div className="flex items-center justify-center p-6 bg-white/80 backdrop-blur-md border-b border-gray-200 relative">
          <button onClick={onBack} className="ios-button p-2 text-gray-600 absolute left-6">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <img src={wellnooshIcon} alt="WellNoosh" className="w-10 h-10 object-contain rounded-full wellnoosh-logo mx-auto mb-1" />
            <h2 className="text-sm font-bold brand-title font-brand">Zero-left-chef</h2>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto ios-scroll p-6">
          <div className="max-w-sm mx-auto space-y-6">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2 font-body">Hi {getUserFirstName()}! 👋</h1>
              <p className="text-gray-600 font-body">Let's track your leftovers and create amazing meals!</p>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 font-body">Add Leftovers</h3>
              
              <button onClick={() => setScreenState('textInput')} className="ios-button w-full p-4 bg-white border border-gray-200 rounded-2xl flex items-center gap-4 shadow-sm">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Edit3 className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1 text-left">
                  <h4 className="font-semibold text-gray-900 font-body">Write it down</h4>
                  <p className="text-sm text-gray-600 font-body">Type multiple items separated by commas</p>
                </div>
              </button>

              <button onClick={() => setScreenState('voiceInput')} className="ios-button w-full p-4 bg-white border border-gray-200 rounded-2xl flex items-center gap-4 shadow-sm">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Mic className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1 text-left">
                  <h4 className="font-semibold text-gray-900 font-body">Voice message</h4>
                  <p className="text-sm text-gray-600 font-body">Tell us what you have</p>
                </div>
              </button>

              <button disabled className="ios-button w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl flex items-center gap-4 opacity-50">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                  <Camera className="w-6 h-6 text-gray-400" />
                </div>
                <div className="flex-1 text-left">
                  <h4 className="font-semibold text-gray-500 font-body">Take a picture</h4>
                  <p className="text-sm text-gray-400 font-body">Coming soon!</p>
                </div>
              </button>
            </div>

            {leftovers.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 font-body">Your Leftovers</h3>
                  <Badge variant="secondary" className="text-xs">{leftovers.length} items</Badge>
                </div>
                
                <div className="space-y-2">
                  {leftovers.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200">
                      <span className="font-medium text-gray-900 font-body capitalize">{item.name}</span>
                      <button onClick={() => handleRemoveLeftover(item.id)} className="ios-button p-1 text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <button onClick={() => setScreenState('recommendations')} className="ios-button w-full py-4 text-lg font-bold text-white bg-gradient-to-r from-green-500 via-blue-500 to-purple-600 shadow-lg">
                  Get WellNoosh Recommendations ✨
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Text Input Screen with enhanced guidance
  if (screenState === 'textInput') {
    return (
      <div className="flex flex-col h-full bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
        <div className="flex items-center justify-center p-6 bg-white/80 backdrop-blur-md border-b border-gray-200 relative">
          <button onClick={() => setScreenState('main')} className="ios-button p-2 text-gray-600 absolute left-6">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <h2 className="text-lg font-bold text-gray-900 font-body">Write Leftovers</h2>
          </div>
        </div>

        <div className="flex-1 p-6 flex flex-col">
          <div className="max-w-sm mx-auto flex-1 flex flex-col">
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-2 font-body">What leftovers do you have?</h3>
              <p className="text-gray-600 text-sm font-body mb-3">List multiple items separated by commas - I'll organize them for you!</p>
              
              {/* Enhanced guidance with examples */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4">
                <p className="text-xs text-blue-700 font-body mb-2">✨ <strong>Smart Examples:</strong></p>
                <p className="text-xs text-blue-600 font-body">"chicken, rice, broccoli"</p>
                <p className="text-xs text-blue-600 font-body">"leftover pasta and some vegetables"</p>
                <p className="text-xs text-blue-600 font-body">"salmon; mashed potatoes; green beans"</p>
              </div>
            </div>

            <Textarea
              placeholder="e.g., chicken breast, steamed broccoli, cooked rice..."
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              className="flex-1 min-h-32 ios-button bg-white border-gray-200 resize-none"
            />

            <div className="mt-6 space-y-3">
              <button
                onClick={handleAddTextLeftover}
                disabled={!textInput.trim()}
                className="ios-button w-full py-4 text-lg font-bold text-white bg-gradient-to-r from-green-500 via-blue-500 to-purple-600 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add to My Leftovers
              </button>
              
              <button
                onClick={() => setScreenState('main')}
                className="ios-button w-full py-3 text-gray-600 bg-gray-100 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (screenState === 'voiceInput') {
    return (
      <div className="flex flex-col h-full bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
        <div className="flex items-center justify-center p-6 bg-white/80 backdrop-blur-md border-b border-gray-200 relative">
          <button onClick={() => setScreenState('main')} className="ios-button p-2 text-gray-600 absolute left-6">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <h2 className="text-lg font-bold text-gray-900 font-body">Voice Message</h2>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center space-y-8 max-w-sm">
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 font-body">{isRecording ? 'Listening...' : 'Tell us your leftovers'}</h3>
              <p className="text-gray-600 text-sm font-body">{isRecording ? 'Speak clearly about what leftovers you have' : 'Tap the microphone and describe your leftovers'}</p>
            </div>
            <div className="relative">
              <button onClick={isRecording ? stopRecording : startRecording} className={`ios-button w-32 h-32 rounded-full flex items-center justify-center shadow-2xl ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-green-500 text-white'}`}>
                <Mic className="w-12 h-12" />
              </button>
              {isRecording && (
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
                  <span className="text-lg font-bold text-red-600">{formatTime(recordingTime)}</span>
                </div>
              )}
            </div>
            {isRecording && (
              <div className="space-y-2">
                <div className="flex justify-center space-x-2">
                  <div className="w-2 h-6 bg-green-500 rounded animate-pulse"></div>
                  <div className="w-2 h-8 bg-green-500 rounded animate-pulse" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-4 bg-green-500 rounded animate-pulse" style={{animationDelay: '0.2s'}}></div>
                  <div className="w-2 h-7 bg-green-500 rounded animate-pulse" style={{animationDelay: '0.3s'}}></div>
                  <div className="w-2 h-5 bg-green-500 rounded animate-pulse" style={{animationDelay: '0.4s'}}></div>
                </div>
                <p className="text-sm text-gray-600 font-body">AI is processing your voice...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Cooking Confirmation Screen
  if (screenState === 'cookingConfirm' && cookedRecipe) {
    return (
      <div className="flex flex-col h-full bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
        <div className="flex items-center justify-center p-6 bg-white/80 backdrop-blur-md border-b border-gray-200">
          <div className="text-center">
            <img src={wellnooshIcon} alt="WellNoosh" className="w-10 h-10 object-contain rounded-full wellnoosh-logo mx-auto mb-1" />
            <h2 className="text-sm font-bold brand-title font-brand">Cooking Confirmation</h2>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center space-y-8 max-w-sm">
            <div className="w-32 h-32 mx-auto bg-gradient-to-br from-green-400 via-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl">
              <ChefHat className="w-16 h-16 text-white" />
            </div>
            <div className="space-y-4">
              <h1 className="text-2xl font-bold text-gray-900 font-body">Did you cook this recipe?</h1>
              <h2 className="text-lg font-semibold text-blue-600 font-body">{cookedRecipe.name}</h2>
              <p className="text-gray-600 leading-relaxed font-body">If you cooked this recipe, I'll remove the used leftovers from your list to keep it updated!</p>
            </div>
            <div className="space-y-4">
              <button onClick={() => handleCookingConfirm(true)} className="ios-button w-full py-4 text-lg font-bold text-white bg-gradient-to-r from-green-500 via-blue-500 to-purple-600 shadow-lg flex items-center justify-center gap-2">
                <Check className="w-5 h-5" />
                Yes, I cooked it!
              </button>
              <button onClick={() => handleCookingConfirm(false)} className="ios-button w-full py-3 text-gray-600 bg-gray-100 font-medium">Not yet, maybe later</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Regular Recommendations Screen (for manual leftovers)
  if (screenState === 'recommendations') {
    if (currentRecipeIndex >= leftoverRecipes.length) {
      return (
        <div className="flex flex-col h-full bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
          <div className="flex items-center justify-center p-6 bg-white/80 backdrop-blur-md border-b border-gray-200">
            <div className="text-center">
              <img src={wellnooshIcon} alt="WellNoosh" className="w-10 h-10 object-contain rounded-full wellnoosh-logo mx-auto mb-1" />
              <h2 className="text-sm font-bold brand-title font-brand">Recommendations Complete!</h2>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center space-y-8 max-w-sm">
              <div className="w-32 h-32 mx-auto bg-gradient-to-br from-green-400 via-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl">
                <ChefHat className="w-16 h-16 text-white" />
              </div>
              <div className="space-y-4">
                <h1 className="text-2xl font-bold text-gray-900 font-body">Great choices, {getUserFirstName()}! 👨‍🍳</h1>
                <p className="text-gray-600 leading-relaxed font-body">You've explored our leftover recommendations. Ready to continue using Zero-left-chef?</p>
              </div>
              <div className="space-y-4">
                <button onClick={() => setScreenState('main')} className="ios-button w-full py-4 text-lg font-bold text-white bg-gradient-to-r from-green-500 via-blue-500 to-purple-600 shadow-lg">Back to Zero-left-chef</button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full bg-gradient-to-br from-orange-50 via-red-50 to-pink-50">
        <div className="flex items-center justify-center p-6 bg-white/80 backdrop-blur-md border-b border-gray-200 relative">
          <button onClick={() => setScreenState('main')} className="ios-button p-2 text-gray-600 absolute left-6">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-center flex flex-col items-center">
            <img src={wellnooshIcon} alt="WellNoosh" className="w-10 h-10 object-contain rounded-full wellnoosh-logo mx-auto mb-2" />
            <h2 className="text-sm font-bold brand-title font-brand mb-2">Leftover Recommendations</h2>
            <div className="flex items-center justify-center gap-3">
              <span className="text-sm font-medium text-gray-600 font-body">{currentRecipeIndex + 1} / {leftoverRecipes.length}</span>
              <Badge variant="secondary" className="text-xs px-3 py-1 bg-orange-100 text-orange-700">🥘 Based on Your Items</Badge>
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-6 relative">
          <div className="w-full max-w-sm h-[600px] relative">
            <div ref={cardRef} className={`recipe-card ${swipeDirection ? `swipe-${swipeDirection}` : ''} ${isCardFlipped ? 'flipped' : ''}`} style={{ transform: isDragging && !justLiked ? `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${dragOffset.x * 0.1}deg)` : undefined }} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onClick={handleCardFlip}>
              <div className="card-face card-front">
                <div className="relative h-full bg-white rounded-3xl shadow-2xl overflow-hidden">
                  <div className="h-2/3 relative">
                    <ImageWithFallback src={currentRecipe.image} alt={currentRecipe.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md rounded-full px-3 py-1 flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="text-sm font-semibold">{currentRecipe.rating}</span>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <h2 className="text-2xl font-bold text-white mb-2 font-body">{currentRecipe.name}</h2>
                      <div className="flex items-center gap-4 text-white/90 text-sm">
                        <div className="flex items-center gap-1"><Clock className="w-4 h-4" />{currentRecipe.cookTime}</div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <div className="flex items-center gap-1">
                            <button onClick={(e) => { e.stopPropagation(); updateServings(currentRecipe.id, currentServings - 1); }} className="ios-button w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="mx-1 min-w-[2rem] text-center">{currentServings}</span>
                            <button onClick={(e) => { e.stopPropagation(); updateServings(currentRecipe.id, currentServings + 1); }} className="ios-button w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          servings
                        </div>
                        <div className="flex items-center gap-1"><ChefHat className="w-4 h-4" />{currentRecipe.difficulty}</div>
                      </div>
                    </div>
                  </div>
                  <div className="h-1/3 p-6 flex flex-col justify-between">
                    <div>
                      <p className="text-gray-600 mb-4 font-body leading-relaxed">{currentRecipe.description}</p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {currentRecipe.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-500 font-body">{!justLiked ? 'Tap card to see recipe • Swipe to choose' : ''}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card-face card-back">
                <div className="h-full bg-white rounded-3xl shadow-2xl overflow-hidden">
                  <div className="h-full overflow-y-auto ios-scroll">
                    <div className="p-6">
                      <div className="text-center mb-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-2 font-body">{currentRecipe.name}</h2>
                        <div className="flex justify-center gap-4 text-sm text-gray-600 mb-3">
                          <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{currentRecipe.cookTime}</span>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <div className="flex items-center gap-1">
                              <button onClick={(e) => { e.stopPropagation(); updateServings(currentRecipe.id, currentServings - 1); }} className="ios-button w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center">
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="mx-2 min-w-[2rem] text-center font-semibold">{currentServings}</span>
                              <button onClick={(e) => { e.stopPropagation(); updateServings(currentRecipe.id, currentServings + 1); }} className="ios-button w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center">
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                            servings
                          </div>
                        </div>
                        <Badge className="bg-orange-100 text-orange-700 mb-4">🥘 Based on Your Leftovers</Badge>
                      </div>

                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-gray-900 font-body">Ingredients</h3>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <ShoppingCart className="w-3 h-3" />
                            <span>Tap to add missing items</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {currentRecipe.ingredients.map((ingredient, index) => {
                            const scaledAmount = scaleIngredientAmount(ingredient.amount, currentRecipe.servings, currentServings);
                            return (
                              <div key={index} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                                <button onClick={(e) => { e.stopPropagation(); const currentlyHasIt = ingredientChecklist[currentRecipe.id]?.[index] || false; handleIngredientToggle(index, !currentlyHasIt); }} className={`ios-button w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${ingredientChecklist[currentRecipe.id]?.[index] ? 'bg-green-500 border-green-500' : 'border-gray-300 bg-white'}`}>
                                  {ingredientChecklist[currentRecipe.id]?.[index] && (<Check className="w-3 h-3 text-white" />)}
                                </button>
                                <div className="flex-1 flex justify-between items-center">
                                  <span className={`font-body ${ingredientChecklist[currentRecipe.id]?.[index] ? 'text-gray-700' : ingredient.category === 'Leftovers' ? 'font-semibold text-orange-700' : 'text-gray-900'}`}>{ingredient.name}</span>
                                  <span className="text-gray-500 text-sm font-body">{scaledAmount}</span>
                                </div>
                                {!ingredientChecklist[currentRecipe.id]?.[index] && (
                                  <button onClick={(e) => { e.stopPropagation(); handleIngredientToggle(index, false); }} className="ios-button p-1 text-blue-600">
                                    <Plus className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="mb-6">
                        <h3 className="font-semibold text-gray-900 mb-3 font-body">Instructions</h3>
                        <div className="space-y-3">
                          {currentRecipe.instructions.map((instruction, index) => (
                            <div key={index} className="flex gap-3">
                              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-xs font-semibold text-blue-600">{index + 1}</span>
                              </div>
                              <p className="text-gray-700 text-sm font-body leading-relaxed">{instruction}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mb-8">
                        <h3 className="font-semibold text-gray-900 mb-3 font-body">Nutrition per serving</h3>
                        <div className="grid grid-cols-2 gap-4">
                          {(() => {
                            const scaledNutrition = scaleNutrition(currentRecipe.nutrition, currentRecipe.servings, currentServings);
                            return (
                              <>
                                <div className="bg-green-50 p-3 rounded-xl text-center">
                                  <div className="text-lg font-semibold text-green-700">{Math.round(scaledNutrition.calories / currentServings)}</div>
                                  <div className="text-xs text-green-600 font-body">calories</div>
                                </div>
                                <div className="bg-blue-50 p-3 rounded-xl text-center">
                                  <div className="text-lg font-semibold text-blue-700">{Math.round(scaledNutrition.protein / currentServings)}g</div>
                                  <div className="text-xs text-blue-600 font-body">protein</div>
                                </div>
                                <div className="bg-orange-50 p-3 rounded-xl text-center">
                                  <div className="text-lg font-semibold text-orange-700">{Math.round(scaledNutrition.carbs / currentServings)}g</div>
                                  <div className="text-xs text-orange-600 font-body">carbs</div>
                                </div>
                                <div className="bg-purple-50 p-3 rounded-xl text-center">
                                  <div className="text-lg font-semibold text-purple-700">{Math.round(scaledNutrition.fat / currentServings)}g</div>
                                  <div className="text-xs text-purple-600 font-body">fat</div>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>

                      {justLiked && (
                        <div className="space-y-3">
                          <button onClick={handleCookNow} className="ios-button w-full py-3 bg-gradient-to-r from-green-500 via-blue-500 to-purple-600 text-white font-semibold flex items-center justify-center gap-2">
                            <ChefHat className="w-5 h-5" />
                            Cook This Recipe
                          </button>

                          {onShareWithFamily && (
                            <button
                              onClick={handleShareWithFamily}
                              className="ios-button w-full py-3 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white font-semibold flex items-center justify-center gap-2"
                            >
                              <Share2 className="w-5 h-5" />
                              Share with Family
                            </button>
                          )}

                          <button onClick={() => { setTimeout(() => { const nextIndex = currentRecipeIndex + 1; if (nextIndex >= leftoverRecipes.length) { setScreenState('main'); } else { setCurrentRecipeIndex(nextIndex); } setIsCardFlipped(false); setJustLiked(false); }, 300); }} className="ios-button w-full py-2 text-gray-600 bg-gray-100 font-medium">Continue Browsing</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 flex justify-center items-center gap-6 p-6 bg-white/80 backdrop-blur-md border-t border-gray-200">
          <button onClick={() => handleSwipe('left')} className="ios-button w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center shadow-lg">
            <X className="w-6 h-6" />
          </button>
          
          <button onClick={handleSkip} className="ios-button w-12 h-12 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center shadow-md">
            <SkipForward className="w-5 h-5" />
          </button>
          
          <button onClick={handleCardFlip} className="ios-button w-10 h-10 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center shadow-sm">
            <RotateCcw className="w-4 h-4" />
          </button>
          
          <button onClick={() => handleSwipe('right')} className="ios-button w-14 h-14 bg-green-100 text-green-600 rounded-full flex items-center justify-center shadow-lg">
            <Heart className="w-6 h-6" />
          </button>
        </div>
      </div>
    );
  }

  // Voice Recommendations with serving adjustments (keeping the existing implementation)
  if (screenState === 'voiceRecommendations') {
    if (currentRecipeIndex >= voiceRecommendationRecipes.length) {
      return (
        <div className="flex flex-col h-full bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
          <div className="flex items-center justify-center p-6 bg-white/80 backdrop-blur-md border-b border-gray-200">
            <div className="text-center">
              <img src={wellnooshIcon} alt="WellNoosh" className="w-10 h-10 object-contain rounded-full wellnoosh-logo mx-auto mb-1" />
              <h2 className="text-sm font-bold brand-title font-brand">Voice Suggestions Complete!</h2>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center space-y-8 max-w-sm">
              <div className="w-32 h-32 mx-auto bg-gradient-to-br from-green-400 via-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl">
                <Mic className="w-16 h-16 text-white" />
              </div>
              <div className="space-y-4">
                <h1 className="text-2xl font-bold text-gray-900 font-body">Great choices, {getUserFirstName()}! 🎤</h1>
                <p className="text-gray-600 leading-relaxed font-body">Those were our quick voice suggestions based on what you told us. Ready to explore more recipes?</p>
              </div>
              <div className="space-y-4">
                <button onClick={() => setScreenState('main')} className="ios-button w-full py-4 text-lg font-bold text-white bg-gradient-to-r from-green-500 via-blue-500 to-purple-600 shadow-lg">Back to Zero-left-chef</button>
                <button onClick={() => { setCurrentRecipeIndex(0); setScreenState('recommendations'); }} className="ios-button w-full py-3 text-blue-600 bg-blue-50 font-medium">See More WellNoosh Recipes</button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full bg-gradient-to-br from-orange-50 via-red-50 to-pink-50">
        <div className="flex items-center justify-center p-6 bg-white/80 backdrop-blur-md border-b border-gray-200 relative">
          <button onClick={() => setScreenState('main')} className="ios-button p-2 text-gray-600 absolute left-6">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-center flex flex-col items-center">
            <img src={wellnooshIcon} alt="WellNoosh" className="w-10 h-10 object-contain rounded-full wellnoosh-logo mx-auto mb-2" />
            <h2 className="text-sm font-bold brand-title font-brand mb-2">Voice Suggestions</h2>
            <div className="flex items-center justify-center gap-3">
              <span className="text-sm font-medium text-gray-600 font-body">{currentRecipeIndex + 1} / {voiceRecommendationRecipes.length}</span>
              <Badge variant="secondary" className="text-xs px-3 py-1 bg-green-100 text-green-700">🎤 Voice Based</Badge>
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-6 relative">
          <div className="w-full max-w-sm h-[600px] relative">
            <div ref={cardRef} className={`recipe-card ${swipeDirection ? `swipe-${swipeDirection}` : ''} ${isCardFlipped ? 'flipped' : ''}`} style={{ transform: isDragging && !justLiked ? `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${dragOffset.x * 0.1}deg)` : undefined }} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onClick={handleCardFlip}>
              <div className="card-face card-front">
                <div className="relative h-full bg-white rounded-3xl shadow-2xl overflow-hidden">
                  <div className="h-2/3 relative">
                    <ImageWithFallback src={currentRecipe.image} alt={currentRecipe.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md rounded-full px-3 py-1 flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="text-sm font-semibold">{currentRecipe.rating}</span>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <h2 className="text-2xl font-bold text-white mb-2 font-body">{currentRecipe.name}</h2>
                      <div className="flex items-center gap-4 text-white/90 text-sm">
                        <div className="flex items-center gap-1"><Clock className="w-4 h-4" />{currentRecipe.cookTime}</div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <div className="flex items-center gap-1">
                            <button onClick={(e) => { e.stopPropagation(); updateServings(currentRecipe.id, currentServings - 1); }} className="ios-button w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="mx-1 min-w-[2rem] text-center">{currentServings}</span>
                            <button onClick={(e) => { e.stopPropagation(); updateServings(currentRecipe.id, currentServings + 1); }} className="ios-button w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          servings
                        </div>
                        <div className="flex items-center gap-1"><ChefHat className="w-4 h-4" />{currentRecipe.difficulty}</div>
                      </div>
                    </div>
                  </div>
                  <div className="h-1/3 p-6 flex flex-col justify-between">
                    <div>
                      <p className="text-gray-600 mb-4 font-body leading-relaxed">{currentRecipe.description}</p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {currentRecipe.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-500 font-body">{!justLiked ? 'Tap card to see recipe • Swipe to choose' : ''}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card-face card-back">
                <div className="h-full bg-white rounded-3xl shadow-2xl overflow-hidden">
                  <div className="h-full overflow-y-auto ios-scroll">
                    <div className="p-6">
                      <div className="text-center mb-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-2 font-body">{currentRecipe.name}</h2>
                        <div className="flex justify-center gap-4 text-sm text-gray-600 mb-3">
                          <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{currentRecipe.cookTime}</span>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <div className="flex items-center gap-1">
                              <button onClick={(e) => { e.stopPropagation(); updateServings(currentRecipe.id, currentServings - 1); }} className="ios-button w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center">
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="mx-2 min-w-[2rem] text-center font-semibold">{currentServings}</span>
                              <button onClick={(e) => { e.stopPropagation(); updateServings(currentRecipe.id, currentServings + 1); }} className="ios-button w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center">
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                            servings
                          </div>
                        </div>
                        <Badge className="bg-green-100 text-green-700 mb-4">🎤 Voice Suggested Recipe</Badge>
                      </div>

                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-gray-900 font-body">Ingredients</h3>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <ShoppingCart className="w-3 h-3" />
                            <span>Tap to add missing items</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {currentRecipe.ingredients.map((ingredient, index) => {
                            const scaledAmount = scaleIngredientAmount(ingredient.amount, currentRecipe.servings, currentServings);
                            return (
                              <div key={index} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                                <button onClick={(e) => { e.stopPropagation(); const currentlyHasIt = ingredientChecklist[currentRecipe.id]?.[index] || false; handleIngredientToggle(index, !currentlyHasIt); }} className={`ios-button w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${ingredientChecklist[currentRecipe.id]?.[index] ? 'bg-green-500 border-green-500' : 'border-gray-300 bg-white'}`}>
                                  {ingredientChecklist[currentRecipe.id]?.[index] && (<Check className="w-3 h-3 text-white" />)}
                                </button>
                                <div className="flex-1 flex justify-between items-center">
                                  <span className={`font-body ${ingredientChecklist[currentRecipe.id]?.[index] ? 'text-gray-700' : ingredient.category === 'Leftovers' ? 'font-semibold text-green-700' : 'text-gray-900'}`}>{ingredient.name}</span>
                                  <span className="text-gray-500 text-sm font-body">{scaledAmount}</span>
                                </div>
                                {!ingredientChecklist[currentRecipe.id]?.[index] && (
                                  <button onClick={(e) => { e.stopPropagation(); handleIngredientToggle(index, false); }} className="ios-button p-1 text-blue-600">
                                    <Plus className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="mb-6">
                        <h3 className="font-semibold text-gray-900 mb-3 font-body">Instructions</h3>
                        <div className="space-y-3">
                          {currentRecipe.instructions.map((instruction, index) => (
                            <div key={index} className="flex gap-3">
                              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-xs font-semibold text-blue-600">{index + 1}</span>
                              </div>
                              <p className="text-gray-700 text-sm font-body leading-relaxed">{instruction}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mb-8">
                        <h3 className="font-semibold text-gray-900 mb-3 font-body">Nutrition per serving</h3>
                        <div className="grid grid-cols-2 gap-4">
                          {(() => {
                            const scaledNutrition = scaleNutrition(currentRecipe.nutrition, currentRecipe.servings, currentServings);
                            return (
                              <>
                                <div className="bg-green-50 p-3 rounded-xl text-center">
                                  <div className="text-lg font-semibold text-green-700">{Math.round(scaledNutrition.calories / currentServings)}</div>
                                  <div className="text-xs text-green-600 font-body">calories</div>
                                </div>
                                <div className="bg-blue-50 p-3 rounded-xl text-center">
                                  <div className="text-lg font-semibold text-blue-700">{Math.round(scaledNutrition.protein / currentServings)}g</div>
                                  <div className="text-xs text-blue-600 font-body">protein</div>
                                </div>
                                <div className="bg-orange-50 p-3 rounded-xl text-center">
                                  <div className="text-lg font-semibold text-orange-700">{Math.round(scaledNutrition.carbs / currentServings)}g</div>
                                  <div className="text-xs text-orange-600 font-body">carbs</div>
                                </div>
                                <div className="bg-purple-50 p-3 rounded-xl text-center">
                                  <div className="text-lg font-semibold text-purple-700">{Math.round(scaledNutrition.fat / currentServings)}g</div>
                                  <div className="text-xs text-purple-600 font-body">fat</div>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>

                      {justLiked && (
                        <div className="space-y-3">
                          <button onClick={handleCookNow} className="ios-button w-full py-3 bg-gradient-to-r from-green-500 via-blue-500 to-purple-600 text-white font-semibold flex items-center justify-center gap-2">
                            <ChefHat className="w-5 h-5" />
                            Cook This Recipe
                          </button>

                          {onShareWithFamily && (
                            <button
                              onClick={handleShareWithFamily}
                              className="ios-button w-full py-3 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white font-semibold flex items-center justify-center gap-2"
                            >
                              <Share2 className="w-5 h-5" />
                              Share with Family
                            </button>
                          )}

                          <button onClick={() => { setTimeout(() => { const nextIndex = currentRecipeIndex + 1; if (nextIndex >= voiceRecommendationRecipes.length) { setScreenState('main'); } else { setCurrentRecipeIndex(nextIndex); } setIsCardFlipped(false); setJustLiked(false); }, 300); }} className="ios-button w-full py-2 text-gray-600 bg-gray-100 font-medium">Continue Browsing</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 flex justify-center items-center gap-6 p-6 bg-white/80 backdrop-blur-md border-t border-gray-200">
          <button onClick={() => handleSwipe('left')} className="ios-button w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center shadow-lg">
            <X className="w-6 h-6" />
          </button>
          
          <button onClick={handleSkip} className="ios-button w-12 h-12 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center shadow-md">
            <SkipForward className="w-5 h-5" />
          </button>
          
          <button onClick={handleCardFlip} className="ios-button w-10 h-10 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center shadow-sm">
            <RotateCcw className="w-4 h-4" />
          </button>
          
          <button onClick={() => handleSwipe('right')} className="ios-button w-14 h-14 bg-green-100 text-green-600 rounded-full flex items-center justify-center shadow-lg">
            <Heart className="w-6 h-6" />
          </button>
        </div>
      </div>
    );
  }

  return null;
}