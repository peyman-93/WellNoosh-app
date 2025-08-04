// Meal Plan TypeScript Interfaces
// Defines the structure for meal planning system

export interface UserMealPlan {
  id: string
  user_id: string
  plan_date: string // ISO date string (YYYY-MM-DD)
  plan_name: string
  
  // Plan metadata
  generation_method: 'mock' | 'ai' | 'manual' | 'template'
  plan_status: 'draft' | 'active' | 'completed' | 'archived'
  
  // Nutritional targets
  target_calories?: number
  target_protein_g?: number
  target_carbs_g?: number
  target_fat_g?: number
  target_fiber_g?: number
  
  // Plan configuration
  meals_per_day: number
  include_snacks: boolean
  dietary_preferences?: string[] // JSON array
  excluded_ingredients?: string[] // JSON array
  
  // Plan totals (calculated from planned_meals)
  total_planned_calories: number
  total_planned_protein_g: number
  total_planned_carbs_g: number
  total_planned_fat_g: number
  total_meals_count: number
  
  // Metadata
  notes?: string
  created_at: string // ISO timestamp
  updated_at: string // ISO timestamp
}

export interface PlannedMeal {
  id: string
  meal_plan_id: string
  user_id: string
  plan_date: string // ISO date string (YYYY-MM-DD)
  
  // Meal details
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'brunch' | 'other'
  meal_order: number // Order within meal type (e.g., snack 1, snack 2)
  scheduled_time?: string // HH:MM format
  
  // Food details
  food_name: string
  recipe_id?: string // Optional reference to recipes table
  serving_size: number
  serving_unit: string
  
  // Nutritional data
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number
  sugar_g?: number
  sodium_mg?: number
  
  // Meal attributes
  food_category?: string
  preparation_method?: string
  cooking_time_minutes?: number
  difficulty_level?: 'easy' | 'medium' | 'hard'
  
  // Planning metadata
  substitutable: boolean
  priority_level: number // 1=lowest, 5=highest
  tags?: string[] // JSON array
  
  // Completion tracking
  is_completed: boolean
  completed_at?: string // ISO timestamp
  food_log_entry_id?: string // Reference to user_food_logs
  
  // Metadata
  notes?: string
  created_at: string
  updated_at: string
}

// Client-side interfaces for easier use

export interface MealPlanWithMeals {
  mealPlan: UserMealPlan
  plannedMeals: PlannedMeal[]
  completionSummary?: MealPlanCompletionSummary
}

export interface MealPlanCompletionSummary {
  total_meals: number
  completed_meals: number
  completion_percentage: number
  total_planned_calories: number
  completed_calories: number
}

export interface CreateMealPlanRequest {
  plan_date: string // YYYY-MM-DD
  plan_name?: string
  target_calories?: number
  target_protein_g?: number
  target_carbs_g?: number
  target_fat_g?: number
  meals_per_day?: number
  include_snacks?: boolean
  dietary_preferences?: string[]
  excluded_ingredients?: string[]
  notes?: string
}

export interface CreatePlannedMealRequest {
  meal_plan_id: string
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'brunch' | 'other'
  meal_order?: number
  scheduled_time?: string
  food_name: string
  recipe_id?: string
  serving_size?: number
  serving_unit?: string
  calories: number
  protein_g?: number
  carbs_g?: number
  fat_g?: number
  fiber_g?: number
  sugar_g?: number
  sodium_mg?: number
  food_category?: string
  preparation_method?: string
  cooking_time_minutes?: number
  difficulty_level?: 'easy' | 'medium' | 'hard'
  substitutable?: boolean
  priority_level?: number
  tags?: string[]
  notes?: string
}

export interface UpdatePlannedMealRequest {
  meal_id: string
  updates: Partial<Omit<PlannedMeal, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
}

export interface CompleteMealRequest {
  meal_id: string
  actual_serving_size?: number
  actual_calories?: number
  completion_notes?: string
}

// Dashboard display interfaces

