export function timeAgo(iso: string | null) {
  if (!iso) return "Never";
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  const units: [number, string][] = [
    [31557600, "yr"],
    [2629800, "mo"],
    [604800, "wk"],
    [86400, "day"],
    [3600, "hr"],
    [60, "min"],
  ];
  for (const [size, label] of units) {
    if (s >= size) {
      const n = Math.floor(s / size);
      return `${n} ${label}${n === 1 ? "" : "s"} ago`;
    }
  }
  return "Just now";
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function initials(name: string | null | undefined, email?: string | null) {
  const src = (name || email || "?").trim();
  const parts = src.split(/[\s@.]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

/** Today's date as "YYYY-MM-DD" in the viewer's time zone. */
export function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Adds whole months to a "YYYY-MM-DD" date, clamping to month end (31 Jan + 1 → 28/29 Feb). */
export function addMonths(iso: string, months: number) {
  const [y, m, d] = iso.split("-").map(Number);
  const target = new Date(y, m - 1 + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(d, lastDay));
  return `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, "0")}-${String(target.getDate()).padStart(2, "0")}`;
}

/**
 * Overdue monthly cycles for a member paid up to `paidUntil`, as of `today` (both "YYYY-MM-DD").
 * Paid till 1 Sep, today 12 Oct → 2 (September and October). 0 if not late yet.
 */
export function pendingMonths(paidUntil: string, today: string, max = 24) {
  let n = 0;
  while (n < max && addMonths(paidUntil, n) < today) n++;
  return n;
}

/** Whole days from `from` to `to` (both "YYYY-MM-DD"); negative if `to` is earlier. */
export function daysBetween(from: string, to: string) {
  return Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000);
}

/** Formats a "YYYY-MM-DD" date without time-zone shifts. */
export function formatDay(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/** "2026-10" for a timestamp, in India time. */
export const monthKey = (iso: string | Date) =>
  new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit" }).slice(0, 7);

/** Month key `n` months after `key` (negative = before): shiftMonth("2026-01", -1) → "2025-12". */
export const shiftMonth = (key: string, n: number) => {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

/** Transactions are kept for the current month and the 24 before it (migration 011's orders_keep_from()). */
export const KEEP_MONTHS = 24;
export const keepFromMonth = (currentKey: string) => shiftMonth(currentKey, -KEEP_MONTHS);

/** "2026-10" → "October 2026". */
export const monthLabel = (key: string) => {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
};

/** Date and time in India, e.g. "10 Oct 2026, 2:35 pm". */
export function formatIST(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven",
  "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen",
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function belowThousand(n: number): string {
  const h = Math.floor(n / 100);
  const rest = n % 100;
  const parts = [];
  if (h) parts.push(`${ONES[h]} Hundred`);
  if (rest) parts.push(rest < 20 ? ONES[rest] : `${TENS[Math.floor(rest / 10)]}${rest % 10 ? ` ${ONES[rest % 10]}` : ""}`);
  return parts.join(" ");
}

/** Whole rupees in Indian-style words, e.g. 1501 → "Rupees One Thousand Five Hundred One Only". */
export function rupeesInWords(amount: number) {
  let n = Math.floor(Math.abs(amount));
  if (n === 0) return "Rupees Zero Only";
  const parts = [];
  const crore = Math.floor(n / 10_000_000);
  n %= 10_000_000;
  const lakh = Math.floor(n / 100_000);
  n %= 100_000;
  const thousand = Math.floor(n / 1000);
  n %= 1000;
  if (crore) parts.push(`${belowThousand(crore)} Crore`);
  if (lakh) parts.push(`${belowThousand(lakh)} Lakh`);
  if (thousand) parts.push(`${belowThousand(thousand)} Thousand`);
  if (n) parts.push(belowThousand(n));
  return `Rupees ${parts.join(" ")} Only`;
}
