import Link from "next/link";

const worlds = [
  {
    age: "2–4",
    href: "/learn/2-4",
    title: "Little Explorers",
    description:
      "Discover the world through sounds, pictures, movement and play.",
    emoji: "🐣",
    background: "bg-[#FFF0D2]",
  },
  {
    age: "4–6",
    href: "/learn/4-6",
    title: "Curious Learners",
    description:
      "Ask, create, discover and build new skills through playful activities.",
    emoji: "🌈",
    background: "bg-[#E4F0E9]",
  },
  {
    age: "6–8",
    href: "/learn/6-8",
    title: "Young Adventurers",
    description:
      "Explore ideas, solve challenges and grow confidence through learning.",
    emoji: "🚀",
    background: "bg-[#E8E1F7]",
  },
];

export default function AgeWorlds() {
  return (
    <section
      id="worlds"
      className="bg-[#F4F8F3] px-6 py-20 sm:px-10 lg:px-12"
    >

      <div className="mx-auto max-w-7xl">

        <div className="text-center">

          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#D16F4E]">
            Three learning worlds
          </p>

          <h2 className="mt-4 text-4xl font-black sm:text-5xl">
            Every age has its own adventure.
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-[#557276]">
            Children grow differently. Udaan gives each age group an
            experience designed around their stage of development.
          </p>

        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">

          {worlds.map((world) => (

            <article
              key={world.age}
              className={`group relative overflow-hidden rounded-[32px] ${world.background} p-7 transition duration-300 hover:-translate-y-2 hover:shadow-xl`}
            >

              {/* Decorative giant character */}
              <div className="absolute -right-8 -top-8 text-8xl opacity-20 transition duration-500 group-hover:rotate-12 group-hover:scale-110">
                {world.emoji}
              </div>

              <div className="relative">

                <div className="text-6xl transition duration-300 group-hover:scale-110">
                  {world.emoji}
                </div>

                <p className="mt-8 text-sm font-black uppercase tracking-[0.16em] text-[#557276]">
                  {world.age} years
                </p>

                <h3 className="mt-2 text-2xl font-black">
                  {world.title}
                </h3>

                <p className="mt-4 max-w-sm leading-7 text-[#557276]">
                  {world.description}
                </p>

                <Link
                  href={world.href}
                  className="mt-7 rounded-full bg-white px-5 py-3 text-sm font-black shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md active:scale-95"
                >
                  Explore →
                </Link>

              </div>

            </article>

          ))}

        </div>

      </div>

    </section>
  );
}