import { supabase } from '../services/supabase'

/**
 * Debug utility to test Supabase connection and configuration
 */
export const debugSupabase = async () => {
  try {
    console.log('🔍 Testing Supabase connection...')
    
    // Test 1: Check if environment variables are loaded
    console.log('📝 Environment variables:')
    console.log('SUPABASE_URL:', process.env.EXPO_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing')
    console.log('SUPABASE_ANON_KEY:', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing')
    
    // Test 2: Check Supabase client initialization
    console.log('🔧 Supabase client:', supabase ? '✅ Initialized' : '❌ Failed to initialize')
    
    // Test 3: Test basic connection
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    console.log('🔐 Current session:', session ? '✅ Active session found' : '📝 No active session')
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError)
    }
    
    // Test 4: Test anonymous connection
    const { data, error } = await supabase.from('_realtime').select('*').limit(1)
    
    if (error) {
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        console.log('🌐 Connection test: ✅ Successfully connected to Supabase!')
        console.log('📝 Note: The "table does not exist" error is expected - it confirms your connection is working!')
      } else if (error.message.includes('Invalid API key')) {
        console.error('❌ Invalid API key - check your SUPABASE_ANON_KEY')
      } else if (error.message.includes('NetworkError')) {
        console.error('❌ Network error - check your internet connection')
      } else {
        console.error('❌ Unexpected error:', error)
      }
    } else {
      console.log('🌐 Connection test: ✅ Connected to Supabase')
    }
    
    console.log('✨ Supabase debug check complete!')
    
  } catch (error) {
    console.error('💥 Debug failed:', error)
  }
}

/**
 * Helper to check if Supabase is properly configured
 */
export const isSupabaseConfigured = (): boolean => {
  return !!(
    process.env.EXPO_PUBLIC_SUPABASE_URL && 
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY &&
    supabase
  )
}

/**
 * Get current auth status
 */
export const getAuthStatus = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    return {
      isAuthenticated: !!session,
      user: session?.user || null,
      error
    }
  } catch (error) {
    return {
      isAuthenticated: false,
      user: null,
      error
    }
  }
}