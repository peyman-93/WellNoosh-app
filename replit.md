# WellNoosh - AI-Powered Nutrition & Health Tracking App

## Project Overview

WellNoosh is a comprehensive nutrition and health tracking application that helps users manage their wellness journey with personalized AI-powered recommendations. The app features meal planning, recipe discovery, health tracking, and intelligent nutrition insights.

## Architecture

This project is organized as a monorepo with three main components:

### 1. Frontend (`main-front/`)
- **Technology**: React Native with Expo (Web support enabled)
- **Port**: 5000 (development), static files (production)
- **Framework**: Expo 53 with Metro bundler
- **UI**: React Native Web with custom components
- **State Management**: TanStack React Query
- **Authentication**: Supabase Auth
- **Navigation**: React Navigation (Stack & Bottom Tabs)

### 2. Backend API (`main-backend/`)
- **Technology**: Node.js with TypeScript and Express
- **Port**: 3000
- **Purpose**: Backend-for-Frontend (BFF) API layer
- **Features**: User management, recipes, meal plans, nutrition data, AI meal planning
- **Security**: Helmet, CORS, rate limiting
- **Database**: Supabase (PostgreSQL)
- **AI Integration**: OpenAI GPT-4o for meal plan generation

### 3. AI Recommendation Service (`main-brain/`)
- **Technology**: Python with FastAPI
- **Port**: 8000
- **Purpose**: AI-powered personalized recommendations
- **Features**: Meal suggestions, nutrition analysis, health insights

## Project Structure

```
.
├── main-front/          # Expo React Native frontend
│   ├── src/            # Source code
│   ├── assets/         # Images, fonts, etc.
│   ├── metro.config.js # Metro bundler configuration
│   ├── app.json        # Expo configuration
│   └── package.json    # Dependencies
├── main-backend/        # Node.js backend API
│   ├── src/            # Source code
│   │   ├── routes/     # API routes
│   │   ├── middleware/ # Express middleware
│   │   └── index.ts    # Entry point
│   └── package.json    # Dependencies
└── main-brain/          # Python AI service
    ├── main.py         # FastAPI entry point
    └── requirements.txt # Python dependencies
```

## Development Setup

### Prerequisites
- Node.js 20.x
- Python 3.11
- Supabase account (for authentication and database)

### Environment Variables

The following environment variables are required for development:

#### Shared Environment Variables
- `EXPO_PUBLIC_API_URL`: Backend API URL (auto-configured in Replit)

