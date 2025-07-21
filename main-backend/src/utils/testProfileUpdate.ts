import { userService } from '../services/userService';

async function testProfileUpdate() {
  try {
    console.log('🧪 Testing profile update with onboarding data...');
    
    const testData = {
      age: 25,
      gender: 'Male',
      weight: 75.5,
      weightUnit: 'kg' as const,
      height: 180,
      heightUnit: 'cm' as const,
      dietStyle: ['Balanced', 'Mediterranean'],
      allergies: ['Nuts', 'Shellfish'],
      activityLevel: 'Moderately Active (3-5 days/week)',
      healthGoals: ['Lose Weight', 'Build Muscle'],
      cookingSkill: 'Intermediate (comfortable with recipes)'
    };

    const userId = '2b416c4c-e782-41b3-816e-b76016a179d9';
    
    const updatedProfile = await userService.updateProfile(userId, testData);
    
    console.log('✅ Profile updated successfully:');
    console.log(JSON.stringify(updatedProfile, null, 2));
    
  } catch (error) {
    console.error('❌ Error testing profile update:', error);
  }
}

// If called directly from command line
if (require.main === module) {
  testProfileUpdate()
    .then(() => {
      console.log('Profile update test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to test profile update:', error);
      process.exit(1);
    });
}