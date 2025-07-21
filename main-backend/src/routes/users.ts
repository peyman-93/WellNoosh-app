import { Router } from 'express';
import { userController } from '../controllers/userController';
import { requireAuth } from '../middleware/auth';
import { validateUpdateProfile, validateHealthMetrics } from '../middleware/validation';

const router = Router();

// All user routes require authentication
router.use(requireAuth);

// Profile routes
router.get('/profile', userController.getProfile);
router.put('/profile', validateUpdateProfile, userController.updateProfile);
router.delete('/profile', userController.deleteProfile);

// Health tracking routes
router.get('/health-metrics', userController.getHealthMetrics);
router.post('/health-metrics', validateHealthMetrics, userController.createHealthMetrics);
router.put('/health-metrics/:date', validateHealthMetrics, userController.updateHealthMetrics);

// Water intake routes
router.get('/water-intake', userController.getWaterIntake);
router.post('/water-intake', userController.updateWaterIntake);

// Breathing exercises routes
router.get('/breathing-exercises', userController.getBreathingExercises);
router.post('/breathing-exercises', userController.updateBreathingExercises);

// Preferences and settings
router.get('/preferences', userController.getPreferences);
router.put('/preferences', userController.updatePreferences);

// Subscription and usage
router.get('/subscription', userController.getSubscription);
router.put('/subscription', userController.updateSubscription);
router.get('/usage', userController.getUsage);

export { router as userRoutes };