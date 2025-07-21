// User Types
export interface User {
  id: string;
  email: string;
  fullName: string;
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
  cookedRecipes?: CookedRecipe[];
  leftovers?: string[];
  groceryList?: GroceryItem[];
  waterIntake?: WaterIntake;
  breathingExercises?: BreathingExercises;
  createdAt: string;
  updatedAt: string;
}

// Recipe Types
export interface Recipe {
  id: string;
  name: string;
  image: string;
  cookTime: string;
  servings: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  rating: number;
  tags: string[];
  description: string;
  ingredients: Ingredient[];
  instructions: string[];
  nutrition: Nutrition;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Ingredient {
  name: string;
  amount: string;
  category: string;
}

export interface Nutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
}

// Health Tracking Types
export interface HealthMetrics {
  id: string;
  userId: string;
  date: string;
  weight?: number;
  mood?: number;
  sleepHours?: number;
  energyLevel?: 'Low' | 'Medium' | 'High';
  stressLevel?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WaterIntake {
  id: string;
  userId: string;
  date: string;
  amount: number;
  goal: number;
  unit: string;
  glasses: boolean[]; // Frontend compatibility
  dailyGoal: number; // Frontend compatibility
  createdAt: string;
  updatedAt: string;
}

export interface BreathingExercises {
  id: string;
  userId: string;
  date: string;
  sessions: number;
  totalMinutes: number;
  goal: number;
  exercises: boolean[]; // Frontend compatibility
  dailyGoal: number; // Frontend compatibility
  createdAt: string;
  updatedAt: string;
}

// Meal Planning Types
export interface MealPlan {
  id: string;
  userId: string;
  date: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  recipeId?: string;
  recipe?: Recipe;
  plannedTime?: string;
  completed: boolean;
  rating?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Cooked Recipe Types
export interface CookedRecipe {
  id: string;
  name: string;
  image: string;
  cookedDate: string;
  rating?: number;
  notes?: string;
  modifications?: string;
}

// Grocery List Types
export interface GroceryItem {
  id: string;
  name: string;
  amount: string;
  category: string;
  addedDate: string;
  fromRecipe?: string;
  completed?: boolean;
  price?: number;
  store?: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Authentication Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  fullName: string;
  country: string;
  city: string;
  postalCode: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

// Nutrition Analysis Types
export interface NutritionAnalysis {
  totalCalories: number;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
  };
  vitamins: Record<string, number>;
  minerals: Record<string, number>;
  recommendations: string[];
}

// MoodFood Types
export interface MoodFoodRequest {
  mood: number;
  energyLevel: 'Low' | 'Medium' | 'High';
  stressLevel: number;
  preferences?: string[];
  dietaryRestrictions?: string[];
}

export interface MoodFoodRecommendation {
  recipes: Recipe[];
  reasoning: string;
  moodBoostTips: string[];
  nutritionalBenefits: string[];
}