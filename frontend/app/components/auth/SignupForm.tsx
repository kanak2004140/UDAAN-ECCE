"use client";

import { useRef, useState, type FormEvent } from "react";
import { getLanguages } from "@/lib/api/languages";
import { ApiError } from "@/lib/api/client";
import { registerUser } from "@/lib/api/users";
import { friendlyError } from "@/lib/auth/errors";
import { homePathFor, saveSession } from "@/lib/auth/session";
import { SELECTED_LANGUAGE_STORAGE_KEY } from "@/lib/context/AppStateContext";
import { PasswordField, TextField } from "./Field";
import { firstName, type Hint } from "./hint";
import styles from "./AuthForm.module.css";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TOTAL_STEPS = 3;
const MIN_PASSWORD = 8;

type Role = "parent" | "child";

const LANGUAGES = [
  { code: "en", label: "English", sample: "Hello!" },
  { code: "hi", label: "हिन्दी", sample: "नमस्ते!" },
];

interface Errors {
  name?: string;
  birthday?: string;
  email?: string;
  password?: string;
}

function ageOn(birthday: string): number {
  const born = new Date(`${birthday}T00:00:00`);
  const today = new Date();
  let age = today.getFullYear() - born.getFullYear();
  if (today.getMonth() < born.getMonth() || (today.getMonth() === born.getMonth() && today.getDate() < born.getDate())) {
    age -= 1;
  }
  return age;
}

function isoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Remember the language chosen at sign-up as the lesson language. Best effort: lessons default to English anyway. */
async function rememberLanguage(code: string) {
  try {
    const match = (await getLanguages()).find((language) => language.code === code);
    if (match) window.localStorage.setItem(SELECTED_LANGUAGE_STORAGE_KEY, match.id);
  } catch {
    // Not saved: the grown-ups menu can change the language later.
  }
}

