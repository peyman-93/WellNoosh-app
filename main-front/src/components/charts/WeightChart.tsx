import React from 'react'
import { View, Text, StyleSheet, Dimensions } from 'react-native'
import Svg, { Path, Circle, Line, Text as SvgText, G, Defs, LinearGradient, Stop } from 'react-native-svg'

const { width: screenWidth } = Dimensions.get('window')

interface WeightData {
  date: string
  weight: number
  day: string
}

interface WeightChartProps {
  data: WeightData[]
  targetWeight: number
  startWeight: number
  width?: number
  height?: number
}

export function WeightChart({ 
  data, 
  targetWeight, 
  startWeight,
  width = screenWidth - 40, 
  height = 200 
}: WeightChartProps) {
  const chartWidth = width - 60
  const chartHeight = height - 60
  const padding = 30

  const allWeights = [...data.map(d => d.weight), targetWeight, startWeight]
  const maxValue = Math.max(...allWeights) + 2
  const minValue = Math.min(...allWeights) - 2

  const getX = (index: number) => padding + (index * chartWidth) / (data.length - 1)
  const getY = (value: number) => padding + chartHeight - ((value - minValue) / (maxValue - minValue)) * chartHeight

  // Weight progress line
  const weightPath = data.map((point, index) => {
    const x = getX(index)
    const y = getY(point.weight)
    return index === 0 ? `M${x},${y}` : `L${x},${y}`
  }).join(' ')

  // Target weight line (horizontal)
  const targetY = getY(targetWeight)

  // Calculate progress
  const currentWeight = data[data.length - 1]?.weight || startWeight
  const totalProgress = Math.abs(startWeight - targetWeight)
  const currentProgress = Math.abs(startWeight - currentWeight)
  const progressPercentage = totalProgress > 0 ? (currentProgress / totalProgress) * 100 : 0

  // Determine if gaining or losing weight
  const isLosing = startWeight > targetWeight
  const weightChange = currentWeight - startWeight
  const weightChangeText = weightChange > 0 ? `+${weightChange.toFixed(1)}` : weightChange.toFixed(1)

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Weight Progress</Text>
      <Svg width={width} height={height} style={styles.chart}>
        <Defs>
          <LinearGradient id="weightGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
            <Stop offset="100%" stopColor="#3B82F6" stopOpacity="0.05" />
          </LinearGradient>
        </Defs>
        
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = padding + chartHeight - (ratio * chartHeight)
          const value = (minValue + (maxValue - minValue) * ratio).toFixed(1)
          return (
            <G key={ratio}>
              <Line
                x1={padding}
                y1={y}
                x2={padding + chartWidth}
                y2={y}
                stroke="#E0E0E0"
                strokeWidth="0.5"
                strokeDasharray="2,2"
              />
              <SvgText
                x={padding - 10}
                y={y + 4}
                fontSize="10"
                fill="#4A4A4A"
                textAnchor="end"
                fontFamily="Inter"
              >
                {value}
              </SvgText>
            </G>
          )
        })}

        {/* Target weight line */}
        <Line
          x1={padding}
          y1={targetY}
          x2={padding + chartWidth}
          y2={targetY}
          stroke="#10B981"
          strokeWidth="2"
          strokeDasharray="5,5"
        />

        {/* Target weight label */}
        <SvgText
          x={padding + chartWidth - 50}
          y={targetY - 8}
          fontSize="10"
          fill="#10B981"
          fontFamily="Inter"
          fontWeight="600"
        >
          Target: {targetWeight}kg
        </SvgText>

        {/* Weight progress line */}
        <Path
          d={weightPath}
          stroke="#3B82F6"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {data.map((point, index) => (
          <Circle
            key={index}
            cx={getX(index)}
            cy={getY(point.weight)}
            r="5"
            fill="#3B82F6"
            stroke="white"
            strokeWidth="2"
          />
        ))}

        {/* X-axis labels */}
        {data.map((point, index) => (
          <SvgText
            key={`label-${index}`}
            x={getX(index)}
            y={padding + chartHeight + 20}
            fontSize="10"
            fill="#4A4A4A"
            textAnchor="middle"
            fontFamily="Inter"
          >
            {point.day}
          </SvgText>
        ))}
      </Svg>

      {/* Progress indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Progress to Goal</Text>
          <Text style={[
            styles.progressPercentage,
            { color: progressPercentage > 50 ? '#10B981' : '#F59E0B' }
          ]}>
            {Math.round(progressPercentage)}%
          </Text>
        </View>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: `${Math.min(100, progressPercentage)}%`,
                backgroundColor: progressPercentage > 50 ? '#10B981' : '#F59E0B'
              }
            ]} 
          />
        </View>
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{currentWeight.toFixed(1)} kg</Text>
          <Text style={styles.statLabel}>Current</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[
            styles.statValue,
            { color: weightChange < 0 && isLosing ? '#10B981' : weightChange > 0 && !isLosing ? '#10B981' : '#EF4444' }
          ]}>
            {weightChangeText} kg
          </Text>
          <Text style={styles.statLabel}>Change</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {Math.abs(currentWeight - targetWeight).toFixed(1)} kg
          </Text>
          <Text style={styles.statLabel}>To Goal</Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
    fontFamily: 'Inter',
  },
  chart: {
    marginVertical: 8,
  },
  progressContainer: {
    marginTop: 16,
    marginBottom: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: '#4A4A4A',
    fontFamily: 'Inter',
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Inter',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3B82F6',
    fontFamily: 'Inter',
  },
  statLabel: {
    fontSize: 12,
    color: '#4A4A4A',
    marginTop: 4,
    fontFamily: 'Inter',
  },
})