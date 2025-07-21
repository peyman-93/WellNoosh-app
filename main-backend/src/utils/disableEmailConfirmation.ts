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

export async function disableEmailConfirmation(): Promise<void> {
  try {
    console.log('🔧 Attempting to disable email confirmation for development...');
    
    // This requires manual configuration in Supabase dashboard
    console.log('⚠️  MANUAL ACTION REQUIRED:');
    console.log('');
    console.log('1. Go to your Supabase dashboard:');
    console.log('   https://supabase.com/dashboard/project/hveaokuluelmpdntbcuq/auth/settings');
    console.log('');
    console.log('2. In the "Auth" section, find "Settings"');
    console.log('');
    console.log('3. Scroll down to "Email confirmation" and DISABLE it');
    console.log('');
    console.log('4. Save the changes');
    console.log('');
    console.log('Alternatively, you can auto-confirm users by running the confirmUser utility:');
    console.log('  npm run confirm-user <user-email>');
    console.log('');
    
    // We can also enable users who signed up but aren't confirmed
    console.log('🔍 Checking for unconfirmed users...');
    
    const { data: users, error } = await supabaseAdmin.auth.admin.listUsers();
    
    if (error) {
      console.error('❌ Error fetching users:', error);
      return;
    }
    
    const unconfirmedUsers = users.users.filter(user => !user.email_confirmed_at);
    
    if (unconfirmedUsers.length > 0) {
      console.log(`📋 Found ${unconfirmedUsers.length} unconfirmed user(s):`);
      unconfirmedUsers.forEach(user => {
        console.log(`  - ${user.email} (ID: ${user.id})`);
      });
      console.log('');
      console.log('To confirm these users, run:');
      unconfirmedUsers.forEach(user => {
        console.log(`  npm run confirm-user ${user.email}`);
      });
    } else {
      console.log('✅ No unconfirmed users found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

// If called directly from command line
if (require.main === module) {
  disableEmailConfirmation()
    .then(() => {
      console.log('Email confirmation check completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to check email confirmation:', error);
      process.exit(1);
    });
}