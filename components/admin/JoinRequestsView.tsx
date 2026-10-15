"use client";
import { useEffect, useState } from "react";
import { Banknote, CheckCircle2, ExternalLink, Mail, MessageCircle, Phone, Search, Smartphone, Trash2, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDate, formatIST, timeAgo } from "@/lib/format";
import { rupees } from "@/lib/site";
import type { PlanContent } from "@/lib/content";
import { whatsappLink } from "./MessagesView";
import type { JoinRequest, JoinStatus } from "@/lib/types";

type Filter = "all" | "verify" | "cash" | "upi_unpaid" | "joined" | "contacted" | "not_interested";

const FILTERS: { id: Filter; label: string; test: (r: JoinRequest) => boolean }[] = [
  { id: "all", label: "All", test: () => true },
  { id: "verify", label: "UPI to verify", test: (r) => r.payment_status === "verifying" },
  { id: "cash", label: "Cash due", test: (r) => r.payment_status === "pending" && r.payment_method !== "upi" },
  { id: "upi_unpaid", label: "UPI unpaid", test: (r) => r.payment_status === "pending" && r.payment_method === "upi" },
  { id: "joined", label: "Joined", test: (r) => r.status === "joined" },
  { id: "contacted", label: "Contacted", test: (r) => r.status === "contacted" },
  { id: "not_interested", label: "Not interested", test: (r) => r.status === "not_interested" },
];

// Follow-up labels the admin sets by hand. "Joined" is set by confirming the payment.
const manualStatuses: { id: JoinStatus; label: string; className: string }[] = [
  { id: "new", label: "New", className: "bg-brand-red text-white" },
  { id: "contacted", label: "Contacted", className: "bg-amber-500 text-black" },
  { id: "not_interested", label: "Not interested", className: "bg-fg/15 text-fg" },
];

const PAYMENT_BADGE = {
  paid: { label: "Paid", cls: "bg-emerald-600 text-white" },
  verifying: { label: "Verify UTR", cls: "bg-amber-500 text-black" },
  pending: { label: "Unpaid", cls: "bg-brand-red text-white" },
  cancelled: { label: "Payment cancelled", cls: "bg-fg/15 text-fg" },
};

type Props = {
  initial: JoinRequest[];
  plans: PlanContent[];
};

