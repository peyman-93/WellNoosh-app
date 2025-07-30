-- Phase 3: Advanced Recipe Intelligence System
-- Migration: 20250130_007_phase3_recipe_intelligence.sql

-- ============================================================================
-- RECIPE CORE TABLES
-- ============================================================================

-- Main recipes table
CREATE TABLE public.recipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Basic Information
    name TEXT NOT NULL,
    description TEXT,
    cuisine_type TEXT, -- 'italian', 'asian', 'mexican', 'american', etc.
    meal_type TEXT[] DEFAULT '{}', -- ['breakfast', 'lunch', 'dinner', 'snack', 'dessert']
    
    -- Recipe Meta
    author_id UUID REFERENCES public.users(id), -- NULL for system/imported recipes
    source_url TEXT,
    source_type TEXT DEFAULT 'user_created' CHECK (source_type IN ('user_created', 'imported', 'ai_generated', 'professional')),
    
    -- Cooking Information
    prep_time_minutes INTEGER CHECK (prep_time_minutes >= 0),
    cook_time_minutes INTEGER CHECK (cook_time_minutes >= 0),
    total_time_minutes INTEGER GENERATED ALWAYS AS (prep_time_minutes + cook_time_minutes) STORED,
    difficulty_level TEXT DEFAULT 'medium' CHECK (difficulty_level IN ('easy', 'medium', 'hard', 'expert')),
    servings INTEGER DEFAULT 4 CHECK (servings > 0),
    
    -- Equipment & Skills
    required_equipment TEXT[] DEFAULT '{}', -- ['oven', 'blender', 'grill', etc.]
    cooking_methods TEXT[] DEFAULT '{}', -- ['baking', 'sauteing', 'grilling', etc.]
    skill_level TEXT DEFAULT 'beginner' CHECK (skill_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
    
    -- Dietary & Health
    dietary_tags TEXT[] DEFAULT '{}', -- ['vegetarian', 'vegan', 'gluten_free', 'dairy_free', 'keto', etc.]
    allergen_warnings TEXT[] DEFAULT '{}', -- ['nuts', 'dairy', 'gluten', 'shellfish', etc.]
    health_labels TEXT[] DEFAULT '{}', -- ['low_sodium', 'high_protein', 'heart_healthy', etc.]
    
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
    total_made INTEGER DEFAULT 0, -- Times actually cooked
    
    -- Cost & Sustainability
    estimated_cost_usd DECIMAL(6,2),
    sustainability_score DECIMAL(4,2), -- 0-10 scale
    carbon_footprint_kg DECIMAL(6,3),
    
    -- Recipe Status
    is_public BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_date TIMESTAMPTZ,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived', 'flagged')),
    
    -- AI Enhancement
    ai_generated_tags TEXT[] DEFAULT '{}',
    ai_confidence_score DECIMAL(4,3), -- 0-1 scale
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

-- Recipe ingredients with detailed information
CREATE TABLE public.recipe_ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
    food_id UUID REFERENCES public.foods(id), -- NULL for custom ingredients
    
    -- Ingredient Information
    ingredient_name TEXT NOT NULL, -- Display name (may differ from food name)
    quantity DECIMAL(8,3) NOT NULL,
    unit TEXT NOT NULL,
    weight_g DECIMAL(8,2), -- Calculated weight in grams
    
    -- Preparation Instructions
    preparation TEXT, -- 'diced', 'minced', 'sliced thin', 'room temperature', etc.
    notes TEXT, -- Additional notes about this ingredient
    
    -- Ingredient Properties
    is_optional BOOLEAN DEFAULT FALSE,
    ingredient_group TEXT, -- 'marinade', 'sauce', 'garnish', 'base', etc.
    display_order INTEGER NOT NULL,
    
    -- Substitutions
    common_substitutions JSONB DEFAULT '[]', -- Array of substitute options
    
    -- Nutritional Contribution
    calories_contributed DECIMAL(8,2),
    protein_contributed_g DECIMAL(6,2),
    carbs_contributed_g DECIMAL(6,2),
    fat_contributed_g DECIMAL(6,2),
    
    -- Cost
    estimated_cost_usd DECIMAL(6,3),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recipe instructions with detailed steps
CREATE TABLE public.recipe_instructions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
    
    -- Step Information
    step_number INTEGER NOT NULL,
    title TEXT, -- Optional step title
    instruction TEXT NOT NULL,
    
    -- Timing & Temperature
    duration_minutes INTEGER,
    temperature_f INTEGER,
    temperature_c INTEGER,
    
    -- Equipment for this step
    required_equipment TEXT[] DEFAULT '{}',
    
    -- Media for this step
    image_url TEXT,
    video_url TEXT,
    
    -- Tips & Notes
    chef_tips TEXT,
    common_mistakes TEXT,
    
    -- Step Classification
    step_type TEXT, -- 'prep', 'cook', 'assembly', 'rest', 'serve'
    cooking_method TEXT, -- 'saute', 'bake', 'boil', 'grill', etc.
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(recipe_id, step_number)
);

