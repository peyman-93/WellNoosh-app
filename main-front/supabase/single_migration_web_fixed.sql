-- WellNoosh Database Setup - Fixed Web-Compatible Migration
-- This version fixes the IMMUTABLE function error
-- Copy and paste this ENTIRE script into Supabase SQL Editor and click RUN

-- ============================================================================
-- STARTING WELLNOOSH DATABASE SETUP
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- PHASE 1: ENHANCED USER MANAGEMENT TABLES
-- ============================================================================

-- Create users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    
    -- Profile Information
    country TEXT,
    city TEXT,
    postal_code TEXT,
    phone TEXT,
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'non-binary', 'prefer-not-to-say')),
    
    -- Physical Characteristics
    height_cm INTEGER CHECK (height_cm > 0 AND height_cm < 300),
    weight_kg DECIMAL(5,2) CHECK (weight_kg > 0 AND weight_kg < 1000),
    
    -- Preferences
    preferred_units JSONB DEFAULT '{"weight": "kg", "height": "cm", "temperature": "celsius"}',
    timezone TEXT DEFAULT 'UTC',
    language_code TEXT DEFAULT 'en',
    
    -- Status & Tracking
    account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'pending')),
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    last_active_at TIMESTAMPTZ,
    
    -- Onboarding Progress
    onboarding_completed BOOLEAN DEFAULT FALSE,
    onboarding_step INTEGER DEFAULT 0,
    profile_completed BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_preferences table
CREATE TABLE public.user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Dietary Preferences
    diet_types TEXT[] DEFAULT '{}',
    allergies TEXT[] DEFAULT '{}',
    food_dislikes TEXT[] DEFAULT '{}',
    cuisine_preferences TEXT[] DEFAULT '{}',
    
    -- Cooking Preferences
    cooking_skill_level TEXT DEFAULT 'beginner' CHECK (cooking_skill_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
    max_cooking_time_minutes INTEGER DEFAULT 60,
    preferred_meal_prep_day TEXT DEFAULT 'sunday',
    kitchen_equipment TEXT[] DEFAULT '{}',
    
    -- Lifestyle Preferences
    activity_level TEXT DEFAULT 'moderately_active' CHECK (activity_level IN ('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active')),
    meals_per_day INTEGER DEFAULT 3 CHECK (meals_per_day BETWEEN 1 AND 10),
    snacks_per_day INTEGER DEFAULT 2 CHECK (snacks_per_day BETWEEN 0 AND 10),
    
    -- Notification Preferences
    notifications JSONB DEFAULT '{
        "meal_reminders": true,
        "grocery_reminders": true,
        "recipe_suggestions": true,
        "nutrition_alerts": true,
        "social_updates": true
    }',
    
    -- Privacy Settings
    privacy_settings JSONB DEFAULT '{
        "profile_visibility": "friends",
        "activity_sharing": true,
        "recipe_sharing": true,
        "stats_sharing": false
    }',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_health_profiles table
CREATE TABLE public.user_health_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Health Goals
    primary_health_goal TEXT CHECK (primary_health_goal IN (
        'weight_loss', 'weight_gain', 'muscle_gain', 'maintenance', 
        'heart_health', 'diabetes_management', 'digestive_health', 
        'energy_boost', 'athletic_performance', 'general_wellness'
    )),
    target_weight_kg DECIMAL(5,2),
    target_date DATE,
    
    -- Medical Information
    medical_conditions TEXT[] DEFAULT '{}',
    medications TEXT[] DEFAULT '{}',
    supplements TEXT[] DEFAULT '{}',
    
    -- Nutritional Targets (daily)
    target_calories INTEGER,
    target_protein_g DECIMAL(6,2),
    target_carbs_g DECIMAL(6,2),
    target_fat_g DECIMAL(6,2),
    target_fiber_g DECIMAL(5,2),
    target_sodium_mg DECIMAL(7,2),
    target_sugar_g DECIMAL(6,2),
    
    -- Micronutrient Targets (daily)
    micronutrient_targets JSONB DEFAULT '{
        "vitamin_a_mcg": 900,
        "vitamin_c_mg": 90,
        "vitamin_d_mcg": 20,
        "vitamin_e_mg": 15,
        "vitamin_k_mcg": 120,
        "thiamine_mg": 1.2,
        "riboflavin_mg": 1.3,
        "niacin_mg": 16,
        "vitamin_b6_mg": 1.7,
        "folate_mcg": 400,
        "vitamin_b12_mcg": 2.4,
        "calcium_mg": 1000,
        "iron_mg": 8,
        "magnesium_mg": 400,
        "phosphorus_mg": 700,
        "potassium_mg": 4700,
        "zinc_mg": 11
    }',
    
    -- Health Tracking
    bmr_calories INTEGER,
    tdee_calories INTEGER,
    body_fat_percentage DECIMAL(4,2),
    muscle_mass_kg DECIMAL(5,2),
    
    -- Health Notes
    health_notes TEXT,
    doctor_recommendations TEXT,
    
    -- Validity & Tracking
    is_active BOOLEAN DEFAULT TRUE,
    created_by_professional BOOLEAN DEFAULT FALSE,
    last_reviewed_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_activity_logs table
