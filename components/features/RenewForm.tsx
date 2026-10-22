"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Banknote, CalendarClock, Loader2, Minus, Plus, Search, Smartphone } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { KEYS, readJSON, writeJSON } from "@/lib/storage";
import { addMonths, formatDay, pendingMonths, todayISO } from "@/lib/format";
import { rupees } from "@/lib/site";
import type { PaymentMethod } from "@/lib/types";
import type { SavedOrder } from "../shop/Checkout";

type Info = {
  first_name: string;
  plan: string;
  plan_name: string;
  monthly_fee: number;
  paid_until: string | null;
  period_start: string;
  has_open_bill: boolean;
};

/** Website: a member renews their monthly fee by mobile number, then pays on the receipt page. */
export default function RenewForm() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [info, setInfo] = useState<Info | null>(null);
  const [months, setMonths] = useState(1);
  const [method, setMethod] = useState<PaymentMethod>("upi");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Same number the shop checkout remembers.
  useEffect(() => {
    const saved = readJSON<{ phone?: string }>(KEYS.customer, {});
    if (saved.phone) setPhone(saved.phone);
  }, []);

  const notReady = (code?: string) =>
    code === "PGRST202" ? "Online renewal isn't available yet. Please pay at the gym counter." : null;

  const lookUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) return setError("Online renewal isn't available yet. Please pay at the gym counter.");
    setBusy(true);
    setError("");
    const { data, error } = await createClient().rpc("get_renewal_info", { p_phone: phone }).single<Info>();
    setBusy(false);
    if (error || !data) return setError(notReady(error?.code) ?? error?.message ?? "Couldn't find your membership.");
    const pending = data.paid_until ? pendingMonths(data.paid_until, todayISO(), 12) : 0;
    setMonths(Math.max(1, pending));
    setInfo(data);
  };

  const submit = async () => {
    if (!info) return;
    setBusy(true);
    setError("");
    const { data, error } = await createClient()
      .rpc("create_renewal", { p_phone: phone, p_months: months, p_method: method })
      .single<{ receipt_no: string; token: string }>();
    if (error || !data) {
      setBusy(false);
      return setError(notReady(error?.code) ?? error?.message ?? "Couldn't create the bill. Please try again.");
    }
    const orders = readJSON<SavedOrder[]>(KEYS.orders, []);
    writeJSON(KEYS.orders, [{ token: data.token, receiptNo: data.receipt_no }, ...orders].slice(0, 30));
    router.push(`/receipt/${data.token}`);
  };

  if (!info) {
    return (
      <form onSubmit={lookUp} className="card mx-auto max-w-md space-y-4 p-5 sm:p-6">
        <div>
          <label htmlFor="r-phone" className="label">Your mobile number</label>
          <input
            id="r-phone"
            className="input"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="The number you gave the gym"
            required
          />
        </div>
        {error && <p className="text-sm text-brand-red">{error}</p>}
        <button type="submit" disabled={busy} className="btn-primary w-full">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Find my membership
        </button>
        <p className="text-xs text-brand-muted">New to the gym? Use the join form on the home page instead.</p>
      </form>
    );
  }

  const pending = info.paid_until ? pendingMonths(info.paid_until, todayISO(), 12) : 0;
  const dueDate = addMonths(info.period_start, months);
  const total = info.monthly_fee * months;

  const option = (id: PaymentMethod, label: string, hint: string, Icon: typeof Smartphone) => (
    <button
      type="button"
      onClick={() => setMethod(id)}
      className={`flex items-start gap-3 border p-4 text-left transition ${method === id ? "border-brand-red bg-brand-red/[0.08]" : "border-brand-line hover:border-fg/40"}`}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-brand-red" />
      <span>
        <span className="block font-semibold">{label}</span>
        <span className="mt-0.5 block text-xs text-brand-muted">{hint}</span>
      </span>
    </button>
  );

  return (
    <div className="card mx-auto max-w-xl space-y-6 p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-3xl tracking-wide">Hi {info.first_name}!</p>
          <p className="text-sm text-brand-muted">
            {info.plan_name} · {rupees(info.monthly_fee)} / month
            {info.paid_until && ` · due ${formatDay(info.paid_until)}`}
          </p>
        </div>
        <button type="button" onClick={() => (setInfo(null), setError(""))} className="btn-ghost btn-sm shrink-0">
          Not you?
        </button>
      </div>

      {info.has_open_bill && (
        <p className="flex items-start gap-2 border-l-4 border-amber-500 bg-amber-500/10 p-3 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          Your last payment is still being checked by the gym. You can renew again once it&apos;s confirmed.
        </p>
      )}
      {pending > 0 && !info.has_open_bill && (
        <p className="flex items-start gap-2 border-l-4 border-brand-red bg-brand-red/10 p-3 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-brand-red" />
          {pending} month{pending === 1 ? "" : "s"} pending since {formatDay(info.paid_until!)}.
        </p>
      )}

      <div>
        <p className="label">Months</p>
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center border border-brand-line">
            <button type="button" onClick={() => setMonths(Math.max(1, months - 1))} disabled={months === 1} className="flex h-11 w-11 items-center justify-center hover:bg-fg/5 disabled:opacity-30" aria-label="Fewer months">
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-10 text-center font-display text-2xl">{months}</span>
            <button type="button" onClick={() => setMonths(Math.min(12, months + 1))} disabled={months === 12} className="flex h-11 w-11 items-center justify-center hover:bg-fg/5 disabled:opacity-30" aria-label="More months">
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <span className="text-sm text-brand-muted">
            {rupees(info.monthly_fee)} × {months}
          </span>
        </div>
      </div>

      <p className="flex items-center gap-2 border-l-2 border-emerald-600 bg-emerald-600/10 px-3 py-2 text-sm">
        <CalendarClock className="h-4 w-4 shrink-0 text-emerald-500" />
        <span>
          Covers {formatDay(info.period_start)} to {formatDay(dueDate)}. <span className="font-semibold">Next due date: {formatDay(dueDate)}</span>
        </span>
      </p>

      <div className="grid gap-2 sm:grid-cols-2">
        {option("upi", "Pay by UPI", "Scan the QR or open your UPI app on the next page.", Smartphone)}
        {option("cash", "Cash at the counter", "Get a bill now and pay at the gym.", Banknote)}
      </div>

      {error && <p className="text-sm text-brand-red">{error}</p>}

      <div className="flex items-center justify-between gap-3 border-t border-brand-line pt-4">
        <p className="font-display text-4xl leading-none">{rupees(total)}</p>
        <button type="button" onClick={submit} disabled={busy || info.has_open_bill} className="btn-primary">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {method === "upi" ? "Continue to pay" : "Get my bill"}
        </button>
      </div>
      <p className="text-xs text-brand-muted">Your due date is updated once the gym confirms your payment.</p>
    </div>
  );
}
