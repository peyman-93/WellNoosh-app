-- Phase 6: Smart Shopping & Inventory Management System
-- Migration: 20250130_010_phase6_shopping_inventory.sql

-- ============================================================================
-- INVENTORY TRACKING TABLES
-- ============================================================================

-- User pantry/inventory items
CREATE TABLE public.user_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    food_id UUID REFERENCES public.foods(id),
    
    -- Item Information
    item_name TEXT NOT NULL, -- Display name (may differ from food name)
    brand TEXT,
    variety TEXT, -- 'organic', 'low-sodium', etc.
    
    -- Quantity & Storage
    current_quantity DECIMAL(8,3) NOT NULL CHECK (current_quantity >= 0),
    unit TEXT NOT NULL,
    storage_location TEXT DEFAULT 'pantry' CHECK (storage_location IN (
        'pantry', 'refrigerator', 'freezer', 'counter', 'spice_rack', 'other'
    )),
    
    -- Expiration & Freshness
    purchase_date DATE,
    expiration_date DATE,
    best_by_date DATE,
    freshness_status TEXT DEFAULT 'fresh' CHECK (freshness_status IN (
        'fresh', 'good', 'use_soon', 'expired', 'spoiled'
    )),
    
    -- Cost Tracking
    purchase_price_usd DECIMAL(8,2),
    price_per_unit DECIMAL(8,3),
    total_cost_usd DECIMAL(8,2),
    
    -- Usage Tracking
    times_used INTEGER DEFAULT 0,
    last_used_date DATE,
    typical_usage_rate DECIMAL(6,3), -- Units consumed per day on average
    
    -- Inventory Management
    minimum_threshold DECIMAL(8,3), -- Alert when quantity falls below this
    preferred_stock_level DECIMAL(8,3), -- Ideal quantity to maintain
    auto_reorder_enabled BOOLEAN DEFAULT FALSE,
    
    -- Source & Purchase Info
    purchased_from TEXT, -- Store name
    purchase_method TEXT DEFAULT 'store' CHECK (purchase_method IN ('store', 'online', 'delivery', 'bulk', 'gift')),
    
    -- Item Properties
    is_staple BOOLEAN DEFAULT FALSE, -- Core pantry item that should always be available
    is_perishable BOOLEAN DEFAULT TRUE,
    estimated_shelf_life_days INTEGER,
    
    -- Notes & Tracking
    notes TEXT,
    tags TEXT[] DEFAULT '{}', -- User-defined tags for organization
    
    -- Status
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'used_up', 'expired', 'donated')),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory usage logs (track when items are consumed)
CREATE TABLE public.inventory_usage_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inventory_item_id UUID NOT NULL REFERENCES public.user_inventory(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    meal_log_id UUID REFERENCES public.meal_logs(id), -- Which meal used this item
    recipe_id UUID REFERENCES public.recipes(id), -- Which recipe used this item
    
    -- Usage Information
    quantity_used DECIMAL(8,3) NOT NULL,
    unit TEXT NOT NULL,
    usage_date TIMESTAMPTZ DEFAULT NOW(),
    
    -- Usage Context
    usage_type TEXT DEFAULT 'cooking' CHECK (usage_type IN ('cooking', 'snacking', 'testing', 'waste', 'donation', 'other')),
    usage_notes TEXT,
    
    -- Cost Allocation
    cost_of_usage DECIMAL(6,3), -- Cost of the quantity used
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expiration alerts and notifications
CREATE TABLE public.expiration_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    inventory_item_id UUID NOT NULL REFERENCES public.user_inventory(id) ON DELETE CASCADE,
    
    -- Alert Information
    alert_type TEXT NOT NULL CHECK (alert_type IN ('expiring_soon', 'expired', 'use_by_date', 'best_by_date')),
    alert_priority TEXT DEFAULT 'medium' CHECK (alert_priority IN ('low', 'medium', 'high', 'urgent')),
    
    -- Timing
    alert_date DATE NOT NULL,
    days_until_expiration INTEGER,
    
    -- Alert Status
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'dismissed')),
    resolved_at TIMESTAMPTZ,
    resolution_action TEXT, -- 'used', 'donated', 'discarded', 'extended'
    
    -- Recommendations
    suggested_recipes UUID[] DEFAULT '{}', -- Recipe IDs that use this ingredient
    suggested_actions TEXT[] DEFAULT '{}', -- 'cook_today', 'freeze', 'donate', etc.
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SHOPPING LISTS & MANAGEMENT
-- ============================================================================

