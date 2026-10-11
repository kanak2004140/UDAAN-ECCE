import SectionHeading from "./SectionHeading";

const FEATURES = [
  {
    icon: "🐥",
    title: "Udi, a friend who talks",
    text: "Udi reads each lesson out loud and cheers every right answer, so young children never have to read alone.",
    tint: "bg-butter",
    wide: true,
  },
  {
    icon: "📚",
    title: "Real school lessons",
    text: "Lessons are written from NCERT textbook material, not made up.",
    tint: "bg-white",
  },
  {
    icon: "🎮",
    title: "Picture games",
    text: "Find the cat, count the stars: tap the right picture and hear the answer.",
    tint: "bg-white",
  },
  {
    icon: "🌐",
    title: "English and हिन्दी",
    text: "Lessons can be read in English or Hindi. A grown-up switches the language.",
    tint: "bg-white",
  },
  {
    icon: "⭐",
    title: "Stars that stay",
    text: "Finished lessons and right answers earn stars, saved on the device so they're there next time.",
    tint: "bg-blush",
    wide: true,
  },
  {
    icon: "🔒",
    title: "A grown-ups corner",
    text: "Settings sit behind a quick sum, so little fingers can't wander off.",
    tint: "bg-white",
  },
];

export default function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-24">
      <SectionHeading eyebrow="What's inside" title="Learning can feel like play.">
        Everything in UDAAN is built to be easy for small hands and calm for the grown-ups beside them.
      </SectionHeading>

      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((feature) => (
          <article
            key={feature.title}
            className={`rounded-[2rem] border border-ink/5 p-7 shadow-[0_8px_0_rgba(43,33,71,0.05)] transition duration-300 hover:-translate-y-1.5 ${feature.tint} ${feature.wide ? "lg:col-span-2" : ""}`}
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft text-3xl" aria-hidden="true">
              {feature.icon}
            </span>
            <h3 className="mt-5 font-display text-2xl font-extrabold leading-tight text-ink">{feature.title}</h3>
            <p className="mt-2 text-lg font-semibold leading-7 text-ink-soft">{feature.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
