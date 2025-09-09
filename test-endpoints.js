const axios = require("axios");

const BASE_URL = "http://localhost:4000";

async function testEndpoints() {
  console.log("🧪 Testing backend endpoints...\n");

  try {
    // Test 1: Health check
    console.log("1. Testing health endpoint...");
    const healthResponse = await axios.get(`${BASE_URL}/api/health`);
    console.log("✅ Health check:", healthResponse.data);
  } catch (error) {
    console.log("❌ Health check failed:", error.message);
  }

  try {
    // Test 2: Signup
    console.log("\n2. Testing signup endpoint...");
    const signupResponse = await axios.post(`${BASE_URL}/api/auth/signup`, {
      email: "test@example.com",
      password: "testpassword123",
    });
    console.log("✅ Signup successful:", signupResponse.data);
  } catch (error) {
    console.log("❌ Signup failed:", error.response?.data || error.message);
  }

  try {
    // Test 3: Signin
    console.log("\n3. Testing signin endpoint...");
    const signinResponse = await axios.post(`${BASE_URL}/api/auth/signin`, {
      email: "test@example.com",
      password: "testpassword123",
    });
    console.log("✅ Signin successful:", signinResponse.data);

    // Test 4: Me endpoint with token
    if (signinResponse.data.session?.access_token) {
      console.log("\n4. Testing /me endpoint...");
      const meResponse = await axios.get(`${BASE_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${signinResponse.data.session.access_token}`,
        },
      });
      console.log("✅ Me endpoint successful:", meResponse.data);
    }
  } catch (error) {
    console.log("❌ Signin/Me failed:", error.response?.data || error.message);
  }

  try {
    // Test 5: Tax calculation
    console.log("\n5. Testing tax calculation endpoint...");
    const calcResponse = await axios.post(`${BASE_URL}/api/calculate-tax`, {
      income: 100000,
      taxPaid: 15000,
      taxYear: 2023,
      maritalStatus: "single",
    });
    console.log("✅ Tax calculation successful:", calcResponse.data);
  } catch (error) {
    console.log(
      "❌ Tax calculation failed:",
      error.response?.data || error.message
    );
  }

  console.log("\n🏁 Testing completed!");
}

testEndpoints().catch(console.error);


