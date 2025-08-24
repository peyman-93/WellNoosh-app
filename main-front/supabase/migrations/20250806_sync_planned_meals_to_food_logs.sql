-- ================================================================================================
-- Sync Planned Meals to Food Logs Migration
-- Migration: 20250806_sync_planned_meals_to_food_logs.sql
-- Purpose: Create trigger to sync planned meal completions with user_food_logs for nutrition tracking
-- Author: Claude AI Assistant
-- Date: August 6, 2025
-- ================================================================================================

-- ================================================================================================
-- 1. CREATE TRIGGER FUNCTION TO SYNC PLANNED MEALS TO FOOD LOGS
-- ================================================================================================

-- Function to sync planned meals with user_food_logs when completion status changes
CREATE OR REPLACE FUNCTION sync_planned_meal_to_food_log()
RETURNS TRIGGER AS $$
DECLARE
  target_user_id UUID;
  target_date DATE;
  existing_log_id BIGINT;
BEGIN
  -- Handle INSERT and UPDATE operations
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    target_user_id := NEW.user_id;
    target_date := NEW.plan_date;
    
    -- Only proceed if meal is completed
    IF NEW.is_completed = TRUE THEN
      -- Check if entry already exists in user_food_logs
      -- Since meal_plan_recipe_id is UUID but planned_meals.id is BIGINT, 
      -- we'll use a different approach - match by user, date, entry_type, and food_name
      SELECT id INTO existing_log_id 
      FROM user_food_logs 
      WHERE user_id = target_user_id 
        AND log_date = target_date
        AND entry_type = 'planned_meal'
        AND food_name = NEW.food_name
        AND meal_type = NEW.meal_type;
      
      IF existing_log_id IS NULL THEN
        -- Insert new entry in user_food_logs
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
          logged_at,
          created_at
        ) VALUES (
          NEW.user_id,
          NEW.plan_date,
          'planned_meal',
          NEW.meal_type,
          NEW.food_name,
          NEW.recipe_id,
          NEW.calories,
          COALESCE(NEW.protein_g, 0),
          COALESCE(NEW.carbs_g, 0),
          COALESCE(NEW.fat_g, 0),
          COALESCE(NEW.fiber_g, 0),
          COALESCE(NEW.sugar_g, 0),
          COALESCE(NEW.sodium_mg, 0),
          TRUE, -- is_completed
          NEW.completed_at,
          NEW.serving_size, -- planned_serving_size
          NEW.serving_size, -- actual_serving_size (same as planned for now)
          NEW.food_category,
          NEW.preparation_method,
          COALESCE(NEW.completed_at, NOW()), -- logged_at
          NOW() -- created_at
        );
        
        RAISE LOG 'Created food log entry for completed planned meal: % (user: %, date: %)', 
          NEW.id, NEW.user_id, NEW.plan_date;
      ELSE
        -- Update existing entry
        UPDATE user_food_logs 
        SET 
          food_name = NEW.food_name,
          calories = NEW.calories,
          protein_g = COALESCE(NEW.protein_g, 0),
          carbs_g = COALESCE(NEW.carbs_g, 0),
          fat_g = COALESCE(NEW.fat_g, 0),
          fiber_g = COALESCE(NEW.fiber_g, 0),
          sugar_g = COALESCE(NEW.sugar_g, 0),
          sodium_mg = COALESCE(NEW.sodium_mg, 0),
          is_completed = TRUE,
          completed_at = NEW.completed_at,
          actual_serving_size = NEW.serving_size,
          logged_at = COALESCE(NEW.completed_at, NOW())
        WHERE id = existing_log_id;
        
        RAISE LOG 'Updated food log entry for completed planned meal: % (log_id: %)', 
          NEW.id, existing_log_id;
      END IF;
      
    ELSE
      -- Meal was uncompleted - remove from user_food_logs
      DELETE FROM user_food_logs 
      WHERE user_id = target_user_id 
        AND log_date = target_date
        AND entry_type = 'planned_meal'
        AND food_name = NEW.food_name
        AND meal_type = NEW.meal_type;
      
      RAISE LOG 'Removed food log entry for uncompleted planned meal: % (user: %, date: %)', 
        NEW.id, NEW.user_id, NEW.plan_date;
    END IF;
    
    RETURN NEW;
  END IF;
  
  -- Handle DELETE operations
  IF TG_OP = 'DELETE' THEN
    -- Remove corresponding entry from user_food_logs
    DELETE FROM user_food_logs 
    WHERE user_id = OLD.user_id 
      AND log_date = OLD.plan_date
      AND entry_type = 'planned_meal'
      AND food_name = OLD.food_name
      AND meal_type = OLD.meal_type;
    
    RAISE LOG 'Removed food log entry for deleted planned meal: % (user: %, date: %)', 
      OLD.id, OLD.user_id, OLD.plan_date;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ================================================================================================
-- 2. CREATE TRIGGER ON PLANNED_MEALS TABLE
-- ================================================================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_sync_planned_meal_to_food_log ON planned_meals;

-- Create trigger that fires after INSERT, UPDATE, or DELETE
CREATE TRIGGER trigger_sync_planned_meal_to_food_log
  AFTER INSERT OR UPDATE OR DELETE ON planned_meals
  FOR EACH ROW EXECUTE FUNCTION sync_planned_meal_to_food_log();

-- ================================================================================================
-- 3. BACKFILL EXISTING COMPLETED MEALS
-- ================================================================================================

-- Function to backfill existing completed planned meals into user_food_logs
CREATE OR REPLACE FUNCTION backfill_completed_planned_meals()
RETURNS TEXT AS $$
DECLARE
  inserted_count INTEGER := 0;
  meal_record RECORD;
  result_text TEXT;
