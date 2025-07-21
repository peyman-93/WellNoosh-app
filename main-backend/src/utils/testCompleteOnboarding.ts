import { userService } from '../services/userService';

async function testCompleteOnboarding() {
  try {
    console.log('🧪 Testing complete onboarding data update...');
    
    // This is the exact data from your frontend logs
    const onboardingData = {
      "fullName": "Mohammad",
      "email": "peyman21mohammad@gmail.com",
      "country": "Spain",
      "city": "Barcelona",
      "postalCode": "08006",
      "userId": "75194996-43eb-411b-883a-8ef656c864f4",
      "subscriptionTier": "free" as "free",
      "dailySwipesUsed": 0,
      "lastSwipeDate": "Sun Jul 20 2025",
      "favoriteRecipes": [],
      "selectedRecipes": [],
      "cookedRecipes": [],
      "leftovers": [],
      "groceryList": [],
      "age": 32,
      "gender": "Male" as "Male",
      "weight": 87,
      "weightUnit": "kg" as "kg",
      "height": 178,
      "heightUnit": "cm" as "cm",
      "dietStyle": [
        "Balanced"
      ],
      "customDietStyle": "",
      "allergies": [
        "Milk/Dairy",
        "Wheat/Gluten", 
        "Nuts"
      ],
      "medicalConditions": [
        "High Blood Pressure"
      ],
      "activityLevel": "Moderately Active (3-5 days/week)",
      "healthGoals": [
        "Lose Weight",
        "Build Muscle"
      ],
      "foodRestrictions": [],
      "cookingSkill": "Intermediate (comfortable with recipes)",
      "mealPreference": "Quick & Easy (15-30 min)"
    };

    const userId = '75194996-43eb-411b-883a-8ef656c864f4';
    
    const updatedProfile = await userService.updateProfile(userId, onboardingData);
    
    console.log('✅ Complete onboarding data saved successfully!');
    console.log('📋 Updated profile data:');
    console.log(JSON.stringify(updatedProfile, null, 2));
    
  } catch (error) {
    console.error('❌ Error testing complete onboarding:', error);
  }
}

// If called directly from command line
if (require.main === module) {
  testCompleteOnboarding()
    .then(() => {
      console.log('Complete onboarding test finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to test complete onboarding:', error);
      process.exit(1);
    });
}