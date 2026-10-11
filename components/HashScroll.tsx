"use client";
import { useEffect } from "react";

const SETTLE_MS = 8000;

/**
 * When the page opens on a link like /#visit, sections above it (shop, messages) load their
 * data a moment later and push the target down. Keep the target in place whenever the page
 * changes height during the first few seconds, unless the visitor starts scrolling.
 */
export default function HashScroll() {
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!id) return;

    let done = false;
    const align = () => {
      if (!done) document.getElementById(id)?.scrollIntoView({ block: "start" });
    };
    const stop = () => {
      done = true;
      observer.disconnect();
    };

    const observer = new ResizeObserver(align);
    observer.observe(document.body);
    align();

    const opts = { passive: true } as const;
    window.addEventListener("wheel", stop, opts);
    window.addEventListener("touchmove", stop, opts);
    window.addEventListener("keydown", stop);
    const timer = setTimeout(stop, SETTLE_MS);

    return () => {
      stop();
      clearTimeout(timer);
      window.removeEventListener("wheel", stop);
      window.removeEventListener("touchmove", stop);
      window.removeEventListener("keydown", stop);
    };
  }, []);
  return null;
}
