import { Instagram } from "lucide-react";
import Photo from "./Photo";
import { site } from "@/lib/site";

// Photos live in public/images. `pos` keeps faces in frame when cropped.
const images = [
  { src: "/images/gallery-1.jpg", alt: "Kesh posing on the rocks", pos: "object-[50%_20%]" },
  { src: "/images/gallery-2.jpg", alt: "Kesh smiling outdoors", pos: "object-top" },
  { src: "/images/gallery-3.jpg", alt: "Kesh by the river", pos: "object-[50%_25%]" },
  { src: "/images/gallery-4.jpg", alt: "Kesh flexing biceps", pos: "object-top" },
  { src: "/images/gallery-5.jpg", alt: "Kesh hitting a double biceps pose at a competition", pos: "object-top" },
  { src: "/images/gallery-6.jpg", alt: "Kesh backstage at a bodybuilding competition", pos: "object-top" },
];

export default function Gallery() {
  return (
    <section id="gallery" className="section">
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

        <div className="mt-10 grid grid-cols-2 gap-2 sm:gap-3 md:mt-12 md:grid-cols-3">
          {images.map(({ src, alt, pos }) => (
            <a
              key={src}
              href={site.instagram}
              target="_blank"
              rel="noreferrer"
              className="group relative aspect-[4/5] overflow-hidden"
            >
              <Photo
                src={src}
                alt={alt}
                className={`h-full w-full transition duration-500 group-hover:scale-105 ${pos}`}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-brand-red/70 text-white opacity-0 transition group-hover:opacity-100">
                <Instagram className="h-8 w-8" />
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