-- ============================================================================
-- RECIPE INTERACTION & LEARNING TABLES
-- ============================================================================

-- User recipe ratings and reviews
CREATE TABLE public.recipe_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Rating Information
    overall_rating INTEGER NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
    taste_rating INTEGER CHECK (taste_rating BETWEEN 1 AND 5),
    difficulty_rating INTEGER CHECK (difficulty_rating BETWEEN 1 AND 5),
    time_accuracy_rating INTEGER CHECK (time_accuracy_rating BETWEEN 1 AND 5),
    
    -- Review
    review_title TEXT,
    review_text TEXT,
    
    -- Cooking Experience
    actual_prep_time_minutes INTEGER,
    actual_cook_time_minutes INTEGER,
    actual_servings INTEGER,
    
    -- Modifications Made
    modifications_made TEXT,
    ingredient_substitutions JSONB DEFAULT '{}',
    would_make_again BOOLEAN,
    
    -- Review Metadata
    is_verified_cook BOOLEAN DEFAULT FALSE, -- Did they actually cook it?
    helpful_votes INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(recipe_id, user_id)
);

-- Recipe saves/bookmarks
CREATE TABLE public.recipe_saves (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Save Information
    collection_name TEXT, -- User-defined collection/folder
    notes TEXT, -- Personal notes about this recipe
    tags TEXT[] DEFAULT '{}', -- Personal tags
    
    -- Usage Tracking
    times_cooked INTEGER DEFAULT 0,
    last_cooked_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(recipe_id, user_id)
);

-- Recipe cooking logs (when users actually make recipes)
CREATE TABLE public.recipe_cooking_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    meal_log_id UUID REFERENCES public.meal_logs(id), -- Link to nutrition tracking
    
    -- Cooking Session Information
    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    actual_servings INTEGER,
    success_rating INTEGER CHECK (success_rating BETWEEN 1 AND 5),
    
    -- Modifications & Adaptations
    ingredient_changes JSONB DEFAULT '{}', -- What ingredients were changed
    instruction_changes TEXT, -- What instructions were modified
    equipment_substitutions TEXT,
    
    -- Timing Analysis
    actual_prep_time_minutes INTEGER,
    actual_cook_time_minutes INTEGER,
    total_active_time_minutes INTEGER, -- Time actively working
    
    -- Outcome Assessment
    taste_satisfaction INTEGER CHECK (taste_satisfaction BETWEEN 1 AND 5),
    difficulty_experienced INTEGER CHECK (difficulty_experienced BETWEEN 1 AND 5),
    would_cook_again BOOLEAN,
    
    -- Learning & Improvement
    what_went_well TEXT,
    what_would_change TEXT,
    tips_for_next_time TEXT,
    
    -- Cost Tracking
    actual_cost_usd DECIMAL(8,2),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- RECIPE INTELLIGENCE & RECOMMENDATIONS
