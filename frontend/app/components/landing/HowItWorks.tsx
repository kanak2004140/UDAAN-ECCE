import SectionHeading from "./SectionHeading";

const STEPS = [
  {
    icon: "🌈",
    title: "Pick a world",
    text: "Choose the learning world that fits your child's age: 2 to 4, 4 to 6, or 6 to 8.",
    tint: "bg-butter",
  },
  {
    icon: "🐥",
    title: "Udi leads the way",
    text: "Udi reads the lesson aloud, shows a picture for each idea and plays quick games.",
    tint: "bg-blush",
  },
  {
    icon: "⭐",
    title: "Collect stars",
    text: "Every finished lesson and right answer earns a star, so children can see how far they've come.",
    tint: "bg-periwinkle",
  },
];

export default function HowItWorks() {
  return (
    <section id="how" className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-24">
      <SectionHeading eyebrow="How it works" title="Three easy steps to start.">
        No setup, no long forms. A grown-up signs in once, then the child can begin.
      </SectionHeading>

      <ol className="relative mt-14 grid gap-6 md:grid-cols-3">
        {STEPS.map((step, index) => (
          <li key={step.title} className="relative">
            <div className="h-full rounded-[2rem] border border-ink/5 bg-white p-7 shadow-[0_8px_0_rgba(43,33,71,0.05)] transition duration-300 hover:-translate-y-1.5">
              <div className="flex items-center justify-between">
                <span className={`flex h-16 w-16 items-center justify-center rounded-2xl text-4xl ${step.tint}`} aria-hidden="true">
                  {step.icon}
                </span>
                <span className="font-display text-6xl font-extrabold leading-none text-brand/15" aria-hidden="true">
                  {index + 1}
                </span>
              </div>
              <h3 className="mt-6 font-display text-2xl font-extrabold text-ink">
                <span className="sr-only">Step {index + 1}: </span>
                {step.title}
              </h3>
              <p className="mt-2 text-lg font-semibold leading-7 text-ink-soft">{step.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
