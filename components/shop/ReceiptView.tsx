"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Banknote, CheckCircle2, Clock, Printer, Share2, XCircle } from "lucide-react";
import PaymentPanel from "./PaymentPanel";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { formatIST, rupeesInWords } from "@/lib/format";
import { payment, rupees } from "@/lib/site";
import type { GymDetails } from "@/lib/content";
import type { PublicOrder } from "@/lib/types";

const POLL_MS = 15_000;

export default function ReceiptView({ token, gym }: { token: string; gym: GymDetails }) {
  const [order, setOrder] = useState<PublicOrder | null | undefined>(undefined);
  const [shared, setShared] = useState(false);

  const load = useCallback(async () => {
    if (!isSupabaseConfigured) return setOrder(null);
    const { data } = await createClient().rpc("get_order", { p_token: token }).maybeSingle<PublicOrder>();
    setOrder(data ?? null);
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  // Keep checking while payment is pending, so the receipt turns PAID by itself.
  useEffect(() => {
    if (!order || (order.status !== "pending" && order.status !== "verifying")) return;
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [order, load]);

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: `Receipt ${order?.receipt_no}`, url });
      else {
        await navigator.clipboard.writeText(url);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      }
    } catch {}
  };

  if (order === undefined) return <div className="mx-auto h-[32rem] max-w-3xl animate-pulse bg-brand-card" />;

  if (!order) {
    return (
      <div className="card mx-auto max-w-md text-center">
        <p className="font-display text-3xl tracking-wide">Receipt not found</p>
        <p className="mt-2 text-sm text-fg/70">Check the link, or ask at the gym counter with your phone number.</p>
        <Link href="/shop" className="btn-primary mt-6">
          <ArrowLeft className="h-4 w-4" /> Back to shop
        </Link>
      </div>
    );
  }

  const awaitingUpi = order.payment_method === "upi" && order.status === "pending";
  const banner = {
    paid: { Icon: CheckCircle2, cls: "border-emerald-600 bg-emerald-600/10 text-emerald-500", title: "Payment received", text: "Collect your order at the gym counter. Show this receipt." },
    verifying: { Icon: Clock, cls: "border-amber-500 bg-amber-500/10 text-amber-500", title: "Payment being verified", text: `We're checking UTR ${order.utr}. This page updates by itself once confirmed.` },
    pending:
      order.payment_method === "cash"
        ? { Icon: Banknote, cls: "border-amber-500 bg-amber-500/10 text-amber-500", title: `Pay ${rupees(order.total)} in cash at the counter`, text: "Show this receipt. Staff will mark it paid and it will update here." }
        : { Icon: Clock, cls: "border-brand-red bg-brand-red/10 text-brand-red", title: "Waiting for payment", text: "Pay with UPI below, then enter your transaction ID." },
    cancelled: { Icon: XCircle, cls: "border-brand-line bg-fg/5 text-fg/70", title: "Order cancelled", text: "This order was cancelled. Contact the gym if you have questions." },
  }[order.status];

  const stamp = {
    paid: { label: "PAID", cls: "border-emerald-600 text-emerald-600" },
    verifying: { label: "VERIFYING", cls: "border-amber-500 text-amber-500" },
    pending: { label: order.payment_method === "cash" ? "CASH DUE" : "UNPAID", cls: "border-brand-red text-brand-red" },
    cancelled: { label: "CANCELLED", cls: "border-fg/40 text-fg/50" },
  }[order.status];

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {/* Status */}
      <div className={`flex items-start gap-3 border-l-4 p-4 print:hidden ${banner.cls}`}>
        <banner.Icon className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <p className="font-semibold">{banner.title}</p>
          <p className="mt-0.5 text-sm text-fg/70">{banner.text}</p>
        </div>
      </div>

      {awaitingUpi && (
        <PaymentPanel amount={order.total} receiptNo={order.receipt_no} token={token} utrFunction="submit_utr" onSubmitted={load} />
      )}

      {/* Receipt */}
      <article id="receipt" className="relative overflow-hidden border border-brand-line bg-brand-card print:border-black/20">
        <div className="h-2 bg-brand-red" />
        <div className="p-5 sm:p-8">
          <header className="flex flex-col justify-between gap-4 border-b border-brand-line pb-5 sm:flex-row sm:items-start">
            <div>
              <p className="font-display text-3xl tracking-wider">
                KESH <span className="text-brand-red">FITNESS</span>
              </p>
              <p className="mt-1 text-xs text-brand-muted">{gym.tagline}</p>
              <p className="text-xs text-brand-muted">{gym.address}</p>
              <p className="text-xs text-brand-muted">UPI: {payment.upiId}</p>
            </div>
            <div className="sm:text-right">
              <p className="font-display text-2xl tracking-[0.2em] text-brand-muted">RECEIPT</p>
              <p className="mt-1 font-mono text-sm font-semibold">{order.receipt_no}</p>
              <p className="text-xs text-brand-muted">{formatIST(order.created_at)}</p>
            </div>
          </header>

          <div className={`pointer-events-none absolute right-6 top-28 rotate-[-12deg] border-4 px-4 py-1 font-display text-3xl tracking-[0.2em] opacity-80 sm:right-10 sm:top-24 sm:text-4xl ${stamp.cls}`}>
            {stamp.label}
          </div>

          <section className="grid gap-4 py-5 text-sm sm:grid-cols-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Billed to</p>
              <p className="mt-1 font-semibold">{order.customer_name}</p>
              <p className="text-fg/70">{order.customer_phone}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Payment</p>
              <p className="mt-1 font-semibold">{order.payment_method === "upi" ? "UPI (online)" : "Cash at gym"}</p>
              {order.utr && <p className="text-fg/70">UTR: <span className="font-mono">{order.utr}</span></p>}
              {order.paid_at && <p className="text-fg/70">Paid on {formatIST(order.paid_at)}</p>}
            </div>
          </section>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-y border-brand-line text-left text-[10px] uppercase tracking-widest text-brand-muted">
                <th className="py-2 pr-2 font-bold">Item</th>
                <th className="px-2 py-2 text-center font-bold">Qty</th>
                <th className="px-2 py-2 text-right font-bold">Rate</th>
                <th className="py-2 pl-2 text-right font-bold">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-brand-line">
                <td className="py-3 pr-2 font-medium">{order.product_name}</td>
                <td className="px-2 py-3 text-center">{order.quantity}</td>
                <td className="px-2 py-3 text-right">{rupees(order.unit_price)}</td>
                <td className="py-3 pl-2 text-right">{rupees(order.subtotal)}</td>
              </tr>
            </tbody>
          </table>

          <div className="ml-auto mt-4 max-w-xs space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-fg/70">Subtotal</span>
              <span>{rupees(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-fg/70">Service charge</span>
              <span>{rupees(order.service_charge)}</span>
            </div>
            <div className="flex items-baseline justify-between border-t-2 border-fg/80 pt-2">
              <span className="font-semibold">Total</span>
              <span className="font-display text-3xl leading-none">{rupees(order.total)}</span>
            </div>
          </div>
          <p className="mt-3 text-right text-xs italic text-brand-muted">{rupeesInWords(order.total)}</p>

          <footer className="mt-8 border-t border-dashed border-brand-line pt-4 text-center text-xs text-brand-muted">
            <p className="font-semibold text-fg/80">Thank you for shopping with {gym.name}!</p>
            <p className="mt-1">Collect your order at the gym counter · Instagram @{gym.instagramHandle}{gym.email && ` · ${gym.email}`}</p>
            <p className="mt-1">This is a computer-generated receipt and does not need a signature.</p>
          </footer>
        </div>
      </article>

      <div className="flex flex-wrap gap-3 print:hidden">
        <button onClick={() => window.print()} className="btn-primary">
          <Printer className="h-4 w-4" /> Print / Save PDF
        </button>
        <button onClick={share} className="btn-ghost">
          <Share2 className="h-4 w-4" /> {shared ? "Link copied" : "Share"}
        </button>
        <Link href="/shop" className="btn-ghost">
          <ArrowLeft className="h-4 w-4" /> Shop
        </Link>
      </div>
      <p className="text-xs text-brand-muted print:hidden">
        Save this page. Your receipts are also listed under &ldquo;My orders&rdquo; in the shop on this phone.
      </p>
    </div>
  );
}
