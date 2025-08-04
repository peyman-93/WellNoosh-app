# WellNoosh Database Schema Documentation

**Last Updated:** February 1, 2025  
**Version:** 3.0  
**Status:** Production Ready

## Overview

The WellNoosh database is a **scalable nutrition and meal planning platform** designed to support millions of users. Built on Supabase/PostgreSQL with partitioning, automated triggers, and Row Level Security (RLS) for optimal performance and security.

### **🎯 Core Functionality**
- **User Profile Management** - Complete user onboarding and health tracking
- **Meal Planning System** - AI-ready meal plan generation and storage  
- **Food Logging** - Scalable partitioned food consumption tracking
- **Nutrition Analytics** - Real-time nutrition calculation and trends
- **Recipe Management** - Comprehensive recipe database with ratings

---

## Table Structure Summary

### **🏗️ Core Architecture**

| Category | Table Name | Purpose | Scalability | Records Est. |
|----------|------------|---------|-------------|--------------|
| **🔐 Authentication** | `auth.users` | User authentication (Supabase) | ✅ Managed | Production |
| **👤 User Data** | `user_profiles` | Basic user info + email | ✅ Indexed | 1:1 with users |
| **👤 User Data** | `user_health_profiles` | Health metrics & goals | ✅ Indexed | 1:1 with users |
| **👤 User Data** | `user_dietary_preferences` | Diet restrictions | ✅ Indexed | 1:1 with users |
| **🍽️ Meal Planning** | `user_meal_plans` | **NEW** - Daily meal plans | ✅ Composite Keys | 365/user/year |
| **🍽️ Meal Planning** | `planned_meals` | **NEW** - Individual planned meals | ✅ Indexed | ~1,095/user/year |
| **📊 Food Tracking** | `user_food_logs` | **Partitioned** food consumption | ✅ Monthly Partitions | ~1,825/user/year |
| **📊 Food Tracking** | `daily_nutrition_summary` | Pre-calculated daily totals | ✅ Composite Keys | 365/user/year |
| **📊 Food Tracking** | `user_food_logs_archive` | Archive (>2 years old) | ✅ Automated | Archived data |
| **📖 Recipes** | `recipes` | Recipe database | ✅ Indexed | ~1,000 recipes |
| **📖 Recipes** | `ingredients` | Master ingredient list | ✅ Indexed | ~500 ingredients |
| **📖 Recipes** | `recipe_ingredients` | Recipe-ingredient links | ✅ Indexed | ~5,000 relationships |
| **📖 Recipes** | `user_favorite_recipes` | User bookmarks | ✅ Composite Keys | Many per user |
| **📖 Recipes** | `user_recipe_ratings` | Reviews & ratings | ✅ Composite Keys | Many per user |
| **🏷️ Lookup** | `food_categories` | Food type categories | ✅ Small table | ~15 categories |
| **🛠️ System** | `maintenance_logs` | System operations log | ✅ Time-based | System logs |

### **⚠️ Deprecated Tables (To Be Removed)**

| Table Name | Reason for Removal | Replacement |
|------------|-------------------|-------------|
| `meal_plans` | Non-user-specific design | `user_meal_plans` |
| `meal_plan_recipes` | Poor scalability | `planned_meals` |
| `daily_health_logs` | Unclear purpose/usage | `user_food_logs` or remove |

---

## Detailed Table Schemas

### 1. User Management Tables

#### `user_profiles`
**Purpose:** Basic user information and cooking preferences  
**Relationships:** 1:1 with auth.users

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Auto-generated |
| `user_id` | UUID | FK to auth.users(id), UNIQUE | User reference |
| `full_name` | VARCHAR(255) | | User's full name |
| `country` | VARCHAR(100) | | User's country |
| `city` | VARCHAR(100) | | User's city |
| `postal_code` | VARCHAR(20) | | Postal/ZIP code |
| `address` | TEXT | | Full address |
| `cooking_experience_level` | VARCHAR(50) | CHECK constraint | Beginner, Intermediate, Advanced, Expert |
| `cooking_frequency` | VARCHAR(50) | CHECK constraint | Daily, Several times a week, etc. |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update |

**Indexes:** `idx_user_profiles_user_id`  
**RLS:** Users can only view/edit their own profile

