import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Dimensions,
  Animated,
  Image,
  Alert,
} from 'react-native';
import { PanGestureHandler, State as GestureState } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  groceryList?: GroceryItem[];
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
}

interface MealRecommendationsProps {
  onComplete: (userData: UserData) => void;
  onSkip: () => void;
  userData: UserData | null;
  onUpdateUserData: (userData: UserData) => void;
  onShareWithFamily?: (recipe: Recipe) => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const CARD_WIDTH = screenWidth * 0.9;
const CARD_HEIGHT = screenHeight * 0.65;

export function MealRecommendations({ 
  onComplete, 
  onSkip, 
  userData, 
  onUpdateUserData, 
  onShareWithFamily 
}: MealRecommendationsProps) {
  const [currentRecipeIndex, setCurrentRecipeIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [likedRecipes, setLikedRecipes] = useState<string[]>([]);
  const [selectedForCooking, setSelectedForCooking] = useState<string[]>([]);
  const [favoriteRecipes, setFavoriteRecipes] = useState<string[]>(userData?.favoriteRecipes || []);
  const [justLiked, setJustLiked] = useState(false);
  const [ingredientChecklist, setIngredientChecklist] = useState<{[recipeId: string]: {[ingredientIndex: number]: boolean}}>({});
  const [recipeServings, setRecipeServings] = useState<{[recipeId: string]: number}>({});

  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  const getUserFirstName = () => {
    if (!userData?.fullName) return '';
    return userData.fullName.split(' ')[0];
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

  // Limited recipe data - Maximum 3 recipes
  const recipes: Recipe[] = [
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
    }
  ];

  const currentRecipe = recipes[currentRecipeIndex];
  const currentServings = getCurrentServings(currentRecipe?.id, currentRecipe?.servings);
  const remainingSwipes = Math.max(0, 5 - (userData?.dailySwipesUsed || 0));
  const isFreeTierLimitReached = userData?.subscriptionTier === 'free' && remainingSwipes <= 0;

  useEffect(() => {
    if (currentRecipeIndex >= recipes.length) {
      // All recipes viewed, complete the flow
      handleComplete();
    }
  }, [currentRecipeIndex]);

  const handleComplete = () => {
    const updatedUserData: UserData = {
      ...userData!,
      favoriteRecipes,
      selectedRecipes: selectedForCooking
    };
    onComplete(updatedUserData);
  };

  const handleIngredientToggle = (ingredientIndex: number, hasIngredient: boolean) => {
    const recipeId = currentRecipe.id;
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
      AsyncStorage.setItem('wellnoosh_user_data', JSON.stringify(updatedUserData));
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
      AsyncStorage.setItem('wellnoosh_user_data', JSON.stringify(updatedUserData));
    }
  };

  const handleSwipe = (direction: 'left' | 'right') => {
    if (userData?.subscriptionTier === 'free' && (userData?.dailySwipesUsed || 0) >= 5) {
      setShowUpgradePrompt(true);
      return;
    }

    if (direction === 'right') {
      // User liked this recipe - automatically flip the card to show ingredients
      setLikedRecipes(prev => [...prev, currentRecipe.id]);
      setJustLiked(true);
      setIsCardFlipped(true);
      
      // Update user's daily swipes
      const updatedUserData: UserData = {
        ...userData!,
        dailySwipesUsed: (userData?.dailySwipesUsed || 0) + 1
      };
      
      // In a real app, this would update the backend
      AsyncStorage.setItem('wellnoosh_user_data', JSON.stringify(updatedUserData));
      
      // Don't proceed to next recipe yet - let user choose actions
      return;
    }

    // For left swipe, proceed normally
    setSwipeDirection(direction);
    
    // Update user's daily swipes
    const updatedUserData: UserData = {
      ...userData!,
      dailySwipesUsed: (userData?.dailySwipesUsed || 0) + 1
    };
    
    // In a real app, this would update the backend
    AsyncStorage.setItem('wellnoosh_user_data', JSON.stringify(updatedUserData));

    setTimeout(() => {
      setSwipeDirection(null);
      setCurrentRecipeIndex(prev => prev + 1);
      setIsCardFlipped(false);
      setJustLiked(false);
    }, 300);
  };

  const handleCardFlip = () => {
    if (!justLiked) {
      setIsCardFlipped(!isCardFlipped);
    }
  };

  const handleAddToFavorites = () => {
    if (!favoriteRecipes.includes(currentRecipe.id)) {
      setFavoriteRecipes(prev => [...prev, currentRecipe.id]);
    }
  };

  const handleCookNow = () => {
    if (!selectedForCooking.includes(currentRecipe.id)) {
      setSelectedForCooking(prev => [...prev, currentRecipe.id]);
    }
    
    // Proceed to next recipe after selecting an action
    setTimeout(() => {
      setCurrentRecipeIndex(prev => prev + 1);
      setIsCardFlipped(false);
      setJustLiked(false);
    }, 500);
  };

  const handleNextRecipe = () => {
    // User chose to skip action - proceed to next recipe
    setTimeout(() => {
      setCurrentRecipeIndex(prev => prev + 1);
      setIsCardFlipped(false);
      setJustLiked(false);
    }, 300);
  };

  const handleShareWithFamily = () => {
    if (onShareWithFamily) {
      onShareWithFamily(currentRecipe);
    }
  };

  const handleUpgrade = () => {
    // In a real app, this would open payment flow
    Alert.alert('Upgrade to Premium', 'Upgrade to Premium for unlimited recipe recommendations!');
  };

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX, translationY: translateY } }],
    { useNativeDriver: true }
  );

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === GestureState.END) {
      const { translationX, velocityX } = event.nativeEvent;
      
      const swipeThreshold = screenWidth * 0.3;
      const velocityThreshold = 500;
      
      if (Math.abs(translationX) > swipeThreshold || Math.abs(velocityX) > velocityThreshold) {
        handleSwipe(translationX > 0 ? 'right' : 'left');
      } else {
        // Snap back to center
        Animated.parallel([
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }),
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
          Animated.spring(rotate, { toValue: 0, useNativeDriver: true }),
        ]).start();
      }
    } else if (event.nativeEvent.state === GestureState.ACTIVE) {
      // Update rotation based on horizontal movement
      const rotation = event.nativeEvent.translationX / screenWidth;
      rotate.setValue(rotation);
    }
  };

  if (showUpgradePrompt) {
    return (
      <LinearGradient colors={['#faf5ff', '#f3e8ff', '#e9d5ff']} style={styles.container}>
        <View style={styles.upgradeContainer}>
          <TouchableOpacity onPress={() => setShowUpgradePrompt(false)} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>

          <View style={styles.upgradeContent}>
            <View style={styles.upgradeIcon}>
              <Text style={styles.upgradeIconText}>👑</Text>
            </View>
            
            <Text style={styles.upgradeTitle}>Upgrade to Premium</Text>
            <Text style={styles.upgradeSubtitle}>
              You've used your 5 free daily recommendations! Upgrade to Premium for unlimited meal discovery.
            </Text>

            <View style={styles.benefitsContainer}>
              <Text style={styles.benefitsTitle}>Premium Benefits</Text>
              <Text style={styles.benefitItem}>✨ Unlimited meal recommendations</Text>
              <Text style={styles.benefitItem}>🍽️ Advanced dietary filters</Text>
              <Text style={styles.benefitItem}>📱 Exclusive recipes & content</Text>
              <Text style={styles.benefitItem}>🛒 Smart shopping lists</Text>
              <Text style={styles.benefitItem}>📊 Detailed nutrition tracking</Text>
            </View>

            <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgrade}>
              <Text style={styles.upgradeButtonText}>Upgrade Now - $9.99/month</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.continueButton} onPress={handleComplete}>
              <Text style={styles.continueButtonText}>Continue with Free Plan</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    );
  }

  if (currentRecipeIndex >= recipes.length) {
    return (
      <LinearGradient colors={['#f0fdf4', '#dcfce7', '#bbf7d0']} style={styles.container}>
        <View style={styles.completionContainer}>
          <View style={styles.completionIcon}>
            <Text style={styles.completionIconText}>👨‍🍳</Text>
          </View>
          
          <Text style={styles.completionTitle}>
            Great Choices, {getUserFirstName()}!
          </Text>
          <Text style={styles.completionSubtitle}>
            You've discovered {likedRecipes.length} amazing recipes. Ready to start cooking with WellNoosh?
          </Text>
          
          {likedRecipes.length > 0 && (
            <View style={styles.likedRecipesContainer}>
              <Text style={styles.likedRecipesTitle}>Your Liked Recipes</Text>
              <Text style={styles.likedRecipesText}>
                {likedRecipes.length} recipes saved to your profile
              </Text>
            </View>
          )}

          <TouchableOpacity style={styles.startCookingButton} onPress={handleComplete}>
            <Text style={styles.startCookingButtonText}>Start Cooking with WellNoosh</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  const rotateInterpolate = rotate.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-30deg', '0deg', '30deg'],
  });

  return (
    <LinearGradient colors={['#fff7ed', '#fed7aa', '#fb923c']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {/* Placeholder for left side */}
        </View>
        
        <View style={styles.headerCenter}>
          <Image source={require('../assets/logoNew.jpg')} style={styles.logo} />
          <Text style={styles.headerTitle}>WellNoosh</Text>
          
          {/* Recipe Counter */}
          <View style={styles.counterContainer}>
            <Text style={styles.counterText}>
              {currentRecipeIndex + 1} / {recipes.length}
            </Text>
          </View>
          
          {/* Badges */}
          <View style={styles.badgesContainer}>
            {userData?.subscriptionTier === 'premium' && (
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumText}>👑 Premium</Text>
              </View>
            )}
          </View>
        </View>
        
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={handleComplete} style={styles.headerSkipButton}>
            <Text style={styles.headerSkipButtonText}>Skip</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Card Area */}
      <View style={styles.cardArea}>
        <PanGestureHandler
          onGestureEvent={onGestureEvent}
          onHandlerStateChange={onHandlerStateChange}
          enabled={!justLiked && !isCardFlipped}
        >
          <Animated.View
            style={[
              styles.card,
              {
                transform: [
                  { translateX },
                  { translateY },
                  { rotate: rotateInterpolate },
                ],
              },
            ]}
          >
              {!isCardFlipped ? (
                // Front of Card
                <TouchableOpacity
                  style={styles.cardContent}
                  onPress={handleCardFlip}
                  activeOpacity={0.9}
                >
                  <View style={styles.cardFront}>
                  <View style={styles.imageContainer}>
                    <Image source={{ uri: currentRecipe.image }} style={styles.recipeImage} />
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.6)']}
                      style={styles.imageOverlay}
                    />
                    
                    {/* Rating Badge */}
                    <View style={styles.ratingBadge}>
                      <Text style={styles.ratingText}>⭐ {currentRecipe.rating}</Text>
                    </View>

                    <View style={styles.cardInfo}>
                      <Text style={styles.recipeName}>{currentRecipe.name}</Text>
                      <View style={styles.recipeStats}>
                        <View style={styles.statItem}>
                          <Text style={styles.statText}>⏱ {currentRecipe.cookTime}</Text>
                        </View>
                        <View style={styles.statItem}>
                          <Text style={styles.statText}>👥</Text>
                          <TouchableOpacity onPress={() => updateServings(currentRecipe.id, currentServings - 1)}>
                            <Text style={styles.servingButton}>−</Text>
                          </TouchableOpacity>
                          <Text style={styles.servingText}>{currentServings}</Text>
                          <TouchableOpacity onPress={() => updateServings(currentRecipe.id, currentServings + 1)}>
                            <Text style={styles.servingButton}>+</Text>
                          </TouchableOpacity>
                          <Text style={styles.statText}>servings</Text>
                        </View>
                        <View style={styles.statItem}>
                          <Text style={styles.statText}>👨‍🍳 {currentRecipe.difficulty}</Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  <View style={styles.cardBottom}>
                    <Text style={styles.recipeDescription}>{currentRecipe.description}</Text>
                    
                    <View style={styles.tags}>
                      {currentRecipe.tags.slice(0, 3).map((tag, index) => (
                        <View key={index} style={styles.tag}>
                          <Text style={styles.tagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                    
                    <Text style={styles.instructions}>
                      Tap card to see ingredients • Swipe to choose
                    </Text>
                  </View>
                  </View>
                </TouchableOpacity>
              ) : (
                // Back of Card
                <View style={styles.cardBack}>
                  {/* Back to Front Button */}
                  <TouchableOpacity style={styles.backFlipButton} onPress={handleCardFlip}>
                    <Text style={styles.backFlipButtonText}>← Back to Photo</Text>
                  </TouchableOpacity>
                  
                  <ScrollView 
                    style={styles.cardBackScroll}
                    contentContainerStyle={styles.cardBackScrollContent}
                    showsVerticalScrollIndicator={true}
                    bounces={true}
                    scrollEventThrottle={16}
                    nestedScrollEnabled={true}
                  >
                    <View style={styles.cardBackContent}>
                      <Text style={styles.backTitle}>{currentRecipe.name}</Text>
                    <View style={styles.backStats}>
                      <Text style={styles.backStatText}>⏱ {currentRecipe.cookTime}</Text>
                      <View style={styles.backServingControl}>
                        <Text style={styles.backStatText}>👥</Text>
                        <TouchableOpacity onPress={() => updateServings(currentRecipe.id, currentServings - 1)}>
                          <Text style={styles.servingControlButton}>−</Text>
                        </TouchableOpacity>
                        <Text style={styles.servingControlText}>{currentServings}</Text>
                        <TouchableOpacity onPress={() => updateServings(currentRecipe.id, currentServings + 1)}>
                          <Text style={styles.servingControlButton}>+</Text>
                        </TouchableOpacity>
                        <Text style={styles.backStatText}>servings</Text>
                      </View>
                    </View>

                    {/* Ingredients with Checkboxes */}
                    <View style={styles.ingredientsSection}>
                      <View style={styles.ingredientsHeader}>
                        <Text style={styles.sectionTitle}>Ingredients</Text>
                        <Text style={styles.ingredientsHelp}>🛒 Tap to add missing items</Text>
                      </View>
                      {currentRecipe.ingredients.map((ingredient, index) => {
                        const scaledAmount = scaleIngredientAmount(ingredient.amount, currentRecipe.servings, currentServings);
                        return (
                          <View key={index} style={styles.ingredientItem}>
                            <TouchableOpacity
                              onPress={() => {
                                const currentlyHasIt = ingredientChecklist[currentRecipe.id]?.[index] || false;
                                handleIngredientToggle(index, !currentlyHasIt);
                              }}
                              style={[
                                styles.ingredientCheckbox,
                                ingredientChecklist[currentRecipe.id]?.[index] && styles.ingredientCheckboxChecked
                              ]}
                            >
                              {ingredientChecklist[currentRecipe.id]?.[index] && (
                                <Text style={styles.checkMark}>✓</Text>
                              )}
                            </TouchableOpacity>
                            
                            <View style={styles.ingredientInfo}>
                              <Text style={[
                                styles.ingredientName,
                                ingredientChecklist[currentRecipe.id]?.[index] && styles.ingredientNameChecked
                              ]}>
                                {ingredient.name}
                              </Text>
                              <Text style={styles.ingredientAmount}>{scaledAmount}</Text>
                            </View>

                            {!ingredientChecklist[currentRecipe.id]?.[index] && (
                              <TouchableOpacity
                                onPress={() => handleIngredientToggle(index, false)}
                                style={styles.addButton}
                              >
                                <Text style={styles.addButtonText}>+</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        );
                      })}
                    </View>

                    {/* Message for non-liked recipes */}
                    {!justLiked && (
                      <View style={styles.likePromptSection}>
                        <Text style={styles.likePromptText}>💖 Like this recipe to see cooking instructions and more options!</Text>
                      </View>
                    )}

                    {/* Instructions - Only show for liked recipes */}
                    {justLiked && (
                      <View style={styles.instructionsSection}>
                        <Text style={styles.sectionTitle}>Instructions</Text>
                        {currentRecipe.instructions.map((instruction, index) => (
                          <View key={index} style={styles.instructionItem}>
                            <View style={styles.instructionNumber}>
                              <Text style={styles.instructionNumberText}>{index + 1}</Text>
                            </View>
                            <Text style={styles.instructionText}>{instruction}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Nutrition - Only show for liked recipes */}
                    {justLiked && (
                      <View style={styles.nutritionSection}>
                        <Text style={styles.sectionTitle}>Nutrition per serving</Text>
                        <View style={styles.nutritionGrid}>
                          {(() => {
                            const scaledNutrition = scaleNutrition(currentRecipe.nutrition, currentRecipe.servings, currentServings);
                            return (
                              <>
                                <View style={[styles.nutritionItem, styles.nutritionCalories]}>
                                  <Text style={styles.nutritionValue}>{Math.round(scaledNutrition.calories / currentServings)}</Text>
                                  <Text style={styles.nutritionLabel}>calories</Text>
                                </View>
                                <View style={[styles.nutritionItem, styles.nutritionProtein]}>
                                  <Text style={styles.nutritionValue}>{Math.round(scaledNutrition.protein / currentServings)}g</Text>
                                  <Text style={styles.nutritionLabel}>protein</Text>
                                </View>
                                <View style={[styles.nutritionItem, styles.nutritionCarbs]}>
                                  <Text style={styles.nutritionValue}>{Math.round(scaledNutrition.carbs / currentServings)}g</Text>
                                  <Text style={styles.nutritionLabel}>carbs</Text>
                                </View>
                                <View style={[styles.nutritionItem, styles.nutritionFat]}>
                                  <Text style={styles.nutritionValue}>{Math.round(scaledNutrition.fat / currentServings)}g</Text>
                                  <Text style={styles.nutritionLabel}>fat</Text>
                                </View>
                              </>
                            );
                          })()}
                        </View>
                      </View>
                    )}

                    {/* Action Buttons - Only show if user just liked the recipe */}
                    {justLiked && (
                      <View style={styles.actionButtons}>
                        <TouchableOpacity style={styles.favoriteButton} onPress={handleAddToFavorites}>
                          <Text style={styles.actionButtonIcon}>❤️</Text>
                          <Text style={styles.favoriteButtonText}>Add to Favorites</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity style={styles.cookButton} onPress={handleCookNow}>
                          <Text style={styles.actionButtonIcon}>👨‍🍳</Text>
                          <Text style={styles.actionButtonText}>Cook This Now</Text>
                        </TouchableOpacity>

                        {onShareWithFamily && (
                          <TouchableOpacity style={styles.shareButton} onPress={handleShareWithFamily}>
                            <Text style={styles.actionButtonIcon}>📤</Text>
                            <Text style={styles.actionButtonText}>Share with Family</Text>
                          </TouchableOpacity>
                        )}
                        
                        <TouchableOpacity style={styles.continueButton} onPress={handleNextRecipe}>
                          <Text style={styles.continueButtonText}>Continue Browsing</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    </View>
                  </ScrollView>
                </View>
              )}
          </Animated.View>
        </PanGestureHandler>
      </View>

      {/* Action Buttons */}
      <View style={styles.bottomActions}>
        <TouchableOpacity 
          style={[styles.actionCircle, styles.rejectButton]} 
          onPress={() => handleSwipe('left')}
          disabled={isFreeTierLimitReached}
        >
          <Text style={styles.actionButtonIcon}>✕</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.flipButton} 
          onPress={handleCardFlip}
        >
          <Text style={styles.flipButtonIcon}>🔄</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionCircle, styles.likeButton]} 
          onPress={() => handleSwipe('right')}
          disabled={isFreeTierLimitReached}
        >
          <Text style={styles.actionButtonIcon}>💖</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  headerCenter: {
    flex: 2,
    alignItems: 'center',
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  headerButton: {
    padding: 8,
  },
  headerButtonText: {
    fontSize: 20,
    color: '#6b7280',
  },
  headerSkipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#eff6ff',
    borderRadius: 20,
  },
  headerSkipButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2563eb',
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  counterContainer: {
    marginBottom: 4,
  },
  counterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  badgesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  badge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    color: '#6b7280',
  },
  premiumBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  premiumText: {
    fontSize: 12,
    color: '#d97706',
    fontWeight: '500',
  },
  upgradeIconButton: {
    padding: 8,
  },
  upgradeIconButtonText: {
    fontSize: 20,
  },
  cardArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 24,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  cardContent: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
  },
  cardFront: {
    flex: 1,
  },
  imageContainer: {
    flex: 2,
    position: 'relative',
  },
  recipeImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  ratingBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
  },
  cardInfo: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  recipeName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  recipeStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  servingButton: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: 'bold',
    paddingHorizontal: 8,
  },
  servingText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
    minWidth: 20,
    textAlign: 'center',
  },
  cardBottom: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  recipeDescription: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 16,
    lineHeight: 24,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tag: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    color: '#6b7280',
  },
  instructions: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  cardBack: {
    flex: 1,
  },
  backFlipButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  backFlipButtonText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  cardBackScroll: {
    flex: 1,
  },
  cardBackScrollContent: {
    flexGrow: 1,
  },
  cardBackContent: {
    padding: 24,
    paddingTop: 56, // Account for back button
    minHeight: CARD_HEIGHT - 48, // Ensure minimum height for scrolling
  },
  backTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  backStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  backStatText: {
    fontSize: 14,
    color: '#6b7280',
  },
  backServingControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  servingControlButton: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: 'bold',
    paddingHorizontal: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    textAlign: 'center',
    minWidth: 24,
  },
  servingControlText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
    minWidth: 24,
    textAlign: 'center',
  },
  ingredientsSection: {
    marginBottom: 24,
  },
  likePromptSection: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  likePromptText: {
    fontSize: 14,
    color: '#92400e',
    textAlign: 'center',
    fontWeight: '500',
  },
  ingredientsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  ingredientsHelp: {
    fontSize: 12,
    color: '#6b7280',
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  ingredientCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#d1d5db',
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  ingredientCheckboxChecked: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  checkMark: {
    fontSize: 12,
    color: 'white',
    fontWeight: 'bold',
  },
  ingredientInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ingredientName: {
    fontSize: 14,
    color: '#111827',
  },
  ingredientNameChecked: {
    color: '#6b7280',
  },
  ingredientAmount: {
    fontSize: 14,
    color: '#6b7280',
  },
  addButton: {
    marginLeft: 8,
    padding: 4,
  },
  addButtonText: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: 'bold',
  },
  instructionsSection: {
    marginBottom: 24,
  },
  instructionItem: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  instructionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  instructionNumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563eb',
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  nutritionSection: {
    marginBottom: 32,
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  nutritionItem: {
    width: '45%',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  nutritionCalories: {
    backgroundColor: '#dcfce7',
  },
  nutritionProtein: {
    backgroundColor: '#dbeafe',
  },
  nutritionCarbs: {
    backgroundColor: '#fed7aa',
  },
  nutritionFat: {
    backgroundColor: '#f3e8ff',
  },
  nutritionValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  nutritionLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  actionButtons: {
    gap: 12,
  },
  favoriteButton: {
    backgroundColor: '#fecaca',
    borderWidth: 2,
    borderColor: '#ef4444',
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  favoriteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc2626',
  },
  cookButton: {
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  shareButton: {
    backgroundColor: '#a855f7',
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionButtonIcon: {
    fontSize: 20,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  continueButton: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
  },
  bottomActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 32,
    paddingVertical: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  actionCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  rejectButton: {
    backgroundColor: '#fecaca',
  },
  likeButton: {
    backgroundColor: '#bbf7d0',
  },
  flipButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  flipButtonIcon: {
    fontSize: 24,
  },
  upgradeContainer: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 24,
    zIndex: 1,
    padding: 8,
  },
  backButtonText: {
    fontSize: 24,
    color: '#6b7280',
  },
  upgradeContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  upgradeIcon: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: '#a855f7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  upgradeIconText: {
    fontSize: 64,
  },
  upgradeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  upgradeSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  benefitsContainer: {
    backgroundColor: '#f3e8ff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 32,
    width: '100%',
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7c3aed',
    marginBottom: 12,
  },
  benefitItem: {
    fontSize: 14,
    color: '#7c3aed',
    marginBottom: 4,
  },
  upgradeButton: {
    backgroundColor: '#a855f7',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  upgradeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  completionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  completionIcon: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  completionIconText: {
    fontSize: 64,
  },
  completionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  completionSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  likedRecipesContainer: {
    backgroundColor: '#dcfce7',
    padding: 16,
    borderRadius: 16,
    marginBottom: 32,
    width: '100%',
  },
  likedRecipesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#16a34a',
    marginBottom: 8,
  },
  likedRecipesText: {
    fontSize: 14,
    color: '#16a34a',
  },
  startCookingButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  startCookingButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
});