-- Individual shopping lists
CREATE TABLE public.shopping_lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    meal_plan_id UUID REFERENCES public.user_meal_plans(id), -- Generated from meal plan
    circle_id UUID REFERENCES public.circles(id), -- Shared with circle
    
    -- List Information
    list_name TEXT NOT NULL,
    description TEXT,
    list_type TEXT DEFAULT 'personal' CHECK (list_type IN ('personal', 'meal_plan', 'circle_shared', 'bulk_shopping', 'emergency')),
    
    -- Shopping Details
    target_budget_usd DECIMAL(8,2),
    preferred_stores TEXT[] DEFAULT '{}',
    shopping_date DATE,
    shopping_time TIME,
    
    -- List Organization
    organize_by TEXT DEFAULT 'category' CHECK (organize_by IN ('category', 'store_layout', 'priority', 'recipe', 'custom')),
    store_layout_template TEXT, -- Predefined store layout for organization
    
    -- Smart Features
    auto_optimize_route BOOLEAN DEFAULT TRUE,
    price_comparison_enabled BOOLEAN DEFAULT TRUE,
    substitute_suggestions_enabled BOOLEAN DEFAULT TRUE,
    
    -- Status & Progress
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'shopping', 'completed', 'archived')),
    completion_percentage DECIMAL(5,2) DEFAULT 0,
    
    -- Cost Tracking
    estimated_total_cost DECIMAL(8,2) DEFAULT 0,
    actual_total_cost DECIMAL(8,2),
    budget_variance DECIMAL(8,2), -- Actual - Estimated
    
    -- Shopping Session
    shopping_started_at TIMESTAMPTZ,
    shopping_completed_at TIMESTAMPTZ,
    shopping_duration_minutes INTEGER,
    
    -- Sharing & Collaboration
    is_shared BOOLEAN DEFAULT FALSE,
    shared_with_users UUID[] DEFAULT '{}',
    allow_others_to_edit BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Items in shopping lists
CREATE TABLE public.shopping_list_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shopping_list_id UUID NOT NULL REFERENCES public.shopping_lists(id) ON DELETE CASCADE,
    food_id UUID REFERENCES public.foods(id),
    
    -- Item Information
    item_name TEXT NOT NULL,
    quantity DECIMAL(8,3) NOT NULL,
    unit TEXT NOT NULL,
    brand_preference TEXT,
    quality_preference TEXT, -- 'organic', 'premium', 'value', etc.
    
    -- Item Organization
    category TEXT, -- 'produce', 'dairy', 'meat', 'pantry', etc.
    store_section TEXT,
    aisle TEXT,
    display_order INTEGER DEFAULT 0,
    
    -- Priority & Necessity
    priority_level TEXT DEFAULT 'normal' CHECK (priority_level IN ('low', 'normal', 'high', 'essential')),
    is_essential BOOLEAN DEFAULT TRUE, -- Can this item be skipped if unavailable/expensive?
    
    -- Cost Information
    estimated_price_per_unit DECIMAL(8,3),
    estimated_total_cost DECIMAL(8,2),
    actual_price_per_unit DECIMAL(8,3),
    actual_total_cost DECIMAL(8,2),
    
    -- Purchase Information
    purchased BOOLEAN DEFAULT FALSE,
    purchased_at TIMESTAMPTZ,
    purchased_quantity DECIMAL(8,3), -- Actual quantity purchased (may differ from requested)
    purchased_from TEXT, -- Store where purchased
    
    -- Recipe/Meal Connection
    recipe_id UUID REFERENCES public.recipes(id), -- Which recipe needs this
    meal_plan_item_id UUID REFERENCES public.user_planned_meals(id), -- Which planned meal needs this
    inventory_restock BOOLEAN DEFAULT FALSE, -- Is this to restock inventory?
    
    -- Substitutions & Alternatives
    substitution_made BOOLEAN DEFAULT FALSE,
    actual_item_purchased TEXT, -- If substitution was made
    substitution_reason TEXT, -- 'unavailable', 'price', 'preference', etc.
    
    -- Smart Features
    price_alerts_enabled BOOLEAN DEFAULT FALSE,
    auto_substitute_enabled BOOLEAN DEFAULT TRUE,
    
    -- Notes
    notes TEXT,
    dietary_requirements TEXT, -- Special requirements for this item
    
    -- Status
    status TEXT DEFAULT 'needed' CHECK (status IN ('needed', 'found', 'purchased', 'unavailable', 'skipped', 'substituted')),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shopping list templates (reusable lists)
