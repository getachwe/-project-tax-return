const express = require("express");
const router = express.Router();
const { getSupabaseClient } = require("../supabaseClient");
const { getBearerToken } = require("../utils/authHelpers");

router.post("/", async (req, res) => {
  try {
    const supabase = await getSupabaseClient();
    const token = getBearerToken(req);
    if (!token) return res.status(401).json({ error: "missing bearer token" });
    const { data: userData, error: userError } = await supabase.auth.getUser(
      token
    );
    if (userError) return res.status(401).json({ error: userError.message });
    const { taxData, calculationResult } = req.body;
    if (!taxData || !calculationResult) {
      return res
        .status(400)
        .json({ error: "taxData and calculationResult are required" });
    }
    const { data, error } = await supabase
      .from("tax_calculations")
      .insert({
        user_id: userData.user.id,
        tax_data: taxData,
        calculation_result: calculationResult,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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
      .from("tax_calculations")
      .select("*")
      .eq("user_id", userData.user.id)
      .order("created_at", { ascending: false });
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
