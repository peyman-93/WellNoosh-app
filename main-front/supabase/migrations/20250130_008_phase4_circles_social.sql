-- Phase 4: Circle (Social Group) Management System
-- Migration: 20250130_008_phase4_circles_social.sql

-- ============================================================================
-- CIRCLES CORE TABLES
-- ============================================================================

-- Main circles table (renamed from families to be more inclusive)
CREATE TABLE public.circles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Circle Information
    name TEXT NOT NULL,
    description TEXT,
    circle_type TEXT DEFAULT 'family' CHECK (circle_type IN (
        'family', 'friends', 'roommates', 'colleagues', 'community', 'club', 'other'
    )),
    
    -- Settings
    max_members INTEGER DEFAULT 20 CHECK (max_members BETWEEN 2 AND 100),
    is_public BOOLEAN DEFAULT FALSE, -- Can others find and request to join?
    requires_approval BOOLEAN DEFAULT TRUE, -- Do join requests need approval?
    
    -- Circle Preferences
    shared_dietary_restrictions TEXT[] DEFAULT '{}',
    shared_cuisine_preferences TEXT[] DEFAULT '{}',
    budget_range TEXT, -- 'low', 'medium', 'high'
    cooking_skill_range TEXT, -- 'beginner', 'mixed', 'advanced'
    
    -- Meal Sharing Settings
    meal_planning_enabled BOOLEAN DEFAULT TRUE,
    grocery_sharing_enabled BOOLEAN DEFAULT TRUE,
    recipe_sharing_enabled BOOLEAN DEFAULT TRUE,
    nutrition_sharing_enabled BOOLEAN DEFAULT FALSE,
    
    -- Privacy Settings
    activity_visibility TEXT DEFAULT 'circle_only' CHECK (activity_visibility IN (
        'circle_only', 'friends_of_members', 'public'
    )),
    
    -- Circle Status
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    
    -- Location (for local recommendations)
    city TEXT,
    country TEXT,
    timezone TEXT DEFAULT 'UTC',
    
    -- Visual
    avatar_url TEXT,
    cover_image_url TEXT,
    color_theme TEXT, -- Hex color for UI theming
    
    -- Statistics
    total_members INTEGER DEFAULT 0,
    total_meals_planned INTEGER DEFAULT 0,
    total_recipes_shared INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Circle memberships with roles and permissions
CREATE TABLE public.circle_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    circle_id UUID NOT NULL REFERENCES public.circles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Membership Information
    role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member', 'guest')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'banned')),
    
    -- Permissions
    can_plan_meals BOOLEAN DEFAULT TRUE,
    can_manage_grocery BOOLEAN DEFAULT TRUE,
    can_add_recipes BOOLEAN DEFAULT TRUE,
    can_invite_members BOOLEAN DEFAULT FALSE,
    can_moderate BOOLEAN DEFAULT FALSE,
    
    -- Member Preferences within Circle
    display_name TEXT, -- How they want to be known in this circle
    notification_preferences JSONB DEFAULT '{
        "meal_plans": true,
        "grocery_updates": true,
        "recipe_shares": true,
        "member_activity": true,
        "challenges": true
    }',
    
    -- Participation Stats
    meals_planned INTEGER DEFAULT 0,
    recipes_shared INTEGER DEFAULT 0,
    grocery_contributions INTEGER DEFAULT 0,
    last_active_at TIMESTAMPTZ,
    
    -- Joining Information
    invited_by_user_id UUID REFERENCES public.users(id),
    invitation_message TEXT,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(circle_id, user_id)
);

-- Circle invitations (for pending member requests)
CREATE TABLE public.circle_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    circle_id UUID NOT NULL REFERENCES public.circles(id) ON DELETE CASCADE,
    invited_by_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Invitation Information
    invitation_type TEXT NOT NULL CHECK (invitation_type IN ('email', 'user_id', 'link')),
    invited_email TEXT, -- For email invitations
    invited_user_id UUID REFERENCES public.users(id), -- For direct user invitations
    invitation_code TEXT UNIQUE, -- For link-based invitations
    
    -- Invitation Content
    personal_message TEXT,
    suggested_role TEXT DEFAULT 'member',
    
    -- Status & Timing
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'cancelled')),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
    responded_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SHARED MEAL PLANNING TABLES
