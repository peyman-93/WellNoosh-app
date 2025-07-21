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

export async function confirmUserEmail(userIdOrEmail: string): Promise<void> {
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

    console.log(`🔧 Confirming user: ${userId}`);
    
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      email_confirm: true
    });

    if (error) {
      throw error;
    }

    console.log(`✅ User ${userId} confirmed successfully`);
    console.log('User data:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Error confirming user:', error);
    throw error;
  }
}

// If called directly from command line
if (require.main === module) {
  const userIdOrEmail = process.argv[2];
  if (!userIdOrEmail) {
    console.error('Usage: ts-node confirmUser.ts <user-id-or-email>');
    console.error('Examples:');
    console.error('  ts-node confirmUser.ts user@example.com');
    console.error('  ts-node confirmUser.ts 12345678-1234-1234-1234-123456789012');
    process.exit(1);
  }

  confirmUserEmail(userIdOrEmail)
    .then(() => {
      console.log('User confirmation completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to confirm user:', error);
      process.exit(1);
    });
}