#### `user_health_profiles`
**Purpose:** Health metrics, goals, and calculated values  
**Relationships:** 1:1 with auth.users

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Auto-generated |
| `user_id` | UUID | FK to auth.users(id), UNIQUE | User reference |
| `age` | INTEGER | CHECK (13-120) | User's age |
| `gender` | VARCHAR(50) | CHECK constraint | Male, Female, Non-binary, Prefer not to say |
| `height_cm` | DECIMAL(5,2) | CHECK (50-300) | Height in centimeters |
| `weight_kg` | DECIMAL(5,2) | CHECK (20-500) | Current weight in kg |
| `target_weight_kg` | DECIMAL(5,2) | CHECK (20-500) | Goal weight in kg |
| `activity_level` | VARCHAR(100) | CHECK constraint | Activity level options |
| `health_goals` | JSONB | | Array of health objectives |
| `medical_conditions` | JSONB | | Array of medical conditions |
| `medications` | JSONB | | Array of current medications |
| `bmi` | DECIMAL(4,2) | | Calculated BMI |
| `bmr` | INTEGER | | Calculated BMR |
| `daily_calorie_goal` | INTEGER | CHECK (800-5000) | Target daily calories |
| `notes` | TEXT | | Additional health notes |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update |

**Indexes:** `idx_user_health_profiles_user_id`  
**RLS:** Users can only view/edit their own health profile

#### `user_dietary_preferences`
**Purpose:** Diet restrictions, allergies, and food preferences  
**Relationships:** 1:1 with auth.users

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Auto-generated |
| `user_id` | UUID | FK to auth.users(id), UNIQUE | User reference |
| `dietary_restrictions` | TEXT[] | | Array of diet types |
| `allergies` | TEXT[] | | Array of food allergies |
| `intolerances` | TEXT[] | | Array of food intolerances |
| `liked_cuisines` | TEXT[] | | Preferred cuisine types |
| `disliked_cuisines` | TEXT[] | | Avoided cuisine types |
| `preferred_meal_types` | TEXT[] | | Meal type preferences |
| `cooking_time_preference` | VARCHAR(50) | CHECK constraint | Time preference for cooking |
| `spice_tolerance` | VARCHAR(20) | CHECK constraint | None, Mild, Medium, Hot, Very Hot |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update |

**Indexes:** `idx_user_dietary_preferences_user_id`  
**RLS:** Users can only view/edit their own preferences

### 2. Recipe Management Tables

#### `ingredients`
**Purpose:** Master database of all available ingredients  
**Relationships:** Referenced by recipe_ingredients

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Auto-generated |
| `name` | VARCHAR(255) | NOT NULL, UNIQUE | Ingredient name |
| `category` | VARCHAR(100) | CHECK constraint | Vegetables, Fruits, Proteins, etc. |
| `default_unit` | VARCHAR(50) | | Common unit (g, ml, cup, etc.) |
| `calories_per_100g` | DECIMAL(6,2) | | Calories per 100g |
| `protein_per_100g` | DECIMAL(5,2) | | Protein content per 100g |
| `carbs_per_100g` | DECIMAL(5,2) | | Carbohydrate content per 100g |
| `fat_per_100g` | DECIMAL(5,2) | | Fat content per 100g |
| `fiber_per_100g` | DECIMAL(5,2) | | Fiber content per 100g |
| `sugar_per_100g` | DECIMAL(5,2) | | Sugar content per 100g |
| `sodium_per_100g` | DECIMAL(6,2) | | Sodium content per 100g |
| `common_allergens` | TEXT[] | | Array of allergens |
| `is_vegetarian` | BOOLEAN | DEFAULT false | Vegetarian compatible |
| `is_vegan` | BOOLEAN | DEFAULT false | Vegan compatible |
| `is_gluten_free` | BOOLEAN | DEFAULT false | Gluten-free status |
| `is_dairy_free` | BOOLEAN | DEFAULT false | Dairy-free status |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update |

**Indexes:** `idx_ingredients_category`, `idx_ingredients_name`  
**RLS:** Public read, admin write

