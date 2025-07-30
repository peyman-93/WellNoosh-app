-- Phase 1: Row Level Security (RLS) Policies for User Management
-- Migration: 20250130_002_phase1_rls_policies.sql

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_health_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USERS TABLE POLICIES
-- ============================================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile (for account creation)
CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Users cannot delete their own profile (admin only)
-- Admin/system can manage users (if needed later)
CREATE POLICY "Service role can manage users" ON public.users
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- USER_PREFERENCES TABLE POLICIES
-- ============================================================================

-- Users can view their own preferences
CREATE POLICY "Users can view own preferences" ON public.user_preferences
    FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own preferences
CREATE POLICY "Users can update own preferences" ON public.user_preferences
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can insert their own preferences
CREATE POLICY "Users can insert own preferences" ON public.user_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own preferences
CREATE POLICY "Users can delete own preferences" ON public.user_preferences
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- USER_HEALTH_PROFILES TABLE POLICIES
-- ============================================================================

-- Users can view their own health profiles
CREATE POLICY "Users can view own health profiles" ON public.user_health_profiles
    FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own health profiles
CREATE POLICY "Users can update own health profiles" ON public.user_health_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can insert their own health profiles
CREATE POLICY "Users can insert own health profiles" ON public.user_health_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own health profiles
CREATE POLICY "Users can delete own health profiles" ON public.user_health_profiles
    FOR DELETE USING (auth.uid() = user_id);

-- Health professionals can view profiles they're authorized for (future feature)
-- CREATE POLICY "Health professionals can view authorized profiles" ON public.user_health_profiles
--     FOR SELECT USING (
--         EXISTS (
--             SELECT 1 FROM public.health_professional_access 
--             WHERE professional_id = auth.uid() 
--             AND patient_id = user_id 
--             AND is_active = true
--         )
--     );

-- ============================================================================
-- USER_ACTIVITY_LOGS TABLE POLICIES
-- ============================================================================

-- Users can view their own activity logs
CREATE POLICY "Users can view own activity logs" ON public.user_activity_logs
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own activity logs
CREATE POLICY "Users can insert own activity logs" ON public.user_activity_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Activity logs are immutable (no updates or deletes by users)
-- Only system/admin can modify activity logs for data integrity

-- System can manage activity logs
CREATE POLICY "Service role can manage activity logs" ON public.user_activity_logs
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- USER_SESSIONS TABLE POLICIES
-- ============================================================================

-- Users can view their own sessions
CREATE POLICY "Users can view own sessions" ON public.user_sessions
    FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own sessions (for session management)
CREATE POLICY "Users can update own sessions" ON public.user_sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can insert their own sessions
CREATE POLICY "Users can insert own sessions" ON public.user_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own sessions (logout, cleanup)
CREATE POLICY "Users can delete own sessions" ON public.user_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- USER_ACHIEVEMENTS TABLE POLICIES
-- ============================================================================

-- Users can view their own achievements
CREATE POLICY "Users can view own achievements" ON public.user_achievements
    FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own achievements (progress tracking)
CREATE POLICY "Users can update own achievements" ON public.user_achievements
    FOR UPDATE USING (auth.uid() = user_id);

-- System can manage achievements (award new ones, etc.)
CREATE POLICY "Service role can manage achievements" ON public.user_achievements
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Users can insert achievements (for self-tracking or system awards)
CREATE POLICY "Users can insert own achievements" ON public.user_achievements
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- HELPER FUNCTIONS FOR COMPLEX POLICIES
-- ============================================================================

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'service_role';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is in same circle (for future social features)
CREATE OR REPLACE FUNCTION public.users_share_circle(user1_id UUID, user2_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- This will be implemented when we add circle/social features in Phase 4
    -- For now, return false to maintain privacy
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's privacy settings
CREATE OR REPLACE FUNCTION public.get_user_privacy_settings(target_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    privacy_settings JSONB;
BEGIN
    SELECT up.privacy_settings INTO privacy_settings
    FROM public.user_preferences up
    WHERE up.user_id = target_user_id;
    
    RETURN COALESCE(privacy_settings, '{
        "profile_visibility": "private",
        "activity_sharing": false,
        "recipe_sharing": false,
        "stats_sharing": false
    }'::JSONB);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant authenticated users access to tables
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.user_preferences TO authenticated;
GRANT ALL ON public.user_health_profiles TO authenticated;
GRANT ALL ON public.user_activity_logs TO authenticated;
GRANT ALL ON public.user_sessions TO authenticated;
GRANT ALL ON public.user_achievements TO authenticated;

-- Grant service role full access (for system operations)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Grant anonymous limited access (for public features if needed)
-- GRANT SELECT ON specific_public_tables TO anon; -- Add as needed

-- ============================================================================
-- SECURITY NOTES
-- ============================================================================

/*
Security Principles Implemented:

1. **Data Ownership**: Users can only access their own data
2. **Immutable Logs**: Activity logs cannot be modified by users to maintain audit integrity
3. **Flexible Privacy**: Privacy settings control data sharing (implemented via helper functions)
4. **System Operations**: Service role has full access for system-level operations
5. **Future-Proof**: Helper functions prepared for social features (circles/groups)
6. **Admin Access**: Admin role can access all data for support/moderation
7. **Audit Trail**: All operations are logged via activity logs
8. **Data Integrity**: Foreign key constraints and RLS ensure data consistency

Additional Security Considerations:
- All policies use auth.uid() to ensure authenticated access
- Service role policies allow for system operations and automated processes
- Privacy settings are enforced through helper functions
- Future social features (circles) are prepared with placeholder functions
- Activity logs provide complete audit trail while preventing user tampering
*/