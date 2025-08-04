-- ================================================================================================
-- Database Cleanup - Remove Unused Tables
-- Migration: 20250201_cleanup_unused_tables.sql
-- Purpose: Remove deprecated and unused tables to clean up the database
-- Author: Claude AI Assistant
-- Date: February 1, 2025
-- ================================================================================================

-- ================================================================================================
-- 1. IDENTIFY DEPRECATED TABLES
-- ================================================================================================

-- Check if deprecated tables exist and show their usage
DO $$
DECLARE
    row_count INTEGER;
BEGIN
    RAISE NOTICE '=== DATABASE CLEANUP ANALYSIS ===';
    
    -- Check meal_plans (old non-user-specific design)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE information_schema.tables.table_name = 'meal_plans' AND information_schema.tables.table_schema = 'public') THEN
        SELECT COUNT(*) INTO row_count FROM meal_plans;
        RAISE NOTICE 'DEPRECATED: meal_plans table exists with % rows (replace with user_meal_plans)', row_count;
    END IF;
    
    -- Check meal_plan_recipes (old design)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE information_schema.tables.table_name = 'meal_plan_recipes' AND information_schema.tables.table_schema = 'public') THEN
        SELECT COUNT(*) INTO row_count FROM meal_plan_recipes;
        RAISE NOTICE 'DEPRECATED: meal_plan_recipes table exists with % rows (replace with planned_meals)', row_count;
    END IF;
    
    -- Check daily_health_logs (unclear purpose)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE information_schema.tables.table_name = 'daily_health_logs' AND information_schema.tables.table_schema = 'public') THEN
        SELECT COUNT(*) INTO row_count FROM daily_health_logs;
        RAISE NOTICE 'UNCLEAR: daily_health_logs table exists with % rows (analyze purpose)', row_count;
    END IF;
    
    -- Check user_recent_food_activity (should be a view, not table)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE information_schema.tables.table_name = 'user_recent_food_activity' AND information_schema.tables.table_schema = 'public') THEN
        SELECT COUNT(*) INTO row_count FROM user_recent_food_activity;
        RAISE NOTICE 'VIEW: user_recent_food_activity exists as table with % rows (should be view)', row_count;
    END IF;
    
    RAISE NOTICE '=== END ANALYSIS ===';
END $$;

-- ================================================================================================
-- 2. SAFE REMOVAL OF DEPRECATED TABLES
-- ================================================================================================

-- IMPORTANT: Only run this section if you're sure the tables are not in use!
-- Uncomment the sections below ONLY after verifying data migration

/*
-- ================================================================================================
-- STEP 1: BACKUP DATA FROM DEPRECATED TABLES (if needed)
-- ================================================================================================

-- Backup meal_plans data before removal (if it contains important data)
-- CREATE TABLE meal_plans_backup AS SELECT * FROM meal_plans;

-- Backup meal_plan_recipes data before removal (if it contains important data)  
-- CREATE TABLE meal_plan_recipes_backup AS SELECT * FROM meal_plan_recipes;

-- ================================================================================================
-- STEP 2: REMOVE DEPRECATED TABLES
-- ================================================================================================

-- Remove old meal planning tables (replaced by user_meal_plans and planned_meals)
-- DROP TABLE IF EXISTS meal_plan_recipes CASCADE;
-- DROP TABLE IF EXISTS meal_plans CASCADE;

-- Remove unclear purpose table (analyze first!)
-- DROP TABLE IF EXISTS daily_health_logs CASCADE;

-- ================================================================================================
-- STEP 3: CLEANUP UNUSED FUNCTIONS/TRIGGERS
-- ================================================================================================

-- Remove triggers related to old meal planning tables
-- DROP TRIGGER IF EXISTS trigger_update_meal_plan_totals ON meal_plan_recipes;
-- DROP FUNCTION IF EXISTS update_meal_plan_totals();

-- ================================================================================================
-- STEP 4: VERIFY CLEANUP
-- ================================================================================================

-- Show remaining tables after cleanup
-- SELECT table_name, table_type 
-- FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- ORDER BY table_name;
*/

-- ================================================================================================
-- 3. RECOMMENDED CLEANUP STEPS (MANUAL VERIFICATION REQUIRED)
-- ================================================================================================

