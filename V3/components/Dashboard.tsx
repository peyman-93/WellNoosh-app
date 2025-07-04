import { useState, useEffect } from 'react';
import { 
  ChefHat,
  Calendar,
  Scan,
  Bot,
  ShoppingBag,
  Camera,
  ImageIcon,
  Mic,
  ArrowRight,
  Heart,
  Clock,
  Star,
  BookmarkPlus,
  Droplets,
  Trophy,
  Target,
  Scale,
  Brain,
  Moon,
  Zap,
  Utensils,
  Coffee,
  Apple,
  Soup,
  Sandwich,
  ChevronDown,
  ChevronUp,
  MapPin,
  Timer,
  Users,
  Wind,
} from 'lucide-react';

import { DailyCheckIn } from './DailyCheckIn';
import { ImageWithFallback } from './figma/ImageWithFallback';
import wellnooshIcon from 'figma:asset/4b28c64338ad95e8eae91615fbda6a4e2cc3d398.png';

interface CookedRecipe {
  id: string;
  name: string;
  image: string;
  cookedDate: string;
  rating?: number;
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
  cookedRecipes?: CookedRecipe[];
  waterIntake?: {
    date: string;
    glasses: boolean[];
    dailyGoal: number;
  };
  dailyCheckIn?: {
    date: string;
    weight?: number;
    mood?: number; // 1-10 scale
    stress?: number; // 1-10 scale
    sleep?: number; // 1-10 scale
    energyLevels?: {
      '7am'?: number;
      '11am'?: number;
      '2pm'?: number;
      '5pm'?: number;
      '8pm'?: number;
      '10pm'?: number;
      '12am'?: number;
    };
    mealTimes?: {
      breakfast?: string;
      lunch?: string;
      dinner?: string;
      snacks?: string[];
    };
  };
  cookingTimePreferences?: {
    weekdays?: string;
    weekends?: string;
    busyDays?: string;
  };
}

interface DashboardProps {
  onNavigateToProfile: () => void;
  onNavigateToTab: (tab: string) => void;
  isFirstLogin: boolean;
  onWelcomeComplete: () => void;
  userData: UserData | null;
}

