import React from 'react'
import { View, Text, SafeAreaView, ScrollView, StyleSheet } from 'react-native'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function PlannerScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <View style={styles.headerSection}>
            <Text style={styles.title}>
              Meal Planner
            </Text>
            <Text style={styles.subtitle}>
              Plan your meals for the week
            </Text>
          </View>

          <Card>
            <CardHeader>
              <CardTitle>This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <View style={styles.daysContainer}>
                {days.map((day) => (
                  <View key={day} style={styles.dayRow}>
                    <Text style={styles.dayText}>{day}</Text>
                    <Button variant="outline" size="sm">
                      Add Meal
                    </Button>
                  </View>
                ))}
              </View>
            </CardContent>
          </Card>

          <Button size="lg" style={styles.generateButton}>
            Generate Meal Plan
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
    gap: 24,
  },
  headerSection: {
    gap: 8,
  },
  title: {
    fontSize: 24,
    color: '#1F2937',
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  daysContainer: {
    gap: 16,
  },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  generateButton: {
    width: '100%',
  },
})