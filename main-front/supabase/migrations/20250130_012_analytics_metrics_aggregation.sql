-- Analytics and Metrics Aggregation System
-- Migration: 20250130_012_analytics_metrics_aggregation.sql

-- ============================================================================
-- ANALYTICS INFRASTRUCTURE TABLES
-- ============================================================================

-- System-wide metrics aggregation
CREATE TABLE public.system_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Metric Information
    metric_name TEXT NOT NULL,
    metric_category TEXT NOT NULL CHECK (metric_category IN (
        'user_engagement', 'content_creation', 'nutrition_tracking', 'recipe_usage',
        'meal_planning', 'shopping_behavior', 'social_activity', 'system_performance'
    )),
    
    -- Time Period
    period_type TEXT NOT NULL CHECK (period_type IN ('hourly', 'daily', 'weekly', 'monthly', 'yearly')),
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    
    -- Metric Values
    metric_value DECIMAL(15,4) NOT NULL,
    previous_period_value DECIMAL(15,4),
    percentage_change DECIMAL(6,2),
    
    -- Aggregation Details
    data_points_count INTEGER DEFAULT 1,
    aggregation_method TEXT DEFAULT 'sum' CHECK (aggregation_method IN ('sum', 'avg', 'min', 'max', 'count', 'distinct_count')),
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(metric_name, metric_category, period_type, period_start)
);

-- User engagement analytics
CREATE TABLE public.user_engagement_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Time Period
    date DATE NOT NULL,
    week_start_date DATE NOT NULL,
    month_start_date DATE NOT NULL,
    
    -- Session Metrics
    sessions_count INTEGER DEFAULT 0,
    total_session_duration_minutes INTEGER DEFAULT 0,
    avg_session_duration_minutes DECIMAL(6,2) DEFAULT 0,
    pages_viewed INTEGER DEFAULT 0,
    actions_performed INTEGER DEFAULT 0,
    
    -- Feature Usage
    recipes_viewed INTEGER DEFAULT 0,
    recipes_saved INTEGER DEFAULT 0,
    recipes_cooked INTEGER DEFAULT 0,
    meals_logged INTEGER DEFAULT 0,
    ingredients_tracked INTEGER DEFAULT 0,
    
    -- Social Engagement
    circles_active INTEGER DEFAULT 0,
    meals_planned_with_circles INTEGER DEFAULT 0,
    recipes_shared INTEGER DEFAULT 0,
    comments_made INTEGER DEFAULT 0,
    votes_cast INTEGER DEFAULT 0,
    
    -- Content Creation
    recipes_created INTEGER DEFAULT 0,
    meal_plans_created INTEGER DEFAULT 0,
    reviews_written INTEGER DEFAULT 0,
    
    -- Shopping & Inventory
    shopping_lists_created INTEGER DEFAULT 0,
    inventory_items_tracked INTEGER DEFAULT 0,
    grocery_items_purchased INTEGER DEFAULT 0,
    
    -- Achievements & Goals
    goals_set INTEGER DEFAULT 0,
    goals_achieved INTEGER DEFAULT 0,
    achievements_unlocked INTEGER DEFAULT 0,
    
    -- Engagement Quality
    engagement_score DECIMAL(5,2) DEFAULT 0, -- 0-100 composite score
    retention_risk_score DECIMAL(5,2) DEFAULT 0, -- 0-100, higher = more likely to churn
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, date)
);

