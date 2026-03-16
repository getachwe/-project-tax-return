import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "../Header";
import { useI18n } from "../../i18n/useI18n";

export const DashboardLayout: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="sticky top-0 z-40">
        <Header />
      </div>

      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex gap-4">
          {/* Desktop sidebar */}
          <div className="hidden lg:block lg:sticky lg:top-[76px] lg:h-[calc(100vh-76px-16px)] rounded-3xl overflow-hidden shadow-sm">
            <Sidebar />
          </div>

          {/* Mobile sidebar overlay */}
          {sidebarOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div
                className="absolute inset-0 bg-black/30"
                onClick={() => setSidebarOpen(false)}
              />
              <div className="absolute left-0 top-0 h-full w-80 bg-card shadow-2xl border-r border-border">
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

