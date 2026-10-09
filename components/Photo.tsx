"use client";
import { useEffect, useRef, useState } from "react";
import { Dumbbell } from "lucide-react";

type Props = {
  src: string;
  alt: string;
  className?: string;
  /** Load immediately (for the first image on screen). */
  priority?: boolean;
};

/** Image that falls back to a branded placeholder when the file is missing. */
export default function Photo({ src, alt, className = "", priority = false }: Props) {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);

  // The error event can fire before hydration, so check the loaded state too.
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) setFailed(true);
  }, []);

  if (failed || !src) {
    return (
      <div role="img" aria-label={alt} className={`photo-fallback ${className}`}>
        <Dumbbell className="h-10 w-10 text-brand-red/40" strokeWidth={1.5} />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      src={src}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
    />
  );
}
