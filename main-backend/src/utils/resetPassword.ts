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

export async function resetUserPassword(email: string, newPassword: string): Promise<void> {
  try {
    // Find user by email first
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      throw listError;
    }

    const user = users.users.find(u => u.email === email);
    if (!user) {
      throw new Error(`User with email ${email} not found`);
    }

    // Update password
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password: newPassword
    });

    if (error) {
      throw error;
    }

    console.log(`✅ Password updated for user ${email} (ID: ${user.id})`);
  } catch (error) {
    console.error('❌ Error resetting password:', error);
    throw error;
  }
}

// If called directly from command line
if (require.main === module) {
  const email = process.argv[2];
  const newPassword = process.argv[3];
  
  if (!email || !newPassword) {
    console.error('Usage: ts-node resetPassword.ts <email> <new-password>');
    process.exit(1);
  }

  resetUserPassword(email, newPassword)
    .then(() => {
      console.log('Password reset completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to reset password:', error);
      process.exit(1);
    });
}