-- ============================================================================

-- User recipe preferences learned from behavior
CREATE TABLE public.user_recipe_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Cuisine Preferences
    cuisine_preferences JSONB DEFAULT '{}', -- {"italian": 0.8, "asian": 0.6, etc.}
    dietary_preferences JSONB DEFAULT '{}', -- Learned from interactions
    
    -- Complexity & Time Preferences
    preferred_difficulty_levels JSONB DEFAULT '{}',
    preferred_prep_times JSONB DEFAULT '{}', -- Time ranges and preferences
    preferred_cooking_methods JSONB DEFAULT '{}',
    
    -- Ingredient Preferences
    loved_ingredients TEXT[] DEFAULT '{}',
    disliked_ingredients TEXT[] DEFAULT '{}',
    neutral_ingredients TEXT[] DEFAULT '{}',
    ingredient_scores JSONB DEFAULT '{}', -- Detailed scoring per ingredient
    
    -- Flavor Profile Preferences
    flavor_preferences JSONB DEFAULT '{}', -- spicy, sweet, savory, umami, etc.
    texture_preferences JSONB DEFAULT '{}', -- crispy, creamy, chewy, etc.
    
    -- Contextual Preferences
    meal_type_preferences JSONB DEFAULT '{}',
    seasonal_preferences JSONB DEFAULT '{}',
    occasion_preferences JSONB DEFAULT '{}', -- weeknight, entertaining, meal_prep
    
    -- Learning Metadata
    total_interactions INTEGER DEFAULT 0,
    last_interaction_at TIMESTAMPTZ,
    confidence_score DECIMAL(4,3) DEFAULT 0, -- How confident we are in these preferences
    
    -- Preference Evolution
    preference_trends JSONB DEFAULT '{}', -- How preferences change over time
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Recipe similarity and relationships
CREATE TABLE public.recipe_relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
    related_recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
    
    -- Relationship Information
    relationship_type TEXT NOT NULL CHECK (relationship_type IN (
        'similar', 'variation', 'uses_same_technique', 'complementary',
        'seasonal_version', 'difficulty_progression', 'ingredient_based'
    )),
    similarity_score DECIMAL(4,3) CHECK (similarity_score BETWEEN 0 AND 1),
    
    -- Relationship Details
    common_ingredients INTEGER DEFAULT 0,
    common_techniques INTEGER DEFAULT 0,
    shared_characteristics TEXT[] DEFAULT '{}',
    
    -- AI Analysis
    ai_generated BOOLEAN DEFAULT FALSE,
    analysis_method TEXT, -- 'ingredient_analysis', 'user_behavior', 'manual'
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(recipe_id, related_recipe_id),
    CONSTRAINT no_self_relationship CHECK (recipe_id != related_recipe_id)
);

-- Recipe collections and categories (system and user-defined)
CREATE TABLE public.recipe_collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Collection Information
    name TEXT NOT NULL,
    description TEXT,
    slug TEXT UNIQUE, -- URL-friendly identifier
    
    -- Collection Type
    collection_type TEXT NOT NULL CHECK (collection_type IN (
        'system', 'featured', 'seasonal', 'dietary', 'skill_level', 
        'cuisine', 'occasion', 'user_public', 'user_private'
    )),
    
    -- Ownership
    created_by_user_id UUID REFERENCES public.users(id), -- NULL for system collections
    
    -- Collection Properties
    is_public BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    
    -- Visual
    cover_image_url TEXT,
    color_theme TEXT, -- Hex color for UI theming
    
    -- Metadata
    recipe_count INTEGER DEFAULT 0,
    total_saves INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Junction table for recipes in collections
