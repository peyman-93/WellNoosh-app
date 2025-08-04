-- WellNoosh Recipe and Meal Planning Database Schema
-- Compatible with Supabase SQL Editor
-- Comprehensive recipe management and meal planning system

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (be careful in production!)
DROP TABLE IF EXISTS user_recipe_ratings CASCADE;
DROP TABLE IF EXISTS user_favorite_recipes CASCADE;
DROP TABLE IF EXISTS meal_plan_recipes CASCADE;
DROP TABLE IF EXISTS meal_plans CASCADE;
DROP TABLE IF EXISTS recipe_ingredients CASCADE;
DROP TABLE IF EXISTS recipes CASCADE;
DROP TABLE IF EXISTS ingredients CASCADE;

-- Create ingredients table (master list of all ingredients)
CREATE TABLE ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    category VARCHAR(100) CHECK (
        category IN (
            'Vegetables', 'Fruits', 'Proteins', 'Dairy', 'Grains', 
            'Legumes', 'Nuts & Seeds', 'Oils & Fats', 'Herbs & Spices', 
            'Condiments', 'Beverages', 'Other'
        )
    ),
    default_unit VARCHAR(50), -- g, ml, cup, tbsp, tsp, whole, etc.
    calories_per_100g DECIMAL(6,2),
    protein_per_100g DECIMAL(5,2),
    carbs_per_100g DECIMAL(5,2),
    fat_per_100g DECIMAL(5,2),
    fiber_per_100g DECIMAL(5,2),
    sugar_per_100g DECIMAL(5,2),
    sodium_per_100g DECIMAL(6,2),
    common_allergens TEXT[],
    is_vegetarian BOOLEAN DEFAULT false,
    is_vegan BOOLEAN DEFAULT false,
    is_gluten_free BOOLEAN DEFAULT false,
    is_dairy_free BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create recipes table
CREATE TABLE recipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT,
    prep_time_minutes INTEGER CHECK (prep_time_minutes >= 0),
    cook_time_minutes INTEGER CHECK (cook_time_minutes >= 0),
    total_time_minutes INTEGER GENERATED ALWAYS AS (prep_time_minutes + cook_time_minutes) STORED,
    servings INTEGER DEFAULT 4 CHECK (servings > 0),
    difficulty VARCHAR(20) CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    cuisine_type VARCHAR(100),
    meal_type VARCHAR(50) CHECK (
        meal_type IN ('Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert')
    ),
    diet_categories TEXT[], -- Array of diet types: Vegan, Vegetarian, Keto, Paleo, etc.
    allergen_info TEXT[], -- Array of allergens present
    tags TEXT[], -- Array of searchable tags
    rating DECIMAL(2,1) CHECK (rating >= 0 AND rating <= 5),
    rating_count INTEGER DEFAULT 0,
    calories_per_serving INTEGER,
    protein_g DECIMAL(5,2),
    carbs_g DECIMAL(5,2),
    fat_g DECIMAL(5,2),
    fiber_g DECIMAL(5,2),
    sugar_g DECIMAL(5,2),
    sodium_mg INTEGER,
    instructions TEXT[], -- Array of step-by-step instructions
    tips TEXT,
    video_url TEXT,
    source_url TEXT,
    is_featured BOOLEAN DEFAULT false,
    is_premium BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create recipe_ingredients junction table
CREATE TABLE recipe_ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    ingredient_id UUID NOT NULL REFERENCES ingredients(id),
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    unit VARCHAR(50) NOT NULL,
    notes TEXT, -- e.g., "finely chopped", "optional", "to taste"
    ingredient_order INTEGER DEFAULT 0,
    is_optional BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_recipe_ingredient UNIQUE(recipe_id, ingredient_id)
);

-- Create meal_plans table
CREATE TABLE meal_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_recipes INTEGER DEFAULT 0,
    total_calories INTEGER DEFAULT 0,
    average_daily_calories INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    preferences JSONB, -- Store user preferences for this meal plan
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- Create meal_plan_recipes table
CREATE TABLE meal_plan_recipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meal_plan_id UUID NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
    recipe_id UUID NOT NULL REFERENCES recipes(id),
    scheduled_date DATE NOT NULL,
    meal_type VARCHAR(50) NOT NULL CHECK (
        meal_type IN ('Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert')
    ),
    servings INTEGER DEFAULT 1 CHECK (servings > 0),
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_meal_plan_slot UNIQUE(meal_plan_id, scheduled_date, meal_type)
);

