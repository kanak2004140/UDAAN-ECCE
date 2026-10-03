"use client";

import { useEffect, useState } from "react";
import { getTopics, type TopicResponse } from "@/lib/api/topics";

interface TopicPickerProps {
  ageGroup: string;
  onSelect: (topic: TopicResponse) => void;
}

/**
 * Age-differentiated topic selection (Roadmap Phase 15F): ages 4-8 get a
 * real picker since they can meaningfully choose; 2-4 can't, so the
 * assistant auto-selects the first available topic and the UI just shows
 * what was picked instead of a choice.
 */
export default function TopicPicker({ ageGroup, onSelect }: TopicPickerProps) {
  const [topics, setTopics] = useState<TopicResponse[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const childPicksTopic = ageGroup !== "2-4";

  useEffect(() => {
    let isMounted = true;

    getTopics({ age_group: ageGroup })
      .then((fetched) => {
        if (!isMounted) return;
        setTopics(fetched);
        setError(null);

        if (!childPicksTopic && fetched.length > 0) {
          const assistantChoice = fetched[0];
          setSelectedTopicId(assistantChoice.id);
          onSelect(assistantChoice);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "Unable to load topics.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ageGroup]);

  if (loading) {
    return <p style={{ color: "#2b2d5c" }}>Finding topics...</p>;
  }

  if (error) {
    return <p style={{ color: "#7a1f1f" }}>Unable to load topics: {error}</p>;
  }

  if (topics.length === 0) {
    return <p style={{ color: "#2b2d5c" }}>No topics are available for this age group yet.</p>;
  }

  if (!childPicksTopic) {
    const chosen = topics.find((t) => t.id === selectedTopicId) ?? topics[0];
    return (
      <p style={{ color: "#2b2d5c" }}>
        Your assistant picked today&apos;s topic: <strong>{chosen.name}</strong>
      </p>
    );
  }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
      {topics.map((topic) => (
        <button
          key={topic.id}
          type="button"
          onClick={() => {
            setSelectedTopicId(topic.id);
            onSelect(topic);
          }}
          style={{
            padding: "0.6rem 1rem",
            borderRadius: "999px",
            border: topic.id === selectedTopicId ? "2px solid #2b2d5c" : "1px solid #ccc",
            background: topic.id === selectedTopicId ? "#2b2d5c" : "#fff",
            color: topic.id === selectedTopicId ? "#fff" : "#2b2d5c",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          {topic.name}
        </button>
      ))}
    </div>
  );
}
