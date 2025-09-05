require("dotenv").config();

let cachedClient = null;

async function getSupabaseClient() {
  if (cachedClient) return cachedClient;
  const { createClient } = await import("@supabase/supabase-js");
  const url = process.env.SUPABASE_URL;
  const anonKey =
    process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anonKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_*_KEY env vars");
  }
  cachedClient = createClient(url, anonKey, {
    auth: {
      persistSession: false,
    },
  });
  return cachedClient;
}

module.exports = { getSupabaseClient };
