# WellNoosh - AI-Powered Nutrition & Health Tracking

A comprehensive health and wellness app with meal planning, nutrition tracking, and personalized recommendations.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- Supabase account
- iOS Simulator/Android Emulator or Expo Go app

### 1️⃣ Setup Environment

```bash
# Clone the repository
git clone https://github.com/yourusername/WellNoosh-app.git
cd WellNoosh-app

# Copy environment template
cp main-front/.env.example main-front/.env

# Add your Supabase credentials to main-front/.env:
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 2️⃣ Database Setup

1. Create a [Supabase](https://supabase.com) project
2. Run migrations in SQL Editor:
   ```sql
   -- Copy contents from main-front/supabase/migrations/
   -- Run each migration file in order
   ```

### 3️⃣ Run the App

```bash
cd main-front
npm install
npm start

# Press 'i' for iOS or 'a' for Android
# Or scan QR code with Expo Go app
```

## ✨ Key Features

- **🍽️ Smart Meal Planning** - AI-generated meal plans based on preferences
- **📊 Nutrition Tracking** - Real-time calorie and macro tracking
- **💪 Health Monitoring** - Weight, BMI, and wellness metrics
- **💧 Water Tracking** - Daily hydration goals
- **🧘 Breathing Exercises** - Guided wellness sessions
- **👨‍👩‍👧‍👦 Family Support** - Multi-user meal planning

## 🛠️ Common Commands

```bash
# Install dependencies
cd main-front && npm install

# Start development
npm start

# Clear cache
npm start -- --clear

# Run on specific platform
npm run ios
npm run android
```

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| **Metro bundler errors** | `npm start -- --clear` |
| **Can't connect to Supabase** | Check `.env` file in `main-front/` |
| **SVG/Chart errors** | Update to latest version |
| **Database not syncing** | Run migrations in Supabase SQL Editor |

## 📁 Project Structure

```
main-front/
├── screens/          # App screens
├── src/
│   ├── components/   # Reusable components
│   ├── services/     # API & database services
│   └── types/        # TypeScript types
└── supabase/
    └── migrations/   # Database schema
```

## 🔗 Resources

- [Supabase Docs](https://supabase.com/docs)
- [Expo Docs](https://docs.expo.dev)
- [React Native](https://reactnative.dev)

---

**Built with ❤️ by the WellNoosh Team**