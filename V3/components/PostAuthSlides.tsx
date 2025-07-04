import { useState } from 'react';
import { ArrowLeft, ArrowRight, Calendar, Users, Weight, Ruler } from 'lucide-react';
import { Button } from './ui/button';
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
}

interface PostAuthSlidesProps {
  onComplete: (userData: UserData) => void;
  onSkip: () => void;
  userData: UserData | null;
}

export function PostAuthSlides({ onComplete, onSkip, userData }: PostAuthSlidesProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [healthData, setHealthData] = useState({
    age: '',
    gender: '',
    weight: '',
    weightUnit: 'kg' as 'kg' | 'lbs',
    height: '',
    heightUnit: 'cm' as 'cm' | 'ft',
    heightFeet: '',
    heightInches: ''
  });

  // Gender options
  const genderOptions = [
    'Male', 'Female', 'Non-binary', 'Prefer not to say'
  ];

  const validateHealthProfile = () => {
    const newErrors: Record<string, string> = {};

    // Age validation
    if (!healthData.age) {
      newErrors.age = 'Age is required';
    } else {
      const age = parseInt(healthData.age);
      if (isNaN(age) || age < 13 || age > 120) {
        newErrors.age = 'Please enter a valid age (13-120)';
      }
    }

    // Gender validation
    if (!healthData.gender) {
      newErrors.gender = 'Gender is required';
    }

    // Weight validation
    if (!healthData.weight) {
      newErrors.weight = 'Weight is required';
    } else {
      const weight = parseFloat(healthData.weight);
      const minWeight = healthData.weightUnit === 'kg' ? 30 : 66; // 30kg = ~66lbs
      const maxWeight = healthData.weightUnit === 'kg' ? 300 : 660; // 300kg = ~660lbs
      if (isNaN(weight) || weight < minWeight || weight > maxWeight) {
        newErrors.weight = `Please enter a valid weight (${minWeight}-${maxWeight} ${healthData.weightUnit})`;
      }
    }

    // Height validation
    if (healthData.heightUnit === 'cm') {
      if (!healthData.height) {
        newErrors.height = 'Height is required';
      } else {
        const height = parseFloat(healthData.height);
        if (isNaN(height) || height < 100 || height > 250) {
          newErrors.height = 'Please enter a valid height (100-250 cm)';
        }
      }
    } else {
      // Feet/inches validation
      if (!healthData.heightFeet || !healthData.heightInches) {
        newErrors.height = 'Height is required';
      } else {
        const feet = parseInt(healthData.heightFeet);
        const inches = parseInt(healthData.heightInches);
        if (isNaN(feet) || isNaN(inches) || feet < 3 || feet > 8 || inches < 0 || inches > 11) {
          newErrors.height = 'Please enter a valid height (3-8 ft, 0-11 in)';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    setHealthData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleNext = () => {
    if (currentSlide === 1) { // Health profile slide (step 2)
      if (!validateHealthProfile()) {
        return;
      }
    } 
    
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      // Last slide - complete the flow
      const completeUserData: UserData = {
        ...userData!,
        age: healthData.age ? parseInt(healthData.age) : undefined,
        gender: healthData.gender || undefined,
        weight: healthData.weight ? parseFloat(healthData.weight) : undefined,
        weightUnit: healthData.weightUnit,
        height: healthData.heightUnit === 'cm' ? 
          (healthData.height ? parseFloat(healthData.height) : undefined) : 
          (healthData.heightFeet && healthData.heightInches ? 
            (parseInt(healthData.heightFeet) * 12 + parseInt(healthData.heightInches)) * 2.54 : undefined),
        heightUnit: healthData.heightUnit,
        heightFeet: healthData.heightUnit === 'ft' && healthData.heightFeet ? parseInt(healthData.heightFeet) : undefined,
        heightInches: healthData.heightUnit === 'ft' && healthData.heightInches ? parseInt(healthData.heightInches) : undefined
      };
      
      onComplete(completeUserData);
    }
  };

  const handlePrevious = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleSkip = () => {
    // Can only skip feature slides, not the health profile
    if (currentSlide === 1) {
      // Health profile slide - cannot skip
      return;
    }
    
    // Skip to end and complete with current health data
    const completeUserData: UserData = {
      ...userData!,
      age: healthData.age ? parseInt(healthData.age) : undefined,
      gender: healthData.gender || undefined,
      weight: healthData.weight ? parseFloat(healthData.weight) : undefined,
      weightUnit: healthData.weightUnit,
      height: healthData.heightUnit === 'cm' ? 
        (healthData.height ? parseFloat(healthData.height) : undefined) : 
        (healthData.heightFeet && healthData.heightInches ? 
          (parseInt(healthData.heightFeet) * 12 + parseInt(healthData.heightInches)) * 2.54 : undefined),
      heightUnit: healthData.heightUnit,
      heightFeet: healthData.heightUnit === 'ft' && healthData.heightFeet ? parseInt(healthData.heightFeet) : undefined,
      heightInches: healthData.heightUnit === 'ft' && healthData.heightInches ? parseInt(healthData.heightInches) : undefined
    };
    
    onComplete(completeUserData);
  };

  const getUserFirstName = () => {
    if (!userData?.fullName) return 'there';
    return userData.fullName.split(' ')[0];
  };

  // Check if current slide can be skipped
  const canSkipCurrentSlide = () => {
    return currentSlide !== 1; // Cannot skip health profile (slide 1)
  };

  const slides = [
    // Slide 0: Welcome
    {
      title: `Welcome to WellNoosh${userData ? `, ${getUserFirstName()}!` : '!'}`,
      subtitle: "Your personal AI nutrition assistant is ready to transform your kitchen experience",
      content: (
        <div className="text-center space-y-8">
          <div className="w-32 h-32 mx-auto bg-gradient-to-br from-green-400 via-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl">
            <img src={wellnooshIcon} alt="WellNoosh" className="w-20 h-20 object-contain rounded-full wellnoosh-logo-large" />
          </div>
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 font-body">
              🌟 Your Smart Kitchen Journey Begins
            </h3>
            <p className="text-gray-600 leading-relaxed font-body">
              Let's get you set up with personalized recommendations, meal planning, and food waste reduction strategies tailored just for you.
            </p>
          </div>
        </div>
      )
    },
    // Slide 1: Health Profile - STEP 2 (Cannot be skipped)
    {
      title: "Complete Your Profile",
      subtitle: "Help us personalize your nutrition recommendations",
      content: (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-green-400 to-blue-600 rounded-full flex items-center justify-center shadow-lg mb-4">
              <span className="text-4xl">👤</span>
            </div>
            <p className="text-gray-600 font-body">
              A few quick details to create your personalized nutrition plan
            </p>
          </div>

          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-body">
                  Age
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="number"
                    placeholder="25"
                    min="13"
                    max="120"
                    className={`pl-10 ios-button bg-gray-50 border-gray-200 ${errors.age ? 'border-red-500' : ''}`}
                    value={healthData.age}
                    onChange={(e) => handleInputChange('age', e.target.value)}
                    required
                  />
                </div>
                {errors.age && <p className="text-red-500 text-xs mt-1 font-body">{errors.age}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-body">
                  Gender
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
                  <select
                    className={`w-full pl-10 pr-4 py-3 ios-button bg-gray-50 border border-gray-200 rounded-lg font-body appearance-none ${errors.gender ? 'border-red-500' : ''}`}
                    value={healthData.gender}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    required
                  >
                    <option value="">Select</option>
                    {genderOptions.map((gender) => (
                      <option key={gender} value={gender}>
                        {gender}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                {errors.gender && <p className="text-red-500 text-xs mt-1 font-body">{errors.gender}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 font-body">
                Weight
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Weight className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="number"
                    placeholder="70"
                    step="0.1"
                    className={`pl-10 ios-button bg-gray-50 border-gray-200 ${errors.weight ? 'border-red-500' : ''}`}
                    value={healthData.weight}
                    onChange={(e) => handleInputChange('weight', e.target.value)}
                    required
                  />
                </div>
                <select
                  className="ios-button bg-gray-50 border border-gray-200 font-body px-3 py-3 rounded-lg"
                  value={healthData.weightUnit}
                  onChange={(e) => handleInputChange('weightUnit', e.target.value)}
                >
                  <option value="kg">kg</option>
                  <option value="lbs">lbs</option>
                </select>
              </div>
              {errors.weight && <p className="text-red-500 text-xs mt-1 font-body">{errors.weight}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 font-body">
                Height
              </label>
              <div className="flex gap-2">
                {healthData.heightUnit === 'cm' ? (
                  <div className="relative flex-1">
                    <Ruler className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      type="number"
                      placeholder="175"
                      min="100"
                      max="250"
                      className={`pl-10 ios-button bg-gray-50 border-gray-200 ${errors.height ? 'border-red-500' : ''}`}
                      value={healthData.height}
                      onChange={(e) => handleInputChange('height', e.target.value)}
                      required
                    />
                  </div>
                ) : (
                  <div className="flex gap-2 flex-1">
                    <div className="relative flex-1">
                      <Ruler className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        type="number"
                        placeholder="5"
                        min="3"
                        max="8"
                        className={`pl-10 ios-button bg-gray-50 border-gray-200 ${errors.height ? 'border-red-500' : ''}`}
                        value={healthData.heightFeet}
                        onChange={(e) => handleInputChange('heightFeet', e.target.value)}
                        required
                      />
                    </div>
                    <span className="self-center text-gray-500 font-body">ft</span>
                    <div className="relative flex-1">
                      <Input
                        type="number"
                        placeholder="9"
                        min="0"
                        max="11"
                        className={`ios-button bg-gray-50 border-gray-200 ${errors.height ? 'border-red-500' : ''}`}
                        value={healthData.heightInches}
                        onChange={(e) => handleInputChange('heightInches', e.target.value)}
                        required
                      />
                    </div>
                    <span className="self-center text-gray-500 font-body">in</span>
                  </div>
                )}
                <select
                  className="ios-button bg-gray-50 border border-gray-200 font-body px-3 py-3 rounded-lg"
                  value={healthData.heightUnit}
                  onChange={(e) => handleInputChange('heightUnit', e.target.value)}
                >
                  <option value="cm">cm</option>
                  <option value="ft">ft</option>
                </select>
              </div>
              {errors.height && <p className="text-red-500 text-xs mt-1 font-body">{errors.height}</p>}
            </div>
          </div>
        </div>
      )
    },
    // Slide 2: Stop Wasting Food
    {
      title: "Stop Wasting Food",
      subtitle: "Turn your leftovers into delicious meals with AI-powered suggestions",
      content: (
        <div className="text-center space-y-8">
          <div className="w-32 h-32 mx-auto bg-green-100 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-6xl">🌿</span>
          </div>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-green-50 p-4 rounded-2xl">
                <div className="font-semibold text-green-800 font-body">40% Less Waste</div>
                <div className="text-green-600 font-body">Average reduction</div>
              </div>
              <div className="bg-green-50 p-4 rounded-2xl">
                <div className="font-semibold text-green-800 font-body">Smart Suggestions</div>
                <div className="text-green-600 font-body">AI-powered recipes</div>
              </div>
            </div>
            <p className="text-gray-600 leading-relaxed font-body">
              Our AI analyzes your ingredients and suggests creative ways to use everything in your fridge before it expires.
            </p>
          </div>
        </div>
      )
    },
    // Slide 3: Stay Healthy
    {
      title: "Stay Healthy",
      subtitle: "Personalized nutrition guidance based on your goals and preferences",
      content: (
        <div className="text-center space-y-8">
          <div className="w-32 h-32 mx-auto bg-red-100 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-6xl">❤️</span>
          </div>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-red-50 p-4 rounded-2xl">
                <div className="font-semibold text-red-800 font-body">Custom Plans</div>
                <div className="text-red-600 font-body">Based on your profile</div>
              </div>
              <div className="bg-red-50 p-4 rounded-2xl">
                <div className="font-semibold text-red-800 font-body">Nutrition Tracking</div>
                <div className="text-red-600 font-body">Automatic analysis</div>
              </div>
            </div>
            <p className="text-gray-600 leading-relaxed font-body">
              Get meal recommendations tailored to your health goals, dietary restrictions, and nutritional needs.
            </p>
          </div>
        </div>
      )
    },
    // Slide 4: Save Money
    {
      title: "Save Money",
      subtitle: "Smart shopping lists and budget tracking to reduce your grocery costs",
      content: (
        <div className="text-center space-y-8">
          <div className="w-32 h-32 mx-auto bg-blue-100 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-6xl">💰</span>
          </div>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-blue-50 p-4 rounded-2xl">
                <div className="font-semibold text-blue-800 font-body">$200+ Monthly</div>
                <div className="text-blue-600 font-body">Average savings</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-2xl">
                <div className="font-semibold text-blue-800 font-body">Smart Lists</div>
                <div className="text-blue-600 font-body">Prevent overbuying</div>
              </div>
            </div>
            <p className="text-gray-600 leading-relaxed font-body">
              Our intelligent shopping lists and meal planning help you buy only what you need and use everything you have.
            </p>
          </div>
        </div>
      )
    },
    // Slide 5: Smart Features
    {
      title: "Smart Features",
      subtitle: "AI-powered tools that make cooking and meal planning effortless",
      content: (
        <div className="text-center space-y-8">
          <div className="w-32 h-32 mx-auto bg-purple-100 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-6xl">🤖</span>
          </div>
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-3 text-sm">
              <div className="bg-purple-50 p-4 rounded-2xl text-left">
                <div className="font-semibold text-purple-800 font-body flex items-center">
                  📸 Photo Recognition
                </div>
                <div className="text-purple-600 font-body">Scan ingredients and get instant recipes</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-2xl text-left">
                <div className="font-semibold text-purple-800 font-body flex items-center">
                  🗓️ Meal Planning
                </div>
                <div className="text-purple-600 font-body">Automatic weekly meal schedules</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-2xl text-left">
                <div className="font-semibold text-purple-800 font-body flex items-center">
                  💬 AI Chat
                </div>
                <div className="text-purple-600 font-body">Ask questions about nutrition and cooking</div>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  const totalSlides = slides.length;

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      {/* Header */}
      <div className="flex items-center justify-between p-6 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <button
          onClick={handlePrevious}
          disabled={currentSlide === 0}
          className={`ios-button p-2 ${currentSlide === 0 ? 'text-gray-300' : 'text-gray-600'}`}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        
        <div className="text-center">
          <img src={wellnooshIcon} alt="WellNoosh" className="w-8 h-8 object-contain rounded-full wellnoosh-logo mx-auto mb-1" />
          <div className="flex space-x-2">
            {Array.from({ length: totalSlides }).map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentSlide
                    ? 'bg-gradient-to-r from-green-500 to-blue-600 w-6'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
        
        {canSkipCurrentSlide() && (
          <button
            onClick={handleSkip}
            className="ios-button text-gray-600 font-medium font-body"
          >
            Skip
          </button>
        )}
        
        {!canSkipCurrentSlide() && (
          <div className="w-12"></div>
        )}
      </div>

      {/* Slide Content */}
      <div className="flex-1 overflow-y-auto ios-scroll">
        <div className="px-6 py-8">
          <div className="max-w-sm mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2 font-body">
                {slides[currentSlide].title}
              </h1>
              <p className="text-gray-600 leading-relaxed font-body">
                {slides[currentSlide].subtitle}
              </p>
            </div>

            <div className="mb-8">
              {slides[currentSlide].content}
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
            {currentSlide === totalSlides - 1 ? 'Complete Setup' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}