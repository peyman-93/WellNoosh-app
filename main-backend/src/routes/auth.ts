import { Router } from 'express';
import { authController } from '../controllers/authController';
import { authRateLimiterMiddleware } from '../middleware/rateLimiter';
import { authenticateUser } from '../middleware/auth';
import { 
  validateLogin, 
  validateSignup, 
  validateForgotPassword, 
  validateResetPassword 
} from '../middleware/validation';

const router = Router();

// Apply auth rate limiting to all auth routes
router.use(authRateLimiterMiddleware);

// Authentication routes
router.post('/login', validateLogin, authController.login);
router.post('/signup', authenticateUser, validateSignup, authController.signup);
router.post('/logout', authController.logout);
router.post('/refresh', authController.refreshToken);

// Password reset routes
router.post('/forgot-password', validateForgotPassword, authController.forgotPassword);
router.post('/reset-password', validateResetPassword, authController.resetPassword);

// Email verification routes
router.post('/verify-email', authController.verifyEmail);
router.post('/resend-verification', authController.resendVerification);

// Google OAuth routes
router.post('/google', authController.googleAuth);

export { router as authRoutes };