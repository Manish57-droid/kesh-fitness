"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileSpreadsheet, Printer } from "lucide-react";
import { KEEP_MONTHS, formatIST, keepFromMonth, monthKey, monthLabel } from "@/lib/format";
import { rupees } from "@/lib/site";
import type { GymDetails } from "@/lib/content";
import type { Order } from "@/lib/types";

type Props = { month: string; orders: Order[]; error: string; gym: GymDetails };

const TYPE_LABEL = { bill: "Monthly fee", membership: "New member", product: "Shop" } as const;
const typeOf = (o: Order) => TYPE_LABEL[o.kind ?? "product"] ?? "Shop";
const STATUS_LABEL = { paid: "Paid", verifying: "UPI to verify", pending: "Unpaid", cancelled: "Cancelled" } as const;

/** Splits a paid order's total into joining fees, monthly fees and shop sales (shop includes the service charge). */
function breakdown(o: Order) {
  const out = { joining: 0, monthly: 0, shop: 0 };
  if (!o.items?.length) {
    out.shop = o.total;
    return out;
  }
  for (const item of o.items) {
    if (item.product_id) out.shop += item.amount;
    else if (item.name.startsWith("Joining fee")) out.joining += item.amount;
    else out.monthly += item.amount;
  }
  out.shop += o.service_charge;
  return out;
}

