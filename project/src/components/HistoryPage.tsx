import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTaxCalculator } from "../context/TaxCalculatorContext";
import {
  apiDeleteReport,
  apiGetReportDownloadUrl,
  apiGetReports,
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
      const response = await fetch(
        "http://localhost:4000/api/send-tax-return-email",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            taxData: selectedItem.taxData,
            email: emailAddress,
            reportId: selectedItem.id,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("שגיאה בשליחת המייל");
      }

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
    <div className="w-full max-w-6xl mx-auto">
      <div className="card-enhanced">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl flex items-center justify-center">
              <History className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">
              היסטוריית דוחות
            </h2>
          </div>
          <button
            className="btn-secondary flex items-center gap-2"
            onClick={() => {
              resetCalculator();
              navigate("/");
            }}
          >
            <ArrowLeft className="h-4 w-4" />
            חזרה לעמוד הבית
          </button>
        </div>

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
          onPageChange={handlePageChange}
        />

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">שגיאה:</span>
              <span>
                {String(error).toLowerCase().includes("jwt")
                  ? "התחברות פגה תוקף. נא להתחבר מחדש."
                  : error}
              </span>
            </div>
          </div>
        )}
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