CREATE TABLE public.user_activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Activity Information
    activity_type TEXT NOT NULL CHECK (activity_type IN (
        'login', 'logout', 'recipe_view', 'recipe_save', 'recipe_cook', 'recipe_rate',
        'meal_log', 'weight_log', 'profile_update', 'preferences_update',
        'grocery_add', 'grocery_remove', 'meal_plan_create', 'meal_plan_update',
        'circle_join', 'circle_leave', 'challenge_join', 'achievement_unlock'
    )),
    activity_details JSONB,
    
    -- Session & Context
    session_id TEXT,
    ip_address INET,
    user_agent TEXT,
    device_type TEXT,
    platform TEXT,
    app_version TEXT,
    
    -- Timing
    activity_duration_seconds INTEGER,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    
    -- Metadata
    metadata JSONB DEFAULT '{}'
);

-- Create user_sessions table for detailed session tracking
CREATE TABLE public.user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    session_token TEXT NOT NULL UNIQUE,
    
    -- Session Details
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Device & Browser Info
    device_info JSONB DEFAULT '{}',
    location_info JSONB DEFAULT '{}',
    
    -- Session Metrics
    pages_visited INTEGER DEFAULT 0,
    actions_performed INTEGER DEFAULT 0,
    time_spent_seconds INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_achievements table
CREATE TABLE public.user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    achievement_type TEXT NOT NULL CHECK (achievement_type IN (
        'first_recipe', 'recipe_master', 'healthy_week', 'meal_prep_pro',
        'nutrition_tracker', 'social_chef', 'budget_saver', 'waste_warrior',
        'skill_builder', 'consistency_champion', 'explorer', 'helper'
    )),
    achievement_name TEXT NOT NULL,
    achievement_description TEXT,
    
    -- Progress Tracking
    current_progress INTEGER DEFAULT 0,
    target_progress INTEGER DEFAULT 1,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    
    -- Metadata
    achievement_data JSONB DEFAULT '{}',
    points_earned INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, achievement_type)
);

-- ============================================================================
-- FOODS AND NUTRITION TABLES (PHASE 2)
-- ============================================================================

