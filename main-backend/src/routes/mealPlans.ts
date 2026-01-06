import { Router } from 'express';
import { mealPlanController } from '../controllers/mealPlanController';
import { requireAuth } from '../middleware/auth';
import { validateMealPlan } from '../middleware/validation';

const router = Router();

// All meal plan routes require authentication
router.use(requireAuth);

// AI-powered meal planning (NEW)
router.post('/ai-chat', mealPlanController.aiChat);
router.post('/ai-generate', mealPlanController.aiGeneratePlan);
router.post('/dspy-generate', mealPlanController.aiGeneratePlanDSPy); // DSPy with full recipe details

// Meal plan CRUD operations
router.get('/', mealPlanController.getMealPlans);
router.post('/', validateMealPlan, mealPlanController.createMealPlan);
router.put('/:id', validateMealPlan, mealPlanController.updateMealPlan);
router.delete('/:id', mealPlanController.deleteMealPlan);

// Specific date operations
router.get('/date/:date', mealPlanController.getMealPlansByDate);
router.get('/week/:startDate', mealPlanController.getWeeklyMealPlan);
router.get('/month/:year/:month', mealPlanController.getMonthlyMealPlan);

// Meal plan generation
router.post('/generate', mealPlanController.generateMealPlan);
router.post('/auto-plan', mealPlanController.autoGenerateMealPlan);

// Meal plan templates
router.get('/templates', mealPlanController.getMealPlanTemplates);
router.post('/templates', mealPlanController.createMealPlanTemplate);

// Grocery list generation from meal plans
router.get('/grocery-list', mealPlanController.generateGroceryList);
router.get('/grocery-list/:startDate/:endDate', mealPlanController.generateGroceryListForPeriod);

// Meal plan sharing
router.post('/:id/share', mealPlanController.shareMealPlan);
router.get('/shared/:shareId', mealPlanController.getSharedMealPlan);

export { router as mealPlanRoutes };
