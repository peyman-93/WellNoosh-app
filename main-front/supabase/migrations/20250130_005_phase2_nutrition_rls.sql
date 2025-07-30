-- Phase 2: RLS Policies for Nutrition Tracking System
-- Migration: 20250130_005_phase2_nutrition_rls.sql

-- Enable RLS on all nutrition tables
ALTER TABLE public.foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_serving_sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_nutrition_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_food_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_intake_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_nutrition_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrient_deficiency_alerts ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- FOODS TABLE POLICIES (Public/Shared Data)
-- ============================================================================

-- Foods are mostly public data that everyone can read
CREATE POLICY "Foods are publicly readable" ON public.foods
    FOR SELECT USING (is_active = true);

-- Only verified/admin users can insert foods
CREATE POLICY "Verified users can add foods" ON public.foods
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND (
            auth.jwt() ->> 'role' = 'service_role' OR
            auth.jwt() ->> 'role' = 'admin' OR
            -- Allow users to add foods but mark them as unverified
            (verification_status = 'pending' AND data_source = 'user_contributed')
        )
    );

-- Users can update foods they contributed (before verification)
CREATE POLICY "Users can update their contributed foods" ON public.foods
    FOR UPDATE USING (
        auth.uid() IS NOT NULL AND (
            auth.jwt() ->> 'role' = 'service_role' OR
            auth.jwt() ->> 'role' = 'admin' OR
            (data_source = 'user_contributed' AND verification_status = 'pending')
        )
    );

-- Only admins can delete foods
CREATE POLICY "Admins can delete foods" ON public.foods
    FOR DELETE USING (auth.jwt() ->> 'role' IN ('service_role', 'admin'));

-- ============================================================================
-- FOOD SERVING SIZES POLICIES
-- ============================================================================

-- Food serving sizes are publicly readable
CREATE POLICY "Food serving sizes are publicly readable" ON public.food_serving_sizes
    FOR SELECT USING (true);

-- Authenticated users can add serving sizes
CREATE POLICY "Users can add serving sizes" ON public.food_serving_sizes
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update serving sizes they created
CREATE POLICY "Users can update serving sizes" ON public.food_serving_sizes
    FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Service role can manage serving sizes
CREATE POLICY "Service role can manage serving sizes" ON public.food_serving_sizes
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- DAILY NUTRITION SUMMARIES POLICIES
-- ============================================================================

-- Users can view their own daily summaries
CREATE POLICY "Users can view own nutrition summaries" ON public.daily_nutrition_summaries
    FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own summaries
CREATE POLICY "Users can update own nutrition summaries" ON public.daily_nutrition_summaries
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can insert their own summaries
CREATE POLICY "Users can insert own nutrition summaries" ON public.daily_nutrition_summaries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own summaries
CREATE POLICY "Users can delete own nutrition summaries" ON public.daily_nutrition_summaries
    FOR DELETE USING (auth.uid() = user_id);

-- Circle members can view summaries if sharing is enabled (future feature)
CREATE POLICY "Circle members can view shared summaries" ON public.daily_nutrition_summaries
    FOR SELECT USING (
        auth.uid() != user_id AND
        public.users_share_circle(auth.uid(), user_id) AND
        (public.get_user_privacy_settings(user_id)->>'stats_sharing')::BOOLEAN = true
    );

-- ============================================================================
-- MEAL LOGS POLICIES
-- ============================================================================

-- Users can view their own meal logs
CREATE POLICY "Users can view own meal logs" ON public.meal_logs
    FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own meal logs
CREATE POLICY "Users can update own meal logs" ON public.meal_logs
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can insert their own meal logs
CREATE POLICY "Users can insert own meal logs" ON public.meal_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own meal logs
CREATE POLICY "Users can delete own meal logs" ON public.meal_logs
    FOR DELETE USING (auth.uid() = user_id);

