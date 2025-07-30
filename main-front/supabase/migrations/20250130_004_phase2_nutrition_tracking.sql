-- Phase 2: Detailed Nutrition Tracking System
-- Migration: 20250130_004_phase2_nutrition_tracking.sql

-- ============================================================================
-- FOOD DATABASE TABLES
-- ============================================================================

-- Foods master table (ingredients and food items)
CREATE TABLE public.foods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Basic Information
    name TEXT NOT NULL,
    name_scientific TEXT,
    description TEXT,
    food_category TEXT NOT NULL, -- 'vegetable', 'fruit', 'protein', 'grain', 'dairy', etc.
    food_subcategory TEXT, -- 'leafy_green', 'citrus', 'legume', etc.
    
    -- Identifiers
    barcode TEXT,
    fdc_id TEXT, -- USDA FoodData Central ID
    external_ids JSONB DEFAULT '{}', -- Other database IDs
    
    -- Physical Properties
    density_g_per_ml DECIMAL(6,3), -- For volume to weight conversions
    default_serving_size DECIMAL(8,2) DEFAULT 100, -- grams
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
    common_allergens TEXT[] DEFAULT '{}', -- ['gluten', 'dairy', 'nuts', 'soy', etc.]
    
    -- Sustainability & Origin
    carbon_footprint_kg_co2_per_kg DECIMAL(6,3),
    water_footprint_l_per_kg DECIMAL(8,2),
    seasonality JSONB DEFAULT '{}', -- {"spring": true, "summer": false, ...}
    origin_countries TEXT[] DEFAULT '{}',
    
    -- Quality & Verification
    data_source TEXT, -- 'usda', 'user_contributed', 'manufacturer', etc.
    verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('verified', 'pending', 'flagged')),
    last_verified_at TIMESTAMPTZ,
    
    -- Usage Statistics
    usage_count INTEGER DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Food serving sizes and conversions
CREATE TABLE public.food_serving_sizes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    food_id UUID NOT NULL REFERENCES public.foods(id) ON DELETE CASCADE,
    
    -- Serving Size Information
    serving_name TEXT NOT NULL, -- 'cup', 'tablespoon', 'medium apple', 'slice', etc.
    serving_size_g DECIMAL(8,2) NOT NULL, -- Weight in grams
    serving_volume_ml DECIMAL(8,2), -- Volume if applicable
    
    -- Visual Description
    description TEXT, -- 'About the size of a tennis ball', etc.
    
    -- Usage
    is_default BOOLEAN DEFAULT FALSE,
    usage_frequency INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- USER NUTRITION TRACKING TABLES
