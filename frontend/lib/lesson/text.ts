/**
 * Turn a generated lesson into pieces a child can take in one at a time.
 * Lessons are written to be spoken, so they are split on sentence ends
 * (including the Devanagari danda "।") and tidied of any stray markdown.
 */
export function cleanLessonText(text: string): string {
  return text
    .replace(/[*_#`>]+/g, "")
    .replace(/^\s*[-•]\s+/gm, "")
    .replace(/\s*\([^)]{0,60}\)\s*/g, " ") // leftover stage directions
    .replace(/[ \t]+/g, " ")
    .trim();
}

export function lessonSentences(text: string, maxSentences = 60): string[] {
  const cleaned = cleanLessonText(text).replace(/\n+/g, " ");
  const raw = cleaned.match(/[^.!?।]+[.!?।]+["”’']?|[^.!?।]+$/g) ?? [];
  const sentences: string[] = [];
  for (const part of raw) {
    const sentence = part.trim();
    if (!sentence) continue;
    // Glue very short fragments ("Yes!") onto the previous sentence.
    if (sentence.length < 12 && sentences.length > 0) {
      sentences[sentences.length - 1] += ` ${sentence}`;
    } else {
      sentences.push(sentence);
    }
  }
  return sentences.slice(0, maxSentences);
}

/** Group sentences into cards of roughly `maxChars` characters each. */
export function groupIntoCards(sentences: string[], maxChars: number): string[][] {
  const cards: string[][] = [];
  let current: string[] = [];
  let length = 0;
  for (const sentence of sentences) {
    if (current.length > 0 && length + sentence.length > maxChars) {
      cards.push(current);
      current = [];
      length = 0;
    }
    current.push(sentence);
    length += sentence.length;
  }
  if (current.length > 0) cards.push(current);
  return cards;
}

/** Paragraphs for the reader: 2-3 sentences each. */
export function groupIntoParagraphs(sentences: string[], perParagraph = 3): string[][] {
  const paragraphs: string[][] = [];
  for (let i = 0; i < sentences.length; i += perParagraph) {
    paragraphs.push(sentences.slice(i, i + perParagraph));
  }
  return paragraphs;
}
