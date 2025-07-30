-- Phase 5: Comprehensive Individual Meal Planning System
-- Migration: 20250130_009_phase5_meal_planning.sql

-- ============================================================================
-- INDIVIDUAL MEAL PLANNING TABLES
-- ============================================================================

-- User meal plans (individual meal planning, separate from circle planning)
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
    dietary_goals TEXT[] DEFAULT '{}', -- ['weight_loss', 'muscle_gain', 'heart_healthy', etc.]
    meal_prep_preference TEXT DEFAULT 'mixed' CHECK (meal_prep_preference IN ('none', 'partial', 'full', 'mixed')),
    
    -- Cooking Preferences
    max_cooking_time_per_meal INTEGER DEFAULT 60, -- minutes
    preferred_cooking_days INTEGER[] DEFAULT '{}', -- Days of week (0=Sunday, 6=Saturday)
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
    template_category TEXT, -- 'weight_loss', 'meal_prep', 'budget_friendly', etc.
    
    -- Statistics
    total_planned_meals INTEGER DEFAULT 0,
    total_estimated_cost DECIMAL(8,2) DEFAULT 0,
    total_actual_cost DECIMAL(8,2) DEFAULT 0,
    adherence_rate DECIMAL(5,2) DEFAULT 0, -- Percentage of planned meals actually made
    
    -- Nutritional Tracking
    average_daily_calories DECIMAL(8,2),
    average_daily_protein_g DECIMAL(6,2),
    average_daily_carbs_g DECIMAL(6,2),
    average_daily_fat_g DECIMAL(6,2),
    nutrition_score DECIMAL(4,2), -- Overall nutrition quality 0-10
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual planned meals within meal plans
CREATE TABLE public.user_planned_meals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meal_plan_id UUID NOT NULL REFERENCES public.user_meal_plans(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    recipe_id UUID REFERENCES public.recipes(id),
    
    -- Meal Scheduling
    planned_date DATE NOT NULL,
    planned_time TIME,
    meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack', 'dessert')),
    
    -- Meal Information
    meal_name TEXT NOT NULL,
    planned_servings DECIMAL(4,2) DEFAULT 1,
    estimated_prep_time_minutes INTEGER,
    estimated_cook_time_minutes INTEGER,
    
    -- Nutritional Planning
    target_calories DECIMAL(8,2),
    estimated_calories DECIMAL(8,2),
    estimated_protein_g DECIMAL(6,2),
    estimated_carbs_g DECIMAL(6,2),
    estimated_fat_g DECIMAL(6,2),
    
    -- Cost Planning
    estimated_cost_usd DECIMAL(6,2),
    actual_cost_usd DECIMAL(6,2),
    
    -- Meal Preparation
    prep_method TEXT DEFAULT 'fresh' CHECK (prep_method IN ('fresh', 'meal_prep', 'leftover', 'frozen', 'takeout')),
    prep_day DATE, -- When to prep this meal (for meal prep)
    storage_method TEXT, -- 'refrigerator', 'freezer', 'pantry'
    
    -- Recipe Modifications
    recipe_modifications JSONB DEFAULT '{}', -- Ingredient substitutions, scaling, etc.
    custom_ingredients JSONB DEFAULT '[]', -- Additional or replacement ingredients
    
    -- Planning Status
    planning_status TEXT DEFAULT 'planned' CHECK (planning_status IN (
        'planned', 'prep_scheduled', 'prepped', 'ready_to_cook', 'cooked', 'eaten', 'skipped', 'substituted'
    )),
    
    -- Execution Tracking
    actual_prep_time_minutes INTEGER,
    actual_cook_time_minutes INTEGER,
    actual_servings DECIMAL(4,2),
    completion_date DATE,
    satisfaction_rating INTEGER CHECK (satisfaction_rating BETWEEN 1 AND 5),
    
    -- AI & Learning
    ai_suggested BOOLEAN DEFAULT FALSE,
    ai_confidence_score DECIMAL(4,3),
    user_feedback_score INTEGER CHECK (user_feedback_score BETWEEN 1 AND 5),
    
    -- Notes & Adaptations
    planning_notes TEXT,
    execution_notes TEXT,
    next_time_changes TEXT, -- What to do differently next time
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Meal prep sessions (batch cooking sessions)
CREATE TABLE public.meal_prep_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    meal_plan_id UUID REFERENCES public.user_meal_plans(id),
    
    -- Session Information
    session_name TEXT NOT NULL,
    prep_date DATE NOT NULL,
    planned_start_time TIME,
    planned_duration_minutes INTEGER,
    
    -- Session Planning
    planned_meals UUID[] DEFAULT '{}', -- Array of user_planned_meals.id
    shopping_list_id UUID, -- Reference to shopping list (will be created in Phase 6)
    
    -- Execution Tracking
    actual_start_time TIMESTAMPTZ,
    actual_end_time TIMESTAMPTZ,
    actual_duration_minutes INTEGER,
    
    -- Session Results
    meals_completed INTEGER DEFAULT 0,
    meals_planned INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2),
    
    -- Cost & Efficiency
    total_cost_usd DECIMAL(8,2),
    cost_per_serving DECIMAL(6,2),
    time_per_serving DECIMAL(6,2), -- Minutes per serving
    
    -- Session Quality
    overall_satisfaction INTEGER CHECK (overall_satisfaction BETWEEN 1 AND 5),
    energy_level_after INTEGER CHECK (energy_level_after BETWEEN 1 AND 10),
    stress_level INTEGER CHECK (stress_level BETWEEN 1 AND 10),
    
    -- Learning & Improvement
    what_worked_well TEXT,
    what_was_challenging TEXT,
    improvements_for_next_time TEXT,
    
    -- Session Status
    status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- MEAL PLANNING TEMPLATES & PATTERNS
