import { Clock, Instagram, MapPin, Phone } from "lucide-react";
import { site } from "@/lib/site";

export default function Visit() {
  const mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(site.mapQuery)}&z=15&output=embed`;
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(site.mapQuery)}`;

  return (
    <section id="visit" className="section bg-brand-ink">
      <div className="container-x">
        <p className="eyebrow">Find Us</p>
        <h2 className="heading mt-5">
          Come <span className="text-brand-red">Visit</span>
        </h2>

        <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
          <div className="flex flex-col gap-6">
            <div className="border border-brand-line bg-brand-black p-8">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-brand-red" />
                <h3 className="font-display text-3xl tracking-wide">Gym Timings</h3>
              </div>
              <ul className="mt-6 divide-y divide-brand-line">
                {site.hours.map((h) => (
                  <li key={h.days} className="flex justify-between gap-4 py-4 text-sm">
                    <span className="text-white/60">{h.days}</span>
                    <span className="text-right font-medium">
                      {h.slots.map((s) => (
                        <span key={s} className="block">{s}</span>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-5 border border-brand-line bg-brand-black p-8 text-sm">
              <p className="flex gap-3">
                <MapPin className="h-5 w-5 shrink-0 text-brand-red" />
                <span className="text-white/80">{site.address}</span>
              </p>
              {site.phone && (
                <a href={`tel:${site.phone.replace(/\s/g, "")}`} className="flex gap-3 hover:text-brand-red">
                  <Phone className="h-5 w-5 shrink-0 text-brand-red" /> {site.phone}
                </a>
              )}
              <a href={site.instagram} target="_blank" rel="noreferrer" className="flex gap-3 hover:text-brand-red">
                <Instagram className="h-5 w-5 shrink-0 text-brand-red" /> @{site.instagramHandle}
              </a>
              <a href={directions} target="_blank" rel="noreferrer" className="btn-primary w-full">
                Get Directions
              </a>
            </div>
          </div>

          <div className="min-h-[360px] overflow-hidden border border-brand-line">
            <iframe
              title="Kesh Fitness location"
              src={mapSrc}
              className="h-full min-h-[360px] w-full grayscale invert-[0.9] contrast-[0.9]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
