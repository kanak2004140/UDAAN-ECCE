"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { ActivityResponse } from "@/lib/api/activities";
import { useGameDetails } from "@/lib/hooks/useGames";
import { emojiForText } from "@/lib/topics/display";
import Mascot, { type MascotMood } from "./Mascot";
import styles from "./GamePlayer.module.css";

export type GameMode = "picture" | "tiles" | "text";

interface GamePlayerProps {
  activityId: string;
  /**
   * picture: the child hears a question and taps a picture (ages 2-4).
   * tiles:   a picture is shown and the child taps a big word (ages 4-6).
   * text:    a clean question card (ages 6-8).
   */
  mode: GameMode;
  speak: (text: string) => Promise<boolean>;
  onCorrect: (activity: ActivityResponse) => void;
  onExit: () => void;
}

const COLORS: Record<string, string> = {
  red: "#ef5b5b",
  blue: "#4f9de8",
  green: "#55b96a",
  yellow: "#ffd23f",
  orange: "#ff9f43",
  purple: "#9b7bde",
  pink: "#ff8fb1",
  brown: "#a0693d",
  black: "#33333d",
  white: "#ffffff",
};

const NUMBERS: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };

function ShapeGlyph({ name, size }: { name: string; size: number }) {
  const key = name.toLowerCase();
  const common = { width: size, height: size, viewBox: "0 0 100 100", "aria-hidden": true } as const;
  if (key.includes("circle")) {
    return (
      <svg {...common}>
        <circle cx="50" cy="50" r="42" fill="#f7c948" />
      </svg>
    );
  }
  if (key.includes("square")) {
    return (
      <svg {...common}>
        <rect x="10" y="10" width="80" height="80" rx="6" fill="#74b9a5" />
      </svg>
    );
  }
  if (key.includes("triangle")) {
    return (
      <svg {...common}>
        <polygon points="50,8 94,90 6,90" fill="#ef8f5b" />
      </svg>
    );
  }
  return <span style={{ fontSize: size * 0.8 }}>🔷</span>;
}

function ColorDot({ name, size }: { name: string; size: number }) {
  const color = COLORS[name.toLowerCase()] ?? "#c9c9ea";
  return (
    <span
      aria-hidden="true"
      style={{
        display: "inline-block",
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
        border: name.toLowerCase() === "white" ? "3px solid #d6d6ea" : "none",
      }}
    />
  );
}

function visualFor(kind: string, item: string, size: number): ReactNode {
  switch (kind) {
    case "animals":
      return <span style={{ fontSize: size, lineHeight: 1 }}>{item === "cat" ? "🐱" : item === "dog" ? "🐶" : item === "cow" ? "🐮" : emojiForText(item)}</span>;
    case "colors":
      return <ColorDot name={item} size={size} />;
    case "shapes":
      return <ShapeGlyph name={item} size={size} />;
    case "stars": {
      const count = NUMBERS[item] ?? 5;
      return (
        <span style={{ fontSize: size / 2.4, letterSpacing: 6, lineHeight: 1.1 }} aria-label={`${count} stars`}>
          {"⭐".repeat(count)}
        </span>
      );
    }
    default:
      return <span style={{ fontSize: size, lineHeight: 1 }}>{emojiForText(item)}</span>;
  }
}

function optionVisual(kind: string, option: string, size: number): ReactNode {
  if (kind === "stars") {
    const n = NUMBERS[option.toLowerCase()];
    if (n) return <span style={{ fontSize: size * 0.8, fontWeight: 800 }}>{n}</span>;
  }
  return visualFor(kind, option.toLowerCase(), size);
}

function prompts(kind: string, answer: string) {
  switch (kind) {
    case "animals":
      return { find: `Can you find the ${answer.toLowerCase()}?`, ask: "Which animal is this?" };
    case "colors":
      return { find: `Can you find ${answer.toLowerCase()}?`, ask: "Which colour is this?" };
    case "shapes":
      return { find: `Can you find the ${answer.toLowerCase()}?`, ask: "What shape is this?" };
    case "stars":
      return { find: `Can you find ${answer.toLowerCase()}?`, ask: "How many stars can you see?" };
    default:
      return { find: `Can you find ${answer}?`, ask: "Pick the right answer." };
  }
}

