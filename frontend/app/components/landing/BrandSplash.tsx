import Mascot from "@/app/components/learn/Mascot";

/**
 * A short welcome as the page opens. It fades itself out with a CSS animation
 * (no script, nothing to wait for) and stops catching clicks as it goes.
 */
export default function BrandSplash() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-b from-sky to-cream [animation:splashOut_0.5s_ease_1.5s_forwards]"
      style={{ pointerEvents: "none" }}
    >
      <div className="animate-[splashLogo_0.9s_ease-out]">
        <Mascot size={150} mood="happy" />
      </div>

      <p className="mt-4 font-display text-6xl font-extrabold tracking-[0.12em] text-ink animate-[splashText_0.8s_ease-out_0.2s_both] sm:text-8xl">
        UDAAN
      </p>

      <p className="mt-2 font-display text-lg font-bold uppercase tracking-[0.2em] text-brand animate-[splashText_0.8s_ease-out_0.4s_both]">
        Learn · Play · Grow
      </p>
    </div>
  );
}
