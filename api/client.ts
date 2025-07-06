// Mock API client for development
// Replace with your actual BFF endpoints

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api'

export interface Recipe {
  id: string
  title: string
  description: string
  ingredients: string[]
  instructions: string
  prep_time: number
  cook_time: number
  servings: number
  difficulty: 'easy' | 'medium' | 'hard'
  category: string
  image_url?: string
  created_at: string
  updated_at: string
}

export interface PantryItem {
  id: string
  name: string
  quantity: number
  unit: string
  expiry_date?: string
  category: string
  created_at: string
  updated_at: string
}

export interface MealPlan {
  id: string
  date: string
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  recipe_id?: string
  recipe?: Recipe
  notes?: string
  created_at: string
  updated_at: string
}

// Mock data for development
const mockRecipes: Recipe[] = [
  {
    id: '1',
    title: 'Avocado Toast',
    description: 'Simple and delicious avocado toast',
    ingredients: ['2 slices bread', '1 avocado', 'salt', 'pepper', 'lemon juice'],
    instructions: 'Toast bread, mash avocado, spread on toast, season',
    prep_time: 5,
    cook_time: 2,
    servings: 1,
    difficulty: 'easy',
    category: 'breakfast',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Chicken Stir Fry',
    description: 'Quick and healthy chicken stir fry',
    ingredients: ['chicken breast', 'vegetables', 'soy sauce', 'ginger', 'garlic'],
    instructions: 'Cook chicken, add vegetables, season with sauce',
    prep_time: 15,
    cook_time: 10,
    servings: 4,
    difficulty: 'medium',
    category: 'dinner',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

const mockPantryItems: PantryItem[] = [
  {
    id: '1',
    name: 'Chicken Breast',
    quantity: 2,
    unit: 'lbs',
    expiry_date: '2024-02-15',
    category: 'protein',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Avocado',
    quantity: 3,
    unit: 'pieces',
    expiry_date: '2024-02-10',
    category: 'produce',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

const mockMealPlans: MealPlan[] = [
  {
    id: '1',
    date: '2024-02-08',
    meal_type: 'breakfast',
    recipe_id: '1',
    recipe: mockRecipes[0],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    date: '2024-02-08',
    meal_type: 'dinner',
    recipe_id: '2',
    recipe: mockRecipes[1],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

// Mock API functions
export const api = {
  recipes: {
    getAll: async (): Promise<Recipe[]> => {
      await new Promise(resolve => setTimeout(resolve, 500)) // Simulate network delay
      return mockRecipes
    },
    getById: async (id: string): Promise<Recipe | null> => {
      await new Promise(resolve => setTimeout(resolve, 300))
      return mockRecipes.find(r => r.id === id) || null
    },
    create: async (recipe: Omit<Recipe, 'id' | 'created_at' | 'updated_at'>): Promise<Recipe> => {
      await new Promise(resolve => setTimeout(resolve, 500))
      const newRecipe: Recipe = {
        ...recipe,
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      mockRecipes.push(newRecipe)
      return newRecipe
    },
  },
  pantry: {
    getAll: async (): Promise<PantryItem[]> => {
      await new Promise(resolve => setTimeout(resolve, 500))
      return mockPantryItems
    },
    create: async (item: Omit<PantryItem, 'id' | 'created_at' | 'updated_at'>): Promise<PantryItem> => {
      await new Promise(resolve => setTimeout(resolve, 500))
      const newItem: PantryItem = {
        ...item,
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      mockPantryItems.push(newItem)
      return newItem
    },
  },
  mealPlans: {
    getAll: async (): Promise<MealPlan[]> => {
      await new Promise(resolve => setTimeout(resolve, 500))
      return mockMealPlans
    },
    getByDate: async (date: string): Promise<MealPlan[]> => {
      await new Promise(resolve => setTimeout(resolve, 300))
      return mockMealPlans.filter(plan => plan.date === date)
    },
    create: async (plan: Omit<MealPlan, 'id' | 'created_at' | 'updated_at'>): Promise<MealPlan> => {
      await new Promise(resolve => setTimeout(resolve, 500))
      const newPlan: MealPlan = {
        ...plan,
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      mockMealPlans.push(newPlan)
      return newPlan
    },
  },
}