"use client";

import { useCallback, useMemo, useState } from "react";
import { AGE_CONFIG } from "@/lib/age/ageConfig";
import type { TopicResponse } from "@/lib/api/topics";
import { useGames, useGameSession } from "@/lib/hooks/useGames";
import { useLesson } from "@/lib/hooks/useLesson";
import { useLessonTopics } from "@/lib/hooks/useLessonTopics";
import { useProgress } from "@/lib/hooks/useProgress";
import { useSpeech } from "@/lib/hooks/useSpeech";
import { groupIntoParagraphs, lessonSentences } from "@/lib/lesson/text";
import { describeTopic } from "@/lib/topics/display";
import GamePlayer from "./GamePlayer";
import GrownUpsMenu from "./GrownUpsMenu";
import Mascot from "./Mascot";
import styles from "./AdventurerExperience.module.css";

const CONFIG = AGE_CONFIG["6-8"];
const PAGE = 18;
const TEXT_SIZES = [17, 19, 22, 26];

type Tab = "lessons" | "practice" | "progress";

const shortSubject = (name: string | null) => (name ? name.replace(/\s*\(.*\)\s*$/, "") : "");

/**
 * Ages 6-8. Text first: a clean list of lessons with search and subject
 * filters, and a proper reader (read aloud, text size, mark as done). Udi is a
 * quiet helper that reads aloud, not the centre of the screen.
 */
