import { ArrowRight, MapPin } from "lucide-react";
import Photo from "./Photo";
import { joinHref, site } from "@/lib/site";

export default function Hero() {
  return (
    <section id="top" className="relative flex min-h-[min(100svh,1000px)] items-center overflow-hidden">
      {/* Full-bleed photo on phones; right-hand panel on large screens */}
      <div className="absolute inset-0 lg:left-auto lg:w-[52%]">
        <Photo
          src="/images/hero.jpg"
          alt="Kesh training biceps at Kesh Fitness"
          priority
          className="h-full w-full object-[60%_18%]"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-brand-black via-brand-black/80 to-brand-black/30 lg:bg-gradient-to-r lg:from-brand-black lg:via-brand-black/70 lg:to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-brand-black to-transparent" />
      <div className="absolute -right-32 top-1/4 h-96 w-96 rounded-full bg-brand-red/20 blur-[120px]" />

      <div className="container-x relative pb-12 pt-[38svh] lg:pb-16 lg:pt-28">
        <p className="eyebrow animate-fade-up">{site.tagline}</p>

        <h1 className="mt-6 animate-fade-up font-display text-[18vw] leading-[0.85] tracking-wide sm:text-8xl md:text-9xl lg:text-[10rem]">
          Train Hard.
          <br />
          <span className="text-brand-red">Stay Invincible.</span>
        </h1>

        <p className="mt-6 max-w-xl animate-fade-up text-base text-fg/70 md:text-lg">
          Your neighbourhood gym for real strength, fat loss and muscle gain, with coaching from{" "}
          {site.team}. Everyone is welcome, whether it's your first day or your hundredth.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a href={joinHref} className="btn-primary">
            Start Your Journey <ArrowRight className="h-4 w-4" />
          </a>
          <a href="#plans" className="btn-ghost">
            View Plans
          </a>
        </div>

        <p className="mt-10 flex items-center gap-2 text-sm text-fg/60">
          <MapPin className="h-4 w-4 text-brand-red" /> {site.address}
        </p>
      </div>
    </section>
  );
}
