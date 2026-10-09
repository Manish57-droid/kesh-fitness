import { ArrowRight } from "lucide-react";
import { joinHref } from "@/lib/site";

export default function JoinCTA() {
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
            Your First Workout
            <br />
            Starts Today.
          </h2>
          <p className="mt-4 max-w-md text-white/85">
            Drop by the gym or send us a message. We'll show you around and help you get started.
          </p>
        </div>
        <a
          href={joinHref}
          target="_blank"
          rel="noreferrer"
          className="btn shrink-0 bg-neutral-950 text-white hover:bg-black"
        >
          Join Kesh Fitness <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </section>
  );
}