-- Content performance analytics
CREATE TABLE public.content_performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Content Information
    content_type TEXT NOT NULL CHECK (content_type IN ('recipe', 'meal_plan_template', 'collection', 'challenge')),
    content_id UUID NOT NULL,
    content_title TEXT,
    creator_user_id UUID REFERENCES public.users(id),
    
    -- Time Period
    date DATE NOT NULL,
    
    -- Engagement Metrics
    views_count INTEGER DEFAULT 0,
    unique_viewers INTEGER DEFAULT 0,
    saves_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    
    -- Quality Metrics
    average_rating DECIMAL(3,2) DEFAULT 0,
    ratings_count INTEGER DEFAULT 0,
    completion_rate DECIMAL(5,2) DEFAULT 0, -- For recipes: cook completion rate
    
    -- Usage Metrics (specific to content type)
    times_cooked INTEGER DEFAULT 0, -- For recipes
    times_used INTEGER DEFAULT 0, -- For meal plan templates
    success_rate DECIMAL(5,2) DEFAULT 0,
    
    -- Discovery Metrics
    search_appearances INTEGER DEFAULT 0,
    search_clicks INTEGER DEFAULT 0,
    recommendation_appearances INTEGER DEFAULT 0,
    recommendation_clicks INTEGER DEFAULT 0,
    
    -- Performance Score
    virality_score DECIMAL(5,2) DEFAULT 0, -- 0-100
    quality_score DECIMAL(5,2) DEFAULT 0, -- 0-100
    trending_score DECIMAL(5,2) DEFAULT 0, -- 0-100
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(content_type, content_id, date)
);

-- Nutrition analytics aggregations
CREATE TABLE public.nutrition_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Aggregation Level
    aggregation_level TEXT NOT NULL CHECK (aggregation_level IN ('user', 'circle', 'global')),
    entity_id UUID, -- user_id for user-level, circle_id for circle-level, NULL for global
    
    -- Time Period
    period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly')),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Nutrition Metrics
    avg_daily_calories DECIMAL(8,2),
    avg_daily_protein_g DECIMAL(6,2),
    avg_daily_carbs_g DECIMAL(6,2),
    avg_daily_fat_g DECIMAL(6,2),
    avg_daily_fiber_g DECIMAL(6,2),
    avg_daily_sodium_mg DECIMAL(8,2),
    
    -- Micronutrient Averages
    avg_micronutrients JSONB DEFAULT '{}',
    
    -- Target Achievement
    calories_target_achievement_rate DECIMAL(5,2) DEFAULT 0,
    protein_target_achievement_rate DECIMAL(5,2) DEFAULT 0,
    fiber_target_achievement_rate DECIMAL(5,2) DEFAULT 0,
    overall_nutrition_score DECIMAL(4,2) DEFAULT 0,
    
    -- Diet Quality Metrics
    vegetable_servings_avg DECIMAL(4,2) DEFAULT 0,
    fruit_servings_avg DECIMAL(4,2) DEFAULT 0,
    whole_grain_servings_avg DECIMAL(4,2) DEFAULT 0,
    processed_food_score DECIMAL(4,2) DEFAULT 0,
    diet_variety_score DECIMAL(4,2) DEFAULT 0,
    
    -- Behavioral Metrics
    meal_logging_consistency DECIMAL(5,2) DEFAULT 0, -- Percentage of days logged
    water_intake_consistency DECIMAL(5,2) DEFAULT 0,
    
    -- Trends
    calorie_trend TEXT, -- 'increasing', 'decreasing', 'stable'
    nutrition_score_trend DECIMAL(6,2), -- Change vs previous period
    
    -- Data Quality
    data_completeness_score DECIMAL(5,2) DEFAULT 0, -- How complete is the data
    sample_size INTEGER DEFAULT 0, -- Number of data points
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(aggregation_level, entity_id, period_type, period_start)
);

