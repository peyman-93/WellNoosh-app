import { useState, useEffect } from 'react';
import { Trophy, PartyPopper, ChefHat, Users, Clock, Star, ArrowRight, Sparkles, Heart, ThumbsUp, Meh } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface Recipe {
  id: string;
  name: string;
  image: string;
  cookTime: string;
  servings: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  rating: number;
  tags: string[];
  description: string;
  ingredients: {
    name: string;
    amount: string;
    category: string;
  }[];
  instructions: string[];
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

interface Vote {
  id: string;
  recipe: Recipe;
  createdAt: string;
  createdBy: string;
  status: 'active' | 'completed';
  votes: { [memberName: string]: 'love' | 'like' | 'maybe' };
  familyMembers: string[];
}

interface VoteResultsProps {
  voteId: string;
  onStartCooking: () => void;
  onCreateNewVote: () => void;
}

export function VoteResults({ voteId, onStartCooking, onCreateNewVote }: VoteResultsProps) {
  const [vote, setVote] = useState<Vote | null>(null);
  const [showCelebration, setShowCelebration] = useState(true);
  const [animationPhase, setAnimationPhase] = useState(0);

  useEffect(() => {
    // Load vote data
    const voteData = localStorage.getItem(`family_vote_${voteId}`);
    if (voteData) {
      const parsedVote = JSON.parse(voteData);
      setVote(parsedVote);
    }

    // Celebration animation sequence
    const timer1 = setTimeout(() => setAnimationPhase(1), 500);
    const timer2 = setTimeout(() => setAnimationPhase(2), 1500);
    const timer3 = setTimeout(() => setShowCelebration(false), 3000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [voteId]);

  if (!vote) {
    return (
      <div className="flex flex-col h-full bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse mb-4"></div>
          <h2 className="text-lg font-semibold text-gray-900 font-body">Loading results...</h2>
        </div>
      </div>
    );
  }

  const voteOptions = [
    { id: 'love', emoji: '😍', text: 'Love it!', color: 'text-red-500', bgColor: 'bg-red-50' },
    { id: 'like', emoji: '👍', text: 'Like it', color: 'text-blue-500', bgColor: 'bg-blue-50' },
    { id: 'maybe', emoji: '😐', text: 'Maybe', color: 'text-gray-500', bgColor: 'bg-gray-50' }
  ];

  const getVoteCount = (voteType: 'love' | 'like' | 'maybe') => {
    return Object.values(vote.votes).filter(v => v === voteType).length;
  };

  const getTotalVotes = () => {
    return Object.keys(vote.votes).length;
  };

  const getVotePercentage = (voteType: 'love' | 'like' | 'maybe') => {
    const total = getTotalVotes();
    if (total === 0) return 0;
    return (getVoteCount(voteType) / total) * 100;
  };

  // Determine winning vote type
  const voteResults = voteOptions.map(option => ({
    ...option,
    count: getVoteCount(option.id as 'love' | 'like' | 'maybe'),
    percentage: getVotePercentage(option.id as 'love' | 'like' | 'maybe')
  })).sort((a, b) => b.count - a.count);

  const winningVote = voteResults[0];
  const isWinner = winningVote.count > 0;

  // Get voters for each option
  const getVoters = (voteType: 'love' | 'like' | 'maybe') => {
    return Object.entries(vote.votes)
      .filter(([_, vote]) => vote === voteType)
      .map(([name, _]) => name);
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 relative overflow-hidden">
      {/* Celebration Overlay */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="text-center">
            <div className={`transition-all duration-1000 ${animationPhase >= 1 ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>
              <div className="w-32 h-32 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
                <Trophy className="w-16 h-16 text-white" />
              </div>
            </div>
            
            <div className={`transition-all duration-1000 delay-500 ${animationPhase >= 2 ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
              <h1 className="text-4xl font-bold text-white mb-2 font-body text-shadow-lg">
                🎉 We have a winner! 🎉
              </h1>
              <p className="text-xl text-white font-body text-shadow">
                {isWinner ? `${winningVote.text} wins!` : "Let's cook together!"}
              </p>
            </div>
          </div>
          
          {/* Floating emojis */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className={`absolute text-4xl animate-bounce ${animationPhase >= 1 ? 'opacity-100' : 'opacity-0'}`}
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${2 + Math.random() * 2}s`
                }}
              >
                {['🎉', '🎊', '🍽️', '👨‍🍳', '❤️', '✨'][Math.floor(Math.random() * 6)]}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center p-6 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Trophy className="w-8 h-8 text-yellow-500" />
          <h1 className="text-2xl font-bold text-gray-900 font-body">Vote Results</h1>
        </div>
        <p className="text-gray-600 font-body">
          The family has spoken! Here's what everyone thinks.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto ios-scroll p-6">
        <div className="max-w-md mx-auto space-y-6">
          {/* Winning Recipe Card */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-yellow-300 relative">
            {/* Winner Badge */}
            <div className="absolute top-4 left-4 z-10">
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
                <Trophy className="w-4 h-4" />
                <span className="text-sm font-bold">Winner!</span>
              </div>
            </div>

            <div className="relative h-64">
              <ImageWithFallback
                src={vote.recipe.image}
                alt={vote.recipe.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md rounded-full px-3 py-1 flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                <span className="text-sm font-semibold">{vote.recipe.rating}</span>
              </div>
              <div className="absolute bottom-4 left-4 right-4">
                <h2 className="text-2xl font-bold text-white mb-2 font-body">{vote.recipe.name}</h2>
                <div className="flex items-center gap-4 text-white/90 text-sm">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {vote.recipe.cookTime}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {vote.recipe.servings} servings
                  </div>
                  <div className="flex items-center gap-1">
                    <ChefHat className="w-4 h-4" />
                    {vote.recipe.difficulty}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <p className="text-gray-600 mb-4 font-body leading-relaxed">{vote.recipe.description}</p>
              <div className="flex flex-wrap gap-2">
                {vote.recipe.tags.slice(0, 4).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Vote Breakdown */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 font-body flex items-center gap-2">
              <PartyPopper className="w-5 h-5 text-purple-600" />
              Family Vote Breakdown
            </h3>
            
            <div className="space-y-4">
              {voteResults.map((result, index) => (
                <div
                  key={result.id}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    index === 0 && result.count > 0
                      ? 'border-yellow-300 bg-yellow-50 shadow-md'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{result.emoji}</span>
                      <div>
                        <h4 className={`font-semibold font-body ${
                          index === 0 && result.count > 0 ? 'text-yellow-800' : 'text-gray-900'
                        }`}>
                          {result.text}
                          {index === 0 && result.count > 0 && (
                            <span className="ml-2 text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full">
                              WINNER
                            </span>
                          )}
                        </h4>
                        <p className="text-sm text-gray-600 font-body">
                          {result.count} votes ({result.percentage.toFixed(0)}%)
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Vote Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-1000 ${
                        index === 0 && result.count > 0
                          ? 'bg-gradient-to-r from-yellow-400 to-orange-500'
                          : result.id === 'love'
                          ? 'bg-red-500'
                          : result.id === 'like'
                          ? 'bg-blue-500'
                          : 'bg-gray-500'
                      }`}
                      style={{ width: `${result.percentage}%` }}
                    ></div>
                  </div>

                  {/* Voters */}
                  {result.count > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {getVoters(result.id as 'love' | 'like' | 'maybe').map((voter, voterIndex) => (
                        <div
                          key={voterIndex}
                          className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                            index === 0 && result.count > 0
                              ? 'bg-yellow-200 text-yellow-800'
                              : result.bgColor + ' ' + result.color
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold ${
                            index === 0 && result.count > 0
                              ? 'bg-yellow-500 text-white'
                              : 'bg-white'
                          }`}>
                            {voter[0]}
                          </div>
                          {voter}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <Button
              onClick={onStartCooking}
              className="ios-button w-full py-4 text-lg font-bold text-white bg-gradient-to-r from-green-500 via-blue-500 to-purple-600 shadow-lg flex items-center justify-center gap-2"
            >
              <ChefHat className="w-5 h-5" />
              Let's Cook This Recipe!
              <ArrowRight className="w-5 h-5" />
            </Button>

            <Button
              onClick={onCreateNewVote}
              variant="outline"
              className="ios-button w-full py-3 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Create Another Family Vote
            </Button>
          </div>

          {/* Stats Summary */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
            <h3 className="font-semibold text-purple-800 mb-3 font-body">📊 Vote Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-purple-700">{getTotalVotes()}</div>
                <div className="text-sm text-purple-600 font-body">Total Votes</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-700">
                  {winningVote.percentage.toFixed(0)}%
                </div>
                <div className="text-sm text-purple-600 font-body">Winning Margin</div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-purple-200">
              <p className="text-sm text-purple-700 text-center font-body">
                🎉 Family decision made! Time to cook together and create delicious memories.
              </p>
            </div>
          </div>

          {/* WellNoosh Branding */}
          <div className="text-center py-4">
            <p className="text-xs text-gray-400 font-body">
              Family voting powered by <span className="font-semibold text-purple-600">WellNoosh</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}