-- Foods master table (ingredients and food items)
CREATE TABLE public.foods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Basic Information
    name TEXT NOT NULL,
    name_scientific TEXT,
    description TEXT,
    food_category TEXT NOT NULL,
    food_subcategory TEXT,
    
    -- Identifiers
    barcode TEXT,
    fdc_id TEXT,
    external_ids JSONB DEFAULT '{}',
    
    -- Physical Properties
    density_g_per_ml DECIMAL(6,3),
    default_serving_size DECIMAL(8,2) DEFAULT 100,
    default_serving_unit TEXT DEFAULT 'g',
    
    -- Nutritional Information (per 100g)
    calories_per_100g DECIMAL(7,2),
    protein_g_per_100g DECIMAL(6,2),
    total_fat_g_per_100g DECIMAL(6,2),
    saturated_fat_g_per_100g DECIMAL(6,2),
    trans_fat_g_per_100g DECIMAL(6,2),
    monounsaturated_fat_g_per_100g DECIMAL(6,2),
    polyunsaturated_fat_g_per_100g DECIMAL(6,2),
    omega_3_g_per_100g DECIMAL(6,2),
    omega_6_g_per_100g DECIMAL(6,2),
    cholesterol_mg_per_100g DECIMAL(6,2),
    
    carbs_total_g_per_100g DECIMAL(6,2),
    fiber_g_per_100g DECIMAL(6,2),
    sugar_total_g_per_100g DECIMAL(6,2),
    sugar_added_g_per_100g DECIMAL(6,2),
    starch_g_per_100g DECIMAL(6,2),
    
    sodium_mg_per_100g DECIMAL(7,2),
    potassium_mg_per_100g DECIMAL(7,2),
    
    -- Micronutrients per 100g
    micronutrients_per_100g JSONB DEFAULT '{
        "vitamin_a_mcg": 0, "vitamin_c_mg": 0, "vitamin_d_mcg": 0,
        "vitamin_e_mg": 0, "vitamin_k_mcg": 0, "thiamine_mg": 0,
        "riboflavin_mg": 0, "niacin_mg": 0, "pantothenic_acid_mg": 0,
        "vitamin_b6_mg": 0, "biotin_mcg": 0, "folate_mcg": 0,
        "vitamin_b12_mcg": 0, "choline_mg": 0,
        "calcium_mg": 0, "iron_mg": 0, "magnesium_mg": 0,
        "phosphorus_mg": 0, "zinc_mg": 0, "copper_mg": 0,
        "manganese_mg": 0, "selenium_mcg": 0, "iodine_mcg": 0,
        "chromium_mcg": 0, "molybdenum_mcg": 0
    }',
    
    -- Additional Properties
    glycemic_index INTEGER CHECK (glycemic_index BETWEEN 0 AND 100),
    glycemic_load DECIMAL(5,2),
    antioxidant_score DECIMAL(8,2),
    phytonutrients JSONB DEFAULT '{}',
    
    -- Allergen Information
    common_allergens TEXT[] DEFAULT '{}',
    
    -- Sustainability & Origin
    carbon_footprint_kg_co2_per_kg DECIMAL(6,3),
    water_footprint_l_per_kg DECIMAL(8,2),
    seasonality JSONB DEFAULT '{}',
    origin_countries TEXT[] DEFAULT '{}',
    
    -- Quality & Verification
    data_source TEXT,
    verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('verified', 'pending', 'flagged')),
    last_verified_at TIMESTAMPTZ,
    
    -- Usage Statistics
    usage_count INTEGER DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily nutrition summaries
CREATE TABLE public.daily_nutrition_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    
    -- Macronutrients (actual consumed)
    total_calories DECIMAL(8,2) DEFAULT 0,
    total_protein_g DECIMAL(8,2) DEFAULT 0,
    total_carbs_g DECIMAL(8,2) DEFAULT 0,
    total_fat_g DECIMAL(8,2) DEFAULT 0,
    total_fiber_g DECIMAL(8,2) DEFAULT 0,
    total_sodium_mg DECIMAL(8,2) DEFAULT 0,
    total_sugar_g DECIMAL(8,2) DEFAULT 0,
    
    -- Micronutrients (actual consumed)
    micronutrients_consumed JSONB DEFAULT '{}',
    
    -- Hydration
    water_ml INTEGER DEFAULT 0,
    
    -- Meal Distribution
    meals_logged INTEGER DEFAULT 0,
    snacks_logged INTEGER DEFAULT 0,
    
    -- Quality Metrics
    vegetable_servings DECIMAL(4,1) DEFAULT 0,
    fruit_servings DECIMAL(4,1) DEFAULT 0,
    whole_grain_servings DECIMAL(4,1) DEFAULT 0,
    processed_food_score DECIMAL(4,1) DEFAULT 0,
    
    -- Achievement Tracking
    targets_met JSONB DEFAULT '{}',
    nutrition_score DECIMAL(4,1),
    
    -- Calculation Status
    is_complete BOOLEAN DEFAULT FALSE,
    last_calculated_at TIMESTAMPTZ DEFAULT NOW(),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, date)
);

-- Individual meal logs
CREATE TABLE public.meal_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    daily_summary_id UUID REFERENCES public.daily_nutrition_summaries(id) ON DELETE CASCADE,
    
    -- Meal Information
    meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack', 'beverage')),
    meal_name TEXT,
    meal_time TIMESTAMPTZ NOT NULL,
    
    -- Recipe Connection (if applicable)
    recipe_id UUID,
    recipe_serving_size DECIMAL(4,2),
    
    -- Location & Context
    location TEXT,
    meal_context TEXT,
    
    -- Nutritional Totals for this meal
    total_calories DECIMAL(8,2) DEFAULT 0,
    total_protein_g DECIMAL(8,2) DEFAULT 0,
    total_carbs_g DECIMAL(8,2) DEFAULT 0,
    total_fat_g DECIMAL(8,2) DEFAULT 0,
    total_fiber_g DECIMAL(8,2) DEFAULT 0,
    total_sodium_mg DECIMAL(8,2) DEFAULT 0,
    
    -- User Experience
    satisfaction_rating INTEGER CHECK (satisfaction_rating BETWEEN 1 AND 5),
    hunger_before INTEGER CHECK (hunger_before BETWEEN 1 AND 10),
    fullness_after INTEGER CHECK (fullness_after BETWEEN 1 AND 10),
    energy_after INTEGER CHECK (energy_after BETWEEN 1 AND 10),
    
    -- Notes
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- RECIPES TABLES (PHASE 3)
-- ============================================================================

