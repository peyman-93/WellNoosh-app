-- ================================================================================================
-- Database Fixes and Meal Plan System
-- Migration: 20250201_database_fixes_and_meal_plans.sql
-- Purpose: Fix existing issues and add scalable meal planning system
-- Author: Claude AI Assistant
-- Date: February 1, 2025
-- ================================================================================================

-- ================================================================================================
-- 1. FIX EXISTING ISSUES
-- ================================================================================================

-- Add email column to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Update existing records with email from auth.users (if any exist)
UPDATE user_profiles p
SET email = u.email
FROM auth.users u
WHERE p.user_id = u.id AND p.email IS NULL;

-- Create unique index for email lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);

-- Create August 2025 partition for user_food_logs (fix current date issue)
CREATE TABLE IF NOT EXISTS user_food_logs_2025_08 PARTITION OF user_food_logs
FOR VALUES FROM ('2025-08-01') TO ('2025-09-01');

-- Create indexes on August partition
CREATE INDEX IF NOT EXISTS idx_user_food_logs_2025_08_user_date ON user_food_logs_2025_08 (user_id, log_date DESC, entry_type);
CREATE INDEX IF NOT EXISTS idx_user_food_logs_2025_08_completed ON user_food_logs_2025_08 (user_id, log_date, is_completed) WHERE entry_type = 'planned_meal';
CREATE INDEX IF NOT EXISTS idx_user_food_logs_2025_08_recent ON user_food_logs_2025_08 (user_id, logged_at DESC) WHERE log_date >= '2025-08-01'::date - INTERVAL '7 days';

-- Create remaining partitions for 2025 (September through December)
DO $$
DECLARE
    month_num INTEGER;
    partition_name TEXT;
