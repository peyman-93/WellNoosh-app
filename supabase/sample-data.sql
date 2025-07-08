-- Sample recipes for testing
INSERT INTO public.recipes (name, description, cook_time, prep_time, difficulty, servings, rating, tags, ingredients, instructions, nutrition) VALUES
(
    'Mediterranean Quinoa Bowl',
    'A healthy and colorful bowl packed with Mediterranean flavors, quinoa, and fresh vegetables.',
    20,
    15,
    'Easy',
    2,
    4.5,
    ARRAY['healthy', 'vegetarian', 'mediterranean', 'quick'],
    '[
        {"name": "Quinoa", "amount": "1 cup", "category": "grains"},
        {"name": "Cherry tomatoes", "amount": "200g", "category": "vegetables"},
        {"name": "Cucumber", "amount": "1 large", "category": "vegetables"},
        {"name": "Red onion", "amount": "1/2 small", "category": "vegetables"},
        {"name": "Feta cheese", "amount": "100g", "category": "dairy"},
        {"name": "Olive oil", "amount": "3 tbsp", "category": "oils"},
        {"name": "Lemon juice", "amount": "2 tbsp", "category": "condiments"},
        {"name": "Fresh herbs", "amount": "1/4 cup", "category": "herbs"}
    ]',
    ARRAY[
        'Rinse quinoa and cook according to package instructions.',
        'While quinoa cooks, dice cucumber and halve cherry tomatoes.',
        'Thinly slice red onion and crumble feta cheese.',
        'Whisk together olive oil, lemon juice, salt, and pepper.',
        'Combine cooked quinoa with vegetables and herbs.',
        'Drizzle with dressing and top with feta cheese.',
        'Serve immediately or chill for later.'
    ],
    '{"calories": 420, "protein": 15, "carbs": 45, "fat": 18, "fiber": 8}'
),
(
    'Creamy Mushroom Risotto',
    'A rich and creamy risotto with mixed mushrooms and fresh herbs.',
    35,
    10,
    'Medium',
    4,
    4.7,
    ARRAY['vegetarian', 'comfort food', 'italian', 'creamy'],
    '[
        {"name": "Arborio rice", "amount": "300g", "category": "grains"},
        {"name": "Mixed mushrooms", "amount": "400g", "category": "vegetables"},
        {"name": "Vegetable stock", "amount": "1L", "category": "liquids"},
        {"name": "White wine", "amount": "150ml", "category": "liquids"},
        {"name": "Onion", "amount": "1 medium", "category": "vegetables"},
        {"name": "Garlic", "amount": "3 cloves", "category": "vegetables"},
        {"name": "Parmesan cheese", "amount": "100g", "category": "dairy"},
        {"name": "Butter", "amount": "50g", "category": "dairy"},
        {"name": "Fresh thyme", "amount": "2 sprigs", "category": "herbs"}
    ]',
    ARRAY[
        'Heat stock in a saucepan and keep warm.',
        'Sauté sliced mushrooms until golden, set aside.',
        'In same pan, cook diced onion and garlic until soft.',
        'Add rice, stirring until grains are coated.',
        'Add wine and stir until absorbed.',
        'Add warm stock one ladle at a time, stirring constantly.',
        'Continue until rice is creamy and al dente (about 18-20 minutes).',
        'Stir in mushrooms, butter, and Parmesan.',
        'Season with salt, pepper, and fresh thyme.'
    ],
    '{"calories": 380, "protein": 12, "carbs": 58, "fat": 14, "fiber": 3}'
),
(
    'Spicy Thai Basil Stir Fry',
    'A quick and flavorful stir fry with fresh basil and vegetables.',
    15,
    20,
    'Easy',
    3,
    4.3,
    ARRAY['spicy', 'asian', 'quick', 'vegetarian'],
    '[
        {"name": "Jasmine rice", "amount": "1.5 cups", "category": "grains"},
        {"name": "Thai basil", "amount": "1 cup", "category": "herbs"},
        {"name": "Bell peppers", "amount": "2 large", "category": "vegetables"},
        {"name": "Snap peas", "amount": "200g", "category": "vegetables"},
        {"name": "Garlic", "amount": "4 cloves", "category": "vegetables"},
        {"name": "Ginger", "amount": "1 inch", "category": "vegetables"},
        {"name": "Soy sauce", "amount": "3 tbsp", "category": "condiments"},
        {"name": "Sesame oil", "amount": "2 tbsp", "category": "oils"},
        {"name": "Chili flakes", "amount": "1 tsp", "category": "spices"}
    ]',
    ARRAY[
        'Cook jasmine rice according to package instructions.',
        'Heat sesame oil in a large wok or skillet.',
        'Add minced garlic and ginger, stir for 30 seconds.',
        'Add sliced bell peppers and snap peas.',
        'Stir-fry for 3-4 minutes until vegetables are crisp-tender.',
        'Add soy sauce and chili flakes.',
        'Toss in Thai basil leaves and stir until wilted.',
        'Serve immediately over rice.'
    ],
    '{"calories": 320, "protein": 8, "carbs": 65, "fat": 6, "fiber": 4}'
);