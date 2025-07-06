import { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Check, ShoppingCart, Filter, Calendar, MapPin, TrendingDown, Euro, Store, Target, Clock, Route, Star } from 'lucide-react';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

interface GroceryItem {
  id: string;
  name: string;
  amount: string;
  category: string;
  addedDate: string;
  fromRecipe?: string;
  completed?: boolean;
}

interface StorePrice {
  store: string;
  price: number;
  currency: string;
  unit: string;
  isLowestPrice?: boolean;
  logo?: string;
  distance?: string;
  inStock?: boolean;
}

interface ItemPrices {
  itemName: string;
  normalizedName: string; // For matching with grocery items
  prices: StorePrice[];
  category: string;
}

interface UserData {
  fullName: string;
  email: string;
  country: string;
  city: string;
  postalCode: string;
  age?: number;
  gender?: string;
  weight?: number;
  weightUnit?: 'kg' | 'lbs';
  height?: number;
  heightUnit?: 'cm' | 'ft';
  heightFeet?: number;
  heightInches?: number;
  dietStyle?: string[];
  customDietStyle?: string;
  allergies?: string[];
  medicalConditions?: string[];
  activityLevel?: string;
  healthGoals?: string[];
  foodRestrictions?: string[];
  cookingSkill?: string;
  mealPreference?: string;
  subscriptionTier?: 'free' | 'premium';
  dailySwipesUsed?: number;
  lastSwipeDate?: string;
  favoriteRecipes?: string[];
  selectedRecipes?: string[];
  cookedRecipes?: any[];
  leftovers?: string[];
  groceryList?: GroceryItem[];
}

interface ShopScreenProps {
  userData: UserData | null;
}

