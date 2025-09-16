import { useEffect, useState, useRef, useCallback } from "react";
import { Calculator } from "./components/Calculator";
import { Routes, Route } from "react-router-dom";
import { HistoryPage } from "./components/HistoryPage";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { TaxCalculatorProvider } from "./context/TaxCalculatorContext";
import { AuthPanel } from "./components/auth/AuthPanel";

// Session timeout duration in milliseconds (30 minutes)
const SESSION_TIMEOUT = 30 * 60 * 1000;
// Warning before timeout (5 minutes before)
const WARNING_BEFORE_TIMEOUT = 5 * 60 * 1000;

function App() {
  const [token, setToken] = useState<string | null>(null);
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  // Function to check if token is expired
  const isTokenExpired = (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const exp = payload.exp * 1000; // Convert to milliseconds
      return Date.now() >= exp;
    } catch {
      return true; // If we can't parse the token, consider it expired
    }
  };

  // Function to clear session
  const clearSession = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("lastActivity");
    setToken(null);
    setShowTimeoutWarning(false);
    window.dispatchEvent(new CustomEvent("auth:loggedOut"));
  };

  // Function to dismiss warning and reset timer
  const dismissWarning = () => {
    setShowTimeoutWarning(false);
    resetActivityTimer();
  };

  // Function to reset activity timer
  const resetActivityTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    localStorage.setItem("lastActivity", Date.now().toString());
    setShowTimeoutWarning(false);

    // Clear existing timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }

    // Set warning timeout (5 minutes before session expires)
    warningTimeoutRef.current = setTimeout(() => {
      setShowTimeoutWarning(true);
    }, SESSION_TIMEOUT - WARNING_BEFORE_TIMEOUT);

    // Set session timeout
    timeoutRef.current = setTimeout(() => {
      clearSession();
    }, SESSION_TIMEOUT);
  }, []);

  // Function to handle user activity
  const handleUserActivity = useCallback(() => {
    resetActivityTimer();
  }, [resetActivityTimer]);

  useEffect(() => {
    const storedToken = localStorage.getItem("authToken");
    const lastActivity = localStorage.getItem("lastActivity");

    // Check if we have a valid token and it's not expired
    if (storedToken && !isTokenExpired(storedToken)) {
      setToken(storedToken);

      // Check if session should be expired based on last activity
      if (lastActivity) {
        const timeSinceLastActivity = Date.now() - parseInt(lastActivity);
        if (timeSinceLastActivity < SESSION_TIMEOUT) {
          // Session is still valid, reset the timer
          resetActivityTimer();
        } else {
          // Session expired, clear it
          clearSession();
          return;
        }
      } else {
        // No last activity recorded, start timer from now
        resetActivityTimer();
      }
    } else if (storedToken) {
      // Token exists but is expired
      clearSession();
    }

    const onStorage = () => {
      const newToken = localStorage.getItem("authToken");
      if (newToken && !isTokenExpired(newToken)) {
        setToken(newToken);
        resetActivityTimer();
      } else {
        setToken(null);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      }
    };

    const onLoggedIn: EventListener = () => {
      const newToken = localStorage.getItem("authToken");
      if (newToken) {
        setToken(newToken);
        resetActivityTimer();
      }
    };

    const onLoggedOut: EventListener = () => {
      setToken(null);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };

    // Add activity listeners
    const activityEvents = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];
    activityEvents.forEach((event) => {
      document.addEventListener(event, handleUserActivity, true);
    });

    window.addEventListener("storage", onStorage);
    window.addEventListener("auth:loggedIn", onLoggedIn);
    window.addEventListener("auth:loggedOut", onLoggedOut);

    return () => {
      activityEvents.forEach((event) => {
        document.removeEventListener(event, handleUserActivity, true);
      });
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("auth:loggedIn", onLoggedIn);
      window.removeEventListener("auth:loggedOut", onLoggedOut);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
    };
  }, [resetActivityTimer, handleUserActivity]);
  return (
    <div className="min-h-screen flex flex-col font-heebo">
      <TaxCalculatorProvider>
        <Header />

        {/* Session Timeout Warning */}
        {showTimeoutWarning && token && (
          <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mx-4 mt-4 rounded-r-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-amber-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="mr-3">
                  <p className="text-sm text-amber-700">
                    <strong>הפעילות שלך עומדת להסתיים:</strong> תתנתק אוטומטית
                    בעוד 5 דקות. לחץ "המשך עבודה" כדי להישאר מחובר.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={dismissWarning}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  המשך עבודה
                </button>
                <button
                  onClick={clearSession}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  התנתק עכשיו
                </button>
              </div>
            </div>
          </div>
        )}

        <main className="flex-grow py-8 px-4 sm:px-6 lg:px-8 bg-blue-50">
          {!token ? (
            <div className="flex items-center justify-center">
              <div className="w-11/12 max-w-sm md:w-full md:max-w-md">
                <AuthPanel />
              </div>
            </div>
          ) : (
            <Routes>
              <Route
                path="/"
                element={
                  <div className="flex items-center justify-center">
                    <Calculator />
                  </div>
                }
              />
              <Route path="/history" element={<HistoryPage />} />
            </Routes>
          )}
        </main>
        <Footer />
      </TaxCalculatorProvider>
    </div>
  );
}

export default App;
