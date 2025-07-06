import { useState, useEffect } from 'react';
import { Eye, EyeOff, Mail, Lock, User, MapPin, Chrome } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ImageWithFallback } from './figma/ImageWithFallback';
import wellnooshIcon from 'figma:asset/4b28c64338ad95e8eae91615fbda6a4e2cc3d398.png';

type AuthMode = 'login' | 'signup' | 'google';

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
  cookedRecipes?: any[];
}

interface AuthScreenProps {
  onAuthenticated: (mode: AuthMode, userData: UserData) => void;
  initialMode?: 'login' | 'signup';
}

export function AuthScreen({ onAuthenticated, initialMode = 'login' }: AuthScreenProps) {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    country: '',
    city: '',
    postalCode: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update mode when initialMode prop changes
  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (mode === 'signup') {
      // Signup-specific validations
      if (!formData.fullName) {
        newErrors.fullName = 'Full name is required';
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }

      if (!formData.country) {
        newErrors.country = 'Country is required';
      }

      if (!formData.city) {
        newErrors.city = 'City is required';
      }

      if (!formData.postalCode) {
        newErrors.postalCode = 'Postal code is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    // Simulate API call
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      const userData: UserData = {
        fullName: formData.fullName || 'User',
        email: formData.email,
        country: formData.country || 'Unknown',
        city: formData.city || 'Unknown',
        postalCode: formData.postalCode || '00000'
      };

      onAuthenticated(mode, userData);
    } catch (error) {
      console.error('Authentication error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);

    // Simulate Google OAuth flow
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock Google user data - in real app this would come from Google OAuth
      const userData: UserData = {
        fullName: 'Google User',
        email: 'user@gmail.com',
        country: 'United States',
        city: 'New York',
        postalCode: '10001'
      };

      // Pass the appropriate mode based on current form state
      if (mode === 'login') {
        // User is in Sign In mode - treat as login
        onAuthenticated('login', userData);
      } else {
        // User is in Sign Up mode - treat as Google signup (needs profile completion)
        onAuthenticated('google', userData);
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      {/* Header */}
      <div className="flex-shrink-0 text-center pt-8 pb-6">
        <img src={wellnooshIcon} alt="WellNoosh" className="w-20 h-20 object-contain rounded-full wellnoosh-logo-large mx-auto mb-4" />
        <h1 className="text-3xl font-bold brand-title mb-2 font-brand">WellNoosh</h1>
        <p className="text-gray-600 font-body">Your AI-powered nutrition companion</p>
      </div>

      {/* Auth Form */}
      <div className="flex-1 overflow-y-auto ios-scroll">
        <div className="px-6 pb-6">
          <div className="max-w-sm mx-auto">
            {/* Mode Toggle */}
            <div className="flex bg-gray-100 rounded-2xl p-1 mb-8">
              <button
                onClick={() => setMode('login')}
                className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ios-button ${
                  mode === 'login' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setMode('signup')}
                className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ios-button ${
                  mode === 'signup' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600'
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Google Sign-In Button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="ios-button w-full py-4 mb-6 bg-white border border-gray-200 rounded-xl font-semibold text-gray-700 flex items-center justify-center gap-3 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Chrome className="w-5 h-5 text-blue-600" />
              {isLoading ? 'Signing in...' : `Continue with Google`}
            </button>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 text-gray-500 font-body">
                  Or continue with email
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Signup Fields */}
              {mode === 'signup' && (
                <div className="space-y-4">
                  {/* Full Name */}
                  <div>
                    <Label htmlFor="fullName" className="text-gray-700 font-body">Full Name</Label>
                    <div className="relative mt-2">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="Enter your full name"
                        value={formData.fullName}
                        onChange={(e) => handleInputChange('fullName', e.target.value)}
                        className={`pl-10 py-3 ios-button bg-white border-gray-200 ${errors.fullName ? 'border-red-300' : ''}`}
                      />
                    </div>
                    {errors.fullName && <p className="text-red-500 text-sm mt-1 font-body">{errors.fullName}</p>}
                  </div>
                </div>
              )}

              {/* Email */}
              <div>
                <Label htmlFor="email" className="text-gray-700 font-body">Email Address</Label>
                <div className="relative mt-2">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`pl-10 py-3 ios-button bg-white border-gray-200 ${errors.email ? 'border-red-300' : ''}`}
                  />
                </div>
                {errors.email && <p className="text-red-500 text-sm mt-1 font-body">{errors.email}</p>}
              </div>

              {/* Password */}
              <div>
                <Label htmlFor="password" className="text-gray-700 font-body">Password</Label>
                <div className="relative mt-2">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={`pl-10 pr-10 py-3 ios-button bg-white border-gray-200 ${errors.password ? 'border-red-300' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 ios-button"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-sm mt-1 font-body">{errors.password}</p>}
              </div>

              {/* Confirm Password - Signup Only */}
              {mode === 'signup' && (
                <div>
                  <Label htmlFor="confirmPassword" className="text-gray-700 font-body">Confirm Password</Label>
                  <div className="relative mt-2">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      className={`pl-10 pr-10 py-3 ios-button bg-white border-gray-200 ${errors.confirmPassword ? 'border-red-300' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 ios-button"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-red-500 text-sm mt-1 font-body">{errors.confirmPassword}</p>}
                </div>
              )}

              {/* Location Fields - Signup Only */}
              {mode === 'signup' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Country */}
                    <div>
                      <Label htmlFor="country" className="text-gray-700 font-body">Country</Label>
                      <div className="relative mt-2">
                        <Input
                          id="country"
                          type="text"
                          placeholder="Country"
                          value={formData.country}
                          onChange={(e) => handleInputChange('country', e.target.value)}
                          className={`py-3 ios-button bg-white border-gray-200 ${errors.country ? 'border-red-300' : ''}`}
                        />
                      </div>
                      {errors.country && <p className="text-red-500 text-sm mt-1 font-body">{errors.country}</p>}
                    </div>

                    {/* City */}
                    <div>
                      <Label htmlFor="city" className="text-gray-700 font-body">City</Label>
                      <div className="relative mt-2">
                        <Input
                          id="city"
                          type="text"
                          placeholder="City"
                          value={formData.city}
                          onChange={(e) => handleInputChange('city', e.target.value)}
                          className={`py-3 ios-button bg-white border-gray-200 ${errors.city ? 'border-red-300' : ''}`}
                        />
                      </div>
                      {errors.city && <p className="text-red-500 text-sm mt-1 font-body">{errors.city}</p>}
                    </div>
                  </div>

                  {/* Postal Code */}
                  <div>
                    <Label htmlFor="postalCode" className="text-gray-700 font-body">Postal Code</Label>
                    <div className="relative mt-2">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        id="postalCode"
                        type="text"
                        placeholder="Enter postal code"
                        value={formData.postalCode}
                        onChange={(e) => handleInputChange('postalCode', e.target.value)}
                        className={`pl-10 py-3 ios-button bg-white border-gray-200 ${errors.postalCode ? 'border-red-300' : ''}`}
                      />
                    </div>
                    {errors.postalCode && <p className="text-red-500 text-sm mt-1 font-body">{errors.postalCode}</p>}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="ios-button w-full py-4 text-lg font-bold text-white bg-gradient-to-r from-green-500 via-blue-500 to-purple-600 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    {mode === 'login' ? 'Signing In...' : 'Creating Account...'}
                  </div>
                ) : (
                  mode === 'login' ? 'Sign In' : 'Create Account'
                )}
              </Button>

              {/* Forgot Password - Login Only */}
              {mode === 'login' && (
                <div className="text-center">
                  <button
                    type="button"
                    className="ios-button text-blue-600 font-medium font-body"
                  >
                    Forgot Password?
                  </button>
                </div>
              )}
            </form>

            {/* Terms for Signup */}
            {mode === 'signup' && (
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600 font-body">
                  By creating an account, you agree to our{' '}
                  <button className="text-blue-600 font-medium">Terms of Service</button>
                  {' '}and{' '}
                  <button className="text-blue-600 font-medium">Privacy Policy</button>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}