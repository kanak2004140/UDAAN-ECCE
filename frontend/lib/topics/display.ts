import type { TopicResponse } from "@/lib/api/topics";

export interface TopicDisplay {
  /** Short, child-friendly title with the bookkeeping removed. */
  title: string;
  /** Small secondary line, e.g. "Class 3 · Santoor" (empty when none). */
  tag: string;
  number: number | null;
}

/**
 * Topic names carry bookkeeping for the content team, e.g.
 *   "Activity 10: I Have Feelings (English)"
 *   "Santoor (Class 3) - Chapter 7: The Big Laddoo"
 * Children and parents should only see the title.
 */
export function describeTopic(topic: Pick<TopicResponse, "name" | "language_name">): TopicDisplay {
  let name = topic.name.trim();

  if (topic.language_name) {
    const suffix = new RegExp(`\\s*\\(${topic.language_name}\\)\\s*$`, "i");
    name = name.replace(suffix, "");
  }

  const activity = name.match(/^(?:Activity|गतिविधि)\s*(\d+)\s*:?\s*(.*)$/i);
  if (activity) {
    const number = Number(activity[1]);
    const title = activity[2].trim();
    return { title: title || `${/^Activity/i.test(name) ? "Activity" : "गतिविधि"} ${number}`, tag: "", number };
  }

  const chapter = name.match(/^(.*?)\s*\(Class (\d+)\)\s*-\s*Chapter (\d+)(?::\s*(.+))?$/i);
  if (chapter) {
    const [, book, classNumber, chapterNumber, title] = chapter;
    return {
      title: title?.trim() || `Chapter ${chapterNumber}`,
      tag: `Class ${classNumber} · ${book.trim()}`,
      number: Number(chapterNumber),
    };
  }

  return { title: name, tag: "", number: null };
}

const KEYWORD_EMOJI: Array<[RegExp, string]> = [
  [/feel|emotion|happy|sad|भावना/i, "😊"],
  [/family|परिवार/i, "👨‍👩‍👧"],
  [/friend|दोस्त/i, "🤝"],
  [/bird|पक्षी|चिड़िया|parrot|sparrow/i, "🐦"],
  [/butterfly|तितली/i, "🦋"],
  [/elephant|हाथी/i, "🐘"],
  [/\bcat\b|kitten|बिल्ली/i, "🐱"],
  [/\bdog\b|puppy|कुत्ता/i, "🐶"],
  [/\bcow\b|calf|गाय/i, "🐮"],
  [/fish|मछली/i, "🐟"],
  [/animal|जानवर/i, "🐾"],
  [/flower|फूल/i, "🌸"],
  [/tree|plant|forest|जंगल|पेड़/i, "🌳"],
  [/mango|आम/i, "🥭"],
  [/banana|केला/i, "🍌"],
  [/healthy|vegetable|सब्ज़ी|स्वस्थ/i, "🥗"],
  [/fruit|apple|फल/i, "🍎"],
  [/food|eat|lunch|meal|भोजन|खाना/i, "🍽️"],
  [/water|drink|पानी/i, "💧"],
  [/rain|cloud|बारिश/i, "🌧️"],
  [/\bsun\b|summer|सूरज/i, "☀️"],
  [/moon|night|चाँद|रात/i, "🌙"],
  [/\bstar|तारा/i, "⭐"],
  [/number|count|zero|hundred|गिनती|संख्या|गिन/i, "🔢"],
  [/circle|गोला/i, "⚪"],
  [/square|चौकोर/i, "🟦"],
  [/triangle|त्रिभुज/i, "🔺"],
  [/shape|आकृति|pattern|नमूना/i, "🔷"],
  [/colou?r|paint|draw|art|रंग|चित्र/i, "🎨"],
  [/picture|frame|photo/i, "🖼️"],
  [/\bme\b|myself|\bself\b|मेरे|खुद/i, "🙋"],
  [/music|song|sing|rhyme|poem|कविता|गीत/i, "🎵"],
  [/dance|नृत्य/i, "💃"],
  [/theatre|drama|puppet|कठपुतली/i, "🎭"],
  [/game|play|खेल/i, "🎮"],
  [/yoga|योग/i, "🧘"],
  [/cricket|hockey|ball|strike|kick|throw|catch/i, "🏏"],
  [/school|class|विद्यालय/i, "🏫"],
  [/clean|hygiene|wash|स्वच्छ|साफ़/i, "🧼"],
  [/body|hand|eye|sense|इंद्रिय|शरीर/i, "👁️"],
  [/house|home|घर/i, "🏠"],
  [/bus|vehicle|travel|journey|वाहन|trolley/i, "🚌"],
  [/train/i, "🚆"],
  [/plane|aeroplane|sky|आकाश/i, "✈️"],
  [/bridge|पुल/i, "🌉"],
  [/festival|diwali|mela|celebrat|त्योहार|मेला/i, "🪔"],
  [/story|book|read|कहानी/i, "📖"],
  [/time|clock|calendar|समय/i, "🕒"],
  [/money|coin|rupee|पैसा/i, "💰"],
  [/safe|road|सुरक्षित|सड़क/i, "🚦"],
  [/big|small|long|tall|heavy|measure|माप|ऊँचाई|लंबाई/i, "📏"],
  [/maze|puzzle|भूलभुलैया/i, "🧩"],
  [/\bsea\b|river|lake|नदी/i, "🌊"],
  [/mountain|valley|पहाड़/i, "⛰️"],
  [/india gate|fort|red fort|किला|इंडिया गेट/i, "🏛️"],
];

const FALLBACK_EMOJI = ["🌟", "🎈", "🧩", "🌈", "🦋", "🎨", "📚", "🚀", "🍎", "🐝", "🌻", "🎵", "⚽", "🧸", "🍀", "🐠"];

/** The emoji for the first keyword found in the text, or null when none match. */
export function findEmoji(text: string): string | null {
  for (const [pattern, emoji] of KEYWORD_EMOJI) {
    if (pattern.test(text)) return emoji;
  }
  return null;
}

/** A friendly picture for some text. Derived from words in the text, never invented. */
export function emojiForText(text: string): string {
  const found = findEmoji(text);
  if (found) return found;
  let hash = 0;
  for (const char of text) hash = (hash * 31 + char.codePointAt(0)!) >>> 0;
  return FALLBACK_EMOJI[hash % FALLBACK_EMOJI.length];
}