-- ============================================================================

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
    
    -- Fat Breakdown
    saturated_fat_g DECIMAL(8,2) DEFAULT 0,
    trans_fat_g DECIMAL(8,2) DEFAULT 0,
    monounsaturated_fat_g DECIMAL(8,2) DEFAULT 0,
    polyunsaturated_fat_g DECIMAL(8,2) DEFAULT 0,
    omega_3_g DECIMAL(8,2) DEFAULT 0,
    omega_6_g DECIMAL(8,2) DEFAULT 0,
    cholesterol_mg DECIMAL(8,2) DEFAULT 0,
    
    -- Micronutrients (actual consumed)
    micronutrients_consumed JSONB DEFAULT '{
        "vitamin_a_mcg": 0, "vitamin_c_mg": 0, "vitamin_d_mcg": 0,
        "vitamin_e_mg": 0, "vitamin_k_mcg": 0, "thiamine_mg": 0,
        "riboflavin_mg": 0, "niacin_mg": 0, "pantothenic_acid_mg": 0,
        "vitamin_b6_mg": 0, "biotin_mcg": 0, "folate_mcg": 0,
        "vitamin_b12_mcg": 0, "choline_mg": 0,
        "calcium_mg": 0, "iron_mg": 0, "magnesium_mg": 0,
        "phosphorus_mg": 0, "potassium_mg": 0, "zinc_mg": 0,
        "copper_mg": 0, "manganese_mg": 0, "selenium_mcg": 0,
        "iodine_mcg": 0, "chromium_mcg": 0, "molybdenum_mcg": 0
    }',
    
    -- Hydration
    water_ml INTEGER DEFAULT 0,
    
    -- Meal Distribution
    meals_logged INTEGER DEFAULT 0,
    snacks_logged INTEGER DEFAULT 0,
    
    -- Quality Metrics
    vegetable_servings DECIMAL(4,1) DEFAULT 0,
    fruit_servings DECIMAL(4,1) DEFAULT 0,
    whole_grain_servings DECIMAL(4,1) DEFAULT 0,
    processed_food_score DECIMAL(4,1) DEFAULT 0, -- 0-10 scale, lower is better
    
    -- Achievement Tracking
    targets_met JSONB DEFAULT '{}', -- Which nutrition targets were met
    nutrition_score DECIMAL(4,1), -- Overall nutrition quality score 0-10
    
    -- Timing Analysis
    first_meal_time TIME,
    last_meal_time TIME,
    eating_window_hours DECIMAL(4,1),
    
    -- Calculation Status
    is_complete BOOLEAN DEFAULT FALSE, -- All meals logged for the day
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
    meal_name TEXT, -- User-defined meal name
    meal_time TIMESTAMPTZ NOT NULL,
    
    -- Recipe Connection (if applicable)
    recipe_id UUID, -- Will reference recipes table in Phase 3
    recipe_serving_size DECIMAL(4,2), -- Fraction of recipe consumed
    
    -- Location & Context
    location TEXT, -- 'home', 'restaurant', 'work', etc.
    meal_context TEXT, -- 'meal_prep', 'dining_out', 'quick_snack', etc.
    
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
    energy_after INTEGER CHECK (energy_after BETWEEN 1 AND 10), -- 1-3 hours after
    
    -- Notes
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual food items in meals
CREATE TABLE public.meal_food_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meal_log_id UUID NOT NULL REFERENCES public.meal_logs(id) ON DELETE CASCADE,
    food_id UUID NOT NULL REFERENCES public.foods(id) ON DELETE CASCADE,
    
    -- Quantity Information
    quantity DECIMAL(8,2) NOT NULL,
    unit TEXT NOT NULL, -- 'g', 'cup', 'tablespoon', 'piece', etc.
    weight_g DECIMAL(8,2), -- Calculated weight in grams
    
    -- Preparation Method
    preparation_method TEXT, -- 'raw', 'boiled', 'fried', 'baked', etc.
    cooking_method_multiplier DECIMAL(4,3) DEFAULT 1.0, -- Nutritional adjustment for cooking
    
    -- Calculated Nutrition (for this portion)
    calories DECIMAL(8,2),
    protein_g DECIMAL(8,2),
    carbs_g DECIMAL(8,2),
    fat_g DECIMAL(8,2),
    fiber_g DECIMAL(8,2),
    sodium_mg DECIMAL(8,2),
    
    -- Micronutrients for this portion
    micronutrients JSONB DEFAULT '{}',
    
    -- User Modifications
    custom_nutrition JSONB, -- If user manually adjusts nutrition values
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Water intake tracking
CREATE TABLE public.water_intake_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    daily_summary_id UUID REFERENCES public.daily_nutrition_summaries(id) ON DELETE CASCADE,
    
    -- Intake Information
    amount_ml INTEGER NOT NULL,
    beverage_type TEXT DEFAULT 'water', -- 'water', 'tea', 'coffee', 'juice', etc.
    temperature TEXT, -- 'cold', 'room_temp', 'warm', 'hot'
    
    -- Timing
    consumed_at TIMESTAMPTZ NOT NULL,
    
    -- Context
    activity_context TEXT, -- 'workout', 'meal', 'wakeup', 'bedtime', etc.
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- NUTRITION ANALYSIS TABLES
-- ============================================================================

