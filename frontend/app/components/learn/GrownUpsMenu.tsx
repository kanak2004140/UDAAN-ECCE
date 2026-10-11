"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { clearSession } from "@/lib/auth/session";
import { useAppState } from "@/lib/context/AppStateContext";
import styles from "./GrownUpsMenu.module.css";

interface GrownUpsMenuProps {
  open: boolean;
  onClose: () => void;
}

function newQuestion() {
  const a = 6 + Math.floor(Math.random() * 4);
  const b = 4 + Math.floor(Math.random() * 5);
  return { a, b };
}

/**
 * Settings for parents, behind a small arithmetic question so children don't
 * wander into them. Language, connection state and log out live here, not on
 * the child's screen.
 */
export default function GrownUpsMenu({ open, onClose }: GrownUpsMenuProps) {
  // Mounted only while open, so the question and answer start fresh each time.
  return open ? <Dialog onClose={onClose} /> : null;
}

function Dialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { languages, selectedLanguageId, setSelectedLanguageId, isOnline } = useAppState();
  const [question] = useState(newQuestion);
  const [answer, setAnswer] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [wrong, setWrong] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => inputRef.current?.focus(), 50);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const check = (event: React.FormEvent) => {
    event.preventDefault();
    if (Number(answer) === question.a + question.b) {
      setUnlocked(true);
      setWrong(false);
    } else {
      setWrong(true);
      setAnswer("");
    }
  };

  const logOut = () => {
    clearSession();
    router.push("/");
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-label="Settings for grown-ups"
        onClick={(event) => event.stopPropagation()}
      >
        <button className={styles.close} onClick={onClose} aria-label="Close">
          ×
        </button>

        {!unlocked ? (
          <form onSubmit={check} className={styles.gate}>
            <h2>For grown-ups</h2>
            <p>
              What is {question.a} + {question.b}?
            </p>
            <input
              ref={inputRef}
              className={styles.answer}
              inputMode="numeric"
              value={answer}
              onChange={(event) => setAnswer(event.target.value.replace(/\D/g, ""))}
              aria-label="Your answer"
            />
            {wrong && <p className={styles.wrong}>Not quite. Try again.</p>}
            <button type="submit" className={styles.primary}>
              Open settings
            </button>
          </form>
        ) : (
          <div className={styles.settings}>
            <h2>Settings</h2>

            <label className={styles.field}>
              <span>Lesson language</span>
              <select
                value={selectedLanguageId ?? ""}
                onChange={(event) => setSelectedLanguageId(event.target.value || null)}
              >
                <option value="">English (default)</option>
                {languages.map((language) => (
                  <option key={language.id} value={language.id}>
                    {language.native_name} ({language.name})
                  </option>
                ))}
              </select>
            </label>

            <p className={styles.status}>
              <span className={isOnline ? styles.online : styles.offline} />
              {isOnline ? "Online" : "Offline: saved lessons only"}
            </p>

            <div className={styles.actions}>
              <Link href="/" className={styles.secondary}>
                Home page
              </Link>
              <button type="button" className={styles.secondary} onClick={logOut}>
                Log out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