-- ============================================================================

-- Reusable meal planning templates
CREATE TABLE public.meal_plan_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_by_user_id UUID REFERENCES public.users(id), -- NULL for system templates
    
    -- Template Information
    template_name TEXT NOT NULL,
    description TEXT,
    template_category TEXT NOT NULL, -- 'weight_loss', 'muscle_gain', 'vegetarian', 'meal_prep', etc.
    
    -- Template Characteristics
    duration_days INTEGER NOT NULL,
    target_calories_per_day INTEGER,
    difficulty_level TEXT DEFAULT 'medium' CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
    prep_time_level TEXT DEFAULT 'medium' CHECK (prep_time_level IN ('low', 'medium', 'high')),
    
    -- Dietary Information
    dietary_tags TEXT[] DEFAULT '{}',
    allergen_free TEXT[] DEFAULT '{}',
    cuisine_types TEXT[] DEFAULT '{}',
    
    -- Template Goals
    primary_goals TEXT[] DEFAULT '{}', -- What this template is designed to achieve
    nutritional_focus TEXT[] DEFAULT '{}', -- 'high_protein', 'low_carb', 'heart_healthy', etc.
    
    -- Usage & Popularity
    usage_count INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0,
    total_ratings INTEGER DEFAULT 0,
    
    -- Template Status
    is_public BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    
    -- AI Enhancement
    ai_generated BOOLEAN DEFAULT FALSE,
    ai_optimization_score DECIMAL(4,3),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Template meal entries (the actual meals in templates)
