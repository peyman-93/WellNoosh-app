import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

interface StatusBarProps {
  time?: string
}

export const StatusBar: React.FC<StatusBarProps> = ({ time = '9:41' }) => {
  return (
    <View style={styles.statusBar}>
      <View style={styles.statusBarContent}>
        <View style={styles.statusLeft}>
          <Text style={styles.time}>{time}</Text>
        </View>
        <View style={styles.statusCenter}>
          <View style={styles.dynamicIsland} />
        </View>
        <View style={styles.statusRight}>
          <View style={styles.batteryContainer}>
            <View style={styles.signalBars}>
              <View style={[styles.bar, { height: 4 }]} />
              <View style={[styles.bar, { height: 6 }]} />
              <View style={[styles.bar, { height: 8 }]} />
              <View style={[styles.bar, { height: 10 }]} />
            </View>
            <Text style={styles.wifiIcon}>📶</Text>
            <View style={styles.batteryIcon}>
              <View style={styles.batteryLevel} />
            </View>
          </View>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  statusBar: {
    height: 54,
    backgroundColor: '#ffffff',
    position: 'relative',
    zIndex: 50,
  },
  statusBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '100%',
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  statusLeft: {},
  time: {
    fontWeight: '600',
    fontSize: 14,
    color: '#1F2937',
    letterSpacing: -0.01,
    fontFamily: 'Inter',
  },
  statusCenter: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: [{ translateX: -63 }, { translateY: -18.5 }],
  },
  dynamicIsland: {
    width: 126,
    height: 37,
    backgroundColor: '#1C1C1E',
    borderRadius: 19,
    marginTop: 4,
  },
  statusRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  batteryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  signalBars: {
    flexDirection: 'row',
    gap: 2,
    alignItems: 'flex-end',
  },
  bar: {
    width: 3,
    backgroundColor: '#1F2937',
    borderRadius: 1,
  },
  wifiIcon: {
    fontSize: 10,
    opacity: 0.8,
  },
  batteryIcon: {
    width: 24,
    height: 12,
    borderWidth: 1,
    borderColor: '#1F2937',
    borderRadius: 2,
    position: 'relative',
    opacity: 0.8,
  },
  batteryLevel: {
    width: '80%',
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 1,
  },
})