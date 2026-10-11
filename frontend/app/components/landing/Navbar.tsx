"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Mascot from "@/app/components/learn/Mascot";
import { homePathFor } from "@/lib/auth/session";
import { useSession } from "@/lib/hooks/useSession";

const LINKS = [
  { href: "#how", label: "How it works" },
  { href: "#worlds", label: "Learning worlds" },
  { href: "#features", label: "Features" },
  { href: "#parents", label: "For parents" },
];

const focusRing = "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-brand";

/**
 * The bar floats over the top of the hero (the header takes no space), so the
 * sky runs right up to the top of the page.
 */
export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user } = useSession();
  const closeMenu = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-50 h-0">
      <div className="px-3 pt-3 sm:px-6 sm:pt-4">
        <nav
          aria-label="Main"
          className="mx-auto flex max-w-6xl items-center justify-between rounded-full bg-white/90 py-2 pl-4 pr-2 shadow-[0_8px_30px_rgba(75,50,174,0.12)] backdrop-blur-xl sm:pl-5"
        >
          <Link href="/" className={`flex items-center gap-2 rounded-full ${focusRing}`} aria-label="UDAAN home">
            <Mascot size={38} />
            <span className="font-display text-xl font-extrabold tracking-[0.12em] text-ink">UDAAN</span>
          </Link>

          <div className="hidden items-center gap-1 lg:flex">
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`rounded-full px-4 py-2 text-[0.95rem] font-bold text-ink-soft transition hover:bg-brand-soft hover:text-brand-deep ${focusRing}`}
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="hidden items-center gap-2 sm:flex">
            {user ? (
              <Link
                href={homePathFor(user)}
                className={`rounded-full bg-brand px-6 py-2.5 font-display text-base font-bold text-white shadow-[0_3px_0_var(--color-brand-deep)] transition hover:brightness-110 active:translate-y-0.5 active:shadow-none ${focusRing}`}
              >
                Open UDAAN
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className={`rounded-full px-5 py-2.5 font-bold text-brand-deep transition hover:bg-brand-soft ${focusRing}`}
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className={`rounded-full bg-brand px-6 py-2.5 font-display text-base font-bold text-white shadow-[0_3px_0_var(--color-brand-deep)] transition hover:brightness-110 active:translate-y-0.5 active:shadow-none ${focusRing}`}
                >
                  Get started
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className={`flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft text-brand-deep transition active:scale-90 lg:hidden ${focusRing}`}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </nav>

        {open && (
          <div id="mobile-menu" className="mx-auto mt-2 max-w-6xl rounded-3xl bg-white p-4 shadow-[0_16px_40px_rgba(75,50,174,0.18)] lg:hidden">
            <ul className="grid gap-1">
              {LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={closeMenu}
                    className={`block rounded-2xl px-4 py-3 text-lg font-bold text-ink hover:bg-brand-soft ${focusRing}`}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex gap-2 border-t border-brand/10 pt-3">
              {user ? (
                <Link href={homePathFor(user)} className="flex-1 rounded-full bg-brand py-3 text-center font-display text-lg font-bold text-white">
                  Open UDAAN
                </Link>
              ) : (
                <>
                  <Link href="/login" className="flex-1 rounded-full bg-brand-soft py-3 text-center font-bold text-brand-deep">
                    Log in
                  </Link>
                  <Link href="/signup" className="flex-1 rounded-full bg-brand py-3 text-center font-display text-lg font-bold text-white">
                    Get started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
