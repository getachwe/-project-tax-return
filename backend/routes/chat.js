const express = require("express");
const router = express.Router();
const { getSupabaseClient, getSupabaseServiceClient } = require("../supabaseClient");
const { getBearerToken } = require("../utils/authHelpers");
const {
  buildAuthenticatedContext,
  buildGuestContext,
} = require("../services/chatContextBuilder");
const {
  generateChatReply,
  isChatLlmEnabled,
} = require("../services/chatAiService");
const {
  resolveConversation,
  verifyConversation,
  fetchRecentMessages,
  appendExchange,
} = require("../services/chatHistoryService");
const { normalizeChatCategory } = require("../services/chatCategory");
const { stripClarifyTokenForDisplay } = require("../services/chatClarification");

const MAX_MESSAGE_LEN = 2000;

/** טבלאות צ'אט עדיין לא נוצרו ב-Supabase — ממשיכים בלי היסטוריה/שמירה */
function isChatDbUnavailableError(err) {
  const m = String(err?.message || err || "");
  return (
    /chat_conversations|chat_messages/i.test(m) &&
    (/schema cache|could not find|does not exist|relation/i.test(m) ||
      /not find the table/i.test(m))
  );
}

function sanitizeMessage(body) {
  const raw = body && typeof body.message === "string" ? body.message : "";
  const trimmed = raw.trim().slice(0, MAX_MESSAGE_LEN);
  return trimmed;
}

function optionalUuid(body, key) {
  const v = body && body[key];
  if (v == null || v === "") return null;
  if (typeof v !== "string") return null;
  return v.trim() || null;
}

function parseMaxReports(body) {
  const v = body && body.maxReports;
  if (v == null || v === "") return undefined;
  const n = Number(v);
  if (!Number.isFinite(n)) return undefined;
  return Math.floor(n);
}

function parseChatCategory(body) {
  const v = body && body.category;
  if (v == null || v === "") return undefined;
  if (typeof v !== "string") return undefined;
  return normalizeChatCategory(v.trim()) || undefined;
}

/** אימות משתמש — מחזיר user או null */
async function tryGetUser(req) {
  const token = getBearerToken(req);
  if (!token) return null;
  const supabase = await getSupabaseClient();
  const { data: userData, error } = await supabase.auth.getUser(token);
  if (error || !userData?.user?.id) return null;
  return userData.user;
}

