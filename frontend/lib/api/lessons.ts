import api from "@/lib/api/client";

export interface LessonResponse {
  topic_id: string;
  topic_name: string;
  age_group: string;
  lesson_text: string;
  content_chunk_ids: string[];
  content_source_ids: string[];
}

export async function generateLesson(topicId: string): Promise<LessonResponse> {
  return api.post<LessonResponse>("/lessons/generate", { topic_id: topicId });
}