export default function AdventurerExperience() {
  const { topics, language, loading, error } = useLessonTopics("6-8");
  const { games, loading: gamesLoading } = useGames("6-8");
  const progress = useProgress();
  const session = useGameSession("6-8");
  const speech = useSpeech(language?.code, { rate: CONFIG.speechRate, pitch: CONFIG.speechPitch });

  const [chosenTab, setTab] = useState<Tab | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selected, setSelected] = useState<TopicResponse | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const [subject, setSubject] = useState<string>("All");
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(PAGE);

  // With no lessons yet but games available, open on Practice instead of an empty page.
  const tab: Tab = chosenTab ?? (!loading && !gamesLoading && topics.length === 0 && games.length > 0 ? "practice" : "lessons");

  const subjects = useMemo(() => {
    const names = new Set<string>();
    topics.forEach((t) => t.subject_name && names.add(shortSubject(t.subject_name)));
    return ["All", ...Array.from(names)];
  }, [topics]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return topics.filter((t) => {
      if (subject !== "All" && shortSubject(t.subject_name) !== subject) return false;
      if (!q) return true;
      const d = describeTopic(t);
      return `${d.title} ${d.tag} ${shortSubject(t.subject_name)}`.toLowerCase().includes(q);
    });
  }, [topics, subject, query]);

  const nextUp = useMemo(() => topics.find((t) => !progress.isDone(t.id)) ?? null, [topics, progress]);

  const openLesson = useCallback((topic: TopicResponse) => {
    setSelected(topic);
    window.scrollTo({ top: 0 });
  }, []);

  const closeLesson = useCallback(() => {
    speech.cancel();
    setSelected(null);
  }, [speech]);

  const ready = !loading && !gamesLoading;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <span className={styles.brand}>
          <Mascot size={34} />
          UDAAN
        </span>

        <nav className={styles.tabs} aria-label="Sections">
          {(["lessons", "practice", "progress"] as const).map((name) => (
            <button
              key={name}
              className={tab === name && !selected ? styles.tabActive : styles.tab}
              aria-current={tab === name && !selected ? "page" : undefined}
              onClick={() => {
                closeLesson();
                setGameId(null);
                setTab(name);
              }}
            >
              {name === "lessons" ? "Lessons" : name === "practice" ? "Practice" : "My progress"}
            </button>
          ))}
        </nav>

        <div className={styles.right}>
          <span className={styles.stars} aria-label={`${progress.stars} stars`}>
            ⭐ {progress.stars}
          </span>
          <button className={styles.gear} onClick={() => setSettingsOpen(true)} aria-label="Settings for grown-ups">
            ⚙
          </button>
        </div>
      </header>

      <div className={styles.container}>
        {selected && (
          <Reader
            topic={selected}
            speech={speech}
            done={progress.isDone(selected.id)}
            onDone={() => progress.completeTopic(selected.id)}
            onBack={closeLesson}
          />
        )}

        {!selected && tab === "lessons" && (
          <>
            <section className={styles.welcome}>
              <div>
                <h1>What would you like to learn?</h1>
                <p>Pick a lesson, or let Udi read one to you.</p>
              </div>
              {nextUp && (
                <button className={styles.continue} onClick={() => openLesson(nextUp)}>
                  <small>Up next</small>
                  <strong>{describeTopic(nextUp).title}</strong>
                </button>
              )}
            </section>

            {error && <p className={styles.notice}>Lessons can&apos;t be loaded right now. Check your connection and try again.</p>}

            {topics.length > 0 && (
              <>
                <div className={styles.filters}>
                  <div className={styles.chips} role="group" aria-label="Subjects">
                    {subjects.map((name) => (
                      <button
                        key={name}
                        className={subject === name ? styles.chipActive : styles.chip}
                        aria-pressed={subject === name}
                        onClick={() => {
                          setSubject(name);
                          setShown(PAGE);
                        }}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                  <input
                    className={styles.search}
                    type="search"
                    placeholder="Search lessons"
                    aria-label="Search lessons"
                    value={query}
                    onChange={(event) => {
                      setQuery(event.target.value);
                      setShown(PAGE);
                    }}
                  />
                </div>

                {visible.length === 0 ? (
                  <p className={styles.notice}>No lessons match. Try a different word.</p>
                ) : (
                  <ul className={styles.list}>
                    {visible.slice(0, shown).map((topic) => {
                      const { title, tag } = describeTopic(topic);
                      const done = progress.isDone(topic.id);
                      return (
                        <li key={topic.id}>
                          <button className={styles.lesson} onClick={() => openLesson(topic)}>
                            <span className={styles.lessonSubject}>{shortSubject(topic.subject_name)}</span>
                            <span className={styles.lessonTitle}>{title}</span>
                            <span className={styles.lessonMeta}>
                              {tag}
                              {done && <span className={styles.check}>✓ Done</span>}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}

                {visible.length > shown && (
                  <button className={styles.more} onClick={() => setShown(shown + PAGE)}>
                    Show more lessons
                  </button>
                )}
              </>
            )}

            {ready && !error && topics.length === 0 && (
              <section className={styles.empty}>
                <Mascot size={96} />
                <h2>New lessons are coming soon</h2>
                <p>Lessons appear here once they have been checked by a teacher.</p>
                {games.length > 0 && (
                  <button className={styles.primary} onClick={() => setTab("practice")}>
                    Try Practice
                  </button>
                )}
              </section>
            )}
          </>
        )}

        {!selected && tab === "practice" && (
          <section>
            {gameId ? (
              <GamePlayer
                key={gameId}
                activityId={gameId}
                mode="text"
                speak={(text) => speech.speak(text, { rate: CONFIG.speechRate })}
                onCorrect={(activity) => {
                  session.record(activity);
                  progress.addStar();
                }}
                onExit={() => setGameId(null)}
              />
            ) : (
              <>
                <h1 className={styles.sectionTitle}>Practice</h1>
                {games.length === 0 ? (
                  <p className={styles.notice}>Practice games are coming soon.</p>
                ) : (
                  <ul className={styles.list}>
                    {games.map((game) => (
                      <li key={game.id}>
                        <button className={styles.lesson} onClick={() => setGameId(game.id)}>
                          <span className={styles.lessonSubject}>{game.activity_type.replace(/_/g, " ")}</span>
                          <span className={styles.lessonTitle}>{game.title}</span>
                          {game.description && <span className={styles.lessonMeta}>{game.description}</span>}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {session.status === "login" && (
                  <p className={styles.notice}>
                    <a href="/login">Log in</a> (ask a grown-up) to save your practice.
                  </p>
                )}
              </>
            )}
          </section>
        )}

        {!selected && tab === "progress" && (
          <section>
            <h1 className={styles.sectionTitle}>My progress</h1>
            <div className={styles.statRow}>
              <div className={styles.stat}>
                <strong>{progress.stars}</strong>
                <span>Stars</span>
              </div>
              <div className={styles.stat}>
                <strong>{progress.completedTopics.length}</strong>
                <span>Lessons finished</span>
              </div>
            </div>
            {progress.completedTopics.length === 0 ? (
              <p className={styles.notice}>Finish a lesson to see it here.</p>
            ) : (
              <ul className={styles.finished}>
                {topics
                  .filter((t) => progress.isDone(t.id))
                  .map((t) => (
                    <li key={t.id}>✓ {describeTopic(t).title}</li>
                  ))}
              </ul>
            )}
          </section>
        )}
      </div>

      <GrownUpsMenu open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </main>
  );
}

interface ReaderProps {
  topic: TopicResponse;
  speech: ReturnType<typeof useSpeech>;
  done: boolean;
  onDone: () => void;
  onBack: () => void;
}

function Reader({ topic, speech, done, onDone, onBack }: ReaderProps) {
  const { lesson, loading, error } = useLesson(topic.id);
  const [size, setSize] = useState(1);
  const [active, setActive] = useState(-1);
  const [reading, setReading] = useState(false);
  const { title, tag } = describeTopic(topic);

  const sentences = useMemo(() => (lesson ? lessonSentences(lesson.lesson_text, CONFIG.maxSentences) : []), [lesson]);
  const paragraphs = useMemo(() => groupIntoParagraphs(sentences), [sentences]);

  const readFrom = useCallback(
    async (start: number) => {
      setReading(true);
      const finished = await speech.speakSequence(sentences, setActive, start, { rate: CONFIG.speechRate });
      if (finished) {
        setReading(false);
        setActive(-1);
      }
    },
    [sentences, speech],
  );

  const toggleRead = () => {
    if (reading) {
      speech.cancel();
      setReading(false);
    } else {
      readFrom(Math.max(active, 0));
    }
  };

  const offsets = paragraphs.map((_, p) => paragraphs.slice(0, p).reduce((sum, group) => sum + group.length, 0));

  return (
    <article className={styles.reader}>
      <button className={styles.backLink} onClick={onBack}>
        ← Lessons
      </button>
      <p className={styles.crumb}>
        {shortSubject(topic.subject_name)}
        {tag ? ` · ${tag}` : ""}
      </p>
      <h1 className={styles.readerTitle}>{title}</h1>

      <div className={styles.toolbar} role="toolbar" aria-label="Lesson tools">
        <button className={styles.primary} onClick={toggleRead} disabled={sentences.length === 0}>
          {reading ? "❚❚ Pause" : "▶ Read aloud"}
        </button>
        <button className={styles.tool} onClick={() => setSize(Math.max(0, size - 1))} aria-label="Smaller text" disabled={size === 0}>
          A−
        </button>
        <button className={styles.tool} onClick={() => setSize(Math.min(TEXT_SIZES.length - 1, size + 1))} aria-label="Larger text" disabled={size === TEXT_SIZES.length - 1}>
          A+
        </button>
      </div>

      {loading && <p className={styles.notice}>Opening lesson…</p>}
      {error && <p className={styles.notice}>This lesson isn&apos;t ready yet.</p>}

      {lesson && (
        <>
        <div className={styles.prose} style={{ fontSize: TEXT_SIZES[size] }}>
          {paragraphs.map((paragraph, p) => (
            <p key={p}>
              {paragraph.map((sentence, i) => {
                const index = offsets[p] + i;
                return (
                  <span
                    key={index}
                    className={index === active ? styles.activeSentence : undefined}
                    onClick={() => readFrom(index)}
                  >
                    {sentence}{" "}
                  </span>
                );
              })}
            </p>
          ))}
          <footer className={styles.source}>
            {lesson.review_status !== "approved" && <span className={styles.draft}>Draft · not reviewed</span>}
            Based on NCERT material{tag ? ` (${tag})` : ""}.
          </footer>
        </div>
        <button className={done ? styles.finishDone : styles.finish} onClick={onDone} disabled={done}>
          {done ? "✓ Lesson finished" : "I finished this lesson"}
        </button>
        </>
      )}
    </article>
  );
}
