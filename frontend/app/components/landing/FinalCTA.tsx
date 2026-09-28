export default function FinalCTA() {
  return (
    <>
      {/* Language */}
      <section className="mx-auto max-w-7xl px-6 py-10 sm:px-10 lg:px-12">

        <div className="flex flex-col items-center justify-between gap-6 rounded-[28px] border border-[#17474B]/10 bg-white p-7 text-center shadow-sm sm:flex-row sm:text-left">

          <div>

            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#D16F4E]">
              🌐 Language matters
            </p>

            <h3 className="mt-2 text-2xl font-black">
              Learning in a language children understand.
            </h3>

          </div>

          <a
            href="/signup"
            className="rounded-full bg-[#EAF3EF] px-6 py-3 font-black transition hover:-translate-y-1 hover:bg-[#D9ECE5] active:scale-95"
          >
            Choose Language →
          </a>

        </div>

      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-7xl px-6 py-20 sm:px-10 lg:px-12">

        <div className="relative overflow-hidden rounded-[36px] bg-[#17474B] px-7 py-16 text-center text-white sm:px-12">

          <div className="absolute left-10 top-10 text-3xl animate-pulse">
            ✦
          </div>

          <div className="absolute right-12 top-16 text-2xl animate-bounce">
            ⭐
          </div>

          <div className="absolute bottom-10 left-1/4 text-2xl animate-pulse">
            ✧
          </div>

          <div className="absolute bottom-14 right-1/4 text-xl animate-bounce">
            ✦
          </div>

          <p className="text-sm font-black uppercase tracking-[0.2em] text-[#F5BD42]">
            Ready to explore?
          </p>

          <h2 className="mx-auto mt-5 max-w-3xl text-4xl font-black leading-tight sm:text-6xl">
            Let's make learning a little more magical.
          </h2>

          <a
            href="/signup"
            className="mt-9 rounded-full bg-[#EF8B5C] px-8 py-4 text-sm font-black text-white shadow-xl transition hover:-translate-y-1 hover:scale-[1.02] active:scale-95"
          >
            🚀 Start the Journey
          </a>

        </div>

      </section>

      {/* Footer */}
      <footer className="border-t border-[#17474B]/10 bg-white">

        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-8 sm:px-10 lg:flex-row lg:items-center lg:justify-between lg:px-12">

          <div className="flex items-center gap-3">

            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFF0C4]">
              ✨
            </div>

            <div>

              <p className="font-black tracking-[0.14em]">
                UDAAN
              </p>

              <p className="text-xs text-[#557276]">
                Learn • Play • Grow
              </p>

            </div>

          </div>

          <p className="text-xs font-semibold text-[#557276]">
            A playful learning world for growing minds.
          </p>

        </div>

      </footer>
    </>
  );
}