import React, { useState } from 'react'
import { View, Text, SafeAreaView, ScrollView, StyleSheet, Pressable } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/DesignTokens'

interface MealSlot {
  id: string
  day: string
  meal: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  recipe?: {
    name: string
    calories: number
    time: string
    difficulty: 'Easy' | 'Medium' | 'Hard'
  }
}

interface WeeklyPlannerProps {
  meals: MealSlot[]
  onAddMeal: (day: string, meal: string) => void
  onRemoveMeal: (id: string) => void
}

function WeeklyPlanner({ meals, onAddMeal, onRemoveMeal }: WeeklyPlannerProps) {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const mealTypes = ['breakfast', 'lunch', 'dinner']
  
  const getMealForDay = (day: string, mealType: string) => {
    return meals.find(meal => meal.day === day && meal.meal === mealType)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>📅 This Week's Meal Plan</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.weekScrollView}>
          <View style={styles.weekContainer}>
            {days.map((day, dayIndex) => (
              <View key={day} style={styles.dayColumn}>
                <Text style={styles.dayHeader}>{day.slice(0, 3)}</Text>
                <Text style={styles.dayNumber}>{dayIndex + 1}</Text>
                
                {mealTypes.map(mealType => {
                  const meal = getMealForDay(day, mealType)
                  return (
                    <View key={`${day}-${mealType}`} style={styles.mealSlot}>
                      {meal?.recipe ? (
                        <Pressable 
                          style={styles.plannedMeal}
                          onPress={() => onRemoveMeal(meal.id)}
                        >
                          <Text style={styles.mealIcon}>
                            {mealType === 'breakfast' ? '🥐' : mealType === 'lunch' ? '🥗' : '🍽️'}
                          </Text>
                          <Text style={styles.plannedMealName}>{meal.recipe.name}</Text>
                          <Text style={styles.plannedMealCalories}>{meal.recipe.calories} cal</Text>
                        </Pressable>
                      ) : (
                        <Pressable 
                          style={styles.emptyMealSlot}
                          onPress={() => onAddMeal(day, mealType)}
                        >
                          <Text style={styles.addMealIcon}>+</Text>
                          <Text style={styles.addMealText}>{mealType}</Text>
                        </Pressable>
                      )}
                    </View>
                  )
                })}
              </View>
            ))}
          </View>
        </ScrollView>
      </CardContent>
    </Card>
  )
}

interface NutritionGoalsProps {
  current: { calories: number; protein: number; carbs: number; fat: number }
  target: { calories: number; protein: number; carbs: number; fat: number }
}

function NutritionGoals({ current, target }: NutritionGoalsProps) {
  const getPercentage = (current: number, target: number) => Math.min((current / target) * 100, 100)
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>🎯 Today's Nutrition Goals</CardTitle>
      </CardHeader>
      <CardContent>
        <View style={styles.nutritionGrid}>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionLabel}>Calories</Text>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${getPercentage(current.calories, target.calories)}%` }
                  ]} 
                />
              </View>
            </View>
            <Text style={styles.nutritionValue}>{current.calories}/{target.calories}</Text>
          </View>
          
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionLabel}>Protein</Text>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${getPercentage(current.protein, target.protein)}%`, backgroundColor: Colors.success }
                  ]} 
                />
              </View>
            </View>
            <Text style={styles.nutritionValue}>{current.protein}g/{target.protein}g</Text>
          </View>
          
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionLabel}>Carbs</Text>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${getPercentage(current.carbs, target.carbs)}%`, backgroundColor: Colors.warning }
                  ]} 
                />
              </View>
            </View>
            <Text style={styles.nutritionValue}>{current.carbs}g/{target.carbs}g</Text>
          </View>
          
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionLabel}>Fat</Text>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${getPercentage(current.fat, target.fat)}%`, backgroundColor: Colors.brand.violet400 }
                  ]} 
                />
              </View>
            </View>
            <Text style={styles.nutritionValue}>{current.fat}g/{target.fat}g</Text>
          </View>
        </View>
      </CardContent>
    </Card>
  )
}

