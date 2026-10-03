"use client";

interface VideoScriptPlayerProps {
  videoUrl?: string | null;
  script: string;
}

/**
 * Pairs a (language-independent) visual asset with a per-language text
 * script (Roadmap Phase 17F) - the toddler teaching format, since 2-4/2-6
 * can't follow a page of text. No video generation pipeline exists yet
 * (backend Phase 19), so `videoUrl` will be undefined for now and this
 * renders a placeholder in its place; the script still renders for real,
 * driven by the actual generated lesson text.
 */
export default function VideoScriptPlayer({ videoUrl, script }: VideoScriptPlayerProps) {
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
