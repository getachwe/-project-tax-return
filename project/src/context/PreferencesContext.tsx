import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Language = "he" | "en";
export type ThemeMode = "light" | "dark";

export type Preferences = {
  theme: ThemeMode;
  language: Language;
  emailNotifications: boolean;
};

const STORAGE_KEY = "tax-app-preferences";

type PreferencesContextValue = {
  prefs: Preferences;
  setPrefs: (next: Preferences) => void;
  updatePrefs: (next: Partial<Preferences>) => void;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

function getInitialPrefs(): Preferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Preferences>;
      return {
        theme: parsed.theme === "dark" ? "dark" : "light",
        language: parsed.language === "en" ? "en" : "he",
        emailNotifications:
          typeof parsed.emailNotifications === "boolean"
            ? parsed.emailNotifications
            : true,
      };
    }
  } catch {
    // ignore
  }
  return { theme: "light", language: "he", emailNotifications: true };
}

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [prefs, setPrefsState] = useState<Preferences>(() => getInitialPrefs());

  const setPrefs = (next: Preferences) => {
    setPrefsState(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore storage errors
    }
  };

  const updatePrefs = (next: Partial<Preferences>) => {
    setPrefs({ ...prefs, ...next });
  };

  // Apply theme + language globally
  useEffect(() => {
    const root = document.documentElement;
    if (prefs.theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");

    root.lang = prefs.language;
    root.dir = prefs.language === "he" ? "rtl" : "ltr";
  }, [prefs.theme, prefs.language]);

  const value = useMemo(
    () => ({ prefs, setPrefs, updatePrefs }),
    [prefs]
  );

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
};

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error("usePreferences must be used within PreferencesProvider");
  return ctx;
}

