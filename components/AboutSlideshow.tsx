"use client";
import { useEffect, useState } from "react";
import Photo from "./Photo";

const SECONDS_PER_PHOTO = 3;

/** About-section photo. With more than one photo it cross-fades to the next every few seconds, in a loop. */
export default function AboutSlideshow({ images, alt, className = "" }: { images: string[]; alt: string; className?: string }) {
  const [index, setIndex] = useState(0);
  // Photos are only downloaded once their turn is next, so the page doesn't load them all up front.
  const [loaded, setLoaded] = useState(2);

  useEffect(() => {
    if (images.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % images.length), SECONDS_PER_PHOTO * 1000);
    return () => clearInterval(id);
  }, [images.length]);

  useEffect(() => setLoaded((n) => Math.max(n, index + 2)), [index]);

  if (images.length < 2) return <Photo src={images[0] ?? ""} alt={alt} className={className} />;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {images.slice(0, loaded).map((src, i) => (
        <Photo
          key={`${i}-${src}`}
          src={src}
          alt={i === index ? alt : ""}
          className={`absolute inset-0 h-full w-full object-[50%_15%] transition-opacity duration-1000 motion-reduce:transition-none ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
      <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5" aria-hidden>
        {images.map((_, i) => (
          <span key={i} className={`h-1.5 rounded-full bg-white shadow transition-all ${i === index ? "w-5" : "w-1.5 opacity-60"}`} />
        ))}
      </div>
    </div>
  );
}