export default function JoinRequestsView({ initial, plans }: Props) {
  const [requests, setRequests] = useState(initial);

  // Fresh data from a background refresh (RefreshIfStale) replaces the list.
  useEffect(() => setRequests(initial), [initial]);
  const [filter, setFilter] = useState<Filter>(initial.some((r) => r.payment_status === "verifying") ? "verify" : "all");
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const q = query.trim().toLowerCase();
  const active = FILTERS.find((f) => f.id === filter)!;
  const shown = requests.filter(
    (r) =>
      active.test(r) &&
      (!q || r.name.toLowerCase().includes(q) || r.phone.includes(q) || r.area?.toLowerCase().includes(q) || r.receipt_no?.toLowerCase().includes(q))
  );

  const reload = async (id: number) => {
    const { data } = await createClient().from("join_requests").select("*").eq("id", id).single();
    if (data) setRequests((list) => list.map((r) => (r.id === id ? (data as JoinRequest) : r)));
  };

  const setStatus = async (id: number, status: JoinStatus) => {
    setError("");
    const { error } = await createClient().from("join_requests").update({ status }).eq("id", id);
    if (error) return setError(error.message);
    setRequests((list) => list.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  const confirmPayment = async (r: JoinRequest) => {
    const what = r.payment_method === "upi" ? `${rupees(r.amount ?? 0)} with UTR ${r.utr ?? "(none)"} in Paytm` : `${rupees(r.amount ?? 0)} in cash`;
    if (!confirm(`Did you receive ${what}?\n\n${r.name} will be marked Joined and added to Active Members.`)) return;
    setBusyId(r.id);
    setError("");
    const { error } = await createClient().rpc("admin_confirm_join_payment", { p_id: r.id });
    if (error) setError(error.message);
    else await reload(r.id);
    setBusyId(null);
  };

  const cancelPayment = async (r: JoinRequest) => {
    if (!confirm(`Cancel the payment for ${r.name}? The request stays so you can follow up.`)) return;
    setBusyId(r.id);
    setError("");
    const { error } = await createClient().rpc("admin_cancel_join_payment", { p_id: r.id });
    if (error) setError(error.message);
    else await reload(r.id);
    setBusyId(null);
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this join request?")) return;
    const { error } = await createClient().from("join_requests").delete().eq("id", id);
    if (error) return setError(error.message);
    setRequests((list) => list.filter((r) => r.id !== id));
  };

  return (
    <div>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`shrink-0 border px-3 py-2 text-xs font-semibold uppercase tracking-wider transition ${
                filter === f.id ? "border-brand-red text-brand-red" : "border-brand-line text-fg/60 hover:text-fg"
              }`}
            >
              {f.label} · {requests.filter(f.test).length}
            </button>
          ))}
        </div>
        <div className="relative sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
          <input className="input pl-9" placeholder="Search name, phone, area" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>
      {error && <p className="mt-3 text-sm text-brand-red">{error}</p>}

      {shown.length === 0 ? (
        <p className="mt-6 border border-dashed border-brand-line px-4 py-12 text-center text-sm text-brand-muted">No join requests here.</p>
      ) : (
        <ul className="mt-4 grid gap-3 lg:grid-cols-2">
          {shown.map((r) => {
            const plan = plans.find((p) => p.id === r.plan);
            const pay = PAYMENT_BADGE[r.payment_status ?? "pending"];
            const openPayment = r.payment_status === "pending" || r.payment_status === "verifying";
            const details = [
              ["Plan", plan ? `${plan.name} · ${rupees(plan.monthly)}/mo` : r.plan],
              ["Age", r.age],
              ["Gender", r.gender && r.gender[0].toUpperCase() + r.gender.slice(1)],
              ["Timing", r.timing && r.timing[0].toUpperCase() + r.timing.slice(1)],
              ["Goal", r.goal],
              ["Address", r.area],
            ].filter(([, v]) => v) as [string, string | number][];

            return (
              <li
                key={r.id}
                className={`card flex flex-col p-4 sm:p-5 ${
                  r.payment_status === "verifying" ? "border-l-4 border-l-amber-500" : r.status === "new" ? "border-l-4 border-l-brand-red" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 text-lg font-semibold">
                      <span className="truncate">{r.name}</span>
                      {r.status === "joined" && (
                        <span className="bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">Joined</span>
                      )}
                    </p>
                    <p className="text-[11px] uppercase tracking-wider text-brand-muted" suppressHydrationWarning>
                      {timeAgo(r.created_at)} · {formatDate(r.created_at)}
                    </p>
                  </div>
                  <button onClick={() => remove(r.id)} className="-mr-2 -mt-1 p-2 text-brand-muted transition hover:text-brand-red" aria-label={`Delete request from ${r.name}`}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  {details.map(([k, v]) => (
                    <div key={k} className="min-w-0">
                      <dt className="text-[11px] uppercase tracking-wider text-brand-muted">{k}</dt>
                      <dd className="truncate">{v}</dd>
                    </div>
                  ))}
                </dl>
                {r.notes && (
                  <p className="mt-3 whitespace-pre-line break-words border-l-2 border-amber-500 bg-fg/5 px-3 py-2 text-sm">{r.notes}</p>
                )}

                {/* Payment */}
                <div className="mt-4 border border-brand-line bg-brand-black/40 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="flex items-center gap-2 text-sm">
                      {r.payment_method === "upi" ? <Smartphone className="h-4 w-4 text-brand-red" /> : <Banknote className="h-4 w-4 text-brand-red" />}
                      <span className="font-display text-2xl leading-none">{r.amount ? rupees(r.amount) : "–"}</span>
                      <span className="text-xs text-brand-muted">{r.payment_method === "upi" ? "UPI" : r.payment_method === "cash" ? "Cash" : "Not chosen"}</span>
                    </p>
                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${pay.cls}`}>{pay.label}</span>
                  </div>
                  {r.utr && (
                    <p className="mt-2 text-xs">
                      UTR: <span className="select-all font-mono font-semibold">{r.utr}</span>
                    </p>
                  )}
                  {r.paid_at && <p className="mt-1 text-[11px] text-brand-muted">Paid {formatIST(r.paid_at)}</p>}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {openPayment && (
                      <button onClick={() => confirmPayment(r)} disabled={busyId === r.id} className="btn-primary btn-sm">
                        <CheckCircle2 className="h-3.5 w-3.5" /> {r.payment_method === "upi" ? "Confirm payment" : "Cash received"}
                      </button>
                    )}
                    {r.token && (
                      <a href={`/join/${r.token}`} target="_blank" rel="noreferrer" className="btn-ghost btn-sm">
                        <ExternalLink className="h-3.5 w-3.5" /> Receipt
                      </a>
                    )}
                    {openPayment && (
                      <button onClick={() => cancelPayment(r)} disabled={busyId === r.id} className="btn-ghost btn-sm text-brand-red">
                        <XCircle className="h-3.5 w-3.5" /> Cancel payment
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <a href={`tel:${r.phone.replace(/\s/g, "")}`} className="btn-ghost btn-sm">
                    <Phone className="h-3.5 w-3.5" /> {r.phone}
                  </a>
                  <a href={whatsappLink(r.phone)} target="_blank" rel="noreferrer" className="btn-ghost btn-sm">
                    <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                  </a>
                  {r.email && (
                    <a href={`mailto:${r.email}`} className="btn-ghost btn-sm">
                      <Mail className="h-3.5 w-3.5" /> Email
                    </a>
                  )}
                </div>

                {r.status !== "joined" && (
                  <div className="mt-4 grid grid-cols-3 gap-1.5 border-t border-brand-line pt-4">
                    {manualStatuses.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setStatus(r.id, s.id)}
                        aria-pressed={r.status === s.id}
                        className={`min-h-[40px] px-2 text-[11px] font-semibold uppercase tracking-wider transition ${
                          r.status === s.id ? s.className : "border border-brand-line text-fg/60 hover:text-fg"
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
