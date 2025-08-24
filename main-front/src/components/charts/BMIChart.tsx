import React from 'react'
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native'
import Svg, { Path, Circle, Line, Text as SvgText, G, Rect } from 'react-native-svg'

const { width: screenWidth } = Dimensions.get('window')

interface BMIData {
  date: string
  bmi: number
  day: string
}

interface BMIChartProps {
  data: BMIData[]
  loading?: boolean
  error?: string | null
  width?: number
  height?: number
}

interface NoDataState {
  type: 'loading' | 'error' | 'no_data'
  title: string
  message: string
  action?: {
    text: string
    onPress: () => void
  }
}

// BMI categories and their color zones
const BMI_CATEGORIES = [
  { min: 0, max: 18.5, label: 'Underweight', color: '#3B82F6' },
  { min: 18.5, max: 25, label: 'Normal', color: '#10B981' },
  { min: 25, max: 30, label: 'Overweight', color: '#F59E0B' },
  { min: 30, max: 50, label: 'Obese', color: '#EF4444' },
]

function getBMICategory(bmi: number) {
  return BMI_CATEGORIES.find(cat => bmi >= cat.min && bmi < cat.max) || BMI_CATEGORIES[BMI_CATEGORIES.length - 1]
}

export function BMIChart({ 
  data, 
  loading = false,
  error = null,
  width = screenWidth - 40, 
  height = 220 
}: BMIChartProps) {
  
  // No data state component
  const NoDataDisplay: React.FC<{ state: NoDataState }> = ({ state }) => (
    <View style={[styles.container, styles.noDataContainer]}>
      <Text style={styles.noDataTitle}>{state.title}</Text>
      <Text style={styles.noDataMessage}>{state.message}</Text>
      {state.action && (
        <TouchableOpacity onPress={state.action.onPress}>
          <Text style={styles.noDataAction}>
            {state.action.text}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  )

  // Loading state
  if (loading) {
    return (
      <NoDataDisplay 
        state={{
          type: 'loading',
          title: 'Loading BMI data...',
          message: 'Please wait while we calculate your BMI trends.'
        }}
      />
    )
  }

  // Error state
  if (error) {
    return (
      <NoDataDisplay 
        state={{
          type: 'error',
          title: 'Unable to load data',
          message: error,
          action: {
            text: 'Tap to retry',
            onPress: () => console.log('Retry loading BMI data')
          }
        }}
      />
    )
  }

  // No data available
  if (!data || data.length === 0) {
    return (
      <NoDataDisplay 
        state={{
          type: 'no_data',
          title: 'No BMI data available',
          message: 'Start logging your weight and height to see BMI trends here. BMI is calculated automatically from your weight measurements.',
          action: {
            text: 'Log weight →',
            onPress: () => console.log('Navigate to weight logging')
          }
        }}
      />
    )
  }
  const chartWidth = width - 80
  const chartHeight = height - 80
  const padding = 40

  const minValue = 16
  const maxValue = 35

  const getX = (index: number) => padding + (index * chartWidth) / (data.length - 1)
  const getY = (value: number) => padding + chartHeight - ((value - minValue) / (maxValue - minValue)) * chartHeight

  // BMI progress line
  const bmiPath = data.map((point, index) => {
    const x = getX(index)
    const y = getY(point.bmi)
    return index === 0 ? `M${x},${y}` : `L${x},${y}`
  }).join(' ')

  const currentBMI = data[data.length - 1]?.bmi || 0
  const currentCategory = getBMICategory(currentBMI)
  const bmiTrend = data.length > 1 ? data[data.length - 1].bmi - data[0].bmi : 0

  return (
    <View style={styles.container}>
      <Text style={styles.title}>BMI Trend</Text>
      <Svg width={width} height={height} style={styles.chart}>
        {/* BMI category zones */}
        {BMI_CATEGORIES.map((category, index) => {
          const zoneHeight = ((Math.min(category.max, maxValue) - Math.max(category.min, minValue)) / (maxValue - minValue)) * chartHeight
          const zoneY = getY(Math.min(category.max, maxValue))
          
          if (zoneHeight > 0) {
            return (
              <Rect
                key={index}
                x={padding}
                y={zoneY}
                width={chartWidth}
                height={zoneHeight}
                fill={category.color}
                fillOpacity="0.1"
              />
            )
          }
          return null
        })}

        {/* Grid lines with BMI category boundaries */}
        {[18.5, 25, 30].map((bmiValue) => {
          if (bmiValue >= minValue && bmiValue <= maxValue) {
            const y = getY(bmiValue)
            const category = getBMICategory(bmiValue)
            return (
              <G key={bmiValue}>
                <Line
                  x1={padding}
                  y1={y}
                  x2={padding + chartWidth}
                  y2={y}
                  stroke={category.color}
                  strokeWidth="1"
                  strokeDasharray="3,3"
                />
                <SvgText
                  x={padding - 10}
                  y={y + 4}
                  fontSize="10"
                  fill={category.color}
                  textAnchor="end"
                  fontFamily="Inter"
                  fontWeight="600"
                >
                  {bmiValue}
                </SvgText>
              </G>
            )
          }
          return null
        })}

        {/* Additional grid lines */}
        {[20, 22.5, 27.5, 32.5].map((bmiValue) => {
          if (bmiValue >= minValue && bmiValue <= maxValue) {
            const y = getY(bmiValue)
            return (
              <G key={bmiValue}>
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
                  fontSize="9"
                  fill="#4A4A4A"
                  textAnchor="end"
                  fontFamily="Inter"
                >
                  {bmiValue}
                </SvgText>
              </G>
            )
          }
          return null
        })}

        {/* BMI trend line */}
        <Path
          d={bmiPath}
          stroke={currentCategory.color}
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {data.map((point, index) => {
          const category = getBMICategory(point.bmi)
          return (
            <Circle
              key={index}
              cx={getX(index)}
              cy={getY(point.bmi)}
              r="5"
              fill={category.color}
              stroke="white"
              strokeWidth="2"
            />
          )
        })}

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

      {/* Current BMI status */}
      <View style={styles.statusContainer}>
        <View style={[styles.statusBadge, { backgroundColor: currentCategory.color + '20' }]}>
          <Text style={[styles.statusText, { color: currentCategory.color }]}>
            BMI: {currentBMI.toFixed(1)} - {currentCategory.label}
          </Text>
        </View>
        {bmiTrend !== 0 && (
          <Text style={[
            styles.trendText,
            { color: bmiTrend < 0 ? '#10B981' : '#EF4444' }
          ]}>
            {bmiTrend > 0 ? '↗' : '↘'} {Math.abs(bmiTrend).toFixed(1)} from start
          </Text>
        )}
      </View>

      {/* BMI Categories Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendTitle}>BMI Categories</Text>
        <View style={styles.legendGrid}>
          {BMI_CATEGORIES.map((category, index) => (
            <View key={index} style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: category.color }]} />
              <View style={styles.legendTextContainer}>
                <Text style={styles.legendLabel}>{category.label}</Text>
                <Text style={styles.legendRange}>
                  {category.min === 0 ? `< ${category.max}` : 
                   category.max === 50 ? `≥ ${category.min}` : 
                   `${category.min} - ${category.max}`}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: currentCategory.color }]}>
            {currentBMI.toFixed(1)}
          </Text>
          <Text style={styles.statLabel}>Current BMI</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {data.length > 1 ? 
              (data.reduce((sum, d) => sum + d.bmi, 0) / data.length).toFixed(1) : 
              currentBMI.toFixed(1)
            }
          </Text>
          <Text style={styles.statLabel}>Average</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[
            styles.statValue,
            { color: bmiTrend < 0 ? '#10B981' : bmiTrend > 0 ? '#EF4444' : '#4A4A4A' }
          ]}>
            {bmiTrend > 0 ? '+' : ''}{bmiTrend.toFixed(1)}
          </Text>
          <Text style={styles.statLabel}>Change</Text>
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
  statusContainer: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  trendText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Inter',
  },
  legend: {
    marginVertical: 16,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: '45%',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
    marginRight: 6,
  },
  legendTextContainer: {
    flex: 1,
  },
  legendLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#1A1A1A',
    fontFamily: 'Inter',
  },
  legendRange: {
    fontSize: 10,
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
    fontFamily: 'Inter',
  },
  statLabel: {
    fontSize: 12,
    color: '#4A4A4A',
    marginTop: 4,
    fontFamily: 'Inter',
  },
  noDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 150,
  },
  noDataTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Inter',
    marginBottom: 8,
    textAlign: 'center',
  },
  noDataMessage: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
  },
  noDataAction: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B8E23',
    fontFamily: 'Inter',
  },
})