-- Comprehensive RLS Policies for All WellNoosh Tables
-- Migration: 20250130_011_comprehensive_rls_security.sql

-- ============================================================================
-- ENABLE RLS ON ALL REMAINING TABLES
-- ============================================================================

-- Phase 3: Recipe Intelligence Tables
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_instructions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_cooking_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_recipe_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_search_logs ENABLE ROW LEVEL SECURITY;

-- Phase 4: Circles (Social) Tables
ALTER TABLE public.circles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circle_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circle_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circle_meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circle_planned_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circle_meal_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circle_grocery_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circle_grocery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circle_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circle_activity_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circle_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circle_challenge_participants ENABLE ROW LEVEL SECURITY;

-- Phase 5: Meal Planning Tables
ALTER TABLE public.user_meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_planned_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_prep_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plan_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plan_template_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_meal_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_meal_planning_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_planning_goals ENABLE ROW LEVEL SECURITY;

-- Phase 6: Shopping & Inventory Tables
ALTER TABLE public.user_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expiration_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_list_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_list_template_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_store_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_waste_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_waste_analysis ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PHASE 3: RECIPE INTELLIGENCE POLICIES
-- ============================================================================

-- RECIPES TABLE
-- Public recipes are viewable by all, private recipes only by owner
CREATE POLICY "Public recipes are viewable by all" ON public.recipes
    FOR SELECT USING (is_public = true AND status = 'active');

CREATE POLICY "Users can view their own recipes" ON public.recipes
    FOR SELECT USING (auth.uid() = author_id);

CREATE POLICY "Users can create recipes" ON public.recipes
    FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own recipes" ON public.recipes
    FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own recipes" ON public.recipes
    FOR DELETE USING (auth.uid() = author_id);

-- Service role can manage all recipes
CREATE POLICY "Service role can manage recipes" ON public.recipes
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- RECIPE INGREDIENTS & INSTRUCTIONS
-- Follow recipe visibility rules
CREATE POLICY "Recipe ingredients follow recipe visibility" ON public.recipe_ingredients
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.recipes r 
            WHERE r.id = recipe_id 
            AND (r.is_public = true OR r.author_id = auth.uid())
        )
    );

CREATE POLICY "Users can manage ingredients for their recipes" ON public.recipe_ingredients
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.recipes r 
            WHERE r.id = recipe_id AND r.author_id = auth.uid()
        )
    );

CREATE POLICY "Recipe instructions follow recipe visibility" ON public.recipe_instructions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.recipes r 
            WHERE r.id = recipe_id 
            AND (r.is_public = true OR r.author_id = auth.uid())
        )
    );

CREATE POLICY "Users can manage instructions for their recipes" ON public.recipe_instructions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.recipes r 
            WHERE r.id = recipe_id AND r.author_id = auth.uid()
        )
    );

-- RECIPE RATINGS & SAVES
CREATE POLICY "Users can view all recipe ratings" ON public.recipe_ratings
    FOR SELECT USING (true);

CREATE POLICY "Users can manage their own recipe ratings" ON public.recipe_ratings
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view all recipe saves" ON public.recipe_saves
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own recipe saves" ON public.recipe_saves
    FOR ALL USING (auth.uid() = user_id);

-- RECIPE COOKING LOGS
CREATE POLICY "Users can view their own cooking logs" ON public.recipe_cooking_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own cooking logs" ON public.recipe_cooking_logs
    FOR ALL USING (auth.uid() = user_id);

-- Circle members can view shared cooking logs
CREATE POLICY "Circle members can view shared cooking logs" ON public.recipe_cooking_logs
    FOR SELECT USING (
        auth.uid() != user_id AND
        public.users_share_circle(auth.uid(), user_id) AND
        (public.get_user_privacy_settings(user_id)->>'activity_sharing')::BOOLEAN = true
    );

-- USER RECIPE PREFERENCES
CREATE POLICY "Users can view their own recipe preferences" ON public.user_recipe_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own recipe preferences" ON public.user_recipe_preferences
    FOR ALL USING (auth.uid() = user_id);

