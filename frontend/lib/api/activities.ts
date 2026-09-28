import api from "@/lib/api/client";

export interface ActivityResponse {
  id: string;
  learning_object_id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  activity_type: string;
  config: Record<string, unknown>;
  age_group: string;
  difficulty_level: number;
  duration_seconds: number | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function getActivities(): Promise<ActivityResponse[]> {
  return api.get<ActivityResponse[]>("/activities");
}

export async function getActivity(activityId: string): Promise<ActivityResponse> {
  return api.get<ActivityResponse>(`/activities/${activityId}`);
}
