import api from "@/lib/api/client";

export interface LearningProgressUpdate {
  child_id: string;
  learning_object_id: string;
  status?: string;
  mastery_level?: number;
  successful?: boolean;
}

export interface LearningProgressResponse {
  id: string;
  child_id: string;
  learning_object_id: string;
  status: string;
  mastery_level: number;
  attempts_count: number;
  successful_attempts: number;
  last_attempted_at: string | null;
  created_at: string;
  updated_at: string;
}

export async function updateLearningProgress(
  payload: LearningProgressUpdate,
): Promise<LearningProgressResponse> {
  return api.post<LearningProgressResponse>("/learning-progress", payload);
}

export async function getChildProgress(
  childId: string,
): Promise<LearningProgressResponse[]> {
  return api.get<LearningProgressResponse[]>(`/learning-progress/child/${childId}`);
}
