-- WellNoosh Simplified User Onboarding Database Schema
-- Compatible with Supabase SQL Editor
-- Includes comprehensive RLS policies for security

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (be careful in production!)
DROP TABLE IF EXISTS user_dietary_preferences CASCADE;
DROP TABLE IF EXISTS user_health_profiles CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Create user_profiles table
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255),
    country VARCHAR(100),
    city VARCHAR(100),
    postal_code VARCHAR(20),
    address TEXT,
    cooking_experience_level VARCHAR(50) CHECK (
        cooking_experience_level IN (
            'Beginner (basic cooking)',
            'Intermediate (comfortable with recipes)',
            'Advanced (creative cooking)',
            'Expert (professional level)'
        )
    ),
    cooking_frequency VARCHAR(50) CHECK (
        cooking_frequency IN (
            'Daily',
            'Several times a week',
            'Weekly',
            'Occasionally',
            'Rarely'
        )
    ),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_profile UNIQUE(user_id)
);

-- Create user_health_profiles table
CREATE TABLE user_health_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    age INTEGER CHECK (age >= 13 AND age <= 120),
    gender VARCHAR(50) CHECK (
        gender IN ('Male', 'Female', 'Non-binary', 'Prefer not to say')
    ),
    height_cm DECIMAL(5,2) CHECK (height_cm >= 50 AND height_cm <= 300),
    weight_kg DECIMAL(5,2) CHECK (weight_kg >= 20 AND weight_kg <= 500),
    target_weight_kg DECIMAL(5,2) CHECK (target_weight_kg >= 20 AND target_weight_kg <= 500),
    activity_level VARCHAR(100) CHECK (
        activity_level IN (
            'Sedentary (little/no exercise)',
            'Lightly Active (1-3 days/week)',
            'Moderately Active (3-5 days/week)',
            'Very Active (5-7 days/week)',
            'Extremely Active (physical job)'
        )
    ),
    health_goals JSONB,
    medical_conditions JSONB,
    medications JSONB,
    bmi DECIMAL(4,2),
    bmr INTEGER,
    daily_calorie_goal INTEGER CHECK (daily_calorie_goal >= 800 AND daily_calorie_goal <= 5000),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_health_profile UNIQUE(user_id)
);

-- Create user_dietary_preferences table
CREATE TABLE user_dietary_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    dietary_restrictions TEXT[],
    allergies TEXT[],
    intolerances TEXT[],
    liked_cuisines TEXT[],
    disliked_cuisines TEXT[],
    preferred_meal_types TEXT[],
    cooking_time_preference VARCHAR(50) CHECK (
        cooking_time_preference IN (
            'Quick & Easy (15-30 min)',
            'Moderate (30-60 min)',
            'Elaborate (60+ min)',
            'Meal Prep Friendly',
            'One-Pot Meals'
        )
    ),
    spice_tolerance VARCHAR(20) CHECK (
        spice_tolerance IN ('None', 'Mild', 'Medium', 'Hot', 'Very Hot')
    ),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_dietary_preferences UNIQUE(user_id)
);

-- Create indexes for better performance
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_health_profiles_user_id ON user_health_profiles(user_id);
CREATE INDEX idx_user_dietary_preferences_user_id ON user_dietary_preferences(user_id);

-- Create update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update timestamp triggers
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_health_profiles_updated_at
    BEFORE UPDATE ON user_health_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_dietary_preferences_updated_at
    BEFORE UPDATE ON user_dietary_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_health_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_dietary_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_profiles
-- Users can only view their own profile
CREATE POLICY "Users can view own profile"
    ON user_profiles FOR SELECT
    USING (auth.uid() = user_id);

-- Users can only insert their own profile
CREATE POLICY "Users can insert own profile"
    ON user_profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile"
    ON user_profiles FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own profile
CREATE POLICY "Users can delete own profile"
    ON user_profiles FOR DELETE
    USING (auth.uid() = user_id);

-- Create RLS policies for user_health_profiles
-- Users can only view their own health profile
CREATE POLICY "Users can view own health profile"
    ON user_health_profiles FOR SELECT
    USING (auth.uid() = user_id);

-- Users can only insert their own health profile
CREATE POLICY "Users can insert own health profile"
    ON user_health_profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can only update their own health profile
CREATE POLICY "Users can update own health profile"
    ON user_health_profiles FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own health profile