-- Weekly nutrition analysis
CREATE TABLE public.weekly_nutrition_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Week Information
    week_start_date DATE NOT NULL,
    week_end_date DATE NOT NULL,
    
    -- Average Daily Values
    avg_calories DECIMAL(8,2),
    avg_protein_g DECIMAL(8,2),
    avg_carbs_g DECIMAL(8,2),
    avg_fat_g DECIMAL(8,2),
    avg_fiber_g DECIMAL(8,2),
    avg_sodium_mg DECIMAL(8,2),
    
    -- Weekly Totals
    total_calories DECIMAL(10,2),
    total_water_ml INTEGER,
    
    -- Micronutrient Averages
    avg_micronutrients JSONB DEFAULT '{}',
    
    -- Consistency Metrics
    calorie_consistency_score DECIMAL(4,2), -- How consistent daily calories were
    meal_timing_consistency DECIMAL(4,2), -- How consistent meal times were
    days_logged INTEGER, -- How many days had complete logging
    
    -- Target Achievement
    targets_met_percentage DECIMAL(5,2),
    improvement_areas TEXT[], -- Areas needing attention
    
    -- Quality Scores
    overall_nutrition_score DECIMAL(4,1),
    diet_variety_score DECIMAL(4,1), -- How varied the diet was
    processed_food_score DECIMAL(4,1),
    
    -- Trends
    calorie_trend TEXT, -- 'increasing', 'decreasing', 'stable'
    weight_change_kg DECIMAL(5,2),
    
    -- Analysis Notes
    ai_insights TEXT, -- AI-generated insights
    recommendations TEXT[], -- Personalized recommendations
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Nutrient deficiency tracking
CREATE TABLE public.nutrient_deficiency_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Deficiency Information
    nutrient_name TEXT NOT NULL,
    deficiency_level TEXT CHECK (deficiency_level IN ('mild', 'moderate', 'severe')),
    
    -- Analysis Period
    analysis_start_date DATE NOT NULL,
    analysis_end_date DATE NOT NULL,
    days_analyzed INTEGER,
    
    -- Metrics
    average_daily_intake DECIMAL(8,2),
    recommended_daily_intake DECIMAL(8,2),
    percentage_of_rdi DECIMAL(5,2),
    
    -- Trends
    trend_direction TEXT, -- 'improving', 'worsening', 'stable'
    consecutive_deficient_days INTEGER,
    
    -- Recommendations
    food_recommendations TEXT[], -- Foods high in this nutrient
    supplement_recommendations TEXT[],
    
    -- Status
    alert_status TEXT DEFAULT 'active' CHECK (alert_status IN ('active', 'resolved', 'dismissed')),
    resolved_at TIMESTAMPTZ,
    
    -- Follow-up
    next_check_date DATE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Foods table indexes
CREATE INDEX idx_foods_name ON public.foods(name);
CREATE INDEX idx_foods_category ON public.foods(food_category);
CREATE INDEX idx_foods_barcode ON public.foods(barcode);
CREATE INDEX idx_foods_fdc_id ON public.foods(fdc_id);
CREATE INDEX idx_foods_allergens ON public.foods USING GIN(common_allergens);
CREATE INDEX idx_foods_active ON public.foods(is_active);

-- Food serving sizes indexes
CREATE INDEX idx_food_serving_sizes_food_id ON public.food_serving_sizes(food_id);
CREATE INDEX idx_food_serving_sizes_default ON public.food_serving_sizes(food_id, is_default);

-- Daily nutrition summaries indexes
CREATE INDEX idx_daily_nutrition_user_date ON public.daily_nutrition_summaries(user_id, date);
CREATE INDEX idx_daily_nutrition_date ON public.daily_nutrition_summaries(date);
CREATE INDEX idx_daily_nutrition_complete ON public.daily_nutrition_summaries(user_id, is_complete);

-- Meal logs indexes
CREATE INDEX idx_meal_logs_user_id ON public.meal_logs(user_id);
CREATE INDEX idx_meal_logs_meal_time ON public.meal_logs(meal_time);
CREATE INDEX idx_meal_logs_daily_summary ON public.meal_logs(daily_summary_id);
CREATE INDEX idx_meal_logs_recipe ON public.meal_logs(recipe_id);
CREATE INDEX idx_meal_logs_user_date ON public.meal_logs(user_id, DATE(meal_time));

-- Meal food items indexes
CREATE INDEX idx_meal_food_items_meal_log ON public.meal_food_items(meal_log_id);
CREATE INDEX idx_meal_food_items_food_id ON public.meal_food_items(food_id);

-- Water intake indexes
CREATE INDEX idx_water_intake_user_date ON public.water_intake_logs(user_id, DATE(consumed_at));
CREATE INDEX idx_water_intake_daily_summary ON public.water_intake_logs(daily_summary_id);

-- Weekly analysis indexes
CREATE INDEX idx_weekly_analysis_user_week ON public.weekly_nutrition_analysis(user_id, week_start_date);

-- Deficiency alerts indexes
CREATE INDEX idx_deficiency_alerts_user_active ON public.nutrient_deficiency_alerts(user_id, alert_status);
CREATE INDEX idx_deficiency_alerts_nutrient ON public.nutrient_deficiency_alerts(nutrient_name);

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================================================

-- Update daily summaries when meal logs change
CREATE OR REPLACE FUNCTION update_daily_nutrition_summary()
RETURNS TRIGGER AS $$
DECLARE
    summary_id UUID;
    summary_date DATE;
