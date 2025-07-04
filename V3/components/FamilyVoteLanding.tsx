import { useState, useEffect } from 'react';
import { Star, Clock, Users, ChefHat, Heart, ThumbsUp, Meh, Check, Trophy, PartyPopper } from 'lucide-react';
import { Badge } from './ui/badge';
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

interface FamilyVoteLandingProps {
  voteId: string;
  onVoteComplete: (voteId: string) => void;
}

export function FamilyVoteLanding({ voteId, onVoteComplete }: FamilyVoteLandingProps) {
  const [vote, setVote] = useState<Vote | null>(null);
  const [userVote, setUserVote] = useState<'love' | 'like' | 'maybe' | null>(null);
  const [userName, setUserName] = useState('');
  const [hasVoted, setHasVoted] = useState(false);
  const [showNamePrompt, setShowNamePrompt] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [voteAnimation, setVoteAnimation] = useState<string | null>(null);

  // Load vote data
  useEffect(() => {
    const voteData = localStorage.getItem(`family_vote_${voteId}`);
    if (voteData) {
      const parsedVote = JSON.parse(voteData);
      setVote(parsedVote);
    }
  }, [voteId]);

  const voteOptions = [
    {
      id: 'love',
      emoji: '😍',
      text: 'Love it!',
      subtext: "Can't wait to cook this",
      color: 'bg-red-500',
      hoverColor: 'hover:bg-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    },
    {
      id: 'like',
      emoji: '👍',
      text: 'Like it',
      subtext: 'Sounds good to me',
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      id: 'maybe',
      emoji: '😐',
      text: 'Maybe',
      subtext: 'Not really my thing',
      color: 'bg-gray-500',
      hoverColor: 'hover:bg-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200'
    }
  ];

  const handleNameSubmit = () => {
    if (userName.trim()) {
      setShowNamePrompt(false);
      // Check if this person has already voted
      const existingVote = vote?.votes[userName.trim()];
      if (existingVote) {
        setUserVote(existingVote);
        setHasVoted(true);
      }
    }
  };

  const handleVote = async (voteType: 'love' | 'like' | 'maybe') => {
    if (!vote || !userName || hasVoted) return;

    setIsSubmitting(true);
    setVoteAnimation(voteType);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Update vote data
    const updatedVote = {
      ...vote,
      votes: {
        ...vote.votes,
        [userName]: voteType
      }
    };

    // Save to localStorage
    localStorage.setItem(`family_vote_${voteId}`, JSON.stringify(updatedVote));
    
    setVote(updatedVote);
    setUserVote(voteType);
    setHasVoted(true);
    setIsSubmitting(false);
    setVoteAnimation(null);

    // Check if all family members have voted
    const totalVotes = Object.keys(updatedVote.votes).length;
    const totalMembers = updatedVote.familyMembers.length;
    
    if (totalVotes >= totalMembers) {
      // All voted, complete the vote
      setTimeout(() => {
        onVoteComplete(voteId);
      }, 2000);
    }
  };

  const getVoteCount = (voteType: 'love' | 'like' | 'maybe') => {
    if (!vote) return 0;
    return Object.values(vote.votes).filter(v => v === voteType).length;
  };

  const getTotalVotes = () => {
    if (!vote) return 0;
    return Object.keys(vote.votes).length;
  };

  const getVotePercentage = (voteType: 'love' | 'like' | 'maybe') => {
    const total = getTotalVotes();
    if (total === 0) return 0;
    return (getVoteCount(voteType) / total) * 100;
  };

  if (!vote) {
    return (
      <div className="flex flex-col h-full bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse mb-4"></div>
          <h2 className="text-lg font-semibold text-gray-900 font-body">Loading family vote...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      {/* Header */}
      <div className="text-center p-6 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Trophy className="w-6 h-6 text-orange-500" />
          <h1 className="text-xl font-bold text-gray-900 font-body">Family Vote</h1>
        </div>
        <p className="text-sm text-gray-600 font-body">
          {vote.createdBy} wants to know: Should we cook this recipe?
        </p>
        <div className="mt-2">
          <Badge variant="secondary" className="text-xs">
            {getTotalVotes()}/{vote.familyMembers.length} family members voted
          </Badge>
        </div>
      </div>

      {/* Name Prompt Modal */}
      {showNamePrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 font-body">Who's voting?</h3>
            <input
              type="text"
              placeholder="Enter your name..."
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-xl font-body"
              onKeyPress={(e) => e.key === 'Enter' && handleNameSubmit()}
            />
            <button
              onClick={handleNameSubmit}
              disabled={!userName.trim()}
              className="ios-button w-full mt-4 py-3 bg-purple-500 text-white font-semibold disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto ios-scroll p-6">
        <div className="max-w-md mx-auto space-y-6">
          {/* Recipe Card */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
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

          {/* Voting Section */}
          {!hasVoted && !showNamePrompt && (
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 font-body">What do you think, {userName}?</h3>
              <p className="text-gray-600 text-sm mb-6 font-body">Cast your vote and see what the family thinks!</p>
              
              <div className="space-y-3">
                {voteOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleVote(option.id as 'love' | 'like' | 'maybe')}
                    disabled={isSubmitting}
                    className={`ios-button w-full p-4 rounded-xl border-2 transition-all transform ${
                      voteAnimation === option.id ? 'scale-95' : 'hover:scale-105'
                    } ${
                      isSubmitting && voteAnimation === option.id
                        ? `${option.bgColor} ${option.borderColor} animate-pulse`
                        : `${option.bgColor} ${option.borderColor} hover:shadow-lg`
                    } disabled:opacity-50`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 ${option.color} rounded-full flex items-center justify-center text-2xl`}>
                        {isSubmitting && voteAnimation === option.id ? (
                          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          option.emoji
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <h4 className="font-semibold text-gray-900 font-body">{option.text}</h4>
                        <p className="text-sm text-gray-600 font-body">{option.subtext}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Vote Confirmation */}
          {hasVoted && !showNamePrompt && (
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6 border border-green-200">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 font-body">Vote Recorded!</h3>
                <p className="text-gray-600 text-sm mb-4 font-body">
                  Thanks {userName}! You voted: {voteOptions.find(o => o.id === userVote)?.text}
                </p>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl">
                    {voteOptions.find(o => o.id === userVote)?.emoji}
                  </span>
                  <span className="font-medium text-gray-700 font-body">
                    {voteOptions.find(o => o.id === userVote)?.text}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Current Vote Results */}
          {getTotalVotes() > 0 && (
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 font-body flex items-center gap-2">
                <PartyPopper className="w-5 h-5 text-purple-600" />
                Current Results
              </h3>
              
              <div className="space-y-4">
                {voteOptions.map((option) => {
                  const count = getVoteCount(option.id as 'love' | 'like' | 'maybe');
                  const percentage = getVotePercentage(option.id as 'love' | 'like' | 'maybe');
                  
                  return (
                    <div key={option.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{option.emoji}</span>
                          <span className="font-medium text-gray-900 font-body">{option.text}</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-600">{count} votes</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${option.color}`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 text-center font-body">
                  {getTotalVotes() === vote.familyMembers.length 
                    ? '🎉 Everyone has voted! Results coming soon...'
                    : `Waiting for ${vote.familyMembers.length - getTotalVotes()} more votes`
                  }
                </p>
              </div>
            </div>
          )}

          {/* Family Members Status */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3 font-body flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              Family Status
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {vote.familyMembers.map((member, index) => {
                const hasVoted = vote.votes[member];
                return (
                  <div
                    key={index}
                    className={`flex items-center gap-2 p-2 rounded-lg ${
                      hasVoted ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                      hasVoted ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                    }`}>
                      {hasVoted ? <Check className="w-3 h-3" /> : member[0]}
                    </div>
                    <span className={`text-sm font-medium ${
                      hasVoted ? 'text-green-700' : 'text-gray-600'
                    } font-body`}>
                      {member}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* WellNoosh Branding */}
          <div className="text-center py-4">
            <p className="text-xs text-gray-400 font-body">
              Powered by <span className="font-semibold text-purple-600">WellNoosh</span> • Family Cooking Made Easy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}