import Link from "next/link";
import Mascot from "@/app/components/learn/Mascot";

export default function FinalCTA() {
  return (
    <section className="mx-auto max-w-6xl px-5 pb-20 sm:px-8 sm:pb-24">
      <div className="relative isolate overflow-hidden rounded-[2.5rem] bg-gradient-to-b from-sky to-[#e9f7ff] px-6 pb-14 pt-10 text-center shadow-[0_10px_0_rgba(43,33,71,0.1)] sm:px-12 sm:pb-16">
        <div aria-hidden="true" className="absolute -right-6 -top-6 -z-10 h-32 w-32 rounded-full bg-[#fff1a6] shadow-[0_0_0_18px_rgba(255,241,166,0.45)]" />

        <div className="mx-auto w-36 sm:w-44">
          <Mascot size="100%" mood="happy" />
        </div>

        <h2 className="mx-auto mt-4 max-w-2xl font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-ink sm:text-6xl">
          Ready to meet Udi?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg font-semibold leading-8 text-ink-soft sm:text-xl">
          Make an account in a minute, pick a world and let the learning begin.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/signup"
            className="inline-flex min-h-14 items-center rounded-full bg-brand px-9 font-display text-xl font-bold text-white shadow-[0_5px_0_var(--color-brand-deep)] transition hover:brightness-110 active:translate-y-1 active:shadow-none focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ink"
          >
            Get started
          </Link>
          <Link
            href="/login"
            className="inline-flex min-h-14 items-center rounded-full bg-white px-9 font-display text-xl font-bold text-brand-deep shadow-[0_5px_0_rgba(0,0,0,0.08)] transition hover:bg-brand-soft active:translate-y-1 active:shadow-none focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ink"
          >
            I have an account
          </Link>
        </div>
      </div>
    </section>
  );
}
