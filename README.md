# WellNoosh - AI-Powered Nutrition & Health Tracking App

A comprehensive nutrition and health tracking application that helps users manage their wellness journey with personalized AI-powered recommendations. Features meal planning, recipe discovery, health tracking, and intelligent nutrition insights.

## Features

### AI-Powered Meal Planning
- **Personalized Meal Plans**: AI generates customized meal plans based on your health profile, dietary restrictions, and preferences
- **Confirmation Flow**: Review generated meals before adding to calendar, with ability to regenerate if not satisfied
- **Flexible Duration**: Choose 1, 3, 5, or 7-day meal plans
- **Super Strict Allergy Enforcement**: 60+ allergen derivatives are automatically blocked (e.g., dairy allergy blocks yogurt, cheese, whey, casein, etc.)
- **Health Goal Awareness**: AI considers your health goals (weight loss, muscle building, etc.) when generating meals

### Health Profile Management
- Allergies & Intolerances tracking with comprehensive derivative mapping
- Medical Conditions consideration in meal recommendations
- Diet Styles support (vegan, vegetarian, keto, balanced, etc.)
- Health Goals (weight loss, muscle building, energy boost, etc.)
- Daily Calorie Target customization
- Cooking Skill Level matching

### Nutrition Tracking
- Daily Nutrition Summary: Track calories, protein, carbs, and fat
- Meal Logging: Log cooked meals with automatic nutrition tracking
- Progress History: Historical nutrition data stored securely
- Automatic daily reset with persistent history

### Meal Planner Features
- Interactive Calendar: View and manage meals by day
- Meal Details Modal: View ingredients, instructions, and nutrition info
- Grocery List Integration: Add ingredients directly to shopping list
- Cook Tracking: Mark meals as cooked and log nutrition automatically

### Recipe Features
- AI-powered personalized recipe suggestions
- Step-by-step cooking instructions
- Complete ingredient lists with amounts
- Nutritional information per serving

## Architecture

### Frontend (`main-front/`)
- **Technology**: React Native with Expo (Web support enabled)
- **Port**: 5000 (development)
- **Framework**: Expo 53 with Metro bundler
- **State Management**: TanStack React Query
- **Authentication**: Supabase Auth
- **Navigation**: React Navigation (Stack & Bottom Tabs)

### Backend API (`main-backend/`)
- **Technology**: Node.js with TypeScript and Express
- **Port**: 3000
- **Purpose**: Backend-for-Frontend (BFF) API layer
- **Security**: Helmet, CORS, rate limiting
- **Database**: Supabase (PostgreSQL)

### AI Service (`main-brain/`)
- **Technology**: Python with FastAPI
- **Port**: 8000
- **Agent Architecture**: Modular agents with Host Agent orchestration
- **Meal Planner**: DSPy-based meal planning with strict allergy enforcement

## Quick Start

### Prerequisites
- Node.js 20.x
- Python 3.11
- Supabase account

### Environment Variables

#### Required Secrets
- `EXPO_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `OPENAI_API_KEY`: OpenAI API key (or use Replit's integration)

#### Optional Configuration
- `DSPY_MAX_TOKENS`: Maximum tokens for AI generation (default: 2000)

### Installation

```bash
# Frontend
cd main-front && npm install

# Backend
cd main-backend && npm install

# AI Service
cd main-brain && pip install -r requirements.txt
```

### Running the Application

```bash
# Frontend (Port 5000)
cd main-front
EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0 npx expo start --web --port 5000

# Backend (Port 3000)
cd main-backend && npm run dev

# AI Service (Port 8000)
cd main-brain && python main.py
```

## AI Agent Architecture

### Host Agent
The Host Agent (`main-brain/src/agents/host_agent.py`) orchestrates all specialized agents and routes requests appropriately.

### Meal Planner Agent
The DSPy-based Meal Planner Agent (`main-brain/src/agents/meal_planner/dspy_meal_planner.py`):
- Generates personalized meal plans
- Enforces strict allergen validation
- Provides safe fallback meals when allergens detected
- Supports configurable max token limits

### Allergy Enforcement
Super strict allergy enforcement with 60+ derivatives per allergen type:

| Allergen | Blocked Derivatives |
|----------|---------------------|
| Dairy | milk, cheese, yogurt, butter, cream, whey, casein, ghee, paneer, etc. |
| Gluten | wheat, bread, pasta, flour, barley, rye, couscous, bulgur, etc. |
| Eggs | eggs, mayonnaise, meringue, custard, hollandaise, etc. |
| Nuts | almonds, cashews, walnuts, peanuts, pistachios, etc. |
| Shellfish | shrimp, lobster, crab, scallops, clams, etc. |
| Fish | salmon, tuna, cod, tilapia, fish sauce, etc. |
| Soy | soy sauce, tofu, tempeh, edamame, miso, etc. |
| Sesame | sesame seeds, sesame oil, tahini, hummus |

## Database Tables

### Core Tables
- `user_profiles`: User health profiles and preferences
- `planned_meals`: Scheduled meals for meal planner
- `recipes`: Recipe database
- `grocery_list`: Shopping list items

### Nutrition Tracking Tables
- `daily_nutrition_summary`: Daily aggregated nutrition data
- `nutrition_meal_logs`: Individual meal nutrition logs

## API Endpoints

### Meal Planning
- `POST /api/meal-plans/ai-chat`: Chat with AI meal planning assistant
- `POST /api/meal-plans/dspy-generate`: Generate meal plan with DSPy agent

### Recipes
- `GET /api/recipes`: Get recipe recommendations
- `GET /api/recipes/:id`: Get recipe details

## Project Structure

```
.
├── main-front/              # Expo React Native frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── services/        # API & database services
│   │   ├── context/         # React context providers
│   │   └── screens/         # App screens
│   └── assets/              # Images, fonts, etc.
├── main-backend/            # Node.js backend API
│   ├── src/
│   │   ├── routes/          # API routes
│   │   ├── controllers/     # Route handlers
│   │   └── middleware/      # Express middleware
│   └── package.json
└── main-brain/              # Python AI service
    ├── src/
    │   └── agents/          # AI agents
    │       ├── host_agent.py
    │       └── meal_planner/
    ├── main.py              # FastAPI entry point
    └── requirements.txt
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Metro bundler errors | `npm start -- --clear` |
| Can't connect to Supabase | Check `.env` file in `main-front/` |
| AI service not responding | Ensure Python service is running on port 8000 |
| Allergies not enforced | Check that allergies are set in user profile |

## Security

- Row Level Security (RLS) on all database tables
- JWT-based authentication via Supabase
- Secure environment variable management
- Input validation and sanitization

---

**Built with care by the WellNoosh Team**
