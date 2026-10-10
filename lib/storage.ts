// localStorage helpers that never throw (private mode, blocked storage, SSR).

export function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJSON(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export const KEYS = {
  workouts: "kesh-workouts",
  messageTokens: "kesh-message-tokens",
  readNotifications: "kesh-read-notifications",
  orders: "kesh-orders", // [{ token, receiptNo }] of shop orders placed on this device
  customer: "kesh-customer", // { name, phone } remembered for the next checkout
  joins: "kesh-joins", // [{ token, receiptNo }] of join requests sent from this device
};
