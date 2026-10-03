"use client";

import { useState } from "react";
import TopicPicker from "@/app/components/learning/TopicPicker";
import LessonPanel from "@/app/components/learning/LessonPanel";
import LanguagePicker from "@/app/components/learning/LanguagePicker";
import type { TopicResponse } from "@/lib/api/topics";

interface AiTutorSectionProps {
  ageGroup: string;
}

/**
 * The NCERT-grounded AI tutor flow (Roadmap Phases 15F-16F), shown
 * alongside the existing demo activities rather than replacing them.
 */
export default function AiTutorSection({ ageGroup }: AiTutorSectionProps) {
  const [selectedTopic, setSelectedTopic] = useState<TopicResponse | null>(null);

  return (
    <section
      style={{
        margin: "1.5rem auto",
        padding: "1.5rem",
        maxWidth: "720px",
        borderRadius: "1.25rem",
        background: "#f4f4fb",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0, color: "#2b2d5c" }}>AI Tutor</h2>
        <LanguagePicker />
      </div>
      <TopicPicker ageGroup={ageGroup} onSelect={setSelectedTopic} />
      <LessonPanel topic={selectedTopic} variant={ageGroup === "2-4" ? "video" : "text"} />
    </section>
  );
}
