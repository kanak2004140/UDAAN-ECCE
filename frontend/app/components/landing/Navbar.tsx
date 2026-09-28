"use client";

import { useState } from "react";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 px-4 pt-4 sm:px-6">

      <nav className="mx-auto flex max-w-7xl items-center justify-between rounded-[24px] border border-[#17474B]/10 bg-white/85 px-5 py-3 shadow-[0_10px_40px_rgba(23,71,75,0.08)] backdrop-blur-xl">

        {/* Logo */}
        <a
          href="#top"
          className="group flex items-center gap-3"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-[15px] bg-[#FFF0C4] transition duration-300 group-hover:-rotate-6 group-hover:scale-105">

            <svg
              viewBox="0 0 64 64"
              className="h-9 w-9"
              aria-hidden="true"
            >
              <circle
                cx="32"
                cy="32"
                r="27"
                fill="#FFF7D9"
              />

              <path
                d="M16 39 C23 24 29 20 32 20 C35 20 41 24 48 39"
                fill="none"
                stroke="#17474B"
                strokeWidth="4"
                strokeLinecap="round"
              />

              <path
                d="M21 41 C27 35 29 32 32 29 C35 32 37 35 43 41"
                fill="none"
                stroke="#EF8B5C"
                strokeWidth="4"
                strokeLinecap="round"
              />

              <circle
                cx="32"
                cy="24"
                r="3"
                fill="#F5BD42"
              />
            </svg>

          </div>

          <span className="text-lg font-black tracking-[0.16em]">
            UDAAN
          </span>
        </a>

        {/* Desktop navigation */}
        <div className="hidden items-center gap-7 lg:flex">

          <a
            href="#about"
            className="text-sm font-semibold text-[#557276] transition hover:-translate-y-0.5 hover:text-[#17474B]"
          >
            What is Udaan?
          </a>

          <a
            href="#features"
            className="text-sm font-semibold text-[#557276] transition hover:-translate-y-0.5 hover:text-[#17474B]"
          >
            Features
          </a>

          <a
            href="#worlds"
            className="text-sm font-semibold text-[#557276] transition hover:-translate-y-0.5 hover:text-[#17474B]"
          >
            Learning Worlds
          </a>

          <a
            href="#parents"
            className="text-sm font-semibold text-[#557276] transition hover:-translate-y-0.5 hover:text-[#17474B]"
          >
            For Parents
          </a>

        </div>

        {/* Desktop actions */}
        <div className="hidden items-center gap-3 sm:flex">

          <a href="/login" className="rounded-full px-5 py-2.5 text-sm font-bold text-[#17474B] transition hover:bg-[#EAF3EF]">
            Login
          </a>

          <a href="/signup" className="rounded-full bg-[#17474B] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#17474B]/15 transition hover:-translate-y-0.5 hover:shadow-xl">
            Sign Up
          </a>

        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-[#EAF3EF] text-xl transition active:scale-90 lg:hidden"
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
        >
          {menuOpen ? "×" : "☰"}
        </button>

      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="mx-auto mt-2 max-w-7xl rounded-[22px] border border-[#17474B]/10 bg-white p-5 shadow-xl lg:hidden">

          <div className="flex flex-col gap-4">

            <a href="#about" onClick={closeMenu}>
              What is Udaan?
            </a>

            <a href="#features" onClick={closeMenu}>
              Features
            </a>

            <a href="#worlds" onClick={closeMenu}>
              Learning Worlds
            </a>

            <a href="#parents" onClick={closeMenu}>
              For Parents
            </a>

            <div className="mt-2 flex gap-2 border-t border-[#17474B]/10 pt-4">

              <a href="/login" className="flex-1 rounded-full bg-[#EAF3EF] py-3 text-center font-bold">
                Login
              </a>

              <a href="/signup" className="flex-1 rounded-full bg-[#17474B] py-3 text-center font-bold text-white">
                Sign Up
              </a>

            </div>

          </div>

        </div>
      )}

    </header>
  );
}