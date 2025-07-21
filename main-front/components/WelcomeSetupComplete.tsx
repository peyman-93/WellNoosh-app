import { useState } from 'react';
import { 
  Check, 
  ArrowRight, 
  Sparkles, 
  Brain, 
  Clock,
  ShoppingBag,
  Camera,
  Calendar,
  ChefHat,
  MessageSquare,
  Heart,
  DollarSign,
  Leaf,
  Star,
  Play,
  Users,
  Utensils,
  Coffee,
  Sun,
  Moon,
  Scan,
  ClipboardList,
  Bot
} from 'lucide-react';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { ImageWithFallback } from './figma/ImageWithFallback';
import wellnooshIcon from 'figma:asset/4b28c64338ad95e8eae91615fbda6a4e2cc3d398.png';

interface WelcomeSetupCompleteProps {
  onContinue: () => void;
  userName: string;
  onNavigateToProfile?: () => void;
}

export function WelcomeSetupComplete({ onContinue, userName, onNavigateToProfile }: WelcomeSetupCompleteProps) {
  const [aiTrainingProgress] = useState(15);
  const [showAIChat, setShowAIChat] = useState(false);
  const [aiPromptMode, setAiPromptMode] = useState<'chef' | 'leftover' | 'schedule' | 'grocery' | null>(null);

  // Mock personalized meal recommendations based on onboarding data
  const mealRecommendations = [
    {
      meal: 'Breakfast',
      time: '8:00 AM',
      name: 'Protein Power Bowl',
      description: 'Greek yogurt with berries, almonds & chia seeds',
      image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=300&h=200&fit=crop',
      calories: 380,
      protein: 25,
      reason: 'High protein start based on your fitness goals',
      icon: Coffee,
      color: 'from-orange-400 to-pink-400'
    },
    {
      meal: 'Lunch',
      time: '1:00 PM',
      name: 'Mediterranean Quinoa Salad',
      description: 'Quinoa, chickpeas, feta, cucumber & olive oil',
      image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&h=200&fit=crop',
      calories: 520,
      protein: 18,
      reason: 'Plant-based protein for your vegetarian preference',
      icon: Sun,
      color: 'from-green-400 to-blue-400'
    },
    {
      meal: 'Dinner',
      time: '7:30 PM',
      name: 'Herb-Crusted Salmon',
      description: 'Baked salmon with roasted vegetables & sweet potato',
      image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=300&h=200&fit=crop',
      calories: 480,
      protein: 35,
      reason: 'Omega-3 rich, avoiding your gluten allergy',
      icon: Moon,
      color: 'from-purple-400 to-indigo-400'
    }
  ];

  const appFeatures = [
    {
      title: 'Profile',
      description: 'Your account & preferences',
      icon: Users,
      color: 'bg-gradient-to-br from-blue-500 to-purple-600',
      action: () => onNavigateToProfile?.()
    },
    {
      title: 'AI Chef',
      description: 'Your cooking companion',
      icon: ChefHat,
      color: 'bg-gradient-to-br from-purple-500 to-pink-500',
      action: () => {
        setAiPromptMode('chef');
        setShowAIChat(true);
      }
    },
    {
      title: 'Leftover Handler',
      description: 'Track & use ingredients',
      icon: Scan,
      color: 'bg-gradient-to-br from-green-500 to-emerald-500',
      action: () => {
        setAiPromptMode('leftover');
        setShowAIChat(true);
      }
    },
    {
      title: 'Meal Scheduler',
      description: 'Plan your weekly meals',
      icon: Calendar,
      color: 'bg-gradient-to-br from-blue-500 to-cyan-500',
      action: () => {
        setAiPromptMode('schedule');
        setShowAIChat(true);
      }
    },
    {
      title: 'Grocery Store',
      description: 'Best prices & ordering',
      icon: ShoppingBag,
      color: 'bg-gradient-to-br from-orange-500 to-red-500',
      action: () => {
        setAiPromptMode('grocery');
        setShowAIChat(true);
      }
    }
  ];

  const aiPrompts = {
    chef: [
      "Do you want me to assist you to cook something with your leftover materials?",
      "What cuisine are you in the mood for today?",
      "Need help with cooking techniques or substitutions?",
      "Want a quick 15-minute meal recipe?"
    ],
    leftover: [
      "What ingredients do you have in your fridge?",
      "Let me help you track expiry dates",
      "Take a photo of your ingredients and I'll suggest recipes",
      "Want to add items to your inventory list?"
    ],
    schedule: [
      "How many meals would you like me to plan for this week?",
      "What's your preferred eating schedule?",
      "Any specific dietary goals for meal planning?",
      "Should I include prep time in your schedule?"
    ],
    grocery: [
      "What items do you need for this week?",
      "Let me find the best prices at nearby stores",
      "Want me to create a shopping list from your meal plan?",
      "Which stores would you prefer to order from?"
    ]
  };

  const quickStats = [
    { label: 'Waste Reduction', value: '40%', icon: Leaf, color: 'text-green-600' },
    { label: 'Health Score', value: '95%', icon: Heart, color: 'text-red-500' },
    { label: 'Time Saved', value: '2hrs', icon: Clock, color: 'text-blue-600' },
  ];

  return (
    <div className="ios-scroll bg-gray-50 relative">
      {/* Clean Header */}
      <div className="bg-gradient-to-br from-green-400 via-blue-500 to-purple-600 px-4 pt-6 pb-8">
        <div className="text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="p-3 rounded-full bg-white/20 backdrop-blur-md">
              <img src={wellnooshIcon} alt="WellNoosh" className="w-12 h-12 object-contain rounded-full" />
            </div>
          </div>
          
          <div className="text-white">
            <h1 className="text-3xl font-bold mb-4 font-brand">WellNoosh {userName}</h1>
            <p className="text-white/90 font-medium text-lg mb-6">
              Your personalized nutrition journey starts now
            </p>
            
            {/* Setup Complete Badge */}
            <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-md rounded-full px-4 py-2">
              <Check className="w-5 h-5 text-green-200" />
              <span className="font-semibold">Setup Complete!</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pb-28">
        {/* AI Assistant Training */}
        <div className="ios-card bg-white p-6 -mt-4 relative z-20 border-2 border-blue-100">
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 shadow-lg">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 mb-1">Your AI Chef is Training</h3>
              <p className="text-gray-600 text-sm">Learning your preferences and dietary needs</p>
            </div>
            <Badge variant="secondary" className="bg-purple-100 text-purple-700">
              {aiTrainingProgress}%
            </Badge>
          </div>
          <Progress value={aiTrainingProgress} className="h-3 mb-3" />
          <p className="text-sm text-gray-600">
            <Sparkles className="w-4 h-4 inline mr-1 text-yellow-500" />
            Your AI will get smarter with every meal you log!
          </p>
        </div>

        {/* Personalized Meal Recommendations - Horizontal Layout */}
        <div className="mt-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Your Personalized Meals Today</h3>
          
          <div className="grid grid-cols-3 gap-2">
            {mealRecommendations.map((meal, index) => {
              const Icon = meal.icon;
              return (
                <div key={index} className="ios-card bg-white overflow-hidden">
                  <div className="p-3">
                    <div className="flex items-center justify-center mb-3">
                      <div className={`p-2 rounded-xl bg-gradient-to-r ${meal.color}`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    
                    <div className="text-center mb-3">
                      <h4 className="font-bold text-gray-900 text-sm mb-1">{meal.meal}</h4>
                      <Badge variant="secondary" className="text-xs mb-2">{meal.time}</Badge>
                      <h5 className="font-semibold text-gray-800 text-xs leading-tight">{meal.name}</h5>
                    </div>
                    
                    <div className="mb-3">
                      <ImageWithFallback
                        src={meal.image}
                        alt={meal.name}
                        className="w-full h-16 rounded-lg object-cover"
                      />
                    </div>
                    
                    <div className="text-center">
                      <div className="text-sm font-bold text-green-600 mb-1">{meal.calories} cal</div>
                      <div className="text-xs text-gray-500 mb-3">{meal.protein}g protein</div>
                      
                      <button className="ios-button w-full py-2 text-xs text-white bg-gradient-to-r from-green-500 to-blue-600">
                        Add to Plan
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* App Features */}
        <div className="mt-8">
          <div className="grid grid-cols-2 gap-3 mb-4">
            {appFeatures.slice(0, 4).map((feature, index) => {
              const Icon = feature.icon;
              return (
                <button
                  key={index}
                  onClick={feature.action}
                  className="ios-card bg-white p-4 active:scale-95 transition-transform text-left"
                >
                  <div className="flex flex-col items-center space-y-3">
                    <div className={`p-3 rounded-2xl ${feature.color} shadow-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-center">
                      <h4 className="font-bold text-gray-900 mb-1">{feature.title}</h4>
                      <p className="text-xs text-gray-600">{feature.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          
          {/* Grocery Store - Full Width */}
          <button
            onClick={appFeatures[4].action}
            className="ios-card bg-white p-4 w-full active:scale-95 transition-transform"
          >
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-2xl ${appFeatures[4].color} shadow-lg`}>
                <ShoppingBag className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 text-left">
                <h4 className="font-bold text-gray-900 mb-1">{appFeatures[4].title}</h4>
                <p className="text-sm text-gray-600">{appFeatures[4].description}</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </div>
          </button>
        </div>

        {/* Quick Stats Preview */}
        <div className="mt-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">What You'll Achieve</h3>
          <div className="grid grid-cols-3 gap-3">
            {quickStats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="ios-card bg-white p-4 text-center">
                  <div className="mb-2">
                    <Icon className={`w-6 h-6 mx-auto ${stat.color}`} />
                  </div>
                  <div className={`font-bold text-lg ${stat.color}`}>{stat.value}</div>
                  <div className="text-xs text-gray-600">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-8 space-y-4">
          <Button
            onClick={onContinue}
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-green-500 via-blue-500 to-purple-600 text-white font-bold text-lg shadow-lg"
          >
            <div className="flex items-center justify-center space-x-2">
              <ChefHat className="w-6 h-6" />
              <span>Let's Start Cooking!</span>
              <ArrowRight className="w-6 h-6" />
            </div>
          </Button>
          
          <div className="text-center text-gray-600 text-sm">
            <p>Personalized just for you based on your preferences</p>
          </div>
        </div>
      </div>

      {/* AI Chat Interface */}
      {showAIChat && aiPromptMode && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end">
          <div className="bg-white rounded-t-3xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-purple-100">
                  <Bot className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">
                    {aiPromptMode === 'chef' && 'AI Chef Assistant'}
                    {aiPromptMode === 'leftover' && 'Leftover Handler'}
                    {aiPromptMode === 'schedule' && 'Meal Scheduler'}
                    {aiPromptMode === 'grocery' && 'Grocery Assistant'}
                  </h3>
                  <p className="text-sm text-gray-600">How can I help you today?</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAIChat(false);
                  setAiPromptMode(null);
                }}
                className="p-2 rounded-full bg-gray-100 text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="p-4 space-y-4 max-h-60 overflow-y-auto">
              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-xl bg-purple-100 flex-shrink-0">
                  <Bot className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <div className="bg-gray-100 rounded-2xl p-3">
                    <p className="text-gray-800 mb-2">
                      Hi {userName}! I'm here to help you with{' '}
                      {aiPromptMode === 'chef' && 'cooking and recipes'}
                      {aiPromptMode === 'leftover' && 'managing your ingredients and leftovers'}
                      {aiPromptMode === 'schedule' && 'planning your meals'}
                      {aiPromptMode === 'grocery' && 'shopping and finding the best deals'}
                      .
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-200">
              <div className="flex space-x-2 mb-3">
                <input
                  type="text"
                  placeholder={`Ask about ${aiPromptMode}...`}
                  className="flex-1 h-12 px-4 rounded-2xl border border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                />
                <button className="h-12 px-6 rounded-2xl bg-purple-600 text-white font-medium">
                  Ask
                </button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {aiPrompts[aiPromptMode]?.map((prompt, index) => (
                  <button
                    key={index}
                    className="px-3 py-2 text-sm bg-purple-50 text-purple-700 rounded-full border border-purple-200 text-left"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}