-- Main recipes table (without the problematic GENERATED column)
CREATE TABLE public.recipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Basic Information
    name TEXT NOT NULL,
    description TEXT,
    cuisine_type TEXT,
    meal_type TEXT[] DEFAULT '{}',
    
    -- Recipe Meta
    author_id UUID REFERENCES public.users(id),
    source_url TEXT,
    source_type TEXT DEFAULT 'user_created' CHECK (source_type IN ('user_created', 'imported', 'ai_generated', 'professional')),
    
    -- Cooking Information
    prep_time_minutes INTEGER CHECK (prep_time_minutes >= 0),
    cook_time_minutes INTEGER CHECK (cook_time_minutes >= 0),
    total_time_minutes INTEGER, -- Will be calculated manually instead of GENERATED
    difficulty_level TEXT DEFAULT 'medium' CHECK (difficulty_level IN ('easy', 'medium', 'hard', 'expert')),
    servings INTEGER DEFAULT 4 CHECK (servings > 0),
    
    -- Equipment & Skills
    required_equipment TEXT[] DEFAULT '{}',
    cooking_methods TEXT[] DEFAULT '{}',
    skill_level TEXT DEFAULT 'beginner' CHECK (skill_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
    
    -- Dietary & Health
    dietary_tags TEXT[] DEFAULT '{}',
    allergen_warnings TEXT[] DEFAULT '{}',
    health_labels TEXT[] DEFAULT '{}',
    
    -- Nutritional Information (per serving)
    calories_per_serving DECIMAL(8,2),
    protein_per_serving_g DECIMAL(6,2),
    carbs_per_serving_g DECIMAL(6,2),
    fat_per_serving_g DECIMAL(6,2),
    fiber_per_serving_g DECIMAL(6,2),
    sodium_per_serving_mg DECIMAL(7,2),
    sugar_per_serving_g DECIMAL(6,2),
    
    -- Detailed nutrition per serving
    nutrition_per_serving JSONB DEFAULT '{}',
    
    -- Recipe Quality & Engagement
    average_rating DECIMAL(3,2) DEFAULT 0 CHECK (average_rating BETWEEN 0 AND 5),
    total_ratings INTEGER DEFAULT 0,
    total_saves INTEGER DEFAULT 0,
    total_made INTEGER DEFAULT 0,
    
    -- Cost & Sustainability
    estimated_cost_usd DECIMAL(6,2),
    sustainability_score DECIMAL(4,2),
    carbon_footprint_kg DECIMAL(6,3),
    
    -- Recipe Status
    is_public BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_date TIMESTAMPTZ,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived', 'flagged')),
    
    -- AI Enhancement
    ai_generated_tags TEXT[] DEFAULT '{}',
    ai_confidence_score DECIMAL(4,3),
    last_ai_analysis TIMESTAMPTZ,
    
    -- Media
    primary_image_url TEXT,
    image_urls TEXT[] DEFAULT '{}',
    video_url TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ
);

-- Recipe saves/bookmarks
CREATE TABLE public.recipe_saves (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Save Information
    collection_name TEXT,
    notes TEXT,
    tags TEXT[] DEFAULT '{}',
    
    -- Usage Tracking
    times_cooked INTEGER DEFAULT 0,
    last_cooked_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(recipe_id, user_id)
);

-- ============================================================================
-- CIRCLES TABLES (PHASE 4)
-- ============================================================================

