const express = require("express");
const router = express.Router();
const { getSupabaseClient } = require("../supabaseClient");
const { getBearerToken } = require("../utils/authHelpers");

router.post("/signup", async (req, res) => {
  try {
    const supabase = await getSupabaseClient();
    const { email, password, data } = req.body || {};
    if (!email || !password)
      return res.status(400).json({ error: "email and password are required" });
    const { data: signUpData, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: data || {} },
    });
    if (error) return res.status(400).json({ error: error.message });
    res.json(signUpData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/signin", async (req, res) => {
  try {
    console.log("=== Sign In Request ===");
    console.log("Request body:", req.body);
    console.log("Request headers:", req.headers);
    
    const supabase = await getSupabaseClient();
    const { email, password } = req.body || {};
    
    console.log("Email:", email ? "provided" : "missing");
    console.log("Password:", password ? "provided" : "missing");
    
    if (!email || !password) {
      console.log("Validation failed: missing email or password");
      return res.status(400).json({ error: "email and password are required" });
    }
    
    console.log("Attempting Supabase sign in...");
    const { data: signInData, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error("Supabase sign in error:", error);
      console.error("Error message:", error.message);
      return res.status(400).json({ error: error.message });
    }
    
    console.log("Sign in successful");
    res.json(signInData);
  } catch (err) {
    console.error("Sign in route error:", err);
    console.error("Error stack:", err.stack);
    res.status(500).json({ error: err.message, stack: process.env.NODE_ENV === "development" ? err.stack : undefined });
  }
});

router.get("/me", async (req, res) => {
  try {
    const supabase = await getSupabaseClient();
    const token = getBearerToken(req);
    if (!token) return res.status(401).json({ error: "missing bearer token" });
    const { data, error } = await supabase.auth.getUser(token);
    if (error) return res.status(401).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/resend-confirmation", async (req, res) => {
  try {
    const supabase = await getSupabaseClient();
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: "email is required" });
    const { data, error } = await supabase.auth.resend({
      type: "signup",
      email,
    });
    if (error) return res.status(400).json({ error: error.message });
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const supabase = await getSupabaseClient();
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: "email is required" });
    const { data, error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) return res.status(400).json({ error: error.message });
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Google OAuth routes
router.get("/google", async (req, res) => {
  try {
    const supabase = await getSupabaseClient();

    // Determine the correct redirect URL based on the request origin
    // IMPORTANT: This MUST match exactly what's configured in Supabase Dashboard
    let redirectTo;

    // Check if FRONTEND_URL is set (production)
    if (process.env.FRONTEND_URL) {
      redirectTo = `${process.env.FRONTEND_URL}/auth/callback`;
    } else {
      // For local development, ALWAYS use localhost:5173
      // This ensures it matches what's configured in Supabase Dashboard
      redirectTo = "http://localhost:5173/auth/callback";
    }

    // Normalize the URL (remove trailing slash if present)
    redirectTo = redirectTo.replace(/\/$/, "");
    if (!redirectTo.endsWith("/auth/callback")) {
      redirectTo = `${redirectTo}/auth/callback`;
    }

    console.log("=== Google OAuth Configuration ===");
    console.log("redirectTo:", redirectTo);
    console.log(
      "FRONTEND_URL env:",
      process.env.FRONTEND_URL || "(not set - using localhost:5173)"
    );
    console.log(
      "IMPORTANT: Make sure this URL is configured in Supabase Dashboard:"
    );
    console.log("  → Authentication → URL Configuration → Redirect URLs");
    console.log("  → Add:", redirectTo);
    console.log("===================================");

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectTo,
        queryParams: {
          // Add any additional query params if needed
        },
      },
    });

    if (error) {
      console.error("Supabase OAuth error:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      return res.status(400).json({
        error: error.message,
        redirectTo: redirectTo,
        hint: "Make sure this redirectTo URL is configured in Supabase Dashboard → Authentication → URL Configuration → Redirect URLs",
      });
    }

    console.log("Google OAuth URL generated successfully");
    res.json({ url: data.url, redirectTo: redirectTo });
  } catch (err) {
    console.error("Google OAuth route error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/google/callback", async (req, res) => {
  try {
    const supabase = await getSupabaseClient();
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: "Authorization code is required" });
    }

    const { data, error } = await supabase.auth.exchangeCodeForSession({
      auth_code: code,
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
