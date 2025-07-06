import { useState } from 'react';
import { ArrowLeft, Share2, MessageCircle, Send, Copy, Users, Clock, Star, ChefHat } from 'lucide-react';
import { Button } from './ui/button';
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

interface FamilyVoteShareProps {
  recipe: Recipe;
  onBack: () => void;
  onVoteCreated: (voteId: string) => void;
}

export function FamilyVoteShare({ recipe, onBack, onVoteCreated }: FamilyVoteShareProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [familyMembers, setFamilyMembers] = useState<string[]>(['Mom', 'Dad', 'Sarah', 'Mike']);
  const [customMessage, setCustomMessage] = useState('');
  const [isCreatingVote, setIsCreatingVote] = useState(false);

  // Generate unique vote ID and link
  const voteId = `vote_${recipe.id}_${Date.now()}`;
  const voteLink = `https://wellnoosh.app/vote/${voteId}`;

  // Default message template
  const defaultMessage = `🍽️ Hey family! I found this delicious recipe "${recipe.name}" on WellNoosh!\n\n⭐ ${recipe.rating}/5 stars • ⏱️ ${recipe.cookTime} • 👥 ${recipe.servings} servings\n\n${recipe.description}\n\nShould we cook this together? Vote here: ${voteLink}\n\n- Powered by WellNoosh`;

  const finalMessage = customMessage || defaultMessage;

  const platforms = [
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      icon: '💬',
      color: 'bg-green-500',
      url: `https://wa.me/?text=${encodeURIComponent(finalMessage)}`
    },
    {
      id: 'telegram',
      name: 'Telegram',
      icon: '✈️',
      color: 'bg-blue-500',
      url: `https://t.me/share/url?url=${encodeURIComponent(voteLink)}&text=${encodeURIComponent(finalMessage)}`
    },
    {
      id: 'messages',
      name: 'Messages',
      icon: '💬',
      color: 'bg-blue-400',
      url: `sms:?body=${encodeURIComponent(finalMessage)}`
    }
  ];

  const handleCreateVote = async () => {
    setIsCreatingVote(true);
    
    // Simulate creating vote in backend
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Store vote data in localStorage for demo
    const voteData = {
      id: voteId,
      recipe: recipe,
      createdAt: new Date().toISOString(),
      createdBy: 'You',
      status: 'active',
      votes: {},
      familyMembers: familyMembers
    };
    
    localStorage.setItem(`family_vote_${voteId}`, JSON.stringify(voteData));
    
    setIsCreatingVote(false);
    onVoteCreated(voteId);
  };

  const handleShare = (platform: any) => {
    // Create the vote first
    handleCreateVote();
    
    // Open sharing platform
    if (platform.id === 'copy') {
      navigator.clipboard.writeText(finalMessage);
    } else {
      window.open(platform.url, '_blank');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(finalMessage);
    // You could add a toast notification here
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      {/* Header */}
      <div className="flex items-center justify-between p-6 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <button onClick={onBack} className="ios-button p-2 text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <h1 className="text-lg font-bold text-gray-900 font-body">Share with Family</h1>
          <p className="text-sm text-gray-600 font-body">Let them vote on this recipe!</p>
        </div>
        <div className="w-9"></div> {/* Spacer for centering */}
      </div>

      <div className="flex-1 overflow-y-auto ios-scroll p-6">
        <div className="max-w-md mx-auto space-y-6">
          {/* Recipe Preview Card */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
            <div className="relative h-48">
              <ImageWithFallback
                src={recipe.image}
                alt={recipe.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md rounded-full px-3 py-1 flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                <span className="text-sm font-semibold">{recipe.rating}</span>
              </div>
              <div className="absolute bottom-4 left-4 right-4">
                <h2 className="text-xl font-bold text-white mb-2 font-body">{recipe.name}</h2>
                <div className="flex items-center gap-4 text-white/90 text-sm">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {recipe.cookTime}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {recipe.servings} servings
                  </div>
                  <div className="flex items-center gap-1">
                    <ChefHat className="w-4 h-4" />
                    {recipe.difficulty}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4">
              <p className="text-gray-600 mb-3 font-body leading-relaxed">{recipe.description}</p>
              <div className="flex flex-wrap gap-2">
                {recipe.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Family Members */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3 font-body flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              Family Members ({familyMembers.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {familyMembers.map((member, index) => (
                <div key={index} className="flex items-center gap-2 bg-purple-50 px-3 py-2 rounded-full">
                  <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                    {member[0]}
                  </div>
                  <span className="text-sm font-medium text-purple-700 font-body">{member}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Message Preview */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3 font-body flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-blue-600" />
              Message Preview
            </h3>
            <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 font-body leading-relaxed whitespace-pre-line border">
              {finalMessage}
            </div>
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-gray-500 font-body">
                Vote link: {voteLink.substring(0, 35)}...
              </span>
              <button
                onClick={copyToClipboard}
                className="ios-button text-blue-600 text-sm font-medium flex items-center gap-1"
              >
                <Copy className="w-4 h-4" />
                Copy
              </button>
            </div>
          </div>

          {/* Share Platforms */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4 font-body flex items-center gap-2">
              <Share2 className="w-5 h-5 text-green-600" />
              Choose Platform
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {platforms.map((platform) => (
                <button
                  key={platform.id}
                  onClick={() => handleShare(platform)}
                  disabled={isCreatingVote}
                  className={`ios-button w-full p-4 rounded-xl flex items-center gap-4 text-left transition-all ${
                    selectedPlatform === platform.id
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
                  } border disabled:opacity-50`}
                >
                  <div className={`w-12 h-12 ${platform.color} rounded-xl flex items-center justify-center text-white text-xl`}>
                    {platform.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 font-body">{platform.name}</h4>
                    <p className="text-sm text-gray-600 font-body">
                      Share with family via {platform.name}
                    </p>
                  </div>
                  <Send className="w-5 h-5 text-gray-400" />
                </button>
              ))}
            </div>
          </div>

          {/* Create Vote Button */}
          <button
            onClick={handleCreateVote}
            disabled={isCreatingVote}
            className="ios-button w-full py-4 text-lg font-bold text-white bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 shadow-lg disabled:opacity-50"
          >
            {isCreatingVote ? 'Creating Family Vote...' : 'Create Family Vote'}
          </button>

          {/* Tips */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
            <h3 className="font-semibold text-purple-800 mb-2 font-body">💡 Family Vote Tips</h3>
            <ul className="text-sm text-purple-700 space-y-1 font-body">
              <li>• Family members can vote: 😍 Love it, 👍 Like it, or 😐 Maybe</li>
              <li>• Voting is anonymous until results are revealed</li>
              <li>• You'll get notified when everyone has voted</li>
              <li>• The winning recipe gets a celebration! 🎉</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}