-- ============================================================================

-- Circle meal plans (shared weekly/monthly meal planning)
CREATE TABLE public.circle_meal_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    circle_id UUID NOT NULL REFERENCES public.circles(id) ON DELETE CASCADE,
    created_by_user_id UUID NOT NULL REFERENCES public.users(id),
    
    -- Plan Information
    plan_name TEXT NOT NULL,
    description TEXT,
    plan_period TEXT DEFAULT 'week' CHECK (plan_period IN ('week', 'month', 'custom')),
    
    -- Time Period
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    
    -- Planning Settings
    target_budget_usd DECIMAL(8,2),
    dietary_constraints TEXT[] DEFAULT '{}',
    preferred_cuisines TEXT[] DEFAULT '{}',
    
    -- Plan Status
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'archived')),
    is_collaborative BOOLEAN DEFAULT TRUE, -- Can all members contribute?
    
    -- Approval & Consensus
    requires_consensus BOOLEAN DEFAULT FALSE,
    consensus_threshold DECIMAL(3,2) DEFAULT 0.5, -- Percentage needed for consensus
    
    -- Statistics
    total_meals INTEGER DEFAULT 0,
    total_estimated_cost DECIMAL(8,2) DEFAULT 0,
    member_votes INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual meals within circle meal plans
CREATE TABLE public.circle_planned_meals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meal_plan_id UUID NOT NULL REFERENCES public.circle_meal_plans(id) ON DELETE CASCADE,
    recipe_id UUID REFERENCES public.recipes(id),
    suggested_by_user_id UUID REFERENCES public.users(id),
    
    -- Meal Information
    meal_name TEXT NOT NULL,
    meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack', 'dessert')),
    planned_date DATE NOT NULL,
    planned_time TIME,
    
    -- Serving Information
    planned_servings INTEGER DEFAULT 4,
    serving_assignments JSONB DEFAULT '{}', -- Which members are eating this meal
    
    -- Cooking Assignment
    assigned_cook_user_id UUID REFERENCES public.users(id),
    cooking_method TEXT, -- 'individual', 'shared', 'takeout', 'meal_prep'
    prep_location TEXT, -- 'member_home', 'shared_kitchen', 'restaurant'
    
    -- Cost & Shopping
    estimated_cost_usd DECIMAL(6,2),
    ingredients_needed JSONB DEFAULT '[]',
    shopping_assigned_to UUID REFERENCES public.users(id),
    
    -- Consensus & Voting
    approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'needs_revision')),
    member_votes JSONB DEFAULT '{}', -- Member votes and preferences
    
    -- Execution Tracking
    preparation_status TEXT DEFAULT 'planned' CHECK (preparation_status IN ('planned', 'shopping', 'prepping', 'cooking', 'completed', 'cancelled')),
    actual_cost_usd DECIMAL(6,2),
    completion_rating INTEGER CHECK (completion_rating BETWEEN 1 AND 5),
    
    -- Notes
    notes TEXT,
    dietary_accommodations TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Member votes on planned meals
CREATE TABLE public.circle_meal_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    planned_meal_id UUID NOT NULL REFERENCES public.circle_planned_meals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Vote Information
    vote_type TEXT NOT NULL CHECK (vote_type IN ('approve', 'reject', 'suggest_change')),
    preference_score INTEGER CHECK (preference_score BETWEEN 1 AND 5), -- 1=dislike, 5=love
    
    -- Dietary & Preference Feedback
    can_eat BOOLEAN DEFAULT TRUE, -- Dietary restrictions
    wants_to_eat BOOLEAN DEFAULT TRUE, -- Personal preference
    will_participate BOOLEAN DEFAULT TRUE, -- Will join this meal
    
    -- Suggestions & Comments
    suggested_changes TEXT,
    alternative_suggestions TEXT,
    comments TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(planned_meal_id, user_id)
);