// POST /api/chat  { message, conversationId?, guestSessionId? }  Bearer אופציונלי
router.post("/chat", async (req, res) => {
  try {
    const message = sanitizeMessage(req.body);
    if (!message) {
      return res.status(400).json({ error: "message is required" });
    }

    const user = await tryGetUser(req);
    const userId = user?.id ?? null;
    const conversationIdIn = optionalUuid(req.body, "conversationId");
    const guestSessionIdIn = optionalUuid(req.body, "guestSessionId");

    const service = await getSupabaseServiceClient();

    let resolved = null;
    let historyMessages = [];
    let chatDbAvailable = true;

    try {
      resolved = await resolveConversation(service, {
        userId,
        conversationId: conversationIdIn,
        guestSessionId: userId ? null : guestSessionIdIn,
      });
      historyMessages = await fetchRecentMessages(
        service,
        resolved.conversationId
      );
    } catch (e) {
      if (e.message === "conversation_forbidden") {
        return res.status(403).json({ error: "conversation_forbidden" });
      }
      if (e.message === "guestSessionId_required") {
        return res.status(400).json({ error: "guestSessionId_required" });
      }
      if (isChatDbUnavailableError(e)) {
        console.warn(
          "[chat] Chat tables missing — stateless mode. Run supabase/chat_tables.sql in Supabase SQL Editor.",
          e.message
        );
        chatDbAvailable = false;
        resolved = null;
        historyMessages = [];
      } else {
        throw e;
      }
    }

    const maxReportsOpt = parseMaxReports(req.body);
    const categoryHint = parseChatCategory(req.body);
    const wantStream =
      req.body.stream === true ||
      req.body.stream === 1 ||
      req.body.stream === "1" ||
      req.body.stream === "true";

    let contextObject;
    if (userId) {
      contextObject = await buildAuthenticatedContext(
        service,
        userId,
        maxReportsOpt !== undefined ? { maxReports: maxReportsOpt } : {},
      );
    } else {
      contextObject = buildGuestContext();
    }

    const runGenerate = (onStreamDelta) =>
      generateChatReply({
        userMessage: message,
        contextObject,
        historyMessages,
        chatCategory: categoryHint ?? null,
        ...(onStreamDelta ? { onStreamDelta } : {}),
      });

    if (wantStream) {
      res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");
      if (typeof res.flushHeaders === "function") {
        res.flushHeaders();
      }

      const writeSse = (event, data) => {
        res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      };

      let result;
      try {
        result = await runGenerate((chunk) =>
          writeSse("delta", { t: chunk }),
        );
      } catch (genErr) {
        console.error("[chat] stream generate:", genErr);
        writeSse("error", {
          message: genErr.message || "chat failed",
        });
        res.end();
        return;
      }

      if (resolved && chatDbAvailable) {
        try {
          const assistantPersist =
            result.persistedReply != null
              ? result.persistedReply
              : result.reply;
          await appendExchange(
            service,
            resolved.conversationId,
            message,
            assistantPersist,
          );
        } catch (persistErr) {
          console.error("[chat] persist messages:", persistErr.message);
        }
      }

      const reportsLoadedStream =
        contextObject.mode === "authenticated"
          ? contextObject.reports?.length ?? 0
          : 0;

      writeSse("done", {
        reply: result.reply,
        mode: result.mode,
        category: result.category,
        needsClarification: !!result.needsClarification,
        ...(Array.isArray(result.suggestedFollowUps) &&
        result.suggestedFollowUps.length
          ? { suggestedFollowUps: result.suggestedFollowUps }
          : {}),
        intentConfidence:
          result.intentConfidence != null ? result.intentConfidence : undefined,
        chatDbAvailable,
        reportsInContext: reportsLoadedStream,
        ...(resolved && chatDbAvailable
          ? {
              conversationId: resolved.conversationId,
              guestSessionId: resolved.guestSessionId || undefined,
            }
          : {}),
        disclaimer:
          result.mode === "personalized"
            ? "התשובות מבוססות על הנתונים השמורים בחשבון שלך (עד כמה דוחות אחרונים לפי ההגדרות)."
            : "התשובות כלליות בלבד — ללא נתונים אישיים.",
        engine: result.engine,
        chatLlmAvailable: isChatLlmEnabled(),
      });
      res.end();
      return;
    }

    const result = await runGenerate();

    if (resolved && chatDbAvailable) {
      try {
        const assistantPersist =
          result.persistedReply != null
            ? result.persistedReply
            : result.reply;
        await appendExchange(
          service,
          resolved.conversationId,
          message,
          assistantPersist,
        );
      } catch (persistErr) {
        console.error("[chat] persist messages:", persistErr.message);
      }
    }

    const reportsLoaded =
      contextObject.mode === "authenticated"
        ? contextObject.reports?.length ?? 0
        : 0;

    res.json({
      reply: result.reply,
      mode: result.mode,
      category: result.category,
      needsClarification: !!result.needsClarification,
      ...(Array.isArray(result.suggestedFollowUps) &&
      result.suggestedFollowUps.length
        ? { suggestedFollowUps: result.suggestedFollowUps }
        : {}),
      intentConfidence:
        result.intentConfidence != null ? result.intentConfidence : undefined,
      chatDbAvailable,
      reportsInContext: reportsLoaded,
      ...(resolved && chatDbAvailable
        ? {
            conversationId: resolved.conversationId,
            guestSessionId: resolved.guestSessionId || undefined,
          }
        : {}),
      disclaimer:
        result.mode === "personalized"
          ? "התשובות מבוססות על הנתונים השמורים בחשבון שלך (עד כמה דוחות אחרונים לפי ההגדרות)."
          : "התשובות כלליות בלבד — ללא נתונים אישיים.",
      engine: result.engine,
      /** true רק כש-OPENAI_API_KEY מוגדר ו-CHAT_LLM_ENABLED לא כבוי */
      chatLlmAvailable: isChatLlmEnabled(),
    });
  } catch (err) {
    console.error("[chat]", err);
    res.status(500).json({ error: err.message || "chat failed" });
  }
});

function optionalUuidQuery(q, key) {
  const v = q && q[key];
  if (v == null || v === "") return null;
  if (typeof v !== "string") return null;
  return v.trim() || null;
}

// GET /api/chat/messages?conversationId=&guestSessionId=  (Bearer אופציונלי)
router.get("/chat/messages", async (req, res) => {
  try {
    const conversationId = optionalUuidQuery(req.query, "conversationId");
    if (!conversationId) {
      return res.status(400).json({ error: "conversationId is required" });
    }

    const user = await tryGetUser(req);
    const userId = user?.id ?? null;
    const guestSessionId = userId
      ? null
      : optionalUuidQuery(req.query, "guestSessionId");

    if (!userId && !guestSessionId) {
      return res.status(400).json({ error: "guestSessionId is required" });
    }

    const service = await getSupabaseServiceClient();
    let v;
    try {
      v = await verifyConversation(
        service,
        conversationId,
        userId,
        guestSessionId
      );
    } catch (err) {
      if (isChatDbUnavailableError(err)) {
        return res.json({
          messages: [],
          chatDbAvailable: false,
        });
      }
      throw err;
    }
    if (!v.ok) {
      return res
        .status(v.reason === "forbidden" ? 403 : 404)
        .json({ error: v.reason || "invalid" });
    }

    let rows;
    try {
      rows = await fetchRecentMessages(service, conversationId);
    } catch (err) {
      if (isChatDbUnavailableError(err)) {
        return res.json({
          messages: [],
          chatDbAvailable: false,
        });
      }
      throw err;
    }
    res.json({
      messages: rows.map((m) => ({
        role: m.role,
        content:
          m.role === "assistant"
            ? stripClarifyTokenForDisplay(m.content)
            : m.content,
      })),
      chatDbAvailable: true,
    });
  } catch (err) {
    console.error("[chat/messages]", err);
    res.status(500).json({ error: err.message || "failed" });
  }
});

module.exports = router;
