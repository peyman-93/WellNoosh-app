import React from 'react'
import { View, Text, SafeAreaView, ScrollView, StyleSheet } from 'react-native'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/supabase-provider'

export default function ProfileScreen() {
  const { session, signOut } = useAuth()

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <View style={styles.headerSection}>
            <Text style={styles.title}>
              Profile
            </Text>
            <Text style={styles.subtitle}>
              Manage your account and preferences
            </Text>
          </View>

          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
            </CardHeader>
            <CardContent>
              <View style={styles.accountInfo}>
                <Text style={styles.label}>Email</Text>
                <Text style={styles.value}>
                  {session?.user?.email || 'demo@wellnoosh.com'}
                </Text>
              </View>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dietary Preferences</CardTitle>
            </CardHeader>
            <CardContent>
              <Text style={styles.cardText}>
                Set your dietary preferences and restrictions
              </Text>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <Text style={styles.cardText}>
                Manage your notification preferences
              </Text>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Privacy & Security</CardTitle>
            </CardHeader>
            <CardContent>
              <Text style={styles.cardText}>
                Control your privacy settings and data
              </Text>
            </CardContent>
          </Card>

          <View style={styles.buttonSection}>
            <Button variant="outline" size="lg" style={styles.button}>
              Edit Profile
            </Button>
            <Button
              variant="destructive"
              size="lg"
              onPress={signOut}
              style={styles.button}
            >
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
  accountInfo: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    color: '#6B7280',
  },
  value: {
    fontSize: 16,
    color: '#1F2937',
  },
  cardText: {
    color: '#6B7280',
    lineHeight: 20,
  },
  buttonSection: {
    gap: 16,
  },
  button: {
    width: '100%',
  },
})