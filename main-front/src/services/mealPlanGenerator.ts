// Mock Meal Plan Generator Service
// This service generates mock meal plans that can be easily replaced with AI-generated plans later

import { supabase } from './supabase'

// Mock meal database - easily replaceable with AI-generated content
const MOCK_MEALS = {
  breakfast: [
    {
      name: 'Avocado Toast with Eggs',
      calories: 420,
      protein_g: 18,
      carbs_g: 32,
      fat_g: 28,
      fiber_g: 12,
      category: 'breakfast',
      preparation_method: 'Pan-fried',
      cooking_time_minutes: 10,
      difficulty_level: 'easy' as const,
      tags: ['high-protein', 'healthy-fats', 'vegetarian']
    },
    {
      name: 'Greek Yogurt Berry Bowl',
      calories: 280,
      protein_g: 20,
      carbs_g: 35,
      fat_g: 8,
      fiber_g: 6,
      category: 'breakfast',
      preparation_method: 'No cooking',
      cooking_time_minutes: 5,
      difficulty_level: 'easy' as const,
      tags: ['high-protein', 'antioxidants', 'quick']
    },
    {
      name: 'Overnight Oats with Banana',
      calories: 350,
      protein_g: 12,
      carbs_g: 58,
      fat_g: 9,
      fiber_g: 8,
      category: 'breakfast',
      preparation_method: 'No cooking',
      cooking_time_minutes: 0,
      difficulty_level: 'easy' as const,
      tags: ['meal-prep', 'fiber-rich', 'energy']
    }
  ],
  lunch: [
    {
      name: 'Grilled Chicken Salad',
      calories: 380,
      protein_g: 35,
      carbs_g: 15,
      fat_g: 22,
      fiber_g: 8,
      category: 'lunch',
      preparation_method: 'Grilled',
      cooking_time_minutes: 15,
      difficulty_level: 'medium' as const,
      tags: ['high-protein', 'low-carb', 'lean']
    },
    {
      name: 'Quinoa Buddha Bowl',
      calories: 450,
      protein_g: 16,
      carbs_g: 65,
      fat_g: 14,
      fiber_g: 12,
      category: 'lunch',
      preparation_method: 'Steamed & Raw',
      cooking_time_minutes: 20,
      difficulty_level: 'medium' as const,
      tags: ['vegetarian', 'complete-protein', 'nutrient-dense']
    },
    {
      name: 'Turkey & Hummus Wrap',
      calories: 320,
      protein_g: 28,
      carbs_g: 28,
      fat_g: 12,
      fiber_g: 6,
      category: 'lunch',
      preparation_method: 'No cooking',
      cooking_time_minutes: 5,
      difficulty_level: 'easy' as const,
      tags: ['quick', 'portable', 'balanced']
    }
  ],
  dinner: [
    {
      name: 'Baked Salmon with Sweet Potato',
      calories: 520,
      protein_g: 42,
      carbs_g: 35,
      fat_g: 24,
      fiber_g: 6,
      category: 'dinner',
      preparation_method: 'Baked',
      cooking_time_minutes: 25,
      difficulty_level: 'medium' as const,
      tags: ['omega-3', 'high-protein', 'heart-healthy']
    },
    {
      name: 'Vegetarian Stir-fry with Tofu',
      calories: 380,
      protein_g: 22,
      carbs_g: 45,
      fat_g: 16,
      fiber_g: 10,
      category: 'dinner',
      preparation_method: 'Stir-fried',
      cooking_time_minutes: 15,
      difficulty_level: 'medium' as const,
      tags: ['vegetarian', 'plant-protein', 'colorful']
    },
    {
      name: 'Lean Beef with Roasted Vegetables',
      calories: 480,
      protein_g: 38,
      carbs_g: 25,
      fat_g: 26,
      fiber_g: 8,
      category: 'dinner',
      preparation_method: 'Roasted',
      cooking_time_minutes: 30,
      difficulty_level: 'medium' as const,
      tags: ['high-protein', 'iron-rich', 'satisfying']
    }
  ],
  snack: [
    {
      name: 'Apple with Almond Butter',
      calories: 190,
      protein_g: 6,
      carbs_g: 18,
      fat_g: 12,
      fiber_g: 5,
      category: 'snack',
      preparation_method: 'No cooking',
      cooking_time_minutes: 0,
      difficulty_level: 'easy' as const,
      tags: ['natural-sugars', 'healthy-fats', 'quick']
    },
    {
      name: 'Trail Mix (Nuts & Dried Fruit)',
      calories: 160,
      protein_g: 5,
      carbs_g: 12,
      fat_g: 12,
      fiber_g: 3,
      category: 'snack',
      preparation_method: 'No cooking',
      cooking_time_minutes: 0,
      difficulty_level: 'easy' as const,
      tags: ['portable', 'energy', 'mix']
    },
    {
      name: 'Greek Yogurt with Berries',
      calories: 140,
      protein_g: 15,
      carbs_g: 18,
      fat_g: 2,
      fiber_g: 3,
      category: 'snack',
      preparation_method: 'No cooking',
      cooking_time_minutes: 0,
      difficulty_level: 'easy' as const,
      tags: ['high-protein', 'probiotics', 'antioxidants']
    }
  ]
}

