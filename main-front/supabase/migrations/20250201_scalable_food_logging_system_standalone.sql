-- ================================================================================================
-- WellNoosh Scalable Food Logging System (Standalone Version)
-- Migration: 20250201_scalable_food_logging_system_standalone.sql
-- Purpose: Create scalable meal planning and food logging system with partitioning
-- Note: This version works independently without requiring the recipe system
-- Author: Claude AI Assistant
-- Date: February 1, 2025
-- ================================================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- ================================================================================================
-- 1. MAIN PARTITIONED TABLE: user_food_logs
-- ================================================================================================

-- Main partitioned table for all food logging (planned meals + additional food)
CREATE TABLE user_food_logs (
  id BIGSERIAL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Entry classification
  entry_type VARCHAR(20) NOT NULL CHECK (entry_type IN ('planned_meal', 'additional_food')),
  meal_type VARCHAR(50) NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack', 'brunch', 'other')),
  food_name VARCHAR(255) NOT NULL,
  
  -- Reference to planned meal (nullable - will be connected when recipe system is available)
  meal_plan_recipe_id UUID, -- Removed FK constraint for standalone version
  recipe_id UUID, -- Removed FK constraint for standalone version
  
  -- Nutritional data (denormalized for performance)
  calories INTEGER NOT NULL CHECK (calories >= 0),
  protein_g DECIMAL(6,2) DEFAULT 0 CHECK (protein_g >= 0),
  carbs_g DECIMAL(6,2) DEFAULT 0 CHECK (carbs_g >= 0),
  fat_g DECIMAL(6,2) DEFAULT 0 CHECK (fat_g >= 0),
  fiber_g DECIMAL(6,2) DEFAULT 0 CHECK (fiber_g >= 0),
  sugar_g DECIMAL(6,2) DEFAULT 0 CHECK (sugar_g >= 0),
  sodium_mg INTEGER DEFAULT 0 CHECK (sodium_mg >= 0),
  
  -- Completion and serving tracking
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  planned_serving_size DECIMAL(4,2) DEFAULT 1 CHECK (planned_serving_size > 0),
  actual_serving_size DECIMAL(4,2) CHECK (actual_serving_size > 0),
  
  -- Additional metadata
  food_category VARCHAR(100), -- drink, dessert, fast-food, protein, etc.
  preparation_method VARCHAR(100), -- grilled, fried, baked, raw, etc.
  brand_name VARCHAR(255), -- for packaged foods
  barcode VARCHAR(50), -- for food scanning functionality
  
  -- User notes and media
  notes TEXT,
  photo_url TEXT,
  confidence_score DECIMAL(3,2) DEFAULT 1.0 CHECK (confidence_score >= 0 AND confidence_score <= 1), -- for AI food recognition
  
  -- Timestamps
  logged_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Composite primary key for partitioning
  PRIMARY KEY (id, log_date)
) PARTITION BY RANGE (log_date);

-- Add comments for documentation
COMMENT ON TABLE user_food_logs IS 'Partitioned table storing all user food consumption data (planned meals and additional food)';
COMMENT ON COLUMN user_food_logs.entry_type IS 'Type of food entry: planned_meal (from meal plan) or additional_food (user added)';
COMMENT ON COLUMN user_food_logs.confidence_score IS 'AI confidence score for food recognition (1.0 = manual entry, <1.0 = AI recognized)';

-- ================================================================================================
-- 2. DAILY NUTRITION SUMMARY TABLE
-- ================================================================================================

