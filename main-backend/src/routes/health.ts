import { Router } from 'express';
import { healthController } from '../controllers/healthController';
import { requireAuth } from '../middleware/auth';
import { validateMoodFood } from '../middleware/validation';

const router = Router();

// All health routes require authentication
router.use(requireAuth);

// Water intake tracking
router.get('/water-intake', healthController.getWaterIntake);
router.post('/water-intake', healthController.updateWaterIntake);

// Breathing exercises tracking
router.get('/breathing-exercises', healthController.getBreathingExercises);
router.post('/breathing-exercises', healthController.updateBreathingExercises);

// Health metrics
router.get('/metrics', healthController.getHealthMetrics);
router.post('/metrics', healthController.createHealthMetrics);

// MoodFood feature
router.post('/mood-food', validateMoodFood, healthController.getMoodFoodRecommendations);

// Health analytics
router.get('/analytics', healthController.getHealthAnalytics);
router.get('/trends', healthController.getHealthTrends);
router.get('/insights', healthController.getHealthInsights);

// Goal tracking
router.get('/goals', healthController.getHealthGoals);
router.post('/goals', healthController.setHealthGoals);
router.put('/goals/:id', healthController.updateHealthGoal);
router.delete('/goals/:id', healthController.deleteHealthGoal);

// Reminders and notifications
router.get('/reminders', healthController.getReminders);
router.post('/reminders', healthController.createReminder);
router.put('/reminders/:id', healthController.updateReminder);
router.delete('/reminders/:id', healthController.deleteReminder);

export { router as healthRoutes };