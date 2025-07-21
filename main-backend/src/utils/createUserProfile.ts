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

export async function createUserProfile(userId: string): Promise<void> {
  try {
    // First get user metadata from auth.users
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    if (authError || !authUser) {
      throw new Error(`User not found: ${authError?.message}`);
    }

    const metadata = authUser.user.user_metadata || {};
    
    console.log('📋 Creating user profile from metadata:', metadata);

    // Create user profile record
    const profileData = {
      id: userId,
      full_name: metadata.full_name || '',
      country: metadata.country || '',
      city: metadata.city || '',
      postal_code: metadata.postal_code || '',
      subscription_tier: 'free',
      daily_swipes_used: 0,
      last_swipe_date: new Date().toISOString().split('T')[0]
    };

    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .insert(profileData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    console.log('✅ User profile created successfully:');
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Error creating user profile:', error);
    throw error;
  }
}

// If called directly from command line
if (require.main === module) {
  const userId = process.argv[2];
  if (!userId) {
    console.error('Usage: ts-node createUserProfile.ts <user-id>');
    process.exit(1);
  }

  createUserProfile(userId)
    .then(() => {
      console.log('User profile creation completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to create user profile:', error);
      process.exit(1);
    });
}