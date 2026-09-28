"use client";

import { useEffect, useState } from "react";

export default function BrandSplash() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
    }, 2600);

    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-[#FFF3CC]">

      {/* Decorative orbit */}
      <div className="absolute h-[420px] w-[420px] rounded-full border border-[#17474B]/10 animate-spin [animation-duration:18s]" />

      <div className="absolute h-[620px] w-[620px] rounded-full border border-dashed border-[#17474B]/10 animate-spin [animation-duration:28s] [animation-direction:reverse]" />

      {/* Stars */}
      <span className="absolute left-[20%] top-[25%] text-3xl text-[#EF8B5C] animate-pulse">
        ✦
      </span>

      <span className="absolute right-[20%] top-[32%] text-2xl text-[#EF8B5C] animate-pulse [animation-delay:500ms]">
        ✧
      </span>

      <span className="absolute bottom-[25%] right-[30%] text-3xl text-[#EF8B5C] animate-pulse [animation-delay:900ms]">
        ✦
      </span>

      {/* Logo */}
      <div className="relative flex h-36 w-36 items-center justify-center rounded-[38px] bg-white shadow-[0_20px_60px_rgba(23,71,75,0.15)] animate-[splashLogo_900ms_ease-out]">

        <span className="absolute -right-2 -top-4 text-3xl">
          ✨
        </span>

        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#E4F0E9]">

          <svg
            viewBox="0 0 100 100"
            className="h-20 w-20"
            aria-hidden="true"
          >
            <circle
              cx="50"
              cy="50"
              r="43"
              fill="#FFF4C9"
            />

            <path
              d="M25 57 C32 40 42 33 50 33 C58 33 68 40 75 57"
              fill="none"
              stroke="#17474B"
              strokeWidth="6"
              strokeLinecap="round"
            />

            <path
              d="M32 61 C39 54 45 49 50 45 C55 49 61 54 68 61"
              fill="none"
              stroke="#EF8B5C"
              strokeWidth="6"
              strokeLinecap="round"
            />

            <circle
              cx="50"
              cy="36"
              r="5"
              fill="#F5BD42"
            />
          </svg>

        </div>
      </div>

      {/* Brand */}
      <h1 className="mt-6 text-6xl font-black tracking-[0.14em] text-[#17474B] sm:text-8xl animate-[splashText_800ms_ease-out_200ms_both]">
        UDAAN
      </h1>

      <p className="mt-4 text-sm font-bold uppercase tracking-[0.22em] text-[#D16F4E] animate-[splashText_800ms_ease-out_400ms_both]">
        Learn • Play • Grow
      </p>

      {/* Loading line */}
      <div className="mt-8 h-1.5 w-28 overflow-hidden rounded-full bg-[#17474B]/10">
        <div className="h-full w-1/2 rounded-full bg-[#EF8B5C] animate-[loadingLine_1.4s_ease-in-out_infinite]" />
      </div>

    </div>
  );
}