-- Pre-calculated daily nutrition totals for fast dashboard queries
CREATE TABLE daily_nutrition_summary (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  
  -- Planned meal totals (from meal plan)
  planned_calories INTEGER DEFAULT 0 CHECK (planned_calories >= 0),
  planned_protein_g DECIMAL(8,2) DEFAULT 0 CHECK (planned_protein_g >= 0),
  planned_carbs_g DECIMAL(8,2) DEFAULT 0 CHECK (planned_carbs_g >= 0),
  planned_fat_g DECIMAL(8,2) DEFAULT 0 CHECK (planned_fat_g >= 0),
  planned_fiber_g DECIMAL(8,2) DEFAULT 0 CHECK (planned_fiber_g >= 0),
  planned_sugar_g DECIMAL(8,2) DEFAULT 0 CHECK (planned_sugar_g >= 0),
  planned_sodium_mg INTEGER DEFAULT 0 CHECK (planned_sodium_mg >= 0),
  planned_meals_count INTEGER DEFAULT 0 CHECK (planned_meals_count >= 0),
  completed_meals_count INTEGER DEFAULT 0 CHECK (completed_meals_count >= 0),
  
  -- Additional food totals (user added)
  additional_calories INTEGER DEFAULT 0 CHECK (additional_calories >= 0),
  additional_protein_g DECIMAL(8,2) DEFAULT 0 CHECK (additional_protein_g >= 0),
  additional_carbs_g DECIMAL(8,2) DEFAULT 0 CHECK (additional_carbs_g >= 0),
  additional_fat_g DECIMAL(8,2) DEFAULT 0 CHECK (additional_fat_g >= 0),
  additional_fiber_g DECIMAL(8,2) DEFAULT 0 CHECK (additional_fiber_g >= 0),
  additional_sugar_g DECIMAL(8,2) DEFAULT 0 CHECK (additional_sugar_g >= 0),
  additional_sodium_mg INTEGER DEFAULT 0 CHECK (additional_sodium_mg >= 0),
  additional_entries_count INTEGER DEFAULT 0 CHECK (additional_entries_count >= 0),
  
  -- Daily totals (computed columns for fast queries)
  total_calories INTEGER GENERATED ALWAYS AS (planned_calories + additional_calories) STORED,
  total_protein_g DECIMAL(8,2) GENERATED ALWAYS AS (planned_protein_g + additional_protein_g) STORED,
  total_carbs_g DECIMAL(8,2) GENERATED ALWAYS AS (planned_carbs_g + additional_carbs_g) STORED,
  total_fat_g DECIMAL(8,2) GENERATED ALWAYS AS (planned_fat_g + additional_fat_g) STORED,
  total_fiber_g DECIMAL(8,2) GENERATED ALWAYS AS (planned_fiber_g + additional_fiber_g) STORED,
  total_sugar_g DECIMAL(8,2) GENERATED ALWAYS AS (planned_sugar_g + additional_sugar_g) STORED,
  total_sodium_mg INTEGER GENERATED ALWAYS AS (planned_sodium_mg + additional_sodium_mg) STORED,
  total_entries_count INTEGER GENERATED ALWAYS AS (planned_meals_count + additional_entries_count) STORED,
  
  -- Progress tracking
  completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  calorie_goal INTEGER, -- Daily calorie goal from user health profile
  calorie_deficit_surplus INTEGER, -- Calculated: total_calories - calorie_goal
  
  -- Meal timing analysis
  first_meal_time TIME,
  last_meal_time TIME,
  eating_window_hours DECIMAL(4,2), -- Time between first and last meal
  
  -- Quality metrics
  whole_foods_percentage DECIMAL(5,2) DEFAULT 0, -- Percentage of unprocessed foods
  meal_plan_adherence_percentage DECIMAL(5,2) DEFAULT 0, -- How well user followed meal plan
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Primary key and unique constraint
  PRIMARY KEY (user_id, log_date),
  
  -- Constraints
  CONSTRAINT valid_completion_percentage CHECK (
    planned_meals_count = 0 OR completion_percentage = (completed_meals_count * 100 / planned_meals_count)
  )
);

-- Add comments
COMMENT ON TABLE daily_nutrition_summary IS 'Pre-calculated daily nutrition totals for fast dashboard queries and analytics';
COMMENT ON COLUMN daily_nutrition_summary.eating_window_hours IS 'Hours between first and last meal (intermittent fasting tracking)';

-- ================================================================================================
-- 3. CREATE INITIAL PARTITIONS (Current month + next 3 months)
-- ================================================================================================

