# WellNoosh Database Schema Documentation

## 📋 Table of Contents
1. [Overview](#overview)
2. [Simplified Database Architecture](#simplified-database-architecture)
3. [Core Tables](#core-tables)
4. [Data Relationships](#data-relationships)
5. [Migration Notes](#migration-notes)

---

## Overview

WellNoosh has been redesigned with a simplified 2-table database structure to focus on core functionality while maintaining scalability for future enhancements. This simplified approach reduces complexity and improves performance.

**Current Status**: ✅ Active (Simplified Structure)
**Previous Status**: 🗂️ Archived (Complex 23-table structure)

---

## Simplified Database Architecture

The new database consists of only **2 main tables**:

### 🏗️ Architecture Principles
- **User-Centric Design**: All data centers around user profiles and health information
- **Graceful Degradation**: UI components handle missing data elegantly
- **Future-Ready**: Structure allows for easy expansion when advanced features are reintroduced
- **Performance Focused**: Minimal joins and simplified queries

---

## Core Tables

### 1. `user_profiles` (Basic User Information)
**Purpose**: Core user demographic and contact information
**Primary Key**: `id` (UUID, auto-generated)
**Foreign Key**: `user_id` (references auth.users.id)

| Field | Type | Constraints | Description | Example |
|-------|------|-------------|-------------|---------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique profile ID | `123e4567-e89b-12d3-...` |
| `user_id` | UUID | NOT NULL, UNIQUE, REFERENCES auth.users(id) ON DELETE CASCADE | Supabase auth user reference | `123e4567-...` |
| `full_name` | VARCHAR | | User's full name | `John Smith` |
| `email` | VARCHAR | NOT NULL | User email address | `john@example.com` |
| `postal_code` | VARCHAR | | Postal/ZIP code | `10001` |
| `country` | VARCHAR | | Country of residence | `United States` |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Profile creation timestamp | `2024-01-15 10:30:00+00` |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | Last update timestamp | `2024-07-30 14:22:00+00` |

**Row Level Security (RLS)**:
- Users can only access their own profile data
- Authenticated users can insert/update their own profile

---

### 2. `user_health_profiles` (Health & Onboarding Information)
**Purpose**: Complete health data, dietary preferences, and onboarding information
**Primary Key**: `id` (UUID, auto-generated)  
**Foreign Key**: `user_id` (references auth.users.id)

| Field | Type | Constraints | Description | Example |
|-------|------|-------------|-------------|---------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique health profile ID | `123e4567-e89b-12d3-...` |
| `user_id` | UUID | NOT NULL, UNIQUE, REFERENCES auth.users(id) ON DELETE CASCADE | Supabase auth user reference | `123e4567-...` |
| `age` | INTEGER | | User age | `30` |
| `gender` | VARCHAR | | Gender identity | `male`, `female`, `other` |
| `weight` | DECIMAL(5,2) | | Current weight in kg | `70.50` |
| `weight_unit` | VARCHAR | DEFAULT 'kg' | Weight measurement unit | `kg`, `lbs` |
| `height` | DECIMAL(5,2) | | Height in cm | `175.00` |
| `height_unit` | VARCHAR | DEFAULT 'cm' | Height measurement unit | `cm`, `ft` |
| `height_feet` | INTEGER | | Height feet component (if imperial) | `5` |
| `height_inches` | INTEGER | | Height inches component (if imperial) | `9` |
| `target_weight` | DECIMAL(5,2) | | Goal weight | `65.00` |
| `target_weight_unit` | VARCHAR | DEFAULT 'kg' | Target weight unit | `kg`, `lbs` |
| `timeline` | VARCHAR | | Weight goal timeline | `3 months`, `6 months`, `1 year` |
| `activity_level` | VARCHAR | | Physical activity level | `sedentary`, `light`, `moderate`, `active`, `very_active` |
| `health_goals` | JSONB | | Health objectives array | `["Lose Weight", "Build Muscle", "Eat Healthier"]` |
| `diet_style` | VARCHAR | | Primary diet type | `omnivore`, `vegetarian`, `vegan`, `keto`, `paleo` |
| `allergies` | JSONB | | Food allergies array | `["nuts", "shellfish"]` |
| `cooking_skill` | VARCHAR | | Cooking experience level | `beginner`, `intermediate`, `advanced`, `expert` |
| `dietary_restrictions` | JSONB | | Additional dietary needs | `["gluten_free", "dairy_free"]` |
| `onboarding_completed` | BOOLEAN | DEFAULT false | Onboarding completion status | `true`/`false` |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Health profile creation | `2024-01-15 10:30:00+00` |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | Last update timestamp | `2024-07-30 14:22:00+00` |

**Row Level Security (RLS)**:
- Users can only access their own health data
- Authenticated users can insert/update their own health profile

**Health Goals Options**:
- `"Lose Weight"` - Weight loss focused nutrition
- `"Gain Weight"` - Weight gain and muscle building
- `"Build Muscle"` - Protein-focused nutrition
- `"Eat Healthier"` - General wellness improvement
- `"Manage Condition"` - Medical condition management
- `"Maintain Weight"` - Current weight maintenance

**Diet Style Options**:
- `"omnivore"` - Eats all foods
- `"vegetarian"` - No meat, includes dairy/eggs
- `"vegan"` - Plant-based only
- `"pescatarian"` - Fish but no other meat
- `"keto"` - High fat, low carb
- `"paleo"` - Whole foods, no processed

**Activity Level Options**:
- `"sedentary"` - Minimal physical activity
- `"light"` - Light exercise 1-3 days/week
- `"moderate"` - Moderate exercise 3-5 days/week
- `"active"` - Hard exercise 6-7 days/week
- `"very_active"` - Very hard exercise & physical job

---

## Data Relationships

### Database Schema Diagram
```
┌─────────────────┐       ┌──────────────────────┐
│   auth.users    │       │   user_profiles      │
│                 │◄──────│                      │
│ - id (UUID)     │   1:1 │ - id (UUID)          │
│ - email         │       │ - user_id (FK)       │
│ - created_at    │       │ - full_name          │
│ - ...           │       │ - email              │
└─────────────────┘       │ - postal_code        │
         │                │ - country            │
         │ 1:1            │ - created_at         │
         ▼                │ - updated_at         │
┌─────────────────────────┴──────────────────────┐
│        user_health_profiles                    │
│                                                │
│ - id (UUID)                                    │
│ - user_id (FK)                                 │
│ - age, gender, weight, height                  │
│ - target_weight, timeline                      │
│ - activity_level, health_goals                 │
│ - diet_style, allergies                        │
│ - cooking_skill, dietary_restrictions          │
│ - onboarding_completed                         │
│ - created_at, updated_at                       │
└────────────────────────────────────────────────┘
```

### Key Relationships
- **auth.users** → **user_profiles** (1:1) via `user_id`
- **auth.users** → **user_health_profiles** (1:1) via `user_id`
- Both tables cascade delete when auth user is removed
- All tables use Row Level Security (RLS) for data protection

### Data Flow
1. **User Registration**: Creates auth.users entry
2. **Profile Completion**: Creates user_profiles entry
3. **Onboarding Flow**: Creates user_health_profiles entry
4. **App Usage**: Updates both profile tables as needed

---

## Migration Notes

### 🔄 Database Migration Summary
**Date**: July 30, 2024
**Migration**: From 23-table complex structure to 2-table simplified structure

### Dropped Tables (23 total)
- All meal planning tables (`meal_plans`, `meal_plan_items`, etc.)
- All recipe tables (`recipes`, `user_recipe_interactions`, etc.)  
- All nutrition tracking tables (`nutrition_logs`, `daily_summaries`, etc.)
- All social/circle tables (`circles`, `circle_members`, etc.)
- All shopping tables (`shopping_lists`, `pantry_items`, etc.)
- All analytics tables (`user_analytics`, `system_metrics`, etc.)

### Frontend Adaptations
- **HomeTabScreen**: Gracefully handles missing meal planning data
- **TrackerScreen**: Shows basic health stats, placeholders for advanced tracking
- **MealPlannerTabScreen**: Shows placeholder for future meal planning features  
- **RecipesTabScreen**: Shows placeholder for future recipe features
- **All screens**: Handle missing data without crashing

### Future Expansion Strategy
The current 2-table structure serves as a foundation that can be expanded:

1. **Phase 1** (Current): Basic user profiles + health data
2. **Phase 2** (Future): Add recipe management tables
3. **Phase 3** (Future): Add meal planning tables  
4. **Phase 4** (Future): Add social/circle features
5. **Phase 5** (Future): Add comprehensive analytics

### Benefits of Simplified Structure
- ✅ **Faster Development**: Less complexity to manage
- ✅ **Better Performance**: Fewer joins and simpler queries
- ✅ **Easier Testing**: Reduced surface area for bugs
- ✅ **Clearer Data Flow**: User-centric design is intuitive
- ✅ **Scalable Foundation**: Easy to add features incrementally

---

*This documentation reflects the current simplified database structure as of July 2024. For the complete previous schema documentation, see `MIGRATION_SUMMARY.md`.*