/**
 * TypeScript interfaces for the scalable food logging system
 * Corresponds to the database tables in 20250201_scalable_food_logging_system.sql
 */

// ================================================================================================
// CORE ENUMS AND CONSTANTS
// ================================================================================================

export type FoodEntryType = 'planned_meal' | 'additional_food'

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'brunch' | 'other'

export type FoodCategory = 
  | 'protein' 
  | 'vegetables' 
  | 'fruits' 
  | 'grains' 
  | 'dairy' 
  | 'fats' 
  | 'beverages' 
  | 'snacks' 
  | 'desserts' 
  | 'fast-food'

export type PreparationMethod = 
  | 'raw' 
  | 'grilled' 
  | 'baked' 
  | 'fried' 
  | 'boiled' 
  | 'steamed' 
  | 'roasted' 
  | 'sauteed' 
  | 'other'

// ================================================================================================
// FOOD LOGGING INTERFACES
// ================================================================================================

/**
 * Main food log entry (maps to user_food_logs table)
 * Represents both planned meals and additional food entries
 */
export interface FoodLogEntry {
  id: number
  user_id: string
  log_date: string // ISO date string (YYYY-MM-DD)
  
  // Entry classification
  entry_type: FoodEntryType
  meal_type: MealType
  food_name: string
  
  // Optional references to recipes/meal plans
  meal_plan_recipe_id?: string
  recipe_id?: string
  
  // Nutritional information (required)
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number
  sugar_g: number
  sodium_mg: number
  
  // Serving and completion tracking
  is_completed: boolean
  completed_at?: string // ISO datetime string
  planned_serving_size: number
  actual_serving_size?: number
  
  // Additional metadata
  food_category?: FoodCategory
  preparation_method?: PreparationMethod
  brand_name?: string
  barcode?: string
  
  // User content
  notes?: string
  photo_url?: string
  confidence_score: number // 1.0 = manual, <1.0 = AI recognized
  
  // Timestamps
  logged_at: string // ISO datetime string
  created_at: string // ISO datetime string
}

/**
 * Input interface for creating new food log entries
 */
export interface CreateFoodLogEntry {
  entry_type: FoodEntryType
  meal_type: MealType
  food_name: string
  
  // Optional references
  meal_plan_recipe_id?: string
  recipe_id?: string
  
  // Nutritional data
  calories: number
  protein_g?: number
  carbs_g?: number
  fat_g?: number
  fiber_g?: number
  sugar_g?: number
  sodium_mg?: number
  
  // Serving size
  planned_serving_size?: number
  actual_serving_size?: number
  
  // Metadata
  food_category?: FoodCategory
  preparation_method?: PreparationMethod
  brand_name?: string
  barcode?: string
  notes?: string
  photo_url?: string
  confidence_score?: number
}

/**
 * Interface for updating existing food log entries
 */
export interface UpdateFoodLogEntry {
  food_name?: string
  calories?: number
  protein_g?: number
  carbs_g?: number
  fat_g?: number
  fiber_g?: number
  sugar_g?: number
  sodium_mg?: number
  is_completed?: boolean
  actual_serving_size?: number
  food_category?: FoodCategory
  preparation_method?: PreparationMethod
  brand_name?: string
  notes?: string
  photo_url?: string
}

// ================================================================================================
// DAILY NUTRITION SUMMARY INTERFACES
// ================================================================================================

/**
 * Daily nutrition summary (maps to daily_nutrition_summary table)
 * Pre-calculated totals for fast dashboard queries
 */
export interface DailyNutritionSummary {
  user_id: string
  log_date: string // ISO date string (YYYY-MM-DD)
  
  // Planned meal totals
  planned_calories: number
  planned_protein_g: number
  planned_carbs_g: number
  planned_fat_g: number
  planned_fiber_g: number
  planned_sugar_g: number
  planned_sodium_mg: number
  planned_meals_count: number
  completed_meals_count: number
  
  // Additional food totals
  additional_calories: number
  additional_protein_g: number
  additional_carbs_g: number
  additional_fat_g: number
  additional_fiber_g: number
  additional_sugar_g: number
  additional_sodium_mg: number
  additional_entries_count: number
  
  // Daily totals (computed)
  total_calories: number
  total_protein_g: number
  total_carbs_g: number
  total_fat_g: number
  total_fiber_g: number
  total_sugar_g: number
  total_sodium_mg: number
  total_entries_count: number
  
  // Progress and goals
  completion_percentage: number
  calorie_goal?: number
  calorie_deficit_surplus?: number
  
  // Meal timing
  first_meal_time?: string // HH:MM format
  last_meal_time?: string // HH:MM format
  eating_window_hours?: number
  
  // Quality metrics
  whole_foods_percentage: number
  meal_plan_adherence_percentage: number
  
  // Timestamps
  created_at: string
  updated_at: string
}

/**
 * Simplified daily summary for dashboard display
 */
export interface DailySummaryDashboard {
  log_date: string
  total_calories: number
  calorie_goal: number
  completion_percentage: number
  planned_meals_count: number
  completed_meals_count: number
  additional_entries_count: number
  
