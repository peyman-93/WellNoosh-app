import AsyncStorage from '@react-native-async-storage/async-storage';

export async function clearAllSessions(): Promise<void> {
  try {
    // Clear all authentication-related storage
    await AsyncStorage.removeItem('wellnoosh_session');
    await AsyncStorage.removeItem('wellnoosh_user_data');
    await AsyncStorage.removeItem('wellnoosh_onboarding_completed');
    await AsyncStorage.removeItem('wellnoosh_feature_slides_seen');
    await AsyncStorage.removeItem('wellnoosh_profile_completion_completed');
    await AsyncStorage.removeItem('wellnoosh_meal_recommendations_completed');
    
    console.log('🧹 All sessions and user data cleared');
  } catch (error) {
    console.error('❌ Error clearing sessions:', error);
    throw error;
  }
}

// If called directly from command line
if (require.main === module) {
  clearAllSessions()
    .then(() => {
      console.log('Session clearing completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to clear sessions:', error);
      process.exit(1);
    });
}