-- Main circles table (renamed from families to be more inclusive)
CREATE TABLE public.circles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Circle Information
    name TEXT NOT NULL,
    description TEXT,
    circle_type TEXT DEFAULT 'family' CHECK (circle_type IN (
        'family', 'friends', 'roommates', 'colleagues', 'community', 'club', 'other'
    )),
    
    -- Settings
    max_members INTEGER DEFAULT 20 CHECK (max_members BETWEEN 2 AND 100),
    is_public BOOLEAN DEFAULT FALSE,
    requires_approval BOOLEAN DEFAULT TRUE,
    
    -- Circle Preferences
    shared_dietary_restrictions TEXT[] DEFAULT '{}',
    shared_cuisine_preferences TEXT[] DEFAULT '{}',
    budget_range TEXT,
    cooking_skill_range TEXT,
    
    -- Meal Sharing Settings
    meal_planning_enabled BOOLEAN DEFAULT TRUE,
    grocery_sharing_enabled BOOLEAN DEFAULT TRUE,
    recipe_sharing_enabled BOOLEAN DEFAULT TRUE,
    nutrition_sharing_enabled BOOLEAN DEFAULT FALSE,
    
    -- Privacy Settings
    activity_visibility TEXT DEFAULT 'circle_only' CHECK (activity_visibility IN (
        'circle_only', 'friends_of_members', 'public'
    )),
    
    -- Circle Status
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    
    -- Location (for local recommendations)
    city TEXT,
    country TEXT,
    timezone TEXT DEFAULT 'UTC',
    
    -- Visual
    avatar_url TEXT,
    cover_image_url TEXT,
    color_theme TEXT,
    
    -- Statistics
    total_members INTEGER DEFAULT 0,
    total_meals_planned INTEGER DEFAULT 0,
    total_recipes_shared INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Circle memberships with roles and permissions
CREATE TABLE public.circle_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    circle_id UUID NOT NULL REFERENCES public.circles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Membership Information
    role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member', 'guest')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'banned')),
    
    -- Permissions
    can_plan_meals BOOLEAN DEFAULT TRUE,
    can_manage_grocery BOOLEAN DEFAULT TRUE,
    can_add_recipes BOOLEAN DEFAULT TRUE,
    can_invite_members BOOLEAN DEFAULT FALSE,
    can_moderate BOOLEAN DEFAULT FALSE,
    
    -- Member Preferences within Circle
    display_name TEXT,
    notification_preferences JSONB DEFAULT '{
        "meal_plans": true,
        "grocery_updates": true,
        "recipe_shares": true,
        "member_activity": true,
        "challenges": true
    }',
    
    -- Participation Stats
    meals_planned INTEGER DEFAULT 0,
    recipes_shared INTEGER DEFAULT 0,
    grocery_contributions INTEGER DEFAULT 0,
    last_active_at TIMESTAMPTZ,
    
    -- Joining Information
    invited_by_user_id UUID REFERENCES public.users(id),
    invitation_message TEXT,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(circle_id, user_id)
);

-- ============================================================================
-- MEAL PLANNING TABLES (PHASE 5)
-- ============================================================================

-- User meal plans (individual meal planning)
CREATE TABLE public.user_meal_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Plan Information
    plan_name TEXT NOT NULL,
    description TEXT,
    plan_type TEXT DEFAULT 'weekly' CHECK (plan_type IN ('daily', 'weekly', 'monthly', 'custom')),
    
    -- Time Period
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    
    -- Planning Goals & Constraints
    target_calories_per_day INTEGER,
    target_budget_usd DECIMAL(8,2),
    dietary_goals TEXT[] DEFAULT '{}',
    meal_prep_preference TEXT DEFAULT 'mixed' CHECK (meal_prep_preference IN ('none', 'partial', 'full', 'mixed')),
    
    -- Cooking Preferences
    max_cooking_time_per_meal INTEGER DEFAULT 60,
    preferred_cooking_days INTEGER[] DEFAULT '{}',
    kitchen_equipment_available TEXT[] DEFAULT '{}',
    
    -- Plan Status
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'abandoned', 'template')),
    completion_percentage DECIMAL(5,2) DEFAULT 0,
    
    -- AI & Automation
    auto_generate_enabled BOOLEAN DEFAULT FALSE,
    ai_optimization_enabled BOOLEAN DEFAULT TRUE,
    learning_from_feedback BOOLEAN DEFAULT TRUE,
    
    -- Template & Sharing
    is_template BOOLEAN DEFAULT FALSE,
    is_shareable BOOLEAN DEFAULT FALSE,
    template_category TEXT,
    
    -- Statistics
    total_planned_meals INTEGER DEFAULT 0,
    total_estimated_cost DECIMAL(8,2) DEFAULT 0,
    total_actual_cost DECIMAL(8,2) DEFAULT 0,
    adherence_rate DECIMAL(5,2) DEFAULT 0,
    
    -- Nutritional Tracking
    average_daily_calories DECIMAL(8,2),
    average_daily_protein_g DECIMAL(6,2),
    average_daily_carbs_g DECIMAL(6,2),
    average_daily_fat_g DECIMAL(6,2),
    nutrition_score DECIMAL(4,2),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SHOPPING & INVENTORY TABLES (PHASE 6)
