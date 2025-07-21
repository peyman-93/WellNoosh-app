-- WellNoosh Database Schema
-- Initial migration for health tracking tables

-- Create water_intake table
CREATE TABLE IF NOT EXISTS public.water_intake (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount INTEGER DEFAULT 0, -- Amount in ml
  goal INTEGER DEFAULT 2000, -- Daily goal in ml
  unit VARCHAR(10) DEFAULT 'ml',
  glasses BOOLEAN[] DEFAULT ARRAY[false,false,false,false,false,false,false,false], -- 8 glasses
  daily_goal INTEGER DEFAULT 8, -- Number of glasses goal
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, date), -- One record per user per day
  CHECK (amount >= 0),
  CHECK (goal > 0),
  CHECK (daily_goal > 0),
  CHECK (array_length(glasses, 1) = 8)
);

-- Create breathing_exercises table
CREATE TABLE IF NOT EXISTS public.breathing_exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  sessions INTEGER DEFAULT 0, -- Number of completed sessions
  total_minutes INTEGER DEFAULT 0, -- Total minutes spent
  goal INTEGER DEFAULT 3, -- Daily session goal
  exercises BOOLEAN[] DEFAULT ARRAY[false,false,false,false,false,false], -- 6 exercise slots
  daily_goal INTEGER DEFAULT 6, -- Number of exercises goal
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, date), -- One record per user per day
  CHECK (sessions >= 0),
  CHECK (total_minutes >= 0),
  CHECK (goal > 0),
  CHECK (daily_goal > 0),
  CHECK (array_length(exercises, 1) = 6)
);

-- Create health_metrics table
CREATE TABLE IF NOT EXISTS public.health_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  weight DECIMAL(5,2), -- kg with 2 decimal places
  mood INTEGER CHECK (mood >= 1 AND mood <= 10), -- 1-10 scale
  sleep_hours DECIMAL(3,1) CHECK (sleep_hours >= 0 AND sleep_hours <= 24), -- Hours with 1 decimal
  energy_level VARCHAR(10) CHECK (energy_level IN ('Low', 'Medium', 'High')),
  stress_level INTEGER CHECK (stress_level >= 1 AND stress_level <= 10), -- 1-10 scale
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, date) -- One record per user per day
);

-- Create user_profiles table (extends auth.users with app-specific data)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  country TEXT,
  city TEXT,
  postal_code TEXT,
  age INTEGER CHECK (age >= 13 AND age <= 120),
  gender TEXT,
  weight DECIMAL(5,2) CHECK (weight > 0),
  weight_unit VARCHAR(5) DEFAULT 'kg' CHECK (weight_unit IN ('kg', 'lbs')),
  height DECIMAL(5,2) CHECK (height > 0),
  height_unit VARCHAR(5) DEFAULT 'cm' CHECK (height_unit IN ('cm', 'ft')),
  height_feet INTEGER CHECK (height_feet >= 0 AND height_feet <= 8),
  height_inches INTEGER CHECK (height_inches >= 0 AND height_inches < 12),
  diet_style TEXT[],
  custom_diet_style TEXT,
  allergies TEXT[],
  medical_conditions TEXT[],
  activity_level TEXT,
  health_goals TEXT[],
  food_restrictions TEXT[],
  cooking_skill TEXT,
  meal_preference TEXT,
  subscription_tier VARCHAR(10) DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium')),
  daily_swipes_used INTEGER DEFAULT 0,
  last_swipe_date DATE DEFAULT CURRENT_DATE,
  favorite_recipes TEXT[],
  selected_recipes TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_water_intake_user_date ON public.water_intake(user_id, date);
CREATE INDEX IF NOT EXISTS idx_breathing_exercises_user_date ON public.breathing_exercises(user_id, date);
CREATE INDEX IF NOT EXISTS idx_health_metrics_user_date ON public.health_metrics(user_id, date);
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription ON public.user_profiles(subscription_tier);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_water_intake_updated_at BEFORE UPDATE ON public.water_intake
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_breathing_exercises_updated_at BEFORE UPDATE ON public.breathing_exercises
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_health_metrics_updated_at BEFORE UPDATE ON public.health_metrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.water_intake ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.breathing_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies - users can only access their own data
CREATE POLICY "Users can view own water intake" ON public.water_intake
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own water intake" ON public.water_intake
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own water intake" ON public.water_intake
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own water intake" ON public.water_intake
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own breathing exercises" ON public.breathing_exercises
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own breathing exercises" ON public.breathing_exercises
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own breathing exercises" ON public.breathing_exercises
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own breathing exercises" ON public.breathing_exercises
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own health metrics" ON public.health_metrics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own health metrics" ON public.health_metrics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own health metrics" ON public.health_metrics
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own health metrics" ON public.health_metrics
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can delete own profile" ON public.user_profiles
  FOR DELETE USING (auth.uid() = id);