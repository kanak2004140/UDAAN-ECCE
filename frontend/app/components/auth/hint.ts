import type { MascotMood } from "@/app/components/learn/Mascot";

/** What Udi says beside the form, and how it looks while saying it. */
export interface Hint {
  text: string;
  mood: MascotMood;
}

export function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? "";
}
