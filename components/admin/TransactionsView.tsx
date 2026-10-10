"use client";
import { useCallback, useEffect, useState } from "react";
import { Banknote, CheckCircle2, Download, ExternalLink, Phone, RefreshCw, Search, Smartphone, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatIST } from "@/lib/format";
import { rupees } from "@/lib/site";
import type { Order, OrderStatus } from "@/lib/types";

type Filter = "all" | "verify" | "cash" | "upi_unpaid" | "paid" | "cancelled";

const FILTERS: { id: Filter; label: string; test: (o: Order) => boolean }[] = [
  { id: "all", label: "All", test: () => true },
  { id: "verify", label: "To verify", test: (o) => o.status === "verifying" },
  { id: "cash", label: "Cash due", test: (o) => o.status === "pending" && o.payment_method === "cash" },
  { id: "upi_unpaid", label: "UPI unpaid", test: (o) => o.status === "pending" && o.payment_method === "upi" },
  { id: "paid", label: "Paid", test: (o) => o.status === "paid" },
  { id: "cancelled", label: "Cancelled", test: (o) => o.status === "cancelled" },
];

const STATUS: Record<OrderStatus, { label: (o: Order) => string; cls: string }> = {
  paid: { label: () => "Paid", cls: "bg-emerald-600 text-white" },
  verifying: { label: () => "Verify UTR", cls: "bg-amber-500 text-black" },
  pending: { label: (o) => (o.payment_method === "cash" ? "Cash due" : "UPI unpaid"), cls: "bg-brand-red text-white" },
  cancelled: { label: () => "Cancelled", cls: "bg-fg/15 text-fg" },
};

const POLL_MS = 30_000;

/** Today's date in India as YYYY-MM-DD, for "today's sales". */
const istDay = (iso: string) => new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

export default function TransactionsView({ initial }: { initial: Order[] }) {
  const [orders, setOrders] = useState(initial);
  const [filter, setFilter] = useState<Filter>(initial.some((o) => o.status === "verifying") ? "verify" : "all");
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [today, setToday] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    const { data } = await createClient().from("orders").select("*").order("created_at", { ascending: false }).limit(500);
    if (data) setOrders(data as Order[]);
    setRefreshing(false);
  }, []);

  // New orders show up without reloading the page.
  useEffect(() => {
    setToday(istDay(new Date().toISOString()));
    const id = setInterval(refresh, POLL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  const paid = orders.filter((o) => o.status === "paid");
  const stats = [
    { label: "Today's sales", value: rupees(paid.filter((o) => today && o.paid_at && istDay(o.paid_at) === today).reduce((n, o) => n + o.total, 0)) },
    { label: "UPI to verify", value: orders.filter((o) => o.status === "verifying").length, alert: true },
    { label: "Cash due", value: orders.filter((o) => o.status === "pending" && o.payment_method === "cash").length, alert: true },
    { label: "Total collected", value: rupees(paid.reduce((n, o) => n + o.total, 0)) },
  ];

  const q = query.trim().toLowerCase();
  const active = FILTERS.find((f) => f.id === filter)!;
  const shown = orders.filter(
    (o) =>
      active.test(o) &&
      (!q ||
        o.receipt_no.toLowerCase().includes(q) ||
        o.customer_name.toLowerCase().includes(q) ||
        o.customer_phone.includes(q) ||
        o.product_name.toLowerCase().includes(q) ||
        o.utr?.toLowerCase().includes(q))
  );

  const setStatus = async (o: Order, status: "paid" | "cancelled") => {
    if (status === "cancelled" && !confirm(`Cancel ${o.receipt_no}? The stock (${o.quantity}) goes back to the product.`)) return;
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
    const header = ["Receipt", "Date", "Customer", "Phone", "Product", "Qty", "Unit price", "Subtotal", "Service", "Total", "Method", "Status", "UTR", "Paid at"];
    const rows = shown.map((o) => [
      o.receipt_no, formatIST(o.created_at), o.customer_name, o.customer_phone, o.product_name, o.quantity,
      o.unit_price, o.subtotal, o.service_charge, o.total, o.payment_method, o.status, o.utr ?? "", o.paid_at ? formatIST(o.paid_at) : "",
    ]);
    const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `kesh-fitness-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card p-4">
            <p className={`font-display text-3xl leading-none sm:text-4xl ${s.alert && Number(s.value) > 0 ? "text-brand-red" : ""}`}>{s.value}</p>
            <p className="mt-1 text-[11px] uppercase tracking-wider text-brand-muted">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`shrink-0 border px-3 py-2 text-xs font-semibold uppercase tracking-wider transition ${
                filter === f.id ? "border-brand-red text-brand-red" : "border-brand-line text-fg/60 hover:text-fg"
              }`}
            >
              {f.label} · {orders.filter(f.test).length}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1 sm:w-72 sm:flex-none">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
            <input className="input pl-9" placeholder="Receipt, name, phone, UTR" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <button onClick={refresh} className="icon-btn shrink-0" aria-label="Refresh" title="Refresh">
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
          <button onClick={exportCsv} className="icon-btn shrink-0" aria-label="Download CSV" title="Download CSV">
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>
      {error && <p className="mt-3 text-sm text-brand-red">{error}</p>}

      {shown.length === 0 ? (
        <p className="mt-6 border border-dashed border-brand-line px-4 py-12 text-center text-sm text-brand-muted">No transactions here.</p>
      ) : (
        <ul className="mt-4 grid gap-3 lg:grid-cols-2">
          {shown.map((o) => {
            const s = STATUS[o.status];
            const open = o.status === "pending" || o.status === "verifying";
            return (
              <li key={o.id} className={`card flex flex-col p-4 sm:p-5 ${o.status === "verifying" ? "border-l-4 border-l-amber-500" : ""}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-semibold">{o.receipt_no}</p>
                    <p className="text-[11px] text-brand-muted">{formatIST(o.created_at)}</p>
                  </div>
                  <span className={`shrink-0 px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${s.cls}`}>{s.label(o)}</span>
                </div>

                <div className="mt-3 flex items-end justify-between gap-3">
                  <div className="min-w-0 text-sm">
                    <p className="truncate font-semibold">{o.product_name} × {o.quantity}</p>
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
                    <button onClick={() => setStatus(o, "paid")} disabled={busyId === o.id} className="btn-primary btn-sm">
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
                    <button onClick={() => setStatus(o, "cancelled")} disabled={busyId === o.id} className="btn-ghost btn-sm text-brand-red">
                      <XCircle className="h-3.5 w-3.5" /> Cancel
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
