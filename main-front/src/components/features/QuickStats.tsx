import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

interface QuickStatsProps {
  favoriteCount: number
  cookedCount: number
}

export function QuickStats({ favoriteCount, cookedCount }: QuickStatsProps) {
  return (
    <View style={styles.container}>
      <View style={[styles.statCard, styles.favoritesCard]}>
        <Text style={styles.statNumber}>{favoriteCount}</Text>
        <Text style={styles.statLabel}>Favorites</Text>
      </View>
      <View style={[styles.statCard, styles.cookedCard]}>
        <Text style={styles.statNumber}>{cookedCount}</Text>
        <Text style={styles.statLabel}>Cooked</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    paddingVertical: 24,
    borderRadius: 24,
    alignItems: 'center',
  },
  favoritesCard: {
    backgroundColor: '#DCFCE7',
  },
  cookedCard: {
    backgroundColor: '#DBEAFE',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
    fontFamily: 'System',
  },
  statLabel: {
    fontSize: 16,
    fontFamily: 'System',
  },
})