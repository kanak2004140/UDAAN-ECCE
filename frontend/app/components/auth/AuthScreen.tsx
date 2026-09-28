"use client";

import { FormEvent, useMemo, useState } from "react";
import { loginUser, registerUser } from "@/lib/api/users";
import styles from "./AuthScreen.module.css";

type Mode = "login" | "signup";

type Props = {
  mode: Mode;
};

function calculateAge(dateOfBirth: string): number {
  const birthDate = new Date(`${dateOfBirth}T00:00:00`);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const birthdayHasNotPassed =
    today.getMonth() < birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate());

  if (birthdayHasNotPassed) {
    age -= 1;
  }

  return age;
}

export default function AuthScreen({ mode }: Props) {
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [language, setLanguage] = useState("Hindi");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [signupData, setSignupData] = useState({
    name: "",
    dateOfBirth: "",
    email: "",
  });

  const title = mode === "login" ? "Welcome back, explorer!" : "Let's begin your journey!";
  const totalSteps = 4;

  const progress = useMemo(
    () => (mode === "login" ? 100 : (step / totalSteps) * 100),
    [mode, step]
  );

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = String(formData.get("identifier") || "").trim();
    const password = String(formData.get("password") || "");

    if (!email || !password) {
      setMessage("Please enter your email and password.");
      return;
    }

    try {
      setIsSubmitting(true);
      setMessage("");
      const auth = await loginUser({ email, password });
      window.localStorage.setItem("ecce_access_token", auth.access_token);
      window.localStorage.setItem("ecce_user", JSON.stringify(auth.user));
      window.location.assign(auth.user.age_group ? `/learn/${auth.user.age_group}` : "/");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Login failed. Please check your credentials.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function nextStep(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    if (step < totalSteps) {
      setSignupData((current) => ({
        name: String(formData.get("name") || current.name).trim(),
        dateOfBirth: String(formData.get("dateOfBirth") || current.dateOfBirth),
        email: String(formData.get("email") || current.email).trim(),
      }));
      setStep((current) => current + 1);
      setMessage("");
      return;
    }

    const name = signupData.name;
    const email = signupData.email;
    const password = String(formData.get("password") || "");
    const relationship = String(formData.get("relationship") || "Parent / Guardian");
    const dateOfBirth = signupData.dateOfBirth;

    if (!name || !email || !password || !dateOfBirth) {
      setMessage("Please complete all required signup fields.");
      return;
    }

    if (relationship === "Child" && (calculateAge(dateOfBirth) < 2 || calculateAge(dateOfBirth) > 8)) {
      setMessage("A child must be between 2 and 8 years old.");
      return;
    }

    try {
      setIsSubmitting(true);
      setMessage("");
      const auth = await registerUser({
        name,
        email,
        password,
        date_of_birth: dateOfBirth,
        role: relationship === "Child" ? "child" : "parent",
      });
      window.localStorage.setItem("ecce_access_token", auth.access_token);
      window.localStorage.setItem("ecce_user", JSON.stringify(auth.user));
      window.location.assign(auth.user.age_group ? `/learn/${auth.user.age_group}` : "/");
      setStep(1);
      setSignupData({ name: "", dateOfBirth: "", email: "" });
      form.reset();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Signup failed. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.stars} />
      <div className={`${styles.cloud} ${styles.cloudOne}`} />
      <div className={`${styles.cloud} ${styles.cloudTwo}`} />

      <header className={styles.header}>
        <a href="/" className={styles.brand}>
          <span className={styles.logo}>U</span>
          UDAAN
        </a>
        <span className={styles.headerText}>
          Learn · Play · Explore · Grow
        </span>
      </header>

      <section className={styles.shell}>
        <div className={styles.illustration}>
          <div className={styles.moon} />
          <div className={styles.planet}>✦</div>

          <div className={styles.character} aria-hidden="true">
            🧒
          </div>

          <div className={`${styles.sticker} ${styles.star}`}>★</div>
          <div className={`${styles.sticker} ${styles.book}`}>▱</div>
          <div className={`${styles.sticker} ${styles.rocket}`}>🚀</div>

          <div className={styles.illustrationCopy}>
            <span>UDAAN</span>
            <h1>Every little step<br />is an adventure.</h1>
            <p>A happy learning space made for curious young minds and their families.</p>
          </div>
        </div>

        <div className={styles.formPanel}>
          <div className={styles.formTop}>
            <div>
              <span className={styles.kicker}>
                {mode === "login" ? "WELCOME BACK" : `STEP ${step} OF ${totalSteps}`}
              </span>
              <h2>{title}</h2>
            </div>

            {mode === "signup" && (
              <div className={styles.progressRing}>
                {step}/{totalSteps}
              </div>
            )}
          </div>

          {mode === "signup" && (
            <div className={styles.progress}>
              <span style={{ width: `${progress}%` }} />
            </div>
          )}

          {mode === "login" ? (
            <form onSubmit={submitLogin} className={styles.form}>
              <label>
                <span>✉️ Email address</span>
                <input
                  name="identifier"
                  type="text"
                  placeholder="Enter your phone or email"
                  autoComplete="username"
                  required
                />
              </label>

              <label>
                <span>🔐 Password / PIN</span>
                <div className={styles.password}>
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </label>

              <div className={styles.row}>
                <a href="#" onClick={(e) => e.preventDefault()}>
                  Forgot password/PIN?
                </a>
              </div>

              <button className={styles.primary} type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Please wait..." : "🚀 Start Learning"}
              </button>

              <p className={styles.switch}>
                New to UDAAN?{" "}
                <a href="/signup">Create an account</a>
              </p>
            </form>
          ) : (
            <form onSubmit={nextStep} className={styles.form}>
              {step === 1 && (
                <>
                  <label>
                    <span>👋 What&apos;s your name?</span>
                    <input
                      name="name"
                      type="text"
                      placeholder="Enter your name"
                      autoComplete="name"
                      required
                    />
                  </label>

                  <label>
                    <span>✉️ Your email address</span>
                    <input
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      autoComplete="email"
                      required
                    />
                  </label>
                </>
              )}

              {step === 2 && (
                <label>
                  <span>🎂 When were you born?</span>
                  <input
                    name="dateOfBirth"
                    type="date"
                    required
                  />
                  <small>We&apos;ll use this to show the right learning world.</small>
                </label>
              )}

              {step === 3 && (
                <label>
                  <span>🌐 Choose your language</span>
                  <select
                    value={language}
                    onChange={(event) => setLanguage(event.target.value)}
                  >
                    <option>Hindi</option>
                    <option>English</option>
                    <option>Hindi + English</option>
                  </select>
                  <small>You can change this later where supported.</small>
                </label>
              )}

              {step === 4 && (
                <>
                  <label>
                    <span>🔐 Create a password</span>
                    <div className={styles.password}>
                      <input
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a password"
                        autoComplete="new-password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((value) => !value)}
                      >
                        {showPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                  </label>

                  <label>
                    <span>👨‍👩‍👧 Your role</span>
                    <select name="relationship" defaultValue="Parent / Guardian">
                      <option>Parent / Guardian</option>
                      <option>Child</option>
                    </select>
                  </label>
                </>
              )}

              <button className={styles.primary} type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "Please wait..."
                  : step === totalSteps ? "🌟 Create Account" : "Continue →"}
              </button>

              <p className={styles.switch}>
                Already have an account?{" "}
                <a href="/login">Login</a>
              </p>
            </form>
          )}

          {message && <div className={styles.message}>✦ {message}</div>}
        </div>
      </section>

      <footer className={styles.footer}>
        <span>❤️ A safe, playful learning space</span>
        <span>© UDAAN</span>
      </footer>
    </main>
  );
}
