import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  WalletCards,
  History,
  Settings,
  User,
} from "lucide-react";
import { useI18n } from "../../i18n/useI18n";

type Item = {
  to: string;
  labelKey:
    | "nav.dashboard"
    | "nav.incomes"
    | "nav.history"
    | "nav.settings"
    | "nav.profile";
  icon: React.ComponentType<{ className?: string }>;
};

const items: Item[] = [
  { to: "/", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { to: "/incomes", labelKey: "nav.incomes", icon: WalletCards },
  { to: "/history", labelKey: "nav.history", icon: History },
  { to: "/settings", labelKey: "nav.settings", icon: Settings },
  { to: "/profile", labelKey: "nav.profile", icon: User },
];

export const Sidebar: React.FC<{ onNavigate?: () => void }> = ({
  onNavigate,
}) => {
  const { t } = useI18n();
  return (
    <aside className="h-full w-60 bg-card/80 backdrop-blur border-r border-border px-3 py-4 text-foreground">
      <div className="px-3 pb-4">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">
          {t("nav.navigation")}
        </div>
      </div>

      <nav className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={({ isActive }) =>
                [
                  "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition",
                  isActive
                    ? "bg-muted text-foreground border border-border shadow-sm"
                    : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                ].join(" ")
              }
              end={item.to === "/"}
            >
              <Icon className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
              <span className="font-medium">{t(item.labelKey)}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-6 px-3">
        <div className="rounded-2xl border border-border bg-muted/50 p-4">
          <div className="text-sm font-semibold text-foreground">
            {t("app.title")}
          </div>
          <div className="text-xs text-muted-foreground mt-1 leading-relaxed">
            {t("app.subtitle")}
          </div>
        </div>
      </div>
    </aside>
  );
};

