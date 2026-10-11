import type { Metadata } from "next";
import { Baloo_2, Geist, Geist_Mono, Nunito, Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";
import { AppStateProvider } from "@/lib/context/AppStateContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Rounded, friendly display font for the youngest learners. Includes Devanagari
// so Hindi lessons look as friendly as English ones.
const kidsFont = Baloo_2({
  variable: "--font-kids",
  subsets: ["latin", "devanagari"],
  display: "swap",
});

// Calm, highly legible reading font for the oldest group (and the grown-ups menu).
const bodyFont = Nunito({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const devanagariFont = Noto_Sans_Devanagari({
  variable: "--font-deva",
  subsets: ["devanagari"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "UDAAN",
  description: "A friendly learning companion for children aged 2 to 8.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${kidsFont.variable} ${bodyFont.variable} ${devanagariFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AppStateProvider>{children}</AppStateProvider>
      </body>
    </html>
  );
}