CREATE TABLE public.shopping_list_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Template Information
    template_name TEXT NOT NULL,
    description TEXT,
    template_category TEXT, -- 'weekly_staples', 'bulk_shopping', 'party_prep', etc.
    
    -- Template Settings
    estimated_budget_usd DECIMAL(8,2),
    frequency TEXT, -- 'weekly', 'monthly', 'as_needed'
    
    -- Usage Tracking
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMPTZ,
    
    -- Template Status
    is_active BOOLEAN DEFAULT TRUE,
    is_favorite BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Items in shopping list templates
CREATE TABLE public.shopping_list_template_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES public.shopping_list_templates(id) ON DELETE CASCADE,
    food_id UUID REFERENCES public.foods(id),
    
    -- Item Information
    item_name TEXT NOT NULL,
    typical_quantity DECIMAL(8,3) NOT NULL,
    unit TEXT NOT NULL,
    
    -- Template Properties
    is_essential BOOLEAN DEFAULT TRUE,
    frequency_modifier DECIMAL(3,2) DEFAULT 1.0, -- Adjust quantity based on usage patterns
    seasonal_modifier JSONB DEFAULT '{}', -- Seasonal adjustments
    
    -- Organization
    category TEXT,
    display_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PRICE TRACKING & OPTIMIZATION
-- ============================================================================

-- Store information and preferences
CREATE TABLE public.stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Store Information
    store_name TEXT NOT NULL,
    chain_name TEXT, -- Parent company/chain
    store_type TEXT CHECK (store_type IN ('grocery', 'warehouse', 'specialty', 'online', 'farmers_market', 'convenience')),
    
    -- Location
    address TEXT,
    city TEXT,
    state TEXT,
    country TEXT,
    postal_code TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Store Details
    phone TEXT,
    website TEXT,
    hours_of_operation JSONB DEFAULT '{}',
    
    -- Store Characteristics
    price_level TEXT DEFAULT 'medium' CHECK (price_level IN ('low', 'medium', 'high', 'premium')),
    quality_level TEXT DEFAULT 'good' CHECK (quality_level IN ('basic', 'good', 'premium', 'gourmet')),
    selection_variety TEXT DEFAULT 'standard' CHECK (selection_variety IN ('limited', 'standard', 'extensive', 'specialty')),
    
    -- Services
    services_offered TEXT[] DEFAULT '{}', -- 'delivery', 'pickup', 'organic', 'butcher', etc.
    accepts_coupons BOOLEAN DEFAULT TRUE,
    loyalty_program BOOLEAN DEFAULT FALSE,
    
    -- Ratings
    average_rating DECIMAL(3,2) DEFAULT 0,
    total_ratings INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User store preferences and experiences
