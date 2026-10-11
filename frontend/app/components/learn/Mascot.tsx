import styles from "./Mascot.module.css";

export type MascotMood = "idle" | "talking" | "happy";

interface MascotProps {
  mood?: MascotMood;
  /** Pixels, or any CSS size such as "100%" to fill a sized parent. */
  size?: number | string;
  /** Decorative by default; give a label when the mascot is itself a button. */
  label?: string;
}

/**
 * Udi, the learning assistant: a small bird (UDAAN means "flight"). One
 * character in all three stages so the assistant feels like the same friend
 * as a child grows; only its role and size change.
 */
export default function Mascot({ mood = "idle", size = 160, label }: MascotProps) {
  return (
    <span
      className={`${styles.udi} ${styles[mood]}`}
      style={{ width: size, height: size }}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <svg viewBox="0 0 200 200" width="100%" height="100%" focusable="false">
        {/* tuft */}
        <path d="M92 44c-6-16 2-26 8-30 2 10 8 14 6 30z" fill="#ff9f1c" />
        <path d="M104 46c0-14 10-22 18-24-2 10 0 16-6 28z" fill="#ffb84d" />
        {/* feet */}
        <path d="M82 168l-8 14h20zM118 168l-8 14h20z" fill="#ff8a00" />
        {/* body */}
        <ellipse cx="100" cy="112" rx="64" ry="62" fill="#ffc93c" />
        <ellipse cx="100" cy="132" rx="40" ry="36" fill="#fff1b8" />
        {/* wings */}
        <g className={styles.wingLeft}>
          <ellipse cx="42" cy="118" rx="20" ry="34" fill="#ffb21f" transform="rotate(18 42 118)" />
        </g>
        <g className={styles.wingRight}>
          <ellipse cx="158" cy="118" rx="20" ry="34" fill="#ffb21f" transform="rotate(-18 158 118)" />
        </g>
        {/* cheeks */}
        <circle cx="68" cy="112" r="9" fill="#ff9a8b" opacity="0.7" />
        <circle cx="132" cy="112" r="9" fill="#ff9a8b" opacity="0.7" />
        {/* eyes */}
        <g className={styles.eyes}>
          <circle cx="78" cy="94" r="11" fill="#2b2d42" />
          <circle cx="122" cy="94" r="11" fill="#2b2d42" />
          <circle cx="82" cy="90" r="4" fill="#fff" />
          <circle cx="126" cy="90" r="4" fill="#fff" />
        </g>
        <g className={styles.happyEyes}>
          <path d="M66 96q12-14 24 0" stroke="#2b2d42" strokeWidth="6" fill="none" strokeLinecap="round" />
          <path d="M110 96q12-14 24 0" stroke="#2b2d42" strokeWidth="6" fill="none" strokeLinecap="round" />
        </g>
        {/* beak */}
        <path d="M100 104l-14 12h28z" fill="#ff8a00" />
        <g className={styles.lowerBeak}>
          <path d="M88 118h24l-12 12z" fill="#ff6f00" />
        </g>
      </svg>
    </span>
  );
}
