import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // Service key for backend operations
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('EXPO_PUBLIC_SUPABASE_URL is required');
}

if (!supabaseServiceKey && !supabaseAnonKey) {
  throw new Error('Either SUPABASE_SERVICE_KEY or EXPO_PUBLIC_SUPABASE_ANON_KEY is required');
}

// Service client for admin operations (full access)
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey || supabaseAnonKey!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Regular client for user operations
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey!,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true
    }
  }
);

export default supabase;