-- Recipe and meal analytics
CREATE TABLE public.recipe_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Time Period
    date DATE NOT NULL,
    
    -- Recipe Discovery Metrics
    total_recipe_searches INTEGER DEFAULT 0,
    unique_searchers INTEGER DEFAULT 0,
    avg_search_results_clicked DECIMAL(4,2) DEFAULT 0,
    
    -- Popular Search Terms
    top_search_terms JSONB DEFAULT '[]',
    trending_cuisines TEXT[] DEFAULT '{}',
    trending_dietary_tags TEXT[] DEFAULT '{}',
    
    -- Recipe Creation Metrics
    new_recipes_created INTEGER DEFAULT 0,
    user_generated_recipes INTEGER DEFAULT 0,
    ai_generated_recipes INTEGER DEFAULT 0,
    verified_recipes INTEGER DEFAULT 0,
    
    -- Recipe Engagement
    total_recipe_views INTEGER DEFAULT 0,
    total_recipe_saves INTEGER DEFAULT 0,
    total_cooking_attempts INTEGER DEFAULT 0,
    total_recipe_ratings INTEGER DEFAULT 0,
    avg_recipe_rating DECIMAL(3,2) DEFAULT 0,
    
    -- Recipe Performance
    top_performing_recipes JSONB DEFAULT '[]', -- Array of {recipe_id, metric, value}
    most_saved_recipes JSONB DEFAULT '[]',
    most_cooked_recipes JSONB DEFAULT '[]',
    highest_rated_recipes JSONB DEFAULT '[]',
    
    -- Recipe Categories Performance
    category_performance JSONB DEFAULT '{}', -- Performance by food category
    cuisine_performance JSONB DEFAULT '{}', -- Performance by cuisine type
    difficulty_performance JSONB DEFAULT '{}', -- Performance by difficulty level
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(date)
);

-- Social activity analytics
CREATE TABLE public.social_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Time Period
    date DATE NOT NULL,
    
    -- Circle Metrics
    total_circles INTEGER DEFAULT 0,
    active_circles INTEGER DEFAULT 0, -- Circles with activity in period
    new_circles_created INTEGER DEFAULT 0,
    avg_circle_size DECIMAL(5,2) DEFAULT 0,
    
    -- Circle Activity
    total_circle_meal_plans INTEGER DEFAULT 0,
    total_circle_grocery_lists INTEGER DEFAULT 0,
    total_circle_challenges INTEGER DEFAULT 0,
    circle_member_invitations INTEGER DEFAULT 0,
    
    -- Social Engagement
    total_circle_activities INTEGER DEFAULT 0,
    total_activity_comments INTEGER DEFAULT 0,
    total_meal_votes INTEGER DEFAULT 0,
    total_recipe_shares INTEGER DEFAULT 0,
    
    -- Challenge Participation
    active_challenges INTEGER DEFAULT 0,
    challenge_participants INTEGER DEFAULT 0,
    challenge_completion_rate DECIMAL(5,2) DEFAULT 0,
    
    -- Collaboration Success
    collaborative_meals_planned INTEGER DEFAULT 0,
    collaborative_shopping_lists INTEGER DEFAULT 0,
    group_cooking_sessions INTEGER DEFAULT 0,
    
    -- Most Active Circles
    most_active_circles JSONB DEFAULT '[]', -- Array of {circle_id, activity_count}
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(date)
);

-- ============================================================================
-- REAL-TIME ANALYTICS VIEWS
-- ============================================================================

-- Real-time user activity dashboard
CREATE VIEW public.user_activity_dashboard AS
SELECT 
    u.id as user_id,
    u.full_name,
    u.email,
    u.created_at as user_since,
    u.last_active_at,
    
    -- Recent Activity (last 7 days)
    COALESCE(recent_activity.sessions_count, 0) as recent_sessions,
    COALESCE(recent_activity.total_session_duration_minutes, 0) as recent_minutes,
    COALESCE(recent_activity.recipes_viewed, 0) as recent_recipes_viewed,
    COALESCE(recent_activity.meals_logged, 0) as recent_meals_logged,
    
    -- Overall Stats
    (SELECT COUNT(*) FROM public.recipe_saves WHERE user_id = u.id) as total_saved_recipes,
    (SELECT COUNT(*) FROM public.recipe_cooking_logs WHERE user_id = u.id) as total_cooked_recipes,
    (SELECT COUNT(*) FROM public.meal_logs WHERE user_id = u.id) as total_meals_logged,
    (SELECT COUNT(*) FROM public.circle_memberships WHERE user_id = u.id AND status = 'active') as active_circles,
    
    -- Engagement Score
    COALESCE(recent_activity.engagement_score, 0) as engagement_score,
    COALESCE(recent_activity.retention_risk_score, 0) as retention_risk_score