export function Dashboard({ 
  onNavigateToProfile, 
  onNavigateToTab, 
  isFirstLogin, 
  onWelcomeComplete,
  userData 
}: DashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [waterIntake, setWaterIntake] = useState<boolean[]>(Array(10).fill(false));
  const [breathingExercises, setBreathingExercises] = useState<boolean[]>(Array(6).fill(false));
  const [showBreathingGuide, setShowBreathingGuide] = useState(false);
  const [breathingCycle, setBreathingCycle] = useState(0);
  const [breathingPhase, setBreathingPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [lastResetDate, setLastResetDate] = useState(new Date().toDateString());
  const [showDailyCheckIn, setShowDailyCheckIn] = useState(false);
  const [showMealHub, setShowMealHub] = useState(false);

  const [showDailyCheckInForm, setShowDailyCheckInForm] = useState(false);
  const [dailyCheckInData, setDailyCheckInData] = useState({
    weight: 72.5,
    mood: 8,
    stress: 3,
    sleep: 7.5,
    energyLevels: {
      '7am': 7,
      '11am': 8,
      '2pm': 6,
      '5pm': 7,
      '8pm': 6,
      '10pm': 4,
      '12am': 3
    },
    mealTimes: {
      breakfast: '08:30',
      lunch: '13:15',
      dinner: '19:45'
    }
  });

  // Initialize water tracking and breathing exercises on component mount
  useEffect(() => {
    const today = new Date().toDateString();
    const storedUserData = localStorage.getItem('wellnoosh_user_data');
    
    if (storedUserData) {
      const parsedData = JSON.parse(storedUserData);
      const waterData = parsedData.waterIntake;
      const breathingData = parsedData.breathingExercises;
      
      if (waterData && waterData.date === today) {
        // Load today's water intake
        setWaterIntake(waterData.glasses);
      } else {
        // Reset for new day
        const newIntake = Array(10).fill(false);
        setWaterIntake(newIntake);
        
        // Update localStorage with new day's data
        const updatedUserData = {
          ...parsedData,
          waterIntake: {
            date: today,
            glasses: newIntake,
            dailyGoal: 10
          }
        };
        localStorage.setItem('wellnoosh_user_data', JSON.stringify(updatedUserData));
      }

      if (breathingData && breathingData.date === today) {
        // Load today's breathing exercises
        setBreathingExercises(breathingData.exercises);
      } else {
        // Reset for new day
        const newExercises = Array(6).fill(false);
        setBreathingExercises(newExercises);
        
        // Update localStorage with new day's data
        const storedData = localStorage.getItem('wellnoosh_user_data');
        if (storedData) {
          const parsedStoredData = JSON.parse(storedData);
          const updatedUserData = {
            ...parsedStoredData,
            breathingExercises: {
              date: today,
              exercises: newExercises,
              dailyGoal: 6
            }
          };
          localStorage.setItem('wellnoosh_user_data', JSON.stringify(updatedUserData));
        }
      }
    }
    
    setLastResetDate(today);
  }, []);

  // Handle glass click
  const handleGlassClick = (index: number) => {
    const newIntake = [...waterIntake];
    newIntake[index] = !newIntake[index];
    setWaterIntake(newIntake);
    
    // Update localStorage
    const storedUserData = localStorage.getItem('wellnoosh_user_data');
    if (storedUserData) {
      const parsedData = JSON.parse(storedUserData);
      const updatedUserData = {
        ...parsedData,
        waterIntake: {
          date: new Date().toDateString(),
          glasses: newIntake,
          dailyGoal: 10
        }
      };
      localStorage.setItem('wellnoosh_user_data', JSON.stringify(updatedUserData));
    }
  };



  // Handle breathing exercise circle click
  const handleBreathingCircleClick = (index: number) => {
    const newExercises = [...breathingExercises];
    newExercises[index] = !newExercises[index];
    setBreathingExercises(newExercises);
    
    // Update localStorage
    const storedUserData = localStorage.getItem('wellnoosh_user_data');
    if (storedUserData) {
      const parsedData = JSON.parse(storedUserData);
      const updatedUserData = {
        ...parsedData,
        breathingExercises: {
          date: new Date().toDateString(),
          exercises: newExercises,
          dailyGoal: 6
        }
      };
      localStorage.setItem('wellnoosh_user_data', JSON.stringify(updatedUserData));
    }
  };

  // Start breathing guide
  const startBreathingGuide = () => {
    setShowBreathingGuide(true);
    setBreathingCycle(0);
    setBreathingPhase('inhale');
    
    // Start breathing cycle
    const runBreathingCycle = (cycleCount: number) => {
      if (cycleCount >= 5) {
        // Complete the breathing exercise
        setTimeout(() => {
          setShowBreathingGuide(false);
          addBreathingExercise();
        }, 1000);
        return;
      }
      
      // Inhale phase (4 seconds)
      setBreathingPhase('inhale');
      setTimeout(() => {
        // Hold phase (2 seconds)
        setBreathingPhase('hold');
        setTimeout(() => {
          // Exhale phase (4 seconds)
          setBreathingPhase('exhale');
          setTimeout(() => {
            setBreathingCycle(cycleCount + 1);
            runBreathingCycle(cycleCount + 1);
          }, 4000);
        }, 2000);
      }, 4000);
    };
    
    runBreathingCycle(0);
  };

  // Add breathing exercise automatically after guide
  const addBreathingExercise = () => {
    const currentExercises = [...breathingExercises];
    const nextEmptyIndex = currentExercises.findIndex(exercise => !exercise);
    
    if (nextEmptyIndex !== -1) {
      currentExercises[nextEmptyIndex] = true;
      setBreathingExercises(currentExercises);
      
      // Update localStorage
      const storedUserData = localStorage.getItem('wellnoosh_user_data');
      if (storedUserData) {
        const parsedData = JSON.parse(storedUserData);
        const updatedUserData = {
          ...parsedData,
          breathingExercises: {
            date: new Date().toDateString(),
            exercises: currentExercises,
            dailyGoal: 6
          }
        };
        localStorage.setItem('wellnoosh_user_data', JSON.stringify(updatedUserData));
      }
    }
  };

  // Calculate water intake stats
  const completedGlasses = waterIntake.filter(Boolean).length;

  // Calculate breathing exercises stats
  const completedBreathingExercises = breathingExercises.filter(Boolean).length;
  const breathingPercentage = (completedBreathingExercises / 6) * 100;

  // Energy tracking times
  const energyTimes = [
    { key: '7am', label: '7 AM', icon: '🌅' },
    { key: '11am', label: '11 AM', icon: '☀️' },
    { key: '2pm', label: '2 PM', icon: '🌞' },
    { key: '5pm', label: '5 PM', icon: '🌇' },
    { key: '8pm', label: '8 PM', icon: '🌆' },
    { key: '10pm', label: '10 PM', icon: '🌙' },
    { key: '12am', label: '12 AM', icon: '🌃' }
  ];

  // Handle daily check-in save
  const handleDailyCheckInSave = (data: any) => {
    setDailyCheckInData(data);
    // Save to localStorage or send to API
    localStorage.setItem('wellnoosh_daily_checkin', JSON.stringify(data));
  };

  // Mock meal suggestions based on time/type
  const getMealSuggestions = (type: string) => {
    const suggestions = {
      breakfast: [
        { name: 'Avocado Toast', time: '10 min', calories: '320 cal', image: 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=150&h=100&fit=crop' },
        { name: 'Greek Yogurt Bowl', time: '5 min', calories: '280 cal', image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=150&h=100&fit=crop' },
        { name: 'Smoothie Bowl', time: '8 min', calories: '350 cal', image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=150&h=100&fit=crop' }
      ],
      lunch: [
        { name: 'Quinoa Buddha Bowl', time: '15 min', calories: '520 cal', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=150&h=100&fit=crop' },
        { name: 'Mediterranean Wrap', time: '10 min', calories: '450 cal', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=150&h=100&fit=crop' },
        { name: 'Asian Salad', time: '12 min', calories: '380 cal', image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=150&h=100&fit=crop' }
      ],
      dinner: [
        { name: 'Herb-Crusted Salmon', time: '25 min', calories: '480 cal', image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=150&h=100&fit=crop' },
        { name: 'Chicken Stir Fry', time: '20 min', calories: '420 cal', image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=150&h=100&fit=crop' },
        { name: 'Veggie Pasta', time: '18 min', calories: '390 cal', image: 'https://images.unsplash.com/photo-1621996346565-e3dbc353d946?w=150&h=100&fit=crop' }
      ],
      snacks: [
        { name: 'Mixed Nuts', time: '0 min', calories: '180 cal', image: 'https://images.unsplash.com/photo-1599599810694-57a2ca8276a8?w=150&h=100&fit=crop' },
        { name: 'Fruit Bowl', time: '3 min', calories: '120 cal', image: 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=150&h=100&fit=crop' },
        { name: 'Protein Bar', time: '0 min', calories: '220 cal', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=150&h=100&fit=crop' }
      ],
      drinks: [
        { name: 'Green Smoothie', time: '5 min', calories: '150 cal', image: 'https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=150&h=100&fit=crop' },
        { name: 'Protein Shake', time: '3 min', calories: '200 cal', image: 'https://images.unsplash.com/photo-1594736797933-d0301ba171fe?w=150&h=100&fit=crop' },
        { name: 'Herbal Tea', time: '2 min', calories: '5 cal', image: 'https://images.unsplash.com/photo-1594631242320-f932e0162eb8?w=150&h=100&fit=crop' }
      ]
    };
    return suggestions[type as keyof typeof suggestions] || [];
  };

  // Get user's first name for personalized greeting
  const getUserFirstName = () => {
    if (!userData?.fullName) return 'there';
    return userData.fullName.split(' ')[0];
  };

  // Mock favorite recipes data - in real app would be fetched from backend
  const favoriteRecipes = [
    {
      id: '1',
      name: 'Mediterranean Quinoa Bowl',
      image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&h=150&fit=crop',
      rating: 4.8,
      cookTime: '25 min'
    },
    {
      id: '2',
      name: 'Honey Garlic Salmon',
      image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=200&h=150&fit=crop',
      rating: 4.9,
      cookTime: '20 min'
    },
    {
      id: '3',
      name: 'Thai Basil Chicken',
      image: 'https://images.unsplash.com/photo-1559847844-d724ce23f162?w=200&h=150&fit=crop',
      rating: 4.6,
      cookTime: '15 min'
    },
    {
      id: '4',
      name: 'Avocado Toast Deluxe',
      image: 'https://images.unsplash.com/photo-1541519277-68cf0eb07c10?w=200&h=150&fit=crop',
      rating: 4.4,
      cookTime: '10 min'
    }
  ];

  // Mock cooked recipes data - in real app would come from userData.cookedRecipes
  const cookedRecipes: CookedRecipe[] = userData?.cookedRecipes || [
    {
      id: '1',
      name: 'Creamy Mushroom Risotto',
      image: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=200&h=150&fit=crop',
      cookedDate: '2024-12-28',
      rating: 5
    },
    {
      id: '2',
      name: 'Moroccan Spiced Lamb',
      image: 'https://images.unsplash.com/photo-1574672280600-4accfa5b6f98?w=200&h=150&fit=crop',
      cookedDate: '2024-12-26',
      rating: 4
    },
    {
      id: '3',
      name: 'Italian Carbonara',
      image: 'https://images.unsplash.com/photo-1621996346565-e3dbc353d946?w=200&h=150&fit=crop',
      cookedDate: '2024-12-24',
      rating: 5
    },
    {
      id: '4',
      name: 'Greek Salad Bowl',
      image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=200&h=150&fit=crop',
      cookedDate: '2024-12-22',
      rating: 4
    }
  ];

  const formatCookingDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays} days ago`;
    if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-3 h-3 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };



  // Show DailyCheckIn form if active
  if (showDailyCheckInForm) {
    return (
      <DailyCheckIn 
        onClose={() => setShowDailyCheckInForm(false)}
        onSave={handleDailyCheckInSave}
      />
    );
  }

  // Show Breathing Guide if active
  if (showBreathingGuide) {
    const getPhaseText = () => {
      switch (breathingPhase) {
        case 'inhale': return 'Breathe in slowly...';
        case 'hold': return 'Hold...';
        case 'exhale': return 'Breathe out slowly...';
        default: return '';
      }
    };

    const getCircleScale = () => {
      switch (breathingPhase) {
        case 'inhale': return 'scale-125';
        case 'hold': return 'scale-125';
        case 'exhale': return 'scale-100';
        default: return 'scale-100';
      }
    };

    return (
      <div className="fixed inset-0 bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 flex items-center justify-center z-50">
        <div className="text-center p-8">
          {/* Breathing Circle Animation */}
          <div className="relative mb-8">
            <div className={`w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-green-400 to-emerald-600 transition-transform duration-4000 ease-in-out ${getCircleScale()} flex items-center justify-center shadow-lg`}>
              <Wind className="w-12 h-12 text-white" />
            </div>
            {/* Breathing rings */}
            <div className={`absolute inset-0 w-32 h-32 mx-auto rounded-full border-2 border-green-300 transition-transform duration-4000 ease-in-out ${breathingPhase === 'inhale' ? 'scale-150 opacity-30' : 'scale-110 opacity-50'}`} />
            <div className={`absolute inset-0 w-32 h-32 mx-auto rounded-full border border-green-200 transition-transform duration-4000 ease-in-out ${breathingPhase === 'inhale' ? 'scale-175 opacity-20' : 'scale-125 opacity-40'}`} />
          </div>

          {/* Breathing Instruction */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2 font-body">
              {getPhaseText()}
            </h2>
            <p className="text-gray-600 font-body">
              Cycle {breathingCycle + 1} of 5
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="flex justify-center gap-2 mb-8">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index <= breathingCycle ? 'bg-green-500' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          {/* Skip Button */}
          <button
            onClick={() => {
              setShowBreathingGuide(false);
              addBreathingExercise();
            }}
            className="text-gray-500 text-sm font-body hover:text-gray-700 transition-colors"
          >
            Skip exercise
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      {/* Header with centered WellNoosh branding */}
      <div className="p-6 bg-white/80 backdrop-blur-md border-b border-gray-200">
        {/* Centered WellNoosh branding */}
        <div className="text-center mb-6">
          <img src={wellnooshIcon} alt="WellNoosh" className="w-16 h-16 object-contain rounded-full wellnoosh-logo-large mx-auto mb-3" />
          <h1 className="text-2xl font-bold brand-title font-brand">WellNoosh</h1>
          <p className="text-gray-600 font-body">Welcome back, {getUserFirstName()}!</p>
        </div>

        {/* Profile button positioned absolutely */}
        <button
          onClick={onNavigateToProfile}
          className="absolute top-6 right-6 ios-button w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-blue-600 text-white shadow-lg flex items-center justify-center"
        >
          <span className="text-lg">👤</span>
        </button>

        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-green-100 to-green-200 p-3 rounded-xl text-center">
            <div className="text-lg font-bold text-green-800 font-body">{favoriteRecipes.length}</div>
            <div className="text-xs text-green-700 font-body">Favorites</div>
          </div>
          <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-3 rounded-xl text-center">
            <div className="text-lg font-bold text-blue-800 font-body">{cookedRecipes.length}</div>
            <div className="text-xs text-blue-700 font-body">Cooked</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto ios-scroll">
        <div className="p-6 space-y-6">


          {/* Compact Daily Water Tracker */}
          <div className="max-w-md mx-auto">
            <div className="bg-white/90 backdrop-blur-md rounded-xl p-4 shadow-soft border border-gray-100 relative">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Droplets className="w-5 h-5 text-blue-500" />
                  <h3 className="text-base font-semibold text-gray-900 font-body">Daily Hydration</h3>
                  {completedGlasses === 10 && (
                    <Trophy className="w-4 h-4 text-yellow-500" />
                  )}
                </div>
                <span className="text-sm font-medium text-gray-600 font-body">
                  {completedGlasses}/10
                </span>
              </div>
              
              {/* Compact Progress Bar */}
              <div className="mb-3">
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="bg-gradient-to-r from-blue-400 to-cyan-500 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${(completedGlasses / 10) * 100}%` }}
                  />
                </div>
              </div>

              {/* Horizontal Water Glasses Row */}
              <div className="flex gap-2 justify-center mb-3">
                {waterIntake.map((filled, index) => (
                  <button
                    key={index}
                    onClick={() => handleGlassClick(index)}
                    className={`ios-button w-8 h-10 rounded-lg border transition-all duration-200 flex items-center justify-center ${
                      filled 
                        ? 'bg-gradient-to-b from-blue-100 to-blue-300 border-blue-400 shadow-inner' 
                        : 'bg-white border-gray-300 hover:border-blue-300'
                    }`}
                  >
                    <div className={`transition-all duration-200 ${
                      filled ? 'text-blue-600' : 'text-gray-400'
                    }`}>
                      {filled ? (
                        <div className="relative">
                          <div className="w-4 h-6 bg-gradient-to-t from-blue-500 to-blue-300 rounded-b-md rounded-t-sm opacity-80" />
                          <div className="absolute top-0 w-4 h-0.5 bg-blue-200 rounded-t-sm" />
                        </div>
                      ) : (
                        <div className="w-4 h-6 border border-gray-400 rounded-b-md rounded-t-sm" />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* Compact Motivational Message */}
              <div className="text-center">
                {completedGlasses === 0 && (
                  <p className="text-xs text-gray-600 font-body">
                    💧 Start your day with water!
                  </p>
                )}
                {completedGlasses > 0 && completedGlasses < 5 && (
                  <p className="text-xs text-blue-600 font-body">
                    🌟 Great start! Keep going!
                  </p>
                )}
                {completedGlasses >= 5 && completedGlasses < 10 && (
                  <p className="text-xs text-blue-600 font-body">
                    💪 Almost there!
                  </p>
                )}
                {completedGlasses === 10 && (
                  <p className="text-xs font-semibold text-green-600 font-body">
                    🏆 Daily goal achieved!
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Deep Breathing Reminder Widget */}
          <div className="max-w-md mx-auto">
            <div className="bg-white/90 backdrop-blur-md rounded-xl p-4 shadow-soft border border-gray-100 relative">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Wind className="w-5 h-5 text-green-500" />
                  <h3 className="text-base font-semibold text-gray-900 font-body">Deep Breathing</h3>
                  {completedBreathingExercises === 6 && (
                    <Trophy className="w-4 h-4 text-yellow-500" />
                  )}
                </div>
                <span className="text-sm font-medium text-gray-600 font-body">
                  {completedBreathingExercises}/6
                </span>
              </div>
              
              {/* Compact Progress Bar */}
              <div className="mb-3">
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="bg-gradient-to-r from-green-400 to-emerald-500 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${breathingPercentage}%` }}
                  />
                </div>
              </div>

              {/* Main Breathing Action Button */}
              <button
                onClick={startBreathingGuide}
                className="ios-button w-full bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl p-4 mb-3 flex items-center justify-center gap-3 hover:shadow-sm transition-all"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                  <Wind className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-gray-800 font-body">
                    Take Deep Breaths
                  </div>
                  <div className="text-xs text-gray-600 font-body">
                    30-second guided breathing
                  </div>
                </div>
              </button>

              {/* Horizontal Breathing Circles Row */}
              <div className="flex gap-2 justify-center mb-3">
                {breathingExercises.map((completed, index) => (
                  <button
                    key={index}
                    onClick={() => handleBreathingCircleClick(index)}
                    className={`ios-button w-8 h-8 rounded-full border transition-all duration-200 flex items-center justify-center ${
                      completed 
                        ? 'bg-gradient-to-br from-green-100 to-emerald-300 border-green-400 shadow-inner' 
                        : 'bg-white border-gray-300 hover:border-green-300'
                    }`}
                  >
                    <div className={`transition-all duration-200 ${
                      completed ? 'text-green-600' : 'text-gray-400'
                    }`}>
                      {completed ? (
                        <div className="w-3 h-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full opacity-80" />
                      ) : (
                        <div className="w-3 h-3 border border-gray-400 rounded-full" />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* Compact Motivational Message */}
              <div className="text-center">
                {completedBreathingExercises === 0 && (
                  <p className="text-xs text-gray-600 font-body">
                    🌬️ Take a moment to breathe deeply
                  </p>
                )}
                {completedBreathingExercises > 0 && completedBreathingExercises < 3 && (
                  <p className="text-xs text-green-600 font-body">
                    🌟 Great start! Keep breathing mindfully
                  </p>
                )}
                {completedBreathingExercises >= 3 && completedBreathingExercises < 6 && (
                  <p className="text-xs text-green-600 font-body">
                    💚 You're doing amazing!
                  </p>
                )}
                {completedBreathingExercises === 6 && (
                  <p className="text-xs font-semibold text-emerald-600 font-body">
                    🏆 Daily breathing goal achieved!
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Actions - Standard Layout */}
          <div>
            <div className="max-w-md mx-auto">
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => onNavigateToTab('community')}
                  className="ios-button p-4 bg-white shadow-soft rounded-2xl flex items-center gap-3 text-left hover:shadow-elevated transition-all"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-600 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 font-body">Community</div>
                    <div className="text-sm text-gray-600 font-body">Join challenges</div>
                  </div>
                </button>

                <button
                  onClick={() => onNavigateToTab('scan')}
                  className="ios-button p-4 bg-white shadow-soft rounded-2xl flex items-center gap-3 text-left hover:shadow-elevated transition-all"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-600 rounded-xl flex items-center justify-center">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 font-body">Zero-Left Chief</div>
                    <div className="text-sm text-gray-600 font-body">Track your food</div>
                  </div>
                </button>

                <button
                  onClick={() => onNavigateToTab('schedule')}
                  className="ios-button p-4 bg-white shadow-soft rounded-2xl flex items-center gap-3 text-left hover:shadow-elevated transition-all"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-teal-600 rounded-xl flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 font-body">Meal Plan</div>
                    <div className="text-sm text-gray-600 font-body">Weekly schedule</div>
                  </div>
                </button>

                <button
                  onClick={() => onNavigateToTab('shop')}
                  className="ios-button p-4 bg-white shadow-soft rounded-2xl flex items-center gap-3 text-left hover:shadow-elevated transition-all"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-600 rounded-xl flex items-center justify-center">
                    <ShoppingBag className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 font-body">Groceries</div>
                    <div className="text-sm text-gray-600 font-body">Smart lists</div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Smart Daily Check-In Section */}
          <div className="max-w-md mx-auto">
            <div className="bg-white/90 backdrop-blur-md rounded-xl p-4 shadow-soft border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-pink-500" />
                  <h3 className="text-base font-semibold text-gray-900 font-body">Daily Check-In</h3>
                </div>
                <button
                  onClick={() => setShowDailyCheckIn(!showDailyCheckIn)}
                  className="ios-button p-1 rounded-lg hover:bg-gray-100"
                >
                  {showDailyCheckIn ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              {showDailyCheckIn && (
                <div className="space-y-4">
                  {/* Quick Health Metrics */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-3 text-center">
                      <Scale className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                      <div className="text-xs text-gray-600 font-body">Weight</div>
                      <div className="text-sm font-semibold text-blue-700">72.5 kg</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-3 text-center">
                      <Brain className="w-4 h-4 text-green-600 mx-auto mb-1" />
                      <div className="text-xs text-gray-600 font-body">Mood</div>
                      <div className="text-sm font-semibold text-green-700">8/10</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-3 text-center">
                      <Moon className="w-4 h-4 text-purple-600 mx-auto mb-1" />
                      <div className="text-xs text-gray-600 font-body">Sleep</div>
                      <div className="text-sm font-semibold text-purple-700">7.5/10</div>
                    </div>
                    <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-3 text-center">
                      <Zap className="w-4 h-4 text-orange-600 mx-auto mb-1" />
                      <div className="text-xs text-gray-600 font-body">Stress</div>
                      <div className="text-sm font-semibold text-orange-700">3/10</div>
                    </div>
                  </div>

                  {/* Energy Levels Timeline - Redesigned */}
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-3 font-body">Energy Levels Today</div>
                    <div className="space-y-2">
                      {energyTimes.map((time) => {
                        const energyLevel = dailyCheckInData.energyLevels[time.key as keyof typeof dailyCheckInData.energyLevels] || 5;
                        const energyPercentage = (energyLevel / 10) * 100;
                        
                        // Get color based on energy level
                        const getEnergyColor = (level: number) => {
                          if (level >= 8) return 'from-green-400 to-emerald-500';
                          if (level >= 6) return 'from-yellow-400 to-orange-400';
                          if (level >= 4) return 'from-orange-400 to-red-400';
                          return 'from-red-400 to-red-600';
                        };

                        const getEnergyBgColor = (level: number) => {
                          if (level >= 8) return 'from-green-50 to-emerald-50';
                          if (level >= 6) return 'from-yellow-50 to-orange-50';
                          if (level >= 4) return 'from-orange-50 to-red-50';
                          return 'from-red-50 to-red-100';
                        };
                        
                        return (
                          <div key={time.key} className={`bg-gradient-to-r ${getEnergyBgColor(energyLevel)} rounded-lg p-3 border border-gray-100`}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-base">{time.icon}</span>
                                <span className="text-sm font-medium text-gray-700 font-body">{time.label}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Zap className="w-3 h-3 text-gray-500" />
                                <span className="text-sm font-semibold text-gray-800">{energyLevel}/10</span>
                              </div>
                            </div>
                            
                            <div className="relative">
                              <div className="w-full bg-white/70 rounded-full h-2 shadow-inner">
                                <div 
                                  className={`bg-gradient-to-r ${getEnergyColor(energyLevel)} h-2 rounded-full transition-all duration-300 shadow-sm`}
                                  style={{ width: `${energyPercentage}%` }}
                                />
                              </div>
                              
                              {/* Energy level indicator dots */}
                              <div className="flex justify-between absolute -top-1 w-full px-1">
                                {Array.from({ length: 5 }).map((_, index) => {
                                  const dotValue = (index + 1) * 2;
                                  const isActive = energyLevel >= dotValue;
                                  return (
                                    <div
                                      key={index}
                                      className={`w-1 h-4 rounded-full transition-colors ${
                                        isActive 
                                          ? 'bg-gray-600' 
                                          : 'bg-gray-300'
                                      }`}
                                    />
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Energy summary */}
                    <div className="mt-3 p-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-gray-100">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600 font-body">Daily Average</span>
                        <div className="flex items-center gap-1">
                          <Zap className="w-3 h-3 text-blue-500" />
                          <span className="font-semibold text-blue-700">
                            {Math.round(Object.values(dailyCheckInData.energyLevels).reduce((a, b) => a + b, 0) / Object.values(dailyCheckInData.energyLevels).length * 10) / 10}/10
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Meal Times */}
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2 font-body">Meal Times</div>
                    <div className="flex gap-2">
                      <div className="flex-1 bg-orange-50 rounded-lg p-2 text-center">
                        <Coffee className="w-3 h-3 text-orange-600 mx-auto mb-1" />
                        <div className="text-xs text-gray-600 font-body">Breakfast</div>
                        <div className="text-xs font-semibold text-orange-700">8:30 AM</div>
                      </div>
                      <div className="flex-1 bg-green-50 rounded-lg p-2 text-center">
                        <Sandwich className="w-3 h-3 text-green-600 mx-auto mb-1" />
                        <div className="text-xs text-gray-600 font-body">Lunch</div>
                        <div className="text-xs font-semibold text-green-700">1:15 PM</div>
                      </div>
                      <div className="flex-1 bg-purple-50 rounded-lg p-2 text-center">
                        <Utensils className="w-3 h-3 text-purple-600 mx-auto mb-1" />
                        <div className="text-xs text-gray-600 font-body">Dinner</div>
                        <div className="text-xs font-semibold text-purple-700">7:45 PM</div>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => setShowDailyCheckInForm(true)}
                    className="ios-button w-full p-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg text-sm font-medium"
                  >
                    Update Check-In
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Meal Planning Intelligence Hub */}
          <div className="max-w-md mx-auto">
            <div className="bg-white/90 backdrop-blur-md rounded-xl p-4 shadow-soft border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ChefHat className="w-5 h-5 text-green-500" />
                  <h3 className="text-base font-semibold text-gray-900 font-body">Meal Intelligence</h3>
                </div>
                <button
                  onClick={() => setShowMealHub(!showMealHub)}
                  className="ios-button p-1 rounded-lg hover:bg-gray-100"
                >
                  {showMealHub ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              {showMealHub && (
                <div className="space-y-4">
                  {/* Current Meal Plan Status */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 font-body">Today's Plan</span>
                      <span className="text-xs text-blue-600 font-body">3 meals</span>
                    </div>
                    <div className="text-xs text-gray-600 font-body">
                      ✅ Breakfast: Avocado Toast (8:30 AM)<br/>
                      🍽️ Lunch: Quinoa Bowl (1:00 PM)<br/>
                      🥘 Dinner: Salmon & Veggies (7:30 PM)
                    </div>
                  </div>

                  {/* Quick Meal Suggestions */}
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2 font-body">Quick Suggestions</div>
                    <div className="grid grid-cols-3 gap-2">
                      {['breakfast', 'lunch', 'dinner'].map((mealType) => (
                        <button
                          key={mealType}
                          onClick={() => onNavigateToTab('schedule')}
                          className="ios-button bg-gradient-to-br from-green-100 to-blue-100 rounded-lg p-2 text-center"
                        >
                          <div className="text-lg mb-1">
                            {mealType === 'breakfast' ? '🍳' : mealType === 'lunch' ? '🥗' : '🍽️'}
                          </div>
                          <div className="text-xs font-medium text-gray-700 capitalize font-body">{mealType}</div>
                        </button>
                      ))}
                      {['snacks', 'drinks'].map((type) => (
                        <button
                          key={type}
                          className="ios-button bg-gradient-to-br from-yellow-100 to-orange-100 rounded-lg p-2 text-center"
                        >
                          <div className="text-lg mb-1">
                            {type === 'snacks' ? '🍎' : '🥤'}
                          </div>
                          <div className="text-xs font-medium text-gray-700 capitalize font-body">{type}</div>
                        </button>
                      ))}
                    </div>
                  </div>



                  {/* Cooking Time Preferences */}
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-3">
                    <div className="text-sm font-medium text-gray-700 mb-2 font-body">Cooking Time Available</div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-center">
                        <div className="text-orange-600 font-semibold">Weekdays</div>
                        <div className="text-gray-600 font-body">30-45 min</div>
                      </div>
                      <div className="text-center">
                        <div className="text-orange-600 font-semibold">Weekends</div>
                        <div className="text-gray-600 font-body">60+ min</div>
                      </div>
                      <div className="text-center">
                        <div className="text-orange-600 font-semibold">Busy Days</div>
                        <div className="text-gray-600 font-body">15-30 min</div>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => onNavigateToTab('schedule')}
                    className="ios-button w-full p-2 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-lg text-sm font-medium"
                  >
                    Open Meal Planner
                  </button>
                </div>
              )}
            </div>
          </div>



          {/* Recent Activity Section - Compact */}
          <div className="max-w-md mx-auto">
            <div className="bg-white/80 backdrop-blur-md rounded-xl p-4 shadow-soft border border-gray-100">
              <h3 className="text-base font-semibold text-gray-900 mb-3 font-body">Recent Activity</h3>
              <div className="space-y-2">
                {cookedRecipes.slice(0, 2).map((recipe) => (
                  <div key={recipe.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                    <img 
                      src={recipe.image} 
                      alt={recipe.name}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 font-body text-sm">{recipe.name}</h4>
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {renderStars(recipe.rating || 0)}
                        </div>
                        <span className="text-xs text-gray-500 font-body">
                          {formatCookingDate(recipe.cookedDate)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                
                <button 
                  onClick={() => onNavigateToProfile()}
                  className="ios-button w-full p-2 bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 rounded-lg text-sm font-medium border border-gray-200"
                >
                  View All Activity →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}