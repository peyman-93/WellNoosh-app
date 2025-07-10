import React from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'

interface BreathingExercisesProps {
  breathingExercises: boolean[]
  onCircleClick: (index: number) => void
  onStartGuide: () => void
  completedExercises: number
}

export function BreathingExercises({ 
  breathingExercises, 
  onCircleClick, 
  onStartGuide, 
  completedExercises 
}: BreathingExercisesProps) {
  const percentage = (completedExercises / 6) * 100
  
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
      <Pressable style={styles.actionButton} onPress={onStartGuide}>
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
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
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
})