import { Instagram } from "lucide-react";
import Photo from "./Photo";
import { site } from "@/lib/site";

// Drop images named gallery-1.jpg … gallery-8.jpg into public/images/.
const images = Array.from({ length: 8 }, (_, i) => `/images/gallery-${i + 1}.jpg`);
// Make a few tiles larger for a mosaic layout.
const spans: Record<number, string> = { 0: "md:col-span-2 md:row-span-2", 5: "md:col-span-2" };

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

        <div className="mt-12 grid auto-rows-[160px] grid-cols-2 gap-3 md:auto-rows-[220px] md:grid-cols-4">
          {images.map((src, i) => (
            <a
              key={src}
              href={site.instagram}
              target="_blank"
              rel="noreferrer"
              className={`group relative overflow-hidden ${spans[i] ?? ""}`}
            >
              <Photo
                src={src}
                alt={`Kesh Fitness gallery photo ${i + 1}`}
                className="h-full w-full transition duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-brand-red/70 opacity-0 transition group-hover:opacity-100">
                <Instagram className="h-8 w-8" />
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
