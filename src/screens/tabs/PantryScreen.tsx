import React, { useState } from 'react'
import { View, Text, SafeAreaView, ScrollView, StyleSheet, Pressable } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/DesignTokens'

interface PantryItem {
  id: string
  name: string
  category: string
  quantity: number
  unit: string
  expiryDate: string
  daysLeft: number
  emoji: string
}

interface LeftoverItem {
  id: string
  name: string
  quantity: string
  addedDate: string
  suggestions: string[]
  emoji: string
}

interface ExpiringItemsProps {
  items: PantryItem[]
  onUseItem: (id: string) => void
}

function ExpiringItems({ items, onUseItem }: ExpiringItemsProps) {
  const sortedItems = items
    .filter(item => item.daysLeft <= 7)
    .sort((a, b) => a.daysLeft - b.daysLeft)

  const getExpiryColor = (daysLeft: number) => {
    if (daysLeft <= 1) return Colors.destructive
    if (daysLeft <= 3) return Colors.warning
    return Colors.success
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>⚠️ Expiring Soon</CardTitle>
      </CardHeader>
      <CardContent>
        {sortedItems.length === 0 ? (
          <Text style={styles.emptyText}>All items are fresh! 🎉</Text>
        ) : (
          <View style={styles.itemsList}>
            {sortedItems.map(item => (
              <View key={item.id} style={styles.expiringItem}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemEmoji}>{item.emoji}</Text>
                  <View style={styles.itemDetails}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemQuantity}>{item.quantity} {item.unit}</Text>
                  </View>
                </View>
                <View style={styles.expiryInfo}>
                  <Text style={[styles.daysLeft, { color: getExpiryColor(item.daysLeft) }]}>
                    {item.daysLeft === 0 ? 'Today!' : 
                     item.daysLeft === 1 ? '1 day' : 
                     `${item.daysLeft} days`}
                  </Text>
                  <Pressable 
                    style={styles.useButton}
                    onPress={() => onUseItem(item.id)}
                  >
                    <Text style={styles.useButtonText}>Use</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
      </CardContent>
    </Card>
  )
}

interface LeftoversTrackerProps {
  leftovers: LeftoverItem[]
  onAddLeftover: () => void
  onUseLeftover: (id: string) => void
}

function LeftoversTracker({ leftovers, onAddLeftover, onUseLeftover }: LeftoversTrackerProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>🥡 Leftovers to Use</CardTitle>
      </CardHeader>
      <CardContent>
        {leftovers.length === 0 ? (
          <View style={styles.emptyLeftovers}>
            <Text style={styles.emptyText}>No leftovers to track</Text>
            <Button size="sm" onPress={onAddLeftover} style={styles.addLeftoverButton}>
              + Add Leftover
            </Button>
          </View>
        ) : (
          <View style={styles.itemsList}>
            {leftovers.map(leftover => (
              <View key={leftover.id} style={styles.leftoverItem}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemEmoji}>{leftover.emoji}</Text>
                  <View style={styles.itemDetails}>
                    <Text style={styles.itemName}>{leftover.name}</Text>
                    <Text style={styles.itemQuantity}>{leftover.quantity}</Text>
                    <Text style={styles.suggestions}>
                      💡 {leftover.suggestions.join(', ')}
                    </Text>
                  </View>
                </View>
                <Pressable 
                  style={styles.useButton}
                  onPress={() => onUseLeftover(leftover.id)}
                >
                  <Text style={styles.useButtonText}>Cook</Text>
                </Pressable>
              </View>
            ))}
            <Button size="sm" onPress={onAddLeftover} style={styles.addLeftoverButton}>
              + Add More
            </Button>
          </View>
        )}
      </CardContent>
    </Card>
  )
}

interface ShoppingListProps {
  items: string[]
  onAddItem: (item: string) => void
  onRemoveItem: (index: number) => void
}

function ShoppingList({ items, onAddItem, onRemoveItem }: ShoppingListProps) {
  const quickAddItems = ['Milk', 'Eggs', 'Bread', 'Bananas', 'Chicken', 'Rice']

  return (
    <Card>
      <CardHeader>
        <CardTitle>🛒 Shopping List</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <Text style={styles.emptyText}>Your shopping list is empty</Text>
        ) : (
          <View style={styles.shoppingItems}>
            {items.map((item, index) => (
              <View key={index} style={styles.shoppingItem}>
                <Text style={styles.shoppingItemText}>• {item}</Text>
                <Pressable 
                  style={styles.removeButton}
                  onPress={() => onRemoveItem(index)}
                >
                  <Text style={styles.removeButtonText}>✓</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}
        
        <View style={styles.quickAdd}>
          <Text style={styles.quickAddTitle}>Quick Add:</Text>
          <View style={styles.quickAddButtons}>
            {quickAddItems.map(item => (
              <Pressable 
                key={item}
                style={styles.quickAddButton}
                onPress={() => onAddItem(item)}
              >
                <Text style={styles.quickAddButtonText}>{item}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </CardContent>
    </Card>
  )
}

export default function V3PantryScreen() {
  const [pantryItems] = useState<PantryItem[]>([
    { id: '1', name: 'Milk', category: 'Dairy', quantity: 1, unit: 'liter', expiryDate: '2024-01-15', daysLeft: 2, emoji: '🥛' },
    { id: '2', name: 'Bananas', category: 'Fruit', quantity: 6, unit: 'pieces', expiryDate: '2024-01-14', daysLeft: 1, emoji: '🍌' },
    { id: '3', name: 'Bread', category: 'Bakery', quantity: 1, unit: 'loaf', expiryDate: '2024-01-13', daysLeft: 0, emoji: '🍞' },
  ])

  const [leftovers] = useState<LeftoverItem[]>([
    { 
      id: '1', 
      name: 'Roasted Chicken', 
      quantity: '2 portions', 
      addedDate: '2024-01-12', 
      suggestions: ['Chicken Salad', 'Soup', 'Sandwich'],
      emoji: '🍗'
    },
    { 
      id: '2', 
      name: 'Cooked Rice', 
      quantity: '1 cup', 
      addedDate: '2024-01-11', 
      suggestions: ['Fried Rice', 'Rice Pudding'],
      emoji: '🍚'
    }
  ])

  const [shoppingList, setShoppingList] = useState<string[]>(['Tomatoes', 'Olive Oil', 'Garlic'])

  const useItem = (id: string) => {
    console.log('Using item:', id)
  }

  const addLeftover = () => {
    console.log('Adding leftover')
  }

  const useLeftover = (id: string) => {
    console.log('Using leftover:', id)
  }

  const addToShoppingList = (item: string) => {
    if (!shoppingList.includes(item)) {
      setShoppingList(prev => [...prev, item])
    }
  }

  const removeFromShoppingList = (index: number) => {
    setShoppingList(prev => prev.filter((_, i) => i !== index))
  }

  const scanReceipt = () => {
    console.log('Scanning receipt...')
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
              <Text style={styles.title}>Smart Pantry</Text>
              <Text style={styles.subtitle}>Track, manage, and never waste food</Text>
            </View>

            {/* Expiring Items */}
            <ExpiringItems items={pantryItems} onUseItem={useItem} />

            {/* Leftovers Tracker */}
            <LeftoversTracker 
              leftovers={leftovers}
              onAddLeftover={addLeftover}
              onUseLeftover={useLeftover}
            />

            {/* Shopping List */}
            <ShoppingList 
              items={shoppingList}
              onAddItem={addToShoppingList}
              onRemoveItem={removeFromShoppingList}
            />

            {/* Quick Actions */}
            <View style={styles.quickActions}>
              <Button size="lg" onPress={scanReceipt} style={styles.actionButton}>
                📷 Scan Receipt
              </Button>
              <Button variant="outline" size="lg" onPress={() => {}} style={styles.actionButton}>
                📝 Add Item Manually
              </Button>
            </View>

            {/* Waste Reduction Stats */}
            <Card>
              <CardHeader>
                <CardTitle>🌱 Your Impact</CardTitle>
              </CardHeader>
              <CardContent>
                <View style={styles.impactStats}>
                  <View style={styles.impactItem}>
                    <Text style={styles.impactNumber}>87%</Text>
                    <Text style={styles.impactLabel}>Food Used</Text>
                  </View>
                  <View style={styles.impactItem}>
                    <Text style={styles.impactNumber}>€24</Text>
                    <Text style={styles.impactLabel}>Money Saved</Text>
                  </View>
                  <View style={styles.impactItem}>
                    <Text style={styles.impactNumber}>12kg</Text>
                    <Text style={styles.impactLabel}>Waste Prevented</Text>
                  </View>
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

  // Items Lists
  itemsList: {
    gap: Spacing.md,
  },
  expiringItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.brand.red100,
    borderRadius: BorderRadius.sm,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
  },
  leftoverItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.brand.emerald50,
    borderRadius: BorderRadius.sm,
    borderLeftWidth: 4,
    borderLeftColor: Colors.success,
  },
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemEmoji: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.medium,
    color: Colors.foreground,
  },
  itemQuantity: {
    fontSize: Typography.sizes.small,
    color: Colors.mutedForeground,
  },
  suggestions: {
    fontSize: Typography.sizes.small,
    color: Colors.success,
    marginTop: Spacing.xs,
  },
  expiryInfo: {
    alignItems: 'flex-end',
  },
  daysLeft: {
    fontSize: Typography.sizes.small,
    fontWeight: Typography.weights.semibold,
    marginBottom: Spacing.xs,
  },
  useButton: {
    backgroundColor: Colors.success,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  useButtonText: {
    fontSize: Typography.sizes.small,
    color: Colors.primaryForeground,
    fontWeight: Typography.weights.medium,
  },

  // Empty states
  emptyText: {
    fontSize: Typography.sizes.caption,
    color: Colors.mutedForeground,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  emptyLeftovers: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  addLeftoverButton: {
    alignSelf: 'center',
  },

  // Shopping List
  shoppingItems: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  shoppingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.sm,
    backgroundColor: Colors.brand.blue50,
    borderRadius: BorderRadius.sm,
  },
  shoppingItemText: {
    fontSize: Typography.sizes.caption,
    color: Colors.foreground,
    flex: 1,
  },
  removeButton: {
    backgroundColor: Colors.success,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    fontSize: Typography.sizes.small,
    color: Colors.primaryForeground,
  },
  quickAdd: {
    gap: Spacing.sm,
  },
  quickAddTitle: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.medium,
    color: Colors.foreground,
  },
  quickAddButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  quickAddButton: {
    backgroundColor: Colors.muted,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  quickAddButtonText: {
    fontSize: Typography.sizes.small,
    color: Colors.foreground,
  },

  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  actionButton: {
    flex: 1,
  },

  // Impact Stats
  impactStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  impactItem: {
    alignItems: 'center',
  },
  impactNumber: {
    fontSize: Typography.sizes.subsection,
    fontWeight: Typography.weights.bold,
    color: Colors.success,
  },
  impactLabel: {
    fontSize: Typography.sizes.small,
    color: Colors.mutedForeground,
    marginTop: Spacing.xs,
  },
})