CREATE TABLE public.user_store_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    
    -- Preference Information
    preference_score INTEGER CHECK (preference_score BETWEEN 1 AND 5), -- 1=dislike, 5=love
    visit_frequency TEXT, -- 'weekly', 'monthly', 'occasionally', 'never'
    
    -- Experience Tracking
    total_visits INTEGER DEFAULT 0,
    last_visit_date DATE,
    average_spending DECIMAL(8,2),
    
    -- Store-specific Preferences
    preferred_shopping_times TIME[],
    preferred_sections TEXT[] DEFAULT '{}',
    known_staff BOOLEAN DEFAULT FALSE,
    
    -- Convenience Factors
    travel_distance_km DECIMAL(6,2),
    travel_time_minutes INTEGER,
    parking_quality TEXT CHECK (parking_quality IN ('poor', 'fair', 'good', 'excellent')),
    
    -- Personal Ratings
    price_rating INTEGER CHECK (price_rating BETWEEN 1 AND 5),
    quality_rating INTEGER CHECK (quality_rating BETWEEN 1 AND 5),
    service_rating INTEGER CHECK (service_rating BETWEEN 1 AND 5),
    convenience_rating INTEGER CHECK (convenience_rating BETWEEN 1 AND 5),
    
    -- Notes
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, store_id)
);