FROM public.users u
LEFT JOIN LATERAL (
    SELECT 
        SUM(sessions_count) as sessions_count,
        SUM(total_session_duration_minutes) as total_session_duration_minutes,
        SUM(recipes_viewed) as recipes_viewed,
        SUM(meals_logged) as meals_logged,
        AVG(engagement_score) as engagement_score,
        AVG(retention_risk_score) as retention_risk_score
    FROM public.user_engagement_metrics
    WHERE user_id = u.id 
    AND date >= CURRENT_DATE - INTERVAL '7 days'
) recent_activity ON true;

-- Popular content view
CREATE VIEW public.popular_content_dashboard AS
SELECT 
    content_type,
    content_id,
    content_title,
    creator_user_id,
    
    -- Last 7 days metrics
    SUM(views_count) as total_views,
    SUM(unique_viewers) as unique_viewers,
    SUM(saves_count) as total_saves,
    SUM(shares_count) as total_shares,
    AVG(average_rating) as avg_rating,
    
    -- Performance scores
    AVG(virality_score) as virality_score,
    AVG(quality_score) as quality_score,
    AVG(trending_score) as trending_score,
    
    -- Recent trend
    (SUM(views_count) FILTER (WHERE date >= CURRENT_DATE - INTERVAL '3 days')) /
    NULLIF(SUM(views_count) FILTER (WHERE date >= CURRENT_DATE - INTERVAL '7 days' AND date < CURRENT_DATE - INTERVAL '3 days'), 0) 
    as view_growth_rate

FROM public.content_performance_metrics
WHERE date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY content_type, content_id, content_title, creator_user_id
ORDER BY total_views DESC;

-- Nutrition insights view
CREATE VIEW public.nutrition_insights_dashboard AS
SELECT 
    aggregation_level,
    entity_id,
    period_type,
    period_start,
    period_end,
    
    -- Nutrition Quality
    overall_nutrition_score,
    diet_variety_score,
    processed_food_score,
    
    -- Target Achievement
    calories_target_achievement_rate,
    protein_target_achievement_rate,
    fiber_target_achievement_rate,
    
    -- Behavioral Metrics
    meal_logging_consistency,
    water_intake_consistency,
    
    -- Trends
    calorie_trend,
    nutrition_score_trend,
    
    -- Data Quality
    data_completeness_score,
    sample_size

FROM public.nutrition_analytics
WHERE period_start >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY period_start DESC;

-- ============================================================================
-- ANALYTICS FUNCTIONS
-- ============================================================================

-- Function to calculate user engagement score
CREATE OR REPLACE FUNCTION public.calculate_user_engagement_score(
    p_user_id UUID,
    p_date DATE DEFAULT CURRENT_DATE
)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    engagement_data RECORD;
    score DECIMAL(5,2) DEFAULT 0;
BEGIN
    -- Get user engagement metrics for the date
    SELECT * INTO engagement_data
    FROM public.user_engagement_metrics
    WHERE user_id = p_user_id AND date = p_date;
    
    IF engagement_data IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Calculate composite engagement score (0-100)
    score := LEAST(100, 
        (engagement_data.sessions_count * 10) + -- 10 points per session
        (engagement_data.meals_logged * 15) + -- 15 points per meal logged
        (engagement_data.recipes_viewed * 2) + -- 2 points per recipe viewed
        (engagement_data.recipes_saved * 5) + -- 5 points per recipe saved
        (engagement_data.recipes_cooked * 20) + -- 20 points per recipe cooked
        (engagement_data.recipes_shared * 10) + -- 10 points per recipe shared
        (engagement_data.comments_made * 5) + -- 5 points per comment
        (engagement_data.goals_achieved * 25) -- 25 points per goal achieved
    );
    
    RETURN score;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate content virality score
