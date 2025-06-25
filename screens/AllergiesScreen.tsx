// screens/AllergiesScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface AllergiesScreenProps {
  navigation?: any;
}

type AllergyType = 'gluten' | 'dairy' | 'nuts' | 'shellfish' | 'soy' | 'eggs' | 'fish' | 'sesame';

interface AllergyOption {
  id: AllergyType;
  name: string;
  emoji: string;
  backgroundColor: string;
}

const allergyOptions: AllergyOption[] = [
  { id: 'gluten', name: 'Gluten / Gluten Sensitivity', emoji: '🌾', backgroundColor: '#FEF3C7' },
  { id: 'dairy', name: 'Dairy', emoji: '🥛', backgroundColor: '#DBEAFE' },
  { id: 'nuts', name: 'Tree Nuts', emoji: '🥜', backgroundColor: '#DCFCE7' },
  { id: 'shellfish', name: 'Shellfish', emoji: '🦐', backgroundColor: '#FEE2E2' },
  { id: 'soy', name: 'Soy', emoji: '🫘', backgroundColor: '#F3E8FF' },
  { id: 'eggs', name: 'Eggs', emoji: '🥚', backgroundColor: '#FDF4FF' },
  { id: 'fish', name: 'Fish', emoji: '🐟', backgroundColor: '#F0F9FF' },
  { id: 'sesame', name: 'Sesame', emoji: '🌰', backgroundColor: '#F9FAFB' },
];

const AllergiesScreen: React.FC<AllergiesScreenProps> = ({ navigation }) => {
  const [selectedAllergies, setSelectedAllergies] = useState<AllergyType[]>([]);

  const handleAllergyToggle = (allergyId: AllergyType) => {
    setSelectedAllergies(prev => {
      if (prev.includes(allergyId)) {
        return prev.filter(id => id !== allergyId);
      } else {
        return [...prev, allergyId];
      }
    });
  };

  const handleContinue = () => {
    console.log('Selected allergies:', selectedAllergies);
    
    // Show completion message since MedicalConditions screen doesn't exist yet
    Alert.alert(
      'Great!', 
      `${selectedAllergies.length > 0 ? 'Allergies saved!' : 'No allergies selected.'} More onboarding screens coming next.`,
      [
        {
          text: 'Continue',
          onPress: () => {
            console.log('Onboarding step completed');
            // For now, just log completion. In the future, navigate to MedicalConditions
            // navigation?.navigate('MedicalConditions');
          }
        }
      ]
    );
  };

  const handleSkip = () => {
    console.log('Skipped allergies');
    
    // Same as continue for now
    Alert.alert(
      'Skipped', 
      'No allergies selected. More onboarding screens coming next.',
      [
        {
          text: 'Continue',
          onPress: () => {
            console.log('Allergies skipped');
            // For now, just log completion. In the future, navigate to MedicalConditions
            // navigation?.navigate('MedicalConditions');
          }
        }
      ]
    );
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
            <View style={[styles.progressFill, { width: '50%' }]} />
          </View>
          <Text style={styles.progressText}>Step 3</Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.titleSection}>
          <Text style={styles.icon}>⚠️</Text>
          <Text style={styles.title}>Any Allergies or Food Sensitivities?</Text>
          <Text style={styles.subtitle}>
            We'll Make Sure to Avoid These in All Recommendations
          </Text>
        </View>

        {/* Allergy Options */}
        <View style={styles.optionsContainer}>
          {allergyOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.allergyCard,
                { backgroundColor: option.backgroundColor },
                selectedAllergies.includes(option.id) && styles.selectedCard,
              ]}
              onPress={() => handleAllergyToggle(option.id)}
              activeOpacity={0.8}
            >
              <Text style={styles.allergyEmoji}>{option.emoji}</Text>
              <Text style={styles.allergyName}>{option.name}</Text>
              
              {selectedAllergies.includes(option.id) && (
                <View style={styles.selectedIndicator}>
                  <Text style={styles.checkmark}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.noteSection}>
          <Text style={styles.noteText}>
            Don't See Your Sensitivity? You Can Add Custom Ones Later.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        <TouchableOpacity 
          style={styles.continueButtonContainer}
          onPress={handleContinue}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#10B981', '#3B82F6', '#8B5CF6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.continueButton}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip for now</Text>
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
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  allergyCard: {
    width: '48%',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
    alignItems: 'center',
    minHeight: 100,
    justifyContent: 'center',
  },
  selectedCard: {
    borderColor: '#3B82F6',
    backgroundColor: '#F0F9FF',
  },
  allergyEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  allergyName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#111827',
    textAlign: 'center',
    lineHeight: 16,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  noteSection: {
    marginTop: 24,
    alignItems: 'center',
  },
  noteText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 16,
  },
  continueButtonContainer: {
    width: '100%',
    marginBottom: 16,
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
  skipButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
});

export default AllergiesScreen;