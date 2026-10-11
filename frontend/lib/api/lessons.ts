import api from "@/lib/api/client";

export interface LessonResponse {
  topic_id: string;
  topic_name: string;
  age_group: string;
  lesson_text: string;
  content_chunk_ids: string[];
  content_source_ids: string[];
  review_status: string;
}

/**
 * The stored lesson for a topic. Never triggers AI generation (that is a
 * batch job), so it is fast and safe to call from a child's tap. Fails with a
 * 404 when the lesson is not approved yet.
 */
export async function getLesson(topicId: string): Promise<LessonResponse> {
  return api.get<LessonResponse>(`/lessons/${topicId}`);
}
