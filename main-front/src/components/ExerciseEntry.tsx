import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions
} from 'react-native'

const { width: screenWidth } = Dimensions.get('window')

interface ExerciseEntryProps {
  value: number // minutes
  onValueChange: (value: number) => void
  minMinutes?: number
  maxMinutes?: number
}

export function ExerciseEntry({
  value,
  onValueChange,
  minMinutes = 0,
  maxMinutes = 180
}: ExerciseEntryProps) {
  const getExerciseInfo = (minutes: number) => {
    if (minutes === 0) {
      return {
        level: 'Rest Day',
        color: '#9CA3AF',
        description: 'No exercise today',
        intensity: 0
      }
    } else if (minutes < 15) {
      return {
        level: 'Light',
        color: '#FCD34D',
        description: 'Light activity',
        intensity: 1
      }
    } else if (minutes < 30) {
      return {
        level: 'Moderate',
        color: '#F59E0B',
        description: 'Moderate workout',
        intensity: 2
      }
    } else if (minutes < 60) {
      return {
        level: 'Active',
        color: '#10B981',
        description: 'Good workout',
        intensity: 3
      }
    } else if (minutes < 90) {
      return {
        level: 'Very Active',
        color: '#059669',
        description: 'Great session',
        intensity: 4
      }
    } else {
      return {
        level: 'Intense',
        color: '#DC2626',
        description: 'Intense training',
        intensity: 5
      }
    }
  }

  const exerciseInfo = getExerciseInfo(value)
  const progress = Math.min(value / maxMinutes, 1)

  const formatTime = (minutes: number) => {
    if (minutes === 0) return '0min'
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours === 0) return `${mins}min`
    if (mins === 0) return `${hours}h`
    return `${hours}h ${mins}min`
  }

  const adjustTime = (increment: boolean) => {
    const step = 15
    const newValue = increment
      ? Math.min(maxMinutes, value + step)
      : Math.max(minMinutes, value - step)
    onValueChange(newValue)
  }

  const renderIntensityBars = () => {
    const bars = []
    for (let i = 0; i < 5; i++) {
      const isActive = i < exerciseInfo.intensity
      bars.push(
        <View
          key={i}
          style={[
            styles.intensityBar,
            {
              height: 12 + (i * 4),
              backgroundColor: isActive ? exerciseInfo.color : '#F0F0F0',
              opacity: isActive ? 1 : 0.3
            }
          ]}
        />
      )
    }
    return bars
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Exercise Time</Text>

      <View style={styles.exerciseContainer}>
        <View style={styles.visualContainer}>
          <View style={styles.timeDisplay}>
            <Text style={[styles.timeText, { color: exerciseInfo.color }]}>
              {formatTime(value)}
            </Text>
          </View>

          <View style={styles.intensityBars}>
            {renderIntensityBars()}
          </View>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity
            onPress={() => adjustTime(false)}
            style={[styles.controlButton, { borderColor: exerciseInfo.color }]}
            disabled={value <= minMinutes}
          >
            <Text style={[styles.controlText, { color: value <= minMinutes ? '#CCC' : exerciseInfo.color }]}>
              −15min
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => adjustTime(true)}
            style={[styles.controlButton, { borderColor: exerciseInfo.color }]}
            disabled={value >= maxMinutes}
          >
            <Text style={[styles.controlText, { color: value >= maxMinutes ? '#CCC' : exerciseInfo.color }]}>
              +15min
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.exerciseInfo, { backgroundColor: `${exerciseInfo.color}20` }]}>
        <Text style={[styles.exerciseLevel, { color: exerciseInfo.color }]}>
          {exerciseInfo.level}
        </Text>
        <Text style={styles.exerciseDescription}>
          {exerciseInfo.description}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Inter',
    marginBottom: 12,
  },
  exerciseContainer: {
    alignItems: 'center',
    marginBottom: 12,
    width: '100%',
  },
  visualContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: 150,
    marginBottom: 12,
  },
  timeDisplay: {
    flex: 1,
    alignItems: 'center',
  },
  timeText: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Inter',
  },
  intensityBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    height: 28,
  },
  intensityBar: {
    width: 6,
    borderRadius: 3,
  },
  controls: {
    flexDirection: 'row',
    gap: 12,
  },
  controlButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
    minWidth: 70,
    alignItems: 'center',
  },
  controlText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  exerciseInfo: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 160,
  },
  exerciseLevel: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Inter',
    marginBottom: 2,
  },
  exerciseDescription: {
    fontSize: 11,
    color: '#666666',
    fontFamily: 'Inter',
    textAlign: 'center',
  },
})