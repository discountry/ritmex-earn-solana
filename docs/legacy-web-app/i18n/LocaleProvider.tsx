"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import zhDict from "@/i18n/zh.json";
import enDict from "@/i18n/en.json";

export type Locale = "zh" | "en";

type Dictionary = typeof zhDict;

const dictionaries: Record<Locale, Dictionary> = { zh: zhDict, en: enDict };

const STORAGE_KEY = "ritmex-locale";

function getInitialLocale(): Locale {
  if (typeof window === "undefined") return "zh";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "zh" || stored === "en") return stored;
  const browserLang = navigator.language;
  return browserLang.startsWith("zh") ? "zh" : "en";
}

interface LocaleContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: Dictionary;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("zh");

  useEffect(() => {
    setLocaleState(getInitialLocale());
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem(STORAGE_KEY, l);
    document.documentElement.lang = l === "zh" ? "zh-CN" : "en";
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
  }, [locale]);

  return (
    <LocaleContext.Provider
      value={{ locale, setLocale, t: dictionaries[locale] }}
    >
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}
