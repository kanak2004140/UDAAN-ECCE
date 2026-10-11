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
  subject_name: string | null;
  language_code: string | null;
  language_name: string | null;
  /** "approved" | "pending_review" | null (no stored lesson yet) */
  lesson_status: string | null;
}

export async function getTopics(params?: {
  age_group?: string;
  subject_id?: string;
  language_id?: string;
  lesson_status?: "approved" | "any";
}): Promise<TopicResponse[]> {
  return api.get<TopicResponse[]>("/topics", { params });
}

export async function getTopic(topicId: string): Promise<TopicResponse> {
  return api.get<TopicResponse>(`/topics/${topicId}`);
}
