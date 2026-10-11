"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AgeGroup } from "@/lib/age/ageConfig";
import { getActivities, getActivity, type ActivityResponse } from "@/lib/api/activities";
import { getActivityContents, type ActivityContentResponse } from "@/lib/api/activityContents";
import { createActivityAttempt } from "@/lib/api/activityAttempts";
import { getContentVariants, type ContentVariantResponse } from "@/lib/api/contentVariants";
import { createChild, getMyChildren } from "@/lib/api/children";
import { ApiError } from "@/lib/api/client";
import { createLearningSession } from "@/lib/api/learningSessions";
import { updateLearningProgress } from "@/lib/api/learningProgress";
import { getUser } from "@/lib/api/users";

/** The practice games for an age group. */
export function useGames(ageGroup: AgeGroup) {
  const [games, setGames] = useState<ActivityResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    getActivities()
      .then((all) => {
        if (!alive) return;
        setGames(all.filter((a) => a.age_group === ageGroup && a.is_active).sort((a, b) => a.display_order - b.display_order));
        setError(null);
      })
      .catch((err) => {
        if (alive) setError(err instanceof Error ? err.message : "Could not load games.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [ageGroup]);

  return { games, loading, error };
}

export interface GameDetails {
  activity: ActivityResponse;
  contents: ActivityContentResponse[];
  variants: ContentVariantResponse[];
}

/** Everything one game needs to be played. */
export function useGameDetails(activityId: string | null) {
  const [result, setResult] = useState<{ id: string; details: GameDetails | null; error: string | null } | null>(null);

  useEffect(() => {
    if (!activityId) return;
    let alive = true;
    (async () => {
      try {
        const activity = await getActivity(activityId);
        const contents = await getActivityContents(activity.id);
        const variants = (await Promise.all(contents.map((c) => getContentVariants(c.id)))).flat();
        if (alive) setResult({ id: activityId, details: { activity, contents, variants }, error: null });
      } catch (err) {
        if (alive) setResult({ id: activityId, details: null, error: err instanceof Error ? err.message : "Could not load this game." });
      }
    })();
    return () => {
      alive = false;
    };
  }, [activityId]);

  const current = result && result.id === activityId ? result : null;
  return { details: current?.details ?? null, error: current?.error ?? null };
}

export type SaveStatus = "idle" | "saved" | "login" | "skipped" | "error";

interface StoredUser {
  id: string;
}

/**
 * Saves a finished game to the learner's record, silently. The child never
 * sees "sessions" or "progress" buttons: the first correct answer starts a
 * session behind the scenes and records the game as completed.
 */
export function useGameSession(ageGroup: AgeGroup) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const sessionRef = useRef<{ childId: string; sessionId: string } | null>(null);
  const recorded = useRef(new Set<string>());

  const ensureSession = useCallback(async () => {
    if (sessionRef.current) return sessionRef.current;

    const stored = window.localStorage.getItem("ecce_user");
    const cached = stored ? (JSON.parse(stored) as StoredUser) : null;
    if (!cached?.id) {
      setStatus("login");
      return null;
    }

    // Re-read the profile: the age group cached at login can be stale.
    const user = await getUser(cached.id);
    window.localStorage.setItem("ecce_user", JSON.stringify(user));
    if (!user.date_of_birth || !user.age_group || user.age_group !== ageGroup) {
      setStatus("skipped");
      return null;
    }

    const children = await getMyChildren();
    const child =
      children[0] ??
      (await createChild({ name: user.name, date_of_birth: user.date_of_birth, profile_image: null }));
    const session = await createLearningSession({ child_id: child.id });
    sessionRef.current = { childId: child.id, sessionId: session.id };
    return sessionRef.current;
  }, [ageGroup]);

  const record = useCallback(
    async (activity: ActivityResponse) => {
      if (recorded.current.has(activity.id)) return;
      recorded.current.add(activity.id);
      try {
        const session = await ensureSession();
        if (!session) {
          recorded.current.delete(activity.id);
          return;
        }
        await createActivityAttempt({
          learning_session_id: session.sessionId,
          activity_id: activity.id,
          status: "completed",
          response: { source: "learning-world" },
        });
        await updateLearningProgress({
          child_id: session.childId,
          learning_object_id: activity.learning_object_id,
          status: "completed",
          mastery_level: 100,
          successful: true,
        });
        setStatus("saved");
      } catch (err) {
        recorded.current.delete(activity.id);
        if (err instanceof ApiError && err.status === 401) {
          window.localStorage.removeItem("ecce_access_token");
          window.localStorage.removeItem("ecce_user");
          setStatus("login");
        } else {
          setStatus("error");
        }
      }
    },
    [ensureSession],
  );

  return { record, status };
}
