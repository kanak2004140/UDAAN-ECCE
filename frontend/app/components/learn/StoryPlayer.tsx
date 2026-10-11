"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AGE_CONFIG, type AgeGroup } from "@/lib/age/ageConfig";
import type { TopicResponse } from "@/lib/api/topics";
import type { useSpeech } from "@/lib/hooks/useSpeech";
import { useLesson } from "@/lib/hooks/useLesson";
import { groupIntoCards, lessonSentences } from "@/lib/lesson/text";
import { describeTopic, emojiForText, findEmoji } from "@/lib/topics/display";
import Mascot from "./Mascot";
import styles from "./StoryPlayer.module.css";

type Speech = ReturnType<typeof useSpeech>;

interface StoryPlayerProps {
  topic: TopicResponse;
  /** toddler: one sentence and one big picture at a time. explorer: one short card at a time. */
  variant: "toddler" | "explorer";
  ageGroup: AgeGroup;
  speech: Speech;
  onFinish: () => void;
  onExit: () => void;
}

/** Plays a stored lesson as a sequence of cards, read aloud one at a time. */
export default function StoryPlayer({ topic, variant, ageGroup, speech, onFinish, onExit }: StoryPlayerProps) {
  const config = AGE_CONFIG[ageGroup];
  const { lesson, scenes, loading, error } = useLesson(topic.id, variant === "toddler");
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const startedFor = useRef<string | null>(null);
  const display = describeTopic(topic);

  const cards = useMemo(() => {
    if (!lesson) return [] as string[];
    const sentences = lessonSentences(lesson.lesson_text, config.maxSentences);
    return variant === "toddler" ? sentences : groupIntoCards(sentences, config.cardChars).map((group) => group.join(" "));
  }, [lesson, variant, config]);

  // Each card's picture: the scene plan when there is one, else a picture
  // matching the words on the card, else the topic's own picture.
  const topicEmoji = useMemo(() => findEmoji(`${display.title} ${topic.subject_name ?? ""}`) ?? emojiForText(display.title), [display.title, topic.subject_name]);
  const pictureFor = useCallback(
    (cardIndex: number) => {
      if (scenes.length > 0 && cards.length > 0) {
        const scene = scenes[Math.min(scenes.length - 1, Math.floor((cardIndex / cards.length) * scenes.length))];
        return findEmoji(scene.visual_description) ?? findEmoji(cards[cardIndex]) ?? topicEmoji;
      }
      return findEmoji(cards[cardIndex] ?? "") ?? topicEmoji;
    },
    [scenes, cards, topicEmoji],
  );

  const playFrom = useCallback(
    async (start: number) => {
      setPlaying(true);
      const finished = await speech.speakSequence(cards, setIndex, start, {
        rate: config.speechRate,
        pitch: config.speechPitch,
      });
      if (finished) {
        setPlaying(false);
        onFinish();
      }
    },
    [cards, speech, config, onFinish],
  );

  // Start reading as soon as the lesson is ready (the child just tapped it).
  useEffect(() => {
    if (cards.length === 0 || startedFor.current === topic.id) return;
    startedFor.current = topic.id;
    playFrom(0);
  }, [cards, topic.id, playFrom]);

  useEffect(() => () => speech.cancel(), []); // eslint-disable-line react-hooks/exhaustive-deps

  const goTo = (next: number) => {
    const clamped = Math.min(Math.max(next, 0), cards.length - 1);
    setIndex(clamped);
    if (playing) playFrom(clamped);
  };

  const togglePlay = () => {
    if (playing) {
      speech.cancel();
      setPlaying(false);
    } else {
      playFrom(index);
    }
  };

  if (loading) {
    return (
      <section className={`${styles.player} ${styles[variant]}`}>
        <Mascot mood="talking" size={variant === "toddler" ? 150 : 110} />
        <p className={styles.notice}>Getting your story ready…</p>
      </section>
    );
  }

  if (error || cards.length === 0) {
    return (
      <section className={`${styles.player} ${styles[variant]}`}>
        <Mascot size={variant === "toddler" ? 150 : 110} />
        <p className={styles.notice}>This story isn&apos;t ready yet.</p>
        <button className={styles.round} onClick={onExit} aria-label="Back">
          ←
        </button>
      </section>
    );
  }

  const isDraft = lesson?.review_status !== "approved";

  return (
    <section className={`${styles.player} ${styles[variant]}`} aria-label={display.title}>
      <div className={styles.top}>
        <button className={styles.round} onClick={onExit} aria-label="Back">
          ←
        </button>
        {variant === "explorer" && <h2 className={styles.title}>{display.title}</h2>}
        {isDraft && <span className={styles.draft}>Draft · not reviewed</span>}
      </div>

      <div className={styles.card} aria-live="polite">
        <div className={styles.picture} aria-hidden="true">
          {pictureFor(index)}
        </div>
        <p className={styles.text}>{cards[index]}</p>
        <div className={styles.udi}>
          <Mascot mood={speech.speaking ? "talking" : "idle"} size={variant === "toddler" ? 110 : 84} />
        </div>
      </div>

      <div className={styles.dots} role="progressbar" aria-valuemin={1} aria-valuemax={cards.length} aria-valuenow={index + 1}>
        {cards.map((_, i) => (
          <span key={i} className={i === index ? styles.dotActive : i < index ? styles.dotDone : styles.dot} />
        ))}
      </div>

      <div className={styles.controls}>
        <button className={styles.round} onClick={() => goTo(index - 1)} disabled={index === 0} aria-label="Previous">
          ◀
        </button>
        <button className={`${styles.round} ${styles.big}`} onClick={togglePlay} aria-label={playing ? "Pause" : "Play"}>
          {playing ? "❚❚" : "▶"}
        </button>
        <button
          className={styles.round}
          onClick={() => (index === cards.length - 1 ? onFinish() : goTo(index + 1))}
          aria-label={index === cards.length - 1 ? "Finish" : "Next"}
        >
          ▶▶
        </button>
      </div>
    </section>
  );
}