-- RECIPE RELATIONSHIPS & COLLECTIONS
-- Recipe relationships are viewable if both recipes are viewable
CREATE POLICY "Recipe relationships follow recipe visibility" ON public.recipe_relationships
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.recipes r1 
            WHERE r1.id = recipe_id 
            AND (r1.is_public = true OR r1.author_id = auth.uid())
        ) AND
        EXISTS (
            SELECT 1 FROM public.recipes r2 
            WHERE r2.id = related_recipe_id 
            AND (r2.is_public = true OR r2.author_id = auth.uid())
        )
    );

-- Public collections are viewable by all
CREATE POLICY "Public collections are viewable by all" ON public.recipe_collections
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view their own collections" ON public.recipe_collections
    FOR SELECT USING (auth.uid() = created_by_user_id);

CREATE POLICY "Users can manage their own collections" ON public.recipe_collections
    FOR ALL USING (auth.uid() = created_by_user_id OR created_by_user_id IS NULL);

-- Collection items follow collection visibility
CREATE POLICY "Collection items follow collection visibility" ON public.recipe_collection_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.recipe_collections c 
            WHERE c.id = collection_id 
            AND (c.is_public = true OR c.created_by_user_id = auth.uid())
        )
    );

CREATE POLICY "Users can manage items in their collections" ON public.recipe_collection_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.recipe_collections c 
            WHERE c.id = collection_id AND c.created_by_user_id = auth.uid()
        )
    );

-- RECIPE SEARCH LOGS
CREATE POLICY "Users can view their own search logs" ON public.recipe_search_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create search logs" ON public.recipe_search_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- ============================================================================
-- PHASE 4: CIRCLES (SOCIAL) POLICIES
-- ============================================================================

-- CIRCLES TABLE
-- Public circles viewable by all, private circles only by members
CREATE POLICY "Public circles are viewable by all" ON public.circles
    FOR SELECT USING (is_public = true AND status = 'active');

CREATE POLICY "Circle members can view their circles" ON public.circles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.circle_memberships cm 
            WHERE cm.circle_id = id AND cm.user_id = auth.uid() AND cm.status = 'active'
        )
    );

CREATE POLICY "Authenticated users can create circles" ON public.circles
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Circle admins can update their circles" ON public.circles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.circle_memberships cm 
            WHERE cm.circle_id = id AND cm.user_id = auth.uid() 
            AND cm.role IN ('admin') AND cm.status = 'active'
        )
    );

-- CIRCLE MEMBERSHIPS
CREATE POLICY "Circle members can view memberships in their circles" ON public.circle_memberships
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.circle_memberships cm 
            WHERE cm.circle_id = circle_id AND cm.user_id = auth.uid() AND cm.status = 'active'
        )
    );

CREATE POLICY "Users can view their own memberships" ON public.circle_memberships
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Circle admins can manage memberships" ON public.circle_memberships
    FOR ALL USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.circle_memberships cm 
            WHERE cm.circle_id = circle_id AND cm.user_id = auth.uid() 
            AND cm.role IN ('admin', 'moderator') AND cm.status = 'active'
        )
    );

-- CIRCLE INVITATIONS
CREATE POLICY "Users can view invitations sent to them" ON public.circle_invitations
    FOR SELECT USING (
        auth.uid() = invited_user_id OR 
        auth.uid() = invited_by_user_id OR
        (SELECT email FROM auth.users WHERE id = auth.uid()) = invited_email
    );

CREATE POLICY "Circle members can create invitations" ON public.circle_invitations
    FOR INSERT WITH CHECK (
        auth.uid() = invited_by_user_id AND
        EXISTS (
            SELECT 1 FROM public.circle_memberships cm 
            WHERE cm.circle_id = circle_id AND cm.user_id = auth.uid() 
            AND cm.can_invite_members = true AND cm.status = 'active'
        )
    );

-- CIRCLE MEAL PLANS & MEALS
CREATE POLICY "Circle members can view meal plans" ON public.circle_meal_plans
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.circle_memberships cm 
            WHERE cm.circle_id = circle_id AND cm.user_id = auth.uid() AND cm.status = 'active'
        )
    );

