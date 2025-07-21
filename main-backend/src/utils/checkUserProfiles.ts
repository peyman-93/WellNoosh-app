import { supabase } from '../config/supabase';

async function checkUserProfiles() {
  try {
    console.log('🔍 Checking user profiles in database...');
    
    // Get all user profiles
    const { data: profiles, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('❌ Error fetching profiles:', error);
      return;
    }

    console.log(`📊 Found ${profiles?.length || 0} user profiles:`);
    
    if (profiles && profiles.length > 0) {
      profiles.forEach((profile, index) => {
        console.log(`\n👤 Profile ${index + 1}:`);
        console.log(`   ID: ${profile.id}`);
        console.log(`   Full Name: ${profile.full_name || 'NULL'}`);
        console.log(`   Country: ${profile.country || 'NULL'}`);
        console.log(`   City: ${profile.city || 'NULL'}`);
        console.log(`   Age: ${profile.age || 'NULL'}`);
        console.log(`   Weight: ${profile.weight || 'NULL'}`);
        console.log(`   Height: ${profile.height || 'NULL'}`);
        console.log(`   Diet Style: ${profile.diet_style || 'NULL'}`);
        console.log(`   Allergies: ${profile.allergies || 'NULL'}`);
        console.log(`   Created: ${profile.created_at}`);
      });
    } else {
      console.log('❌ No profiles found in database');
    }

    // Check auth.users table
    console.log('\n🔍 Checking recent auth users...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error fetching auth users:', authError);
      return;
    }

    const recentUsers = authUsers.users.slice(-3);
    console.log(`📊 Found ${recentUsers.length} recent auth users:`);
    
    recentUsers.forEach((user, index) => {
      console.log(`\n🔐 Auth User ${index + 1}:`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Metadata: ${JSON.stringify(user.user_metadata, null, 2)}`);
      console.log(`   Created: ${user.created_at}`);
    });

  } catch (error) {
    console.error('❌ Error checking user profiles:', error);
  }
}

// If called directly from command line
if (require.main === module) {
  checkUserProfiles()
    .then(() => {
      console.log('\n✅ Profile check completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to check profiles:', error);
      process.exit(1);
    });
}