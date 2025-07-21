import React, { useState } from 'react'
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView,
  ScrollView,
  Alert,
  Modal
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/DesignTokens'

interface Recipe {
  id: string
  name: string
  image: string
  instructions: string[]
  cookTime: string
}

interface CookingStepsScreenProps {
  recipe: Recipe
  onNavigateBack: () => void
  onCookingComplete?: () => void
}

export default function CookingStepsScreen({ 
  recipe, 
  onNavigateBack,
  onCookingComplete
}: CookingStepsScreenProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [showLeftoverModal, setShowLeftoverModal] = useState(false)
  const totalSteps = recipe.instructions.length

  const handleNextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      // Cooking completed - show leftover modal
      setShowLeftoverModal(true)
    }
  }

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const progress = ((currentStep + 1) / totalSteps) * 100

  const handleLeftoverChoice = (hasLeftovers: boolean) => {
    setShowLeftoverModal(false)
    
    if (hasLeftovers) {
      Alert.alert(
        'Leftovers Saved! 🥡',
        'Your leftovers have been added to your fridge inventory.',
        [
          {
            text: 'Great!',
            onPress: () => {
              onCookingComplete?.()
              onNavigateBack()
            }
          }
        ]
      )
    } else {
      Alert.alert(
        'Cooking Complete! 🎉',
        'Congratulations! You\'ve finished cooking. Enjoy your delicious meal!',
        [
          {
            text: 'Done',
            onPress: () => {
              onCookingComplete?.()
              onNavigateBack()
            }
          }
        ]
      )
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={Colors.gradientBackground}
        style={styles.backgroundGradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          
          <View style={styles.headerInfo}>
            <Text style={styles.recipeTitle}>{recipe.name}</Text>
            <Text style={styles.cookingTime}>⏱️ {recipe.cookTime}</Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>
            Step {currentStep + 1} of {totalSteps}
          </Text>
        </View>

        {/* Main Content */}
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {/* Recipe Image */}
            <View style={styles.recipeImageContainer}>
              <Text style={styles.recipeEmoji}>{recipe.image}</Text>
            </View>

            {/* Current Step */}
            <View style={styles.stepContainer}>
              <View style={styles.stepHeader}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{currentStep + 1}</Text>
                </View>
                <Text style={styles.stepTitle}>Step {currentStep + 1}</Text>
              </View>
              
              <Text style={styles.stepInstruction}>
                {recipe.instructions[currentStep]}
              </Text>
            </View>

            {/* Step Navigation */}
            <View style={styles.navigationSection}>
              <TouchableOpacity
                style={[
                  styles.navigationButton,
                  styles.previousButton,
                  currentStep === 0 && styles.disabledButton
                ]}
                onPress={handlePreviousStep}
                disabled={currentStep === 0}
              >
                <Text style={[
                  styles.navigationButtonText,
                  currentStep === 0 && styles.disabledButtonText
                ]}>
                  ← Previous
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.navigationButton, styles.nextButton]}
                onPress={handleNextStep}
              >
                <LinearGradient
                  colors={['#10B981', '#3B82F6']}
                  style={styles.nextButtonGradient}
                >
                  <Text style={styles.nextButtonText}>
                    {currentStep === totalSteps - 1 ? 'Complete 🎉' : 'Next →'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* All Steps Preview */}
            <View style={styles.allStepsSection}>
              <Text style={styles.allStepsTitle}>All Steps</Text>
              {recipe.instructions.map((instruction, index) => (
                <View 
                  key={index} 
                  style={[
                    styles.stepPreview,
                    index === currentStep && styles.activeStepPreview,
                    index < currentStep && styles.completedStepPreview
                  ]}
                >
                  <View style={[
                    styles.previewStepNumber,
                    index === currentStep && styles.activePreviewStepNumber,
                    index < currentStep && styles.completedPreviewStepNumber
                  ]}>
                    <Text style={[
                      styles.previewStepNumberText,
                      index === currentStep && styles.activePreviewStepNumberText,
                      index < currentStep && styles.completedPreviewStepNumberText
                    ]}>
                      {index < currentStep ? '✓' : index + 1}
                    </Text>
                  </View>
                  <Text style={[
                    styles.previewStepText,
                    index === currentStep && styles.activePreviewStepText,
                    index < currentStep && styles.completedPreviewStepText
                  ]}>
                    {instruction}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Leftover Modal */}
        <Modal
          visible={showLeftoverModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => handleLeftoverChoice(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.leftoverModal}>
              <Text style={styles.leftoverTitle}>🎉 Cooking Complete!</Text>
              <Text style={styles.leftoverSubtitle}>
                Do you have any leftovers from this meal?
              </Text>
              
              <View style={styles.leftoverOptions}>
                <TouchableOpacity
                  style={[styles.leftoverButton, styles.yesButton]}
                  onPress={() => handleLeftoverChoice(true)}
                >
                  <Text style={styles.leftoverButtonText}>🥡 Yes, I have leftovers</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.leftoverButton, styles.noButton]}
                  onPress={() => handleLeftoverChoice(false)}
                >
                  <Text style={styles.leftoverButtonText}>🍽️ No, all finished!</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </LinearGradient>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.screenPadding,
    paddingTop: Spacing.lg,
    gap: Spacing.md,
  },
  backButton: {
    padding: Spacing.sm,
  },
  backButtonText: {
    fontSize: Typography.sizes.base,
    color: Colors.accent,
    fontWeight: Typography.weights.medium,
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  recipeTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    color: Colors.foreground,
    textAlign: 'center',
  },
  cookingTime: {
    fontSize: Typography.sizes.small,
    color: Colors.mutedForeground,
    marginTop: Spacing.xs,
  },
  progressSection: {
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: Spacing.lg,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    marginBottom: Spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.success,
    borderRadius: 4,
  },
  progressText: {
    fontSize: Typography.sizes.small,
    color: Colors.foreground,
    textAlign: 'center',
    fontWeight: Typography.weights.medium,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.screenPadding,
    gap: Spacing.xl,
  },
  recipeImageContainer: {
    height: 120,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  recipeEmoji: {
    fontSize: 60,
  },
  stepContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  stepNumber: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: Typography.sizes.subsection,
    fontWeight: Typography.weights.bold,
    color: Colors.primaryForeground,
  },
  stepTitle: {
    fontSize: Typography.sizes.subsection,
    fontWeight: Typography.weights.bold,
    color: Colors.foreground,
  },
  stepInstruction: {
    fontSize: Typography.sizes.base,
    color: Colors.foreground,
    lineHeight: 24,
  },
  navigationSection: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  navigationButton: {
    flex: 1,
    height: 56,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previousButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  nextButton: {
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  navigationButtonText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.foreground,
  },
  nextButtonText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    color: Colors.primaryForeground,
  },
  disabledButtonText: {
    color: Colors.mutedForeground,
  },
  allStepsSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  allStepsTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    color: Colors.foreground,
    marginBottom: Spacing.lg,
  },
  stepPreview: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  activeStepPreview: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 2,
    borderColor: Colors.accent,
  },
  completedStepPreview: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  previewStepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    marginTop: 2,
  },
  activePreviewStepNumber: {
    backgroundColor: Colors.accent,
  },
  completedPreviewStepNumber: {
    backgroundColor: Colors.success,
  },
  previewStepNumberText: {
    fontSize: Typography.sizes.small,
    fontWeight: Typography.weights.bold,
    color: Colors.mutedForeground,
  },
  activePreviewStepNumberText: {
    color: Colors.primaryForeground,
  },
  completedPreviewStepNumberText: {
    color: Colors.primaryForeground,
  },
  previewStepText: {
    fontSize: Typography.sizes.small,
    color: Colors.mutedForeground,
    flex: 1,
    lineHeight: 18,
  },
  activePreviewStepText: {
    color: Colors.foreground,
    fontWeight: Typography.weights.medium,
  },
  completedPreviewStepText: {
    color: Colors.success,
  },
  
  // Leftover Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.screenPadding,
  },
  leftoverModal: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 350,
    alignItems: 'center',
  },
  leftoverTitle: {
    fontSize: Typography.sizes.subsection,
    fontWeight: Typography.weights.bold,
    color: Colors.foreground,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  leftoverSubtitle: {
    fontSize: Typography.sizes.base,
    color: Colors.mutedForeground,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  leftoverOptions: {
    width: '100%',
    gap: Spacing.md,
  },
  leftoverButton: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    width: '100%',
  },
  yesButton: {
    backgroundColor: Colors.success,
  },
  noButton: {
    backgroundColor: Colors.accent,
  },
  leftoverButtonText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.primaryForeground,
  },
})