-- Function to create monthly partitions
CREATE OR REPLACE FUNCTION create_monthly_partition(partition_date DATE)
RETURNS TEXT AS $$
DECLARE
  partition_name TEXT;
  start_date DATE;
  end_date DATE;
  sql_command TEXT;
BEGIN
  start_date := DATE_TRUNC('month', partition_date);
  end_date := start_date + INTERVAL '1 month';
  partition_name := 'user_food_logs_' || TO_CHAR(start_date, 'YYYY_MM');
  
  -- Create partition table
  sql_command := format('CREATE TABLE IF NOT EXISTS %I PARTITION OF user_food_logs
                         FOR VALUES FROM (%L) TO (%L)',
                        partition_name, start_date, end_date);
  
  EXECUTE sql_command;
  
  -- Create indexes on the partition
  EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I (user_id, log_date DESC, entry_type)',
                 partition_name || '_user_date_idx', partition_name);
  
  EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I (user_id, log_date, is_completed) WHERE entry_type = ''planned_meal''',
                 partition_name || '_completed_idx', partition_name);
  
  EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I (user_id, logged_at DESC) WHERE log_date >= %L - INTERVAL ''7 days''',
                 partition_name || '_recent_idx', partition_name, start_date);
  
  RETURN partition_name || ' created successfully';
EXCEPTION
  WHEN duplicate_table THEN
    RETURN partition_name || ' already exists';
  WHEN OTHERS THEN
    RETURN 'Error creating ' || partition_name || ': ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Create initial partitions (current month + next 3 months)
SELECT create_monthly_partition(CURRENT_DATE + INTERVAL '1 month' * i)
FROM generate_series(0, 3) as i;

-- ================================================================================================
-- 4. AUTOMATED PARTITION MANAGEMENT
-- ================================================================================================

-- Create maintenance log table first
CREATE TABLE IF NOT EXISTS maintenance_logs (
  id BIGSERIAL PRIMARY KEY,
  operation VARCHAR(100) NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to maintain partitions automatically
CREATE OR REPLACE FUNCTION maintain_food_log_partitions()
RETURNS TEXT AS $$
DECLARE
  result_text TEXT := '';
  i INTEGER;
BEGIN
  -- Create partitions for next 3 months
  FOR i IN 0..2 LOOP
    result_text := result_text || chr(10) || create_monthly_partition(CURRENT_DATE + INTERVAL '1 month' * i);
  END LOOP;
  
  -- Log maintenance activity
  INSERT INTO maintenance_logs (operation, details, created_at)
  VALUES ('partition_maintenance', result_text, NOW())
  ON CONFLICT DO NOTHING;
  
  RETURN result_text;
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'Error in partition maintenance: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Schedule monthly partition maintenance (runs on 1st of each month at midnight)
-- Note: pg_cron may not be available in all Supabase plans
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'maintain-food-log-partitions',
      '0 0 1 * *',
      'SELECT maintain_food_log_partitions();'
    );
  END IF;
END $$;

-- ================================================================================================
-- 5. DATA ARCHIVING SYSTEM
-- ================================================================================================

-- Archive table for old food logs (data older than 2 years)
CREATE TABLE user_food_logs_archive (
  LIKE user_food_logs INCLUDING ALL
);

-- Remove partitioning constraint from archive table
ALTER TABLE user_food_logs_archive DROP CONSTRAINT IF EXISTS user_food_logs_log_date_check;

-- Function to archive old data
CREATE OR REPLACE FUNCTION archive_old_food_logs()
RETURNS TEXT AS $$
DECLARE
  archive_date DATE := CURRENT_DATE - INTERVAL '2 years';
  rows_moved INTEGER := 0;
  result_text TEXT;
