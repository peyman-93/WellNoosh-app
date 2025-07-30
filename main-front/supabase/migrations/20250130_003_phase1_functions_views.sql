-- Phase 1: Utility Functions and Views for User Management
-- Migration: 20250130_003_phase1_functions_views.sql

-- ============================================================================
-- USER MANAGEMENT FUNCTIONS
-- ============================================================================

-- Function to create a complete user profile
CREATE OR REPLACE FUNCTION public.create_user_profile(
    user_data JSONB,
    preferences_data JSONB DEFAULT NULL,
    health_data JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    new_user_id UUID;
BEGIN
    -- Insert user profile
    INSERT INTO public.users (
        id, email, full_name, country, city, postal_code, phone,
        date_of_birth, gender, height_cm, weight_kg, preferred_units,
        timezone, language_code
    )
    VALUES (
        auth.uid(),
        user_data->>'email',
        user_data->>'full_name',
        user_data->>'country',
        user_data->>'city',
        user_data->>'postal_code',
        user_data->>'phone',
        (user_data->>'date_of_birth')::DATE,
        user_data->>'gender',
        (user_data->>'height_cm')::INTEGER,
        (user_data->>'weight_kg')::DECIMAL,
        COALESCE(user_data->'preferred_units', '{"weight": "kg", "height": "cm", "temperature": "celsius"}'::JSONB),
        COALESCE(user_data->>'timezone', 'UTC'),
        COALESCE(user_data->>'language_code', 'en')
    )
    RETURNING id INTO new_user_id;

    -- Insert default preferences if provided
    IF preferences_data IS NOT NULL THEN
        INSERT INTO public.user_preferences (
            user_id, diet_types, allergies, food_dislikes, cuisine_preferences,
            cooking_skill_level, max_cooking_time_minutes, preferred_meal_prep_day,
            kitchen_equipment, activity_level, meals_per_day, snacks_per_day,
            notifications, privacy_settings
        )
        VALUES (
            new_user_id,
            COALESCE((preferences_data->'diet_types')::TEXT[], '{}'),
            COALESCE((preferences_data->'allergies')::TEXT[], '{}'),
            COALESCE((preferences_data->'food_dislikes')::TEXT[], '{}'),
            COALESCE((preferences_data->'cuisine_preferences')::TEXT[], '{}'),
            COALESCE(preferences_data->>'cooking_skill_level', 'beginner'),
            COALESCE((preferences_data->>'max_cooking_time_minutes')::INTEGER, 60),
            COALESCE(preferences_data->>'preferred_meal_prep_day', 'sunday'),
            COALESCE((preferences_data->'kitchen_equipment')::TEXT[], '{}'),
            COALESCE(preferences_data->>'activity_level', 'moderately_active'),
            COALESCE((preferences_data->>'meals_per_day')::INTEGER, 3),
            COALESCE((preferences_data->>'snacks_per_day')::INTEGER, 2),
            COALESCE(preferences_data->'notifications', '{
                "meal_reminders": true,
                "grocery_reminders": true,
                "recipe_suggestions": true,
                "nutrition_alerts": true,
                "social_updates": true
            }'::JSONB),
            COALESCE(preferences_data->'privacy_settings', '{
                "profile_visibility": "friends",
                "activity_sharing": true,
                "recipe_sharing": true,
                "stats_sharing": false
            }'::JSONB)
        );
    END IF;

    -- Insert health profile if provided
    IF health_data IS NOT NULL THEN
        INSERT INTO public.user_health_profiles (
            user_id, primary_health_goal, target_weight_kg, target_date,
            medical_conditions, medications, supplements,
            target_calories, target_protein_g, target_carbs_g, target_fat_g,
            target_fiber_g, target_sodium_mg, target_sugar_g,
            micronutrient_targets, health_notes
        )
        VALUES (
            new_user_id,
            health_data->>'primary_health_goal',
            (health_data->>'target_weight_kg')::DECIMAL,
            (health_data->>'target_date')::DATE,
            COALESCE((health_data->'medical_conditions')::TEXT[], '{}'),
            COALESCE((health_data->'medications')::TEXT[], '{}'),
            COALESCE((health_data->'supplements')::TEXT[], '{}'),
            (health_data->>'target_calories')::INTEGER,
            (health_data->>'target_protein_g')::DECIMAL,
            (health_data->>'target_carbs_g')::DECIMAL,
            (health_data->>'target_fat_g')::DECIMAL,
            (health_data->>'target_fiber_g')::DECIMAL,
            (health_data->>'target_sodium_mg')::DECIMAL,
            (health_data->>'target_sugar_g')::DECIMAL,
            COALESCE(health_data->'micronutrient_targets', '{
                "vitamin_a_mcg": 900, "vitamin_c_mg": 90, "vitamin_d_mcg": 20,
                "vitamin_e_mg": 15, "vitamin_k_mcg": 120, "thiamine_mg": 1.2,
                "riboflavin_mg": 1.3, "niacin_mg": 16, "vitamin_b6_mg": 1.7,
                "folate_mcg": 400, "vitamin_b12_mcg": 2.4, "calcium_mg": 1000,
                "iron_mg": 8, "magnesium_mg": 400, "phosphorus_mg": 700,
                "potassium_mg": 4700, "zinc_mg": 11
            }'::JSONB),
            health_data->>'health_notes'
        );
    END IF;

    -- Log the profile creation
    INSERT INTO public.user_activity_logs (user_id, activity_type, activity_details)
    VALUES (new_user_id, 'profile_update', '{"action": "profile_created"}'::JSONB);

    RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user onboarding progress
CREATE OR REPLACE FUNCTION public.update_onboarding_progress(
    step_completed INTEGER,
    completion_data JSONB DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    current_step INTEGER;
    total_steps INTEGER := 5; -- Adjust based on your onboarding flow
BEGIN
    -- Get current onboarding step
    SELECT onboarding_step INTO current_step
    FROM public.users
    WHERE id = auth.uid();

    -- Update onboarding step if progressing forward
    IF step_completed > current_step THEN
        UPDATE public.users
        SET 
            onboarding_step = step_completed,
            onboarding_completed = (step_completed >= total_steps),
            updated_at = NOW()
        WHERE id = auth.uid();

        -- Log onboarding progress
        INSERT INTO public.user_activity_logs (user_id, activity_type, activity_details)
        VALUES (
            auth.uid(), 
            'profile_update', 
            jsonb_build_object(
                'action', 'onboarding_progress',
                'step_completed', step_completed,
                'data', completion_data
            )
        );

        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate BMR (Basal Metabolic Rate)
CREATE OR REPLACE FUNCTION public.calculate_bmr(
    weight_kg DECIMAL,
    height_cm INTEGER,
    age_years INTEGER,
    gender TEXT
)
RETURNS INTEGER AS $$
DECLARE
    bmr DECIMAL;
BEGIN
    -- Mifflin-St Jeor Equation
    IF LOWER(gender) = 'male' THEN
        bmr := (10 * weight_kg) + (6.25 * height_cm) - (5 * age_years) + 5;
    ELSE
        bmr := (10 * weight_kg) + (6.25 * height_cm) - (5 * age_years) - 161;
    END IF;

    RETURN ROUND(bmr)::INTEGER;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to calculate TDEE (Total Daily Energy Expenditure)
CREATE OR REPLACE FUNCTION public.calculate_tdee(
    bmr INTEGER,
    activity_level TEXT
)
RETURNS INTEGER AS $$
DECLARE
    activity_multiplier DECIMAL;
    tdee DECIMAL;
BEGIN
    -- Activity level multipliers
    CASE LOWER(activity_level)
        WHEN 'sedentary' THEN activity_multiplier := 1.2;
        WHEN 'lightly_active' THEN activity_multiplier := 1.375;
        WHEN 'moderately_active' THEN activity_multiplier := 1.55;
        WHEN 'very_active' THEN activity_multiplier := 1.725;
        WHEN 'extremely_active' THEN activity_multiplier := 1.9;
        ELSE activity_multiplier := 1.55; -- Default to moderately active
    END CASE;

    tdee := bmr * activity_multiplier;
    RETURN ROUND(tdee)::INTEGER;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to update calculated health metrics
CREATE OR REPLACE FUNCTION public.update_health_calculations()
RETURNS TRIGGER AS $$
DECLARE
    user_age INTEGER;
    user_bmr INTEGER;
    user_tdee INTEGER;
    user_activity_level TEXT;
BEGIN
    -- Calculate age from date of birth
    SELECT EXTRACT(YEAR FROM AGE(date_of_birth)) INTO user_age
    FROM public.users WHERE id = NEW.user_id;

    -- Get activity level
    SELECT activity_level INTO user_activity_level
    FROM public.user_preferences WHERE user_id = NEW.user_id;

    -- Calculate BMR and TDEE if we have the required data
    IF NEW.user_id IS NOT NULL AND user_age IS NOT NULL THEN
        -- Get weight and height from users table
        SELECT 
            calculate_bmr(u.weight_kg, u.height_cm, user_age, u.gender),
            COALESCE(user_activity_level, 'moderately_active')
        INTO user_bmr, user_activity_level
        FROM public.users u
        WHERE u.id = NEW.user_id;

        IF user_bmr IS NOT NULL THEN
            user_tdee := calculate_tdee(user_bmr, user_activity_level);
            
            NEW.bmr_calories := user_bmr;
            NEW.tdee_calories := user_tdee;
            
            -- Set default calorie target based on goal if not specified
            IF NEW.target_calories IS NULL THEN
                CASE NEW.primary_health_goal
                    WHEN 'weight_loss' THEN NEW.target_calories := user_tdee - 500;
                    WHEN 'weight_gain' THEN NEW.target_calories := user_tdee + 500;
                    WHEN 'muscle_gain' THEN NEW.target_calories := user_tdee + 300;
                    ELSE NEW.target_calories := user_tdee;
                END CASE;
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for health calculations
CREATE TRIGGER trigger_update_health_calculations
    BEFORE INSERT OR UPDATE ON public.user_health_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_health_calculations();

-- Function to log user activity
CREATE OR REPLACE FUNCTION public.log_user_activity(
    activity_type TEXT,
    activity_details JSONB DEFAULT NULL,
    session_id TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO public.user_activity_logs (
        user_id, activity_type, activity_details, session_id, timestamp
    )
    VALUES (
        auth.uid(), activity_type, activity_details, session_id, NOW()
    )
    RETURNING id INTO log_id;

    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- USEFUL VIEWS
-- ============================================================================

-- Complete user profile view
CREATE VIEW public.user_profiles AS
SELECT 
    u.id,
    u.email,
    u.full_name,
    u.country,
    u.city,
    u.postal_code,
    u.phone,
    u.date_of_birth,
    u.gender,
    u.height_cm,
    u.weight_kg,
    u.preferred_units,
    u.timezone,
    u.language_code,
    u.account_status,
    u.onboarding_completed,
    u.onboarding_step,
    u.profile_completed,
    u.last_active_at,
    u.created_at,
    u.updated_at,
    
    -- Preferences
    up.diet_types,
    up.allergies,
    up.food_dislikes,
    up.cuisine_preferences,
    up.cooking_skill_level,
    up.max_cooking_time_minutes,
    up.preferred_meal_prep_day,
    up.kitchen_equipment,
    up.activity_level,
    up.meals_per_day,
    up.snacks_per_day,
    up.notifications,
    up.privacy_settings,
    
    -- Health Profile
    uhp.primary_health_goal,
    uhp.target_weight_kg,
    uhp.target_date,
    uhp.medical_conditions,
    uhp.medications,
    uhp.supplements,
    uhp.target_calories,
    uhp.target_protein_g,
    uhp.target_carbs_g,
    uhp.target_fat_g,
    uhp.target_fiber_g,
    uhp.target_sodium_mg,
    uhp.target_sugar_g,
    uhp.micronutrient_targets,
    uhp.bmr_calories,
    uhp.tdee_calories,
    uhp.body_fat_percentage,
    uhp.muscle_mass_kg,
    uhp.health_notes,
    uhp.doctor_recommendations

FROM public.users u
LEFT JOIN public.user_preferences up ON u.id = up.user_id
LEFT JOIN public.user_health_profiles uhp ON u.id = uhp.user_id AND uhp.is_active = true;

-- User activity summary view
CREATE VIEW public.user_activity_summary AS
SELECT 
    user_id,
    COUNT(*) as total_activities,
    COUNT(DISTINCT activity_type) as unique_activity_types,
    MIN(timestamp) as first_activity,
    MAX(timestamp) as last_activity,
    COUNT(*) FILTER (WHERE timestamp >= NOW() - INTERVAL '7 days') as activities_last_7_days,
    COUNT(*) FILTER (WHERE timestamp >= NOW() - INTERVAL '30 days') as activities_last_30_days,
    
    -- Activity type breakdown
    COUNT(*) FILTER (WHERE activity_type = 'login') as login_count,
    COUNT(*) FILTER (WHERE activity_type = 'recipe_view') as recipe_views,
    COUNT(*) FILTER (WHERE activity_type = 'recipe_save') as recipe_saves,
    COUNT(*) FILTER (WHERE activity_type = 'recipe_cook') as recipes_cooked,
    COUNT(*) FILTER (WHERE activity_type = 'meal_log') as meals_logged

FROM public.user_activity_logs
GROUP BY user_id;

-- User achievement progress view
CREATE VIEW public.user_achievement_progress AS
SELECT 
    user_id,
    COUNT(*) as total_achievements,
    COUNT(*) FILTER (WHERE is_completed = true) as completed_achievements,
    SUM(points_earned) as total_points_earned,
    MAX(completed_at) as last_achievement_date,
    
    -- Achievement type breakdown
    COUNT(*) FILTER (WHERE achievement_type = 'first_recipe' AND is_completed) as first_recipe_completed,
    COUNT(*) FILTER (WHERE achievement_type = 'healthy_week' AND is_completed) as healthy_weeks,
    COUNT(*) FILTER (WHERE achievement_type = 'meal_prep_pro' AND is_completed) as meal_prep_achievements,
    COUNT(*) FILTER (WHERE achievement_type = 'nutrition_tracker' AND is_completed) as nutrition_achievements

FROM public.user_achievements
GROUP BY user_id;

-- ============================================================================
-- GRANT PERMISSIONS FOR FUNCTIONS AND VIEWS
-- ============================================================================

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.create_user_profile(JSONB, JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_onboarding_progress(INTEGER, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_bmr(DECIMAL, INTEGER, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_tdee(INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_user_activity(TEXT, JSONB, TEXT) TO authenticated;

-- Grant permissions on views
GRANT SELECT ON public.user_profiles TO authenticated;
GRANT SELECT ON public.user_activity_summary TO authenticated;
GRANT SELECT ON public.user_achievement_progress TO authenticated;

-- RLS policies for views (inherit from underlying tables)
ALTER VIEW public.user_profiles SET (security_barrier = true);
ALTER VIEW public.user_activity_summary SET (security_barrier = true);
ALTER VIEW public.user_achievement_progress SET (security_barrier = true);