CREATE TABLE public.meal_plan_template_meals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES public.meal_plan_templates(id) ON DELETE CASCADE,
    recipe_id UUID REFERENCES public.recipes(id),
    
    -- Meal Information
    day_number INTEGER NOT NULL, -- Which day of the template
    meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack', 'dessert')),
    meal_name TEXT NOT NULL,
    
    -- Template Meal Properties
    is_required BOOLEAN DEFAULT TRUE, -- Can this meal be skipped/substituted?
    substitution_category TEXT, -- Category for finding substitutes
    flexibility_score INTEGER DEFAULT 5 CHECK (flexibility_score BETWEEN 1 AND 10), -- How flexible is this meal choice?
    
    -- Nutritional Targets
    target_calories DECIMAL(8,2),
    target_protein_g DECIMAL(6,2),
    target_carbs_g DECIMAL(6,2),
    target_fat_g DECIMAL(6,2),
    
    -- Planning Information
    recommended_prep_day INTEGER, -- Which day to prep (relative to day_number)
    prep_notes TEXT,
    serving_size DECIMAL(4,2) DEFAULT 1,
    
    -- Alternative Options
    alternative_recipes UUID[] DEFAULT '{}', -- Array of recipe IDs as alternatives
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User meal planning patterns (learned behaviors and preferences)
CREATE TABLE public.user_meal_patterns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Pattern Type
    pattern_type TEXT NOT NULL CHECK (pattern_type IN (
        'weekly_routine', 'prep_day_preference', 'meal_timing', 'cuisine_rotation',
        'ingredient_usage', 'cooking_frequency', 'leftover_management'
    )),
    pattern_name TEXT NOT NULL,
    
    -- Pattern Data
    pattern_data JSONB NOT NULL, -- Flexible storage for different pattern types
    confidence_score DECIMAL(4,3) DEFAULT 0, -- How confident we are in this pattern
    
    -- Pattern Metadata
    observations_count INTEGER DEFAULT 0, -- How many data points support this pattern
    first_observed_at TIMESTAMPTZ,
    last_observed_at TIMESTAMPTZ,
    
    -- Pattern Effectiveness
    success_rate DECIMAL(5,2), -- How often following this pattern leads to successful meals
    user_satisfaction DECIMAL(4,2), -- User satisfaction when this pattern is followed
    
    -- Pattern Status
    is_active BOOLEAN DEFAULT TRUE,
    is_user_confirmed BOOLEAN DEFAULT FALSE, -- Has user explicitly confirmed this pattern?
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, pattern_type, pattern_name)
);

-- ============================================================================
-- MEAL PLANNING ANALYTICS & INSIGHTS
-- ============================================================================

-- Weekly meal planning analytics
CREATE TABLE public.weekly_meal_planning_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Analysis Period
    week_start_date DATE NOT NULL,
    week_end_date DATE NOT NULL,
    
    -- Planning Metrics
    meals_planned INTEGER DEFAULT 0,
    meals_completed INTEGER DEFAULT 0,
    adherence_rate DECIMAL(5,2), -- Percentage of planned meals actually made
    
    -- Time & Effort Analysis
    total_planned_prep_time_minutes INTEGER DEFAULT 0,
    total_actual_prep_time_minutes INTEGER DEFAULT 0,
    time_efficiency_score DECIMAL(4,2), -- Actual vs planned time
    
    -- Cost Analysis
    planned_budget_usd DECIMAL(8,2),
    actual_spending_usd DECIMAL(8,2),
    budget_adherence_rate DECIMAL(5,2),
    cost_per_meal DECIMAL(6,2),
    
    -- Nutritional Analysis
    average_daily_calories DECIMAL(8,2),
    nutrition_target_achievement DECIMAL(5,2), -- Percentage of nutrition goals met
    diet_variety_score DECIMAL(4,2), -- How varied was the diet
    
    -- Pattern Analysis
    most_successful_meal_types TEXT[], -- Which meal types were most successfully executed
    most_challenging_aspects TEXT[], -- What was most difficult about the week
    recurring_substitutions JSONB DEFAULT '{}', -- Common ingredient substitutions made
    
    -- AI Insights
    ai_recommendations TEXT[],
    improvement_areas TEXT[],
    success_patterns TEXT[],
    
    -- User Feedback
    week_satisfaction_rating INTEGER CHECK (week_satisfaction_rating BETWEEN 1 AND 5),
    stress_level_rating INTEGER CHECK (stress_level_rating BETWEEN 1 AND 10),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Meal planning goals and progress tracking
