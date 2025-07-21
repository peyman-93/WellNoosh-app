import React, { useState, useEffect, useRef } from 'react'
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native'

interface BreathingExercisesProps {
  breathingExercises: boolean[]
  onCircleClick: (index: number) => void
  onStartGuide: () => void
  completedExercises: number
  autoStart?: boolean
}

type BreathingPhase = 'inhale' | 'hold' | 'exhale' | 'rest'

interface BreathingState {
  isActive: boolean
  currentPhase: BreathingPhase
  timeLeft: number
  cycleCount: number
  totalTime: number
}

export function BreathingExercises({ 
  breathingExercises, 
  onCircleClick, 
  onStartGuide, 
  completedExercises,
  autoStart = false
}: BreathingExercisesProps) {
  const percentage = (completedExercises / 6) * 100
  
  // Breathing exercise state
  const [breathingState, setBreathingState] = useState<BreathingState>({
    isActive: false,
    currentPhase: 'inhale',
    timeLeft: 4,
    cycleCount: 0,
    totalTime: 30
  })
  
  // Animation values
  const circleScale = useRef(new Animated.Value(1)).current
  const circleOpacity = useRef(new Animated.Value(0.8)).current
  
  // Breathing pattern: 4 seconds inhale, 7 seconds hold, 8 seconds exhale
  const breathingPattern = {
    inhale: 4,
    hold: 7,
    exhale: 8,
    rest: 1
  }
  
  useEffect(() => {
    let interval: NodeJS.Timeout
    
    if (breathingState.isActive && breathingState.totalTime > 0) {
      interval = setInterval(() => {
        setBreathingState(prev => {
          const newTimeLeft = prev.timeLeft - 1
          const newTotalTime = prev.totalTime - 1
          
          if (newTimeLeft <= 0) {
            // Move to next phase
            let nextPhase: BreathingPhase
            let nextTimeLeft: number
            let newCycleCount = prev.cycleCount
            
            switch (prev.currentPhase) {
              case 'inhale':
                nextPhase = 'hold'
                nextTimeLeft = breathingPattern.hold
                break
              case 'hold':
                nextPhase = 'exhale'
                nextTimeLeft = breathingPattern.exhale
                break
              case 'exhale':
                nextPhase = 'rest'
                nextTimeLeft = breathingPattern.rest
                newCycleCount += 1
                break
              case 'rest':
                nextPhase = 'inhale'
                nextTimeLeft = breathingPattern.inhale
                break
            }
            
            return {
              ...prev,
              currentPhase: nextPhase,
              timeLeft: nextTimeLeft,
              cycleCount: newCycleCount,
              totalTime: newTotalTime
            }
          }
          
          return {
            ...prev,
            timeLeft: newTimeLeft,
            totalTime: newTotalTime
          }
        })
      }, 1000)
    }
    
    return () => clearInterval(interval)
  }, [breathingState.isActive, breathingState.totalTime])
  
  // Animation effects based on breathing phase
  useEffect(() => {
    if (breathingState.isActive) {
      switch (breathingState.currentPhase) {
        case 'inhale':
          Animated.parallel([
            Animated.timing(circleScale, {
              toValue: 1.3,
              duration: breathingPattern.inhale * 1000,
              useNativeDriver: true,
            }),
            Animated.timing(circleOpacity, {
              toValue: 1,
              duration: breathingPattern.inhale * 1000,
              useNativeDriver: true,
            })
          ]).start()
          break
        case 'hold':
          // Keep current scale and opacity
          break
        case 'exhale':
          Animated.parallel([
            Animated.timing(circleScale, {
              toValue: 1,
              duration: breathingPattern.exhale * 1000,
              useNativeDriver: true,
            }),
            Animated.timing(circleOpacity, {
              toValue: 0.8,
              duration: breathingPattern.exhale * 1000,
              useNativeDriver: true,
            })
          ]).start()
          break
      }
    }
  }, [breathingState.currentPhase, breathingState.isActive])
  
  const startBreathingSession = () => {
    setBreathingState({
      isActive: true,
      currentPhase: 'inhale',
      timeLeft: breathingPattern.inhale,
      cycleCount: 0,
      totalTime: 30
    })
  }
  
  const stopBreathingSession = () => {
    setBreathingState({
      isActive: false,
      currentPhase: 'inhale',
      timeLeft: 4,
      cycleCount: 0,
      totalTime: 30
    })
    
    // Reset animations
    circleScale.setValue(1)
    circleOpacity.setValue(0.8)
    
    // Mark exercise as completed and call the original onStartGuide
    onStartGuide()
  }
  
  // Auto-complete when timer reaches 0
  useEffect(() => {
    if (breathingState.totalTime <= 0 && breathingState.isActive) {
      stopBreathingSession()
    }
  }, [breathingState.totalTime])

  // Auto-start is now handled by showing the start screen instead of immediately starting
  
  const getPhaseInstruction = () => {
    switch (breathingState.currentPhase) {
      case 'inhale':
        return 'Breathe In'
      case 'hold':
        return 'Hold'
      case 'exhale':
        return 'Breathe Out'
      case 'rest':
        return 'Rest'
    }
  }
  
  const getPhaseColor = () => {
    switch (breathingState.currentPhase) {
      case 'inhale':
        return '#10B981'
      case 'hold':
        return '#F59E0B'
      case 'exhale':
        return '#3B82F6'
      case 'rest':
        return '#6B7280'
    }
  }
  
  // Show start screen when autoStart is true and not yet started
  if (autoStart && !breathingState.isActive) {
    return (
      <View style={styles.startScreenContainer}>
        <View style={styles.startScreenContent}>
          <Text style={styles.startScreenTitle}>4-7-8 Breathing Exercise</Text>
          <Text style={styles.startScreenSubtitle}>
            Ready to begin your 30-second guided breathing session?
          </Text>
          
          <View style={styles.startInstructionsContainer}>
            <View style={styles.startInstruction}>
              <View style={[styles.instructionCircle, { backgroundColor: '#10B981' }]}>
                <Text style={styles.instructionNumber}>4</Text>
              </View>
              <Text style={styles.instructionText}>Breathe in slowly</Text>
            </View>
            
            <View style={styles.startInstruction}>
              <View style={[styles.instructionCircle, { backgroundColor: '#F59E0B' }]}>
                <Text style={styles.instructionNumber}>7</Text>
              </View>
              <Text style={styles.instructionText}>Hold your breath</Text>
            </View>
            
            <View style={styles.startInstruction}>
              <View style={[styles.instructionCircle, { backgroundColor: '#3B82F6' }]}>
                <Text style={styles.instructionNumber}>8</Text>
              </View>
              <Text style={styles.instructionText}>Exhale slowly</Text>
            </View>
          </View>
          
          <Pressable style={styles.startButton} onPress={startBreathingSession}>
            <Text style={styles.startButtonText}>Start Breathing Exercise</Text>
          </Pressable>
        </View>
      </View>
    )
  }
  
  if (breathingState.isActive) {
    return (
      <View style={styles.activeSessionContainer}>
        {/* Header */}
        <View style={styles.activeHeader}>
          <Text style={styles.activeTitle}>4-7-8 Breathing</Text>
          <Text style={styles.activeTimer}>{breathingState.totalTime}s</Text>
        </View>
        
        {/* Main Breathing Circle */}
        <View style={styles.breathingCircleContainer}>
          <Animated.View
            style={[
              styles.breathingCircle,
              {
                transform: [{ scale: circleScale }],
                opacity: circleOpacity,
                backgroundColor: getPhaseColor(),
              }
            ]}
          >
            <Text style={styles.breathingInstruction}>
              {getPhaseInstruction()}
            </Text>
            <Text style={styles.breathingTimer}>
              {breathingState.timeLeft}
            </Text>
          </Animated.View>
        </View>
        
        {/* Phase Information */}
        <View style={styles.phaseInfo}>
          <Text style={styles.phaseText}>
            {breathingState.currentPhase === 'inhale' && 'Breathe in slowly through your nose'}
            {breathingState.currentPhase === 'hold' && 'Hold your breath comfortably'}
            {breathingState.currentPhase === 'exhale' && 'Exhale slowly through your mouth'}
            {breathingState.currentPhase === 'rest' && 'Rest and prepare for the next breath'}
          </Text>
          <Text style={styles.cycleCount}>
            Cycle {breathingState.cycleCount + 1}
          </Text>
        </View>
        
        {/* Stop Button */}
        <Pressable 
          style={styles.stopButton} 
          onPress={stopBreathingSession}
        >
          <Text style={styles.stopButtonText}>Stop Exercise</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.icon}>🌬️</Text>
          <Text style={styles.title}>Deep Breathing</Text>
        </View>
        <Text style={styles.count}>{completedExercises}/6</Text>
      </View>
      
      {/* Progress Bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${percentage}%` }]} />
      </View>
      
      {/* Main Action Button */}
      <Pressable style={styles.actionButton} onPress={startBreathingSession}>
        <View style={styles.actionIconContainer}>
          <Text style={styles.actionIcon}>🌬️</Text>
        </View>
        <View style={styles.actionTextContainer}>
          <Text style={styles.actionTitle}>Take Deep Breaths</Text>
          <Text style={styles.actionSubtitle}>30-second guided breathing</Text>
        </View>
      </Pressable>
      
      {/* Exercise Circles */}
      <View style={styles.circlesContainer}>
        {breathingExercises.map((completed, index) => (
          <Pressable
            key={index}
            onPress={() => onCircleClick(index)}
            style={[styles.circle, completed && styles.circleFilled]}
          >
            {completed && <View style={styles.circleInner} />}
          </Pressable>
        ))}
      </View>
      
      {/* Motivational Message */}
      <Text style={styles.message}>
        {completedExercises === 0 && '🌬️ Take a moment to breathe deeply'}
        {completedExercises > 0 && completedExercises < 3 && '🌟 Great start! Keep breathing mindfully'}
        {completedExercises >= 3 && completedExercises < 6 && '💚 You\'re doing amazing!'}
        {completedExercises === 6 && '🏆 Daily breathing goal achieved!'}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    fontSize: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    fontFamily: 'System',
  },
  count: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    fontFamily: 'System',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginBottom: 20,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  actionButton: {
    flexDirection: 'row',
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    fontSize: 24,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    fontFamily: 'System',
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'System',
  },
  circlesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
  },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleFilled: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  circleInner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10B981',
  },
  message: {
    textAlign: 'center',
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'System',
  },
  
  // Active Session Styles
  activeSessionContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  activeHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  activeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    fontFamily: 'System',
  },
  activeTimer: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily: 'System',
  },
  breathingCircleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  breathingCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  breathingInstruction: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'System',
  },
  breathingTimer: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'System',
  },
  phaseInfo: {
    alignItems: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  phaseText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 22,
    fontFamily: 'System',
  },
  cycleCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
    fontFamily: 'System',
  },
  stopButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  stopButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'System',
  },
  
  // Start Screen Styles
  startScreenContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  startScreenContent: {
    alignItems: 'center',
    width: '100%',
  },
  startScreenTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: 'System',
  },
  startScreenSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
    fontFamily: 'System',
  },
  startInstructionsContainer: {
    width: '100%',
    marginBottom: 32,
    gap: 16,
  },
  startInstruction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  instructionCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'System',
  },
  instructionText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
    fontFamily: 'System',
  },
  startButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'System',
  },
})