CREATE POLICY "Users can delete own health profile"
    ON user_health_profiles FOR DELETE
    USING (auth.uid() = user_id);

-- Create RLS policies for user_dietary_preferences
-- Users can only view their own dietary preferences
CREATE POLICY "Users can view own dietary preferences"
    ON user_dietary_preferences FOR SELECT
    USING (auth.uid() = user_id);

-- Users can only insert their own dietary preferences
CREATE POLICY "Users can insert own dietary preferences"
    ON user_dietary_preferences FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can only update their own dietary preferences
CREATE POLICY "Users can update own dietary preferences"
    ON user_dietary_preferences FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own dietary preferences
CREATE POLICY "Users can delete own dietary preferences"
    ON user_dietary_preferences FOR DELETE
    USING (auth.uid() = user_id);

-- Create helper functions for administrators (optional)
-- These functions can only be called by service role or admin users

-- Function to get user statistics (admin only)
CREATE OR REPLACE FUNCTION get_user_statistics()
RETURNS TABLE (
    total_users BIGINT,
    users_with_profiles BIGINT,
    users_with_health_profiles BIGINT,
    users_with_dietary_preferences BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Only allow service role to execute this
    IF auth.role() != 'service_role' THEN
        RAISE EXCEPTION 'Access denied. Service role required.';
    END IF;
    
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT u.id),
        COUNT(DISTINCT up.user_id),
        COUNT(DISTINCT uhp.user_id),
        COUNT(DISTINCT udp.user_id)
    FROM auth.users u
    LEFT JOIN user_profiles up ON u.id = up.user_id
    LEFT JOIN user_health_profiles uhp ON u.id = uhp.user_id
    LEFT JOIN user_dietary_preferences udp ON u.id = udp.user_id;
END;
$$;

-- Grant necessary permissions to authenticated users
GRANT ALL ON user_profiles TO authenticated;
GRANT ALL ON user_health_profiles TO authenticated;
GRANT ALL ON user_dietary_preferences TO authenticated;

-- Grant sequence permissions
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Comments for documentation
COMMENT ON TABLE user_profiles IS 'Stores basic user profile information including location and cooking preferences';
COMMENT ON TABLE user_health_profiles IS 'Stores user health-related information for personalized nutrition recommendations';
COMMENT ON TABLE user_dietary_preferences IS 'Stores user dietary preferences, restrictions, and food preferences';

COMMENT ON COLUMN user_profiles.cooking_experience_level IS 'User self-reported cooking skill level';
COMMENT ON COLUMN user_profiles.cooking_frequency IS 'How often the user typically cooks';
COMMENT ON COLUMN user_health_profiles.height_cm IS 'User height in centimeters';
COMMENT ON COLUMN user_health_profiles.weight_kg IS 'User weight in kilograms';
COMMENT ON COLUMN user_dietary_preferences.dietary_restrictions IS 'Array of dietary restrictions (e.g., vegetarian, vegan, kosher)';
COMMENT ON COLUMN user_dietary_preferences.allergies IS 'Array of food allergies';
COMMENT ON COLUMN user_dietary_preferences.intolerances IS 'Array of food intolerances';

-- Sample data insertion (for testing - remove in production)
-- This will only work if you have a test user
/*
-- Example of how to insert data (users can only insert their own data due to RLS)
INSERT INTO user_profiles (user_id, country, city, postal_code, cooking_experience_level, cooking_frequency)
VALUES (auth.uid(), 'United States', 'San Francisco', '94105', 'Intermediate (comfortable with recipes)', 'Daily');

INSERT INTO user_health_profiles (user_id, age, gender, height_cm, weight_kg, activity_level, health_goal)
VALUES (auth.uid(), 30, 'Male', 175.5, 70.5, 'Moderately Active (3-5 days/week)', 'Maintain Weight');

INSERT INTO user_dietary_preferences (user_id, dietary_restrictions, allergies, liked_cuisines, cooking_time_preference)
VALUES (auth.uid(), ARRAY['Vegetarian'], ARRAY['Peanuts'], ARRAY['Italian', 'Mexican', 'Thai'], 'Quick & Easy (15-30 min)');
*/

-- Verification queries (for testing)
-- SELECT * FROM user_profiles WHERE user_id = auth.uid();
-- SELECT * FROM user_health_profiles WHERE user_id = auth.uid();
-- SELECT * FROM user_dietary_preferences WHERE user_id = auth.uid();