"use client";

import { useEffect, useState } from "react";
import YoungAdventurerWorld, {
  type LearningSubject,
} from "@/app/components/age_groups/6-8/YoungAdventurerWorld";
import { getActivities, type ActivityResponse } from "@/lib/api/activities";
import ActivitySessionPanel from "@/app/components/learning/ActivitySessionPanel";
import { usePersistedProgressStage } from "@/lib/hooks/usePersistedProgressStage";

const AGE_GROUP = "6-8";

const iconForActivity = (activityType: string, title: string): string => {
  const type = activityType.toLowerCase();

  if (type.includes("number") || type.includes("star") || title.toLowerCase().includes("star")) {
    return "stars";
  }

  if (type.includes("language") || type.includes("story") || type.includes("reading")) {
    return "Aa";
  }

  if (type.includes("math") || type.includes("number") || type.includes("count") || title.toLowerCase().includes("math")) {
    return "+ − ×";
  }

  if (type.includes("english") || type.includes("word") || type.includes("alphabet")) {
    return "ABC";
  }

  if (type.includes("science") || type.includes("explore") || type.includes("nature")) {
    return "✦";
  }

  if (type.includes("creative") || type.includes("draw") || type.includes("art") || type.includes("music")) {
    return "✎";
  }

  if (type.includes("game") || type.includes("puzzle") || type.includes("challenge")) {
    return "◆";
  }

  return "★";
};

const mapActivityToSubject = (activity: ActivityResponse): LearningSubject => ({
  id: activity.id,
  name: activity.title,
  label: activity.activity_type.replace(/_/g, " "),
  icon: iconForActivity(activity.activity_type, activity.title),
});

export default function YoungAdventurersPage() {
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
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", color: "#20243c" }}>
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
      <YoungAdventurerWorld subjects={subjects} onSelect={setSelectedSubject} progressStage={progressStage} />
      <ActivitySessionPanel
        selectedActivity={selectedSubject}
        ageGroup={AGE_GROUP}
        onSessionStarted={() => setProgressStage((stage) => (stage === "start" ? "session" : stage))}
        onActivityCompleted={() => setProgressStage("completed")}
      />
    </>
  );
}
