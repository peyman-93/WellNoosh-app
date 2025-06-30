# run_scraper.py - Multi-store food scraper main script
import requests
from bs4 import BeautifulSoup
import csv
import os
import re
import time
from urllib.parse import urljoin, urlparse
from playwright.sync_api import sync_playwright
from scraper_config import SITES_TO_SCRAPE

# --- Configuration ---
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9,es;q=0.8,nl;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br',
    'DNT': '1',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
}
DATA_DIR = "data"
IMAGE_DIR = "product_images"
RATE_LIMIT_SECONDS = 3

# --- Helper Functions ---
def clean_price(price_text):
    """Extract price from text with improved regex for multiple formats"""
    if not price_text: 
        return None
    
    # Remove common currency symbols, spaces, and extra characters
    cleaned = re.sub(r'[€$£\s,]', '', price_text)
    
    # Look for various price patterns
    patterns = [
        r'(\d+)\.(\d{2})',    # 12.99
        r'(\d+),(\d{2})',     # 12,99
        r'(\d+)(\d{2})',      # 1299 (as 12.99)
        r'(\d+)',             # Just numbers like 15
    ]
    
    for i, pattern in enumerate(patterns):
        match = re.search(pattern, cleaned)
        if match:
            if len(match.groups()) == 2:
                if i == 2:  # Handle 1299 format
                    full_num = match.group(1) + match.group(2)
                    if len(full_num) >= 3:
                        return float(full_num[:-2] + '.' + full_num[-2:])
                return float(f"{match.group(1)}.{match.group(2)}")
            else:
                return float(match.group(1))
    
    return None

def is_food_item(name, store_config):
    """Enhanced food detection with store-specific logic"""
    if not name or len(name.strip()) < 3:
        return False
    
    name_lower = name.lower().strip()
    
    # Check against exclusion patterns first
    exclude_patterns = store_config.get("exclude_patterns", [])
    for pattern in exclude_patterns:
        if pattern.lower() in name_lower:
            return False
    
    # Universal non-food exclusions
    non_food_terms = [
        "limpieza", "cleaning", "schoonmaak", "hogar", "home", "huis",
        "jardín", "garden", "tuin", "juguete", "toy", "speelgoed", 
        "ropa", "clothing", "kleding", "electrónico", "electronic", "elektronisch",
        "herramienta", "tool", "gereedschap", "bricolaje", "diy",
        "cosmético", "cosmetic", "cosmetica", "perfume", "champú", "shampoo",
        "detergente", "detergent", "wasmiddel", "papel higiénico", "toilet paper",
        "pañal", "diaper", "luier", "métodos de pago", "payment", "betaling",
        "ver más", "see more", "meer bekijken", "contacto", "contact", "help", "ayuda"
    ]
    
    for term in non_food_terms:
        if term in name_lower:
            return False
    
    # Check for food keywords
    food_keywords = store_config.get("food_keywords", [])
    for keyword in food_keywords:
        if keyword.lower() in name_lower:
            return True
    
    # Additional food indicators (universal)
    food_indicators = [
        # Weight/volume indicators
        "kg", "gr", "g", "ml", "l", "litro", "liter", "gram",
        # Food-specific terms
        "fresco", "fresh", "vers", "bio", "organic", "biologisch", 
        "natural", "natuurlijk", "eco", "premium",
        "pack", "pak", "bandeja", "tray", "conserva", "canned", "conserven",
        # Nutritional terms
        "proteína", "protein", "eiwit", "vitamina", "vitamin",
        "calorie", "calorías", "kcal", "sodium", "sodio", "natrium"
    ]
    
    for indicator in food_indicators:
        if indicator in name_lower:
            return True
    
    # Price per weight/volume indicators (strong food signal)
    if re.search(r'(por|per|€/)\s*(kg|g|litro|l|gram|liter)', name_lower):
        return True
    
    return False

def clean_filename(filename):
    """Clean filename for safe saving"""
    filename = re.sub(r'[\\/*?:"<>|]', "", filename)
    filename = re.sub(r'\s+', '_', filename)
    filename = filename.strip('._')
    return filename[:50]

