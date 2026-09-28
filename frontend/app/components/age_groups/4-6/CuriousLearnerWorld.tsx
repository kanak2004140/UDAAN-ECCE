 "use client";

import { useState } from "react";
import styles from "./CuriousLearnerWorld.module.css";

export type LearningSubject = {
  id: string;
  name: string;
  label?: string;
  icon?: string;
};

type Props = {
  ageLabel: string;
  subjects: LearningSubject[];
  onSelect?: (subject: LearningSubject) => void;
  // Reflects what the learner has actually done this visit - not a fake,
  // hardcoded "in progress" state.
  progressStage?: "start" | "session" | "completed";
};

// The first three map nodes (Welcome, Practise, Explore) reflect real
// progress this visit - the "Next" node stays a locked "?" regardless,
// since it represents content the learner hasn't reached yet.
const stageForNode = (
  nodeIndex: 0 | 1 | 2,
  progressStage: "start" | "session" | "completed",
): "done" | "current" | "locked" => {
  const reachedIndex = progressStage === "completed" ? 2 : progressStage === "session" ? 1 : 0;
  if (nodeIndex < reachedIndex) return "done";
  if (nodeIndex === reachedIndex) return "current";
  return "locked";
};

const iconFor = (icon?: string) => {
  switch (icon) {
    case "shape": return "●";
    case "language": return "Aa";
    case "english": return "ABC";
    case "hindi": return "अ";
    case "math": return "123";
    case "science": return "✦";
    case "create": return "✎";
    default: return "★";
  }
};

export default function CuriousLearnerWorld({ ageLabel, subjects, onSelect, progressStage = "start" }: Props) {
  const [selected, setSelected] = useState<LearningSubject | null>(null);
  const [listening, setListening] = useState(false);

  const handleSelect = (subject: LearningSubject) => {
    setSelected(subject);
    onSelect?.(subject);
  };

  const speak = () => {
    if (!("speechSynthesis" in window)) {
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(
      "Let's discover something new! Choose a world and start exploring.",
    );
    utterance.onstart = () => setListening(true);
    utterance.onend = () => setListening(false);
    utterance.onerror = () => setListening(false);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <main className={styles.page}>
      <div className={styles.stars} />
      <div className={`${styles.cloud} ${styles.cloudOne}`} />
      <div className={`${styles.cloud} ${styles.cloudTwo}`} />

      <header className={styles.topbar}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>U</span>
          <span>UDAAN</span>
        </div>

        <div className={styles.agePill}>{ageLabel}</div>

        <div className={styles.actions}>
          <button
            className={`${styles.audioButton} ${listening ? styles.activeAudio : ""}`}
            onClick={speak}
          >
            <span className={styles.audioWave}>)))</span>
            {listening ? "Listening" : "Read to me"}
          </button>
          <button className={styles.starButton} disabled title="Coming soon" style={{ opacity: 0.6, cursor: "not-allowed" }}>★ My stars</button>
        </div>
      </header>

      <section className={styles.hero}>
        <div className={styles.moon} />
        <div className={styles.character} aria-hidden="true">
          <div className={styles.characterHair} />
          <div className={styles.characterHead}>
            <i className={styles.eyeOne} />
            <i className={styles.eyeTwo} />
            <i className={styles.mouth} />
          </div>
          <div className={styles.characterBody} />
          <div className={styles.characterArmOne} />
          <div className={styles.characterArmTwo} />
          <div className={styles.backpack} />
        </div>

        <div className={styles.heroCopy}>
          <span className={styles.kicker}>YOUR LEARNING ADVENTURE</span>
          <h1>Let&apos;s discover<br /><em>something new!</em></h1>
          <p>Choose a world and start exploring.</p>
          <button
            className={styles.bigAudio}
            onClick={speak}
          >
            <span>)))</span> Hear today&apos;s message
          </button>
        </div>

        <div className={styles.floatingPlanet}>✦</div>
        <div className={styles.floatingBook}>▱</div>
        <div className={styles.floatingPuzzle}>◆</div>
      </section>

      <section className={styles.worldPanel}>
        <div className={styles.panelHeader}>
          <div>
            <span>CHOOSE A WORLD</span>
            <h2>Where shall we explore?</h2>
          </div>
          <div className={styles.progress}>
            <span>Today</span>
            <strong>Pick a world to begin</strong>
          </div>
        </div>

        <div className={styles.subjectGrid}>
          {subjects.map((subject, index) => (
            <button
              key={subject.id}
              className={`${styles.subjectCard} ${styles[`tone${index % 6}`]}`}
              onClick={() => handleSelect(subject)}
            >
              <span className={styles.cardShape}>
                {iconFor(subject.icon)}
              </span>
              <span className={styles.cardName}>{subject.name}</span>
              <span className={styles.cardLabel}>{subject.label ?? "Explore & learn"}</span>
              <span className={styles.playDot}>→</span>
            </button>
          ))}
        </div>
      </section>

      <section className={styles.mapSection}>
        <div className={styles.mapTitle}>
          <span>YOUR ADVENTURE MAP</span>
          <h2>Keep going — you&apos;re doing great!</h2>
        </div>

        <div className={styles.map}>
          <div className={styles.mapPath} />
          <div className={`${styles.mapNode} ${stageForNode(0, progressStage) === "done" ? styles.done : stageForNode(0, progressStage) === "current" ? styles.current : ""}`} style={{ left: "8%" }}>
            <b>{stageForNode(0, progressStage) === "done" ? "✓" : "●"}</b><span>Welcome</span>
          </div>
          <div className={`${styles.mapNode} ${stageForNode(1, progressStage) === "done" ? styles.done : stageForNode(1, progressStage) === "current" ? styles.current : ""}`} style={{ left: "31%" }}>
            <b>{stageForNode(1, progressStage) === "done" ? "✓" : "★"}</b><span>Words</span>
          </div>
          <div className={`${styles.mapNode} ${stageForNode(2, progressStage) === "done" ? styles.done : stageForNode(2, progressStage) === "current" ? styles.current : ""}`} style={{ left: "54%" }}>
            <b>{stageForNode(2, progressStage) === "done" ? "✓" : "▶"}</b><span>Explore</span>
          </div>
          <div className={styles.mapNode} style={{ left: "77%" }}>
            <b>?</b><span>Next</span>
          </div>
          <div className={styles.mapCharacter}>🧒</div>
        </div>
      </section>

      {selected && (
        <div className={styles.selection} role="status">
          <span className={styles.selectionIcon}>{iconFor(selected.icon)}</span>
          <div>
            <small>Ready to explore?</small>
            <strong>{selected.name}</strong>
          </div>
          <button onClick={() => setSelected(null)}>×</button>
        </div>
      )}

      <nav className={styles.bottomNav}>
        <button className={styles.activeNav}><span>⌂</span>Home</button>
        <button disabled title="Coming soon" style={{ opacity: 0.6, cursor: "not-allowed" }}><span>◈</span>Learn</button>
        <button disabled title="Coming soon" style={{ opacity: 0.6, cursor: "not-allowed" }}><span>★</span>Rewards</button>
        <button disabled title="Coming soon" style={{ opacity: 0.6, cursor: "not-allowed" }}><span>●●</span>Parents</button>
      </nav>
    </main>
  );
}
