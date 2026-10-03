"use client";

import { useEffect, useState } from "react";
import LittleExplorerWorld, {
  type LearningSubject,
} from "@/app/components/age_groups/2-4/LittleExplorerWorld";
import { getActivities, type ActivityResponse } from "@/lib/api/activities";
import ActivitySessionPanel from "@/app/components/learning/ActivitySessionPanel";
import AiTutorSection from "@/app/components/learning/AiTutorSection";
import { usePersistedProgressStage } from "@/lib/hooks/usePersistedProgressStage";

const AGE_GROUP = "2-4";

const iconForActivity = (activityType: string, title: string): string => {
  const type = activityType.toLowerCase();

  if (type.includes("image") || title.toLowerCase().includes("animal")) {
    return "animal";
  }

  if (type.includes("image") || type.includes("story") || type.includes("reading")) {
    return "book";
  }

  if (type.includes("audio") || type.includes("sound") || type.includes("music")) {
    return "music";
  }

  if (type.includes("number") || type.includes("count") || title.toLowerCase().includes("number")) {
    return "numbers";
  }

  if (type.includes("color") || type.includes("draw") || type.includes("art")) {
    return "art";
  }

  if (type.includes("match") || type.includes("game") || type.includes("puzzle")) {
    return "puzzle";
  }

  if (title.toLowerCase().includes("animal") || title.toLowerCase().includes("nature")) {
    return "tree";
  }

  return "book";
};

const mapActivityToSubject = (activity: ActivityResponse): LearningSubject => ({
  id: activity.id,
  name: activity.title,
  label: activity.activity_type.replace(/_/g, " "),
  icon: iconForActivity(activity.activity_type, activity.title),
});

export default function LittleExplorersPage() {
  const [subjects, setSubjects] = useState<LearningSubject[]>([]);
  const [ageGroupActivities, setAgeGroupActivities] = useState<ActivityResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<LearningSubject | null>(null);
  const { stage: progressStage, setStage: setProgressStage } = usePersistedProgressStage(ageGroupActivities);

  useEffect(() => {
    let isMounted = true;

    async function loadSubjects() {
      try {
        const activities = await getActivities();
        const filtered = activities.filter((activity) => activity.age_group === AGE_GROUP);

        if (isMounted) {
          setSubjects(filtered.map(mapActivityToSubject));
          setAgeGroupActivities(filtered);
          setError(null);
        }
      } catch (loadError) {
        if (isMounted) {
          setSubjects([]);
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load learning activities.",
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadSubjects();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", color: "#2f2d4a" }}>
        Loading learning world...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", color: "#7a1f1f", padding: "2rem" }}>
        Unable to load activities: {error}
      </div>
    );
  }

  return (
    <>
      <LittleExplorerWorld
        ageLabel="Little Explorers · 2–4 years"
        subjects={subjects}
        onSelect={setSelectedSubject}
        progressStage={progressStage}
      />
      <ActivitySessionPanel
        selectedActivity={selectedSubject}
        ageGroup={AGE_GROUP}
        onSessionStarted={() => setProgressStage((stage) => (stage === "start" ? "session" : stage))}
        onActivityCompleted={() => setProgressStage("completed")}
      />
      <AiTutorSection ageGroup={AGE_GROUP} />
    </>
  );
}
