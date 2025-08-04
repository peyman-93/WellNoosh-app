-- ================================================================================================
-- Fix RLS Policies for user_food_logs Partition Tables
-- Migration: 20250803_fix_partition_rls_policies.sql
-- Purpose: Enable RLS and create proper security policies for all partition tables
-- Issue: Partition tables were showing as "Unrestricted" in Supabase dashboard
-- Author: Claude AI Assistant
-- Date: August 3, 2025
-- ================================================================================================

-- ================================================================================================
-- 1. ENABLE RLS ON MAIN TABLE (if not already enabled)
-- ================================================================================================

-- Enable RLS on main partitioned table
ALTER TABLE user_food_logs ENABLE ROW LEVEL SECURITY;

-- ================================================================================================
-- 2. ENABLE RLS ON ALL EXISTING PARTITION TABLES
-- ================================================================================================

-- Enable RLS on August 2025 partition
ALTER TABLE user_food_logs_2025_08 ENABLE ROW LEVEL SECURITY;

-- Enable RLS on remaining 2025 partitions (if they exist)
DO $$
DECLARE
    month_num INTEGER;
    partition_name TEXT;
    table_exists BOOLEAN;
BEGIN
    FOR month_num IN 9..12 LOOP
        partition_name := 'user_food_logs_2025_' || LPAD(month_num::TEXT, 2, '0');
        
        -- Check if table exists
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = partition_name
        ) INTO table_exists;
        
        -- Enable RLS if table exists
        IF table_exists THEN
            EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', partition_name);
            RAISE NOTICE 'Enabled RLS on table: %', partition_name;
        END IF;
    END LOOP;
END $$;

-- ================================================================================================
-- 3. CREATE RLS POLICIES FOR MAIN TABLE
-- ================================================================================================

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "user_food_logs_select_own" ON user_food_logs;
DROP POLICY IF EXISTS "user_food_logs_insert_own" ON user_food_logs;
DROP POLICY IF EXISTS "user_food_logs_update_own" ON user_food_logs;
DROP POLICY IF EXISTS "user_food_logs_delete_own" ON user_food_logs;

-- Policy: Users can only SELECT their own food logs
CREATE POLICY "user_food_logs_select_own" ON user_food_logs
    FOR SELECT USING (user_id = auth.uid());

-- Policy: Users can only INSERT their own food logs
CREATE POLICY "user_food_logs_insert_own" ON user_food_logs
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Policy: Users can only UPDATE their own food logs
CREATE POLICY "user_food_logs_update_own" ON user_food_logs
    FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Policy: Users can only DELETE their own food logs
CREATE POLICY "user_food_logs_delete_own" ON user_food_logs
    FOR DELETE USING (user_id = auth.uid());

-- ================================================================================================
-- 4. CREATE RLS POLICIES FOR PARTITION TABLES
-- ================================================================================================

-- Note: In PostgreSQL, partition tables inherit RLS policies from the parent table
-- However, we need to explicitly enable RLS on each partition for Supabase to recognize them as "Protected"

-- Create policies for August 2025 partition
DROP POLICY IF EXISTS "user_food_logs_2025_08_select_own" ON user_food_logs_2025_08;
DROP POLICY IF EXISTS "user_food_logs_2025_08_insert_own" ON user_food_logs_2025_08;
DROP POLICY IF EXISTS "user_food_logs_2025_08_update_own" ON user_food_logs_2025_08;
DROP POLICY IF EXISTS "user_food_logs_2025_08_delete_own" ON user_food_logs_2025_08;

CREATE POLICY "user_food_logs_2025_08_select_own" ON user_food_logs_2025_08
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "user_food_logs_2025_08_insert_own" ON user_food_logs_2025_08
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_food_logs_2025_08_update_own" ON user_food_logs_2025_08
    FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_food_logs_2025_08_delete_own" ON user_food_logs_2025_08
    FOR DELETE USING (user_id = auth.uid());

-- Create policies for remaining 2025 partitions
DO $$
DECLARE
    month_num INTEGER;
    partition_name TEXT;
    table_exists BOOLEAN;
