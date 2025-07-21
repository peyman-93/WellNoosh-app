import { Request, Response } from 'express';
import { userService } from '../services/userService';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { ApiResponse, HealthMetrics, WaterIntake, BreathingExercises } from '../types';

class UserController {
  // Get user profile
  getProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const profile = await userService.getProfile(userId);
    
    if (!profile) {
      throw createError('Profile not found', 404);
    }

    const response: ApiResponse = {
      success: true,
      data: profile,
      timestamp: new Date().toISOString()
    };

    res.json(response);
  });

  // Update user profile
  updateProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const updateData = req.body;

    console.log('🔄 Updating profile for user:', userId);
    console.log('📋 Update data received:', JSON.stringify(updateData, null, 2));

    const updatedProfile = await userService.updateProfile(userId, updateData, req.supabaseUser);

    console.log('✅ Profile updated successfully in database');

    const response: ApiResponse = {
      success: true,
      data: updatedProfile,
      message: 'Profile updated successfully',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  });

  // Delete user profile
  deleteProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    await userService.deleteProfile(userId);

    const response: ApiResponse = {
      success: true,
      message: 'Profile deleted successfully',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  });

  // Get health metrics
  getHealthMetrics = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { startDate, endDate, limit = 30 } = req.query;

    const metrics = await userService.getHealthMetrics(userId, {
      startDate: startDate as string,
      endDate: endDate as string,
      limit: parseInt(limit as string)
    });

    const response: ApiResponse = {
      success: true,
      data: metrics,
      timestamp: new Date().toISOString()
    };

    res.json(response);
  });

  // Create health metrics
  createHealthMetrics = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const metricsData: Omit<HealthMetrics, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = req.body;

    const metrics = await userService.createHealthMetrics(userId, metricsData);

    const response: ApiResponse = {
      success: true,
      data: metrics,
      message: 'Health metrics created successfully',
      timestamp: new Date().toISOString()
    };

    res.status(201).json(response);
  });

  // Update health metrics
  updateHealthMetrics = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { date } = req.params;
    const updateData = req.body;

    const metrics = await userService.updateHealthMetrics(userId, date as string, updateData);

    const response: ApiResponse = {
      success: true,
      data: metrics,
      message: 'Health metrics updated successfully',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  });

  // Get water intake
  getWaterIntake = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { date } = req.query;

    const waterIntake = await userService.getWaterIntake(userId, date as string | undefined);

    const response: ApiResponse = {
      success: true,
      data: waterIntake,
      timestamp: new Date().toISOString()
    };

    res.json(response);
  });

  // Update water intake
  updateWaterIntake = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const waterIntakeData: WaterIntake = req.body;

    const waterIntake = await userService.updateWaterIntake(userId, waterIntakeData);

    const response: ApiResponse = {
      success: true,
      data: waterIntake,
      message: 'Water intake updated successfully',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  });

  // Get breathing exercises
  getBreathingExercises = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { date } = req.query;

    const breathingExercises = await userService.getBreathingExercises(userId, date as string | undefined);

    const response: ApiResponse = {
      success: true,
      data: breathingExercises,
      timestamp: new Date().toISOString()
    };

    res.json(response);
  });

  // Update breathing exercises
  updateBreathingExercises = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const breathingData: BreathingExercises = req.body;

    const breathingExercises = await userService.updateBreathingExercises(userId, breathingData);

    const response: ApiResponse = {
      success: true,
      data: breathingExercises,
      message: 'Breathing exercises updated successfully',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  });

  // Get user preferences
  getPreferences = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const preferences = await userService.getPreferences(userId);

    const response: ApiResponse = {
      success: true,
      data: preferences,
      timestamp: new Date().toISOString()
    };

    res.json(response);
  });

  // Update user preferences
  updatePreferences = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const preferencesData = req.body;

    const preferences = await userService.updatePreferences(userId, preferencesData);

    const response: ApiResponse = {
      success: true,
      data: preferences,
      message: 'Preferences updated successfully',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  });

  // Get subscription info
  getSubscription = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const subscription = await userService.getSubscription(userId);

    const response: ApiResponse = {
      success: true,
      data: subscription,
      timestamp: new Date().toISOString()
    };

    res.json(response);
  });

  // Update subscription
  updateSubscription = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const subscriptionData = req.body;

    const subscription = await userService.updateSubscription(userId, subscriptionData);

    const response: ApiResponse = {
      success: true,
      data: subscription,
      message: 'Subscription updated successfully',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  });

  // Get usage statistics
  getUsage = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const usage = await userService.getUsage(userId);

    const response: ApiResponse = {
      success: true,
      data: usage,
      timestamp: new Date().toISOString()
    };

    res.json(response);
  });
}

export const userController = new UserController();