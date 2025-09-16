import React, { useEffect, useState } from "react";
import { History, LogOut, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface AuthStatusProps {
  onSignOut: () => void;
}

export const AuthStatus: React.FC<AuthStatusProps> = ({ onSignOut }) => {
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const updateAuthStatus = () => {
      const storedToken = localStorage.getItem("authToken");
      setToken(storedToken);

      if (storedToken) {
        try {
          const payload = JSON.parse(
            atob(
              (storedToken.split(".")[1] || "")
                .replace(/-/g, "+")
                .replace(/_/g, "/")
            )
          );
          setEmail(payload?.email || "");
        } catch {
          setEmail("");
        }
      } else {
        setEmail("");
      }
    };

    updateAuthStatus();

    window.addEventListener("storage", updateAuthStatus);
    window.addEventListener("auth:loggedIn", updateAuthStatus);
    window.addEventListener("auth:loggedOut", updateAuthStatus);

    return () => {
      window.removeEventListener("storage", updateAuthStatus);
      window.removeEventListener("auth:loggedIn", updateAuthStatus);
      window.removeEventListener("auth:loggedOut", updateAuthStatus);
    };
  }, []);

  if (!token) return null;

  const handleSignOut = () => {
    onSignOut();
    setIsDropdownOpen(false);
  };

  const handleHistory = () => {
    navigate("/history");
    setIsDropdownOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors"
      >
        <User className="h-5 w-5" />
        <span className="hidden sm:inline">החשבון שלי</span>
        <svg
          className={`h-4 w-4 transition-transform ${
            isDropdownOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isDropdownOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsDropdownOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            <div className="p-4 border-b border-gray-100">
              <p className="text-sm text-gray-500">מחובר כ:</p>
              <p className="font-medium text-gray-900">{email}</p>
            </div>
            <div className="py-2">
              <button
                onClick={handleHistory}
                className="w-full px-4 py-2 text-right text-gray-700 hover:bg-gray-50 flex items-center gap-3"
              >
                <History className="h-4 w-4" />
                היסטוריה
              </button>
              <button
                onClick={handleSignOut}
                className="w-full px-4 py-2 text-right text-gray-700 hover:bg-gray-50 flex items-center gap-3"
              >
                <LogOut className="h-4 w-4" />
                התנתקות
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