CREATE TABLE public.meal_planning_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Goal Information
    goal_name TEXT NOT NULL,
    goal_description TEXT,
    goal_category TEXT NOT NULL CHECK (goal_category IN (
        'consistency', 'nutrition', 'budget', 'time_management', 'skill_building',
        'variety', 'meal_prep', 'waste_reduction', 'cooking_frequency'
    )),
    
    -- Goal Metrics
    target_metric TEXT NOT NULL, -- What we're measuring
    target_value DECIMAL(10,2) NOT NULL, -- Target to achieve
    current_value DECIMAL(10,2) DEFAULT 0, -- Current progress
    measurement_unit TEXT, -- Unit of measurement
    
    -- Goal Timeframe
    goal_type TEXT DEFAULT 'ongoing' CHECK (goal_type IN ('one_time', 'recurring', 'ongoing')),
    start_date DATE NOT NULL,
    target_date DATE,
    
    -- Progress Tracking
    progress_percentage DECIMAL(5,2) DEFAULT 0,
    last_milestone_reached TEXT,
    milestones_data JSONB DEFAULT '[]', -- Array of milestone objects
    
    -- Goal Status
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'abandoned')),
    completion_date DATE,
    
    -- Motivation & Reminders
    motivation_text TEXT,
    reminder_frequency TEXT, -- 'daily', 'weekly', 'milestone'
    reminder_enabled BOOLEAN DEFAULT TRUE,
    
    -- Progress Notes
    progress_notes TEXT,
    obstacles_faced TEXT,
    strategies_that_work TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- User meal plans indexes
CREATE INDEX idx_user_meal_plans_user ON public.user_meal_plans(user_id);
CREATE INDEX idx_user_meal_plans_dates ON public.user_meal_plans(start_date, end_date);
CREATE INDEX idx_user_meal_plans_status ON public.user_meal_plans(status);
CREATE INDEX idx_user_meal_plans_type ON public.user_meal_plans(plan_type);
CREATE INDEX idx_user_meal_plans_template ON public.user_meal_plans(is_template);

-- User planned meals indexes
CREATE INDEX idx_user_planned_meals_plan ON public.user_planned_meals(meal_plan_id);
CREATE INDEX idx_user_planned_meals_user ON public.user_planned_meals(user_id);
CREATE INDEX idx_user_planned_meals_date ON public.user_planned_meals(planned_date);
CREATE INDEX idx_user_planned_meals_recipe ON public.user_planned_meals(recipe_id);
CREATE INDEX idx_user_planned_meals_status ON public.user_planned_meals(planning_status);
CREATE INDEX idx_user_planned_meals_type ON public.user_planned_meals(meal_type);
CREATE INDEX idx_user_planned_meals_prep_day ON public.user_planned_meals(prep_day);

-- Meal prep sessions indexes
CREATE INDEX idx_meal_prep_sessions_user ON public.meal_prep_sessions(user_id);
CREATE INDEX idx_meal_prep_sessions_plan ON public.meal_prep_sessions(meal_plan_id);
CREATE INDEX idx_meal_prep_sessions_date ON public.meal_prep_sessions(prep_date);
CREATE INDEX idx_meal_prep_sessions_status ON public.meal_prep_sessions(status);

-- Template indexes
CREATE INDEX idx_meal_plan_templates_category ON public.meal_plan_templates(template_category);
CREATE INDEX idx_meal_plan_templates_creator ON public.meal_plan_templates(created_by_user_id);
CREATE INDEX idx_meal_plan_templates_public ON public.meal_plan_templates(is_public, verification_status);
CREATE INDEX idx_meal_plan_templates_rating ON public.meal_plan_templates(average_rating);
CREATE INDEX idx_meal_plan_templates_usage ON public.meal_plan_templates(usage_count);
CREATE INDEX idx_meal_plan_templates_dietary ON public.meal_plan_templates USING GIN(dietary_tags);

CREATE INDEX idx_meal_plan_template_meals_template ON public.meal_plan_template_meals(template_id);
CREATE INDEX idx_meal_plan_template_meals_recipe ON public.meal_plan_template_meals(recipe_id);
CREATE INDEX idx_meal_plan_template_meals_day ON public.meal_plan_template_meals(template_id, day_number);

