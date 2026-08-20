export default function Home() {
  return (
    <main className="relative isolate flex min-h-screen overflow-hidden bg-[#f7f5ef] text-[#173b3f]">
      <div className="pointer-events-none absolute -right-24 -top-32 -z-10 h-96 w-96 rounded-full bg-[#f5c96b] opacity-70 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-48 -left-32 -z-10 h-[28rem] w-[28rem] rounded-full bg-[#b7d9cc] opacity-70 blur-3xl" />

      <div className="mx-auto flex w-full max-w-6xl flex-col px-6 py-7 sm:px-10 lg:px-14">
        <nav className="flex items-center justify-between border-b border-[#173b3f]/15 pb-5">
          <a href="#top" className="flex items-center gap-3 text-sm font-bold tracking-[0.2em]">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#173b3f] text-lg text-[#f5c96b]">E</span>
            ECCE
          </a>
          <span className="hidden text-xs font-semibold uppercase tracking-[0.18em] text-[#557276] sm:block">
            Early learning, thoughtfully made
          </span>
          <a href="mailto:hello@ecce.tools" className="text-sm font-semibold underline decoration-[#f0a35b] decoration-2 underline-offset-4">
            Say hello
          </a>
        </nav>

        <section id="top" className="grid flex-1 items-center gap-14 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20 lg:py-24">
          <div className="animate-[fade-in_700ms_ease-out_both]">
            <p className="mb-6 text-xs font-bold uppercase tracking-[0.25em] text-[#d47742]">A new toolkit is taking shape</p>
            <h1 className="max-w-3xl text-5xl font-semibold leading-[0.98] tracking-[-0.04em] sm:text-7xl">
              Hello, we&apos;re going to develop <span className="text-[#d47742]">ECCE tools.</span>
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-8 text-[#557276] sm:text-xl">
              Simple, playful technology for the people helping young learners grow. We&apos;re building a calmer way to plan, create, and understand learning experiences.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-5">
              <a href="mailto:hello@ecce.tools" className="rounded-full bg-[#173b3f] px-6 py-3.5 text-sm font-bold text-[#f7f5ef] transition-transform hover:-translate-y-0.5">
                Start a conversation <span aria-hidden="true">&rarr;</span>
              </a>
              <span className="text-sm font-semibold text-[#557276]">Built with care, in public</span>
            </div>
          </div>

          <div className="relative animate-[fade-in_900ms_150ms_ease-out_both]" aria-label="Preview of the ECCE toolkit">
            <div className="absolute -left-5 top-10 h-24 w-24 rounded-3xl border-2 border-dashed border-[#d47742]/50" />
            <div className="relative rounded-[2rem] border border-[#173b3f]/10 bg-[#fffdf8] p-5 shadow-[0_25px_70px_rgba(23,59,63,0.12)] sm:p-7">
              <div className="flex items-center justify-between border-b border-[#173b3f]/10 pb-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d47742]">Today&apos;s studio</p>
                  <h2 className="mt-2 text-2xl font-semibold">Little moments</h2>
                </div>
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f5c96b] text-xl" aria-hidden="true">✦</span>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-[#e4f0e9] p-4"><span className="text-2xl">◌</span><p className="mt-5 text-sm font-bold">Observe</p><p className="mt-1 text-xs text-[#557276]">Notice the details</p></div>
                <div className="rounded-2xl bg-[#fff0d2] p-4"><span className="text-2xl">↗</span><p className="mt-5 text-sm font-bold">Explore</p><p className="mt-1 text-xs text-[#557276]">Follow their lead</p></div>
              </div>
              <div className="mt-3 rounded-2xl bg-[#173b3f] p-5 text-[#f7f5ef]">
                <div className="flex items-center justify-between"><p className="text-sm font-bold">A space to wonder</p><span className="text-[#f5c96b]">● ● ●</span></div>
                <div className="mt-5 h-2 rounded-full bg-[#557276]"><div className="h-2 w-2/3 rounded-full bg-[#f5c96b]" /></div>
                <p className="mt-3 text-xs text-[#b7d9cc]">Your next idea is 66% ready.</p>
              </div>
            </div>
          </div>
        </section>

        <footer className="flex flex-col gap-2 border-t border-[#173b3f]/15 pt-5 text-xs font-semibold uppercase tracking-[0.16em] text-[#557276] sm:flex-row sm:items-center sm:justify-between">
          <span>Tools for early childhood education</span>
          <span>Coming soon / 2026</span>
        </footer>
      </div>
    </main>
  );
}