export interface MockMealPlanOptions {
  userId: string
  planDate: Date
  targetCalories?: number
  dietaryRestrictions?: string[]
  mealsPerDay?: number
  includeSnacks?: boolean
}

export interface GeneratedMealPlan {
  planId: string
  planDate: Date
  totalCalories: number
  totalProtein: number
  totalCarbs: number
  totalFat: number
  meals: GeneratedMeal[]
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
}

// Mock meal plan generator - easily replaceable with AI service
export const generateMockMealPlan = async (options: MockMealPlanOptions): Promise<GeneratedMealPlan> => {
  const { userId, planDate, targetCalories = 2000, dietaryRestrictions = [], mealsPerDay = 3, includeSnacks = true } = options

  console.log('🤖 Generating mock meal plan for:', { userId, planDate: planDate.toISOString().split('T')[0], targetCalories })

  // Calculate calorie distribution
  const baseCaloriesPerMeal = Math.floor(targetCalories * 0.8 / mealsPerDay) // 80% for main meals
  const snackCalories = includeSnacks ? Math.floor(targetCalories * 0.2) : 0 // 20% for snacks

  const meals: GeneratedMeal[] = []

  // Generate main meals
  const mealTypes: ('breakfast' | 'lunch' | 'dinner')[] = ['breakfast', 'lunch', 'dinner'].slice(0, mealsPerDay)
  const mealTimes = ['08:00', '12:30', '18:00']

  for (let i = 0; i < mealTypes.length; i++) {
    const mealType = mealTypes[i]
    const availableMeals = MOCK_MEALS[mealType]
    
    // Filter based on dietary restrictions
    const filteredMeals = availableMeals.filter(meal => {
      if (dietaryRestrictions.includes('vegetarian') && !meal.tags.includes('vegetarian') && meal.name.toLowerCase().includes('chicken') || meal.name.toLowerCase().includes('beef') || meal.name.toLowerCase().includes('salmon')) {
        return false
      }
      if (dietaryRestrictions.includes('low-carb') && meal.carbs_g > 30) {
        return false
      }
      if (dietaryRestrictions.includes('high-protein') && meal.protein_g < 15) {
        return false
      }
      return true
    })

    // Select a random meal from filtered options
    const selectedMeal = filteredMeals[Math.floor(Math.random() * filteredMeals.length)] || availableMeals[0]
    
    // Calculate serving size to match target calories
    const targetMealCalories = baseCaloriesPerMeal
    const servingMultiplier = targetMealCalories / selectedMeal.calories
    const adjustedServingSize = Math.max(0.5, Math.min(2.0, servingMultiplier)) // Between 0.5x and 2x

    meals.push({
      mealType,
      mealOrder: 1,
      scheduledTime: mealTimes[i],
      foodName: selectedMeal.name,
      calories: Math.round(selectedMeal.calories * adjustedServingSize),
      protein_g: Math.round(selectedMeal.protein_g * adjustedServingSize * 100) / 100,
      carbs_g: Math.round(selectedMeal.carbs_g * adjustedServingSize * 100) / 100,
      fat_g: Math.round(selectedMeal.fat_g * adjustedServingSize * 100) / 100,
      fiber_g: Math.round(selectedMeal.fiber_g * adjustedServingSize * 100) / 100,
      servingSize: adjustedServingSize,
      servingUnit: 'serving',
      category: selectedMeal.category,
      preparationMethod: selectedMeal.preparation_method,
      cookingTimeMinutes: selectedMeal.cooking_time_minutes,
      difficultyLevel: selectedMeal.difficulty_level,
      tags: selectedMeal.tags
    })
  }

  // Generate snacks if requested
  if (includeSnacks && snackCalories > 0) {
    const snackCount = Math.ceil(snackCalories / 160) // ~160 calories per snack
    const snackTimes = ['10:30', '15:30', '20:30']

    for (let i = 0; i < Math.min(snackCount, 2); i++) {
      const availableSnacks = MOCK_MEALS.snack
      const selectedSnack = availableSnacks[Math.floor(Math.random() * availableSnacks.length)]
      
      const targetSnackCalories = snackCalories / Math.min(snackCount, 2)
      const servingMultiplier = targetSnackCalories / selectedSnack.calories
      const adjustedServingSize = Math.max(0.5, Math.min(2.0, servingMultiplier))

      meals.push({
        mealType: 'snack',
        mealOrder: i + 1,
        scheduledTime: snackTimes[i],
        foodName: selectedSnack.name,
        calories: Math.round(selectedSnack.calories * adjustedServingSize),
        protein_g: Math.round(selectedSnack.protein_g * adjustedServingSize * 100) / 100,
        carbs_g: Math.round(selectedSnack.carbs_g * adjustedServingSize * 100) / 100,
        fat_g: Math.round(selectedSnack.fat_g * adjustedServingSize * 100) / 100,
        fiber_g: Math.round(selectedSnack.fiber_g * adjustedServingSize * 100) / 100,
        servingSize: adjustedServingSize,
        servingUnit: 'serving',
        category: selectedSnack.category,
        preparationMethod: selectedSnack.preparation_method,
        cookingTimeMinutes: selectedSnack.cooking_time_minutes,
        difficultyLevel: selectedSnack.difficulty_level,
        tags: selectedSnack.tags
      })
    }
  }

  // Calculate totals
  const totalCalories = meals.reduce((sum, meal) => sum + meal.calories, 0)
  const totalProtein = meals.reduce((sum, meal) => sum + meal.protein_g, 0)
  const totalCarbs = meals.reduce((sum, meal) => sum + meal.carbs_g, 0)
  const totalFat = meals.reduce((sum, meal) => sum + meal.fat_g, 0)

  const generatedPlan: GeneratedMealPlan = {
    planId: `mock_plan_${userId}_${planDate.toISOString().split('T')[0]}`,
    planDate,
    totalCalories,
    totalProtein: Math.round(totalProtein * 100) / 100,
    totalCarbs: Math.round(totalCarbs * 100) / 100,
    totalFat: Math.round(totalFat * 100) / 100,
    meals
  }

  console.log('✅ Generated mock meal plan:', {
    totalMeals: meals.length,
    totalCalories,
    breakdown: `${Math.round(totalProtein)}g protein, ${Math.round(totalCarbs)}g carbs, ${Math.round(totalFat)}g fat`
  })

  return generatedPlan
}

