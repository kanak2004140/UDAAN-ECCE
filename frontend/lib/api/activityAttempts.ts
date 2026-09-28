import api from "@/lib/api/client";

export interface ActivityAttemptCreate {
  learning_session_id: string;
  activity_id: string;
  status?: string;
  response?: Record<string, unknown> | null;
}

export interface ActivityAttemptResponse {
  id: string;
  learning_session_id: string;
  activity_id: string;
  started_at: string;
  completed_at: string | null;
  status: string;
  response: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export async function createActivityAttempt(
  payload: ActivityAttemptCreate,
): Promise<ActivityAttemptResponse> {
  return api.post<ActivityAttemptResponse>("/activity-attempts", payload);
}

export async function getSessionAttempts(
  learningSessionId: string,
): Promise<ActivityAttemptResponse[]> {
  return api.get<ActivityAttemptResponse[]>(`/activity-attempts/session/${learningSessionId}`);
}
