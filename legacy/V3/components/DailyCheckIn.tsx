import { useState, useEffect } from 'react';
import { 
  ArrowLeft,
  Check,
  Heart,
  Sun,
  Moon,
  Zap,
  Coffee,
  Sandwich,
  Utensils,
  Scale,
  Brain,
  Bed,
  Activity
} from 'lucide-react';

interface DailyCheckInProps {
  onClose: () => void;
  onSave: (data: DailyCheckInData) => void;
}

interface DailyCheckInData {
  date: string;
  weight: number;
  mood: number;
  stress: number;
  sleep: number;
  energy: number;
  mealTimes: {
    breakfast: string;
    lunch: string;
    dinner: string;
  };
  reflection?: string;
}

const moodEmojis = ['😢', '😔', '😐', '🙂', '😊', '😄', '🤩', '✨', '🌟', '💫'];
const energyLevels = ['😴', '😪', '😌', '🙂', '😊', '😃', '⚡', '🔥', '💪', '🚀'];

export function DailyCheckIn({ onClose, onSave }: DailyCheckInProps) {
  const [data, setData] = useState<DailyCheckInData>({
    date: new Date().toISOString().split('T')[0],
    weight: 70,
    mood: 5,
    stress: 3,
    sleep: 7,
    energy: 6,
    mealTimes: {
      breakfast: '08:00',
      lunch: '13:00',
      dinner: '19:00'
    },
    reflection: ''
  });

  const [currentSection, setCurrentSection] = useState(0);
  const sections = ['wellness', 'energy', 'meals', 'reflection'];

  const handleSave = () => {
    onSave(data);
    onClose();
  };

  const renderMoodSelector = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="text-6xl mb-4">{moodEmojis[data.mood - 1]}</div>
        <h3 className="text-xl font-light text-gray-800 mb-2">How are you feeling?</h3>
        <p className="text-sm text-gray-500">Your emotional state matters</p>
      </div>
      
      <div className="grid grid-cols-5 gap-3">
        {moodEmojis.map((emoji, index) => (
          <button
            key={index}
            onClick={() => setData(prev => ({ ...prev, mood: index + 1 }))}
            className={`aspect-square rounded-2xl text-2xl flex items-center justify-center transition-all duration-300 ${
              data.mood === index + 1
                ? 'bg-gradient-to-br from-pink-100 to-rose-100 scale-110 shadow-lg ring-2 ring-pink-300'
                : 'bg-gray-50 hover:bg-gray-100 hover:scale-105'
            }`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );

  const renderSlider = (value: number, onChange: (val: number) => void, icon: React.ReactNode, label: string, color: string) => (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white`}>
          {icon}
        </div>
        <div>
          <h4 className="font-medium text-gray-800">{label}</h4>
          <p className="text-sm text-gray-500">{value}/10</p>
        </div>
      </div>
      
      <div className="relative">
        <input
          type="range"
          min="1"
          max="10"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className={`w-full h-2 rounded-full appearance-none bg-gray-200 slider-${color}`}
          style={{
            background: `linear-gradient(to right, rgb(156, 163, 175) 0%, rgb(156, 163, 175) ${(value - 1) * 11.11}%, rgb(229, 231, 235) ${(value - 1) * 11.11}%, rgb(229, 231, 235) 100%)`
          }}
        />
        <div 
          className={`absolute top-1/2 transform -translate-y-1/2 w-6 h-6 rounded-full bg-white shadow-lg border-2 transition-all duration-300`}
          style={{ 
            left: `calc(${(value - 1) * 11.11}% - 12px)`,
            borderColor: value >= 7 ? '#10b981' : value >= 4 ? '#f59e0b' : '#ef4444'
          }}
        />
      </div>
    </div>
  );

  const renderWellnessSection = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-light text-gray-800 mb-2">Your Wellness</h2>
        <p className="text-gray-500">A gentle check on how you're doing</p>
      </div>

      {renderMoodSelector()}
      
      <div className="space-y-6">
        {renderSlider(data.sleep, (val) => setData(prev => ({ ...prev, sleep: val })), <Bed className="w-5 h-5" />, 'Sleep Quality', 'from-indigo-400 to-purple-500')}
        {renderSlider(data.stress, (val) => setData(prev => ({ ...prev, stress: val })), <Brain className="w-5 h-5" />, 'Stress Level', 'from-orange-400 to-red-500')}
      </div>
    </div>
  );

  const renderEnergySection = () => (
    <div className="space-y-8">
      <div className="text-center">
        <div className="text-6xl mb-4">{energyLevels[data.energy - 1]}</div>
        <h2 className="text-2xl font-light text-gray-800 mb-2">Energy Level</h2>
        <p className="text-gray-500">How energized do you feel today?</p>
      </div>
      
      <div className="grid grid-cols-5 gap-3">
        {energyLevels.map((emoji, index) => (
          <button
            key={index}
            onClick={() => setData(prev => ({ ...prev, energy: index + 1 }))}
            className={`aspect-square rounded-2xl text-2xl flex items-center justify-center transition-all duration-300 ${
              data.energy === index + 1
                ? 'bg-gradient-to-br from-yellow-100 to-orange-100 scale-110 shadow-lg ring-2 ring-yellow-300'
                : 'bg-gray-50 hover:bg-gray-100 hover:scale-105'
            }`}
          >
            {emoji}
          </button>
        ))}
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Scale className="w-5 h-5 text-blue-600" />
          <span className="font-medium text-gray-800">Weight Check</span>
        </div>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setData(prev => ({ ...prev, weight: Math.max(30, prev.weight - 0.5) }))}
            className="w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center text-blue-600 hover:shadow-lg transition-all"
          >
            -
          </button>
          <div className="text-3xl font-light text-blue-800">{data.weight} kg</div>
          <button
            onClick={() => setData(prev => ({ ...prev, weight: Math.min(200, prev.weight + 0.5) }))}
            className="w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center text-blue-600 hover:shadow-lg transition-all"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );

  const renderMealsSection = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-light text-gray-800 mb-2">Meal Times</h2>
        <p className="text-gray-500">When did you nourish yourself today?</p>
      </div>

      <div className="space-y-4">
        {[
          { key: 'breakfast' as const, label: 'Breakfast', icon: Coffee, color: 'from-orange-400 to-red-400' },
          { key: 'lunch' as const, label: 'Lunch', icon: Sandwich, color: 'from-green-400 to-blue-400' },
          { key: 'dinner' as const, label: 'Dinner', icon: Utensils, color: 'from-purple-400 to-pink-400' }
        ].map((meal) => {
          const Icon = meal.icon;
          return (
            <div key={meal.key} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${meal.color} flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="font-medium text-gray-800">{meal.label}</span>
                </div>
                <input
                  type="time"
                  value={data.mealTimes[meal.key]}
                  onChange={(e) => setData(prev => ({
                    ...prev,
                    mealTimes: { ...prev.mealTimes, [meal.key]: e.target.value }
                  }))}
                  className="text-lg font-medium bg-gray-50 rounded-lg px-3 py-2 border-none outline-none focus:bg-gray-100 transition-all"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderReflectionSection = () => (
    <div className="space-y-8">
      <div className="text-center">
        <Heart className="w-16 h-16 text-pink-400 mx-auto mb-4" />
        <h2 className="text-2xl font-light text-gray-800 mb-2">Daily Reflection</h2>
        <p className="text-gray-500">What's on your mind today? (optional)</p>
      </div>

      <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl p-6">
        <textarea
          placeholder="Share your thoughts, wins, or challenges..."
          value={data.reflection}
          onChange={(e) => setData(prev => ({ ...prev, reflection: e.target.value }))}
          className="w-full h-32 bg-transparent resize-none outline-none placeholder-gray-400 text-gray-700"
        />
      </div>

      <div className="text-center">
        <p className="text-sm text-gray-500 mb-6">
          This reflection is private and helps you track your journey
        </p>
      </div>
    </div>
  );

  const renderCurrentSection = () => {
    switch (sections[currentSection]) {
      case 'wellness': return renderWellnessSection();
      case 'energy': return renderEnergySection();
      case 'meals': return renderMealsSection();
      case 'reflection': return renderReflectionSection();
      default: return renderWellnessSection();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={currentSection === 0 ? onClose : () => setCurrentSection(prev => prev - 1)}
            className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center hover:shadow-lg transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          
          <div className="text-center">
            <h1 className="text-lg font-medium text-gray-800">Daily Check-In</h1>
            <p className="text-sm text-gray-500">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          </div>

          <div className="w-10" /> {/* Spacer */}
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {sections.map((_, index) => (
            <div
              key={index}
              className={`h-1 rounded-full transition-all duration-300 ${
                index <= currentSection 
                  ? 'w-8 bg-gradient-to-r from-pink-400 to-rose-400' 
                  : 'w-6 bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pb-32">
        <div className="max-w-md mx-auto">
          {renderCurrentSection()}
        </div>

        {/* Navigation Buttons */}
        <div className="max-w-md mx-auto mt-12 flex gap-4">
          {currentSection < sections.length - 1 ? (
            <button
              onClick={() => setCurrentSection(prev => prev + 1)}
              className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white py-4 rounded-2xl font-medium shadow-lg hover:shadow-xl transition-all active:scale-95"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleSave}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-4 rounded-2xl font-medium shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              Complete Check-In
            </button>
          )}
        </div>
      </div>
    </div>
  );
}