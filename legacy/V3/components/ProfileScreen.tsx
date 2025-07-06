import { useState } from 'react';
import { 
  Settings, 
  Bell, 
  Shield, 
  HelpCircle, 
  LogOut, 
  Edit3, 
  Camera,
  ChevronRight,
  User,
  Heart,
  Target,
  Award,
  Smartphone,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Star,
  TrendingUp,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface ProfileMetric {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earned: boolean;
  date?: string;
}

export function ProfileScreen() {
  const [showEditProfile, setShowEditProfile] = useState(false);

  const profileMetrics: ProfileMetric[] = [
    {
      label: 'Meals Logged',
      value: '127',
      icon: Activity,
      color: 'text-blue-600'
    },
    {
      label: 'Streak Days',
      value: '12',
      icon: TrendingUp,
      color: 'text-green-600'
    },
    {
      label: 'Achievements',
      value: '8',
      icon: Award,
      color: 'text-purple-600'
    },
    {
      label: 'Rating',
      value: '4.9',
      icon: Star,
      color: 'text-yellow-600'
    }
  ];

  const achievements: Achievement[] = [
    {
      id: 'week-streak',
      title: '7-Day Streak',
      description: 'Logged meals for 7 consecutive days',
      icon: '🔥',
      earned: true,
      date: '2 days ago'
    },
    {
      id: 'healthy-choices',
      title: 'Healthy Choice Master',
      description: 'Made 50 healthy meal choices',
      icon: '🥗',
      earned: true,
      date: '1 week ago'
    },
    {
      id: 'chef-assistant',
      title: 'AI Chef Pal',
      description: 'Used AI Chef for 25 recipes',
      icon: '👨‍🍳',
      earned: true,
      date: '2 weeks ago'
    },
    {
      id: 'zero-waste',
      title: 'Zero Waste Hero',
      description: 'Prevented 10kg of food waste',
      icon: '🌱',
      earned: false
    },
    {
      id: 'budget-master',
      title: 'Budget Master',
      description: 'Saved €500 on groceries',
      icon: '💰',
      earned: false
    },
    {
      id: 'meal-planner',
      title: 'Meal Planning Pro',
      description: 'Planned 30 weekly meal schedules',
      icon: '📅',
      earned: false
    }
  ];

  const menuItems = [
    {
      section: 'Account',
      items: [
        { icon: Edit3, label: 'Edit Profile', action: () => setShowEditProfile(true) },
        { icon: Bell, label: 'Notifications', action: () => {} },
        { icon: Shield, label: 'Privacy & Security', action: () => {} }
      ]
    },
    {
      section: 'Preferences',
      items: [
        { icon: Heart, label: 'Dietary Preferences', action: () => {} },
        { icon: Target, label: 'Health Goals', action: () => {} },
        { icon: Smartphone, label: 'App Settings', action: () => {} }
      ]
    },
    {
      section: 'Support',
      items: [
        { icon: HelpCircle, label: 'Help & Support', action: () => {} },
        { icon: Settings, label: 'Advanced Settings', action: () => {} },
        { icon: LogOut, label: 'Sign Out', action: () => {} }
      ]
    }
  ];

  return (
    <div className="ios-scroll bg-gray-50 relative">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-500 to-purple-600 px-4 pt-6 pb-16">
        <div className="text-center text-white">
          <div className="relative inline-block mb-4">
            <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=96&h=96&fit=crop&crop=face"
                alt="Mahsa"
                className="w-20 h-20 rounded-full object-cover"
              />
            </div>
            <button className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white text-blue-600 flex items-center justify-center shadow-lg">
              <Camera className="w-4 h-4" />
            </button>
          </div>
          
          <h1 className="text-2xl font-bold mb-1">Mahsa</h1>
          <p className="text-blue-100 mb-4">Nutrition Enthusiast</p>
          
          <div className="flex items-center justify-center space-x-1 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} className="w-4 h-4 text-yellow-400 fill-current" />
            ))}
            <span className="text-sm text-blue-100 ml-2">4.9 Health Score</span>
          </div>
        </div>
      </div>

      <div className="px-4 pb-32 -mt-12">
        {/* Quick Stats */}
        <Card className="ios-card bg-white shadow-lg mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4">
              {profileMetrics.map((metric) => {
                const Icon = metric.icon;
                return (
                  <div key={metric.label} className="text-center">
                    <Icon className={`w-6 h-6 ${metric.color} mx-auto mb-2`} />
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {metric.value}
                    </div>
                    <div className="text-xs text-gray-600">
                      {metric.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card className="ios-card mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <User className="w-5 h-5 mr-2 text-blue-600" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center space-x-3 p-3 rounded-xl bg-gray-50">
              <Mail className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <div className="font-medium text-gray-900">mahsa@example.com</div>
                <div className="text-sm text-gray-600">Email Address</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 rounded-xl bg-gray-50">
              <Phone className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <div className="font-medium text-gray-900">+1 (555) 123-4567</div>
                <div className="text-sm text-gray-600">Phone Number</div>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 rounded-xl bg-gray-50">
              <MapPin className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <div className="font-medium text-gray-900">Barcelona, Spain</div>
                <div className="text-sm text-gray-600">Location</div>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 rounded-xl bg-gray-50">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <div className="font-medium text-gray-900">Member since Dec 2024</div>
                <div className="text-sm text-gray-600">Join Date</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card className="ios-card mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Award className="w-5 h-5 mr-2 text-purple-600" />
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {achievements.map((achievement) => (
                <div 
                  key={achievement.id} 
                  className={`p-3 rounded-xl text-center transition-all ${
                    achievement.earned 
                      ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200' 
                      : 'bg-gray-50 border-2 border-gray-200 opacity-60'
                  }`}
                >
                  <div className="text-2xl mb-2">{achievement.icon}</div>
                  <div className="text-xs font-semibold text-gray-900 mb-1 leading-tight">
                    {achievement.title}
                  </div>
                  {achievement.earned && achievement.date && (
                    <div className="text-xs text-orange-600 font-medium">
                      {achievement.date}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Menu Sections */}
        {menuItems.map((section) => (
          <Card key={section.section} className="ios-card mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-gray-700">
                {section.section}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="w-5 h-5 text-gray-600" />
                      <span className="font-medium text-gray-900">{item.label}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>
                );
              })}
            </CardContent>
          </Card>
        ))}

        {/* App Version */}
        <div className="text-center py-6">
          <p className="text-sm text-gray-500">
            WellNoosh v1.0.0
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Your Personal AI Chef Nutritionist
          </p>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end">
          <div className="bg-white rounded-t-3xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Edit Profile</h3>
              <button
                onClick={() => setShowEditProfile(false)}
                className="p-2 rounded-full bg-gray-100 text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  defaultValue="Mahsa"
                  className="w-full p-3 border border-gray-200 rounded-xl"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  defaultValue="mahsa@example.com"
                  className="w-full p-3 border border-gray-200 rounded-xl"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  defaultValue="Barcelona, Spain"
                  className="w-full p-3 border border-gray-200 rounded-xl"
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <Button 
                  onClick={() => setShowEditProfile(false)}
                  variant="outline" 
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => setShowEditProfile(false)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}