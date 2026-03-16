import { useMemo } from "react";
import { usePreferences } from "../context/PreferencesContext";
import { getDict, type I18nKey } from "./strings";

export function useI18n() {
  const { prefs } = usePreferences();
  const dict = useMemo(() => getDict(prefs.language), [prefs.language]);

  function t(key: I18nKey): string {
    return dict[key] || key;
  }

  return { t, lang: prefs.language };
}