  // Key nutrients for progress wheels
  total_protein_g: number
  total_carbs_g: number
  total_fat_g: number
  total_fiber_g: number
}

// ================================================================================================
// FOOD CATEGORIES INTERFACE
// ================================================================================================

/**
 * Food category lookup (maps to food_categories table)
 */
export interface FoodCategoryData {
  id: number
  name: string
  description?: string
  color_hex?: string // For UI display
  icon_name?: string // For UI icons
  is_whole_food: boolean
  created_at: string
}

// ================================================================================================
// DASHBOARD AND UI INTERFACES
// ================================================================================================

/**
 * Complete daily food log data for dashboard
 * Combines summary with detailed entries
 */
export interface DailyFoodLog {
  summary: DailyNutritionSummary
  planned_meals: FoodLogEntry[]
  additional_food: FoodLogEntry[]
}

/**
 * Meal card data for dashboard display
 */
export interface MealCardData {
  id: string // Can be food log entry ID or generated
  time: string // Display time (e.g., "8:00 AM")
  title: string // Meal name
  icon: string // Emoji or icon identifier
  completed: boolean
  calories?: number
  meal_type: MealType
  food_log_entry?: FoodLogEntry // Optional reference to actual log entry
}

/**
 * Nutrition wheel data for dashboard
 */
export interface NutritionWheelData {
  calories: { completed: number; goal: number; unit: string }
  protein: { completed: number; goal: number; unit: string }
  carbs: { completed: number; goal: number; unit: string }
  fat: { completed: number; goal: number; unit: string }
  fiber: { completed: number; goal: number; unit: string }
  sugar: { completed: number; goal: number; unit: string }
  sodium: { completed: number; goal: number; unit: string }
  water: { completed: number; goal: number; unit: string }
}

// ================================================================================================
// API AND SERVICE INTERFACES
// ================================================================================================

/**
 * Parameters for querying food logs
 */
export interface FoodLogQueryParams {
  user_id?: string
  start_date?: string // ISO date string
  end_date?: string // ISO date string
  entry_type?: FoodEntryType
  meal_type?: MealType
  food_category?: FoodCategory
  is_completed?: boolean
  limit?: number
  offset?: number
}

/**
 * Response from food log queries
 */
export interface FoodLogQueryResponse {
  data: FoodLogEntry[]
  total_count: number
  has_more: boolean
}

/**
 * Parameters for creating daily meal plan entries
 */
export interface CreateDailyMealPlan {
  user_id: string
  date: string // ISO date string
  meal_plan_recipes: {
    meal_plan_recipe_id: string
    meal_type: MealType
    scheduled_time?: string // HH:MM format
  }[]
}

/**
 * Quick add food interface (simplified for mobile)
 */
export interface QuickAddFood {
  food_name: string
  meal_type: MealType
  calories: number
  serving_description?: string // e.g., "1 cup", "1 medium apple"
  photo_url?: string
}

// ================================================================================================
// ANALYTICS AND REPORTING INTERFACES
// ================================================================================================

/**
 * Weekly nutrition trends
 */
export interface WeeklyNutritionTrends {
  week_start_date: string
  daily_summaries: DailySummaryDashboard[]
  weekly_averages: {
    avg_calories: number
    avg_protein_g: number
    avg_completion_percentage: number
    avg_meal_plan_adherence: number
  }
  trends: {
    calorie_trend: 'increasing' | 'decreasing' | 'stable'
    completion_trend: 'improving' | 'declining' | 'stable'
  }
}

/**
 * Food frequency analysis
 */
export interface FoodFrequencyAnalysis {
  time_period: string // e.g., "last_30_days"
  most_logged_foods: {
    food_name: string
    frequency: number
    total_calories: number
    category: FoodCategory
  }[]
  favorite_meal_types: {
    meal_type: MealType
    frequency: number
    avg_calories: number
  }[]
  completion_patterns: {
    day_of_week: string
    avg_completion_percentage: number
  }[]
}

// ================================================================================================
// ERROR AND VALIDATION INTERFACES
// ================================================================================================

/**
 * Food logging validation errors
 */
export interface FoodLogValidationError {
  field: string
  message: string
  code: string
}

/**
 * Service response wrapper
 */
export interface FoodLogServiceResponse<T> {
  success: boolean
  data?: T
  error?: string
  validation_errors?: FoodLogValidationError[]
}

// ================================================================================================
// EXPORT ALL TYPES
// ================================================================================================

export type {
  // Core types
  FoodEntryType,
  MealType,
  FoodCategory,
  PreparationMethod,
  
  // Main interfaces
  FoodLogEntry,
  CreateFoodLogEntry,
  UpdateFoodLogEntry,
  DailyNutritionSummary,
  DailySummaryDashboard,
  FoodCategoryData,
  DailyFoodLog,
  MealCardData,
  NutritionWheelData,
  
  // Query and API
  FoodLogQueryParams,
  FoodLogQueryResponse,
  CreateDailyMealPlan,
  QuickAddFood,
  
  // Analytics
  WeeklyNutritionTrends,
  FoodFrequencyAnalysis,
  
  // Error handling
  FoodLogValidationError,
  FoodLogServiceResponse,
}