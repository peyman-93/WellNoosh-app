import { createClient } from '@supabase/supabase-js'
import { Database } from '../types/database'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

// Use dummy values for development if no env vars are set
const url = supabaseUrl || 'https://placeholder.supabase.co'
const key = supabaseAnonKey || 'placeholder-key'

export const supabase = createClient<Database>(url, key, {
  auth: {
    storage: undefined, // Will be set up with SecureStore
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

// Export a flag to check if Supabase is properly configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey)