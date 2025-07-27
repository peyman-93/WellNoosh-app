import React from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'

interface DailyCheckInProps {
  showExpanded: boolean
  onToggle: () => void
}

export function DailyCheckIn({ showExpanded, onToggle }: DailyCheckInProps) {
  // Mock data - replace with real data
  const checkInData = {
    weight: 72.5,
    mood: 8,
    sleep: 7.5,
    stress: 3,
  }
  
  return (
    <View style={styles.container}>
      <Pressable style={styles.header} onPress={onToggle}>
        <View style={styles.titleRow}>
          <Text style={styles.icon}>❤️</Text>
          <Text style={styles.title}>Daily Check-In</Text>
        </View>
        <Text style={styles.chevron}>{showExpanded ? '⌃' : '⌄'}</Text>
      </Pressable>
      
      {showExpanded && (
        <View style={styles.content}>
          <View style={styles.metricsGrid}>
            <View style={[styles.metricCard, { backgroundColor: '#EFF6FF' }]}>
              <Text style={styles.metricIcon}>⚖️</Text>
              <Text style={styles.metricLabel}>Weight</Text>
              <Text style={styles.metricValue}>{checkInData.weight} kg</Text>
            </View>
            
            <View style={[styles.metricCard, { backgroundColor: '#F0FDF4' }]}>
              <Text style={styles.metricIcon}>🧠</Text>
              <Text style={styles.metricLabel}>Mood</Text>
              <Text style={styles.metricValue}>{checkInData.mood}/10</Text>
            </View>
            
            <View style={[styles.metricCard, { backgroundColor: '#FAF5FF' }]}>
              <Text style={styles.metricIcon}>🌙</Text>
              <Text style={styles.metricLabel}>Sleep</Text>
              <Text style={styles.metricValue}>{checkInData.sleep}h</Text>
            </View>
            
            <View style={[styles.metricCard, { backgroundColor: '#FFF7ED' }]}>
              <Text style={styles.metricIcon}>⚡</Text>
              <Text style={styles.metricLabel}>Stress</Text>
              <Text style={styles.metricValue}>{checkInData.stress}/10</Text>
            </View>
          </View>
          
          <Pressable style={styles.updateButton}>
            <Text style={styles.updateButtonText}>Update Check-In</Text>
          </Pressable>
        </View>
      )}
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
  chevron: {
    fontSize: 16,
    color: '#6B7280',
  },
  content: {
    marginTop: 16,
    gap: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    minWidth: '47%',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  metricIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'System',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    fontFamily: 'System',
  },
  updateButton: {
    backgroundColor: '#EC4899',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  updateButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
  },
})