// Save generated meal plan to database
export const saveMealPlanToDatabase = async (mealPlan: GeneratedMealPlan, userId: string): Promise<string> => {
  console.log('💾 Saving meal plan to database:', mealPlan.planId)

  try {
    // 1. Create meal plan record
    const { data: mealPlanData, error: mealPlanError } = await supabase
      .from('user_meal_plans')
      .insert({
        user_id: userId,
        plan_date: mealPlan.planDate.toISOString().split('T')[0],
        plan_name: `Daily Meal Plan - ${mealPlan.planDate.toLocaleDateString()}`,
        generation_method: 'mock',
        plan_status: 'active',
        target_calories: mealPlan.totalCalories,
        target_protein_g: mealPlan.totalProtein,
        target_carbs_g: mealPlan.totalCarbs,
        target_fat_g: mealPlan.totalFat,
        meals_per_day: mealPlan.meals.filter(m => m.mealType !== 'snack').length,
        include_snacks: mealPlan.meals.some(m => m.mealType === 'snack'),
        total_planned_calories: mealPlan.totalCalories,
        total_planned_protein_g: mealPlan.totalProtein,
        total_planned_carbs_g: mealPlan.totalCarbs,
        total_planned_fat_g: mealPlan.totalFat,
        total_meals_count: mealPlan.meals.length
      })
      .select()
      .single()

    if (mealPlanError) {
      console.error('❌ Error creating meal plan:', mealPlanError)
      throw mealPlanError
    }

    const mealPlanId = mealPlanData.id
    console.log('✅ Created meal plan:', mealPlanId)

    // 2. Create planned meals
    const plannedMealsData = mealPlan.meals.map(meal => ({
      meal_plan_id: mealPlanId,
      user_id: userId,
      plan_date: mealPlan.planDate.toISOString().split('T')[0],
      meal_type: meal.mealType,
      meal_order: meal.mealOrder,
      scheduled_time: meal.scheduledTime,
      food_name: meal.foodName,
      serving_size: meal.servingSize,
      serving_unit: meal.servingUnit,
      calories: meal.calories,
      protein_g: meal.protein_g,
      carbs_g: meal.carbs_g,
      fat_g: meal.fat_g,
      fiber_g: meal.fiber_g,
      food_category: meal.category,
      preparation_method: meal.preparationMethod,
      cooking_time_minutes: meal.cookingTimeMinutes,
      difficulty_level: meal.difficultyLevel,
      tags: JSON.stringify(meal.tags),
      substitutable: true,
      priority_level: meal.mealType === 'snack' ? 2 : 3
    }))

    const { error: plannedMealsError } = await supabase
      .from('planned_meals')
      .insert(plannedMealsData)

    if (plannedMealsError) {
      console.error('❌ Error creating planned meals:', plannedMealsError)
      throw plannedMealsError
    }

    console.log('✅ Created', mealPlan.meals.length, 'planned meals')
    return mealPlanId

  } catch (error) {
    console.error('💥 Error saving meal plan to database:', error)
    throw error
  }
}