-- Create user_favorite_recipes table
CREATE TABLE user_favorite_recipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    notes TEXT,
    tags TEXT[], -- User's personal tags for this recipe
    added_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_favorite UNIQUE(user_id, recipe_id)
);

-- Create user_recipe_ratings table
CREATE TABLE user_recipe_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    made_count INTEGER DEFAULT 1,
    last_made_date DATE,
    difficulty_rating VARCHAR(20) CHECK (
        difficulty_rating IN ('Too Easy', 'Just Right', 'Too Hard')
    ),
    would_make_again BOOLEAN,
    photos TEXT[], -- Array of photo URLs
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_rating UNIQUE(user_id, recipe_id)
);

-- Create indexes for better performance
CREATE INDEX idx_recipes_meal_type ON recipes(meal_type);
CREATE INDEX idx_recipes_cuisine_type ON recipes(cuisine_type);
CREATE INDEX idx_recipes_difficulty ON recipes(difficulty);
CREATE INDEX idx_recipes_rating ON recipes(rating DESC);
CREATE INDEX idx_recipes_diet_categories ON recipes USING GIN(diet_categories);
CREATE INDEX idx_recipes_allergen_info ON recipes USING GIN(allergen_info);
CREATE INDEX idx_recipes_tags ON recipes USING GIN(tags);

CREATE INDEX idx_ingredients_category ON ingredients(category);
CREATE INDEX idx_ingredients_name ON ingredients(name);

CREATE INDEX idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id);
CREATE INDEX idx_recipe_ingredients_ingredient ON recipe_ingredients(ingredient_id);

CREATE INDEX idx_meal_plans_user ON meal_plans(user_id);
CREATE INDEX idx_meal_plans_dates ON meal_plans(start_date, end_date);
CREATE INDEX idx_meal_plans_active ON meal_plans(is_active);

CREATE INDEX idx_meal_plan_recipes_plan ON meal_plan_recipes(meal_plan_id);
CREATE INDEX idx_meal_plan_recipes_date ON meal_plan_recipes(scheduled_date);
CREATE INDEX idx_meal_plan_recipes_completed ON meal_plan_recipes(is_completed);

CREATE INDEX idx_user_favorites_user ON user_favorite_recipes(user_id);
CREATE INDEX idx_user_favorites_recipe ON user_favorite_recipes(recipe_id);

CREATE INDEX idx_user_ratings_user ON user_recipe_ratings(user_id);
CREATE INDEX idx_user_ratings_recipe ON user_recipe_ratings(recipe_id);

-- Create update timestamp triggers
CREATE TRIGGER update_ingredients_updated_at
    BEFORE UPDATE ON ingredients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recipes_updated_at
    BEFORE UPDATE ON recipes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meal_plans_updated_at
    BEFORE UPDATE ON meal_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meal_plan_recipes_updated_at
    BEFORE UPDATE ON meal_plan_recipes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_recipe_ratings_updated_at
    BEFORE UPDATE ON user_recipe_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plan_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorite_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_recipe_ratings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for recipes (public read, admin write)
CREATE POLICY "Public can view recipes"
    ON recipes FOR SELECT
    USING (true);

CREATE POLICY "Admin can manage recipes"
    ON recipes FOR ALL
    USING (auth.role() = 'service_role');

-- RLS Policies for ingredients (public read, admin write)
CREATE POLICY "Public can view ingredients"
    ON ingredients FOR SELECT
    USING (true);

CREATE POLICY "Admin can manage ingredients"
    ON ingredients FOR ALL
    USING (auth.role() = 'service_role');

-- RLS Policies for recipe_ingredients (public read, admin write)
CREATE POLICY "Public can view recipe ingredients"
    ON recipe_ingredients FOR SELECT
    USING (true);

CREATE POLICY "Admin can manage recipe ingredients"
    ON recipe_ingredients FOR ALL
    USING (auth.role() = 'service_role');

-- RLS Policies for meal_plans (users can only see/edit their own)
CREATE POLICY "Users can view own meal plans"
    ON meal_plans FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own meal plans"
    ON meal_plans FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meal plans"
    ON meal_plans FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own meal plans"
    ON meal_plans FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for meal_plan_recipes (users can only manage their own plan recipes)
CREATE POLICY "Users can view own meal plan recipes"
    ON meal_plan_recipes FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM meal_plans
        WHERE meal_plans.id = meal_plan_recipes.meal_plan_id
        AND meal_plans.user_id = auth.uid()
    ));

