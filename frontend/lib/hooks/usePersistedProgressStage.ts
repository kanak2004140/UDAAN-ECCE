"use client";

import { useEffect, useState } from "react";
import { getMyChildren } from "@/lib/api/children";
import { getChildProgress } from "@/lib/api/learningProgress";
import type { ActivityResponse } from "@/lib/api/activities";

export type ProgressStage = "start" | "session" | "completed";

/**
 * Determines the learner's real progress stage for a given set of
 * age-group activities, from the database - not just React state that
 * resets on refresh.
 *
 * - "start": no child/session exists yet for this user.
 * - "session": a child exists (so a session was started at some point),
 *   but none of this age group's learning objects are marked completed.
 * - "completed": at least one learning object behind these activities has
 *   completed progress recorded for the child.
 *
 * This is intentionally non-blocking and silent on failure (e.g. the user
 * isn't logged in yet, or the request fails) - it only ever seeds the
 * initial stage. Live updates during the visit still come from
 * ActivitySessionPanel's onSessionStarted / onActivityCompleted callbacks.
 */
export function usePersistedProgressStage(activities: ActivityResponse[]) {
  const [stage, setStage] = useState<ProgressStage>("start");
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    if (activities.length === 0) {
      return;
    }

    let mounted = true;

    async function loadPersistedProgress() {
      try {
        const children = await getMyChildren();
        const child = children[0];
        if (!child) {
          if (mounted) {
            setResolved(true);
          }
          return;
        }

        const relevantLearningObjectIds = new Set(
          activities.map((activity) => activity.learning_object_id),
        );

        const progress = await getChildProgress(child.id);
        const hasCompleted = progress.some(
          (row) => relevantLearningObjectIds.has(row.learning_object_id) && row.status === "completed",
        );

        if (mounted) {
          setStage(hasCompleted ? "completed" : "session");
          setResolved(true);
        }
      } catch {
        // Not logged in yet, no children, or a network hiccup - fall back
        // to "start" silently rather than blocking or erroring the page.
        if (mounted) {
          setResolved(true);
        }
      }
    }

    loadPersistedProgress();

    return () => {
      mounted = false;
    };
  }, [activities]);

  return { stage, setStage, resolved };
}