CREATE POLICY "Circle members can create meal plans" ON public.circle_meal_plans
    FOR INSERT WITH CHECK (
        auth.uid() = created_by_user_id AND
        EXISTS (
            SELECT 1 FROM public.circle_memberships cm 
            WHERE cm.circle_id = circle_id AND cm.user_id = auth.uid() 
            AND cm.can_plan_meals = true AND cm.status = 'active'
        )
    );

CREATE POLICY "Circle members can view planned meals" ON public.circle_planned_meals
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.circle_meal_plans cmp
            JOIN public.circle_memberships cm ON cmp.circle_id = cm.circle_id
            WHERE cmp.id = meal_plan_id AND cm.user_id = auth.uid() AND cm.status = 'active'
        )
    );

-- CIRCLE GROCERY LISTS
CREATE POLICY "Circle members can view grocery lists" ON public.circle_grocery_lists
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.circle_memberships cm 
            WHERE cm.circle_id = circle_id AND cm.user_id = auth.uid() AND cm.status = 'active'
        )
    );

CREATE POLICY "Circle members can manage grocery lists" ON public.circle_grocery_lists
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.circle_memberships cm 
            WHERE cm.circle_id = circle_id AND cm.user_id = auth.uid() 
            AND cm.can_manage_grocery = true AND cm.status = 'active'
        )
    );

-- CIRCLE ACTIVITIES
CREATE POLICY "Circle members can view activities" ON public.circle_activities
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.circle_memberships cm 
            WHERE cm.circle_id = circle_id AND cm.user_id = auth.uid() AND cm.status = 'active'
        )
    );

CREATE POLICY "Circle members can create activities" ON public.circle_activities
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.circle_memberships cm 
            WHERE cm.circle_id = circle_id AND cm.user_id = auth.uid() AND cm.status = 'active'
        )
    );

-- ============================================================================
-- PHASE 5: MEAL PLANNING POLICIES
-- ============================================================================

-- USER MEAL PLANS
CREATE POLICY "Users can view their own meal plans" ON public.user_meal_plans
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own meal plans" ON public.user_meal_plans
    FOR ALL USING (auth.uid() = user_id);

-- Circle members can view shared meal plans if sharing enabled
CREATE POLICY "Circle members can view shared meal plans" ON public.user_meal_plans
    FOR SELECT USING (
        auth.uid() != user_id AND
        is_shareable = true AND
        public.users_share_circle(auth.uid(), user_id)
    );

-- USER PLANNED MEALS
CREATE POLICY "Users can view their own planned meals" ON public.user_planned_meals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own planned meals" ON public.user_planned_meals
    FOR ALL USING (auth.uid() = user_id);

-- MEAL PREP SESSIONS
CREATE POLICY "Users can view their own meal prep sessions" ON public.meal_prep_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own meal prep sessions" ON public.meal_prep_sessions
    FOR ALL USING (auth.uid() = user_id);

-- MEAL PLAN TEMPLATES
-- Public templates viewable by all
CREATE POLICY "Public templates are viewable by all" ON public.meal_plan_templates
    FOR SELECT USING (is_public = true AND verification_status = 'verified');

CREATE POLICY "Users can view their own templates" ON public.meal_plan_templates
    FOR SELECT USING (auth.uid() = created_by_user_id);

CREATE POLICY "Users can manage their own templates" ON public.meal_plan_templates
    FOR ALL USING (auth.uid() = created_by_user_id OR created_by_user_id IS NULL);

-- Template meals follow template visibility
CREATE POLICY "Template meals follow template visibility" ON public.meal_plan_template_meals
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.meal_plan_templates mpt 
            WHERE mpt.id = template_id 
            AND (mpt.is_public = true OR mpt.created_by_user_id = auth.uid())
        )
    );

-- USER MEAL PATTERNS & ANALYTICS
CREATE POLICY "Users can view their own meal patterns" ON public.user_meal_patterns
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own meal patterns" ON public.user_meal_patterns
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own meal planning analysis" ON public.weekly_meal_planning_analysis
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create meal planning analysis" ON public.weekly_meal_planning_analysis
    FOR INSERT WITH CHECK (
        auth.uid() = user_id OR auth.jwt() ->> 'role' = 'service_role'
    );

