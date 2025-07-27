import React from 'react'
import { View, StyleSheet, SafeAreaView } from 'react-native'
import { StatusBar } from './StatusBar'
import { HomeIndicator } from './HomeIndicator'

interface IPhoneWrapperProps {
  children: React.ReactNode
  statusBarTime?: string
}

export const IPhoneWrapper: React.FC<IPhoneWrapperProps> = ({ 
  children, 
  statusBarTime 
}) => {
  return (
    <SafeAreaView style={styles.iphoneApp}>
      <StatusBar time={statusBarTime} />
      <View style={styles.content}>
        {children}
      </View>
      <HomeIndicator />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  iphoneApp: {
    flex: 1,
    backgroundColor: '#ffffff',
    position: 'relative',
  },
  content: {
    flex: 1,
    overflow: 'hidden',
  },
})