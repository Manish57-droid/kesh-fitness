"use client";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { rupees, upiLink } from "@/lib/site";

/** QR for any UPI app with the exact amount and a note (receipt number or member). */
export default function UpiQr({ amount, note, className = "h-48 w-48" }: { amount: number; note: string; className?: string }) {
  const link = upiLink(amount, note);
  const [qr, setQr] = useState("");

  useEffect(() => {
    QRCode.toDataURL(link, { width: 480, margin: 1 }).then(setQr).catch(() => setQr(""));
  }, [link]);

  return qr ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={qr} alt={`UPI QR code for ${rupees(amount)}`} className={`${className} bg-white p-2`} />
  ) : (
    <div className={`${className} animate-pulse bg-white/80`} />
  );
}
