// Fixed settings. Gym details, texts, prices and timings are editable by the admin: see lib/content.ts.

import type { PlanContent } from "./content";

export type PlanId = PlanContent["id"];

export const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;

// UPI payments for shop orders.
export const payment = {
  upiId: "7209101608@ptyes",
  payeeName: "KESH FITNESS",
  /** Added once per order. Keep in sync with place_order() in migrations 004/005. */
  serviceCharge: 1,
};

/**
 * UPI deep link that opens any UPI app with the amount filled in and the receipt number
 * in the payment note. Encoded by hand (spaces as %20) because some UPI apps show "+" literally.
 */
export const upiLink = (amount: number, receiptNo: string) =>
  "upi://pay?" +
  Object.entries({
    pa: payment.upiId,
    pn: payment.payeeName,
    am: amount.toFixed(2),
    cu: "INR",
    tn: `Kesh Fitness ${receiptNo}`,
  })
    .map(([k, v]) => `${k}=${encodeURIComponent(v).replace(/%40/g, "@")}`)
    .join("&");

/** All "Join" buttons lead to the membership form on the home page. */
export const joinHref = "/#join";
