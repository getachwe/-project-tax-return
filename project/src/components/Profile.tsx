import React, { useEffect, useState } from "react";
import {
  apiGetProfile,
  apiUpdateProfile,
  apiExportMyData,
  apiDeleteMyData,
} from "../utils/api";

type Props = {
  token: string;
};

export const Profile: React.FC<Props> = ({ token }) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    apiGetProfile(token)
      .then((p) => {
        if (!mounted) return;
        setFirstName(p?.first_name || "");
        setLastName(p?.last_name || "");
      })
      .catch((e) => setMessage(e.message || String(e)));
    return () => {
      mounted = false;
    };
  }, [token]);

  async function onSave() {
    setLoading(true);
    setMessage(null);
    try {
      await apiUpdateProfile(token, firstName, lastName);
      setMessage("פרופיל נשמר בהצלחה");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function onExport() {
    setLoading(true);
    setMessage(null);
    try {
      const data = await apiExportMyData(token);
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "my-data.json";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function onDelete(deleteAccount: boolean) {
    if (
      !confirm(
        deleteAccount
          ? "למחוק גם את החשבון? פעולה זו בלתי הפיכה"
          : "למחוק את כל הנתונים?"
      )
    )
      return;
    setLoading(true);
    setMessage(null);
    try {
      await apiDeleteMyData(token, deleteAccount);
      setMessage(
        deleteAccount ? "כל הנתונים והחשבון נמחקו" : "כל הנתונים נמחקו"
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto bg-card/80 text-card-foreground border border-border/40 rounded p-6 space-y-4 rtl">
      <h2 className="text-xl font-extrabold text-foreground">פרופיל משתמש</h2>
      {message && (
        <div className="text-sm text-muted-foreground">{message}</div>
      )}
      <div className="grid grid-cols-1 gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm text-muted-foreground">שם פרטי</span>
          <input
            className="input-field"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-muted-foreground">שם משפחה</span>
          <input
            className="input-field"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </label>
      </div>
      <div className="flex gap-2 flex-wrap">
        <button className="btn-primary" onClick={onSave} disabled={loading}>
          שמור
        </button>
        <button className="btn-secondary" onClick={onExport} disabled={loading}>
          ייצוא נתונים
        </button>
      </div>

      {/* Sensitive area - destructive actions */}
      <div className="mt-6 pb-6 border-b-4 border-rose-200">
        <div className="text-sm font-extrabold text-rose-700 mb-3">אזור רגיש</div>
        <div className="flex gap-2 flex-wrap">
          <button
            className="bg-rose-100 text-rose-700 hover:bg-rose-200 border border-rose-200 px-4 py-2 rounded transition-colors disabled:opacity-50"
            onClick={() => onDelete(false)}
            disabled={loading}
          >
          מחק נתונים
          </button>
          <button
            className="bg-rose-100 text-rose-700 hover:bg-rose-200 border border-rose-200 px-4 py-2 rounded transition-colors disabled:opacity-50"
            onClick={() => onDelete(true)}
            disabled={loading}
          >
          מחק נתונים + חשבון
          </button>
        </div>
      </div>
    </div>
  );
};
