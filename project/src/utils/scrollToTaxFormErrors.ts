/**
 * אחרי שליחה עם שגיאות ולידציה: גלילה להודעת הסיכום ואז לשדה הראשון הבעייתי + פוקוס.
 */
export function scrollToTaxFormErrors(options: {
  summaryId: string;
  /** סדר עיבוד השדות במסך (למשל מלמעלה למטה) */
  fieldOrder: string[];
  errorFieldIds: string[];
}): void {
  const { summaryId, fieldOrder, errorFieldIds } = options;
  const errSet = new Set(errorFieldIds);
  const firstId = fieldOrder.find((id) => errSet.has(id));

  const summary = document.getElementById(summaryId);
  summary?.scrollIntoView({ behavior: "smooth", block: "start" });

  window.setTimeout(() => {
    if (!firstId) return;
    const wrap = document.querySelector(`[data-tax-field="${firstId}"]`);
    wrap?.scrollIntoView({ behavior: "smooth", block: "center" });
    const focusable = wrap?.querySelector<HTMLElement>(
      "input:not([type=hidden]), select, textarea"
    );
    focusable?.focus({ preventScroll: true });
  }, 420);
}
