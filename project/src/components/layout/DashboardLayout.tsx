import React, { useMemo, useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "../Header";
import { useI18n } from "../../i18n/useI18n";
import { useLocation } from "react-router-dom";

export const DashboardLayout: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { t } = useI18n();
  const location = useLocation();

  const isFullWidthPage = useMemo(() => {
    const p = location.pathname || "";
    return (
      p === "/incomes" ||
      p === "/" ||
      p === "/results" ||
      p === "/history" ||
      p === "/assistant" ||
      p === "/settings" ||
      p === "/profile"
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#f4f6fa]">
      {/* Top bar */}
      <div className="sticky top-0 z-40">
        <Header variant="dashboard" />
      </div>

      <div
        className={[
          isFullWidthPage ? "max-w-none" : "max-w-6xl mx-auto",
          "w-full px-4 sm:px-6 lg:px-8 py-4",
        ].join(" ")}
      >
        {/* ב־dir=rtl על html, flex-row שם את הילד הראשון (Sidebar) בצד ימין */}
        <div className="flex flex-row gap-4">
          {/* Desktop sidebar */}
          <div className="hidden lg:block lg:sticky lg:top-[57px] lg:h-[calc(100vh-57px-16px)] rounded-2xl overflow-hidden shadow-md border border-[#d8dcf0]/60">
            <Sidebar />
          </div>

          {/* Mobile sidebar overlay */}
          {sidebarOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div
                className="absolute inset-0 bg-black/30"
                onClick={() => setSidebarOpen(false)}
              />
              <div className="absolute right-0 top-0 h-full w-[280px] max-w-[85vw] bg-[#E6E9FF] shadow-2xl border-l border-[#d8dcf0]">
                <Sidebar onNavigate={() => setSidebarOpen(false)} />
              </div>
            </div>
          )}

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Mobile menu button */}
            <div className="lg:hidden mb-4">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="px-4 py-2 rounded-xl bg-card/80 backdrop-blur border border-border shadow-sm text-sm font-medium text-foreground hover:bg-muted transition"
              >
                {t("layout.menu")}
              </button>
            </div>

            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

