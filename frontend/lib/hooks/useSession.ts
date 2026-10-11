"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { UserResponse } from "@/lib/api/users";
import { readStoredUserRaw, subscribeToSession } from "@/lib/auth/session";

/**
 * Who is signed in on this device, from the saved session. Updates when the
 * user signs in or out in this tab or another. `user` is null when signed out
 * (and during the server render, so the first paint matches the server's).
 */
export function useSession() {
  const raw = useSyncExternalStore(subscribeToSession, readStoredUserRaw, () => "");
  const user = useMemo<UserResponse | null>(() => {
    if (!raw) return null;
    try {
      return JSON.parse(raw) as UserResponse;
    } catch {
      return null;
    }
  }, [raw]);
  return { user, signedIn: user !== null };
}
