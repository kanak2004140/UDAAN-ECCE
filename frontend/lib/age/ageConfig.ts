/**
 * The three learning stages. Each stage gets a different experience, not just
 * a different skin:
 *
 *  - 2-4  Little Explorers: the assistant (Udi) leads. Voice and pictures,
 *         almost no reading, one big action per screen.
 *  - 4-6  Curious Learners: Udi guides, the child picks from big picture
 *         cards, lessons play one short card at a time.
 *  - 6-8  Young Adventurers: text first. Clean lists, a proper reader, Udi is
 *         a quiet helper that can read aloud.
 */
export type AgeGroup = "2-4" | "4-6" | "6-8";

export const AGE_GROUPS: AgeGroup[] = ["2-4", "4-6", "6-8"];

export function isAgeGroup(value: string): value is AgeGroup {
  return (AGE_GROUPS as string[]).includes(value);
}

export interface AgeConfig {
  id: AgeGroup;
  stageName: string;
  ageLabel: string;
  /** Speech settings: slower and higher for the youngest. */
  speechRate: number;
  speechPitch: number;
  /** Max sentences read in one story (keeps toddler lessons short). */
  maxSentences: number;
  /** Characters per card for the 4-6 stepper. */
  cardChars: number;
}

export const AGE_CONFIG: Record<AgeGroup, AgeConfig> = {
  "2-4": {
    id: "2-4",
    stageName: "Little Explorers",
    ageLabel: "2–4 years",
    speechRate: 0.82,
    speechPitch: 1.15,
    maxSentences: 8,
    cardChars: 90,
  },
  "4-6": {
    id: "4-6",
    stageName: "Curious Learners",
    ageLabel: "4–6 years",
    speechRate: 0.9,
    speechPitch: 1.08,
    maxSentences: 14,
    cardChars: 150,
  },
  "6-8": {
    id: "6-8",
    stageName: "Young Adventurers",
    ageLabel: "6–8 years",
    speechRate: 0.95,
    speechPitch: 1,
    maxSentences: 60,
    cardChars: 400,
  },
};

/** Show unreviewed lessons too. Development only; the API enforces its own flag. */
export const SHOW_DRAFT_LESSONS = process.env.NEXT_PUBLIC_SHOW_DRAFT_LESSONS === "true";
