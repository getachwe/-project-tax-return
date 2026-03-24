import React, { useCallback, useEffect, useRef, useState } from "react";
import { MessageCircle, Send, Loader2, Bot, User } from "lucide-react";
import { apiChat, apiChatLoadMessages } from "../../utils/api";
import { renderChatMarkdown } from "../../utils/chatMessageFormat";
import { useI18n } from "../../i18n/useI18n";

type Msg = { role: "user" | "assistant"; text: string };

const LS_USER_CONV = "taxChat_user_conversationId";
const LS_GUEST_CONV = "taxChat_guest_conversationId";
const LS_GUEST_SID = "taxChat_guest_sessionId";

function getUserIdFromToken(raw: string | null): string | null {
  if (!raw) return null;
  try {
    const payload = JSON.parse(
      atob(raw.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
    );
    return typeof payload?.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

/** מזהה שיחה נפרד לכל משתמש מחובר — נשמר בין כניסות לעמוד העוזר */
function readStoredConversationId(isGuestUi: boolean): string | null {
  if (typeof window === "undefined") return null;
  if (isGuestUi) return localStorage.getItem(LS_GUEST_CONV);
  const token = localStorage.getItem("authToken");
  const sub = getUserIdFromToken(token);
  if (sub) {
    const scoped = `taxChat_conv_user_${sub}`;
    const v = localStorage.getItem(scoped);
    if (v) return v;
    const legacy = localStorage.getItem(LS_USER_CONV);
    if (legacy) {
      localStorage.setItem(scoped, legacy);
      localStorage.removeItem(LS_USER_CONV);
      return legacy;
    }
    return null;
  }
  return localStorage.getItem(LS_USER_CONV);
}

function persistUserConversationId(
  token: string | null,
  conversationId: string,
) {
  if (typeof window === "undefined") return;
  const sub = getUserIdFromToken(token);
  if (sub) {
    localStorage.setItem(`taxChat_conv_user_${sub}`, conversationId);
    localStorage.removeItem(LS_USER_CONV);
  } else {
    localStorage.setItem(LS_USER_CONV, conversationId);
  }
}

function clearChatLocalStorage(isGuestUi: boolean) {
  if (typeof window === "undefined") return;
  if (isGuestUi) {
    localStorage.removeItem(LS_GUEST_CONV);
    localStorage.removeItem(LS_GUEST_SID);
  } else {
    const token = localStorage.getItem("authToken");
    const sub = getUserIdFromToken(token);
    if (sub) localStorage.removeItem(`taxChat_conv_user_${sub}`);
    localStorage.removeItem(LS_USER_CONV);
  }
}

type Props = {
  /** אורח (מסך התחברות) — ללא טוקן */
  variant?: "guest" | "dashboard";
  className?: string;
  /** מיקוד אוטומטי לשדה הקלט כשהרכיב גלוי ומוכן (למשל צ'אט פתוח) */
  autoFocusInput?: boolean;
};

export const TaxAssistantChat: React.FC<Props> = ({
  variant = "dashboard",
  className = "",
  autoFocusInput = false,
}) => {
  const { t } = useI18n();
  const [token, setToken] = useState<string | null>(() =>
    typeof window !== "undefined"
      ? localStorage.getItem("authToken")
      : null,
  );
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastMode, setLastMode] = useState<"personalized" | "general" | null>(
    null,
  );
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(() =>
    readStoredConversationId(variant === "guest"),
  );
  const [guestSessionId, setGuestSessionId] = useState<string | null>(() => {
    if (typeof window === "undefined" || variant !== "guest") return null;
    return localStorage.getItem(LS_GUEST_SID);
  });
  const [bearerOk, setBearerOk] = useState(() =>
    typeof window !== "undefined" && !!localStorage.getItem("authToken"),
  );
  /** ידוע אחרי תשובת POST /api/chat ראשונה */
  const [chatLlmAvailable, setChatLlmAvailable] = useState<boolean | null>(
    null,
  );
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isGuestUi = variant === "guest";

  useEffect(() => {
    const syncAuth = () => {
      const t = localStorage.getItem("authToken");
      setToken(t);
      setBearerOk(!!t);
      if (!isGuestUi && !t) {
        setMessages([]);
        setConversationId(null);
        setGuestSessionId(null);
        setHistoryLoaded(true);
      }
    };
    syncAuth();
    window.addEventListener("auth:loggedIn", syncAuth);
    window.addEventListener("auth:loggedOut", syncAuth);
    window.addEventListener("storage", syncAuth);
    return () => {
      window.removeEventListener("auth:loggedIn", syncAuth);
      window.removeEventListener("auth:loggedOut", syncAuth);
      window.removeEventListener("storage", syncAuth);
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    let cancelled = false;
    const bearerFromLs =
      !isGuestUi && typeof window !== "undefined"
        ? localStorage.getItem("authToken")
        : null;
    const cId = readStoredConversationId(isGuestUi);
    const gSid = isGuestUi ? localStorage.getItem(LS_GUEST_SID) : null;

    if (!cId || (isGuestUi && !gSid)) {
      setHistoryLoaded(true);
      return () => {
        cancelled = true;
      };
    }

    if (!isGuestUi && !bearerFromLs) {
      setHistoryLoaded(true);
      return () => {
        cancelled = true;
      };
    }

    (async () => {
      try {
        const bearer =
          !isGuestUi && typeof window !== "undefined"
            ? localStorage.getItem("authToken") || token || undefined
            : undefined;
        const { messages: rows, chatDbAvailable } = await apiChatLoadMessages(
          cId,
          isGuestUi ? undefined : bearer ?? undefined,
          isGuestUi ? gSid ?? undefined : undefined,
        );
        if (cancelled) return;
        if (chatDbAvailable === false) {
          clearChatLocalStorage(isGuestUi);
          setConversationId(null);
          setGuestSessionId(null);
          setMessages([]);
        } else {
          setConversationId(cId);
          if (isGuestUi && gSid) setGuestSessionId(gSid);
          setMessages(
            rows.map((m) => ({
              role: m.role,
              text: m.content,
            })),
          );
        }
      } catch {
        if (cancelled) return;
        clearChatLocalStorage(isGuestUi);
        setConversationId(null);
        setGuestSessionId(null);
      } finally {
        if (!cancelled) setHistoryLoaded(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isGuestUi, token]);

  useEffect(() => {
    if (!autoFocusInput || !historyLoaded || loading) return;
    const id = window.requestAnimationFrame(() => {
      inputRef.current?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(id);
  }, [autoFocusInput, historyLoaded, loading]);

  const disclaimer =
    isGuestUi || !bearerOk
      ? t("assistant.disclaimer.general")
      : lastMode === "general"
        ? t("assistant.disclaimer.general")
        : t("assistant.disclaimer.personalized");

  const persistIds = useCallback(
    (res: {
      conversationId?: string;
      guestSessionId?: string;
    }) => {
      if (res.conversationId) {
        setConversationId(res.conversationId);
        if (isGuestUi) {
          localStorage.setItem(LS_GUEST_CONV, res.conversationId);
        } else {
          const tok =
            typeof window !== "undefined"
              ? localStorage.getItem("authToken")
              : null;
          persistUserConversationId(tok, res.conversationId);
        }
      }
      if (isGuestUi && res.guestSessionId) {
        setGuestSessionId(res.guestSessionId);
        localStorage.setItem(LS_GUEST_SID, res.guestSessionId);
      }
    },
    [isGuestUi],
  );

  const sendMessage = useCallback(
    async () => {
      const text = input.trim();
      if (!text || loading || !historyLoaded) return;
      setInput("");
      setError(null);
      setMessages((m) => [...m, { role: "user", text }]);
      setLoading(true);
      try {
        const lsToken =
          !isGuestUi && typeof window !== "undefined"
            ? localStorage.getItem("authToken")
            : null;
        if (lsToken) setToken(lsToken);
        const authToken = isGuestUi ? null : lsToken || token;
        const res = await apiChat(text, authToken ?? undefined, {
          conversationId: conversationId ?? undefined,
          guestSessionId: isGuestUi ? guestSessionId ?? undefined : undefined,
          maxReports: isGuestUi ? undefined : 15,
        });
        setLastMode(res.mode);
        if (res.chatDbAvailable === false) {
          clearChatLocalStorage(isGuestUi);
          setConversationId(null);
          setGuestSessionId(null);
        } else {
          persistIds(res);
        }
        if (typeof res.chatLlmAvailable === "boolean") {
          setChatLlmAvailable(res.chatLlmAvailable);
        }
        setMessages((m) => [...m, { role: "assistant", text: res.reply }]);
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : t("assistant.error.generic");
        setError(msg);
        setMessages((m) => [
          ...m,
          { role: "assistant", text: t("assistant.error.retry") },
        ]);
      } finally {
        setLoading(false);
        queueMicrotask(() => {
          inputRef.current?.focus({ preventScroll: true });
        });
      }
    },
    [
      input,
      loading,
      historyLoaded,
      token,
      isGuestUi,
      conversationId,
      guestSessionId,
      persistIds,
      t,
    ],
  );

  const shell =
    variant === "guest"
      ? "rounded-2xl border border-slate-200/80 bg-white/90 shadow-sm backdrop-blur"
      : "card-enhanced rounded-2xl border border-[#d8dcf0]/80 bg-white shadow-md";

  const showEmptyHint =
    historyLoaded && messages.length === 0 && !loading;

  const welcomePersonalized = !isGuestUi && bearerOk;

  return (
    <section
      className={[
        shell,
        "flex flex-col overflow-hidden",
        variant === "guest" ? "max-w-xl w-full mx-auto" : "w-full max-w-2xl",
        className,
      ].join(" ")}
      dir="rtl"
    >
      <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3 bg-gradient-to-l from-[#E6E9FF]/90 to-white">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#006D4E]/10 text-[#006D4E]">
          <MessageCircle className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1 text-right">
          <h2 className="text-sm font-bold text-[#131b2e]">
            {t("assistant.title")}
          </h2>
          <p className="text-xs text-slate-500">{t("assistant.subtitle")}</p>
        </div>
      </div>

      <p className="mx-4 mt-3 rounded-xl bg-amber-50/90 border border-amber-100 px-3 py-2 text-xs text-amber-950 text-right leading-relaxed">
        {disclaimer}
      </p>
      {chatLlmAvailable === false && (
        <p className="mx-4 mt-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-600 text-right leading-relaxed">
          {t("assistant.llm.offBanner")}
        </p>
      )}
      {!isGuestUi && (
        <p
          className={
            bearerOk
              ? "mx-4 text-[11px] text-emerald-700 text-right"
              : "mx-4 text-[11px] text-red-600 text-right font-medium"
          }
        >
          {bearerOk ? t("assistant.bearer.ok") : t("assistant.bearer.missing")}
        </p>
      )}

      <div
        className="flex-1 min-h-[200px] max-h-[min(420px,55vh)] overflow-y-auto px-3 py-3 space-y-3"
        aria-live="polite"
      >
        {!historyLoaded && (
          <p className="text-sm text-slate-500 text-center py-6 px-2">
            {t("assistant.loadingHistory")}
          </p>
        )}
        {showEmptyHint && (
          <div className="rounded-2xl border border-slate-200/90 bg-gradient-to-br from-slate-50/95 to-white px-3 py-4 text-right shadow-sm space-y-3">
            <div className="flex gap-2 flex-row-reverse items-start">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#00A86B]/15 text-[#006D4E]">
                <Bot className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <p className="text-sm font-semibold text-[#131b2e]">
                  {t("assistant.welcome.title")}
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {welcomePersonalized
                    ? t("assistant.welcome.subtitleDashboard")
                    : t("assistant.welcome.subtitleGuest")}
                </p>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#006D4E]/90 mb-1">
                    {t("assistant.welcome.section.canDo")}
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                    {welcomePersonalized
                      ? t("assistant.welcome.canDo.dashboard")
                      : t("assistant.welcome.canDo.guest")}
                  </p>
                </div>
                <div className="rounded-xl bg-white/80 border border-slate-100 px-2.5 py-2">
                  <p className="text-[11px] font-medium text-slate-700 mb-1">
                    {t("assistant.welcome.section.askYou")}
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {welcomePersonalized
                      ? t("assistant.welcome.askYou.dashboard")
                      : t("assistant.welcome.askYou.guest")}
                  </p>
                </div>
                <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                  {t("assistant.empty")}
                </p>
              </div>
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={[
              "flex gap-2",
              m.role === "user" ? "flex-row-reverse" : "flex-row",
            ].join(" ")}
          >
            <div
              className={[
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                m.role === "user"
                  ? "bg-slate-200 text-slate-700"
                  : "bg-[#00A86B]/15 text-[#006D4E]",
              ].join(" ")}
            >
              {m.role === "user" ? (
                <User className="h-4 w-4" />
              ) : (
                <Bot className="h-4 w-4" />
              )}
            </div>
            <div
              className={[
                "rounded-2xl px-3 py-2 text-sm leading-relaxed max-w-[85%]",
                m.role === "user"
                  ? "bg-[#006D4E] text-white rounded-tr-sm"
                  : "bg-slate-100 text-slate-800 rounded-tl-sm",
              ].join(" ")}
            >
              {renderChatMarkdown(
                m.text,
                m.role === "user" ? "user" : "assistant",
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-slate-500 text-sm px-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("assistant.thinking")}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <p className="px-4 text-xs text-red-600 text-right">{error}</p>
      )}

      <form
        className="flex gap-2 border-t border-slate-100 p-3 bg-slate-50/80"
        onSubmit={(e) => {
          e.preventDefault();
          void sendMessage();
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("assistant.placeholder")}
          maxLength={2000}
          className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-right shadow-inner focus:outline-none focus:ring-2 focus:ring-[#00A86B]/40"
          disabled={loading || !historyLoaded}
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={loading || !input.trim() || !historyLoaded}
          aria-label={t("assistant.send")}
          className="inline-flex items-center justify-center gap-1 rounded-xl bg-[#00A86B] px-4 py-2.5 text-white text-sm font-semibold shadow hover:bg-[#00925d] disabled:opacity-50 disabled:pointer-events-none transition-colors"
        >
          <Send className="h-4 w-4" />
          {t("assistant.send")}
        </button>
      </form>
    </section>
  );
};
