# WellNoosh Backend API

A Backend-for-Frontend (BFF) API for the WellNoosh nutrition app, built with Node.js, Express, TypeScript, and Supabase.

## 🏗️ Architecture

This is a **Backend-for-Frontend (BFF)** that works with your existing Supabase infrastructure:

- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage
- **API Layer**: Express.js TypeScript server
- **Purpose**: Orchestrate data, implement business logic, integrate external APIs

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Your existing Supabase project
- Environment variables from main `.env` file

### Installation

```bash
cd main-backend
npm install
```

### Environment Setup

The backend reads from the main `.env` file in the project root. You may need to add these additional variables:

```env
# Add to your main .env file if not present
NODE_ENV=development
PORT=3000
SUPABASE_SERVICE_KEY=your-service-key-here
```

### Development

```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## 📡 API Endpoints

### Authentication (`/api/auth`)
- `POST /login` - User login
- `POST /signup` - User registration  
- `POST /logout` - User logout
- `POST /forgot-password` - Password reset request
- `POST /reset-password` - Password reset

### Users (`/api/users`)
- `GET /profile` - Get user profile
- `PUT /profile` - Update user profile
- `GET /health-metrics` - Get health tracking data
- `POST /health-metrics` - Create health metrics
- `GET /water-intake` - Get water intake data
- `POST /water-intake` - Update water intake

### Recipes (`/api/recipes`)
- `GET /` - Get recipes (with filtering)
- `GET /search` - Search recipes
- `POST /` - Create recipe
- `GET /:id` - Get specific recipe
- `POST /:id/favorite` - Toggle favorite
- `GET /recommendations/mood` - MoodFood recommendations

### Health (`/api/health`)
- `POST /mood-food` - Get mood-based food recommendations
- `GET /analytics` - Health analytics dashboard
- `GET /trends` - Health trends over time

### Meal Plans (`/api/meal-plans`)
- `GET /` - Get meal plans
- `POST /` - Create meal plan
- `GET /date/:date` - Get meal plans for specific date
- `POST /generate` - Generate smart meal plans

### Nutrition (`/api/nutrition`)
- `GET /daily/:date` - Get daily nutrition summary
- `POST /analyze-recipe` - Analyze recipe nutrition
- `GET /recommendations` - Get nutrition recommendations

## 🛡️ Security Features

- **Rate Limiting**: Protects against spam and abuse
- **CORS**: Configured for your frontend domains
- **Helmet**: Security headers
- **Input Validation**: Joi schema validation
- **Error Handling**: Centralized error management
- **Authentication**: Supabase JWT token verification

## 🏗️ Project Structure

```
main-backend/
├── src/
│   ├── controllers/     # Route handlers
│   ├── middleware/      # Auth, validation, errors
│   ├── routes/         # API route definitions  
│   ├── services/       # Business logic
│   ├── config/         # Configuration files
│   ├── types/          # TypeScript definitions
│   └── utils/          # Helper functions
├── database/           # Database migrations
├── tests/             # Test files
└── package.json
```

## 🔧 Available Scripts

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm start          # Start production server
npm test           # Run tests
npm run lint       # Run linting
```

## 🌟 Key Features

### MoodFood Algorithm
Smart recipe recommendations based on:
- Current mood level (1-10)
- Energy level (Low/Medium/High)  
- Stress level (1-10)
- Dietary preferences & restrictions
- Nutritional needs for mood enhancement

### Health Tracking
- Daily health metrics (weight, mood, sleep, energy)
- Water intake tracking (8 glasses/day)
- Breathing exercises (6 sessions/day)
- Progress analytics and trends

### Smart Meal Planning
- AI-powered meal plan generation
- Nutritional balance optimization
- Grocery list automation
- Meal plan templates

## 🔌 Integration Points

### Supabase Integration
- Uses existing Supabase database
- Leverages Supabase Auth for user management
- Utilizes Supabase Storage for images
- Service role for admin operations

### External APIs (Future)
- Nutrition databases (USDA, Edamam)
- Recipe databases (Spoonacular)
- Grocery store APIs
- Health data integrations

## 🚀 Deployment

### Production Setup
1. Set `NODE_ENV=production`
2. Add production Supabase credentials
3. Configure CORS for production domains
4. Set up SSL/HTTPS
5. Configure monitoring and logging

### Recommended Hosting
- **Vercel** (recommended for Node.js)
- **Railway** (full-stack platform)
- **Heroku** (classic choice)
- **AWS/GCP/Azure** (enterprise)

## 📊 Monitoring & Logging

- Request logging with Morgan
- Error tracking and reporting
- Performance monitoring
- Health check endpoint at `/health`

## 🤝 Contributing

1. Follow TypeScript best practices
2. Add tests for new features
3. Update API documentation
4. Follow existing code style
5. Validate with existing schemas