-- ============================================================================
-- SHARED GROCERY & SHOPPING TABLES
-- ============================================================================

-- Circle grocery lists (shared shopping lists)
CREATE TABLE public.circle_grocery_lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    circle_id UUID NOT NULL REFERENCES public.circles(id) ON DELETE CASCADE,
    meal_plan_id UUID REFERENCES public.circle_meal_plans(id), -- Optional: generated from meal plan
    created_by_user_id UUID NOT NULL REFERENCES public.users(id),
    
    -- List Information
    list_name TEXT NOT NULL,
    description TEXT,
    list_type TEXT DEFAULT 'collaborative' CHECK (list_type IN ('collaborative', 'assigned', 'individual')),
    
    -- Shopping Information
    target_budget_usd DECIMAL(8,2),
    preferred_stores TEXT[] DEFAULT '{}',
    shopping_date DATE,
    
    -- Assignment & Coordination
    primary_shopper_user_id UUID REFERENCES public.users(id),
    shopping_method TEXT DEFAULT 'single_trip' CHECK (shopping_method IN ('single_trip', 'multiple_trips', 'delivery', 'mixed')),
    
    -- Cost Sharing
    cost_sharing_method TEXT DEFAULT 'equal' CHECK (cost_sharing_method IN ('equal', 'proportional', 'assigned', 'individual')),
    
    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'shopping', 'completed', 'archived')),
    
    -- Totals
    total_items INTEGER DEFAULT 0,
    estimated_total_cost DECIMAL(8,2) DEFAULT 0,
    actual_total_cost DECIMAL(8,2),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Items in circle grocery lists
