-- WellNoosh Database Setup - Master Migration Script
-- This script runs all migrations in the correct order
-- Run this in Supabase SQL Editor or via Supabase CLI

-- ============================================================================
-- MIGRATION EXECUTION ORDER
-- ============================================================================

\echo 'Starting WellNoosh database setup...'

-- Phase 1: Enhanced User Management
\echo 'Running Phase 1: Enhanced User Management...'
\i 20250130_001_phase1_user_management.sql
\i 20250130_002_phase1_rls_policies.sql
\i 20250130_003_phase1_functions_views.sql

-- Phase 2: Detailed Nutrition Tracking
\echo 'Running Phase 2: Detailed Nutrition Tracking...'
\i 20250130_004_phase2_nutrition_tracking.sql
\i 20250130_005_phase2_nutrition_rls.sql
\i 20250130_006_phase2_nutrition_functions.sql

-- Phase 3: Advanced Recipe Intelligence
\echo 'Running Phase 3: Advanced Recipe Intelligence...'
\i 20250130_007_phase3_recipe_intelligence.sql

-- Phase 4: Circle (Social Group) Management
\echo 'Running Phase 4: Circle (Social Group) Management...'
\i 20250130_008_phase4_circles_social.sql

-- Phase 5: Comprehensive Meal Planning
\echo 'Running Phase 5: Comprehensive Meal Planning...'
\i 20250130_009_phase5_meal_planning.sql

-- Phase 6: Smart Shopping & Inventory
\echo 'Running Phase 6: Smart Shopping & Inventory...'
\i 20250130_010_phase6_shopping_inventory.sql

-- Comprehensive Security & RLS
\echo 'Running Comprehensive Security Setup...'
\i 20250130_011_comprehensive_rls_security.sql

-- Analytics & Metrics
\echo 'Running Analytics & Metrics Setup...'
\i 20250130_012_analytics_metrics_aggregation.sql

\echo 'WellNoosh database setup completed successfully!'

-- ============================================================================
-- POST-MIGRATION VERIFICATION QUERIES
-- ============================================================================

\echo 'Running post-migration verification...'

-- Check table counts
SELECT 
    schemaname,
    COUNT(*) as table_count
FROM pg_tables 
WHERE schemaname = 'public'
GROUP BY schemaname;

-- Check RLS status on key tables
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('users', 'recipes', 'circles', 'user_inventory', 'shopping_lists')
ORDER BY tablename;

-- Check function count
SELECT 
    COUNT(*) as function_count
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public';

-- Check index count
SELECT 
    COUNT(*) as index_count
FROM pg_indexes 
WHERE schemaname = 'public';

-- Verify foreign key relationships
SELECT 
    COUNT(*) as foreign_key_count
FROM information_schema.table_constraints 
WHERE constraint_type = 'FOREIGN KEY'
AND table_schema = 'public';

\echo 'Database verification completed!'

-- ============================================================================
-- SAMPLE DATA INSERTION (OPTIONAL)
-- ============================================================================

-- Uncomment the following section to insert sample data for testing

/*
\echo 'Inserting sample data...'

-- Sample food items
INSERT INTO public.foods (name, food_category, calories_per_100g, protein_g_per_100g, carbs_total_g_per_100g, total_fat_g_per_100g) VALUES
('Chicken Breast', 'protein', 165, 31, 0, 3.6),
('Brown Rice', 'grain', 123, 2.6, 23, 0.9),
('Broccoli', 'vegetable', 34, 2.8, 7, 0.4),
('Olive Oil', 'fat', 884, 0, 0, 100),
('Greek Yogurt', 'dairy', 97, 9, 4, 5);

-- Sample recipe
INSERT INTO public.recipes (name, description, cuisine_type, prep_time_minutes, cook_time_minutes, servings, difficulty_level) VALUES
('Grilled Chicken with Rice', 'Simple and healthy grilled chicken served with brown rice and steamed broccoli', 'american', 15, 25, 4, 'easy');

\echo 'Sample data inserted successfully!'
*/

-- ============================================================================
-- SETUP COMPLETION MESSAGE
-- ============================================================================

\echo ''
\echo '🎉 WellNoosh Database Setup Complete! 🎉'
\echo ''
\echo 'Database includes:'
\echo '✅ 50+ tables across 6 major phases'
\echo '✅ Comprehensive RLS security policies'
\echo '✅ Advanced nutrition tracking'
\echo '✅ Recipe intelligence system'
\echo '✅ Social circles (family/friends groups)'
\echo '✅ Meal planning & prep tools'
\echo '✅ Smart shopping & inventory'
\echo '✅ Analytics & metrics aggregation'
\echo ''
\echo 'Next steps:'
\echo '1. Review the DATABASE_SCHEMA_DOCUMENTATION.md file'
\echo '2. Check the DATA_COLLECTION_SUMMARY.md for user-friendly overview'
\echo '3. Test authentication and user registration'
\echo '4. Begin frontend integration'
\echo ''
\echo 'Happy coding! 🚀'