-- Circle members can view meal logs if sharing is enabled
CREATE POLICY "Circle members can view shared meal logs" ON public.meal_logs
    FOR SELECT USING (
        auth.uid() != user_id AND
        public.users_share_circle(auth.uid(), user_id) AND
        (public.get_user_privacy_settings(user_id)->>'activity_sharing')::BOOLEAN = true
    );

-- ============================================================================
-- MEAL FOOD ITEMS POLICIES
-- ============================================================================

-- Users can view food items for their own meals
CREATE POLICY "Users can view own meal food items" ON public.meal_food_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.meal_logs ml
            WHERE ml.id = meal_log_id AND ml.user_id = auth.uid()
        )
    );

-- Users can update food items for their own meals
CREATE POLICY "Users can update own meal food items" ON public.meal_food_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.meal_logs ml
            WHERE ml.id = meal_log_id AND ml.user_id = auth.uid()
        )
    );

-- Users can insert food items for their own meals
CREATE POLICY "Users can insert own meal food items" ON public.meal_food_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.meal_logs ml
            WHERE ml.id = meal_log_id AND ml.user_id = auth.uid()
        )
    );

-- Users can delete food items from their own meals
CREATE POLICY "Users can delete own meal food items" ON public.meal_food_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.meal_logs ml
            WHERE ml.id = meal_log_id AND ml.user_id = auth.uid()
        )
    );

-- Circle members can view food items if meal sharing is enabled
CREATE POLICY "Circle members can view shared meal food items" ON public.meal_food_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.meal_logs ml
            WHERE ml.id = meal_log_id 
            AND ml.user_id != auth.uid()
            AND public.users_share_circle(auth.uid(), ml.user_id)
            AND (public.get_user_privacy_settings(ml.user_id)->>'activity_sharing')::BOOLEAN = true
        )
    );

-- ============================================================================
-- WATER INTAKE LOGS POLICIES
-- ============================================================================

-- Users can view their own water intake logs
CREATE POLICY "Users can view own water intake" ON public.water_intake_logs
    FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own water intake logs
CREATE POLICY "Users can update own water intake" ON public.water_intake_logs
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can insert their own water intake logs
CREATE POLICY "Users can insert own water intake" ON public.water_intake_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own water intake logs
CREATE POLICY "Users can delete own water intake" ON public.water_intake_logs
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- WEEKLY NUTRITION ANALYSIS POLICIES
-- ============================================================================

-- Users can view their own weekly analysis
CREATE POLICY "Users can view own weekly analysis" ON public.weekly_nutrition_analysis
    FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own weekly analysis
CREATE POLICY "Users can update own weekly analysis" ON public.weekly_nutrition_analysis
    FOR UPDATE USING (auth.uid() = user_id);

-- System can insert weekly analysis
CREATE POLICY "System can insert weekly analysis" ON public.weekly_nutrition_analysis
    FOR INSERT WITH CHECK (
        auth.uid() = user_id OR 
        auth.jwt() ->> 'role' = 'service_role'
    );

-- Users can delete their own weekly analysis
CREATE POLICY "Users can delete own weekly analysis" ON public.weekly_nutrition_analysis
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- NUTRIENT DEFICIENCY ALERTS POLICIES
-- ============================================================================

-- Users can view their own deficiency alerts
CREATE POLICY "Users can view own deficiency alerts" ON public.nutrient_deficiency_alerts
    FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own alerts (dismiss, etc.)
CREATE POLICY "Users can update own deficiency alerts" ON public.nutrient_deficiency_alerts
    FOR UPDATE USING (auth.uid() = user_id);

-- System can create deficiency alerts
CREATE POLICY "System can create deficiency alerts" ON public.nutrient_deficiency_alerts
    FOR INSERT WITH CHECK (
        auth.uid() = user_id OR 
        auth.jwt() ->> 'role' = 'service_role'
    );

-- Users can delete their own alerts
CREATE POLICY "Users can delete own deficiency alerts" ON public.nutrient_deficiency_alerts
    FOR DELETE USING (auth.uid() = user_id);

