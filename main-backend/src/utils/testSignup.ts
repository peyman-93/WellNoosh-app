import { supabase } from '../config/supabase';

async function testSignup() {
  try {
    console.log('🧪 Testing signup process...');
    
    // Test user data
    const testUser = {
      email: 'test-user-' + Date.now() + '@example.com',
      password: 'testpassword123',
      fullName: 'Test User',
      country: 'Spain',
      city: 'Barcelona', 
      postalCode: '08001'
    };
    
    console.log('📧 Creating user with email:', testUser.email);
    
    // Sign up with Supabase
    const { data, error } = await supabase.auth.signUp({
      email: testUser.email,
      password: testUser.password,
      options: {
        data: {
          full_name: testUser.fullName,
          country: testUser.country,
          city: testUser.city,
          postal_code: testUser.postalCode
        }
      }
    });

    if (error) {
      console.error('❌ Supabase signup error:', error);
      return;
    }

    console.log('✅ User created in Supabase auth');
    console.log('User ID:', data.user?.id);
    console.log('Session exists:', !!data.session);
    
    if (data.user && data.session) {
      // Test profile creation via API
      console.log('🔄 Testing profile creation via API...');
      
      const profileResponse = await fetch('http://localhost:3000/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${data.session.access_token}`
        },
        body: JSON.stringify({
          userId: data.user.id,
          fullName: testUser.fullName,
          email: testUser.email,
          country: testUser.country,
          city: testUser.city,
          postalCode: testUser.postalCode
        })
      });
      
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        console.log('✅ Profile created successfully:', JSON.stringify(profileData, null, 2));
      } else {
        const errorText = await profileResponse.text();
        console.error('❌ Profile creation failed:', profileResponse.status, errorText);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// If called directly from command line
if (require.main === module) {
  testSignup()
    .then(() => {
      console.log('Test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}