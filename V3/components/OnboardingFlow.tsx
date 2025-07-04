import { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Plus, X, Utensils, AlertTriangle, Heart, Target } from 'lucide-react';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Checkbox } from './ui/checkbox';
import { Input } from './ui/input';
import { ImageWithFallback } from './figma/ImageWithFallback';
import wellnooshIcon from 'figma:asset/4b28c64338ad95e8eae91615fbda6a4e2cc3d398.png';

interface UserData {
  fullName: string;
  email: string;
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
  // Expanded Health Profile
  dietStyle?: string[];
  customDietStyle?: string;
  allergies?: string[];
  medicalConditions?: string[];
  activityLevel?: string;
  healthGoals?: string[];
  foodRestrictions?: string[];
  cookingSkill?: string;
  mealPreference?: string;
  // Subscription
  subscriptionTier?: 'free' | 'premium';
  dailySwipesUsed?: number;
  lastSwipeDate?: string;
  favoriteRecipes?: string[];
  selectedRecipes?: string[];
}

interface OnboardingFlowProps {
  onComplete: (userData: UserData) => void;
  onSkip: () => void;
  userData: UserData | null;
}

export function OnboardingFlow({ onComplete, onSkip, userData }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showCustomDietInput, setShowCustomDietInput] = useState(false);
  const [customDietText, setCustomDietText] = useState('');
  const [dietaryProfile, setDietaryProfile] = useState({
    dietStyle: [] as string[],
    customDietStyle: '',
    allergies: [] as string[],
    medicalConditions: [] as string[],
    activityLevel: '',
    healthGoals: [] as string[],
    foodRestrictions: [] as string[],
    cookingSkill: '',
    mealPreference: ''
  });

  const getUserFirstName = () => {
    if (!userData?.fullName) return '';
    return userData.fullName.split(' ')[0];
  };

  // Diet Style Options - Added "Balanced"
  const dietStyles = [
    'Balanced', 'Omnivore', 'Vegetarian', 'Vegan', 'Pescatarian', 'Keto', 'Paleo', 
    'Mediterranean', 'Low Carb', 'Gluten-Free', 'Dairy-Free'
  ];

  // Common Allergies
  const commonAllergies = [
    'Nuts', 'Peanuts', 'Shellfish', 'Fish', 'Eggs', 'Milk/Dairy', 
    'Soy', 'Wheat/Gluten', 'Sesame', 'Sulfites', 'Other', 'None'
  ];

  // Medical Conditions
  const medicalConditions = [
    'Diabetes', 'High Blood Pressure', 'High Cholesterol', 'Heart Disease',
    'Kidney Disease', 'Liver Disease', 'Thyroid Issues', 'Food Allergies',
    'Digestive Issues', 'Eating Disorder', 'Other', 'None'
  ];

  // Activity Levels
  const activityLevels = [
    'Sedentary (little/no exercise)',
    'Lightly Active (light exercise 1-3 days/week)',
    'Moderately Active (moderate exercise 3-5 days/week)',
    'Very Active (hard exercise 6-7 days/week)',
    'Extremely Active (very hard exercise, physical job)'
  ];

  // Health Goals
  const healthGoals = [
    'Lose Weight', 'Gain Weight', 'Maintain Weight', 'Build Muscle',
    'Improve Energy', 'Better Digestion', 'Reduce Inflammation',
    'Heart Health', 'Better Sleep', 'General Wellness'
  ];

  // Cooking Skills
  const cookingSkills = [
    'Beginner (basic cooking)',
    'Intermediate (comfortable with recipes)',
    'Advanced (creative cooking)',
    'Expert (professional level)'
  ];

  // Meal Preferences
  const mealPreferences = [
    'Quick & Easy (15-30 min)',
    'Moderate (30-60 min)',
    'Elaborate (60+ min)',
    'Meal Prep Friendly',
    'One-Pot Meals'
  ];

  const handleArrayToggle = (field: keyof typeof dietaryProfile, value: string) => {
    setDietaryProfile(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  const handleSingleSelect = (field: keyof typeof dietaryProfile, value: string) => {
    setDietaryProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleCustomDietAdd = () => {
    if (customDietText.trim()) {
      setDietaryProfile(prev => ({
        ...prev,
        dietStyle: [...prev.dietStyle, customDietText.trim()],
        customDietStyle: customDietText.trim()
      }));
      setCustomDietText('');
      setShowCustomDietInput(false);
    }
  };

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete onboarding with all collected data
      const completeUserData: UserData = {
        ...userData!,
        ...dietaryProfile
      };
      onComplete(completeUserData);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    // Complete with current data
    const completeUserData: UserData = {
      ...userData!,
      ...dietaryProfile
    };
    onComplete(completeUserData);
  };

  const onboardingSteps = [
    // Step 0: Diet Style & Preferences
    {
      title: `WellNoosh ${getUserFirstName()}`,
      subtitle: "What's your diet style?",
      content: (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-green-400 to-blue-600 rounded-full flex items-center justify-center shadow-lg mb-4">
              <Utensils className="w-12 h-12 text-white" />
            </div>
            <p className="text-gray-600 font-body">
              Select all diet styles that apply to you
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {dietStyles.map((diet) => (
              <button
                key={diet}
                onClick={() => handleArrayToggle('dietStyle', diet)}
                className={`p-3 rounded-xl text-sm font-medium transition-all ios-button ${
                  dietaryProfile.dietStyle.includes(diet)
                    ? 'bg-gradient-to-r from-green-500 to-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 border border-gray-200'
                }`}
              >
                {diet}
              </button>
            ))}
          </div>

          {/* Custom Diet Style Section */}
          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-3 font-body">
              Can't find your diet style?
            </p>
            
            {!showCustomDietInput ? (
              <button
                onClick={() => setShowCustomDietInput(true)}
                className="w-full p-3 rounded-xl text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200 transition-all ios-button flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Custom Diet Style
              </button>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Enter your diet style"
                    value={customDietText}
                    onChange={(e) => setCustomDietText(e.target.value)}
                    className="flex-1 ios-button bg-gray-50 border-gray-200"
                    maxLength={50}
                  />
                  <button
                    onClick={handleCustomDietAdd}
                    disabled={!customDietText.trim()}
                    className="ios-button px-4 py-2 bg-green-500 text-white rounded-xl disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setShowCustomDietInput(false);
                      setCustomDietText('');
                    }}
                    className="ios-button px-4 py-2 bg-gray-500 text-white rounded-xl"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 font-body">
                  Describe your specific dietary approach (e.g., "Intermittent Fasting", "Raw Food", "Macrobiotic")
                </p>
              </div>
            )}
          </div>
        </div>
      )
    },
    // Step 1: Allergies & Food Restrictions
    {
      title: "Food Allergies & Restrictions",
      subtitle: "Help us keep you safe and healthy",
      content: (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-red-400 to-orange-600 rounded-full flex items-center justify-center shadow-lg mb-4">
              <AlertTriangle className="w-12 h-12 text-white" />
            </div>
            <p className="text-gray-600 font-body">
              Select any food allergies you have
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {commonAllergies.map((allergy) => (
              <button
                key={allergy}
                onClick={() => handleArrayToggle('allergies', allergy)}
                className={`p-3 rounded-xl text-sm font-medium transition-all ios-button ${
                  dietaryProfile.allergies.includes(allergy)
                    ? 'bg-gradient-to-r from-red-500 to-orange-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 border border-gray-200'
                }`}
              >
                {allergy}
              </button>
            ))}
          </div>
        </div>
      )
    },
    // Step 2: Medical Conditions
    {
      title: "Medical Conditions",
      subtitle: "Any conditions we should consider for your nutrition plan?",
      content: (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-purple-400 to-pink-600 rounded-full flex items-center justify-center shadow-lg mb-4">
              <Heart className="w-12 h-12 text-white" />
            </div>
            <p className="text-gray-600 font-body">
              This helps us provide better nutrition recommendations
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {medicalConditions.map((condition) => (
              <button
                key={condition}
                onClick={() => handleArrayToggle('medicalConditions', condition)}
                className={`p-4 rounded-xl text-sm font-medium transition-all ios-button text-left ${
                  dietaryProfile.medicalConditions.includes(condition)
                    ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 border border-gray-200'
                }`}
              >
                {condition}
              </button>
            ))}
          </div>
        </div>
      )
    },
    // Step 3: Activity Level
    {
      title: "Activity Level",
      subtitle: "How active are you?",
      content: (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-400 to-indigo-600 rounded-full flex items-center justify-center shadow-lg mb-4">
              <Target className="w-12 h-12 text-white" />
            </div>
            <p className="text-gray-600 font-body">
              This helps calculate your nutritional needs
            </p>
          </div>

          <div className="space-y-3">
            {activityLevels.map((level) => (
              <button
                key={level}
                onClick={() => handleSingleSelect('activityLevel', level)}
                className={`w-full p-4 rounded-xl text-sm font-medium transition-all ios-button text-left ${
                  dietaryProfile.activityLevel === level
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 border border-gray-200'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
      )
    },
    // Step 4: Health Goals
    {
      title: "Health Goals",
      subtitle: "What are your main health objectives?",
      content: (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-green-400 to-teal-600 rounded-full flex items-center justify-center shadow-lg mb-4">
              <Target className="w-12 h-12 text-white" />
            </div>
            <p className="text-gray-600 font-body">
              Select your primary health goals
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {healthGoals.map((goal) => (
              <button
                key={goal}
                onClick={() => handleArrayToggle('healthGoals', goal)}
                className={`p-3 rounded-xl text-sm font-medium transition-all ios-button ${
                  dietaryProfile.healthGoals.includes(goal)
                    ? 'bg-gradient-to-r from-green-500 to-teal-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 border border-gray-200'
                }`}
              >
                {goal}
              </button>
            ))}
          </div>
        </div>
      )
    },
    // Step 5: Cooking Preferences
    {
      title: "Cooking Preferences",
      subtitle: "What's your cooking skill level and meal preference?",
      content: (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-orange-400 to-red-600 rounded-full flex items-center justify-center shadow-lg mb-4">
              <Utensils className="w-12 h-12 text-white" />
            </div>
            <p className="text-gray-600 font-body">
              Help us recommend the right recipes for you
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 font-body">Cooking Skill Level</h4>
              <div className="space-y-2">
                {cookingSkills.map((skill) => (
                  <button
                    key={skill}
                    onClick={() => handleSingleSelect('cookingSkill', skill)}
                    className={`w-full p-3 rounded-xl text-sm font-medium transition-all ios-button text-left ${
                      dietaryProfile.cookingSkill === skill
                        ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 border border-gray-200'
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-3 font-body">Meal Preparation Time</h4>
              <div className="space-y-2">
                {mealPreferences.map((pref) => (
                  <button
                    key={pref}
                    onClick={() => handleSingleSelect('mealPreference', pref)}
                    className={`w-full p-3 rounded-xl text-sm font-medium transition-all ios-button text-left ${
                      dietaryProfile.mealPreference === pref
                        ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 border border-gray-200'
                    }`}
                  >
                    {pref}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )
    },
    // Step 6: Setup Complete
    {
      title: "You're All Set!",
      subtitle: `${getUserFirstName()}, your personalized WellNoosh experience is ready`,
      content: (
        <div className="text-center space-y-8">
          <div className="w-32 h-32 mx-auto bg-gradient-to-br from-green-400 via-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl">
            <Check className="w-16 h-16 text-white" />
          </div>
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900 font-body">
              🎉 Your Smart Kitchen Awaits!
            </h3>
            <p className="text-gray-600 leading-relaxed font-body">
              WellNoosh is now fully personalized with your dietary preferences, health goals, and cooking style. Next, we'll show you some delicious meal recommendations!
            </p>
            <div className="grid grid-cols-1 gap-3 text-sm">
              <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-2xl text-left">
                <div className="font-semibold text-green-800 font-body flex items-center">
                  ✅ Complete Health Profile
                </div>
                <div className="text-green-600 font-body">
                  {dietaryProfile.dietStyle.length > 0 ? `${dietaryProfile.dietStyle.join(', ')} diet` : 'Diet preferences saved'}
                </div>
              </div>
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-2xl text-left">
                <div className="font-semibold text-blue-800 font-body flex items-center">
                  🎯 Personalized Goals
                </div>
                <div className="text-blue-600 font-body">
                  {dietaryProfile.healthGoals.length > 0 ? `${dietaryProfile.healthGoals.length} health goals set` : 'Health goals configured'}
                </div>
              </div>
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-2xl text-left">
                <div className="font-semibold text-purple-800 font-body flex items-center">
                  🍽️ Meal Discovery
                </div>
                <div className="text-purple-600 font-body">Ready to discover your perfect meals</div>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  const totalSteps = onboardingSteps.length;

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      {/* Header */}
      <div className="flex items-center justify-between p-6 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <button
          onClick={handlePrevious}
          disabled={currentStep === 0}
          className={`ios-button p-2 ${currentStep === 0 ? 'text-gray-300' : 'text-gray-600'}`}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        
        <div className="text-center">
          <img src={wellnooshIcon} alt="WellNoosh" className="w-8 h-8 object-contain rounded-full wellnoosh-logo mx-auto mb-1" />
          <div className="flex space-x-2">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentStep
                    ? 'bg-gradient-to-r from-green-500 to-blue-600 w-6'
                    : index < currentStep
                    ? 'bg-green-500'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
        
        {currentStep < totalSteps - 1 && (
          <button
            onClick={handleSkip}
            className="ios-button text-gray-600 font-medium font-body"
          >
            Skip
          </button>
        )}
        
        {currentStep === totalSteps - 1 && (
          <div className="w-12"></div>
        )}
      </div>

      {/* Step Content */}
      <div className="flex-1 overflow-y-auto ios-scroll">
        <div className="px-6 py-8">
          <div className="max-w-sm mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2 font-body">
                {onboardingSteps[currentStep].title}
              </h1>
              <p className="text-gray-600 leading-relaxed font-body">
                {onboardingSteps[currentStep].subtitle}
              </p>
            </div>

            <div className="mb-8">
              {onboardingSteps[currentStep].content}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 bg-white/80 backdrop-blur-md border-t border-gray-200">
        <div className="max-w-sm mx-auto">
          <button
            onClick={handleNext}
            className="ios-button w-full py-4 text-lg font-bold text-white bg-gradient-to-r from-green-500 via-blue-500 to-purple-600 shadow-lg"
          >
            {currentStep === totalSteps - 1 ? 'Continue to Meal Discovery' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}