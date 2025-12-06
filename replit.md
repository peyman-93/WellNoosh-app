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
