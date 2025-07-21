import { Request, Response } from 'express';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { userService } from '../services/userService';

class HealthController {
  // Water intake endpoints
  getWaterIntake = asyncHandler(async (req: Request, res: Response) => {
    const { date } = req.query;
    const userId = req.user!.id;
    
    const waterIntake = await userService.getWaterIntake(userId, date as string, req.supabaseUser);
    res.json({ success: true, data: waterIntake });
  });

  updateWaterIntake = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const updateData = req.body;
    
    const waterIntake = await userService.updateWaterIntake(userId, updateData, req.supabaseUser);
    res.json({ success: true, data: waterIntake });
  });

  // Breathing exercises endpoints
  getBreathingExercises = asyncHandler(async (req: Request, res: Response) => {
    const { date } = req.query;
    const userId = req.user!.id;
    
    const breathingExercises = await userService.getBreathingExercises(userId, date as string, req.supabaseUser);
    res.json({ success: true, data: breathingExercises });
  });

  updateBreathingExercises = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const updateData = req.body;
    
    const breathingExercises = await userService.updateBreathingExercises(userId, updateData, req.supabaseUser);
    res.json({ success: true, data: breathingExercises });
  });

  // Health metrics endpoints
  getHealthMetrics = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { startDate, endDate, limit } = req.query;
    
    const options: {
      startDate?: string;
      endDate?: string;
      limit?: number;
    } = {};
    
    if (startDate) options.startDate = startDate as string;
    if (endDate) options.endDate = endDate as string;
    if (limit) options.limit = parseInt(limit as string);
    
    const metrics = await userService.getHealthMetrics(userId, options);
    res.json({ success: true, data: metrics });
  });

  createHealthMetrics = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const metricsData = req.body;
    
    const metrics = await userService.createHealthMetrics(userId, metricsData);
    res.json({ success: true, data: metrics });
  });
  getMoodFoodRecommendations = asyncHandler(async (req: Request, res: Response) => {
    throw createError('Not implemented yet', 501);
  });

  getHealthAnalytics = asyncHandler(async (req: Request, res: Response) => {
    throw createError('Not implemented yet', 501);
  });

  getHealthTrends = asyncHandler(async (req: Request, res: Response) => {
    throw createError('Not implemented yet', 501);
  });

  getHealthInsights = asyncHandler(async (req: Request, res: Response) => {
    throw createError('Not implemented yet', 501);
  });

  getHealthGoals = asyncHandler(async (req: Request, res: Response) => {
    throw createError('Not implemented yet', 501);
  });

  setHealthGoals = asyncHandler(async (req: Request, res: Response) => {
    throw createError('Not implemented yet', 501);
  });

  updateHealthGoal = asyncHandler(async (req: Request, res: Response) => {
    throw createError('Not implemented yet', 501);
  });

  deleteHealthGoal = asyncHandler(async (req: Request, res: Response) => {
    throw createError('Not implemented yet', 501);
  });

  getReminders = asyncHandler(async (req: Request, res: Response) => {
    throw createError('Not implemented yet', 501);
  });

  createReminder = asyncHandler(async (req: Request, res: Response) => {
    throw createError('Not implemented yet', 501);
  });

  updateReminder = asyncHandler(async (req: Request, res: Response) => {
    throw createError('Not implemented yet', 501);
  });

  deleteReminder = asyncHandler(async (req: Request, res: Response) => {
    throw createError('Not implemented yet', 501);
  });
}

export const healthController = new HealthController();