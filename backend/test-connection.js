// Test Supabase connection from backend directory
require('dotenv').config();

async function testSupabase() {
  console.log('Testing Supabase configuration from backend...\n');
  
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY;
  
  console.log('SUPABASE_URL:', url ? `${url.substring(0, 30)}...` : '❌ Missing');
  console.log('SUPABASE_ANON_KEY:', anonKey ? `${anonKey.substring(0, 20)}...` : '❌ Missing');
  
  if (!url || !anonKey) {
    console.log('\n❌ Missing Supabase credentials!');
    console.log('   Please check backend/.env file');
    process.exit(1);
  }
  
  console.log('\nAttempting to create Supabase client...');
  
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(url, anonKey, {
      auth: {
        persistSession: false,
      },
    });
    
    console.log('✅ Supabase client created successfully');
    
    // Try a simple query
    console.log('\nTesting connection with test credentials...');
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'test@test.com',
      password: 'test123'
    });
    
    if (error) {
      if (error.message.includes('fetch failed') || error.message.includes('Failed to fetch')) {
        console.log('\n❌ Network error connecting to Supabase!');
        console.log('   Error:', error.message);
        console.log('\n🔍 Possible causes:');
        console.log('   1. Invalid SUPABASE_URL - check it starts with https://');
        console.log('   2. Network/firewall blocking connection');
        console.log('   3. Supabase project is paused or deleted');
      } else if (error.message.includes('Invalid login credentials')) {
        console.log('\n✅ Supabase connection works!');
        console.log('   (Test credentials are invalid, which is expected)');
      } else {
        console.log('\n✅ Supabase connection works!');
        console.log('   Error:', error.message);
      }
    } else {
      console.log('✅ Supabase connection works!');
    }
    
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    if (err.message.includes('Cannot find package')) {
      console.log('\n🔍 Please run: npm install');
    }
    process.exit(1);
  }
}

testSupabase();
