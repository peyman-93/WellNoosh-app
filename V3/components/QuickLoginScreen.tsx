import { useState } from 'react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { AuthModal } from './AuthModal';
import wellnooshIcon from 'figma:asset/4b28c64338ad95e8eae91615fbda6a4e2cc3d398.png';

interface QuickLoginScreenProps {
  onShowLogin: () => void;
  onShowSignup: () => void;
  onShowFullExperience: () => void;
}

export function QuickLoginScreen({ onShowLogin, onShowSignup, onShowFullExperience }: QuickLoginScreenProps) {
  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-green-400 via-blue-500 to-purple-600">
      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 text-center">
        {/* Logo */}
        <div className="mb-12">
          <div className="p-6 rounded-full bg-white/20 backdrop-blur-md mb-6">
            <img src={wellnooshIcon} alt="WellNoosh" className="w-20 h-20 object-contain rounded-full" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 font-brand">WellNoosh</h1>
          <p className="text-white/90 text-lg font-medium">Your Smart Cooking Pal</p>
        </div>

        {/* Quick Actions */}
        <div className="w-full max-w-sm space-y-4">
          {/* Login Button - Prominent for returning users */}
          <button 
            onClick={onShowLogin}
            className="w-full py-4 bg-white text-gray-900 rounded-2xl font-bold text-lg shadow-lg active:scale-95 transition-transform"
          >
            Welcome Back - Sign In
          </button>

          {/* Sign Up Button */}
          <button 
            onClick={onShowSignup}
            className="w-full py-4 bg-white/20 backdrop-blur-md text-white border-2 border-white/30 rounded-2xl font-semibold text-lg active:scale-95 transition-transform"
          >
            New to WellNoosh? Sign Up
          </button>

          {/* Learn More Link */}
          <button 
            onClick={onShowFullExperience}
            className="w-full py-3 text-white/80 font-medium underline"
          >
            Learn More About WellNoosh
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-6 text-center">
        <p className="text-white/70 text-sm">
          Making kitchens smarter, healthier, and more sustainable
        </p>
      </div>
    </div>
  );
}