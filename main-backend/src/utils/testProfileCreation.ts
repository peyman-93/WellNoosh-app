import { userService } from '../services/userService';

async function testProfileCreation() {
  try {
    console.log('🧪 Testing profile creation...');
    
    const testUserId = 'a4d69e9c-e2ed-4cff-b839-98903a4a3888'; // From your logs
    const testData = {
      fullName: 'Mohammad',
      email: 'peyman21mohammad@gmail.com',
      country: 'Spain',
      city: 'Barcelona',
      postalCode: '08006'
    };
    
    console.log('📋 Test data:', JSON.stringify(testData, null, 2));
    console.log('👤 User ID:', testUserId);
    
    // Test profile creation
    const profile = await userService.createProfile(testUserId, testData);
    
    console.log('✅ Profile created successfully!');
    console.log('📊 Created profile:', JSON.stringify(profile, null, 2));
    
  } catch (error: any) {
    console.error('❌ Profile creation failed:', error);
    console.error('Error details:', error.message);
    if (error.details) {
      console.error('Supabase error details:', error.details);
    }
  }
}

// If called directly from command line
if (require.main === module) {
  testProfileCreation()
    .then(() => {
      console.log('Test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}