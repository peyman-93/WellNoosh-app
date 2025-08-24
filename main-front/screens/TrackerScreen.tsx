import React from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useUserData } from '../src/context/user-data-provider'
import { ScreenWrapper } from '../src/components/layout/ScreenWrapper'

export default function TrackerScreen() {
  const navigation = useNavigation()
  const { userData } = useUserData()

  const handleGoBack = () => {
    navigation.goBack()
  }

  const currentWeight = userData?.weight || 0
  const targetWeight = userData?.targetWeight || 0
  const currentBMI = userData?.bmi || 0

  // Calculate BMI category
  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return 'Underweight'
    if (bmi < 25) return 'Normal'
    if (bmi < 30) return 'Overweight'
    return 'Obese'
  }

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Health Tracker</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
        >
          {/* Current Stats */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Current Health Stats</Text>
            
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Current Weight</Text>
                <Text style={styles.statValue}>
                  {currentWeight ? `${currentWeight} ${userData?.weightUnit || 'kg'}` : 'Not set'}
                </Text>
              </View>
              
              {targetWeight > 0 && (
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Target Weight</Text>
                  <Text style={styles.statValue}>
                    {targetWeight} {userData?.targetWeightUnit || 'kg'}
                  </Text>
                </View>
              )}
              
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>BMI</Text>
                <Text style={styles.statValue}>
                  {currentBMI ? currentBMI.toFixed(1) : 'Not available'}
                </Text>
                {currentBMI > 0 && (
                  <Text style={styles.statCategory}>
                    {getBMICategory(currentBMI)}
                  </Text>
                )}
              </View>
              
              {userData?.dailyCalorieGoal && (
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Daily Calorie Goal</Text>
                  <Text style={styles.statValue}>
                    {userData.dailyCalorieGoal} cal
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Advanced Tracking Placeholder */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Advanced Tracking</Text>
            
            <View style={styles.placeholderCard}>
              <View style={styles.placeholderIconContainer}>
                <Text style={styles.placeholderIcon}>📊</Text>
              </View>
              <Text style={styles.placeholderTitle}>Advanced Health Tracking Coming Soon!</Text>
              <Text style={styles.placeholderDescription}>
                We're working on bringing you detailed charts, nutrition tracking, and progress analytics.
              </Text>
              
              <View style={styles.featuresList}>
                <View style={styles.featureItem}>
                  <Text style={styles.featureIcon}>📈</Text>
                  <Text style={styles.featureText}>Weight & BMI Progress Charts</Text>
                </View>
                <View style={styles.featureItem}>
                  <Text style={styles.featureIcon}>🍎</Text>
                  <Text style={styles.featureText}>Daily Nutrition Tracking</Text>
                </View>
                <View style={styles.featureItem}>
                  <Text style={styles.featureIcon}>🎯</Text>
                  <Text style={styles.featureText}>Goal Achievement Analytics</Text>
                </View>
                <View style={styles.featureItem}>
                  <Text style={styles.featureIcon}>📅</Text>
                  <Text style={styles.featureText}>Historical Data & Trends</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Health Goals */}
          {userData?.healthGoals && userData.healthGoals.length > 0 && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Your Health Goals</Text>
              
              <View style={styles.goalsContainer}>
                {userData.healthGoals.map((goal, index) => (
                  <View key={index} style={styles.goalCard}>
                    <Text style={styles.goalIcon}>🎯</Text>
                    <Text style={styles.goalText}>{goal}</Text>
                  </View>
                ))}
                
                {userData.timeline && (
                  <View style={styles.goalCard}>
                    <Text style={styles.goalIcon}>📅</Text>
                    <Text style={styles.goalText}>Timeline: {userData.timeline}</Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </ScreenWrapper>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#6B8E23',
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Inter',
  },
  headerSpacer: {
    width: 60,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  sectionContainer: {
    marginBottom: 24,
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
    fontFamily: 'Inter',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    minWidth: '47%',
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statLabel: {
    fontSize: 14,
    color: '#4A4A4A',
    marginBottom: 4,
    fontFamily: 'Inter',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    fontFamily: 'Inter',
  },
  statCategory: {
    fontSize: 12,
    color: '#6B8E23',
    marginTop: 4,
    fontFamily: 'Inter',
  },
  placeholderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  placeholderIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  placeholderIcon: {
    fontSize: 28,
  },
  placeholderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  placeholderDescription: {
    fontSize: 14,
    color: '#4A4A4A',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    fontFamily: 'Inter',
  },
  featuresList: {
    alignSelf: 'stretch',
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F8FAF5',
    borderRadius: 8,
  },
  featureIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#1A1A1A',
    fontFamily: 'Inter',
  },
  goalsContainer: {
    gap: 12,
  },
  goalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  goalIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  goalText: {
    fontSize: 16,
    color: '#1A1A1A',
    flex: 1,
    fontFamily: 'Inter',
  },
})