// screens/DietPreferencesScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface DietPreferencesScreenProps {
  navigation?: any;
}

type DietType = 'mediterranean' | 'vegetarian' | 'vegan' | 'pescatarian' | 'paleo' | 'ketogenic' | 'balanced' | 'custom';

interface DietOption {
  id: DietType;
  name: string;
  description: string;
  emoji: string;
  popular?: boolean;
  backgroundColor: string;
}

const dietOptions: DietOption[] = [
  {
    id: 'mediterranean',
    name: 'Mediterranean',
    description: 'Fish, Olive Oil, Vegetables, Whole Grains',
    emoji: '🐟',
    popular: true,
    backgroundColor: '#FEF3C7',
  },
  {
    id: 'vegetarian',
    name: 'Vegetarian',
    description: 'Plant-Based with Dairy and Eggs',
    emoji: '🥗',
    popular: true,
    backgroundColor: '#DCFCE7',
  },
  {
    id: 'vegan',
    name: 'Vegan',
    description: 'Completely Plant-Based Nutrition',
    emoji: '🌱',
    backgroundColor: '#D1FAE5',
  },
  {
    id: 'pescatarian',
    name: 'Pescatarian',
    description: 'Vegetarian with Fish and Seafood',
    emoji: '🍤',
    backgroundColor: '#DBEAFE',
  },
  {
    id: 'paleo',
    name: 'Paleo',
    description: 'Whole Foods, No Processed Ingredients',
    emoji: '🥩',
    backgroundColor: '#FEE2E2',
  },
  {
    id: 'ketogenic',
    name: 'Ketogenic',
    description: 'High Fat, Very Low Carb Approach',
    emoji: '🥑',
    backgroundColor: '#F3E8FF',
  },
  {
    id: 'balanced',
    name: 'Balanced',
    description: 'Everything in Moderation',
    emoji: '⚖️',
    backgroundColor: '#F0F9FF',
  },
  {
    id: 'custom',
    name: 'Custom',
    description: 'Tell Me AI About My Preferences',
    emoji: '🎯',
    backgroundColor: '#FDF4FF',
  },
];

const DietPreferencesScreen: React.FC<DietPreferencesScreenProps> = ({ navigation }) => {
  const [selectedDiet, setSelectedDiet] = useState<DietType | null>(null);

  const handleDietSelect = (dietId: DietType) => {
    setSelectedDiet(dietId);
  };

  const handleContinue = () => {
    if (!selectedDiet) {
      return;
    }
    
    console.log('Selected diet:', selectedDiet);
    navigation?.navigate('Allergies');
  };

  const goBack = () => {
    navigation?.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        
        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBackground}>
            <View style={[styles.progressFill, { width: '33.33%' }]} />
          </View>
          <Text style={styles.progressText}>Step 2</Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>Diet Preferences</Text>
          <Text style={styles.subtitle}>What are Your Eating Habits?</Text>
          <Text style={styles.description}>
            Choose the Diet that Best Describes Your Preferences
          </Text>
        </View>

        {/* Diet Options Grid */}
        <View style={styles.optionsGrid}>
          {dietOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.dietCard,
                { backgroundColor: option.backgroundColor },
                selectedDiet === option.id && styles.selectedCard,
              ]}
              onPress={() => handleDietSelect(option.id)}
              activeOpacity={0.8}
            >
              {option.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularText}>Popular</Text>
                </View>
              )}
              
              <View style={styles.dietCardContent}>
                <Text style={styles.dietEmoji}>{option.emoji}</Text>
                <Text style={styles.dietName}>{option.name}</Text>
                <Text style={styles.dietDescription}>{option.description}</Text>
              </View>

              {selectedDiet === option.id && (
                <View style={styles.selectedIndicator}>
                  <Text style={styles.checkmark}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        <TouchableOpacity 
          style={[
            styles.continueButtonContainer,
            !selectedDiet && styles.disabledButton
          ]}
          onPress={handleContinue}
          activeOpacity={0.8}
          disabled={!selectedDiet}
        >
          <LinearGradient
            colors={selectedDiet ? ['#10B981', '#3B82F6', '#8B5CF6'] : ['#E5E7EB', '#E5E7EB', '#E5E7EB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.continueButton}
          >
            <Text style={[
              styles.continueButtonText,
              !selectedDiet && styles.disabledButtonText
            ]}>
              Continue
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
    gap: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {
    fontSize: 20,
    color: '#6B7280',
    fontWeight: '500',
  },
  progressContainer: {
    flex: 1,
    alignItems: 'center',
  },
  progressBackground: {
    width: '100%',
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  optionsGrid: {
    gap: 16,
  },
  dietCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  selectedCard: {
    borderColor: '#3B82F6',
    backgroundColor: '#F0F9FF',
  },
  popularBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  popularText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  dietCardContent: {
    alignItems: 'center',
  },
  dietEmoji: {
    fontSize: 32,
    marginBottom: 12,
  },
  dietName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
  },
  dietDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 16,
  },
  continueButtonContainer: {
    width: '100%',
  },
  continueButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  disabledButton: {
    opacity: 0.6,
  },
  disabledButtonText: {
    color: '#9CA3AF',
  },
});

export default DietPreferencesScreen;