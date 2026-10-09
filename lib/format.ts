export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/** Index of today in DAYS (Monday = 0). */
export const todayIndex = () => (new Date().getDay() + 6) % 7;

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
