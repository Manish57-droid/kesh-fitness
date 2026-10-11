"use client";
import { useEffect, useMemo, useState } from "react";
import { Banknote, CalendarClock, ExternalLink, Loader2, Minus, Plus, Search, Smartphone, X } from "lucide-react";
import Photo from "../Photo";
import { createClient } from "@/lib/supabase/client";
import { addMonths, formatDay, formatIST, todayISO } from "@/lib/format";
import { payment, rupees } from "@/lib/site";
import type { PlanContent } from "@/lib/content";
import type { Member, Order, PaymentMethod, Product } from "@/lib/types";

type Props = {
  member: Member;
  plans: PlanContent[];
  onClose: () => void;
  onSaved: (member: Member, receipt: { token: string; receiptNo: string }) => void;
};

/** Admin: renew a member's monthly fee (optionally with shop products) and record the payment. */
export default function BillDialog({ member, plans, onClose, onSaved }: Props) {
  const initialPlan = member.plan ?? "gym";
  const priceOf = (id: string) => plans.find((p) => p.id === id)?.monthly ?? 0;

  const [plan, setPlan] = useState<PlanContent["id"]>(initialPlan);
  const [monthlyFee, setMonthlyFee] = useState(priceOf(initialPlan));
  const [months, setMonths] = useState(1);
  const [joinedOn, setJoinedOn] = useState(member.joined_on);
  // Continue from the current due date so the cycle stays on the join day; new members start on their join date.
  const [periodStart, setPeriodStart] = useState(member.paid_until ?? member.joined_on);
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [utr, setUtr] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Record<number, number>>({});
  const [productQuery, setProductQuery] = useState("");
  const [history, setHistory] = useState<Order[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const supabase = createClient();
    supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => setProducts((data as Product[]) ?? []));
    supabase
      .from("orders")
      .select("*")
      .eq("member_id", member.id)
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data }) => setHistory((data as Order[]) ?? []));
    return () => {
      document.body.style.overflow = prev;
    };
  }, [member.id]);

  const dueDate = months > 0 && periodStart ? addMonths(periodStart, months) : null;
  const q = productQuery.trim().toLowerCase();
  const productList = q ? products.filter((p) => p.name.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q)) : products;
  const chosen = useMemo(() => products.filter((p) => (cart[p.id] ?? 0) > 0), [products, cart]);

  const feeTotal = months * monthlyFee;
  const productsTotal = chosen.reduce((n, p) => n + p.price * cart[p.id], 0);
  const service = chosen.length > 0 ? payment.serviceCharge : 0;
  const total = feeTotal + productsTotal + service;

  const changePlan = (id: PlanContent["id"]) => {
    setPlan(id);
    setMonthlyFee(priceOf(id));
  };

  // If billing has been following the join date, move it with the join date.
  const changeJoined = (value: string) => {
    if (!member.paid_until || periodStart === joinedOn) setPeriodStart(value);
    setJoinedOn(value);
  };

  const setQty = (id: number, qty: number) => setCart((c) => ({ ...c, [id]: Math.max(0, Math.min(50, qty)) }));

  const save = async () => {
    if (months === 0 && chosen.length === 0) return setError("Add at least one month or one product.");
    setBusy(true);
    setError("");
    const supabase = createClient();
    const { data, error } = await supabase
      .rpc("admin_create_bill", {
        p_member_id: member.id,
        p_plan: plan,
        p_monthly_fee: monthlyFee,
        p_months: months,
        p_period_start: months > 0 ? periodStart : null,
        p_joined_on: joinedOn || null,
        p_items: chosen.map((p) => ({ product_id: p.id, qty: cart[p.id] })),
        p_method: method,
        p_utr: method === "upi" ? utr : "",
      })
      .single<{ receipt_no: string; token: string }>();
    if (error || !data) {
      setBusy(false);
      return setError(
        error?.code === "PGRST202"
          ? "Billing isn't set up yet. Run supabase/migrations/009_member_billing.sql in the SQL Editor."
          : error?.message ?? "Couldn't save the bill."
      );
    }
    const { data: updated } = await supabase.from("members").select("*").eq("id", member.id).single();
    setBusy(false);
    onSaved((updated as Member) ?? member, { token: data.token, receiptNo: data.receipt_no });
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 sm:items-center sm:p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="flex max-h-[94svh] w-full flex-col border border-brand-line bg-brand-card sm:max-w-3xl">
        <div className="flex items-center justify-between border-b border-brand-line px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <h2 className="font-display text-2xl tracking-wide">Renew / Bill</h2>
            <p className="truncate text-xs text-brand-muted">
              {member.name} · {member.phone}
              {member.paid_until && ` · due ${formatDay(member.paid_until)}`}
            </p>
          </div>
          <button type="button" onClick={onClose} className="-mr-2 p-2 text-brand-muted hover:text-fg" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-4 sm:p-6">
          {/* Monthly fee */}
          <section className="space-y-4">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-red">Monthly fee</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {plans.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => changePlan(p.id)}
                  className={`border p-3 text-left transition ${plan === p.id ? "border-brand-red bg-brand-red/[0.08]" : "border-brand-line hover:border-fg/40"}`}
                >
                  <span className="block text-sm font-semibold">{p.name}</span>
                  <span className="block text-xs text-brand-muted">{rupees(p.monthly)} / month</span>
                </button>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="b-fee" className="label">Monthly fee (₹)</label>
                <input
                  id="b-fee"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  className="input"
                  value={monthlyFee}
                  onChange={(e) => setMonthlyFee(Math.max(0, Math.round(Number(e.target.value) || 0)))}
                />
                <p className="mt-1 text-xs text-brand-muted">Change it for this bill only. Default prices: Admin → Website → Plans.</p>
              </div>
              <div>
                <p className="label">Months</p>
                <div className="flex items-center gap-3">
                  <div className="inline-flex items-center border border-brand-line">
                    <button type="button" onClick={() => setMonths(Math.max(0, months - 1))} disabled={months === 0} className="flex h-11 w-11 items-center justify-center hover:bg-fg/5 disabled:opacity-30" aria-label="Fewer months">
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-10 text-center font-display text-2xl">{months}</span>
                    <button type="button" onClick={() => setMonths(Math.min(12, months + 1))} disabled={months === 12} className="flex h-11 w-11 items-center justify-center hover:bg-fg/5 disabled:opacity-30" aria-label="More months">
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <span className="text-xs text-brand-muted">{months === 0 ? "Products only" : `${rupees(feeTotal)}`}</span>
                </div>
              </div>
              <div>
                <label htmlFor="b-joined" className="label">Joined on</label>
                <input id="b-joined" type="date" className="input" value={joinedOn} onChange={(e) => changeJoined(e.target.value)} />
              </div>
              <div>
                <label htmlFor="b-start" className="label">Bill from</label>
                <div className="flex gap-2">
                  <input id="b-start" type="date" className="input" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} disabled={months === 0} />
                  <button type="button" onClick={() => setPeriodStart(todayISO())} disabled={months === 0} className="btn-ghost btn-sm shrink-0">
                    Today
                  </button>
                </div>
              </div>
            </div>
            {dueDate && (
              <p className="flex items-center gap-2 border-l-2 border-emerald-600 bg-emerald-600/10 px-3 py-2 text-sm">
                <CalendarClock className="h-4 w-4 shrink-0 text-emerald-500" />
                <span>
                  Covers {formatDay(periodStart)} to {formatDay(dueDate)}. <span className="font-semibold">Next due date: {formatDay(dueDate)}</span>
                </span>
              </p>
            )}
          </section>

          {/* Products */}
          <section className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-red">Add products (optional)</p>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
              <input className="input pl-9" placeholder="Search products" value={productQuery} onChange={(e) => setProductQuery(e.target.value)} />
            </div>
            <ul className="max-h-64 divide-y divide-brand-line overflow-y-auto border border-brand-line">
              {productList.length === 0 && <li className="p-4 text-center text-sm text-brand-muted">No products found.</li>}
              {productList.map((p) => {
                const qty = cart[p.id] ?? 0;
                return (
                  <li key={p.id} className={`flex items-center gap-3 p-2 ${qty ? "bg-brand-red/[0.06]" : ""}`}>
                    <Photo src={p.image_url ?? ""} alt={p.name} className="h-11 w-11 shrink-0 bg-white" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-brand-muted">{rupees(p.price)}</p>
                    </div>
                    <div className="flex shrink-0 items-center border border-brand-line">
                      <button type="button" onClick={() => setQty(p.id, qty - 1)} disabled={qty === 0} className="flex h-9 w-9 items-center justify-center hover:bg-fg/5 disabled:opacity-30" aria-label={`Remove one ${p.name}`}>
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-7 text-center text-sm font-semibold">{qty}</span>
                      <button type="button" onClick={() => setQty(p.id, qty + 1)} className="flex h-9 w-9 items-center justify-center hover:bg-fg/5" aria-label={`Add one ${p.name}`}>
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Payment */}
          <section className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-red">Payment received by</p>
            <div className="grid grid-cols-2 gap-2">
              {([
                ["cash", "Cash", Banknote],
                ["upi", "UPI", Smartphone],
              ] as const).map(([id, label, Icon]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setMethod(id)}
                  className={`flex items-center gap-2 border p-3 text-sm font-semibold transition ${method === id ? "border-brand-red bg-brand-red/[0.08]" : "border-brand-line hover:border-fg/40"}`}
                >
                  <Icon className="h-4 w-4 text-brand-red" /> {label}
                </button>
              ))}
            </div>
            {method === "upi" && (
              <div>
                <label htmlFor="b-utr" className="label">UTR (optional)</label>
                <input id="b-utr" className="input font-mono uppercase" value={utr} onChange={(e) => setUtr(e.target.value.replace(/\s/g, ""))} maxLength={22} placeholder="12-digit UPI reference" />
              </div>
            )}
          </section>

          {history.length > 0 && (
            <section>
              <p className="label">Recent payments</p>
              <ul className="divide-y divide-brand-line border border-brand-line text-sm">
                {history.map((o) => (
                  <li key={o.id} className="flex items-center justify-between gap-3 px-3 py-2">
                    <span className="min-w-0">
                      <span className="block truncate">{o.product_name}</span>
                      <span className="block text-[11px] text-brand-muted">
                        {o.receipt_no} · {formatIST(o.created_at)}
                        {o.status === "cancelled" && " · cancelled"}
                      </span>
                    </span>
                    <a href={`/receipt/${o.token}`} target="_blank" rel="noreferrer" className="flex shrink-0 items-center gap-1 text-xs text-brand-red hover:underline">
                      {rupees(o.total)} <ExternalLink className="h-3 w-3" />
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* Summary + save */}
        <div className="border-t border-brand-line p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:px-6 sm:pb-4">
          <dl className="space-y-1 text-sm">
            {months > 0 && (
              <div className="flex justify-between gap-4">
                <dt className="text-fg/70">
                  Monthly fee {rupees(monthlyFee)} × {months}
                </dt>
                <dd>{rupees(feeTotal)}</dd>
              </div>
            )}
            {chosen.length > 0 && (
              <>
                <div className="flex justify-between gap-4">
                  <dt className="text-fg/70">Products ({chosen.reduce((n, p) => n + cart[p.id], 0)})</dt>
                  <dd>{rupees(productsTotal)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-fg/70">Service charge</dt>
                  <dd>{rupees(service)}</dd>
                </div>
              </>
            )}
          </dl>
          {error && <p className="mt-2 text-sm text-brand-red">{error}</p>}
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="font-display text-3xl leading-none">{rupees(total)}</p>
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="btn-ghost btn-sm">
                Cancel
              </button>
              <button type="button" onClick={save} disabled={busy || total === 0 && months === 0} className="btn-primary btn-sm">
                {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Save &amp; mark paid
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
