"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Banknote, Clock, PartyPopper, Printer, XCircle } from "lucide-react";
import PaymentPanel from "./PaymentPanel";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { addMonths, formatDay, formatIST, rupeesInWords } from "@/lib/format";
import { payment, rupees } from "@/lib/site";
import type { GymDetails, PlanContent } from "@/lib/content";
import type { PublicJoinRequest } from "@/lib/types";

const POLL_MS = 15_000;

type Props = { token: string; gym: GymDetails; plans: PlanContent[] };

/** Membership payment status page + membership receipt. */
export default function JoinStatusView({ token, gym, plans }: Props) {
  const [req, setReq] = useState<PublicJoinRequest | null | undefined>(undefined);

  const load = useCallback(async () => {
    if (!isSupabaseConfigured) return setReq(null);
    const { data } = await createClient().rpc("get_join_request", { p_token: token }).maybeSingle<PublicJoinRequest>();
    setReq(data ?? null);
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  // Keep checking until the admin confirms the payment.
  useEffect(() => {
    if (!req || (req.payment_status !== "pending" && req.payment_status !== "verifying")) return;
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [req, load]);

  if (req === undefined) return <div className="mx-auto h-[32rem] max-w-3xl animate-pulse bg-brand-card" />;

  if (!req) {
    return (
      <div className="card mx-auto max-w-md text-center">
        <p className="font-display text-3xl tracking-wide">Not found</p>
        <p className="mt-2 text-sm text-fg/70">Check the link, or contact the gym with your mobile number.</p>
        <Link href="/#join" className="btn-primary mt-6">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
      </div>
    );
  }

  const planName = plans.find((p) => p.id === req.plan)?.name ?? req.plan;
  const amount = req.amount ?? 0;
  const joiningFee = req.joining_fee ?? 0;
  const monthlyFee = req.monthly_fee ?? amount - joiningFee;
  const firstName = req.name.split(" ")[0];
  const isPaid = req.payment_status === "paid";
  // Membership runs one month from the day payment was confirmed (India time), same as Active Members.
  const startDay = req.paid_at ? new Date(req.paid_at).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }) : null;

  const stamp = {
    paid: { label: "PAID", cls: "border-emerald-600 text-emerald-600" },
    verifying: { label: "VERIFYING", cls: "border-amber-500 text-amber-500" },
    pending: { label: req.payment_method === "cash" ? "CASH DUE" : "UNPAID", cls: "border-brand-red text-brand-red" },
    cancelled: { label: "CANCELLED", cls: "border-fg/40 text-fg/50" },
  }[req.payment_status];

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {/* Status */}
      {isPaid ? (
        <div className="overflow-hidden border border-emerald-600 bg-emerald-600/10 p-6 text-center sm:p-8 print:hidden">
          <PartyPopper className="mx-auto h-12 w-12 text-emerald-500" strokeWidth={1.5} />
          <h1 className="mt-4 font-display text-4xl tracking-wide sm:text-5xl">Welcome to the team, {firstName}!</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-fg/75">
            Your payment is confirmed and you&apos;re now a member of {gym.name} ({planName}). See you at the gym.
          </p>
        </div>
      ) : req.payment_status === "cancelled" ? (
        <StatusBar Icon={XCircle} cls="border-brand-line bg-fg/5 text-fg/70" title="Payment cancelled" text="Please contact the gym if you still want to join." />
      ) : req.payment_status === "verifying" ? (
        <StatusBar Icon={Clock} cls="border-amber-500 bg-amber-500/10 text-amber-500" title="Payment being verified" text={`We're checking UTR ${req.utr}. You'll see the welcome message here once it's confirmed.`} />
      ) : req.payment_method === "cash" ? (
        <StatusBar Icon={Banknote} cls="border-amber-500 bg-amber-500/10 text-amber-500" title={`Pay ${rupees(amount)} in cash at the gym`} text="Show this page at the counter. Once staff confirm your payment, your membership starts and this page updates." />
      ) : (
        <StatusBar Icon={Clock} cls="border-brand-red bg-brand-red/10 text-brand-red" title="One step left: pay to join" text="Pay with UPI below and enter your transaction ID. Your membership starts once we confirm it." />
      )}

      {req.payment_method === "upi" && req.payment_status === "pending" && (
        <PaymentPanel amount={amount} receiptNo={req.receipt_no} token={token} utrFunction="submit_join_utr" onSubmitted={load} />
      )}

      {/* Membership receipt */}
      <article className="relative overflow-hidden border border-brand-line bg-brand-card print:border-black/20">
        <div className="h-2 bg-brand-red" />
        <div className="p-5 sm:p-8">
          <header className="flex flex-col justify-between gap-4 border-b border-brand-line pb-5 sm:flex-row sm:items-start">
            <div>
              <p className="font-display text-3xl tracking-wider">
                KESH <span className="text-brand-red">FITNESS</span>
              </p>
              <p className="mt-1 text-xs text-brand-muted">{gym.tagline}</p>
              <p className="text-xs text-brand-muted">{gym.address}</p>
              {gym.email && <p className="text-xs text-brand-muted">{gym.email}</p>}
            </div>
            <div className="sm:text-right">
              <p className="font-display text-xl tracking-[0.15em] text-brand-muted">MEMBERSHIP RECEIPT</p>
              <p className="mt-1 font-mono text-sm font-semibold">{req.receipt_no}</p>
              <p className="text-xs text-brand-muted">{formatIST(req.created_at)}</p>
            </div>
          </header>

          <div className={`pointer-events-none absolute right-6 top-32 rotate-[-12deg] border-4 px-4 py-1 font-display text-3xl tracking-[0.2em] opacity-80 sm:right-10 sm:top-28 ${stamp.cls}`}>
            {stamp.label}
          </div>

          <section className="grid gap-4 py-5 text-sm sm:grid-cols-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Member</p>
              <p className="mt-1 font-semibold">{req.name}</p>
              <p className="text-fg/70">{req.phone}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Payment</p>
              <p className="mt-1 font-semibold">{req.payment_method === "upi" ? "UPI (online)" : "Cash at gym"}</p>
              {req.utr && <p className="text-fg/70">UTR: <span className="font-mono">{req.utr}</span></p>}
              {req.paid_at && <p className="text-fg/70">Paid on {formatIST(req.paid_at)}</p>}
              {startDay && (
                <>
                  <p className="text-fg/70">Member since {formatDay(startDay)}</p>
                  <p className="text-fg/70">Fees paid till {formatDay(addMonths(startDay, 1))}</p>
                </>
              )}
            </div>
          </section>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-y border-brand-line text-left text-[10px] uppercase tracking-widest text-brand-muted">
                <th className="py-2 pr-2 font-bold">Description</th>
                <th className="py-2 pl-2 text-right font-bold">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-brand-line">
                <td className="py-3 pr-2">Joining fee (one-time)</td>
                <td className="py-3 pl-2 text-right">{rupees(joiningFee)}</td>
              </tr>
              <tr className="border-b border-brand-line">
                <td className="py-3 pr-2">{planName}: first month</td>
                <td className="py-3 pl-2 text-right">{rupees(monthlyFee)}</td>
              </tr>
            </tbody>
          </table>
          <div className="ml-auto mt-4 flex max-w-xs items-baseline justify-between border-t-2 border-fg/80 pt-2 text-sm">
            <span className="font-semibold">Total</span>
            <span className="font-display text-3xl leading-none">{rupees(amount)}</span>
          </div>
          <p className="mt-3 text-right text-xs italic text-brand-muted">{rupeesInWords(amount)}</p>

          <footer className="mt-8 border-t border-dashed border-brand-line pt-4 text-center text-xs text-brand-muted">
            <p className="font-semibold text-fg/80">
              {isPaid ? `Welcome to ${gym.team}!` : "Membership starts once payment is confirmed."}
            </p>
            <p className="mt-1">UPI: {payment.upiId} · Instagram @{gym.instagramHandle}</p>
            <p className="mt-1">This is a computer-generated receipt and does not need a signature.</p>
          </footer>
        </div>
      </article>

      <div className="flex flex-wrap gap-3 print:hidden">
        <button onClick={() => window.print()} className="btn-primary">
          <Printer className="h-4 w-4" /> Print / Save PDF
        </button>
        <Link href="/" className="btn-ghost">
          <ArrowLeft className="h-4 w-4" /> Home
        </Link>
      </div>
      <p className="text-xs text-brand-muted print:hidden">Keep this link. This page updates by itself when your payment is confirmed.</p>
    </div>
  );
}

function StatusBar({ Icon, cls, title, text }: { Icon: typeof Clock; cls: string; title: string; text: string }) {
  return (
    <div className={`flex items-start gap-3 border-l-4 p-4 print:hidden ${cls}`}>
      <Icon className="mt-0.5 h-5 w-5 shrink-0" />
      <div>
        <p className="font-semibold">{title}</p>
        <p className="mt-0.5 text-sm text-fg/70">{text}</p>
      </div>
    </div>
  );
}