-- Price tracking for items at different stores
CREATE TABLE public.item_prices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    food_id UUID NOT NULL REFERENCES public.foods(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    reported_by_user_id UUID REFERENCES public.users(id),
    
    -- Price Information
    price_per_unit DECIMAL(8,3) NOT NULL,
    unit TEXT NOT NULL,
    brand TEXT,
    size_description TEXT, -- '1 lb bag', '16 oz container', etc.
    
    -- Price Context
    price_type TEXT DEFAULT 'regular' CHECK (price_type IN ('regular', 'sale', 'clearance', 'promotion', 'member_price')),
    promotion_details TEXT,
    
    -- Quality & Characteristics
    quality_level TEXT CHECK (quality_level IN ('basic', 'standard', 'premium', 'organic', 'specialty')),
    
    -- Availability
    in_stock BOOLEAN DEFAULT TRUE,
    stock_level TEXT CHECK (stock_level IN ('abundant', 'moderate', 'low', 'out_of_stock')),
    
    -- Price Validity
    price_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expires_date DATE, -- When this price is no longer valid
    
    -- Verification
    is_verified BOOLEAN DEFAULT FALSE,
    verification_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Price alerts for users
CREATE TABLE public.price_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    food_id UUID NOT NULL REFERENCES public.foods(id) ON DELETE CASCADE,
    store_id UUID REFERENCES public.stores(id), -- NULL for any store
    
    -- Alert Criteria
    target_price DECIMAL(8,3) NOT NULL,
    price_unit TEXT NOT NULL,
    alert_type TEXT DEFAULT 'below' CHECK (alert_type IN ('below', 'above', 'change', 'available')),
    
    -- Alert Settings
    is_active BOOLEAN DEFAULT TRUE,
    notification_method TEXT[] DEFAULT '{"app"}', -- 'app', 'email', 'sms'
    
    -- Alert Tracking
    times_triggered INTEGER DEFAULT 0,
    last_triggered_at TIMESTAMPTZ,
    
    -- Expiration
    expires_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- WASTE TRACKING & REDUCTION
-- ============================================================================

-- Food waste tracking
CREATE TABLE public.food_waste_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    inventory_item_id UUID REFERENCES public.user_inventory(id),
    food_id UUID REFERENCES public.foods(id),
    
    -- Waste Information
    item_name TEXT NOT NULL,
    quantity_wasted DECIMAL(8,3) NOT NULL,
    unit TEXT NOT NULL,
    
    -- Waste Details
    waste_reason TEXT NOT NULL CHECK (waste_reason IN (
        'expired', 'spoiled', 'overcooked', 'burnt', 'too_much_prepared',
        'taste_dislike', 'dietary_change', 'forgot_about', 'other'
    )),
    waste_category TEXT CHECK (waste_category IN ('preventable', 'possibly_preventable', 'unavoidable')),
    
    -- Cost Impact
    estimated_cost_wasted DECIMAL(6,2),
    
    -- Context & Learning
    where_wasted TEXT, -- 'preparation', 'cooking', 'serving', 'storage'
    could_have_prevented BOOLEAN,
    prevention_strategy TEXT, -- What could have prevented this waste
    
    -- Disposal Method
    disposal_method TEXT CHECK (disposal_method IN ('trash', 'compost', 'garbage_disposal', 'donation', 'fed_to_pets')),
    
    -- Date & Timing
    waste_date DATE NOT NULL DEFAULT CURRENT_DATE,
    days_since_purchase INTEGER,
    
    -- Learning & Improvement
    lessons_learned TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Weekly waste analysis
CREATE TABLE public.weekly_waste_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Analysis Period
    week_start_date DATE NOT NULL,
    week_end_date DATE NOT NULL,
    
    -- Waste Metrics
    total_items_wasted INTEGER DEFAULT 0,
    total_cost_wasted DECIMAL(8,2) DEFAULT 0,
    total_weight_wasted_kg DECIMAL(6,2) DEFAULT 0,
    
    -- Waste Categories
    preventable_waste_cost DECIMAL(8,2) DEFAULT 0,
    possibly_preventable_waste_cost DECIMAL(8,2) DEFAULT 0,
    unavoidable_waste_cost DECIMAL(8,2) DEFAULT 0,
    
    -- Common Waste Reasons
    top_waste_reasons TEXT[] DEFAULT '{}',
    most_wasted_food_categories TEXT[] DEFAULT '{}',
    
    -- Trends
    waste_trend_vs_last_week DECIMAL(6,2), -- Percentage change
    cost_trend_vs_last_week DECIMAL(6,2),
    
    -- Improvement Opportunities
    improvement_suggestions TEXT[],
    potential_savings DECIMAL(6,2),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Inventory indexes
CREATE INDEX idx_user_inventory_user ON public.user_inventory(user_id);
CREATE INDEX idx_user_inventory_food ON public.user_inventory(food_id);
CREATE INDEX idx_user_inventory_location ON public.user_inventory(storage_location);
CREATE INDEX idx_user_inventory_expiration ON public.user_inventory(expiration_date, freshness_status);
CREATE INDEX idx_user_inventory_status ON public.user_inventory(status);
CREATE INDEX idx_user_inventory_staples ON public.user_inventory(user_id, is_staple);
CREATE INDEX idx_user_inventory_alerts ON public.user_inventory(user_id, current_quantity, minimum_threshold);

CREATE INDEX idx_inventory_usage_logs_item ON public.inventory_usage_logs(inventory_item_id);
CREATE INDEX idx_inventory_usage_logs_user ON public.inventory_usage_logs(user_id);
CREATE INDEX idx_inventory_usage_logs_date ON public.inventory_usage_logs(usage_date);
CREATE INDEX idx_inventory_usage_logs_meal ON public.inventory_usage_logs(meal_log_id);

CREATE INDEX idx_expiration_alerts_user ON public.expiration_alerts(user_id);
CREATE INDEX idx_expiration_alerts_item ON public.expiration_alerts(inventory_item_id);
CREATE INDEX idx_expiration_alerts_status ON public.expiration_alerts(status);
CREATE INDEX idx_expiration_alerts_date ON public.expiration_alerts(alert_date);

-- Shopping list indexes
CREATE INDEX idx_shopping_lists_user ON public.shopping_lists(user_id);
CREATE INDEX idx_shopping_lists_meal_plan ON public.shopping_lists(meal_plan_id);
CREATE INDEX idx_shopping_lists_circle ON public.shopping_lists(circle_id);
CREATE INDEX idx_shopping_lists_status ON public.shopping_lists(status);
CREATE INDEX idx_shopping_lists_date ON public.shopping_lists(shopping_date);

CREATE INDEX idx_shopping_list_items_list ON public.shopping_list_items(shopping_list_id);
CREATE INDEX idx_shopping_list_items_food ON public.shopping_list_items(food_id);
CREATE INDEX idx_shopping_list_items_recipe ON public.shopping_list_items(recipe_id);
CREATE INDEX idx_shopping_list_items_status ON public.shopping_list_items(status);
CREATE INDEX idx_shopping_list_items_purchased ON public.shopping_list_items(purchased);

CREATE INDEX idx_shopping_list_templates_user ON public.shopping_list_templates(user_id);
CREATE INDEX idx_shopping_list_templates_category ON public.shopping_list_templates(template_category);
CREATE INDEX idx_shopping_list_templates_active ON public.shopping_list_templates(is_active);

CREATE INDEX idx_shopping_list_template_items_template ON public.shopping_list_template_items(template_id);
CREATE INDEX idx_shopping_list_template_items_food ON public.shopping_list_template_items(food_id);

-- Store and price indexes
CREATE INDEX idx_stores_location ON public.stores(city, state, country);
CREATE INDEX idx_stores_type ON public.stores(store_type);
CREATE INDEX idx_stores_chain ON public.stores(chain_name);
CREATE INDEX idx_stores_price_level ON public.stores(price_level);

CREATE INDEX idx_user_store_preferences_user ON public.user_store_preferences(user_id);
CREATE INDEX idx_user_store_preferences_store ON public.user_store_preferences(store_id);
CREATE INDEX idx_user_store_preferences_preference ON public.user_store_preferences(preference_score);

CREATE INDEX idx_item_prices_food ON public.item_prices(food_id);
CREATE INDEX idx_item_prices_store ON public.item_prices(store_id);
CREATE INDEX idx_item_prices_date ON public.item_prices(price_date);
CREATE INDEX idx_item_prices_verified ON public.item_prices(is_verified);
CREATE INDEX idx_item_prices_food_store ON public.item_prices(food_id, store_id);

CREATE INDEX idx_price_alerts_user ON public.price_alerts(user_id);
CREATE INDEX idx_price_alerts_food ON public.price_alerts(food_id);
CREATE INDEX idx_price_alerts_store ON public.price_alerts(store_id);
CREATE INDEX idx_price_alerts_active ON public.price_alerts(is_active);

-- Waste tracking indexes
CREATE INDEX idx_food_waste_logs_user ON public.food_waste_logs(user_id);
CREATE INDEX idx_food_waste_logs_inventory ON public.food_waste_logs(inventory_item_id);
CREATE INDEX idx_food_waste_logs_food ON public.food_waste_logs(food_id);
CREATE INDEX idx_food_waste_logs_date ON public.food_waste_logs(waste_date);
CREATE INDEX idx_food_waste_logs_reason ON public.food_waste_logs(waste_reason);

CREATE INDEX idx_weekly_waste_analysis_user ON public.weekly_waste_analysis(user_id);
CREATE INDEX idx_weekly_waste_analysis_week ON public.weekly_waste_analysis(week_start_date, week_end_date);

-- ============================================================================
-- TRIGGERS FOR INVENTORY AUTOMATION
-- ============================================================================

-- Update inventory quantity when usage is logged
CREATE OR REPLACE FUNCTION update_inventory_quantity()
RETURNS TRIGGER AS $$
BEGIN
    -- Decrease inventory quantity when usage is logged
    UPDATE public.user_inventory
    SET 
        current_quantity = current_quantity - NEW.quantity_used,
        times_used = times_used + 1,
        last_used_date = DATE(NEW.usage_date),
        updated_at = NOW()
    WHERE id = NEW.inventory_item_id;
    
    -- Check if quantity is now below minimum threshold
    IF EXISTS (
        SELECT 1 FROM public.user_inventory 
        WHERE id = NEW.inventory_item_id 
        AND current_quantity <= minimum_threshold
        AND minimum_threshold IS NOT NULL
    ) THEN
        -- Create low stock alert (this would trigger a notification system)
        INSERT INTO public.user_activity_logs (user_id, activity_type, activity_details)
        SELECT 
            user_id,
            'inventory_low',
            jsonb_build_object(
                'inventory_item_id', NEW.inventory_item_id,
                'item_name', item_name,
                'current_quantity', current_quantity,
                'minimum_threshold', minimum_threshold
            )
        FROM public.user_inventory
        WHERE id = NEW.inventory_item_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_inventory_quantity
    AFTER INSERT ON public.inventory_usage_logs
    FOR EACH ROW EXECUTE FUNCTION update_inventory_quantity();

-- Update shopping list completion percentage
CREATE OR REPLACE FUNCTION update_shopping_list_completion()
RETURNS TRIGGER AS $$
DECLARE
    list_id UUID;
    total_items INTEGER;
    completed_items INTEGER;
    completion_rate DECIMAL(5,2);
    total_cost DECIMAL(8,2);
BEGIN
    -- Get the list ID
    IF TG_OP = 'DELETE' THEN
        list_id := OLD.shopping_list_id;
    ELSE
        list_id := NEW.shopping_list_id;
    END IF;
    
    -- Calculate completion statistics
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE purchased = true),
        COALESCE(SUM(actual_total_cost), 0)
    INTO total_items, completed_items, total_cost
    FROM public.shopping_list_items
    WHERE shopping_list_id = list_id;
    
    -- Calculate completion percentage
    IF total_items > 0 THEN
        completion_rate := (completed_items * 100.0 / total_items);
    ELSE
        completion_rate := 0;
    END IF;
    
    -- Update shopping list
    UPDATE public.shopping_lists
    SET 
        completion_percentage = completion_rate,
        actual_total_cost = total_cost,
        budget_variance = total_cost - COALESCE(estimated_total_cost, 0),
        updated_at = NOW(),
        -- Update status if completed
        status = CASE 
            WHEN completion_rate = 100 AND status = 'shopping' THEN 'completed'
            WHEN completion_rate > 0 AND status = 'active' THEN 'shopping'
            ELSE status
        END,
        shopping_completed_at = CASE
            WHEN completion_rate = 100 AND shopping_completed_at IS NULL THEN NOW()
            ELSE shopping_completed_at
        END
    WHERE id = list_id;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_shopping_list_completion
    AFTER INSERT OR UPDATE OR DELETE ON public.shopping_list_items
    FOR EACH ROW EXECUTE FUNCTION update_shopping_list_completion();

