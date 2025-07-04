import { ArrowRight } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import wellnooshIcon from 'figma:asset/4b28c64338ad95e8eae91615fbda6a4e2cc3d398.png';

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

export function LandingPage({ onGetStarted, onSignIn }: LandingPageProps) {
  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      {/* Header with Logo */}
      <div className="flex-shrink-0 text-center pt-12 pb-8">
        <img src={wellnooshIcon} alt="WellNoosh" className="w-16 h-16 object-contain rounded-full wellnoosh-logo-large mx-auto mb-3" />
        <h1 className="text-xl font-bold brand-title mb-1 font-brand">WellNoosh</h1>
        <p className="text-gray-600 text-sm font-body">Your Smart Cooking Pal</p>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto ios-scroll">
        <div className="px-6 pb-6">
          <div className="max-w-sm mx-auto">
            {/* Welcome Section */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 font-body">
                Welcome to <span className="text-blue-600">WellNoosh</span>
              </h2>
              <p className="text-gray-600 leading-relaxed font-body">
                Stop wasting food. Stay healthy. Save money.
                <br />
                All with your personal AI nutrition assistant.
              </p>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-3 gap-3 mb-8">
              {/* Stop Waste */}
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">🥬</span>
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 text-sm mb-1 font-body">Stop Waste</h3>
                <p className="text-green-600 font-bold text-xs font-body">40% Reduction</p>
              </div>

              {/* Stay Healthy */}
              <div className="text-center">
                <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">❤️</span>
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 text-sm mb-1 font-body">Stay Healthy</h3>
                <p className="text-red-600 font-bold text-xs font-body">Personalized</p>
              </div>

              {/* Save Money */}
              <div className="text-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">💰</span>
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 text-sm mb-1 font-body">Save Money</h3>
                <p className="text-yellow-600 font-bold text-xs font-body">$250+ Monthly</p>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="space-y-4 mb-8">
              {/* Get Started Free Button */}
              <button
                onClick={onGetStarted}
                className="ios-button w-full py-4 text-lg font-bold text-white bg-gradient-to-r from-green-500 via-blue-500 to-purple-600 shadow-lg flex items-center justify-center gap-2"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </button>

              {/* Already Have Account Link */}
              <button
                onClick={onSignIn}
                className="ios-button w-full py-3 text-gray-700 font-medium font-body"
              >
                I Already Have an Account
              </button>
            </div>

            {/* Social Proof */}
            <div className="text-center">
              <p className="text-gray-500 text-sm font-body">
                Join 50,000+ families eating smarter
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}