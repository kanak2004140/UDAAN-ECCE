import Link from "next/link";
import SectionHeading from "./SectionHeading";

const CHECKS = [
  "Settings stay behind a quick sum, out of little hands",
  "Choose English or हिन्दी for lessons",
  "See stars and finished lessons at a glance",
  "Works on a phone, tablet or computer",
];

export default function ParentSection() {
  return (
    <section id="parents" className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-24">
      <div className="grid items-center gap-12 overflow-hidden rounded-[2.5rem] bg-butter px-6 py-12 shadow-[0_10px_0_rgba(43,33,71,0.08)] sm:px-12 sm:py-16 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <SectionHeading eyebrow="For parents & guardians" title="Calm for you, joyful for them." align="left">
            You set it up once. After that, your child can explore on their own while you stay in charge of the settings.
          </SectionHeading>

          <ul className="mt-7 grid gap-3">
            {CHECKS.map((check) => (
              <li key={check} className="flex items-start gap-3 text-lg font-bold leading-7 text-ink">
                <span aria-hidden="true" className="mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-full bg-leaf text-sm text-white">
                  ✓
                </span>
                {check}
              </li>
            ))}
          </ul>

          <Link
            href="/signup"
            className="mt-9 inline-flex min-h-14 items-center rounded-full bg-brand px-8 font-display text-xl font-bold text-white shadow-[0_5px_0_var(--color-brand-deep)] transition hover:brightness-110 active:translate-y-1 active:shadow-none focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ink"
          >
            Create a parent account
          </Link>
        </div>

        {/* a picture of the real grown-ups gate */}
        <div className="flex justify-center" aria-hidden="true">
          <div className="w-full max-w-xs -rotate-2 rounded-[1.8rem] bg-white p-7 shadow-[0_24px_50px_rgba(43,33,71,0.18)] transition duration-500 hover:rotate-0">
            <p className="font-display text-2xl font-extrabold text-ink">For grown-ups</p>
            <p className="mt-3 text-lg font-semibold text-ink-soft">What is 7 + 5?</p>
            <div className="mt-3 flex h-14 items-center rounded-2xl border-2 border-brand bg-brand-soft px-4 font-display text-2xl font-bold text-brand-deep">
              12<span className="ml-0.5 inline-block h-6 w-0.5 animate-pulse bg-brand" />
            </div>
            <div className="mt-4 flex h-12 items-center justify-center rounded-full bg-brand font-display text-lg font-bold text-white shadow-[0_4px_0_var(--color-brand-deep)]">
              Open settings
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
