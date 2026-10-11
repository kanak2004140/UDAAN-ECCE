"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AGE_CONFIG } from "@/lib/age/ageConfig";
import type { TopicResponse } from "@/lib/api/topics";
import { useGames, useGameSession } from "@/lib/hooks/useGames";
import { useLessonTopics } from "@/lib/hooks/useLessonTopics";
import { useProgress } from "@/lib/hooks/useProgress";
import { useSpeech } from "@/lib/hooks/useSpeech";
import { emojiForText } from "@/lib/topics/display";
import Celebration from "./Celebration";
import GamePlayer from "./GamePlayer";
import GrownUpsMenu from "./GrownUpsMenu";
import Mascot from "./Mascot";
import StoryPlayer from "./StoryPlayer";
import styles from "./ToddlerExperience.module.css";

const CONFIG = AGE_CONFIG["2-4"];

type View =
  | { name: "home" }
  | { name: "story"; topic: TopicResponse; run: number }
  | { name: "game"; id: string }
  | { name: "done"; topic: TopicResponse };

/**
 * Ages 2-4. The assistant leads: Udi is the screen. There is one giant play
 * button, a few picture tiles, and almost nothing to read. Everything Udi
 * says is spoken aloud, and every button works without reading.
 */
export default function ToddlerExperience() {
  const { topics, language, loading, error } = useLessonTopics("2-4");
  const { games, loading: gamesLoading } = useGames("2-4");
  const progress = useProgress();
  const session = useGameSession("2-4");
  const speech = useSpeech(language?.code, { rate: CONFIG.speechRate, pitch: CONFIG.speechPitch });
  const [view, setView] = useState<View>({ name: "home" });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [bubble, setBubble] = useState("Hi! Let's play!");

  const speakLine = useCallback(
    (text: string) => {
      setBubble(text);
      return speech.speak(text);
    },
    [speech],
  );

  const nextTopic = useMemo(() => topics.find((t) => !progress.isDone(t.id)) ?? topics[0] ?? null, [topics, progress]);
  const ready = !loading && !gamesLoading;
  const hasContent = topics.length > 0 || games.length > 0;

  const line = ready && error ? "Oh no! I can't reach my books." : ready && !hasContent ? "New lessons are coming soon!" : bubble;

  const go = () => {
    if (nextTopic) {
      setView({ name: "story", topic: nextTopic, run: Date.now() });
    } else if (games[0]) {
      setView({ name: "game", id: games[0].id });
    } else {
      speakLine("New lessons are coming soon!");
    }
  };

  const finishStory = useCallback(
    (topic: TopicResponse) => {
      progress.completeTopic(topic.id);
      setView({ name: "done", topic });
    },
    [progress],
  );

  useEffect(() => {
    if (view.name === "done") speech.speak("Great job!", { rate: 0.9 });
  }, [view.name]); // eslint-disable-line react-hooks/exhaustive-deps

  const goHome = () => {
    speech.cancel();
    setView({ name: "home" });
  };

  const anotherTopic = (current: TopicResponse) => topics.find((t) => t.id !== current.id && !progress.isDone(t.id)) ?? null;

  return (
    <main className={styles.page}>
      <header className={styles.top}>
        <span className={styles.logo}>
          <Mascot size={44} />
          <b>UDAAN</b>
        </span>
        <div className={styles.topRight}>
          <span className={styles.stars} aria-label={`${progress.stars} stars`}>
            ⭐ {progress.stars}
          </span>
          <button className={styles.gear} onClick={() => setSettingsOpen(true)} aria-label="Settings for grown-ups">
            ⚙
          </button>
        </div>
      </header>

      <div className={styles.center}>
        {view.name === "home" && (
          <>
            <button
              className={styles.udiButton}
              onClick={() => speakLine("Hi! I'm Udi. Let's play!")}
              aria-label="Say hello to Udi"
            >
              <Mascot mood={speech.speaking ? "talking" : "idle"} size={230} />
            </button>

            <p className={styles.bubble} aria-live="polite">
              {ready ? line : "…"}
            </p>

            <button className={styles.go} onClick={go} disabled={!ready} aria-label="Start">
              ▶
            </button>

            {games.length > 0 && (
              <ul className={styles.tiles} aria-label="Games">
                {games.slice(0, 4).map((game) => (
                  <li key={game.id}>
                    <button
                      className={styles.tile}
                      onClick={() => setView({ name: "game", id: game.id })}
                      aria-label={game.title}
                    >
                      <span aria-hidden="true">{emojiForText(`${game.title} ${game.activity_type}`)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {session.status === "login" && (
              <a href="/login" className={styles.loginChip}>
                Grown-ups: log in to save progress
              </a>
            )}
          </>
        )}

        {view.name === "story" && (
          <StoryPlayer
            key={`${view.topic.id}-${view.run}`}
            topic={view.topic}
            variant="toddler"
            ageGroup="2-4"
            speech={speech}
            onFinish={() => finishStory(view.topic)}
            onExit={goHome}
          />
        )}

        {view.name === "game" && (
          <GamePlayer
            key={view.id}
            activityId={view.id}
            mode="picture"
            speak={(text) => speech.speak(text, { rate: CONFIG.speechRate, pitch: CONFIG.speechPitch })}
            onCorrect={(activity) => {
              session.record(activity);
              progress.addStar();
            }}
            onExit={goHome}
          />
        )}

        {view.name === "done" && (
          <Celebration
            iconOnly
            message="Great job!"
            stars={progress.stars}
            onAgain={() => setView({ name: "story", topic: view.topic, run: Date.now() })}
            onNext={() => {
              const next = anotherTopic(view.topic);
              if (next) setView({ name: "story", topic: next, run: Date.now() });
              else if (games[0]) setView({ name: "game", id: games[0].id });
              else goHome();
            }}
            onHome={goHome}
          />
        )}
      </div>

      <GrownUpsMenu open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </main>
  );
}
