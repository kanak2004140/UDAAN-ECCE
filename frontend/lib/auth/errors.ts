import { ApiError } from "@/lib/api/client";

/** A message a person can act on, whatever went wrong. */
export function friendlyError(error: unknown, fallback: string): string {
  if (error instanceof ApiError) return error.message || fallback;
  // fetch() rejects with a TypeError when the server can't be reached at all.
  if (error instanceof TypeError) return "We can't reach the server. Please check your connection and try again.";
  return fallback;
}