CREATE TABLE public.recipe_collection_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    collection_id UUID NOT NULL REFERENCES public.recipe_collections(id) ON DELETE CASCADE,
    recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
    
    -- Item Properties
    display_order INTEGER DEFAULT 0,
    featured_reason TEXT, -- Why this recipe is in this collection
    added_by_user_id UUID REFERENCES public.users(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(collection_id, recipe_id)
);

-- ============================================================================
-- RECIPE SEARCH & DISCOVERY
-- ============================================================================

-- Recipe search history and analytics
CREATE TABLE public.recipe_search_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id), -- NULL for anonymous searches
    
    -- Search Information
    search_query TEXT,
    search_filters JSONB DEFAULT '{}', -- Applied filters
    search_type TEXT DEFAULT 'general' CHECK (search_type IN (
        'general', 'ingredient_based', 'dietary', 'time_based', 'nutrition_based'
    )),
    
    -- Results
    results_count INTEGER DEFAULT 0,
    clicked_results UUID[] DEFAULT '{}', -- Recipe IDs that were clicked
    saved_results UUID[] DEFAULT '{}', -- Recipe IDs that were saved
    
    -- Context
    search_context TEXT, -- 'meal_planning', 'browse', 'specific_need'
    device_type TEXT,
    
    -- Timing
    search_timestamp TIMESTAMPTZ DEFAULT NOW(),
    session_id TEXT
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Recipe indexes
CREATE INDEX idx_recipes_cuisine_type ON public.recipes(cuisine_type);
CREATE INDEX idx_recipes_meal_type ON public.recipes USING GIN(meal_type);
CREATE INDEX idx_recipes_dietary_tags ON public.recipes USING GIN(dietary_tags);
CREATE INDEX idx_recipes_author ON public.recipes(author_id);
CREATE INDEX idx_recipes_difficulty ON public.recipes(difficulty_level);
CREATE INDEX idx_recipes_time ON public.recipes(total_time_minutes);
CREATE INDEX idx_recipes_rating ON public.recipes(average_rating);
CREATE INDEX idx_recipes_status ON public.recipes(status, is_public);
CREATE INDEX idx_recipes_created ON public.recipes(created_at);

-- Recipe ingredients indexes
CREATE INDEX idx_recipe_ingredients_recipe ON public.recipe_ingredients(recipe_id);
CREATE INDEX idx_recipe_ingredients_food ON public.recipe_ingredients(food_id);
CREATE INDEX idx_recipe_ingredients_order ON public.recipe_ingredients(recipe_id, display_order);

-- Recipe instructions indexes
CREATE INDEX idx_recipe_instructions_recipe ON public.recipe_instructions(recipe_id);
CREATE INDEX idx_recipe_instructions_step ON public.recipe_instructions(recipe_id, step_number);

-- Recipe interactions indexes
CREATE INDEX idx_recipe_ratings_recipe ON public.recipe_ratings(recipe_id);
CREATE INDEX idx_recipe_ratings_user ON public.recipe_ratings(user_id);
CREATE INDEX idx_recipe_ratings_rating ON public.recipe_ratings(overall_rating);

CREATE INDEX idx_recipe_saves_user ON public.recipe_saves(user_id);
CREATE INDEX idx_recipe_saves_recipe ON public.recipe_saves(recipe_id);
CREATE INDEX idx_recipe_saves_collection ON public.recipe_saves(collection_name);

CREATE INDEX idx_recipe_cooking_logs_user ON public.recipe_cooking_logs(user_id);
CREATE INDEX idx_recipe_cooking_logs_recipe ON public.recipe_cooking_logs(recipe_id);
CREATE INDEX idx_recipe_cooking_logs_date ON public.recipe_cooking_logs(started_at);

-- Recipe intelligence indexes
CREATE INDEX idx_user_recipe_preferences_user ON public.user_recipe_preferences(user_id);
CREATE INDEX idx_recipe_relationships_recipe ON public.recipe_relationships(recipe_id);
CREATE INDEX idx_recipe_relationships_related ON public.recipe_relationships(related_recipe_id);
CREATE INDEX idx_recipe_relationships_type ON public.recipe_relationships(relationship_type);

