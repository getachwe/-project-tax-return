/**
 * מצב "סיור אורח" — גישה לממשק ללא התחברות, בלי שמירת טיוטת מס ב-localStorage
 * וללא שמירת דוחות בשרת (הדגל ב-sessionStorage — נמחק כשסוגרים את הטאב).
 */
export const GUEST_EXPLORE_SESSION_KEY = "tax_guest_explore";

export function isGuestExploreSession(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(GUEST_EXPLORE_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export function enterGuestExploreSession(): void {
  try {
    sessionStorage.setItem(GUEST_EXPLORE_SESSION_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function exitGuestExploreSession(): void {
  try {
    sessionStorage.removeItem(GUEST_EXPLORE_SESSION_KEY);
    sessionStorage.removeItem("taxChat_guest_conversationId");
    sessionStorage.removeItem("taxChat_guest_sessionId");
  } catch {
    /* ignore */
  }
}