-- ============================================================================

-- User pantry/inventory items
CREATE TABLE public.user_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    food_id UUID REFERENCES public.foods(id),
    
    -- Item Information
    item_name TEXT NOT NULL,
    brand TEXT,
    variety TEXT,
    
    -- Quantity & Storage
    current_quantity DECIMAL(8,3) NOT NULL CHECK (current_quantity >= 0),
    unit TEXT NOT NULL,
    storage_location TEXT DEFAULT 'pantry' CHECK (storage_location IN (
        'pantry', 'refrigerator', 'freezer', 'counter', 'spice_rack', 'other'
    )),
    
    -- Expiration & Freshness
    purchase_date DATE,
    expiration_date DATE,
    best_by_date DATE,
    freshness_status TEXT DEFAULT 'fresh' CHECK (freshness_status IN (
        'fresh', 'good', 'use_soon', 'expired', 'spoiled'
    )),
    
    -- Cost Tracking
    purchase_price_usd DECIMAL(8,2),
    price_per_unit DECIMAL(8,3),
    total_cost_usd DECIMAL(8,2),
    
    -- Usage Tracking
    times_used INTEGER DEFAULT 0,
    last_used_date DATE,
    typical_usage_rate DECIMAL(6,3),
    
    -- Inventory Management
    minimum_threshold DECIMAL(8,3),
    preferred_stock_level DECIMAL(8,3),
    auto_reorder_enabled BOOLEAN DEFAULT FALSE,
    
    -- Source & Purchase Info
    purchased_from TEXT,
    purchase_method TEXT DEFAULT 'store' CHECK (purchase_method IN ('store', 'online', 'delivery', 'bulk', 'gift')),
    
    -- Item Properties
    is_staple BOOLEAN DEFAULT FALSE,
    is_perishable BOOLEAN DEFAULT TRUE,
    estimated_shelf_life_days INTEGER,
    
    -- Notes & Tracking
    notes TEXT,
    tags TEXT[] DEFAULT '{}',
    
    -- Status
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'used_up', 'expired', 'donated')),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual shopping lists
CREATE TABLE public.shopping_lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    meal_plan_id UUID REFERENCES public.user_meal_plans(id),
    circle_id UUID REFERENCES public.circles(id),
    
    -- List Information
    list_name TEXT NOT NULL,
    description TEXT,
    list_type TEXT DEFAULT 'personal' CHECK (list_type IN ('personal', 'meal_plan', 'circle_shared', 'bulk_shopping', 'emergency')),
    
    -- Shopping Details
    target_budget_usd DECIMAL(8,2),
    preferred_stores TEXT[] DEFAULT '{}',
    shopping_date DATE,
    shopping_time TIME,
    
    -- List Organization
    organize_by TEXT DEFAULT 'category' CHECK (organize_by IN ('category', 'store_layout', 'priority', 'recipe', 'custom')),
    store_layout_template TEXT,
    
    -- Smart Features
    auto_optimize_route BOOLEAN DEFAULT TRUE,
    price_comparison_enabled BOOLEAN DEFAULT TRUE,
    substitute_suggestions_enabled BOOLEAN DEFAULT TRUE,
    
    -- Status & Progress
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'shopping', 'completed', 'archived')),
    completion_percentage DECIMAL(5,2) DEFAULT 0,
    
    -- Cost Tracking
    estimated_total_cost DECIMAL(8,2) DEFAULT 0,
    actual_total_cost DECIMAL(8,2),
    budget_variance DECIMAL(8,2),
    
    -- Shopping Session
    shopping_started_at TIMESTAMPTZ,
    shopping_completed_at TIMESTAMPTZ,
    shopping_duration_minutes INTEGER,
    
    -- Sharing & Collaboration
    is_shared BOOLEAN DEFAULT FALSE,
    shared_with_users UUID[] DEFAULT '{}',
    allow_others_to_edit BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CREATE INDEXES FOR PERFORMANCE (Without GIN indexes on arrays for now)
-- ============================================================================

-- User table indexes
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_last_active ON public.users(last_active_at);
CREATE INDEX idx_users_onboarding ON public.users(onboarding_completed, profile_completed);

-- User preferences indexes
CREATE INDEX idx_user_preferences_user_id ON public.user_preferences(user_id);

-- Foods indexes
CREATE INDEX idx_foods_name ON public.foods(name);
CREATE INDEX idx_foods_category ON public.foods(food_category);
CREATE INDEX idx_foods_active ON public.foods(is_active);

