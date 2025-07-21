import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: require('path').resolve(__dirname, '../../../.env') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

// Create admin client with service key
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function checkUserProfile(userId: string): Promise<void> {
  try {
    console.log(`🔍 Checking user profile for ID: ${userId}`);
    
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!data) {
      console.log('❌ No user profile found in user_profiles table');
      console.log('📝 User data is only stored in auth.users.user_metadata');
    } else {
      console.log('✅ User profile found in user_profiles table:');
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('❌ Error checking user profile:', error);
    throw error;
  }
}

// If called directly from command line
if (require.main === module) {
  const userId = process.argv[2];
  if (!userId) {
    console.error('Usage: ts-node checkUserProfile.ts <user-id>');
    process.exit(1);
  }

  checkUserProfile(userId)
    .then(() => {
      console.log('User profile check completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to check user profile:', error);
      process.exit(1);
    });
}