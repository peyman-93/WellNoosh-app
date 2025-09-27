import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions
} from 'react-native'
import Svg, { Circle, Path } from 'react-native-svg'

const { width: screenWidth } = Dimensions.get('window')

interface SleepTimeEntryProps {
  value: number // hours as decimal (e.g., 7.5 for 7 hours 30 minutes)
  onValueChange: (value: number) => void
  minHours?: number
  maxHours?: number
}

export function SleepTimeEntry({
  value,
  onValueChange,
  minHours = 4,
  maxHours = 12
}: SleepTimeEntryProps) {
  const hours = Math.floor(value)
  const minutes = Math.round((value - hours) * 60)

  const getSleepQualityInfo = (sleepHours: number) => {
    if (sleepHours < 6) {
      return { quality: 'Poor', color: '#FF6B6B', description: 'Too little sleep' }
    } else if (sleepHours < 7) {
      return { quality: 'Fair', color: '#FFA726', description: 'Below recommended' }
    } else if (sleepHours <= 9) {
      return { quality: 'Good', color: '#6B8E23', description: 'Healthy sleep' }
    } else {
      return { quality: 'Long', color: '#42A5F5', description: 'Extended sleep' }
    }
  }

  const sleepInfo = getSleepQualityInfo(value)
  const progress = Math.min((value - minHours) / (maxHours - minHours), 1)

  // SVG circle properties
  const size = 80
  const strokeWidth = 6
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (progress * circumference)

  const formatTime = (hours: number) => {
    const h = Math.floor(hours)
    const m = Math.round((hours - h) * 60)
    if (m === 0) {
      return `${h}h`
    }
    return `${h}h ${m}m`
  }

  const adjustTime = (increment: boolean) => {
    const step = 0.25 // 15-minute increments
    const newValue = increment
      ? Math.min(maxHours, value + step)
      : Math.max(minHours, value - step)
    onValueChange(newValue)
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sleep Hours</Text>

      <View style={styles.sleepContainer}>
        {/* Circular Progress */}
        <View style={styles.circularProgress}>
          <Svg width={size} height={size} style={styles.svg}>
            {/* Background circle */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#F0F0F0"
              strokeWidth={strokeWidth}
              fill="none"
            />
            {/* Progress circle */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={sleepInfo.color}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          </Svg>

          {/* Center content */}
          <View style={styles.centerContent}>
            <Text style={[styles.timeText, { color: sleepInfo.color }]}>
              {formatTime(value)}
            </Text>
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            onPress={() => adjustTime(false)}
            style={[styles.controlButton, { borderColor: sleepInfo.color }]}
            disabled={value <= minHours}
          >
            <Text style={[styles.controlText, { color: value <= minHours ? '#CCC' : sleepInfo.color }]}>
              −15m
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => adjustTime(true)}
            style={[styles.controlButton, { borderColor: sleepInfo.color }]}
            disabled={value >= maxHours}
          >
            <Text style={[styles.controlText, { color: value >= maxHours ? '#CCC' : sleepInfo.color }]}>
              +15m
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Sleep Quality Info */}
      <View style={[styles.qualityInfo, { backgroundColor: `${sleepInfo.color}20` }]}>
        <View style={styles.qualityHeader}>
          <Text style={[styles.qualityTitle, { color: sleepInfo.color }]}>
            {sleepInfo.quality} Sleep
          </Text>
        </View>
        <Text style={styles.qualityDescription}>
          {sleepInfo.description}
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
  sleepContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  circularProgress: {
    position: 'relative',
    marginBottom: 12,
  },
  svg: {
    transform: [{ rotate: '0deg' }],
  },
  centerContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Inter',
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
    minWidth: 60,
    alignItems: 'center',
  },
  controlText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  qualityInfo: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 160,
  },
  qualityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  qualityTitle: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Inter',
  },
  qualityDescription: {
    fontSize: 11,
    color: '#666666',
    fontFamily: 'Inter',
    textAlign: 'center',
  },
})