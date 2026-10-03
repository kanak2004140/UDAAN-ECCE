import api from "@/lib/api/client";

export interface LanguageResponse {
  id: string;
  code: string;
  name: string;
  native_name: string;
  is_active: boolean;
}

export async function getLanguages(): Promise<LanguageResponse[]> {
  return api.get<LanguageResponse[]>("/languages");
}
