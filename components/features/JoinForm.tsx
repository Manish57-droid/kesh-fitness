"use client";
import { useEffect, useState } from "react";
import { CheckCircle2, ClipboardList, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { pricing, rupees, site, type PlanId } from "@/lib/site";
import DumbbellArt from "../DumbbellArt";
import { PLAN_EVENT } from "@/lib/events";

const goals = ["Muscle gain", "Fat loss", "Strength", "General fitness", "Competition prep"];

const empty = {
  name: "",
  phone: "",
  email: "",
  age: "",
  gender: "",
  plan: "cardio" as PlanId,
  timing: "",
  goal: "",
  area: "",
  notes: "",
};

export default function JoinForm() {
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  // "Join with …" buttons in the Plans section pre-select a plan.
  useEffect(() => {
    const onPlan = (e: Event) => setForm((f) => ({ ...f, plan: (e as CustomEvent<PlanId>).detail }));
    window.addEventListener(PLAN_EVENT, onPlan);
    return () => window.removeEventListener(PLAN_EVENT, onPlan);
  }, []);

  const set =
    (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm({ ...form, [k]: e.target.value });

  const plan = pricing.plans.find((p) => p.id === form.plan) ?? pricing.plans[0];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      return setError("Online sign-up isn't set up yet. Please visit the gym or message us on Instagram.");
    }
    setBusy(true);
    setError("");
    const { error } = await createClient()
      .from("join_requests")
      .insert({
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || null,
        age: form.age ? Number(form.age) : null,
        gender: form.gender || null,
        plan: form.plan,
        timing: form.timing || null,
        goal: form.goal || null,
        area: form.area.trim() || null,
        notes: form.notes.trim() || null,
      });
    setBusy(false);
    if (error) return setError("Couldn't submit the form. Please check your details and try again.");
    setDone(true);
    setForm(empty);
  };

  return (
    <section id="join" className="section">
      <div className="container-x grid gap-10 lg:grid-cols-[1fr_1.3fr] lg:gap-16">
        <div>
          <p className="eyebrow">Membership Form</p>
          <h2 className="heading mt-5">
            Join Kesh <span className="text-brand-red">Fitness</span>
          </h2>
          <p className="mt-5 max-w-md text-fg/70">
            Fill in your details and our team will call you to confirm your membership and your first day.
          </p>
          <div className="mt-8 space-y-3 text-sm">
            {pricing.plans.map((p) => (
              <p key={p.id} className="flex justify-between gap-4 border-b border-brand-line pb-3">
                <span className="text-fg/70">{p.name}</span>
                <span className="font-semibold">{rupees(p.monthly)} / month</span>
              </p>
            ))}
            <p className="flex justify-between gap-4">
              <span className="text-fg/70">Joining fee (one-time)</span>
              <span className="font-semibold">{rupees(pricing.joiningFee)}</span>
            </p>
          </div>
          <DumbbellArt className="mt-16 hidden w-72 -rotate-[18deg] text-brand-red/20 lg:block" />
        </div>

        {done ? (
          <div className="card flex flex-col items-center justify-center p-8 text-center sm:p-12">
            <CheckCircle2 className="h-14 w-14 text-emerald-500" strokeWidth={1.5} />
            <h3 className="mt-5 font-display text-4xl tracking-wide">You&apos;re In!</h3>
            <p className="mt-2 max-w-sm text-sm text-fg/70">
              Thanks for joining {site.team}. We&apos;ll call you soon to confirm. See you at the gym!
            </p>
            <button onClick={() => setDone(false)} className="btn-ghost btn-sm mt-6">
              Submit another form
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="card space-y-4 p-4 sm:p-6">
            <div className="flex items-center gap-3 border-b border-brand-line pb-4">
              <ClipboardList className="h-5 w-5 text-brand-red" />
              <p className="font-display text-2xl tracking-wide">Your Details</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="j-name" className="label">Full name *</label>
                <input id="j-name" className="input" value={form.name} onChange={set("name")} required maxLength={60} autoComplete="name" />
              </div>
              <div>
                <label htmlFor="j-phone" className="label">Phone number *</label>
                <input
                  id="j-phone"
                  type="tel"
                  inputMode="tel"
                  className="input"
                  value={form.phone}
                  onChange={set("phone")}
                  required
                  pattern="[0-9+\s\-]{10,15}"
                  title="Enter a valid phone number"
                  maxLength={15}
                  autoComplete="tel"
                  placeholder="10-digit mobile"
                />
              </div>
              <div>
                <label htmlFor="j-email" className="label">Email (optional)</label>
                <input id="j-email" type="email" className="input" value={form.email} onChange={set("email")} maxLength={100} autoComplete="email" />
              </div>
              <div>
                <label htmlFor="j-age" className="label">Age</label>
                <input id="j-age" type="number" inputMode="numeric" min={10} max={90} className="input" value={form.age} onChange={set("age")} />
              </div>
              <div>
                <label htmlFor="j-gender" className="label">Gender</label>
                <select id="j-gender" className="input" value={form.gender} onChange={set("gender")}>
                  <option value="">Prefer not to say</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <p className="label">Plan *</p>
              <div className="grid grid-cols-2 gap-2">
                {pricing.plans.map((p) => (
                  <label
                    key={p.id}
                    className={`cursor-pointer border p-3 transition ${
                      form.plan === p.id ? "border-brand-red bg-brand-red/[0.08]" : "border-brand-line hover:border-fg/40"
                    }`}
                  >
                    <input
                      type="radio"
                      name="plan"
                      value={p.id}
                      checked={form.plan === p.id}
                      onChange={set("plan")}
                      className="sr-only"
                    />
                    <span className="block text-sm font-semibold">{p.name}</span>
                    <span className="block text-xs text-brand-muted">{rupees(p.monthly)} / month</span>
                  </label>
                ))}
              </div>
              <p className="mt-2 text-xs text-brand-muted">
                First month total: <span className="font-semibold text-fg">{rupees(plan.monthly + pricing.joiningFee)}</span>{" "}
                (incl. {rupees(pricing.joiningFee)} joining fee)
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="j-timing" className="label">Preferred timing</label>
                <select id="j-timing" className="input" value={form.timing} onChange={set("timing")}>
                  <option value="">Any time</option>
                  <option value="morning">Morning</option>
                  <option value="evening">Evening</option>
                </select>
              </div>
              <div>
                <label htmlFor="j-goal" className="label">Fitness goal</label>
                <select id="j-goal" className="input" value={form.goal} onChange={set("goal")}>
                  <option value="">Select a goal</option>
                  {goals.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="j-area" className="label">Address / area</label>
                <input id="j-area" className="input" value={form.area} onChange={set("area")} maxLength={120} autoComplete="street-address" placeholder="e.g. Silli Bazar" />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="j-notes" className="label">Health issues or anything we should know</label>
                <textarea id="j-notes" rows={3} className="input resize-y" value={form.notes} onChange={set("notes")} maxLength={500} />
              </div>
            </div>

            {error && <p className="text-sm text-brand-red">{error}</p>}
            <button type="submit" disabled={busy} className="btn-primary w-full">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Submit &amp; Join
            </button>
            <p className="text-center text-[11px] text-brand-muted">
              Your details are only seen by the {site.name} team.
            </p>
          </form>
        )}
      </div>
    </section>
  );
}
