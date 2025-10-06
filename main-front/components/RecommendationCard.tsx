import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  ScrollView,
  Animated,
} from 'react-native';
import { PanGestureHandler, State as GestureState } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';

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

interface RecommendationCardProps {
  recipe: Recipe;
  onReject?: () => void;
  onLike?: () => void;
  onRefresh?: () => void;
  onCookNow?: () => void;
  onShareFamily?: () => void;
  onSaveToFavorite?: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const CARD_WIDTH = screenWidth * 0.95;
const CARD_HEIGHT = screenHeight * 0.8;

export function RecommendationCard({
  recipe,
  onReject,
  onLike,
  onRefresh,
  onCookNow,
  onShareFamily,
  onSaveToFavorite
}: RecommendationCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [ingredientChecklist, setIngredientChecklist] = useState<{[index: number]: boolean}>({});
  const [currentServings, setCurrentServings] = useState(recipe.servings);

  // Animation refs for swipe gestures
  const translateX = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  const handleCardFlip = () => {
    console.log('Card flipped to:', !isFlipped ? 'back' : 'front');
    setIsFlipped(!isFlipped);
  };

  // Helper function to scale ingredient amounts
  const scaleIngredientAmount = (originalAmount: string): string => {
    const scaleFactor = currentServings / recipe.servings;
    
    // Extract numbers from the amount string
    const match = originalAmount.match(/^(\d+(?:\.\d+)?(?:\/\d+)?)\s*(.*)$/);
    
    if (!match) {
      return originalAmount; // Return original if can't parse
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
  const getScaledNutrition = () => {
    const scaleFactor = currentServings / recipe.servings;
    return {
      calories: Math.round(recipe.nutrition.calories * scaleFactor / currentServings),
      protein: Math.round(recipe.nutrition.protein * scaleFactor / currentServings),
      carbs: Math.round(recipe.nutrition.carbs * scaleFactor / currentServings),
      fat: Math.round(recipe.nutrition.fat * scaleFactor / currentServings)
    };
  };

  // Serving adjustment functions
  const increaseServings = () => {
    if (currentServings < 20) {
      setCurrentServings(prev => prev + 1);
    }
  };

  const decreaseServings = () => {
    if (currentServings > 1) {
      setCurrentServings(prev => prev - 1);
    }
  };

  // Swipe gesture handlers
  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: true }
  );

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === GestureState.END) {
      const { translationX, velocityX } = event.nativeEvent;
      
      const swipeThreshold = screenWidth * 0.25;
      const velocityThreshold = 500;
      
      if (translationX > swipeThreshold || velocityX > velocityThreshold) {
        // Swipe right - Like
        Animated.timing(translateX, {
          toValue: screenWidth,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          onLike?.();
          // Reset position for next card
          translateX.setValue(0);
          rotate.setValue(0);
        });
      } else if (translationX < -swipeThreshold || velocityX < -velocityThreshold) {
        // Swipe left - Reject
        Animated.timing(translateX, {
          toValue: -screenWidth,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          onReject?.();
          // Reset position for next card
          translateX.setValue(0);
          rotate.setValue(0);
        });
      } else {
        // Snap back to center
        Animated.parallel([
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }),
          Animated.spring(rotate, { toValue: 0, useNativeDriver: true }),
        ]).start();
      }
    } else if (event.nativeEvent.state === GestureState.ACTIVE) {
      // Update rotation based on horizontal movement
      const rotation = event.nativeEvent.translationX / screenWidth * 0.1;
      rotate.setValue(rotation);
    }
  };

  const handleIngredientToggle = (index: number) => {
    setIngredientChecklist(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const renderFrontSide = () => (
    <TouchableOpacity
      style={styles.cardContent}
      onPress={handleCardFlip}
      activeOpacity={0.95}
    >
      <View style={styles.imageContainer}>
        <Image source={{ uri: recipe.image }} style={styles.recipeImage} />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.imageOverlay}
        />
        
        {/* Rating Badge */}
        <View style={styles.ratingBadge}>
          <Text style={styles.ratingText}>⭐ {recipe.rating}</Text>
        </View>

        {/* Recipe Info Overlay */}
        <View style={styles.recipeInfoOverlay}>
          <Text style={styles.recipeName}>{recipe.name}</Text>
          
          <View style={styles.recipeStats}>
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>⏱</Text>
              <Text style={styles.statText}>{recipe.cookTime}</Text>
            </View>
            <View style={styles.statDivider}>
              <Text style={styles.statText}>•</Text>
            </View>
            <View style={[styles.statItem, { flexDirection: 'row', alignItems: 'center', gap: 2 }]}>
              <TouchableOpacity onPress={decreaseServings} style={styles.servingButtonFront}>
                <Text style={styles.servingButtonTextFront}>−</Text>
              </TouchableOpacity>
              <Text style={styles.statText}>{currentServings}</Text>
              <TouchableOpacity onPress={increaseServings} style={styles.servingButtonFront}>
                <Text style={styles.servingButtonTextFront}>+</Text>
              </TouchableOpacity>
              <Text style={styles.statText}>servings</Text>
            </View>
            <View style={styles.statDivider}>
              <Text style={styles.statText}>•</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statText}>{recipe.difficulty}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.cardBottom}>
        <Text style={styles.recipeDescription}>{recipe.description}</Text>
        
        <View style={styles.tagContainer}>
          {recipe.tags.slice(0, 3).map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
        
        <Text style={styles.flipHint}>Tap card to see ingredients • Swipe to choose</Text>
      </View>
    </TouchableOpacity>
  );

  const renderBackSide = () => (
    <TouchableOpacity
      style={styles.cardContent}
      onPress={handleCardFlip}
      activeOpacity={0.95}
    >
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.backHeader}>
          <Text style={styles.backTitle}>{recipe.name}</Text>
          <View style={styles.backStats}>
            <View style={styles.backStatItem}>
              <Text style={styles.backStatIcon}>⏱</Text>
              <Text style={styles.backStatText}>{recipe.cookTime}</Text>
            </View>
            <View style={styles.backStatItem}>
              <Text style={styles.backStatIcon}>👥</Text>
              <Text style={styles.backStatDivider}>—</Text>
              <TouchableOpacity onPress={decreaseServings} style={styles.servingButton}>
                <Text style={styles.servingButtonText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.backStatText}>{currentServings}</Text>
              <TouchableOpacity onPress={increaseServings} style={styles.servingButton}>
                <Text style={styles.servingButtonText}>+</Text>
              </TouchableOpacity>
              <Text style={styles.backStatDivider}>+</Text>
              <Text style={styles.backStatText}>servings</Text>
            </View>
          </View>
        </View>

        <View style={styles.ingredientsSection}>
          <View style={styles.ingredientsHeader}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            <Text style={styles.ingredientsSubtitle}>🛒 Tap to add missing items</Text>
          </View>
          
          {recipe.ingredients.map((ingredient, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.ingredientItem}
              onPress={() => handleIngredientToggle(index)}
            >
              <View style={[
                styles.ingredientCheckbox,
                ingredientChecklist[index] && styles.ingredientCheckboxChecked
              ]}>
                {ingredientChecklist[index] && (
                  <Text style={styles.checkMark}>✓</Text>
                )}
              </View>
              <View style={styles.ingredientInfo}>
                <Text style={[
                  styles.ingredientName,
                  ingredientChecklist[index] && styles.ingredientNameChecked
                ]}>
                  {ingredient.name}
                </Text>
                <Text style={styles.ingredientAmount}>{scaleIngredientAmount(ingredient.amount)}</Text>
              </View>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => handleIngredientToggle(index)}
              >
                <Text style={styles.addButtonText}>+</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.instructionsSection}>
          <Text style={styles.sectionTitle}>Instructions</Text>
          {recipe.instructions.map((instruction, index) => (
            <View key={index} style={styles.instructionItem}>
              <View style={styles.instructionNumber}>
                <Text style={styles.instructionNumberText}>{index + 1}</Text>
              </View>
              <Text style={styles.instructionText}>{instruction}</Text>
            </View>
          ))}
        </View>

        <View style={styles.nutritionSection}>
          <Text style={styles.sectionTitle}>Nutrition per serving</Text>
          <View style={styles.nutritionGrid}>
            <View style={[styles.nutritionItem, { backgroundColor: '#dcfce7' }]}>
              <Text style={styles.nutritionValue}>{getScaledNutrition().calories}</Text>
              <Text style={styles.nutritionLabel}>calories</Text>
            </View>
            <View style={[styles.nutritionItem, { backgroundColor: '#dbeafe' }]}>
              <Text style={styles.nutritionValue}>{getScaledNutrition().protein}g</Text>
              <Text style={styles.nutritionLabel}>protein</Text>
            </View>
            <View style={[styles.nutritionItem, { backgroundColor: '#fed7aa' }]}>
              <Text style={styles.nutritionValue}>{getScaledNutrition().carbs}g</Text>
              <Text style={styles.nutritionLabel}>carbs</Text>
            </View>
            <View style={[styles.nutritionItem, { backgroundColor: '#f3e8ff' }]}>
              <Text style={styles.nutritionValue}>{getScaledNutrition().fat}g</Text>
              <Text style={styles.nutritionLabel}>fat</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons Section - Always shown on back */}
        <View style={styles.likedActionsSection}>
          <Text style={styles.likedActionsTitle}>Quick Actions</Text>
          <View style={styles.likedActionsButtons}>
            <TouchableOpacity
              style={styles.cookNowButton}
              onPress={() => {
                onCookNow?.();
                setIsFlipped(false);
              }}
            >
              <Text style={styles.cookNowIcon}>🍳</Text>
              <Text style={styles.cookNowText}>Cook This Now</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shareFamilyButton}
              onPress={() => {
                onShareFamily?.();
                setIsFlipped(false);
              }}
            >
              <Text style={styles.shareFamilyIcon}>👥</Text>
              <Text style={styles.shareFamilyText}>Share with Family</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveToFavoriteButton}
              onPress={() => {
                onSaveToFavorite?.();
                setIsFlipped(false);
              }}
            >
              <Text style={styles.saveToFavoriteIcon}>⭐</Text>
              <Text style={styles.saveToFavoriteText}>Save to Favorite</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Add some bottom padding */}
        <View style={{ height: 120 }} />
      </ScrollView>
    </TouchableOpacity>
  );

  const rotateInterpolate = rotate.interpolate({
    inputRange: [-0.1, 0, 0.1],
    outputRange: ['-6deg', '0deg', '6deg'],
  });

  return (
    <View style={styles.container}>
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
        enabled={!isFlipped} // Only allow swiping on front side
      >
        <Animated.View
          style={[
            styles.card,
            {
              transform: [
                { translateX },
                { rotate: rotateInterpolate },
              ],
            },
          ]}
        >
          {isFlipped ? renderBackSide() : renderFrontSide()}
        </Animated.View>
      </PanGestureHandler>
      
      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.rejectButton]} 
          onPress={onReject}
        >
          <Text style={styles.rejectIcon}>✕</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.refreshButton]} 
          onPress={onRefresh}
        >
          <Text style={styles.refreshIcon}>↻</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.likeButton]}
          onPress={onLike}
        >
          <Text style={styles.likeIcon}>💚</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 60,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    marginHorizontal: (screenWidth - CARD_WIDTH) / 2,
    borderRadius: 20,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  cardContent: {
    flex: 1,
  },
  
  // Front Side Styles
  imageContainer: {
    flex: 3,
    position: 'relative',
  },
  recipeImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
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
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  recipeInfoOverlay: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  recipeName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  recipeStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statDivider: {
    paddingHorizontal: 4,
  },
  statIcon: {
    fontSize: 16,
    color: 'white',
  },
  statText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '500',
  },
  cardBottom: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  recipeDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
    marginBottom: 16,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  flipHint: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  
  // Back Side Styles
  scrollContent: {
    flex: 1,
  },
  backHeader: {
    padding: 24,
    paddingBottom: 16,
  },
  backTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  backStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  backStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backStatIcon: {
    fontSize: 16,
    color: '#666',
  },
  backStatText: {
    fontSize: 16,
    color: '#666',
  },
  backStatDivider: {
    fontSize: 16,
    color: '#666',
    paddingHorizontal: 4,
  },
  
  // Ingredients Section
  ingredientsSection: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  ingredientsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  ingredientsSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  ingredientCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ddd',
    backgroundColor: 'white',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ingredientCheckboxChecked: {
    borderColor: '#4CAF50',
    backgroundColor: '#4CAF50',
  },
  checkMark: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  ingredientInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ingredientName: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  ingredientNameChecked: {
    color: '#999',
    textDecorationLine: 'line-through',
  },
  ingredientAmount: {
    fontSize: 14,
    color: '#666',
    fontWeight: '400',
  },
  addButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e3f2fd',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  addButtonText: {
    fontSize: 18,
    color: '#1976d2',
    fontWeight: 'bold',
  },
  
  // Instructions Section
  instructionsSection: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  instructionItem: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  instructionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2196f3',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  instructionNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  instructionText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  
  // Nutrition Section
  nutritionSection: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  nutritionItem: {
    width: '47%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  nutritionLabel: {
    fontSize: 12,
    color: '#666',
  },
  
  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 60,
    backgroundColor: 'white',
  },
  actionButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rejectButton: {
    backgroundColor: '#ffebee',
  },
  rejectIcon: {
    fontSize: 28,
    color: '#f44336',
    fontWeight: 'bold',
  },
  refreshButton: {
    backgroundColor: '#f5f5f5',
  },
  refreshIcon: {
    fontSize: 28,
    color: '#666',
    fontWeight: 'bold',
  },
  likeButton: {
    backgroundColor: '#e8f5e8',
  },
  likeIcon: {
    fontSize: 28,
  },
  
  // Serving Button Styles
  servingButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
  },
  servingButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  
  // Front Card Serving Button Styles
  servingButtonFront: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 3,
  },
  servingButtonTextFront: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    lineHeight: 14,
  },

  // Liked Actions Section
  likedActionsSection: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#f8f9fa',
    marginHorizontal: 24,
    marginTop: 16,
    borderRadius: 16,
  },
  likedActionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  likedActionsButtons: {
    flexDirection: 'column',
    gap: 12,
  },
  cookNowButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  cookNowIcon: {
    fontSize: 24,
  },
  cookNowText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  shareFamilyButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  shareFamilyIcon: {
    fontSize: 24,
  },
  shareFamilyText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  saveToFavoriteButton: {
    backgroundColor: '#FF9800',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  saveToFavoriteIcon: {
    fontSize: 24,
  },
  saveToFavoriteText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});