# Recommendation System Integration Guide

This guide explains how to set up and test the integrated recommendation system that connects the AI-powered backend with the Tinder-style frontend component.

## Architecture Overview

The system consists of:
1. **main-brain**: Python backend with AI recommendation agent
2. **main-front**: React Native frontend with swipeable recipe cards
3. **Supabase**: Database for user profiles, recipes, and feedback

## Setup Instructions

### 1. Backend Setup (main-brain)

1. Navigate to `main-brain/` directory:
```bash
cd main-brain
```

2. Create a `.env` file with your Supabase credentials:
```env
SUPABASE_HOST=your_supabase_host
SUPABASE_PORT=5432
SUPABASE_DB=postgres
SUPABASE_USER=postgres
SUPABASE_PASSWORD=your_password
SUPABASE_SSLMODE=require

# Add one of these for AI recommendations:
OPENAI_API_KEY=sk-your-openai-key
# OR
GOOGLE_API_KEY=your-google-api-key
```

3. Start the recommendation API server:
```bash
./start_api.sh
```

The API will be available at `http://localhost:8000`

### 2. Frontend Setup (main-front)

1. Navigate to `main-front/` directory:
```bash
cd main-front
```

2. Update your `.env` or environment variables:
```env
EXPO_PUBLIC_RECOMMENDATION_API_URL=http://localhost:8000
```

3. Install dependencies and start the development server:
```bash
npm install
npm start
```

## Features

### Frontend Features

**Recipe Card Front:**
- Food image (from database or emoji fallback)
- Recipe name
- Cooking time
- Adjustable servings (+ and - buttons)
- Brief description
- AI recommendation reason

**Recipe Card Back:**
- Interactive ingredient list
- Tap ingredients to mark as "missing" for shopping list
- Step-by-step cooking instructions
- Nutrition information per serving (adjusts with serving size)
- Shopping list counter

**Swipe Actions:**
- Swipe right / tap ❤️: Like recipe
- Swipe left / tap ❌: Dislike recipe
- All actions are recorded in backend for future recommendations

### Backend Features

- **AI-Powered Recommendations**: Uses LangGraph workflow with OpenAI/Google AI
- **Health Profile Integration**: Considers user's dietary restrictions, health goals, allergies
- **Safety Filters**: Excludes recipes based on medical conditions and allergies
- **Feedback Learning**: Records user likes/dislikes for improved future recommendations
- **Fallback System**: Uses Supabase recipes if AI service is unavailable

## API Endpoints

### Get Recommendations
```
POST /api/recommendations
{
  "user_id": "uuid",
  "limit": 10,
  "refresh": false
}
```

### Record Feedback
```
POST /api/feedback
{
  "user_id": "uuid",
  "recipe_id": "recipe-id",
  "event_type": "like" | "dislike" | "save" | "pass"
}
```

### Health Check
```
GET /health
```

## Testing the Integration

1. **Start both services**: Backend API (`./start_api.sh`) and frontend (`npm start`)

2. **Create a user profile**: Use the onboarding flow to create a health profile

3. **Navigate to recipe recommendations**: Access the RecipeSwipeScreen

4. **Test the flow**:
   - View personalized recommendations
   - Adjust serving sizes
   - Flip cards to see ingredients/instructions
   - Mark missing ingredients
   - Swipe/tap to like/dislike recipes
   - Observe new recommendations adapting to your preferences

## Troubleshooting

**Backend Issues:**
- Check `.env` file has correct Supabase credentials
- Verify API key for OpenAI or Google AI
- Check logs in terminal for Python errors
- Test database connection with interactive test script

**Frontend Issues:**
- Verify `EXPO_PUBLIC_RECOMMENDATION_API_URL` points to backend
- Check network connectivity to backend API
- Review React Native debugger for JavaScript errors
- Ensure user is logged in through Supabase auth

**Integration Issues:**
- Test `/health` endpoint to verify backend is running
- Check browser/app network tab for API request/response details
- Verify user profile exists in Supabase with health data

## Future Enhancements

1. **Shopping List Integration**: Create Supabase table for shopping lists
2. **Recipe Saving**: Allow users to save liked recipes
3. **Meal Planning**: Convert liked recipes into meal plans
4. **Social Features**: Share recipe recommendations with family
5. **Advanced Filters**: More dietary preferences and restrictions
6. **Recipe Rating**: Allow users to rate completed recipes
7. **Photo Upload**: Let users add photos of completed dishes

The system is now ready for testing and can be extended with additional features as needed!