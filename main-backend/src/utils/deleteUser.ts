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

export async function deleteUser(userIdOrEmail: string): Promise<void> {
  try {
    let userId = userIdOrEmail;
    
    // If it looks like an email, find the user ID first
    if (userIdOrEmail.includes('@')) {
      console.log(`🔍 Looking up user by email: ${userIdOrEmail}`);
      
      const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (listError) {
        throw listError;
      }
      
      const user = users.users.find(u => u.email === userIdOrEmail);
      
      if (!user) {
        throw new Error(`No user found with email: ${userIdOrEmail}`);
      }
      
      userId = user.id;
      console.log(`📋 Found user ID: ${userId}`);
    }

    console.log(`🗑️ Deleting user: ${userId}`);
    
    // First delete from user_profiles if exists
    try {
      const { error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .delete()
        .eq('id', userId);
      
      if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = no rows found
        console.log('⚠️ Error deleting profile:', profileError);
      } else {
        console.log('✅ User profile deleted (if existed)');
      }
    } catch (error) {
      console.log('⚠️ Profile deletion error (might not exist):', error);
    }
    
    // Delete from auth.users
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) {
      throw error;
    }

    console.log(`✅ User ${userId} deleted successfully from auth.users`);
  } catch (error) {
    console.error('❌ Error deleting user:', error);
    throw error;
  }
}

// If called directly from command line
if (require.main === module) {
  const userIdOrEmail = process.argv[2];
  if (!userIdOrEmail) {
    console.error('Usage: ts-node deleteUser.ts <user-id-or-email>');
    console.error('Examples:');
    console.error('  ts-node deleteUser.ts user@example.com');
    console.error('  ts-node deleteUser.ts 12345678-1234-1234-1234-123456789012');
    process.exit(1);
  }

  deleteUser(userIdOrEmail)
    .then(() => {
      console.log('User deletion completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to delete user:', error);
      process.exit(1);
    });
}