#### Secrets (Encrypted)
- `EXPO_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key

### Installation

All dependencies are pre-installed in the Replit environment. If you need to reinstall:

**Frontend:**
```bash
cd main-front
npm install
```

**Backend:**
```bash
cd main-backend
npm install
```

**AI Service:**
```bash
cd main-brain
pip install -r requirements.txt
```

### Running the Application

The frontend workflow is configured to start automatically. To manually start:

```bash
cd main-front
EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0 npx expo start --web --port 5000
```

To run the backend (optional for full functionality):
```bash
cd main-backend
npm start
```

To run the AI service (optional):
```bash
cd main-brain
python main.py
```

## Development Workflow

1. **Frontend Development**: The main frontend workflow runs automatically on port 5000
2. **Backend Development**: Start the backend separately if you need API functionality
3. **Changes**: The Metro bundler supports hot reloading - changes appear automatically
4. **Environment**: Use the `.env` file in `main-front/` for local environment variables

## Deployment

The project is configured for static deployment of the frontend web app:

- **Build Command**: `cd main-front && npm run build`
- **Output Directory**: `main-front/dist`
- **Deployment Type**: Static (autoscaling)

The exported static files can be deployed to any static hosting service.

## Key Features

- User authentication and profile management
- Meal planning and tracking
- Recipe discovery with nutritional information
- Health metrics tracking
- AI-powered personalized recommendations
- Cross-platform support (Web, iOS, Android)

## Technical Highlights

- **Metro Bundler Configuration**: Configured with cache control headers for Replit proxy compatibility
- **TypeScript**: Full type safety across frontend and backend
- **Form Validation**: React Hook Form with Zod schemas
- **Responsive Design**: Works on web, iOS, and Android
- **Secure Storage**: Expo Secure Store for sensitive data
- **API Integration**: RESTful API with Supabase backend

## User Preferences

None documented yet.

## AI Meal Planner Feature

The app includes an AI-powered meal planning chatbot that helps users create personalized weekly meal plans based on their health profile, dietary restrictions, and preferences.

### How It Works

1. **Chat with AI**: Users can have a conversation with the AI assistant about their meal preferences
2. **Generate Plan**: Based on the conversation, the AI generates a structured 7-day meal plan
3. **Apply to Calendar**: The generated meals are automatically added to the meal planner calendar

### Backend API Endpoints

- `POST /api/meal-plans/ai-chat` - Chat with the AI assistant
- `POST /api/meal-plans/ai-generate` - Generate a structured meal plan from the conversation

### Using Your Own OpenAI API Key

By default, the app uses Replit's OpenAI integration. To use your own OpenAI API key:

1. Add your OpenAI API key as a secret named `OPENAI_API_KEY`
2. Modify `main-backend/src/controllers/mealPlanController.ts`:
   ```typescript
   const openai = new OpenAI({
     apiKey: process.env.OPENAI_API_KEY,
     // Remove baseURL to use OpenAI directly
   });
   ```

## Recent Changes

### January 2026 (Latest)
- **Modular AI Agents Architecture**:
  - Created `main-brain/src/agents/` folder with Host Agent orchestrating specialized agents
  - Host Agent routes requests to Meal Planner, Recipe Recommendation, and other agents
  - Meal Planner Agent moved to `agents/meal_planner/dspy_meal_planner.py`
  
- **Super Strict Allergy Enforcement**:
  - Added ALLERGEN_DERIVATIVES mapping with 60+ derivatives per allergen type
  - Dairy allergy now blocks: milk, yogurt, cheese, butter, cream, whey, casein, etc.
  - Allergen validation now scans ingredients, instructions, notes, and titles
  - Fallback safe meals generated when violations detected
  
- **Daily Nutrition Logging**:
  - Added `logCookedMealNutrition` function in nutritionTrackingService
  - MealDetailModal now logs nutrition data when meals are marked as cooked
  - Created `daily_nutrition_summary` and `nutrition_meal_logs` tables (SQL in `main-backend/supabase/daily_nutrition_tables.sql`)
  
- **Meal Plan Chat Improvements**:
  - Removed Quick/Detailed mode toggle (now only detailed mode)
  - Changed day options from [7] to [1, 3, 5, 7] days

- Enhanced Meal Planner with WellNoosh Meals Planner:
  - Removed AI Plan button/picture from header
  - Added beautiful WellNoosh Meals Planner card that connects to AI chat
  - Calendar now starts from current day (not beginning of week)
  - MealPlanChatModal enhanced to ask for special requirements and number of meals
  - Created MealDetailModal showing ingredients, instructions with grocery list integration
  - Tap on meals to view details, add ingredients to grocery list, mark as cooked
  - Added "Update Plan with AI" button when meals already exist
- Made ProfileCompletion screen responsive and adaptable to all screen sizes
- Added recipe recommendations on every sign-in (with skip option)
- Removed meal planner section from Home screen (now only in Meal Planner tab)
- Added Food Detection camera feature for capturing and logging meals:
  - Camera integration with expo-camera
  - Gallery picker fallback
  - Mock AI food analysis (production would use vision AI)
  - Automatic meal logging to Supabase
  - Nutrition stats displayed on Home screen (calories, meals logged, protein)

### December 2024
- Added AI meal planner chatbot feature with OpenAI GPT-4o integration
- Created secure backend API endpoints for AI chat and meal plan generation
- Fixed meal planner week selection to correctly use the selected week
- Corrected backend port to 3000
- Initial project import completed
- Configured Metro bundler for Replit proxy compatibility
- Set up environment variables and Supabase integration
- Added build script for static deployment
- Configured deployment settings for production