#### `recipes`
**Purpose:** Complete recipe information and metadata  
**Relationships:** Referenced by recipe_ingredients, meal_plan_recipes, user_favorite_recipes, user_recipe_ratings

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Auto-generated |
| `name` | VARCHAR(255) | NOT NULL | Recipe name |
| `description` | TEXT | | Recipe description |
| `image_url` | TEXT | | Recipe image URL |
| `prep_time_minutes` | INTEGER | CHECK (≥0) | Preparation time |
| `cook_time_minutes` | INTEGER | CHECK (≥0) | Cooking time |
| `total_time_minutes` | INTEGER | GENERATED ALWAYS | prep + cook time |
| `servings` | INTEGER | DEFAULT 4, CHECK (>0) | Number of servings |
| `difficulty` | VARCHAR(20) | CHECK constraint | Easy, Medium, Hard |
| `cuisine_type` | VARCHAR(100) | | Cuisine category |
| `meal_type` | VARCHAR(50) | CHECK constraint | Breakfast, Lunch, Dinner, Snack, Dessert |
| `diet_categories` | TEXT[] | | Array of diet types |
| `allergen_info` | TEXT[] | | Array of allergens present |
| `tags` | TEXT[] | | Searchable tags |
| `rating` | DECIMAL(2,1) | CHECK (0-5) | Average rating |
| `rating_count` | INTEGER | DEFAULT 0 | Number of ratings |
| `calories_per_serving` | INTEGER | | Calories per serving |
| `protein_g` | DECIMAL(5,2) | | Protein per serving |
| `carbs_g` | DECIMAL(5,2) | | Carbs per serving |
| `fat_g` | DECIMAL(5,2) | | Fat per serving |
| `fiber_g` | DECIMAL(5,2) | | Fiber per serving |
| `sugar_g` | DECIMAL(5,2) | | Sugar per serving |
| `sodium_mg` | INTEGER | | Sodium per serving |
| `instructions` | TEXT[] | | Step-by-step instructions |
| `tips` | TEXT | | Cooking tips |
| `video_url` | TEXT | | Recipe video URL |
| `source_url` | TEXT | | Original recipe source |
| `is_featured` | BOOLEAN | DEFAULT false | Featured recipe flag |
| `is_premium` | BOOLEAN | DEFAULT false | Premium content flag |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update |

**Indexes:** Multiple indexes on meal_type, cuisine_type, difficulty, rating, diet_categories, allergen_info, tags  
**RLS:** Public read, admin write

#### `recipe_ingredients`
**Purpose:** Junction table linking recipes to ingredients with quantities  
**Relationships:** Many-to-many between recipes and ingredients

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Auto-generated |
| `recipe_id` | UUID | FK to recipes(id), NOT NULL | Recipe reference |
| `ingredient_id` | UUID | FK to ingredients(id), NOT NULL | Ingredient reference |
| `amount` | DECIMAL(10,2) | NOT NULL, CHECK (>0) | Quantity amount |
| `unit` | VARCHAR(50) | NOT NULL | Unit of measurement |
| `notes` | TEXT | | Special instructions |
| `ingredient_order` | INTEGER | DEFAULT 0 | Display order |
| `is_optional` | BOOLEAN | DEFAULT false | Optional ingredient flag |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation |

**Indexes:** `idx_recipe_ingredients_recipe`, `idx_recipe_ingredients_ingredient`  
**RLS:** Public read, admin write

### 3. Meal Planning Tables

#### `meal_plans`
**Purpose:** User-created meal plans with date ranges  
**Relationships:** 1:many with meal_plan_recipes

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Auto-generated |
| `user_id` | UUID | FK to auth.users(id), NOT NULL | User reference |
| `name` | VARCHAR(255) | NOT NULL | Plan name |
| `description` | TEXT | | Plan description |
| `start_date` | DATE | NOT NULL | Plan start date |
| `end_date` | DATE | NOT NULL | Plan end date |
| `total_recipes` | INTEGER | DEFAULT 0 | Calculated recipe count |
| `total_calories` | INTEGER | DEFAULT 0 | Calculated total calories |
| `average_daily_calories` | INTEGER | DEFAULT 0 | Calculated daily average |
| `is_active` | BOOLEAN | DEFAULT true | Active plan flag |
| `preferences` | JSONB | | Plan-specific preferences |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update |

**Indexes:** `idx_meal_plans_user`, `idx_meal_plans_dates`, `idx_meal_plans_active`  
**RLS:** Users can only view/edit their own meal plans

#### `meal_plan_recipes`
**Purpose:** Scheduled recipes within meal plans  
**Relationships:** Many-to-one with meal_plans, many-to-one with recipes

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Auto-generated |
| `meal_plan_id` | UUID | FK to meal_plans(id), NOT NULL | Meal plan reference |
| `recipe_id` | UUID | FK to recipes(id), NOT NULL | Recipe reference |
| `scheduled_date` | DATE | NOT NULL | Scheduled date |
| `meal_type` | VARCHAR(50) | NOT NULL, CHECK constraint | Breakfast, Lunch, Dinner, etc. |
| `servings` | INTEGER | DEFAULT 1, CHECK (>0) | Number of servings |
| `is_completed` | BOOLEAN | DEFAULT false | Completion status |
| `completed_at` | TIMESTAMPTZ | | Completion timestamp |
| `notes` | TEXT | | User notes |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update |

**Indexes:** `idx_meal_plan_recipes_plan`, `idx_meal_plan_recipes_date`, `idx_meal_plan_recipes_completed`  
**RLS:** Users can only manage recipes in their own meal plans