-- Create a safe cleanup checklist
CREATE TABLE IF NOT EXISTS cleanup_checklist (
    id SERIAL PRIMARY KEY,
    item VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'completed', 'skipped')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert cleanup tasks
INSERT INTO cleanup_checklist (item, notes) VALUES
('Verify meal_plans table is not in use', 'Check if any application code references this table'),
('Verify meal_plan_recipes table is not in use', 'Check if any application code references this table'),
('Analyze daily_health_logs table purpose', 'Determine if this table serves a specific purpose or can be removed'),
('Check for unused indexes', 'Review and remove indexes on deleted tables'),
('Check for unused functions', 'Review and remove functions related to deleted tables'),
('Update application code', 'Ensure all references point to new tables (user_meal_plans, planned_meals)'),
('Test meal planning workflow', 'Verify new meal planning system works correctly'),
('Test food logging workflow', 'Verify food logging integration works correctly'),
('Backup deprecated tables', 'Create backups before final removal'),
('Final table cleanup', 'Remove deprecated tables after verification')
ON CONFLICT DO NOTHING;

-- ================================================================================================
-- 4. SAFE TABLE ANALYSIS QUERIES
-- ================================================================================================

-- Function to analyze table usage safely
CREATE OR REPLACE FUNCTION analyze_table_usage()
RETURNS TABLE (
    table_name TEXT,
    row_count BIGINT,
    table_size TEXT,
    last_modified TIMESTAMPTZ,
    recommendation TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH table_stats AS (
        SELECT 
            t.table_name::TEXT,
            CASE 
                WHEN t.table_name = 'meal_plans' THEN (SELECT COUNT(*) FROM meal_plans)
                WHEN t.table_name = 'meal_plan_recipes' THEN (SELECT COUNT(*) FROM meal_plan_recipes)  
                WHEN t.table_name = 'daily_health_logs' THEN (SELECT COUNT(*) FROM daily_health_logs)
                ELSE 0
            END as row_count,
            pg_size_pretty(pg_total_relation_size(t.table_name::regclass)) as table_size,
            GREATEST(
                COALESCE((SELECT max(created_at) FROM meal_plans WHERE t.table_name = 'meal_plans'), '1970-01-01'::timestamptz),
                COALESCE((SELECT max(created_at) FROM meal_plan_recipes WHERE t.table_name = 'meal_plan_recipes'), '1970-01-01'::timestamptz),
                COALESCE((SELECT max(created_at) FROM daily_health_logs WHERE t.table_name = 'daily_health_logs'), '1970-01-01'::timestamptz)
            ) as last_modified,
            CASE 
                WHEN t.table_name = 'meal_plans' THEN 'DEPRECATED: Replace with user_meal_plans'
                WHEN t.table_name = 'meal_plan_recipes' THEN 'DEPRECATED: Replace with planned_meals'
                WHEN t.table_name = 'daily_health_logs' THEN 'ANALYZE: Determine purpose or remove'
                ELSE 'UNKNOWN'
            END as recommendation
        FROM information_schema.tables t
        WHERE t.table_schema = 'public' 
        AND t.table_name IN ('meal_plans', 'meal_plan_recipes', 'daily_health_logs')
        AND t.table_type = 'BASE TABLE'
    )
    SELECT * FROM table_stats WHERE row_count >= 0;
END;
$$ LANGUAGE plpgsql;

-- ================================================================================================
-- 5. EXECUTE ANALYSIS
-- ================================================================================================

-- Run the analysis
SELECT * FROM analyze_table_usage();

-- Show cleanup checklist
SELECT * FROM cleanup_checklist ORDER BY id;

-- ================================================================================================
-- 6. FINAL RECOMMENDATIONS
-- ================================================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== CLEANUP RECOMMENDATIONS ===';
    RAISE NOTICE '1. Run: SELECT * FROM analyze_table_usage(); to see table usage';
    RAISE NOTICE '2. Verify your application does not use deprecated tables';
    RAISE NOTICE '3. Test the new meal planning system thoroughly';
    RAISE NOTICE '4. Once verified, uncomment the removal sections above';
    RAISE NOTICE '5. Update your application to use:';
    RAISE NOTICE '   - user_meal_plans instead of meal_plans';
    RAISE NOTICE '   - planned_meals instead of meal_plan_recipes';
    RAISE NOTICE '6. Monitor the cleanup_checklist table for progress';
    RAISE NOTICE '================================';
END $$;