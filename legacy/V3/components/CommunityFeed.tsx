import { useState, useEffect } from 'react';
import { 
  ArrowLeft,
  Heart,
  MessageCircle,
  Users,
  Sparkles,
  TrendingUp,
  Coffee,
  Target,
  Award,
  ChevronRight,
  Plus,
  Send
} from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface CommunityFeedProps {
  onClose: () => void;
  challengeName: string;
  challengeDay: number;
}

interface CommunityPost {
  id: string;
  user: {
    name: string;
    avatar: string;
    badgeLevel: string;
  };
  type: 'victory' | 'struggle' | 'learning' | 'checkin';
  content: string;
  mood?: number;
  energy?: number;
  timestamp: string;
  reactions: {
    hearts: number;
    encouragement: number;
    solidarity: number;
  };
  replies: number;
  hasReacted: boolean;
  needsEncouragement?: boolean;
}

const moodEmojis = ['😢', '😔', '😐', '🙂', '😊', '😄', '🤩', '✨', '🌟', '💫'];
const communityMoods = [
  { emoji: '💪', label: 'Motivated', count: 12 },
  { emoji: '😊', label: 'Happy', count: 8 },
  { emoji: '🤔', label: 'Thoughtful', count: 5 },
  { emoji: '😴', label: 'Tired', count: 3 },
  { emoji: '🔥', label: 'Energized', count: 7 }
];

