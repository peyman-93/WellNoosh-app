# WellNoosh - Complete Health Tracking System

A full-stack health and wellness tracking application with React Native frontend, Node.js backend, and AI-powered nutrition insights.

## 🏗️ What We Built

This is a complete, production-ready health tracking system that enables users to:

- **Create accounts** with real authentication via Supabase
- **Track health metrics** including water intake and breathing exercises
- **Complete detailed onboarding** with health goals, dietary preferences, and medical conditions
- **Store all data securely** in a Supabase database with Row Level Security (RLS)
- **Access AI-powered insights** through the Python-based recommendation engine

## 📁 Project Structure

```
WellNoosh-app/
├── main-backend/          # Node.js/Express API server
├── main-front/           # React Native mobile app
├── main-brain/           # Python AI/data processing engine
├── .env                  # Environment configuration
└── README.md            # This file
```

### 🚀 main-backend/
**Professional Node.js/Express backend with TypeScript**

- **REST API** with authentication, user management, and health tracking endpoints
- **Supabase Integration** for database operations and JWT authentication
- **Security** with rate limiting, input validation, CORS, and error handling
- **Database Schema** with user profiles, health metrics, and RLS policies
- **TypeScript** with strict typing throughout

**Key Endpoints:**
- `/api/auth/*` - User authentication (signup, login)
- `/api/users/*` - Profile management and health data
- `/api/health/*` - Water intake and breathing exercise tracking

### 📱 main-front/
**React Native mobile app with Expo**

- **Complete User Experience** from signup to daily health tracking
- **Real Authentication** with Supabase (no mock data)
- **Health Dashboard** with interactive water and breathing trackers
- **Onboarding Flow** capturing user preferences, allergies, and health goals
- **TypeScript** with comprehensive type safety

**Key Features:**
- User registration and profile creation
- Daily water intake tracking (8-glass system)
- Breathing exercise sessions (6-exercise system)
- Health goals and dietary preference management

### 🧠 main-brain/
**Python AI and data processing engine**

- **Food Data Scraping** from multiple European stores (Lidl, Mercadona, Jumbo)
- **LangGraph-powered** leftover management and recipe recommendations
- **Nutrition Analysis** with comprehensive food product database
- **AI Agents** for personalized meal suggestions based on health data

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** 18+ and npm
- **Python** 3.8+ (for main-brain)
- **Expo CLI**: `npm install -g @expo/cli`
- **Mobile device** or simulator for testing

### Step 1: Environment Setup

1. **Copy environment template:**
   ```bash
   cp .env.example .env
   ```

2. **Update .env with your Supabase credentials:**
   ```bash
   # Get these from your Supabase dashboard
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_KEY=your-service-role-key-here
   
   # Backend configuration
   PORT=3333
   EXPO_PUBLIC_API_URL=http://localhost:3333/api
   ```

### Step 2: Database Setup

1. **Create Supabase project** at [supabase.com](https://supabase.com)
2. **Run the database migration:**
   ```bash
   cd main-backend
   npm install
   npm run migrate
   ```

### Step 3: Start the Application

**IMPORTANT: Run backend and frontend in separate terminal windows**

#### Terminal 1 - Backend Server:
```bash
cd main-backend
npm install
npm run dev
```
The backend will start on `http://localhost:3333`

#### Terminal 2 - Frontend App:
```bash
cd main-front
npm install
npm start
```
Then press:
- `i` for iOS Simulator
- `a` for Android Emulator  
- Scan QR code with Expo Go app for physical device

### Step 4: Test the Application

1. **Create a new account** through the app's signup flow
2. **Complete onboarding** with your health preferences
3. **Track water intake** by tapping the water glasses
4. **Log breathing exercises** using the breathing tracker
5. **Check Supabase dashboard** to see your data being saved

## 🔧 Development Scripts

### Backend (main-backend/)
```bash
npm run dev          # Start development server
npm run build        # Build TypeScript
npm run migrate      # Run database migrations
npm run lint         # Run ESLint
```

### Frontend (main-front/)
```bash
npm start            # Start Expo development server
npm run ios          # Start iOS simulator
npm run android      # Start Android emulator
```

### Python Engine (main-brain/)
```bash
pip install -r requirements.txt    # Install dependencies
python run_graph.py                # Start AI recommendation engine
```

## 🗄️ Database Schema

The system uses Supabase with the following main tables:

- **user_profiles** - User information, health goals, dietary preferences
- **water_intake** - Daily water consumption tracking
- **breathing_exercises** - Meditation and breathing session logs
- **health_metrics** - Comprehensive health data (weight, mood, sleep)

All tables include Row Level Security (RLS) policies ensuring users can only access their own data.

## 🔒 Security Features

- **JWT Authentication** with Supabase
- **Row Level Security** on all database tables
- **Input Validation** with Joi schemas
- **Rate Limiting** (100 requests/15min)
- **CORS Protection** with configured origins
- **Environment Variable** protection (`.env` files gitignored)

## 🎯 Current Status

### ✅ Fully Working
- ✅ User authentication and registration
- ✅ Profile creation with health data
- ✅ Water intake tracking with persistence
- ✅ Breathing exercise logging
- ✅ Real-time frontend ↔ backend communication
- ✅ Supabase database integration
- ✅ Complete onboarding flow

### 🚧 Ready for Enhancement
- 📱 Add more health metrics (weight, mood, sleep)
- 🍽️ Integrate recipe recommendations from main-brain
- 📊 Build analytics dashboard
- 🔔 Add push notifications
- 📱 Implement offline sync

## 🆘 Troubleshooting

### Backend won't start
- Ensure port 3333 is available
- Check `.env` file has correct Supabase credentials
- Run `npm install` in main-backend directory

### Frontend can't connect to backend
- Verify backend is running on port 3333
- Check `EXPO_PUBLIC_API_URL` in `.env` files
- Restart frontend with `npm start --clear`

### Database errors
- Confirm Supabase project is active
- Run database migration: `npm run migrate`
- Check RLS policies in Supabase dashboard

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes in the appropriate folder (main-backend, main-front, or main-brain)
4. Test thoroughly with both backend and frontend running
5. Commit with descriptive messages
6. Push and create a Pull Request

---

**Built with ❤️ using React Native, Node.js, TypeScript, and Supabase**