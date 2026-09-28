import api from "@/lib/api/client";

export interface ActivityContentResponse {
  id: string;
  activity_id: string;
  content_type: string;
  content_key: string;
  display_order: number;
  is_required: boolean;
  content_metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export async function getActivityContents(
  activityId: string,
): Promise<ActivityContentResponse[]> {
  return api.get<ActivityContentResponse[]>(`/activities/${activityId}/contents`);
}
