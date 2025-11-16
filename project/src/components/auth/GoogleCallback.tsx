import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiGoogleCallback } from "../../utils/api";

type OAuthExchangeResponse = {
  session?: { access_token?: string };
  access_token?: string;
  [key: string]: unknown;
};
import { AlertCircle, CheckCircle } from "lucide-react";

export const GoogleCallback: React.FC = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    const handleGoogleCallback = async () => {
      try {
        // Already logged-in? fast redirect
        const existingToken = localStorage.getItem("authToken");
        if (existingToken) {
          window.dispatchEvent(new CustomEvent("auth:loggedIn"));
          navigate("/", { replace: true });
          return;
        }

        // Get the authorization code or implicit token from URL (search/hash)
        const searchParams = new URLSearchParams(window.location.search);
        let code = searchParams.get("code");
        let error = searchParams.get("error");
        const errorDescription = searchParams.get("error_description");
        const accessTokenFromSearch = searchParams.get("access_token");

        // Some providers (or routers with hash) place params after '#'
        if (!code) {
          const hash = window.location.hash.startsWith("#")
            ? window.location.hash.substring(1)
            : window.location.hash;
          if (hash) {
            const afterHash = hash.includes("#")
              ? hash.split("#").pop()!
              : hash;
            const hashQuery = afterHash.includes("?")
              ? afterHash.split("?").pop()!
              : afterHash;
            const hashParams = new URLSearchParams(hashQuery);
            code = hashParams.get("code") || code;
            error = hashParams.get("error") || error;

            // Handle implicit flow tokens (when Supabase returns tokens in hash)
            if (!code) {
              const accessToken =
                hashParams.get("access_token") ||
                accessTokenFromSearch ||
                undefined;
              if (accessToken) {
                localStorage.setItem("authToken", accessToken);
                window.dispatchEvent(new CustomEvent("auth:loggedIn"));
                navigate("/", { replace: true });
                return;
              }
            }
          }
        }

        // Final fallback: parse from full href in case of unusual formats
        if (!code) {
          const href = window.location.href;
          const hashIndex = href.indexOf("#");
          if (hashIndex >= 0) {
            const raw = href.substring(hashIndex + 1);
            const hrefParams = new URLSearchParams(raw);
            const accessToken = hrefParams.get("access_token");
            if (accessToken) {
              localStorage.setItem("authToken", accessToken);
              window.dispatchEvent(new CustomEvent("auth:loggedIn"));
              navigate("/", { replace: true });
              return;
            }
          }
        }

        if (error) {
          setStatus("error");
          const errorMsg = errorDescription 
            ? decodeURIComponent(errorDescription) 
            : error === "server_error" 
            ? "שגיאת שרת. אנא נסה שוב או פנה לתמיכה."
            : error === "access_denied"
            ? "ההרשאה נדחתה. אנא נסה שוב."
            : "התחברות נכשלה. אנא נסה שוב.";
          setMessage(errorMsg);
          console.error("OAuth error:", error, errorDescription);
          return;
        }

        if (!code) {
          setStatus("error");
          setMessage("קוד הרשאה לא נמצא. אנא נסה שוב.");
          return;
        }

        // Exchange code for session
        const response: OAuthExchangeResponse = await apiGoogleCallback(code);

        // Extract token from response
        const token = response?.session?.access_token || response?.access_token;

        if (!token) {
          setStatus("error");
          setMessage("לא ניתן לקבל אסימון גישה. אנא נסה שוב.");
          return;
        }

        // Save token and redirect
        localStorage.setItem("authToken", token);
        setStatus("success");
        setMessage("התחברת בהצלחה!");

        // Dispatch login event
        window.dispatchEvent(new CustomEvent("auth:loggedIn"));

        // Redirect to main app immediately
        navigate("/", { replace: true });
      } catch (error) {
        console.error("Google callback error:", error);
        setStatus("error");
        setMessage(error instanceof Error ? error.message : "שגיאה לא ידועה");
      }
    };

    handleGoogleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          {status === "loading" && (
            <>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                מתחבר...
              </h2>
              <p className="text-gray-600">
                אנא המתן בזמן שאנחנו משלימים את ההתחברות
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                התחברת בהצלחה!
              </h2>
              <p className="text-gray-600">מועבר לאפליקציה...</p>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                שגיאה בהתחברות
              </h2>
              <p className="text-gray-600 mb-4">{message}</p>
              <button
                onClick={() => navigate("/auth")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                חזור לדף ההתחברות
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