export default function SignupForm({ onHint }: { onHint: (hint: Hint) => void }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<Role>("parent");
  const [name, setName] = useState("");
  const [birthday, setBirthday] = useState("");
  const [languageCode, setLanguageCode] = useState("en");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  // Fixed when the form opens: the newest birthday is today, the oldest is just under 9 years ago.
  const [{ latestBirthday, earliestBirthday }] = useState(() => {
    const today = new Date();
    return {
      latestBirthday: isoDate(today),
      earliestBirthday: isoDate(new Date(today.getFullYear() - 9, today.getMonth(), today.getDate() + 1)),
    };
  });

  /** Typing in a field clears its old complaint, so a fixed mistake doesn't keep nagging. */
  const edit = (field: keyof Errors, set: (value: string) => void) => (value: string) => {
    set(value);
    setErrors((current) => (current[field] ? { ...current, [field]: undefined } : current));
    setFormError("");
  };

  const focusFirstProblem = () =>
    requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());

  function validate(forStep: number): Errors {
    const found: Errors = {};
    if (forStep === 1 && !name.trim()) found.name = "Please tell us your name.";
    if (forStep === 2 && role === "child") {
      if (!birthday) found.birthday = "Please pick the birthday.";
      else if (birthday > latestBirthday) found.birthday = "A birthday can't be in the future.";
      else if (ageOn(birthday) < 2 || ageOn(birthday) > 8) found.birthday = "UDAAN is for children aged 2 to 8.";
    }
    if (forStep === 3) {
      const trimmed = email.trim();
      if (!trimmed) found.email = "Please enter your email.";
      else if (!EMAIL_PATTERN.test(trimmed)) found.email = "That doesn't look like an email address.";
      if (password.length < MIN_PASSWORD) found.password = `Use at least ${MIN_PASSWORD} characters.`;
    }
    return found;
  }

  function goTo(next: number) {
    setStep(next);
    setErrors({});
    setFormError("");
    if (next === 1) onHint({ text: "Hi! I'm Udi. Who is joining us?", mood: "idle" });
    if (next === 2) onHint({ text: `Nice to meet you, ${firstName(name)}!`, mood: "happy" });
    if (next === 3) onHint({ text: "Almost there! Make a secret password.", mood: "idle" });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const found = validate(step);
    setErrors(found);
    setFormError("");
    if (Object.keys(found).length > 0) {
      focusFirstProblem();
      return;
    }
    if (step < TOTAL_STEPS) {
      goTo(step + 1);
      return;
    }

    setBusy(true);
    try {
      const auth = await registerUser({
        name: name.trim(),
        email: email.trim(),
        password,
        date_of_birth: role === "child" ? birthday : undefined,
        role,
      });
      saveSession(auth);
      await rememberLanguage(languageCode);
      onHint({ text: `Yay! Welcome to UDAAN, ${firstName(auth.user.name)}!`, mood: "happy" });
      window.location.assign(homePathFor(auth.user));
    } catch (error) {
      if (error instanceof ApiError && /already exists/i.test(error.message)) {
        setErrors({ email: "That email already has an account. Try logging in instead." });
        focusFirstProblem();
      } else {
        setFormError(friendlyError(error, "We couldn't create the account. Please try again."));
      }
      onHint({ text: "Hmm, let's check that again.", mood: "idle" });
      setBusy(false);
    }
  }

  const isLast = step === TOTAL_STEPS;

  return (
    <form ref={formRef} onSubmit={submit} className={styles.form} noValidate>
      <header className={styles.heading}>
        <span className={styles.stepLabel}>
          Step {step} of {TOTAL_STEPS}
        </span>
        <div
          className={styles.progress}
          role="progressbar"
          aria-label="Sign-up progress"
          aria-valuemin={1}
          aria-valuemax={TOTAL_STEPS}
          aria-valuenow={step}
        >
          <span style={{ width: `${(step / TOTAL_STEPS) * 100}%` }} />
        </div>
        <h1>{step === 1 ? "Let's get started!" : step === 2 ? "A little more" : "Make your login"}</h1>
      </header>

      {step === 1 && (
        <>
          <fieldset className={styles.choices}>
            <legend>I am a…</legend>
            <label className={styles.choice}>
              <input type="radio" name="role" checked={role === "parent"} onChange={() => setRole("parent")} />
              <span className={styles.choiceIcon} aria-hidden="true">
                👨‍👩‍👧
              </span>
              <strong>Parent or guardian</strong>
              <small>Setting up for a child</small>
            </label>
            <label className={styles.choice}>
              <input type="radio" name="role" checked={role === "child"} onChange={() => setRole("child")} />
              <span className={styles.choiceIcon} aria-hidden="true">
                🧒
              </span>
              <strong>Child</strong>
              <small>Age 2 to 8, ready to learn</small>
            </label>
          </fieldset>

          <TextField
            label="Your name"
            autoComplete="name"
            placeholder="First name"
            maxLength={100}
            value={name}
            onChange={edit("name", setName)}
            error={errors.name}
          />
        </>
      )}

      {step === 2 && (
        <>
          {role === "child" ? (
            <TextField
              label="Birthday"
              type="date"
              min={earliestBirthday}
              max={latestBirthday}
              value={birthday}
              onChange={edit("birthday", setBirthday)}
              error={errors.birthday}
              hint="We use this to show the right learning world."
            />
          ) : (
            <p className={styles.note}>
              You&apos;ll pick which learning world to open each time, so there&apos;s nothing to enter about the child.
            </p>
          )}

          <fieldset className={styles.choices}>
            <legend>Lesson language</legend>
            {LANGUAGES.map((language) => (
              <label key={language.code} className={styles.choice}>
                <input
                  type="radio"
                  name="language"
                  checked={languageCode === language.code}
                  onChange={() => setLanguageCode(language.code)}
                />
                <span className={styles.choiceIcon} aria-hidden="true">
                  {language.sample}
                </span>
                <strong>{language.label}</strong>
              </label>
            ))}
          </fieldset>
          <p className={styles.hint}>You can change this later in the grown-ups settings.</p>
        </>
      )}

      {step === 3 && (
        <>
          <TextField
            label="Email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="you@example.com"
            value={email}
            onChange={edit("email", setEmail)}
            error={errors.email}
          />
          <PasswordField
            label="Password"
            autoComplete="new-password"
            placeholder={`At least ${MIN_PASSWORD} characters`}
            value={password}
            onChange={edit("password", setPassword)}
            error={errors.password}
            showStrength
          />
        </>
      )}

      {formError && (
        <p className={styles.alert} role="alert">
          {formError}
        </p>
      )}

      <div className={styles.buttons}>
        {step > 1 && (
          <button type="button" className={styles.secondary} onClick={() => goTo(step - 1)} disabled={busy}>
            Back
          </button>
        )}
        <button className={styles.primary} type="submit" disabled={busy}>
          {busy ? <span className={styles.spinner} aria-hidden="true" /> : null}
          {busy ? "Creating…" : isLast ? "Create my account" : "Continue"}
        </button>
      </div>

      <p className={styles.switch}>
        Already have an account? <a href="/login">Log in</a>
      </p>
    </form>
  );
}
