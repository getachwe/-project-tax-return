import React from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Upload,
  History,
  MessageCircle,
  Settings,
  HelpCircle,
  LogOut,
  Plus,
} from "lucide-react";
import { useI18n } from "../../i18n/useI18n";
import { useTaxCalculator } from "../../context/TaxCalculatorContext";
import { BrandLockup } from "../ui/BrandMark";
import {
  exitGuestExploreSession,
  isGuestExploreSession,
} from "../../utils/guestMode";

type Item = {
  to: string;
  labelKey:
    | "nav.dashboard"
    | "nav.incomes"
    | "nav.history"
    | "nav.assistant"
    | "nav.settings";
  icon: React.ComponentType<{ className?: string }>;
};

const items: Item[] = [
  { to: "/", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { to: "/incomes", labelKey: "nav.incomes", icon: Upload },
  { to: "/history", labelKey: "nav.history", icon: History },
  { to: "/assistant", labelKey: "nav.assistant", icon: MessageCircle },
  { to: "/settings", labelKey: "nav.settings", icon: Settings },
];

export const Sidebar: React.FC<{ onNavigate?: () => void }> = ({
  onNavigate,
}) => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { resetCalculator } = useTaxCalculator();

  const guestOnly =
    typeof window !== "undefined" &&
    isGuestExploreSession() &&
    !localStorage.getItem("authToken");

  const openHelp = () => {
    window.dispatchEvent(new CustomEvent("dashboard:openHelp"));
    onNavigate?.();
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("lastActivity");
    exitGuestExploreSession();
    window.dispatchEvent(new CustomEvent("auth:loggedOut"));
    navigate("/");
    onNavigate?.();
  };

  const newRequest = () => {
    resetCalculator();
    navigate("/incomes");
    onNavigate?.();
  };

  return (
    <aside className="h-full w-[272px] bg-[#E6E9FF] border-l border-[#d8dcf0] px-4 py-6 flex flex-col text-[#131b2e]">
      <div className="px-2 pb-6">
        <BrandLockup
          size="md"
          title={t("app.title")}
          subtitle={t("app.subtitle")}
          className="w-full"
        />
      </div>

      <nav className="space-y-1 flex-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active =
            item.to === "/"
              ? pathname === "/" || pathname === "/results"
              : pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={() =>
                [
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all border-r-4",
                  active
                    ? "bg-white/90 text-[#006D4E] shadow-sm border-[#00A86B] font-bold"
                    : "text-[#4a5568] hover:bg-white/50 border-transparent hover:text-[#131b2e]",
                ].join(" ")
              }
              end={item.to === "/"}
            >
              <Icon
                className={
                  active
                    ? "h-5 w-5 shrink-0 text-[#00A86B]"
                    : "h-5 w-5 shrink-0 text-[#64748b]"
                }
              />
              <span>{t(item.labelKey)}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-4 space-y-3 pt-4 border-t border-[#d8dcf0]/80">
        <button
          type="button"
          onClick={newRequest}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#00A86B] hover:bg-[#00925d] text-white font-bold text-sm py-3 px-4 shadow-md transition-colors"
        >
          <Plus className="h-5 w-5" strokeWidth={2.5} />
          בקשת החזר חדשה
        </button>

        <button
          type="button"
          onClick={openHelp}
          className="w-full flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-[#4a5568] hover:bg-white/60 transition-colors text-right"
        >
          <HelpCircle className="h-5 w-5 text-[#006D4E]" />
          עזרה
        </button>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-red-600 hover:bg-red-50/80 transition-colors text-right font-medium"
        >
          <LogOut className="h-5 w-5" />
          {guestOnly ? "סיום סיור" : "התנתקות"}
        </button>
      </div>
    </aside>
  );
};
