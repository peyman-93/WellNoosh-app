import { apiClient } from './apiClient';

export interface WaterIntake {
  date: string;
  glasses: boolean[];
  dailyGoal: number;
}

export interface BreathingExercises {
  date: string;
  exercises: boolean[];
  dailyGoal: number;
}

export interface HealthMetrics {
  id: string;
  userId: string;
  date: string;
  weight?: number;
  mood?: number;
  sleepHours?: number;
  energyLevel?: 'Low' | 'Medium' | 'High';
  stressLevel?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MoodFoodRequest {
  mood: number;
  energyLevel: 'Low' | 'Medium' | 'High';
  stressLevel: number;
  preferences?: string[];
  dietaryRestrictions?: string[];
}

export interface MoodFoodRecommendation {
  recipes: any[];
  reasoning: string;
  moodBoostTips: string[];
  nutritionalBenefits: string[];
}

class HealthService {
  // Water Intake Methods
  async getWaterIntake(date?: string): Promise<WaterIntake | null> {
    const endpoint = date ? `/health/water-intake?date=${date}` : '/health/water-intake';
    return apiClient.get<WaterIntake | null>(endpoint);
  }

  async updateWaterIntake(waterData: WaterIntake): Promise<WaterIntake> {
    return apiClient.post<WaterIntake>('/health/water-intake', waterData);
  }

  // Breathing Exercises Methods
  async getBreathingExercises(date?: string): Promise<BreathingExercises | null> {
    const endpoint = date ? `/health/breathing-exercises?date=${date}` : '/health/breathing-exercises';
    return apiClient.get<BreathingExercises | null>(endpoint);
  }

  async updateBreathingExercises(breathingData: BreathingExercises): Promise<BreathingExercises> {
    return apiClient.post<BreathingExercises>('/health/breathing-exercises', breathingData);
  }

  // Health Metrics Methods
  async getHealthMetrics(options?: {
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<HealthMetrics[]> {
    let endpoint = '/health/metrics';
    const params = new URLSearchParams();
    
    if (options?.startDate) params.append('startDate', options.startDate);
    if (options?.endDate) params.append('endDate', options.endDate);
    if (options?.limit) params.append('limit', options.limit.toString());
    
    if (params.toString()) {
      endpoint += `?${params.toString()}`;
    }
    
    return apiClient.get<HealthMetrics[]>(endpoint);
  }

  async createHealthMetrics(metricsData: Omit<HealthMetrics, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<HealthMetrics> {
    return apiClient.post<HealthMetrics>('/health/metrics', metricsData);
  }

  async updateHealthMetrics(date: string, updateData: Partial<HealthMetrics>): Promise<HealthMetrics> {
    return apiClient.put<HealthMetrics>(`/users/health-metrics/${date}`, updateData);
  }

  // MoodFood Feature
  async getMoodFoodRecommendations(moodData: MoodFoodRequest): Promise<MoodFoodRecommendation> {
    return apiClient.post<MoodFoodRecommendation>('/health/mood-food', moodData);
  }

  // Health Analytics
  async getHealthAnalytics(): Promise<any> {
    return apiClient.get('/health/analytics');
  }

  async getHealthTrends(): Promise<any> {
    return apiClient.get('/health/trends');
  }

  async getHealthInsights(): Promise<any> {
    return apiClient.get('/health/insights');
  }

  // Utility method to get today's date string
  getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  // Utility method to check if data is for today
  isToday(dateString: string): boolean {
    return dateString === this.getTodayDate();
  }
}

export const healthService = new HealthService();
export default healthService;