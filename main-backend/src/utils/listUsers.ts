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

export async function listUsers(): Promise<void> {
  try {
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();

    if (error) {
      throw error;
    }

    console.log(`📋 Found ${users.length} users:`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`);
      console.log(`   Created: ${user.created_at}`);
      console.log(`   Last sign in: ${user.last_sign_in_at || 'Never'}`);
      console.log('');
    });
  } catch (error) {
    console.error('❌ Error listing users:', error);
    throw error;
  }
}

// If called directly from command line
if (require.main === module) {
  listUsers()
    .then(() => {
      console.log('User listing completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to list users:', error);
      process.exit(1);
    });
}