BEGIN
    FOR month_num IN 9..12 LOOP
        partition_name := 'user_food_logs_2025_' || LPAD(month_num::TEXT, 2, '0');
        
        -- Check if table exists
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = partition_name
        ) INTO table_exists;
        
        -- Create policies if table exists
        IF table_exists THEN
            -- Drop existing policies
            EXECUTE format('DROP POLICY IF EXISTS "%s_select_own" ON %I', partition_name, partition_name);
            EXECUTE format('DROP POLICY IF EXISTS "%s_insert_own" ON %I', partition_name, partition_name);
            EXECUTE format('DROP POLICY IF EXISTS "%s_update_own" ON %I', partition_name, partition_name);
            EXECUTE format('DROP POLICY IF EXISTS "%s_delete_own" ON %I', partition_name, partition_name);
            
            -- Create new policies
            EXECUTE format('CREATE POLICY "%s_select_own" ON %I FOR SELECT USING (user_id = auth.uid())', 
                          partition_name, partition_name);
            EXECUTE format('CREATE POLICY "%s_insert_own" ON %I FOR INSERT WITH CHECK (user_id = auth.uid())', 
                          partition_name, partition_name);
            EXECUTE format('CREATE POLICY "%s_update_own" ON %I FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())', 
                          partition_name, partition_name);
            EXECUTE format('CREATE POLICY "%s_delete_own" ON %I FOR DELETE USING (user_id = auth.uid())', 
                          partition_name, partition_name);
            
            RAISE NOTICE 'Created RLS policies for table: %', partition_name;
        END IF;
    END LOOP;
END $$;

-- ================================================================================================
-- 5. CREATE FUNCTION TO AUTOMATICALLY APPLY RLS TO NEW PARTITIONS
-- ================================================================================================

-- Function to apply RLS policies to a new partition
CREATE OR REPLACE FUNCTION apply_rls_to_food_logs_partition(partition_name TEXT)
RETURNS VOID AS $$
BEGIN
    -- Enable RLS
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', partition_name);
    
    -- Create policies
    EXECUTE format('CREATE POLICY "%s_select_own" ON %I FOR SELECT USING (user_id = auth.uid())', 
                  partition_name, partition_name);
    EXECUTE format('CREATE POLICY "%s_insert_own" ON %I FOR INSERT WITH CHECK (user_id = auth.uid())', 
                  partition_name, partition_name);
    EXECUTE format('CREATE POLICY "%s_update_own" ON %I FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())', 
                  partition_name, partition_name);
    EXECUTE format('CREATE POLICY "%s_delete_own" ON %I FOR DELETE USING (user_id = auth.uid())', 
                  partition_name, partition_name);
    
    RAISE NOTICE 'Applied RLS policies to partition: %', partition_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment
COMMENT ON FUNCTION apply_rls_to_food_logs_partition(TEXT) IS 'Automatically applies RLS policies to a new user_food_logs partition table';

-- ================================================================================================
-- 6. FIX OTHER UNRESTRICTED TABLES
-- ================================================================================================

-- Ensure all main tables have RLS enabled
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_health_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_dietary_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE planned_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_nutrition_summary ENABLE ROW LEVEL SECURITY;

-- Note: Food categories is a lookup table and should remain public
-- user_food_logs_archive should inherit policies when we create it

-- ================================================================================================
-- 7. VERIFICATION QUERIES (for testing)
-- ================================================================================================

-- These queries can be run manually to verify RLS is working:

-- Check that RLS is enabled on all tables
-- SELECT schemaname, tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE tablename LIKE 'user_food_logs%' 
-- ORDER BY tablename;

-- Check that policies exist
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename LIKE 'user_food_logs%' 
-- ORDER BY tablename, policyname;

-- Test queries as authenticated user (these should work):
-- SELECT COUNT(*) FROM user_food_logs WHERE user_id = auth.uid();
-- SELECT COUNT(*) FROM user_food_logs_2025_08 WHERE user_id = auth.uid();

-- Test queries without proper user context (these should return 0 or error):
-- SELECT COUNT(*) FROM user_food_logs; -- Should return only current user's data
-- SELECT COUNT(*) FROM user_food_logs WHERE user_id != auth.uid(); -- Should return 0

RAISE NOTICE 'RLS policies have been applied to all user_food_logs partition tables';
RAISE NOTICE 'All tables should now show as "Protected" in Supabase dashboard';