CREATE TABLE public.circle_grocery_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grocery_list_id UUID NOT NULL REFERENCES public.circle_grocery_lists(id) ON DELETE CASCADE,
    food_id UUID REFERENCES public.foods(id),
    requested_by_user_id UUID REFERENCES public.users(id),
    
    -- Item Information
    item_name TEXT NOT NULL,
    quantity DECIMAL(8,2) NOT NULL,
    unit TEXT NOT NULL,
    brand_preference TEXT,
    
    -- Cost Information
    estimated_cost_usd DECIMAL(6,2),
    actual_cost_usd DECIMAL(6,2),
    
    -- Assignment & Status
    assigned_to_user_id UUID REFERENCES public.users(id), -- Who will buy this
    status TEXT DEFAULT 'needed' CHECK (status IN ('needed', 'assigned', 'purchased', 'unavailable', 'cancelled')),
    
    -- Shopping Details
    store_section TEXT, -- 'produce', 'dairy', 'meat', etc.
    priority_level TEXT DEFAULT 'normal' CHECK (priority_level IN ('low', 'normal', 'high', 'urgent')),
    
    -- Meal Connection
    planned_meal_id UUID REFERENCES public.circle_planned_meals(id), -- Which meal this is for
    recipe_id UUID REFERENCES public.recipes(id), -- Which recipe needs this
    
    -- Flexibility
    substitution_ok BOOLEAN DEFAULT TRUE,
    notes TEXT,
    
    -- Purchase Tracking
    purchased_at TIMESTAMPTZ,
    purchased_by_user_id UUID REFERENCES public.users(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CIRCLE ACTIVITY & COMMUNICATION
-- ============================================================================

-- Circle activity feed
CREATE TABLE public.circle_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    circle_id UUID NOT NULL REFERENCES public.circles(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id), -- NULL for system activities
    
    -- Activity Information
    activity_type TEXT NOT NULL CHECK (activity_type IN (
        'member_joined', 'member_left', 'meal_planned', 'meal_completed',
        'recipe_shared', 'grocery_added', 'grocery_completed', 'vote_cast',
        'challenge_started', 'achievement_earned', 'milestone_reached'
    )),
    activity_title TEXT NOT NULL,
    activity_description TEXT,
    
    -- Activity Data
    activity_data JSONB DEFAULT '{}', -- Structured data about the activity
    related_id UUID, -- ID of related object (meal, recipe, etc.)
    related_type TEXT, -- Type of related object
    
    -- Visibility & Engagement
    visibility TEXT DEFAULT 'circle' CHECK (visibility IN ('circle', 'public', 'private')),
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    
    -- Media
    image_urls TEXT[] DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments on circle activities
CREATE TABLE public.circle_activity_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_id UUID NOT NULL REFERENCES public.circle_activities(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES public.circle_activity_comments(id), -- For nested comments
    
    -- Comment Information
    comment_text TEXT NOT NULL,
    
    -- Engagement
    likes_count INTEGER DEFAULT 0,
    
    -- Status
    is_edited BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Circle challenges and competitions
CREATE TABLE public.circle_challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    circle_id UUID NOT NULL REFERENCES public.circles(id) ON DELETE CASCADE,
    created_by_user_id UUID NOT NULL REFERENCES public.users(id),
    
    -- Challenge Information
    title TEXT NOT NULL,
    description TEXT,
    challenge_type TEXT NOT NULL CHECK (challenge_type IN (
        'cooking_streak', 'recipe_variety', 'healthy_eating', 'budget_saving',
        'waste_reduction', 'skill_building', 'seasonal_eating', 'custom'
    )),
    
    -- Challenge Parameters
    target_metric TEXT, -- What are we measuring?
    target_value DECIMAL(10,2), -- Target to achieve
    measurement_unit TEXT, -- Unit of measurement
    
    -- Timing
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    
    -- Participation
    participation_type TEXT DEFAULT 'opt_in' CHECK (participation_type IN ('automatic', 'opt_in', 'invitation_only')),
    max_participants INTEGER,
    
    -- Rewards & Recognition
    reward_type TEXT, -- 'badge', 'points', 'custom'
    reward_description TEXT,
    
    -- Status
    status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed', 'cancelled')),
    
    -- Statistics
    participant_count INTEGER DEFAULT 0,
    completion_rate DECIMAL(5,2),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Challenge participation tracking
CREATE TABLE public.circle_challenge_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    challenge_id UUID NOT NULL REFERENCES public.circle_challenges(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Participation Information
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    participation_status TEXT DEFAULT 'active' CHECK (participation_status IN ('active', 'completed', 'dropped_out')),
    
    -- Progress Tracking
    current_progress DECIMAL(10,2) DEFAULT 0,
    best_achievement DECIMAL(10,2) DEFAULT 0,
    progress_data JSONB DEFAULT '{}', -- Detailed progress tracking
    
    -- Results
    final_score DECIMAL(10,2),
    final_rank INTEGER,
    completed_at TIMESTAMPTZ,
    
    -- Rewards Earned
    rewards_earned TEXT[] DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(challenge_id, user_id)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Circles indexes
CREATE INDEX idx_circles_type ON public.circles(circle_type);
CREATE INDEX idx_circles_public ON public.circles(is_public, status);
CREATE INDEX idx_circles_location ON public.circles(city, country);

-- Circle memberships indexes
CREATE INDEX idx_circle_memberships_circle ON public.circle_memberships(circle_id);
CREATE INDEX idx_circle_memberships_user ON public.circle_memberships(user_id);
CREATE INDEX idx_circle_memberships_role ON public.circle_memberships(circle_id, role);
CREATE INDEX idx_circle_memberships_status ON public.circle_memberships(status);
CREATE INDEX idx_circle_memberships_active ON public.circle_memberships(circle_id, status, last_active_at);

-- Circle invitations indexes
CREATE INDEX idx_circle_invitations_circle ON public.circle_invitations(circle_id);
CREATE INDEX idx_circle_invitations_invited_by ON public.circle_invitations(invited_by_user_id);
CREATE INDEX idx_circle_invitations_invited_user ON public.circle_invitations(invited_user_id);
CREATE INDEX idx_circle_invitations_status ON public.circle_invitations(status);
CREATE INDEX idx_circle_invitations_code ON public.circle_invitations(invitation_code);
CREATE INDEX idx_circle_invitations_expires ON public.circle_invitations(expires_at, status);

-- Meal planning indexes
CREATE INDEX idx_circle_meal_plans_circle ON public.circle_meal_plans(circle_id);
CREATE INDEX idx_circle_meal_plans_creator ON public.circle_meal_plans(created_by_user_id);
CREATE INDEX idx_circle_meal_plans_period ON public.circle_meal_plans(start_date, end_date);
CREATE INDEX idx_circle_meal_plans_status ON public.circle_meal_plans(status);

CREATE INDEX idx_circle_planned_meals_plan ON public.circle_planned_meals(meal_plan_id);
CREATE INDEX idx_circle_planned_meals_date ON public.circle_planned_meals(planned_date);
CREATE INDEX idx_circle_planned_meals_recipe ON public.circle_planned_meals(recipe_id);
CREATE INDEX idx_circle_planned_meals_cook ON public.circle_planned_meals(assigned_cook_user_id);
CREATE INDEX idx_circle_planned_meals_status ON public.circle_planned_meals(preparation_status);

CREATE INDEX idx_circle_meal_votes_meal ON public.circle_meal_votes(planned_meal_id);
CREATE INDEX idx_circle_meal_votes_user ON public.circle_meal_votes(user_id);

-- Grocery indexes
CREATE INDEX idx_circle_grocery_lists_circle ON public.circle_grocery_lists(circle_id);
CREATE INDEX idx_circle_grocery_lists_meal_plan ON public.circle_grocery_lists(meal_plan_id);
CREATE INDEX idx_circle_grocery_lists_creator ON public.circle_grocery_lists(created_by_user_id);
CREATE INDEX idx_circle_grocery_lists_status ON public.circle_grocery_lists(status);
CREATE INDEX idx_circle_grocery_lists_date ON public.circle_grocery_lists(shopping_date);

CREATE INDEX idx_circle_grocery_items_list ON public.circle_grocery_items(grocery_list_id);
CREATE INDEX idx_circle_grocery_items_food ON public.circle_grocery_items(food_id);
CREATE INDEX idx_circle_grocery_items_requested_by ON public.circle_grocery_items(requested_by_user_id);
CREATE INDEX idx_circle_grocery_items_assigned_to ON public.circle_grocery_items(assigned_to_user_id);
CREATE INDEX idx_circle_grocery_items_status ON public.circle_grocery_items(status);
CREATE INDEX idx_circle_grocery_items_meal ON public.circle_grocery_items(planned_meal_id);

-- Activity indexes
CREATE INDEX idx_circle_activities_circle ON public.circle_activities(circle_id);
CREATE INDEX idx_circle_activities_user ON public.circle_activities(user_id);
CREATE INDEX idx_circle_activities_type ON public.circle_activities(activity_type);
CREATE INDEX idx_circle_activities_created ON public.circle_activities(created_at);
CREATE INDEX idx_circle_activities_visibility ON public.circle_activities(visibility);

CREATE INDEX idx_circle_activity_comments_activity ON public.circle_activity_comments(activity_id);
CREATE INDEX idx_circle_activity_comments_user ON public.circle_activity_comments(user_id);
CREATE INDEX idx_circle_activity_comments_parent ON public.circle_activity_comments(parent_comment_id);

-- Challenge indexes
CREATE INDEX idx_circle_challenges_circle ON public.circle_challenges(circle_id);
CREATE INDEX idx_circle_challenges_creator ON public.circle_challenges(created_by_user_id);
CREATE INDEX idx_circle_challenges_type ON public.circle_challenges(challenge_type);
CREATE INDEX idx_circle_challenges_dates ON public.circle_challenges(start_date, end_date);
CREATE INDEX idx_circle_challenges_status ON public.circle_challenges(status);

CREATE INDEX idx_circle_challenge_participants_challenge ON public.circle_challenge_participants(challenge_id);
CREATE INDEX idx_circle_challenge_participants_user ON public.circle_challenge_participants(user_id);
CREATE INDEX idx_circle_challenge_participants_status ON public.circle_challenge_participants(participation_status);