export function CommunityFeed({ onClose, challengeName, challengeDay }: CommunityFeedProps) {
  const [activeTab, setActiveTab] = useState<'feed' | 'checkin'>('feed');
  const [userMood, setUserMood] = useState(6);
  const [userEnergy, setUserEnergy] = useState(7);
  const [reflection, setReflection] = useState('');
  const [shareWithCommunity, setShareWithCommunity] = useState(true);
  const [newPost, setNewPost] = useState('');
  const [showPostInput, setShowPostInput] = useState(false);

  // Mock community posts
  const [posts, setPosts] = useState<CommunityPost[]>([
    {
      id: '1',
      user: { name: 'Sarah M.', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face', badgeLevel: 'Champion' },
      type: 'victory',
      content: "Day 7 and I finally meal prepped for the whole week! 🎉 The Mediterranean quinoa bowls turned out amazing. Feeling so proud of this progress!",
      mood: 9,
      timestamp: '2 hours ago',
      reactions: { hearts: 23, encouragement: 8, solidarity: 5 },
      replies: 12,
      hasReacted: false
    },
    {
      id: '2',
      user: { name: 'Alex R.', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face', badgeLevel: 'Rising Star' },
      type: 'struggle',
      content: "Having a tough day... stress eating got the better of me and I skipped my planned healthy lunch. Anyone else dealing with work stress affecting their food choices?",
      mood: 3,
      energy: 4,
      timestamp: '4 hours ago',
      reactions: { hearts: 15, encouragement: 18, solidarity: 12 },
      replies: 8,
      hasReacted: true,
      needsEncouragement: true
    },
    {
      id: '3',
      user: { name: 'Maya L.', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face', badgeLevel: 'Wellness Warrior' },
      type: 'learning',
      content: "TIL that drinking water before meals actually helps with mindful eating! 💧 Been trying this for 3 days and I'm naturally eating smaller portions and feeling more satisfied.",
      mood: 7,
      timestamp: '6 hours ago',
      reactions: { hearts: 31, encouragement: 4, solidarity: 2 },
      replies: 15,
      hasReacted: false
    },
    {
      id: '4',
      user: { name: 'Jordan K.', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face', badgeLevel: 'Mindful Eater' },
      type: 'checkin',
      content: "Morning check-in: Feeling grateful for this community! Had my green smoothie and 20 minutes of movement. Energy is high today ⚡",
      mood: 8,
      energy: 9,
      timestamp: '8 hours ago',
      reactions: { hearts: 19, encouragement: 6, solidarity: 3 },
      replies: 4,
      hasReacted: true
    }
  ]);

  const handleReaction = (postId: string, type: string) => {
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        const newReactions = { ...post.reactions };
        if (post.hasReacted) {
          // Remove reaction
          if (type === 'hearts') newReactions.hearts--;
          else if (type === 'encouragement') newReactions.encouragement--;
          else if (type === 'solidarity') newReactions.solidarity--;
        } else {
          // Add reaction
          if (type === 'hearts') newReactions.hearts++;
          else if (type === 'encouragement') newReactions.encouragement++;
          else if (type === 'solidarity') newReactions.solidarity++;
        }
        return { ...post, reactions: newReactions, hasReacted: !post.hasReacted };
      }
      return post;
    }));
  };

  const handlePostSubmit = () => {
    if (!newPost.trim()) return;
    
    const post: CommunityPost = {
      id: Date.now().toString(),
      user: { name: 'You', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face', badgeLevel: 'Rising Star' },
      type: 'victory',
      content: newPost,
      mood: userMood,
      energy: userEnergy,
      timestamp: 'now',
      reactions: { hearts: 0, encouragement: 0, solidarity: 0 },
      replies: 0,
      hasReacted: false
    };
    
    setPosts(prev => [post, ...prev]);
    setNewPost('');
    setShowPostInput(false);
  };

  const getPostTypeStyle = (type: string) => {
    switch (type) {
      case 'victory': return 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200';
      case 'struggle': return 'bg-gradient-to-r from-orange-50 to-red-50 border-orange-200';
      case 'learning': return 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200';
      case 'checkin': return 'bg-gradient-to-r from-pink-50 to-rose-50 border-pink-200';
      default: return 'bg-white border-gray-200';
    }
  };

  const getPostTypeIcon = (type: string) => {
    switch (type) {
      case 'victory': return <Award className="w-4 h-4 text-green-600" />;
      case 'struggle': return <Heart className="w-4 h-4 text-orange-600" />;
      case 'learning': return <Sparkles className="w-4 h-4 text-blue-600" />;
      case 'checkin': return <Coffee className="w-4 h-4 text-pink-600" />;
      default: return null;
    }
  };

  const renderFeedTab = () => (
    <div className="space-y-6">
      {/* Community Mood Meter */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">Community Mood</h3>
          <TrendingUp className="w-5 h-5 text-green-500" />
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {communityMoods.map((mood, index) => (
            <div key={index} className="flex-shrink-0 text-center">
              <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-xl mb-2">
                {mood.emoji}
              </div>
              <div className="text-xs text-gray-600">{mood.label}</div>
              <div className="text-xs font-semibold text-gray-800">{mood.count}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Post Input Toggle */}
      {!showPostInput ? (
        <button
          onClick={() => setShowPostInput(true)}
          className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white p-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all"
        >
          <Plus className="w-5 h-5" />
          Share with Community
        </button>
      ) : (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <textarea
            placeholder="Share your win, struggle, or learning moment..."
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            className="w-full h-24 resize-none outline-none placeholder-gray-400 text-gray-700 mb-4"
          />
          <div className="flex gap-2">
            <button
              onClick={() => setShowPostInput(false)}
              className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handlePostSubmit}
              className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              Share
            </button>
          </div>
        </div>
      )}

      {/* Community Posts */}
      <div className="space-y-4">
        {posts.map((post) => (
          <div key={post.id} className={`rounded-2xl p-6 border ${getPostTypeStyle(post.type)}`}>
            {/* Post Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <ImageWithFallback
                  src={post.user.avatar}
                  alt={post.user.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-800">{post.user.name}</span>
                    <span className="text-xs bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 px-2 py-1 rounded-full">
                      {post.user.badgeLevel}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    {getPostTypeIcon(post.type)}
                    <span className="capitalize">{post.type}</span>
                    <span>•</span>
                    <span>{post.timestamp}</span>
                  </div>
                </div>
              </div>
              {post.needsEncouragement && (
                <div className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-medium">
                  Needs support
                </div>
              )}
            </div>

            {/* Post Content */}
            <p className="text-gray-700 mb-4 leading-relaxed">{post.content}</p>

            {/* Mood & Energy Indicators */}
            {(post.mood !== undefined || post.energy !== undefined) && (
              <div className="flex items-center gap-4 mb-4">
                {post.mood !== undefined && (
                  <div className="flex items-center gap-2 bg-white/60 rounded-full px-3 py-1">
                    <span className="text-lg">{moodEmojis[post.mood - 1]}</span>
                    <span className="text-sm text-gray-600">Mood</span>
                  </div>
                )}
                {post.energy !== undefined && (
                  <div className="flex items-center gap-2 bg-white/60 rounded-full px-3 py-1">
                    <span className="text-lg">⚡</span>
                    <span className="text-sm text-gray-600">Energy {post.energy}/10</span>
                  </div>
                )}
              </div>
            )}

            {/* Reactions */}
            <div className="flex items-center justify-between pt-4 border-t border-white/50">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleReaction(post.id, 'hearts')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-full transition-all ${
                    post.hasReacted ? 'bg-pink-100 text-pink-600' : 'bg-white/60 text-gray-600 hover:bg-pink-50'
                  }`}
                >
                  <Heart className="w-4 h-4" />
                  <span className="text-sm font-medium">{post.reactions.hearts}</span>
                </button>
                <button
                  onClick={() => handleReaction(post.id, 'encouragement')}
                  className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/60 text-gray-600 hover:bg-blue-50 transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span className="text-sm font-medium">{post.reactions.encouragement}</span>
                </button>
                <button className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/60 text-gray-600 hover:bg-gray-100 transition-all">
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">{post.replies}</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCheckInTab = () => (
    <div className="space-y-6">
      {/* Quick Mood Check */}
      <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl p-6">
        <h3 className="font-semibold text-gray-800 mb-4">How are you feeling today?</h3>
        <div className="grid grid-cols-5 gap-3 mb-4">
          {moodEmojis.slice(0, 5).map((emoji, index) => (
            <button
              key={index}
              onClick={() => setUserMood(index + 1)}
              className={`aspect-square rounded-xl text-2xl flex items-center justify-center transition-all ${
                userMood === index + 1
                  ? 'bg-white scale-110 shadow-lg'
                  : 'bg-white/50 hover:bg-white/80'
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-5 gap-3">
          {moodEmojis.slice(5, 10).map((emoji, index) => (
            <button
              key={index + 5}
              onClick={() => setUserMood(index + 6)}
              className={`aspect-square rounded-xl text-2xl flex items-center justify-center transition-all ${
                userMood === index + 6
                  ? 'bg-white scale-110 shadow-lg'
                  : 'bg-white/50 hover:bg-white/80'
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Energy Slider */}
      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Energy Level: {userEnergy}/10</h3>
        <input
          type="range"
          min="1"
          max="10"
          value={userEnergy}
          onChange={(e) => setUserEnergy(parseInt(e.target.value))}
          className="w-full h-2 rounded-full appearance-none bg-white/50"
        />
      </div>

      {/* Quick Reflection */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6">
        <h3 className="font-semibold text-gray-800 mb-4">What's your biggest win or struggle today?</h3>
        <textarea
          placeholder="Share your thoughts..."
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          className="w-full h-24 bg-white/70 rounded-xl p-4 resize-none outline-none placeholder-gray-400 text-gray-700"
        />
        
        {/* Community Sharing Toggle */}
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-gray-600">Share with community?</span>
          <button
            onClick={() => setShareWithCommunity(!shareWithCommunity)}
            className={`w-12 h-6 rounded-full transition-all ${
              shareWithCommunity ? 'bg-pink-500' : 'bg-gray-300'
            }`}
          >
            <div className={`w-5 h-5 bg-white rounded-full transition-all ${
              shareWithCommunity ? 'translate-x-6' : 'translate-x-0.5'
            }`} />
          </button>
        </div>
      </div>

      {/* Submit Button */}
      <button className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all">
        Complete Check-In
      </button>
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
            <h1 className="text-lg font-semibold text-gray-800">{challengeName}</h1>
            <p className="text-sm text-gray-500">Day {challengeDay} • 127 members</p>
          </div>

          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center">
            <Users className="w-5 h-5 text-pink-600" />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-gray-100 rounded-2xl p-1">
          <button
            onClick={() => setActiveTab('feed')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
              activeTab === 'feed'
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-500'
            }`}
          >
            Community Feed
          </button>
          <button
            onClick={() => setActiveTab('checkin')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
              activeTab === 'checkin'
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-500'
            }`}
          >
            Quick Check-In
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pb-32">
        <div className="max-w-md mx-auto">
          {activeTab === 'feed' ? renderFeedTab() : renderCheckInTab()}
        </div>
      </div>
    </div>
  );
}