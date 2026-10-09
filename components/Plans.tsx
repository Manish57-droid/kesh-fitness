import { Check } from "lucide-react";
import { joinHref } from "@/lib/site";

// TODO: add real prices (e.g. price: "₹800") once confirmed.
const plans = [
  { name: "Monthly", duration: "1 Month", perks: ["Full gym access", "Cardio & weights", "Form guidance"] },
  {
    name: "Quarterly",
    duration: "3 Months",
    perks: ["Full gym access", "Workout plan", "Diet guidance", "Progress check-ins"],
    featured: true,
  },
  { name: "Half-Yearly", duration: "6 Months", perks: ["Full gym access", "Workout plan", "Diet guidance"] },
  { name: "Yearly", duration: "12 Months", perks: ["Full gym access", "Workout plan", "Diet guidance", "Best value"] },
];

export default function Plans() {
  return (
    <section id="plans" className="section bg-brand-ink">
      <div className="container-x">
        <div className="text-center">
          <p className="eyebrow justify-center">Membership</p>
          <h2 className="heading mt-5">
            Pick Your <span className="text-brand-red">Plan</span>
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-white/60">
            Simple plans with no hidden fees. Message us for current prices and offers.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`relative flex flex-col border p-8 transition hover:-translate-y-1 ${
                p.featured ? "border-brand-red bg-brand-red/[0.08]" : "border-brand-line bg-brand-black"
              }`}
            >
              {p.featured && (
                <span className="absolute -top-3 left-8 bg-brand-red px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
                  Most Popular
                </span>
              )}
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-muted">{p.duration}</p>
              <h3 className="mt-2 font-display text-4xl tracking-wide">{p.name}</h3>
              <ul className="mt-6 flex-1 space-y-3">
                {p.perks.map((perk) => (
                  <li key={perk} className="flex items-center gap-3 text-sm text-white/70">
                    <Check className="h-4 w-4 shrink-0 text-brand-red" /> {perk}
                  </li>
                ))}
              </ul>
              <a
                href={joinHref}
                target="_blank"
                rel="noreferrer"
                className={`mt-8 ${p.featured ? "btn-primary" : "btn-ghost"}`}
              >
                Ask for Price
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
