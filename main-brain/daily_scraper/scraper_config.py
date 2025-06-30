# scraper_config.py - Multi-store food scraper configuration

# 4-Store Configuration: Lidl + Mercadona (Spain) | Lidl + Jumbo (Netherlands)
# Complete food data from major European supermarkets

SITES_TO_SCRAPE = {
    "spain": {
        "code": "es",
        "stores": {
            "lidl": {
                "category_urls": [
                    "https://www.lidl.es/es/frescura/c1737",  # Fresh products
                    "https://www.lidl.es/es/ofertas-semanales-alimentacion/c3327",  # Weekly food offers
                    "https://www.lidl.es/es/catalogo-productos-bio-organic/s2071",  # Organic products
                ],
                "product_card_selector": "a[href*='/p']",
                "product_name_selector": "",
                "product_price_selector": "[class*='price'], [data-price], span:contains('€')",
                "product_image_selector": "img",
                "food_keywords": [
                    # Spanish fruits
                    "manzana", "pera", "plátano", "naranja", "limón", "fresa", "uva", "melocotón", 
                    "kiwi", "piña", "sandía", "melón", "cereza", "albaricoque", "ciruela",
                    # Spanish vegetables
                    "tomate", "lechuga", "cebolla", "ajo", "patata", "zanahoria", "apio", 
                    "brócoli", "coliflor", "espinaca", "acelga", "pimiento", "pepino",
                    # Spanish meat & fish
                    "pollo", "ternera", "cerdo", "cordero", "jamón", "chorizo", "salchichón", 
                    "salmón", "bacalao", "merluza", "atún", "sardina", "gamba", "langostino",
                    # Spanish dairy & eggs
                    "leche", "yogur", "queso", "mantequilla", "huevo", "nata", "crema",
                    # Spanish pantry
                    "arroz", "pasta", "pan", "harina", "aceite", "vinagre", "sal", "azúcar",
                    "miel", "conserva", "legumbre", "lenteja", "garbanzo", "judía",
                    # Spanish beverages
                    "agua", "zumo", "vino", "cerveza", "café", "té", "refresco",
                    # Generic food terms
                    "fresco", "orgánico", "bio", "natural", "cocina", "comida", "alimento",
                    "kg", "gr", "litro", "pack", "bandeja", "eco", "premium"
                ],
                "exclude_patterns": [
                    "limpieza", "hogar", "jardín", "juguete", "ropa", "electrónico", 
                    "herramienta", "bricolaje", "cosmético", "perfume", "champú",
                    "métodos de pago", "ver más", "contacto", "ayuda", "servicio"
                ]
            },
            "mercadona": {
                "category_urls": [
                    "https://tienda.mercadona.es/categories/149",  # Main products page
                    "https://tienda.mercadona.es/categories/120",  # Fresh products (if available)
                    "https://tienda.mercadona.es/categories/130",  # Pantry products (if available)
                ],
                "product_card_selector": "[data-testid*='product'], .product, .item, a[href*='/product']",
                "product_name_selector": "[data-testid*='name'], .product-name, .name, h3, h4",
                "product_price_selector": "[data-testid*='price'], .price, .price-current, [class*='price']",
                "product_image_selector": "img",
                "food_keywords": [
                    # Mercadona specific brands
                    "hacendado", "deliplus", "bosque verde", "compy",
                    # Spanish food terms
                    "manzana", "pera", "plátano", "naranja", "limón", "fresa", "uva", "melocotón",
                    "tomate", "lechuga", "cebolla", "ajo", "patata", "zanahoria", "brócoli",
                    "pollo", "ternera", "cerdo", "jamón", "chorizo", "salmón", "atún",
                    "leche", "yogur", "queso", "huevo", "mantequilla",
                    "arroz", "pasta", "pan", "aceite", "azúcar", "miel",
                    "agua", "zumo", "vino", "cerveza", "café", "té",
                    "fresco", "bio", "natural", "kg", "gr", "litro", "pack"
                ],
                "exclude_patterns": [
                    "limpieza", "hogar", "jardín", "juguete", "ropa", "electrónico",
                    "cosmético", "perfume", "champú", "detergente", "papel higiénico",
                    "métodos de pago", "ver más", "contacto", "ayuda"
                ]
            }
        }
    },
    "netherlands": {
        "code": "nl",
        "stores": {
            "lidl": {
                "category_urls": [
                    "https://www.lidl.nl/c/assortiment-groente-en-fruit/a10008017",  # Fruits and vegetables
                    "https://www.lidl.nl/c/assortiment-supermarkt-in-groente-en-fruit/s10008020",  # Best in fruits & vegetables
                    "https://www.lidl.nl/c/gezonder-leven/s10051398",  # Healthy living (includes food)
                ],
                "product_card_selector": "a[href*='/p']",
                "product_name_selector": "",
                "product_price_selector": "[class*='price'], [data-price], span:contains('€')",
                "product_image_selector": "img",
                "food_keywords": [
                    # Dutch fruits
                    "appel", "peer", "banaan", "sinaasappel", "citroen", "aardbei", "druif", 
                    "perzik", "kiwi", "ananas", "watermeloen", "meloen", "kers", "abrikoos",
                    # Dutch vegetables
                    "tomaat", "sla", "ui", "knoflook", "aardappel", "wortel", "selderij", 
                    "broccoli", "bloemkool", "spinazie", "paprika", "komkommer",
                    # Dutch meat & fish
                    "kip", "rundvlees", "varkensvlees", "ham", "worst", "zalm", "kabeljauw",
                    "tonijn", "sardine", "garnaal",
                    # Dutch dairy
                    "melk", "yoghurt", "kaas", "boter", "ei", "room",
                    # Dutch pantry
                    "rijst", "pasta", "brood", "meel", "olie", "azijn", "zout", "suiker",
                    "honing", "conserven",
                    # Dutch beverages
                    "water", "sap", "wijn", "bier", "koffie", "thee",
                    # Generic terms
                    "vers", "biologisch", "bio", "natuurlijk", "keuken", "voedsel",
                    "kg", "gram", "liter", "pakket", "eco"
                ],
                "exclude_patterns": [
                    "schoonmaak", "huis", "tuin", "speelgoed", "kleding", "elektronisch",
                    "gereedschap", "cosmetica", "parfum", "shampoo", "contact", "help"
                ]
            },
            "jumbo": {
                "category_urls": [
                    "https://www.jumbo.com/producten/verse-producten",  # Fresh products
                    "https://www.jumbo.com/producten/groente-fruit",  # Fruits and vegetables  
                    "https://www.jumbo.com/producten/vlees-kip-vis-vegetarisch",  # Meat, chicken, fish
                    "https://www.jumbo.com/producten/zuivel-plantaardig-eieren",  # Dairy and eggs
                    "https://www.jumbo.com/producten/kaas-vleeswaren-tapas",  # Cheese and deli
                    "https://www.jumbo.com/producten/brood-gebak",  # Bread and bakery
                ],
                "product_card_selector": "[data-testid*='product'], .product-card, .product-tile, a[href*='/product']",
                "product_name_selector": "[data-testid*='title'], .product-title, .title, h3, h4",
                "product_price_selector": "[data-testid*='price'], .price, [class*='price'], .price-current",
                "product_image_selector": "img",
                "food_keywords": [
                    # Jumbo specific terms
                    "jumbo", "perfekt", "verse", "daily", "biologisch",
                    # Dutch food terms
                    "appel", "peer", "banaan", "sinaasappel", "aardbei", "druif", "perzik",
                    "tomaat", "sla", "ui", "aardappel", "wortel", "broccoli", "paprika",
                    "kip", "rundvlees", "varkensvlees", "ham", "zalm", "kabeljauw", "tonijn",
                    "melk", "yoghurt", "kaas", "boter", "ei", "room",
                    "rijst", "pasta", "brood", "olie", "suiker", "honing",
                    "water", "sap", "wijn", "bier", "koffie", "thee",
                    "vers", "bio", "natuurlijk", "kg", "gram", "liter", "pak"
                ],
                "exclude_patterns": [
                    "schoonmaak", "huishouden", "tuin", "speelgoed", "kleding", "elektronisch",
                    "gereedschap", "cosmetica", "parfum", "shampoo", "wasmiddel",
                    "contact", "help", "service", "klantenservice"
                ]
            }
        }
    }
}