"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const LANGUAGE_TAGS: Record<string, string> = {
  en: "en-IN",
  hi: "hi-IN",
  ur: "ur-PK",
  bn: "bn-IN",
  ta: "ta-IN",
  te: "te-IN",
  mr: "mr-IN",
  gu: "gu-IN",
  kn: "kn-IN",
  ml: "ml-IN",
  pa: "pa-IN",
  or: "or-IN",
  as: "as-IN",
};

export interface SpeakOptions {
  rate?: number;
  pitch?: number;
}

/** Reading time used when no voice is available, so stories still advance. */
function estimateMs(text: string): number {
  return Math.min(Math.max(1800, text.length * 75), 12000);
}

/**
 * Read text aloud with the device's own voices (works offline when the
 * device has an offline voice installed). Sequences can be cancelled at any
 * moment; every call resolves to `true` only if it ran to the end.
 */
export function useSpeech(languageCode: string | null | undefined, defaults: SpeakOptions = {}) {
  const [speaking, setSpeaking] = useState(false);
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;
  const runRef = useRef(0);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const defaultsRef = useRef(defaults);

  useEffect(() => {
    defaultsRef.current = defaults;
  });

  const tag = LANGUAGE_TAGS[languageCode ?? "en"] ?? languageCode ?? "en-IN";

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }
    const load = () => {
      voicesRef.current = window.speechSynthesis.getVoices();
    };
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", load);
      runRef.current += 1;
      window.speechSynthesis.cancel();
    };
  }, []);

  const speakOne = useCallback(
    (text: string, options: SpeakOptions, run: number) =>
      new Promise<boolean>((resolve) => {
        const finishAfterReadingTime = () =>
          window.setTimeout(() => resolve(run === runRef.current), estimateMs(text));

        if (!supported || typeof window === "undefined") {
          finishAfterReadingTime();
          return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        const base = tag.split("-")[0].toLowerCase();
        const voice =
          voicesRef.current.find((v) => v.lang.toLowerCase().startsWith(tag.toLowerCase())) ??
          voicesRef.current.find((v) => v.lang.toLowerCase().startsWith(base));
        if (voice) utterance.voice = voice;
        utterance.lang = voice?.lang ?? tag;
        utterance.rate = options.rate ?? defaultsRef.current.rate ?? 0.95;
        utterance.pitch = options.pitch ?? defaultsRef.current.pitch ?? 1;

        let settled = false;
        const safety = window.setTimeout(() => {
          if (!settled) {
            settled = true;
            resolve(run === runRef.current);
          }
        }, estimateMs(text) * 4 + 4000);

        utterance.onend = () => {
          if (settled) return;
          settled = true;
          window.clearTimeout(safety);
          resolve(run === runRef.current);
        };
        utterance.onerror = (event) => {
          if (settled) return;
          settled = true;
          window.clearTimeout(safety);
          if (event.error === "interrupted" || event.error === "canceled") {
            resolve(false);
          } else {
            // Voice failed (e.g. none installed): keep the story moving.
            window.setTimeout(() => resolve(run === runRef.current), estimateMs(text));
          }
        };
        window.speechSynthesis.speak(utterance);
      }),
    [supported, tag],
  );

  const cancel = useCallback(() => {
    runRef.current += 1;
    setSpeaking(false);
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const speak = useCallback(
    async (text: string, options: SpeakOptions = {}) => {
      cancel();
      const run = runRef.current;
      setSpeaking(true);
      const finished = await speakOne(text, options, run);
      if (run === runRef.current) setSpeaking(false);
      return finished;
    },
    [cancel, speakOne],
  );

  const speakSequence = useCallback(
    async (items: string[], onItem: (index: number) => void, startAt = 0, options: SpeakOptions = {}) => {
      cancel();
      const run = runRef.current;
      setSpeaking(true);
      for (let i = startAt; i < items.length; i += 1) {
        if (run !== runRef.current) return false;
        onItem(i);
        const finished = await speakOne(items[i], options, run);
        if (!finished) return false;
      }
      if (run === runRef.current) setSpeaking(false);
      return true;
    },
    [cancel, speakOne],
  );

  return { speak, speakSequence, cancel, speaking, supported };
}