-- Daily nutrition indexes
CREATE INDEX idx_daily_nutrition_user_date ON public.daily_nutrition_summaries(user_id, date);
CREATE INDEX idx_daily_nutrition_date ON public.daily_nutrition_summaries(date);

-- Meal logs indexes
CREATE INDEX idx_meal_logs_user_id ON public.meal_logs(user_id);
CREATE INDEX idx_meal_logs_meal_time ON public.meal_logs(meal_time);

-- Recipe indexes
CREATE INDEX idx_recipes_author ON public.recipes(author_id);
CREATE INDEX idx_recipes_status ON public.recipes(status, is_public);

-- Recipe saves indexes
CREATE INDEX idx_recipe_saves_user ON public.recipe_saves(user_id);
CREATE INDEX idx_recipe_saves_recipe ON public.recipe_saves(recipe_id);

-- Circle indexes
CREATE INDEX idx_circles_type ON public.circles(circle_type);
CREATE INDEX idx_circles_public ON public.circles(is_public, status);

-- Circle memberships indexes
CREATE INDEX idx_circle_memberships_circle ON public.circle_memberships(circle_id);
CREATE INDEX idx_circle_memberships_user ON public.circle_memberships(user_id);
CREATE INDEX idx_circle_memberships_status ON public.circle_memberships(status);

-- Meal plan indexes
CREATE INDEX idx_user_meal_plans_user ON public.user_meal_plans(user_id);
CREATE INDEX idx_user_meal_plans_dates ON public.user_meal_plans(start_date, end_date);
CREATE INDEX idx_user_meal_plans_status ON public.user_meal_plans(status);

-- Inventory indexes
CREATE INDEX idx_user_inventory_user ON public.user_inventory(user_id);
CREATE INDEX idx_user_inventory_food ON public.user_inventory(food_id);
CREATE INDEX idx_user_inventory_expiration ON public.user_inventory(expiration_date, freshness_status);

-- Shopping list indexes
CREATE INDEX idx_shopping_lists_user ON public.shopping_lists(user_id);
CREATE INDEX idx_shopping_lists_circle ON public.shopping_lists(circle_id);
CREATE INDEX idx_shopping_lists_status ON public.shopping_lists(status);

-- ============================================================================
-- CREATE UPDATED_AT TRIGGERS
-- ============================================================================

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_health_profiles_updated_at BEFORE UPDATE ON public.user_health_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_foods_updated_at BEFORE UPDATE ON public.foods
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_nutrition_summaries_updated_at BEFORE UPDATE ON public.daily_nutrition_summaries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meal_logs_updated_at BEFORE UPDATE ON public.meal_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recipes_updated_at BEFORE UPDATE ON public.recipes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recipe_saves_updated_at BEFORE UPDATE ON public.recipe_saves
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_circles_updated_at BEFORE UPDATE ON public.circles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_circle_memberships_updated_at BEFORE UPDATE ON public.circle_memberships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_meal_plans_updated_at BEFORE UPDATE ON public.user_meal_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_inventory_updated_at BEFORE UPDATE ON public.user_inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shopping_lists_updated_at BEFORE UPDATE ON public.shopping_lists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to update recipe total_time_minutes
CREATE OR REPLACE FUNCTION update_recipe_total_time()
RETURNS TRIGGER AS $$
BEGIN
    NEW.total_time_minutes = COALESCE(NEW.prep_time_minutes, 0) + COALESCE(NEW.cook_time_minutes, 0);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_recipe_total_time
    BEFORE INSERT OR UPDATE ON public.recipes
    FOR EACH ROW EXECUTE FUNCTION update_recipe_total_time();

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all user tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_health_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Enable RLS on nutrition tables
ALTER TABLE public.foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_nutrition_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_logs ENABLE ROW LEVEL SECURITY;

-- Enable RLS on recipe tables
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_saves ENABLE ROW LEVEL SECURITY;

-- Enable RLS on circle tables
ALTER TABLE public.circles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circle_memberships ENABLE ROW LEVEL SECURITY;

-- Enable RLS on meal planning tables
ALTER TABLE public.user_meal_plans ENABLE ROW LEVEL SECURITY;

-- Enable RLS on inventory tables
ALTER TABLE public.user_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_lists ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- BASIC RLS POLICIES
-- ============================================================================

-- Users can view and update their own profile
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- User preferences policies
CREATE POLICY "Users can manage own preferences" ON public.user_preferences
    FOR ALL USING (auth.uid() = user_id);

