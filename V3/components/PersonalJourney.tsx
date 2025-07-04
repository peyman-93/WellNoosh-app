import { useState, useEffect } from 'react';
import { 
  ArrowLeft,
  TrendingUp,
  Heart,
  Users,
  Award,
  Calendar,
  BarChart3,
  Sparkles,
  Target,
  Coffee,
  Moon,
  Zap,
  Brain
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface PersonalJourneyProps {
  onClose: () => void;
}

interface DayData {
  day: string;
  mood: number;
  energy: number;
  sleep: number;
  stress: number;
  date: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress?: number;
  total?: number;
  unlockedDate?: string;
}

interface CommunityInteraction {
  type: 'encouraged' | 'received';
  count: number;
  icon: string;
  color: string;
}

export function PersonalJourney({ onClose }: PersonalJourneyProps) {
  const [activeView, setActiveView] = useState<'timeline' | 'insights' | 'community'>('timeline');

  // Mock data for the last 14 days
  const journeyData: DayData[] = [
    { day: 'Mon', mood: 6, energy: 7, sleep: 6, stress: 5, date: '2024-01-01' },
    { day: 'Tue', mood: 7, energy: 8, sleep: 7, stress: 4, date: '2024-01-02' },
    { day: 'Wed', mood: 5, energy: 6, sleep: 5, stress: 7, date: '2024-01-03' },
    { day: 'Thu', mood: 8, energy: 9, sleep: 8, stress: 3, date: '2024-01-04' },
    { day: 'Fri', mood: 9, energy: 8, sleep: 7, stress: 3, date: '2024-01-05' },
    { day: 'Sat', mood: 8, energy: 9, sleep: 9, stress: 2, date: '2024-01-06' },
    { day: 'Sun', mood: 9, energy: 8, sleep: 8, stress: 2, date: '2024-01-07' },
    { day: 'Mon', mood: 7, energy: 7, sleep: 6, stress: 4, date: '2024-01-08' },
    { day: 'Tue', mood: 8, energy: 8, sleep: 8, stress: 3, date: '2024-01-09' },
    { day: 'Wed', mood: 6, energy: 6, sleep: 5, stress: 6, date: '2024-01-10' },
    { day: 'Thu', mood: 9, energy: 9, sleep: 8, stress: 2, date: '2024-01-11' },
    { day: 'Fri', mood: 8, energy: 8, sleep: 7, stress: 3, date: '2024-01-12' },
    { day: 'Sat', mood: 9, energy: 9, sleep: 9, stress: 1, date: '2024-01-13' },
    { day: 'Today', mood: 8, energy: 8, sleep: 7, stress: 3, date: '2024-01-14' }
  ];

  const achievements: Achievement[] = [
    {
      id: '1',
      title: 'First Week Warrior',
      description: 'Completed your first week of daily check-ins',
      icon: '🏆',
      unlocked: true,
      unlockedDate: '2024-01-07'
    },
    {
      id: '2',
      title: 'Mood Tracker',
      description: 'Tracked your mood for 14 consecutive days',
      icon: '😊',
      unlocked: true,
      progress: 14,
      total: 14,
      unlockedDate: '2024-01-14'
    },
    {
      id: '3',
      title: 'Community Champion',
      description: 'Encouraged 25 community members',
      icon: '💖',
      unlocked: false,
      progress: 23,
      total: 25
    },
    {
      id: '4',
      title: 'Wellness Streak',
      description: 'Maintain consistent wellness habits for 30 days',
      icon: '⚡',
      unlocked: false,
      progress: 14,
      total: 30
    },
    {
      id: '5',
      title: 'Breakthrough Moment',
      description: 'Share a meaningful breakthrough with the community',
      icon: '✨',
      unlocked: true,
      unlockedDate: '2024-01-10'
    }
  ];

  const communityStats: CommunityInteraction[] = [
    { type: 'encouraged', count: 23, icon: '💖', color: 'from-pink-400 to-rose-500' },
    { type: 'received', count: 8, icon: '🤗', color: 'from-blue-400 to-purple-500' }
  ];

  const insights = [
    {
      title: 'Your Strongest Days',
      description: 'You typically feel strongest on Sunday prep days',
      icon: <TrendingUp className="w-5 h-5 text-green-600" />,
      color: 'from-green-50 to-emerald-50',
      borderColor: 'border-green-200'
    },
    {
      title: 'Sleep & Mood Connection',
      description: 'Better sleep quality correlates with 40% higher mood scores',
      icon: <Moon className="w-5 h-5 text-purple-600" />,
      color: 'from-purple-50 to-indigo-50',
      borderColor: 'border-purple-200'
    },
    {
      title: 'Community Impact',
      description: 'Days when you interact with community show 25% higher energy',
      icon: <Users className="w-5 h-5 text-blue-600" />,
      color: 'from-blue-50 to-cyan-50',
      borderColor: 'border-blue-200'
    },
    {
      title: 'Stress Pattern',
      description: 'Mid-week stress peaks - consider adding Wednesday self-care',
      icon: <Brain className="w-5 h-5 text-orange-600" />,
      color: 'from-orange-50 to-red-50',
      borderColor: 'border-orange-200'
    }
  ];

  const renderTimelineView = () => (
    <div className="space-y-6">
      {/* Mood Timeline Chart */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-gray-800">Emotional Journey</h3>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="w-3 h-3 bg-pink-400 rounded-full"></div>
            <span>Mood</span>
            <div className="w-3 h-3 bg-blue-400 rounded-full ml-2"></div>
            <span>Energy</span>
          </div>
        </div>
        
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={journeyData}>
              <XAxis 
                dataKey="day" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6B7280' }}
              />
              <YAxis hide />
              <Line 
                type="monotone" 
                dataKey="mood" 
                stroke="#EC4899" 
                strokeWidth={3}
                dot={{ fill: '#EC4899', strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6, fill: '#EC4899' }}
              />
              <Line 
                type="monotone" 
                dataKey="energy" 
                stroke="#3B82F6" 
                strokeWidth={3}
                dot={{ fill: '#3B82F6', strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6, fill: '#3B82F6' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Current Status */}
        <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-100">
          <div className="text-center">
            <div className="text-2xl font-bold text-pink-600 mb-1">8.1</div>
            <div className="text-sm text-gray-600">Avg Mood</div>
            <div className="text-xs text-green-600">↗ +12% this week</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 mb-1">7.8</div>
            <div className="text-sm text-gray-600">Avg Energy</div>
            <div className="text-xs text-green-600">↗ +8% this week</div>
          </div>
        </div>
      </div>

      {/* Sleep & Stress Chart */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-gray-800">Wellness Indicators</h3>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
            <span>Sleep</span>
            <div className="w-3 h-3 bg-orange-400 rounded-full ml-2"></div>
            <span>Stress</span>
          </div>
        </div>
        
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={journeyData}>
              <XAxis 
                dataKey="day" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6B7280' }}
              />
              <YAxis hide />
              <Area 
                type="monotone" 
                dataKey="sleep" 
                stackId="1"
                stroke="#8B5CF6" 
                fill="#8B5CF6"
                fillOpacity={0.3}
              />
              <Area 
                type="monotone" 
                dataKey="stress" 
                stackId="2"
                stroke="#F59E0B" 
                fill="#F59E0B"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Breakthrough Moments */}
      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6 border border-yellow-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">Recent Breakthrough</h3>
            <p className="text-sm text-gray-600">January 10th</p>
          </div>
        </div>
        <p className="text-gray-700 italic">
          "Finally understood that self-care isn't selfish - it's necessary. Having this community support made all the difference in my mindset shift."
        </p>
      </div>
    </div>
  );

  const renderInsightsView = () => (
    <div className="space-y-6">
      {/* Pattern Insights */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-800">Your Patterns & Insights</h3>
        {insights.map((insight, index) => (
          <div key={index} className={`bg-gradient-to-r ${insight.color} rounded-2xl p-6 border ${insight.borderColor}`}>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                {insight.icon}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-800 mb-2">{insight.title}</h4>
                <p className="text-gray-600 text-sm leading-relaxed">{insight.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Weekly Summary */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-800 mb-4">This Week's Summary</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-green-50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">5</div>
            <div className="text-sm text-gray-600">Great Days</div>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-blue-600 mb-1">2</div>
            <div className="text-sm text-gray-600">Growth Days</div>
          </div>
          <div className="bg-purple-50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-purple-600 mb-1">89%</div>
            <div className="text-sm text-gray-600">Check-in Rate</div>
          </div>
          <div className="bg-pink-50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-pink-600 mb-1">14</div>
            <div className="text-sm text-gray-600">Day Streak</div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-200">
        <div className="flex items-center gap-3 mb-4">
          <Target className="w-6 h-6 text-indigo-600" />
          <h3 className="font-semibold text-gray-800">Personalized Suggestions</h3>
        </div>
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <div className="w-2 h-2 bg-indigo-400 rounded-full mt-2"></div>
            <span className="text-gray-700 text-sm">Try a 5-minute meditation on Wednesday afternoons to manage mid-week stress</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-2 h-2 bg-indigo-400 rounded-full mt-2"></div>
            <span className="text-gray-700 text-sm">Your Sunday meal prep sessions boost your mood - consider adding a Friday prep too</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-2 h-2 bg-indigo-400 rounded-full mt-2"></div>
            <span className="text-gray-700 text-sm">Community interactions increase your energy - aim for 2-3 supportive comments daily</span>
          </li>
        </ul>
      </div>
    </div>
  );

  const renderCommunityView = () => (
    <div className="space-y-6">
      {/* Community Impact Stats */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-800 mb-6">Your Community Impact</h3>
        <div className="grid grid-cols-2 gap-4">
          {communityStats.map((stat, index) => (
            <div key={index} className={`bg-gradient-to-br ${stat.color} rounded-2xl p-6 text-white text-center`}>
              <div className="text-3xl mb-2">{stat.icon}</div>
              <div className="text-2xl font-bold mb-1">{stat.count}</div>
              <div className="text-sm opacity-90 capitalize">
                {stat.type === 'encouraged' ? 'People Encouraged' : 'Times Supported'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Achievement Progress */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-800">Progress & Achievements</h3>
        {achievements.map((achievement) => (
          <div key={achievement.id} className={`rounded-2xl p-6 border ${
            achievement.unlocked 
              ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' 
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-start gap-4">
              <div className={`text-3xl ${achievement.unlocked ? '' : 'grayscale opacity-50'}`}>
                {achievement.icon}
              </div>
              <div className="flex-1">
                <h4 className={`font-semibold mb-2 ${achievement.unlocked ? 'text-gray-800' : 'text-gray-500'}`}>
                  {achievement.title}
                </h4>
                <p className={`text-sm mb-3 ${achievement.unlocked ? 'text-gray-600' : 'text-gray-400'}`}>
                  {achievement.description}
                </p>
                
                {achievement.unlocked ? (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <Award className="w-4 h-4" />
                    <span>Unlocked {achievement.unlockedDate}</span>
                  </div>
                ) : achievement.progress !== undefined ? (
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Progress</span>
                      <span>{achievement.progress}/{achievement.total}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-400 to-purple-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(achievement.progress! / achievement.total!) * 100}%` }}
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Community Connection Visualization */}
      <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl p-6 border border-pink-200">
        <div className="flex items-center gap-3 mb-4">
          <Heart className="w-6 h-6 text-pink-600" />
          <h3 className="font-semibold text-gray-800">Connection Impact</h3>
        </div>
        <p className="text-gray-700 mb-4">
          Your support has made a real difference in the community. Keep spreading positivity!
        </p>
        <div className="bg-white/70 rounded-xl p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-pink-600 mb-1">95%</div>
            <div className="text-sm text-gray-600">of people you encouraged felt better after your support</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center hover:shadow-lg transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          
          <div className="text-center">
            <h1 className="text-lg font-semibold text-gray-800">Personal Journey</h1>
            <p className="text-sm text-gray-500">Your wellness story</p>
          </div>

          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-purple-600" />
          </div>
        </div>

        {/* View Navigation */}
        <div className="flex bg-gray-100 rounded-2xl p-1">
          <button
            onClick={() => setActiveView('timeline')}
            className={`flex-1 py-3 px-2 rounded-xl font-medium transition-all text-sm ${
              activeView === 'timeline'
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-500'
            }`}
          >
            Timeline
          </button>
          <button
            onClick={() => setActiveView('insights')}
            className={`flex-1 py-3 px-2 rounded-xl font-medium transition-all text-sm ${
              activeView === 'insights'
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-500'
            }`}
          >
            Insights
          </button>
          <button
            onClick={() => setActiveView('community')}
            className={`flex-1 py-3 px-2 rounded-xl font-medium transition-all text-sm ${
              activeView === 'community'
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-500'
            }`}
          >
            Community
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pb-32">
        <div className="max-w-md mx-auto">
          {activeView === 'timeline' && renderTimelineView()}
          {activeView === 'insights' && renderInsightsView()}
          {activeView === 'community' && renderCommunityView()}
        </div>
      </div>
    </div>
  );
}