BEGIN
  -- Move old data to archive
  WITH moved_data AS (
    DELETE FROM user_food_logs 
    WHERE log_date < archive_date
    RETURNING *
  )
  INSERT INTO user_food_logs_archive 
  SELECT * FROM moved_data;
  
  GET DIAGNOSTICS rows_moved = ROW_COUNT;
  
  -- Update summary statistics
  result_text := format('Archived %s food log entries older than %s', rows_moved, archive_date);
  
  -- Log archiving activity
  INSERT INTO maintenance_logs (operation, details, created_at)
  VALUES ('data_archiving', result_text, NOW());
  
  RETURN result_text;
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'Error in data archiving: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Schedule quarterly archiving (runs on 1st of Jan, Apr, Jul, Oct at 2 AM)
-- Note: pg_cron may not be available in all Supabase plans
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'archive-old-food-logs',
      '0 2 1 1,4,7,10 *',
      'SELECT archive_old_food_logs();'
    );
  END IF;
END $$;

-- ================================================================================================
-- 6. INDEXES FOR PERFORMANCE
-- ================================================================================================

-- Indexes on daily_nutrition_summary for fast dashboard queries
CREATE INDEX idx_nutrition_summary_user_date ON daily_nutrition_summary (user_id, log_date DESC);
CREATE INDEX idx_nutrition_summary_date ON daily_nutrition_summary (log_date DESC);
CREATE INDEX idx_nutrition_summary_updated ON daily_nutrition_summary (updated_at DESC);

-- Indexes on user_food_logs (applied to all partitions)
-- Note: These will be created on each partition by the create_monthly_partition function

-- Global index for cross-partition queries (if needed)
CREATE INDEX idx_food_logs_recipe ON user_food_logs (recipe_id) WHERE recipe_id IS NOT NULL;
CREATE INDEX idx_food_logs_meal_plan ON user_food_logs (meal_plan_recipe_id) WHERE meal_plan_recipe_id IS NOT NULL;

-- Text search index for food names (useful for autocomplete)
CREATE INDEX idx_food_logs_food_name_search ON user_food_logs USING gin(to_tsvector('english', food_name));

-- ================================================================================================
-- 7. TRIGGERS FOR AUTOMATIC SUMMARY UPDATES
-- ================================================================================================

-- Function to update daily nutrition summary when food logs change
CREATE OR REPLACE FUNCTION update_daily_nutrition_summary()
RETURNS TRIGGER AS $$
DECLARE
  target_user_id UUID;
  target_date DATE;
  planned_stats RECORD;
  additional_stats RECORD;
  completion_pct INTEGER := 0;
