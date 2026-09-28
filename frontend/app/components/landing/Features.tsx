const features = [
  {
    icon: "🧠",
    title: "Learn",
    text: "Build early thinking and learning skills.",
  },
  {
    icon: "🎨",
    title: "Create",
    text: "Imagine, draw, explore and express.",
  },
  {
    icon: "🗣️",
    title: "Communicate",
    text: "Build language and communication skills.",
  },
  {
    icon: "🎮",
    title: "Play",
    text: "Learn naturally through playful activities.",
  },
  {
    icon: "🔊",
    title: "Listen",
    text: "Audio-supported experiences for young learners.",
  },
  {
    icon: "🌱",
    title: "Grow",
    text: "Support the whole child's development.",
  },
];

export default function Features() {
  return (
    <section
      id="features"
      className="mx-auto max-w-7xl px-6 py-20 sm:px-10 lg:px-12"
    >

      <div className="max-w-2xl">

        <p className="text-sm font-black uppercase tracking-[0.18em] text-[#D16F4E]">
          Explore
        </p>

        <h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
          Learning can feel like play.
        </h2>

        <p className="mt-5 text-lg leading-8 text-[#557276]">
          Every experience is designed to help children discover
          something new.
        </p>

      </div>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

        {features.map((feature) => (

          <div
            key={feature.title}
            className="group rounded-[28px] border border-[#17474B]/10 bg-white p-7 shadow-[0_12px_35px_rgba(23,71,75,0.06)] transition duration-300 hover:-translate-y-2 hover:shadow-[0_22px_45px_rgba(23,71,75,0.11)]"
          >

            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FFF0D2] text-3xl transition duration-300 group-hover:rotate-6 group-hover:scale-110">
              {feature.icon}
            </div>

            <h3 className="mt-6 text-xl font-black">
              {feature.title}
            </h3>

            <p className="mt-3 leading-7 text-[#557276]">
              {feature.text}
            </p>

          </div>

        ))}

      </div>

    </section>
  );
}