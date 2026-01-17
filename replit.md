# WellNoosh - AI-Powered Nutrition & Health Tracking App

## Overview
WellNoosh is a comprehensive AI-powered nutrition and health tracking application designed to help users manage their wellness journey through personalized recommendations. It offers features such as meal planning, recipe discovery, health tracking, and intelligent nutrition insights. The project aims to provide a robust, cross-platform solution for personalized health management, leveraging AI for an enhanced user experience in meal generation and dietary guidance.

## User Preferences
None documented yet.

## System Architecture
WellNoosh is structured as a monorepo comprising three main components: a frontend, a backend API, and a dedicated AI recommendation service.

### Frontend (`main-front/`)
- **Technology**: React Native with Expo (Web support enabled), Metro bundler.
- **UI/UX**: React Native Web with custom components for a responsive design across web, iOS, and Android. The UI focuses on simplification, with elements like the nutrition wheel showing 5 core metrics (Calories, Protein, Fiber, Carbs, Fat).
- **State Management**: TanStack React Query.
- **Authentication**: Supabase Auth.
- **Navigation**: React Navigation (Stack & Bottom Tabs).
- **Key Features**: User authentication, profile management, meal planning and tracking, recipe discovery, health metrics tracking, and a food detection camera feature for logging meals.
- **Design Decisions**: Default servings set to 1 for recommendations and recipes, improved ingredient units display, and enhanced chat confirmation flows for meal plan generation.

### Backend API (`main-backend/`)
- **Technology**: Node.js with TypeScript and Express.
- **Purpose**: Acts as a Backend-for-Frontend (BFF) layer, managing user data, recipes, meal plans, and nutrition information.
- **Security**: Implements Helmet, CORS, and rate limiting.
- **AI Integration**: Orchestrates AI meal planning using OpenAI GPT-4o.
- **Technical Implementations**: Manages nutrition tracking with `cooked_date` for accurate daily summaries, handles dynamic meal slots based on fasting schedules, and integrates with personalized recipe generation.

### AI Recommendation Service (`main-brain/`)
- **Technology**: Python with FastAPI.
- **Purpose**: Provides personalized AI-powered recommendations, including meal suggestions, nutrition analysis, and health insights.
- **Core Functionality**: Features an AI-powered meal planning chatbot that generates personalized weekly meal plans based on user profiles, dietary restrictions, and preferences. Utilizes a modular AI agents architecture with a Host Agent orchestrating specialized agents (e.g., Meal Planner Agent, Personalized Recipe Agent).
- **Advanced Features**: Incorporates strict allergy enforcement with comprehensive allergen derivative mappings, health goals awareness for personalized recommendations, and dynamic meal generation based on user-defined fasting windows and meals per day.

## External Dependencies
- **Supabase**: Used for authentication and as the PostgreSQL database.
- **OpenAI GPT-4o**: Powers the AI meal planning and recommendation features.
- **Expo**: Framework for React Native development, enabling cross-platform compatibility.
- **DSPy**: Utilized in the AI Recommendation Service for generating personalized recipes and managing AI agent interactions.