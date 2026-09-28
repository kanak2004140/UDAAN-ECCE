 "use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import styles from "./LittleExplorerWorld.module.css";

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

const stageForNode = (
  nodeIndex: number,
  progressStage: "start" | "session" | "completed",
): "done" | "current" | "upcoming" => {
  const reachedIndex = progressStage === "completed" ? 2 : progressStage === "session" ? 1 : 0;
  if (nodeIndex < reachedIndex) return "done";
  if (nodeIndex === reachedIndex) return "current";
  return "upcoming";
};

const nodeStyle = (state: "done" | "current" | "upcoming"): CSSProperties => {
  if (state === "current") {
    return { boxShadow: "0 0 0 3px #ffce54", borderRadius: 16 };
  }
  if (state === "upcoming") {
    return { opacity: 0.45 };
  }
  return {};
};

const iconFor = (icon?: string) => {
  switch (icon) {
    case "animal":
      return "🐱";
    case "tree":
      return "🌳";
    case "book":
      return "📖";
    case "music":
      return "🎵";
    case "numbers":
      return "🔢";
    case "art":
      return "🎨";
    case "puzzle":
      return "🧩";
    default:
      return "⭐";
  }
};

export default function LittleExplorerWorld({ ageLabel, subjects, onSelect, progressStage = "start" }: Props) {
  const [selected, setSelected] = useState<LearningSubject | null>(null);
  const [listening, setListening] = useState(false);

  const handleSubject = (subject: LearningSubject) => {
    setSelected(subject);
    onSelect?.(subject);
  };

  const speak = () => {
    if (!("speechSynthesis" in window)) {
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(
      "Hi little explorer! What would you like to learn today?",
    );
    utterance.onstart = () => setListening(true);
    utterance.onend = () => setListening(false);
    utterance.onerror = () => setListening(false);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <main className={styles.page}>
      <div className={styles.skyGlow} />
      <div className={`${styles.cloud} ${styles.cloudOne}`} />
      <div className={`${styles.cloud} ${styles.cloudTwo}`} />
      <div className={styles.sun} />

      <header className={styles.topbar}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>U</span>
          <span>UDAAN</span>
        </div>

        <div className={styles.topActions}>
          <button
            className={`${styles.listenButton} ${listening ? styles.listening : ""}`}
            onClick={speak}
            aria-pressed={listening}
          >
            <span>◖</span>
            {listening ? "Listening…" : "Listen"}
          </button>

          <button className={styles.starsButton} disabled title="Coming soon" style={{ opacity: 0.6, cursor: "not-allowed" }}>
            <span>★</span>
            My Stars
          </button>
        </div>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroCharacter} aria-hidden="true">
          <div className={styles.hair} />
          <div className={styles.head}>
            <span className={styles.eyeLeft} />
            <span className={styles.eyeRight} />
            <span className={styles.smile} />
          </div>
          <div className={styles.body}>
            <span className={styles.overallStrapLeft} />
            <span className={styles.overallStrapRight} />
          </div>
          <div className={styles.armLeft} />
          <div className={styles.armRight} />
          <div className={styles.book}>📖</div>
        </div>

        <div className={styles.speech}>
          <strong>Hi, little explorer! 👋</strong>
          <span>What would you like to learn today?</span>
        </div>
      </section>

      <section className={styles.learningPanel} aria-label="My Learning World">
        <div className={styles.panelTitle}>
          <span>🌈</span>
          <h1>My Learning World</h1>
          <span>🌈</span>
        </div>

        <div className={styles.subjectGrid}>
          {subjects.map((subject, index) => (
            <button
              key={subject.id}
              className={`${styles.subjectCard} ${styles[`card${index % 6}`]}`}
              onClick={() => handleSubject(subject)}
            >
              <span className={styles.subjectArt}>{iconFor(subject.icon)}</span>
              <span className={styles.subjectLabel}>{subject.label ?? subject.name}</span>
              <span className={styles.subjectName}>{subject.name}</span>
              <span className={styles.cardAudio} aria-hidden="true">◖</span>
            </button>
          ))}
        </div>
      </section>

      <section className={styles.adventure}>
        <div className={styles.adventureSign}>Let&apos;s<br />Explore! <span>→</span></div>

        <div className={styles.path}>
          <div className={`${styles.pathStop} ${styles.start}`} style={nodeStyle(stageForNode(0, progressStage))}>
            <span>{stageForNode(0, progressStage) === "done" ? "✅" : "🌱"}</span>
            <small>Start Here</small>
          </div>
          <div className={`${styles.pathStop} ${styles.learn}`} style={nodeStyle(stageForNode(1, progressStage))}>
            <span>{stageForNode(1, progressStage) === "done" ? "✅" : "🌼"}</span>
            <small>Learn</small>
          </div>
          <div className={`${styles.pathStop} ${styles.play}`} style={nodeStyle(stageForNode(2, progressStage))}>
            <span>🦆</span>
            <small>Play</small>
          </div>
          <div className={`${styles.pathStop} ${styles.reward}`} style={nodeStyle(stageForNode(3, progressStage))}>
            <span>🎁</span>
            <small>Earn Stars</small>
          </div>
        </div>

        <div className={styles.rabbit}>🐇</div>
        <div className={styles.deer}>🦌</div>
      </section>

      {selected && (
        <div className={styles.selectionBubble} role="status">
          <span className={styles.selectionIcon}>{iconFor(selected.icon)}</span>
          <div>
            <small>Let&apos;s explore</small>
            <strong>{selected.name}</strong>
          </div>
          <button onClick={() => setSelected(null)} aria-label="Close">×</button>
        </div>
      )}

      <nav className={styles.bottomNav} aria-label="Child navigation">
        <button className={styles.activeNav}><span>⌂</span>Home</button>
        <button onClick={speak}><span>◖</span>Listen</button>
        <button disabled title="Coming soon" style={{ opacity: 0.6, cursor: "not-allowed" }}><span>★</span>My Stars</button>
        <button disabled title="Coming soon" style={{ opacity: 0.6, cursor: "not-allowed" }}><span>●●</span>Parents</button>
      </nav>
    </main>
  );
}
