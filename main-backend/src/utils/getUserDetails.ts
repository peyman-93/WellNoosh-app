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

export async function getUserDetails(userId: string): Promise<void> {
  try {
    const { data: user, error } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (error) {
      throw error;
    }

    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    console.log('👤 User Details:');
    console.log('ID:', user.user.id);
    console.log('Email:', user.user.email);
    console.log('Confirmed:', user.user.email_confirmed_at ? 'Yes' : 'No');
    console.log('Created:', user.user.created_at);
    console.log('Last sign in:', user.user.last_sign_in_at);
    console.log('');
    console.log('📝 User Metadata:');
    console.log(JSON.stringify(user.user.user_metadata, null, 2));
    console.log('');
    console.log('🔧 App Metadata:');
    console.log(JSON.stringify(user.user.app_metadata, null, 2));
  } catch (error) {
    console.error('❌ Error getting user details:', error);
    throw error;
  }
}

// If called directly from command line
if (require.main === module) {
  const userId = process.argv[2];
  if (!userId) {
    console.error('Usage: ts-node getUserDetails.ts <user-id>');
    process.exit(1);
  }

  getUserDetails(userId)
    .then(() => {
      console.log('User details retrieval completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to get user details:', error);
      process.exit(1);
    });
}