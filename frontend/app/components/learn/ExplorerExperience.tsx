"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AGE_CONFIG } from "@/lib/age/ageConfig";
import type { TopicResponse } from "@/lib/api/topics";
import { useGames, useGameSession } from "@/lib/hooks/useGames";
import { useLessonTopics } from "@/lib/hooks/useLessonTopics";
import { useProgress } from "@/lib/hooks/useProgress";
import { useSpeech } from "@/lib/hooks/useSpeech";
import { describeTopic, emojiForText } from "@/lib/topics/display";
import Celebration from "./Celebration";
import GamePlayer from "./GamePlayer";
import GrownUpsMenu from "./GrownUpsMenu";
import Mascot from "./Mascot";
import StoryPlayer from "./StoryPlayer";
import styles from "./ExplorerExperience.module.css";

const CONFIG = AGE_CONFIG["4-6"];
const PICKS = 3;
const PAGE = 12;

type View =
  | { name: "home" }
  | { name: "story"; topic: TopicResponse; run: number }
  | { name: "game"; id: string }
  | { name: "done"; topic: TopicResponse };

/**
 * Ages 4-6. A mix of the assistant and the child's own choice: Udi greets and
 * recommends a few stories, the child can pick anything from big picture
 * cards, and each story plays one short card at a time, read aloud.
 */
export default function ExplorerExperience() {
  const { topics, language, loading, error } = useLessonTopics("4-6");
  const { games, loading: gamesLoading } = useGames("4-6");
  const progress = useProgress();
  const session = useGameSession("4-6");
  const speech = useSpeech(language?.code, { rate: CONFIG.speechRate, pitch: CONFIG.speechPitch });
  const [view, setView] = useState<View>({ name: "home" });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shown, setShown] = useState(PAGE);

  const greeting = "Hi! What shall we learn today?";

  const { picks, more } = useMemo(() => {
    const fresh = topics.filter((t) => !progress.isDone(t.id));
    const chosen = fresh.slice(0, PICKS);
    const chosenIds = new Set(chosen.map((t) => t.id));
    return { picks: chosen, more: topics.filter((t) => !chosenIds.has(t.id)) };
  }, [topics, progress]);

  const openStory = useCallback((topic: TopicResponse) => {
    setView({ name: "story", topic, run: Date.now() });
  }, []);

  const finishStory = useCallback(
    (topic: TopicResponse) => {
      progress.completeTopic(topic.id);
      setView({ name: "done", topic });
    },
    [progress],
  );

  useEffect(() => {
    if (view.name === "done") speech.speak("Well done!", { rate: 0.92 });
  }, [view.name]); // eslint-disable-line react-hooks/exhaustive-deps

  const goHome = () => {
    speech.cancel();
    setView({ name: "home" });
  };

  const renderCard = (topic: TopicResponse, index: number, big = false) => {
    const { title, tag } = describeTopic(topic);
    const done = progress.isDone(topic.id);
    return (
      <li key={topic.id}>
        <button className={`${styles.card} ${styles[`tone${index % 6}`]} ${big ? styles.big : ""}`} onClick={() => openStory(topic)}>
          <span className={styles.cardPicture} aria-hidden="true">
            {emojiForText(title)}
          </span>
          <span className={styles.cardTitle}>{title}</span>
          {tag && <span className={styles.cardTag}>{tag}</span>}
          {done && (
            <span className={styles.done} aria-label="Finished">
              ✓
            </span>
          )}
        </button>
      </li>
    );
  };

  const ready = !loading && !gamesLoading;

  return (
    <main className={styles.page}>
      <header className={styles.top}>
        <span className={styles.logo}>
          <Mascot size={40} />
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

      <div className={styles.body}>
        {view.name === "home" && (
          <>
            <section className={styles.hero}>
              <Mascot mood={speech.speaking ? "talking" : "idle"} size={132} />
              <div className={styles.bubble}>
                <h1>{ready && !error && topics.length === 0 && games.length === 0 ? "New stories are coming soon!" : greeting}</h1>
                <button className={styles.hear} onClick={() => speech.speak(greeting)}>
                  <span aria-hidden="true">🔊</span> Hear Udi
                </button>
              </div>
            </section>

            {error && <p className={styles.notice}>I can&apos;t reach my story books right now.</p>}

            {picks.length > 0 && (
              <section aria-labelledby="picks-title">
                <h2 id="picks-title" className={styles.heading}>
                  Udi&apos;s picks for you
                </h2>
                <ul className={`${styles.grid} ${styles.picksGrid}`}>{picks.map((t, i) => renderCard(t, i, true))}</ul>
              </section>
            )}

            {more.length > 0 && (
              <section aria-labelledby="more-title">
                <h2 id="more-title" className={styles.heading}>
                  More stories
                </h2>
                <ul className={styles.grid}>{more.slice(0, shown).map((t, i) => renderCard(t, i + PICKS))}</ul>
                {more.length > shown && (
                  <button className={styles.showMore} onClick={() => setShown(shown + PAGE)}>
                    Show more
                  </button>
                )}
              </section>
            )}

            {games.length > 0 && (
              <section aria-labelledby="play-title">
                <h2 id="play-title" className={styles.heading}>
                  Let&apos;s play
                </h2>
                <ul className={styles.games}>
                  {games.map((game, i) => (
                    <li key={game.id}>
                      <button className={`${styles.game} ${styles[`tone${(i + 2) % 6}`]}`} onClick={() => setView({ name: "game", id: game.id })}>
                        <span aria-hidden="true">{emojiForText(`${game.title} ${game.activity_type}`)}</span>
                        <span>{game.title}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
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
            variant="explorer"
            ageGroup="4-6"
            speech={speech}
            onFinish={() => finishStory(view.topic)}
            onExit={goHome}
          />
        )}

        {view.name === "game" && (
          <GamePlayer
            key={view.id}
            activityId={view.id}
            mode="tiles"
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
            message="Well done!"
            stars={progress.stars}
            onAgain={() => openStory(view.topic)}
            onNext={() => {
              const next = topics.find((t) => t.id !== view.topic.id && !progress.isDone(t.id));
              if (next) openStory(next);
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
