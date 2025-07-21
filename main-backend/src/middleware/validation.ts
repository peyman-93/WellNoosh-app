import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { createError } from './errorHandler';

// Generic validation middleware
const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      const message = error.details.map(detail => detail.message).join(', ');
      throw createError(message, 400);
    }
    
    next();
  };
};

// User profile validation schema
const updateProfileSchema = Joi.object({
  fullName: Joi.string().min(2).max(100).allow(''),
  email: Joi.string().email().trim().allow(''),
  country: Joi.string().min(2).max(50).allow(''),
  city: Joi.string().min(2).max(50).allow(''),
  postalCode: Joi.string().min(3).max(20).allow(''),
  userId: Joi.string().uuid().allow(''),
  age: Joi.number().integer().min(13).max(120).allow(null),
  gender: Joi.string().valid('Male', 'Female', 'Non-binary', 'Prefer not to say').allow('', null),
  weight: Joi.number().positive().max(1000).allow(null),
  weightUnit: Joi.string().valid('kg', 'lbs').allow('', null),
  height: Joi.number().positive().max(300).allow(null),
  heightUnit: Joi.string().valid('cm', 'ft').allow('', null),
  heightFeet: Joi.number().integer().min(3).max(8).allow(null),
  heightInches: Joi.number().integer().min(0).max(11).allow(null),
  dietStyle: Joi.array().items(Joi.string()).allow(null),
  customDietStyle: Joi.string().max(200).allow('', null),
  allergies: Joi.array().items(Joi.string()).allow(null),
  medicalConditions: Joi.array().items(Joi.string()).allow(null),
  activityLevel: Joi.string().allow('', null),
  healthGoals: Joi.array().items(Joi.string()).allow(null),
  foodRestrictions: Joi.array().items(Joi.string()).allow(null),
  cookingSkill: Joi.string().allow('', null),
  mealPreference: Joi.string().allow('', null),
  subscriptionTier: Joi.string().valid('free', 'premium').allow(null),
  dailySwipesUsed: Joi.number().integer().min(0).allow(null),
  lastSwipeDate: Joi.string().allow('', null),
  favoriteRecipes: Joi.array().items(Joi.string()).allow(null),
  selectedRecipes: Joi.array().items(Joi.string()).allow(null),
  cookedRecipes: Joi.array().allow(null),
  leftovers: Joi.array().allow(null),
  groceryList: Joi.array().allow(null)
});

// Health metrics validation schema
const healthMetricsSchema = Joi.object({
  date: Joi.string().isoDate().required(),
  weight: Joi.number().positive().max(1000),
  mood: Joi.number().integer().min(1).max(10),
  sleepHours: Joi.number().positive().max(24),
  energyLevel: Joi.string().valid('Low', 'Medium', 'High'),
  stressLevel: Joi.number().integer().min(1).max(10),
  notes: Joi.string().max(500)
});

// Water intake validation schema
const waterIntakeSchema = Joi.object({
  date: Joi.string().isoDate().required(),
  glasses: Joi.array().items(Joi.boolean()).length(8).required(),
  dailyGoal: Joi.number().integer().min(1).max(20).default(8)
});

// Breathing exercises validation schema
const breathingExercisesSchema = Joi.object({
  date: Joi.string().isoDate().required(),
  exercises: Joi.array().items(Joi.boolean()).length(6).required(),
  dailyGoal: Joi.number().integer().min(1).max(20).default(6)
});

// Recipe validation schema
const recipeSchema = Joi.object({
  name: Joi.string().min(2).max(200).required(),
  image: Joi.string().uri(),
  cookTime: Joi.string().required(),
  servings: Joi.number().integer().positive().max(50).required(),
  difficulty: Joi.string().valid('Easy', 'Medium', 'Hard').required(),
  tags: Joi.array().items(Joi.string()),
  description: Joi.string().max(1000),
  ingredients: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      amount: Joi.string().required(),
      category: Joi.string().required()
    })
  ).required(),
  instructions: Joi.array().items(Joi.string()).required(),
  nutrition: Joi.object({
    calories: Joi.number().positive().required(),
    protein: Joi.number().min(0).required(),
    carbs: Joi.number().min(0).required(),
    fat: Joi.number().min(0).required(),
    fiber: Joi.number().min(0),
    sugar: Joi.number().min(0),
    sodium: Joi.number().min(0)
  }).required()
});

// Meal plan validation schema
const mealPlanSchema = Joi.object({
  date: Joi.string().isoDate().required(),
  mealType: Joi.string().valid('breakfast', 'lunch', 'dinner', 'snack').required(),
  recipeId: Joi.string().uuid(),
  plannedTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  notes: Joi.string().max(500)
});

// MoodFood request validation schema
const moodFoodSchema = Joi.object({
  mood: Joi.number().integer().min(1).max(10).required(),
  energyLevel: Joi.string().valid('Low', 'Medium', 'High').required(),
  stressLevel: Joi.number().integer().min(1).max(10).required(),
  preferences: Joi.array().items(Joi.string()),
  dietaryRestrictions: Joi.array().items(Joi.string())
});

// Auth validation schemas
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

const signupSchema = Joi.object({
  userId: Joi.string().uuid().required(),
  email: Joi.string().email().trim().required(),
  fullName: Joi.string().min(2).max(100).required(),
  country: Joi.string().min(2).max(50).required(),
  city: Joi.string().min(2).max(50).required(),
  postalCode: Joi.string().min(3).max(20).required()
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required()
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  newPassword: Joi.string().min(6).required()
});

// Export validation middleware
export const validateUpdateProfile = validate(updateProfileSchema);
export const validateHealthMetrics = validate(healthMetricsSchema);
export const validateWaterIntake = validate(waterIntakeSchema);
export const validateBreathingExercises = validate(breathingExercisesSchema);
export const validateRecipe = validate(recipeSchema);
export const validateMealPlan = validate(mealPlanSchema);
export const validateMoodFood = validate(moodFoodSchema);
export const validateLogin = validate(loginSchema);
export const validateSignup = validate(signupSchema);
export const validateForgotPassword = validate(forgotPasswordSchema);
export const validateResetPassword = validate(resetPasswordSchema);