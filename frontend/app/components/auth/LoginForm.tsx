"use client";

import { useRef, useState, type FormEvent } from "react";
import { loginUser } from "@/lib/api/users";
import { friendlyError } from "@/lib/auth/errors";
import { homePathFor, saveSession } from "@/lib/auth/session";
import { PasswordField, TextField } from "./Field";
import { firstName, type Hint } from "./hint";
import styles from "./AuthForm.module.css";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Errors {
  email?: string;
  password?: string;
}

export default function LoginForm({ onHint }: { onHint: (hint: Hint) => void }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  /** Typing in a field clears its old complaint, so a fixed mistake doesn't keep nagging. */
  const edit = (field: keyof Errors, set: (value: string) => void) => (value: string) => {
    set(value);
    setErrors((current) => (current[field] ? { ...current, [field]: undefined } : current));
    setFormError("");
  };

  const focusFirstProblem = () =>
    requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());

  async function submit(event: FormEvent) {
    event.preventDefault();
    const found: Errors = {};
    const trimmed = email.trim();
    if (!trimmed) found.email = "Please enter your email.";
    else if (!EMAIL_PATTERN.test(trimmed)) found.email = "That doesn't look like an email address.";
    if (!password) found.password = "Please enter your password.";
    setErrors(found);
    setFormError("");
    if (found.email || found.password) {
      focusFirstProblem();
      return;
    }

    setBusy(true);
    try {
      const auth = await loginUser({ email: trimmed, password });
      saveSession(auth);
      onHint({ text: `Welcome back, ${firstName(auth.user.name)}!`, mood: "happy" });
      // A full page load, so nothing from the signed-out visit lingers.
      window.location.assign(homePathFor(auth.user));
    } catch (error) {
      setFormError(friendlyError(error, "We couldn't log you in. Please try again."));
      onHint({ text: "Oops! Let's try again.", mood: "idle" });
      setBusy(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={submit} className={styles.form} noValidate>
      <header className={styles.heading}>
        <h1>Welcome back!</h1>
        <p>Log in to keep learning.</p>
      </header>

      <TextField
        label="Email"
        type="email"
        inputMode="email"
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        placeholder="you@example.com"
        value={email}
        onChange={edit("email", setEmail)}
        error={errors.email}
      />

      <PasswordField
        label="Password"
        autoComplete="current-password"
        placeholder="Your password"
        value={password}
        onChange={edit("password", setPassword)}
        error={errors.password}
      />

      {formError && (
        <p className={styles.alert} role="alert">
          {formError}
        </p>
      )}

      <button className={styles.primary} type="submit" disabled={busy}>
        {busy ? <span className={styles.spinner} aria-hidden="true" /> : null}
        {busy ? "Logging in…" : "Log in"}
      </button>

      <p className={styles.switch}>
        New to UDAAN? <a href="/signup">Create an account</a>
      </p>
    </form>
  );
}
