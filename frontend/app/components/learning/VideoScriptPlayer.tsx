"use client";

import { useEffect, useState } from "react";
import type { StoryboardScene } from "@/lib/api/storyboards";

interface VideoScriptPlayerProps {
  videoUrl?: string | null;
  /** Language-independent scene plan (backend Phase 19). Shown as a slideshow
   * until a renderer produces a real `videoUrl`. */
  scenes?: StoryboardScene[];
  script: string;
}

/**
 * Pairs a (language-independent) visual asset with a per-language text
 * script (Roadmap Phase 17F) - the toddler teaching format, since 2-4/2-6
 * can't follow a page of text. A rendered `videoUrl` wins when present;
 * otherwise the storyboard scenes play as a timed slideshow, and with
 * neither a placeholder is shown. The script is the real generated lesson.
 */
export default function VideoScriptPlayer({ videoUrl, scenes, script }: VideoScriptPlayerProps) {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const hasScenes = !videoUrl && !!scenes && scenes.length > 0;
  const scene = hasScenes ? scenes![sceneIndex] : null;

  useEffect(() => {
    setSceneIndex(0);
    setPlaying(false);
  }, [scenes]);

  useEffect(() => {
    if (!playing || !scene) return;
    const timer = setTimeout(() => {
      if (sceneIndex + 1 < scenes!.length) setSceneIndex(sceneIndex + 1);
      else setPlaying(false);
    }, scene.duration_seconds * 1000);
    return () => clearTimeout(timer);
  }, [playing, scene, sceneIndex, scenes]);

  const buttonStyle = {
    padding: "0.4rem 0.9rem",
    borderRadius: "0.5rem",
    border: "none",
    background: "#fff",
    color: "#2b2d5c",
    cursor: "pointer",
  } as const;

  return (
    <div
      style={{
        marginTop: "1rem",
        maxWidth: "640px",
        borderRadius: "1rem",
        overflow: "hidden",
        background: "#fff",
        border: "1px solid #e2e2f0",
      }}
    >
      {videoUrl ? (
        <video src={videoUrl} controls style={{ width: "100%", display: "block" }} />
      ) : scene ? (
        <div style={{ background: "#2b2d5c", color: "#fff", padding: "1rem" }}>
          <div
            style={{
              aspectRatio: "16 / 9",
              display: "grid",
              placeItems: "center",
              textAlign: "center",
              padding: "1rem",
            }}
          >
            {scene.visual_description}
          </div>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", justifyContent: "center" }}>
            <button style={buttonStyle} onClick={() => setSceneIndex(Math.max(sceneIndex - 1, 0))}>
              Back
            </button>
            <button style={buttonStyle} onClick={() => setPlaying(!playing)}>
              {playing ? "Pause" : "Play"}
            </button>
            <button
              style={buttonStyle}
              onClick={() => setSceneIndex(Math.min(sceneIndex + 1, scenes!.length - 1))}
            >
              Next
            </button>
            <span style={{ marginLeft: "0.5rem" }}>
              {sceneIndex + 1} / {scenes!.length}
            </span>
          </div>
        </div>
      ) : (
        <div
          style={{
            aspectRatio: "16 / 9",
            display: "grid",
            placeItems: "center",
            background: "#2b2d5c",
            color: "#fff",
          }}
        >
          Video coming soon
        </div>
      )}
      <p style={{ padding: "1rem", margin: 0, color: "#333", whiteSpace: "pre-wrap" }}>{script}</p>
    </div>
  );
}
