import Image from "next/image";
import Link from "next/link";
import SectionHeading from "./SectionHeading";

const WORLDS = [
  {
    age: "2–4 years",
    name: "Little Explorers",
    href: "/learn/2-4",
    shot: "/screens/world-2-4.png",
    alt: "The Little Explorers screen: Udi the bird, a big green play button and three picture tiles.",
    tint: "bg-butter",
    points: ["Udi leads, and speaks every word", "One giant play button", "Picture games, almost no reading"],
  },
  {
    age: "4–6 years",
    name: "Curious Learners",
    href: "/learn/4-6",
    shot: "/screens/world-4-6.png",
    alt: "The Curious Learners screen: Udi's speech bubble and big picture cards for each story.",
    tint: "bg-blush",
    points: ["Udi's picks plus big picture cards", "Stories told a few sentences at a time", "Tap to hear Udi say it again"],
  },
  {
    age: "6–8 years",
    name: "Young Adventurers",
    href: "/learn/6-8",
    shot: "/screens/world-6-8.png",
    alt: "The Young Adventurers screen: a clean list of lessons with search and filters.",
    tint: "bg-periwinkle",
    points: ["A tidy lesson library with search", "A reader with read-aloud and text size", "Practice games and a progress page"],
  },
];

export default function AgeWorlds() {
  return (
    <section id="worlds" className="bg-white/60 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHeading eyebrow="Three learning worlds" title="Every age gets its own adventure.">
          Children don&apos;t learn the same way at 3 and at 7. Each world is built for its age, not just coloured differently.
        </SectionHeading>

        <div className="mt-14 grid gap-8 lg:grid-cols-3">
          {WORLDS.map((world) => (
            <article key={world.name} className={`group flex flex-col overflow-hidden rounded-[2.2rem] ${world.tint} pt-8 shadow-[0_8px_0_rgba(43,33,71,0.07)]`}>
              <div className="px-7">
                <p className="font-display text-sm font-extrabold uppercase tracking-[0.14em] text-ink-soft">{world.age}</p>
                <h3 className="mt-1 font-display text-3xl font-extrabold text-ink">{world.name}</h3>
                <ul className="mt-4 grid gap-2">
                  {world.points.map((point) => (
                    <li key={point} className="flex gap-2 text-base font-bold leading-6 text-ink/80">
                      <span aria-hidden="true" className="mt-0.5 text-leaf-deep">
                        ✓
                      </span>
                      {point}
                    </li>
                  ))}
                </ul>
                <Link
                  href={world.href}
                  className="mt-6 inline-flex min-h-12 items-center rounded-full bg-white px-6 font-display text-lg font-bold text-brand-deep shadow-[0_4px_0_rgba(0,0,0,0.08)] transition hover:bg-brand-soft active:translate-y-0.5 active:shadow-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  Try this world →
                </Link>
              </div>

              {/* a real screenshot in a phone */}
              <div className="mt-8 flex flex-1 items-end justify-center px-8">
                <div className="relative w-full max-w-[15rem] translate-y-4 rounded-[2.2rem] border-[6px] border-ink bg-ink shadow-[0_20px_40px_rgba(43,33,71,0.25)] transition duration-500 group-hover:translate-y-1">
                  <span aria-hidden="true" className="absolute left-1/2 top-1.5 z-10 h-4 w-16 -translate-x-1/2 rounded-full bg-ink" />
                  <Image
                    src={world.shot}
                    alt={world.alt}
                    width={780}
                    height={1560}
                    sizes="(min-width: 1024px) 240px, 60vw"
                    className="block h-[22rem] w-full rounded-[1.7rem] object-cover object-top"
                  />
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