-- Pattern indexes
CREATE INDEX idx_user_meal_patterns_user ON public.user_meal_patterns(user_id);
CREATE INDEX idx_user_meal_patterns_type ON public.user_meal_patterns(pattern_type);
CREATE INDEX idx_user_meal_patterns_active ON public.user_meal_patterns(user_id, is_active);
CREATE INDEX idx_user_meal_patterns_confidence ON public.user_meal_patterns(confidence_score);

-- Analytics indexes
CREATE INDEX idx_weekly_meal_planning_analysis_user ON public.weekly_meal_planning_analysis(user_id);
CREATE INDEX idx_weekly_meal_planning_analysis_week ON public.weekly_meal_planning_analysis(week_start_date, week_end_date);

CREATE INDEX idx_meal_planning_goals_user ON public.meal_planning_goals(user_id);
CREATE INDEX idx_meal_planning_goals_category ON public.meal_planning_goals(goal_category);
CREATE INDEX idx_meal_planning_goals_status ON public.meal_planning_goals(status);
CREATE INDEX idx_meal_planning_goals_dates ON public.meal_planning_goals(start_date, target_date);

-- ============================================================================
-- TRIGGERS FOR MEAL PLANNING AUTOMATION
-- ============================================================================

-- Update meal plan statistics when planned meals change
CREATE OR REPLACE FUNCTION update_meal_plan_statistics()
RETURNS TRIGGER AS $$
DECLARE
    plan_id UUID;
BEGIN
    -- Get the meal plan ID
    IF TG_OP = 'DELETE' THEN
        plan_id := OLD.meal_plan_id;
    ELSE
        plan_id := NEW.meal_plan_id;
    END IF;
    
    -- Update meal plan statistics
    UPDATE public.user_meal_plans
    SET 
        total_planned_meals = (
            SELECT COUNT(*)
            FROM public.user_planned_meals
            WHERE meal_plan_id = plan_id
        ),
        total_estimated_cost = (
            SELECT COALESCE(SUM(estimated_cost_usd), 0)
            FROM public.user_planned_meals
            WHERE meal_plan_id = plan_id
        ),
        total_actual_cost = (
            SELECT COALESCE(SUM(actual_cost_usd), 0)
            FROM public.user_planned_meals
            WHERE meal_plan_id = plan_id AND actual_cost_usd IS NOT NULL
        ),
        adherence_rate = (
            SELECT CASE 
                WHEN COUNT(*) = 0 THEN 0
                ELSE ROUND((COUNT(*) FILTER (WHERE planning_status IN ('cooked', 'eaten')) * 100.0 / COUNT(*))::NUMERIC, 2)
            END
            FROM public.user_planned_meals
            WHERE meal_plan_id = plan_id
        ),
        completion_percentage = (
            SELECT CASE 
                WHEN COUNT(*) = 0 THEN 0
                ELSE ROUND((COUNT(*) FILTER (WHERE planning_status IN ('cooked', 'eaten', 'substituted')) * 100.0 / COUNT(*))::NUMERIC, 2)
            END
            FROM public.user_planned_meals
            WHERE meal_plan_id = plan_id
        ),
        updated_at = NOW()
    WHERE id = plan_id;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_meal_plan_statistics
    AFTER INSERT OR UPDATE OR DELETE ON public.user_planned_meals
    FOR EACH ROW EXECUTE FUNCTION update_meal_plan_statistics();

-- Update template usage count when used
CREATE OR REPLACE FUNCTION update_template_usage()
RETURNS TRIGGER AS $$
DECLARE
    template_ref UUID;
BEGIN
    -- Check if the meal plan was created from a template
    -- This would typically be stored in a template_id field (not shown in current schema)
    -- For now, this is a placeholder for future implementation
    
    -- If we had a template_id field in user_meal_plans:
    -- IF NEW.template_id IS NOT NULL THEN
    --     UPDATE public.meal_plan_templates
    --     SET usage_count = usage_count + 1
    --     WHERE id = NEW.template_id;
    -- END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- This trigger would be created when we add template_id field to user_meal_plans
-- CREATE TRIGGER trigger_update_template_usage
--     AFTER INSERT ON public.user_meal_plans
--     FOR EACH ROW EXECUTE FUNCTION update_template_usage();