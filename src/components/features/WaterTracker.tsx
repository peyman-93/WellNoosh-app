import React from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'

interface WaterTrackerProps {
  waterIntake: boolean[]
  onGlassClick: (index: number) => void
  completedGlasses: number
}

export function WaterTracker({ waterIntake, onGlassClick, completedGlasses }: WaterTrackerProps) {
  const percentage = (completedGlasses / 10) * 100
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.icon}>💧</Text>
          <Text style={styles.title}>Daily Hydration</Text>
        </View>
        <Text style={styles.count}>{completedGlasses}/10</Text>
      </View>
      
      {/* Progress Bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${percentage}%` }]} />
      </View>
      
      {/* Water Glasses */}
      <View style={styles.glassesContainer}>
        {waterIntake.map((filled, index) => (
          <Pressable
            key={index}
            onPress={() => onGlassClick(index)}
            style={[styles.glass, filled && styles.glassFilled]}
          >
            <View style={[styles.glassInner, filled && styles.glassInnerFilled]} />
          </Pressable>
        ))}
      </View>
      
      {/* Motivational Message */}
      <Text style={styles.message}>
        {completedGlasses === 0 && '💧 Start your day with water!'}
        {completedGlasses > 0 && completedGlasses < 5 && '🌟 Great start! Keep going!'}
        {completedGlasses >= 5 && completedGlasses < 10 && '💪 Almost there!'}
        {completedGlasses === 10 && '🏆 Daily goal achieved!'}
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
    backgroundColor: '#3B82F6',
    borderRadius: 3,
  },
  glassesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  glass: {
    width: 28,
    height: 36,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    backgroundColor: 'white',
    justifyContent: 'flex-end',
  },
  glassFilled: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  glassInner: {
    height: 0,
    backgroundColor: 'transparent',
    borderRadius: 4,
    margin: 2,
  },
  glassInnerFilled: {
    height: '80%',
    backgroundColor: '#3B82F6',
  },
  message: {
    textAlign: 'center',
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'System',
  },
})