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
    const supabase = await getSupabaseClient();
    const { email, password } = req.body || {};
    if (!email || !password)
      return res.status(400).json({ error: "email and password are required" });
    const { data: signInData, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return res.status(400).json({ error: error.message });
    res.json(signInData);
  } catch (err) {
    res.status(500).json({ error: err.message });
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
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${
          process.env.FRONTEND_URL || "http://localhost:5173"
        }/auth/callback`,
      },
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ url: data.url });
  } catch (err) {
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
