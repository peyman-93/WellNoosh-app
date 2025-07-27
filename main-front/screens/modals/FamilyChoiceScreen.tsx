import React, { useState } from 'react'
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView,
  Alert,
  Pressable,
  Modal,
  TextInput
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Colors, Typography, Spacing, BorderRadius } from '../../src/constants/DesignTokens'
import StarRating from '../../src/components/shared/StarRating'
import FamilyMemberSelectionScreen from './FamilyMemberSelectionScreen'

interface Recipe {
  id: string
  name: string
  image: string
  cookTime: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  rating: number
  tags: string[]
  description: string
  baseServings: number
  ingredients: {
    name: string
    amount: string
    unit: string
    category: string
  }[]
  instructions: string[]
  calories: number
  protein: number
  carbs: number
  fat: number
}

interface FamilyChoiceScreenProps {
  onNavigateBack: () => void
  onCreateVote?: (selectedRecipes: Recipe[], voteTitle: string, voteDescription: string) => void
  initialRecipe?: Recipe
  voteTitle?: string
  voteDescription?: string
}

interface ShareModalProps {
  visible: boolean
  onClose: () => void
  onShareWhatsApp: () => void
  onShareInApp: () => void
  selectedRecipes: Recipe[]
}

interface FilterBarProps {
  activeFilters: string[]
  activeCuisineFilters: string[]
  onFilterToggle: (filter: string) => void
  onCuisineFilterToggle: (filter: string) => void
}

