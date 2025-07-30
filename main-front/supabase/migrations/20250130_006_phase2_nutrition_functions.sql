-- Phase 2: Nutrition System Functions and Views
-- Migration: 20250130_006_phase2_nutrition_functions.sql

-- ============================================================================
-- NUTRITION CALCULATION FUNCTIONS
-- ============================================================================

-- Function to calculate nutrition for a given quantity of food
CREATE OR REPLACE FUNCTION public.calculate_food_nutrition(
    p_food_id UUID,
    p_quantity DECIMAL,
    p_unit TEXT DEFAULT 'g'
)
RETURNS JSONB AS $$
DECLARE
    food_record RECORD;
    serving_size_g DECIMAL;
    nutrition_data JSONB;
    multiplier DECIMAL;
BEGIN
    -- Get food information
    SELECT * INTO food_record FROM public.foods WHERE id = p_food_id;
    
    IF food_record IS NULL THEN
        RAISE EXCEPTION 'Food not found: %', p_food_id;
    END IF;
    
    -- Convert quantity to grams
    IF p_unit = 'g' THEN
        serving_size_g := p_quantity;
    ELSE
        -- Look up serving size conversion
        SELECT serving_size_g INTO serving_size_g
        FROM public.food_serving_sizes
        WHERE food_id = p_food_id AND serving_name = p_unit;
        
        IF serving_size_g IS NULL THEN
            RAISE EXCEPTION 'Unknown serving size unit: % for food %', p_unit, food_record.name;
        END IF;
        
        serving_size_g := serving_size_g * p_quantity;
    END IF;
    
    -- Calculate multiplier (nutrition is per 100g)
    multiplier := serving_size_g / 100.0;
    
    -- Build nutrition data
    nutrition_data := jsonb_build_object(
        'food_id', p_food_id,
        'food_name', food_record.name,
        'quantity', p_quantity,
        'unit', p_unit,
        'weight_g', serving_size_g,
        'calories', ROUND((food_record.calories_per_100g * multiplier)::NUMERIC, 2),
        'protein_g', ROUND((food_record.protein_g_per_100g * multiplier)::NUMERIC, 2),
        'total_fat_g', ROUND((food_record.total_fat_g_per_100g * multiplier)::NUMERIC, 2),
        'saturated_fat_g', ROUND((food_record.saturated_fat_g_per_100g * multiplier)::NUMERIC, 2),
        'trans_fat_g', ROUND((food_record.trans_fat_g_per_100g * multiplier)::NUMERIC, 2),
        'cholesterol_mg', ROUND((food_record.cholesterol_mg_per_100g * multiplier)::NUMERIC, 2),
        'carbs_total_g', ROUND((food_record.carbs_total_g_per_100g * multiplier)::NUMERIC, 2),
        'fiber_g', ROUND((food_record.fiber_g_per_100g * multiplier)::NUMERIC, 2),
        'sugar_total_g', ROUND((food_record.sugar_total_g_per_100g * multiplier)::NUMERIC, 2),
        'sodium_mg', ROUND((food_record.sodium_mg_per_100g * multiplier)::NUMERIC, 2),
        'potassium_mg', ROUND((food_record.potassium_mg_per_100g * multiplier)::NUMERIC, 2)
    );
    
    -- Add micronutrients
    IF food_record.micronutrients_per_100g IS NOT NULL THEN
        SELECT jsonb_object_agg(key, ROUND((value::NUMERIC * multiplier)::NUMERIC, 4))
        INTO nutrition_data
        FROM jsonb_each_text(food_record.micronutrients_per_100g);
        
        nutrition_data := nutrition_data || jsonb_build_object('micronutrients', nutrition_data);
    END IF;
    
    RETURN nutrition_data;
END;
$$ LANGUAGE plpgsql;

