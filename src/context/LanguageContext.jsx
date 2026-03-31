import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_LANGUAGE,
  getLanguageMeta,
  getUiText,
  LANGUAGE_OPTIONS,
  normalizeLanguage,
} from "../data/uiText";

const LANGUAGE_STORAGE_KEY = "gamegrid_language_v1";

const LanguageContext = createContext(null);

function getStoredLanguage() {
  if (typeof window === "undefined") {
    return DEFAULT_LANGUAGE;
  }

  try {
    const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return normalizeLanguage(saved ?? DEFAULT_LANGUAGE);
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(getStoredLanguage);

  useEffect(() => {
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {
      // Ignore storage failures.
    }
  }, [language]);

  const value = useMemo(() => {
    const meta = getLanguageMeta(language);
    const uiText = getUiText(language);

    return {
      language,
      locale: meta.locale,
      apiLanguage: meta.api,
      pollLanguage: meta.poll,
      options: LANGUAGE_OPTIONS,
      uiText,
      setLanguage: (nextLanguage) => setLanguageState(normalizeLanguage(nextLanguage)),
      t: (path, ...args) => {
        const valueFromPath = String(path)
          .split(".")
          .reduce((current, key) => current?.[key], uiText);

        if (typeof valueFromPath === "function") {
          return valueFromPath(...args);
        }

        return valueFromPath;
      },
    };
  }, [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }

  return context;
}