-- Collections indexes
CREATE INDEX idx_recipe_collections_type ON public.recipe_collections(collection_type);
CREATE INDEX idx_recipe_collections_public ON public.recipe_collections(is_public, is_featured);
CREATE INDEX idx_recipe_collections_user ON public.recipe_collections(created_by_user_id);

CREATE INDEX idx_recipe_collection_items_collection ON public.recipe_collection_items(collection_id);
CREATE INDEX idx_recipe_collection_items_recipe ON public.recipe_collection_items(recipe_id);
CREATE INDEX idx_recipe_collection_items_order ON public.recipe_collection_items(collection_id, display_order);

-- Search indexes
CREATE INDEX idx_recipe_search_logs_user ON public.recipe_search_logs(user_id);
CREATE INDEX idx_recipe_search_logs_timestamp ON public.recipe_search_logs(search_timestamp);
CREATE INDEX idx_recipe_search_logs_query ON public.recipe_search_logs(search_query);

-- Full text search indexes
CREATE INDEX idx_recipes_text_search ON public.recipes USING GIN(
    to_tsvector('english', name || ' ' || COALESCE(description, ''))
);

-- ============================================================================
-- TRIGGERS FOR RECIPE STATISTICS
-- ============================================================================

-- Update recipe statistics when ratings change
CREATE OR REPLACE FUNCTION update_recipe_statistics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update recipe rating statistics
    UPDATE public.recipes
    SET 
        average_rating = (
            SELECT COALESCE(AVG(overall_rating), 0)
            FROM public.recipe_ratings
            WHERE recipe_id = COALESCE(NEW.recipe_id, OLD.recipe_id)
        ),
        total_ratings = (
            SELECT COUNT(*)
            FROM public.recipe_ratings
            WHERE recipe_id = COALESCE(NEW.recipe_id, OLD.recipe_id)
        ),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.recipe_id, OLD.recipe_id);

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_recipe_rating_stats
    AFTER INSERT OR UPDATE OR DELETE ON public.recipe_ratings
    FOR EACH ROW EXECUTE FUNCTION update_recipe_statistics();

-- Update recipe save count
CREATE OR REPLACE FUNCTION update_recipe_save_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.recipes
    SET 
        total_saves = (
            SELECT COUNT(*)
            FROM public.recipe_saves
            WHERE recipe_id = COALESCE(NEW.recipe_id, OLD.recipe_id)
        ),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.recipe_id, OLD.recipe_id);

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_recipe_save_count
    AFTER INSERT OR DELETE ON public.recipe_saves
    FOR EACH ROW EXECUTE FUNCTION update_recipe_save_count();

-- Update recipe cook count
CREATE OR REPLACE FUNCTION update_recipe_cook_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Only count completed cooking sessions
    IF NEW.completed_at IS NOT NULL THEN
        UPDATE public.recipes
        SET 
            total_made = (
                SELECT COUNT(*)
                FROM public.recipe_cooking_logs
                WHERE recipe_id = NEW.recipe_id AND completed_at IS NOT NULL
            ),
            updated_at = NOW()
        WHERE id = NEW.recipe_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_recipe_cook_count
    AFTER INSERT OR UPDATE ON public.recipe_cooking_logs
    FOR EACH ROW EXECUTE FUNCTION update_recipe_cook_count();

-- Update collection recipe count
CREATE OR REPLACE FUNCTION update_collection_recipe_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.recipe_collections
    SET 
        recipe_count = (
            SELECT COUNT(*)
            FROM public.recipe_collection_items
            WHERE collection_id = COALESCE(NEW.collection_id, OLD.collection_id)
        ),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.collection_id, OLD.collection_id);

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_collection_recipe_count
    AFTER INSERT OR DELETE ON public.recipe_collection_items
    FOR EACH ROW EXECUTE FUNCTION update_collection_recipe_count();