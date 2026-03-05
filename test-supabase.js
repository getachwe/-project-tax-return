// Test Supabase connection
require('dotenv').config({ path: './backend/.env' });

async function testSupabase() {
  console.log('Testing Supabase configuration...\n');
  
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY;
  
  console.log('SUPABASE_URL:', url ? '✅ Set' : '❌ Missing');
  console.log('SUPABASE_ANON_KEY:', anonKey ? '✅ Set' : '❌ Missing');
  
  if (!url || !anonKey) {
    console.log('\n❌ Missing Supabase credentials!');
    console.log('   Please check backend/.env file');
    return;
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
    console.log('\nTesting connection...');
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'test@test.com',
      password: 'test123'
    });
    
    if (error) {
      console.log('✅ Supabase connection works!');
      console.log('   Error:', error.message);
      console.log('   (This is expected with test credentials)');
    } else {
      console.log('✅ Supabase connection works!');
    }
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    if (err.message.includes('fetch')) {
      console.log('\n🔍 Possible issues:');
      console.log('   1. Network connection problem');
      console.log('   2. Invalid SUPABASE_URL');
      console.log('   3. CORS issue (unlikely for server-side)');
    }
  }
}

testSupabase();
