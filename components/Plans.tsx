import { BadgeIndianRupee, Check, Mail, Trophy } from "lucide-react";
import DumbbellArt from "./DumbbellArt";
import JoinPlanButton from "./features/JoinPlanButton";
import { rupees } from "@/lib/site";
import type { SiteContent } from "@/lib/content";

export default function Plans({ c, email }: { c: SiteContent["plans"]; email: string }) {
  const mailto = `mailto:${email}?subject=${encodeURIComponent(`${c.online.title} enquiry`)}&body=${encodeURIComponent(
    "Hi Kesh,\n\nI'm interested in online competition coaching.\n\nName:\nCompetition / date:\nCurrent weight & height:\n\nThanks!"
  )}`;

  return (
    <section id="plans" className="section bg-dumbbells relative overflow-hidden bg-brand-ink">
      <DumbbellArt className="absolute -left-20 top-1/3 hidden w-80 -rotate-[28deg] text-brand-red/15 2xl:block" />
      <DumbbellArt className="absolute -right-20 bottom-16 hidden w-80 rotate-[22deg] text-brand-red/15 2xl:block" />
      <div className="container-x relative">
        <div className="text-center">
          <p className="eyebrow justify-center">{c.eyebrow}</p>
          <h2 className="heading mt-5">
            {c.title} <span className="text-brand-red">{c.highlight}</span>
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-fg/60">{c.subtitle}</p>
        </div>

        <div className="mx-auto mt-10 grid max-w-6xl gap-5 sm:mt-14 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {c.items.map((p) => (
            <div
              key={p.id}
              className={`relative flex flex-col border p-6 transition sm:p-8 sm:hover:-translate-y-1 ${
                p.featured ? "border-brand-red bg-brand-red/[0.08]" : "border-brand-line bg-brand-black"
              }`}
            >
              {p.featured && (
                <span className="absolute -top-3 left-6 bg-brand-red px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white sm:left-8">
                  Most Popular
                </span>
              )}
              <h3 className="font-display text-3xl tracking-wide sm:text-4xl">{p.name}</h3>
              <p className="mt-3 flex items-end gap-1">
                <span className="font-display text-6xl leading-none sm:text-7xl">{rupees(p.monthly)}</span>
                <span className="pb-1.5 text-sm text-brand-muted">/ month</span>
              </p>
              <ul className="mt-6 flex-1 space-y-3">
                {p.perks.map((perk, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-fg/80">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-red" /> {perk}
                  </li>
                ))}
              </ul>
              {c.joiningFee > 0 && (
                <p className="mt-6 border-t border-brand-line pt-4 text-xs text-brand-muted">
                  First month: {rupees(p.monthly)} + {rupees(c.joiningFee)} joining fee ={" "}
                  <span className="font-semibold text-fg">{rupees(p.monthly + c.joiningFee)}</span>
                </p>
              )}
              <JoinPlanButton plan={p.id} className={`mt-4 ${p.featured ? "btn-primary" : "btn-ghost"}`}>
                Join with {p.name}
              </JoinPlanButton>
            </div>
          ))}
        </div>

        {c.joiningFee > 0 && (
          <div className="mx-auto mt-6 flex max-w-6xl items-center gap-4 border border-dashed border-brand-line p-4 sm:p-5">
            <BadgeIndianRupee className="h-8 w-8 shrink-0 text-brand-red" strokeWidth={1.5} />
            <p className="text-sm text-fg/80">
              <span className="font-semibold text-fg">One-time joining fee: {rupees(c.joiningFee)}</span>
              <span className="block text-brand-muted">Applies to every plan. Paid once when you join, then just your monthly fee.</span>
            </p>
          </div>
        )}

        {/* Online coaching: enquiries by email, not a gym membership */}
        {c.online.enabled && (
          <div className="relative mx-auto mt-10 max-w-6xl overflow-hidden border border-brand-red/60 bg-gradient-to-br from-brand-red/15 via-brand-card to-brand-card">
            <Trophy className="pointer-events-none absolute -right-6 -top-6 h-40 w-40 text-brand-red/10" strokeWidth={1} />
            <div className="relative grid gap-6 p-6 sm:p-8 md:grid-cols-[1.3fr_1fr] md:items-center">
              <div>
                <span className="inline-block bg-brand-red px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
                  Online · Competitions only
                </span>
                <h3 className="mt-4 font-display text-4xl tracking-wide sm:text-5xl">{c.online.title}</h3>
                <p className="mt-3 max-w-xl text-sm text-fg/75">{c.online.text}</p>
                <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                  {c.online.perks.map((perk, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-fg/80">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-red" /> {perk}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="border-t border-brand-line pt-6 md:border-l md:border-t-0 md:pl-8 md:pt-0">
                <p className="font-display text-6xl leading-none">{rupees(c.online.price)}</p>
                <p className="mt-1 text-sm text-brand-muted">for {c.online.duration}</p>
                {email ? (
                  <>
                    <a href={mailto} className="btn-primary mt-6 w-full">
                      <Mail className="h-4 w-4" /> Email the trainer
                    </a>
                    <p className="mt-2 break-all text-center text-xs text-brand-muted">{email}</p>
                  </>
                ) : (
                  <a href="#contact" className="btn-primary mt-6 w-full">
                    Ask for details
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
