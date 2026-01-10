-- =====================================================
-- Daily Nutrition Tracking Tables
-- Purpose: Store daily nutrition data when meals are cooked
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Daily Nutrition Summary Table
-- Aggregated daily nutrition totals for quick dashboard display
CREATE TABLE IF NOT EXISTS daily_nutrition_summary (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  
  -- Nutrition totals
  total_calories INTEGER DEFAULT 0,
  total_protein_g DECIMAL(8,2) DEFAULT 0,
  total_carbs_g DECIMAL(8,2) DEFAULT 0,
  total_fat_g DECIMAL(8,2) DEFAULT 0,
  total_fiber_g DECIMAL(8,2) DEFAULT 0,
  total_sodium_mg INTEGER DEFAULT 0,
  total_sugar_g DECIMAL(8,2) DEFAULT 0,
  
  -- Meal tracking
  completed_meals_count INTEGER DEFAULT 0,
  planned_meals_count INTEGER DEFAULT 4,
  total_entries_count INTEGER DEFAULT 0,
  completion_percentage INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint: one summary per user per day
  UNIQUE(user_id, log_date)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_daily_nutrition_user_date 
  ON daily_nutrition_summary(user_id, log_date DESC);

-- Individual Meal Logs Table
-- Detailed record of each meal logged (for history and analysis)
CREATE TABLE IF NOT EXISTS nutrition_meal_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  
  -- Meal info
  meal_slot VARCHAR(20) NOT NULL CHECK (meal_slot IN ('breakfast', 'lunch', 'dinner', 'snack')),
  meal_name VARCHAR(255) NOT NULL,
  meal_plan_entry_id UUID, -- Reference to meal_plan_entries if applicable
  
  -- Nutrition values
  calories INTEGER DEFAULT 0,
  protein_g DECIMAL(8,2) DEFAULT 0,
  carbs_g DECIMAL(8,2) DEFAULT 0,
  fat_g DECIMAL(8,2) DEFAULT 0,
  fiber_g DECIMAL(8,2) DEFAULT 0,
  
  -- Timestamps
  logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_meal_logs_user_date 
  ON nutrition_meal_logs(user_id, log_date DESC);

-- Row Level Security (RLS) Policies
-- Enable RLS on both tables
ALTER TABLE daily_nutrition_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_meal_logs ENABLE ROW LEVEL SECURITY;

-- Allow users to see only their own data
CREATE POLICY "Users can view own nutrition summary"
  ON daily_nutrition_summary FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own nutrition summary"
  ON daily_nutrition_summary FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own nutrition summary"
  ON daily_nutrition_summary FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own nutrition summary"
  ON daily_nutrition_summary FOR DELETE
  USING (auth.uid() = user_id);

-- Same policies for meal logs
CREATE POLICY "Users can view own meal logs"
  ON nutrition_meal_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meal logs"
  ON nutrition_meal_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meal logs"
  ON nutrition_meal_logs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own meal logs"
  ON nutrition_meal_logs FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- Helper Function: Get today's nutrition for a user
-- =====================================================
CREATE OR REPLACE FUNCTION get_today_nutrition(p_user_id UUID)
RETURNS TABLE (
  calories INTEGER,
  protein_g DECIMAL,
  carbs_g DECIMAL,
  fat_g DECIMAL,
  meals_logged INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(dns.total_calories, 0)::INTEGER,
    COALESCE(dns.total_protein_g, 0)::DECIMAL,
    COALESCE(dns.total_carbs_g, 0)::DECIMAL,
    COALESCE(dns.total_fat_g, 0)::DECIMAL,
    COALESCE(dns.completed_meals_count, 0)::INTEGER
  FROM daily_nutrition_summary dns
  WHERE dns.user_id = p_user_id
    AND dns.log_date = CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
