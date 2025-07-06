import React from 'react'
import { View, Text, SafeAreaView, ScrollView, StyleSheet } from 'react-native'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/context/supabase-provider'
import { Colors, Typography, Spacing } from '@/constants/DesignTokens'

export default function HomeScreen() {
  const { session, signOut } = useAuth()

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <View style={styles.headerSection}>
            <Text style={styles.greeting}>
              Good morning!
            </Text>
            <Text style={styles.welcomeText}>
              Welcome back to WellNoosh
            </Text>
          </View>

          <Card>
            <CardHeader>
              <CardTitle>Today's Meal Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <Text style={styles.cardText}>
                No meals planned for today. Start planning your meals in the Planner tab!
              </Text>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pantry Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Text style={styles.cardText}>
                Your pantry is empty. Add items to start tracking your ingredients!
              </Text>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recipe Inspiration</CardTitle>
            </CardHeader>
            <CardContent>
              <Text style={styles.cardText}>
                Discover new recipes tailored to your dietary preferences and pantry items.
              </Text>
            </CardContent>
          </Card>

          <View style={styles.signOutSection}>
            <Button variant="outline" onPress={signOut} style={styles.signOutButton}>
              Sign Out
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
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.screenPadding,
    gap: Spacing.xxl,
  },
  headerSection: {
    gap: Spacing.sm,
  },
  greeting: {
    fontSize: Typography.sizes.hero,
    color: Colors.foreground,
    fontWeight: Typography.weights.bold,
    fontFamily: Typography.fontBrand,
  },
  welcomeText: {
    fontSize: Typography.sizes.base,
    color: Colors.mutedForeground,
    fontFamily: Typography.fontBody,
  },
  cardText: {
    color: Colors.mutedForeground,
    fontSize: Typography.sizes.caption,
    lineHeight: Typography.sizes.caption * Typography.lineHeights.normal,
    fontFamily: Typography.fontBody,
  },
  signOutSection: {
    paddingTop: Spacing.lg,
  },
  signOutButton: {
    width: '100%',
  },
})