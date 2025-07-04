import { useState } from 'react';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Trophy, 
  Star, 
  Users, 
  TrendingUp, 
  Award,
  Plus,
  Calendar,
  Clock,
  Target,
  Zap,
  CheckCircle,
  ArrowRight,
  Flame,
  Crown,
  Gift,
  ThumbsUp,
  MessageSquare,
  BookOpen,
  Lightbulb,
  Activity,
  Apple,
  ChefHat
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar } from './ui/avatar';
import { Progress } from './ui/progress';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface CommunityPost {
  id: string;
  user: {
    name: string;
    avatar: string;
    level: number;
  };
  content: string;
  image?: string;
  recipe?: {
    name: string;
    cookTime: number;
    difficulty: string;
  };
  likes: number;
  comments: number;
  isLiked: boolean;
  timestamp: string;
}

interface Challenge {
  id: string;
  name: string;
  description: string;
  progress: number;
  target: number;
  reward: string;
  participants: number;
  daysLeft: number;
  duration: 7 | 12 | 21 | 30;
  type: 'beginner' | 'momentum' | 'transformation';
  category: 'nutrition' | 'cooking' | 'wellness' | 'budget' | 'family';
  difficulty: 'easy' | 'medium' | 'hard';
  isJoined: boolean;
  streak?: number;
  totalDays?: number;
  image: string;
  teamMembers: string[];
}

interface CommunityIdea {
  id: string;
  user: {
    name: string;
    avatar: string;
    level: number;
  };
  title: string;
  description: string;
  category: string;
  votes: number;
  isVoted: boolean;
  timestamp: string;
}

interface DailyCheckIn {
  id: string;
  user: {
    name: string;
    avatar: string;
  };
  challenge: string;
  progress: string;
  mood: number;
  timestamp: string;
}

