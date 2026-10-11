"use client";

import { useEffect, useMemo, useState } from "react";
import { SHOW_DRAFT_LESSONS, type AgeGroup } from "@/lib/age/ageConfig";
import { getTopics, type TopicResponse } from "@/lib/api/topics";
import { useAppState } from "@/lib/context/AppStateContext";

interface Result {
  key: string;
  topics: TopicResponse[];
  error: string | null;
}

/**
 * The lessons a child of this age can be taught right now, in the chosen
 * language: topics that have an approved stored lesson. The language defaults
 * to English until a grown-up picks another.
 */
export function useLessonTopics(ageGroup: AgeGroup) {
  const { languages, languagesLoaded, selectedLanguageId } = useAppState();
  const [result, setResult] = useState<Result | null>(null);

  const language = useMemo(
    () =>
      languages.find((l) => l.id === selectedLanguageId) ??
      languages.find((l) => l.code === "en") ??
      languages[0] ??
      null,
    [languages, selectedLanguageId],
  );
  const languageId = language?.id;
  const key = languagesLoaded ? `${ageGroup}|${languageId ?? ""}` : null;

  useEffect(() => {
    if (key === null) return;
    let alive = true;
    getTopics({
      age_group: ageGroup,
      language_id: languageId,
      lesson_status: SHOW_DRAFT_LESSONS ? "any" : "approved",
    })
      .then((topics) => alive && setResult({ key, topics, error: null }))
      .catch((err) => alive && setResult({ key, topics: [], error: err instanceof Error ? err.message : "Could not load lessons." }));
    return () => {
      alive = false;
    };
  }, [key, ageGroup, languageId]);

  const current = result && result.key === key ? result : null;
  return {
    topics: current?.topics ?? [],
    language,
    loading: key === null || current === null,
    error: current?.error ?? null,
  };
}
