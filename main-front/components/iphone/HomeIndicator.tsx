import React from 'react'
import { View, StyleSheet } from 'react-native'

export const HomeIndicator: React.FC = () => {
  return (
    <View style={styles.homeIndicator}>
      <View style={styles.homeIndicatorBar} />
    </View>
  )
}

const styles = StyleSheet.create({
  homeIndicator: {
    height: 34,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  homeIndicatorBar: {
    width: 134,
    height: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 3,
  },
})