def download_image(image_url, filename, max_retries=3):
    """Download image with retries and error handling"""
    if not image_url:
        return None
        
    try:
        # Handle various URL formats
        if image_url.startswith('//'):
            image_url = 'https:' + image_url
        elif image_url.startswith('/'):
            return None
        
        # Skip data URLs
        if image_url.startswith('data:'):
            return None
        
        image_path = os.path.join(IMAGE_DIR, filename)
        
        # Skip if already exists
        if os.path.exists(image_path):
            return filename
        
        for attempt in range(max_retries):
            try:
                response = requests.get(image_url, headers=HEADERS, timeout=15)
                if response.status_code == 200 and len(response.content) > 1000:
                    with open(image_path, 'wb') as f:
                        f.write(response.content)
                    return filename
                elif response.status_code == 404:
                    break
            except Exception as e:
                if attempt == max_retries - 1:
                    print(f"      ⚠️  Failed to download image: {e}")
                time.sleep(1)
                
    except Exception as e:
        print(f"      ⚠️  Image download error: {e}")
    
    return None

def setup_directories():
    """Create necessary directories"""
    os.makedirs(DATA_DIR, exist_ok=True)
    os.makedirs(IMAGE_DIR, exist_ok=True)
    print(f"✅ Created directories: {DATA_DIR}, {IMAGE_DIR}")

def save_page_content(page_content, filename="debug_page.html"):
    """Save page content for debugging"""
    debug_dir = "debug"
    os.makedirs(debug_dir, exist_ok=True)
    with open(os.path.join(debug_dir, filename), 'w', encoding='utf-8') as f:
        f.write(page_content)

def handle_store_specific_navigation(page, store_name, country_code):
    """Handle store-specific navigation requirements"""
    
    if store_name == "mercadona":
        print("      🏪 Handling Mercadona-specific setup...")
        
        try:
            location_selectors = [
                "button[data-testid*='location']",
                "[class*='location'] button",
                "button:contains('Valencia')",
                "button:contains('Madrid')",
                ".postal-code input",
                "#postal-code"
            ]
            
            for selector in location_selectors:
                try:
                    if page.locator(selector).count() > 0:
                        page.click(selector, timeout=3000)
                        print(f"      📍 Selected location using: {selector}")
                        page.wait_for_timeout(2000)
                        break
                except:
                    continue
                    
        except Exception as e:
            print(f"      ⚠️  Mercadona location setup: {e}")
    
    elif store_name == "jumbo":
        print("      🏪 Handling Jumbo-specific setup...")
        
        try:
            jumbo_selectors = [
                "button[data-testid*='accept']",
                ".cookie-accept",
                "button:contains('Accepteren')"
            ]
            
            for selector in jumbo_selectors:
                try:
                    if page.locator(selector).count() > 0:
                        page.click(selector, timeout=3000)
                        print(f"      ✅ Handled Jumbo setup: {selector}")
                        page.wait_for_timeout(1000)
                        break
                except:
                    continue
                    
        except Exception as e:
            print(f"      ⚠️  Jumbo setup: {e}")

