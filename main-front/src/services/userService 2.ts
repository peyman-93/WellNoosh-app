import { apiClient } from './apiClient';

export interface User {
  id: string;
  email: string;
  fullName: string;
  country: string;
  city: string;
  postalCode: string;
  age?: number;
  gender?: string;
  weight?: number;
  weightUnit?: 'kg' | 'lbs';
  height?: number;
  heightUnit?: 'cm' | 'ft';
  heightFeet?: number;
  heightInches?: number;
  dietStyle?: string[];
  customDietStyle?: string;
  allergies?: string[];
  medicalConditions?: string[];
  activityLevel?: string;
  healthGoals?: string[];
  foodRestrictions?: string[];
  cookingSkill?: string;
  mealPreference?: string;
  subscriptionTier?: 'free' | 'premium';
  dailySwipesUsed?: number;
  lastSwipeDate?: string;
  favoriteRecipes?: string[];
  selectedRecipes?: string[];
  cookedRecipes?: any[];
  leftovers?: string[];
  groceryList?: any[];
  createdAt: string;
  updatedAt: string;
}

class UserService {
  // Profile Management
  async getProfile(): Promise<User> {
    return apiClient.get<User>('/users/profile');
  }

  async updateProfile(updateData: Partial<User>): Promise<User> {
    return apiClient.put<User>('/users/profile', updateData);
  }

  async deleteProfile(): Promise<void> {
    return apiClient.delete<void>('/users/profile');
  }

  // Preferences
  async getPreferences(): Promise<any> {
    return apiClient.get('/users/preferences');
  }

  async updatePreferences(preferencesData: any): Promise<any> {
    return apiClient.put('/users/preferences', preferencesData);
  }

  // Subscription
  async getSubscription(): Promise<any> {
    return apiClient.get('/users/subscription');
  }

  async updateSubscription(subscriptionData: any): Promise<any> {
    return apiClient.put('/users/subscription', subscriptionData);
  }

  // Usage Statistics
  async getUsage(): Promise<any> {
    return apiClient.get('/users/usage');
  }
}

export const userService = new UserService();
export default userService;