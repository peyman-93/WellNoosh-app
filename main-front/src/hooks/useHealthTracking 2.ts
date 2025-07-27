import { useState, useEffect } from 'react';
import { healthService, WaterIntake, BreathingExercises } from '../services/healthService';

export const useHealthTracking = () => {
  const [waterIntake, setWaterIntake] = useState<boolean[]>(Array(8).fill(false));
  const [breathingExercises, setBreathingExercises] = useState<boolean[]>(Array(6).fill(false));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get today's date
  const today = healthService.getTodayDate();

  // Load data from backend
  const loadHealthData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load water intake
      const waterData = await healthService.getWaterIntake(today);
      if (waterData && healthService.isToday(waterData.date)) {
        setWaterIntake(waterData.glasses);
      } else {
        setWaterIntake(Array(8).fill(false));
      }

      // Load breathing exercises  
      const breathingData = await healthService.getBreathingExercises(today);
      if (breathingData && healthService.isToday(breathingData.date)) {
        setBreathingExercises(breathingData.exercises);
      } else {
        setBreathingExercises(Array(6).fill(false));
      }

    } catch (err) {
      console.error('Failed to load health data:', err);
      setError('Failed to load health data');
      // Keep using local state if backend fails
    } finally {
      setLoading(false);
    }
  };

  // Update water intake
  const updateWaterIntake = async (index: number) => {
    const newIntake = [...waterIntake];
    newIntake[index] = !newIntake[index];
    setWaterIntake(newIntake);

    try {
      const waterData: WaterIntake = {
        date: today,
        glasses: newIntake,
        dailyGoal: 8
      };
      
      await healthService.updateWaterIntake(waterData);
      console.log('✅ Water intake updated successfully');
    } catch (err) {
      console.error('❌ Failed to update water intake:', err);
      // Revert on error
      setWaterIntake(waterIntake);
      setError('Failed to update water intake');
    }
  };

  // Update breathing exercises
  const updateBreathingExercises = async (index: number) => {
    const newExercises = [...breathingExercises];
    newExercises[index] = !newExercises[index];
    setBreathingExercises(newExercises);

    try {
      const breathingData: BreathingExercises = {
        date: today,
        exercises: newExercises,
        dailyGoal: 6
      };
      
      await healthService.updateBreathingExercises(breathingData);
      console.log('✅ Breathing exercises updated successfully');
    } catch (err) {
      console.error('❌ Failed to update breathing exercises:', err);
      // Revert on error
      setBreathingExercises(breathingExercises);
      setError('Failed to update breathing exercises');
    }
  };

  // Auto-add breathing exercise after guided session
  const addBreathingExercise = async () => {
    const currentExercises = [...breathingExercises];
    const nextEmptyIndex = currentExercises.findIndex(exercise => !exercise);
    
    if (nextEmptyIndex !== -1) {
      currentExercises[nextEmptyIndex] = true;
      setBreathingExercises(currentExercises);

      try {
        const breathingData: BreathingExercises = {
          date: today,
          exercises: currentExercises,
          dailyGoal: 6
        };
        
        await healthService.updateBreathingExercises(breathingData);
        console.log('✅ Breathing exercise added successfully');
      } catch (err) {
        console.error('❌ Failed to add breathing exercise:', err);
        // Revert on error
        setBreathingExercises(breathingExercises);
        setError('Failed to add breathing exercise');
      }
    }
  };

  // Calculate progress
  const waterProgress = {
    completed: waterIntake.filter(Boolean).length,
    total: 8,
    percentage: (waterIntake.filter(Boolean).length / 8) * 100
  };

  const breathingProgress = {
    completed: breathingExercises.filter(Boolean).length,
    total: 6,
    percentage: (breathingExercises.filter(Boolean).length / 6) * 100
  };

  // Load data on mount
  useEffect(() => {
    loadHealthData();
  }, []);

  return {
    // State
    waterIntake,
    breathingExercises,
    loading,
    error,
    
    // Actions
    updateWaterIntake,
    updateBreathingExercises,
    addBreathingExercise,
    loadHealthData,
    
    // Computed values
    waterProgress,
    breathingProgress,
    
    // Utilities
    today
  };
};