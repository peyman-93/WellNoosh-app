import { useState, useEffect } from 'react';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock,
  Users,
  Target,
  Utensils,
  ChefHat,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Scale,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface MealPlan {
  id: string;
  date: string;
  meals: {
    breakfast?: { name: string; image: string; calories: number; time: string; };
    lunch?: { name: string; image: string; calories: number; time: string; };
    dinner?: { name: string; image: string; calories: number; time: string; };
  };
}

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
}

interface ScheduleScreenProps {
  userData: UserData | null;
  onUserDataUpdate: (userData: UserData) => void;
}

export function ScheduleScreen({ userData, onUserDataUpdate }: ScheduleScreenProps) {
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [showGoalReassessment, setShowGoalReassessment] = useState(false);
  const [showWeightUpdate, setShowWeightUpdate] = useState(false);
  const [showWeightGoal, setShowWeightGoal] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [currentGoalStep, setCurrentGoalStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentWeight, setCurrentWeight] = useState(userData?.weight || 70);
  const [weightGoal, setWeightGoal] = useState(70);
  const [dailyCalories, setDailyCalories] = useState(2000);
  const [currentBMI, setCurrentBMI] = useState(0);
  const [bmiFeedback, setBMiFeedback] = useState('');
  const [goalReassessmentData, setGoalReassessmentData] = useState({
    healthGoals: userData?.healthGoals || [],
    activityLevel: userData?.activityLevel || '',
    dietStyle: userData?.dietStyle || [],
    allergies: userData?.allergies || [],
    medicalConditions: userData?.medicalConditions || []
  });
  const [answers, setAnswers] = useState({
    dailyActivity: '',
    mealsPerDay: '',
    stomachComfort: ''
  });

  const [currentDate, setCurrentDate] = useState(new Date());
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([
    {
      id: '1',
      date: '2024-12-23',
      meals: {
        breakfast: {
          name: 'Avocado Toast Bowl',
          image: 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=200&h=150&fit=crop',
          calories: 380,
          time: '8:00 AM'
        },
        lunch: {
          name: 'Quinoa Buddha Bowl',
          image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&h=150&fit=crop',
          calories: 520,
          time: '1:00 PM'
        },
        dinner: {
          name: 'Herb-Crusted Salmon',
          image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=200&h=150&fit=crop',
          calories: 480,
          time: '7:30 PM'
        }
      }
    }
  ]);

  // Initialize current weight from userData
  useEffect(() => {
    if (userData?.weight) {
      setCurrentWeight(userData.weight);
      setWeightGoal(userData.weight);
      
      // Calculate initial BMI if height is available
      if (userData?.height) {
        const bmi = calculateBMI(userData.weight, userData.height, userData.heightUnit);
        setCurrentBMI(bmi);
        setBMiFeedback(getBMIFeedback(bmi, userData?.healthGoals || []));
      }
    }
  }, [userData]);

  // Calculate BMI and provide feedback
  const calculateBMI = (weight: number, height: number, heightUnit?: string) => {
    // Convert height to meters if needed
    let heightInMeters = height;
    if (heightUnit === 'ft') {
      heightInMeters = height * 0.3048; // Convert feet to meters
    } else if (heightUnit === 'cm') {
      heightInMeters = height / 100; // Convert cm to meters
    }
    
    const bmi = weight / (heightInMeters * heightInMeters);
    return Math.round(bmi * 10) / 10; // Round to 1 decimal place
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { category: 'Underweight', color: 'text-blue-600', bgColor: 'bg-blue-50' };
    if (bmi < 25) return { category: 'Normal weight', color: 'text-green-600', bgColor: 'bg-green-50' };
    if (bmi < 30) return { category: 'Overweight', color: 'text-orange-600', bgColor: 'bg-orange-50' };
    return { category: 'Obese', color: 'text-red-600', bgColor: 'bg-red-50' };
  };

  const getBMIFeedback = (bmi: number, healthGoals: string[]) => {
    const category = getBMICategory(bmi);
    
    if (bmi < 18.5) {
      if (healthGoals.includes('Gain Weight')) {
        return "Great! Your goal aligns with gaining healthy weight. Focus on nutrient-dense, calorie-rich foods.";
      }
      return "Consider focusing on healthy weight gain with balanced nutrition and strength training.";
    }
    
    if (bmi >= 18.5 && bmi < 25) {
      return "Excellent! You're in the healthy weight range. Maintain with balanced nutrition and regular activity.";
    }
    
    if (bmi >= 25 && bmi < 30) {
      if (healthGoals.includes('Lose Weight')) {
        return "Good choice! Gradual weight loss through balanced nutrition and exercise will help you reach a healthier range.";
      }
      return "Consider focusing on portion control and increasing physical activity for optimal health.";
    }
    
    if (healthGoals.includes('Lose Weight')) {
      return "Excellent goal! A structured approach with proper nutrition and exercise can significantly improve your health.";
    }
    return "Consider consulting with a healthcare provider for a personalized weight management plan.";
  };

  // Calculate daily calories based on user data
  const calculateDailyCalories = (weight: number, height: number, age: number, gender: string, activityLevel: string, goal: string[]) => {
    // Harris-Benedict Equation
    let bmr = 0;
    if (gender === 'male') {
      bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
    } else {
      bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
    }
    
    // Activity multiplier
    let activityMultiplier = 1.2; // Sedentary
    if (activityLevel?.includes('Lightly Active')) activityMultiplier = 1.375;
    else if (activityLevel?.includes('Moderately Active')) activityMultiplier = 1.55;
    else if (activityLevel?.includes('Very Active')) activityMultiplier = 1.725;
    else if (activityLevel?.includes('Extremely Active')) activityMultiplier = 1.9;
    
    let totalCalories = bmr * activityMultiplier;
    
    // Adjust for goals
    if (goal.includes('Lose Weight')) {
      totalCalories -= 500; // 500 calorie deficit for 1lb/week loss
    } else if (goal.includes('Gain Weight')) {
      totalCalories += 500; // 500 calorie surplus for 1lb/week gain
    }
    
    return Math.round(totalCalories);
  };

  // Goal reassessment steps
  const goalReassessmentSteps = [
    {
      title: "Update Your Health Goals",
      subtitle: "What are your current health objectives?",
      field: 'healthGoals',
      options: [
        'Lose Weight', 'Gain Weight', 'Maintain Weight', 'Build Muscle',
        'Improve Energy', 'Better Digestion', 'Reduce Inflammation',
        'Heart Health', 'Better Sleep', 'General Wellness'
      ],
      multiSelect: true
    },
    {
      title: "Activity Level",
      subtitle: "How active are you currently?",
      field: 'activityLevel',
      options: [
        'Sedentary (little/no exercise)',
        'Lightly Active (light exercise 1-3 days/week)',
        'Moderately Active (moderate exercise 3-5 days/week)',
        'Very Active (hard exercise 6-7 days/week)',
        'Extremely Active (very hard exercise, physical job)'
      ],
      multiSelect: false
    },
    {
      title: "Diet Style",
      subtitle: "Any changes to your dietary preferences?",
      field: 'dietStyle',
      options: [
        'Balanced', 'Omnivore', 'Vegetarian', 'Vegan', 'Pescatarian', 'Keto', 'Paleo', 
        'Mediterranean', 'Low Carb', 'Gluten-Free', 'Dairy-Free'
      ],
      multiSelect: true
    }
  ];

  const questions = [
    {
      id: 'dailyActivity',
      question: 'How do you typically spend your day?',
      subtitle: 'Choose what takes up most of your time.',
      options: [
        'Sitting all day long at work',
        'I\'m always on my feet',
        'Doing lots of physical activity',
        'Staying at home'
      ]
    },
    {
      id: 'mealsPerDay',
      question: 'How many meals a day would you like to have?',
      subtitle: 'You can always change it in settings later',
      options: [
        { label: 'Two', description: 'Breakfast, dinner, optional snacks' },
        { label: 'Three', description: 'Breakfast, lunch, and dinner' },
        { label: 'Four', description: 'Breakfast, snack, lunch, and dinner' },
        { label: 'Five', description: 'Breakfast, lunch, dinner, and two snacks' }
      ]
    },
    {
      id: 'stomachComfort',
      question: 'Do you experience stomach discomfort during the day?',
      subtitle: 'Some people may feel bloated, have stomach cramps or indigestion after eating certain foods or during stressful situations',
      options: [
        'Yes',
        'No',
        'I am not sure'
      ]
    }
  ];

  const handleGoalReassessmentStart = () => {
    setShowGoalReassessment(true);
    setCurrentGoalStep(0);
  };

  const handleGoalReassessmentAnswer = (field: string, value: string, isMultiSelect: boolean) => {
    if (isMultiSelect) {
      setGoalReassessmentData(prev => ({
        ...prev,
        [field]: prev[field as keyof typeof prev].includes(value)
          ? (prev[field as keyof typeof prev] as string[]).filter(item => item !== value)
          : [...(prev[field as keyof typeof prev] as string[]), value]
      }));
    } else {
      setGoalReassessmentData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleGoalReassessmentNext = () => {
    if (currentGoalStep < goalReassessmentSteps.length - 1) {
      setCurrentGoalStep(prev => prev + 1);
    } else {
      // Move to weight update
      setShowGoalReassessment(false);
      setShowWeightUpdate(true);
    }
  };

  const handleWeightUpdate = () => {
    setShowWeightUpdate(false);
    setShowWeightGoal(true);
  };

  const validateWeightGoal = (goal: number): boolean => {
    const healthGoals = goalReassessmentData.healthGoals;
    
    if (healthGoals.includes('Lose Weight') && goal >= currentWeight) {
      return false;
    }
    if (healthGoals.includes('Gain Weight') && goal <= currentWeight) {
      return false;
    }
    if (healthGoals.includes('Maintain Weight') && Math.abs(goal - currentWeight) > 5) {
      return false;
    }
    
    return true;
  };

  const handleWeightGoalComplete = () => {
    if (!validateWeightGoal(weightGoal)) {
      return;
    }

    // Calculate daily calories
    const age = userData?.age || 30;
    const height = userData?.height || 170;
    const gender = userData?.gender || 'female';
    const activityLevel = goalReassessmentData.activityLevel;
    const healthGoals = goalReassessmentData.healthGoals;
    
    const calculatedCalories = calculateDailyCalories(currentWeight, height, age, gender, activityLevel, healthGoals);
    setDailyCalories(calculatedCalories);

    // Calculate BMI and feedback
    const bmi = calculateBMI(currentWeight, height, userData?.heightUnit);
    setCurrentBMI(bmi);
    setBMiFeedback(getBMIFeedback(bmi, healthGoals));

    // Update user data
    const updatedUserData = {
      ...userData!,
      weight: currentWeight,
      ...goalReassessmentData
    };
    onUserDataUpdate(updatedUserData);

    setShowWeightGoal(false);
    setShowQuestionnaire(true);
  };

  const handleAnswer = (answer: string | { label: string; description: string }) => {
    const questionId = questions[currentQuestion].id;
    const answerValue = typeof answer === 'string' ? answer : answer.label;
    setAnswers(prev => ({ ...prev, [questionId]: answerValue }));
    
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      // Generate meal plan
      setIsGenerating(true);
      setTimeout(() => {
        generateMealPlan();
        setIsGenerating(false);
        setShowQuestionnaire(false);
        setCurrentQuestion(0);
      }, 3000);
    }
  };

  const generateMealPlan = () => {
    const week = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const mealPlan: MealPlan = {
        id: Date.now() + i.toString(),
        date: date.toISOString().split('T')[0],
        meals: {
          breakfast: {
            name: 'Protein Smoothie Bowl',
            image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=200&h=150&fit=crop',
            calories: 350,
            time: '8:00 AM'
          },
          lunch: {
            name: 'Mediterranean Wrap',
            image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=200&h=150&fit=crop',
            calories: 450,
            time: '1:00 PM'
          },
          dinner: {
            name: 'Grilled Chicken & Veggies',
            image: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=200&h=150&fit=crop',
            calories: 520,
            time: '7:30 PM'
          }
        }
      };
      
      week.push(mealPlan);
    }
    
    setMealPlans(week);
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2"></div>);
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dateString = date.toISOString().split('T')[0];
      const hasMeals = mealPlans.some(plan => plan.date === dateString);
      const isToday = dateString === new Date().toISOString().split('T')[0];
      
      days.push(
        <div key={day} className={`p-2 text-center ${isToday ? 'bg-blue-100 rounded-lg' : ''}`}>
          <div className={`w-8 h-8 mx-auto flex items-center justify-center rounded-full text-sm ${
            hasMeals ? 'bg-green-500 text-white font-semibold' : 'text-gray-700'
          }`}>
            {day}
          </div>
          {hasMeals && (
            <div className="w-1 h-1 bg-green-500 rounded-full mx-auto mt-1"></div>
          )}
        </div>
      );
    }
    
    return days;
  };

  // Goal Reassessment Flow
  if (showGoalReassessment) {
    const currentStep = goalReassessmentSteps[currentGoalStep];
    
    return (
      <div className="ios-scroll bg-gray-50 relative">
        <div className="bg-gradient-to-br from-green-500 to-blue-600 px-4 pt-6 pb-8">
          <div className="text-center text-white">
            <h1 className="text-2xl font-bold mb-2">Goal Check-In</h1>
            <p className="text-green-100">Let's make sure your goals are still aligned</p>
            <div className="flex items-center justify-center mt-4 space-x-2">
              {goalReassessmentSteps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    index <= currentGoalStep ? 'bg-white' : 'bg-white/30'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="px-4 pb-32 -mt-4">
          <div className="ios-card bg-white p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-green-500 to-blue-600 flex items-center justify-center mb-4">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2 font-body">
                {currentStep.title}
              </h2>
              <p className="text-gray-600 font-body">{currentStep.subtitle}</p>
            </div>

            <div className={`grid ${currentStep.multiSelect ? 'grid-cols-2' : 'grid-cols-1'} gap-3`}>
              {currentStep.options.map((option, index) => {
                const isSelected = currentStep.multiSelect 
                  ? goalReassessmentData[currentStep.field as keyof typeof goalReassessmentData].includes(option)
                  : goalReassessmentData[currentStep.field as keyof typeof goalReassessmentData] === option;
                
                return (
                  <button
                    key={index}
                    onClick={() => handleGoalReassessmentAnswer(currentStep.field, option, currentStep.multiSelect)}
                    className={`p-3 text-sm font-medium rounded-xl transition-all ios-button ${
                      isSelected
                        ? 'bg-gradient-to-r from-green-500 to-blue-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 border border-gray-200'
                    } ${currentStep.multiSelect ? '' : 'text-left'}`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleGoalReassessmentNext}
              className="w-full mt-6 p-4 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-xl font-medium ios-button"
            >
              {currentGoalStep === goalReassessmentSteps.length - 1 ? 'Continue' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Weight Update Flow
  if (showWeightUpdate) {
    return (
      <div className="ios-scroll bg-gray-50 relative">
        <div className="bg-gradient-to-br from-blue-500 to-purple-600 px-4 pt-6 pb-8">
          <div className="text-center text-white">
            <h1 className="text-2xl font-bold mb-2">Weight Update</h1>
            <p className="text-blue-100">Let's update your current weight</p>
          </div>
        </div>

        <div className="px-4 pb-32 -mt-4">
          <div className="ios-card bg-white p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center mb-4">
                <Scale className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2 font-body">
                Current Weight
              </h2>
              <p className="text-gray-600 font-body">
                Your last recorded weight was {userData?.weight || 'not set'} {userData?.weightUnit || 'kg'}
              </p>
            </div>

            <div className="space-y-6">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-4 mb-4">
                  <button
                    onClick={() => setCurrentWeight(Math.max(30, currentWeight - 0.5))}
                    className="ios-button w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center"
                  >
                    <Minus className="w-5 h-5 text-gray-600" />
                  </button>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-gray-900">{currentWeight}</div>
                    <div className="text-gray-600">{userData?.weightUnit || 'kg'}</div>
                  </div>
                  <button
                    onClick={() => setCurrentWeight(currentWeight + 0.5)}
                    className="ios-button w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center"
                  >
                    <Plus className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>

              <button
                onClick={handleWeightUpdate}
                className="w-full p-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium ios-button"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Weight Goal Flow
  if (showWeightGoal) {
    const isValidGoal = validateWeightGoal(weightGoal);
    const goalDifference = Math.abs(weightGoal - currentWeight);
    const isLosing = goalDifference > 0 && weightGoal < currentWeight;
    const isGaining = goalDifference > 0 && weightGoal > currentWeight;
    
    return (
      <div className="ios-scroll bg-gray-50 relative">
        <div className="bg-gradient-to-br from-purple-500 to-pink-600 px-4 pt-6 pb-8">
          <div className="text-center text-white">
            <h1 className="text-2xl font-bold mb-2">Weight Goal</h1>
            <p className="text-purple-100">Set your target weight based on your goals</p>
          </div>
        </div>

        <div className="px-4 pb-32 -mt-4">
          <div className="ios-card bg-white p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center mb-4">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2 font-body">
                Target Weight
              </h2>
              <p className="text-gray-600 font-body">
                Current: {currentWeight} {userData?.weightUnit || 'kg'}
              </p>
            </div>

            <div className="space-y-6">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-4 mb-4">
                  <button
                    onClick={() => setWeightGoal(Math.max(30, weightGoal - 0.5))}
                    className="ios-button w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center"
                  >
                    <Minus className="w-5 h-5 text-gray-600" />
                  </button>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-gray-900">{weightGoal}</div>
                    <div className="text-gray-600">{userData?.weightUnit || 'kg'}</div>
                  </div>
                  <button
                    onClick={() => setWeightGoal(weightGoal + 0.5)}
                    className="ios-button w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center"
                  >
                    <Plus className="w-5 h-5 text-gray-600" />
                  </button>
                </div>

                {goalDifference > 0 && (
                  <div className="flex items-center justify-center space-x-2 mb-4">
                    {isLosing ? (
                      <TrendingDown className="w-5 h-5 text-red-500" />
                    ) : (
                      <TrendingUp className="w-5 h-5 text-green-500" />
                    )}
                    <span className={`font-medium ${isLosing ? 'text-red-600' : 'text-green-600'}`}>
                      {isLosing ? 'Lose' : 'Gain'} {goalDifference} {userData?.weightUnit || 'kg'}
                    </span>
                  </div>
                )}
              </div>

              {!isValidGoal && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-red-800 font-body">Goal Mismatch</h4>
                      <p className="text-red-600 text-sm mt-1 font-body">
                        {goalReassessmentData.healthGoals.includes('Lose Weight') && weightGoal >= currentWeight &&
                          "Your weight goal should be lower than your current weight for weight loss."}
                        {goalReassessmentData.healthGoals.includes('Gain Weight') && weightGoal <= currentWeight &&
                          "Your weight goal should be higher than your current weight for weight gain."}
                        {goalReassessmentData.healthGoals.includes('Maintain Weight') && Math.abs(weightGoal - currentWeight) > 5 &&
                          "For weight maintenance, your goal should be within 5kg of your current weight."}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={handleWeightGoalComplete}
                disabled={!isValidGoal}
                className={`w-full p-4 rounded-xl font-medium ios-button ${
                  isValidGoal
                    ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Calculate Meal Plan
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showQuestionnaire) {
    return (
      <div className="ios-scroll bg-gray-50 relative">
        {/* Questionnaire Header */}
        <div className="bg-gradient-to-br from-blue-500 to-purple-600 px-4 pt-6 pb-8">
          <div className="text-center text-white">
            <h1 className="text-2xl font-bold mb-2">Meal Planning</h1>
            <p className="text-blue-100">Let's Personalize Your Meal Schedule</p>
            <div className="flex items-center justify-center mt-4 space-x-2">
              {questions.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    index <= currentQuestion ? 'bg-white' : 'bg-white/30'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="px-4 pb-32 -mt-4">
          {!isGenerating ? (
            <div className="ios-card bg-white p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center mb-4">
                  <span className="text-white text-xl font-bold">{currentQuestion + 1}</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2 font-body">
                  {questions[currentQuestion].question}
                </h2>
                <p className="text-gray-600 font-body">
                  {questions[currentQuestion].subtitle || 'Choose the Option that Best Fits You'}
                </p>
              </div>

              <div className="space-y-3">
                {questions[currentQuestion].options.map((option, index) => {
                  const isObjectOption = typeof option === 'object';
                  const displayText = isObjectOption ? option.label : option;
                  const descriptionText = isObjectOption ? option.description : '';
                  
                  return (
                    <button
                      key={index}
                      onClick={() => handleAnswer(option)}
                      className="w-full p-4 text-left border-2 border-gray-200 rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition-all active:scale-95"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900 font-body">{displayText}</div>
                          {descriptionText && (
                            <div className="text-sm text-gray-600 mt-1 font-body">{descriptionText}</div>
                          )}
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="ios-card bg-white p-8 text-center">
              <div className="mb-6">
                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-green-500 to-blue-600 flex items-center justify-center animate-pulse">
                  <ChefHat className="w-10 h-10 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Creating Your Meal Plan</h3>
              <p className="text-gray-600 mb-4">
                Our AI is Analyzing Your Preferences and Creating Personalized Meal Recommendations...
              </p>
              <div className="flex justify-center space-x-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="ios-scroll bg-gray-50 relative">
      {/* Header */}
      <div className="bg-white px-4 py-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Meal Schedule</h1>
          <button
            onClick={handleGoalReassessmentStart}
            className="ios-button bg-gradient-to-r from-green-500 to-blue-600 text-white px-4 py-2 rounded-xl flex items-center space-x-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>New Plan</span>
          </button>
        </div>

        {/* Calendar Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
            className="p-2 rounded-full bg-gray-100 active:bg-gray-200"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h2 className="text-lg font-semibold text-gray-900">{formatDate(currentDate)}</h2>
          <button 
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
            className="p-2 rounded-full bg-gray-100 active:bg-gray-200"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
          {renderCalendar()}
        </div>
      </div>

      <div className="px-4 pb-32">
        {/* Personalized Nutrition Summary */}
        {mealPlans.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Your Nutrition Plan</h3>
            <div className="ios-card bg-gradient-to-r from-green-50 to-blue-50 p-4 border border-green-200">
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl mb-1">🎯</div>
                  <div className="text-sm font-semibold text-green-800">Daily Calories</div>
                  <div className="text-xs text-green-600">{dailyCalories} cal</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-1">⚖️</div>
                  <div className="text-sm font-semibold text-blue-800">Weight Goal</div>
                  <div className="text-xs text-blue-600">{weightGoal} {userData?.weightUnit || 'kg'}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-1">📊</div>
                  <div className="text-sm font-semibold text-purple-800">BMI</div>
                  <div className="text-xs text-purple-600">{currentBMI || 'Not calculated'}</div>
                </div>
              </div>
              
              {/* BMI Feedback */}
              {currentBMI > 0 && bmiFeedback && (
                <div className={`p-3 rounded-xl mb-4 ${getBMICategory(currentBMI).bgColor}`}>
                  <div className="flex items-start space-x-2">
                    <div className="flex-shrink-0">
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${getBMICategory(currentBMI).color} bg-white`}>
                        {getBMICategory(currentBMI).category}
                      </div>
                    </div>
                    <p className={`text-sm font-body ${getBMICategory(currentBMI).color}`}>
                      {bmiFeedback}
                    </p>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-3 gap-4 text-center border-t border-gray-200 pt-3">
                <div>
                  <div className="text-lg mb-1">⏰</div>
                  <div className="text-xs font-semibold text-blue-800">Weekdays</div>
                  <div className="text-xs text-blue-600">30-45 min</div>
                </div>
                <div>
                  <div className="text-lg mb-1">🏖️</div>
                  <div className="text-xs font-semibold text-purple-800">Weekends</div>
                  <div className="text-xs text-purple-600">60+ min</div>
                </div>
                <div>
                  <div className="text-lg mb-1">🏃‍♂️</div>
                  <div className="text-xs font-semibold text-orange-800">Busy Days</div>
                  <div className="text-xs text-orange-600">15-30 min</div>
                </div>
              </div>
              <div className="mt-3 text-center">
                <button 
                  onClick={handleGoalReassessmentStart}
                  className="ios-button text-green-600 text-sm font-medium"
                >
                  Update Goals & Calories
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Today's Meals */}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Today's Meals</h3>
          
          {mealPlans.length === 0 ? (
            <div className="ios-card bg-white p-8 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <Calendar className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">No meal plan yet</h3>
              <p className="text-gray-600 mb-4">Start by creating your personalized meal schedule</p>
              <Button
                onClick={handleGoalReassessmentStart}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Meal Plan
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {mealPlans[0]?.meals && Object.entries(mealPlans[0].meals).map(([mealType, meal]) => (
                <div key={mealType} className="ios-card bg-white p-4">
                  <div className="flex items-center space-x-4">
                    <ImageWithFallback
                      src={meal.image}
                      alt={meal.name}
                      className="w-16 h-16 rounded-xl object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <Badge variant="secondary" className="capitalize">
                          {mealType}
                        </Badge>
                        <span className="text-sm text-gray-500">{meal.time}</span>
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-1">{meal.name}</h4>
                      <p className="text-sm text-gray-600">{meal.calories} calories</p>
                    </div>
                    <button className="ios-button bg-green-100 text-green-600 px-4 py-2 rounded-xl">
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Weekly Overview */}
        {mealPlans.length > 0 && (
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">This Week</h3>
            <div className="space-y-3">
              {mealPlans.slice(0, 7).map((plan, index) => {
                const date = new Date(plan.date);
                const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                const dayNumber = date.getDate();
                const mealCount = Object.keys(plan.meals).length;
                
                return (
                  <div key={plan.id} className="ios-card bg-white p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <div className="text-sm font-medium text-gray-500">{dayName}</div>
                          <div className="text-xl font-bold text-gray-900">{dayNumber}</div>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{mealCount} meals planned</div>
                          <div className="text-sm text-gray-600">
                            {Object.values(plan.meals).reduce((total, meal) => total + meal.calories, 0)} total calories
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}