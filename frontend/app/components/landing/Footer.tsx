import Link from "next/link";
import Mascot from "@/app/components/learn/Mascot";

export default function Footer() {
  return (
    <footer className="border-t border-ink/10 bg-white/70">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 sm:px-8 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="flex items-center gap-2 font-display text-xl font-extrabold tracking-[0.12em] text-ink">
            <Mascot size={36} />
            UDAAN
          </p>
          <p className="mt-2 text-sm font-bold text-ink-soft">Learn · Play · Grow</p>
        </div>

        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 font-bold text-ink-soft">
          <a href="#how" className="hover:text-brand-deep">
            How it works
          </a>
          <a href="#worlds" className="hover:text-brand-deep">
            Learning worlds
          </a>
          <a href="#parents" className="hover:text-brand-deep">
            For parents
          </a>
          <Link href="/login" className="hover:text-brand-deep">
            Log in
          </Link>
          <Link href="/signup" className="hover:text-brand-deep">
            Sign up
          </Link>
        </nav>
      </div>

      <p className="mx-auto max-w-6xl px-5 pb-8 text-xs font-semibold leading-5 text-ink-soft/80 sm:px-8">
        Lessons are based on textbooks published by NCERT. UDAAN is an independent project and is not affiliated with or endorsed by NCERT.
      </p>
    </footer>
  );
}
