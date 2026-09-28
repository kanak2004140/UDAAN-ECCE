import type { ActivityResponse } from "@/lib/api/activities";
import type { ActivityContentResponse } from "@/lib/api/activityContents";
import type { ContentVariantResponse } from "@/lib/api/contentVariants";
import { useState } from "react";

type Props = {
  activity: ActivityResponse;
  contents: ActivityContentResponse[];
  variants: ContentVariantResponse[];
};

export default function DemoActivityContent({ activity, contents, variants }: Props) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const contentKey = contents[0]?.content_key ?? "";
  const variantText = variants[0]?.content_text ?? "";
  const options = Array.isArray(activity.config.options)
    ? activity.config.options.filter((option): option is string => typeof option === "string")
    : [];
  const chooseOption = (option: string) => setSelectedOption(option);
  const isCorrect = selectedOption?.toLowerCase() === variantText.toLowerCase();
  const optionButtons = options.map((option) => (
    <button
      key={option}
      type="button"
      onClick={() => chooseOption(option)}
      aria-pressed={selectedOption === option}
      disabled={isCorrect}
      style={{ ...choiceStyle, background: selectedOption === option ? "#d9f0ef" : "#fff", opacity: isCorrect && selectedOption !== option ? 0.55 : 1 }}
    >
      {option}
    </button>
  ));
  const feedback = selectedOption
    ? isCorrect
      ? `Correct: ${selectedOption}`
      : `You chose ${selectedOption}`
    : null;

  if (contentKey.startsWith("animals/")) {
    const animalIcon = contentKey.endsWith("/dog") ? "🐶" : contentKey.endsWith("/cow") ? "🐮" : "🐱";
    return (
      <div style={{ display: "grid", gap: 12, margin: "1rem 0" }}>
        <div style={{ fontSize: "5rem", textAlign: "center" }} role="img" aria-label={variantText || "Animal"}>
          {animalIcon}
        </div>
        <strong style={{ textAlign: "center", fontSize: "1.2rem" }}>{variantText || "Animal"}</strong>
        <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
          {optionButtons}
        </div>
        {feedback && <strong style={{ textAlign: "center", color: feedback.startsWith("Correct") ? "#16805c" : "#a15c00" }}>{feedback}</strong>}
      </div>
    );
  }

  if (contentKey.startsWith("colors/")) {
    return (
      <div style={{ display: "grid", gap: 12, margin: "1rem 0" }}>
        <div style={{ width: 120, height: 120, margin: "0 auto", borderRadius: "50%", background: contentKey.endsWith("/red") ? "#ef5b5b" : "#4f9de8" }} role="img" aria-label={variantText || "Color"} />
        <strong style={{ textAlign: "center", fontSize: "1.2rem" }}>{variantText || "Color"}</strong>
        <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>{optionButtons}</div>
        {feedback && <strong style={{ textAlign: "center", color: isCorrect ? "#16805c" : "#a15c00" }}>{feedback}</strong>}
      </div>
    );
  }

  if (contentKey.startsWith("shapes/")) {
    const shapeStyle = contentKey.endsWith("/triangle")
      ? { width: 0, height: 0, borderLeft: "60px solid transparent", borderRight: "60px solid transparent", borderBottom: "105px solid #ef8f5b" }
      : contentKey.endsWith("/square")
        ? { width: 120, height: 120, background: "#74b9a5" }
        : { width: 120, height: 120, borderRadius: "50%", background: "#f7c948" };
    return (
      <div style={{ display: "grid", gap: 12, margin: "1rem 0" }}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div style={{ ...shapeStyle, display: "grid", placeItems: "center", fontWeight: 800 }} />
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
          {optionButtons}
        </div>
        {feedback && <strong style={{ textAlign: "center", color: feedback.startsWith("Correct") ? "#16805c" : "#a15c00" }}>{feedback}</strong>}
      </div>
    );
  }

  if (contentKey.startsWith("stars/")) {
    const starCounts: Record<string, number> = { three: 3, five: 5, seven: 7 };
    const starCount = starCounts[contentKey.split("/").at(-1) ?? ""] ?? 5;
    return (
      <div style={{ display: "grid", gap: 12, margin: "1rem 0" }}>
        <div style={{ textAlign: "center", fontSize: "3rem", letterSpacing: 8 }} role="img" aria-label={`${starCount} stars`}>
          {Array.from({ length: starCount }, (_, index) => <span key={index}>★</span>)}
        </div>
        <strong style={{ textAlign: "center", fontSize: "1.2rem" }}>{variantText || "Five"}</strong>
        <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
          {optionButtons}
        </div>
        {feedback && <strong style={{ textAlign: "center", color: feedback.startsWith("Correct") ? "#16805c" : "#a15c00" }}>{feedback}</strong>}
      </div>
    );
  }

  return null;
}

const choiceStyle = {
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  padding: "0.6rem 0.9rem",
  background: "#fff",
  color: "#1c2440",
  fontWeight: 700,
  cursor: "pointer",
};
