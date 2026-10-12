"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Banknote, CheckCircle2, ClipboardList, Loader2, ShieldCheck, Smartphone, UserCheck } from "lucide-react";
import DumbbellArt from "../DumbbellArt";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { PLAN_EVENT } from "@/lib/events";
import { KEYS, readJSON, writeJSON } from "@/lib/storage";
import { MOBILE_ERROR, normalizeMobile } from "@/lib/validate";
import { useNow } from "@/lib/useNow";
import { formatIST, todayISO } from "@/lib/format";
import { rupees, type PlanId } from "@/lib/site";
import type { SiteContent } from "@/lib/content";
import type { PaymentMethod } from "@/lib/types";

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
  method: "upi" as PaymentMethod,
  /** Already trains at the gym: no fees, goes straight to the members list. */
  existing: false,
  joinedOn: "",
};

export type SavedJoin = { token: string; receiptNo: string };

type Props = { plans: SiteContent["plans"]; gymName: string };

/** Membership form → creates a join request and moves on to the payment page. */
export default function JoinForm({ plans, gymName }: Props) {
  const router = useRouter();
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [registered, setRegistered] = useState("");
  const now = useNow();

  // "Join with …" buttons in the Plans section pre-select a plan.
  useEffect(() => {
    const onPlan = (e: Event) => setForm((f) => ({ ...f, plan: (e as CustomEvent<PlanId>).detail, existing: false }));
    window.addEventListener(PLAN_EVENT, onPlan);
    return () => window.removeEventListener(PLAN_EVENT, onPlan);
  }, []);

  const set =
    (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm({ ...form, [k]: e.target.value });

  const plan = plans.items.find((p) => p.id === form.plan) ?? plans.items[0];
  const total = plan.monthly + plans.joiningFee;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const phone = normalizeMobile(form.phone);
    if (!phone) return setPhoneError(MOBILE_ERROR);
    if (!isSupabaseConfigured) {
      return setError("Online sign-up isn't available yet. Please visit the gym.");
    }
    setBusy(true);
    setError("");
    if (form.existing) return submitExisting(phone);
    const { data, error } = await createClient()
      .rpc("submit_join_request", {
        p_name: form.name,
        p_phone: phone,
        p_email: form.email,
        p_age: form.age ? Number(form.age) : null,
        p_gender: form.gender,
        p_plan: form.plan,
        p_timing: form.timing,
        p_goal: form.goal,
        p_area: form.area,
        p_notes: form.notes,
        p_method: form.method,
      })
      .single<{ receipt_no: string; token: string }>();

    if (error || !data) {
      setBusy(false);
      return setError(
        error?.code === "PGRST202"
          ? "Online sign-up isn't available yet. Please visit the gym."
          : error?.message ?? "Couldn't submit the form. Please try again."
      );
    }
    const saved = readJSON<SavedJoin[]>(KEYS.joins, []);
    writeJSON(KEYS.joins, [{ token: data.token, receiptNo: data.receipt_no }, ...saved].slice(0, 10));
    router.push(`/join/${data.token}`);
  };

  const submitExisting = async (phone: string) => {
    const { error } = await createClient().rpc("submit_existing_member", {
      p_name: form.name,
      p_phone: phone,
      p_email: form.email,
      p_age: form.age ? Number(form.age) : null,
      p_gender: form.gender,
      p_plan: form.plan,
      p_area: form.area,
      p_joined_on: form.joinedOn || null,
      p_notes: form.notes,
    });
    setBusy(false);
    if (error) {
      return setError(
        error.code === "PGRST202" ? "Online sign-up isn't available yet. Please visit the gym." : error.message || "Couldn't submit the form. Please try again."
      );
    }
    setRegistered(form.name.trim());
    setForm(empty);
  };

  const methodOption =(id: PaymentMethod, label: string, hint: string, Icon: typeof Smartphone) => (
    <label
      className={`flex cursor-pointer items-start gap-3 border p-3 transition ${
        form.method === id ? "border-brand-red bg-brand-red/[0.08]" : "border-brand-line hover:border-fg/40"
      }`}
    >
      <input type="radio" name="join-method" value={id} checked={form.method === id} onChange={set("method")} className="sr-only" />
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-brand-red" />
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        <span className="block text-xs text-brand-muted">{hint}</span>
      </span>
    </label>
  );

  return (
    <section id="join" className="section">
      <div className="container-x grid gap-10 lg:grid-cols-[1fr_1.3fr] lg:gap-16">
        <div>
          <p className="eyebrow">Membership Form</p>
          <h2 className="heading mt-5">
            Join Kesh <span className="text-brand-red">Fitness</span>
          </h2>
          <p className="mt-5 max-w-md text-fg/70">
            Fill in your details and pay the joining fee with your first month. Once we confirm your payment, you&apos;re a
            member.
          </p>
          <ol className="mt-6 space-y-2 text-sm text-fg/80">
            {["Fill the form", "Pay online (UPI) or cash at the gym", "We confirm and welcome you in"].map((step, i) => (
              <li key={step} className="flex items-center gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-red text-xs font-bold text-white">{i + 1}</span>
                {step}
              </li>
            ))}
          </ol>
          <div className="mt-8 space-y-3 text-sm">
            {plans.items.map((p) => (
              <p key={p.id} className="flex justify-between gap-4 border-b border-brand-line pb-3">
                <span className="text-fg/70">{p.name}</span>
                <span className="font-semibold">{rupees(p.monthly)} / month</span>
              </p>
            ))}
            <p className="flex justify-between gap-4">
              <span className="text-fg/70">Joining fee (one-time)</span>
              <span className="font-semibold">{rupees(plans.joiningFee)}</span>
            </p>
          </div>
          {plans.existingMembers && (
          <p className="mt-6 flex items-start gap-2 border-l-2 border-brand-red bg-fg/5 px-3 py-2 text-sm text-fg/80">
            <UserCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-red" />
            <span>
              Already training with us? Choose <span className="font-semibold">Already a member</span> in the form and fill in your
              details. There&apos;s nothing to pay.
            </span>
          </p>
          )}
          <DumbbellArt className="mt-16 hidden w-72 -rotate-[18deg] text-brand-red/20 lg:block" />
        </div>

        {registered ? (
          <div className="card flex flex-col items-center justify-center p-6 text-center sm:p-10">
            <CheckCircle2 className="h-12 w-12 text-emerald-500" strokeWidth={1.5} />
            <p className="mt-4 font-display text-3xl tracking-wide">You&apos;re on the list</p>
            <p className="mt-2 max-w-sm text-sm text-fg/70">
              Thanks, {registered}. Your details are saved with the {gymName} team. Keep paying your monthly fees at the gym as usual.
            </p>
            <button type="button" onClick={() => setRegistered("")} className="btn-ghost btn-sm mt-6">
              Fill another form
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
              <label htmlFor="j-phone" className="label">Mobile number *</label>
              <input
                id="j-phone"
                type="tel"
                inputMode="tel"
                className="input"
                value={form.phone}
                onChange={(e) => {
                  setForm({ ...form, phone: e.target.value });
                  setPhoneError("");
                }}
                onBlur={() => form.phone && setPhoneError(normalizeMobile(form.phone) ? "" : MOBILE_ERROR)}
                required
                maxLength={16}
                autoComplete="tel"
                placeholder="10-digit mobile"
                aria-invalid={!!phoneError}
              />
              {phoneError && <p className="mt-1 text-xs text-brand-red">{phoneError}</p>}
            </div>
            <div>
              <label htmlFor="j-email" className="label">Email (optional)</label>
              <input id="j-email" type="email" className="input" value={form.email} onChange={set("email")} maxLength={100} autoComplete="email" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="j-area" className="label">Address *</label>
              <input id="j-area" className="input" value={form.area} onChange={set("area")} required maxLength={120} autoComplete="street-address" placeholder="House, street, area" />
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
            <div className={`grid gap-2 ${plans.existingMembers ? "grid-cols-2" : "sm:grid-cols-3"}`}>
              {plans.items.map((p) => (
                <label
                  key={p.id}
                  className={`cursor-pointer border p-3 transition ${
                    !form.existing && form.plan === p.id ? "border-brand-red bg-brand-red/[0.08]" : "border-brand-line hover:border-fg/40"
                  }`}
                >
                  <input
                    type="radio"
                    name="plan"
                    value={p.id}
                    checked={!form.existing && form.plan === p.id}
                    onChange={() => setForm({ ...form, plan: p.id, existing: false })}
                    className="sr-only"
                  />
                  <span className="block text-sm font-semibold">{p.name}</span>
                  <span className="block text-xs text-brand-muted">{rupees(p.monthly)} / month</span>
                </label>
              ))}
              {plans.existingMembers && (
              <label
                className={`cursor-pointer border p-3 transition ${
                  form.existing ? "border-brand-red bg-brand-red/[0.08]" : "border-dashed border-brand-line hover:border-fg/40"
                }`}
              >
                <input type="radio" name="plan" value="existing" checked={form.existing} onChange={() => setForm({ ...form, existing: true })} className="sr-only" />
                <span className="flex items-center gap-1.5 text-sm font-semibold">
                  <UserCheck className="h-3.5 w-3.5 shrink-0 text-brand-red" /> Already a member
                </span>
                <span className="block text-xs text-brand-muted">No fees, just your details</span>
              </label>
              )}
            </div>
          </div>

          {form.existing && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="j-current-plan" className="label">Your current plan *</label>
                <select id="j-current-plan" className="input" value={form.plan} onChange={set("plan")} required>
                  {plans.items.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="j-joined-on" className="label">Member since</label>
                <input id="j-joined-on" type="date" className="input" value={form.joinedOn} onChange={set("joinedOn")} min="2000-01-01" max={todayISO()} />
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {!form.existing && (
              <>
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
              </>
            )}
            <div className="sm:col-span-2">
              <label htmlFor="j-notes" className="label">Health issues or anything we should know</label>
              <textarea id="j-notes" rows={2} className="input resize-y" value={form.notes} onChange={set("notes")} maxLength={500} />
            </div>
          </div>

          {form.existing ? (
            <p className="border border-brand-line bg-brand-black/40 p-4 text-sm text-fg/80">
              Nothing to pay now. You&apos;ll be added to the members list and keep paying your monthly fees at the gym as usual.
            </p>
          ) : (
          <>
          <div>
            <p className="label">How will you pay? *</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {methodOption("upi", "Pay online", "UPI: Paytm, PhonePe, GPay, BHIM", Smartphone)}
              {methodOption("cash", "Cash at gym", "Pay at the counter", Banknote)}
            </div>
          </div>

          <div className="space-y-2 border border-brand-line bg-brand-black/40 p-4 text-sm">
            <p className="flex justify-between gap-4 text-xs">
              <span className="text-brand-muted">Admission date</span>
              <span className="text-right">{now ? formatIST(now.toISOString()) : "…"}</span>
            </p>
            <p className="flex justify-between gap-4">
              <span className="text-fg/70">{plan.name} · first month</span>
              <span>{rupees(plan.monthly)}</span>
            </p>
            <p className="flex justify-between gap-4">
              <span className="text-fg/70">Joining fee (one-time)</span>
              <span>{rupees(plans.joiningFee)}</span>
            </p>
            <p className="flex items-baseline justify-between gap-4 border-t border-brand-line pt-2">
              <span className="font-semibold">Pay now</span>
              <span className="font-display text-3xl leading-none">{rupees(total)}</span>
            </p>
          </div>
          </>
          )}

          {error && <p className="text-sm text-brand-red">{error}</p>}
          <button type="submit" disabled={busy} className="btn-primary w-full">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {form.existing ? "Submit my details" : form.method === "upi" ? `Continue to pay ${rupees(total)}` : "Submit (pay cash at gym)"}
          </button>
          <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-brand-muted">
            <ShieldCheck className="h-3.5 w-3.5" /> Your details are only seen by the {gymName} team.
          </p>
        </form>
        )}
      </div>
    </section>
  );
}
