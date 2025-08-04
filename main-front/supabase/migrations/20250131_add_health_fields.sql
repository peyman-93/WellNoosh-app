-- Add missing health fields to user_health_profiles table
-- This migration adds the comprehensive health tracking fields

-- Add new columns to user_health_profiles if they don't exist
DO $$ 
BEGIN
    -- Add target_weight_kg if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_health_profiles' AND column_name = 'target_weight_kg') THEN
        ALTER TABLE user_health_profiles ADD COLUMN target_weight_kg DECIMAL(5,2) CHECK (target_weight_kg >= 20 AND target_weight_kg <= 500);
    END IF;

    -- Add health_goals if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_health_profiles' AND column_name = 'health_goals') THEN
        ALTER TABLE user_health_profiles ADD COLUMN health_goals JSONB;
    END IF;

    -- Add medical_conditions if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_health_profiles' AND column_name = 'medical_conditions') THEN
        ALTER TABLE user_health_profiles ADD COLUMN medical_conditions JSONB;
    END IF;

    -- Add medications if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_health_profiles' AND column_name = 'medications') THEN
        ALTER TABLE user_health_profiles ADD COLUMN medications JSONB;
    END IF;

    -- Add bmi if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_health_profiles' AND column_name = 'bmi') THEN
        ALTER TABLE user_health_profiles ADD COLUMN bmi DECIMAL(4,2);
    END IF;

    -- Add bmr if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_health_profiles' AND column_name = 'bmr') THEN
        ALTER TABLE user_health_profiles ADD COLUMN bmr INTEGER;
    END IF;

    -- Add daily_calorie_goal if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_health_profiles' AND column_name = 'daily_calorie_goal') THEN
        ALTER TABLE user_health_profiles ADD COLUMN daily_calorie_goal INTEGER CHECK (daily_calorie_goal >= 800 AND daily_calorie_goal <= 5000);
    END IF;

    -- Add notes if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_health_profiles' AND column_name = 'notes') THEN
        ALTER TABLE user_health_profiles ADD COLUMN notes TEXT;
    END IF;
END $$;

-- Remove blood_type column if it exists (since you don't want it)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'user_health_profiles' AND column_name = 'blood_type') THEN
        ALTER TABLE user_health_profiles DROP COLUMN blood_type;
    END IF;
END $$;

-- Remove old health_goal column if it exists (replaced with health_goals JSONB)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'user_health_profiles' AND column_name = 'health_goal') THEN
        ALTER TABLE user_health_profiles DROP COLUMN health_goal;
    END IF;
END $$;

-- Update comments for documentation
COMMENT ON COLUMN user_health_profiles.target_weight_kg IS 'User target weight in kilograms';
COMMENT ON COLUMN user_health_profiles.health_goals IS 'User health objectives stored as JSONB array';
COMMENT ON COLUMN user_health_profiles.medical_conditions IS 'User medical conditions stored as JSONB array';
COMMENT ON COLUMN user_health_profiles.medications IS 'User current medications stored as JSONB array';
COMMENT ON COLUMN user_health_profiles.bmi IS 'Body Mass Index (calculated)';
COMMENT ON COLUMN user_health_profiles.bmr IS 'Basal Metabolic Rate (calculated)';
COMMENT ON COLUMN user_health_profiles.daily_calorie_goal IS 'Target daily calories based on BMR and activity level';
COMMENT ON COLUMN user_health_profiles.notes IS 'Additional health notes and information';