export interface DashboardMealPlan {
  date: string
  mealPlan: UserMealPlan
  meals: DashboardMeal[]
  completionStats: {
    totalMeals: number
    completedMeals: number
    percentage: number
    caloriesCompleted: number
    caloriesRemaining: number
  }
}

export interface DashboardMeal {
  id: string
  mealType: string
  mealOrder: number
  scheduledTime?: string
  foodName: string
  calories: number
  isCompleted: boolean
  canComplete: boolean // Can user mark this as completed?
  tags?: string[]
  difficultyLevel?: string
  cookingTimeMinutes?: number
}

// Meal plan generation interfaces

export interface MealPlanGenerationOptions {
  user_id: string
  plan_date: Date
  target_calories?: number
  dietary_restrictions?: string[]
  excluded_ingredients?: string[]
  meals_per_day?: number
  include_snacks?: boolean
  cooking_skill_level?: 'beginner' | 'intermediate' | 'advanced'
  cooking_time_preference?: 'quick' | 'medium' | 'elaborate'
  variety_preference?: 'low' | 'medium' | 'high'
}

export interface GeneratedMeal {
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  mealOrder: number
  scheduledTime?: string
  foodName: string
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number
  servingSize: number
  servingUnit: string
  category: string
  preparationMethod: string
  cookingTimeMinutes: number
  difficultyLevel: 'easy' | 'medium' | 'hard'
  tags: string[]
  recipe_id?: string
  nutritionConfidence?: number // 0-1, how confident we are in nutrition data
}

export interface GeneratedMealPlan {
  planId: string
  planDate: Date
  totalCalories: number
  totalProtein: number
  totalCarbs: number
  totalFat: number
  meals: GeneratedMeal[]
  generationMetadata?: {
    algorithm: string
    version: string
    processingTime: number
    confidence: number
  }
}

// Error types for meal planning

export interface MealPlanError {
  code: string
  message: string
  details?: any
}

export type MealPlanErrorCode = 
  | 'MEAL_PLAN_NOT_FOUND'
  | 'PLANNED_MEAL_NOT_FOUND'
  | 'MEAL_ALREADY_COMPLETED'
  | 'MEAL_CANNOT_BE_COMPLETED'
  | 'INVALID_MEAL_PLAN_DATE'
  | 'INVALID_NUTRITIONAL_DATA'
  | 'GENERATION_FAILED'
  | 'DATABASE_ERROR'
  | 'PERMISSION_DENIED'

// Utility types

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'brunch' | 'other'
export type MealPlanStatus = 'draft' | 'active' | 'completed' | 'archived'
export type GenerationMethod = 'mock' | 'ai' | 'manual' | 'template'
export type DifficultyLevel = 'easy' | 'medium' | 'hard'

// Database response types (for Supabase queries)

export interface MealPlanQueryResult {
  meal_plan: UserMealPlan
  planned_meals: PlannedMeal[]
  completion_summary?: MealPlanCompletionSummary
}

export interface MealPlanListItem {
  id: string
  plan_date: string
  plan_name: string
  plan_status: MealPlanStatus
  total_planned_calories: number
  total_meals_count: number
  completed_meals_count: number
  completion_percentage: number
  created_at: string
}

// Filter and sort options

export interface MealPlanFilters {
  status?: MealPlanStatus[]
  generation_method?: GenerationMethod[]
  date_from?: string
  date_to?: string
  has_incomplete_meals?: boolean
}

export interface MealPlanSortOptions {
  field: 'plan_date' | 'created_at' | 'total_planned_calories' | 'completion_percentage'
  direction: 'asc' | 'desc'
}

export interface PlannedMealFilters {
  meal_types?: MealType[]
  is_completed?: boolean
  difficulty_level?: DifficultyLevel[]
  cooking_time_max?: number
  tags?: string[]
}

export interface PlannedMealSortOptions {
  field: 'meal_type' | 'meal_order' | 'scheduled_time' | 'calories' | 'created_at'
  direction: 'asc' | 'desc'
}