function ShareModal({ visible, onClose, onShareWhatsApp, onShareInApp, selectedRecipes }: ShareModalProps) {
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'inapp'>('inapp')

  return (
    <View style={shareModalStyles.modalOverlay}>
      <View style={shareModalStyles.modalContainer}>
        <View style={shareModalStyles.modalHeader}>
          <Text style={shareModalStyles.modalTitle}>Share Voting Session</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={shareModalStyles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Buttons */}
        <View style={shareModalStyles.tabContainer}>
          <TouchableOpacity
            style={[
              shareModalStyles.tabButton,
              activeTab === 'inapp' && shareModalStyles.activeTab
            ]}
            onPress={() => setActiveTab('inapp')}
          >
            <Text style={shareModalStyles.tabIcon}>👥</Text>
            <Text style={[
              shareModalStyles.tabText,
              activeTab === 'inapp' && shareModalStyles.activeTabText
            ]}>
              Community
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              shareModalStyles.tabButton,
              activeTab === 'whatsapp' && shareModalStyles.activeTab
            ]}
            onPress={() => setActiveTab('whatsapp')}
          >
            <Text style={shareModalStyles.tabIcon}>💬</Text>
            <Text style={[
              shareModalStyles.tabText,
              activeTab === 'whatsapp' && shareModalStyles.activeTabText
            ]}>
              WhatsApp
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        <View style={shareModalStyles.tabContent}>
          {activeTab === 'inapp' ? (
            <View>
              <Text style={shareModalStyles.description}>
                Share with community members who are already using WellNoosh
              </Text>
              
              <View style={shareModalStyles.featureList}>
                <View style={shareModalStyles.featureItem}>
                  <Text style={shareModalStyles.featureIcon}>✅</Text>
                  <Text style={shareModalStyles.featureText}>Real-time voting updates</Text>
                </View>
                <View style={shareModalStyles.featureItem}>
                  <Text style={shareModalStyles.featureIcon}>📊</Text>
                  <Text style={shareModalStyles.featureText}>Live results dashboard</Text>
                </View>
                <View style={shareModalStyles.featureItem}>
                  <Text style={shareModalStyles.featureIcon}>🔔</Text>
                  <Text style={shareModalStyles.featureText}>Automatic notifications</Text>
                </View>
              </View>

              <TouchableOpacity 
                style={shareModalStyles.shareButton}
                onPress={onShareInApp}
              >
                <Text style={shareModalStyles.shareButtonText}>Share in Community</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <Text style={shareModalStyles.description}>
                Send voting link via WhatsApp to community members
              </Text>
              
              <View style={shareModalStyles.featureList}>
                <View style={shareModalStyles.featureItem}>
                  <Text style={shareModalStyles.featureIcon}>🔗</Text>
                  <Text style={shareModalStyles.featureText}>Simple voting link</Text>
                </View>
                <View style={shareModalStyles.featureItem}>
                  <Text style={shareModalStyles.featureIcon}>📱</Text>
                  <Text style={shareModalStyles.featureText}>No app required</Text>
                </View>
                <View style={shareModalStyles.featureItem}>
                  <Text style={shareModalStyles.featureIcon}>👨‍👩‍👧‍👦</Text>
                  <Text style={shareModalStyles.featureText}>Easy for all community members</Text>
                </View>
              </View>

              <TouchableOpacity 
                style={[shareModalStyles.shareButton, shareModalStyles.whatsappButton]}
                onPress={onShareWhatsApp}
              >
                <Text style={shareModalStyles.shareButtonText}>Share via WhatsApp</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Selected Recipes Preview */}
        <View style={shareModalStyles.recipePreview}>
          <Text style={shareModalStyles.previewTitle}>Recipes for voting:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {selectedRecipes.map((recipe, index) => (
              <View key={recipe.id} style={shareModalStyles.recipePreviewItem}>
                <Text style={shareModalStyles.recipePreviewEmoji}>{recipe.image}</Text>
                <Text style={shareModalStyles.recipePreviewName}>{recipe.name}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </View>
  )
}

function FilterBar({ activeFilters, activeCuisineFilters, onFilterToggle, onCuisineFilterToggle }: FilterBarProps) {
  const mainFilters = [
    { id: 'favourites', label: 'Favourites', emoji: '❤️' },
    { id: 'leftover-opti', label: 'Leftover Opti', emoji: '♻️' },
    { id: 'healthy', label: 'Healthy', emoji: '🥗' }
  ]

  const cuisineFilters = [
    { id: 'asian', label: 'Asian', emoji: '🥢' },
    { id: 'french', label: 'French', emoji: '🥐' },
    { id: 'persian', label: 'Persian', emoji: '🧿' },
    { id: 'italian', label: 'Italian', emoji: '🍝' },
    { id: 'mexican', label: 'Mexican', emoji: '🌮' },
    { id: 'indian', label: 'Indian', emoji: '🍛' },
    { id: 'mediterranean', label: 'Mediterranean', emoji: '🫒' }
  ]

  return (
    <View style={styles.filtersContainer}>
      {/* Main Filters */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.filterScrollView}
        contentContainerStyle={styles.filterContainer}
      >
        {mainFilters.map(filter => (
          <Pressable
            key={filter.id}
            style={[
              styles.filterButton,
              activeFilters.includes(filter.id) && styles.activeFilterButton
            ]}
            onPress={() => onFilterToggle(filter.id)}
          >
            <Text style={styles.filterEmoji}>{filter.emoji}</Text>
            <Text style={[
              styles.filterText,
              activeFilters.includes(filter.id) && styles.activeFilterText
            ]}>
              {filter.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Cuisine Filters */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.filterScrollView}
        contentContainerStyle={styles.filterContainer}
      >
        {cuisineFilters.map(filter => (
          <Pressable
            key={filter.id}
            style={[
              styles.cuisineFilterButton,
              activeCuisineFilters.includes(filter.id) && styles.activeCuisineFilterButton
            ]}
            onPress={() => onCuisineFilterToggle(filter.id)}
          >
            <Text style={styles.filterEmoji}>{filter.emoji}</Text>
            <Text style={[
              styles.cuisineFilterText,
              activeCuisineFilters.includes(filter.id) && styles.activeCuisineFilterText
            ]}>
              {filter.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  )
}

function RecipeSelectionCard({ recipe, isSelected, onToggle }: { 
  recipe: Recipe, 
  isSelected: boolean, 
  onToggle: () => void 
}) {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return Colors.success
      case 'Medium': return Colors.warning
      case 'Hard': return Colors.destructive
      default: return Colors.mutedForeground
    }
  }

  return (
    <TouchableOpacity 
      onPress={onToggle}
      style={[
        styles.recipeCard,
        isSelected && styles.selectedRecipeCard
      ]}
    >
      <View style={styles.recipeImageContainer}>
        <Text style={styles.recipeEmoji}>{recipe.image}</Text>
        <View style={styles.recipeOverlay}>
          <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(recipe.difficulty) }]}>
            <Text style={styles.difficultyText}>{recipe.difficulty}</Text>
          </View>
          <View style={[
            styles.selectionIndicator,
            isSelected && styles.selectedIndicator
          ]}>
            <Text style={styles.selectionIcon}>
              {isSelected ? '✓' : '○'}
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.recipeContent}>
        <Text style={styles.recipeName}>{recipe.name}</Text>
        <Text style={styles.recipeDescription} numberOfLines={2}>
          {recipe.description}
        </Text>
        
        <View style={styles.recipeStats}>
          <View style={styles.recipeStat}>
            <Text style={styles.recipeStatEmoji}>⏱️</Text>
            <Text style={styles.recipeStatText}>{recipe.cookTime}</Text>
          </View>
          <View style={styles.recipeStat}>
            <StarRating 
              rating={recipe.rating}
              size="small"
              interactive={false}
              showRating={false}
            />
          </View>
        </View>
        
        <View style={styles.recipeTags}>
          {recipe.tags.slice(0, 2).map((tag, index) => (
            <View key={index} style={styles.recipeTag}>
              <Text style={styles.recipeTagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  )
}

export default function FamilyChoiceScreen({ 
  onNavigateBack, 
  onCreateVote,
  initialRecipe,
  voteTitle: initialVoteTitle = '',
  voteDescription: initialVoteDescription = ''
}: FamilyChoiceScreenProps) {
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [activeCuisineFilters, setActiveCuisineFilters] = useState<string[]>([])
  const [selectedRecipes, setSelectedRecipes] = useState<string[]>(initialRecipe ? [initialRecipe.id] : [])
  const [favoriteRecipes] = useState<string[]>(['1', '3', '5']) // Mock favorites
  const [showShareModal, setShowShareModal] = useState(false)
  const [showFamilySelection, setShowFamilySelection] = useState(false)
  const [voteTitle, setVoteTitle] = useState(initialVoteTitle)
  const [voteDescription, setVoteDescription] = useState(initialVoteDescription)

  // Mock recipe data - in real app, this would come from your recipe service
  const recipes: Recipe[] = [
    {
      id: '1',
      name: 'Mediterranean Quinoa Bowl',
      image: '🥗',
      cookTime: '25 min',
      difficulty: 'Easy',
      calories: 456,
      rating: 4.8,
      tags: ['Healthy', 'Mediterranean', 'Vegetarian'],
      description: 'Fresh quinoa bowl with roasted vegetables, feta cheese, and lemon dressing',
      baseServings: 2,
      protein: 16,
      carbs: 58,
      fat: 14,
      ingredients: [
        { name: 'Quinoa', amount: '1', unit: 'cup', category: 'Grains' },
        { name: 'Cherry tomatoes', amount: '1', unit: 'cup', category: 'Vegetables' },
        { name: 'Cucumber', amount: '1', unit: 'medium', category: 'Vegetables' },
        { name: 'Feta cheese', amount: '0.5', unit: 'cup', category: 'Dairy' },
        { name: 'Olive oil', amount: '2', unit: 'tbsp', category: 'Pantry' }
      ],
      instructions: [
        'Cook quinoa according to package directions',
        'Dice vegetables and combine with quinoa',
        'Add feta cheese and drizzle with olive oil',
        'Serve immediately'
      ]
    },
    {
      id: '2',
      name: 'Spicy Thai Coconut Curry',
      image: '🍛',
      cookTime: '35 min',
      difficulty: 'Medium',
      calories: 523,
      rating: 4.6,
      tags: ['Thai', 'Spicy', 'Coconut'],
      description: 'Aromatic curry with coconut milk, fresh herbs, and your choice of protein',
      baseServings: 4,
      protein: 28,
      carbs: 12,
      fat: 26,
      ingredients: [
        { name: 'Coconut milk', amount: '1', unit: 'can', category: 'Pantry' },
        { name: 'Thai red curry paste', amount: '2', unit: 'tbsp', category: 'Pantry' },
        { name: 'Chicken breast', amount: '1', unit: 'lb', category: 'Protein' },
        { name: 'Bell peppers', amount: '2', unit: 'medium', category: 'Vegetables' },
        { name: 'Basil leaves', amount: '0.25', unit: 'cup', category: 'Herbs' }
      ],
      instructions: [
        'Heat curry paste in a large pan',
        'Add coconut milk and bring to simmer',
        'Add chicken and cook until done',
        'Add vegetables and cook until tender',
        'Garnish with fresh basil'
      ]
    },
    {
      id: '3',
      name: 'Classic Italian Carbonara',
      image: '🍝',
      cookTime: '20 min',
      difficulty: 'Medium',
      calories: 598,
      rating: 4.9,
      tags: ['Italian', 'Pasta', 'Quick'],
      description: 'Traditional carbonara with eggs, cheese, pancetta, and black pepper',
      baseServings: 4,
      protein: 24,
      carbs: 58,
      fat: 28,
      ingredients: [
        { name: 'Spaghetti', amount: '400', unit: 'g', category: 'Grains' },
        { name: 'Pancetta', amount: '150', unit: 'g', category: 'Protein' },
        { name: 'Eggs', amount: '3', unit: 'large', category: 'Protein' },
        { name: 'Parmesan cheese', amount: '100', unit: 'g', category: 'Dairy' },
        { name: 'Black pepper', amount: '1', unit: 'tsp', category: 'Spices' }
      ],
      instructions: [
        'Cook spaghetti until al dente',
        'Crisp pancetta in large pan',
        'Whisk eggs with cheese and pepper',
        'Toss hot pasta with pancetta',
        'Remove from heat and add egg mixture'
      ]
    },
    {
      id: '4',
      name: 'Korean Bibimbap',
      image: '🍚',
      cookTime: '45 min',
      difficulty: 'Medium',
      calories: 485,
      rating: 4.7,
      tags: ['Korean', 'Healthy', 'Vegetarian'],
      description: 'Colorful rice bowl with seasoned vegetables and gochujang sauce',
      baseServings: 2,
      protein: 18,
      carbs: 72,
      fat: 12,
      ingredients: [
        { name: 'White rice', amount: '1', unit: 'cup', category: 'Grains' },
        { name: 'Spinach', amount: '200', unit: 'g', category: 'Vegetables' },
        { name: 'Carrots', amount: '2', unit: 'medium', category: 'Vegetables' },
        { name: 'Bean sprouts', amount: '200', unit: 'g', category: 'Vegetables' },
        { name: 'Gochujang', amount: '2', unit: 'tbsp', category: 'Pantry' }
      ],
      instructions: [
        'Cook rice according to package directions',
        'Blanch and season vegetables separately',
        'Fry eggs sunny-side up',
        'Arrange vegetables over rice',
        'Top with egg and serve with gochujang'
      ]
    },
    {
      id: '5',
      name: 'Moroccan Chicken Tagine',
      image: '🍲',
      cookTime: '1 hour',
      difficulty: 'Medium',
      calories: 425,
      rating: 4.6,
      tags: ['Moroccan', 'Healthy', 'One-pot'],
      description: 'Aromatic chicken stew with dried fruits, almonds, and warm spices',
      baseServings: 6,
      protein: 32,
      carbs: 28,
      fat: 18,
      ingredients: [
        { name: 'Chicken thighs', amount: '2', unit: 'lbs', category: 'Protein' },
        { name: 'Dried apricots', amount: '0.5', unit: 'cup', category: 'Fruits' },
        { name: 'Almonds', amount: '0.25', unit: 'cup', category: 'Nuts' },
        { name: 'Cinnamon', amount: '1', unit: 'tsp', category: 'Spices' },
        { name: 'Onion', amount: '1', unit: 'large', category: 'Vegetables' }
      ],
      instructions: [
        'Brown chicken pieces in tagine or dutch oven',
        'Add onions and spices, cook until fragrant',
        'Add dried fruits and stock',
        'Simmer covered for 45 minutes',
        'Garnish with almonds and serve'
      ]
    },
    {
      id: '6',
      name: 'Greek Moussaka',
      image: '🍆',
      cookTime: '90 min',
      difficulty: 'Hard',
      calories: 520,
      rating: 4.8,
      tags: ['Greek', 'Mediterranean', 'Comfort Food'],
      description: 'Layered casserole with eggplant, meat sauce, and béchamel',
      baseServings: 8,
      protein: 28,
      carbs: 32,
      fat: 24,
      ingredients: [
        { name: 'Eggplant', amount: '3', unit: 'large', category: 'Vegetables' },
        { name: 'Ground lamb', amount: '1', unit: 'lb', category: 'Protein' },
        { name: 'Tomato sauce', amount: '2', unit: 'cups', category: 'Pantry' },
        { name: 'Milk', amount: '2', unit: 'cups', category: 'Dairy' },
        { name: 'Parmesan cheese', amount: '1', unit: 'cup', category: 'Dairy' }
      ],
      instructions: [
        'Slice and salt eggplant, let drain',
        'Brown lamb with onions and herbs',
        'Layer eggplant and meat in baking dish',
        'Top with béchamel sauce',
        'Bake until golden and bubbly'
      ]
    }
  ]

  const toggleFilter = (filter: string) => {
    setActiveFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    )
  }

  const toggleCuisineFilter = (filter: string) => {
    setActiveCuisineFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    )
  }

  const toggleRecipeSelection = (recipeId: string) => {
    setSelectedRecipes(prev => {
      if (prev.includes(recipeId)) {
        return prev.filter(id => id !== recipeId)
      } else if (prev.length < 4) { // Limit to 4 recipes for voting
        return [...prev, recipeId]
      } else {
        Alert.alert('Maximum Reached', 'You can select up to 4 recipes for family voting.')
        return prev
      }
    })
  }

  const handleCreateVote = () => {
    if (!voteTitle.trim()) {
      Alert.alert('Missing Title', 'Please enter a title for your vote.')
      return
    }
    
    if (selectedRecipes.length < 2) {
      Alert.alert('Select More Recipes', 'Please select at least 2 recipes for family voting.')
      return
    }

    setShowShareModal(true)
  }

  const handleShareWhatsApp = () => {
    const selectedRecipeObjects = recipes.filter(recipe => selectedRecipes.includes(recipe.id))
    
    // Generate WhatsApp share message
    const message = `🗳️ Family Dinner Vote!\n\nPlease vote for tonight's dinner:\n\n${
      selectedRecipeObjects.map((recipe, index) => 
        `${index + 1}. ${recipe.image} ${recipe.name}`
      ).join('\n')
    }\n\nClick here to vote: [voting link]`
    
    // In a real app, you would use Linking API to open WhatsApp
    Alert.alert(
      'WhatsApp Share',
      'Voting link will be shared via WhatsApp',
      [{ text: 'OK', onPress: () => {
        setShowShareModal(false)
        onCreateVote?.(selectedRecipeObjects, voteTitle, voteDescription)
      }}]
    )
  }

  const handleShareInApp = () => {
    setShowShareModal(false)
    setShowFamilySelection(true)
  }

  const handleFamilyMemberSelection = (memberIds: string[], groupId?: string) => {
    const selectedRecipeObjects = recipes.filter(recipe => selectedRecipes.includes(recipe.id))
    
    Alert.alert(
      'Vote Created!',
      `Voting session shared with ${memberIds.length} family member${memberIds.length !== 1 ? 's' : ''}${groupId ? ' in selected group' : ''}`,
      [{ text: 'OK', onPress: () => {
        setShowFamilySelection(false)
        onCreateVote?.(selectedRecipeObjects, voteTitle, voteDescription)
      }}]
    )
  }

  // Filter recipes based on active filters
  const filteredRecipes = recipes.filter(recipe => {
    // Apply main filters (if none selected, show all)
    let passesMainFilter = true
    if (activeFilters.length > 0) {
      passesMainFilter = activeFilters.some(filter => {
        if (filter === 'favourites') {
          return favoriteRecipes.includes(recipe.id)
        } else if (filter === 'leftover-opti') {
          return recipe.tags.some(tag => ['Quick', 'Leftover-Friendly', 'Easy'].includes(tag)) || 
                 parseInt(recipe.cookTime) <= 30
        } else if (filter === 'healthy') {
          return recipe.tags.includes('Healthy') || recipe.calories < 400
        }
        return false
      })
    }

    // Apply cuisine filters (if none selected, show all)
    let passesCuisineFilter = true
    if (activeCuisineFilters.length > 0) {
      passesCuisineFilter = activeCuisineFilters.some(filter => {
        if (filter === 'asian') {
          return recipe.tags.some(tag => ['Thai', 'Chinese', 'Japanese', 'Korean', 'Vietnamese'].includes(tag))
        } else if (filter === 'persian') {
          return recipe.tags.includes('Persian')
        } else if (filter === 'italian') {
          return recipe.tags.includes('Italian')
        } else if (filter === 'mexican') {
          return recipe.tags.includes('Mexican')
        } else if (filter === 'french') {
          return recipe.tags.includes('French')
        } else if (filter === 'indian') {
          return recipe.tags.includes('Indian')
        } else if (filter === 'mediterranean') {
          return recipe.tags.includes('Mediterranean')
        }
        return false
      })
    }

    return passesMainFilter && passesCuisineFilter
  })

  // Show family member selection screen if requested
  if (showFamilySelection) {
    return (
      <FamilyMemberSelectionScreen
        onBack={() => setShowFamilySelection(false)}
        onSelectMembers={handleFamilyMemberSelection}
      />
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={Colors.gradientBackground}
        style={styles.backgroundGradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Community Choice</Text>
            <Text style={styles.headerSubtitle}>
              {selectedRecipes.length}/4 recipes selected
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.createVoteButton,
              (selectedRecipes.length < 2 || !voteTitle.trim()) && styles.createVoteButtonDisabled
            ]}
            onPress={handleCreateVote}
            disabled={selectedRecipes.length < 2 || !voteTitle.trim()}
          >
            <Text style={[
              styles.createVoteText,
              (selectedRecipes.length < 2 || !voteTitle.trim()) && styles.createVoteTextDisabled
            ]}>
              Create Vote
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {/* Vote Title Input */}
            <View style={styles.titleInputContainer}>
              <Text style={styles.titleInputLabel}>Vote Title</Text>
              <TextInput
                style={styles.titleInput}
                placeholder="What are you voting on?"
                value={voteTitle}
                onChangeText={setVoteTitle}
                placeholderTextColor={Colors.mutedForeground}
              />
            </View>

            {/* Vote Description Input */}
            <View style={styles.titleInputContainer}>
              <Text style={styles.titleInputLabel}>Description (Optional)</Text>
              <TextInput
                style={[styles.titleInput, styles.descriptionInput]}
                placeholder="Add more details about this vote..."
                value={voteDescription}
                onChangeText={setVoteDescription}
                multiline
                numberOfLines={3}
                placeholderTextColor={Colors.mutedForeground}
              />
            </View>

            {/* Info Card */}
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>🗳️ How Community Choice Works</Text>
              <Text style={styles.infoDescription}>
                Select 2-4 recipes you'd like your community to vote on for tonight's dinner. 
                Everyone gets to vote, and the recipe with the most votes wins!
              </Text>
            </View>

            {/* Filter Bar */}
            <FilterBar 
              activeFilters={activeFilters} 
              activeCuisineFilters={activeCuisineFilters}
              onFilterToggle={toggleFilter} 
              onCuisineFilterToggle={toggleCuisineFilter}
            />

            {/* Selected Recipes Summary */}
            {selectedRecipes.length > 0 && (
              <View style={styles.selectedSummary}>
                <Text style={styles.selectedTitle}>Selected for Voting:</Text>
                <View style={styles.selectedList}>
                  {selectedRecipes.map(recipeId => {
                    const recipe = recipes.find(r => r.id === recipeId)
                    return recipe ? (
                      <View key={recipeId} style={styles.selectedItem}>
                        <Text style={styles.selectedEmoji}>{recipe.image}</Text>
                        <Text style={styles.selectedName}>{recipe.name}</Text>
                      </View>
                    ) : null
                  })}
                </View>
              </View>
            )}

            {/* Recipe Grid */}
            <View style={styles.recipesGrid}>
              {filteredRecipes.map(recipe => (
                <RecipeSelectionCard
                  key={recipe.id}
                  recipe={recipe}
                  isSelected={selectedRecipes.includes(recipe.id)}
                  onToggle={() => toggleRecipeSelection(recipe.id)}
                />
              ))}
            </View>
          </View>
        </ScrollView>
      </LinearGradient>

      {/* Share Modal */}
      <Modal
        visible={showShareModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowShareModal(false)}
      >
        <ShareModal
          visible={showShareModal}
          onClose={() => setShowShareModal(false)}
          onShareWhatsApp={handleShareWhatsApp}
          onShareInApp={handleShareInApp}
          selectedRecipes={recipes.filter(r => selectedRecipes.includes(r.id))}
        />
      </Modal>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.screenPadding,
    paddingTop: Spacing.lg,
  },
  backButton: {
    padding: Spacing.sm,
  },
  backButtonText: {
    fontSize: Typography.sizes.base,
    color: Colors.accent,
    fontWeight: Typography.weights.medium,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    color: Colors.foreground,
  },
  headerSubtitle: {
    fontSize: Typography.sizes.small,
    color: Colors.mutedForeground,
    marginTop: 2,
  },
  createVoteButton: {
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  createVoteButtonDisabled: {
    backgroundColor: Colors.muted,
    opacity: 0.6,
  },
  titleInputContainer: {
    marginBottom: Spacing.md,
  },
  titleInputLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.foreground,
    marginBottom: Spacing.xs,
  },
  titleInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.sizes.base,
    color: Colors.foreground,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  descriptionInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  createVoteText: {
    fontSize: Typography.sizes.small,
    color: Colors.primaryForeground,
    fontWeight: Typography.weights.medium,
  },
  createVoteTextDisabled: {
    color: Colors.mutedForeground,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.screenPadding,
    gap: Spacing.lg,
  },
  infoCard: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  infoTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.foreground,
    marginBottom: Spacing.sm,
  },
  infoDescription: {
    fontSize: Typography.sizes.caption,
    color: Colors.mutedForeground,
    lineHeight: 20,
  },
  selectedSummary: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
  },
  selectedTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.foreground,
    marginBottom: Spacing.sm,
  },
  selectedList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  selectedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
  },
  selectedEmoji: {
    fontSize: 16,
  },
  selectedName: {
    fontSize: Typography.sizes.small,
    color: Colors.foreground,
    fontWeight: Typography.weights.medium,
  },
  
  // Filter Bar Styles
  filtersContainer: {
    gap: Spacing.md,
  },
  filterScrollView: {
    marginHorizontal: -Spacing.screenPadding,
  },
  filterContainer: {
    paddingHorizontal: Spacing.screenPadding,
    gap: Spacing.sm,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.muted,
    gap: Spacing.sm,
  },
  activeFilterButton: {
    backgroundColor: Colors.accent,
  },
  cuisineFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.brand.gray100,
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  activeCuisineFilterButton: {
    backgroundColor: Colors.brand.blue50,
    borderColor: Colors.brand.blue500,
  },
  filterEmoji: {
    fontSize: 16,
  },
  filterText: {
    fontSize: Typography.sizes.caption,
    color: Colors.foreground,
    fontWeight: Typography.weights.medium,
  },
  activeFilterText: {
    color: Colors.primaryForeground,
  },
  cuisineFilterText: {
    fontSize: Typography.sizes.small,
    color: Colors.mutedForeground,
    fontWeight: Typography.weights.medium,
  },
  activeCuisineFilterText: {
    color: Colors.brand.blue600,
    fontWeight: Typography.weights.semibold,
  },

  // Recipe Grid
  recipesGrid: {
    gap: Spacing.lg,
  },
  recipeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedRecipeCard: {
    borderColor: Colors.accent,
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
  },
  recipeImageContainer: {
    height: 120,
    backgroundColor: Colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  recipeEmoji: {
    fontSize: 48,
  },
  recipeOverlay: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    right: Spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  difficultyBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  difficultyText: {
    fontSize: Typography.sizes.small,
    color: Colors.primaryForeground,
    fontWeight: Typography.weights.medium,
  },
  selectionIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  selectedIndicator: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  selectionIcon: {
    fontSize: 14,
    color: Colors.foreground,
    fontWeight: Typography.weights.bold,
  },
  recipeContent: {
    padding: Spacing.lg,
  },
  recipeName: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.foreground,
    marginBottom: Spacing.xs,
  },
  recipeDescription: {
    fontSize: Typography.sizes.caption,
    color: Colors.mutedForeground,
    lineHeight: 18,
    marginBottom: Spacing.sm,
  },
  recipeStats: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  recipeStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  recipeStatEmoji: {
    fontSize: 14,
  },
  recipeStatText: {
    fontSize: Typography.sizes.small,
    color: Colors.mutedForeground,
  },
  recipeTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  recipeTag: {
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  recipeTagText: {
    fontSize: Typography.sizes.small,
    color: Colors.primaryForeground,
    fontWeight: Typography.weights.medium,
  },
})

const shareModalStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: BorderRadius.lg,
    margin: Spacing.lg,
    padding: Spacing.lg,
    maxHeight: '80%',
    width: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.foreground,
  },
  closeButton: {
    fontSize: Typography.sizes.xl,
    color: Colors.mutedForeground,
    padding: Spacing.xs,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.md,
    padding: 4,
    marginBottom: Spacing.lg,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
  },
  activeTab: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabIcon: {
    fontSize: 18,
  },
  tabText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: Colors.mutedForeground,
  },
  activeTabText: {
    color: Colors.foreground,
  },
  tabContent: {
    marginBottom: Spacing.lg,
  },
  description: {
    fontSize: Typography.sizes.base,
    color: Colors.mutedForeground,
    marginBottom: Spacing.lg,
    lineHeight: 22,
  },
  featureList: {
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  featureIcon: {
    fontSize: 18,
    width: 24,
  },
  featureText: {
    fontSize: Typography.sizes.sm,
    color: Colors.foreground,
    flex: 1,
  },
  shareButton: {
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  whatsappButton: {
    backgroundColor: '#25D366',
  },
  shareButtonText: {
    color: 'white',
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
  },
  recipePreview: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.md,
  },
  previewTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: Colors.mutedForeground,
    marginBottom: Spacing.sm,
  },
  recipePreviewItem: {
    alignItems: 'center',
    marginRight: Spacing.md,
    width: 80,
  },
  recipePreviewEmoji: {
    fontSize: 36,
    marginBottom: Spacing.xs,
  },
  recipePreviewName: {
    fontSize: Typography.sizes.xs,
    color: Colors.foreground,
    textAlign: 'center',
    numberOfLines: 2,
  },
})