### 4. User Interaction Tables

#### `user_favorite_recipes`
**Purpose:** User bookmarked/favorited recipes  
**Relationships:** Many-to-many between users and recipes

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Auto-generated |
| `user_id` | UUID | FK to auth.users(id), NOT NULL | User reference |
| `recipe_id` | UUID | FK to recipes(id), NOT NULL | Recipe reference |
| `notes` | TEXT | | User's personal notes |
| `tags` | TEXT[] | | User's personal tags |
| `added_at` | TIMESTAMPTZ | DEFAULT NOW() | When favorited |

**Indexes:** `idx_user_favorites_user`, `idx_user_favorites_recipe`  
**RLS:** Users can only view/manage their own favorites

#### `user_recipe_ratings`
**Purpose:** Recipe ratings, reviews, and cooking history  
**Relationships:** Many-to-many between users and recipes

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Auto-generated |
| `user_id` | UUID | FK to auth.users(id), NOT NULL | User reference |
| `recipe_id` | UUID | FK to recipes(id), NOT NULL | Recipe reference |
| `rating` | INTEGER | NOT NULL, CHECK (1-5) | Star rating |
| `review` | TEXT | | Written review |
| `made_count` | INTEGER | DEFAULT 1 | Times made |
| `last_made_date` | DATE | | Last cooking date |
| `difficulty_rating` | VARCHAR(20) | CHECK constraint | Too Easy, Just Right, Too Hard |
| `would_make_again` | BOOLEAN | | Recommendation flag |
| `photos` | TEXT[] | | Array of photo URLs |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update |

**Indexes:** `idx_user_ratings_user`, `idx_user_ratings_recipe`  
**RLS:** Public read for ratings, users can only manage their own ratings

### 5. Meal Planning System

#### `user_meal_plans`
**Purpose:** User's daily meal plans with nutritional targets  
**Relationships:** 1:many with planned_meals  
**Scalability:** Composite primary key (user_id, plan_date) for optimal user queries

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Auto-generated plan ID |
| `user_id` | UUID | FK to auth.users(id), NOT NULL | User reference |
| `plan_date` | DATE | NOT NULL | Date for this meal plan |
| `plan_name` | VARCHAR(255) | DEFAULT 'Daily Meal Plan' | Plan display name |
| `generation_method` | VARCHAR(50) | CHECK constraint | 'mock', 'ai', 'manual', 'template' |
| `plan_status` | VARCHAR(20) | CHECK constraint | 'draft', 'active', 'completed', 'archived' |
| `target_calories` | INTEGER | CHECK (>0) | Daily calorie target |
| `target_protein_g` | DECIMAL(6,2) | CHECK (≥0) | Daily protein target |
| `target_carbs_g` | DECIMAL(6,2) | CHECK (≥0) | Daily carbs target |
| `target_fat_g` | DECIMAL(6,2) | CHECK (≥0) | Daily fat target |
| `target_fiber_g` | DECIMAL(6,2) | CHECK (≥0) | Daily fiber target |
| `meals_per_day` | INTEGER | DEFAULT 3, CHECK (1-8) | Number of meals planned |
| `include_snacks` | BOOLEAN | DEFAULT true | Include snack meals |
| `dietary_preferences` | JSONB | | Array of dietary restrictions |
| `excluded_ingredients` | JSONB | | Array of ingredients to avoid |
| `total_planned_calories` | INTEGER | DEFAULT 0 | Calculated total calories |
| `total_planned_protein_g` | DECIMAL(8,2) | DEFAULT 0 | Calculated total protein |
| `total_planned_carbs_g` | DECIMAL(8,2) | DEFAULT 0 | Calculated total carbs |
| `total_planned_fat_g` | DECIMAL(8,2) | DEFAULT 0 | Calculated total fat |
| `total_meals_count` | INTEGER | DEFAULT 0 | Number of planned meals |
| `notes` | TEXT | | Plan notes |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update |

**Unique Constraint:** `(user_id, plan_date)` - One plan per user per date  
**Indexes:** 
- `(user_id, plan_date DESC)` for user meal plan queries
- `(plan_date DESC)` for system-wide date queries
- `(user_id, plan_status, plan_date DESC)` for status filtering
- `(created_at DESC)` for recent plans

**RLS:** Users can only view/manage their own meal plans

