import api from "@/lib/api/client";

export interface StoryboardScene {
  index: number;
  visual_description: string;
  duration_seconds: number;
  narration_cue: string;
}

export interface StoryboardResponse {
  topic_id: string;
  age_group: string;
  scenes: StoryboardScene[];
  content_chunk_ids: string[];
  generator_model: string;
  review_status: string;
  created_at: string;
}

/** The stored scene plan for a topic; 404 when none is approved yet. */
export async function getStoryboard(topicId: string): Promise<StoryboardResponse> {
  return api.get<StoryboardResponse>(`/storyboards/${topicId}`);
}

export async function generateStoryboard(topicId: string): Promise<StoryboardResponse> {
  return api.post<StoryboardResponse>("/storyboards/generate", { topic_id: topicId });
}