-- MEAL PLANNING GOALS
CREATE POLICY "Users can view their own meal planning goals" ON public.meal_planning_goals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own meal planning goals" ON public.meal_planning_goals
    FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- PHASE 6: SHOPPING & INVENTORY POLICIES
-- ============================================================================

-- USER INVENTORY
CREATE POLICY "Users can view their own inventory" ON public.user_inventory
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own inventory" ON public.user_inventory
    FOR ALL USING (auth.uid() = user_id);

-- Circle members can view shared inventory if enabled
CREATE POLICY "Circle members can view shared inventory" ON public.user_inventory
    FOR SELECT USING (
        auth.uid() != user_id AND
        public.users_share_circle(auth.uid(), user_id) AND
        (public.get_user_privacy_settings(user_id)->>'inventory_sharing')::BOOLEAN = true
    );

-- INVENTORY USAGE LOGS
CREATE POLICY "Users can view their own inventory usage" ON public.inventory_usage_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own inventory usage" ON public.inventory_usage_logs
    FOR ALL USING (auth.uid() = user_id);

-- EXPIRATION ALERTS
CREATE POLICY "Users can view their own expiration alerts" ON public.expiration_alerts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own expiration alerts" ON public.expiration_alerts
    FOR ALL USING (auth.uid() = user_id);

-- SHOPPING LISTS
CREATE POLICY "Users can view their own shopping lists" ON public.shopping_lists
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own shopping lists" ON public.shopping_lists
    FOR ALL USING (auth.uid() = user_id);

-- Circle members can view shared shopping lists
CREATE POLICY "Circle members can view shared shopping lists" ON public.shopping_lists
    FOR SELECT USING (
        circle_id IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM public.circle_memberships cm 
            WHERE cm.circle_id = shopping_lists.circle_id 
            AND cm.user_id = auth.uid() AND cm.status = 'active'
        )
    );

-- Shared users can view lists shared with them
CREATE POLICY "Shared users can view shopping lists" ON public.shopping_lists
    FOR SELECT USING (
        is_shared = true AND auth.uid() = ANY(shared_with_users)
    );

-- SHOPPING LIST ITEMS
CREATE POLICY "Users can view items in accessible shopping lists" ON public.shopping_list_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.shopping_lists sl 
            WHERE sl.id = shopping_list_id 
            AND (
                sl.user_id = auth.uid() OR
                (sl.circle_id IS NOT NULL AND EXISTS (
                    SELECT 1 FROM public.circle_memberships cm 
                    WHERE cm.circle_id = sl.circle_id AND cm.user_id = auth.uid() AND cm.status = 'active'
                )) OR
                (sl.is_shared = true AND auth.uid() = ANY(sl.shared_with_users))
            )
        )
    );

CREATE POLICY "Users can manage items in their shopping lists" ON public.shopping_list_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.shopping_lists sl 
            WHERE sl.id = shopping_list_id AND sl.user_id = auth.uid()
        )
    );

-- SHOPPING LIST TEMPLATES
CREATE POLICY "Users can view their own shopping list templates" ON public.shopping_list_templates
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own shopping list templates" ON public.shopping_list_templates
    FOR ALL USING (auth.uid() = user_id);

-- STORES & PRICES
-- Store information is publicly readable
CREATE POLICY "Stores are publicly readable" ON public.stores
    FOR SELECT USING (true);

CREATE POLICY "Verified users can add stores" ON public.stores
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- User store preferences
CREATE POLICY "Users can view their own store preferences" ON public.user_store_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own store preferences" ON public.user_store_preferences
    FOR ALL USING (auth.uid() = user_id);

-- Item prices are publicly readable
CREATE POLICY "Item prices are publicly readable" ON public.item_prices
    FOR SELECT USING (true);

CREATE POLICY "Users can contribute price information" ON public.item_prices
    FOR INSERT WITH CHECK (auth.uid() = reported_by_user_id OR reported_by_user_id IS NULL);

-- Price alerts
CREATE POLICY "Users can view their own price alerts" ON public.price_alerts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own price alerts" ON public.price_alerts
    FOR ALL USING (auth.uid() = user_id);

