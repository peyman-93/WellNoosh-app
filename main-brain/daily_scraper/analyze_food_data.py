# analyze_food_data.py - Multi-store food data analyzer
import pandas as pd
import os
import glob
from collections import Counter, defaultdict

def analyze_multi_store_food_data():
    """Comprehensive analysis of multi-store food data with comparisons"""
    
    data_dir = "data"
    image_dir = "product_images"
    
    print("🛒 === MULTI-STORE FOOD DATA ANALYSIS === 🛒")
    print("Analyzing: Lidl + Mercadona (Spain) | Lidl + Jumbo (Netherlands)")
    print("=" * 70)
    
    # Find all food CSV files
    csv_files = glob.glob(os.path.join(data_dir, "food_products_*.csv"))
    
    if not csv_files:
        print("❌ No food data files found!")
        print(f"Looking in: {data_dir}")
        return
    
    print(f"📋 Found {len(csv_files)} food data files:")
    for file in csv_files:
        print(f"   - {os.path.basename(file)}")
    
    # Load and combine all data
    all_data = []
    store_data = {}
    
    for csv_file in csv_files:
        try:
            df = pd.read_csv(csv_file)
            all_data.append(df)
            
            # Extract store info from filename
            filename = os.path.basename(csv_file)
            if 'lidl_es' in filename:
                store_key = 'Lidl Spain'
            elif 'mercadona_es' in filename:
                store_key = 'Mercadona Spain'
            elif 'lidl_nl' in filename:
                store_key = 'Lidl Netherlands'
            elif 'jumbo_nl' in filename:
                store_key = 'Jumbo Netherlands'
            else:
                store_key = filename.replace('.csv', '').replace('food_products_', '')
            
            store_data[store_key] = df
            print(f"✅ Loaded {len(df)} items from {store_key}")
        except Exception as e:
            print(f"❌ Error loading {csv_file}: {e}")
    
    if not all_data:
        print("❌ No valid data found!")
        return
    
    # Combine all dataframes
    combined_df = pd.concat(all_data, ignore_index=True)
    total_items = len(combined_df)
    
    print(f"\n📊 === OVERALL SUMMARY === 📊")
    print(f"🛒 Total food items across all stores: {total_items}")
    
    # Items with prices
    items_with_price = combined_df[combined_df['price'].notna()]
    print(f"💰 Items with prices: {len(items_with_price)} ({len(items_with_price)/total_items*100:.1f}%)")
    
    # Items with images
    items_with_images = combined_df[combined_df['image_filename'].notna()]
    print(f"📸 Items with images: {len(items_with_images)} ({len(items_with_images)/total_items*100:.1f}%)")
    
    # Count actual downloaded images
    actual_images = 0
    if not items_with_images.empty:
        for img in items_with_images['image_filename']:
            if img and os.path.exists(os.path.join(image_dir, img)):
                actual_images += 1
    print(f"🖼️  Successfully downloaded images: {actual_images}")
    
    # Store-by-store breakdown
    print(f"\n🏪 === STORE-BY-STORE BREAKDOWN === 🏪")
    store_stats = {}
    
    for store_name, df in store_data.items():
        items_count = len(df)
        with_price = len(df[df['price'].notna()])
        with_images = len(df[df['image_filename'].notna()])
        
        avg_price = df['price'].mean() if with_price > 0 else 0
        
        store_stats[store_name] = {
            'items': items_count,
            'with_price': with_price,
            'with_images': with_images,
            'avg_price': avg_price
        }
        
        print(f"\n🏬 {store_name}:")
        print(f"   📦 Products: {items_count}")
        print(f"   💰 With prices: {with_price} ({with_price/items_count*100:.1f}%)")
        print(f"   📸 With images: {with_images} ({with_images/items_count*100:.1f}%)")
        if avg_price > 0:
            print(f"   💶 Average price: {avg_price:.2f}€")
    
    # Country comparison
    print(f"\n🌍 === COUNTRY COMPARISON === 🌍")
    if 'country' in combined_df.columns:
        for country in combined_df['country'].unique():
            country_df = combined_df[combined_df['country'] == country]
            price_df = country_df[country_df['price'].notna()]
            
            print(f"\n🇪🇸🇳🇱 {country.upper()}:")
            print(f"   📦 Total products: {len(country_df)}")
            print(f"   💰 Products with prices: {len(price_df)}")
            if len(price_df) > 0:
                print(f"   💶 Average price: {price_df['price'].mean():.2f}€")
                print(f"   💶 Median price: {price_df['price'].median():.2f}€")
                print(f"   💶 Price range: {price_df['price'].min():.2f}€ - {price_df['price'].max():.2f}€")
    
    # Price analysis across all stores
    if not items_with_price.empty:
        print(f"\n💶 === PRICE ANALYSIS === 💶")
        prices = items_with_price['price']
        print(f"   Overall average price: {prices.mean():.2f}€")
        print(f"   Overall median price: {prices.median():.2f}€")
        print(f"   Overall price range: {prices.min():.2f}€ - {prices.max():.2f}€")
        
        # Price comparison between stores
        print(f"\n💰 Store Price Comparison:")
        for store_name, stats in store_stats.items():
            if stats['avg_price'] > 0:
                print(f"   {store_name}: {stats['avg_price']:.2f}€ average")
        
        # Most expensive items across all stores
        expensive_items = items_with_price.nlargest(10, 'price')[['product_name', 'price', 'store', 'country']]
        print(f"\n💸 Top 10 Most Expensive Items (All Stores):")
        for i, (_, item) in enumerate(expensive_items.iterrows(), 1):
            store_info = f"{item['store']} ({item['country']})" if 'store' in item and 'country' in item else "Unknown store"
            print(f"   {i:2d}. {item['product_name'][:35]}... | {item['price']:.2f}€ | {store_info}")
        
        # Cheapest items across all stores
        cheap_items = items_with_price.nsmallest(10, 'price')[['product_name', 'price', 'store', 'country']]
        print(f"\n💰 Top 10 Cheapest Items (All Stores):")
        for i, (_, item) in enumerate(cheap_items.iterrows(), 1):
            store_info = f"{item['store']} ({item['country']})" if 'store' in item and 'country' in item else "Unknown store"
            print(f"   {i:2d}. {item['product_name'][:35]}... | {item['price']:.2f}€ | {store_info}")
    
    # Food category analysis
    print(f"\n🥘 === FOOD CATEGORIES ANALYSIS === 🥘")
    
    # Enhanced categories with more keywords
    categories = {
        'Fruits': [
            'manzana', 'pera', 'plátano', 'naranja', 'limón', 'fresa', 'uva', 'melocotón', 
            'kiwi', 'piña', 'sandía', 'melón', 'cereza', 'appel', 'peer', 'banaan', 
            'sinaasappel', 'aardbei', 'druif', 'perzik', 'ananas', 'watermeloen', 'fruit'
        ],
        'Vegetables': [
            'tomate', 'lechuga', 'cebolla', 'ajo', 'patata', 'zanahoria', 'brócoli',
            'tomaat', 'sla', 'ui', 'knoflook', 'aardappel', 'wortel', 'broccoli',
            'espinaca', 'pimiento', 'pepino', 'verdura', 'groente'
        ],
        'Meat': [
            'pollo', 'ternera', 'cerdo', 'jamón', 'chorizo', 'salchichón',
            'kip', 'rundvlees', 'varkensvlees', 'ham', 'worst', 'carne', 'vlees'
        ],
        'Fish & Seafood': [
            'salmón', 'atún', 'bacalao', 'sardina', 'gamba', 'langostino',
            'zalm', 'tonijn', 'kabeljauw', 'garnaal', 'pescado', 'vis', 'marisco'
        ],
        'Dairy & Eggs': [
            'leche', 'yogur', 'queso', 'mantequilla', 'huevo', 'nata',
            'melk', 'yoghurt', 'kaas', 'boter', 'ei', 'room', 'lácteo'
        ],
        'Beverages': [
            'agua', 'zumo', 'vino', 'cerveza', 'café', 'té', 'refresco',
            'water', 'sap', 'wijn', 'bier', 'koffie', 'thee', 'bebida', 'drank'
        ],
        'Pantry & Grains': [
            'arroz', 'pasta', 'pan', 'aceite', 'azúcar', 'miel', 'harina',
            'rijst', 'brood', 'olie', 'suiker', 'despensa', 'conserva'
        ],
        'Organic/Bio': [
            'bio', 'orgánico', 'biologisch', 'organic', 'natural', 'eco'
        ]
    }
    
    category_analysis = {}
    for category, keywords in categories.items():
        total_count = 0
        store_breakdown = {}
        
        for store_name, df in store_data.items():
            store_count = 0
            for _, item in df.iterrows():
                product_name = str(item['product_name']).lower()
                if any(keyword.lower() in product_name for keyword in keywords):
                    store_count += 1
                    total_count += 1
            store_breakdown[store_name] = store_count
        
        category_analysis[category] = {
            'total': total_count,
            'stores': store_breakdown
        }
        
        print(f"\n🏷️  {category}: {total_count} items total")
        for store_name, count in store_breakdown.items():
            if count > 0:
                print(f"     - {store_name}: {count} items")
    
    # Sample products by category
    print(f"\n🔍 === SAMPLE PRODUCTS BY CATEGORY === 🔍")
    for category, keywords in list(categories.items())[:4]:  # Show first 4 categories
        if category_analysis[category]['total'] > 0:
            print(f"\n🥘 {category} Examples:")
            samples_shown = 0
            
            for store_name, df in store_data.items():
                store_samples = 0
                for _, item in df.iterrows():
                    if samples_shown >= 6:
                        break
                    product_name = str(item['product_name']).lower()
                    if any(keyword.lower() in product_name for keyword in keywords):
                        price_str = f" | {item['price']:.2f}€" if pd.notna(item['price']) else ""
                        img_str = " 📸" if pd.notna(item['image_filename']) else ""
                        print(f"   - {item['product_name'][:45]}... ({store_name}){price_str}{img_str}")
                        samples_shown += 1
                        store_samples += 1
                        if store_samples >= 2:
                            break
    
    # Store comparison summary
    print(f"\n📈 === STORE PERFORMANCE SUMMARY === 📈")
    print("Ranking by number of products found:")
    sorted_stores = sorted(store_stats.items(), key=lambda x: x[1]['items'], reverse=True)
    for i, (store, stats) in enumerate(sorted_stores, 1):
        success_rate = (stats['with_price'] / stats['items'] * 100) if stats['items'] > 0 else 0
        print(f"   {i}. {store}: {stats['items']} products ({success_rate:.1f}% with prices)")
    
    # Create combined summary CSV
    summary_file = os.path.join(data_dir, "multi_store_food_summary.csv")
    combined_df.to_csv(summary_file, index=False)
    print(f"\n💾 Combined multi-store data saved to: {summary_file}")
    
    # Create store comparison CSV
    if store_stats:
        comparison_data = []
        for store_name, stats in store_stats.items():
            comparison_data.append({
                'store': store_name,
                'total_products': stats['items'],
                'products_with_price': stats['with_price'],
                'products_with_images': stats['with_images'],
                'price_coverage_percent': (stats['with_price'] / stats['items'] * 100) if stats['items'] > 0 else 0,
                'image_coverage_percent': (stats['with_images'] / stats['items'] * 100) if stats['items'] > 0 else 0,
                'average_price_euros': stats['avg_price']
            })
        
        comparison_df = pd.DataFrame(comparison_data)
        comparison_file = os.path.join(data_dir, "store_comparison.csv")
        comparison_df.to_csv(comparison_file, index=False)
        print(f"📊 Store comparison data saved to: {comparison_file}")
    
    print(f"\n✅ Multi-store analysis complete!")
    print(f"📂 Check your files:")
    print(f"   📊 Individual store data: {data_dir}/food_products_[store]_[country].csv")
    print(f"   📋 Combined data: {summary_file}")
    print(f"   📈 Store comparison: {comparison_file}")
    print(f"   🖼️  Product images: {image_dir}/")
    
    print(f"\n🎯 === KEY INSIGHTS === 🎯")
    if store_stats:
        best_store = max(store_stats.keys(), key=lambda x: store_stats[x]['items'])
        most_expensive = max(store_stats.keys(), key=lambda x: store_stats[x]['avg_price']) if any(s['avg_price'] > 0 for s in store_stats.values()) else None
        
        print(f"🏆 Most products found: {best_store} ({store_stats[best_store]['items']} items)")
        if most_expensive and store_stats[most_expensive]['avg_price'] > 0:
            print(f"💰 Highest average prices: {most_expensive} ({store_stats[most_expensive]['avg_price']:.2f}€)")
        print(f"🌍 Countries covered: {len(combined_df['country'].unique()) if 'country' in combined_df.columns else 'Unknown'}")
        print(f"🏪 Stores analyzed: {len(store_stats)}")

if __name__ == "__main__":
    try:
        analyze_multi_store_food_data()
    except ImportError:
        print("❌ pandas not installed. Install with: pip install pandas")
        print("Or run: pip install -r requirements.txt")
    except Exception as e:
        print(f"❌ Error during analysis: {e}")
        import traceback
        traceback.print_exc()