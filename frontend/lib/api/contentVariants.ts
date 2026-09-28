import api from "@/lib/api/client";

export interface ContentVariantResponse {
  id: string;
  activity_content_id: string;
  language_id: string;
  content_key: string;
  content_text: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export async function getContentVariants(
  activityContentId: string,
): Promise<ContentVariantResponse[]> {
  return api.get<ContentVariantResponse[]>(`/activity-contents/${activityContentId}/variants`);
}
