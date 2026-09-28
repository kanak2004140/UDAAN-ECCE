export default function ParentSection() {
  return (
    <section
      id="parents"
      className="mx-auto max-w-7xl px-6 py-20 sm:px-10 lg:px-12"
    >

      <div className="grid items-center gap-10 overflow-hidden rounded-[36px] bg-[#FFECC8] p-8 sm:p-12 lg:grid-cols-[1fr_.8fr] lg:p-16">

        <div>

          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#D16F4E]">
            For parents & guardians
          </p>

          <h2 className="mt-4 max-w-xl text-4xl font-black leading-tight sm:text-5xl">
            Your child's learning journey starts here ❤️
          </h2>

          <p className="mt-6 max-w-xl text-lg leading-8 text-[#557276]">
            A simple space where you can support your child's learning,
            understand their journey and help them discover new things.
          </p>

          <a
            href="/signup"
            className="mt-8 inline-block rounded-full bg-[#17474B] px-7 py-4 text-sm font-black text-white shadow-lg transition hover:-translate-y-1 active:scale-95"
          >
            Explore for Parents →
          </a>

        </div>

        <div className="flex justify-center">

          <div className="relative flex h-72 w-72 items-center justify-center rounded-full bg-white/70 shadow-inner">

            <div className="absolute -right-1 top-4 animate-bounce text-4xl">
              ⭐
            </div>

            <div className="absolute left-5 top-10 text-2xl animate-pulse">
              ✦
            </div>

            <div className="text-8xl animate-[gentleFloat_3s_ease-in-out_infinite]">
              👩‍👧
            </div>

          </div>

        </div>

      </div>

    </section>
  );
}