BEGIN
    -- Determine the date and get/create daily summary
    IF TG_OP = 'DELETE' THEN
        summary_date := DATE(OLD.meal_time);
        summary_id := OLD.daily_summary_id;
    ELSE
        summary_date := DATE(NEW.meal_time);
        
        -- Get or create daily summary
        INSERT INTO public.daily_nutrition_summaries (user_id, date)
        VALUES (NEW.user_id, summary_date)
        ON CONFLICT (user_id, date) DO NOTHING;
        
        SELECT id INTO summary_id
        FROM public.daily_nutrition_summaries
        WHERE user_id = NEW.user_id AND date = summary_date;
        
        -- Update the meal log with the summary ID
        IF NEW.daily_summary_id IS NULL THEN
            UPDATE public.meal_logs
            SET daily_summary_id = summary_id
            WHERE id = NEW.id;
        END IF;
    END IF;
    
    -- Recalculate daily totals
    UPDATE public.daily_nutrition_summaries
    SET 
        total_calories = (
            SELECT COALESCE(SUM(total_calories), 0)
            FROM public.meal_logs
            WHERE daily_summary_id = summary_id
        ),
        total_protein_g = (
            SELECT COALESCE(SUM(total_protein_g), 0)
            FROM public.meal_logs
            WHERE daily_summary_id = summary_id
        ),
        total_carbs_g = (
            SELECT COALESCE(SUM(total_carbs_g), 0)
            FROM public.meal_logs
            WHERE daily_summary_id = summary_id
        ),
        total_fat_g = (
            SELECT COALESCE(SUM(total_fat_g), 0)
            FROM public.meal_logs
            WHERE daily_summary_id = summary_id
        ),
        total_fiber_g = (
            SELECT COALESCE(SUM(total_fiber_g), 0)
            FROM public.meal_logs
            WHERE daily_summary_id = summary_id
        ),
        total_sodium_mg = (
            SELECT COALESCE(SUM(total_sodium_mg), 0)
            FROM public.meal_logs
            WHERE daily_summary_id = summary_id
        ),
        meals_logged = (
            SELECT COUNT(*)
            FROM public.meal_logs
            WHERE daily_summary_id = summary_id
            AND meal_type IN ('breakfast', 'lunch', 'dinner')
        ),
        snacks_logged = (
            SELECT COUNT(*)
            FROM public.meal_logs
            WHERE daily_summary_id = summary_id
            AND meal_type = 'snack'
        ),
        last_calculated_at = NOW(),
        updated_at = NOW()
    WHERE id = summary_id;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_daily_nutrition_summary
    AFTER INSERT OR UPDATE OR DELETE ON public.meal_logs
    FOR EACH ROW EXECUTE FUNCTION update_daily_nutrition_summary();

-- Update meal totals when food items change
CREATE OR REPLACE FUNCTION update_meal_totals()
RETURNS TRIGGER AS $$
BEGIN
    -- Recalculate meal totals
    UPDATE public.meal_logs
    SET 
        total_calories = (
            SELECT COALESCE(SUM(calories), 0)
            FROM public.meal_food_items
            WHERE meal_log_id = NEW.meal_log_id
        ),
        total_protein_g = (
            SELECT COALESCE(SUM(protein_g), 0)
            FROM public.meal_food_items
            WHERE meal_log_id = NEW.meal_log_id
        ),
        total_carbs_g = (
            SELECT COALESCE(SUM(carbs_g), 0)
            FROM public.meal_food_items
            WHERE meal_log_id = NEW.meal_log_id
        ),
        total_fat_g = (
            SELECT COALESCE(SUM(fat_g), 0)
            FROM public.meal_food_items
            WHERE meal_log_id = NEW.meal_log_id
        ),
        total_fiber_g = (
            SELECT COALESCE(SUM(fiber_g), 0)
            FROM public.meal_food_items
            WHERE meal_log_id = NEW.meal_log_id
        ),
        total_sodium_mg = (
            SELECT COALESCE(SUM(sodium_mg), 0)
            FROM public.meal_food_items
            WHERE meal_log_id = NEW.meal_log_id
        ),
        updated_at = NOW()
    WHERE id = NEW.meal_log_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_meal_totals
    AFTER INSERT OR UPDATE OR DELETE ON public.meal_food_items
    FOR EACH ROW EXECUTE FUNCTION update_meal_totals();