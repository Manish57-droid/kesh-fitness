"use client";
import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Banknote,
  CheckCircle2,
  Download,
  ExternalLink,
  FileText,
  Folder,
  Phone,
  RefreshCw,
  Search,
  Smartphone,
  XCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { KEEP_MONTHS, formatDay, formatIST, keepFromMonth, monthKey, monthLabel, shiftMonth } from "@/lib/format";
import { rupees } from "@/lib/site";
import type { Order, OrderStatus } from "@/lib/types";

type Filter = "all" | "verify" | "cash" | "upi_unpaid" | "paid" | "fees" | "shop" | "cancelled";
type View = { kind: "month"; key: string } | { kind: "attention" } | { kind: "all" };

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
  // The oldest kept month is deleted when the next month starts; remind the admin to download it.
  const oldest = keepFromMonth(current);
  const oldestCount = byMonth.get(oldest)?.length ?? 0;

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
      : view.kind === "all"
        ? orders
        : byMonth.get(view.key) ?? [];
  const allMonths = Array.from(byMonth.keys()).sort().reverse();
  const showMonthTable = view.kind === "all" && !searching;
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
    const name = searching ? "search" : view.kind === "month" ? view.key : view.kind === "all" ? "all-months" : "needs-action";
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
      : view.kind === "all"
        ? "All months"
        : viewingCurrent
        ? `This month · ${monthLabel(current)}`
        : monthLabel((view as { key: string }).key);

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

      {/* Oldest month is about to be deleted */}
      {oldestCount > 0 && !searching && (
        <div className="mb-5 flex flex-wrap items-center gap-3 border-l-4 border-brand-red bg-brand-red/10 p-4 text-sm">
          <AlertTriangle className="h-5 w-5 shrink-0 text-brand-red" />
          <span className="min-w-0 flex-1">
            <span className="font-semibold">
              {monthLabel(oldest)} ({oldestCount} receipt{oldestCount === 1 ? "" : "s"}) will be deleted on 1 {monthLabel(shiftMonth(current, 1))}.
            </span>
            <span className="block text-fg/70">Transactions are kept for {KEEP_MONTHS} months. Download its report first if you need it.</span>
          </span>
          <a href={`/admin/transactions/report?month=${oldest}`} className="btn-primary btn-sm shrink-0">
            <FileText className="h-4 w-4" /> Report for {monthLabel(oldest)}
          </a>
        </div>
      )}

      {/* This month / All months */}
      <div className="mb-5 inline-flex border border-brand-line">
        {([
          ["month", "This month"],
          ["all", "All months"],
        ] as const).map(([id, label]) => {
          const on = id === "all" ? view.kind === "all" : viewingCurrent;
          return (
            <button
              key={id}
              onClick={() => (id === "all" ? (setView({ kind: "all" }), setFilter("all"), setQuery("")) : openMonth(current))}
              className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider transition ${on ? "bg-brand-red text-white" : "text-fg/60 hover:text-fg"}`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Header + back */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          {(!viewingCurrent || searching) && view.kind !== "all" && (
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
          <a
            href={`/admin/transactions/report?month=${view.kind === "month" ? view.key : current}`}
            className="btn-primary btn-sm shrink-0"
            title="Monthly report: download as PDF or Excel"
          >
            <FileText className="h-4 w-4" /> <span className="hidden sm:inline">Monthly report</span><span className="sm:hidden">Report</span>
          </a>
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

      {showMonthTable ? (
        <MonthTable months={allMonths} byMonth={byMonth} current={current} onOpen={openMonth} />
      ) : (
        <>
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
        </>
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

/** Month-by-month summary (newest first). Tap a month to open its transactions. */
function MonthTable({
  months,
  byMonth,
  current,
  onOpen,
}: {
  months: string[];
  byMonth: Map<string, Order[]>;
  current: string;
  onOpen: (key: string) => void;
}) {
  if (months.length === 0) {
    return <p className="mt-6 border border-dashed border-brand-line px-4 py-12 text-center text-sm text-brand-muted">No transactions yet.</p>;
  }
  const isFee = (o: Order) => o.kind === "bill" || o.kind === "membership";
  const rows = months.map((key) => {
    const list = byMonth.get(key) ?? [];
    const paid = list.filter((o) => o.status === "paid");
    return {
      key,
      receipts: list.length,
      fees: paid.filter(isFee).reduce((n, o) => n + o.total, 0),
      shop: paid.filter((o) => !isFee(o)).reduce((n, o) => n + o.total, 0),
      collected: paid.reduce((n, o) => n + o.total, 0),
      open: list.filter(needsAction).length,
    };
  });
  const totals = rows.reduce((t, r) => ({ receipts: t.receipts + r.receipts, fees: t.fees + r.fees, shop: t.shop + r.shop, collected: t.collected + r.collected }), {
    receipts: 0,
    fees: 0,
    shop: 0,
    collected: 0,
  });

  return (
    <>
      {/* Phones: one card per month */}
      <ul className="mt-5 space-y-2 sm:hidden">
        {rows.map((r) => (
          <li key={r.key}>
            <button onClick={() => onOpen(r.key)} className="card flex w-full items-center gap-3 p-4 text-left">
              <Folder className="h-8 w-8 shrink-0 text-brand-red" strokeWidth={1.5} />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-1.5 font-semibold">
                  {monthLabel(r.key)}
                  {r.key === current && <span className="bg-brand-red px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">Now</span>}
                  {r.open > 0 && <span className="bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-black">{r.open} open</span>}
                </span>
                <span className="block text-xs text-brand-muted">
                  {r.receipts} receipt{r.receipts === 1 ? "" : "s"} · Fees {rupees(r.fees)} · Shop {rupees(r.shop)}
                </span>
              </span>
              <span className="font-display text-2xl leading-none">{rupees(r.collected)}</span>
            </button>
          </li>
        ))}
        <li className="flex items-center justify-between border-t-2 border-brand-line px-4 pt-3 text-sm font-semibold">
          <span>Total · {totals.receipts} receipts</span>
          <span className="font-display text-2xl">{rupees(totals.collected)}</span>
        </li>
      </ul>

      {/* Tablets and up: table */}
    <div className="mt-5 hidden overflow-x-auto border border-brand-line sm:block">
      <table className="w-full text-left text-sm">
        <thead className="bg-brand-card text-[11px] uppercase tracking-wider text-brand-muted">
          <tr>
            <th className="px-4 py-3 font-semibold">Month</th>
            <th className="px-4 py-3 text-right font-semibold">Receipts</th>
            <th className="px-4 py-3 text-right font-semibold">Fees</th>
            <th className="px-4 py-3 text-right font-semibold">Shop</th>
            <th className="px-4 py-3 text-right font-semibold">Collected</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-brand-line">
          {rows.map((r) => (
            <tr key={r.key} onClick={() => onOpen(r.key)} className="cursor-pointer transition hover:bg-fg/[0.04]">
              <td className="px-4 py-3">
                <span className="flex items-center gap-2 font-semibold">
                  <Folder className="h-4 w-4 text-brand-red" />
                  {monthLabel(r.key)}
                  {r.key === current && <span className="bg-brand-red px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">Now</span>}
                  {r.open > 0 && <span className="bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-black">{r.open} open</span>}
                </span>
              </td>
              <td className="px-4 py-3 text-right">{r.receipts}</td>
              <td className="px-4 py-3 text-right">{rupees(r.fees)}</td>
              <td className="px-4 py-3 text-right">{rupees(r.shop)}</td>
              <td className="px-4 py-3 text-right font-display text-xl">{rupees(r.collected)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="border-t-2 border-brand-line bg-brand-card text-sm font-semibold">
          <tr>
            <td className="px-4 py-3">Total</td>
            <td className="px-4 py-3 text-right">{totals.receipts}</td>
            <td className="px-4 py-3 text-right">{rupees(totals.fees)}</td>
            <td className="px-4 py-3 text-right">{rupees(totals.shop)}</td>
            <td className="px-4 py-3 text-right font-display text-xl">{rupees(totals.collected)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
    </>
  );
}