export default function GamePlayer({ activityId, mode, speak, onCorrect, onExit }: GamePlayerProps) {
  const { details, error } = useGameDetails(activityId);
  const [picked, setPicked] = useState<string | null>(null);
  const [mood, setMood] = useState<MascotMood>("idle");
  const spokenFor = useRef<string | null>(null);

  const game = useMemo(() => {
    if (!details) return null;
    const contentKey = details.contents[0]?.content_key ?? "";
    const [kind = "", item = ""] = [contentKey.split("/")[0], contentKey.split("/").at(-1)];
    const answer = details.variants[0]?.content_text ?? "";
    const raw = details.activity.config.options;
    const options = Array.isArray(raw) ? raw.filter((o): o is string => typeof o === "string") : [];
    return { kind, item, answer, options, ...prompts(kind, answer) };
  }, [details]);

  const correct = picked !== null && game !== null && picked.toLowerCase() === game.answer.toLowerCase();

  // Say the question once when the game opens.
  useEffect(() => {
    if (!game || spokenFor.current === activityId) return;
    spokenFor.current = activityId;
    setMood("talking");
    speak(mode === "picture" ? game.find : game.ask).finally(() => setMood("idle"));
  }, [game, activityId, mode, speak]);

  if (error) {
    return (
      <section className={styles.game}>
        <p className={styles.notice}>This game isn&apos;t ready right now.</p>
        <button className={styles.back} onClick={onExit} aria-label="Back">
          ←
        </button>
      </section>
    );
  }

  if (!details || !game) {
    return (
      <section className={styles.game}>
        <p className={styles.notice}>Getting ready…</p>
      </section>
    );
  }

  const choose = (option: string) => {
    if (correct) return;
    setPicked(option);
    const isRight = option.toLowerCase() === game.answer.toLowerCase();
    if (isRight) {
      setMood("happy");
      onCorrect(details.activity);
      speak(`Yes! ${game.answer}!`).finally(() => setMood("idle"));
    } else {
      setMood("talking");
      speak("Try again!").finally(() => setMood("idle"));
    }
  };

  const replay = () => {
    setMood("talking");
    speak(mode === "picture" ? game.find : game.ask).finally(() => setMood("idle"));
  };

  const optionSize = mode === "picture" ? 88 : mode === "tiles" ? 56 : 0;
  const question = mode === "picture" ? game.find : game.ask;

  return (
    <section className={`${styles.game} ${styles[mode]}`} aria-label={details.activity.title}>
      <div className={styles.top}>
        <button className={styles.back} onClick={onExit} aria-label="Back">
          ←
        </button>
        {mode === "text" && <h2 className={styles.title}>{details.activity.title}</h2>}
        <button className={styles.hear} onClick={replay} aria-label="Hear the question again">
          🔊
        </button>
      </div>

      <div className={styles.stage}>
        {mode !== "text" && <Mascot mood={mood} size={mode === "picture" ? 150 : 110} />}
        <p className={styles.prompt}>{question}</p>
        {mode !== "picture" && <div className={styles.visual}>{visualFor(game.kind, game.item, mode === "tiles" ? 120 : 96)}</div>}
      </div>

      <div className={styles.options}>
        {game.options.map((option) => {
          const state = picked === option ? (correct ? styles.right : styles.wrong) : "";
          return (
            <button
              key={option}
              className={`${styles.option} ${state}`}
              onClick={() => choose(option)}
              aria-label={option}
              aria-pressed={picked === option}
              disabled={correct && picked !== option}
            >
              {mode === "picture" ? optionVisual(game.kind, option, optionSize) : null}
              {mode === "tiles" ? <span className={styles.optionPicture}>{optionVisual(game.kind, option, 40)}</span> : null}
              {mode !== "picture" && <span className={styles.optionText}>{option}</span>}
            </button>
          );
        })}
      </div>

      {correct && (
        <div className={styles.result} role="status">
          <span className={styles.well}>{mode === "text" ? "Correct!" : "⭐ Great job! ⭐"}</span>
          <button className={styles.next} onClick={onExit} aria-label="Continue">
            {mode === "picture" ? "▶" : "Continue"}
          </button>
        </div>
      )}
    </section>
  );
}
