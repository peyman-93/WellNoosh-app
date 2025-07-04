import { useState } from 'react';
import { 
  ArrowLeft,
  Heart,
  Clock,
  Star,
  ChefHat,
  Users,
  Search,
  ArrowRight
} from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface Cuisine {
  name: string;
  flag: string;
  region: string;
  description: string;
  characteristics: string[];
  popularDishes: {
    name: string;
    image: string;
    difficulty: string;
    time: string;
    rating: number;
    description: string;
    servings?: number;
  }[];
  ingredients: string[];
  heritage: string;
}

interface CuisineExplorerProps {
  onClose: () => void;
}

export function CuisineExplorer({ onClose }: CuisineExplorerProps) {
  const [selectedCuisine, setSelectedCuisine] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [likedDishes, setLikedDishes] = useState<string[]>([]);

  const cuisines: Cuisine[] = [
    {
      name: 'Japanese',
      flag: '🇯🇵',
      region: 'East Asia',
      description: 'Elegant simplicity emphasizing seasonal ingredients, precise technique, and natural flavors.',
      characteristics: ['Seasonal Focus', 'Umami Rich', 'Minimalist Presentation', 'Fresh Ingredients'],
      heritage: 'Centuries of culinary refinement rooted in Buddhist philosophy and seasonal harmony.',
      popularDishes: [
        {
          name: 'Chirashi Bowl',
          image: 'https://images.unsplash.com/photo-1563612116625-3012372fccce?w=400&h=300&fit=crop',
          difficulty: 'Intermediate',
          time: '30 min',
          rating: 4.8,
          description: 'Fresh sashimi over seasoned sushi rice',
          servings: 2
        },
        {
          name: 'Miso Soup',
          image: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400&h=300&fit=crop',
          difficulty: 'Easy',
          time: '15 min',
          rating: 4.6,
          description: 'Traditional soybean paste soup with tofu',
          servings: 4
        },
        {
          name: 'Gyoza',
          image: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=400&h=300&fit=crop',
          difficulty: 'Intermediate',
          time: '45 min',
          rating: 4.7,
          description: 'Pan-fried pork and vegetable dumplings',
          servings: 4
        }
      ],
      ingredients: ['Miso', 'Soy Sauce', 'Mirin', 'Dashi', 'Wasabi', 'Nori']
    },
    {
      name: 'French',
      flag: '🇫🇷',
      region: 'Western Europe',
      description: 'Sophisticated cuisine emphasizing technique, fresh ingredients, and wine pairings.',
      characteristics: ['Classical Technique', 'Wine Pairing', 'Seasonal Menu', 'Butter & Cream'],
      heritage: 'Refined over centuries in royal kitchens, defining modern culinary arts worldwide.',
      popularDishes: [
        {
          name: 'Bouillabaisse',
          image: 'https://images.unsplash.com/photo-1559847844-d724ce23f162?w=400&h=300&fit=crop',
          difficulty: 'Advanced',
          time: '90 min',
          rating: 4.9,
          description: 'Traditional Provençal fish stew',
          servings: 6
        },
        {
          name: 'Coq au Vin',
          image: 'https://images.unsplash.com/photo-1612880140562-e1f4fbbfe9af?w=400&h=300&fit=crop',
          difficulty: 'Intermediate',
          time: '2 hours',
          rating: 4.8,
          description: 'Chicken braised in red wine',
          servings: 4
        },
        {
          name: 'Tarte Tatin',
          image: 'https://images.unsplash.com/photo-1571115764595-644a1f56a55c?w=400&h=300&fit=crop',
          difficulty: 'Intermediate',
          time: '60 min',
          rating: 4.6,
          description: 'Upside-down apple tart',
          servings: 8
        }
      ],
      ingredients: ['Butter', 'Wine', 'Cream', 'Herbs', 'Shallots', 'Gruyère']
    },
    {
      name: 'Italian',
      flag: '🇮🇹',
      region: 'Southern Europe',
      description: 'Simple, high-quality ingredients creating timeless comfort food classics.',
      characteristics: ['Quality Ingredients', 'Regional Diversity', 'Pasta Mastery', 'Wine Culture'],
      heritage: 'Regional traditions passed down through generations, celebrating local ingredients.',
      popularDishes: [
        {
          name: 'Cacio e Pepe',
          image: 'https://images.unsplash.com/photo-1621996346565-e3dbc353d946?w=400&h=300&fit=crop',
          difficulty: 'Easy',
          time: '15 min',
          rating: 4.7,
          description: 'Pasta with cheese and black pepper',
          servings: 2
        },
        {
          name: 'Osso Buco',
          image: 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=400&h=300&fit=crop',
          difficulty: 'Advanced',
          time: '3 hours',
          rating: 4.9,
          description: 'Braised veal shanks in wine',
          servings: 4
        },
        {
          name: 'Tiramisu',
          image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&h=300&fit=crop',
          difficulty: 'Intermediate',
          time: '4 hours',
          rating: 4.8,
          description: 'Coffee-flavored layered dessert',
          servings: 8
        }
      ],
      ingredients: ['Parmesan', 'Olive Oil', 'San Marzano Tomatoes', 'Basil', 'Pancetta', 'Mascarpone']
    },
    {
      name: 'Nordic',
      flag: '🇸🇪',
      region: 'Northern Europe',
      description: 'Clean flavors highlighting local ingredients through modern techniques and tradition.',
      characteristics: ['Foraged Ingredients', 'Fermentation', 'Minimal Processing', 'Seasonal Focus'],
      heritage: 'Ancient preservation techniques evolved into modern New Nordic cuisine movement.',
      popularDishes: [
        {
          name: 'Gravlax',
          image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=300&fit=crop',
          difficulty: 'Easy',
          time: '48 hours',
          rating: 4.5,
          description: 'Cured salmon with dill',
          servings: 8
        },
        {
          name: 'Köttbullar',
          image: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400&h=300&fit=crop',
          difficulty: 'Easy',
          time: '30 min',
          rating: 4.6,
          description: 'Swedish meatballs with cream sauce',
          servings: 4
        },
        {
          name: 'Aquavit Cured Fish',
          image: 'https://images.unsplash.com/photo-1544124499-58912cbddaad?w=400&h=300&fit=crop',
          difficulty: 'Intermediate',
          time: '24 hours',
          rating: 4.7,
          description: 'Traditional spirit-cured seafood',
          servings: 6
        }
      ],
      ingredients: ['Dill', 'Juniper', 'Sea Buckthorn', 'Lingonberry', 'Rye', 'Aquavit']
    },
    {
      name: 'Mediterranean',
      flag: '🇬🇷',
      region: 'Southern Europe',
      description: 'Health-focused cuisine celebrating olive oil, fresh herbs, and grilled preparations.',
      characteristics: ['Olive Oil', 'Fresh Herbs', 'Grilled Focus', 'Healthy Fats'],
      heritage: 'Ancient trade routes brought diverse ingredients to create this healthful cuisine.',
      popularDishes: [
        {
          name: 'Branzino',
          image: 'https://images.unsplash.com/photo-1544124499-58912cbddaad?w=400&h=300&fit=crop',
          difficulty: 'Intermediate',
          time: '25 min',
          rating: 4.8,
          description: 'Grilled Mediterranean sea bass',
          servings: 2
        },
        {
          name: 'Mezze Platter',
          image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=300&fit=crop',
          difficulty: 'Easy',
          time: '20 min',
          rating: 4.6,
          description: 'Selection of small plates',
          servings: 6
        },
        {
          name: 'Ratatouille',
          image: 'https://images.unsplash.com/photo-1572441712058-981065f60e5b?w=400&h=300&fit=crop',
          difficulty: 'Easy',
          time: '45 min',
          rating: 4.5,
          description: 'Provence vegetable medley',
          servings: 6
        }
      ],
      ingredients: ['Extra Virgin Olive Oil', 'Oregano', 'Feta', 'Lemon', 'Kalamata Olives', 'Capers']
    },
    {
      name: 'Modern American',
      flag: '🇺🇸',
      region: 'North America',
      description: 'Contemporary cuisine blending global influences with local American ingredients.',
      characteristics: ['Farm to Table', 'Fusion Elements', 'Local Sourcing', 'Innovation'],
      heritage: 'Evolving cuisine reflecting America\'s diverse cultural influences and regional ingredients.',
      popularDishes: [
        {
          name: 'Duck Confit',
          image: 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=400&h=300&fit=crop',
          difficulty: 'Advanced',
          time: '4 hours',
          rating: 4.9,
          description: 'Slow-cooked duck in its own fat',
          servings: 4
        },
        {
          name: 'Bourbon Glazed Salmon',
          image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=300&fit=crop',
          difficulty: 'Intermediate',
          time: '25 min',
          rating: 4.7,
          description: 'American whiskey glazed fish',
          servings: 4
        },
        {
          name: 'Artisanal Burger',
          image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop',
          difficulty: 'Easy',
          time: '20 min',
          rating: 4.5,
          description: 'House-ground beef with local toppings',
          servings: 4
        }
      ],
      ingredients: ['Bourbon', 'Maple Syrup', 'Local Herbs', 'Artisan Cheese', 'Heirloom Tomatoes', 'Truffle Oil']
    }
  ];

  const selectedCuisineData = cuisines.find(c => c.name === selectedCuisine);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`w-3 h-3 ${i < Math.floor(rating) ? 'text-amber-400 fill-current' : 'text-gray-300'}`} 
      />
    ));
  };

  const toggleLike = (dishName: string) => {
    setLikedDishes(prev => 
      prev.includes(dishName) 
        ? prev.filter(name => name !== dishName)
        : [...prev, dishName]
    );
  };

  if (selectedCuisineData) {
    return (
      <div className="ios-scroll bg-white">
        {/* Minimal Header */}
        <div className="px-6 pt-6 pb-8 border-b border-gray-100">
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => setSelectedCuisine(null)}
              className="ios-button p-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button 
              className="ios-button p-2 text-gray-600 hover:text-red-500"
              onClick={() => toggleLike(selectedCuisineData.name)}
            >
              <Heart className={`w-5 h-5 ${likedDishes.includes(selectedCuisineData.name) ? 'text-red-500 fill-current' : ''}`} />
            </button>
          </div>
          
          <div className="text-center">
            <div className="text-5xl mb-4">{selectedCuisineData.flag}</div>
            <h1 className="text-2xl font-light text-gray-900 mb-2 font-body">{selectedCuisineData.name}</h1>
            <p className="text-sm text-gray-500 mb-4 font-body">{selectedCuisineData.region}</p>
            <p className="text-gray-700 leading-relaxed max-w-md mx-auto font-body">{selectedCuisineData.description}</p>
          </div>
        </div>

        <div className="px-6 py-8">
          {/* Heritage */}
          <div className="mb-12">
            <h3 className="text-lg font-light text-gray-900 mb-4 font-body">Heritage</h3>
            <p className="text-gray-600 leading-relaxed font-body">{selectedCuisineData.heritage}</p>
          </div>

          {/* Characteristics */}
          <div className="mb-12">
            <h3 className="text-lg font-light text-gray-900 mb-6 font-body">Characteristics</h3>
            <div className="grid grid-cols-2 gap-4">
              {selectedCuisineData.characteristics.map((char, index) => (
                <div key={index} className="text-center py-4 border border-gray-200 rounded-lg">
                  <div className="text-sm text-gray-700 font-body">{char}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Signature Dishes */}
          <div className="mb-12">
            <h3 className="text-lg font-light text-gray-900 mb-6 font-body">Signature Dishes</h3>
            <div className="space-y-6">
              {selectedCuisineData.popularDishes.map((dish, index) => (
                <div key={index} className="border-b border-gray-100 pb-6 last:border-b-0">
                  <div className="flex gap-4">
                    <ImageWithFallback
                      src={dish.image}
                      alt={dish.name}
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-light text-gray-900 font-body">{dish.name}</h4>
                        <div className="flex">
                          {renderStars(dish.rating)}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-3 font-body">{dish.description}</p>
                      <div className="flex items-center gap-6 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{dish.time}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span>{dish.servings} servings</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <ChefHat className="w-3 h-3" />
                          <span>{dish.difficulty}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Essential Ingredients */}
          <div>
            <h3 className="text-lg font-light text-gray-900 mb-6 font-body">Essential Ingredients</h3>
            <div className="flex flex-wrap gap-3">
              {selectedCuisineData.ingredients.map((ingredient, index) => (
                <span 
                  key={index}
                  className="px-4 py-2 text-sm text-gray-700 border border-gray-200 rounded-full font-body"
                >
                  {ingredient}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ios-scroll bg-white">
      {/* Clean Header */}
      <div className="px-6 pt-6 pb-8 border-b border-gray-100">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onClose}
            className="ios-button p-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>
        
        <div className="text-center mb-8">
          <h1 className="text-2xl font-light text-gray-900 mb-2 font-body">Cuisine Explorer</h1>
          <p className="text-gray-600 font-body">Discover culinary traditions from around the world</p>
        </div>

        {/* Minimal Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search cuisines..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg placeholder-gray-400 text-gray-900 font-body focus:border-gray-400 focus:outline-none"
          />
        </div>
      </div>

      <div className="px-6 py-8">
        {/* Cuisine List */}
        <div className="space-y-6">
          {cuisines
            .filter(cuisine => 
              cuisine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              cuisine.region.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map((cuisine) => (
            <button
              key={cuisine.name}
              onClick={() => setSelectedCuisine(cuisine.name)}
              className="ios-button w-full text-left border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-3xl">{cuisine.flag}</div>
                  <div>
                    <h3 className="font-light text-gray-900 mb-1 font-body">{cuisine.name}</h3>
                    <p className="text-sm text-gray-500 mb-2 font-body">{cuisine.region}</p>
                    <p className="text-xs text-gray-600 font-body">{cuisine.popularDishes.length} signature dishes</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </div>
            </button>
          ))}
        </div>

        {/* Featured Collection */}
        <div className="mt-12 pt-8 border-t border-gray-100">
          <h3 className="text-lg font-light text-gray-900 mb-6 font-body">Featured Collection</h3>
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="text-center">
              <div className="text-3xl mb-4">🌱</div>
              <h4 className="font-light text-gray-900 mb-2 font-body">Plant-Forward Cuisines</h4>
              <p className="text-sm text-gray-600 mb-4 font-body">
                Explore cuisines that celebrate vegetables and plant-based ingredients
              </p>
              <div className="text-xs text-gray-500 font-body">
                Curated selection of 12 cuisines
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}