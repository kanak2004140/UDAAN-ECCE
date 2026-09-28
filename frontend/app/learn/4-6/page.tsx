"use client";

import { useEffect, useState } from "react";
import CuriousLearnerWorld, {
  type LearningSubject,
} from "@/app/components/age_groups/4-6/CuriousLearnerWorld";
import { getActivities, type ActivityResponse } from "@/lib/api/activities";
import ActivitySessionPanel from "@/app/components/learning/ActivitySessionPanel";
import { usePersistedProgressStage } from "@/lib/hooks/usePersistedProgressStage";

const AGE_GROUP = "4-6";

const iconForActivity = (activityType: string, title: string): string => {
  const type = activityType.toLowerCase();

  if (type.includes("shape") || title.toLowerCase().includes("shape")) {
    return "shape";
  }

  if (type.includes("language") || type.includes("reading") || type.includes("story")) {
    return "language";
  }

  if (type.includes("english") || type.includes("word") || type.includes("alphabet")) {
    return "english";
  }

  if (type.includes("hindi") || type.includes("vocabulary") || type.includes("speaking")) {
    return "hindi";
  }

  if (type.includes("math") || type.includes("number") || type.includes("count")) {
    return "math";
  }

  if (type.includes("science") || type.includes("explore") || title.toLowerCase().includes("world")) {
    return "science";
  }

  if (type.includes("draw") || type.includes("art") || type.includes("music")) {
    return "create";
  }

  return "language";
};

const mapActivityToSubject = (activity: ActivityResponse): LearningSubject => ({
  id: activity.id,
  name: activity.title,
  label: activity.activity_type.replace(/_/g, " "),
  icon: iconForActivity(activity.activity_type, activity.title),
});

export default function CuriousLearnersPage() {
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
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", color: "#2b2d5c" }}>
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
      <CuriousLearnerWorld
        ageLabel="Curious Learners · 4–6 years"
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
    </>
  );
}
