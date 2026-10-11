import type { AuthResponse, UserResponse } from "@/lib/api/users";

export const TOKEN_KEY = "ecce_access_token";
export const USER_KEY = "ecce_user";
const CHANGE_EVENT = "ecce-session-changed";

function notify() {
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** Keep the sign-in the server gave us. The token is what proves who we are; the user is a copy for showing a name. */
export function saveSession(auth: AuthResponse) {
  try {
    window.localStorage.setItem(TOKEN_KEY, auth.access_token);
    window.localStorage.setItem(USER_KEY, JSON.stringify(auth.user));
  } catch {
    // Storage blocked (private mode): the visit still works, it just won't be remembered.
  }
  notify();
}

/** Refresh the stored copy of the user after asking the server who is signed in. */
export function saveUser(user: UserResponse) {
  try {
    window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // see saveSession
  }
  notify();
}

export function clearSession() {
  try {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
  } catch {
    // see saveSession
  }
  notify();
}

export function readStoredUserRaw(): string {
  try {
    // Without a token the stored user is stale, so treat it as signed out.
    if (!window.localStorage.getItem(TOKEN_KEY)) return "";
    return window.localStorage.getItem(USER_KEY) ?? "";
  } catch {
    return "";
  }
}

export function subscribeToSession(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

/** A child account goes straight to its own stage; a parent picks who is learning. */
export function homePathFor(user: Pick<UserResponse, "age_group">): string {
  return user.age_group ? `/learn/${user.age_group}` : "/learn";
}
