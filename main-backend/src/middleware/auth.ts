import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';
import { createError } from './errorHandler';

// Extend Request type to include user and user-specific supabase client
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role?: string;
      };
      supabaseUser?: any; // User-specific Supabase client
    }
  }
}

export const authenticateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createError('Access token required', 401);
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Check for mock token for testing
    if (token === 'mock-jwt-token-for-testing') {
      req.user = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@wellnoosh.com',
        role: 'user'
      };
      next();
      return;
    }

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      throw createError('Invalid or expired token', 401);
    }

    // Create user-specific Supabase client with their session
    const userSupabase = createClient(
      process.env.EXPO_PUBLIC_SUPABASE_URL!,
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    );

    // Add user info and client to request
    req.user = {
      id: user.id,
      email: user.email || '',
      role: user.user_metadata?.role || 'user'
    };
    req.supabaseUser = userSupabase;

    next();
  } catch (error) {
    next(error);
  }
};

export const requireAuth = authenticateUser;

export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (!error && user) {
        req.user = {
          id: user.id,
          email: user.email || '',
          role: user.user_metadata?.role || 'user'
        };
      }
    }

    next();
  } catch (error) {
    // For optional auth, continue even if token is invalid
    next();
  }
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const userRole = req.user.role || 'user';
    
    if (!roles.includes(userRole)) {
      throw createError('Insufficient permissions', 403);
    }

    next();
  };
};