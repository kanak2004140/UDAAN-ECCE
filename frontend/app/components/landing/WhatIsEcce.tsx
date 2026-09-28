export default function WhatIsEcce() {
  return (
    <section
      id="about"
      className="mx-auto max-w-7xl px-6 py-20 sm:px-10 lg:px-12"
    >

      <div className="grid gap-10 overflow-hidden rounded-[32px] bg-[#17474B] p-8 text-white shadow-xl sm:p-12 lg:grid-cols-[.9fr_1.1fr] lg:p-16">

        <div>

          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#F5BD42]">
            What is Udaan?
          </p>

          <h2 className="mt-5 text-4xl font-black leading-tight sm:text-5xl">
            A happy place for children to learn.
          </h2>

        </div>

        <div>

          <p className="text-lg leading-8 text-[#D9ECE5]">
            Udaan brings learning, play and discovery together in one
            simple experience designed for young children and their
            families.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">

            {[
              ["❤️", "Care"],
              ["📚", "Learn"],
              ["🎮", "Play"],
              ["🌱", "Grow"],
            ].map(([icon, label]) => (

              <div
                key={label}
                className="rounded-2xl bg-white/10 p-4 text-center transition duration-300 hover:-translate-y-1 hover:bg-white/15"
              >

                <div className="text-2xl">
                  {icon}
                </div>

                <p className="mt-2 text-sm font-bold">
                  {label}
                </p>

              </div>

            ))}

          </div>

        </div>

      </div>

    </section>
  );
}