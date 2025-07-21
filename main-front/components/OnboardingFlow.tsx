import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput } from 'react-native';

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

  // Diet Style Options
  const dietStyles = [
    'Balanced', 'Omnivore', 'Vegetarian', 'Vegan', 'Pescatarian', 'Keto', 'Paleo', 
    'Mediterranean', 'Low Carb'
  ];

  // Common Allergies
  const commonAllergies = [
    'Nuts', 'Peanuts', 'Shellfish', 'Fish', 'Eggs', 'Milk/Dairy', 
    'Soy', 'Wheat/Gluten', 'Sesame', 'Sulfites'
  ];

  // Medical Conditions
  const medicalConditions = [
    'Diabetes', 'High Blood Pressure', 'High Cholesterol', 'Heart Disease',
    'Kidney Disease', 'Liver Disease', 'Thyroid Issues', 'Food Allergies',
    'Digestive Issues', 'Eating Disorder', 'Other'
  ];

  // Activity Levels
  const activityLevels = [
    'Sedentary (little/no exercise)',
    'Lightly Active (1-3 days/week)',
    'Moderately Active (3-5 days/week)',
    'Very Active (5-7 days/week)',
    'Extremely Active (physical job)'
  ];

  // Health Goals
  const healthGoals = [
    'Lose Weight', 'Gain Weight', 'Maintain Weight', 'Build Muscle', 'Improve Energy'
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
    setDietaryProfile(prev => {
      const currentArray = prev[field] as string[];
      
      // Special logic for health goals to prevent conflicting selections
      if (field === 'healthGoals') {
        if (currentArray.includes(value)) {
          // Remove the value if it's already selected
          return {
            ...prev,
            [field]: currentArray.filter((item: string) => item !== value)
          };
        } else {
          // Check for conflicting goals
          let newArray = [...currentArray];
          
          if (value === 'Lose Weight') {
            // Remove Gain Weight and Maintain Weight if Lose Weight is selected
            newArray = newArray.filter(item => item !== 'Gain Weight' && item !== 'Maintain Weight');
          } else if (value === 'Gain Weight') {
            // Remove Lose Weight and Maintain Weight if Gain Weight is selected
            newArray = newArray.filter(item => item !== 'Lose Weight' && item !== 'Maintain Weight');
          } else if (value === 'Maintain Weight') {
            // Remove Lose Weight and Gain Weight if Maintain Weight is selected
            newArray = newArray.filter(item => item !== 'Lose Weight' && item !== 'Gain Weight');
          }
          
          return {
            ...prev,
            [field]: [...newArray, value]
          };
        }
      }
      
      // Default behavior for other fields
      return {
        ...prev,
        [field]: currentArray.includes(value)
          ? currentArray.filter((item: string) => item !== value)
          : [...currentArray, value]
      };
    });
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
      icon: '🍽️',
      iconBg: '#10b981',
      content: (
        <View style={styles.stepContent}>
          <Text style={styles.stepDescription}>
            Select all diet styles that apply to you
          </Text>

          <View style={styles.gridContainer}>
            {dietStyles.map((diet) => (
              <TouchableOpacity
                key={diet}
                onPress={() => handleArrayToggle('dietStyle', diet)}
                style={[
                  styles.optionButton,
                  dietaryProfile.dietStyle.includes(diet) && styles.optionButtonSelected
                ]}
              >
                <Text style={[
                  styles.optionButtonText,
                  dietaryProfile.dietStyle.includes(diet) && styles.optionButtonTextSelected
                ]}>
                  {diet}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Custom Diet Style Section */}
          <View style={styles.customSection}>
            <Text style={styles.customSectionTitle}>
              Can't find your diet style?
            </Text>
            
            {!showCustomDietInput ? (
              <TouchableOpacity
                onPress={() => setShowCustomDietInput(true)}
                style={styles.addCustomButton}
              >
                <Text style={styles.addCustomButtonText}>+ Add Custom Diet Style</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.customInputContainer}>
                <View style={styles.customInputRow}>
                  <TextInput
                    style={styles.customInput}
                    placeholder="Enter your diet style"
                    value={customDietText}
                    onChangeText={setCustomDietText}
                    maxLength={50}
                  />
                  <TouchableOpacity
                    onPress={handleCustomDietAdd}
                    disabled={!customDietText.trim()}
                    style={[styles.customButton, styles.addButton]}
                  >
                    <Text style={styles.customButtonText}>✓</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setShowCustomDietInput(false);
                      setCustomDietText('');
                    }}
                    style={[styles.customButton, styles.cancelButton]}
                  >
                    <Text style={styles.customButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.customInputHelp}>
                  Describe your specific dietary approach (e.g., "Intermittent Fasting", "Raw Food", "Macrobiotic")
                </Text>
              </View>
            )}
          </View>
        </View>
      )
    },
    // Step 1: Allergies & Food Restrictions
    {
      title: "Food Allergies & Restrictions",
      subtitle: "Help us keep you safe and healthy",
      icon: '⚠️',
      iconBg: '#f87171',
      content: (
        <View style={styles.stepContent}>
          <Text style={styles.stepDescription}>
            Select any food allergies you have
          </Text>

          <View style={styles.gridContainer}>
            {commonAllergies.map((allergy) => (
              <TouchableOpacity
                key={allergy}
                onPress={() => handleArrayToggle('allergies', allergy)}
                style={[
                  styles.optionButton,
                  dietaryProfile.allergies.includes(allergy) && styles.optionButtonSelectedRed
                ]}
              >
                <Text style={[
                  styles.optionButtonText,
                  dietaryProfile.allergies.includes(allergy) && styles.optionButtonTextSelected
                ]}>
                  {allergy}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )
    },
    // Step 2: Medical Conditions
    {
      title: "Medical Conditions",
      subtitle: "Any conditions we should consider for your nutrition plan?",
      icon: '❤️',
      iconBg: '#a855f7',
      content: (
        <View style={styles.stepContent}>
          <Text style={styles.stepDescription}>
            This helps us provide better nutrition recommendations
          </Text>

          <View style={styles.listContainer}>
            {medicalConditions.map((condition) => (
              <TouchableOpacity
                key={condition}
                onPress={() => handleArrayToggle('medicalConditions', condition)}
                style={[
                  styles.listOptionButton,
                  dietaryProfile.medicalConditions.includes(condition) && styles.listOptionButtonSelectedPurple
                ]}
              >
                <Text style={[
                  styles.optionButtonText,
                  dietaryProfile.medicalConditions.includes(condition) && styles.optionButtonTextSelected
                ]}>
                  {condition}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )
    },
    // Step 3: Activity Level
    {
      title: "Activity Level",
      subtitle: "How active are you?",
      icon: '🎯',
      iconBg: '#60a5fa',
      content: (
        <View style={styles.stepContent}>
          <Text style={styles.stepDescription}>
            This helps calculate your nutritional needs
          </Text>

          <View style={styles.listContainer}>
            {activityLevels.map((level) => (
              <TouchableOpacity
                key={level}
                onPress={() => handleSingleSelect('activityLevel', level)}
                style={[
                  styles.listOptionButton,
                  dietaryProfile.activityLevel === level && styles.listOptionButtonSelectedBlue
                ]}
              >
                <Text style={[
                  styles.optionButtonText,
                  dietaryProfile.activityLevel === level && styles.optionButtonTextSelected
                ]}>
                  {level}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )
    },
    // Step 4: Health Goals
    {
      title: "Health Goals",
      subtitle: "What are your main health objectives?",
      icon: '🎯',
      iconBg: '#10b981',
      content: (
        <View style={styles.stepContent}>
          <Text style={styles.stepDescription}>
            Select your primary health goals
          </Text>

          <View style={styles.gridContainer}>
            {healthGoals.map((goal) => (
              <TouchableOpacity
                key={goal}
                onPress={() => handleArrayToggle('healthGoals', goal)}
                style={[
                  styles.optionButton,
                  dietaryProfile.healthGoals.includes(goal) && styles.optionButtonSelectedGreen
                ]}
              >
                <Text style={[
                  styles.optionButtonText,
                  dietaryProfile.healthGoals.includes(goal) && styles.optionButtonTextSelected
                ]}>
                  {goal}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )
    },
    // Step 5: Cooking Preferences
    {
      title: "Cooking Preferences",
      subtitle: "What's your cooking skill level and meal preference?",
      icon: '🍽️',
      iconBg: '#fb923c',
      content: (
        <View style={styles.stepContent}>
          <Text style={styles.stepDescription}>
            Help us recommend the right recipes for you
          </Text>

          <View style={styles.sectionContainer}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Cooking Skill Level</Text>
              <View style={styles.listContainer}>
                {cookingSkills.map((skill) => (
                  <TouchableOpacity
                    key={skill}
                    onPress={() => handleSingleSelect('cookingSkill', skill)}
                    style={[
                      styles.listOptionButton,
                      dietaryProfile.cookingSkill === skill && styles.listOptionButtonSelectedOrange
                    ]}
                  >
                    <Text style={[
                      styles.optionButtonText,
                      dietaryProfile.cookingSkill === skill && styles.optionButtonTextSelected
                    ]}>
                      {skill}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Meal Preparation Time</Text>
              <View style={styles.listContainer}>
                {mealPreferences.map((pref) => (
                  <TouchableOpacity
                    key={pref}
                    onPress={() => handleSingleSelect('mealPreference', pref)}
                    style={[
                      styles.listOptionButton,
                      dietaryProfile.mealPreference === pref && styles.listOptionButtonSelectedOrange
                    ]}
                  >
                    <Text style={[
                      styles.optionButtonText,
                      dietaryProfile.mealPreference === pref && styles.optionButtonTextSelected
                    ]}>
                      {pref}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>
      )
    },
    // Step 6: Setup Complete
    {
      title: "You're All Set!",
      subtitle: `${getUserFirstName()}, your personalized WellNoosh experience is ready`,
      icon: '✅',
      iconBg: '#3b82f6',
      content: (
        <View style={styles.completionContent}>
          <Text style={styles.completionTitle}>
            🎉 Your Smart Kitchen Awaits!
          </Text>
          <Text style={styles.completionDescription}>
            WellNoosh is now fully personalized with your dietary preferences, health goals, and cooking style. Next, we'll show you some delicious meal recommendations!
          </Text>
          <View style={styles.completionCards}>
            <View style={[styles.completionCard, styles.completionCardGreen]}>
              <Text style={styles.completionCardTitle}>
                ✅ Complete Health Profile
              </Text>
              <Text style={styles.completionCardText}>
                {dietaryProfile.dietStyle.length > 0 ? `${dietaryProfile.dietStyle.join(', ')} diet` : 'Diet preferences saved'}
              </Text>
            </View>
            <View style={[styles.completionCard, styles.completionCardBlue]}>
              <Text style={styles.completionCardTitle}>
                🎯 Personalized Goals
              </Text>
              <Text style={styles.completionCardText}>
                {dietaryProfile.healthGoals.length > 0 ? `${dietaryProfile.healthGoals.length} health goals set` : 'Health goals configured'}
              </Text>
            </View>
            <View style={[styles.completionCard, styles.completionCardPurple]}>
              <Text style={styles.completionCardTitle}>
                🍽️ Meal Discovery
              </Text>
              <Text style={styles.completionCardText}>Ready to discover your perfect meals</Text>
            </View>
          </View>
        </View>
      )
    }
  ];

  const totalSteps = onboardingSteps.length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handlePrevious}
          disabled={currentStep === 0}
          style={[styles.navButton, currentStep === 0 && styles.navButtonDisabled]}
        >
          <Text style={[styles.navButtonText, currentStep === 0 && styles.navButtonTextDisabled]}>‹</Text>
        </TouchableOpacity>
        
        <View style={styles.centerHeader}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>W</Text>
          </View>
          <View style={styles.progressContainer}>
            {Array.from({ length: totalSteps }).map((_, index) => (
              <View
                key={index}
                style={[
                  styles.progressDot,
                  index === currentStep && styles.progressDotActive,
                  index < currentStep && styles.progressDotCompleted
                ]}
              />
            ))}
          </View>
        </View>
        
        {currentStep < totalSteps - 1 && (
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>
        )}
        
        {currentStep === totalSteps - 1 && <View style={styles.spacer} />}
      </View>

      {/* Step Content */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.contentContainer}>
          <View style={styles.titleSection}>
            <View style={[styles.iconContainer, { backgroundColor: onboardingSteps[currentStep].iconBg }]}>
              <Text style={styles.iconText}>{onboardingSteps[currentStep].icon}</Text>
            </View>
            <Text style={styles.title}>
              {onboardingSteps[currentStep].title}
            </Text>
            <Text style={styles.subtitle}>
              {onboardingSteps[currentStep].subtitle}
            </Text>
          </View>

          {onboardingSteps[currentStep].content}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity onPress={handleNext} style={styles.continueButton}>
          <Text style={styles.continueButtonText}>
            {currentStep === totalSteps - 1 ? 'Continue to Meal Discovery' : 'Continue'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  navButton: {
    padding: 8,
    width: 40,
    alignItems: 'center',
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  navButtonText: {
    fontSize: 24,
    color: '#374151',
    fontWeight: 'bold',
  },
  navButtonTextDisabled: {
    color: '#d1d5db',
  },
  centerHeader: {
    alignItems: 'center',
  },
  logo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logoText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#d1d5db',
  },
  progressDotActive: {
    backgroundColor: '#3b82f6',
    width: 24,
  },
  progressDotCompleted: {
    backgroundColor: '#10b981',
  },
  skipButton: {
    padding: 8,
    width: 40,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '500',
  },
  spacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  contentContainer: {
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconText: {
    fontSize: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  stepContent: {
    alignItems: 'center',
  },
  stepDescription: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  optionButton: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minWidth: 120,
  },
  optionButtonSelected: {
    backgroundColor: '#3b82f6',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  optionButtonSelectedRed: {
    backgroundColor: '#ef4444',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  optionButtonSelectedGreen: {
    backgroundColor: '#10b981',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  optionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
  },
  optionButtonTextSelected: {
    color: 'white',
  },
  listContainer: {
    gap: 8,
    width: '100%',
  },
  listOptionButton: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  listOptionButtonSelectedPurple: {
    backgroundColor: '#a855f7',
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  listOptionButtonSelectedBlue: {
    backgroundColor: '#3b82f6',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  listOptionButtonSelectedOrange: {
    backgroundColor: '#f97316',
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  customSection: {
    width: '100%',
    paddingTop: 16,
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  customSectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 12,
  },
  addCustomButton: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#dbeafe',
    borderWidth: 1,
    borderColor: '#93c5fd',
    alignItems: 'center',
  },
  addCustomButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2563eb',
  },
  customInputContainer: {
    gap: 12,
  },
  customInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  customInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    fontSize: 14,
  },
  customButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
  },
  addButton: {
    backgroundColor: '#10b981',
  },
  cancelButton: {
    backgroundColor: '#6b7280',
  },
  customButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  customInputHelp: {
    fontSize: 12,
    color: '#6b7280',
  },
  sectionContainer: {
    gap: 24,
    width: '100%',
  },
  section: {
    width: '100%',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  completionContent: {
    alignItems: 'center',
    gap: 32,
  },
  completionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  completionDescription: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  completionCards: {
    gap: 12,
    width: '100%',
  },
  completionCard: {
    padding: 16,
    borderRadius: 16,
  },
  completionCardGreen: {
    backgroundColor: '#dcfce7',
  },
  completionCardBlue: {
    backgroundColor: '#dbeafe',
  },
  completionCardPurple: {
    backgroundColor: '#f3e8ff',
  },
  completionCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 4,
  },
  completionCardText: {
    fontSize: 14,
    color: '#065f46',
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  continueButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});