export default function V3PlannerScreen() {
  const [meals, setMeals] = useState<MealSlot[]>([
    {
      id: '1',
      day: 'Monday',
      meal: 'breakfast',
      recipe: {
        name: 'Avocado Toast',
        calories: 387,
        time: '10 min',
        difficulty: 'Easy'
      }
    },
    {
      id: '2',
      day: 'Monday',
      meal: 'lunch',
      recipe: {
        name: 'Quinoa Bowl',
        calories: 542,
        time: '25 min',
        difficulty: 'Medium'
      }
    }
  ])

  const nutritionData = {
    current: { calories: 929, protein: 35, carbs: 120, fat: 28 },
    target: { calories: 2000, protein: 150, carbs: 250, fat: 67 }
  }

  const addMeal = (day: string, mealType: string) => {
    // In a real app, this would open a recipe selector
    console.log(`Add ${mealType} for ${day}`)
  }

  const removeMeal = (id: string) => {
    setMeals(prev => prev.filter(meal => meal.id !== id))
  }

  const generateMealPlan = () => {
    // AI meal plan generation logic would go here
    console.log('Generating AI meal plan...')
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={Colors.gradientBackground}
        style={styles.backgroundGradient}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Meal Planner</Text>
              <Text style={styles.subtitle}>Plan your healthy week ahead</Text>
            </View>

            {/* Nutrition Goals */}
            <NutritionGoals 
              current={nutritionData.current}
              target={nutritionData.target}
            />

            {/* Weekly Planner */}
            <WeeklyPlanner 
              meals={meals}
              onAddMeal={addMeal}
              onRemoveMeal={removeMeal}
            />

            {/* AI Generation */}
            <Card>
              <CardHeader>
                <CardTitle>🤖 AI Meal Planning</CardTitle>
              </CardHeader>
              <CardContent>
                <Text style={styles.aiDescription}>
                  Let our AI create a personalized meal plan based on your preferences, dietary restrictions, and nutrition goals.
                </Text>
                <Button size="lg" onPress={generateMealPlan} style={styles.generateButton}>
                  Generate Smart Meal Plan
                </Button>
              </CardContent>
            </Card>

            {/* Quick Recipe Suggestions */}
            <Card>
              <CardHeader>
                <CardTitle>💡 Quick Recipe Ideas</CardTitle>
              </CardHeader>
              <CardContent>
                <View style={styles.recipesList}>
                  {[
                    { name: 'Mediterranean Salmon', time: '20 min', calories: 456 },
                    { name: 'Veggie Stir Fry', time: '15 min', calories: 324 },
                    { name: 'Protein Smoothie Bowl', time: '5 min', calories: 289 }
                  ].map((recipe, index) => (
                    <Pressable key={index} style={styles.recipeItem}>
                      <Text style={styles.recipeName}>{recipe.name}</Text>
                      <View style={styles.recipeDetails}>
                        <Text style={styles.recipeTime}>⏱️ {recipe.time}</Text>
                        <Text style={styles.recipeCalories}>{recipe.calories} cal</Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              </CardContent>
            </Card>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.screenPadding,
    gap: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: Typography.sizes.section,
    fontWeight: Typography.weights.bold,
    color: Colors.foreground,
    fontFamily: Typography.fontBrand,
  },
  subtitle: {
    fontSize: Typography.sizes.caption,
    color: Colors.mutedForeground,
    marginTop: Spacing.xs,
    fontFamily: Typography.fontBody,
  },

  // Weekly Planner
  weekScrollView: {
    marginHorizontal: -Spacing.sm,
  },
  weekContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.sm,
    gap: Spacing.sm,
  },
  dayColumn: {
    width: 120,
    alignItems: 'center',
  },
  dayHeader: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.semibold,
    color: Colors.foreground,
    textAlign: 'center',
  },
  dayNumber: {
    fontSize: Typography.sizes.small,
    color: Colors.mutedForeground,
    marginBottom: Spacing.sm,
  },
  mealSlot: {
    marginBottom: Spacing.sm,
  },
  plannedMeal: {
    backgroundColor: Colors.brand.emerald50,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.success,
    minHeight: 80,
  },
  mealIcon: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  plannedMealName: {
    fontSize: Typography.sizes.small,
    fontWeight: Typography.weights.medium,
    color: Colors.foreground,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  plannedMealCalories: {
    fontSize: Typography.sizes.small,
    color: Colors.mutedForeground,
    textAlign: 'center',
  },
  emptyMealSlot: {
    backgroundColor: Colors.muted,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    minHeight: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addMealIcon: {
    fontSize: 20,
    color: Colors.mutedForeground,
    marginBottom: Spacing.xs,
  },
  addMealText: {
    fontSize: Typography.sizes.small,
    color: Colors.mutedForeground,
    textAlign: 'center',
  },

  // Nutrition Goals
  nutritionGrid: {
    gap: Spacing.lg,
  },
  nutritionItem: {
    gap: Spacing.sm,
  },
  nutritionLabel: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.medium,
    color: Colors.foreground,
  },
  progressBarContainer: {
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: Colors.muted,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 4,
  },
  nutritionValue: {
    fontSize: Typography.sizes.small,
    color: Colors.mutedForeground,
    textAlign: 'center',
  },

  // AI and Recipes
  aiDescription: {
    fontSize: Typography.sizes.caption,
    color: Colors.mutedForeground,
    lineHeight: Typography.sizes.caption * Typography.lineHeights.normal,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  generateButton: {
    width: '100%',
  },
  recipesList: {
    gap: Spacing.md,
  },
  recipeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.brand.blue50,
    borderRadius: BorderRadius.sm,
  },
  recipeName: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.medium,
    color: Colors.foreground,
    flex: 1,
  },
  recipeDetails: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  recipeTime: {
    fontSize: Typography.sizes.small,
    color: Colors.mutedForeground,
  },
  recipeCalories: {
    fontSize: Typography.sizes.small,
    color: Colors.mutedForeground,
  },
})