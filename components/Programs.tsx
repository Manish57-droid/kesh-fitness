import ProgramIcon from "./ProgramIcon";
import type { SiteContent } from "@/lib/content";

export default function Programs({ c }: { c: SiteContent["programs"] }) {
  return (
    <section id="programs" className="section bg-dumbbells bg-brand-ink">
      <div className="container-x">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="eyebrow">{c.eyebrow}</p>
            <h2 className="heading mt-5">
              {c.title}
              <br />
              <span className="text-brand-red">{c.highlight}</span>
            </h2>
          </div>
          <p className="max-w-md text-fg/60">{c.text}</p>
        </div>

        <div className="mt-10 grid gap-px overflow-hidden border border-brand-line bg-brand-line sm:mt-14 sm:grid-cols-2 lg:grid-cols-3">
          {c.items.map((item, i) => (
            <div key={i} className="group relative bg-brand-ink p-6 transition hover:bg-brand-card sm:p-8">
              <span className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-brand-red transition-transform duration-300 group-hover:scale-x-100" />
              <ProgramIcon name={item.icon} className="h-9 w-9 text-brand-red" />
              <h3 className="mt-6 font-display text-3xl tracking-wide">{item.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-fg/60">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
