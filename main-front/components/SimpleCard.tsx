import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
} from 'react-native';

interface Recipe {
  id: string;
  name: string;
  ingredients: {
    name: string;
    amount: string;
    category: string;
  }[];
  instructions: string[];
}

interface SimpleCardProps {
  recipe: Recipe;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export function SimpleCard({ recipe }: SimpleCardProps) {
  const [showBack, setShowBack] = useState(false);

  console.log('SimpleCard render - showBack:', showBack);
  console.log('Recipe ingredients count:', recipe.ingredients?.length);

  return (
    <View style={styles.container}>
      <Text style={styles.debugText}>
        Current side: {showBack ? 'BACK' : 'FRONT'}
      </Text>
      
      <TouchableOpacity 
        style={styles.card}
        onPress={() => {
          console.log('Card tapped! Flipping from', showBack, 'to', !showBack);
          setShowBack(!showBack);
        }}
      >
        {showBack ? (
          <ScrollView style={styles.cardContent}>
            <Text style={styles.title}>BACK SIDE</Text>
            <Text style={styles.subtitle}>{recipe.name}</Text>
            
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Ingredients ({recipe.ingredients?.length || 0})
              </Text>
              {recipe.ingredients?.map((ingredient, index) => (
                <View key={index} style={styles.ingredientRow}>
                  <Text style={styles.ingredientText}>
                    {ingredient.amount} {ingredient.name}
                  </Text>
                </View>
              )) || <Text>No ingredients</Text>}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Instructions ({recipe.instructions?.length || 0})
              </Text>
              {recipe.instructions?.map((instruction, index) => (
                <View key={index} style={styles.instructionRow}>
                  <Text style={styles.stepNumber}>{index + 1}</Text>
                  <Text style={styles.instructionText}>{instruction}</Text>
                </View>
              )) || <Text>No instructions</Text>}
            </View>
          </ScrollView>
        ) : (
          <View style={styles.cardContent}>
            <Text style={styles.title}>FRONT SIDE</Text>
            <Text style={styles.subtitle}>{recipe.name}</Text>
            <Text style={styles.instruction}>Tap to flip to see ingredients</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  debugText: {
    fontSize: 18,
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: 'bold',
  },
  card: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  instruction: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  ingredientRow: {
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  ingredientText: {
    fontSize: 16,
    color: '#333',
  },
  instructionRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    color: 'white',
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 12,
  },
  instructionText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
});