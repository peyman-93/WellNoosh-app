import React from 'react'
import { View, Text, StyleSheet, Dimensions } from 'react-native'
import Svg, { Path, Circle, Line, Text as SvgText, G, Defs, LinearGradient, Stop } from 'react-native-svg'

const { width: screenWidth } = Dimensions.get('window')

interface CalorieData {
  date: string
  consumed: number
  goal: number
  day: string
}

interface CalorieChartProps {
  data: CalorieData[]
  width?: number
  height?: number
}

export function CalorieChart({ 
  data, 
  width = screenWidth - 40, 
  height = 200 
}: CalorieChartProps) {
  // Safety check for empty data
  if (!data || data.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Daily Calorie Intake</Text>
        <View style={[styles.noDataContainer, { width, height }]}>
          <Text style={styles.noDataText}>No calorie data available</Text>
        </View>
      </View>
    )
  }

  const chartWidth = width - 60 // Leave space for labels
  const chartHeight = height - 60 // Leave space for labels
  const padding = 30

  // Find max value for scaling with safety checks
  const validData = data.filter(d => 
    d && 
    typeof d.consumed === 'number' && 
    typeof d.goal === 'number' && 
    !isNaN(d.consumed) && 
    !isNaN(d.goal) &&
    isFinite(d.consumed) &&
    isFinite(d.goal)
  )
  
  if (validData.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Daily Calorie Intake</Text>
        <View style={[styles.noDataContainer, { width, height }]}>
          <Text style={styles.noDataText}>Invalid calorie data</Text>
        </View>
      </View>
    )
  }

  const maxValue = Math.max(...validData.map(d => Math.max(d.consumed, d.goal))) * 1.1
  const minValue = 0

  // Calculate positions with safety checks
  const getX = (index: number) => {
    const result = padding + (index * chartWidth) / (validData.length - 1)
    return isFinite(result) ? result : padding
  }
  
  const getY = (value: number) => {
    if (!isFinite(value) || !isFinite(maxValue) || !isFinite(minValue)) {
      return padding + chartHeight / 2 // Return middle position for invalid values
    }
    const result = padding + chartHeight - ((value - minValue) / (maxValue - minValue)) * chartHeight
    return isFinite(result) ? result : padding + chartHeight / 2
  }

  // Generate path for consumed calories line
  const consumedPath = validData.map((point, index) => {
    const x = getX(index)
    const y = getY(point.consumed)
    return index === 0 ? `M${x},${y}` : `L${x},${y}`
  }).join(' ')

  // Generate path for goal line
  const goalPath = validData.map((point, index) => {
    const x = getX(index)
    const y = getY(point.goal)
    return index === 0 ? `M${x},${y}` : `L${x},${y}`
  }).join(' ')

  // Generate area path for consumed calories (gradient fill)
  const areaPath = `${consumedPath} L${getX(validData.length - 1)},${getY(0)} L${getX(0)},${getY(0)} Z`

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Daily Calorie Intake</Text>
      <Svg width={width} height={height} style={styles.chart}>
        <Defs>
          <LinearGradient id="calorieGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#6B8E23" stopOpacity="0.3" />
            <Stop offset="100%" stopColor="#6B8E23" stopOpacity="0.05" />
          </LinearGradient>
        </Defs>
        
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = padding + chartHeight - (ratio * chartHeight)
          const value = Math.round(minValue + (maxValue - minValue) * ratio)
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

        {/* Area fill for consumed calories */}
        <Path
          d={areaPath}
          fill="url(#calorieGradient)"
        />

        {/* Goal line (dashed) */}
        <Path
          d={goalPath}
          stroke="#F59E0B"
          strokeWidth="2"
          strokeDasharray="5,5"
          fill="none"
        />

        {/* Consumed calories line */}
        <Path
          d={consumedPath}
          stroke="#6B8E23"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points for consumed calories */}
        {validData.map((point, index) => (
          <Circle
            key={`consumed-${index}`}
            cx={getX(index)}
            cy={getY(point.consumed)}
            r="4"
            fill="#6B8E23"
            stroke="white"
            strokeWidth="2"
          />
        ))}

        {/* Data points for goal line */}
        {validData.map((point, index) => (
          <Circle
            key={`goal-${index}`}
            cx={getX(index)}
            cy={getY(point.goal)}
            r="3"
            fill="#F59E0B"
            stroke="white"
            strokeWidth="1.5"
          />
        ))}

        {/* X-axis labels */}
        {validData.map((point, index) => (
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

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#6B8E23' }]} />
          <Text style={styles.legendText}>Consumed</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendLine, { backgroundColor: '#F59E0B' }]} />
          <Text style={styles.legendText}>Goal</Text>
        </View>
      </View>

      {/* Summary stats */}
      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {Math.round(validData.reduce((sum, d) => sum + d.consumed, 0) / validData.length)}
          </Text>
          <Text style={styles.statLabel}>Avg Daily</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {validData.filter(d => d.consumed >= d.goal).length}/{validData.length}
          </Text>
          <Text style={styles.statLabel}>Goals Met</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[
            styles.statValue,
            { color: validData[validData.length - 1]?.consumed >= validData[validData.length - 1]?.goal ? '#10B981' : '#EF4444' }
          ]}>
            {validData[validData.length - 1]?.consumed || 0}
          </Text>
          <Text style={styles.statLabel}>Today</Text>
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
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 8,
    marginBottom: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLine: {
    width: 16,
    height: 2,
    borderRadius: 1,
  },
  legendText: {
    fontSize: 12,
    color: '#4A4A4A',
    fontFamily: 'Inter',
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6B8E23',
    fontFamily: 'Inter',
  },
  statLabel: {
    fontSize: 12,
    color: '#4A4A4A',
    marginTop: 4,
    fontFamily: 'Inter',
  },
  noDataContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    margin: 8,
  },
  noDataText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter',
    textAlign: 'center',
  },
})