"use client";

import { useEffect, useState } from "react";
import { getActivity, type ActivityResponse } from "@/lib/api/activities";
import { getActivityContents, type ActivityContentResponse } from "@/lib/api/activityContents";
import { getContentVariants, type ContentVariantResponse } from "@/lib/api/contentVariants";
import { createChild, getMyChildren } from "@/lib/api/children";
import { getUser } from "@/lib/api/users";
import { createLearningSession, type LearningSessionResponse } from "@/lib/api/learningSessions";
import { createActivityAttempt } from "@/lib/api/activityAttempts";
import { updateLearningProgress } from "@/lib/api/learningProgress";
import { ApiError } from "@/lib/api/client";
import DemoActivityContent from "@/app/components/learning/DemoActivityContent";

export type SelectedActivity = { id: string; name: string } | null;

type Props = {
  selectedActivity: SelectedActivity;
  ageGroup: string;
  onSessionStarted?: () => void;
  onActivityCompleted?: () => void;
};

type StoredUser = { id: string; name: string };

export default function ActivitySessionPanel({
  selectedActivity,
  ageGroup,
  onSessionStarted,
  onActivityCompleted,
}: Props) {
  const [details, setDetails] = useState<{
    activity: ActivityResponse;
    contents: ActivityContentResponse[];
    variants: ContentVariantResponse[];
  } | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [starting, setStarting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [session, setSession] = useState<LearningSessionResponse | null>(null);
  const [childId, setChildId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);

  useEffect(() => {
    if (!selectedActivity) {
      setDetails(null);
      setMessage(null);
      return;
    }

    // A new activity was picked - its own completion state starts fresh,
    // even though the learning session itself (and childId) carries over.
    setCompleted(false);

    const activitySelection = selectedActivity;

    let mounted = true;
    async function loadDetails() {
      setLoadingDetails(true);
      try {
        const activity = await getActivity(activitySelection.id);
        const contents = await getActivityContents(activity.id);
        const variantsByContent = await Promise.all(
          contents.map((content) => getContentVariants(content.id)),
        );
        if (mounted) {
          setDetails({ activity, contents, variants: variantsByContent.flat() });
          setError(null);
        }
      } catch (loadError) {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load activity details.");
        }
      } finally {
        if (mounted) {
          setLoadingDetails(false);
        }
      }
    }
    loadDetails();
    return () => {
      mounted = false;
    };
  }, [selectedActivity]);

  async function startSession() {
    if (starting) {
      // Already in flight - ignore extra clicks instead of racing two
      // requests and creating two Child records for the same learner.
      return;
    }

    const storedUser = window.localStorage.getItem("ecce_user");
    const cachedUser = storedUser ? (JSON.parse(storedUser) as StoredUser) : null;
    if (!cachedUser?.id) {
      setError("Please log in before starting a learning session.");
      setNeedsLogin(true);
      return;
    }

    setStarting(true);
    setError(null);
    setNeedsLogin(false);

    try {
      // Always re-fetch the current profile instead of trusting the
      // age_group cached in localStorage at login time - that cache can go
      // stale (a birthday passes, or the age-group rules change) while the
      // session token is still valid for up to 7 days.
      const freshUser = await getUser(cachedUser.id);
      window.localStorage.setItem("ecce_user", JSON.stringify(freshUser));

      if (!freshUser.date_of_birth) {
        setError("Your profile is missing a date of birth. Please contact support.");
        return;
      }

      if (!freshUser.age_group) {
        setError("Your date of birth does not match a supported learning age group.");
        return;
      }

      if (freshUser.age_group !== ageGroup) {
        setError(`This learner belongs to the ${freshUser.age_group} learning world.`);
        return;
      }

      // Reuse an existing child record for this user rather than creating a
      // new one on every session start, so progress accumulates on one child.
      const existingChildren = await getMyChildren();
      const child =
        existingChildren[0] ??
        (await createChild({
          name: freshUser.name,
          date_of_birth: freshUser.date_of_birth,
          profile_image: null,
        }));
      const learningSession = await createLearningSession({ child_id: child.id });
      setChildId(child.id);
      setSession(learningSession);
      setMessage("Learning session started.");
      onSessionStarted?.();
    } catch (startError) {
      if (startError instanceof ApiError && startError.status === 401) {
        window.localStorage.removeItem("ecce_access_token");
        window.localStorage.removeItem("ecce_user");
        setError("Your session has expired. Please log in again.");
        setNeedsLogin(true);
      } else {
        setError(startError instanceof Error ? startError.message : "Unable to start the learning session.");
      }
    } finally {
      setStarting(false);
    }
  }

  async function completeActivity() {
    if (!details || !session || !childId) {
      setError("Start a learning session before completing an activity.");
      return;
    }

    try {
      await createActivityAttempt({
        learning_session_id: session.id,
        activity_id: details.activity.id,
        status: "completed",
        response: { source: "learning-world" },
      });
      await updateLearningProgress({
        child_id: childId,
        learning_object_id: details.activity.learning_object_id,
        status: "completed",
        mastery_level: 100,
        successful: true,
      });
      setMessage("Activity completed and progress saved.");
      setError(null);
      setCompleted(true);
      onActivityCompleted?.();
    } catch (completeError) {
      if (completeError instanceof ApiError && completeError.status === 401) {
        window.localStorage.removeItem("ecce_access_token");
        window.localStorage.removeItem("ecce_user");
        setError("Your session has expired. Please log in again.");
        setNeedsLogin(true);
      } else {
        setError(completeError instanceof Error ? completeError.message : "Unable to save activity progress.");
      }
    }
  }

  if (!selectedActivity) {
    return null;
  }

  if (!details) {
    return (
      <section style={{ maxWidth: 960, margin: "0 auto 3rem", background: "#fff", borderRadius: 20, padding: "1.5rem 1.75rem", color: "#1c2440" }}>
        {loadingDetails && <p>Loading activity…</p>}
        {error && <p style={{ color: "#7a1f1f", fontWeight: 700 }}>{error}</p>}
      </section>
    );
  }

  return (
    <section style={{ maxWidth: 960, margin: "0 auto 3rem", background: "#fff", borderRadius: 20, padding: "1.5rem 1.75rem", color: "#1c2440" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <div>
          <strong>{details.activity.title}</strong>
          <p style={{ margin: "0.35rem 0" }}>{details.activity.description || "Explore this activity."}</p>
          {session && <small>Session active: {session.id}</small>}
        </div>
        <button
          type="button"
          onClick={startSession}
          disabled={starting}
          style={{ border: 0, borderRadius: 999, padding: "0.8rem 1.2rem", background: "#1f3c88", color: "#fff", fontWeight: 700, opacity: starting ? 0.7 : 1 }}
        >
          {starting ? "Starting…" : session ? "Restart session" : "Start learning session"}
        </button>
      </div>
      <DemoActivityContent
        activity={details.activity}
        contents={details.contents}
        variants={details.variants}
      />
      <p>Contents: {details.contents.length}. Variants: {details.variants.length}.</p>
      <button
        type="button"
        onClick={completeActivity}
        disabled={completed}
        style={{ border: 0, borderRadius: 999, padding: "0.8rem 1.2rem", background: completed ? "#9db8a8" : "#16805c", color: "#fff", fontWeight: 700, cursor: completed ? "default" : "pointer" }}
      >
        {completed ? "✓ Completed" : "Mark activity complete"}
      </button>
      {message && <p style={{ color: "#16805c", fontWeight: 700 }}>{message}</p>}
      {error && (
        <p style={{ color: "#7a1f1f", fontWeight: 700 }}>
          {error}
          {needsLogin && (
            <>
              {" "}
              <a href="/login" style={{ color: "#1f3c88", textDecoration: "underline" }}>
                Log in again
              </a>
            </>
          )}
        </p>
      )}
    </section>
  );
}