#### `planned_meals`
**Purpose:** Individual meals within user meal plans  
**Relationships:** Many-to-one with user_meal_plans, optional reference to recipes  
**Scalability:** BIGSERIAL primary key with optimized composite indexes

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | BIGSERIAL | PRIMARY KEY | Auto-incrementing meal ID |
| `meal_plan_id` | UUID | FK to user_meal_plans(id), NOT NULL | Meal plan reference |
| `user_id` | UUID | FK to auth.users(id), NOT NULL | User reference (denormalized) |
| `plan_date` | DATE | NOT NULL | Plan date (denormalized) |
| `meal_type` | VARCHAR(50) | CHECK constraint | 'breakfast', 'lunch', 'dinner', 'snack', etc. |
| `meal_order` | INTEGER | DEFAULT 1, CHECK (>0) | Order within meal type |
| `scheduled_time` | TIME | | Suggested eating time |
| `food_name` | VARCHAR(255) | NOT NULL | Name of food/dish |
| `recipe_id` | UUID | FK to recipes(id) | Optional recipe reference |
| `serving_size` | DECIMAL(4,2) | DEFAULT 1, CHECK (>0) | Serving size |
| `serving_unit` | VARCHAR(50) | DEFAULT 'serving' | Serving unit |
| `calories` | INTEGER | NOT NULL, CHECK (≥0) | Calorie content |
| `protein_g` | DECIMAL(6,2) | DEFAULT 0, CHECK (≥0) | Protein content |
| `carbs_g` | DECIMAL(6,2) | DEFAULT 0, CHECK (≥0) | Carbohydrate content |
| `fat_g` | DECIMAL(6,2) | DEFAULT 0, CHECK (≥0) | Fat content |
| `fiber_g` | DECIMAL(6,2) | DEFAULT 0, CHECK (≥0) | Fiber content |
| `sugar_g` | DECIMAL(6,2) | DEFAULT 0, CHECK (≥0) | Sugar content |
| `sodium_mg` | INTEGER | DEFAULT 0, CHECK (≥0) | Sodium content |
| `food_category` | VARCHAR(100) | | Food category |
| `preparation_method` | VARCHAR(100) | | Cooking method |
| `cooking_time_minutes` | INTEGER | CHECK (≥0) | Preparation time |
| `difficulty_level` | VARCHAR(20) | CHECK constraint | 'easy', 'medium', 'hard' |
| `substitutable` | BOOLEAN | DEFAULT true | Can be substituted |
| `priority_level` | INTEGER | DEFAULT 1, CHECK (1-5) | Priority for substitution |
| `tags` | JSONB | | Array of meal tags |
| `is_completed` | BOOLEAN | DEFAULT false | User marked as completed |
| `completed_at` | TIMESTAMPTZ | | Completion timestamp |
| `food_log_entry_id` | BIGINT | | Reference to user_food_logs |
| `notes` | TEXT | | Meal-specific notes |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update |

**Indexes:**
- `(meal_plan_id, meal_order)` for meal plan queries
- `(user_id, plan_date, meal_type, meal_order)` for user daily meals
- `(user_id, plan_date, is_completed)` for completion tracking
- `(recipe_id)` for recipe-based queries
- `(food_log_entry_id)` for food log integration

**RLS:** Users can only view/manage their own planned meals

### 6. Scalable Food Logging System

#### `user_food_logs` (Partitioned Table)
**Purpose:** Scalable storage of all user food consumption (planned meals + additional food)  
**Relationships:** Many-to-one with users, optional references to recipes and meal plans  
**Partitioning:** Monthly partitions by log_date for optimal performance

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | BIGSERIAL | PRIMARY KEY (with log_date) | Auto-incrementing ID |
| `user_id` | UUID | FK to auth.users(id), NOT NULL | User reference |
| `log_date` | DATE | NOT NULL, DEFAULT CURRENT_DATE | Date of food consumption |
| `entry_type` | VARCHAR(20) | CHECK constraint | 'planned_meal' or 'additional_food' |
| `meal_type` | VARCHAR(50) | CHECK constraint | breakfast, lunch, dinner, snack, etc. |
| `food_name` | VARCHAR(255) | NOT NULL | Name of food consumed |
| `meal_plan_recipe_id` | UUID | FK to meal_plan_recipes(id) | Reference to planned meal |
| `recipe_id` | UUID | FK to recipes(id) | Reference to recipe |
| `calories` | INTEGER | NOT NULL, CHECK (≥0) | Calorie content |
| `protein_g` | DECIMAL(6,2) | DEFAULT 0, CHECK (≥0) | Protein content |
| `carbs_g` | DECIMAL(6,2) | DEFAULT 0, CHECK (≥0) | Carbohydrate content |
| `fat_g` | DECIMAL(6,2) | DEFAULT 0, CHECK (≥0) | Fat content |
| `fiber_g` | DECIMAL(6,2) | DEFAULT 0, CHECK (≥0) | Fiber content |
| `sugar_g` | DECIMAL(6,2) | DEFAULT 0, CHECK (≥0) | Sugar content |
| `sodium_mg` | INTEGER | DEFAULT 0, CHECK (≥0) | Sodium content |
| `is_completed` | BOOLEAN | DEFAULT false | Whether meal was consumed |
| `completed_at` | TIMESTAMPTZ | | When meal was marked as completed |
| `planned_serving_size` | DECIMAL(4,2) | DEFAULT 1, CHECK (>0) | Planned portion size |
| `actual_serving_size` | DECIMAL(4,2) | CHECK (>0) | Actual portion consumed |
| `food_category` | VARCHAR(100) | | Category (protein, vegetable, etc.) |
| `preparation_method` | VARCHAR(100) | | Cooking method |
| `brand_name` | VARCHAR(255) | | Brand name for packaged foods |
| `barcode` | VARCHAR(50) | | Barcode for food scanning |
| `notes` | TEXT | | User notes |
| `photo_url` | TEXT | | Food photo URL |
| `confidence_score` | DECIMAL(3,2) | DEFAULT 1.0, CHECK (0-1) | AI recognition confidence |
| `logged_at` | TIMESTAMPTZ | DEFAULT NOW() | When entry was logged |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation |

