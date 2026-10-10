"use client";
import { useEffect, useState } from "react";
import { Instagram, X } from "lucide-react";
import Photo from "./Photo";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { site } from "@/lib/site";

type Slide = { src: string; caption: string | null };

// Shown until the admin-managed gallery (migration 004) is set up.
const fallback: Slide[] = [
  { src: "/images/gallery-1.jpg", caption: "On the rocks" },
  { src: "/images/gallery-2.jpg", caption: "All smiles" },
  { src: "/images/gallery-3.jpg", caption: "By the river" },
  { src: "/images/gallery-4.jpg", caption: "Peak bicep" },
  { src: "/images/gallery-5.jpg", caption: "Competition day" },
  { src: "/images/gallery-6.jpg", caption: "Backstage" },
];

const SECONDS_PER_SLIDE = 5;

export default function Gallery() {
  const [slides, setSlides] = useState<Slide[]>(fallback);
  const [open, setOpen] = useState<Slide | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    createClient()
      .from("gallery_photos")
      .select("image_url, caption")
      .eq("is_active", true)
      .order("sort_order")
      .order("id")
      .then(({ data, error }) => {
        if (!error && data?.length) setSlides(data.map((d) => ({ src: d.image_url, caption: d.caption })));
      });
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Two copies side by side; the track slides left by one copy and loops seamlessly.
  const track = [...slides, ...slides];

  return (
    <section id="gallery" className="section overflow-hidden">
      <div className="container-x">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="eyebrow">Inside the Gym</p>
            <h2 className="heading mt-5">
              The <span className="text-brand-red">Grind</span>
            </h2>
          </div>
          <a href={site.instagram} target="_blank" rel="noreferrer" className="btn-ghost self-start md:self-auto">
            <Instagram className="h-4 w-4" /> @{site.instagramHandle}
          </a>
        </div>
      </div>

      <div className="group relative mt-10 md:mt-12">
        {/* soft fade at both edges */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-brand-black to-transparent sm:w-24" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-brand-black to-transparent sm:w-24" />

        <div className="motion-reduce:overflow-x-auto">
          <ul
            className="flex w-max animate-marquee gap-3 group-hover:[animation-play-state:paused] motion-reduce:animate-none sm:gap-4"
            style={{ animationDuration: `${slides.length * SECONDS_PER_SLIDE}s` }}
          >
            {track.map((s, i) => (
              <li key={`${s.src}-${i}`} aria-hidden={i >= slides.length}>
                <button
                  onClick={() => setOpen(s)}
                  className="group/slide relative block w-56 overflow-hidden sm:w-72"
                  tabIndex={i >= slides.length ? -1 : 0}
                  aria-label={s.caption ? `Open photo: ${s.caption}` : "Open photo"}
                >
                  <Photo
                    src={s.src}
                    alt={s.caption ?? "Kesh Fitness gallery photo"}
                    className="aspect-[4/5] w-full object-top transition duration-500 group-hover/slide:scale-105"
                  />
                  {s.caption && (
                    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 pb-3 pt-10 text-left text-xs font-semibold uppercase tracking-wider text-white">
                      {s.caption}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 p-4" onClick={() => setOpen(null)} role="dialog" aria-modal="true">
          <button className="absolute right-4 top-4 p-2 text-white/80 hover:text-white" aria-label="Close" onClick={() => setOpen(null)}>
            <X className="h-7 w-7" />
          </button>
          <figure className="max-h-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={open.src} alt={open.caption ?? "Gallery photo"} className="max-h-[80svh] w-auto object-contain" />
            {open.caption && <figcaption className="mt-3 text-center text-sm text-white/80">{open.caption}</figcaption>}
          </figure>
        </div>
      )}
    </section>
  );
}
