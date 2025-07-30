# Supabase Web Interface Migration Guide

## ⚠️ Important Note
The `run_all_migrations.sql` file uses PostgreSQL CLI commands that don't work in the Supabase web interface. Follow this guide instead.

## 🎯 Step-by-Step Web Migration Process

### Step 1: Phase 1 - Enhanced User Management

Copy and paste each of these files **one at a time** into the Supabase SQL Editor and run them:

#### 1.1 User Management Tables
```sql
-- Copy the ENTIRE contents of: 20250130_001_phase1_user_management.sql
-- Paste here and click RUN
```

#### 1.2 User Management RLS Policies  
```sql
-- Copy the ENTIRE contents of: 20250130_002_phase1_rls_policies.sql
-- Paste here and click RUN
```

#### 1.3 User Management Functions & Views
```sql
-- Copy the ENTIRE contents of: 20250130_003_phase1_functions_views.sql
-- Paste here and click RUN
```

### Step 2: Phase 2 - Nutrition Tracking

#### 2.1 Nutrition Tables
```sql
-- Copy the ENTIRE contents of: 20250130_004_phase2_nutrition_tracking.sql
-- Paste here and click RUN
```

#### 2.2 Nutrition RLS Policies
```sql
-- Copy the ENTIRE contents of: 20250130_005_phase2_nutrition_rls.sql
-- Paste here and click RUN
```

#### 2.3 Nutrition Functions
```sql
-- Copy the ENTIRE contents of: 20250130_006_phase2_nutrition_functions.sql
-- Paste here and click RUN
```

### Step 3: Phase 3 - Recipe Intelligence

#### 3.1 Recipe Tables
```sql
-- Copy the ENTIRE contents of: 20250130_007_phase3_recipe_intelligence.sql
-- Paste here and click RUN
```

### Step 4: Phase 4 - Social Circles

#### 4.1 Circles Tables
```sql
-- Copy the ENTIRE contents of: 20250130_008_phase4_circles_social.sql
-- Paste here and click RUN
```

### Step 5: Phase 5 - Meal Planning

#### 5.1 Meal Planning Tables
```sql
-- Copy the ENTIRE contents of: 20250130_009_phase5_meal_planning.sql
-- Paste here and click RUN
```

### Step 6: Phase 6 - Shopping & Inventory

#### 6.1 Shopping & Inventory Tables
```sql
-- Copy the ENTIRE contents of: 20250130_010_phase6_shopping_inventory.sql
-- Paste here and click RUN
```

### Step 7: Security & RLS

#### 7.1 Comprehensive Security
```sql
-- Copy the ENTIRE contents of: 20250130_011_comprehensive_rls_security.sql
-- Paste here and click RUN
```

### Step 8: Analytics & Metrics

#### 8.1 Analytics System
```sql
-- Copy the ENTIRE contents of: 20250130_012_analytics_metrics_aggregation.sql
-- Paste here and click RUN
```

## ✅ Verification After Each Step

After running each migration, verify it worked by checking:

1. **No error messages** in the SQL Editor
2. **Tables were created** - go to Table Editor to see new tables
3. **Run this verification query:**

```sql
-- Check tables created in this phase
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

## 🚨 If You Get Errors

### Common Error Solutions:

#### "relation already exists"
```sql
-- If you need to restart, drop tables first:
DROP TABLE IF EXISTS table_name CASCADE;
```

#### "function already exists"  
```sql
-- Drop function first:
DROP FUNCTION IF EXISTS function_name;
```

#### "policy already exists"
```sql
-- Drop policy first:
DROP POLICY IF EXISTS policy_name ON table_name;
```

### Complete Reset (if needed)
If you want to start completely fresh:

```sql
-- WARNING: This will delete ALL your data!
-- Only run if you want to completely reset

-- Drop all tables
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

## 📋 Checklist - Check Off As You Complete

- [ ] Step 1.1: User Management Tables
- [ ] Step 1.2: User Management RLS  
- [ ] Step 1.3: User Management Functions
- [ ] Step 2.1: Nutrition Tables
- [ ] Step 2.2: Nutrition RLS
- [ ] Step 2.3: Nutrition Functions  
- [ ] Step 3.1: Recipe Intelligence
- [ ] Step 4.1: Social Circles
- [ ] Step 5.1: Meal Planning
- [ ] Step 6.1: Shopping & Inventory
- [ ] Step 7.1: Comprehensive Security
- [ ] Step 8.1: Analytics & Metrics

## 🎯 Final Verification

After completing ALL steps, run this comprehensive check:

```sql
-- Final verification query
SELECT 
    'Tables' as type, 
    COUNT(*)::text as count 
FROM pg_tables 
WHERE schemaname = 'public'

UNION ALL

SELECT 
    'Functions' as type, 
    COUNT(*)::text as count
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'

UNION ALL

SELECT 
    'Indexes' as type, 
    COUNT(*)::text as count
FROM pg_indexes 
WHERE schemaname = 'public';
```

**Expected Results:**
- Tables: 50+
- Functions: 20+  
- Indexes: 200+

## 🎉 Success!

Once all steps are complete, you should have:
- ✅ Complete WellNoosh database schema
- ✅ All security policies active
- ✅ All business logic functions ready
- ✅ Analytics system operational

You're ready to start using the database in your application!