CREATE OR REPLACE FUNCTION public.calculate_content_virality_score(
    p_content_type TEXT,
    p_content_id UUID,
    p_date DATE DEFAULT CURRENT_DATE
)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    perf_data RECORD;
    score DECIMAL(5,2) DEFAULT 0;
    benchmark_views INTEGER DEFAULT 100;
    benchmark_shares INTEGER DEFAULT 10;
BEGIN
    -- Get content performance metrics
    SELECT * INTO perf_data
    FROM public.content_performance_metrics
    WHERE content_type = p_content_type 
    AND content_id = p_content_id 
    AND date = p_date;
    
    IF perf_data IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Calculate virality score based on shares, saves, and engagement
    score := LEAST(100,
        (perf_data.shares_count::DECIMAL / benchmark_shares * 30) + -- 30 points max for shares
        (perf_data.saves_count::DECIMAL / benchmark_views * 25) + -- 25 points max for saves
        (perf_data.views_count::DECIMAL / benchmark_views * 20) + -- 20 points max for views
        (perf_data.comments_count * 2.5) + -- 2.5 points per comment
        (COALESCE(perf_data.average_rating, 0) * 5) -- 5 points per rating point
    );
    
    RETURN score;
END;
$$ LANGUAGE plpgsql;

-- Function to aggregate daily metrics
CREATE OR REPLACE FUNCTION public.aggregate_daily_metrics(
    p_date DATE DEFAULT CURRENT_DATE
)
RETURNS VOID AS $$
BEGIN
    -- Aggregate user engagement metrics
    INSERT INTO public.user_engagement_metrics (
        user_id, date, week_start_date, month_start_date,
        sessions_count, total_session_duration_minutes, pages_viewed, actions_performed,
        recipes_viewed, recipes_saved, recipes_cooked, meals_logged,
        engagement_score
    )
    SELECT 
        ual.user_id,
        p_date,
        DATE_TRUNC('week', p_date)::DATE,
        DATE_TRUNC('month', p_date)::DATE,
        COUNT(*) FILTER (WHERE ual.activity_type = 'login') as sessions_count,
        COALESCE(SUM(ual.activity_duration_seconds) / 60, 0) as total_session_duration_minutes,
        COUNT(*) FILTER (WHERE ual.activity_type LIKE '%_view') as pages_viewed,
        COUNT(*) as actions_performed,
        COUNT(*) FILTER (WHERE ual.activity_type = 'recipe_view') as recipes_viewed,
        COUNT(*) FILTER (WHERE ual.activity_type = 'recipe_save') as recipes_saved,
        COUNT(*) FILTER (WHERE ual.activity_type = 'recipe_cook') as recipes_cooked,
        COUNT(*) FILTER (WHERE ual.activity_type = 'meal_log') as meals_logged,
        0 -- Will be calculated separately
    FROM public.user_activity_logs ual
    WHERE DATE(ual.timestamp) = p_date
    GROUP BY ual.user_id
    ON CONFLICT (user_id, date) DO UPDATE SET
        sessions_count = EXCLUDED.sessions_count,
        total_session_duration_minutes = EXCLUDED.total_session_duration_minutes,
        pages_viewed = EXCLUDED.pages_viewed,
        actions_performed = EXCLUDED.actions_performed,
        recipes_viewed = EXCLUDED.recipes_viewed,
        recipes_saved = EXCLUDED.recipes_saved,
        recipes_cooked = EXCLUDED.recipes_cooked,
        meals_logged = EXCLUDED.meals_logged;
    
    -- Update engagement scores
    UPDATE public.user_engagement_metrics
    SET engagement_score = public.calculate_user_engagement_score(user_id, date)
    WHERE date = p_date;
    
    -- Aggregate content performance metrics
    INSERT INTO public.content_performance_metrics (
        content_type, content_id, content_title, creator_user_id, date,
        views_count, saves_count, times_cooked
    )
    SELECT 
        'recipe' as content_type,
        r.id as content_id,
        r.name as content_title,
        r.author_id as creator_user_id,
        p_date,
        COUNT(*) FILTER (WHERE ual.activity_type = 'recipe_view') as views_count,
        COUNT(*) FILTER (WHERE ual.activity_type = 'recipe_save') as saves_count,
        COUNT(*) FILTER (WHERE ual.activity_type = 'recipe_cook') as times_cooked
    FROM public.recipes r
    LEFT JOIN public.user_activity_logs ual ON (ual.activity_details->>'recipe_id')::UUID = r.id
        AND DATE(ual.timestamp) = p_date
        AND ual.activity_type IN ('recipe_view', 'recipe_save', 'recipe_cook')
    WHERE r.status = 'active'
    GROUP BY r.id, r.name, r.author_id
    HAVING COUNT(*) FILTER (WHERE ual.activity_type IN ('recipe_view', 'recipe_save', 'recipe_cook')) > 0
    ON CONFLICT (content_type, content_id, date) DO UPDATE SET
        views_count = EXCLUDED.views_count,
        saves_count = EXCLUDED.saves_count,
        times_cooked = EXCLUDED.times_cooked;
    
    -- Update virality scores
    UPDATE public.content_performance_metrics
    SET virality_score = public.calculate_content_virality_score(content_type, content_id, date)
    WHERE date = p_date;
    
    RAISE NOTICE 'Daily metrics aggregation completed for %', p_date;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- AUTOMATED ANALYTICS JOBS
