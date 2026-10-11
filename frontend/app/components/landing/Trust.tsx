import SectionHeading from "./SectionHeading";

const POINTS = [
  {
    icon: "📖",
    title: "Grounded in NCERT",
    text: "Every lesson is built from the text of NCERT school books. If the book doesn't say it, the lesson doesn't either.",
  },
  {
    icon: "🧑‍🏫",
    title: "Checked by a person",
    text: "A lesson is reviewed before it is shown to a child. Drafts stay hidden until someone approves them.",
  },
  {
    icon: "🔊",
    title: "Made to be heard",
    text: "Lessons are written as spoken words, short and warm, so they sound natural when Udi reads them.",
  },
];

export default function Trust() {
  return (
    <section id="about" className="mx-auto max-w-6xl px-5 pb-6 sm:px-8">
      <div className="overflow-hidden rounded-[2.5rem] bg-ink px-6 py-14 text-white shadow-[0_10px_0_rgba(43,33,71,0.18)] sm:px-12 sm:py-16">
        <SectionHeading eyebrow="What is UDAAN?" title="Real books, made friendly." tone="light">
          UDAAN turns what children study at school into short stories and games, told by a friend they&apos;ll want to listen to.
        </SectionHeading>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {POINTS.map((point) => (
            <div key={point.title} className="rounded-3xl bg-white/10 p-6 transition duration-300 hover:-translate-y-1 hover:bg-white/15">
              <span className="text-4xl" aria-hidden="true">
                {point.icon}
              </span>
              <h3 className="mt-4 font-display text-2xl font-extrabold">{point.title}</h3>
              <p className="mt-2 text-lg font-semibold leading-7 text-white/80">{point.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
