"use client";

import { useEffect, useState } from "react";
import { getLesson, type LessonResponse } from "@/lib/api/lessons";
import { getStoryboard, type StoryboardScene } from "@/lib/api/storyboards";

// Stored lessons do not change while the app is open, so keep them for the
// session: re-opening a lesson is instant (and a step toward offline use).
const lessonCache = new Map<string, LessonResponse>();
const sceneCache = new Map<string, StoryboardScene[]>();

interface LessonEntry {
  id: string;
  lesson: LessonResponse | null;
  error: string | null;
}

interface SceneEntry {
  id: string;
  scenes: StoryboardScene[];
}

/** Load a topic's stored lesson (and, optionally, its scene plan). */
export function useLesson(topicId: string | null, withScenes = false) {
  const [entry, setEntry] = useState<LessonEntry | null>(null);
  const [sceneEntry, setSceneEntry] = useState<SceneEntry | null>(null);

  const cachedLesson = topicId ? lessonCache.get(topicId) : undefined;

  useEffect(() => {
    if (!topicId || lessonCache.has(topicId)) return;
    let alive = true;
    getLesson(topicId)
      .then((lesson) => {
        lessonCache.set(topicId, lesson);
        if (alive) setEntry({ id: topicId, lesson, error: null });
      })
      .catch((err) => {
        if (alive) setEntry({ id: topicId, lesson: null, error: err instanceof Error ? err.message : "This lesson is not ready yet." });
      });
    return () => {
      alive = false;
    };
  }, [topicId]);

  useEffect(() => {
    if (!topicId || !withScenes || sceneCache.has(topicId)) return;
    let alive = true;
    // Best effort: a lesson plays fine without a scene plan.
    getStoryboard(topicId)
      .then((result) => {
        sceneCache.set(topicId, result.scenes);
        if (alive) setSceneEntry({ id: topicId, scenes: result.scenes });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [topicId, withScenes]);

  const current = entry && entry.id === topicId ? entry : null;
  const lesson = cachedLesson ?? current?.lesson ?? null;
  const scenes = (topicId ? sceneCache.get(topicId) : undefined) ?? (sceneEntry && sceneEntry.id === topicId ? sceneEntry.scenes : []);

  return {
    lesson,
    scenes,
    loading: topicId !== null && lesson === null && current === null,
    error: lesson ? null : (current?.error ?? null),
  };
}
