-- Add nutrition columns to meal_plans table
-- Run this in your Supabase SQL Editor

-- Add nutrition columns (safe to run multiple times)
ALTER TABLE meal_plans ADD COLUMN IF NOT EXISTS calories INTEGER DEFAULT 0;
ALTER TABLE meal_plans ADD COLUMN IF NOT EXISTS protein_g DECIMAL(5,1) DEFAULT 0;
ALTER TABLE meal_plans ADD COLUMN IF NOT EXISTS carbs_g DECIMAL(5,1) DEFAULT 0;
ALTER TABLE meal_plans ADD COLUMN IF NOT EXISTS fat_g DECIMAL(5,1) DEFAULT 0;
ALTER TABLE meal_plans ADD COLUMN IF NOT EXISTS fiber_g DECIMAL(5,1) DEFAULT 0;
ALTER TABLE meal_plans ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT false;

-- Create user nutrition goals table for storing daily targets
CREATE TABLE IF NOT EXISTS user_nutrition_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  calorie_goal INTEGER DEFAULT 2000,
  protein_goal_g INTEGER DEFAULT 50,
  carbs_goal_g INTEGER DEFAULT 250,
  fat_goal_g INTEGER DEFAULT 65,
  fiber_goal_g INTEGER DEFAULT 25,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for user_nutrition_goals
ALTER TABLE user_nutrition_goals ENABLE ROW LEVEL SECURITY;

-- Policies for user_nutrition_goals (drop first if exists)
DROP POLICY IF EXISTS "Users can view own nutrition goals" ON user_nutrition_goals;
DROP POLICY IF EXISTS "Users can insert own nutrition goals" ON user_nutrition_goals;
DROP POLICY IF EXISTS "Users can update own nutrition goals" ON user_nutrition_goals;

CREATE POLICY "Users can view own nutrition goals" ON user_nutrition_goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own nutrition goals" ON user_nutrition_goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own nutrition goals" ON user_nutrition_goals
  FOR UPDATE USING (auth.uid() = user_id);
