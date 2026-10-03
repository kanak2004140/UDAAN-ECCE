"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { LanguageResponse } from "@/lib/api/languages";
import { getLanguages } from "@/lib/api/languages";

const SELECTED_CHILD_STORAGE_KEY = "ecce_selected_child_id";
const SELECTED_LANGUAGE_STORAGE_KEY = "ecce_selected_language_id";

interface AppStateContextValue {
  selectedChildId: string | null;
  setSelectedChildId: (childId: string | null) => void;

  languages: LanguageResponse[];
  selectedLanguageId: string | null;
  setSelectedLanguageId: (languageId: string | null) => void;

  isOnline: boolean;
}

const AppStateContext = createContext<AppStateContextValue | undefined>(undefined);

function readStoredValue(key: string): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStoredValue(key: string, value: string | null): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    if (value === null) {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, value);
    }
  } catch {
    // Storage can be unavailable (private browsing, blocked); the app
    // still works, it just won't remember the choice next visit.
  }
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [selectedChildId, setSelectedChildIdState] = useState<string | null>(null);
  const [languages, setLanguages] = useState<LanguageResponse[]>([]);
  const [selectedLanguageId, setSelectedLanguageIdState] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setSelectedChildIdState(readStoredValue(SELECTED_CHILD_STORAGE_KEY));
    setSelectedLanguageIdState(readStoredValue(SELECTED_LANGUAGE_STORAGE_KEY));
  }, []);

  useEffect(() => {
    getLanguages()
      .then(setLanguages)
      .catch(() => setLanguages([]));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !("onLine" in navigator)) {
      return;
    }

    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const setSelectedChildId = (childId: string | null) => {
    setSelectedChildIdState(childId);
    writeStoredValue(SELECTED_CHILD_STORAGE_KEY, childId);
  };

  const setSelectedLanguageId = (languageId: string | null) => {
    setSelectedLanguageIdState(languageId);
    writeStoredValue(SELECTED_LANGUAGE_STORAGE_KEY, languageId);
  };

  const value = useMemo<AppStateContextValue>(
    () => ({
      selectedChildId,
      setSelectedChildId,
      languages,
      selectedLanguageId,
      setSelectedLanguageId,
      isOnline,
    }),
    [selectedChildId, languages, selectedLanguageId, isOnline],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateContextValue {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error("useAppState must be used within an AppStateProvider");
  }
  return context;
}
