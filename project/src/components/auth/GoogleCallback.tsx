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
          navigate("/incomes", { replace: true });
          return;
        }

        // Get the authorization code or implicit token from URL (search/hash)
        const searchParams = new URLSearchParams(window.location.search);
        let code = searchParams.get("code");
        let error = searchParams.get("error");
        let errorCode = searchParams.get("error_code");
        let errorDescription = searchParams.get("error_description");
        const accessTokenFromSearch = searchParams.get("access_token");

        // Also check hash for errors (Supabase sometimes puts them in hash)
        const hashParams = new URLSearchParams(
          window.location.hash.substring(1).split("?")[0] || ""
        );
        if (!error) error = hashParams.get("error");
        if (!errorCode) errorCode = hashParams.get("error_code");
        if (!errorDescription)
          errorDescription = hashParams.get("error_description");

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
                navigate("/incomes", { replace: true });
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
              navigate("/incomes", { replace: true });
              return;
            }
          }
        }

        if (error) {
          setStatus("error");
          let errorMsg = "התחברות נכשלה. אנא נסה שוב.";

          if (errorDescription) {
            try {
              errorMsg = decodeURIComponent(errorDescription);
            } catch (e) {
              errorMsg = errorDescription;
            }
          } else if (
            error === "server_error" ||
            errorCode === "unexpected_failure"
          ) {
            // This error usually means redirectTo URL doesn't match Supabase configuration
            const currentOrigin = window.location.origin;
            const expectedRedirectUrl = `${currentOrigin}/auth/callback`;
            errorMsg = `שגיאת שרת: לא ניתן להחליף קוד הרשאה.

🔴 הבעיה: ה-URL של ההתחברות לא מוגדר נכון ב-Supabase Dashboard.

✅ פתרון שלב אחר שלב:

1. פתח Supabase Dashboard:
   https://app.supabase.com/

2. בחר את הפרויקט שלך

3. עבור ל-Authentication (בתפריט השמאלי)

4. לחץ על "URL Configuration"

5. במקטע "Redirect URLs", לחץ על "Add URL"

6. הכנס את ה-URL הבא (העתק בדיוק!):
   ${expectedRedirectUrl}

⚠️ חשוב מאוד: הכנס את ה-URL בדיוק כפי שמוצג, ללא סלאש בסוף.

7. לחץ "Save"

8. ודא שה-Google OAuth Provider מוגדר:
   • Authentication → Providers → Google
   • Enabled = ON
   • Client ID ו-Client Secret מוגדרים

9. נסה להתחבר שוב

אם זה עדיין לא עובד:
   • בדוק את ה-logs ב-Supabase Dashboard → Logs → Auth
   • ודא שה-backend רץ ובדוק את ה-logs שלו`;
          } else if (error === "access_denied") {
            errorMsg = "ההרשאה נדחתה. אנא נסה שוב.";
          }

          setMessage(errorMsg);
          console.error("OAuth error:", {
            error,
            errorCode,
            errorDescription,
            url: window.location.href,
          });
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

        navigate("/incomes", { replace: true });
      } catch (err) {
        console.error("Google callback error:", err);
        setStatus("error");
        const msg = err instanceof Error ? err.message : "שגיאה לא ידועה";
        const isNetwork =
          msg.includes("fetch") ||
          msg.includes("Failed to fetch") ||
          msg.includes("NetworkError");
        setMessage(
          isNetwork ? "לא ניתן להתחבר לשרת. בדוק את החיבור לאינטרנט." : msg
        );
      }
    };

    handleGoogleCallback();
  }, [navigate]);

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gray-50"
      style={{ minHeight: "100vh", backgroundColor: "#f9fafb" }}
    >
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
                onClick={() => navigate("/", { replace: true })}
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
