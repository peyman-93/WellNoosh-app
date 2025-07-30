# WellNoosh Complete Database Schema Documentation

## 📋 Table of Contents
1. [User Management Tables](#user-management-tables)
2. [Nutrition Tracking Tables](#nutrition-tracking-tables)
3. [Recipe Intelligence Tables](#recipe-intelligence-tables)
4. [Social Circle Tables](#social-circle-tables)
5. [Meal Planning Tables](#meal-planning-tables)
6. [Shopping & Inventory Tables](#shopping--inventory-tables)
7. [Analytics & Metrics Tables](#analytics--metrics-tables)
8. [Data Relationships](#data-relationships)

---

## User Management Tables

### `users` (Core Identity)
**Purpose**: Extends Supabase auth.users with app-specific data
**Primary Key**: `id` (UUID)

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `id` | UUID | User ID (references auth.users) | `123e4567-e89b-12d3-...` |
| `email` | VARCHAR(255) | User email address | `john@example.com` |
| `full_name` | VARCHAR(255) | User's full name | `John Smith` |
| `username` | VARCHAR(50) | Unique username | `johnsmith23` |
| `avatar_url` | TEXT | Profile picture URL | `https://...` |
| `phone_number` | VARCHAR(20) | Phone number | `+1234567890` |
| `date_of_birth` | DATE | Birth date for age calculation | `1990-05-15` |
| `gender` | VARCHAR(20) | Gender identity | `male`, `female`, `non-binary` |
| `timezone` | VARCHAR(50) | User timezone | `America/New_York` |
| `locale` | VARCHAR(10) | Language preference | `en`, `fr`, `es` |
| `is_premium` | BOOLEAN | Premium subscription status | `true`/`false` |
| `premium_expires_at` | TIMESTAMP | Premium expiration | `2024-12-31 23:59:59` |
| `onboarding_completed` | BOOLEAN | Onboarding completion | `true`/`false` |
| `email_verified` | BOOLEAN | Email verification status | `true`/`false` |
| `phone_verified` | BOOLEAN | Phone verification status | `true`/`false` |
| `created_at` | TIMESTAMP | Account creation | `2024-01-15 10:30:00` |
| `updated_at` | TIMESTAMP | Last profile update | `2024-07-30 14:22:00` |
| `last_active_at` | TIMESTAMP | Last app activity | `2024-07-30 16:45:00` |
| `deleted_at` | TIMESTAMP | Soft deletion timestamp | `null` or timestamp |

### `user_profiles` (Demographics & Lifestyle)
**Purpose**: Personal information for app personalization
**Primary Key**: `user_id` (UUID, FK to users.id)

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `user_id` | UUID | User reference | `123e4567-...` |
| `country` | VARCHAR(100) | Country of residence | `United States` |
| `city` | VARCHAR(100) | City of residence | `New York` |
| `postal_code` | VARCHAR(20) | Postal/ZIP code | `10001` |
| `address_line1` | TEXT | Street address | `123 Main St` |
| `address_line2` | TEXT | Apartment/unit | `Apt 4B` |
| `bio` | TEXT | Personal bio | `Food lover, home cook...` |
| `occupation` | VARCHAR(100) | Job/profession | `Software Engineer` |
| `income_range` | VARCHAR(50) | Income bracket | `50k-75k`, `75k-100k` |
| `household_size` | INTEGER | Number of people in household | `3` |
| `cooking_experience_level` | VARCHAR(50) | Cooking skill level | `beginner`, `intermediate`, `advanced`, `expert` |
| `cooking_frequency` | VARCHAR(50) | How often cooks | `daily`, `few_times_week`, `weekly`, `rarely` |
| `shopping_frequency` | VARCHAR(50) | Shopping pattern | `weekly`, `bi-weekly`, `monthly` |
| `preferred_stores` | JSONB | Favorite stores | `["Whole Foods", "Trader Joe's"]` |
| `notification_preferences` | JSONB | Notification settings | See notification structure below |
| `privacy_settings` | JSONB | Privacy controls | See privacy structure below |
| `app_settings` | JSONB | App preferences | See app settings structure below |
| `created_at` | TIMESTAMP | Profile creation | `2024-01-15 10:30:00` |
| `updated_at` | TIMESTAMP | Last update | `2024-07-30 14:22:00` |

**Notification Preferences Structure**:
```json
{
  "push": true,
  "email": true,
  "sms": false,
  "meal_reminders": true,
  "shopping_reminders": true,
  "expiry_alerts": true,
  "community_updates": true,
  "promotional": false,
  "circle_invites": true,
  "recipe_suggestions": true
}
```

**Privacy Settings Structure**:
```json
{
  "profile_visibility": "private",
  "share_recipes": false,
  "share_achievements": false,
  "allow_circle_invites": true,
  "show_cooking_stats": false,
  "allow_recipe_recommendations": true
}
```

**App Settings Structure**:
```json
{
  "theme": "light",
  "language": "en",
  "measurement_system": "metric",
  "currency": "EUR",
  "date_format": "DD/MM/YYYY",
  "temperature_unit": "celsius"
}
```

### `user_health_profiles` (Physical Health Data)
**Purpose**: Health metrics for personalized nutrition goals
**Primary Key**: `user_id` (UUID, FK to users.id)

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `user_id` | UUID | User reference | `123e4567-...` |
| `height_cm` | DECIMAL(5,2) | Height in centimeters | `175.50` |
| `weight_kg` | DECIMAL(5,2) | Current weight in kg | `70.25` |
| `target_weight_kg` | DECIMAL(5,2) | Goal weight | `65.00` |
| `activity_level` | VARCHAR(50) | Physical activity level | `sedentary`, `light`, `moderate`, `active`, `very_active` |
| `health_goals` | JSONB | Health objectives | `["weight_loss", "muscle_gain", "heart_health"]` |
| `medical_conditions` | JSONB | Health conditions | `["diabetes", "hypertension"]` |
| `medications` | JSONB | Current medications | `["metformin", "lisinopril"]` |
| `blood_type` | VARCHAR(10) | Blood type | `A+`, `O-`, etc. |
| `bmi` | DECIMAL(4,2) | Body Mass Index (calculated) | `22.86` |
| `bmr` | INTEGER | Basal Metabolic Rate (calculated) | `1650` |
| `daily_calorie_goal` | INTEGER | Target daily calories | `2000` |
| `notes` | TEXT | Additional health notes | `Lactose intolerant, pre-diabetic` |
| `created_at` | TIMESTAMP | Profile creation | `2024-01-15 10:30:00` |
| `updated_at` | TIMESTAMP | Last update | `2024-07-30 14:22:00` |

### `user_dietary_preferences` (Food Preferences & Restrictions)
**Purpose**: Dietary restrictions and food preferences for meal planning
**Primary Key**: `user_id` (UUID, FK to users.id)

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `user_id` | UUID | User reference | `123e4567-...` |
| `diet_type` | VARCHAR(50) | Primary diet type | `omnivore`, `vegetarian`, `vegan`, `pescatarian`, `keto`, `paleo` |
| `allergies` | JSONB | Food allergies with severity | See allergies structure below |
| `intolerances` | JSONB | Food intolerances | `["lactose", "gluten"]` |
| `dislikes` | JSONB | Disliked foods with reasons | See dislikes structure below |
| `preferred_cuisines` | JSONB | Favorite cuisine types | `["Italian", "Mexican", "Japanese"]` |
| `spice_tolerance` | VARCHAR(20) | Spice preference | `mild`, `medium`, `hot`, `very_hot` |
| `meal_preferences` | JSONB | Meal timing and preferences | See meal preferences structure below |
| `religious_restrictions` | JSONB | Religious dietary laws | `["halal", "kosher"]` |
| `ethical_preferences` | JSONB | Ethical food choices | `["organic", "local", "sustainable", "fair_trade"]` |
| `created_at` | TIMESTAMP | Profile creation | `2024-01-15 10:30:00` |
| `updated_at` | TIMESTAMP | Last update | `2024-07-30 14:22:00` |

**Allergies Structure**:
```json
[
  {
    "allergen": "peanuts",
    "severity": "severe",
    "reaction": "anaphylaxis",
    "epi_pen_required": true
  },
  {
    "allergen": "shellfish",
    "severity": "moderate",
    "reaction": "hives",
    "epi_pen_required": false
  }
]
```

**Dislikes Structure**:
```json
[
  {
    "food": "cilantro",
    "reason": "taste",
    "severity": "strong"
  },
  {
    "food": "blue_cheese",
    "reason": "texture",
    "severity": "moderate"
  }
]
```

**Meal Preferences Structure**:
```json
{
  "breakfast": {
    "preferred_time": "07:00",
    "skip_frequency": "never",
    "preferred_types": ["quick", "healthy"]
  },
  "lunch": {
    "preferred_time": "12:30",
    "skip_frequency": "rarely",
    "preferred_types": ["light", "portable"]
  },
  "dinner": {
    "preferred_time": "19:00",
    "skip_frequency": "never",
    "preferred_types": ["hearty", "social"]
  },
  "snacks": {
    "frequency": "sometimes",
    "preferred_types": ["healthy", "protein"]
  }
}
```

### `user_nutrition_goals` (Personalized Nutrition Targets)
**Purpose**: Individual nutrition targets based on health profile
**Primary Key**: `user_id` (UUID, FK to users.id)

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `user_id` | UUID | User reference | `123e4567-...` |
| `daily_calories` | INTEGER | Target daily calories | `2000` |
| `protein_g` | DECIMAL(6,2) | Daily protein goal (grams) | `150.00` |
| `carbs_g` | DECIMAL(6,2) | Daily carbohydrate goal | `250.00` |
| `fat_g` | DECIMAL(6,2) | Daily fat goal | `67.00` |
| `fiber_g` | DECIMAL(5,2) | Daily fiber goal | `25.00` |
| `sugar_g` | DECIMAL(5,2) | Daily sugar limit | `50.00` |
| `sodium_mg` | DECIMAL(7,2) | Daily sodium limit | `2300.00` |
| `water_ml` | INTEGER | Daily water goal | `2500` |
| `micronutrient_goals` | JSONB | Vitamin/mineral targets | See micronutrient structure below |
| `goal_type` | VARCHAR(50) | Goal objective | `maintenance`, `weight_loss`, `weight_gain`, `muscle_building` |
| `created_at` | TIMESTAMP | Goals creation | `2024-01-15 10:30:00` |
| `updated_at` | TIMESTAMP | Last update | `2024-07-30 14:22:00` |

**Micronutrient Goals Structure**:
```json
{
  "vitamins": {
    "vitamin_c_mg": 90,
    "vitamin_d_iu": 600,
    "vitamin_b12_mcg": 2.4,
    "folate_mcg": 400
  },
  "minerals": {
    "iron_mg": 18,
    "calcium_mg": 1000,
    "potassium_mg": 3500,
    "magnesium_mg": 400
  }
}
```

---

## Nutrition Tracking Tables

### `nutrition_logs` (Daily Food Intake)
**Purpose**: Detailed tracking of all food consumed
**Primary Key**: `id` (UUID)

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `id` | UUID | Unique log entry ID | `123e4567-...` |
| `user_id` | UUID | User reference | `123e4567-...` |
| `date` | DATE | Consumption date | `2024-07-30` |
| `meal_type` | VARCHAR(50) | Meal category | `breakfast`, `lunch`, `dinner`, `snack` |
| `meal_time` | TIME | Time consumed | `12:30:00` |
| `recipe_id` | UUID | Recipe reference (if applicable) | `123e4567-...` |
| `food_name` | VARCHAR(255) | Food item name | `Grilled Chicken Breast` |
| `brand` | VARCHAR(100) | Food brand (if applicable) | `Organic Valley` |
| `quantity` | DECIMAL(8,3) | Amount consumed | `150.000` |
| `unit` | VARCHAR(50) | Measurement unit | `grams`, `cups`, `pieces` |
| `servings` | DECIMAL(5,2) | Number of servings | `1.50` |
| `calories` | DECIMAL(8,2) | Total calories | `231.00` |
| `protein_g` | DECIMAL(8,2) | Protein grams | `43.50` |
| `carbs_g` | DECIMAL(8,2) | Carbohydrate grams | `0.00` |
| `fat_g` | DECIMAL(8,2) | Fat grams | `5.00` |
| `fiber_g` | DECIMAL(8,2) | Fiber grams | `0.00` |
| `sugar_g` | DECIMAL(8,2) | Sugar grams | `0.00` |
| `sodium_mg` | DECIMAL(8,2) | Sodium milligrams | `74.00` |
| `micronutrients` | JSONB | Vitamins and minerals | See micronutrient structure |
| `source` | VARCHAR(50) | Data entry method | `recipe`, `manual`, `barcode`, `photo` |
| `confidence_score` | DECIMAL(3,2) | Data accuracy confidence | `0.95` |
| `photo_url` | TEXT | Photo of consumed food | `https://...` |
| `notes` | TEXT | User notes | `Added extra seasoning` |
| `satisfaction_rating` | INTEGER | Satisfaction (1-5) | `4` |
| `created_at` | TIMESTAMP | Log entry time | `2024-07-30 12:35:00` |

### `daily_nutrition_summaries` (Daily Aggregated Data)
**Purpose**: Daily nutrition totals for quick analysis
**Primary Key**: `user_id, date`

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `user_id` | UUID | User reference | `123e4567-...` |
| `date` | DATE | Summary date | `2024-07-30` |
| `total_calories` | DECIMAL(8,2) | Daily calorie total | `1850.00` |
| `calories_goal` | INTEGER | Daily calorie goal | `2000` |
| `calories_remaining` | INTEGER | Calories left to goal | `150` |
| `protein_g` | DECIMAL(8,2) | Total protein consumed | `120.50` |
| `protein_goal_g` | DECIMAL(6,2) | Daily protein goal | `150.00` |
| `carbs_g` | DECIMAL(8,2) | Total carbs consumed | `185.00` |
| `carbs_goal_g` | DECIMAL(6,2) | Daily carbs goal | `250.00` |
| `fat_g` | DECIMAL(8,2) | Total fat consumed | `61.25` |
| `fat_goal_g` | DECIMAL(6,2) | Daily fat goal | `67.00` |
| `fiber_g` | DECIMAL(8,2) | Total fiber consumed | `28.50` |
| `fiber_goal_g` | DECIMAL(5,2) | Daily fiber goal | `25.00` |
| `sugar_g` | DECIMAL(8,2) | Total sugar consumed | `45.00` |
| `sugar_limit_g` | DECIMAL(5,2) | Daily sugar limit | `50.00` |
| `sodium_mg` | DECIMAL(8,2) | Total sodium consumed | `2100.00` |
| `sodium_limit_mg` | DECIMAL(7,2) | Daily sodium limit | `2300.00` |
| `water_ml` | INTEGER | Total water consumed | `2200` |
| `water_goal_ml` | INTEGER | Daily water goal | `2500` |
| `micronutrients` | JSONB | Vitamin/mineral totals | See micronutrient structure |
| `meal_count` | INTEGER | Number of meals logged | `4` |
| `goal_achievement_score` | DECIMAL(4,2) | Overall goal achievement % | `87.50` |
| `macros_balance_score` | DECIMAL(4,2) | Macro balance quality | `92.00` |
| `food_variety_score` | INTEGER | Dietary diversity score | `8` |
| `created_at` | TIMESTAMP | Summary creation | `2024-07-30 23:59:00` |

### `weekly_nutrition_summaries` (Weekly Trend Analysis)
**Purpose**: Weekly nutrition patterns and trends
**Primary Key**: `user_id, week_start_date`

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `user_id` | UUID | User reference | `123e4567-...` |
| `week_start_date` | DATE | Week starting Monday | `2024-07-29` |
| `week_end_date` | DATE | Week ending Sunday | `2024-08-04` |
| `avg_daily_calories` | DECIMAL(8,2) | Average daily calories | `1925.00` |
| `calories_consistency_score` | DECIMAL(4,2) | Calorie consistency % | `85.00` |
| `avg_protein_g` | DECIMAL(8,2) | Average daily protein | `125.50` |
| `avg_carbs_g` | DECIMAL(8,2) | Average daily carbs | `195.00` |
| `avg_fat_g` | DECIMAL(8,2) | Average daily fat | `65.25` |
| `goal_achievement_days` | INTEGER | Days goals were met | `5` |
| `workout_days` | INTEGER | Days with exercise logged | `3` |
| `meal_prep_sessions` | INTEGER | Meal prep sessions | `2` |
| `restaurant_meals` | INTEGER | Meals eaten out | `4` |
| `home_cooked_meals` | INTEGER | Home-cooked meals | `17` |
| `food_variety_score` | INTEGER | Weekly dietary diversity | `15` |
| `top_food_categories` | JSONB | Most consumed food types | `["protein", "vegetables", "grains"]` |
| `nutrition_insights` | JSONB | Weekly insights and trends | See insights structure |
| `created_at` | TIMESTAMP | Summary creation | `2024-08-05 00:00:00` |

### `monthly_nutrition_summaries` (Long-term Health Tracking)
**Purpose**: Monthly health trends and long-term analysis
**Primary Key**: `user_id, month, year`

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `user_id` | UUID | User reference | `123e4567-...` |
| `month` | INTEGER | Month (1-12) | `7` |
| `year` | INTEGER | Year | `2024` |
| `avg_daily_calories` | DECIMAL(8,2) | Monthly average calories | `1950.00` |
| `weight_change_kg` | DECIMAL(5,2) | Weight change this month | `-1.20` |
| `goal_achievement_rate` | DECIMAL(4,2) | Monthly goal achievement % | `78.50` |
| `consistency_score` | DECIMAL(4,2) | Eating pattern consistency | `82.00` |
| `meal_prep_frequency` | DECIMAL(4,2) | Meal prep sessions per week | `1.8` |
| `restaurant_frequency` | DECIMAL(4,2) | Eating out frequency | `3.2` |
| `cooking_frequency` | DECIMAL(4,2) | Home cooking frequency | `5.5` |
| `seasonal_adjustments` | JSONB | Seasonal eating changes | See seasonal structure |
| `health_improvements` | JSONB | Positive health changes | See improvements structure |
| `recommendations` | JSONB | AI-generated recommendations | See recommendations structure |
| `created_at` | TIMESTAMP | Summary creation | `2024-08-01 00:00:00` |

---

## Recipe Intelligence Tables

### `recipes` (Complete Recipe Database)
**Purpose**: Comprehensive recipe storage with full nutrition analysis
**Primary Key**: `id` (UUID)

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `id` | UUID | Unique recipe ID | `123e4567-...` |
| `name` | VARCHAR(255) | Recipe name | `Mediterranean Grilled Chicken` |
| `description` | TEXT | Recipe description | `A healthy, flavorful chicken dish...` |
| `image_url` | TEXT | Recipe photo URL | `https://...` |
| `video_url` | TEXT | Cooking video URL | `https://youtube.com/...` |
| `source` | VARCHAR(100) | Recipe origin | `user_created`, `ai_generated`, `external_api`, `community` |
| `external_id` | VARCHAR(255) | External API ID | `spoonacular_123456` |
| `external_source` | VARCHAR(100) | External API name | `spoonacular`, `edamam` |
| `cuisine_type` | VARCHAR(100) | Cuisine category | `Mediterranean`, `Italian`, `Asian` |
| `meal_type` | VARCHAR(50) | Meal category | `breakfast`, `lunch`, `dinner`, `snack`, `dessert` |
| `diet_tags` | JSONB | Diet compatibility | `["vegetarian", "gluten_free", "keto_friendly"]` |
| `difficulty_level` | VARCHAR(20) | Cooking difficulty | `easy`, `medium`, `hard`, `expert` |
| `prep_time_minutes` | INTEGER | Preparation time | `15` |
| `cook_time_minutes` | INTEGER | Cooking time | `25` |
| `total_time_minutes` | INTEGER | Total time (calculated) | `40` |
| `servings` | INTEGER | Number of servings | `4` |
| `serving_size` | VARCHAR(100) | Size description | `1 chicken breast with sides` |
| `ingredients` | JSONB | Ingredient list with details | See ingredients structure |
| `instructions` | JSONB | Step-by-step cooking instructions | See instructions structure |
| `equipment_needed` | JSONB | Required cooking equipment | `["grill", "mixing_bowl", "tongs"]` |
| `tips` | JSONB | Cooking tips and tricks | `["Marinate for 2+ hours", "Don't overcook"]` |
| `variations` | JSONB | Recipe variations | See variations structure |
| `nutrition_per_serving` | JSONB | Complete nutrition info | See nutrition structure |
| `cost_estimate` | DECIMAL(10,2) | Estimated total cost | `12.50` |
| `cost_per_serving` | DECIMAL(10,2) | Cost per serving (calculated) | `3.13` |
| `sustainability_score` | INTEGER | Environmental impact (0-100) | `75` |
| `season_scores` | JSONB | Seasonal ingredient availability | See season structure |
| `allergen_info` | JSONB | Allergen warnings | `["contains_dairy", "may_contain_nuts"]` |
| `created_by` | UUID | Recipe creator (if user-created) | `123e4567-...` |
| `is_public` | BOOLEAN | Public visibility | `true`/`false` |
| `status` | VARCHAR(50) | Recipe status | `draft`, `active`, `archived`, `deleted` |
| `view_count` | INTEGER | Total views | `1247` |
| `cook_count` | INTEGER | Times cooked by all users | `89` |
| `favorite_count` | INTEGER | Number of favorites | `156` |
| `average_rating` | DECIMAL(3,2) | Average user rating | `4.35` |
| `rating_count` | INTEGER | Number of ratings | `42` |
| `created_at` | TIMESTAMP | Recipe creation | `2024-01-15 10:30:00` |
| `updated_at` | TIMESTAMP | Last update | `2024-07-30 14:22:00` |

**Ingredients Structure**:
```json
[
  {
    "name": "chicken breast",
    "amount": 500,
    "unit": "grams",
    "category": "protein",
    "notes": "boneless, skinless",
    "optional": false,
    "substitutions": ["turkey breast", "tofu"],
    "cost_estimate": 8.50,
    "nutrition": {
      "calories_per_100g": 165,
      "protein_g": 31,
      "carbs_g": 0,
      "fat_g": 3.6
    }
  }
]
```

**Instructions Structure**:
```json
[
  {
    "step": 1,
    "instruction": "Preheat grill to medium-high heat",
    "duration_minutes": 5,
    "temperature": {"value": 200, "unit": "celsius"},
    "tips": ["Clean grill grates first"],
    "image_url": "https://...",
    "equipment": ["grill"]
  }
]
```

### `user_recipe_interactions` (Detailed Recipe Behavior Tracking)
**Purpose**: Complete tracking of user-recipe interactions
**Primary Key**: `user_id, recipe_id`

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `user_id` | UUID | User reference | `123e4567-...` |
| `recipe_id` | UUID | Recipe reference | `123e4567-...` |
| `is_favorite` | BOOLEAN | Favorited status | `true`/`false` |
| `rating` | INTEGER | User rating (1-5) | `4` |
| `rating_date` | TIMESTAMP | When rated | `2024-07-30 18:30:00` |
| `review` | TEXT | Written review | `Delicious! Kids loved it too.` |
| `times_cooked` | INTEGER | Number of times cooked | `3` |
| `last_cooked_at` | TIMESTAMP | Most recent cooking | `2024-07-28 19:00:00` |
| `first_cooked_at` | TIMESTAMP | First time cooked | `2024-06-15 18:30:00` |
| `cooking_success_rate` | DECIMAL(4,2) | Success percentage | `100.00` |
| `modifications` | JSONB | Personal recipe changes | See modifications structure |
| `personal_notes` | TEXT | Private notes | `Add more garlic next time` |
| `difficulty_rating` | INTEGER | Perceived difficulty (1-5) | `2` |
| `time_accuracy_rating` | INTEGER | Recipe time accuracy (1-5) | `4` |
| `would_make_again` | BOOLEAN | Willingness to repeat | `true` |
| `recommended_to_others` | INTEGER | Times recommended | `2` |
| `tags` | JSONB | Personal tags | `["quick", "kid_friendly", "healthy"]` |
| `photos` | JSONB | User photos of results | See photos structure |
| `cooking_notes` | JSONB | Session-by-session notes | See cooking notes structure |
| `ingredient_substitutions` | JSONB | Substitutions made | See substitutions structure |
| `created_at` | TIMESTAMP | First interaction | `2024-06-15 12:00:00` |
| `updated_at` | TIMESTAMP | Last update | `2024-07-30 18:30:00` |

### `recipe_preference_patterns` (AI Learning Data)
**Purpose**: Machine learning patterns for personalized recommendations
**Primary Key**: `user_id`

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `user_id` | UUID | User reference | `123e4567-...` |
| `ingredient_preferences` | JSONB | Ingredient preference scores (-5 to +5) | See ingredient preferences |
| `cooking_method_preferences` | JSONB | Cooking technique preferences | See cooking methods |
| `cuisine_preferences` | JSONB | Cuisine type preferences | See cuisine preferences |
| `spice_level_preferences` | JSONB | Spice tolerance and preferences | See spice preferences |
| `texture_preferences` | JSONB | Food texture preferences | See texture preferences |
| `flavor_profile_preferences` | JSONB | Flavor combination preferences | See flavor preferences |
| `meal_timing_patterns` | JSONB | When user cooks different meals | See timing patterns |
| `seasonal_patterns` | JSONB | Seasonal cooking preferences | See seasonal patterns |
| `difficulty_comfort_zone` | JSONB | Preferred difficulty levels | See difficulty patterns |
| `time_constraints` | JSONB | Typical cooking time availability | See time patterns |
| `dietary_exploration_score` | INTEGER | Willingness to try new foods (0-100) | `75` |
| `recipe_discovery_patterns` | JSONB | How user finds new recipes | See discovery patterns |
| `last_updated` | TIMESTAMP | Last pattern update | `2024-07-30 14:22:00` |
| `confidence_score` | DECIMAL(4,2) | Pattern reliability score | `85.50` |
| `created_at` | TIMESTAMP | Pattern learning start | `2024-01-15 10:30:00` |

**Ingredient Preferences Structure**:
```json
{
  "garlic": 4.5,
  "cilantro": -3.2,
  "mushrooms": 2.1,
  "bell_peppers": 3.8,
  "blue_cheese": -4.0,
  "avocado": 4.9
}
```

### `ingredient_preferences` (Individual Ingredient Tracking)
**Purpose**: Granular ingredient-level preference learning
**Primary Key**: `user_id, ingredient_name`

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `user_id` | UUID | User reference | `123e4567-...` |
| `ingredient_name` | VARCHAR(255) | Ingredient name | `garlic` |
| `preference_score` | DECIMAL(3,1) | Preference score (-5.0 to +5.0) | `4.2` |
| `confidence_level` | DECIMAL(4,2) | Confidence in score | `87.50` |
| `frequency_used` | INTEGER | Times used in recipes | `23` |
| `last_used` | DATE | Most recent use | `2024-07-28` |
| `typical_preparations` | JSONB | Common preparation methods | `["minced", "roasted", "raw"]` |
| `seasonal_usage_patterns` | JSONB | When ingredient is used | See seasonal usage |
| `substitution_preferences` | JSONB | Preferred substitutes | `["shallots", "onion_powder"]` |
| `cultural_context` | JSONB | Cuisine associations | `["Mediterranean", "Italian", "Asian"]` |
| `learning_history` | JSONB | How preference evolved | See learning history |
| `created_at` | TIMESTAMP | First encounter | `2024-02-10 12:00:00` |
| `updated_at` | TIMESTAMP | Last preference update | `2024-07-30 14:22:00` |

---

## Social Circle Tables

### `circles` (Social Groups)
**Purpose**: Flexible groups for shared meal planning (families, friends, roommates)
**Primary Key**: `id` (UUID)

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `id` | UUID | Unique circle ID | `123e4567-...` |
| `name` | VARCHAR(255) | Circle name | `The Johnson Family` |
| `description` | TEXT | Circle description | `Our family meal planning group` |
| `circle_type` | VARCHAR(50) | Type of group | `family`, `friends`, `roommates`, `couple`, `cooking_group` |
| `created_by` | UUID | Circle creator | `123e4567-...` |
| `image_url` | TEXT | Circle photo | `https://...` |
| `invite_code` | VARCHAR(20) | Unique invite code | `FAM2024XYZ` |
| `privacy_level` | VARCHAR(50) | Privacy setting | `private`, `invite_only`, `discoverable` |
| `member_count` | INTEGER | Current member count | `4` |
| `max_members` | INTEGER | Maximum allowed members | `8` |
| `settings` | JSONB | Circle-wide settings | See circle settings structure |
| `shared_dietary_restrictions` | JSONB | Group dietary needs | `["nut_free", "vegetarian_options"]` |
| `shared_budget` | DECIMAL(10,2) | Monthly food budget | `800.00` |
| `preferred_stores` | JSONB | Group store preferences | `["Whole Foods", "Costco"]` |
| `meal_planning_style` | VARCHAR(50) | Planning approach | `collaborative`, `rotating_planner`, `admin_controlled` |
| `shopping_style` | VARCHAR(50) | Shopping approach | `shared_list`, `individual_assignments`, `one_shopper` |
| `cost_splitting_method` | VARCHAR(50) | Expense sharing | `equal_split`, `proportional`, `individual_items` |
| `activity_level` | VARCHAR(50) | Group activity | `very_active`, `active`, `moderate`, `low` |
| `timezone` | VARCHAR(50) | Circle timezone | `America/New_York` |
| `status` | VARCHAR(50) | Circle status | `active`, `inactive`, `archived` |
| `created_at` | TIMESTAMP | Circle creation | `2024-01-15 10:30:00` |
| `updated_at` | TIMESTAMP | Last update | `2024-07-30 14:22:00` |

**Circle Settings Structure**:
```json
{
  "meal_planning": {
    "auto_generate": false,
    "planning_day": "sunday",
    "planning_time": "10:00",
    "weeks_in_advance": 1,
    "allow_member_suggestions": true
  },
  "shopping": {
    "preferred_day": "saturday",
    "budget_tracking": true,
    "price_comparison": true,
    "bulk_buying": true
  },
  "notifications": {
    "meal_reminders": true,
    "shopping_reminders": true,
    "budget_alerts": true,
    "member_activity": true
  },
  "permissions": {
    "anyone_can_plan": false,
    "anyone_can_shop": true,
    "anyone_can_invite": false,
    "recipe_approval_required": false
  }
}
```

### `circle_members` (Group Membership)
**Purpose**: User roles and permissions within circles
**Primary Key**: `circle_id, user_id`

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `circle_id` | UUID | Circle reference | `123e4567-...` |
| `user_id` | UUID | User reference | `123e4567-...` |
| `role` | VARCHAR(50) | Member role | `admin`, `member`, `guest` |
| `nickname` | VARCHAR(100) | Display name in circle | `Dad`, `Mom`, `Chef Sarah` |
| `color_theme` | VARCHAR(7) | Personal color in circle | `#FF5733` |
| `responsibilities` | JSONB | Assigned responsibilities | `["meal_planning", "grocery_shopping"]` |
| `cooking_skills` | JSONB | Cooking abilities | See cooking skills structure |
| `dietary_contributions` | JSONB | Dietary needs affecting group | `["gluten_free", "dairy_free"]` |
| `shopping_preferences` | JSONB | Shopping style and availability | See shopping preferences |
| `budget_contribution` | DECIMAL(10,2) | Monthly contribution | `200.00` |
| `availability_schedule` | JSONB | When available for cooking/eating | See availability structure |
| `notification_preferences` | JSONB | Circle-specific notifications | See notification structure |
| `participation_score` | DECIMAL(4,2) | Engagement level (0-100) | `87.50` |
| `contribution_score` | DECIMAL(4,2) | Contribution level (0-100) | `92.00` |
| `satisfaction_rating` | INTEGER | Circle satisfaction (1-5) | `4` |
| `invite_permissions` | JSONB | Who they can invite | See invite permissions |
| `joined_at` | TIMESTAMP | Join date | `2024-01-15 14:30:00` |
| `last_active_at` | TIMESTAMP | Last circle activity | `2024-07-30 16:45:00` |
| `left_at` | TIMESTAMP | Leave date (if left) | `null` |

**Cooking Skills Structure**:
```json
{
  "skill_level": "intermediate",
  "specialties": ["baking", "grilling", "meal_prep"],
  "equipment_expertise": ["instant_pot", "air_fryer"],
  "cuisine_experience": ["Italian", "Mexican", "Asian"],
  "time_availability": {
    "weekdays": "limited",
    "weekends": "flexible"
  },
  "enjoys_cooking": true,
  "teaches_others": false
}
```

### `circle_invitations` (Invitation System)
**Purpose**: Managing invitations to join circles
**Primary Key**: `id` (UUID)

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `id` | UUID | Invitation ID | `123e4567-...` |
| `circle_id` | UUID | Target circle | `123e4567-...` |
| `invited_by` | UUID | Inviting user | `123e4567-...` |
| `invited_user_id` | UUID | Invited user (if registered) | `123e4567-...` |
| `invited_email` | VARCHAR(255) | Invited email (if not registered) | `friend@example.com` |
| `invitation_code` | VARCHAR(50) | Unique invitation code | `INV2024ABC123` |
| `proposed_role` | VARCHAR(50) | Suggested role | `member` |
| `personal_message` | TEXT | Custom invitation message | `Join our family meal planning!` |
| `status` | VARCHAR(50) | Invitation status | `pending`, `accepted`, `declined`, `expired` |
| `expires_at` | TIMESTAMP | Expiration time | `2024-08-15 23:59:59` |
| `accepted_at` | TIMESTAMP | Acceptance time | `2024-07-31 10:15:00` |
| `created_at` | TIMESTAMP | Invitation sent | `2024-07-30 14:22:00` |

---

## Meal Planning Tables

### `meal_plans` (Weekly/Monthly Meal Planning)
**Purpose**: Organized meal planning for circles and individuals
**Primary Key**: `id` (UUID)

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `id` | UUID | Meal plan ID | `123e4567-...` |
| `circle_id` | UUID | Circle reference (optional) | `123e4567-...` |
| `user_id` | UUID | Individual user (if personal plan) | `123e4567-...` |
| `name` | VARCHAR(255) | Plan name | `Week of July 29 - Family Meals` |
| `description` | TEXT | Plan description | `Summer meal plan with BBQ focus` |
| `plan_type` | VARCHAR(50) | Plan duration | `weekly`, `bi_weekly`, `monthly`, `custom` |
| `start_date` | DATE | Plan start date | `2024-07-29` |
| `end_date` | DATE | Plan end date | `2024-08-04` |
| `status` | VARCHAR(50) | Plan status | `draft`, `active`, `completed`, `archived` |
| `created_by` | UUID | Plan creator | `123e4567-...` |
| `approved_by` | JSONB | Circle members who approved | `["user1", "user2"]` |
| `total_servings` | INTEGER | Total servings planned | `28` |
| `estimated_cost` | DECIMAL(10,2) | Estimated total cost | `185.50` |
| `actual_cost` | DECIMAL(10,2) | Actual cost (when completed) | `192.75` |
| `estimated_prep_time` | INTEGER | Total prep time (minutes) | `420` |
| `dietary_accommodations` | JSONB | Special dietary needs covered | `["vegetarian", "gluten_free"]` |
| `nutrition_goals` | JSONB | Plan nutrition targets | See nutrition goals structure |
| `theme` | VARCHAR(100) | Plan theme | `Mediterranean Week`, `Comfort Food` |
| `notes` | TEXT | Plan notes | `Focus on using summer vegetables` |
| `shopping_generated` | BOOLEAN | Shopping list created | `true` |
| `prep_schedule` | JSONB | Meal prep timing | See prep schedule structure |
| `success_metrics` | JSONB | Plan effectiveness metrics | See success metrics |
| `created_at` | TIMESTAMP | Plan creation | `2024-07-28 15:00:00` |
| `updated_at` | TIMESTAMP | Last update | `2024-07-30 14:22:00` |
| `completed_at` | TIMESTAMP | Plan completion | `2024-08-05 20:00:00` |

### `meal_plan_items` (Individual Meals in Plans)
**Purpose**: Specific meals within meal plans
**Primary Key**: `id` (UUID)

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `id` | UUID | Meal item ID | `123e4567-...` |
| `meal_plan_id` | UUID | Parent meal plan | `123e4567-...` |
| `recipe_id` | UUID | Recipe reference | `123e4567-...` |
| `date` | DATE | Scheduled date | `2024-07-30` |
| `meal_type` | VARCHAR(50) | Meal category | `breakfast`, `lunch`, `dinner`, `snack` |
| `scheduled_time` | TIME | Planned meal time | `18:30:00` |
| `servings_planned` | INTEGER | Planned servings | `4` |
| `assigned_cook` | UUID | Assigned cook | `123e4567-...` |
| `prep_time_minutes` | INTEGER | Prep time needed | `20` |
| `cook_time_minutes` | INTEGER | Cook time needed | `35` |
| `difficulty_level` | VARCHAR(20) | Cooking difficulty | `easy`, `medium`, `hard` |
| `status` | VARCHAR(50) | Meal status | `planned`, `prep_started`, `cooking`, `completed`, `skipped` |
| `actual_servings_made` | INTEGER | Actually prepared | `4` |
| `actual_servings_consumed` | INTEGER | Actually eaten | `3` |
| `leftovers_portions` | INTEGER | Leftover portions | `1` |
| `actual_cook` | UUID | Who actually cooked | `123e4567-...` |
| `actual_start_time` | TIMESTAMP | When cooking started | `2024-07-30 18:00:00` |
| `actual_completion_time` | TIMESTAMP | When meal was ready | `2024-07-30 19:15:00` |
| `modifications_made` | JSONB | Recipe changes made | See modifications structure |
| `ingredients_substituted` | JSONB | Ingredient substitutions | See substitutions structure |
| `cooking_notes` | TEXT | Notes from cooking session | `Added extra herbs, delicious!` |
| `family_feedback` | JSONB | Feedback from circle members | See feedback structure |
| `nutrition_actual` | JSONB | Actual nutrition (if modified) | See nutrition structure |
| `cost_actual` | DECIMAL(8,2) | Actual cost | `12.85` |
| `success_rating` | INTEGER | Overall success (1-5) | `4` |
| `would_plan_again` | BOOLEAN | Would include in future plans | `true` |
| `created_at` | TIMESTAMP | Item creation | `2024-07-28 15:30:00` |
| `updated_at` | TIMESTAMP | Last update | `2024-07-30 19:20:00` |

---

## Shopping & Inventory Tables

### `shopping_lists` (Shopping Lists)
**Purpose**: Generated and manual shopping lists for circles and individuals
**Primary Key**: `id` (UUID)

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `id` | UUID | Shopping list ID | `123e4567-...` |
| `circle_id` | UUID | Circle reference (optional) | `123e4567-...` |
| `user_id` | UUID | Individual user (if personal) | `123e4567-...` |
| `meal_plan_id` | UUID | Source meal plan (if generated) | `123e4567-...` |
| `name` | VARCHAR(255) | List name | `Weekly Groceries - July 29` |
| `list_type` | VARCHAR(50) | List type | `meal_plan_generated`, `manual`, `pantry_restock`, `bulk_shopping` |
| `status` | VARCHAR(50) | List status | `draft`, `active`, `shopping`, `completed`, `partially_completed` |
| `priority` | VARCHAR(20) | Shopping priority | `urgent`, `normal`, `low` |
| `scheduled_date` | DATE | Planned shopping date | `2024-07-31` |
| `scheduled_time` | TIME | Planned shopping time | `10:00:00` |
| `assigned_shopper` | UUID | Assigned shopper | `123e4567-...` |
| `actual_shopper` | UUID | Who actually shopped | `123e4567-...` |
| `store_preference` | VARCHAR(100) | Preferred store | `Whole Foods Market` |
| `stores_visited` | JSONB | Stores actually visited | `["Whole Foods", "Costco"]` |
| `estimated_cost` | DECIMAL(10,2) | Estimated total cost | `125.50` |
| `budget_limit` | DECIMAL(10,2) | Maximum budget | `150.00` |
| `actual_cost` | DECIMAL(10,2) | Actual amount spent | `138.75` |
| `items_total` | INTEGER | Total items on list | `23` |
| `items_purchased` | INTEGER | Items actually bought | `21` |
| `items_unavailable` | INTEGER | Items not found | `1` |
| `items_substituted` | INTEGER | Items substituted | `1` |
| `completion_percentage` | DECIMAL(5,2) | Completion rate | `95.65` |
| `shopping_duration_minutes` | INTEGER | Time spent shopping | `65` |
| `notes` | TEXT | Shopping notes | `Couldn't find organic tomatoes` |
| `receipt_photo_url` | TEXT | Receipt photo | `https://...` |
| `created_at` | TIMESTAMP | List creation | `2024-07-29 09:00:00` |
| `updated_at` | TIMESTAMP | Last update | `2024-07-31 11:30:00` |
| `completed_at` | TIMESTAMP | Shopping completion | `2024-07-31 11:15:00` |

### `shopping_list_items` (Individual Shopping Items)
**Purpose**: Individual items within shopping lists
**Primary Key**: `id` (UUID)

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `id` | UUID | Item ID | `123e4567-...` |
| `shopping_list_id` | UUID | Parent shopping list | `123e4567-...` |
| `recipe_id` | UUID | Source recipe (if applicable) | `123e4567-...` |
| `pantry_item_id` | UUID | Pantry item being restocked | `123e4567-...` |
| `category` | VARCHAR(100) | Item category | `produce`, `dairy`, `meat`, `pantry` |
| `name` | VARCHAR(255) | Item name | `Organic Chicken Breast` |
| `brand_preference` | VARCHAR(100) | Preferred brand | `Bell & Evans` |
| `quantity` | DECIMAL(10,3) | Quantity needed | `2.000` |
| `unit` | VARCHAR(50) | Measurement unit | `pounds`, `pieces`, `bottles` |
| `size_specification` | VARCHAR(100) | Size details | `Boneless, skinless` |
| `estimated_price` | DECIMAL(8,2) | Expected price | `12.99` |
| `price_range_min` | DECIMAL(8,2) | Minimum acceptable price | `10.00` |
| `price_range_max` | DECIMAL(8,2) | Maximum acceptable price | `15.00` |
| `actual_price` | DECIMAL(8,2) | Price paid | `13.49` |
| `actual_quantity` | DECIMAL(10,3) | Quantity purchased | `2.100` |
| `actual_brand` | VARCHAR(100) | Brand purchased | `Bell & Evans` |
| `store_section` | VARCHAR(100) | Store location | `Meat Department` |
| `priority` | VARCHAR(20) | Item priority | `high`, `medium`, `low` |
| `is_purchased` | BOOLEAN | Purchase status | `true` |
| `is_substituted` | BOOLEAN | Was substituted | `false` |
| `substitution_details` | JSONB | Substitution information | See substitution structure |
| `unavailable_reason` | VARCHAR(100) | Why not available | `out_of_stock`, `discontinued`, `seasonal` |
| `notes` | TEXT | Item notes | `Check for sale price` |
| `added_by` | UUID | Who added item | `123e4567-...` |
| `purchased_by` | UUID | Who purchased | `123e4567-...` |
| `purchased_at` | TIMESTAMP | Purchase time | `2024-07-31 10:45:00` |
| `created_at` | TIMESTAMP | Item addition | `2024-07-29 09:15:00` |
| `updated_at` | TIMESTAMP | Last update | `2024-07-31 10:45:00` |

### `pantry_items` (Inventory Management)
**Purpose**: Food inventory tracking with expiry monitoring
**Primary Key**: `id` (UUID)

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `id` | UUID | Pantry item ID | `123e4567-...` |
| `circle_id` | UUID | Circle reference (if shared) | `123e4567-...` |
| `user_id` | UUID | Individual owner | `123e4567-...` |
| `name` | VARCHAR(255) | Item name | `Organic Whole Milk` |
| `category` | VARCHAR(100) | Food category | `dairy`, `produce`, `meat`, `pantry`, `frozen` |
| `subcategory` | VARCHAR(100) | Specific subcategory | `milk`, `vegetables`, `spices` |
| `brand` | VARCHAR(100) | Product brand | `Organic Valley` |
| `barcode` | VARCHAR(50) | Product barcode | `123456789012` |
| `quantity` | DECIMAL(10,3) | Current quantity | `1.000` |
| `original_quantity` | DECIMAL(10,3) | Original quantity purchased | `1.000` |
| `unit` | VARCHAR(50) | Measurement unit | `gallon`, `pounds`, `pieces` |
| `storage_location` | VARCHAR(100) | Where stored | `refrigerator`, `pantry`, `freezer`, `counter` |
| `specific_location` | VARCHAR(100) | Specific location details | `fridge_main_shelf`, `pantry_top_shelf` |
| `purchase_date` | DATE | When purchased | `2024-07-29` |
| `expiry_date` | DATE | Expiration date | `2024-08-05` |
| `best_before_date` | DATE | Best before date | `2024-08-03` |
| `opened_date` | DATE | When opened | `2024-07-30` |
| `use_by_days_after_opening` | INTEGER | Days good after opening | `7` |
| `cost` | DECIMAL(8,2) | Purchase cost | `4.99` |
| `cost_per_unit` | DECIMAL(8,2) | Cost per unit | `4.99` |
| `store_purchased` | VARCHAR(100) | Purchase location | `Whole Foods Market` |
| `status` | VARCHAR(50) | Current status | `available`, `low`, `expired`, `consumed` |
| `freshness_score` | INTEGER | Freshness rating (0-100) | `85` |
| `auto_reorder` | BOOLEAN | Auto-reorder when low | `true` |
| `reorder_threshold` | DECIMAL(10,3) | Reorder trigger quantity | `0.250` |
| `reorder_quantity` | DECIMAL(10,3) | Quantity to reorder | `1.000` |
| `usage_rate_per_day` | DECIMAL(8,4) | Daily consumption rate | `0.1250` |
| `estimated_depletion_date` | DATE | When will run out | `2024-08-07` |
| `nutrition_info` | JSONB | Nutritional information | See nutrition structure |
| `allergen_info` | JSONB | Allergen warnings | `["contains_milk"]` |
| `tags` | JSONB | Custom tags | `["organic", "local", "favorite"]` |
| `notes` | TEXT | Additional notes | `Kids' favorite brand` |
| `photo_url` | TEXT | Item photo | `https://...` |
| `created_at` | TIMESTAMP | Item addition | `2024-07-29 12:00:00` |
| `updated_at` | TIMESTAMP | Last update | `2024-07-30 08:30:00` |
| `consumed_at` | TIMESTAMP | When fully consumed | `null` |

### `leftover_items` (Leftover Management)
**Purpose**: Tracking meal leftovers to reduce waste
**Primary Key**: `id` (UUID)

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `id` | UUID | Leftover item ID | `123e4567-...` |
| `circle_id` | UUID | Circle reference | `123e4567-...` |
| `user_id` | UUID | Who created leftover | `123e4567-...` |
| `recipe_id` | UUID | Source recipe | `123e4567-...` |
| `meal_plan_item_id` | UUID | Source meal plan item | `123e4567-...` |
| `name` | VARCHAR(255) | Leftover name | `Mediterranean Grilled Chicken` |
| `description` | TEXT | Leftover description | `Chicken breast with roasted vegetables` |
| `portions` | DECIMAL(5,2) | Number of portions | `2.5` |
| `portion_size` | VARCHAR(100) | Size description | `1 piece chicken + sides` |
| `original_meal_date` | DATE | When originally cooked | `2024-07-30` |
| `stored_date` | TIMESTAMP | When stored | `2024-07-30 20:30:00` |
| `expiry_date` | DATE | When expires | `2024-08-02` |
| `storage_location` | VARCHAR(50) | Where stored | `refrigerator`, `freezer` |
| `storage_container` | VARCHAR(100) | Container type | `glass_container`, `plastic_bag`, `foil` |
| `status` | VARCHAR(50) | Current status | `fresh`, `expiring_soon`, `expired`, `consumed`, `discarded` |
| `freshness_score` | INTEGER | Freshness (0-100) | `90` |
| `reheating_instructions` | TEXT | How to reheat | `Microwave 2 minutes or oven 10 min at 350°F` |
| `suggested_uses` | JSONB | Usage suggestions | `["lunch", "quick_dinner", "meal_prep"]` |
| `nutritional_value` | JSONB | Nutrition per portion | See nutrition structure |
| `estimated_value` | DECIMAL(8,2) | Estimated monetary value | `8.50` |
| `tags` | JSONB | Leftover tags | `["healthy", "quick_reheat", "kid_friendly"]` |
| `photo_url` | TEXT | Leftover photo | `https://...` |
| `notes` | TEXT | Additional notes | `Kids loved this, save for their lunch` |
| `consumed_by` | UUID | Who consumed it | `123e4567-...` |
| `consumed_date` | TIMESTAMP | When consumed | `2024-08-01 12:30:00` |
| `consumption_rating` | INTEGER | How good it was (1-5) | `4` |
| `waste_reason` | VARCHAR(100) | Why discarded (if applicable) | `expired`, `spoiled`, `forgot`, `disliked` |
| `created_at` | TIMESTAMP | Leftover creation | `2024-07-30 20:30:00` |
| `updated_at` | TIMESTAMP | Last update | `2024-08-01 12:35:00` |

### `waste_logs` (Food Waste Tracking)
**Purpose**: Tracking food waste for sustainability insights
**Primary Key**: `id` (UUID)

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `id` | UUID | Waste log ID | `123e4567-...` |
| `circle_id` | UUID | Circle reference | `123e4567-...` |
| `user_id` | UUID | Who logged waste | `123e4567-...` |
| `pantry_item_id` | UUID | Wasted pantry item | `123e4567-...` |
| `leftover_item_id` | UUID | Wasted leftover | `123e4567-...` |
| `recipe_id` | UUID | Source recipe | `123e4567-...` |
| `item_name` | VARCHAR(255) | What was wasted | `Expired Milk` |
| `category` | VARCHAR(100) | Food category | `dairy`, `produce`, `leftovers` |
| `quantity` | DECIMAL(10,3) | Amount wasted | `0.500` |
| `unit` | VARCHAR(50) | Measurement unit | `gallons`, `pounds` |
| `waste_reason` | VARCHAR(100) | Why wasted | `expired`, `spoiled`, `over_purchased`, `forgotten`, `disliked` |
| `expiry_date` | DATE | Original expiry date | `2024-08-05` |
| `days_past_expiry` | INTEGER | Days past expiration | `2` |
| `estimated_value` | DECIMAL(8,2) | Monetary value lost | `4.99` |
| `original_cost` | DECIMAL(8,2) | Original purchase cost | `4.99` |
| `purchase_date` | DATE | When originally purchased | `2024-07-29` |
| `disposal_method` | VARCHAR(50) | How disposed | `trash`, `compost`, `donation`, `fed_to_pets` |
| `prevention_notes` | TEXT | How to prevent in future | `Set reminder to use before expiry` |
| `environmental_impact` | JSONB | Environmental metrics | See environmental structure |
| `photo_url` | TEXT | Photo of wasted item | `https://...` |
| `logged_at` | TIMESTAMP | When logged | `2024-08-07 09:00:00` |
| `notes` | TEXT | Additional notes | `Forgot about it in back of fridge` |

---

## Analytics & Metrics Tables

### `user_analytics` (Daily User Metrics)
**Purpose**: Daily aggregated user behavior and health metrics
**Primary Key**: `user_id, date`

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `user_id` | UUID | User reference | `123e4567-...` |
| `date` | DATE | Analytics date | `2024-07-30` |
| `meals_logged` | INTEGER | Meals logged today | `3` |
| `calories_consumed` | DECIMAL(8,2) | Total calories | `1875.50` |
| `calories_goal` | INTEGER | Daily calorie goal | `2000` |
| `calories_goal_met` | BOOLEAN | Goal achieved | `false` |
| `protein_g` | DECIMAL(8,2) | Protein consumed | `125.75` |
| `carbs_g` | DECIMAL(8,2) | Carbs consumed | `195.25` |
| `fat_g` | DECIMAL(8,2) | Fat consumed | `62.50` |
| `fiber_g` | DECIMAL(8,2) | Fiber consumed | `28.75` |
| `water_ml` | INTEGER | Water consumed | `2200` |
| `water_goal_met` | BOOLEAN | Water goal achieved | `false` |
| `meals_planned` | INTEGER | Meals planned | `4` |
| `meals_cooked` | INTEGER | Meals cooked | `2` |
| `meals_eaten_out` | INTEGER | Restaurant meals | `1` |
| `recipes_viewed` | INTEGER | Recipes viewed | `12` |
| `recipes_favorited` | INTEGER | New favorites | `2` |
| `recipes_cooked` | INTEGER | Recipes cooked | `2` |
| `shopping_lists_created` | INTEGER | Lists created | `1` |
| `shopping_completed` | BOOLEAN | Shopping done | `true` |
| `money_spent` | DECIMAL(10,2) | Money spent on food | `45.75` |
| `money_saved` | DECIMAL(10,2) | Money saved (coupons, etc.) | `8.25` |
| `waste_logged` | DECIMAL(8,2) | Food waste value | `0.00` |
| `leftovers_created` | INTEGER | Leftover portions created | `3` |
| `leftovers_consumed` | INTEGER | Leftover portions eaten | `1` |
| `exercise_minutes` | INTEGER | Exercise logged | `30` |
| `weight_kg` | DECIMAL(5,2) | Weight (if logged) | `70.2` |
| `mood_score` | INTEGER | Mood rating (1-10) | `8` |
| `energy_level` | INTEGER | Energy rating (1-10) | `7` |
| `sleep_hours` | DECIMAL(4,2) | Sleep duration | `7.5` |
| `app_opens` | INTEGER | App launches | `8` |
| `session_duration_minutes` | INTEGER | Total app time | `45` |
| `features_used` | JSONB | Features accessed | `["meal_planning", "nutrition_log", "recipes"]` |
| `social_interactions` | INTEGER | Circle interactions | `5` |
| `achievements_unlocked` | JSONB | New achievements | `["week_streak", "recipe_master"]` |
| `streak_days` | INTEGER | Current streak | `7` |
| `goal_completion_rate` | DECIMAL(5,2) | Overall goal completion % | `78.50` |

### `circle_analytics` (Circle Performance Metrics)
**Purpose**: Daily analytics for circle collaboration and effectiveness
**Primary Key**: `circle_id, date`

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `circle_id` | UUID | Circle reference | `123e4567-...` |
| `date` | DATE | Analytics date | `2024-07-30` |
| `active_members` | INTEGER | Members active today | `3` |
| `total_members` | INTEGER | Total circle members | `4` |
| `meals_planned_together` | INTEGER | Collaborative meals planned | `2` |
| `meals_cooked_together` | INTEGER | Meals cooked by circle | `1` |
| `shopping_lists_shared` | INTEGER | Shared shopping lists | `1` |
| `shopping_collaboration_score` | DECIMAL(5,2) | Shopping teamwork % | `85.00` |
| `recipe_shares` | INTEGER | Recipes shared in circle | `3` |
| `recipe_feedback_given` | INTEGER | Feedback interactions | `7` |
| `budget_adherence` | DECIMAL(5,2) | Budget compliance % | `92.50` |
| `cost_per_person` | DECIMAL(8,2) | Daily cost per member | `12.75` |
| `waste_prevention_score` | DECIMAL(5,2) | Waste reduction effectiveness | `88.00` |
| `meal_satisfaction_avg` | DECIMAL(3,2) | Average meal rating | `4.25` |
| `communication_events` | INTEGER | Circle messages/interactions | `15` |
| `conflicts_resolved` | INTEGER | Disagreements resolved | `0` |
| `member_satisfaction_avg` | DECIMAL(3,2) | Average member satisfaction | `4.50` |
| `collaboration_effectiveness` | DECIMAL(5,2) | Overall collaboration score | `87.50` |

### `system_metrics` (Application-wide Metrics)
**Purpose**: Overall system performance and usage metrics
**Primary Key**: `date`

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `date` | DATE | Metrics date | `2024-07-30` |
| `total_users` | INTEGER | Total registered users | `15847` |
| `active_users_daily` | INTEGER | Daily active users | `3254` |
| `active_users_weekly` | INTEGER | Weekly active users | `8765` |
| `active_users_monthly` | INTEGER | Monthly active users | `12456` |
| `new_users_today` | INTEGER | New registrations | `45` |
| `total_circles` | INTEGER | Total circles created | `2847` |
| `active_circles` | INTEGER | Active circles | `1923` |
| `total_recipes` | INTEGER | Total recipes in system | `125847` |
| `user_created_recipes` | INTEGER | User-contributed recipes | `23456` |
| `total_meal_plans` | INTEGER | Total meal plans created | `89765` |
| `total_shopping_lists` | INTEGER | Total shopping lists | `145623` |
| `total_nutrition_logs` | INTEGER | Total nutrition entries | `956847` |
| `average_session_duration` | DECIMAL(6,2) | Average session minutes | `18.75` |
| `recipe_views_today` | INTEGER | Recipe views today | `45623` |
| `meals_planned_today` | INTEGER | Meals planned today | `8945` |
| `shopping_lists_completed` | INTEGER | Lists completed today | `2347` |
| `food_waste_prevented_kg` | DECIMAL(10,2) | Waste prevention total | `1247.50` |
| `money_saved_total` | DECIMAL(12,2) | Total user savings | `89456.75` |
| `premium_subscribers` | INTEGER | Premium user count | `2847` |
| `subscription_revenue` | DECIMAL(12,2) | Monthly subscription revenue | `28470.50` |
| `system_uptime_percentage` | DECIMAL(5,2) | System availability | `99.95` |
| `api_requests_total` | INTEGER | Total API requests | `2456789` |
| `average_response_time_ms` | DECIMAL(8,2) | Average API response time | `125.50` |

---

## Data Relationships

### Primary Relationships
- **users** → **user_profiles** (1:1)
- **users** → **user_health_profiles** (1:1)  
- **users** → **user_dietary_preferences** (1:1)
- **users** → **nutrition_logs** (1:many)
- **users** → **circles** via **circle_members** (many:many)
- **circles** → **meal_plans** (1:many)
- **meal_plans** → **meal_plan_items** (1:many)
- **recipes** → **meal_plan_items** (1:many)
- **recipes** → **user_recipe_interactions** (1:many)
- **circles** → **shopping_lists** (1:many)
- **shopping_lists** → **shopping_list_items** (1:many)

### Analytics Relationships
- All user activity feeds into **user_analytics**
- Circle collaboration feeds into **circle_analytics**  
- System-wide metrics aggregate into **system_metrics**
- Nutrition data flows: **nutrition_logs** → **daily_nutrition_summaries** → **weekly_nutrition_summaries** → **monthly_nutrition_summaries**

This comprehensive schema captures every aspect of the WellNoosh user experience, from detailed nutrition tracking to complex social cooking dynamics, enabling personalized recommendations and powerful analytics insights.