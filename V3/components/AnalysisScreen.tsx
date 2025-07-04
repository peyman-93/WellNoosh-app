import { useState } from 'react';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Clock,
  Target,
  Award,
  Heart,
  Leaf,
  DollarSign,
  Utensils,
  Coffee,
  Apple,
  Zap,
  ChevronRight,
  Info,
  Filter,
  Download
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface AnalysisMetric {
  label: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: React.ElementType;
  color: string;
}

interface NutritionData {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

interface Goal {
  id: string;
  title: string;
  current: number;
  target: number;
  unit: string;
  color: string;
  icon: React.ElementType;
}

export function AnalysisScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [selectedCategory, setSelectedCategory] = useState('overview');

  const periods = [
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' },
    { id: 'quarter', label: '3 Months' },
    { id: 'year', label: 'This Year' }
  ];

  const categories = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'nutrition', label: 'Nutrition', icon: Apple },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'savings', label: 'Savings', icon: DollarSign },
    { id: 'sustainability', label: 'Impact', icon: Leaf }
  ];

  const keyMetrics: AnalysisMetric[] = [
    {
      label: 'Calories Consumed',
      value: '1,847',
      change: '+5%',
      changeType: 'positive',
      icon: Zap,
      color: 'text-orange-600'
    },
    {
      label: 'Meals Logged',
      value: '21',
      change: '+12%',
      changeType: 'positive',
      icon: Utensils,
      color: 'text-blue-600'
    },
    {
      label: 'Food Waste Saved',
      value: '2.3kg',
      change: '+18%',
      changeType: 'positive',
      icon: Leaf,
      color: 'text-green-600'
    },
    {
      label: 'Money Saved',
      value: '€47',
      change: '+25%',
      changeType: 'positive',
      icon: DollarSign,
      color: 'text-purple-600'
    }
  ];

  const nutritionData: NutritionData[] = [
    { date: 'Mon', calories: 1850, protein: 85, carbs: 220, fat: 65, fiber: 28 },
    { date: 'Tue', calories: 1920, protein: 92, carbs: 185, fat: 72, fiber: 32 },
    { date: 'Wed', calories: 1780, protein: 78, carbs: 210, fat: 58, fiber: 25 },
    { date: 'Thu', calories: 1850, protein: 88, carbs: 195, fat: 68, fiber: 30 },
    { date: 'Fri', calories: 1950, protein: 95, carbs: 205, fat: 75, fiber: 35 },
    { date: 'Sat', calories: 2100, protein: 102, carbs: 240, fat: 82, fiber: 28 },
    { date: 'Sun', calories: 1890, protein: 89, carbs: 215, fat: 70, fiber: 31 }
  ];

  const goals: Goal[] = [
    {
      id: 'protein',
      title: 'Daily Protein',
      current: 89,
      target: 100,
      unit: 'g',
      color: 'bg-blue-500',
      icon: Utensils
    },
    {
      id: 'vegetables',
      title: 'Vegetable Servings',
      current: 7,
      target: 5,
      unit: 'servings',
      color: 'bg-green-500',
      icon: Apple
    },
    {
      id: 'water',
      title: 'Water Intake',
      current: 2.1,
      target: 2.5,
      unit: 'L',
      color: 'bg-cyan-500',
      icon: Coffee
    },
    {
      id: 'steps',
      title: 'Active Minutes',
      current: 45,
      target: 60,
      unit: 'min',
      color: 'bg-orange-500',
      icon: Heart
    }
  ];

  const achievements = [
    {
      id: 'streak',
      title: '7-Day Logging Streak',
      description: 'Logged meals for 7 consecutive days',
      icon: '🔥',
      date: 'Today',
      points: 50
    },
    {
      id: 'waste',
      title: 'Zero Waste Hero',
      description: 'Prevented 5kg of food waste this month',
      icon: '🌱',
      date: '2 days ago',
      points: 100
    },
    {
      id: 'budget',
      title: 'Budget Master',
      description: 'Saved €120 on groceries this month',
      icon: '💰',
      date: '1 week ago',
      points: 75
    }
  ];

  const insights = [
    {
      type: 'success',
      title: 'Great Progress!',
      message: 'You\'ve increased your vegetable intake by 23% this week',
      action: 'View Nutrition Details'
    },
    {
      type: 'tip',
      title: 'Meal Prep Opportunity',
      message: 'Sunday batch cooking could save you 2 hours this week',
      action: 'Plan Meal Prep'
    },
    {
      type: 'warning',
      title: 'Low Fiber Alert',
      message: 'Consider adding more whole grains to reach your fiber goals',
      action: 'Get Recipes'
    }
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4">
        {keyMetrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.label} className="ios-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`w-5 h-5 ${metric.color}`} />
                  <span className={`text-xs font-medium ${
                    metric.changeType === 'positive' 
                      ? 'text-green-600' 
                      : metric.changeType === 'negative' 
                      ? 'text-red-600' 
                      : 'text-gray-600'
                  }`}>
                    {metric.change}
                  </span>
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {metric.value}
                </div>
                <div className="text-xs text-gray-600">
                  {metric.label}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Insights */}
      <Card className="ios-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
            Quick Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {insights.map((insight, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 rounded-xl bg-gray-50">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                insight.type === 'success' 
                  ? 'bg-green-100' 
                  : insight.type === 'warning' 
                  ? 'bg-orange-100' 
                  : 'bg-blue-100'
              }`}>
                {insight.type === 'success' ? '✅' : insight.type === 'warning' ? '⚠️' : '💡'}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 text-sm mb-1">
                  {insight.title}
                </h4>
                <p className="text-xs text-gray-600 mb-2">
                  {insight.message}
                </p>
                <button className="text-xs text-blue-600 font-medium">
                  {insight.action} →
                </button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Recent Achievements */}
      <Card className="ios-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center">
            <Award className="w-5 h-5 mr-2 text-yellow-600" />
            Recent Achievements
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {achievements.map((achievement) => (
            <div key={achievement.id} className="flex items-center space-x-3 p-3 rounded-xl bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200">
              <div className="text-2xl">{achievement.icon}</div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 text-sm">
                  {achievement.title}
                </h4>
                <p className="text-xs text-gray-600 mb-1">
                  {achievement.description}
                </p>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-orange-600 font-medium">
                    +{achievement.points} points
                  </span>
                  <span className="text-xs text-gray-500">
                    {achievement.date}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );

  const renderNutrition = () => (
    <div className="space-y-6">
      {/* Nutrition Chart */}
      <Card className="ios-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Daily Nutrition Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-end justify-between space-x-2 mb-4">
            {nutritionData.map((day, index) => (
              <div key={day.date} className="flex-1 flex flex-col items-center">
                <div className="w-full bg-gray-200 rounded-t-lg relative overflow-hidden" style={{ height: '120px' }}>
                  {/* Calories bar */}
                  <div 
                    className="absolute bottom-0 w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg"
                    style={{ height: `${(day.calories / 2500) * 100}%` }}
                  />
                  {/* Protein overlay */}
                  <div 
                    className="absolute bottom-0 w-full bg-gradient-to-t from-green-500/60 to-green-400/60"
                    style={{ height: `${(day.protein / 120) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-gray-600 mt-2">
                  {day.date}
                </span>
                <span className="text-xs text-gray-500">
                  {day.calories}
                </span>
              </div>
            ))}
          </div>
          
          {/* Legend */}
          <div className="flex items-center justify-center space-x-4 text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span>Calories</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>Protein</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Macro Breakdown */}
      <Card className="ios-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Average Macronutrients</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { name: 'Protein', value: 89, target: 100, color: 'bg-blue-500', unit: 'g' },
              { name: 'Carbs', value: 210, target: 250, color: 'bg-orange-500', unit: 'g' },
              { name: 'Fat', value: 68, target: 80, color: 'bg-purple-500', unit: 'g' },
              { name: 'Fiber', value: 29, target: 35, color: 'bg-green-500', unit: 'g' }
            ].map((macro) => (
              <div key={macro.name} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-900">{macro.name}</span>
                  <span className="text-sm text-gray-600">
                    {macro.value}{macro.unit} / {macro.target}{macro.unit}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${macro.color}`}
                    style={{ width: `${Math.min((macro.value / macro.target) * 100, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderGoals = () => (
    <div className="space-y-6">
      {goals.map((goal) => {
        const Icon = goal.icon;
        const progress = Math.min((goal.current / goal.target) * 100, 100);
        const isCompleted = goal.current >= goal.target;
        
        return (
          <Card key={goal.id} className="ios-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${goal.color} bg-opacity-10`}>
                    <Icon className={`w-5 h-5 ${goal.color.replace('bg-', 'text-')}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{goal.title}</h3>
                    <p className="text-sm text-gray-600">
                      {goal.current} / {goal.target} {goal.unit}
                    </p>
                  </div>
                </div>
                {isCompleted && (
                  <div className="text-green-500">
                    <Award className="w-5 h-5" />
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-300 ${
                      isCompleted ? 'bg-green-500' : goal.color
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>{Math.round(progress)}% Complete</span>
                  <span>
                    {isCompleted ? 'Goal Reached! 🎉' : `${goal.target - goal.current} ${goal.unit} to go`}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  const renderSavings = () => (
    <div className="space-y-6">
      {/* Savings Summary */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="ios-card">
          <CardContent className="p-4 text-center">
            <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900 mb-1">€127</div>
            <div className="text-xs text-gray-600">This Month</div>
          </CardContent>
        </Card>
        
        <Card className="ios-card">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900 mb-1">+23%</div>
            <div className="text-xs text-gray-600">vs Last Month</div>
          </CardContent>
        </Card>
      </div>

      {/* Savings Breakdown */}
      <Card className="ios-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Savings Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { category: 'Smart Shopping', amount: 47, percentage: 37 },
            { category: 'Reduced Waste', amount: 35, percentage: 28 },
            { category: 'Meal Planning', amount: 28, percentage: 22 },
            { category: 'Bulk Buying', amount: 17, percentage: 13 }
          ].map((item) => (
            <div key={item.category} className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-900">{item.category}</span>
                  <span className="text-sm text-gray-600">€{item.amount}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full bg-green-500"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );

  const renderSustainability = () => (
    <div className="space-y-6">
      {/* Environmental Impact */}
      <Card className="ios-card bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardContent className="p-4 text-center">
          <Leaf className="w-12 h-12 text-green-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-900 mb-2">Environmental Impact</h3>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">2.3kg</div>
              <div className="text-xs text-gray-600">Food Waste Prevented</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">4.1kg</div>
              <div className="text-xs text-gray-600">CO₂ Saved</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Impact Categories */}
      <Card className="ios-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Your Positive Impact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { 
              icon: '🌱', 
              title: 'Food Waste Reduction', 
              description: 'Prevented 2.3kg of food waste this week',
              impact: '92% reduction vs average'
            },
            { 
              icon: '♻️', 
              title: 'Sustainable Choices', 
              description: 'Chose 89% locally sourced ingredients',
              impact: 'Reduced transport emissions'
            },
            { 
              icon: '💧', 
              title: 'Water Conservation', 
              description: 'Smart meal planning saved 127L of water',
              impact: 'Equivalent to 3 days of drinking water'
            }
          ].map((impact, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 rounded-xl bg-green-50">
              <div className="text-2xl">{impact.icon}</div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 text-sm mb-1">
                  {impact.title}
                </h4>
                <p className="text-xs text-gray-600 mb-1">
                  {impact.description}
                </p>
                <p className="text-xs text-green-600 font-medium">
                  {impact.impact}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );

  const renderContent = () => {
    switch (selectedCategory) {
      case 'nutrition':
        return renderNutrition();
      case 'goals':
        return renderGoals();
      case 'savings':
        return renderSavings();
      case 'sustainability':
        return renderSustainability();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="ios-scroll bg-gray-50 relative">
      {/* Header */}
      <div className="bg-white px-4 py-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600">Your Personal Health & Nutrition Insights</p>
          </div>
          <button className="ios-button bg-blue-100 text-blue-600 p-2 rounded-xl">
            <Download className="w-5 h-5" />
          </button>
        </div>

        {/* Period Selector */}
        <div className="flex space-x-2 mb-4">
          {periods.map((period) => (
            <button
              key={period.id}
              onClick={() => setSelectedPeriod(period.id)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedPeriod === period.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>

        {/* Category Selector */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex-1 flex items-center justify-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  selectedCategory === category.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{category.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 pb-32">
        {renderContent()}
      </div>
    </div>
  );
}