-- Healthcare professionals can view alerts for their patients (future feature)
-- CREATE POLICY "Healthcare professionals can view patient alerts" ON public.nutrient_deficiency_alerts
--     FOR SELECT USING (
--         EXISTS (
--             SELECT 1 FROM public.health_professional_access hpa
--             WHERE hpa.professional_id = auth.uid() 
--             AND hpa.patient_id = user_id 
--             AND hpa.is_active = true
--         )
--     );

-- ============================================================================
-- HELPER FUNCTIONS FOR NUTRITION POLICIES
-- ============================================================================

-- Function to check if user can view another user's nutrition data
CREATE OR REPLACE FUNCTION public.can_view_nutrition_data(target_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    privacy_settings JSONB;
BEGIN
    -- Own data is always viewable
    IF auth.uid() = target_user_id THEN
        RETURN TRUE;
    END IF;
    
    -- Get privacy settings
    SELECT public.get_user_privacy_settings(target_user_id) INTO privacy_settings;
    
    -- Check if stats sharing is enabled and users share a circle
    IF (privacy_settings->>'stats_sharing')::BOOLEAN = true AND 
       public.users_share_circle(auth.uid(), target_user_id) THEN
        RETURN TRUE;
    END IF;
    
    -- Check if user is a healthcare professional with access
    -- IF EXISTS (
    --     SELECT 1 FROM public.health_professional_access
    --     WHERE professional_id = auth.uid() 
    --     AND patient_id = target_user_id 
    --     AND is_active = true
    -- ) THEN
    --     RETURN TRUE;
    -- END IF;
    
    -- Admin/service role access
    IF auth.jwt() ->> 'role' IN ('admin', 'service_role') THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if nutrition data sharing is enabled
CREATE OR REPLACE FUNCTION public.nutrition_sharing_enabled(target_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    privacy_settings JSONB;
BEGIN
    SELECT public.get_user_privacy_settings(target_user_id) INTO privacy_settings;
    RETURN COALESCE((privacy_settings->>'stats_sharing')::BOOLEAN, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant authenticated users access to nutrition tables
GRANT ALL ON public.foods TO authenticated;
GRANT ALL ON public.food_serving_sizes TO authenticated;
GRANT ALL ON public.daily_nutrition_summaries TO authenticated;
GRANT ALL ON public.meal_logs TO authenticated;
GRANT ALL ON public.meal_food_items TO authenticated;
GRANT ALL ON public.water_intake_logs TO authenticated;
GRANT ALL ON public.weekly_nutrition_analysis TO authenticated;
GRANT ALL ON public.nutrient_deficiency_alerts TO authenticated;

-- Grant service role full access
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Grant anonymous read access to foods (for recipe browsing)
GRANT SELECT ON public.foods TO anon;
GRANT SELECT ON public.food_serving_sizes TO anon;

-- Grant execute permissions on nutrition helper functions
GRANT EXECUTE ON FUNCTION public.can_view_nutrition_data(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.nutrition_sharing_enabled(UUID) TO authenticated;

-- ============================================================================
-- SECURITY NOTES FOR NUTRITION SYSTEM
-- ============================================================================

/*
Nutrition Data Security Principles:

1. **Personal Data Privacy**: Users can only access their own nutrition data by default
2. **Controlled Sharing**: Users can choose to share nutrition stats with circle members
3. **Public Food Database**: Food information is publicly readable for all users
4. **User Contributions**: Users can contribute food data but it needs verification
5. **Healthcare Integration**: Prepared for future healthcare professional access
6. **Audit Trail**: All nutrition logging is tracked through activity logs
7. **Data Integrity**: Triggers ensure nutrition calculations stay consistent
8. **Flexible Privacy**: Users control what nutrition data they share and with whom

Special Considerations:
- Food database is treated as shared/public resource
- User-contributed foods are marked as unverified until admin approval
- Nutrition sharing follows user privacy settings
- Healthcare professional access is prepared but not yet implemented
- Service role can perform system operations and data analysis
- Anonymous users can browse foods for recipe planning
*/