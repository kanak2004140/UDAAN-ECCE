"use client";

import Mascot from "./Mascot";
import styles from "./Celebration.module.css";

interface CelebrationProps {
  /** Short line shown (and spoken by the caller) under Udi. */
  message: string;
  stars: number;
  /** Replay the same story. */
  onAgain: () => void;
  /** Go on to something new. */
  onNext: () => void;
  onHome: () => void;
  /** Toddlers get icon-only buttons; others get words too. */
  iconOnly?: boolean;
}

const CONFETTI = ["⭐", "🌟", "✨", "⭐", "🎈", "🌈", "⭐", "🌟", "✨", "🎉"];

export default function Celebration({ message, stars, onAgain, onNext, onHome, iconOnly = false }: CelebrationProps) {
  return (
    <section className={styles.wrap} aria-label="Well done">
      <div className={styles.confetti} aria-hidden="true">
        {CONFETTI.map((emoji, i) => (
          <span key={i} style={{ left: `${6 + i * 9.5}%`, animationDelay: `${(i % 5) * 0.35}s` }}>
            {emoji}
          </span>
        ))}
      </div>

      <Mascot mood="happy" size={iconOnly ? 190 : 150} />
      <p className={styles.message}>{message}</p>
      <p className={styles.stars} aria-label={`${stars} stars`}>
        ⭐ {stars}
      </p>

      <div className={styles.buttons}>
        <button onClick={onAgain} aria-label="Again" className={styles.secondary}>
          ↻{!iconOnly && <span> Again</span>}
        </button>
        <button onClick={onNext} aria-label="Next" className={styles.primary}>
          ▶{!iconOnly && <span> Next</span>}
        </button>
        <button onClick={onHome} aria-label="Home" className={styles.secondary}>
          🏠{!iconOnly && <span> Home</span>}
        </button>
      </div>
    </section>
  );
}
