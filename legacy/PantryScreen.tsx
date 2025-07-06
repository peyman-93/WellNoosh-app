import React from 'react'
import { View, Text, SafeAreaView, ScrollView, StyleSheet } from 'react-native'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function PantryScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <View style={styles.headerSection}>
            <Text style={styles.title}>
              Pantry Tracker
            </Text>
            <Text style={styles.subtitle}>
              Track your ingredients and minimize waste
            </Text>
          </View>

          <Card>
            <CardHeader>
              <CardTitle>Expiring Soon</CardTitle>
            </CardHeader>
            <CardContent>
              <Text style={styles.cardText}>
                No items expiring soon. Add items to your pantry to track expiration dates!
              </Text>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shopping List</CardTitle>
            </CardHeader>
            <CardContent>
              <Text style={styles.cardText}>
                Your shopping list is empty. Add items you need to buy!
              </Text>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Leftover Suggestions</CardTitle>
            </CardHeader>
            <CardContent>
              <Text style={styles.cardText}>
                Get AI-powered suggestions for using up your leftovers and ingredients.
              </Text>
            </CardContent>
          </Card>

          <View style={styles.buttonRow}>
            <Button size="lg" style={styles.buttonHalf}>
              Add Item
            </Button>
            <Button variant="outline" size="lg" style={styles.buttonHalf}>
              Scan Receipt
            </Button>
          </View>
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
  cardText: {
    color: '#6B7280',
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 16,
  },
  buttonHalf: {
    flex: 1,
  },
})