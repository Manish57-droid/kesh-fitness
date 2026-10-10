import { ArrowRight } from "lucide-react";
import { joinHref } from "@/lib/site";
import type { SiteContent } from "@/lib/content";

export default function JoinCTA({ c }: { c: SiteContent["joinCta"] }) {
  return (
    <section className="relative overflow-hidden bg-brand-red">
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: "repeating-linear-gradient(135deg, #000 0 2px, transparent 2px 18px)",
        }}
      />
      <div className="container-x relative flex flex-col items-start justify-between gap-8 py-16 md:flex-row md:items-center md:py-20">
        <div>
          <h2 className="font-display text-5xl leading-[0.95] tracking-wide md:text-7xl">
            {c.line1}
            <br />
            {c.line2}
          </h2>
          <p className="mt-4 max-w-md text-white/85">{c.text}</p>
        </div>
        <a
          href={joinHref}
          className="btn shrink-0 bg-neutral-950 text-white hover:bg-black"
        >
          {c.button} <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </section>
  );
}
