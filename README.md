# WellNoosh Mobile App

A cross-platform mobile meal-planning app built with React Native and Expo. WellNoosh helps users set dietary goals, discover recipes, track pantry items, and minimize food waste.

## 🏗️ Architecture Overview

### Frontend (React Native + Expo)
- **Navigation**: Expo Router (file-based routing)
- **State & Data Fetching**: React Query with mock REST endpoints
- **UI Components**: NativeWind (Tailwind CSS for React Native)
- **Authentication**: Supabase Auth
- **Local Storage**: Expo SQLite (planned for offline sync)

### Backend (Planned)
- **BFF**: Node.js + Express/Koa exposing REST endpoints
- **Database**: Supabase (Postgres + OAuth + email/password)
- **AI Agent Layer**: LangGraph workers behind an orchestrator

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (macOS) or Android Studio

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd WellNoosh-app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Create a `.env` file in the root directory with your Supabase credentials:
   ```bash
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url_here
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```

4. **Start the development server**:
   ```bash
   npm start
   ```

5. **Run on your platform**:
   - Press `i` for iOS Simulator
   - Press `a` for Android Emulator  
   - Press `w` for web browser
   - Scan QR code with Expo Go app for physical device

### Quick Start Commands

```bash
# Start development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run on web
npm run web

# Type checking
npm run typecheck

# Linting and formatting
npm run lint
```

## 📱 App Structure

```
app/
├── (protected)/          # Protected routes (auth required)
│   └── (tabs)/          # Main app tabs
│       ├── index.tsx    # Home/Dashboard
│       ├── planner.tsx  # Meal Planner
│       ├── pantry.tsx   # Pantry Tracker
│       ├── inspiration.tsx # Recipe Inspiration
│       └── profile.tsx  # User Profile
├── onboarding/          # User onboarding flow
│   ├── welcome.tsx      # Welcome screen
│   ├── diet-preferences.tsx # Diet selection
│   └── allergies.tsx    # Allergy preferences
├── _layout.tsx          # Root layout with providers
├── welcome.tsx          # Landing page
├── sign-up.tsx          # Registration
└── sign-in.tsx          # Login

components/ui/           # Reusable UI components
├── button.tsx
├── input.tsx
├── card.tsx
└── ...

context/                 # React Context providers
├── supabase-provider.tsx # Auth state management
└── query-provider.tsx   # React Query setup

hooks/                   # Custom React hooks
├── useRecipes.ts        # Recipe data hooks
├── usePantry.ts         # Pantry data hooks
└── useMealPlans.ts      # Meal plan hooks

api/                     # API client and types
└── client.ts            # Mock API client with TypeScript types
```

## 🎨 Design System

The app uses a carefully crafted design system based on the V3 Figma export:

### Theme
- **Typography**: Inter (body) + Playfair Display (brand)
- **Colors**: Luxury palette with primary blues and accent gradients
- **Spacing**: iPhone 16-optimized dimensions
- **Components**: iOS-native styling with glassmorphism effects

### Key Features
- **Dark/Light Mode**: Automatic system detection
- **Safe Areas**: iPhone 16 optimized with Dynamic Island support
- **Touch Targets**: 44px minimum for accessibility
- **Animations**: Smooth transitions with haptic feedback

## 🔧 Development Scripts

```bash
# Start development server
npm start

# Type checking
npm run typecheck

# Linting
npm run lint

# Build for production
npm run build

# Platform-specific builds
npm run ios
npm run android
```

## 📊 Current Features

### ✅ Implemented
- [x] Authentication flow (Sign up/Sign in)
- [x] User onboarding (Diet preferences, Allergies)
- [x] Tab-based navigation (Home, Planner, Pantry, Inspiration, Profile)
- [x] React Query integration with mock APIs
- [x] TypeScript setup with path mapping
- [x] NativeWind styling system
- [x] Supabase integration

### 🚧 In Progress
- [ ] Real recipe data integration
- [ ] Pantry item management
- [ ] Meal planning functionality
- [ ] SQLite offline storage

### 📋 Planned
- [ ] AI recipe recommendations
- [ ] Photo scanning for receipts
- [ ] Family sharing features
- [ ] Leftover tracking
- [ ] Shopping list generation

## 🔌 API Integration

The app currently uses mock APIs defined in `api/client.ts`. To integrate with your BFF:

1. Update `EXPO_PUBLIC_API_URL` in your `.env`
2. Replace mock functions in `api/client.ts` with real HTTP calls
3. Update TypeScript interfaces to match your API responses

Example:
```typescript
// Replace this mock function
export const api = {
  recipes: {
    getAll: async (): Promise<Recipe[]> => {
      // Mock implementation
      return mockRecipes
    }
  }
}

// With real API calls
export const api = {
  recipes: {
    getAll: async (): Promise<Recipe[]> => {
      const response = await fetch(`${API_BASE_URL}/recipes`)
      return response.json()
    }
  }
}
```

## 🔒 Environment Variables

Required environment variables:

```bash
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Backend API (when ready)
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.