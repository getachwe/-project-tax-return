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
  Download,
  Trash2,
  Search,
  Calendar,
  ArrowLeft,
  Filter,
} from "lucide-react";

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

  useEffect(() => {
    setToken(localStorage.getItem("authToken"));
  }, []);

  const canFetch = useMemo(() => Boolean(token), [token]);

  async function fetchData() {
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
      setItems(items);
      setTotal(total);
    } catch (e: any) {
      setError(e?.message || "שגיאה בטעינת היסטוריה");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (canFetch) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canFetch, page]);

  const pages = Math.max(1, Math.ceil(total / pageSize));

  async function onDownload(id: string) {
    if (!token) return;
    try {
      const { url } = await apiGetReportDownloadUrl(token, id);
      window.open(url, "_blank");
    } catch (e: any) {
      alert(e?.message || "שגיאה בהורדה");
    }
  }

  async function onDelete(id: string) {
    if (!token) return;
    if (!confirm("בטוח למחוק את הדוח?")) return;
    try {
      await apiDeleteReport(token, id);
      fetchData();
    } catch (e: any) {
      alert(e?.message || "שגיאה במחיקה");
    }
  }

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
    <div className="w-full max-w-5xl mx-auto">
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
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 mb-6">
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Search className="h-4 w-4 text-blue-600" />
                חיפוש
              </label>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="שם קובץ..."
                className="input-field-enhanced w-full"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                שנה
              </label>
              <input
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="2024"
                className="input-field-enhanced w-32"
              />
            </div>
            <button
              className="btn-primary flex items-center gap-2"
              onClick={() => {
                setPage(1);
                fetchData();
              }}
            >
              <Filter className="h-4 w-4" />
              סינון
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-blue-50 to-purple-50">
              <tr>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                  שם קובץ
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                  שנה
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                  תאריך
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                  פעולות
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      טוען...
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <History className="h-8 w-8 text-gray-400" />
                      אין דוחות להצגה
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {r.file_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {r.year ?? "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(r.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-left">
                      <div className="flex gap-2 justify-end">
                        <button
                          className="btn-secondary flex items-center gap-1 px-3 py-1.5 text-sm"
                          onClick={() => onDownload(r.id)}
                        >
                          <Download className="h-4 w-4" />
                          הורדה
                        </button>
                        <button
                          className="bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                          onClick={() => onDelete(r.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          מחיקה
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex items-center justify-between bg-gray-50 rounded-lg p-4">
          <div className="text-sm font-medium text-gray-700">
            סה"כ: <span className="text-blue-600 font-semibold">{total}</span>{" "}
            דוחות
          </div>
          <div className="flex items-center gap-3">
            <button
              className="btn-secondary flex items-center gap-1 px-3 py-1.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              הקודם
            </button>
            <span className="text-sm text-gray-700 bg-white px-3 py-1.5 rounded-lg border">
              עמוד {page} מתוך {pages}
            </span>
            <button
              className="btn-secondary flex items-center gap-1 px-3 py-1.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={page >= pages}
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
            >
              הבא
            </button>
          </div>
        </div>
        {error && (
          <div className="mt-3 text-sm text-red-600">
            {String(error).toLowerCase().includes("jwt")
              ? "התחברות פגה תוקף. נא להתחבר מחדש."
              : error}
          </div>
        )}
      </div>
    </div>
  );
};
