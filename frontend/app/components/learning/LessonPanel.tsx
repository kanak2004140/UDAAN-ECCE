"use client";

import { useEffect, useRef, useState } from "react";
import { generateLesson, type LessonResponse } from "@/lib/api/lessons";
import type { TopicResponse } from "@/lib/api/topics";
import VideoScriptPlayer from "@/app/components/learning/VideoScriptPlayer";

interface LessonPanelProps {
  topic: TopicResponse | null;
  /** "video" pairs the generated script with a visual asset (Phase 17F),
   * for age bands that are taught through video+narration rather than text. */
  variant?: "text" | "video";
}

/**
 * Renders an RAG-generated lesson for the selected topic (Roadmap Phase
 * 16F). Replaces the old hardcoded-emoji demo content with the real
 * generated-content loop added in backend Phase 18.
 */
export default function LessonPanel({ topic, variant = "text" }: LessonPanelProps) {
  const [lesson, setLesson] = useState<LessonResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Re-selecting a topic (e.g. tapping back and forth) reuses the first
  // generated lesson instead of paying for the LLM again every time.
  const cacheRef = useRef(new Map<string, LessonResponse>());

  useEffect(() => {
    if (!topic) {
      setLesson(null);
      setError(null);
      return;
    }

    const cached = cacheRef.current.get(topic.id);
    if (cached) {
      setLesson(cached);
      setError(null);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLesson(null);
    setLoading(true);
    setError(null);

    generateLesson(topic.id)
      .then((result) => {
        cacheRef.current.set(topic.id, result);
        if (isMounted) setLesson(result);
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Unable to generate a lesson right now.");
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic?.id]);

  if (!topic) {
    return null;
  }

  if (variant === "video") {
    if (loading) {
      return <p style={{ color: "#2b2d5c" }}>Preparing your lesson...</p>;
    }
    if (error) {
      return (
        <p style={{ color: "#7a1f1f" }}>
          {error} This topic may not have approved content yet, or live generation isn&apos;t
          configured.
        </p>
      );
    }
    if (lesson) {
      return <VideoScriptPlayer videoUrl={null} script={lesson.lesson_text} />;
    }
    return null;
  }

  return (
    <div
      style={{
        marginTop: "1rem",
        padding: "1.25rem",
        borderRadius: "1rem",
        background: "#fff",
        border: "1px solid #e2e2f0",
        maxWidth: "640px",
      }}
    >
      <h3 style={{ margin: 0, color: "#2b2d5c" }}>{topic.name}</h3>

      {loading && <p style={{ color: "#2b2d5c" }}>Preparing your lesson...</p>}

      {error && (
        <p style={{ color: "#7a1f1f" }}>
          {error} This topic may not have approved content yet, or live generation isn&apos;t
          configured.
        </p>
      )}

      {lesson && !loading && !error && (
        <>
          <p style={{ whiteSpace: "pre-wrap", color: "#333" }}>{lesson.lesson_text}</p>
          <p style={{ fontSize: "0.8rem", color: "#888" }}>
            Grounded in {lesson.content_source_ids.length} NCERT source(s).
          </p>
        </>
      )}
    </div>
  );
}