-- ============================================================================

-- Function to run weekly analytics aggregation
CREATE OR REPLACE FUNCTION public.aggregate_weekly_metrics()
RETURNS VOID AS $$
DECLARE
    week_start DATE;
    week_end DATE;
BEGIN
    -- Calculate last complete week
    week_start := DATE_TRUNC('week', CURRENT_DATE - INTERVAL '7 days')::DATE;
    week_end := week_start + INTERVAL '6 days';
    
    -- Aggregate nutrition analytics for users
    INSERT INTO public.nutrition_analytics (
        aggregation_level, entity_id, period_type, period_start, period_end,
        avg_daily_calories, avg_daily_protein_g, avg_daily_carbs_g, avg_daily_fat_g,
        overall_nutrition_score, meal_logging_consistency
    )
    SELECT 
        'user' as aggregation_level,
        dns.user_id as entity_id,
        'weekly' as period_type,
        week_start,
        week_end,
        AVG(dns.total_calories) as avg_daily_calories,
        AVG(dns.total_protein_g) as avg_daily_protein_g,
        AVG(dns.total_carbs_g) as avg_daily_carbs_g,
        AVG(dns.total_fat_g) as avg_daily_fat_g,
        AVG(dns.nutrition_score) as overall_nutrition_score,
        (COUNT(*) * 100.0 / 7) as meal_logging_consistency
    FROM public.daily_nutrition_summaries dns
    WHERE dns.date BETWEEN week_start AND week_end
    AND dns.is_complete = true
    GROUP BY dns.user_id
    ON CONFLICT (aggregation_level, entity_id, period_type, period_start) DO UPDATE SET
        avg_daily_calories = EXCLUDED.avg_daily_calories,
        avg_daily_protein_g = EXCLUDED.avg_daily_protein_g,
        avg_daily_carbs_g = EXCLUDED.avg_daily_carbs_g,
        avg_daily_fat_g = EXCLUDED.avg_daily_fat_g,
        overall_nutrition_score = EXCLUDED.overall_nutrition_score,
        meal_logging_consistency = EXCLUDED.meal_logging_consistency;
    
    RAISE NOTICE 'Weekly analytics aggregation completed for week %', week_start;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- INDEXES FOR ANALYTICS PERFORMANCE
-- ============================================================================