export function Community() {
  const [activeTab, setActiveTab] = useState('challenges');
  const [challengeFilter, setChallengeFilter] = useState('all');
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [showChallengeModal, setShowChallengeModal] = useState(false);

  const communityPosts: CommunityPost[] = [
    {
      id: '1',
      user: {
        name: 'Emma Chen',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face',
        level: 12
      },
      content: 'Finally mastered my grandmother\'s dumplings recipe! The AI suggested perfect steaming times based on my altitude. Amazing how technology meets tradition! 🥟',
      image: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=400&h=300&fit=crop',
      recipe: {
        name: 'Traditional Pork Dumplings',
        cookTime: 45,
        difficulty: 'Medium'
      },
      likes: 47,
      comments: 12,
      isLiked: false,
      timestamp: '2 hours ago'
    },
    {
      id: '2',
      user: {
        name: 'Marcus Johnson',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face',
        level: 8
      },
      content: 'Week 3 of the Plant-Based Challenge! This AI-suggested Buddha bowl kept me full all afternoon. Who else is loving the energy boost? 🌱',
      image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop',
      likes: 23,
      comments: 8,
      isLiked: true,
      timestamp: '4 hours ago'
    },
    {
      id: '3',
      user: {
        name: 'Sofia Rodriguez',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face',
        level: 15
      },
      content: 'Budget meal prep Sunday! Made 12 meals for under $45 thanks to WellNosh AI optimization. My family is eating healthy without breaking the bank! 💪',
      likes: 89,
      comments: 24,
      isLiked: false,
      timestamp: '6 hours ago'
    }
  ];

  const challenges: Challenge[] = [
    // 7-day challenges (Quick wins, perfect for beginners)
    {
      id: '1',
      name: 'Plant Power Week',
      description: 'Join thousands of health enthusiasts in a 7-day plant-based eating adventure! This beginner-friendly challenge helps you discover delicious plant-based meals while reducing your environmental impact. Share your colorful plate creations, get recipe recommendations from our AI, and connect with like-minded individuals who are passionate about plant-based living.',
      progress: 3,
      target: 5,
      reward: '50 Nutrition Points + Plant Badge',
      participants: 2847,
      daysLeft: 4,
      duration: 7,
      type: 'beginner',
      category: 'nutrition',
      difficulty: 'easy',
      isJoined: true,
      streak: 3,
      totalDays: 7,
      image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&h=400&fit=crop',
      teamMembers: ['Emma Chen', 'Marcus Johnson', 'Sofia Rodriguez', '+2844 others']
    },
    {
      id: '2',
      name: 'Water Week',
      description: 'Transform your hydration habits in just 7 days! Track your daily water intake, learn about proper hydration, and feel more energized. Our community will cheer you on as you build this fundamental wellness habit. Perfect for beginners looking to establish a healthy foundation.',
      progress: 5,
      target: 7,
      reward: 'Hydration Master Badge',
      participants: 3256,
      daysLeft: 2,
      duration: 7,
      type: 'beginner',
      category: 'wellness',
      difficulty: 'easy',
      isJoined: true,
      streak: 5,
      totalDays: 7,
      image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=400&fit=crop',
      teamMembers: ['Alex Kim', 'Maria Santos', 'David Park', '+3253 others']
    },
    {
      id: '3',
      name: 'Quick Cook Challenge',
      description: 'Master the art of fast, healthy cooking! Learn time-saving techniques, discover 30-minute meal recipes, and share your quickest kitchen wins. Perfect for busy professionals and parents who want to eat well without spending hours in the kitchen.',
      progress: 2,
      target: 5,
      reward: 'Time Saver Recipe Collection',
      participants: 1845,
      daysLeft: 3,
      duration: 7,
      type: 'beginner',
      category: 'cooking',
      difficulty: 'easy',
      isJoined: false,
      image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=400&fit=crop',
      teamMembers: ['Chef Anderson', 'Lisa Park', 'Tom Wilson', '+1842 others']
    },
    
    // 12-day challenges (Momentum building without overwhelming commitment)
    {
      id: '4',
      name: 'Mindful Eating Journey',
      description: 'Discover the transformative power of mindful eating over 12 days. Learn to savor each bite, recognize hunger cues, and develop a healthier relationship with food. Our supportive community shares daily reflections, meditation techniques, and mindful meal experiences.',
      progress: 8,
      target: 12,
      reward: 'Mindfulness Mastery + Premium Tips',
      participants: 1523,
      daysLeft: 4,
      duration: 12,
      type: 'momentum',
      category: 'wellness',
      difficulty: 'medium',
      isJoined: true,
      streak: 8,
      totalDays: 12,
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop',
      teamMembers: ['Dr. Sarah Chen', 'Michael Brown', 'Anna Lee', '+1520 others']
    },
    {
      id: '5',
      name: 'Budget Smart Cooking',
      description: 'Prove that healthy eating doesn\'t have to break the bank! Over 12 days, learn budget-friendly shopping strategies, meal planning techniques, and affordable recipe swaps. Share your cost-saving wins and help others eat well for less.',
      progress: 9,
      target: 12,
      reward: 'Budget Master Certification',
      participants: 987,
      daysLeft: 3,
      duration: 12,
      type: 'momentum',
      category: 'budget',
      difficulty: 'medium',
      isJoined: true,
      streak: 9,
      totalDays: 12,
      image: 'https://images.unsplash.com/photo-1556909114-45b4628e89b6?w=600&h=400&fit=crop',
      teamMembers: ['Finance Foodie', 'Budget Mom', 'Thrifty Chef', '+984 others']
    },
    {
      id: '6',
      name: 'Family Meal Connection',
      description: 'Strengthen family bonds through shared meals! This 12-day challenge encourages families to cook and eat together, creating lasting memories and healthier relationships. Share family recipes, mealtime traditions, and tips for getting everyone involved in the kitchen.',
      progress: 0,
      target: 8,
      reward: 'Family Chef Badge + Recipe Book',
      participants: 654,
      daysLeft: 12,
      duration: 12,
      type: 'momentum',
      category: 'family',
      difficulty: 'medium',
      isJoined: false,
      image: 'https://images.unsplash.com/photo-1577303935007-0d306ee4ea20?w=600&h=400&fit=crop',
      teamMembers: ['The Johnson Family', 'Cooking Mom', 'Dad Chef', '+651 others']
    },

    // 21+ day challenges (Real habit formation and transformation)
    {
      id: '7',
      name: 'Mediterranean Transformation',
      description: 'Embark on a 21-day journey to adopt the world\'s healthiest eating pattern! Experience the Mediterranean lifestyle with olive oil, fresh vegetables, whole grains, and lean proteins. Our community of Mediterranean food lovers shares authentic recipes, cultural insights, and health transformations.',
      progress: 15,
      target: 21,
      reward: 'Mediterranean Master + Premium Recipes',
      participants: 892,
      daysLeft: 6,
      duration: 21,
      type: 'transformation',
      category: 'nutrition',
      difficulty: 'hard',
      isJoined: true,
      streak: 15,
      totalDays: 21,
      image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&h=400&fit=crop',
      teamMembers: ['Isabella Romano', 'Greek Goddess', 'Olive Oil Expert', '+889 others']
    },
    {
      id: '8',
      name: 'Zero Waste Kitchen',
      description: 'Transform your kitchen into a zero-waste powerhouse over 30 days! Learn to minimize food waste, repurpose leftovers creatively, and adopt sustainable cooking practices. Join eco-warriors who share waste-reduction tips, composting advice, and planet-friendly recipes.',
      progress: 0,
      target: 30,
      reward: 'Sustainability Champion + AI Optimizer',
      participants: 445,
      daysLeft: 30,
      duration: 30,
      type: 'transformation',
      category: 'wellness',
      difficulty: 'hard',
      isJoined: false,
      image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&h=400&fit=crop',
      teamMembers: ['Eco Chef', 'Green Goddess', 'Sustainable Sam', '+442 others']
    }
  ];

  const communityIdeas: CommunityIdea[] = [
    {
      id: '1',
      user: {
        name: 'Alex Chen',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face',
        level: 15
      },
      title: 'Weekend Batch Cooking Challenge',
      description: 'What if we had a challenge where everyone prepares meals for the week every Sunday? Share recipes, tips, and time-saving hacks!',
      category: 'Cooking',
      votes: 47,
      isVoted: false,
      timestamp: '3 hours ago'
    },
    {
      id: '2',
      user: {
        name: 'Maria Santos',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face',
        level: 12
      },
      title: 'Cultural Recipe Exchange',
      description: 'Monthly challenges featuring different cuisines. Participants learn about cultures while expanding their cooking skills!',
      category: 'Community',
      votes: 89,
      isVoted: true,
      timestamp: '1 day ago'
    }
  ];

  const dailyCheckIns: DailyCheckIn[] = [
    {
      id: '1',
      user: {
        name: 'Emma Wilson',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face'
      },
      challenge: 'Mediterranean Transformation',
      progress: 'Made Greek salad with homemade tzatziki! Feeling energized 💪',
      mood: 9,
      timestamp: '2 hours ago'
    },
    {
      id: '2',
      user: {
        name: 'James Rodriguez',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face'
      },
      challenge: 'Plant Power Week',
      progress: 'Day 3 of plant-based eating. Tried a new lentil curry recipe!',
      mood: 8,
      timestamp: '4 hours ago'
    }
  ];

  const leaderboard = [
    { rank: 1, name: 'Alex Thompson', points: 2850, avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face' },
    { rank: 2, name: 'Maria Garcia', points: 2720, avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=40&h=40&fit=crop&crop=face' },
    { rank: 3, name: 'David Kim', points: 2580, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face' },
    { rank: 4, name: 'Sarah Wilson', points: 2420, avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face' },
    { rank: 5, name: 'You', points: 2180, avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face' }
  ];

  const handleLike = (postId: string) => {
    // Handle like functionality
  };

  const handleChallengeClick = (challenge: Challenge) => {
    setSelectedChallenge(challenge);
    setShowChallengeModal(true);
  };

  const handleJoinChallenge = (challengeId: string) => {
    // Handle join challenge functionality
    console.log('Joining challenge:', challengeId);
    setShowChallengeModal(false);
  };

  const handleLeaveChallenge = (challengeId: string) => {
    // Handle leave challenge functionality
    console.log('Leaving challenge:', challengeId);
    setShowChallengeModal(false);
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      {/* Header */}
      <div className="p-6 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900 font-brand mb-2">Community</h1>
        <p className="text-gray-600 font-body">Connect, challenge yourself, and grow together</p>
        
        {/* User's Active Challenges Summary */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="bg-gradient-to-br from-green-100 to-emerald-200 p-3 rounded-xl text-center">
            <div className="text-lg font-bold text-green-800 font-body">
              {challenges.filter(c => c.isJoined).length}
            </div>
            <div className="text-xs text-green-700 font-body">Active</div>
          </div>
          <div className="bg-gradient-to-br from-blue-100 to-cyan-200 p-3 rounded-xl text-center">
            <div className="text-lg font-bold text-blue-800 font-body">
              {challenges.filter(c => c.isJoined && c.streak).reduce((total, c) => total + (c.streak || 0), 0)}
            </div>
            <div className="text-xs text-blue-700 font-body">Streak Days</div>
          </div>
          <div className="bg-gradient-to-br from-purple-100 to-pink-200 p-3 rounded-xl text-center">
            <div className="text-lg font-bold text-purple-800 font-body">2180</div>
            <div className="text-xs text-purple-700 font-body">Points</div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="px-6 py-4">
        <div className="flex space-x-1 bg-gray-100 rounded-xl p-1">
          {[
            { id: 'challenges', label: 'Challenges', icon: Trophy },
            { id: 'feed', label: 'Feed', icon: Users },
            { id: 'ideas', label: 'Ideas', icon: Lightbulb },
            { id: 'checkins', label: 'Check-ins', icon: CheckCircle },
            { id: 'connections', label: 'Connect', icon: Activity }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center space-x-1 py-2 px-2 rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-white shadow-sm text-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Icon size={14} />
                <span className="text-xs font-medium hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto ios-scroll">
        <div className="pb-24">
          {/* Challenges Tab */}
          {activeTab === 'challenges' && (
            <div className="px-6 space-y-6">
              {/* Challenge Filters */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {[
                  { id: 'all', label: 'All Challenges' },
                  { id: 'joined', label: 'My Challenges' },
                  { id: 'beginner', label: '7-Day Quick Wins' },
                  { id: 'momentum', label: '12-Day Momentum' },
                  { id: 'transformation', label: '21+ Day Transform' }
                ].map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setChallengeFilter(filter.id)}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      challengeFilter === filter.id
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              {/* Challenge Categories */}
              <div className="space-y-6">
                {/* 7-Day Challenges Section */}
                {(challengeFilter === 'all' || challengeFilter === 'beginner') && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-600 rounded-lg flex items-center justify-center">
                        <Zap className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900 font-body">7-Day Quick Wins</h2>
                        <p className="text-xs text-gray-600 font-body">Perfect for beginners - build confidence fast!</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {challenges.filter(c => c.duration === 7).map((challenge) => (
                        <VisualChallengeCard 
                          key={challenge.id} 
                          challenge={challenge} 
                          onClick={() => handleChallengeClick(challenge)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* 12-Day Challenges Section */}
                {(challengeFilter === 'all' || challengeFilter === 'momentum') && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-cyan-600 rounded-lg flex items-center justify-center">
                        <Target className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900 font-body">12-Day Momentum</h2>
                        <p className="text-xs text-gray-600 font-body">Build habits without overwhelming commitment</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {challenges.filter(c => c.duration === 12).map((challenge) => (
                        <VisualChallengeCard 
                          key={challenge.id} 
                          challenge={challenge} 
                          onClick={() => handleChallengeClick(challenge)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* 21+ Day Challenges Section */}
                {(challengeFilter === 'all' || challengeFilter === 'transformation') && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-600 rounded-lg flex items-center justify-center">
                        <Crown className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900 font-body">21+ Day Transformation</h2>
                        <p className="text-xs text-gray-600 font-body">Real habit formation and lasting change</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {challenges.filter(c => c.duration >= 21).map((challenge) => (
                        <VisualChallengeCard 
                          key={challenge.id} 
                          challenge={challenge} 
                          onClick={() => handleChallengeClick(challenge)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Show only joined challenges */}
                {challengeFilter === 'joined' && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-600 rounded-lg flex items-center justify-center">
                        <Flame className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900 font-body">My Active Challenges</h2>
                        <p className="text-xs text-gray-600 font-body">Keep up the great work!</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {challenges.filter(c => c.isJoined).map((challenge) => (
                        <VisualChallengeCard 
                          key={challenge.id} 
                          challenge={challenge} 
                          onClick={() => handleChallengeClick(challenge)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Community Feed */}
          {activeTab === 'feed' && (
            <div className="px-6 space-y-4">
              {communityPosts.map((post) => (
                <Card key={post.id} className="shadow-soft overflow-hidden">
                  <CardContent className="p-0">
                    {/* Post Header */}
                    <div className="p-4 pb-3">
                      <div className="flex items-center space-x-3">
                        <ImageWithFallback
                          src={post.user.avatar}
                          alt={post.user.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold">{post.user.name}</span>
                            <Badge variant="secondary" className="text-xs">
                              Level {post.user.level}
                            </Badge>
                          </div>
                          <span className="text-sm text-muted-foreground">{post.timestamp}</span>
                        </div>
                      </div>
                    </div>

                    {/* Post Content */}
                    <div className="px-4 pb-3">
                      <p className="text-sm leading-relaxed">{post.content}</p>
                    </div>

                    {/* Post Image */}
                    {post.image && (
                      <div className="relative">
                        <ImageWithFallback
                          src={post.image}
                          alt="Post image"
                          className="w-full h-64 object-cover"
                        />
                        {post.recipe && (
                          <div className="absolute bottom-4 left-4">
                            <Card className="bg-white/90 backdrop-blur-sm">
                              <CardContent className="p-3">
                                <h4 className="font-semibold text-sm">{post.recipe.name}</h4>
                                <div className="flex items-center space-x-3 text-xs text-muted-foreground mt-1">
                                  <span>{post.recipe.cookTime} min</span>
                                  <span>{post.recipe.difficulty}</span>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Post Actions */}
                    <div className="p-4 pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-6">
                          <button
                            onClick={() => handleLike(post.id)}
                            className={`flex items-center space-x-2 transition-colors ${
                              post.isLiked ? 'text-red-500' : 'text-gray-600 hover:text-red-500'
                            }`}
                          >
                            <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
                            <span className="text-sm">{post.likes}</span>
                          </button>
                          <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-500 transition-colors">
                            <MessageCircle className="w-5 h-5" />
                            <span className="text-sm">{post.comments}</span>
                          </button>
                          <button className="text-gray-600 hover:text-green-500 transition-colors">
                            <Share2 className="w-5 h-5" />
                          </button>
                        </div>
                        <Button size="sm" variant="outline">
                          Save Recipe
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Community Ideas */}
          {activeTab === 'ideas' && (
            <div className="px-6 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 font-body">Community Ideas</h2>
                  <p className="text-sm text-gray-600 font-body">Share and vote on new challenge ideas</p>
                </div>
                <Button size="sm" className="bg-gradient-to-r from-purple-500 to-pink-600">
                  <Plus className="w-4 h-4 mr-1" />
                  Share Idea
                </Button>
              </div>

              {communityIdeas.map((idea) => (
                <Card key={idea.id} className="shadow-soft">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <ImageWithFallback
                        src={idea.user.avatar}
                        alt={idea.user.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-semibold">{idea.user.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            Level {idea.user.level}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {idea.category}
                          </Badge>
                        </div>
                        
                        <h3 className="font-semibold text-gray-900 mb-1">{idea.title}</h3>
                        <p className="text-sm text-gray-600 mb-3">{idea.description}</p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <button
                              className={`flex items-center space-x-1 transition-colors ${
                                idea.isVoted ? 'text-purple-600' : 'text-gray-600 hover:text-purple-600'
                              }`}
                            >
                              <ThumbsUp className={`w-4 h-4 ${idea.isVoted ? 'fill-current' : ''}`} />
                              <span className="text-sm">{idea.votes}</span>
                            </button>
                            <button className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 transition-colors">
                              <MessageSquare className="w-4 h-4" />
                              <span className="text-sm">Discuss</span>
                            </button>
                          </div>
                          <span className="text-xs text-gray-500">{idea.timestamp}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Daily Check-ins */}
          {activeTab === 'checkins' && (
            <div className="px-6 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 font-body">Daily Check-ins</h2>
                  <p className="text-sm text-gray-600 font-body">See how the community is progressing</p>
                </div>
              </div>

              {dailyCheckIns.map((checkin) => (
                <Card key={checkin.id} className="shadow-soft">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <ImageWithFallback
                        src={checkin.user.avatar}
                        alt={checkin.user.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-semibold">{checkin.user.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {checkin.challenge}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-gray-700 mb-2">{checkin.progress}</p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500">Mood:</span>
                            <div className="flex items-center">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3 h-3 ${
                                    i < Math.floor(checkin.mood / 2) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <span className="text-xs text-gray-500">{checkin.timestamp}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Community Connections */}
          {activeTab === 'connections' && (
            <div className="px-6 space-y-4">
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 font-body mb-2">Community Connections</h2>
                <p className="text-gray-600 font-body mb-6">Connect with like-minded wellness enthusiasts</p>
                <Button className="bg-gradient-to-r from-blue-500 to-purple-600">
                  Find Connection Partners
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Challenge Detail Modal */}
      {showChallengeModal && selectedChallenge && (
        <ChallengeDetailModal
          challenge={selectedChallenge}
          onClose={() => setShowChallengeModal(false)}
          onJoin={() => handleJoinChallenge(selectedChallenge.id)}
          onLeave={() => handleLeaveChallenge(selectedChallenge.id)}
        />
      )}
    </div>
  );
}

// Visual Challenge Card Component
function VisualChallengeCard({ challenge, onClick }: { challenge: Challenge; onClick: () => void }) {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'hard': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'nutrition': return <Apple className="w-4 h-4" />;
      case 'cooking': return <ChefHat className="w-4 h-4" />;
      case 'wellness': return <Heart className="w-4 h-4" />;
      case 'budget': return <Target className="w-4 h-4" />;
      case 'family': return <Users className="w-4 h-4" />;
      default: return <Star className="w-4 h-4" />;
    }
  };

  return (
    <Card 
      className={`shadow-soft transition-all hover:shadow-elevated cursor-pointer group overflow-hidden ${
        challenge.isJoined ? 'ring-2 ring-blue-300' : ''
      }`}
      onClick={onClick}
    >
      <div className="relative">
        {/* Challenge Image */}
        <div className="relative h-48 overflow-hidden">
          <ImageWithFallback
            src={challenge.image}
            alt={challenge.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          
          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          
          {/* Top Right Badges */}
          <div className="absolute top-3 right-3 flex gap-2">
            {challenge.isJoined && (
              <Badge className="bg-blue-500 text-white text-xs">
                <CheckCircle className="w-3 h-3 mr-1" />
                Joined
              </Badge>
            )}
            <Badge className={`${getDifficultyColor(challenge.difficulty)} text-white text-xs`}>
              {challenge.difficulty}
            </Badge>
          </div>

          {/* Duration Badge */}
          <div className="absolute top-3 left-3">
            <Badge className="bg-white/90 text-gray-800 text-xs">
              <Calendar className="w-3 h-3 mr-1" />
              {challenge.duration} days
            </Badge>
          </div>

          {/* Bottom Content Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
            <div className="flex items-center gap-2 mb-2">
              {getCategoryIcon(challenge.category)}
              <h3 className="font-semibold font-body text-lg">{challenge.name}</h3>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{challenge.participants.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{challenge.daysLeft}d left</span>
                </div>
              </div>
              
              {/* Progress Circle Small */}
              {challenge.isJoined && (
                <div className="relative w-10 h-10">
                  <svg className="w-10 h-10 transform -rotate-90" viewBox="0 0 40 40">
                    <circle
                      cx="20"
                      cy="20"
                      r="16"
                      fill="none"
                      stroke="rgba(255,255,255,0.3)"
                      strokeWidth="4"
                    />
                    <circle
                      cx="20"
                      cy="20"
                      r="16"
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="4"
                      strokeDasharray={`${(challenge.progress / challenge.target) * 100.53} 100.53`}
                      className="transition-all duration-500"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold">{Math.round((challenge.progress / challenge.target) * 100)}%</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Card Content */}
        <CardContent className="p-4">
          <p className="text-sm text-gray-600 font-body line-clamp-2 mb-3">
            {challenge.description.substring(0, 120)}...
          </p>
          
          {/* Team Members Preview */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {challenge.teamMembers.slice(0, 3).map((member, index) => (
                  <div
                    key={index}
                    className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 border-2 border-white flex items-center justify-center text-xs text-white font-bold"
                  >
                    {member.charAt(0)}
                  </div>
                ))}
              </div>
              <span className="text-xs text-gray-500">
                +{challenge.participants - 3} members
              </span>
            </div>
            
            <Button size="sm" variant="outline" className="text-xs">
              View Details
              <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}

// Challenge Detail Modal Component
function ChallengeDetailModal({ 
  challenge, 
  onClose, 
  onJoin, 
  onLeave 
}: { 
  challenge: Challenge; 
  onClose: () => void; 
  onJoin: () => void; 
  onLeave: () => void; 
}) {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'nutrition': return <Apple className="w-5 h-5" />;
      case 'cooking': return <ChefHat className="w-5 h-5" />;
      case 'wellness': return <Heart className="w-5 h-5" />;
      case 'budget': return <Target className="w-5 h-5" />;
      case 'family': return <Users className="w-5 h-5" />;
      default: return <Star className="w-5 h-5" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header Image */}
        <div className="relative h-64">
          <ImageWithFallback
            src={challenge.image}
            alt={challenge.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors"
          >
            ✕
          </button>
          
          {/* Title Overlay */}
          <div className="absolute bottom-4 left-4 text-white">
            <div className="flex items-center gap-2 mb-2">
              {getCategoryIcon(challenge.category)}
              <h2 className="text-2xl font-bold font-body">{challenge.name}</h2>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <Badge className={`${getDifficultyColor(challenge.difficulty)}`}>
                {challenge.difficulty}
              </Badge>
              <span>{challenge.duration} days</span>
              <span>{challenge.participants.toLocaleString()} members</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Description */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 font-body">About This Challenge</h3>
            <p className="text-gray-700 leading-relaxed font-body">{challenge.description}</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{challenge.participants.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Members</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{challenge.duration}</div>
              <div className="text-sm text-gray-600">Days</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{challenge.daysLeft}</div>
              <div className="text-sm text-gray-600">Days Left</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{challenge.target}</div>
              <div className="text-sm text-gray-600">Goal</div>
            </div>
          </div>

          {/* Progress (if joined) */}
          {challenge.isJoined && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-blue-800">Your Progress</h4>
                <span className="text-blue-600 font-bold">{challenge.progress}/{challenge.target}</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(challenge.progress / challenge.target) * 100}%` }}
                />
              </div>
              {challenge.streak && (
                <div className="flex items-center gap-2 mt-3 text-sm text-blue-700">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span>Current streak: {challenge.streak} days</span>
                </div>
              )}
            </div>
          )}

          {/* Team Members */}
          <div className="mb-6">
            <h4 className="font-semibold mb-3 font-body">Team Members</h4>
            <div className="flex flex-wrap gap-2">
              {challenge.teamMembers.map((member, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 text-sm"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-xs text-white font-bold">
                    {member.charAt(0)}
                  </div>
                  <span>{member}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Reward */}
          <div className="mb-6 p-4 bg-yellow-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Gift className="w-5 h-5 text-yellow-600" />
              <h4 className="font-semibold text-yellow-800">Challenge Reward</h4>
            </div>
            <p className="text-yellow-700">{challenge.reward}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {challenge.isJoined ? (
              <>
                <Button className="flex-1 bg-green-500 hover:bg-green-600">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Go to Team Space
                </Button>
                <Button variant="outline" onClick={onLeave} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                  Leave Challenge
                </Button>
              </>
            ) : (
              <Button className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600" onClick={onJoin}>
                <Plus className="w-4 h-4 mr-2" />
                Join Challenge
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}