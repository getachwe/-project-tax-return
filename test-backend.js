// Quick test script to check if backend is working
const http = require('http');

console.log('Testing backend connection...\n');

// Test health endpoint
const healthOptions = {
  hostname: 'localhost',
  port: 4000,
  path: '/health',
  method: 'GET'
};

const healthReq = http.request(healthOptions, (res) => {
  console.log(`Health check: Status ${res.statusCode}`);
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('Response:', data);
    console.log('\n---\n');
    testSignIn();
  });
});

healthReq.on('error', (e) => {
  console.error('Health check failed:', e.message);
  console.log('\n❌ Backend is not running or not accessible!');
  console.log('   Please run: cd backend && node server.js');
});

healthReq.end();

// Test signin endpoint
function testSignIn() {
  const signInOptions = {
    hostname: 'localhost',
    port: 4000,
    path: '/api/auth/signin',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const signInReq = http.request(signInOptions, (res) => {
    console.log(`Sign in test: Status ${res.statusCode}`);
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      console.log('Response:', data);
      try {
        const parsed = JSON.parse(data);
        if (parsed.error) {
          console.log('\n✅ Backend is responding!');
          console.log('   Error:', parsed.error);
          console.log('   This is expected - we sent test credentials.');
        } else {
          console.log('\n✅ Backend is working!');
        }
      } catch (e) {
        console.log('\n✅ Backend is responding!');
      }
    });
  });

  signInReq.on('error', (e) => {
    console.error('Sign in test failed:', e.message);
  });

  signInReq.write(JSON.stringify({
    email: 'test@test.com',
    password: 'test123'
  }));
  signInReq.end();
}
