import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTaxCalculator } from "../context/TaxCalculatorContext";
import {
  apiDeleteReport,
  apiGetReportDownloadUrl,
  apiGetReports,
  apiSendTaxReturnEmail,
  ReportItem,
} from "../utils/api";
import {
  History,
  ArrowLeft,
  X,
  Mail,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { HistoryList } from "./history/HistoryList";
import { HistoryPagination } from "./history/HistoryPagination";
import { HistoryFilters } from "./history/HistoryFilters";

export const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { resetCalculator } = useTaxCalculator();
  const [token, setToken] = useState<string | null>(null);
  const [items, setItems] = useState<ReportItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [year, setYear] = useState<string>("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Loading states for individual actions
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());
  const [viewingIds, setViewingIds] = useState<Set<string>>(new Set());
  const [emailingIds, setEmailingIds] = useState<Set<string>>(new Set());

  // Modal states
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ReportItem | null>(null);
  const [emailAddress, setEmailAddress] = useState("");
  const [emailStatus, setEmailStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ReportItem | null>(null);

  useEffect(() => {
    setToken(localStorage.getItem("authToken"));
  }, []);

  const canFetch = useMemo(() => Boolean(token), [token]);

  async function loadReports() {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const { items, total } = await apiGetReports(token, {
        year: year ? Number(year) : undefined,
        q: q || undefined,
        page,
        pageSize,
      });

      // Map the items to ensure proper structure
      const mappedItems = items.map(
        (
          item: ReportItem & {
            tax_data?: Record<string, unknown>;
            calculation_result?: Record<string, unknown>;
          }
        ) => ({
          ...item,
          taxData: item.tax_data,
          calculationResult: item.calculation_result,
        })
      );

      setItems(mappedItems);
      setTotal(total);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "שגיאה בטעינת היסטוריה");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (canFetch) loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canFetch, page]);

  const pages = Math.max(1, Math.ceil(total / pageSize));

  const cumulativeOnPage = useMemo(
    () =>
      items.reduce((sum, i) => {
        const r = Number(
          (i.calculationResult as { refund?: number })?.refund ?? 0
        );
        return sum + Math.max(0, r);
      }, 0),
    [items]
  );

  const handlePageChange = (newPage: number) => {
    // Ensure page is within valid range
    const maxPage = Math.ceil(total / pageSize);
    const validPage = Math.max(1, Math.min(maxPage, newPage));
    setPage(validPage);
  };

  const handleDownload = async (id: string) => {
    if (!token) return;
    setDownloadingIds((prev) => new Set(prev).add(id));
    try {
      const { url } = await apiGetReportDownloadUrl(token, id);
      window.open(url, "_blank");
    } catch (e: unknown) {
      setErrorMessage(e instanceof Error ? e.message : "שגיאה בהורדה");
      setErrorModalOpen(true);
    } finally {
      setDownloadingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const handleViewReport = async (id: string) => {
    if (!token) return;
    setViewingIds((prev) => new Set(prev).add(id));
    try {
      const item = items.find((i) => i.id === id);
      if (item) {
        navigate("/results", {
          state: {
            fromHistory: true,
            taxData: item.taxData,
            result: item.calculationResult,
          },
        });
      }
    } catch (e: unknown) {
      setErrorMessage(e instanceof Error ? e.message : "שגיאה בצפייה בדוח");
      setErrorModalOpen(true);
    } finally {
      setViewingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const handleSendEmail = (item: ReportItem) => {
    setSelectedItem(item);
    setEmailAddress("");
    setEmailStatus("idle");
    setEmailModalOpen(true);
  };

  const handleEmailSubmit = async () => {
    if (!token || !selectedItem || !emailAddress) return;

    setEmailStatus("loading");
    setEmailingIds((prev) => new Set(prev).add(selectedItem.id));
    try {
      await apiSendTaxReturnEmail(
        token,
        selectedItem.taxData,
        emailAddress,
        selectedItem.id
      );

      setEmailStatus("success");
      setEmailModalOpen(false);
      setSuccessModalOpen(true);

      // Auto close success modal after 3 seconds
      setTimeout(() => {
        setSuccessModalOpen(false);
      }, 3000);
    } catch (e: unknown) {
      setEmailStatus("error");
      setErrorMessage(e instanceof Error ? e.message : "שגיאה בשליחת המייל");
      setErrorModalOpen(true);
    } finally {
      setEmailingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(selectedItem.id);
        return newSet;
      });
    }
  };

  const handleDelete = (item: ReportItem) => {
    setItemToDelete(item);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!token || !itemToDelete) return;

    try {
      await apiDeleteReport(token, itemToDelete.id);
      setDeleteModalOpen(false);
      setItemToDelete(null);
      loadReports();
    } catch (e: unknown) {
      setErrorMessage(e instanceof Error ? e.message : "שגיאה במחיקה");
      setErrorModalOpen(true);
    }
  };

  // Empty state when no token
  if (!token) {
    return (
      <div className="w-full max-w-3xl mx-auto">
        <div className="card-enhanced text-center space-y-6 py-12">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl flex items-center justify-center">
              <History className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div className="text-gray-700 text-lg">
            כדי לראות היסטוריה יש להתחבר למערכת
          </div>
          <div className="flex items-center justify-center gap-4">
            <button
              className="btn-primary flex items-center gap-2"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="h-4 w-4" />
              חזרה לעמוד הבית
            </button>
            <button
              className="btn-secondary flex items-center gap-2"
              onClick={() => {
                // פותח את מודאל ההתחברות ע"י טריגר גלובלי פשוט
                window.dispatchEvent(new CustomEvent("open-auth"));
              }}
            >
              התחברות
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full pb-12" dir="rtl">
      <div className="w-full max-w-6xl mx-auto px-0 sm:px-1">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 mb-8">
          <div>
            <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wide mb-1">
              ארכיון בקשות
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#131b2e]">
              היסטוריית החזרים
            </h1>
            <p className="text-sm text-[#64748b] mt-2 max-w-xl">
              דוחות קודמים, הורדת PDF, שליחה במייל ופתיחה בדשבורד.
            </p>
          </div>
          <div className="rounded-xl bg-white border border-[#e8eaf2] shadow-sm px-5 py-4 min-w-[200px]">
            <p className="text-xs font-medium text-[#64748b] mb-1">
              סך החזרים בעמוד (מאושרים)
            </p>
            <p className="text-2xl font-extrabold text-[#006D4E] tabular-nums">
              {Math.round(cumulativeOnPage).toLocaleString("he-IL")} ₪
            </p>
          </div>
        </div>

        <button
          type="button"
          className="mb-6 inline-flex items-center gap-2 text-sm text-[#64748b] hover:text-[#006D4E] transition-colors"
          onClick={() => {
            resetCalculator();
            navigate("/");
          }}
        >
          <ArrowLeft className="h-4 w-4" />
          חזרה לדשבורד
        </button>

        <HistoryFilters
          searchTerm={q}
          year={year}
          onSearchChange={setQ}
          onYearChange={setYear}
          onApplyFilters={() => {
            setPage(1);
            loadReports();
          }}
        />

        <HistoryList
          items={items}
          loading={loading}
          onDownload={handleDownload}
          onViewReport={handleViewReport}
          onDelete={(id: string) => {
            const item = items.find((i) => i.id === id);
            if (item) handleDelete(item);
          }}
          onSendEmail={handleSendEmail}
          downloadingIds={downloadingIds}
          viewingIds={viewingIds}
          emailingIds={emailingIds}
        />

        <HistoryPagination
          currentPage={page}
          totalPages={pages}
          totalItems={total}
          pageSize={pageSize}
          onPageChange={handlePageChange}
        />

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span className="font-medium">שגיאה:</span>
              <span>
                {String(error).toLowerCase().includes("jwt")
                  ? "התחברות פגה תוקף. נא להתחבר מחדש."
                  : error}
              </span>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6 mt-10">
          <div className="rounded-xl bg-[#E6E9FF] border border-[#d8dcf0] p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/80 flex items-center justify-center text-[#006D4E] font-bold">
                ✦
              </div>
              <div>
                <h3 className="font-extrabold text-[#131b2e]">
                  תחזית שנת {new Date().getFullYear()}
                </h3>
                <p className="text-sm text-[#64748b] mt-2 leading-relaxed">
                  בהתבסס על דוחות קודמים, ניתן להעריך החזר צפוי לשנה הנוכחית
                  (המספר להמחשה בלבד).
                </p>
                <p className="text-2xl font-extrabold text-[#006D4E] mt-4 tabular-nums">
                  {Math.max(
                    0,
                    Math.round(cumulativeOnPage * 0.22)
                  ).toLocaleString("he-IL")}{" "}
                  ₪
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-white border border-[#e8eaf2] p-6 shadow-sm relative overflow-hidden">
            <div className="absolute -bottom-4 -left-4 opacity-[0.07] text-8xl font-serif select-none pointer-events-none">
              📄
            </div>
            <h3 className="font-extrabold text-[#131b2e] relative">
              זקוק לעזרה עם מסמכי העבר?
            </h3>
            <p className="text-sm text-[#64748b] mt-3 leading-relaxed relative">
              הצוות שלנו מלווה אותך בהעלאה, בדיקה והבנת הדוח. נשמח לעזור בכל
              שאלה.
            </p>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("dashboard:openHelp"))}
              className="mt-4 text-sm font-bold text-[#006D4E] hover:text-[#00A86B] inline-flex items-center gap-1 relative"
            >
              צור קשר עם נציג
              <span aria-hidden>←</span>
            </button>
          </div>
        </div>
      </div>

      {/* Email Modal */}
      {emailModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                שליחת דוח למייל
              </h3>
              <button
                onClick={() => setEmailModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  כתובת מייל
                </label>
                <input
                  type="email"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  className="input-field-enhanced w-full"
                  placeholder="example@email.com"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setEmailModalOpen(false)}
                  className="btn-secondary"
                >
                  ביטול
                </button>
                <button
                  onClick={handleEmailSubmit}
                  disabled={!emailAddress || emailStatus === "loading"}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50"
                >
                  {emailStatus === "loading" ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      שולח...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4" />
                      שלח
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {successModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                הדוח נשלח בהצלחה!
              </h3>
              <p className="text-gray-600 mb-4">
                הדוח נשלח לכתובת המייל שציינת
              </p>
              <button
                onClick={() => setSuccessModalOpen(false)}
                className="btn-primary"
              >
                אישור
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {errorModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                שגיאה
              </h3>
              <p className="text-gray-600 mb-4">{errorMessage}</p>
              <button
                onClick={() => setErrorModalOpen(false)}
                className="btn-primary"
              >
                אישור
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                מחיקת דוח
              </h3>
              <p className="text-gray-600 mb-4">
                האם אתה בטוח שברצונך למחוק את הדוח "{itemToDelete?.file_name}"?
                פעולה זו לא ניתנת לביטול.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setDeleteModalOpen(false)}
                  className="btn-secondary"
                >
                  ביטול
                </button>
                <button
                  onClick={confirmDelete}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  מחיקה
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
