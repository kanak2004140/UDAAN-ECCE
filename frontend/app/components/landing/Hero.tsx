import Link from "next/link";
import Mascot from "@/app/components/learn/Mascot";

const focusRing = "focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ink";

const TRUST = [
  { icon: "📚", text: "Lessons from NCERT books" },
  { icon: "🔊", text: "Read aloud by Udi" },
  { icon: "🌐", text: "English & हिन्दी" },
];

export default function Hero() {
  return (
    <section id="top" className="relative isolate overflow-hidden bg-gradient-to-b from-sky via-[#e6f6ff] to-[#fff1cc]">
      {/* ---------- sky ---------- */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute right-[6%] top-[14%] hidden h-36 w-36 animate-[sunPulse_5s_ease-in-out_infinite] rounded-full bg-[#fff1a6] shadow-[0_0_0_22px_rgba(255,241,166,0.45),0_0_90px_rgba(255,214,90,0.6)] sm:block" />

        <Cloud className="top-[22%] [animation:drift_70s_linear_infinite]" />
        <Cloud className="top-[46%] scale-75 opacity-80 [animation:drift_95s_linear_infinite_-40s]" />

        {[
          ["left-[6%] top-[18%] text-3xl", "2.6s"],
          ["left-[44%] top-[11%] text-xl", "3.2s"],
          ["right-[28%] top-[24%] text-2xl", "2.2s"],
        ].map(([position, duration]) => (
          <span key={position} className={`absolute text-white ${position}`} style={{ animation: `twinkle ${duration} ease-in-out infinite` }}>
            ✦
          </span>
        ))}

        {/* hills: far, near, then the page colour so the next section starts clean */}
        <svg viewBox="0 0 1440 260" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-40 w-full sm:h-56">
          <path fill="#b9e6b4" d="M0 120C200 40 420 30 640 90s460 90 800-10v180H0z" />
          <path fill="#7fcf8e" d="M0 170C260 100 520 110 760 150s460 50 680-30v140H0z" />
          <path fill="#fffaf0" d="M0 225C300 180 600 200 900 222s380 8 540-24v62H0z" />
        </svg>
      </div>

      {/* ---------- content ---------- */}
      <div className="mx-auto grid max-w-6xl items-center gap-6 px-5 pb-36 pt-28 sm:px-8 sm:pb-44 sm:pt-32 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:pb-52">
        <div className="text-center lg:text-left">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-1.5 text-sm font-extrabold uppercase tracking-[0.14em] text-brand shadow-[0_3px_0_rgba(0,0,0,0.06)]">
            <span aria-hidden="true">✦</span> For children aged 2 to 8
          </p>

          <h1 className="mt-5 font-display text-[3.4rem] font-extrabold leading-[0.95] tracking-tight text-ink sm:text-7xl lg:text-[5.4rem]">
            Learn<span className="text-[#ff7a59]">.</span> Play<span className="text-sun">.</span>
            <br />
            <span className="text-leaf">Grow</span>
            <span className="text-[#ff7a59]">!</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg font-semibold leading-8 text-ink-soft sm:text-xl lg:mx-0">
            Meet <strong className="text-ink">Udi</strong>, a friendly bird who reads stories, plays picture games and
            guides your child through lessons from real school books.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <Link
              href="/signup"
              className={`group inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-brand px-8 font-display text-xl font-bold text-white shadow-[0_5px_0_var(--color-brand-deep)] transition hover:brightness-110 active:translate-y-1 active:shadow-[0_1px_0_var(--color-brand-deep)] ${focusRing}`}
            >
              Get started
              <span aria-hidden="true" className="transition group-hover:translate-x-1">
                →
              </span>
            </Link>
            <a
              href="#how"
              className={`inline-flex min-h-14 items-center justify-center rounded-full bg-white px-8 font-display text-xl font-bold text-brand-deep shadow-[0_5px_0_rgba(0,0,0,0.08)] transition hover:bg-brand-soft active:translate-y-1 active:shadow-none ${focusRing}`}
            >
              See how it works
            </a>
          </div>

          <ul className="mt-8 flex flex-wrap justify-center gap-2 lg:justify-start" aria-label="Highlights">
            {TRUST.map((item) => (
              <li key={item.text} className="flex items-center gap-1.5 rounded-full bg-white/75 px-3.5 py-1.5 text-sm font-bold text-ink backdrop-blur">
                <span aria-hidden="true">{item.icon}</span>
                {item.text}
              </li>
            ))}
          </ul>
        </div>

        {/* Udi, with a few pieces of the real app floating around */}
        <div className="relative mx-auto mt-4 aspect-square w-[min(88vw,26rem)] lg:mt-0">
          <div aria-hidden="true" className="absolute inset-[8%] rounded-full bg-white/45 blur-2xl" />
          <div aria-hidden="true" className="absolute -right-1 top-[2%] h-24 w-24 rounded-full bg-[#fff1a6] shadow-[0_0_0_14px_rgba(255,241,166,0.45)] sm:hidden" />

          <div className="absolute inset-[7%]">
            <Mascot size="100%" />
          </div>

          <p className="absolute left-0 top-[2%] max-w-[11rem] -rotate-3 animate-[popIn_0.7s_ease-out_1.6s_both] rounded-3xl rounded-bl-md bg-white px-4 py-3 font-display text-lg font-bold leading-tight text-ink shadow-[0_6px_0_rgba(0,0,0,0.07)] sm:max-w-[13rem] sm:text-xl">
            Hi! I&apos;m Udi. Let&apos;s learn together!
          </p>

          <FloatCard className="right-[-2%] top-[22%] [--tilt:4deg]" delay="0s">
            <span className="text-2xl" aria-hidden="true">
              🐱
            </span>
            <span>
              <b className="block text-sm leading-tight">Find the cat!</b>
              <span className="text-xs font-bold text-ink-soft">Picture game</span>
            </span>
          </FloatCard>

          <FloatCard className="bottom-[16%] left-[-3%] [--tilt:-4deg]" delay="0.6s">
            <span className="text-2xl" aria-hidden="true">
              ⭐
            </span>
            <span>
              <b className="block text-sm leading-tight">12 stars</b>
              <span className="text-xs font-bold text-ink-soft">earned today</span>
            </span>
          </FloatCard>

          <FloatCard className="bottom-[4%] right-[4%] [--tilt:3deg]" delay="1.1s">
            <span className="text-2xl" aria-hidden="true">
              📖
            </span>
            <span>
              <b className="block text-sm leading-tight">Story time</b>
              <span className="text-xs font-bold text-ink-soft">read aloud</span>
            </span>
          </FloatCard>
        </div>
      </div>
    </section>
  );
}

function Cloud({ className }: { className: string }) {
  return (
    <div className={`absolute left-0 ${className}`}>
      <div className="relative h-11 w-36 rounded-full bg-white/90">
        <div className="absolute -top-6 left-6 h-14 w-14 rounded-full bg-white/90" />
        <div className="absolute -top-4 left-[4.5rem] h-11 w-11 rounded-full bg-white/90" />
      </div>
    </div>
  );
}

function FloatCard({ className, delay, children }: { className: string; delay: string; children: React.ReactNode }) {
  return (
    <div
      className={`absolute flex items-center gap-2.5 rounded-2xl bg-white px-3.5 py-2.5 text-ink shadow-[0_6px_0_rgba(0,0,0,0.07)] ${className}`}
      style={{ animation: `floatY 4s ease-in-out ${delay} infinite` }}
    >
      {children}
    </div>
  );
}
