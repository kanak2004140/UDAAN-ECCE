import api from "@/lib/api/client";

export interface LearningSessionCreate {
  child_id: string;
}

export interface LearningSessionResponse {
  id: string;
  child_id: string;
  started_at: string;
  ended_at: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export async function createLearningSession(
  payload: LearningSessionCreate,
): Promise<LearningSessionResponse> {
  return api.post<LearningSessionResponse>("/learning-sessions", payload);
}

export async function getLearningSession(
  sessionId: string,
): Promise<LearningSessionResponse> {
  return api.get<LearningSessionResponse>(`/learning-sessions/${sessionId}`);
}
