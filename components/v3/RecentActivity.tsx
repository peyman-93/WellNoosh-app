import React from 'react'
import { View, Text, StyleSheet, Pressable, Image } from 'react-native'
import { useNavigation } from '@react-navigation/native'

interface CookedRecipe {
  id: string
  name: string
  image?: string
  cookedDate: string
  rating?: number
}

interface RecentActivityProps {
  cookedRecipes: CookedRecipe[]
}

export function RecentActivity({ cookedRecipes }: RecentActivityProps) {
  const navigation = useNavigation()
  
  // Mock data if no recipes
  const displayRecipes = cookedRecipes.length > 0 ? cookedRecipes : [
    {
      id: '1',
      name: 'Mediterranean Quinoa Bowl',
      cookedDate: '2024-12-28',
      rating: 5,
    },
    {
      id: '2',
      name: 'Honey Garlic Salmon',
      cookedDate: '2024-12-26',
      rating: 4,
    },
  ]
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return 'Yesterday'
    if (diffDays <= 7) return `${diffDays} days ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
  
  const renderStars = (rating: number) => {
    return '⭐'.repeat(rating)
  }
  
  if (displayRecipes.length === 0) {
    return null
  }
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recent Activity</Text>
      
      <View style={styles.recipesList}>
        {displayRecipes.slice(0, 2).map((recipe) => (
          <View key={recipe.id} style={styles.recipeCard}>
            <View style={styles.recipeIcon}>
              <Text style={styles.recipeEmoji}>🍽️</Text>
            </View>
            <View style={styles.recipeInfo}>
              <Text style={styles.recipeName}>{recipe.name}</Text>
              <View style={styles.recipeMeta}>
                {recipe.rating && (
                  <Text style={styles.rating}>{renderStars(recipe.rating)}</Text>
                )}
                <Text style={styles.date}>{formatDate(recipe.cookedDate)}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
      
      <Pressable 
        style={styles.viewAllButton}
        onPress={() => navigation.navigate('Profile' as never)}
      >
        <Text style={styles.viewAllText}>View All Activity →</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    fontFamily: 'System',
    marginBottom: 16,
  },
  recipesList: {
    gap: 12,
    marginBottom: 16,
  },
  recipeCard: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 12,
  },
  recipeIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipeEmoji: {
    fontSize: 20,
  },
  recipeInfo: {
    flex: 1,
  },
  recipeName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    fontFamily: 'System',
    marginBottom: 2,
  },
  recipeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rating: {
    fontSize: 12,
  },
  date: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'System',
  },
  viewAllButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'System',
  },
})