/** Admin: one month's transactions as a printable report (Save as PDF) or an Excel-friendly CSV. */
export default function MonthlyReport({ month, orders, error, gym }: Props) {
  const router = useRouter();
  const label = monthLabel(month);
  const paid = orders.filter((o) => o.status === "paid");
  const open = orders.filter((o) => o.status === "pending" || o.status === "verifying");
  const cancelled = orders.filter((o) => o.status === "cancelled");

  const totals = paid.reduce(
    (t, o) => {
      const b = breakdown(o);
      return {
        all: t.all + o.total,
        joining: t.joining + b.joining,
        monthly: t.monthly + b.monthly,
        shop: t.shop + b.shop,
        cash: t.cash + (o.payment_method === "cash" ? o.total : 0),
        upi: t.upi + (o.payment_method === "upi" ? o.total : 0),
      };
    },
    { all: 0, joining: 0, monthly: 0, shop: 0, cash: 0, upi: 0 }
  );
  const openTotal = open.reduce((n, o) => n + o.total, 0);

  const summary: [string, string][] = [
    ["Total collected", rupees(totals.all)],
    ["Monthly fees", rupees(totals.monthly)],
    ["Joining fees", rupees(totals.joining)],
    ["Shop sales", rupees(totals.shop)],
    ["Cash", rupees(totals.cash)],
    ["UPI", rupees(totals.upi)],
    ["Paid receipts", String(paid.length)],
    ["Still unpaid", `${open.length} · ${rupees(openTotal)}`],
  ];

  const downloadCsv = () => {
    const rows: (string | number)[][] = [
      [`${gym.name} – Transaction report – ${label}`],
      [`Generated ${formatIST(new Date().toISOString())}`],
      [],
      ["Summary (paid only)", "Amount (₹)"],
      ["Total collected", totals.all],
      ["Monthly fees", totals.monthly],
      ["Joining fees", totals.joining],
      ["Shop sales", totals.shop],
      ["Cash", totals.cash],
      ["UPI", totals.upi],
      ["Paid receipts", paid.length],
      ["Unpaid receipts", open.length],
      ["Unpaid amount", openTotal],
      ["Cancelled receipts", cancelled.length],
      [],
      ["Date", "Receipt", "Type", "Name", "Phone", "Details", "Method", "Status", "UTR", "Monthly fee", "Joining fee", "Shop", "Total"],
      ...orders.map((o) => {
        const b = breakdown(o);
        return [
          formatIST(o.created_at), o.receipt_no, typeOf(o), o.customer_name, o.customer_phone,
          o.items?.length ? o.items.map((i) => `${i.name} × ${i.qty}`).join("; ") : `${o.product_name} × ${o.quantity}`,
          o.payment_method === "upi" ? "UPI" : "Cash", STATUS_LABEL[o.status], o.utr ?? "", b.monthly, b.joining, b.shop, o.total,
        ];
      }),
    ];
    // BOM so Excel opens it as UTF-8 (₹, names in Hindi).
    const csv = "﻿" + rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = `kesh-fitness-report-${month}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 print:hidden sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href="/admin/transactions" className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-brand-muted hover:text-fg">
            <ArrowLeft className="h-3.5 w-3.5" /> Transactions
          </Link>
          <label htmlFor="r-month" className="label mt-3">Month</label>
          <input
            id="r-month"
            type="month"
            className="input sm:w-56"
            value={month}
            min={keepFromMonth(monthKey(new Date()))}
            max={monthKey(new Date())}
            onChange={(e) => e.target.value && router.push(`/admin/transactions/report?month=${e.target.value}`)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => window.print()} className="btn-primary btn-sm" title="Opens the print dialog. Choose “Save as PDF” to download.">
            <Printer className="h-4 w-4" /> Download PDF
          </button>
          <button onClick={downloadCsv} className="btn-ghost btn-sm" disabled={orders.length === 0}>
            <FileSpreadsheet className="h-4 w-4" /> Download Excel (CSV)
          </button>
        </div>
      </div>
      <p className="-mt-3 text-xs text-brand-muted print:hidden">
        For PDF, choose &ldquo;Save as PDF&rdquo; in the print window. Transactions are kept for {KEEP_MONTHS} months, so download
        each month&apos;s report if you need it for longer.
      </p>
      {error && <p className="text-sm text-brand-red print:hidden">{error}</p>}

      {/* Report */}
      <article className="border border-brand-line bg-brand-card p-4 sm:p-6 print:border-0 print:p-0">
        <header className="flex flex-col gap-2 border-b border-brand-line pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-display text-3xl tracking-wide">{gym.name}</p>
            <p className="text-xs text-brand-muted">{gym.address}</p>
          </div>
          <div className="sm:text-right">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-red">Transaction report</p>
            <p className="font-display text-2xl tracking-wide">{label}</p>
            <p className="text-[11px] text-brand-muted" suppressHydrationWarning>
              Generated {formatIST(new Date().toISOString())}
            </p>
          </div>
        </header>

        <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 print:grid-cols-4">
          {summary.map(([k, v], i) => (
            <div key={k} className={`border border-brand-line p-3 ${i === 0 ? "border-brand-red" : ""}`}>
              <dt className="text-[11px] uppercase tracking-wider text-brand-muted">{k}</dt>
              <dd className={`mt-1 font-display leading-none ${i === 0 ? "text-3xl text-brand-red" : "text-2xl"}`}>{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-2 text-[11px] text-brand-muted">
          Totals count paid receipts only. {cancelled.length > 0 && `${cancelled.length} cancelled receipt${cancelled.length === 1 ? " is" : "s are"} listed but not counted.`}
        </p>

        {orders.length === 0 ? (
          <p className="mt-6 border border-dashed border-brand-line px-4 py-12 text-center text-sm text-brand-muted">No transactions in {label}.</p>
        ) : (
          <div className="mt-5 overflow-x-auto print:overflow-visible">
            <table className="w-full min-w-[720px] text-left text-sm print:min-w-0 print:text-[10px]">
              <thead className="border-b border-brand-line text-[11px] uppercase tracking-wider text-brand-muted print:text-[9px]">
                <tr>
                  <th className="py-2 pr-3 font-semibold">Date</th>
                  <th className="py-2 pr-3 font-semibold">Receipt</th>
                  <th className="py-2 pr-3 font-semibold">Name</th>
                  <th className="py-2 pr-3 font-semibold">Details</th>
                  <th className="py-2 pr-3 font-semibold">Method</th>
                  <th className="py-2 pr-3 font-semibold">Status</th>
                  <th className="py-2 text-right font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-line">
                {orders.map((o) => (
                  <tr key={o.id} className={`break-inside-avoid ${o.status === "paid" ? "" : "text-brand-muted"}`}>
                    <td className="whitespace-nowrap py-2 pr-3 align-top">{formatIST(o.created_at)}</td>
                    <td className="whitespace-nowrap py-2 pr-3 align-top font-mono text-xs print:text-[9px]">{o.receipt_no}</td>
                    <td className="py-2 pr-3 align-top">
                      <span className="block">{o.customer_name}</span>
                      <span className="block text-[11px] text-brand-muted print:text-[9px]">{o.customer_phone}</span>
                    </td>
                    <td className="py-2 pr-3 align-top">
                      <span className="mr-1.5 text-[10px] font-bold uppercase tracking-wider text-brand-red">{typeOf(o)}</span>
                      {o.items?.length ? o.product_name : `${o.product_name} × ${o.quantity}`}
                    </td>
                    <td className="py-2 pr-3 align-top">{o.payment_method === "upi" ? "UPI" : "Cash"}</td>
                    <td className="whitespace-nowrap py-2 pr-3 align-top">{STATUS_LABEL[o.status]}</td>
                    <td className={`whitespace-nowrap py-2 text-right align-top font-semibold ${o.status === "cancelled" ? "line-through" : ""}`}>{rupees(o.total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-brand-line font-semibold">
                <tr>
                  <td colSpan={6} className="py-3 pr-3">Total collected · {paid.length} paid receipt{paid.length === 1 ? "" : "s"}</td>
                  <td className="py-3 text-right font-display text-xl">{rupees(totals.all)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </article>
    </div>
  );
}
