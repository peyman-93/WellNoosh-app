import { Router } from 'express';
import { nutritionController } from '../controllers/nutritionController';
import { requireAuth, optionalAuth } from '../middleware/auth';

const router = Router();

// Public nutrition endpoints
router.get('/foods/search', nutritionController.searchFoods);
router.get('/foods/:id', nutritionController.getFoodNutrition);

// Protected nutrition endpoints
router.use(requireAuth);

// Nutrition tracking
router.get('/daily/:date', nutritionController.getDailyNutrition);
router.get('/weekly/:startDate', nutritionController.getWeeklyNutrition);
router.get('/monthly/:year/:month', nutritionController.getMonthlyNutrition);

// Nutrition analysis
router.post('/analyze-recipe', nutritionController.analyzeRecipe);
router.post('/analyze-meal-plan', nutritionController.analyzeMealPlan);

// Nutrition goals
router.get('/goals', nutritionController.getNutritionGoals);
router.post('/goals', nutritionController.setNutritionGoals);
router.put('/goals', nutritionController.updateNutritionGoals);

// Nutrition recommendations
router.get('/recommendations', nutritionController.getNutritionRecommendations);
router.get('/deficiency-analysis', nutritionController.getDeficiencyAnalysis);

// Food logging
router.post('/log', nutritionController.logFood);
router.get('/log/:date', nutritionController.getFoodLog);
router.put('/log/:id', nutritionController.updateFoodLog);
router.delete('/log/:id', nutritionController.deleteFoodLog);

export { router as nutritionRoutes };