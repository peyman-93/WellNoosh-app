import { useState, useRef, useEffect } from 'react';
import { 
  Mic, 
  MicOff, 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  ChefHat, 
  Camera, 
  Image as ImageIcon,
  Clock,
  Utensils,
  Heart,
  Star,
  Play,
  Pause,
  Volume2
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  isVoice?: boolean;
  suggestions?: string[];
  recipeCard?: {
    title: string;
    image: string;
    time: string;
    difficulty: string;
    servings: number;
  };
}

export function AIChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: "Hi Mahsa! I'm your AI Chef assistant. I can help you with recipes, cooking techniques, meal planning, and using your leftover ingredients. How can I assist you today?",
      timestamp: new Date(),
      suggestions: [
        "What can I cook with chicken and vegetables?",
        "I need a quick 15-minute recipe",
        "Help me use my leftover ingredients",
        "What's a healthy breakfast idea?"
      ]
    }
  ]);
  
  const [inputMessage, setInputMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  
  const recordingRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const quickPrompts = [
    "What can I cook with my leftovers?",
    "Suggest a healthy meal",
    "Quick dinner recipes",
    "Cooking techniques help",
    "Meal prep ideas",
    "Dietary substitutions"
  ];

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        // In a real app, you would send this to your speech-to-text service
        handleVoiceMessage("I'd like to cook something with chicken and vegetables tonight");
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      // Fallback: simulate voice input for demo
      handleVoiceMessage("I'd like to cook something with chicken and vegetables tonight");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleVoiceMessage = (transcribedText: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: transcribedText,
      timestamp: new Date(),
      isVoice: true
    };

    setMessages(prev => [...prev, userMessage]);
    generateAIResponse(transcribedText);
  };

  const sendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    generateAIResponse(inputMessage);
    setInputMessage('');
  };

  const handleSuggestion = (suggestion: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: suggestion,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    generateAIResponse(suggestion);
  };

  const generateAIResponse = (userInput: string) => {
    setIsTyping(true);
    
    setTimeout(() => {
      let response: Message;
      
      if (userInput.toLowerCase().includes('chicken') && userInput.toLowerCase().includes('vegetables')) {
        response = {
          id: Date.now().toString(),
          type: 'ai',
          content: "Perfect! I have a wonderful recipe for you. Here's a delicious Herb-Crusted Chicken with Roasted Vegetables that's both healthy and flavorful.",
          timestamp: new Date(),
          recipeCard: {
            title: "Herb-Crusted Chicken with Roasted Vegetables",
            image: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=300&h=200&fit=crop",
            time: "35 minutes",
            difficulty: "Easy",
            servings: 4
          },
          suggestions: [
            "Show me the full recipe",
            "What sides go with this?",
            "Can I make this vegetarian?",
            "How do I store leftovers?"
          ]
        };
      } else if (userInput.toLowerCase().includes('quick') || userInput.toLowerCase().includes('15')) {
        response = {
          id: Date.now().toString(),
          type: 'ai',
          content: "Here are some quick 15-minute recipes that are both delicious and nutritious! These are perfect for busy weeknights.",
          timestamp: new Date(),
          suggestions: [
            "Avocado toast with poached egg",
            "Stir-fried noodles with vegetables",
            "Caprese sandwich with fresh basil",
            "Greek yogurt parfait with berries"
          ]
        };
      } else if (userInput.toLowerCase().includes('leftover')) {
        response = {
          id: Date.now().toString(),
          type: 'ai',
          content: "I'd love to help you transform your leftovers into something amazing! What ingredients do you have in your fridge right now? You can tell me or take a photo of them.",
          timestamp: new Date(),
          suggestions: [
            "Take a photo of my ingredients",
            "I have rice and vegetables",
            "Leftover chicken and bread",
            "Show me leftover transformation ideas"
          ]
        };
      } else if (userInput.toLowerCase().includes('healthy')) {
        response = {
          id: Date.now().toString(),
          type: 'ai',
          content: "Excellent choice! Here's a nutritious and delicious meal that will fuel your body with all the right nutrients.",
          timestamp: new Date(),
          recipeCard: {
            title: "Rainbow Buddha Bowl with Tahini Dressing",
            image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&h=200&fit=crop",
            time: "25 minutes",
            difficulty: "Easy",
            servings: 2
          },
          suggestions: [
            "What makes this meal healthy?",
            "Can I meal prep this?",
            "Show me more buddha bowl ideas",
            "How many calories is this?"
          ]
        };
      } else {
        response = {
          id: Date.now().toString(),
          type: 'ai',
          content: "I'm here to help with all your cooking needs! Whether you want recipe suggestions, cooking tips, or help with meal planning, just let me know what you're looking for.",
          timestamp: new Date(),
          suggestions: [
            "Recipe suggestions",
            "Cooking techniques",
            "Meal planning help",
            "Ingredient substitutions"
          ]
        };
      }
      
      setMessages(prev => [...prev, response]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="ios-scroll bg-gray-50 relative flex flex-col h-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-6 flex-shrink-0">
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-full bg-white/20 backdrop-blur-md">
            <ChefHat className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">AI Chef Assistant</h1>
            <p className="text-purple-100">Your Personal Cooking Pal</p>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-purple-100">Online</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
              {message.type === 'ai' && (
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                    <Bot className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-xs text-gray-500">AI Chef</span>
                </div>
              )}
              
              <div className={`rounded-2xl px-4 py-3 ${
                message.type === 'user' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white border border-gray-200'
              }`}>
                <div className="flex items-start space-x-2">
                  {message.isVoice && message.type === 'user' && (
                    <Volume2 className="w-4 h-4 mt-0.5 text-blue-200" />
                  )}
                  <p className={`${message.type === 'user' ? 'text-white' : 'text-gray-900'}`}>
                    {message.content}
                  </p>
                </div>
                
                {message.recipeCard && (
                  <div className="mt-3 bg-gray-50 rounded-xl p-3 border border-gray-200">
                    <div className="flex space-x-3">
                      <ImageWithFallback
                        src={message.recipeCard.image}
                        alt={message.recipeCard.title}
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-2">{message.recipeCard.title}</h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{message.recipeCard.time}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Star className="w-3 h-3" />
                            <span>{message.recipeCard.difficulty}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Utensils className="w-3 h-3" />
                            <span>{message.recipeCard.servings} servings</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button className="w-full mt-3 py-2 bg-purple-500 text-white rounded-lg font-medium active:scale-95 transition-transform">
                      View Full Recipe
                    </button>
                  </div>
                )}
                
                <div className="text-xs opacity-70 mt-2">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              
              {message.suggestions && (
                <div className="mt-3 space-y-2">
                  {message.suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestion(suggestion)}
                      className="block w-full text-left px-3 py-2 bg-purple-50 text-purple-700 rounded-lg text-sm hover:bg-purple-100 active:scale-95 transition-all"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="max-w-[85%]">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                  <Bot className="w-3 h-3 text-white" />
                </div>
                <span className="text-xs text-gray-500">AI Chef is typing...</span>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <div className="w-8 h-8 border-2 border-gray-300 rounded-full animate-spin">
                      <div className="w-1 h-1 bg-purple-500 rounded-full absolute top-1 left-1/2 transform -translate-x-1/2 animate-pulse"></div>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">Stirring Up Ideas...</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts */}
      {messages.length === 1 && (
        <div className="px-4 pb-4">
          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((prompt, index) => (
              <button
                key={index}
                onClick={() => handleSuggestion(prompt)}
                className="px-3 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:bg-gray-50 active:scale-95 transition-all"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Voice Recording Overlay */}
      {isRecording && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-8 mx-4 text-center">
            <div className="relative mb-6">
              <div className="w-24 h-24 mx-auto rounded-full bg-red-500 flex items-center justify-center animate-pulse">
                <Mic className="w-12 h-12 text-white" />
              </div>
              <div className="absolute inset-0 w-24 h-24 mx-auto rounded-full border-4 border-red-300 animate-ping"></div>
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-2">Listening...</h3>
            <p className="text-gray-600 mb-4">Speak clearly about what you'd like to cook</p>
            
            <div className="text-2xl font-mono text-red-500 mb-6">
              {formatTime(recordingTime)}
            </div>
            
            <button
              onClick={stopRecording}
              className="ios-button bg-red-500 text-white px-8 py-4 rounded-2xl font-semibold"
            >
              <MicOff className="w-5 h-5 mr-2 inline" />
              Stop Recording
            </button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 px-4 py-4 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="flex space-x-2">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`p-3 rounded-full transition-all active:scale-95 ${
                isRecording 
                  ? 'bg-red-500 text-white' 
                  : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
              }`}
            >
              {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            
            <button className="p-3 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 active:scale-95 transition-all">
              <Camera className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 relative">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask your AI Chef anything..."
              className="rounded-2xl border-gray-200 pr-12"
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            />
            <button
              onClick={sendMessage}
              disabled={!inputMessage.trim()}
              className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full transition-all active:scale-95 ${
                inputMessage.trim()
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-200 text-gray-400'
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}