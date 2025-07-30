-- Phase 1: Enhanced User Management Tables
-- Migration: 20250130_001_phase1_user_management.sql

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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
    diet_types TEXT[] DEFAULT '{}', -- ['vegetarian', 'vegan', 'keto', 'paleo', 'mediterranean', etc.]
    allergies TEXT[] DEFAULT '{}', -- ['nuts', 'dairy', 'gluten', 'shellfish', etc.]
    food_dislikes TEXT[] DEFAULT '{}', -- ['mushrooms', 'olives', etc.]
    cuisine_preferences TEXT[] DEFAULT '{}', -- ['italian', 'asian', 'mexican', etc.]
    
    -- Cooking Preferences
    cooking_skill_level TEXT DEFAULT 'beginner' CHECK (cooking_skill_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
    max_cooking_time_minutes INTEGER DEFAULT 60,
    preferred_meal_prep_day TEXT DEFAULT 'sunday',
    kitchen_equipment TEXT[] DEFAULT '{}', -- ['oven', 'microwave', 'blender', 'slow_cooker', etc.]
    
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
    medical_conditions TEXT[] DEFAULT '{}', -- ['diabetes', 'hypertension', 'celiac', etc.]
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
    bmr_calories INTEGER, -- Basal Metabolic Rate
    tdee_calories INTEGER, -- Total Daily Energy Expenditure
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
    activity_details JSONB, -- Additional context specific to activity type
    
    -- Session & Context
    session_id TEXT,
    ip_address INET,
    user_agent TEXT,
    device_type TEXT, -- 'mobile', 'tablet', 'desktop'
    platform TEXT, -- 'ios', 'android', 'web'
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

-- Create indexes for performance
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_last_active ON public.users(last_active_at);
CREATE INDEX idx_users_onboarding ON public.users(onboarding_completed, profile_completed);

CREATE INDEX idx_user_preferences_user_id ON public.user_preferences(user_id);
CREATE INDEX idx_user_preferences_diet_types ON public.user_preferences USING GIN(diet_types);
CREATE INDEX idx_user_preferences_allergies ON public.user_preferences USING GIN(allergies);

CREATE INDEX idx_user_health_profiles_user_id ON public.user_health_profiles(user_id);
CREATE INDEX idx_user_health_profiles_active ON public.user_health_profiles(user_id, is_active);

CREATE INDEX idx_user_activity_logs_user_id ON public.user_activity_logs(user_id);
CREATE INDEX idx_user_activity_logs_type_timestamp ON public.user_activity_logs(activity_type, timestamp);
CREATE INDEX idx_user_activity_logs_timestamp ON public.user_activity_logs(timestamp);

CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_active ON public.user_sessions(user_id, is_active);
CREATE INDEX idx_user_sessions_token ON public.user_sessions(session_token);

CREATE INDEX idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX idx_user_achievements_type ON public.user_achievements(achievement_type);
CREATE INDEX idx_user_achievements_completed ON public.user_achievements(user_id, is_completed);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_health_profiles_updated_at BEFORE UPDATE ON public.user_health_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default health profile for existing users (if any)
-- This would typically be run as a data migration after the schema migration