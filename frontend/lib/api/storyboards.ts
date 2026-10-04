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

export async function generateStoryboard(topicId: string): Promise<StoryboardResponse> {
  return api.post<StoryboardResponse>("/storyboards/generate", { topic_id: topicId });
}