-- Auto-create expiration alerts
CREATE OR REPLACE FUNCTION create_expiration_alerts()
RETURNS TRIGGER AS $$
DECLARE
    days_until_expiration INTEGER;
    alert_priority TEXT;
BEGIN
    -- Calculate days until expiration
    IF NEW.expiration_date IS NOT NULL THEN
        days_until_expiration := (NEW.expiration_date - CURRENT_DATE);
        
        -- Determine alert priority and timing
        IF days_until_expiration <= 1 THEN
            alert_priority := 'urgent';
        ELSIF days_until_expiration <= 3 THEN
            alert_priority := 'high';
        ELSIF days_until_expiration <= 7 THEN
            alert_priority := 'medium';
        ELSE
            alert_priority := 'low';
        END IF;
        
        -- Create alert if expiring soon
        IF days_until_expiration <= 7 AND days_until_expiration >= 0 THEN
            INSERT INTO public.expiration_alerts (
                user_id, inventory_item_id, alert_type, alert_priority,
                alert_date, days_until_expiration
            )
            VALUES (
                NEW.user_id, NEW.id, 
                CASE WHEN days_until_expiration <= 0 THEN 'expired' ELSE 'expiring_soon' END,
                alert_priority, CURRENT_DATE, days_until_expiration
            )
            ON CONFLICT DO NOTHING; -- Avoid duplicate alerts
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_expiration_alerts
    AFTER INSERT OR UPDATE ON public.user_inventory
    FOR EACH ROW EXECUTE FUNCTION create_expiration_alerts();