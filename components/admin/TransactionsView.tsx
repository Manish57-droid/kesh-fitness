"use client";
import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Banknote,
  CheckCircle2,
  Download,
  ExternalLink,
  Folder,
  Phone,
  RefreshCw,
  Search,
  Smartphone,
  XCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDay, formatIST } from "@/lib/format";
import { rupees } from "@/lib/site";
import type { Order, OrderStatus } from "@/lib/types";

type Filter = "all" | "verify" | "cash" | "upi_unpaid" | "paid" | "fees" | "shop" | "cancelled";
type View = { kind: "month"; key: string } | { kind: "attention" };

const FILTERS: { id: Filter; label: string; test: (o: Order) => boolean }[] = [
  { id: "all", label: "All", test: () => true },
  { id: "verify", label: "To verify", test: (o) => o.status === "verifying" },
  { id: "cash", label: "Cash due", test: (o) => o.status === "pending" && o.payment_method === "cash" },
  { id: "upi_unpaid", label: "UPI unpaid", test: (o) => o.status === "pending" && o.payment_method === "upi" },
  { id: "paid", label: "Paid", test: (o) => o.status === "paid" },
  { id: "fees", label: "Fees", test: (o) => o.kind === "bill" || o.kind === "membership" },
  { id: "shop", label: "Shop", test: (o) => !o.kind || o.kind === "product" },
  { id: "cancelled", label: "Cancelled", test: (o) => o.status === "cancelled" },
];

const STATUS: Record<OrderStatus, { label: (o: Order) => string; cls: string }> = {
  paid: { label: () => "Paid", cls: "bg-emerald-600 text-white" },
  verifying: { label: () => "Verify UTR", cls: "bg-amber-500 text-black" },
  pending: { label: (o) => (o.payment_method === "cash" ? "Cash due" : "UPI unpaid"), cls: "bg-brand-red text-white" },
  cancelled: { label: () => "Cancelled", cls: "bg-fg/15 text-fg" },
};

const POLL_MS = 30_000;
const needsAction = (o: Order) => o.status === "verifying" || (o.status === "pending" && o.payment_method === "cash");
const sumPaid = (list: Order[]) => list.filter((o) => o.status === "paid").reduce((n, o) => n + o.total, 0);

/** "2026-10" for a timestamp, in India time. */
const monthKey = (iso: string | Date) =>
  new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit" }).slice(0, 7);
const monthLabel = (key: string) => {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
};

