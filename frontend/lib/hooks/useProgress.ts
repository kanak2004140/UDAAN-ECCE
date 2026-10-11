"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

const STORAGE_KEY = "ecce_learning_progress_v1";
const CHANGE_EVENT = "ecce-progress-changed";

interface StoredProgress {
  stars: number;
  completedTopics: string[];
}

const EMPTY: StoredProgress = { stars: 0, completedTopics: [] };

function parse(raw: string): StoredProgress {
  if (!raw) return EMPTY;
  try {
    const parsed = JSON.parse(raw) as Partial<StoredProgress>;
    return {
      stars: typeof parsed.stars === "number" ? parsed.stars : 0,
      completedTopics: Array.isArray(parsed.completedTopics) ? parsed.completedTopics : [],
    };
  } catch {
    return EMPTY;
  }
}

function readRaw(): string {
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

function write(next: StoredProgress) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage blocked: stars still work for this visit only.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

/**
 * Stars and finished lessons, kept on the device. This works offline and
 * needs no sign-in; syncing it to the server is a later step (the backend has
 * progress records for games, not yet for lessons).
 */
export function useProgress() {
  const raw = useSyncExternalStore(subscribe, readRaw, () => "");
  const progress = useMemo(() => parse(raw), [raw]);

  const addStar = useCallback(() => {
    const current = parse(readRaw());
    write({ ...current, stars: current.stars + 1 });
  }, []);

  const completeTopic = useCallback((topicId: string) => {
    const current = parse(readRaw());
    if (current.completedTopics.includes(topicId)) return false;
    write({ stars: current.stars + 1, completedTopics: [...current.completedTopics, topicId] });
    return true;
  }, []);

  const isDone = useCallback((topicId: string) => progress.completedTopics.includes(topicId), [progress]);

  return { stars: progress.stars, completedTopics: progress.completedTopics, addStar, completeTopic, isDone };
}
