"use client";

import { useId, useState, type InputHTMLAttributes, type ReactNode } from "react";
import styles from "./Field.module.css";

interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "onChange"> {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: ReactNode;
}

/** A labelled text box whose problem (if any) is announced and tied to the box. */
export function TextField({ label, value, onChange, error, hint, ...input }: FieldProps) {
  const id = useId();
  const messageId = `${id}-message`;
  return (
    <div className={styles.field}>
      <label htmlFor={id}>{label}</label>
      <input
        {...input}
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={error ? styles.inputError : styles.input}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? messageId : undefined}
      />
      <Message id={messageId} error={error} hint={hint} />
    </div>
  );
}

/** Same, with a Show/Hide button and an optional strength meter for new passwords. */
export function PasswordField({
  label,
  value,
  onChange,
  error,
  hint,
  showStrength = false,
  ...input
}: FieldProps & { showStrength?: boolean }) {
  const id = useId();
  const messageId = `${id}-message`;
  const [visible, setVisible] = useState(false);
  return (
    <div className={styles.field}>
      <label htmlFor={id}>{label}</label>
      <div className={styles.passwordWrap}>
        <input
          {...input}
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={error ? styles.inputError : styles.input}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? messageId : undefined}
        />
        <button
          type="button"
          className={styles.toggle}
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
        >
          <EyeIcon crossed={visible} />
        </button>
      </div>
      {showStrength && value.length > 0 && <StrengthMeter password={value} />}
      <Message id={messageId} error={error} hint={hint} />
    </div>
  );
}

function Message({ id, error, hint }: { id: string; error?: string; hint?: ReactNode }) {
  if (error) {
    return (
      <p id={id} className={styles.error} role="alert">
        {error}
      </p>
    );
  }
  return hint ? (
    <p id={id} className={styles.hint}>
      {hint}
    </p>
  ) : null;
}

/** 0 = too short to use, then 1-3. Length counts most; mixing letters, digits and symbols helps. */
export function passwordStrength(password: string): 0 | 1 | 2 | 3 {
  if (password.length < 8) return 0;
  const kinds = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((pattern) => pattern.test(password)).length;
  if (password.length >= 12 && kinds >= 3) return 3;
  if (password.length >= 10 || kinds >= 3) return 2;
  return 1;
}

const STRENGTH_LABELS = ["Too short", "OK", "Good", "Strong"];

function StrengthMeter({ password }: { password: string }) {
  const level = passwordStrength(password);
  return (
    <div className={styles.meter} aria-live="polite">
      <span className={styles.bars} aria-hidden="true">
        {[1, 2, 3].map((n) => (
          <span key={n} className={n <= level ? styles[`bar${level}`] : styles.bar} />
        ))}
      </span>
      <span className={styles.meterLabel}>{STRENGTH_LABELS[level]}</span>
    </div>
  );
}

function EyeIcon({ crossed }: { crossed: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
      {crossed && <path d="M4 4l16 16" />}
    </svg>
  );
}
