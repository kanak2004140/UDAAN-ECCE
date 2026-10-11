"use client";

import Link from "next/link";
import { AGE_CONFIG, AGE_GROUPS, type AgeGroup } from "@/lib/age/ageConfig";
import { clearSession } from "@/lib/auth/session";
import { useSession } from "@/lib/hooks/useSession";
import Mascot from "./Mascot";
import styles from "./LearnHub.module.css";

const WORLDS: Record<AgeGroup, { emoji: string; text: string }> = {
  "2-4": { emoji: "🐣", text: "Udi plays and talks along. Big buttons, voice and pictures." },
  "4-6": { emoji: "🦋", text: "Short stories and picture choices, with Udi alongside." },
  "6-8": { emoji: "🚀", text: "Lessons to read on their own, plus practice games." },
};

/**
 * Where a parent lands after signing in: pick the learning world that fits the
 * child. (A child account skips this and opens its own world directly.)
 */
export default function LearnHub() {
  const { user, signedIn } = useSession();
  const name = user?.name.trim().split(/\s+/)[0];

  return (
    <main className={styles.page}>
      <header className={styles.top}>
        <span className={styles.brand}>
          <Mascot size={40} />
          UDAAN
        </span>
        {signedIn ? (
          <button type="button" className={styles.topButton} onClick={clearSession}>
            Log out
          </button>
        ) : (
          <Link href="/login" className={styles.topLink}>
            Log in
          </Link>
        )}
      </header>

      <section className={styles.body}>
        <h1>{name ? `Hi ${name}! Who is learning today?` : "Who is learning today?"}</h1>
        <p className={styles.lead}>Pick the world that fits your child&apos;s age.</p>

        <ul className={styles.worlds}>
          {AGE_GROUPS.map((group) => (
            <li key={group}>
              <Link href={`/learn/${group}`} className={`${styles.world} ${styles[`world${group.replace("-", "")}`]}`}>
                <span className={styles.emoji} aria-hidden="true">
                  {WORLDS[group].emoji}
                </span>
                <span className={styles.age}>{AGE_CONFIG[group].ageLabel}</span>
                <strong>{AGE_CONFIG[group].stageName}</strong>
                <span className={styles.text}>{WORLDS[group].text}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