CREATE POLICY "Users can manage own meal plan recipes"
    ON meal_plan_recipes FOR ALL
    USING (EXISTS (
        SELECT 1 FROM meal_plans
        WHERE meal_plans.id = meal_plan_recipes.meal_plan_id
        AND meal_plans.user_id = auth.uid()
    ));

-- RLS Policies for user_favorite_recipes
CREATE POLICY "Users can view own favorites"
    ON user_favorite_recipes FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can add own favorites"
    ON user_favorite_recipes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own favorites"
    ON user_favorite_recipes FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for user_recipe_ratings
CREATE POLICY "Public can view ratings"
    ON user_recipe_ratings FOR SELECT
    USING (true);

CREATE POLICY "Users can manage own ratings"
    ON user_recipe_ratings FOR ALL
    USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT ALL ON recipes TO authenticated;
GRANT ALL ON ingredients TO authenticated;
GRANT ALL ON recipe_ingredients TO authenticated;
GRANT ALL ON meal_plans TO authenticated;
GRANT ALL ON meal_plan_recipes TO authenticated;
GRANT ALL ON user_favorite_recipes TO authenticated;
GRANT ALL ON user_recipe_ratings TO authenticated;

GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Create function to update recipe rating
CREATE OR REPLACE FUNCTION update_recipe_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE recipes
    SET rating = (
        SELECT AVG(rating)::DECIMAL(2,1)
        FROM user_recipe_ratings
        WHERE recipe_id = NEW.recipe_id
    ),
    rating_count = (
        SELECT COUNT(*)
        FROM user_recipe_ratings
        WHERE recipe_id = NEW.recipe_id
    )
    WHERE id = NEW.recipe_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update recipe rating when a user rates it
CREATE TRIGGER update_recipe_rating_on_insert
    AFTER INSERT OR UPDATE OR DELETE ON user_recipe_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_recipe_rating();

-- Create function to calculate meal plan totals
CREATE OR REPLACE FUNCTION update_meal_plan_totals()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE meal_plans
    SET total_recipes = (
        SELECT COUNT(*)
        FROM meal_plan_recipes
        WHERE meal_plan_id = NEW.meal_plan_id
    ),
    total_calories = (
        SELECT COALESCE(SUM(r.calories_per_serving * mpr.servings), 0)
        FROM meal_plan_recipes mpr
        JOIN recipes r ON mpr.recipe_id = r.id
        WHERE mpr.meal_plan_id = NEW.meal_plan_id
    ),
    average_daily_calories = (
        SELECT COALESCE(
            SUM(r.calories_per_serving * mpr.servings) / 
            GREATEST(DATE_PART('day', mp.end_date - mp.start_date) + 1, 1), 
            0
        )::INTEGER
        FROM meal_plan_recipes mpr
        JOIN recipes r ON mpr.recipe_id = r.id
        JOIN meal_plans mp ON mp.id = NEW.meal_plan_id
        WHERE mpr.meal_plan_id = NEW.meal_plan_id
        GROUP BY mp.start_date, mp.end_date
    )
    WHERE id = NEW.meal_plan_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update meal plan totals
CREATE TRIGGER update_meal_plan_totals_on_change
    AFTER INSERT OR UPDATE OR DELETE ON meal_plan_recipes
    FOR EACH ROW
    EXECUTE FUNCTION update_meal_plan_totals();

-- Comments for documentation
COMMENT ON TABLE recipes IS 'Main recipes table containing all recipe information and nutritional data';
COMMENT ON TABLE ingredients IS 'Master list of all ingredients with nutritional information';
COMMENT ON TABLE recipe_ingredients IS 'Junction table linking recipes to ingredients with amounts';
COMMENT ON TABLE meal_plans IS 'User meal plans for organizing recipes over date ranges';
COMMENT ON TABLE meal_plan_recipes IS 'Recipes scheduled within meal plans';
COMMENT ON TABLE user_favorite_recipes IS 'User bookmarked/favorited recipes';
COMMENT ON TABLE user_recipe_ratings IS 'User ratings and reviews for recipes';

COMMENT ON COLUMN recipes.diet_categories IS 'Array of diet types this recipe fits: Vegan, Vegetarian, Keto, Paleo, etc.';
COMMENT ON COLUMN recipes.allergen_info IS 'Array of allergens present in this recipe';
COMMENT ON COLUMN recipes.tags IS 'Searchable tags for recipe discovery';
COMMENT ON COLUMN meal_plans.preferences IS 'JSONB storing user preferences for meal plan generation';