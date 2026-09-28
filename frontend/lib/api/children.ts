import api from "@/lib/api/client";

export interface ChildCreate {
  name: string;
  date_of_birth: string;
  // Ignored by the server - it recomputes these from date_of_birth. Kept
  // optional here for backwards compatibility with existing callers.
  age?: number;
  age_group?: string;
  profile_image?: string | null;
}

export interface ChildResponse {
  id: string;
  name: string;
  date_of_birth: string;
  age: number;
  age_group: string;
  profile_image: string | null;
  created_at: string;
  updated_at: string;
}

export async function createChild(payload: ChildCreate): Promise<ChildResponse> {
  return api.post<ChildResponse>("/children", payload);
}

export async function getChild(childId: string): Promise<ChildResponse> {
  return api.get<ChildResponse>(`/children/${childId}`);
}

export async function getMyChildren(): Promise<ChildResponse[]> {
  return api.get<ChildResponse[]>("/children");
}
