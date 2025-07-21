import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: require('path').resolve(__dirname, '../../../.env') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Create regular client (like the frontend uses)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function testSignIn(email: string, password: string): Promise<void> {
  try {
    console.log(`🔐 Testing sign-in for: ${email}`);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('❌ Sign-in failed:', error.message);
      return;
    }

    if (data.user && data.session) {
      console.log('✅ Sign-in successful!');
      console.log('User ID:', data.user.id);
      console.log('Email:', data.user.email);
      console.log('Access token:', data.session.access_token.substring(0, 20) + '...');
      console.log('User metadata:', JSON.stringify(data.user.user_metadata, null, 2));
    } else {
      console.log('⚠️ Sign-in returned no session');
    }
  } catch (error) {
    console.error('❌ Error testing sign-in:', error);
    throw error;
  }
}

// If called directly from command line
if (require.main === module) {
  const email = process.argv[2];
  const password = process.argv[3];
  
  if (!email || !password) {
    console.error('Usage: ts-node testSignIn.ts <email> <password>');
    process.exit(1);
  }

  testSignIn(email, password)
    .then(() => {
      console.log('Sign-in test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to test sign-in:', error);
      process.exit(1);
    });
}