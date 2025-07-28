import React from 'react'
import { SafeAreaView, View, StyleSheet, Platform, StatusBar } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

interface ScreenWrapperProps {
  children: React.ReactNode
  backgroundColor?: string
  edges?: ('top' | 'bottom' | 'left' | 'right')[]
}

export function ScreenWrapper({ 
  children, 
  backgroundColor = '#FAF7F0',
  edges = ['top', 'bottom', 'left', 'right']
}: ScreenWrapperProps) {
  const insets = useSafeAreaInsets()
  
  return (
    <SafeAreaView 
      style={[
        styles.container, 
        { backgroundColor }
      ]}
      edges={edges}
    >
      <View style={[
        styles.content,
        {
          // Add consistent top padding that works with SafeAreaView
          paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight || 0,
        }
      ]}>
        {children}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
})