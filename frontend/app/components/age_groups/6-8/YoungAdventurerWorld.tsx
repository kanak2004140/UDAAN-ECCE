 "use client";

import { useState } from "react";
import styles from "./YoungAdventurerWorld.module.css";

export type LearningSubject = {
  id: string;
  name: string;
  label?: string;
  icon?: string;
};

type Props = {
  subjects: LearningSubject[];
  onSelect?: (subject: LearningSubject) => void;
  // Reflects what the learner has actually done this visit - not a fake,
  // hardcoded "in progress" state.
  progressStage?: "start" | "session" | "completed";
};

// The first three journey nodes (Welcome, Practise, Current Quest) reflect
// real progress this visit - "Next" stays a locked "?" regardless, since it
// represents content the learner hasn't reached yet.
const stageForNode = (
  nodeIndex: 0 | 1 | 2,
  progressStage: "start" | "session" | "completed",
): "done" | "current" | "locked" => {
  const reachedIndex = progressStage === "completed" ? 2 : progressStage === "session" ? 1 : 0;
  if (nodeIndex < reachedIndex) return "done";
  if (nodeIndex === reachedIndex) return "current";
  return "locked";
};

export default function YoungAdventurerWorld({ subjects, onSelect, progressStage = "start" }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [curriculumMode, setCurriculumMode] = useState<"All" | "Curriculum" | "NCERT">("All");

  const pick = (name: string, subject?: LearningSubject) => {
    setSelected(name);
    if (subject) {
      onSelect?.(subject);
    }
  };

  const startQuest = () => {
    // Previously called pick() with no subject, so onSelect never fired and
    // nothing actually loaded below - this just showed an empty toast.
    // Now it starts the first available activity for real.
    const firstSubject = subjects[0];
    if (firstSubject) {
      pick(firstSubject.name, firstSubject);
    } else {
      pick("No activities available yet");
    }
  };

  const speak = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(
        new SpeechSynthesisUtterance(
          "Welcome to Udaan. Choose a learning world and start your next adventure."
        )
      );
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.starfield} />
      <div className={styles.orbit} />
      <div className={`${styles.cloud} ${styles.c1}`} />
      <div className={`${styles.cloud} ${styles.c2}`} />

      <header className={styles.top}>
        <div className={styles.brand}>
          <span className={styles.logo}>U</span>
          UDAAN
        </div>

        <div className={styles.age}>Young Adventurers · 6–8 years</div>

        <div className={styles.actions}>
          <button className={styles.audio} onClick={speak}>
            ))) Read to me
          </button>
          <button className={styles.points} disabled title="Coming soon" style={{ opacity: 0.6, cursor: "not-allowed" }}>★ My points</button>
        </div>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.kicker}>YOUR NEXT LEARNING MISSION</span>
          <h1>
            Ready to
            <br />
            <em>discover?</em>
          </h1>
          <p>
            Learn, practise, solve and create. Pick a world and begin your next
            adventure.
          </p>
          <button
            className={styles.quest}
            onClick={startQuest}
          >
            <span>🚀</span> Start today&apos;s quest
          </button>
        </div>

        <div className={styles.rocket}>🚀</div>
        <div className={styles.heroPlanet} />
        <div className={styles.avatar}>🧒</div>
      </section>

      <section className={styles.learning}>
        <div className={styles.head}>
          <div>
            <span>YOUR LEARNING WORLDS</span>
            <h2>What would you like to explore?</h2>
          </div>

          <div className={styles.curriculum}>
            {([
              { mode: "All", enabled: true },
              { mode: "Curriculum", enabled: false },
              { mode: "NCERT", enabled: false },
            ] as const).map(({ mode, enabled }) => (
              <button
                key={mode}
                className={curriculumMode === mode ? styles.selected : ""}
                disabled={!enabled}
                aria-disabled={!enabled}
                title={enabled ? undefined : "Coming soon"}
                style={enabled ? undefined : { opacity: 0.5, cursor: "not-allowed" }}
                onClick={() => {
                  if (!enabled) return;
                  setCurriculumMode(mode);
                }}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.grid}>
          {subjects.map((subject) => (
            <button
              className={styles.card}
              key={subject.id}
              onClick={() => pick(subject.name, subject)}
            >
              <span className={styles.icon}>
                {subject.icon === "stars" ? "★★★★★" : subject.icon ?? "★"}
              </span>
              <span className={styles.name}>{subject.name}</span>
              <span className={styles.sub}>
                {subject.label ?? "Explore & learn"}
              </span>
              <span className={styles.arrow}>→</span>
            </button>
          ))}
        </div>
      </section>

      <section className={styles.journey}>
        <div className={styles.journeyTitle}>
          <span>YOUR LEARNING JOURNEY</span>
          <h2>Every step unlocks a new adventure</h2>
        </div>

        <div className={styles.map}>
          <div className={styles.path} />

          <div className={`${styles.node} ${stageForNode(0, progressStage) === "done" ? styles.done : stageForNode(0, progressStage) === "current" ? styles.current : ""}`} style={{ left: "8%" }}>
            <b>{stageForNode(0, progressStage) === "done" ? "✓" : "●"}</b>
            <small>Welcome</small>
          </div>

          <div className={`${styles.node} ${stageForNode(1, progressStage) === "done" ? styles.done : stageForNode(1, progressStage) === "current" ? styles.current : ""}`} style={{ left: "31%" }}>
            <b>{stageForNode(1, progressStage) === "done" ? "✓" : "★"}</b>
            <small>Practise</small>
          </div>

          <div className={`${styles.node} ${stageForNode(2, progressStage) === "done" ? styles.done : stageForNode(2, progressStage) === "current" ? styles.current : ""}`} style={{ left: "54%" }}>
            <b>{stageForNode(2, progressStage) === "done" ? "✓" : "🚀"}</b>
            <small>Current Quest</small>
          </div>

          <div className={styles.node} style={{ left: "77%" }}>
            <b>?</b>
            <small>Next</small>
          </div>

          <div className={styles.mapKid}>🧒</div>
        </div>
      </section>

      <nav className={styles.bottom}>
        <button className={styles.active}>
          <span>⌂</span>Home
        </button>
        <button disabled title="Coming soon" style={{ opacity: 0.6, cursor: "not-allowed" }}>
          <span>◈</span>Learn
        </button>
        <button disabled title="Coming soon" style={{ opacity: 0.6, cursor: "not-allowed" }}>
          <span>★</span>Rewards
        </button>
        <button disabled title="Coming soon" style={{ opacity: 0.6, cursor: "not-allowed" }}>
          <span>●●</span>Parents
        </button>
      </nav>

      {selected && (
        <div className={styles.toast} role="status">
          <span className={styles.toastIcon}>✦</span>
          <div>
            <small>Let&apos;s explore</small>
            <strong>{selected}</strong>
          </div>
          <button onClick={() => setSelected(null)} aria-label="Close">
            ×
          </button>
        </div>
      )}
    </main>
  );
}
