#!/usr/bin/env node

// Simple script to test Supabase configuration
// Run with: node debug-supabase.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('=== SUPABASE CONFIG DEBUG ===');
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key (first 10 chars):', supabaseKey?.substring(0, 10) + '...');
console.log('Supabase Key exists:', !!supabaseKey);
console.log('Environment variables loaded:', !!process.env.EXPO_PUBLIC_SUPABASE_URL);

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('\n=== TESTING CONNECTION ===');
    
    // Test basic connection
    const { data, error } = await supabase.from('_supabase_admin').select('*').limit(1);
    console.log('Connection test result:', error ? 'Failed' : 'Success');
    
    if (error) {
      console.log('Connection error (this is expected for permissions):', error.message);
    }
    
    // Test auth configuration
    console.log('\n=== TESTING AUTH CONFIG ===');
    const testEmail = 'test-config@example.com';
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: 'test123456',
    });
    
    if (authError) {
      console.log('Auth test error:', authError.message);
      console.log('Status:', authError.status);
      
      if (authError.message.includes('invalid')) {
        console.log('\n❌ EMAIL VALIDATION ISSUE CONFIRMED');
        console.log('This suggests Supabase has email restrictions configured.');
        console.log('Check your Supabase dashboard: Authentication → Settings → General');
      }
      
      if (authError.message.includes('rate limit')) {
        console.log('\n⏱️ RATE LIMITING DETECTED');
        console.log('Too many signup attempts. Wait a few minutes.');
      }
    } else {
      console.log('✅ Auth test successful - user created or already exists');
      console.log('User:', authData.user?.email);
    }
    
  } catch (err) {
    console.error('Test failed:', err.message);
  }
}

testConnection();