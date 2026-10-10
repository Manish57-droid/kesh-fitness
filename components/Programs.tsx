import { Dumbbell, Flame, HeartPulse, Trophy, UserCheck, Users } from "lucide-react";

const programs = [
  {
    icon: Dumbbell,
    title: "Strength Training",
    text: "Free weights, machines and compound lifts to build raw strength the right way.",
  },
  {
    icon: Flame,
    title: "Fat Loss",
    text: "High-energy workouts and practical diet guidance to burn fat and keep it off.",
  },
  {
    icon: Trophy,
    title: "Muscle Gain",
    text: "Structured hypertrophy splits and nutrition tips for steady, visible gains.",
  },
  {
    icon: HeartPulse,
    title: "Cardio & Conditioning",
    text: "Improve stamina, heart health and endurance with cardio and circuit training.",
  },
  {
    icon: UserCheck,
    title: "Personal Guidance",
    text: "One-on-one attention on form, routines and progress, ideal for beginners.",
  },
  {
    icon: Users,
    title: "Unisex Gym",
    text: "A safe, respectful space where men and women train side by side.",
  },
];

export default function Programs() {
  return (
    <section id="programs" className="section bg-dumbbells bg-brand-ink">
      <div className="container-x">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="eyebrow">What We Offer</p>
            <h2 className="heading mt-5">
              Programs Built
              <br />
              For <span className="text-brand-red">Results</span>
            </h2>
          </div>
          <p className="max-w-md text-fg/60">
            Whatever your goal, there's a plan for you. Talk to us and we'll help you pick the right
            starting point.
          </p>
        </div>

        <div className="mt-10 grid gap-px sm:mt-14 overflow-hidden border border-brand-line bg-brand-line sm:grid-cols-2 lg:grid-cols-3">
          {programs.map(({ icon: Icon, title, text }) => (
            <div key={title} className="group relative bg-brand-ink p-6 transition hover:bg-brand-card sm:p-8">
              <span className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-brand-red transition-transform duration-300 group-hover:scale-x-100" />
              <Icon className="h-9 w-9 text-brand-red" strokeWidth={1.5} />
              <h3 className="mt-6 font-display text-3xl tracking-wide">{title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-fg/60">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
