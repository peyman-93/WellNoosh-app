# WellNoosh Bug Fixes & Updates - Round 3

## Context
React Native meal planning app. Focus on ingredient display, calorie accuracy, calendar sync, and feature changes.

---

## 🥗 Ingredients Display Fix

### Task: Remove redundant "Ingredient" text
- **Location:** Recipes → Personalized meal → Ingredients list
- **Current (wrong):** `cornstarch 0.8 tbsp Ingredient`
- **Expected:** `cornstarch 0.8 tbsp`
- **Fix:** Strip the word "Ingredient" from ingredient display strings

---

## 🔢 Calorie Accuracy (Priority: High)

### Task: Improve calorie precision
- **Problem:** Calorie calculations appear inaccurate
- **Fix:** Review and improve calorie calculation logic
- **Consider:**
  - Use precise nutritional data sources
  - Ensure calculations account for actual ingredient quantities
  - Round appropriately (e.g., to nearest whole number)
  - Verify agent is using correct calorie values per ingredient

---

## 📅 Meal Planner Calendar Bug (CRITICAL - Still Broken)

### Task: Fix date offset issue
- **Problem:** User selects `Sun 18 Jan` → Calendar adds meal to `Mon 19 Jan`
- **Pattern:** Consistently adding to next day (off-by-one error)
- **Root cause investigation:**
  - Check timezone handling (UTC vs local)
  - Check date object creation (midnight boundary issues?)
  - Check calendar API date format expectations
- **Expected:** Selected date = Calendar date (exact match)

---

## 🍽️ Default Serving Size (STILL INCONSISTENT)

### Task: Enforce 1 serving globally
- **Problem:** Some meals show 1 serving, others show 2 — should always be 1
- **Scope:** ALL meals across entire app
- **Fix:** 
  - Set default serving = 1 in meal data model
  - Audit all meal creation/fetch points to ensure default is applied
  - Check agent responses — ensure they return serving_size: 1

---

## 📊 Fiber Tracking

### Task: Add fiber to nutrition calculations
- **Question:** Do current agents calculate fiber? 
- **If not:** Update agents to include fiber in nutritional output
- **Display:** Ensure fiber value flows to home screen nutrition wheel
- **Agent update needed:** Return fiber data alongside calories, protein, carbs, fat

---

## 🔄 Navigation Change

### Task: Replace Community with Daily Reflection
- **Location:** Bottom navigation / Main tabs
- **Remove:** Community tab/screen
- **Add:** Daily Reflection tab/screen
- **Note:** May need to create new Daily Reflection component if it doesn't exist

---

## Acceptance Criteria
- [ ] Ingredients display without "Ingredient" suffix
- [ ] Calorie values are accurate and precise
- [ ] Calendar dates match selected dates exactly
- [ ] All meals default to 1 serving consistently
- [ ] Fiber is calculated by agents and shown in nutrition wheel
- [ ] Community replaced with Daily Reflection in navigation

---

## Priority Order
1. 📅 Calendar date bug (user-facing, critical)
2. 🍽️ Serving size consistency
3. 🔢 Calorie accuracy
4. 🥗 Ingredients text cleanup
5. 📊 Fiber tracking
6. 🔄 Navigation change