**Partitioning Strategy:** Monthly partitions (user_food_logs_YYYY_MM)  
**Indexes:** 
- Per-partition: `(user_id, log_date DESC, entry_type)`
- Per-partition: `(user_id, log_date, is_completed)` for planned meals
- Per-partition: `(user_id, logged_at DESC)` for recent entries
- Global: `(recipe_id)`, `(meal_plan_recipe_id)`
- Global: GIN index on `food_name` for text search

**RLS:** Users can only view/manage their own food logs

#### `daily_nutrition_summary`
**Purpose:** Pre-calculated daily nutrition totals for fast dashboard queries  
**Relationships:** One-to-one with users per date

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `user_id` | UUID | FK to auth.users(id), NOT NULL | User reference |
| `log_date` | DATE | NOT NULL | Summary date |
| `planned_calories` | INTEGER | DEFAULT 0, CHECK (≥0) | Calories from planned meals |
| `planned_protein_g` | DECIMAL(8,2) | DEFAULT 0, CHECK (≥0) | Protein from planned meals |
| `planned_carbs_g` | DECIMAL(8,2) | DEFAULT 0, CHECK (≥0) | Carbs from planned meals |
| `planned_fat_g` | DECIMAL(8,2) | DEFAULT 0, CHECK (≥0) | Fat from planned meals |
| `planned_fiber_g` | DECIMAL(8,2) | DEFAULT 0, CHECK (≥0) | Fiber from planned meals |
| `planned_sugar_g` | DECIMAL(8,2) | DEFAULT 0, CHECK (≥0) | Sugar from planned meals |
| `planned_sodium_mg` | INTEGER | DEFAULT 0, CHECK (≥0) | Sodium from planned meals |
| `planned_meals_count` | INTEGER | DEFAULT 0, CHECK (≥0) | Number of planned meals |
| `completed_meals_count` | INTEGER | DEFAULT 0, CHECK (≥0) | Number of completed meals |
| `additional_calories` | INTEGER | DEFAULT 0, CHECK (≥0) | Calories from additional food |
| `additional_protein_g` | DECIMAL(8,2) | DEFAULT 0, CHECK (≥0) | Protein from additional food |
| `additional_carbs_g` | DECIMAL(8,2) | DEFAULT 0, CHECK (≥0) | Carbs from additional food |
| `additional_fat_g` | DECIMAL(8,2) | DEFAULT 0, CHECK (≥0) | Fat from additional food |
| `additional_fiber_g` | DECIMAL(8,2) | DEFAULT 0, CHECK (≥0) | Fiber from additional food |
| `additional_sugar_g` | DECIMAL(8,2) | DEFAULT 0, CHECK (≥0) | Sugar from additional food |
| `additional_sodium_mg` | INTEGER | DEFAULT 0, CHECK (≥0) | Sodium from additional food |
| `additional_entries_count` | INTEGER | DEFAULT 0, CHECK (≥0) | Number of additional entries |
| `total_calories` | INTEGER | GENERATED ALWAYS AS (planned_calories + additional_calories) STORED | Total daily calories |
| `total_protein_g` | DECIMAL(8,2) | GENERATED ALWAYS AS (planned_protein_g + additional_protein_g) STORED | Total daily protein |
| `total_carbs_g` | DECIMAL(8,2) | GENERATED ALWAYS AS (planned_carbs_g + additional_carbs_g) STORED | Total daily carbs |
| `total_fat_g` | DECIMAL(8,2) | GENERATED ALWAYS AS (planned_fat_g + additional_fat_g) STORED | Total daily fat |
| `total_fiber_g` | DECIMAL(8,2) | GENERATED ALWAYS AS (planned_fiber_g + additional_fiber_g) STORED | Total daily fiber |
| `total_sugar_g` | DECIMAL(8,2) | GENERATED ALWAYS AS (planned_sugar_g + additional_sugar_g) STORED | Total daily sugar |
| `total_sodium_mg` | INTEGER | GENERATED ALWAYS AS (planned_sodium_mg + additional_sodium_mg) STORED | Total daily sodium |
| `total_entries_count` | INTEGER | GENERATED ALWAYS AS (planned_meals_count + additional_entries_count) STORED | Total daily entries |
| `completion_percentage` | INTEGER | DEFAULT 0, CHECK (0-100) | Meal plan completion percentage |
| `calorie_goal` | INTEGER | | Daily calorie goal |
| `calorie_deficit_surplus` | INTEGER | | Difference from calorie goal |
| `first_meal_time` | TIME | | Time of first meal |
| `last_meal_time` | TIME | | Time of last meal |
| `eating_window_hours` | DECIMAL(4,2) | | Hours between first and last meal |
| `whole_foods_percentage` | DECIMAL(5,2) | DEFAULT 0 | Percentage of unprocessed foods |
| `meal_plan_adherence_percentage` | DECIMAL(5,2) | DEFAULT 0 | Adherence to meal plan |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update |