-- WASTE TRACKING
CREATE POLICY "Users can view their own waste logs" ON public.food_waste_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own waste logs" ON public.food_waste_logs
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own waste analysis" ON public.weekly_waste_analysis
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create waste analysis" ON public.weekly_waste_analysis
    FOR INSERT WITH CHECK (
        auth.uid() = user_id OR auth.jwt() ->> 'role' = 'service_role'
    );

-- ============================================================================
-- COMPREHENSIVE GRANT PERMISSIONS
-- ============================================================================

-- Grant authenticated users access to all tables
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant service role full access (for system operations)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Grant anonymous read access to public resources
GRANT SELECT ON public.foods TO anon;
GRANT SELECT ON public.food_serving_sizes TO anon;
GRANT SELECT ON public.recipes TO anon;
GRANT SELECT ON public.recipe_ingredients TO anon;
GRANT SELECT ON public.recipe_instructions TO anon;
GRANT SELECT ON public.recipe_collections TO anon;
GRANT SELECT ON public.recipe_collection_items TO anon;
GRANT SELECT ON public.stores TO anon;
GRANT SELECT ON public.item_prices TO anon;

-- ============================================================================
-- HELPER FUNCTIONS FOR ENHANCED SECURITY
-- ============================================================================

-- Function to check if user is circle admin
CREATE OR REPLACE FUNCTION public.is_circle_admin(p_circle_id UUID, p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.circle_memberships
        WHERE circle_id = p_circle_id 
        AND user_id = p_user_id 
        AND role = 'admin' 
        AND status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can access recipe
CREATE OR REPLACE FUNCTION public.can_access_recipe(p_recipe_id UUID, p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
DECLARE
    recipe_record RECORD;
BEGIN
    SELECT is_public, author_id, status INTO recipe_record
    FROM public.recipes WHERE id = p_recipe_id;
    
    IF recipe_record IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Public and active recipes are accessible to all
    IF recipe_record.is_public = true AND recipe_record.status = 'active' THEN
        RETURN TRUE;
    END IF;
    
    -- Authors can always access their recipes
    IF recipe_record.author_id = p_user_id THEN
        RETURN TRUE;
    END IF;
    
    -- Admin/service role access
    IF auth.jwt() ->> 'role' IN ('admin', 'service_role') THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check meal plan sharing permissions
CREATE OR REPLACE FUNCTION public.can_view_meal_plan(p_meal_plan_id UUID, p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
DECLARE
    plan_record RECORD;
BEGIN
    SELECT user_id, is_shareable INTO plan_record
    FROM public.user_meal_plans WHERE id = p_meal_plan_id;
    
    IF plan_record IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Owner can always view
    IF plan_record.user_id = p_user_id THEN
        RETURN TRUE;
    END IF;
    
    -- Check if shareable and users share a circle
    IF plan_record.is_shareable = true AND 
       public.users_share_circle(p_user_id, plan_record.user_id) THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on helper functions
GRANT EXECUTE ON FUNCTION public.is_circle_admin(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_recipe(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_view_meal_plan(UUID, UUID) TO authenticated;

-- ============================================================================
-- SECURITY AUDIT LOG
-- ============================================================================

-- Create audit log for security events
CREATE TABLE public.security_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id),
    
    -- Event Information
    event_type TEXT NOT NULL CHECK (event_type IN (
        'unauthorized_access_attempt', 'permission_escalation', 'data_breach_attempt',
        'unusual_activity', 'policy_violation', 'admin_action'
    )),
    event_description TEXT NOT NULL,
    
    -- Context
    table_name TEXT,
    record_id UUID,
    ip_address INET,
    user_agent TEXT,
    
    -- Security Details
    severity_level TEXT DEFAULT 'medium' CHECK (severity_level IN ('low', 'medium', 'high', 'critical')),
    
    -- Status
    investigated BOOLEAN DEFAULT FALSE,
    resolved BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins and service role can view audit logs
CREATE POLICY "Admins can view security audit logs" ON public.security_audit_log
    FOR SELECT USING (auth.jwt() ->> 'role' IN ('admin', 'service_role'));

CREATE POLICY "System can create security audit logs" ON public.security_audit_log
    FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

GRANT ALL ON public.security_audit_log TO service_role;
GRANT SELECT ON public.security_audit_log TO authenticated;