const express = require("express");
const router = express.Router();
const { getSupabaseClient } = require("../supabaseClient");
const { getBearerToken } = require("../utils/authHelpers");

router.get("/", async (req, res) => {
  try {
    const supabase = await getSupabaseClient();
    const token = getBearerToken(req);
    if (!token) return res.status(401).json({ error: "missing bearer token" });
    const { data: userData, error: userError } = await supabase.auth.getUser(
      token
    );
    if (userError) return res.status(401).json({ error: userError.message });
    const { data, error } = await supabase
      .from("profiles")
      .select("id,email,first_name,last_name,updated_at,created_at")
      .eq("id", userData.user.id)
      .maybeSingle();
    if (error) return res.status(400).json({ error: error.message });
    res.json(data || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/", async (req, res) => {
  try {
    const supabase = await getSupabaseClient();
    const token = getBearerToken(req);
    if (!token) return res.status(401).json({ error: "missing bearer token" });
    const { data: userData, error: userError } = await supabase.auth.getUser(
      token
    );
    if (userError) return res.status(401).json({ error: userError.message });
    const { firstName, lastName } = req.body || {};
    const { data, error } = await supabase
      .from("profiles")
      .upsert(
        {
          id: userData.user.id,
          email: userData.user.email,
          first_name: firstName ?? null,
          last_name: lastName ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      )
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
