import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Heart, X, ChefHat, Clock, Users, Star, Crown, ShoppingCart, BookmarkPlus, RotateCcw, Check, Plus, Minus, Share2 } from 'lucide-react';
import { Button } from './ui/button';
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

export function MealRecommendations({ onComplete, onSkip, userData, onUpdateUserData, onShareWithFamily }: MealRecommendationsProps) {
  const [currentRecipeIndex, setCurrentRecipeIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [likedRecipes, setLikedRecipes] = useState<string[]>([]);
  const [selectedForCooking, setSelectedForCooking] = useState<string[]>([]);
  const [favoriteRecipes, setFavoriteRecipes] = useState<string[]>(userData?.favoriteRecipes || []);
  const [justLiked, setJustLiked] = useState(false);
  const [ingredientChecklist, setIngredientChecklist] = useState<{[recipeId: string]: {[ingredientIndex: number]: boolean}}>({});
  const [recipeServings, setRecipeServings] = useState<{[recipeId: string]: number}>({});
  
  const cardRef = useRef<HTMLDivElement>(null);
  const startPos = useRef({ x: 0, y: 0 });

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

  // Limited recipe data - Maximum 3 recipes as requested
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
      localStorage.setItem('wellnoosh_user_data', JSON.stringify(updatedUserData));
      
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
    localStorage.setItem('wellnoosh_user_data', JSON.stringify(updatedUserData));

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
    alert('Upgrade to Premium for unlimited recipe recommendations!');
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (justLiked) return; // Disable dragging when card is in liked state
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
    
    // Determine swipe direction based on drag distance
    if (Math.abs(dragOffset.x) > 100) {
      if (dragOffset.x > 0) {
        handleSwipe('right');
      } else {
        handleSwipe('left');
      }
    }
    
    setDragOffset({ x: 0, y: 0 });
  };

  if (showUpgradePrompt) {
    return (
      <div className="flex flex-col h-full bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
        {/* Centered Header */}
        <div className="flex items-center justify-center p-6 bg-white/80 backdrop-blur-md border-b border-gray-200 relative">
          <button
            onClick={() => setShowUpgradePrompt(false)}
            className="ios-button p-2 text-gray-600 absolute left-6"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <img src={wellnooshIcon} alt="WellNoosh" className="w-10 h-10 object-contain rounded-full wellnoosh-logo mx-auto mb-1" />
            <h2 className="text-sm font-bold brand-title font-brand">WellNoosh</h2>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center space-y-8 max-w-sm">
            <div className="w-32 h-32 mx-auto bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center shadow-2xl">
              <Crown className="w-16 h-16 text-white" />
            </div>
            
            <div className="space-y-4">
              <h1 className="text-2xl font-bold text-gray-900 font-body">
                Upgrade to Premium
              </h1>
              <p className="text-gray-600 leading-relaxed font-body">
                You've used your 5 free daily recommendations! Upgrade to Premium for unlimited meal discovery.
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-gradient-to-r from-purple-50 to-pink-100 p-4 rounded-2xl">
                <h3 className="font-semibold text-purple-800 mb-2 font-body">Premium Benefits</h3>
                <ul className="text-sm text-purple-700 space-y-1 font-body">
                  <li>✨ Unlimited meal recommendations</li>
                  <li>🍽️ Advanced dietary filters</li>
                  <li>📱 Exclusive recipes & content</li>
                  <li>🛒 Smart shopping lists</li>
                  <li>📊 Detailed nutrition tracking</li>
                </ul>
              </div>

              <button
                onClick={handleUpgrade}
                className="ios-button w-full py-4 text-lg font-bold text-white bg-gradient-to-r from-purple-500 to-pink-600 shadow-lg"
              >
                Upgrade Now - $9.99/month
              </button>

              <button
                onClick={handleComplete}
                className="ios-button w-full py-3 text-gray-600 bg-gray-100 font-medium"
              >
                Continue with Free Plan
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentRecipeIndex >= recipes.length) {
    return (
      <div className="flex flex-col h-full bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
        {/* Centered Header */}
        <div className="flex items-center justify-center p-6 bg-white/80 backdrop-blur-md border-b border-gray-200">
          <div className="text-center">
            <img src={wellnooshIcon} alt="WellNoosh" className="w-10 h-10 object-contain rounded-full wellnoosh-logo mx-auto mb-1" />
            <h2 className="text-sm font-bold brand-title font-brand">WellNoosh</h2>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center space-y-8 max-w-sm">
            <div className="w-32 h-32 mx-auto bg-gradient-to-br from-green-400 via-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl">
              <ChefHat className="w-16 h-16 text-white" />
            </div>
            
            <div className="space-y-4">
              <h1 className="text-2xl font-bold text-gray-900 font-body">
                Great Choices, {getUserFirstName()}!
              </h1>
              <p className="text-gray-600 leading-relaxed font-body">
                You've discovered {likedRecipes.length} amazing recipes. Ready to start cooking with WellNoosh?
              </p>
              
              {likedRecipes.length > 0 && (
                <div className="bg-gradient-to-r from-green-50 to-blue-100 p-4 rounded-2xl">
                  <h3 className="font-semibold text-green-800 mb-2 font-body">Your Liked Recipes</h3>
                  <p className="text-sm text-green-700 font-body">
                    {likedRecipes.length} recipes saved to your profile
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={handleComplete}
              className="ios-button w-full py-4 text-lg font-bold text-white bg-gradient-to-r from-green-500 via-blue-500 to-purple-600 shadow-lg"
            >
              Start Cooking with WellNoosh
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-orange-50 via-red-50 to-pink-50">
      {/* Centered Header with WellNoosh Icon and Recipe Counter */}
      <div className="flex items-center justify-center p-6 bg-white/80 backdrop-blur-md border-b border-gray-200 relative">
        <button
          onClick={onSkip}
          className="ios-button p-2 text-gray-600 absolute left-6"
        >
          <X className="w-5 h-5" />
        </button>
        
        <button
          onClick={handleComplete}
          className="ios-button px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-full absolute right-6"
        >
          Skip
        </button>
        
        <div className="text-center flex flex-col items-center">
          <img src={wellnooshIcon} alt="WellNoosh" className="w-10 h-10 object-contain rounded-full wellnoosh-logo mx-auto mb-1" />
          <h2 className="text-sm font-bold brand-title font-brand">WellNoosh</h2>
          
          {/* Perfectly Centered Recipe Counter */}
          <div className="mt-2 text-center">
            <span className="text-sm font-medium text-gray-600 font-body">
              {currentRecipeIndex + 1} / {recipes.length}
            </span>
          </div>
          
          {/* Badges Row - Separate from counter for perfect alignment */}
          <div className="flex items-center justify-center gap-3 mt-1">
            {userData?.subscriptionTier === 'free' && (
              <Badge variant="secondary" className="text-xs px-3 py-1">
                {remainingSwipes} left today
              </Badge>
            )}
            {userData?.subscriptionTier === 'premium' && (
              <div className="flex items-center gap-1">
                <Crown className="w-4 h-4 text-yellow-500" />
                <span className="text-xs font-medium text-yellow-600">Premium</span>
              </div>
            )}
          </div>
        </div>
        
        {userData?.subscriptionTier === 'free' && remainingSwipes <= 2 && (
          <button
            onClick={() => setShowUpgradePrompt(true)}
            className="ios-button p-2 text-purple-600 absolute right-6"
          >
            <Crown className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Card Stack Area */}
      <div className="flex-1 flex items-center justify-center p-6 relative">
        <div className="w-full max-w-sm h-[600px] relative">
          {/* Recipe Card */}
          <div
            ref={cardRef}
            className={`recipe-card ${swipeDirection ? `swipe-${swipeDirection}` : ''} ${isCardFlipped ? 'flipped' : ''}`}
            style={{
              transform: isDragging && !justLiked
                ? `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${dragOffset.x * 0.1}deg)`
                : undefined
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={handleCardFlip}
          >
            {/* Front of Card */}
            <div className="card-face card-front">
              <div className="relative h-full bg-white rounded-3xl shadow-2xl overflow-hidden">
                <div className="h-2/3 relative">
                  <ImageWithFallback
                    src={currentRecipe.image}
                    alt={currentRecipe.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  
                  {/* Rating Badge */}
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md rounded-full px-3 py-1 flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="text-sm font-semibold">{currentRecipe.rating}</span>
                  </div>

                  <div className="absolute bottom-4 left-4 right-4">
                    <h2 className="text-2xl font-bold text-white mb-2 font-body">
                      {currentRecipe.name}
                    </h2>
                    <div className="flex items-center gap-4 text-white/90 text-sm">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {currentRecipe.cookTime}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateServings(currentRecipe.id, currentServings - 1);
                            }}
                            className="ios-button w-5 h-5 bg-white/20 rounded-full flex items-center justify-center"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="mx-1 min-w-[2rem] text-center">{currentServings}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateServings(currentRecipe.id, currentServings + 1);
                            }}
                            className="ios-button w-5 h-5 bg-white/20 rounded-full flex items-center justify-center"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        servings
                      </div>
                      <div className="flex items-center gap-1">
                        <ChefHat className="w-4 h-4" />
                        {currentRecipe.difficulty}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="h-1/3 p-6 flex flex-col justify-between">
                  <div>
                    <p className="text-gray-600 mb-4 font-body leading-relaxed">
                      {currentRecipe.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {currentRecipe.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm text-gray-500 font-body">
                      {!justLiked ? 'Tap card to see ingredients • Swipe to choose' : ''}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Back of Card */}
            <div className="card-face card-back">
              <div className="h-full bg-white rounded-3xl shadow-2xl overflow-hidden">
                <div className="h-full overflow-y-auto ios-scroll">
                  <div className="p-6">
                    <div className="text-center mb-6">
                      <h2 className="text-xl font-bold text-gray-900 mb-2 font-body">
                        {currentRecipe.name}
                      </h2>
                      <div className="flex justify-center gap-4 text-sm text-gray-600 mb-3">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {currentRecipe.cookTime}
                        </span>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateServings(currentRecipe.id, currentServings - 1);
                              }}
                              className="ios-button w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="mx-2 min-w-[2rem] text-center font-semibold">{currentServings}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateServings(currentRecipe.id, currentServings + 1);
                              }}
                              className="ios-button w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          servings
                        </div>
                      </div>
                    </div>

                    {/* Ingredients with Checkboxes */}
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
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const currentlyHasIt = ingredientChecklist[currentRecipe.id]?.[index] || false;
                                  handleIngredientToggle(index, !currentlyHasIt);
                                }}
                                className={`ios-button w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                                  ingredientChecklist[currentRecipe.id]?.[index] 
                                    ? 'bg-green-500 border-green-500' 
                                    : 'border-gray-300 bg-white'
                                }`}
                              >
                                {ingredientChecklist[currentRecipe.id]?.[index] && (
                                  <Check className="w-3 h-3 text-white" />
                                )}
                              </button>
                              
                              <div className="flex-1 flex justify-between items-center">
                                <span className={`font-body ${
                                  ingredientChecklist[currentRecipe.id]?.[index] 
                                    ? 'text-gray-700' 
                                    : 'text-gray-900'
                                }`}>
                                  {ingredient.name}
                                </span>
                                <span className="text-gray-500 text-sm font-body">{scaledAmount}</span>
                              </div>

                              {!ingredientChecklist[currentRecipe.id]?.[index] && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleIngredientToggle(index, false);
                                  }}
                                  className="ios-button p-1 text-blue-600"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Instructions */}
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

                    {/* Nutrition */}
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

                    {/* Action Buttons - Only show if user just liked the recipe */}
                    {justLiked && (
                      <div className="space-y-3">
                        <button
                          onClick={handleAddToFavorites}
                          className="ios-button w-full py-3 bg-pink-100 text-pink-700 font-semibold flex items-center justify-center gap-2"
                        >
                          <BookmarkPlus className="w-5 h-5" />
                          Add to Favorites
                        </button>
                        
                        <button
                          onClick={handleCookNow}
                          className="ios-button w-full py-3 bg-gradient-to-r from-green-500 via-blue-500 to-purple-600 text-white font-semibold flex items-center justify-center gap-2"
                        >
                          <ChefHat className="w-5 h-5" />
                          Cook This Now
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
                        
                        <button
                          onClick={handleNextRecipe}
                          className="ios-button w-full py-2 text-gray-600 bg-gray-100 font-medium"
                        >
                          Continue Browsing
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex-shrink-0 flex justify-center items-center gap-8 p-6 bg-white/80 backdrop-blur-md border-t border-gray-200">
        <button
          onClick={() => handleSwipe('left')}
          disabled={isFreeTierLimitReached}
          className="ios-button w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <X className="w-8 h-8" />
        </button>
        
        <button
          onClick={handleCardFlip}
          className="ios-button w-12 h-12 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center shadow-md"
        >
          <RotateCcw className="w-6 h-6" />
        </button>
        
        <button
          onClick={() => handleSwipe('right')}
          disabled={isFreeTierLimitReached}
          className="ios-button w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Heart className="w-8 h-8" />
        </button>
      </div>
    </div>
  );
}