export default function TransactionsView({ initial }: { initial: Order[] }) {
  const [orders, setOrders] = useState(initial);
  const [current] = useState(() => monthKey(new Date()));
  const [view, setView] = useState<View>({ kind: "month", key: monthKey(new Date()) });
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    const { data } = await createClient().from("orders").select("*").order("created_at", { ascending: false }).limit(5000);
    if (data) setOrders(data as Order[]);
    setRefreshing(false);
  }, []);

  // New orders show up without reloading the page.
  useEffect(() => {
    const id = setInterval(refresh, POLL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  // Group by month (newest first).
  const byMonth = new Map<string, Order[]>();
  for (const o of orders) {
    const key = monthKey(o.created_at);
    byMonth.set(key, [...(byMonth.get(key) ?? []), o]);
  }
  const pastMonths = Array.from(byMonth.keys()).filter((k) => k < current).sort().reverse();
  const attention = orders.filter(needsAction);

  const q = query.trim().toLowerCase();
  const searching = q.length > 0;
  const base = searching
    ? orders.filter(
        (o) =>
          o.receipt_no.toLowerCase().includes(q) ||
          o.customer_name.toLowerCase().includes(q) ||
          o.customer_phone.includes(q) ||
          o.product_name.toLowerCase().includes(q) ||
          o.utr?.toLowerCase().includes(q)
      )
    : view.kind === "attention"
      ? attention
      : byMonth.get(view.key) ?? [];
  const active = FILTERS.find((f) => f.id === filter)!;
  const shown = base.filter(active.test);

  const openMonth = (key: string) => {
    setView({ kind: "month", key });
    setFilter("all");
    setQuery("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const setStatus = async (o: Order, status: "paid" | "cancelled") => {
    if (status === "cancelled" && !confirm(`Cancel ${o.receipt_no}?`)) return;
    if (status === "paid" && o.payment_method === "upi" && !confirm(`Did you receive ${rupees(o.total)} with UTR ${o.utr ?? "(none)"} in Paytm?`)) return;
    setBusyId(o.id);
    setError("");
    const supabase = createClient();
    const { error } = await supabase.rpc("admin_set_order_status", { p_id: o.id, p_status: status });
    if (error) {
      setBusyId(null);
      return setError(error.message);
    }
    const { data } = await supabase.from("orders").select("*").eq("id", o.id).single();
    if (data) setOrders((list) => list.map((x) => (x.id === o.id ? (data as Order) : x)));
    setBusyId(null);
  };

  const exportCsv = () => {
    const header = ["Receipt", "Date", "Type", "Customer", "Phone", "Product", "Qty", "Unit price", "Subtotal", "Service", "Total", "Method", "Status", "UTR", "Paid at"];
    const rows = shown.map((o) => [
      o.receipt_no, formatIST(o.created_at), o.kind === "bill" ? "Monthly fee" : o.kind === "membership" ? "New member" : "Shop", o.customer_name, o.customer_phone, o.product_name, o.quantity,
      o.unit_price, o.subtotal, o.service_charge, o.total, o.payment_method, o.status, o.utr ?? "", o.paid_at ? formatIST(o.paid_at) : "",
    ]);
    const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const name = searching ? "search" : view.kind === "attention" ? "needs-action" : view.key;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `kesh-fitness-transactions-${name}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const viewingCurrent = view.kind === "month" && view.key === current;
  const title = searching
    ? `Search results`
    : view.kind === "attention"
      ? "Needs action (all months)"
      : viewingCurrent
        ? `This month · ${monthLabel(current)}`
        : monthLabel(view.key);

  const stats = [
    { label: "Collected", value: rupees(sumPaid(base)) },
    { label: "Orders", value: base.length },
    { label: "UPI to verify", value: base.filter((o) => o.status === "verifying").length, alert: true },
    { label: "Cash due", value: base.filter((o) => o.status === "pending" && o.payment_method === "cash").length, alert: true },
  ];

  return (
    <div>
      {/* Unpaid orders from any month */}
      {attention.length > 0 && view.kind !== "attention" && !searching && (
        <button
          onClick={() => {
            setView({ kind: "attention" });
            setFilter("all");
          }}
          className="mb-5 flex w-full items-center gap-3 border-l-4 border-amber-500 bg-amber-500/10 p-4 text-left transition hover:bg-amber-500/15"
        >
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
          <span className="flex-1 text-sm">
            <span className="font-semibold">{attention.length} order{attention.length === 1 ? "" : "s"} need action</span>
            <span className="block text-fg/70">UPI payments to verify or cash to collect, from any month. Tap to view.</span>
          </span>
        </button>
      )}

      {/* Header + back */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          {(!viewingCurrent || searching) && (
            <button
              onClick={() => openMonth(current)}
              className="mb-1 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-brand-muted hover:text-fg"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to this month
            </button>
          )}
          <h2 className="flex items-center gap-2 font-display text-3xl tracking-wide">
            {view.kind === "month" && !viewingCurrent && !searching && <Folder className="h-6 w-6 text-brand-red" />}
            {title}
          </h2>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1 sm:w-72 sm:flex-none">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
            <input className="input pl-9" placeholder="Search all months" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <button onClick={refresh} className="icon-btn shrink-0" aria-label="Refresh" title="Refresh">
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
          <button onClick={exportCsv} className="icon-btn shrink-0" aria-label="Download CSV" title="Download CSV of this view">
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card p-4">
            <p className={`font-display text-3xl leading-none sm:text-4xl ${s.alert && Number(s.value) > 0 ? "text-brand-red" : ""}`}>{s.value}</p>
            <p className="mt-1 text-[11px] uppercase tracking-wider text-brand-muted">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="-mx-4 mt-5 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`shrink-0 border px-3 py-2 text-xs font-semibold uppercase tracking-wider transition ${
              filter === f.id ? "border-brand-red text-brand-red" : "border-brand-line text-fg/60 hover:text-fg"
            }`}
          >
            {f.label} · {base.filter(f.test).length}
          </button>
        ))}
      </div>
      {error && <p className="mt-3 text-sm text-brand-red">{error}</p>}

      {shown.length === 0 ? (
        <p className="mt-6 border border-dashed border-brand-line px-4 py-12 text-center text-sm text-brand-muted">
          {viewingCurrent && !searching && base.length === 0 ? "No orders yet this month." : "No transactions here."}
        </p>
      ) : (
        <ul className="mt-4 grid gap-3 lg:grid-cols-2">
          {shown.map((o) => (
            <OrderCard
              key={o.id}
              order={o}
              busy={busyId === o.id}
              showMonth={searching || view.kind === "attention"}
              onStatus={(s) => setStatus(o, s)}
            />
          ))}
        </ul>
      )}

      {/* Folders for finished months */}
      {viewingCurrent && !searching && pastMonths.length > 0 && (
        <section className="mt-12">
          <h3 className="font-display text-2xl tracking-wide">Past months</h3>
          <p className="text-xs text-brand-muted">Receipts from finished months are kept here. Tap a folder to open it.</p>
          <ul className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {pastMonths.map((key) => {
              const list = byMonth.get(key)!;
              const open = list.filter(needsAction).length;
              return (
                <li key={key}>
                  <button
                    onClick={() => openMonth(key)}
                    className="group relative flex w-full flex-col items-start border border-brand-line bg-brand-card p-4 text-left transition hover:border-brand-red"
                  >
                    <Folder className="h-9 w-9 text-brand-red transition group-hover:scale-110" strokeWidth={1.5} fill="currentColor" fillOpacity={0.12} />
                    <p className="mt-3 font-semibold">{monthLabel(key)}</p>
                    <p className="text-xs text-brand-muted">
                      {list.length} receipt{list.length === 1 ? "" : "s"}
                    </p>
                    <p className="mt-1 font-display text-xl leading-none">{rupees(sumPaid(list))}</p>
                    {open > 0 && (
                      <span className="absolute right-3 top-3 bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-black">{open} open</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

function OrderCard({
  order: o,
  busy,
  showMonth,
  onStatus,
}: {
  order: Order;
  busy: boolean;
  showMonth: boolean;
  onStatus: (s: "paid" | "cancelled") => void;
}) {
  const s = STATUS[o.status];
  const open = o.status === "pending" || o.status === "verifying";
  return (
    <li className={`card flex flex-col p-4 sm:p-5 ${o.status === "verifying" ? "border-l-4 border-l-amber-500" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-sm font-semibold">{o.receipt_no}</p>
          <p className="text-[11px] text-brand-muted">
            {formatIST(o.created_at)}
            {showMonth && ` · ${monthLabel(monthKey(o.created_at))}`}
          </p>
        </div>
        <span className={`shrink-0 px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${s.cls}`}>{s.label(o)}</span>
      </div>

      <div className="mt-3 flex items-end justify-between gap-3">
        <div className="min-w-0 text-sm">
          <p className="flex items-center gap-2 font-semibold">
            {o.kind && o.kind !== "product" && (
              <span className="shrink-0 bg-brand-red/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-red">
                {o.kind === "membership" ? "New member" : "Monthly fee"}
              </span>
            )}
            <span className="truncate">{o.items?.length ? o.product_name : `${o.product_name} × ${o.quantity}`}</span>
          </p>
          {o.period_end && <p className="text-[11px] text-brand-muted">Next due {formatDay(o.period_end)}</p>}
          <p className="truncate text-fg/70">{o.customer_name}</p>
        </div>
        <div className="text-right">
          <p className="font-display text-3xl leading-none">{rupees(o.total)}</p>
          <p className="mt-1 flex items-center justify-end gap-1 text-[11px] uppercase tracking-wider text-brand-muted">
            {o.payment_method === "upi" ? <Smartphone className="h-3 w-3" /> : <Banknote className="h-3 w-3" />}
            {o.payment_method === "upi" ? "UPI" : "Cash"}
          </p>
        </div>
      </div>

      {o.utr && (
        <p className="mt-3 bg-fg/5 px-3 py-2 text-xs">
          UTR: <span className="select-all font-mono font-semibold">{o.utr}</span>
        </p>
      )}
      {o.paid_at && <p className="mt-2 text-[11px] text-brand-muted">Paid {formatIST(o.paid_at)}</p>}

      <div className="mt-4 flex flex-wrap gap-2 border-t border-brand-line pt-4">
        {open && (
          <button onClick={() => onStatus("paid")} disabled={busy} className="btn-primary btn-sm">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {o.payment_method === "cash" ? "Cash received" : "Confirm paid"}
          </button>
        )}
        <a href={`tel:${o.customer_phone.replace(/\s/g, "")}`} className="btn-ghost btn-sm">
          <Phone className="h-3.5 w-3.5" /> {o.customer_phone}
        </a>
        <a href={`/receipt/${o.token}`} target="_blank" rel="noreferrer" className="btn-ghost btn-sm">
          <ExternalLink className="h-3.5 w-3.5" /> Receipt
        </a>
        {o.status !== "cancelled" && (
          <button onClick={() => onStatus("cancelled")} disabled={busy} className="btn-ghost btn-sm text-brand-red">
            <XCircle className="h-3.5 w-3.5" /> Cancel
          </button>
        )}
      </div>
    </li>
  );
}
