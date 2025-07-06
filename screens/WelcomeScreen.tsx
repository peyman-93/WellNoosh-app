import React from 'react'
import { View, Text, SafeAreaView, Pressable, StyleSheet } from 'react-native'
import { Button } from '@/components/ui/button'
import { Colors } from '@/constants/DesignTokens'

interface WelcomeScreenProps {
  navigation: any
}

export default function WelcomeScreen({ navigation }: WelcomeScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>WellNoosh</Text>
          <Text style={styles.subtitle}>Your Personal Meal Planning Assistant</Text>
          <Text style={styles.description}>
            Set dietary goals, discover recipes, track pantry items, and minimize food waste
          </Text>
        </View>
        
        <View style={styles.buttonContainer}>
          <Button size="lg" onPress={() => navigation.navigate('SignUp')} style={[styles.buttonWrapper, styles.getStartedButton]}>
            Get Started
          </Button>
          
          <Button variant="outline" size="lg" onPress={() => navigation.navigate('SignIn')} style={styles.buttonWrapper}>
            Sign In
          </Button>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 32,
    maxWidth: 320,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#1F2937',
    fontFamily: 'System', // Will use system font, can be replaced with custom font
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 22,
    textAlign: 'center',
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: '#6B7280',
    lineHeight: 24,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 320,
    gap: 16,
  },
  buttonWrapper: {
    width: '100%',
  },
  getStartedButton: {
    backgroundColor: Colors.success, // Health-focused green
  },
})