**Primary Key:** `(user_id, log_date)`  
**Indexes:** `(user_id, log_date DESC)`, `(log_date DESC)`, `(updated_at DESC)`  
**RLS:** Users can only view/manage their own summaries

#### `user_food_logs_archive`
**Purpose:** Archive storage for food logs older than 2 years  
**Structure:** Same as user_food_logs but without partitioning  
**RLS:** Users can only view their own archived data

#### `food_categories`
**Purpose:** Lookup table for food categories  
**Relationships:** Referenced by user_food_logs.food_category

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Auto-incrementing ID |
| `name` | VARCHAR(100) | UNIQUE, NOT NULL | Category name |
| `description` | TEXT | | Category description |
| `color_hex` | VARCHAR(7) | | UI color code |
| `icon_name` | VARCHAR(50) | | UI icon identifier |
| `is_whole_food` | BOOLEAN | DEFAULT false | Whether category represents whole foods |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation |

**Initial Data:** Protein, Vegetables, Fruits, Grains, Dairy, Fats, Beverages, Snacks, Desserts, Fast Food

---

## Database Functions & Triggers

### Automatic Functions

1. **`update_updated_at_column()`**
   - Updates `updated_at` timestamp on record changes
   - Applied to all tables with `updated_at` columns

2. **`update_recipe_rating()`**
   - Recalculates recipe average rating and count
   - Triggered on user_recipe_ratings changes

3. **`update_meal_plan_totals()`**
   - Recalculates meal plan totals and averages
   - Triggered on meal_plan_recipes changes

4. **`update_daily_nutrition_summary()`**
   - Recalculates daily nutrition totals from food logs
   - Triggered on user_food_logs INSERT/UPDATE/DELETE
   - Updates planned vs additional food statistics
   - Calculates completion percentages

### Partition Management Functions

5. **`create_monthly_partition(partition_date)`**
   - Creates monthly partition for user_food_logs
   - Automatically creates optimized indexes
   - Returns partition creation status

6. **`maintain_food_log_partitions()`**
   - Maintains partitions for current + next 3 months
   - Scheduled to run monthly via pg_cron
   - Logs maintenance activities

7. **`archive_old_food_logs()`**
   - Archives food logs older than 2 years
   - Moves data to user_food_logs_archive
   - Scheduled to run quarterly via pg_cron

### Utility Functions

8. **`get_user_daily_food_log(user_id, date)`**
   - Returns complete daily food log with summary
   - Optimized query combining summary and detailed data
   - Returns JSON formatted results

### Row Level Security (RLS) Policies

- **User Data Tables:** Users can only access their own data
- **Recipe Tables:** Public read access, admin write access
- **Ingredient Tables:** Public read access, admin write access

---

## Migration History

