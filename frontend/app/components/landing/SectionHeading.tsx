/** Eyebrow, headline and optional intro used at the top of each landing section. */
export default function SectionHeading({
  eyebrow,
  title,
  children,
  align = "center",
  tone = "dark",
}: {
  eyebrow: string;
  title: string;
  children?: React.ReactNode;
  align?: "center" | "left";
  tone?: "dark" | "light";
}) {
  const centered = align === "center";
  return (
    <div className={centered ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <p className={`font-display text-sm font-extrabold uppercase tracking-[0.18em] ${tone === "light" ? "text-sun" : "text-brand"}`}>
        {eyebrow}
      </p>
      <h2 className={`mt-3 font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl ${tone === "light" ? "text-white" : "text-ink"}`}>
        {title}
      </h2>
      {children && (
        <p className={`mt-4 text-lg font-semibold leading-8 ${tone === "light" ? "text-white/80" : "text-ink-soft"}`}>{children}</p>
      )}
    </div>
  );
}
