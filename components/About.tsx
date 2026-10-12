import AboutSlideshow from "./AboutSlideshow";
import type { SiteContent } from "@/lib/content";

export default function About({ c }: { c: SiteContent["about"] }) {
  return (
    <section id="about" className="section">
      <div className="container-x grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <div className="relative">
          <AboutSlideshow images={[c.image, ...(c.images ?? [])].filter(Boolean)} alt="Kesh Fitness" className="aspect-[4/5] w-full rounded-sm object-[50%_15%]" />
          {c.badgeValue && (
            <div className="absolute -bottom-6 -right-4 hidden bg-brand-red px-8 py-6 text-white sm:block">
              <p className="font-display text-6xl leading-none">{c.badgeValue}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-widest">{c.badgeLabel}</p>
            </div>
          )}
        </div>

        <div>
          <p className="eyebrow">{c.eyebrow}</p>
          <h2 className="heading mt-5">
            {c.title}
            <br />
            <span className="text-brand-red">{c.highlight}</span>
          </h2>
          {c.paragraphs.map((p, i) => (
            <p key={i} className={`${i === 0 ? "mt-6" : "mt-4"} text-fg/70`}>
              {p}
            </p>
          ))}

          {c.stats.length > 0 && (
            <dl className="mt-10 grid grid-cols-3 gap-4 border-t border-brand-line pt-8">
              {c.stats.map((s, i) => (
                <div key={i}>
                  <dt className="font-display text-4xl text-fg md:text-5xl">{s.value}</dt>
                  <dd className="mt-1 text-xs uppercase tracking-wider text-brand-muted">{s.label}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>
    </section>
  );
}
