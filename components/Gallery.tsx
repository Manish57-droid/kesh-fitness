"use client";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Instagram, X } from "lucide-react";
import Photo from "./Photo";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

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
// Each copy of the photos must be wider than any screen, or a gap shows before it loops.
const MIN_TILES_PER_COPY = 10;
// After a swipe, the strip waits this long before drifting again.
const RESUME_AFTER_MS = 2500;

export default function Gallery({ instagramHandle }: { instagramHandle: string }) {
  const [slides, setSlides] = useState<Slide[]>(fallback);
  const [open, setOpen] = useState<Slide | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const resumeAt = useRef(0);
  const hovering = useRef(false);
  const openRef = useRef(false);
  openRef.current = open !== null;

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

  // The strip is a normal horizontal scroller, so phones can swipe and fling it. It holds three
  // identical copies of the photos and stays in the middle one: drifting or swiping past either
  // end jumps back by exactly one copy, which shows the same pictures, so it loops forever both ways.
  // Short lists are repeated to fill a copy.
  const repeats = Math.max(1, Math.ceil(MIN_TILES_PER_COPY / Math.max(slides.length, 1)));
  const copy = Array.from({ length: repeats }, () => slides).flat();
  const track = [...copy, ...copy, ...copy];

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const copyWidth = () => el.scrollWidth / 3;
    // Float position, because browsers round scrollLeft and a slow drift would stall.
    let pos = copyWidth();
    el.scrollLeft = pos;

    const pause = () => {
      resumeAt.current = performance.now() + RESUME_AFTER_MS;
    };
    // Scrolls that didn't come from the drift are the visitor's (including a fling still moving).
    const onScroll = () => {
      if (Math.abs(el.scrollLeft - pos) > 2) pause();
    };

    let visible = true;
    const observer = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting));
    observer.observe(el);

    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const seconds = Math.min(now - last, 100) / 1000;
      last = now;
      const width = copyWidth();
      const drifting = visible && !reduceMotion && !hovering.current && !openRef.current && now >= resumeAt.current;
      if (drifting) {
        pos += (width / copy.length / SECONDS_PER_SLIDE) * seconds;
        el.scrollLeft = pos;
      } else {
        pos = el.scrollLeft;
      }
      if (pos < width * 0.5 || pos >= width * 1.5) {
        pos += pos < width * 0.5 ? width : -width;
        el.scrollLeft = pos;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    const opts = { passive: true };
    el.addEventListener("scroll", onScroll, opts);
    el.addEventListener("touchstart", pause, opts);
    el.addEventListener("touchmove", pause, opts);
    el.addEventListener("wheel", pause, opts);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      el.removeEventListener("scroll", onScroll);
      el.removeEventListener("touchstart", pause);
      el.removeEventListener("touchmove", pause);
      el.removeEventListener("wheel", pause);
    };
  }, [copy.length]);

  const step = (dir: -1 | 1) => {
    const el = scroller.current;
    if (!el) return;
    resumeAt.current = performance.now() + RESUME_AFTER_MS;
    el.scrollBy({ left: (dir * el.scrollWidth) / track.length, behavior: "smooth" });
  };

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
          <a href={`https://www.instagram.com/${instagramHandle}/`} target="_blank" rel="noreferrer" className="btn-ghost self-start md:self-auto">
            <Instagram className="h-4 w-4" /> @{instagramHandle}
          </a>
        </div>
      </div>

      <div
        className="relative mt-10 md:mt-12"
        onPointerEnter={(e) => e.pointerType === "mouse" && (hovering.current = true)}
        onPointerLeave={() => (hovering.current = false)}
      >
        {/* soft fade at both edges */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-brand-black to-transparent sm:w-24" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-brand-black to-transparent sm:w-24" />

        {/* Arrows for mouse users; phones swipe. */}
        {([
          [-1, "left-2 sm:left-4", ChevronLeft, "Previous photos"],
          [1, "right-2 sm:right-4", ChevronRight, "Next photos"],
        ] as const).map(([dir, pos, Icon, label]) => (
          <button
            key={dir}
            type="button"
            onClick={() => step(dir)}
            className={`absolute top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur transition hover:bg-brand-red [@media(hover:hover)]:flex ${pos}`}
            aria-label={label}
          >
            <Icon className="h-6 w-6" />
          </button>
        ))}

        <div ref={scroller} className="overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <ul className="flex w-max">
            {track.map((s, i) => (
              <li key={`${s.src}-${i}`} aria-hidden={i >= slides.length} className="pr-3 sm:pr-4">
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
