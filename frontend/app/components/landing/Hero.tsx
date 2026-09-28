"use client";

export default function Hero() {
  return (
    <section
      id="top"
      className="relative min-h-[calc(100vh-80px)] overflow-hidden"
    >
      {/* ================= BACKGROUND WORLD ================= */}

      <div className="absolute inset-0 overflow-hidden bg-[#77d7ec]">

        {/* Sun */}
        <div className="absolute right-[8%] top-[8%] h-28 w-28 rounded-full bg-[#ffd86b] shadow-[0_0_80px_rgba(255,216,107,0.65)] animate-[sunPulse_4s_ease-in-out_infinite]" />

        {/* Stars */}
        <div className="absolute left-[7%] top-[15%] text-3xl text-white animate-[twinkle_2.5s_ease-in-out_infinite]">
          ✦
        </div>

        <div className="absolute left-[23%] top-[9%] text-xl text-white animate-[twinkle_3s_ease-in-out_infinite_400ms]">
          ✦
        </div>

        <div className="absolute right-[30%] top-[13%] text-2xl text-white animate-[twinkle_2s_ease-in-out_infinite_700ms]">
          ✧
        </div>

        <div className="absolute right-[7%] top-[30%] text-3xl text-white animate-[twinkle_2.7s_ease-in-out_infinite]">
          ✦
        </div>

        {/* Clouds */}
        <div className="absolute left-[5%] top-[20%] animate-[cloudMove_18s_linear_infinite]">
          <div className="relative h-12 w-36 rounded-full bg-white/90">
            <div className="absolute -top-7 left-7 h-16 w-16 rounded-full bg-white/90" />
            <div className="absolute -top-5 left-20 h-12 w-12 rounded-full bg-white/90" />
          </div>
        </div>

        <div className="absolute right-[3%] top-[38%] animate-[cloudMoveReverse_22s_linear_infinite]">
          <div className="relative h-10 w-32 rounded-full bg-white/75">
            <div className="absolute -top-6 left-5 h-14 w-14 rounded-full bg-white/75" />
            <div className="absolute -top-5 left-16 h-11 w-11 rounded-full bg-white/75" />
          </div>
        </div>

        {/* Floating Rocket */}
        <div className="absolute left-[8%] top-[42%] rotate-[-18deg] animate-[floatObject_4s_ease-in-out_infinite]">
          <div className="text-5xl">🚀</div>
        </div>

        {/* Floating Book */}
        <div className="absolute right-[12%] top-[23%] rotate-12 animate-[floatObject_3.5s_ease-in-out_infinite_500ms]">
          <div className="text-5xl">📚</div>
        </div>

        {/* Floating Star */}
        <div className="absolute right-[23%] top-[52%] animate-[floatObject_3s_ease-in-out_infinite_900ms]">
          <div className="text-4xl">⭐</div>
        </div>

        {/* ================= HILLS ================= */}

        <div className="absolute -bottom-[12%] -left-[10%] h-[42%] w-[65%] rounded-[50%] bg-[#8bcf9b]" />

        <div className="absolute -bottom-[16%] -right-[15%] h-[45%] w-[70%] rounded-[50%] bg-[#72bc88]" />

        {/* Small hills */}
        <div className="absolute bottom-[13%] left-[8%] h-28 w-56 rounded-t-full bg-[#63b27a]" />

        <div className="absolute bottom-[14%] right-[10%] h-32 w-64 rounded-t-full bg-[#5eac75]" />

        {/* Ground */}
        <div className="absolute bottom-0 h-[19%] w-full bg-[#9bd3a0]" />

        {/* Flowers */}
        <div className="absolute bottom-[9%] left-[18%] text-2xl">
          🌼
        </div>

        <div className="absolute bottom-[7%] left-[31%] text-xl">
          🌸
        </div>

        <div className="absolute bottom-[8%] right-[23%] text-2xl">
          🌼
        </div>

        <div className="absolute bottom-[11%] right-[12%] text-xl">
          🌸
        </div>
      </div>

      {/* ================= CONTENT ================= */}

      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-80px)] max-w-7xl items-center gap-10 px-6 py-16 sm:px-10 lg:grid-cols-[0.9fr_1.1fr] lg:px-12">

        {/* LEFT */}

        <div className="order-2 lg:order-1">

          <div className="inline-flex items-center gap-2 rounded-full bg-white/90 px-5 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#d16f4e] shadow-lg backdrop-blur">
            <span className="animate-pulse">✦</span>
            Welcome to Udaan
          </div>

          <h1 className="mt-6 max-w-2xl text-5xl font-black leading-[0.95] tracking-[-0.045em] text-[#17474b] sm:text-7xl">

            Learn

            <span className="text-[#ef8b5c]">.</span>

            <br />

            Play

            <span className="text-[#f5bd42]">.</span>

            <br />

            <span className="text-[#4f9b73]">
              Grow
            </span>

            <span className="text-[#ef8b5c]">!</span>

          </h1>

          <p className="mt-6 max-w-xl text-lg font-medium leading-8 text-[#315e61] sm:text-xl">
            A joyful learning world where children discover,
            explore and grow through play.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">

            <a
              href="/login"
              className="group rounded-full bg-[#17474b] px-7 py-4 font-black text-white shadow-[0_12px_30px_rgba(23,71,75,0.25)] transition duration-300 hover:-translate-y-1 hover:shadow-xl active:scale-95"
            >
              🚀 Start Learning

              <span className="ml-2 inline-block transition group-hover:translate-x-1">
                →
              </span>
            </a>

            <a
              href="#parents"
              className="rounded-full bg-white px-7 py-4 font-black text-[#17474b] shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-xl active:scale-95"
            >
              ❤️ For Parents
            </a>

          </div>

          <div className="mt-8 flex items-center gap-3 text-sm font-bold text-[#315e61]">

            <div className="flex -space-x-2">

              <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-[#ffd9a8]">
                🧒
              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-[#dceef4]">
                👧
              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-[#dcefdc]">
                🧒
              </div>

            </div>

            Made for curious little minds

          </div>
        </div>

        {/* RIGHT CHARACTER */}

        <div className="order-1 flex min-h-[470px] items-center justify-center lg:order-2">

          <div className="relative">

            {/* Character glow */}
            <div className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/30 blur-3xl" />

            {/* Character */}
            <div className="relative z-10 animate-[characterFloat_3.5s_ease-in-out_infinite]">

              {/* Head */}
              <div className="relative mx-auto h-40 w-40 rounded-[48%] bg-[#f4b78c] shadow-[0_15px_25px_rgba(23,71,75,0.12)] sm:h-48 sm:w-48">

                {/* Hair */}
                <div className="absolute -top-8 left-5 h-20 w-36 rounded-[50%] bg-[#583e36] sm:h-24 sm:w-44" />

                {/* Eyes */}
                <div className="absolute left-[27%] top-[47%] h-4 w-4 rounded-full bg-[#173f42]" />

                <div className="absolute right-[27%] top-[47%] h-4 w-4 rounded-full bg-[#173f42]" />

                {/* Smile */}
                <div className="absolute bottom-[22%] left-1/2 h-7 w-14 -translate-x-1/2 rounded-b-full border-b-4 border-[#173f42]" />

                {/* Cheeks */}
                <div className="absolute left-[13%] top-[60%] h-4 w-7 rounded-full bg-[#ed967e]/60" />

                <div className="absolute right-[13%] top-[60%] h-4 w-7 rounded-full bg-[#ed967e]/60" />

              </div>

              {/* Body */}
              <div className="mx-auto mt-[-3px] h-40 w-36 rounded-[42px] bg-[#ef8b5c] shadow-[0_15px_25px_rgba(23,71,75,0.13)] sm:h-48 sm:w-44" />

              {/* Left arm */}
              <div className="absolute left-[-35px] top-[185px] h-7 w-24 rotate-[28deg] rounded-full bg-[#f4b78c] sm:left-[-45px] sm:top-[220px]" />

              {/* Right arm */}
              <div className="absolute right-[-35px] top-[180px] h-7 w-24 rotate-[-28deg] rounded-full bg-[#f4b78c] sm:right-[-45px] sm:top-[215px]" />

              {/* Legs */}
              <div className="mx-auto flex w-24 justify-between">

                <div className="h-20 w-9 rounded-full bg-[#355d65]" />

                <div className="h-20 w-9 rounded-full bg-[#355d65]" />

              </div>

            </div>

            {/* Floating decorations */}

            <div className="absolute -left-20 top-10 z-20 text-5xl animate-[floatObject_3s_ease-in-out_infinite]">
              ⭐
            </div>

            <div className="absolute -right-16 top-16 z-20 text-5xl animate-[floatObject_3.4s_ease-in-out_infinite_500ms]">
              🎈
            </div>

            <div className="absolute -bottom-5 -left-20 z-20 text-5xl animate-[floatObject_3.8s_ease-in-out_infinite_800ms]">
              🧩
            </div>

            <div className="absolute -bottom-2 -right-20 z-20 text-5xl animate-[floatObject_3.2s_ease-in-out_infinite_300ms]">
              🎨
            </div>

          </div>

        </div>

      </div>

      {/* Scroll hint */}

      <div className="absolute bottom-5 left-1/2 z-20 hidden -translate-x-1/2 flex-col items-center text-xs font-bold text-[#17474b]/60 sm:flex">

        <span>Explore Udaan</span>

        <span className="mt-1 animate-bounce text-lg">
          ↓
        </span>

      </div>

    </section>
  );
}