-- Health profiles policies
CREATE POLICY "Users can manage own health profiles" ON public.user_health_profiles
    FOR ALL USING (auth.uid() = user_id);

-- Activity logs policies
CREATE POLICY "Users can view own activity logs" ON public.user_activity_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity logs" ON public.user_activity_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Foods are publicly readable
CREATE POLICY "Foods are publicly readable" ON public.foods
    FOR SELECT USING (is_active = true);

-- Nutrition summaries policies
CREATE POLICY "Users can manage own nutrition summaries" ON public.daily_nutrition_summaries
    FOR ALL USING (auth.uid() = user_id);

-- Meal logs policies
CREATE POLICY "Users can manage own meal logs" ON public.meal_logs
    FOR ALL USING (auth.uid() = user_id);

-- Recipe policies
CREATE POLICY "Public recipes are viewable by all" ON public.recipes
    FOR SELECT USING (is_public = true AND status = 'active');

CREATE POLICY "Users can view their own recipes" ON public.recipes
    FOR SELECT USING (auth.uid() = author_id);

CREATE POLICY "Users can manage their own recipes" ON public.recipes
    FOR ALL USING (auth.uid() = author_id);

-- Recipe saves policies
CREATE POLICY "Users can manage their own recipe saves" ON public.recipe_saves
    FOR ALL USING (auth.uid() = user_id);

-- Circle policies
CREATE POLICY "Public circles are viewable by all" ON public.circles
    FOR SELECT USING (is_public = true AND status = 'active');

CREATE POLICY "Circle members can view their circles" ON public.circles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.circle_memberships cm 
            WHERE cm.circle_id = id AND cm.user_id = auth.uid() AND cm.status = 'active'
        )
    );

-- Circle membership policies
CREATE POLICY "Users can view their own memberships" ON public.circle_memberships
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Circle members can view memberships in their circles" ON public.circle_memberships
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.circle_memberships cm 
            WHERE cm.circle_id = circle_id AND cm.user_id = auth.uid() AND cm.status = 'active'
        )
    );

-- Meal plan policies
CREATE POLICY "Users can manage their own meal plans" ON public.user_meal_plans
    FOR ALL USING (auth.uid() = user_id);

-- Inventory policies
CREATE POLICY "Users can manage their own inventory" ON public.user_inventory
    FOR ALL USING (auth.uid() = user_id);

-- Shopping list policies
CREATE POLICY "Users can manage their own shopping lists" ON public.shopping_lists
    FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to check if users share a circle
CREATE OR REPLACE FUNCTION public.users_share_circle(user1_id UUID, user2_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.circle_memberships cm1
        JOIN public.circle_memberships cm2 ON cm1.circle_id = cm2.circle_id
        WHERE cm1.user_id = user1_id 
        AND cm2.user_id = user2_id
        AND cm1.status = 'active'
        AND cm2.status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's privacy settings
CREATE OR REPLACE FUNCTION public.get_user_privacy_settings(target_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    privacy_settings JSONB;
BEGIN
    SELECT up.privacy_settings INTO privacy_settings
    FROM public.user_preferences up
    WHERE up.user_id = target_user_id;
    
    RETURN COALESCE(privacy_settings, '{
        "profile_visibility": "private",
        "activity_sharing": false,
        "recipe_sharing": false,
        "stats_sharing": false
    }'::JSONB);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant authenticated users access to tables
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant service role full access
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Grant anonymous read access to public resources
GRANT SELECT ON public.foods TO anon;
GRANT SELECT ON public.recipes TO anon;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check table count
SELECT 
    'Tables created' as status,
    COUNT(*) as count
FROM pg_tables 
WHERE schemaname = 'public';

-- Check RLS status on key tables
SELECT 
    'RLS Status' as check_type,
    tablename,
    CASE WHEN rowsecurity THEN 'Enabled' ELSE 'Disabled' END as rls_status
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('users', 'recipes', 'circles', 'user_inventory', 'shopping_lists')
ORDER BY tablename;

-- Check function count
SELECT 
    'Functions created' as status,
    COUNT(*) as count
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public';

-- Check index count
SELECT 
    'Indexes created' as status,
    COUNT(*) as count
FROM pg_indexes 
WHERE schemaname = 'public';

-- Success message
SELECT '🎉 WellNoosh Database Setup Complete! 🎉' as message;
SELECT 'Core tables created with RLS security enabled' as status;
SELECT 'Ready for frontend integration and user testing' as next_steps;