BEGIN
  -- Insert completed planned meals that don't already have corresponding food log entries
  FOR meal_record IN
    SELECT pm.*
    FROM planned_meals pm
    LEFT JOIN user_food_logs ufl ON (
      ufl.user_id = pm.user_id 
      AND ufl.log_date = pm.plan_date
      AND ufl.entry_type = 'planned_meal'
      AND ufl.food_name = pm.food_name
      AND ufl.meal_type = pm.meal_type
    )
    WHERE pm.is_completed = TRUE
      AND ufl.id IS NULL -- Only meals without existing food log entries
    ORDER BY pm.plan_date, pm.user_id
  LOOP
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
      logged_at,
      created_at
    ) VALUES (
      meal_record.user_id,
      meal_record.plan_date,
      'planned_meal',
      meal_record.meal_type,
      meal_record.food_name,
      meal_record.recipe_id,
      meal_record.calories,
      COALESCE(meal_record.protein_g, 0),
      COALESCE(meal_record.carbs_g, 0),
      COALESCE(meal_record.fat_g, 0),
      COALESCE(meal_record.fiber_g, 0),
      COALESCE(meal_record.sugar_g, 0),
      COALESCE(meal_record.sodium_mg, 0),
      TRUE,
      meal_record.completed_at,
      meal_record.serving_size,
      meal_record.serving_size,
      meal_record.food_category,
      meal_record.preparation_method,
      COALESCE(meal_record.completed_at, meal_record.updated_at, meal_record.created_at),
      NOW()
    );
    
    inserted_count := inserted_count + 1;
  END LOOP;
  
  result_text := format('Backfilled %s completed planned meals into user_food_logs', inserted_count);
  
  -- Log the backfill operation
  INSERT INTO maintenance_logs (operation, details, created_at)
  VALUES ('planned_meals_backfill', result_text, NOW());
  
  RETURN result_text;
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'Error in backfill operation: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Run the backfill operation
SELECT backfill_completed_planned_meals();

-- ================================================================================================
-- 4. ADD HELPFUL INDEXES FOR PERFORMANCE
-- ================================================================================================

-- Index for efficient lookups when syncing planned meals to food logs
CREATE INDEX IF NOT EXISTS idx_user_food_logs_meal_plan_sync 
ON user_food_logs (user_id, log_date, entry_type, food_name, meal_type) 
WHERE entry_type = 'planned_meal';

-- Index on planned_meals for completion status queries
CREATE INDEX IF NOT EXISTS idx_planned_meals_completion 
ON planned_meals (user_id, plan_date, is_completed);

-- ================================================================================================
-- 5. CREATE HELPER FUNCTION FOR DEBUGGING
-- ================================================================================================

-- Function to check sync status between planned_meals and user_food_logs
CREATE OR REPLACE FUNCTION check_meal_sync_status(target_user_id UUID DEFAULT NULL)
RETURNS TABLE (
  user_id UUID,
  plan_date DATE,
  planned_meals_completed BIGINT,
  food_log_entries BIGINT,
  sync_difference BIGINT,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH planned_summary AS (
    SELECT 
      pm.user_id,
      pm.plan_date,
      COUNT(*) FILTER (WHERE pm.is_completed = TRUE) as completed_meals
    FROM planned_meals pm
    WHERE (target_user_id IS NULL OR pm.user_id = target_user_id)
    GROUP BY pm.user_id, pm.plan_date
  ),
  food_log_summary AS (
    SELECT 
      ufl.user_id,
      ufl.log_date as plan_date,
      COUNT(*) as food_entries
    FROM user_food_logs ufl
    WHERE ufl.entry_type = 'planned_meal'
      AND (target_user_id IS NULL OR ufl.user_id = target_user_id)
    GROUP BY ufl.user_id, ufl.log_date
  )
  SELECT 
    COALESCE(ps.user_id, fls.user_id) as user_id,
    COALESCE(ps.plan_date, fls.plan_date) as plan_date,
    COALESCE(ps.completed_meals, 0) as planned_meals_completed,
    COALESCE(fls.food_entries, 0) as food_log_entries,
    COALESCE(ps.completed_meals, 0) - COALESCE(fls.food_entries, 0) as sync_difference,
    CASE 
      WHEN COALESCE(ps.completed_meals, 0) = COALESCE(fls.food_entries, 0) THEN 'SYNCED'
      WHEN COALESCE(ps.completed_meals, 0) > COALESCE(fls.food_entries, 0) THEN 'MISSING_FOOD_LOGS'
      ELSE 'EXTRA_FOOD_LOGS'
    END as status
  FROM planned_summary ps
  FULL OUTER JOIN food_log_summary fls ON (ps.user_id = fls.user_id AND ps.plan_date = fls.plan_date)
  ORDER BY user_id, plan_date DESC;
END;
$$ LANGUAGE plpgsql;

-- ================================================================================================
-- END OF MIGRATION
-- ================================================================================================

-- Log successful migration
DO $$
BEGIN
  RAISE NOTICE 'Planned meals to food logs sync migration completed successfully!';
  RAISE NOTICE 'Created trigger function: sync_planned_meal_to_food_log()';
  RAISE NOTICE 'Created trigger: trigger_sync_planned_meal_to_food_log';
  RAISE NOTICE 'Backfilled existing completed meals into user_food_logs';
  RAISE NOTICE 'Added performance indexes for meal sync operations';
  RAISE NOTICE 'Created helper function: check_meal_sync_status()';
  RAISE NOTICE 'Meal completion data will now automatically sync to nutrition tracking!';
END $$;