import api from "@/lib/api/client";

export interface LearningObjectResponse {
  id: string;
  topic_id: string;
  name: string;
  description: string | null;
  learning_objective: string | null;
  difficulty_level: number;
  created_at: string;
  updated_at: string;
}

export async function getLearningObjects(): Promise<LearningObjectResponse[]> {
  return api.get<LearningObjectResponse[]>("/learning-objects");
}

export async function getLearningObject(
  learningObjectId: string,
): Promise<LearningObjectResponse> {
  return api.get<LearningObjectResponse>(`/learning-objects/${learningObjectId}`);
}