BEGIN
  -- Determine user_id and date from the affected row
  target_user_id := COALESCE(NEW.user_id, OLD.user_id);
  target_date := COALESCE(NEW.log_date, OLD.log_date);
  
  -- Calculate planned meal statistics
  SELECT 
    COALESCE(SUM(CASE WHEN is_completed THEN calories ELSE 0 END), 0) as calories,
    COALESCE(SUM(CASE WHEN is_completed THEN protein_g ELSE 0 END), 0) as protein_g,
    COALESCE(SUM(CASE WHEN is_completed THEN carbs_g ELSE 0 END), 0) as carbs_g,
    COALESCE(SUM(CASE WHEN is_completed THEN fat_g ELSE 0 END), 0) as fat_g,
    COALESCE(SUM(CASE WHEN is_completed THEN fiber_g ELSE 0 END), 0) as fiber_g,
    COALESCE(SUM(CASE WHEN is_completed THEN sugar_g ELSE 0 END), 0) as sugar_g,
    COALESCE(SUM(CASE WHEN is_completed THEN sodium_mg ELSE 0 END), 0) as sodium_mg,
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE is_completed) as completed_count
  INTO planned_stats
  FROM user_food_logs
  WHERE user_id = target_user_id 
    AND log_date = target_date 
    AND entry_type = 'planned_meal';
  
  -- Calculate additional food statistics
  SELECT 
    COALESCE(SUM(calories), 0) as calories,
    COALESCE(SUM(protein_g), 0) as protein_g,
    COALESCE(SUM(carbs_g), 0) as carbs_g,
    COALESCE(SUM(fat_g), 0) as fat_g,
    COALESCE(SUM(fiber_g), 0) as fiber_g,
    COALESCE(SUM(sugar_g), 0) as sugar_g,
    COALESCE(SUM(sodium_mg), 0) as sodium_mg,
    COUNT(*) as count
  INTO additional_stats
  FROM user_food_logs
  WHERE user_id = target_user_id 
    AND log_date = target_date 
    AND entry_type = 'additional_food';
  
  -- Calculate completion percentage
  IF planned_stats.total_count > 0 THEN
    completion_pct := (planned_stats.completed_count * 100 / planned_stats.total_count);
  END IF;
  
  -- Upsert daily nutrition summary
  INSERT INTO daily_nutrition_summary (
    user_id, log_date,
    planned_calories, planned_protein_g, planned_carbs_g, planned_fat_g, 
    planned_fiber_g, planned_sugar_g, planned_sodium_mg,
    planned_meals_count, completed_meals_count,
    additional_calories, additional_protein_g, additional_carbs_g, additional_fat_g,
    additional_fiber_g, additional_sugar_g, additional_sodium_mg,
    additional_entries_count,
    completion_percentage,
    updated_at
  ) VALUES (
    target_user_id, target_date,
    planned_stats.calories, planned_stats.protein_g, planned_stats.carbs_g, planned_stats.fat_g,
    planned_stats.fiber_g, planned_stats.sugar_g, planned_stats.sodium_mg,
    planned_stats.total_count, planned_stats.completed_count,
    additional_stats.calories, additional_stats.protein_g, additional_stats.carbs_g, additional_stats.fat_g,
    additional_stats.fiber_g, additional_stats.sugar_g, additional_stats.sodium_mg,
    additional_stats.count,
    completion_pct,
    NOW()
  )
  ON CONFLICT (user_id, log_date) 
  DO UPDATE SET
    planned_calories = EXCLUDED.planned_calories,
    planned_protein_g = EXCLUDED.planned_protein_g,
    planned_carbs_g = EXCLUDED.planned_carbs_g,
    planned_fat_g = EXCLUDED.planned_fat_g,
    planned_fiber_g = EXCLUDED.planned_fiber_g,
    planned_sugar_g = EXCLUDED.planned_sugar_g,
    planned_sodium_mg = EXCLUDED.planned_sodium_mg,
    planned_meals_count = EXCLUDED.planned_meals_count,
    completed_meals_count = EXCLUDED.completed_meals_count,
    additional_calories = EXCLUDED.additional_calories,
    additional_protein_g = EXCLUDED.additional_protein_g,
    additional_carbs_g = EXCLUDED.additional_carbs_g,
    additional_fat_g = EXCLUDED.additional_fat_g,
    additional_fiber_g = EXCLUDED.additional_fiber_g,
    additional_sugar_g = EXCLUDED.additional_sugar_g,
    additional_sodium_mg = EXCLUDED.additional_sodium_mg,
    additional_entries_count = EXCLUDED.additional_entries_count,
    completion_percentage = EXCLUDED.completion_percentage,
    updated_at = EXCLUDED.updated_at;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic summary updates
CREATE TRIGGER trigger_update_nutrition_summary_insert
  AFTER INSERT ON user_food_logs
  FOR EACH ROW EXECUTE FUNCTION update_daily_nutrition_summary();

CREATE TRIGGER trigger_update_nutrition_summary_update
  AFTER UPDATE ON user_food_logs
  FOR EACH ROW EXECUTE FUNCTION update_daily_nutrition_summary();

CREATE TRIGGER trigger_update_nutrition_summary_delete
  AFTER DELETE ON user_food_logs
  FOR EACH ROW EXECUTE FUNCTION update_daily_nutrition_summary();

-- ================================================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ================================================================================================

-- Enable RLS on tables
ALTER TABLE user_food_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_nutrition_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_food_logs_archive ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_food_logs
CREATE POLICY "Users can view own food logs" ON user_food_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own food logs" ON user_food_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own food logs" ON user_food_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own food logs" ON user_food_logs
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for daily_nutrition_summary
CREATE POLICY "Users can view own nutrition summary" ON daily_nutrition_summary
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own nutrition summary" ON daily_nutrition_summary
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own nutrition summary" ON daily_nutrition_summary
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for archive table
CREATE POLICY "Users can view own archived food logs" ON user_food_logs_archive
  FOR SELECT USING (auth.uid() = user_id);

