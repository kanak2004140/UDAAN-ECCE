"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Mascot from "@/app/components/learn/Mascot";
import { getMe } from "@/lib/api/users";
import { clearSession, homePathFor, saveUser } from "@/lib/auth/session";
import { useSession } from "@/lib/hooks/useSession";
import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";
import { firstName, type Hint } from "./hint";
import formStyles from "./AuthForm.module.css";
import styles from "./AuthScreen.module.css";

type Mode = "login" | "signup";

const FIRST_HINT: Record<Mode, Hint> = {
  login: { text: "Hi! Ready to learn something new?", mood: "idle" },
  signup: { text: "Hi! I'm Udi. Who is joining us?", mood: "idle" },
};

/**
 * Sign-in and sign-up share one friendly shell: Udi on the side talks you
 * through each step, the card holds the form.
 */
export default function AuthScreen({ mode }: { mode: Mode }) {
  const { user, signedIn } = useSession();
  const [hint, setHint] = useState<Hint>(FIRST_HINT[mode]);

  // A saved sign-in is only believed once the server confirms it. If the
  // account is gone or the token has expired, the API client clears it and the
  // form appears instead.
  useEffect(() => {
    if (!signedIn) return;
    getMe()
      .then(saveUser)
      .catch(() => undefined);
  }, [signedIn]);

  const otherMode = mode === "login" ? { href: "/signup", label: "Sign up" } : { href: "/login", label: "Log in" };

  return (
    <main className={styles.page}>
      <div className={styles.sun} aria-hidden="true" />
      <div className={`${styles.cloud} ${styles.cloudOne}`} aria-hidden="true" />
      <div className={`${styles.cloud} ${styles.cloudTwo}`} aria-hidden="true" />

      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="UDAAN home">
          <Mascot size={40} />
          UDAAN
        </Link>
        <a href={otherMode.href} className={styles.otherLink}>
          {otherMode.label}
        </a>
      </header>

      <div className={styles.shell}>
        <aside className={styles.hero}>
          <div className={styles.udi}>
            <Mascot size="100%" mood={hint.mood} />
          </div>
          <p className={styles.bubble} aria-live="polite">
            {signedIn && user ? `Hi ${firstName(user.name)}! Good to see you.` : hint.text}
          </p>
          <ul className={styles.perks} aria-label="What you can do in UDAAN">
            <li>📖 Stories</li>
            <li>🎮 Games</li>
            <li>🔊 Read aloud</li>
          </ul>
        </aside>

        <section className={styles.card}>
          {signedIn && user ? (
            <div className={formStyles.continueCard}>
              <span className={formStyles.avatar} aria-hidden="true">
                {firstName(user.name).charAt(0).toUpperCase()}
              </span>
              <div>
                <h1 className={styles.continueTitle}>Welcome back, {firstName(user.name)}!</h1>
                <p className={styles.continueEmail}>{user.email}</p>
              </div>
              <a className={formStyles.primary} href={homePathFor(user)}>
                Continue learning
              </a>
              <button type="button" className={formStyles.linkButton} onClick={clearSession}>
                Not you? Log out
              </button>
            </div>
          ) : mode === "login" ? (
            <LoginForm onHint={setHint} />
          ) : (
            <SignupForm onHint={setHint} />
          )}
        </section>
      </div>

      <footer className={styles.footer}>A safe, playful place to learn · UDAAN</footer>
    </main>
  );
}