-- Function to log a meal with automatic nutrition calculation
CREATE OR REPLACE FUNCTION public.log_meal(
    p_meal_type TEXT,
    p_meal_time TIMESTAMPTZ,
    p_food_items JSONB, -- Array of {food_id, quantity, unit, preparation_method}
    p_meal_name TEXT DEFAULT NULL,
    p_location TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    meal_log_id UUID;
    food_item JSONB;
    nutrition_data JSONB;
    total_calories DECIMAL DEFAULT 0;
    total_protein DECIMAL DEFAULT 0;
    total_carbs DECIMAL DEFAULT 0;
    total_fat DECIMAL DEFAULT 0;
    total_fiber DECIMAL DEFAULT 0;
    total_sodium DECIMAL DEFAULT 0;
BEGIN
    -- Insert meal log
    INSERT INTO public.meal_logs (
        user_id, meal_type, meal_time, meal_name, location, notes
    )
    VALUES (
        auth.uid(), p_meal_type, p_meal_time, p_meal_name, p_location, p_notes
    )
    RETURNING id INTO meal_log_id;
    
    -- Process each food item
    FOR food_item IN SELECT * FROM jsonb_array_elements(p_food_items)
    LOOP
        -- Calculate nutrition for this food item
        nutrition_data := public.calculate_food_nutrition(
            (food_item->>'food_id')::UUID,
            (food_item->>'quantity')::DECIMAL,
            COALESCE(food_item->>'unit', 'g')
        );
        
        -- Insert food item
        INSERT INTO public.meal_food_items (
            meal_log_id, food_id, quantity, unit, weight_g,
            preparation_method, calories, protein_g, carbs_g, 
            fat_g, fiber_g, sodium_mg, micronutrients
        )
        VALUES (
            meal_log_id,
            (food_item->>'food_id')::UUID,
            (food_item->>'quantity')::DECIMAL,
            COALESCE(food_item->>'unit', 'g'),
            (nutrition_data->>'weight_g')::DECIMAL,
            food_item->>'preparation_method',
            (nutrition_data->>'calories')::DECIMAL,
            (nutrition_data->>'protein_g')::DECIMAL,
            (nutrition_data->>'carbs_total_g')::DECIMAL,
            (nutrition_data->>'total_fat_g')::DECIMAL,
            (nutrition_data->>'fiber_g')::DECIMAL,
            (nutrition_data->>'sodium_mg')::DECIMAL,
            nutrition_data->'micronutrients'
        );
        
        -- Add to totals
        total_calories := total_calories + (nutrition_data->>'calories')::DECIMAL;
        total_protein := total_protein + (nutrition_data->>'protein_g')::DECIMAL;
        total_carbs := total_carbs + (nutrition_data->>'carbs_total_g')::DECIMAL;
        total_fat := total_fat + (nutrition_data->>'total_fat_g')::DECIMAL;
        total_fiber := total_fiber + (nutrition_data->>'fiber_g')::DECIMAL;
        total_sodium := total_sodium + (nutrition_data->>'sodium_mg')::DECIMAL;
    END LOOP;
    
    -- Update meal totals
    UPDATE public.meal_logs
    SET 
        total_calories = total_calories,
        total_protein_g = total_protein,
        total_carbs_g = total_carbs,
        total_fat_g = total_fat,
        total_fiber_g = total_fiber,
        total_sodium_mg = total_sodium
    WHERE id = meal_log_id;
    
    -- Log activity
    PERFORM public.log_user_activity(
        'meal_log',
        jsonb_build_object(
            'meal_id', meal_log_id,
            'meal_type', p_meal_type,
            'calories', total_calories,
            'food_count', jsonb_array_length(p_food_items)
        )
    );
    
    RETURN meal_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log water intake
CREATE OR REPLACE FUNCTION public.log_water_intake(
    p_amount_ml INTEGER,
    p_beverage_type TEXT DEFAULT 'water',
    p_consumed_at TIMESTAMPTZ DEFAULT NOW(),
    p_activity_context TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    intake_id UUID;
    summary_date DATE;
BEGIN
    summary_date := DATE(p_consumed_at);
    
    -- Ensure daily summary exists
    INSERT INTO public.daily_nutrition_summaries (user_id, date)
    VALUES (auth.uid(), summary_date)
    ON CONFLICT (user_id, date) DO NOTHING;
    
    -- Insert water intake
    INSERT INTO public.water_intake_logs (
        user_id, amount_ml, beverage_type, consumed_at, activity_context,
        daily_summary_id
    )
    VALUES (
        auth.uid(), p_amount_ml, p_beverage_type, p_consumed_at, p_activity_context,
        (SELECT id FROM public.daily_nutrition_summaries 
         WHERE user_id = auth.uid() AND date = summary_date)
    )
    RETURNING id INTO intake_id;
    
    -- Update daily water total
    UPDATE public.daily_nutrition_summaries
    SET 
        water_ml = (
            SELECT SUM(amount_ml)
            FROM public.water_intake_logs
            WHERE daily_summary_id = daily_nutrition_summaries.id
        ),
        updated_at = NOW()
    WHERE user_id = auth.uid() AND date = summary_date;
    
    RETURN intake_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get nutrition targets for a user
CREATE OR REPLACE FUNCTION public.get_user_nutrition_targets(p_user_id UUID DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
    target_user_id UUID;
    health_profile RECORD;
    targets JSONB;
BEGIN
    target_user_id := COALESCE(p_user_id, auth.uid());
    
    -- Get active health profile
    SELECT * INTO health_profile
    FROM public.user_health_profiles
    WHERE user_id = target_user_id AND is_active = true
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF health_profile IS NULL THEN
        -- Return default targets if no health profile
        RETURN jsonb_build_object(
            'calories', 2000,
            'protein_g', 150,
            'carbs_g', 250,
            'fat_g', 67,
            'fiber_g', 25,
            'sodium_mg', 2300,
            'micronutrients', '{
                "vitamin_a_mcg": 900, "vitamin_c_mg": 90, "vitamin_d_mcg": 20,
                "vitamin_e_mg": 15, "vitamin_k_mcg": 120, "thiamine_mg": 1.2,
                "riboflavin_mg": 1.3, "niacin_mg": 16, "vitamin_b6_mg": 1.7,
                "folate_mcg": 400, "vitamin_b12_mcg": 2.4, "calcium_mg": 1000,
                "iron_mg": 8, "magnesium_mg": 400, "phosphorus_mg": 700,
                "potassium_mg": 4700, "zinc_mg": 11
            }'::JSONB
        );
    END IF;
    
    -- Build targets from health profile
    targets := jsonb_build_object(
        'calories', COALESCE(health_profile.target_calories, health_profile.tdee_calories, 2000),
        'protein_g', COALESCE(health_profile.target_protein_g, 150),
        'carbs_g', COALESCE(health_profile.target_carbs_g, 250),
        'fat_g', COALESCE(health_profile.target_fat_g, 67),
        'fiber_g', COALESCE(health_profile.target_fiber_g, 25),
        'sodium_mg', COALESCE(health_profile.target_sodium_mg, 2300),
        'micronutrients', COALESCE(health_profile.micronutrient_targets, '{}'::JSONB)
    );
    
    RETURN targets;
END;
$$ LANGUAGE plpgsql;

-- Function to analyze nutrition for a specific date
CREATE OR REPLACE FUNCTION public.analyze_daily_nutrition(
    p_user_id UUID,
    p_date DATE
)
RETURNS JSONB AS $$
DECLARE
    daily_summary RECORD;
    targets JSONB;
    analysis JSONB;
    target_met_count INTEGER DEFAULT 0;
    total_targets INTEGER DEFAULT 0;
BEGIN
    -- Get daily summary
    SELECT * INTO daily_summary
    FROM public.daily_nutrition_summaries
    WHERE user_id = p_user_id AND date = p_date;
    
    IF daily_summary IS NULL THEN
        RETURN jsonb_build_object('error', 'No nutrition data found for this date');
    END IF;
    
    -- Get user targets
    targets := public.get_user_nutrition_targets(p_user_id);
    
    -- Analyze macronutrient targets
    analysis := jsonb_build_object(
        'date', p_date,
        'totals', jsonb_build_object(
            'calories', daily_summary.total_calories,
            'protein_g', daily_summary.total_protein_g,
            'carbs_g', daily_summary.total_carbs_g,
            'fat_g', daily_summary.total_fat_g,
            'fiber_g', daily_summary.total_fiber_g,
            'sodium_mg', daily_summary.total_sodium_mg,
            'water_ml', daily_summary.water_ml
        ),
        'targets', targets,
        'percentages', jsonb_build_object(
            'calories', ROUND((daily_summary.total_calories / (targets->>'calories')::DECIMAL * 100)::NUMERIC, 1),
            'protein_g', ROUND((daily_summary.total_protein_g / (targets->>'protein_g')::DECIMAL * 100)::NUMERIC, 1),
            'carbs_g', ROUND((daily_summary.total_carbs_g / (targets->>'carbs_g')::DECIMAL * 100)::NUMERIC, 1),
            'fat_g', ROUND((daily_summary.total_fat_g / (targets->>'fat_g')::DECIMAL * 100)::NUMERIC, 1),
            'fiber_g', ROUND((daily_summary.total_fiber_g / (targets->>'fiber_g')::DECIMAL * 100)::NUMERIC, 1),
            'sodium_mg', ROUND((daily_summary.total_sodium_mg / (targets->>'sodium_mg')::DECIMAL * 100)::NUMERIC, 1)
        )
    );
    
    -- Check which targets were met (within 10% tolerance)
    IF daily_summary.total_calories BETWEEN (targets->>'calories')::DECIMAL * 0.9 AND (targets->>'calories')::DECIMAL * 1.1 THEN
        target_met_count := target_met_count + 1;
    END IF;
    total_targets := total_targets + 1;
    
    IF daily_summary.total_protein_g >= (targets->>'protein_g')::DECIMAL * 0.9 THEN
        target_met_count := target_met_count + 1;
    END IF;
    total_targets := total_targets + 1;
    
    IF daily_summary.total_fiber_g >= (targets->>'fiber_g')::DECIMAL * 0.9 THEN
        target_met_count := target_met_count + 1;
    END IF;
    total_targets := total_targets + 1;
    
    IF daily_summary.total_sodium_mg <= (targets->>'sodium_mg')::DECIMAL * 1.1 THEN
        target_met_count := target_met_count + 1;
    END IF;
    total_targets := total_targets + 1;
    
    -- Add target achievement summary
    analysis := analysis || jsonb_build_object(
        'targets_met', target_met_count,
        'total_targets', total_targets,
        'target_achievement_percentage', ROUND((target_met_count::DECIMAL / total_targets * 100)::NUMERIC, 1)
    );
    
    RETURN analysis;
END;
$$ LANGUAGE plpgsql;

-- Function to detect nutrient deficiencies
CREATE OR REPLACE FUNCTION public.detect_nutrient_deficiencies(
    p_user_id UUID,
    p_days_to_analyze INTEGER DEFAULT 7
)
RETURNS TABLE(
    nutrient_name TEXT,
    avg_daily_intake DECIMAL,
    recommended_intake DECIMAL,
    percentage_of_rdi DECIMAL,
    deficiency_level TEXT,
    consecutive_days INTEGER
) AS $$
DECLARE
    analysis_start_date DATE;
    targets JSONB;
    micronutrient_targets JSONB;
BEGIN
    analysis_start_date := CURRENT_DATE - INTERVAL '1 day' * p_days_to_analyze;
    targets := public.get_user_nutrition_targets(p_user_id);
    micronutrient_targets := targets->'micronutrients';
    
    -- Analyze macronutrients
    RETURN QUERY
    WITH daily_averages AS (
        SELECT 
            AVG(total_protein_g) as avg_protein,
            AVG(total_fiber_g) as avg_fiber,
            AVG(total_sodium_mg) as avg_sodium
        FROM public.daily_nutrition_summaries
        WHERE user_id = p_user_id 
        AND date >= analysis_start_date
        AND is_complete = true
    ),
    deficiency_analysis AS (
        SELECT 'protein' as nutrient, avg_protein as avg_intake, 
               (targets->>'protein_g')::DECIMAL as target,
               CASE 
                   WHEN avg_protein < (targets->>'protein_g')::DECIMAL * 0.6 THEN 'severe'
                   WHEN avg_protein < (targets->>'protein_g')::DECIMAL * 0.8 THEN 'moderate'  
                   WHEN avg_protein < (targets->>'protein_g')::DECIMAL * 0.9 THEN 'mild'
                   ELSE 'adequate'
               END as def_level
        FROM daily_averages
        UNION ALL
        SELECT 'fiber' as nutrient, avg_fiber as avg_intake,
               (targets->>'fiber_g')::DECIMAL as target,
               CASE 
                   WHEN avg_fiber < (targets->>'fiber_g')::DECIMAL * 0.5 THEN 'severe'
                   WHEN avg_fiber < (targets->>'fiber_g')::DECIMAL * 0.7 THEN 'moderate'
                   WHEN avg_fiber < (targets->>'fiber_g')::DECIMAL * 0.9 THEN 'mild'
                   ELSE 'adequate'
               END as def_level
        FROM daily_averages
    )
    SELECT 
        da.nutrient::TEXT,
        ROUND(da.avg_intake, 2)::DECIMAL,
        da.target::DECIMAL,
        ROUND((da.avg_intake / da.target * 100), 1)::DECIMAL,
        da.def_level::TEXT,
        0::INTEGER -- TODO: Calculate consecutive days
    FROM deficiency_analysis da
    WHERE da.def_level != 'adequate';
    
    -- TODO: Add micronutrient analysis when we have sufficient data
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- NUTRITION VIEWS
-- ============================================================================

-- View for complete daily nutrition with targets
CREATE VIEW public.daily_nutrition_with_targets AS
SELECT 
    dns.*,
    targets.target_calories,
    targets.target_protein_g,
    targets.target_carbs_g,
    targets.target_fat_g,
    targets.target_fiber_g,
    targets.target_sodium_mg,
    
    -- Calculate percentages
    CASE WHEN targets.target_calories > 0 THEN
        ROUND((dns.total_calories / targets.target_calories * 100)::NUMERIC, 1)
    END as calories_percentage,
    
    CASE WHEN targets.target_protein_g > 0 THEN
        ROUND((dns.total_protein_g / targets.target_protein_g * 100)::NUMERIC, 1)
    END as protein_percentage,
    
    CASE WHEN targets.target_fiber_g > 0 THEN
        ROUND((dns.total_fiber_g / targets.target_fiber_g * 100)::NUMERIC, 1)
    END as fiber_percentage,
    
    -- Target achievement flags
    (dns.total_calories BETWEEN targets.target_calories * 0.9 AND targets.target_calories * 1.1) as calories_target_met,
    (dns.total_protein_g >= targets.target_protein_g * 0.9) as protein_target_met,
    (dns.total_fiber_g >= targets.target_fiber_g * 0.9) as fiber_target_met,
    (dns.total_sodium_mg <= targets.target_sodium_mg * 1.1) as sodium_target_met

FROM public.daily_nutrition_summaries dns
LEFT JOIN LATERAL (
    SELECT 
        (public.get_user_nutrition_targets(dns.user_id)->>'calories')::DECIMAL as target_calories,
        (public.get_user_nutrition_targets(dns.user_id)->>'protein_g')::DECIMAL as target_protein_g,
        (public.get_user_nutrition_targets(dns.user_id)->>'carbs_g')::DECIMAL as target_carbs_g,
        (public.get_user_nutrition_targets(dns.user_id)->>'fat_g')::DECIMAL as target_fat_g,
        (public.get_user_nutrition_targets(dns.user_id)->>'fiber_g')::DECIMAL as target_fiber_g,
        (public.get_user_nutrition_targets(dns.user_id)->>'sodium_mg')::DECIMAL as target_sodium_mg
) targets ON true;

-- View for meal analysis with nutrition breakdown
CREATE VIEW public.meal_analysis AS
SELECT 
    ml.id,
    ml.user_id,
    ml.meal_type,
    ml.meal_time,
    ml.meal_name,
    ml.total_calories,
    ml.total_protein_g,
    ml.total_carbs_g,
    ml.total_fat_g,
    ml.total_fiber_g,
    ml.satisfaction_rating,
    
    -- Food item count and details
    COUNT(mfi.id) as food_item_count,
    STRING_AGG(f.name, ', ' ORDER BY mfi.calories DESC) as food_items,
    
    -- Meal composition percentages
    CASE WHEN ml.total_calories > 0 THEN
        ROUND((ml.total_protein_g * 4 / ml.total_calories * 100)::NUMERIC, 1)
    END as protein_percentage,
    
    CASE WHEN ml.total_calories > 0 THEN
        ROUND((ml.total_carbs_g * 4 / ml.total_calories * 100)::NUMERIC, 1)
    END as carbs_percentage,
    
    CASE WHEN ml.total_calories > 0 THEN
        ROUND((ml.total_fat_g * 9 / ml.total_calories * 100)::NUMERIC, 1)
    END as fat_percentage

FROM public.meal_logs ml
LEFT JOIN public.meal_food_items mfi ON ml.id = mfi.meal_log_id
LEFT JOIN public.foods f ON mfi.food_id = f.id
GROUP BY ml.id, ml.user_id, ml.meal_type, ml.meal_time, ml.meal_name, 
         ml.total_calories, ml.total_protein_g, ml.total_carbs_g, 
         ml.total_fat_g, ml.total_fiber_g, ml.satisfaction_rating;

-- View for food popularity and ratings
CREATE VIEW public.food_popularity AS
SELECT 
    f.id,
    f.name,
    f.food_category,
    COUNT(mfi.id) as times_consumed,
    COUNT(DISTINCT mfi.meal_log_id) as unique_meals,
    COUNT(DISTINCT ml.user_id) as unique_users,
    AVG(ml.satisfaction_rating) as avg_satisfaction,
    SUM(mfi.calories) as total_calories_consumed,
    f.usage_count,
    
    -- Recent usage
    COUNT(mfi.id) FILTER (WHERE ml.meal_time >= NOW() - INTERVAL '30 days') as times_consumed_30d,
    COUNT(mfi.id) FILTER (WHERE ml.meal_time >= NOW() - INTERVAL '7 days') as times_consumed_7d

FROM public.foods f
LEFT JOIN public.meal_food_items mfi ON f.id = mfi.food_id
LEFT JOIN public.meal_logs ml ON mfi.meal_log_id = ml.id
GROUP BY f.id, f.name, f.food_category, f.usage_count;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permissions on nutrition functions
GRANT EXECUTE ON FUNCTION public.calculate_food_nutrition(UUID, DECIMAL, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_meal(TEXT, TIMESTAMPTZ, JSONB, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_water_intake(INTEGER, TEXT, TIMESTAMPTZ, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_nutrition_targets(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.analyze_daily_nutrition(UUID, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.detect_nutrient_deficiencies(UUID, INTEGER) TO authenticated;

-- Grant permissions on nutrition views
GRANT SELECT ON public.daily_nutrition_with_targets TO authenticated;
GRANT SELECT ON public.meal_analysis TO authenticated;
GRANT SELECT ON public.food_popularity TO authenticated;

-- Service role gets full access
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;