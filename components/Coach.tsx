import { Instagram, Youtube } from "lucide-react";
import Photo from "./Photo";
import { site } from "@/lib/site";

export default function Coach() {
  return (
    <section id="coach" className="section relative overflow-hidden">
      <div className="pointer-events-none absolute -left-10 top-10 select-none font-display text-[22vw] leading-none text-fg/[0.03]">
        KESH
      </div>

      <div className="container-x relative grid items-start gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
        <div className="order-2 lg:order-1">
          <p className="eyebrow">Owner &amp; Head Coach</p>
          <h2 className="heading mt-5">
            Meet <span className="text-brand-red">Kesh</span>
          </h2>
          <p className="mt-6 text-fg/70">
            The founder of {site.name} and the force behind {site.team}. Kesh built this gym to give the
            Silli community a place to train seriously, with honest coaching, hard work and zero
            shortcuts.
          </p>
          <p className="mt-4 text-fg/70">
            From your first squat to your next personal record, you'll get guidance on technique,
            training splits and diet so every session counts.
          </p>

          {/* Kesh's own before/after */}
          <figure className="mt-8 overflow-hidden border border-brand-line bg-brand-card">
            <Photo
              src="/images/transformation.jpg"
              alt="Kesh's transformation: before and after"
              className="aspect-[781/672] w-full"
            />
            <figcaption className="flex items-center justify-between gap-3 px-4 py-3 text-xs font-semibold uppercase tracking-wider">
              <span className="text-brand-muted">Before</span>
              <span className="text-brand-red">Kesh&apos;s Transformation</span>
              <span className="text-brand-muted">After</span>
            </figcaption>
          </figure>

          <div className="mt-8 flex flex-wrap gap-3">
            <a href={site.ownerInstagram} target="_blank" rel="noreferrer" className="btn-primary">
              <Instagram className="h-4 w-4" /> @{site.ownerHandle}
            </a>
            <a href={site.youtube} target="_blank" rel="noreferrer" className="btn-ghost">
              <Youtube className="h-4 w-4" /> YouTube
            </a>
          </div>
        </div>

        <div className="relative order-1 mr-3 sm:mr-6 lg:sticky lg:top-28 lg:order-2">
          <div className="absolute -inset-2 translate-x-3 translate-y-3 border-2 border-brand-red sm:-inset-3 sm:translate-x-6 sm:translate-y-6" />
          <Photo src="/images/coach.jpg" alt="Kesh, owner and head coach" className="relative aspect-[4/5] w-full object-[50%_20%]" />
        </div>
      </div>
    </section>
  );
}