export function ShopScreen({ userData }: ShopScreenProps) {
  const [groceryList, setGroceryList] = useState<GroceryItem[]>(userData?.groceryList || []);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [newItemName, setNewItemName] = useState('');
  const [newItemAmount, setNewItemAmount] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPriceComparison, setShowPriceComparison] = useState(true);
  const [selectedStore, setSelectedStore] = useState('All Stores');

  // Enhanced mock price comparison data for common grocery items
  const mockPriceData: ItemPrices[] = [
    {
      itemName: 'Chicken Breast',
      normalizedName: 'chicken breast',
      category: 'Protein',
      prices: [
        { store: 'Lidl', price: 4.99, currency: '€', unit: 'per kg', isLowestPrice: true, distance: '0.8 km', inStock: true },
        { store: 'Jumbo', price: 6.49, currency: '€', unit: 'per kg', distance: '1.2 km', inStock: true },
        { store: 'Albert Heijn', price: 7.99, currency: '€', unit: 'per kg', distance: '0.5 km', inStock: true },
        { store: 'Plus', price: 5.99, currency: '€', unit: 'per kg', distance: '2.1 km', inStock: false }
      ]
    },
    {
      itemName: 'Broccoli',
      normalizedName: 'broccoli',
      category: 'Vegetables',
      prices: [
        { store: 'Lidl', price: 1.29, currency: '€', unit: 'per piece', distance: '0.8 km', inStock: true },
        { store: 'Jumbo', price: 1.19, currency: '€', unit: 'per piece', isLowestPrice: true, distance: '1.2 km', inStock: true },
        { store: 'Albert Heijn', price: 1.49, currency: '€', unit: 'per piece', distance: '0.5 km', inStock: true },
        { store: 'Plus', price: 1.39, currency: '€', unit: 'per piece', distance: '2.1 km', inStock: true }
      ]
    },
    {
      itemName: 'Rice',
      normalizedName: 'rice',
      category: 'Grains',
      prices: [
        { store: 'Lidl', price: 2.99, currency: '€', unit: 'per 1kg bag', isLowestPrice: true, distance: '0.8 km', inStock: true },
        { store: 'Jumbo', price: 3.49, currency: '€', unit: 'per 1kg bag', distance: '1.2 km', inStock: true },
        { store: 'Albert Heijn', price: 4.29, currency: '€', unit: 'per 1kg bag', distance: '0.5 km', inStock: true },
        { store: 'Plus', price: 3.19, currency: '€', unit: 'per 1kg bag', distance: '2.1 km', inStock: true }
      ]
    },
    {
      itemName: 'Pasta',
      normalizedName: 'pasta',
      category: 'Grains',
      prices: [
        { store: 'Lidl', price: 0.89, currency: '€', unit: 'per 500g', isLowestPrice: true, distance: '0.8 km', inStock: true },
        { store: 'Jumbo', price: 1.29, currency: '€', unit: 'per 500g', distance: '1.2 km', inStock: true },
        { store: 'Albert Heijn', price: 1.49, currency: '€', unit: 'per 500g', distance: '0.5 km', inStock: true },
        { store: 'Plus', price: 0.99, currency: '€', unit: 'per 500g', distance: '2.1 km', inStock: true }
      ]
    },
    {
      itemName: 'Tomatoes',
      normalizedName: 'tomato',
      category: 'Vegetables',
      prices: [
        { store: 'Lidl', price: 2.49, currency: '€', unit: 'per kg', distance: '0.8 km', inStock: true },
        { store: 'Jumbo', price: 2.99, currency: '€', unit: 'per kg', distance: '1.2 km', inStock: true },
        { store: 'Albert Heijn', price: 2.19, currency: '€', unit: 'per kg', isLowestPrice: true, distance: '0.5 km', inStock: true },
        { store: 'Plus', price: 2.69, currency: '€', unit: 'per kg', distance: '2.1 km', inStock: true }
      ]
    },
    {
      itemName: 'Milk',
      normalizedName: 'milk',
      category: 'Dairy',
      prices: [
        { store: 'Lidl', price: 1.09, currency: '€', unit: 'per 1L', isLowestPrice: true, distance: '0.8 km', inStock: true },
        { store: 'Jumbo', price: 1.19, currency: '€', unit: 'per 1L', distance: '1.2 km', inStock: true },
        { store: 'Albert Heijn', price: 1.29, currency: '€', unit: 'per 1L', distance: '0.5 km', inStock: true },
        { store: 'Plus', price: 1.15, currency: '€', unit: 'per 1L', distance: '2.1 km', inStock: true }
      ]
    },
    {
      itemName: 'Onions',
      normalizedName: 'onion',
      category: 'Vegetables',
      prices: [
        { store: 'Lidl', price: 1.99, currency: '€', unit: 'per kg', distance: '0.8 km', inStock: true },
        { store: 'Jumbo', price: 2.29, currency: '€', unit: 'per kg', distance: '1.2 km', inStock: true },
        { store: 'Albert Heijn', price: 1.79, currency: '€', unit: 'per kg', isLowestPrice: true, distance: '0.5 km', inStock: true },
        { store: 'Plus', price: 2.09, currency: '€', unit: 'per kg', distance: '2.1 km', inStock: true }
      ]
    },
    {
      itemName: 'Carrots',
      normalizedName: 'carrot',
      category: 'Vegetables',
      prices: [
        { store: 'Lidl', price: 0.99, currency: '€', unit: 'per 1kg bag', isLowestPrice: true, distance: '0.8 km', inStock: true },
        { store: 'Jumbo', price: 1.39, currency: '€', unit: 'per 1kg bag', distance: '1.2 km', inStock: true },
        { store: 'Albert Heijn', price: 1.59, currency: '€', unit: 'per 1kg bag', distance: '0.5 km', inStock: true },
        { store: 'Plus', price: 1.19, currency: '€', unit: 'per 1kg bag', distance: '2.1 km', inStock: true }
      ]
    },
    {
      itemName: 'Bread',
      normalizedName: 'bread',
      category: 'Bakery',
      prices: [
        { store: 'Lidl', price: 1.49, currency: '€', unit: 'per loaf', distance: '0.8 km', inStock: true },
        { store: 'Jumbo', price: 2.29, currency: '€', unit: 'per loaf', distance: '1.2 km', inStock: true },
        { store: 'Albert Heijn', price: 2.79, currency: '€', unit: 'per loaf', distance: '0.5 km', inStock: true },
        { store: 'Plus', price: 1.29, currency: '€', unit: 'per loaf', isLowestPrice: true, distance: '2.1 km', inStock: true }
      ]
    },
    {
      itemName: 'Eggs',
      normalizedName: 'egg',
      category: 'Dairy',
      prices: [
        { store: 'Lidl', price: 2.79, currency: '€', unit: 'per dozen', distance: '0.8 km', inStock: true },
        { store: 'Jumbo', price: 3.29, currency: '€', unit: 'per dozen', distance: '1.2 km', inStock: true },
        { store: 'Albert Heijn', price: 2.49, currency: '€', unit: 'per dozen', isLowestPrice: true, distance: '0.5 km', inStock: true },
        { store: 'Plus', price: 2.99, currency: '€', unit: 'per dozen', distance: '2.1 km', inStock: true }
      ]
    },
    {
      itemName: 'Potatoes',
      normalizedName: 'potato',
      category: 'Vegetables',
      prices: [
        { store: 'Lidl', price: 1.59, currency: '€', unit: 'per 2kg bag', isLowestPrice: true, distance: '0.8 km', inStock: true },
        { store: 'Jumbo', price: 2.09, currency: '€', unit: 'per 2kg bag', distance: '1.2 km', inStock: true },
        { store: 'Albert Heijn', price: 2.49, currency: '€', unit: 'per 2kg bag', distance: '0.5 km', inStock: true },
        { store: 'Plus', price: 1.89, currency: '€', unit: 'per 2kg bag', distance: '2.1 km', inStock: true }
      ]
    },
    {
      itemName: 'Cheese',
      normalizedName: 'cheese',
      category: 'Dairy',
      prices: [
        { store: 'Lidl', price: 3.99, currency: '€', unit: 'per 400g pack', distance: '0.8 km', inStock: true },
        { store: 'Jumbo', price: 4.79, currency: '€', unit: 'per 400g pack', distance: '1.2 km', inStock: true },
        { store: 'Albert Heijn', price: 3.49, currency: '€', unit: 'per 400g pack', isLowestPrice: true, distance: '0.5 km', inStock: true },
        { store: 'Plus', price: 4.29, currency: '€', unit: 'per 400g pack', distance: '2.1 km', inStock: false }
      ]
    },
    {
      itemName: 'Bananas',
      normalizedName: 'banana',
      category: 'Fruits',
      prices: [
        { store: 'Lidl', price: 1.79, currency: '€', unit: 'per kg', distance: '0.8 km', inStock: true },
        { store: 'Jumbo', price: 1.99, currency: '€', unit: 'per kg', distance: '1.2 km', inStock: true },
        { store: 'Albert Heijn', price: 1.69, currency: '€', unit: 'per kg', isLowestPrice: true, distance: '0.5 km', inStock: true },
        { store: 'Plus', price: 1.89, currency: '€', unit: 'per kg', distance: '2.1 km', inStock: true }
      ]
    },
    {
      itemName: 'Apples',
      normalizedName: 'apple',
      category: 'Fruits',
      prices: [
        { store: 'Lidl', price: 2.29, currency: '€', unit: 'per kg', distance: '0.8 km', inStock: true },
        { store: 'Jumbo', price: 2.79, currency: '€', unit: 'per kg', distance: '1.2 km', inStock: true },
        { store: 'Albert Heijn', price: 3.19, currency: '€', unit: 'per kg', distance: '0.5 km', inStock: true },
        { store: 'Plus', price: 2.09, currency: '€', unit: 'per kg', isLowestPrice: true, distance: '2.1 km', inStock: true }
      ]
    },
    {
      itemName: 'Olive Oil',
      normalizedName: 'olive oil',
      category: 'Pantry',
      prices: [
        { store: 'Lidl', price: 3.99, currency: '€', unit: 'per 500ml', isLowestPrice: true, distance: '0.8 km', inStock: true },
        { store: 'Jumbo', price: 5.49, currency: '€', unit: 'per 500ml', distance: '1.2 km', inStock: true },
        { store: 'Albert Heijn', price: 6.99, currency: '€', unit: 'per 500ml', distance: '0.5 km', inStock: true },
        { store: 'Plus', price: 4.79, currency: '€', unit: 'per 500ml', distance: '2.1 km', inStock: true }
      ]
    },
    {
      itemName: 'Ground Beef',
      normalizedName: 'ground beef',
      category: 'Protein',
      prices: [
        { store: 'Lidl', price: 7.99, currency: '€', unit: 'per kg', distance: '0.8 km', inStock: true },
        { store: 'Jumbo', price: 8.99, currency: '€', unit: 'per kg', distance: '1.2 km', inStock: true },
        { store: 'Albert Heijn', price: 9.79, currency: '€', unit: 'per kg', distance: '0.5 km', inStock: true },
        { store: 'Plus', price: 7.49, currency: '€', unit: 'per kg', isLowestPrice: true, distance: '2.1 km', inStock: true }
      ]
    }
  ];

  const stores = ['All Stores', 'Lidl', 'Jumbo', 'Albert Heijn', 'Plus'];

  // Get user's first name
  const getUserFirstName = () => {
    if (!userData?.fullName) return '';
    return userData.fullName.split(' ')[0];
  };

  // Categories for filtering
  const categories = ['All', 'Vegetables', 'Fruits', 'Protein', 'Dairy', 'Grains', 'Pantry', 'Spices', 'Fresh', 'Bakery', 'Nuts', 'Herbs', 'Condiments'];

  // Find price data for grocery items
  const findPriceData = (itemName: string): ItemPrices | undefined => {
    return mockPriceData.find(priceData => 
      itemName.toLowerCase().includes(priceData.normalizedName) ||
      priceData.normalizedName.includes(itemName.toLowerCase())
    );
  };

  // Get items with price data
  const itemsWithPrices = groceryList
    .filter(item => !item.completed)
    .map(item => ({
      ...item,
      priceData: findPriceData(item.name)
    }))
    .filter(item => item.priceData);

  // Calculate comprehensive savings and shopping statistics
  const calculateSavings = () => {
    let totalRegular = 0;
    let totalBest = 0;
    let storeSavings: { [store: string]: number } = {};
    let bestStoreItems: { [store: string]: number } = {};
    
    itemsWithPrices.forEach(item => {
      if (item.priceData) {
        const bestPrice = Math.min(...item.priceData.prices.map(p => p.price));
        const averagePrice = item.priceData.prices.reduce((sum, p) => sum + p.price, 0) / item.priceData.prices.length;
        const bestStore = item.priceData.prices.find(p => p.price === bestPrice)?.store || '';
        
        totalBest += bestPrice;
        totalRegular += averagePrice;
        
        // Track best store frequency
        bestStoreItems[bestStore] = (bestStoreItems[bestStore] || 0) + 1;
        
        // Track savings per store
        item.priceData.prices.forEach(price => {
          if (!storeSavings[price.store]) storeSavings[price.store] = 0;
          storeSavings[price.store] += (averagePrice - price.price);
        });
      }
    });
    
    // Find the most cost-effective store overall
    const bestOverallStore = Object.entries(storeSavings)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || '';
    
    return {
      total: totalBest,
      savings: totalRegular - totalBest,
      bestStore: bestOverallStore,
      bestStoreItems,
      storeSavings
    };
  };

  const { total, savings, bestStore, bestStoreItems, storeSavings } = calculateSavings();

  // Calculate shopping route optimization
  const getOptimalShoppingRoute = () => {
    const storeDistances: { [store: string]: number } = {
      'Albert Heijn': 0.5,
      'Lidl': 0.8,
      'Jumbo': 1.2,
      'Plus': 2.1
    };

    // Score stores based on savings vs distance
    const storeScores = Object.entries(storeDistances).map(([store, distance]) => {
      const savings = storeSavings[store] || 0;
      const itemCount = bestStoreItems[store] || 0;
      const score = (savings * 10) - (distance * 2) + (itemCount * 5);
      
      return {
        store,
        distance,
        savings,
        itemCount,
        score
      };
    }).sort((a, b) => b.score - a.score);

    return storeScores;
  };

  const optimalRoute = getOptimalShoppingRoute();

  // Filter items based on search and category
  const filteredItems = groceryList.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Group items by completion status
  const pendingItems = filteredItems.filter(item => !item.completed);
  const completedItems = filteredItems.filter(item => item.completed);

  // Add new item to grocery list
  const handleAddItem = () => {
    if (newItemName.trim() && newItemAmount.trim()) {
      const newItem: GroceryItem = {
        id: Date.now().toString(),
        name: newItemName.trim(),
        amount: newItemAmount.trim(),
        category: 'Pantry', // Default category
        addedDate: new Date().toISOString(),
        completed: false
      };

      const updatedList = [...groceryList, newItem];
      setGroceryList(updatedList);
      
      // Update user data in localStorage
      if (userData) {
        const updatedUserData = {
          ...userData,
          groceryList: updatedList
        };
        localStorage.setItem('wellnoosh_user_data', JSON.stringify(updatedUserData));
      }

      // Reset form
      setNewItemName('');
      setNewItemAmount('');
      setShowAddForm(false);
    }
  };

  // Toggle item completion
  const toggleItemCompletion = (itemId: string) => {
    const updatedList = groceryList.map(item => 
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    setGroceryList(updatedList);

    // Update user data in localStorage
    if (userData) {
      const updatedUserData = {
        ...userData,
        groceryList: updatedList
      };
      localStorage.setItem('wellnoosh_user_data', JSON.stringify(updatedUserData));
    }
  };

  // Remove item from list
  const removeItem = (itemId: string) => {
    const updatedList = groceryList.filter(item => item.id !== itemId);
    setGroceryList(updatedList);

    // Update user data in localStorage
    if (userData) {
      const updatedUserData = {
        ...userData,
        groceryList: updatedList
      };
      localStorage.setItem('wellnoosh_user_data', JSON.stringify(updatedUserData));
    }
  };

  // Get store logo/icon
  const getStoreIcon = (storeName: string) => {
    const icons: { [key: string]: string } = {
      'Lidl': '🛒',
      'Jumbo': '🏪',
      'Albert Heijn': '🏬',
      'Plus': '🏫'
    };
    return icons[storeName] || '🏪';
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <div className="flex items-center justify-center p-6 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-1 font-body">Groceries</h1>
          <p className="text-gray-600 text-sm font-body">
            {getUserFirstName() ? `${getUserFirstName()}'s smart shopping list` : 'Your smart shopping list'}
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="p-6 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Search grocery items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 ios-button bg-white/80 backdrop-blur-md border-gray-200"
          />
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 ios-scroll">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`ios-button px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                selectedCategory === category
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/80 text-gray-600 border border-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Enhanced Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/80 backdrop-blur-md rounded-xl p-4 border border-gray-200">
            <div className="text-2xl font-bold text-blue-600">{pendingItems.length}</div>
            <div className="text-sm text-gray-600 font-body">Items to buy</div>
          </div>
          <div className="bg-white/80 backdrop-blur-md rounded-xl p-4 border border-gray-200">
            <div className="text-2xl font-bold text-green-600">{completedItems.length}</div>
            <div className="text-sm text-gray-600 font-body">Completed</div>
          </div>
          {savings > 0 && (
            <>
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4 border border-green-200">
                <div className="text-2xl font-bold text-green-600">€{savings.toFixed(2)}</div>
                <div className="text-sm text-gray-600 font-body">Potential savings</div>
              </div>
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                <div className="text-2xl font-bold text-purple-600">{itemsWithPrices.length}</div>
                <div className="text-sm text-gray-600 font-body">Price tracked</div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Price Comparison Section */}
      {itemsWithPrices.length > 0 && showPriceComparison && (
        <div className="px-6 pb-4">
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl border border-green-200 overflow-hidden">
            {/* Price Comparison Header */}
            <div className="p-4 bg-gradient-to-r from-green-500 to-blue-600 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-5 h-5" />
                  <h3 className="font-semibold font-body">Best Prices</h3>
                </div>
                <button
                  onClick={() => setShowPriceComparison(false)}
                  className="ios-button text-white/80 hover:text-white text-sm"
                >
                  Hide
                </button>
              </div>
              {savings > 0 && (
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-white/90 font-body">
                    💰 Save up to <span className="font-semibold">€{savings.toFixed(2)}</span> by shopping smart!
                  </p>
                  {bestStore && (
                    <p className="text-xs text-white/80 font-body">
                      🏆 Best overall store: <span className="font-medium">{bestStore}</span> ({bestStoreItems[bestStore]} best prices)
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Store Filter */}
            <div className="p-4 bg-white/80 border-b border-gray-200">
              <div className="flex gap-2 overflow-x-auto pb-2 ios-scroll">
                {stores.map((store) => (
                  <button
                    key={store}
                    onClick={() => setSelectedStore(store)}
                    className={`ios-button px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap flex items-center gap-1 ${
                      selectedStore === store
                        ? 'bg-blue-500 text-white'
                        : 'bg-white text-gray-600 border border-gray-200'
                    }`}
                  >
                    {store !== 'All Stores' && <span>{getStoreIcon(store)}</span>}
                    {store}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Comparison Items */}
            <div className="p-4 space-y-3">
              {itemsWithPrices.slice(0, 4).map((item) => {
                const priceData = item.priceData!;
                const filteredPrices = selectedStore === 'All Stores' 
                  ? priceData.prices 
                  : priceData.prices.filter(p => p.store === selectedStore);

                if (filteredPrices.length === 0) return null;

                const bestPrice = Math.min(...filteredPrices.map(p => p.price));
                const bestPriceStore = filteredPrices.find(p => p.price === bestPrice);

                return (
                  <div key={item.id} className="bg-white rounded-xl p-3 border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 font-body">{item.name}</h4>
                      <Badge variant="secondary" className="text-xs">{item.amount}</Badge>
                    </div>

                    {selectedStore === 'All Stores' ? (
                      <div className="grid grid-cols-2 gap-2">
                        {filteredPrices.slice(0, 4).map((price) => (
                          <div
                            key={price.store}
                            className={`p-2 rounded-lg border text-center ${
                              price.price === bestPrice
                                ? 'bg-green-50 border-green-200'
                                : 'bg-gray-50 border-gray-200'
                            }`}
                          >
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <span className="text-xs">{getStoreIcon(price.store)}</span>
                              <span className="text-xs font-medium font-body">{price.store}</span>
                              {price.price === bestPrice && (
                                <TrendingDown className="w-3 h-3 text-green-600" />
                              )}
                            </div>
                            <div className={`text-sm font-semibold ${
                              price.price === bestPrice ? 'text-green-700' : 'text-gray-700'
                            }`}>
                              {price.currency}{price.price.toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-500 font-body">{price.unit}</div>
                            <div className="flex flex-col items-center gap-1 mt-1">
                              <div className="flex items-center gap-1">
                                <MapPin className="w-2 h-2 text-gray-400" />
                                <span className="text-xs text-gray-400 font-body">{price.distance}</span>
                              </div>
                              {price.inStock ? (
                                <span className="text-xs text-green-600 font-body bg-green-50 px-1 rounded">In Stock</span>
                              ) : (
                                <span className="text-xs text-red-500 font-body bg-red-50 px-1 rounded">Out of Stock</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <span>{getStoreIcon(selectedStore)}</span>
                          <span className="font-medium font-body">{selectedStore}</span>
                        </div>
                        <div className="text-lg font-bold text-blue-700">
                          {bestPriceStore?.currency}{bestPrice.toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-600 font-body">{bestPriceStore?.unit}</div>
                        <div className="flex items-center justify-center gap-1 mt-1">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500 font-body">{bestPriceStore?.distance}</span>
                          {bestPriceStore && bestPriceStore.inStock && (
                            <span className="text-xs text-green-600 font-body">• In Stock</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {itemsWithPrices.length > 4 && (
                <div className="text-center pt-2">
                  <button className="ios-button text-blue-600 text-sm font-medium">
                    View All {itemsWithPrices.length} Items with Prices
                  </button>
                </div>
              )}

              {/* Shopping Route Optimization */}
              {optimalRoute.length > 0 && (
                <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Route className="w-5 h-5 text-blue-600" />
                    <h4 className="font-semibold text-blue-800 font-body">Smart Shopping Route</h4>
                  </div>
                  <div className="space-y-2">
                    {optimalRoute.slice(0, 2).map((route, index) => (
                      <div key={route.store} className="flex items-center justify-between p-2 bg-white rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                            index === 0 ? 'bg-green-500' : 'bg-blue-500'
                          }`}>
                            {index + 1}
                          </div>
                          <span className="text-sm">{getStoreIcon(route.store)}</span>
                          <span className="font-medium font-body">{route.store}</span>
                          {index === 0 && <Star className="w-3 h-3 text-yellow-500 fill-current" />}
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-green-600">
                            €{route.savings.toFixed(2)} saved
                          </div>
                          <div className="text-xs text-gray-500 font-body">
                            {route.distance} km • {route.itemCount} items
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 text-xs text-blue-600 font-body text-center">
                    <Clock className="w-3 h-3 inline mr-1" />
                    Estimated shopping time: {(optimalRoute.slice(0, 2).reduce((sum, route) => sum + route.distance, 0) * 5 + 30).toFixed(0)} minutes
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Show Price Comparison Button (when hidden) */}
      {itemsWithPrices.length > 0 && !showPriceComparison && (
        <div className="px-6 pb-4">
          <button
            onClick={() => setShowPriceComparison(true)}
            className="ios-button w-full p-3 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-xl flex items-center justify-center gap-2 shadow-lg"
          >
            <TrendingDown className="w-5 h-5" />
            Show Best Prices ({itemsWithPrices.length} items)
            {savings > 0 && <span className="text-sm">• Save €{savings.toFixed(2)}</span>}
          </button>
        </div>
      )}

      {/* Grocery List Content */}
      <div className="flex-1 overflow-y-auto ios-scroll px-6 pb-6">
        <div className="space-y-6 max-w-md mx-auto">
          {/* Add New Item Button */}
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="ios-button w-full p-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl flex items-center justify-center gap-2 shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Add Item to List
            </button>
          )}

          {/* Add Item Form */}
          {showAddForm && (
            <div className="bg-white/90 backdrop-blur-md rounded-2xl p-6 border border-gray-200 space-y-4">
              <h3 className="font-semibold text-gray-900 font-body">Add New Item</h3>
              <div className="space-y-3">
                <Input
                  placeholder="Item name..."
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="ios-button bg-white border-gray-200"
                />
                <Input
                  placeholder="Amount (e.g., 2 lbs, 1 cup)..."
                  value={newItemAmount}
                  onChange={(e) => setNewItemAmount(e.target.value)}
                  className="ios-button bg-white border-gray-200"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleAddItem}
                    className="ios-button flex-1 bg-blue-500 text-white"
                    disabled={!newItemName.trim() || !newItemAmount.trim()}
                  >
                    Add Item
                  </Button>
                  <Button
                    onClick={() => {
                      setShowAddForm(false);
                      setNewItemName('');
                      setNewItemAmount('');
                    }}
                    variant="outline"
                    className="ios-button"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Pending Items */}
          {pendingItems.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2 font-body">
                <ShoppingCart className="w-5 h-5" />
                To Buy ({pendingItems.length})
              </h2>
              {pendingItems.map((item) => {
                const priceData = findPriceData(item.name);
                const bestPrice = priceData ? Math.min(...priceData.prices.map(p => p.price)) : null;
                const bestStore = priceData?.prices.find(p => p.price === bestPrice);

                return (
                  <div key={item.id} className="bg-white/80 backdrop-blur-md rounded-xl p-4 border border-gray-200">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleItemCompletion(item.id)}
                        className="ios-button w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center"
                      >
                        {item.completed && <Check className="w-4 h-4 text-green-600" />}
                      </button>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-gray-900 font-body">{item.name}</h3>
                          <span className="text-sm text-gray-500 font-body">{item.amount}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {item.category}
                          </Badge>
                          {item.fromRecipe && (
                            <Badge variant="outline" className="text-xs">
                              From: {item.fromRecipe}
                            </Badge>
                          )}
                          {bestPrice && bestStore && (
                            <Badge className="text-xs bg-green-100 text-green-700">
                              💰 {getStoreIcon(bestStore.store)} €{bestPrice.toFixed(2)} • {bestStore.distance}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => removeItem(item.id)}
                        className="ios-button p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Completed Items */}
          {completedItems.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2 font-body">
                <Check className="w-5 h-5 text-green-600" />
                Completed ({completedItems.length})
              </h2>
              {completedItems.map((item) => (
                <div key={item.id} className="bg-white/60 backdrop-blur-md rounded-xl p-4 border border-gray-200 flex items-center gap-3 opacity-75">
                  <button
                    onClick={() => toggleItemCompletion(item.id)}
                    className="ios-button w-6 h-6 rounded-full bg-green-500 border-2 border-green-500 flex items-center justify-center"
                  >
                    <Check className="w-4 h-4 text-white" />
                  </button>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-600 line-through font-body">{item.name}</h3>
                      <span className="text-sm text-gray-400 font-body">{item.amount}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs opacity-60">
                        {item.category}
                      </Badge>
                      {item.fromRecipe && (
                        <Badge variant="outline" className="text-xs opacity-60">
                          From: {item.fromRecipe}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => removeItem(item.id)}
                    className="ios-button p-2 text-red-400 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {filteredItems.length === 0 && (
            <div className="text-center py-12">
              <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2 font-body">
                {searchTerm || selectedCategory !== 'All' ? 'No items found' : 'Your grocery list is empty'}
              </h3>
              <p className="text-gray-600 mb-6 font-body">
                {searchTerm || selectedCategory !== 'All' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Add items from recipes or create your own shopping list'
                }
              </p>
              {!searchTerm && selectedCategory === 'All' && !showAddForm && (
                <Button
                  onClick={() => setShowAddForm(true)}
                  className="ios-button bg-blue-500 text-white"
                >
                  Add Your First Item
                </Button>
              )}
            </div>
          )}

          {/* Shopping Tips */}
          {groceryList.length > 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-100 rounded-xl p-4 border border-blue-200">
              <h3 className="font-semibold text-blue-800 mb-2 font-body">💡 Smart Shopping Tips</h3>
              <ul className="text-sm text-blue-700 space-y-1 font-body">
                <li>• Compare prices across stores to save money</li>
                <li>• Group items by store sections for efficient shopping</li>
                <li>• Check items off as you shop to track progress</li>
                <li>• Items from recipes are automatically added here</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}