CREATE INDEX idx_system_metrics_category_period ON public.system_metrics(metric_category, period_type, period_start);
CREATE INDEX idx_system_metrics_name_period ON public.system_metrics(metric_name, period_start);

CREATE INDEX idx_user_engagement_metrics_user_date ON public.user_engagement_metrics(user_id, date);
CREATE INDEX idx_user_engagement_metrics_date ON public.user_engagement_metrics(date);
CREATE INDEX idx_user_engagement_metrics_week ON public.user_engagement_metrics(week_start_date);
CREATE INDEX idx_user_engagement_metrics_engagement_score ON public.user_engagement_metrics(engagement_score);

CREATE INDEX idx_content_performance_metrics_content ON public.content_performance_metrics(content_type, content_id);
CREATE INDEX idx_content_performance_metrics_date ON public.content_performance_metrics(date);
CREATE INDEX idx_content_performance_metrics_creator ON public.content_performance_metrics(creator_user_id);
CREATE INDEX idx_content_performance_metrics_trending ON public.content_performance_metrics(trending_score);

CREATE INDEX idx_nutrition_analytics_entity ON public.nutrition_analytics(aggregation_level, entity_id);
CREATE INDEX idx_nutrition_analytics_period ON public.nutrition_analytics(period_type, period_start);

CREATE INDEX idx_recipe_analytics_date ON public.recipe_analytics(date);
CREATE INDEX idx_social_analytics_date ON public.social_analytics(date);

-- ============================================================================
-- ENABLE RLS ON ANALYTICS TABLES
-- ============================================================================

ALTER TABLE public.system_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_engagement_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_analytics ENABLE ROW LEVEL SECURITY;

-- Analytics access policies
CREATE POLICY "Admins can view system metrics" ON public.system_metrics
    FOR SELECT USING (auth.jwt() ->> 'role' IN ('admin', 'service_role'));

CREATE POLICY "Users can view their own engagement metrics" ON public.user_engagement_metrics
    FOR SELECT USING (auth.uid() = user_id OR auth.jwt() ->> 'role' IN ('admin', 'service_role'));

CREATE POLICY "Content creators can view their content performance" ON public.content_performance_metrics
    FOR SELECT USING (
        auth.uid() = creator_user_id OR 
        auth.jwt() ->> 'role' IN ('admin', 'service_role')
    );

CREATE POLICY "Users can view their nutrition analytics" ON public.nutrition_analytics
    FOR SELECT USING (
        (aggregation_level = 'user' AND auth.uid() = entity_id) OR
        (aggregation_level = 'circle' AND EXISTS (
            SELECT 1 FROM public.circle_memberships cm 
            WHERE cm.circle_id = entity_id AND cm.user_id = auth.uid() AND cm.status = 'active'
        )) OR
        (aggregation_level = 'global') OR
        auth.jwt() ->> 'role' IN ('admin', 'service_role')
    );

-- Public analytics are viewable by all authenticated users
CREATE POLICY "Recipe analytics are viewable by authenticated users" ON public.recipe_analytics
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Social analytics are viewable by authenticated users" ON public.social_analytics
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Service role can manage all analytics
CREATE POLICY "Service role can manage analytics" ON public.system_metrics
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage user engagement metrics" ON public.user_engagement_metrics
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage content performance metrics" ON public.content_performance_metrics
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage nutrition analytics" ON public.nutrition_analytics
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage recipe analytics" ON public.recipe_analytics
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage social analytics" ON public.social_analytics
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT SELECT ON public.user_activity_dashboard TO authenticated;
GRANT SELECT ON public.popular_content_dashboard TO authenticated;
GRANT SELECT ON public.nutrition_insights_dashboard TO authenticated;

GRANT EXECUTE ON FUNCTION public.calculate_user_engagement_score(UUID, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_content_virality_score(TEXT, UUID, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.aggregate_daily_metrics(DATE) TO service_role;
GRANT EXECUTE ON FUNCTION public.aggregate_weekly_metrics() TO service_role;