/**
 * היסטוריית צ'אט ב-Supabase (שירות backend בלבד — service role).
 */

const { randomUUID } = require("crypto");

const MAX_MESSAGES_LOAD = 40; // זוגות אחרונות בערך — מגבלת טוקנים

function isUuid(s) {
  return (
    typeof s === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s.trim())
  );
}

function normalizeGuestSessionId(raw) {
  if (!raw || typeof raw !== "string") return null;
  const t = raw.trim();
  if (!isUuid(t)) return null;
  return t;
}

/**
 * @param {import("@supabase/supabase-js").SupabaseClient} service
 */
async function verifyConversation(service, conversationId, userId, guestSessionId) {
  const { data: conv, error } = await service
    .from("chat_conversations")
    .select("id, user_id, guest_session_id")
    .eq("id", conversationId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!conv) return { ok: false, reason: "not_found" };

  if (userId) {
    if (conv.user_id !== userId) return { ok: false, reason: "forbidden" };
    return { ok: true, conversationId: conv.id };
  }

  if (!guestSessionId || conv.guest_session_id !== guestSessionId) {
    return { ok: false, reason: "forbidden" };
  }
  return { ok: true, conversationId: conv.id };
}

/**
 * @param {import("@supabase/supabase-js").SupabaseClient} service
 */
async function createConversation(service, { userId, guestSessionId }) {
  const row =
    userId != null
      ? { user_id: userId, guest_session_id: null }
      : { user_id: null, guest_session_id: guestSessionId };

  const { data, error } = await service
    .from("chat_conversations")
    .insert(row)
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return data.id;
}

/**
 * מחזיר guestSessionId חדש אם חסר (לאורח)
 * @param {import("@supabase/supabase-js").SupabaseClient} service
 */
async function resolveConversation(service, {
  userId,
  conversationId: rawConvoId,
  guestSessionId: rawGuestSid,
}) {
  const conversationId =
    rawConvoId && isUuid(String(rawConvoId)) ? String(rawConvoId).trim() : null;

  let guestSessionId = normalizeGuestSessionId(rawGuestSid);

  if (!userId) {
    if (conversationId && !guestSessionId) {
      throw new Error("guestSessionId_required");
    }
    if (!conversationId && !guestSessionId) {
      guestSessionId = randomUUID();
    }
  }

  if (conversationId) {
    const v = await verifyConversation(
      service,
      conversationId,
      userId,
      guestSessionId
    );
    if (v.ok) {
      return {
        conversationId: v.conversationId,
        guestSessionId: userId ? null : guestSessionId,
        created: false,
      };
    }
    if (v.reason === "forbidden") throw new Error("conversation_forbidden");
    // not_found — יוצרים שיחה חדשה (מזהה ישן או נמחק)
  }

  const id = await createConversation(service, {
    userId,
    guestSessionId: userId ? null : guestSessionId,
  });
  return {
    conversationId: id,
    guestSessionId: userId ? null : guestSessionId,
    created: true,
  };
}

/**
 * @param {import("@supabase/supabase-js").SupabaseClient} service
 */
async function fetchRecentMessages(service, conversationId) {
  const { data, error } = await service
    .from("chat_messages")
    .select("role, content, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(MAX_MESSAGES_LOAD);

  if (error) throw new Error(error.message);
  const rows = (data || []).reverse();
  return rows
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({ role: m.role, content: m.content }));
}

/**
 * @param {import("@supabase/supabase-js").SupabaseClient} service
 */
async function appendExchange(service, conversationId, userText, assistantText) {
  const { error: uErr } = await service.from("chat_messages").insert({
    conversation_id: conversationId,
    role: "user",
    content: userText,
  });
  if (uErr) throw new Error(uErr.message);

  const { error: aErr } = await service.from("chat_messages").insert({
    conversation_id: conversationId,
    role: "assistant",
    content: assistantText,
  });
  if (aErr) throw new Error(aErr.message);

  const now = new Date().toISOString();
  const { error: upErr } = await service
    .from("chat_conversations")
    .update({ updated_at: now })
    .eq("id", conversationId);
  if (upErr) throw new Error(upErr.message);
}

module.exports = {
  resolveConversation,
  verifyConversation,
  fetchRecentMessages,
  appendExchange,
  isUuid,
  normalizeGuestSessionId,
  MAX_MESSAGES_LOAD,
};
