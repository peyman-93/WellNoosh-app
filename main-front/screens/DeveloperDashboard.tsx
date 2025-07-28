import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { OnboardingTest } from '../components/OnboardingTest';

type DeveloperView = 'dashboard' | 'onboarding-test';

const screens = [
  {
    id: 'onboarding-test',
    name: 'onboarding-test',
    title: 'Onboarding Flow Test',
    description: 'Test the updated onboarding experience',
    category: 'Testing',
    color: ['#6B8E23', '#8BA654'],
  },
  {
    id: 'welcome',
    name: 'welcome',
    title: 'Welcome Screen',
    description: 'App landing page (requires restart)',
    category: 'Navigation',
    color: ['#4A90E2', '#6B8E23'],
  },
  {
    id: 'main-app',
    name: 'main-app',
    title: 'Main App',
    description: 'Dashboard and main features (requires restart)',
    category: 'Navigation',
    color: ['#6B8E23', '#8BA654'],
  },
];

export default function DeveloperDashboard() {
  const [currentView, setCurrentView] = useState<DeveloperView>('dashboard');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Testing', 'Navigation'];

  const filteredScreens = selectedCategory === 'All' 
    ? screens 
    : screens.filter(screen => screen.category === selectedCategory);

  const handleScreenPress = (screenId: string) => {
    if (screenId === 'onboarding-test') {
      setCurrentView('onboarding-test');
    } else {
      console.log(`Navigation to ${screenId} requires app restart`);
    }
  };

  if (currentView === 'onboarding-test') {
    return (
      <OnboardingTest onBack={() => setCurrentView('dashboard')} />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <LinearGradient
        colors={['#6B8E23', '#8BA654']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Text style={styles.headerTitle}>WellNoosh Developer</Text>
        <Text style={styles.headerSubtitle}>Navigate to any screen in the app</Text>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {/* Category Filter */}
        <View style={styles.categorySection}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.categoryContainer}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryButton,
                    selectedCategory === category && styles.categoryButtonActive
                  ]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Text style={[
                    styles.categoryButtonText,
                    selectedCategory === category && styles.categoryButtonTextActive
                  ]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Screen Cards */}
        <View style={styles.screenSection}>
          <Text style={styles.sectionTitle}>Screens</Text>
          <View style={styles.screenGrid}>
            {filteredScreens.map((screen) => (
              <TouchableOpacity
                key={screen.id}
                style={styles.screenCard}
                onPress={() => handleScreenPress(screen.id)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={screen.color}
                  style={styles.screenCardGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.screenCardContent}>
                    <Text style={styles.screenCardTitle}>{screen.title}</Text>
                    <Text style={styles.screenCardDescription}>{screen.description}</Text>
                    <Text style={styles.screenCardCategory}>{screen.category}</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>WellNoosh Development Hub</Text>
            <Text style={styles.infoDescription}>
              This is your development dashboard to navigate to any screen in the WellNoosh app. 
              All screens are built with React Native and use the app's existing components.
            </Text>
            <View style={styles.infoDetails}>
              <Text style={styles.infoLabel}>• React Navigation v6</Text>
              <Text style={styles.infoLabel}>• Expo SDK</Text>
              <Text style={styles.infoLabel}>• TypeScript</Text>
              <Text style={styles.infoLabel}>• Supabase Backend</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F0',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  content: {
    flex: 1,
  },
  categorySection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  categoryContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
  },
  categoryButtonActive: {
    backgroundColor: '#6B8E23',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4A4A4A',
  },
  categoryButtonTextActive: {
    color: 'white',
  },
  screenSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  screenGrid: {
    gap: 16,
  },
  screenCard: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  screenCardGradient: {
    padding: 20,
  },
  screenCardContent: {
    // Content styles
  },
  screenCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  screenCardDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
  },
  screenCardCategory: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  infoSection: {
    padding: 20,
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  infoDescription: {
    fontSize: 14,
    color: '#4A4A4A',
    lineHeight: 20,
    marginBottom: 16,
  },
  infoDetails: {
    gap: 4,
  },
  infoLabel: {
    fontSize: 13,
    color: '#4A4A4A',
  },
});