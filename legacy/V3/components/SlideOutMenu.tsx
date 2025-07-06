import { useState } from 'react';
import { 
  X, User, Crown, Shield, Globe, HelpCircle, LogOut, 
  ChevronRight, Settings, Mail, Phone, Heart, CreditCard,
  FileText, MessageCircle, Lightbulb, Star
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface SlideOutMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToProfile?: () => void;
}

export function SlideOutMenu({ isOpen, onClose, onNavigateToProfile }: SlideOutMenuProps) {
  const handleNavigateToProfile = () => {
    onNavigateToProfile?.();
    onClose();
  };

  const handleSignOut = () => {
    // Handle sign out logic
    console.log('Sign out');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-[100] transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Slide out menu */}
      <div className={`fixed top-0 left-0 h-full w-80 bg-white z-[110] transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 text-white p-6 pt-16">
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center space-x-4 mb-4">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&h=80&fit=crop&crop=face"
                alt="Profile"
                className="w-16 h-16 rounded-full object-cover border-3 border-white/20"
              />
              <div className="flex-1">
                <h3 className="text-lg font-bold">Sarah Martinez</h3>
                <Badge className="bg-yellow-500 text-yellow-900 mt-1">
                  <Crown className="w-3 h-3 mr-1" />
                  Premium
                </Badge>
              </div>
            </div>
            
            <div className="text-sm text-blue-100">
              Member since December 2024
            </div>
          </div>

          {/* Menu Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Quick Actions */}
            <div className="p-4 border-b border-gray-100">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Quick Actions
              </h4>
              <div className="space-y-1">
                <button 
                  onClick={handleNavigateToProfile}
                  className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-blue-100">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-gray-900">Profile Settings</div>
                    <div className="text-sm text-gray-500">Personal info & preferences</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
                
                <button className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="p-2 rounded-lg bg-yellow-100">
                    <Crown className="w-4 h-4 text-yellow-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-gray-900">Subscription</div>
                    <div className="text-sm text-gray-500">Premium plan & billing</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Account Management */}
            <div className="p-4 border-b border-gray-100">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Account
              </h4>
              <div className="space-y-1">
                <button className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="flex-1 text-left font-medium text-gray-900">Account Info</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
                
                <button className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <Heart className="w-4 h-4 text-gray-400" />
                  <span className="flex-1 text-left font-medium text-gray-900">Dietary Preferences</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
                
                <button className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <CreditCard className="w-4 h-4 text-gray-400" />
                  <span className="flex-1 text-left font-medium text-gray-900">Payment Methods</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Settings */}
            <div className="p-4 border-b border-gray-100">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Settings
              </h4>
              <div className="space-y-1">
                <button className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <Globe className="w-4 h-4 text-gray-400" />
                  <span className="flex-1 text-left font-medium text-gray-900">Language</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">English</span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </button>
                
                <button className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <Settings className="w-4 h-4 text-gray-400" />
                  <span className="flex-1 text-left font-medium text-gray-900">App Settings</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
                
                <button className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <Shield className="w-4 h-4 text-gray-400" />
                  <span className="flex-1 text-left font-medium text-gray-900">Privacy & Security</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Help & Support */}
            <div className="p-4 border-b border-gray-100">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Support
              </h4>
              <div className="space-y-1">
                <button className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <HelpCircle className="w-4 h-4 text-gray-400" />
                  <span className="flex-1 text-left font-medium text-gray-900">Help Center</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
                
                <button className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <MessageCircle className="w-4 h-4 text-gray-400" />
                  <span className="flex-1 text-left font-medium text-gray-900">Contact Support</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
                
                <button className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <Lightbulb className="w-4 h-4 text-gray-400" />
                  <span className="flex-1 text-left font-medium text-gray-900">Feature Requests</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
                
                <button className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <Star className="w-4 h-4 text-gray-400" />
                  <span className="flex-1 text-left font-medium text-gray-900">Rate WellNoosh</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Legal */}
            <div className="p-4">
              <div className="space-y-1">
                <button className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span className="flex-1 text-left font-medium text-gray-900">Privacy Policy</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
                
                <button className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span className="flex-1 text-left font-medium text-gray-900">Terms of Service</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-gray-100 bg-gray-50">
            <Button 
              onClick={handleSignOut}
              variant="destructive" 
              className="w-full flex items-center justify-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </Button>
            
            <div className="text-center mt-3 text-xs text-gray-500">
              App Version 1.2.4
            </div>
          </div>
        </div>
      </div>
    </>
  );
}