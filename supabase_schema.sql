-- WellNoosh Database Schema for Supabase
-- Run these SQL commands in your Supabase SQL Editor
-- Safe to run multiple times - will not overwrite existing tables or data

-- 1. User Health Profiles Table
-- Stores user health goals, dietary preferences, and lifestyle information
CREATE TABLE IF NOT EXISTS user_health_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  health_goals TEXT[] DEFAULT '{}',
  allergies TEXT[] DEFAULT '{}',
  medical_conditions TEXT[] DEFAULT '{}',
  diet_style TEXT,
  activity_level TEXT,
  cooking_skill TEXT,
  weight_kg DECIMAL(5,2),
  height_cm DECIMAL(5,2),
  target_weight_kg DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for user_health_profiles
ALTER TABLE user_health_profiles ENABLE ROW LEVEL SECURITY;

-- Policies for user_health_profiles (drop first if exists)
DROP POLICY IF EXISTS "Users can view own health profile" ON user_health_profiles;
DROP POLICY IF EXISTS "Users can insert own health profile" ON user_health_profiles;
DROP POLICY IF EXISTS "Users can update own health profile" ON user_health_profiles;

CREATE POLICY "Users can view own health profile" ON user_health_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own health profile" ON user_health_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own health profile" ON user_health_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- 2. Daily Check-Ins Table (Daily Reflections)
-- Stores daily health metrics and reflections
CREATE TABLE IF NOT EXISTS daily_check_ins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  check_in_date DATE DEFAULT CURRENT_DATE,
  weight_kg DECIMAL(5,2),
  water_intake INTEGER DEFAULT 0,
  sleep_hours DECIMAL(3,1) DEFAULT 0,
  exercise_minutes INTEGER DEFAULT 0,
  cigarettes_per_day INTEGER DEFAULT 0,
  alcohol_drinks_per_week INTEGER DEFAULT 0,
  coffee_cups_per_day INTEGER DEFAULT 0,
  stress_level INTEGER CHECK (stress_level >= 1 AND stress_level <= 10),
  energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 10),
  mood TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for daily_check_ins
ALTER TABLE daily_check_ins ENABLE ROW LEVEL SECURITY;

-- Policies for daily_check_ins (drop first if exists)
DROP POLICY IF EXISTS "Users can view own check-ins" ON daily_check_ins;
DROP POLICY IF EXISTS "Users can insert own check-ins" ON daily_check_ins;
DROP POLICY IF EXISTS "Users can update own check-ins" ON daily_check_ins;
DROP POLICY IF EXISTS "Users can delete own check-ins" ON daily_check_ins;

CREATE POLICY "Users can view own check-ins" ON daily_check_ins
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own check-ins" ON daily_check_ins
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own check-ins" ON daily_check_ins
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own check-ins" ON daily_check_ins
  FOR DELETE USING (auth.uid() = user_id);

-- 3. Weight Logs Table
-- Tracks weight history over time
CREATE TABLE IF NOT EXISTS weight_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  weight_kg DECIMAL(5,2) NOT NULL,
  logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for weight_logs
ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;

-- Policies for weight_logs (drop first if exists)
DROP POLICY IF EXISTS "Users can view own weight logs" ON weight_logs;
DROP POLICY IF EXISTS "Users can insert own weight logs" ON weight_logs;

CREATE POLICY "Users can view own weight logs" ON weight_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own weight logs" ON weight_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- NOTE: meal_plans table is SKIPPED - you already have it configured
-- Your existing meal_plans table uses: plan_date, meal_slot, recipe_id, recipe_title, etc.

-- 4. Grocery Items Table
-- Stores user's grocery list items
CREATE TABLE IF NOT EXISTS grocery_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  amount TEXT,
  category TEXT DEFAULT 'Pantry',
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for grocery_items
ALTER TABLE grocery_items ENABLE ROW LEVEL SECURITY;

-- Policies for grocery_items (drop first if exists)
DROP POLICY IF EXISTS "Users can view own grocery items" ON grocery_items;
DROP POLICY IF EXISTS "Users can insert own grocery items" ON grocery_items;
DROP POLICY IF EXISTS "Users can update own grocery items" ON grocery_items;
DROP POLICY IF EXISTS "Users can delete own grocery items" ON grocery_items;

CREATE POLICY "Users can view own grocery items" ON grocery_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own grocery items" ON grocery_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own grocery items" ON grocery_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own grocery items" ON grocery_items
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_daily_check_ins_user_date ON daily_check_ins(user_id, check_in_date);
CREATE INDEX IF NOT EXISTS idx_grocery_items_user ON grocery_items(user_id);
CREATE INDEX IF NOT EXISTS idx_weight_logs_user_date ON weight_logs(user_id, logged_at);
-- Note: idx_meal_plans_user_date already exists in your meal_plans table
