import { supabaseAdmin } from '../config/supabase';

async function checkAuthUser() {
  try {
    const userId = 'a4d69e9c-e2ed-4cff-b839-98903a4a3888';
    console.log('🔍 Checking if user exists in auth.users...');
    console.log('👤 User ID:', userId);
    
    // Try to get the user from auth.users
    const { data: user, error } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    if (error) {
      console.error('❌ Error fetching user:', error);
      return;
    }
    
    if (user && user.user) {
      console.log('✅ User found in auth.users:');
      console.log('   Email:', user.user.email);
      console.log('   Created:', user.user.created_at);
      console.log('   Metadata:', JSON.stringify(user.user.user_metadata, null, 2));
    } else {
      console.log('❌ User not found in auth.users');
    }
    
    // Also try direct SQL query
    console.log('\n🔍 Checking with direct SQL query...');
    const { data: sqlResult, error: sqlError } = await supabaseAdmin
      .from('auth.users')
      .select('id, email, created_at')
      .eq('id', userId)
      .single();
      
    if (sqlError) {
      console.error('❌ SQL query error:', sqlError);
    } else if (sqlResult) {
      console.log('✅ User found via SQL:', sqlResult);
    } else {
      console.log('❌ User not found via SQL');
    }
    
  } catch (error) {
    console.error('❌ Error checking auth user:', error);
  }
}

// If called directly from command line
if (require.main === module) {
  checkAuthUser()
    .then(() => {
      console.log('\n✅ Auth user check completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Check failed:', error);
      process.exit(1);
    });
}