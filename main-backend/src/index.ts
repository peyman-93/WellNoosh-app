import dotenv from 'dotenv';
import path from 'path';

// Load environment variables FIRST, before any other imports
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import { authRoutes } from './routes/auth';
import { userRoutes } from './routes/users';
import { recipeRoutes } from './routes/recipes';
import { healthRoutes } from './routes/health';
import { mealPlanRoutes } from './routes/mealPlans';
import { nutritionRoutes } from './routes/nutrition';

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:19006'],
  credentials: true
}));

// General middleware
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use(rateLimiter);

// Health check endpoint (public - no auth required)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'WellNoosh BFF API',
    version: '1.0.0'
  });
});

// API health check (also public)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'WellNoosh BFF API',
    version: '1.0.0'
  });
});

// Email confirmation handler (public - no auth required)
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Email Confirmed - WellNoosh</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
          margin: 0; 
          padding: 40px 20px; 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .container { 
          background: white; 
          padding: 40px; 
          border-radius: 16px; 
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          text-align: center; 
          max-width: 400px;
          width: 100%;
        }
        .success { color: #059669; font-size: 48px; margin-bottom: 20px; }
        h1 { color: #111827; margin-bottom: 16px; font-size: 24px; }
        p { color: #6b7280; line-height: 1.6; margin-bottom: 24px; }
        .button { 
          background: #2563eb; 
          color: white; 
          padding: 12px 24px; 
          border-radius: 8px; 
          text-decoration: none; 
          display: inline-block;
          font-weight: 600;
          transition: background 0.2s;
        }
        .button:hover { background: #1d4ed8; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="success">✅</div>
        <h1>Email Confirmed!</h1>
        <p>Your WellNoosh account has been successfully confirmed. You can now close this page and return to the app to sign in.</p>
        <p><strong>Next steps:</strong></p>
        <ol style="text-align: left; color: #6b7280;">
          <li>Return to the WellNoosh app</li>
          <li>Sign in with your email and password</li>
          <li>Start tracking your wellness journey!</li>
        </ol>
      </div>
      <script>
        // Auto-close after 5 seconds if opened in a popup
        setTimeout(() => {
          if (window.opener) {
            window.close();
          }
        }, 5000);
      </script>
    </body>
    </html>
  `);
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/meal-plans', mealPlanRoutes);
app.use('/api/nutrition', nutritionRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server  
const server = app.listen(PORT, () => {
  console.log(`🚀 WellNoosh BFF API running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
});

server.on('listening', () => {
  const addr = server.address();
  console.log('🎯 Server listening on:', addr);
});