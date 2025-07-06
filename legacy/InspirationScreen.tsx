import React from 'react'
import { View, Text, SafeAreaView, ScrollView, StyleSheet } from 'react-native'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function InspirationScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <View style={styles.headerSection}>
            <Text style={styles.title}>
              Recipe Inspiration
            </Text>
            <Text style={styles.subtitle}>
              Discover new recipes and cooking ideas
            </Text>
          </View>

          <Card>
            <CardHeader>
              <CardTitle>Trending Recipes</CardTitle>
            </CardHeader>
            <CardContent>
              <Text style={styles.cardText}>
                Explore the most popular recipes from our community
              </Text>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Based on Your Pantry</CardTitle>
            </CardHeader>
            <CardContent>
              <Text style={styles.cardText}>
                Get personalized recipe suggestions based on what you have
              </Text>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dietary Preferences</CardTitle>
            </CardHeader>
            <CardContent>
              <Text style={styles.cardText}>
                Recipes tailored to your dietary needs and preferences
              </Text>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cuisine Explorer</CardTitle>
            </CardHeader>
            <CardContent>
              <Text style={styles.cardText}>
                Discover new cuisines and cooking techniques
              </Text>
            </CardContent>
          </Card>

          <Button size="lg" style={styles.exploreButton}>
            Explore Recipes
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
  cardText: {
    color: '#6B7280',
    lineHeight: 20,
  },
  exploreButton: {
    width: '100%',
  },
})