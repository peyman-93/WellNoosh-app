import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface PostAuthSlidesProps {
  onComplete: (userData: any) => void;
  onSkip: () => void;
  userData: any;
}


const slides = [
  {
    title: "Welcome to WellNoosh!",
    subtitle: "Your AI-powered cooking companion",
    description: "Discover personalized recipes, track your nutrition, and reduce food waste with smart meal planning.",
    icon: "🍽️",
    color: ['#3b82f6', '#1d4ed8']
  },
  {
    title: "Smart Recipe Discovery",
    subtitle: "AI finds perfect recipes for you",
    description: "Get personalized meal suggestions based on your preferences, dietary needs, and what's in your pantry.",
    icon: "🤖",
    color: ['#10b981', '#059669']
  },
  {
    title: "Reduce Food Waste",
    subtitle: "Save money and the planet",
    description: "Track expiration dates, get leftover recipes, and smart shopping lists to minimize waste.",
    icon: "🌱",
    color: ['#f59e0b', '#d97706']
  },
  {
    title: "Family Meal Planning",
    subtitle: "Cooking made simple for everyone",
    description: "Create weekly meal plans, share with family, and vote on dinner options together.",
    icon: "👨‍👩‍👧‍👦",
    color: ['#8b5cf6', '#7c3aed']
  }
];

export function PostAuthSlides({ onComplete, onSkip, userData }: PostAuthSlidesProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onComplete(userData);
    }
  };

  const handleSkip = () => {
    onSkip();
  };

  const current = slides[currentSlide];

  return (
    <LinearGradient
      colors={current.color}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Skip Button */}
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>

        {/* Main Content */}
        <View style={styles.mainContent}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>{current.icon}</Text>
          </View>
          
          <Text style={styles.title}>{current.title}</Text>
          <Text style={styles.subtitle}>{current.subtitle}</Text>
          <Text style={styles.description}>{current.description}</Text>
        </View>

        {/* Bottom Section */}
        <View style={styles.bottomSection}>
          {/* Progress Dots */}
          <View style={styles.dotsContainer}>
            {slides.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  index === currentSlide && styles.activeDot
                ]}
              />
            ))}
          </View>

          {/* Next Button */}
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>
              {currentSlide === slides.length - 1 ? 'Get Started' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  skipButton: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    fontWeight: '500',
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  icon: {
    fontSize: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '600',
  },
  description: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },
  bottomSection: {
    alignItems: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    marginBottom: 32,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: 'white',
    width: 24,
  },
  nextButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 48,
    minWidth: 200,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#1f2937',
    fontSize: 16,
    fontWeight: '600',
  },
});