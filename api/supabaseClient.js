require("dotenv").config();

let cachedClient = null;
let cachedServiceClient = null;

async function getSupabaseClient() {
  if (cachedClient) return cachedClient;
  const { createClient } = await import("@supabase/supabase-js");
  const url = process.env.SUPABASE_URL;
  const anonKey =
    process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY;
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

async function getSupabaseServiceClient() {
  if (cachedServiceClient) return cachedServiceClient;
  const { createClient } = await import("@supabase/supabase-js");
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY env vars");
  }
  cachedServiceClient = createClient(url, serviceKey, {
    auth: {
      persistSession: false,
    },
  });
  return cachedServiceClient;
}

module.exports = { getSupabaseClient, getSupabaseServiceClient };
