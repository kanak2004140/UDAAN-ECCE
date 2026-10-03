import api from "@/lib/api/client";

export interface TopicResponse {
  id: string;
  subject_id: string;
  name: string;
  description: string | null;
  age_group: string;
  difficulty_level: number;
  display_order: number;
  created_at: string;
}

export async function getTopics(params?: {
  age_group?: string;
  subject_id?: string;
}): Promise<TopicResponse[]> {
  return api.get<TopicResponse[]>("/topics", { params });
}

export async function getTopic(topicId: string): Promise<TopicResponse> {
  return api.get<TopicResponse>(`/topics/${topicId}`);
}
