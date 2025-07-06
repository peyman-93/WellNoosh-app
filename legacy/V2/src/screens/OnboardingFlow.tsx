import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth } = Dimensions.get('window');

interface OnboardingFlowProps {
  onComplete: (onboardingData: any) => void;
  userName?: string;
}

interface FamilyMember {
  name: string;
  age: string;
  allergies: string[];
  medicalConditions: string[];
  dietType: string;
}

interface OnboardingData {
  dietType: string;
  allergies: string[];
  medicalConditions: string[];
  familyMembers: FamilyMember[];
  goals: string[];
  justMe: boolean;
}

export default function OnboardingFlow({ onComplete, userName = 'User' }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    dietType: '',
    allergies: [],
    medicalConditions: [],
    familyMembers: [],
    goals: [],
    justMe: false
  });

  const steps = [
    { title: 'Welcome', subtitle: 'Let\'s Personalize Your Experience' },
    { title: 'Diet Preferences', subtitle: 'What are Your Eating Habits?' },
    { title: 'Health Considerations', subtitle: 'Keep You Safe and Healthy' },
    { title: 'Medical Conditions', subtitle: 'Personalized for Your Health Needs' },
    { title: 'Family Setup', subtitle: 'Who are We Feeding?' },
    { title: 'Personalization', subtitle: 'Creating Your Perfect Experience' }
  ];

  const dietTypes = [
    {
      id: 'mediterranean',
      name: 'Mediterranean',
      description: 'Fish, Olive Oil, Vegetables, Whole Grains',
      emoji: '🐟',
      popular: true
    },
    {
      id: 'vegetarian',
      name: 'Vegetarian',
      description: 'Plant-Based with Dairy and Eggs',
      emoji: '🥗',
      popular: true
    },
    {
      id: 'vegan',
      name: 'Vegan',
      description: 'Completely Plant-Based Nutrition',
      emoji: '🌱',
      popular: false
    },
    {
      id: 'pescatarian',
      name: 'Pescatarian',
      description: 'Vegetarian with Fish and Seafood',
      emoji: '🐠',
      popular: false
    },
    {
      id: 'paleo',
      name: 'Paleo',
      description: 'Whole Foods, No Processed Ingredients',
      emoji: '🥩',
      popular: false
    },
    {
      id: 'keto',
      name: 'Ketogenic',
      description: 'High Fat, Very Low Carb Approach',
      emoji: '🥑',
      popular: false
    },
    {
      id: 'balanced',
      name: 'Balanced',
      description: 'Everything in Moderation',
      emoji: '⚖️',
      popular: true
    },
    {
      id: 'custom',
      name: 'Custom',
      description: 'I\'ll Tell the AI My Preferences',
      emoji: '🤖',
      popular: false
    }
  ];

  const commonAllergies = [
    { id: 'gluten', name: 'Gluten / Gluten Sensitivity', icon: '🌾' },
    { id: 'dairy', name: 'Dairy', icon: '🥛' },
    { id: 'nuts', name: 'Tree Nuts', icon: '🥜' },
    { id: 'shellfish', name: 'Shellfish', icon: '🦐' },
    { id: 'eggs', name: 'Eggs', icon: '🥚' },
    { id: 'soy', name: 'Soy', icon: '🫘' },
    { id: 'fish', name: 'Fish', icon: '🐟' },
    { id: 'sesame', name: 'Sesame', icon: '🌱' },
    { id: 'lactose', name: 'Lactose Intolerance', icon: '🧀' },
    { id: 'histamine', name: 'Histamine Intolerance', icon: '🍅' },
    { id: 'fructose', name: 'Fructose Malabsorption', icon: '🍎' },
    { id: 'caffeine', name: 'Caffeine Sensitivity', icon: '☕' }
  ];

  const medicalConditions = [
    { id: 'diabetes-1', name: 'Diabetes Type 1', icon: '💉' },
    { id: 'diabetes-2', name: 'Diabetes Type 2', icon: '🩸' },
    { id: 'hypertension', name: 'Hypertension', icon: '❤️' },
    { id: 'cholesterol', name: 'High Cholesterol', icon: '🧪' },
    { id: 'cardiovascular', name: 'Cardiovascular Disease', icon: '💓' },
    { id: 'celiac', name: 'Celiac Disease', icon: '🌾' },
    { id: 'ibs', name: 'Irritable Bowel Syndrome', icon: '🤝' },
    { id: 'gout', name: 'Gout', icon: '🦴' },
    { id: 'kidney', name: 'Chronic Kidney Disease', icon: '🔬' },
    { id: 'liver', name: 'Liver Disease', icon: '🫀' },
    { id: 'osteoporosis', name: 'Osteoporosis', icon: '🦵' },
    { id: 'anemia', name: 'Anemia', icon: '🔴' }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    console.log('🚀 Starting AI personalization with data:', onboardingData);
    setIsLoading(true);
    
    // Simulate AI processing
    setTimeout(() => {
      console.log('✅ AI personalization complete!');
      onComplete(onboardingData);
    }, 3000);
  };

  const handleDietSelection = (dietId: string) => {
    setOnboardingData({ ...onboardingData, dietType: dietId });
  };

  const handleAllergyToggle = (allergyId: string) => {
    const allergies = onboardingData.allergies.includes(allergyId)
      ? onboardingData.allergies.filter(a => a !== allergyId)
      : [...onboardingData.allergies, allergyId];
    
    setOnboardingData({ ...onboardingData, allergies });
  };

  const handleMedicalConditionToggle = (conditionId: string) => {
    const medicalConditions = onboardingData.medicalConditions.includes(conditionId)
      ? onboardingData.medicalConditions.filter(c => c !== conditionId)
      : [...onboardingData.medicalConditions, conditionId];
    
    setOnboardingData({ ...onboardingData, medicalConditions });
  };

  const addFamilyMember = () => {
    const newMember = { name: '', age: '', allergies: [], medicalConditions: [], dietType: '' };
    setOnboardingData({
      ...onboardingData,
      familyMembers: [...onboardingData.familyMembers, newMember]
    });
  };

  const updateFamilyMember = (index: number, field: string, value: any) => {
    const updatedMembers = [...onboardingData.familyMembers];
    updatedMembers[index] = { ...updatedMembers[index], [field]: value };
    setOnboardingData({ ...onboardingData, familyMembers: updatedMembers });
  };

  const removeFamilyMember = (index: number) => {
    const updatedMembers = onboardingData.familyMembers.filter((_, i) => i !== index);
    setOnboardingData({ ...onboardingData, familyMembers: updatedMembers });
  };

  const handleJustMeToggle = () => {
    const newJustMe = !onboardingData.justMe;
    setOnboardingData({ 
      ...onboardingData, 
      justMe: newJustMe,
      familyMembers: newJustMe ? [] : onboardingData.familyMembers
    });
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return onboardingData.dietType !== '';
      case 4:
        return onboardingData.justMe || onboardingData.familyMembers.length > 0;
      default:
        return true;
    }
  };

  const renderWelcomeStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.welcomeContent}>
        <View style={styles.logoContainer}>
          <View style={styles.logoIcon}>
            <Text style={styles.logoEmoji}>🍏</Text>
          </View>
        </View>
        <Text style={styles.welcomeTitle}>WellNoosh {userName}</Text>
        <Text style={styles.welcomeSubtitle}>
          Your AI Chef Nutritionist is Here to Help.
        </Text>
        <View style={styles.featuresContainer}>
          <View style={styles.feature}>
            <Text style={styles.checkmark}>✓</Text>
            <Text style={styles.featureText}>Personalized for You</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.checkmark}>✓</Text>
            <Text style={styles.featureText}>Family-Friendly</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderDietStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>What are Your Eating Habits?</Text>
      <Text style={styles.stepSubtitle}>Choose the Diet that Best Describes Your Preferences</Text>
      
      <ScrollView style={styles.optionsScrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.dietGrid}>
          {dietTypes.map((diet) => (
            <TouchableOpacity
              key={diet.id}
              style={[
                styles.dietOption,
                onboardingData.dietType === diet.id && styles.selectedOption
              ]}
              onPress={() => handleDietSelection(diet.id)}
              activeOpacity={0.8}
            >
              <View style={styles.dietHeader}>
                <Text style={styles.dietEmoji}>{diet.emoji}</Text>
                {diet.popular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularText}>Popular</Text>
                  </View>
                )}
                {onboardingData.dietType === diet.id && (
                  <View style={styles.checkIcon}>
                    <Text style={styles.checkIconText}>✓</Text>
                  </View>
                )}
              </View>
              <Text style={styles.dietName}>{diet.name}</Text>
              <Text style={styles.dietDescription}>{diet.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  const renderAllergiesStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconHeader}>
        <View style={styles.warningIcon}>
          <Text style={styles.warningEmoji}>⚠️</Text>
        </View>
        <Text style={styles.stepTitle}>Any Allergies or Food Sensitivities?</Text>
        <Text style={styles.stepSubtitle}>We'll Make Sure to Avoid These in All Recommendations</Text>
      </View>
      
      <ScrollView style={styles.optionsScrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.allergiesGrid}>
          {commonAllergies.map((allergy) => (
            <TouchableOpacity
              key={allergy.id}
              style={[
                styles.allergyOption,
                onboardingData.allergies.includes(allergy.id) && styles.selectedAllergyOption
              ]}
              onPress={() => handleAllergyToggle(allergy.id)}
              activeOpacity={0.8}
            >
              <Text style={styles.allergyIcon}>{allergy.icon}</Text>
              <Text style={styles.allergyName}>{allergy.name}</Text>
              {onboardingData.allergies.includes(allergy.id) && (
                <Text style={styles.allergyCheck}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      
      <Text style={styles.disclaimerText}>
        Don't See Your Sensitivity? You Can Add Custom Ones Later.
      </Text>
    </View>
  );

  const renderMedicalStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconHeader}>
        <View style={styles.medicalIcon}>
          <Text style={styles.medicalEmoji}>❤️</Text>
        </View>
        <Text style={styles.stepTitle}>Any Medical Conditions?</Text>
        <Text style={styles.stepSubtitle}>This Helps Us Create Safer, More Suitable Meal Plans</Text>
      </View>
      
      <ScrollView style={styles.optionsScrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.medicalGrid}>
          {medicalConditions.map((condition) => (
            <TouchableOpacity
              key={condition.id}
              style={[
                styles.medicalOption,
                onboardingData.medicalConditions.includes(condition.id) && styles.selectedMedicalOption
              ]}
              onPress={() => handleMedicalConditionToggle(condition.id)}
              activeOpacity={0.8}
            >
              <Text style={styles.medicalOptionIcon}>{condition.icon}</Text>
              <Text style={styles.medicalOptionName}>{condition.name}</Text>
              {onboardingData.medicalConditions.includes(condition.id) && (
                <Text style={styles.medicalCheck}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      
      <Text style={styles.disclaimerText}>
        Your Health Information is Private and Secure.
      </Text>
    </View>
  );

  const renderFamilyStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconHeader}>
        <View style={styles.familyIcon}>
          <Text style={styles.familyEmoji}>👨‍👩‍👧‍👦</Text>
        </View>
        <Text style={styles.stepTitle}>Who are We Feeding?</Text>
        <Text style={styles.stepSubtitle}>Add Family Members So We Can Plan Meals for Everyone</Text>
      </View>

      <ScrollView style={styles.familyScrollView} showsVerticalScrollIndicator={false}>
        {/* Just Me Option */}
        <TouchableOpacity
          style={[styles.justMeOption, onboardingData.justMe && styles.justMeSelected]}
          onPress={handleJustMeToggle}
          activeOpacity={0.8}
        >
          <View style={styles.justMeContent}>
            <View style={[styles.justMeIcon, onboardingData.justMe && styles.justMeIconSelected]}>
              <Text style={styles.justMeIconText}>👤</Text>
            </View>
            <View style={styles.justMeTextContainer}>
              <Text style={[styles.justMeTitle, onboardingData.justMe && styles.justMeTextSelected]}>
                Just for Me
              </Text>
              <Text style={[styles.justMeSubtitle, onboardingData.justMe && styles.justMeSubtitleSelected]}>
                Plan Meals Only for Myself
              </Text>
            </View>
          </View>
          {onboardingData.justMe && (
            <Text style={styles.justMeCheck}>✓</Text>
          )}
        </TouchableOpacity>

        {/* Family Members */}
        {!onboardingData.justMe && (
          <View style={styles.familyMembersContainer}>
            {onboardingData.familyMembers.length === 0 ? (
              <View style={styles.noFamilyContainer}>
                <Text style={styles.noFamilyTitle}>Add Your First Family Member</Text>
                <Text style={styles.noFamilySubtitle}>
                  This Could Be Yourself, Your Partner, or Your Children
                </Text>
                <TouchableOpacity
                  style={styles.addFirstMemberButton}
                  onPress={addFamilyMember}
                  activeOpacity={0.8}
                >
                  <Text style={styles.addFirstMemberText}>Add Family Member</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.familyMembersList}>
                {onboardingData.familyMembers.map((member, index) => (
                  <View key={index} style={styles.familyMemberCard}>
                    <View style={styles.memberInputRow}>
                      <View style={styles.memberInputContainer}>
                        <Text style={styles.inputLabel}>Name</Text>
                        <TextInput
                          style={styles.memberInput}
                          placeholder="e.g. Sarah"
                          value={member.name}
                          onChangeText={(value) => updateFamilyMember(index, 'name', value)}
                        />
                      </View>
                      <View style={styles.memberInputContainer}>
                        <Text style={styles.inputLabel}>Age</Text>
                        <TextInput
                          style={styles.memberInput}
                          placeholder="e.g. 32"
                          value={member.age}
                          onChangeText={(value) => updateFamilyMember(index, 'age', value)}
                          keyboardType="numeric"
                        />
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.removeMemberButton}
                      onPress={() => removeFamilyMember(index)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.removeMemberText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                
                <TouchableOpacity
                  style={styles.addMemberButton}
                  onPress={addFamilyMember}
                  activeOpacity={0.8}
                >
                  <Text style={styles.addMemberText}>+ Add Another Family Member</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );

  const renderPersonalizationStep = () => (
    <View style={styles.loadingContainer}>
      <View style={styles.loadingIconContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <View style={styles.loadingIcon}>
          <Text style={styles.loadingEmoji}>🍏</Text>
        </View>
      </View>
      
      <Text style={styles.loadingTitle}>Creating Your Perfect Experience</Text>
      <Text style={styles.loadingSubtitle}>
        We're Personalizing WellNoosh Just for You and Your Family.
      </Text>

      <View style={styles.loadingProgress}>
        <View style={styles.progressBar}>
          <LinearGradient
            colors={['#10B981', '#3B82F6', '#8B5CF6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.progressFill}
          />
        </View>
        <Text style={styles.progressText}>Setting up your preferences...</Text>
      </View>

      <View style={styles.setupItems}>
        <View style={styles.setupItem}>
          <Text style={styles.setupCheck}>✓</Text>
          <Text style={styles.setupText}>
            Processing Your {onboardingData.allergies.length + onboardingData.medicalConditions.length} Health Considerations
          </Text>
        </View>
        <View style={styles.setupItem}>
          <Text style={styles.setupCheck}>✓</Text>
          <Text style={styles.setupText}>
            Setting Up {dietTypes.find(d => d.id === onboardingData.dietType)?.name || 'Custom'} Meal Plans
          </Text>
        </View>
        <View style={styles.setupItem}>
          <Text style={styles.setupCheck}>✓</Text>
          <Text style={styles.setupText}>
            Configuring for {onboardingData.justMe ? 1 : onboardingData.familyMembers.length + 1} Family Members
          </Text>
        </View>
      </View>
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return renderWelcomeStep();
      case 1:
        return renderDietStep();
      case 2:
        return renderAllergiesStep();
      case 3:
        return renderMedicalStep();
      case 4:
        return renderFamilyStep();
      case 5:
        return renderPersonalizationStep();
      default:
        return renderWelcomeStep();
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        {renderPersonalizationStep()}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={[styles.backButton, currentStep === 0 && styles.backButtonDisabled]}
            onPress={handleBack}
            disabled={currentStep === 0}
            activeOpacity={0.7}
          >
            <Text style={[styles.backButtonText, currentStep === 0 && styles.backButtonTextDisabled]}>
              ←
            </Text>
          </TouchableOpacity>
          
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>{steps[currentStep].title}</Text>
            <Text style={styles.headerSubtitle}>{steps[currentStep].subtitle}</Text>
          </View>
          
          <View style={styles.stepCounter}>
            <Text style={styles.stepCounterText}>{currentStep + 1}/{steps.length}</Text>
          </View>
        </View>
        
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBarBackground}>
            <LinearGradient
              colors={['#3B82F6', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressBarFill, { width: `${((currentStep + 1) / steps.length) * 100}%` }]}
            />
          </View>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {renderCurrentStep()}
      </View>

      {/* Bottom Button */}
      {currentStep < 5 && (
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[styles.continueButton, !canProceed() && styles.continueButtonDisabled]}
            onPress={handleNext}
            disabled={!canProceed()}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={canProceed() ? ['#3B82F6', '#8B5CF6'] : ['#9CA3AF', '#9CA3AF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.continueButtonGradient}
            >
              <Text style={styles.continueButtonText}>Continue →</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonDisabled: {
    opacity: 0.5,
  },
  backButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  backButtonTextDisabled: {
    color: '#9CA3AF',
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  stepCounter: {
    width: 40,
    alignItems: 'center',
  },
  stepCounterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  stepContainer: {
    flex: 1,
    paddingVertical: 32,
  },
  welcomeContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 32,
  },
  logoIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoEmoji: {
    fontSize: 40,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 16,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 48,
    paddingHorizontal: 32,
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkmark: {
    fontSize: 16,
    color: '#10B981',
    fontWeight: '600',
    marginRight: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '500',
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  optionsScrollView: {
    flex: 1,
  },
  dietGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  dietOption: {
    width: (screenWidth - 44) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  selectedOption: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  dietHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    height: 30,
  },
  dietEmoji: {
    fontSize: 24,
  },
  popularBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    position: 'absolute',
    top: 0,
    right: 0,
  },
  popularText: {
    fontSize: 8,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  checkIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    right: 0,
  },
  checkIconText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  dietName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  dietDescription: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  iconHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  warningIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  warningEmoji: {
    fontSize: 24,
  },
  allergiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  allergyOption: {
    width: (screenWidth - 44) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    minHeight: 100,
  },
  selectedAllergyOption: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  allergyIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  allergyName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    lineHeight: 16,
    flex: 1,
  },
  allergyCheck: {
    fontSize: 16,
    color: '#EF4444',
    fontWeight: '600',
    marginTop: 8,
  },
  medicalIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  medicalEmoji: {
    fontSize: 24,
  },
  medicalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  medicalOption: {
    width: (screenWidth - 44) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    minHeight: 100,
  },
  selectedMedicalOption: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  medicalOptionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  medicalOptionName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    lineHeight: 16,
    flex: 1,
  },
  medicalCheck: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '600',
    marginTop: 8,
  },
  disclaimerText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 20,
  },
  familyIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  familyEmoji: {
    fontSize: 24,
  },
  familyScrollView: {
    flex: 1,
  },
  justMeOption: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    padding: 20,
    marginBottom: 24,
  },
  justMeSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  justMeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  justMeIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  justMeIconSelected: {
    backgroundColor: '#3B82F6',
  },
  justMeIconText: {
    fontSize: 20,
  },
  justMeTextContainer: {
    flex: 1,
  },
  justMeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  justMeTextSelected: {
    color: '#3B82F6',
  },
  justMeSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  justMeSubtitleSelected: {
    color: '#60A5FA',
  },
  justMeCheck: {
    fontSize: 20,
    color: '#3B82F6',
    fontWeight: '600',
  },
  familyMembersContainer: {
    flex: 1,
  },
  noFamilyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
    padding: 32,
    alignItems: 'center',
  },
  noFamilyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },
  noFamilySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  addFirstMemberButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addFirstMemberText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  familyMembersList: {
    gap: 16,
  },
  familyMemberCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
  },
  memberInputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  memberInputContainer: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  memberInput: {
    height: 44,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  removeMemberButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
  },
  removeMemberText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
  },
  addMemberButton: {
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  addMemberText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingIconContainer: {
    position: 'relative',
    marginBottom: 32,
  },
  loadingIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  loadingEmoji: {
    fontSize: 32,
  },
  loadingTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 16,
  },
  loadingSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  loadingProgress: {
    width: '100%',
    marginBottom: 32,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    width: '75%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  setupItems: {
    width: '100%',
    gap: 16,
  },
  setupItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0FDF4',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  setupCheck: {
    fontSize: 16,
    color: '#10B981',
    fontWeight: '600',
    marginRight: 12,
  },
  setupText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  bottomContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  continueButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonGradient: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});