// Generate and save a complete meal plan
export const generateAndSaveMealPlan = async (options: MockMealPlanOptions): Promise<string> => {
  try {
    // Generate the meal plan
    const mealPlan = await generateMockMealPlan(options)
    
    // Save to database
    const mealPlanId = await saveMealPlanToDatabase(mealPlan, options.userId)
    
    console.log('🎉 Successfully generated and saved meal plan:', mealPlanId)
    return mealPlanId
    
  } catch (error) {
    console.error('💥 Error in generateAndSaveMealPlan:', error)
    throw error
  }
}

// Get user's daily calorie target from health profile
export const getUserCalorieTarget = async (userId: string): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from('user_health_profiles')
      .select('daily_calorie_goal')
      .eq('user_id', userId)
      .single()

    if (error || !data?.daily_calorie_goal) {
      console.log('⚠️ No calorie goal found, using default 2000 calories')
      return 2000
    }

    return data.daily_calorie_goal

  } catch (error) {
    console.error('Error fetching user calorie target:', error)
    return 2000
  }
}

// Get user's dietary restrictions
export const getUserDietaryRestrictions = async (userId: string): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('user_dietary_preferences')
      .select('dietary_restrictions')
      .eq('user_id', userId)
      .single()

    if (error || !data?.dietary_restrictions) {
      return []
    }

    return Array.isArray(data.dietary_restrictions) ? data.dietary_restrictions : []

  } catch (error) {
    console.error('Error fetching dietary restrictions:', error)
    return []
  }
}