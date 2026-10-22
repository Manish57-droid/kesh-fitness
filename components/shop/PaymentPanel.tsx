"use client";
import { useState } from "react";
import { Check, Copy, Loader2, Smartphone } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import UpiQr from "./UpiQr";
import { payment, rupees, upiLink } from "@/lib/site";
type Props = {
  amount: number;
  receiptNo: string;
  token: string;
  /** Database function that records the UTR: shop orders or join requests. */
  utrFunction: "submit_utr" | "submit_join_utr";
  onSubmitted: () => void;
};

/** UPI payment step (shown while an order or membership payment is waiting). */
export default function PaymentPanel({ amount, receiptNo, token, utrFunction, onSubmitted }: Props) {
  const link = upiLink(amount, receiptNo);
  const [showShopQr, setShowShopQr] = useState(false);
  const [copied, setCopied] = useState(false);
  const [utr, setUtr] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const copyUpi = async () => {
    try {
      await navigator.clipboard.writeText(payment.upiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error } = await createClient().rpc(utrFunction, { p_token: token, p_utr: utr });
    setBusy(false);
    if (error) return setError(error.message);
    onSubmitted();
  };

  return (
    <div className="card border-brand-red p-4 sm:p-6 print:hidden">
      <p className="text-xs font-bold uppercase tracking-widest text-brand-red">Step 1 · Pay</p>
      <p className="mt-2 flex items-baseline gap-2">
        <span className="font-display text-5xl leading-none">{rupees(amount)}</span>
        <span className="text-sm text-brand-muted">to {payment.payeeName}</span>
      </p>

      <div className="mt-5 grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
        <div className="space-y-3">
          {/* Phones: open the UPI app directly */}
          <a href={link} className="btn-primary w-full">
            <Smartphone className="h-4 w-4" /> Pay with UPI app
          </a>
          <p className="text-xs text-brand-muted">
            Opens Paytm, PhonePe, Google Pay or BHIM with the amount filled in. On a computer, scan the QR with your phone
            instead.
          </p>
          <div className="flex items-center justify-between gap-3 border border-brand-line px-3 py-2">
            <span className="min-w-0">
              <span className="block text-[10px] uppercase tracking-widest text-brand-muted">UPI ID</span>
              <span className="block truncate font-mono text-sm">{payment.upiId}</span>
            </span>
            <button type="button" onClick={copyUpi} className="btn-ghost btn-sm shrink-0">
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          {/* Exact amount and receipt number, for paying from a computer. */}
          <UpiQr amount={amount} note={receiptNo} />
          <p className="text-[11px] text-brand-muted">Scan to pay {rupees(amount)}</p>
          <button type="button" onClick={() => setShowShopQr(!showShopQr)} className="text-[11px] text-brand-red hover:underline">
            {showShopQr ? "Hide" : "Use"} our shop QR instead
          </button>
        </div>
      </div>

      {showShopQr && (
        <div className="mt-4 flex flex-col items-center gap-2 border border-dashed border-brand-line p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/upi-qr.jpg" alt="Kesh Fitness Paytm UPI QR" className="w-56 bg-white" />
          <p className="text-center text-xs text-amber-500">
            This QR doesn&apos;t include the amount. Enter {rupees(amount)} yourself when paying.
          </p>
        </div>
      )}

      <form onSubmit={submit} className="mt-6 border-t border-brand-line pt-5">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-red">Step 2 · Confirm</p>
        <label htmlFor="utr" className="label mt-3">UPI transaction ID (UTR / UPI Ref No.)</label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="utr"
            className="input font-mono uppercase tracking-wider"
            value={utr}
            onChange={(e) => setUtr(e.target.value.replace(/\s/g, ""))}
            placeholder="e.g. 428517369021"
            inputMode="text"
            autoComplete="off"
            minLength={10}
            maxLength={22}
            required
          />
          <button type="submit" disabled={busy} className="btn-primary shrink-0">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            I&apos;ve paid
          </button>
        </div>
        <p className="mt-2 text-xs text-brand-muted">
          After paying, your UPI app shows a 12-digit UTR or UPI Ref No. Enter it here so we can match your payment.
        </p>
        {error && <p className="mt-2 text-sm text-brand-red">{error}</p>}
      </form>
    </div>
  );
}