-- Service role policies (for maintenance functions)
CREATE POLICY "Service role full access food logs" ON user_food_logs
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access nutrition summary" ON daily_nutrition_summary
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access archive" ON user_food_logs_archive
  FOR ALL USING (auth.role() = 'service_role');

-- ================================================================================================
-- 9. HELPER FUNCTIONS AND VIEWS
-- ================================================================================================

-- Function to get user's food log for a specific date with aggregated nutrition
CREATE OR REPLACE FUNCTION get_user_daily_food_log(
  target_user_id UUID,
  target_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  summary JSONB,
  planned_meals JSONB,
  additional_food JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    -- Summary data
    to_jsonb(s) as summary,
    
    -- Planned meals
    COALESCE(
      (SELECT jsonb_agg(to_jsonb(f) ORDER BY f.meal_type, f.logged_at) 
       FROM user_food_logs f 
       WHERE f.user_id = target_user_id 
         AND f.log_date = target_date 
         AND f.entry_type = 'planned_meal'),
      '[]'::jsonb
    ) as planned_meals,
    
    -- Additional food
    COALESCE(
      (SELECT jsonb_agg(to_jsonb(f) ORDER BY f.logged_at) 
       FROM user_food_logs f 
       WHERE f.user_id = target_user_id 
         AND f.log_date = target_date 
         AND f.entry_type = 'additional_food'),
      '[]'::jsonb
    ) as additional_food
    
  FROM daily_nutrition_summary s
  WHERE s.user_id = target_user_id AND s.log_date = target_date;
END;
$$ LANGUAGE plpgsql;

-- View for recent user activity (last 7 days)
CREATE VIEW user_recent_food_activity AS
SELECT 
  user_id,
  log_date,
  total_calories,
  total_entries_count,
  completion_percentage,
  calorie_goal,
  (total_calories - COALESCE(calorie_goal, 2000)) as calorie_balance
FROM daily_nutrition_summary 
WHERE log_date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY user_id, log_date DESC;

-- ================================================================================================
-- 10. INITIAL DATA SETUP
-- ================================================================================================

-- Create sample food categories lookup (for future use)
CREATE TABLE IF NOT EXISTS food_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  color_hex VARCHAR(7), -- for UI display
  icon_name VARCHAR(50), -- for UI icons
  is_whole_food BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert common food categories
INSERT INTO food_categories (name, description, is_whole_food, color_hex, icon_name) VALUES
('Protein', 'Meat, fish, eggs, legumes', true, '#E74C3C', 'protein'),
('Vegetables', 'Fresh and cooked vegetables', true, '#27AE60', 'vegetables'),
('Fruits', 'Fresh and dried fruits', true, '#F39C12', 'fruits'),
('Grains', 'Rice, bread, pasta, cereals', true, '#D4AF37', 'grains'),
('Dairy', 'Milk, cheese, yogurt', true, '#3498DB', 'dairy'),
('Fats', 'Oils, nuts, avocado', true, '#8E44AD', 'fats'),
('Beverages', 'Water, coffee, tea, juices', false, '#1ABC9C', 'beverages'),
('Snacks', 'Processed snack foods', false, '#E67E22', 'snacks'),
('Desserts', 'Sweet treats and desserts', false, '#E91E63', 'desserts'),
('Fast Food', 'Restaurant and fast food', false, '#95A5A6', 'fastfood')
ON CONFLICT (name) DO NOTHING;

-- ================================================================================================
-- END OF MIGRATION
-- ================================================================================================

-- Log successful migration
DO $$
BEGIN
  RAISE NOTICE 'Scalable Food Logging System (Standalone) migration completed successfully!';
  RAISE NOTICE 'Created partitioned user_food_logs table with % initial partitions', 
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name LIKE 'user_food_logs_%');
  RAISE NOTICE 'Set up automated partition maintenance and data archiving';
  RAISE NOTICE 'Enabled Row Level Security for all tables';
  RAISE NOTICE 'Note: Recipe system integration can be added later by running foreign key constraints';
END $$;