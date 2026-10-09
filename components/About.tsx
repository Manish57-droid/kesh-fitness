import Photo from "./Photo";
import { site } from "@/lib/site";

export default function About() {
  return (
    <section id="about" className="section">
      <div className="container-x grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <div className="relative">
          <Photo src="/images/about.jpg" alt="Kesh at the Kesh Fitness gym opening" className="aspect-[4/5] w-full rounded-sm object-[50%_15%]" />
          <div className="absolute -bottom-6 -right-4 hidden bg-brand-red px-8 py-6 text-white sm:block">
            <p className="font-display text-6xl leading-none">110+</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-widest">Strong Community</p>
          </div>
        </div>

        <div>
          <p className="eyebrow">About the Gym</p>
          <h2 className="heading mt-5">
            More Than a Gym.
            <br />
            <span className="text-brand-red">A Team.</span>
          </h2>
          <p className="mt-6 text-fg/70">
            {site.name} is a unisex multi gym near Silli Stadium, built for people who want results
            without the fuss. We have the equipment, the energy and the coaching to get you there.
          </p>
          <p className="mt-4 text-fg/70">
            Train alongside {site.team}, a community that pushes each other every single day. Beginners
            get guidance on form and routine, and experienced lifters get the space to go heavy.
          </p>

          <dl className="mt-10 grid grid-cols-3 gap-4 border-t border-brand-line pt-8">
            {site.stats.map((s) => (
              <div key={s.label}>
                <dt className="font-display text-4xl text-fg md:text-5xl">{s.value}</dt>
                <dd className="mt-1 text-xs uppercase tracking-wider text-brand-muted">{s.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