BEGIN
    FOR month_num IN 9..12 LOOP
        partition_name := 'user_food_logs_2025_' || LPAD(month_num::TEXT, 2, '0');
        
        EXECUTE format('CREATE TABLE IF NOT EXISTS %I PARTITION OF user_food_logs
                       FOR VALUES FROM (%L) TO (%L)',
                       partition_name,
                       ('2025-' || LPAD(month_num::TEXT, 2, '0') || '-01')::date,
                       ('2025-' || LPAD(month_num::TEXT, 2, '0') || '-01')::date + INTERVAL '1 month'
        );
        
        -- Create indexes
        EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I (user_id, log_date DESC, entry_type)',
                       partition_name || '_user_date_idx', partition_name);
        
        EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I (user_id, log_date, is_completed) WHERE entry_type = ''planned_meal''',
                       partition_name || '_completed_idx', partition_name);
    END LOOP;
END $$;

-- ================================================================================================
-- 2. MEAL PLAN SYSTEM TABLES
-- ================================================================================================

-- User meal plans table (scalable design)
CREATE TABLE user_meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_date DATE NOT NULL,
  plan_name VARCHAR(255) NOT NULL DEFAULT 'Daily Meal Plan',
  
  -- Plan metadata
  generation_method VARCHAR(50) DEFAULT 'mock' CHECK (generation_method IN ('mock', 'ai', 'manual', 'template')),
  plan_status VARCHAR(20) DEFAULT 'active' CHECK (plan_status IN ('draft', 'active', 'completed', 'archived')),
  
  -- Nutritional targets
  target_calories INTEGER CHECK (target_calories > 0),
  target_protein_g DECIMAL(6,2) CHECK (target_protein_g >= 0),
  target_carbs_g DECIMAL(6,2) CHECK (target_carbs_g >= 0),
  target_fat_g DECIMAL(6,2) CHECK (target_fat_g >= 0),
  target_fiber_g DECIMAL(6,2) CHECK (target_fiber_g >= 0),
  
  -- Plan configuration
  meals_per_day INTEGER DEFAULT 3 CHECK (meals_per_day BETWEEN 1 AND 8),
  include_snacks BOOLEAN DEFAULT true,
  dietary_preferences JSONB, -- Array of dietary restrictions
  excluded_ingredients JSONB, -- Array of ingredients to avoid
  
  -- Plan totals (calculated from planned_meals)
  total_planned_calories INTEGER DEFAULT 0,
  total_planned_protein_g DECIMAL(8,2) DEFAULT 0,
  total_planned_carbs_g DECIMAL(8,2) DEFAULT 0,
  total_planned_fat_g DECIMAL(8,2) DEFAULT 0,
  total_meals_count INTEGER DEFAULT 0,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, plan_date) -- One plan per user per date
);

-- Create indexes for fast user queries
CREATE INDEX idx_meal_plans_user_date ON user_meal_plans (user_id, plan_date DESC);
CREATE INDEX idx_meal_plans_date ON user_meal_plans (plan_date DESC);
CREATE INDEX idx_meal_plans_status ON user_meal_plans (user_id, plan_status, plan_date DESC);
CREATE INDEX idx_meal_plans_created ON user_meal_plans (created_at DESC);

-- Individual planned meals table (scalable design)
CREATE TABLE planned_meals (
  id BIGSERIAL PRIMARY KEY,
  meal_plan_id UUID NOT NULL REFERENCES user_meal_plans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_date DATE NOT NULL, -- Denormalized for fast queries
  
  -- Meal details
  meal_type VARCHAR(50) NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack', 'brunch', 'other')),
  meal_order INTEGER DEFAULT 1 CHECK (meal_order > 0), -- Order within meal type (e.g., snack 1, snack 2)
  scheduled_time TIME, -- Suggested eating time
  
  -- Food details
  food_name VARCHAR(255) NOT NULL,
  recipe_id UUID, -- Optional reference to recipes table (when available)
  serving_size DECIMAL(4,2) DEFAULT 1 CHECK (serving_size > 0),
  serving_unit VARCHAR(50) DEFAULT 'serving',
  
  -- Nutritional data (denormalized for performance)
  calories INTEGER NOT NULL CHECK (calories >= 0),
  protein_g DECIMAL(6,2) DEFAULT 0 CHECK (protein_g >= 0),
  carbs_g DECIMAL(6,2) DEFAULT 0 CHECK (carbs_g >= 0),
  fat_g DECIMAL(6,2) DEFAULT 0 CHECK (fat_g >= 0),
  fiber_g DECIMAL(6,2) DEFAULT 0 CHECK (fiber_g >= 0),
  sugar_g DECIMAL(6,2) DEFAULT 0 CHECK (sugar_g >= 0),
  sodium_mg INTEGER DEFAULT 0 CHECK (sodium_mg >= 0),
  
  -- Meal attributes
  food_category VARCHAR(100),
  preparation_method VARCHAR(100),
  cooking_time_minutes INTEGER CHECK (cooking_time_minutes >= 0),
  difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
  
  -- Planning metadata
  substitutable BOOLEAN DEFAULT true, -- Can this meal be substituted
  priority_level INTEGER DEFAULT 1 CHECK (priority_level BETWEEN 1 AND 5), -- 1=lowest, 5=highest
  tags JSONB, -- Array of tags for meal categorization
  
  -- Completion tracking (links to food logging)
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  food_log_entry_id BIGINT, -- Reference to user_food_logs when completed
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for optimal performance
CREATE INDEX idx_planned_meals_meal_plan ON planned_meals (meal_plan_id, meal_order);
CREATE INDEX idx_planned_meals_user_date ON planned_meals (user_id, plan_date, meal_type, meal_order);
CREATE INDEX idx_planned_meals_completion ON planned_meals (user_id, plan_date, is_completed);
CREATE INDEX idx_planned_meals_recipe ON planned_meals (recipe_id) WHERE recipe_id IS NOT NULL;
CREATE INDEX idx_planned_meals_food_log ON planned_meals (food_log_entry_id) WHERE food_log_entry_id IS NOT NULL;

-- ================================================================================================
-- 3. TRIGGERS FOR AUTOMATIC CALCULATIONS
-- ================================================================================================

-- Function to update meal plan totals when planned meals change
CREATE OR REPLACE FUNCTION update_meal_plan_totals()
RETURNS TRIGGER AS $$
DECLARE
  plan_totals RECORD;
  target_plan_id UUID;
BEGIN
  -- Get the meal plan ID from the affected row
  target_plan_id := COALESCE(NEW.meal_plan_id, OLD.meal_plan_id);
  
  -- Calculate totals for this meal plan
  SELECT 
    COALESCE(SUM(calories), 0) as total_calories,
    COALESCE(SUM(protein_g), 0) as total_protein,
    COALESCE(SUM(carbs_g), 0) as total_carbs,
    COALESCE(SUM(fat_g), 0) as total_fat,
    COUNT(*) as total_meals
  INTO plan_totals
  FROM planned_meals
  WHERE meal_plan_id = target_plan_id;
  
  -- Update meal plan totals
  UPDATE user_meal_plans
  SET 
    total_planned_calories = plan_totals.total_calories,
    total_planned_protein_g = plan_totals.total_protein,
    total_planned_carbs_g = plan_totals.total_carbs,
    total_planned_fat_g = plan_totals.total_fat,
    total_meals_count = plan_totals.total_meals,
    updated_at = NOW()
  WHERE id = target_plan_id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for meal plan totals
CREATE TRIGGER trigger_update_meal_plan_totals
  AFTER INSERT OR UPDATE OR DELETE ON planned_meals
  FOR EACH ROW EXECUTE FUNCTION update_meal_plan_totals();

-- Function to link completed planned meals to food logs
CREATE OR REPLACE FUNCTION link_planned_meal_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- If a planned meal is marked as completed, create/update the food log entry
  IF NEW.is_completed = true AND (OLD.is_completed = false OR OLD.is_completed IS NULL) THEN
    
    -- Insert into user_food_logs if not already linked
    IF NEW.food_log_entry_id IS NULL THEN
      INSERT INTO user_food_logs (
        user_id,
        log_date,
        entry_type,
        meal_type,
        food_name,
        recipe_id,
        calories,
        protein_g,
        carbs_g,
        fat_g,
        fiber_g,
        sugar_g,
        sodium_mg,
        is_completed,
        completed_at,
        planned_serving_size,
        actual_serving_size,
        food_category,
        preparation_method,
        notes
      ) VALUES (
        NEW.user_id,
        NEW.plan_date,
        'planned_meal',
        NEW.meal_type,
        NEW.food_name,
        NEW.recipe_id,
        NEW.calories,
        NEW.protein_g,
        NEW.carbs_g,
        NEW.fat_g,
        NEW.fiber_g,
        NEW.sugar_g,
        NEW.sodium_mg,
        true,
        NEW.completed_at,
        NEW.serving_size,
        NEW.serving_size, -- Default actual = planned
        NEW.food_category,
        NEW.preparation_method,
        NEW.notes
      ) RETURNING id INTO NEW.food_log_entry_id;
    END IF;
    
  -- If marked as not completed, update the food log entry
  ELSIF NEW.is_completed = false AND OLD.is_completed = true THEN
    
    -- Update the linked food log entry
    IF NEW.food_log_entry_id IS NOT NULL THEN
      UPDATE user_food_logs 
      SET is_completed = false, completed_at = NULL
      WHERE id = NEW.food_log_entry_id;
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for planned meal completion
CREATE TRIGGER trigger_link_planned_meal_completion
  BEFORE UPDATE ON planned_meals
  FOR EACH ROW 
  WHEN (OLD.is_completed IS DISTINCT FROM NEW.is_completed)
  EXECUTE FUNCTION link_planned_meal_completion();

-- ================================================================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ================================================================================================

-- Enable RLS on new tables
ALTER TABLE user_meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE planned_meals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_meal_plans
CREATE POLICY "Users can view own meal plans" ON user_meal_plans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meal plans" ON user_meal_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meal plans" ON user_meal_plans
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meal plans" ON user_meal_plans
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for planned_meals
CREATE POLICY "Users can view own planned meals" ON planned_meals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own planned meals" ON planned_meals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own planned meals" ON planned_meals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own planned meals" ON planned_meals
  FOR DELETE USING (auth.uid() = user_id);

-- Service role policies (for system operations)
CREATE POLICY "Service role full access meal plans" ON user_meal_plans
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access planned meals" ON planned_meals
  FOR ALL USING (auth.role() = 'service_role');

-- ================================================================================================
-- 5. HELPER FUNCTIONS
-- ================================================================================================

-- Function to get user's meal plan for a specific date
CREATE OR REPLACE FUNCTION get_user_meal_plan(
  target_user_id UUID,
  target_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  meal_plan JSONB,
  planned_meals JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    -- Meal plan data
    to_jsonb(mp) as meal_plan,
    
    -- Planned meals for this date
    COALESCE(
      (SELECT jsonb_agg(to_jsonb(pm) ORDER BY pm.meal_type, pm.meal_order, pm.scheduled_time) 
       FROM planned_meals pm 
       WHERE pm.user_id = target_user_id 
         AND pm.plan_date = target_date),
      '[]'::jsonb
    ) as planned_meals
    
  FROM user_meal_plans mp
  WHERE mp.user_id = target_user_id AND mp.plan_date = target_date;
END;
$$ LANGUAGE plpgsql;

-- Function to get meal plan with completion status
CREATE OR REPLACE FUNCTION get_meal_plan_with_status(
  target_user_id UUID,
  target_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  meal_plan JSONB,
  planned_meals JSONB,
  completion_summary JSONB
) AS $$
DECLARE
  completion_stats RECORD;
BEGIN
  -- Calculate completion statistics
  SELECT 
    COUNT(*) as total_meals,
    COUNT(*) FILTER (WHERE is_completed) as completed_meals,
    COALESCE(SUM(calories), 0) as total_planned_calories,
    COALESCE(SUM(CASE WHEN is_completed THEN calories ELSE 0 END), 0) as completed_calories
  INTO completion_stats
  FROM planned_meals 
  WHERE user_id = target_user_id AND plan_date = target_date;

  RETURN QUERY
  SELECT 
    -- Meal plan data
    to_jsonb(mp) as meal_plan,
    
    -- Planned meals with completion status
    COALESCE(
      (SELECT jsonb_agg(to_jsonb(pm) ORDER BY pm.meal_type, pm.meal_order, pm.scheduled_time) 
       FROM planned_meals pm 
       WHERE pm.user_id = target_user_id 
         AND pm.plan_date = target_date),
      '[]'::jsonb
    ) as planned_meals,
    
    -- Completion summary
    jsonb_build_object(
      'total_meals', completion_stats.total_meals,
      'completed_meals', completion_stats.completed_meals,
      'completion_percentage', 
        CASE WHEN completion_stats.total_meals > 0 
          THEN (completion_stats.completed_meals * 100 / completion_stats.total_meals) 
          ELSE 0 END,
      'total_planned_calories', completion_stats.total_planned_calories,
      'completed_calories', completion_stats.completed_calories
    ) as completion_summary
    
  FROM user_meal_plans mp
  WHERE mp.user_id = target_user_id AND mp.plan_date = target_date;
END;
$$ LANGUAGE plpgsql;

-- ================================================================================================
-- 6. INITIAL MOCK DATA SETUP
-- ================================================================================================

-- Create sample meal categories for mock generation
INSERT INTO food_categories (name, description, is_whole_food, color_hex, icon_name) VALUES
('Breakfast Items', 'Common breakfast foods', true, '#FFB84D', 'breakfast'),
('Lunch Options', 'Lunch meal components', true, '#4ECDC4', 'lunch'),
('Dinner Mains', 'Main dinner dishes', true, '#FF6B6B', 'dinner'),
('Healthy Snacks', 'Nutritious snack options', true, '#95E1D3', 'snacks')
ON CONFLICT (name) DO NOTHING;

-- ================================================================================================
-- END OF MIGRATION
-- ================================================================================================

-- Log successful migration
DO $$
BEGIN
  RAISE NOTICE 'Database fixes and meal plan system migration completed successfully!';
  RAISE NOTICE 'Added email column to user_profiles';
  RAISE NOTICE 'Created % food log partitions for 2025', 
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name LIKE 'user_food_logs_2025_%');
  RAISE NOTICE 'Created scalable meal planning system with user_meal_plans and planned_meals tables';
  RAISE NOTICE 'Set up automatic triggers for meal plan totals and food log integration';
  RAISE NOTICE 'Enabled Row Level Security for all new tables';
END $$;