# --- Main Scraping Logic ---
def run_multi_store_food_scraper():
    print("🛒 === MULTI-STORE FOOD SCRAPER === 🛒")
    print("Stores: Lidl + Mercadona (Spain) | Lidl + Jumbo (Netherlands)")
    print("Collecting: Fruits, Vegetables, Meat, Fish, Dairy, Pantry, Beverages")
    print("=" * 80)
    setup_directories()

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=False,  # Keep visible to see progress
            args=['--no-sandbox', '--disable-blink-features=AutomationControlled']
        )
        
        context = browser.new_context(
            user_agent=HEADERS['User-Agent'],
            viewport={'width': 1920, 'height': 1080}
        )
        
        # Load stealth script
        stealth_script_path = os.path.join(os.path.dirname(__file__), "stealth.js")
        try:
            with open(stealth_script_path, "r") as f:
                stealth_script = f.read()
            context.add_init_script(stealth_script)
            print("🥷 Stealth mode activated")
        except FileNotFoundError:
            print("⚠️  Stealth script not found - continuing without it")

        page = context.new_page()

        # Track statistics
        total_food_items = 0
        total_images_downloaded = 0
        store_statistics = {}

        for country_name, country_data in SITES_TO_SCRAPE.items():
            country_code = country_data["code"]
            print(f"\n🌍 [Processing Country] >> {country_name.upper()}")
            
            for store_name, store_config in country_data["stores"].items():
                print(f"  🏪 [Scraping Store] > {store_name.upper()}")
                store_key = f"{store_name}_{country_code}"
                store_statistics[store_key] = {"products": 0, "images": 0}
                all_food_products = {}

                for i, category_url in enumerate(store_config["category_urls"]):
                    try:
                        print(f"    🥬 Scraping category {i+1}/{len(store_config['category_urls'])}")
                        print(f"    📋 URL: {category_url}")
                        
                        # Navigate to page
                        try:
                            response = page.goto(category_url, wait_until="networkidle", timeout=30000)
                            if response.status != 200:
                                print(f"    ❌ HTTP {response.status} - Skipping")
                                continue
                        except Exception as e:
                            print(f"    ❌ Failed to load: {str(e)}")
                            continue

                        # Handle store-specific navigation
                        handle_store_specific_navigation(page, store_name, country_code)

                        # Handle cookies
                        cookie_selectors = [
                            "#onetrust-accept-btn-handler",
                            "[id*='cookie'] button",
                            "[class*='cookie'] button",
                            "button:contains('Accept')",
                            "button:contains('Accepteren')",
                            "button:contains('Aceptar')",
                            "[data-testid*='accept']"
                        ]
                        
                        cookie_handled = False
                        for selector in cookie_selectors:
                            try:
                                if page.locator(selector).count() > 0:
                                    page.click(selector, timeout=3000)
                                    print("      🍪 Accepted cookies")
                                    page.wait_for_timeout(2000)
                                    cookie_handled = True
                                    break
                            except:
                                continue
                        
                        if not cookie_handled:
                            print("      ℹ️  No cookie banner found")

                        # Scroll to load all products
                        print("      📜 Scrolling to load products...")
                        for scroll in range(5):
                            page.evaluate("window.scrollBy(0, window.innerHeight)")
                            time.sleep(1)
                        
                        page.wait_for_timeout(3000)

                        # Get page content
                        html_content = page.content()
                        soup = BeautifulSoup(html_content, 'html.parser')
                        
                        # Save for debugging
                        save_page_content(html_content, f"food_{store_name}_{country_code}_{i+1}.html")

                        # Find products with multiple selector strategies
                        print("      🔍 Searching for food products...")
                        product_candidates = soup.select(store_config["product_card_selector"])
                        print(f"      📦 Found {len(product_candidates)} potential products")

                        if not product_candidates:
                            # Try fallback selectors
                            fallback_selectors = [
                                "a[href*='/product']", "a[href*='/p/']", "a[href*='/p']",
                                "[data-testid*='product']", ".product", ".item",
                                ".product-card", ".product-tile", ".product-item"
                            ]
                            
                            for selector in fallback_selectors:
                                product_candidates = soup.select(selector)
                                if product_candidates:
                                    print(f"      ✅ Using fallback: {selector}")
                                    break

                        # Process products with enhanced filtering
                        food_count = 0
                        for idx, card in enumerate(product_candidates):
                            try:
                                # Extract product name with multiple strategies
                                name = None
                                if store_config["product_name_selector"]:
                                    name_el = card.select_one(store_config["product_name_selector"])
                                    name = name_el.get_text(strip=True) if name_el else None
                                
                                if not name:
                                    # Fallback name extraction
                                    name_selectors = ["h3", "h4", "h5", ".title", ".name", "[title]"]
                                    for name_sel in name_selectors:
                                        name_el = card.select_one(name_sel)
                                        if name_el:
                                            name = name_el.get_text(strip=True)
                                            break
                                    
                                    if not name:
                                        name = card.get_text(strip=True)
                                
                                # Filter for food items only
                                if not is_food_item(name, store_config):
                                    continue
                                
                                # Extract price with multiple strategies
                                price = None
                                price_text = ""
                                if store_config["product_price_selector"]:
                                    price_el = card.select_one(store_config["product_price_selector"])
                                    if price_el:
                                        price_text = price_el.get_text(strip=True)
                                        price = clean_price(price_text)
                                
                                if not price:
                                    # Fallback price extraction
                                    price_selectors = [".price", "[class*='price']", "[data-price]"]
                                    for price_sel in price_selectors:
                                        price_el = card.select_one(price_sel)
                                        if price_el:
                                            price_text = price_el.get_text(strip=True)
                                            price = clean_price(price_text)
                                            if price:
                                                break
                                
                                # Extract image
                                image_el = card.select_one(store_config["product_image_selector"])
                                image_url = None
                                image_filename = None
                                
                                if image_el:
                                    image_url = (image_el.get('data-src') or 
                                                image_el.get('src') or 
                                                image_el.get('data-lazy-src'))
                                    
                                    if image_url:
                                        safe_name = clean_filename(name)
                                        image_filename = f"{store_name}_{country_code}_{safe_name}.jpg"
                                        
                                        downloaded_filename = download_image(image_url, image_filename)
                                        if downloaded_filename:
                                            image_filename = downloaded_filename
                                            total_images_downloaded += 1
                                            store_statistics[store_key]["images"] += 1
                                        else:
                                            image_filename = None
                                
                                # Get product URL
                                product_url = card.get('href') if card.name == 'a' else None
                                if product_url and not product_url.startswith('http'):
                                    base_url = '/'.join(category_url.split('/')[:3])
                                    product_url = base_url + product_url
                                
                                # Store food product
                                if name and len(name.strip()) > 3 and name not in all_food_products:
                                    product_data = {
                                        "product_name": name.strip(),
                                        "price": price,
                                        "price_text": price_text,
                                        "image_filename": image_filename,
                                        "image_url": image_url,
                                        "product_url": product_url,
                                        "category": "food",
                                        "country": country_name,
                                        "store": store_name,
                                        "store_country": f"{store_name}_{country_code}"
                                    }
                                    
                                    all_food_products[name] = product_data
                                    food_count += 1
                                    total_food_items += 1
                                    store_statistics[store_key]["products"] += 1
                                    
                                    # Show sample products
                                    if food_count <= 3:
                                        img_status = "📸" if image_filename else "❌"
                                        price_display = f"{price}€" if price else "No price"
                                        print(f"      🍎 {name[:35]}... | {price_display} {img_status}")

                            except Exception as e:
                                continue

                        print(f"      ✅ Found {food_count} food items from this page")
                        time.sleep(RATE_LIMIT_SECONDS)

                    except Exception as e:
                        print(f"    ❌ Error scraping category: {e}")
                        continue

                # Save store-specific CSV
                if all_food_products:
                    csv_filename = f"food_products_{store_name}_{country_code}.csv"
                    csv_path = os.path.join(DATA_DIR, csv_filename)
                    
                    fieldnames = [
                        "product_name", "price", "price_text", "image_filename", 
                        "image_url", "product_url", "category", "country", "store", "store_country"
                    ]
                    
                    with open(csv_path, 'w', newline='', encoding='utf-8') as f:
                        writer = csv.DictWriter(f, fieldnames=fieldnames)
                        writer.writeheader()
                        writer.writerows(all_food_products.values())
                    
                    print(f"  💾 Saved {len(all_food_products)} food items to: {csv_filename}")
                    
                    # Show sample products
                    sample_products = list(all_food_products.keys())[:3]
                    for product in sample_products:
                        print(f"     - {product}")
                    
                else:
                    print(f"  ⚠️  No food products found for {store_name} in {country_name}")
        
        browser.close()
    
    # Final comprehensive summary
    print(f"\n🎉 === MULTI-STORE SCRAPING COMPLETED === 🎉")
    print(f"📊 Total food items collected: {total_food_items}")
    print(f"📸 Total images downloaded: {total_images_downloaded}")
    
    print(f"\n🏪 === STORE BREAKDOWN === 🏪")
    for store_key, stats in store_statistics.items():
        store_name, country = store_key.split('_')
        print(f"   {store_name.upper()} ({country.upper()}): {stats['products']} products, {stats['images']} images")
    
    print(f"\n📂 Files created:")
    print(f"   📊 Data: {DATA_DIR}/")
    print(f"   🖼️  Images: {IMAGE_DIR}/")
    print("\n✅ Multi-store food data collection complete! 🛒🍎🥕🍖🐟")

if __name__ == "__main__":
    run_multi_store_food_scraper()