| Migration File | Date | Description | Status |
|----------------|------|-------------|--------|
| `20250131_user_onboarding_simplified.sql` | 2025-01-31 | User profile tables | ✅ Applied |
| `20250131_add_health_fields.sql` | 2025-01-31 | Additional health fields | ✅ Applied |
| `20250201_recipe_meal_planning_system.sql` | 2025-02-01 | Recipe and meal planning system | ⚠️ Optional |
| `20250201_scalable_food_logging_system_standalone.sql` | 2025-02-01 | **Scalable food logging (standalone)** | ✅ Applied |
| `20250201_database_fixes_and_meal_plans.sql` | 2025-02-01 | **Database fixes + meal planning system** | 🚀 New |

### **🔄 Migration Notes:**
- **Standalone food logging** works without recipe system
- **Meal planning system** is fully integrated with food logging
- **Database cleanup** removes deprecated tables
- **Email integration** added to user_profiles

---

## Data Relationships Diagram

### **🏗️ Core System Architecture**

```
auth.users (Supabase Authentication)
├── user_profiles (1:1) [includes email]
├── user_health_profiles (1:1)
├── user_dietary_preferences (1:1)
│
├── 🍽️ MEAL PLANNING SYSTEM
├── user_meal_plans (1:many, 1 per day)
│   └── planned_meals (1:many)
│       ├── recipes (many:1) [optional]
│       └── food_log_entry_id → user_food_logs
│
├── 📊 FOOD TRACKING SYSTEM [PARTITIONED]
├── user_food_logs (1:many) [monthly partitions]
│   ├── planned_meals (1:1) [via food_log_entry_id]
│   ├── recipes (many:1) [optional]
│   └── food_categories (many:1) [optional]
├── daily_nutrition_summary (1:many, 1 per day)
└── user_food_logs_archive (1:many) [>2 years]

📖 RECIPE SYSTEM [OPTIONAL]
recipes (master data)
├── recipe_ingredients (1:many)
│   └── ingredients (many:1)
├── user_favorite_recipes (many:many with users)
├── user_recipe_ratings (many:many with users)
└── planned_meals (1:many) [optional reference]

🏷️ LOOKUP TABLES
food_categories (lookup data)
└── user_food_logs (1:many)

🛠️ SYSTEM TABLES
maintenance_logs (system operations)
```

### **🔗 Key Integrations**

1. **Meal Planning → Food Logging:**
   - `planned_meals.food_log_entry_id` → `user_food_logs.id`
   - When user completes planned meal → automatic food log entry

2. **Food Logging → Nutrition Summary:**
   - `user_food_logs` → `daily_nutrition_summary` (via triggers)
   - Real-time nutrition calculation

3. **User Data Integration:**
   - All user tables linked via `user_id`
   - Composite indexes for fast user-specific queries

---

## Performance Considerations

### Indexes Strategy
- **Primary keys:** All tables have UUID primary keys
- **Foreign keys:** All foreign key columns are indexed
- **Search fields:** Meal type, cuisine, difficulty, rating indexed
- **Array fields:** GIN indexes on diet_categories, allergen_info, tags
- **User queries:** User-specific queries optimized with user_id indexes

### Query Optimization
- **Recipe search:** Full-text search capabilities on name and description
- **Filtering:** Efficient filtering on indexed columns
- **Aggregations:** Pre-calculated values for meal plan totals
- **Pagination:** Cursor-based pagination for large result sets

---

## Security Model

### Row Level Security (RLS)
- **Enabled on all tables**
- **User isolation:** Users can only access their own data
- **Public recipes:** Recipe content is publicly readable
- **Admin access:** Service role can manage all data

### Authentication
- **Supabase Auth:** JWT-based authentication
- **User context:** `auth.uid()` function provides current user ID
- **Role-based:** Different policies for authenticated users vs. service role

---

## Backup & Maintenance

### Backup Strategy
- **Daily backups:** Automated Supabase backups
- **Point-in-time recovery:** Available for 7 days
- **Migration tracking:** All schema changes versioned

### Maintenance Tasks
- **Index maintenance:** Monitor query performance
- **Data cleanup:** Archive old meal plans and ratings
- **Statistics update:** Keep PostgreSQL statistics current

---

## Future Enhancements

### Planned Features
1. **Recipe collections:** User-created recipe collections
2. **Shopping lists:** Auto-generated from meal plans
3. **Nutrition tracking:** Daily nutrition log integration
4. **Social features:** Recipe sharing and community ratings
5. **AI recommendations:** ML-based recipe suggestions

### Schema Extensions
1. **`recipe_collections`** table for user collections
2. **`shopping_lists`** and **`shopping_list_items`** tables
3. **`daily_nutrition_logs`** for tracking intake
4. **`recipe_shares`** for social features
5. **`user_preferences_ml`** for AI recommendations

---

*This document is automatically updated with each database migration. For questions or clarifications, refer to the migration files in `/supabase/migrations/`.*