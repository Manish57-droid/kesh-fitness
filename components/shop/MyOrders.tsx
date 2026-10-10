"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, ReceiptText } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { KEYS, readJSON } from "@/lib/storage";
import { formatIST } from "@/lib/format";
import { rupees } from "@/lib/site";
import type { OrderStatus, PublicOrder } from "@/lib/types";
import type { SavedOrder } from "./Checkout";

const statusStyle: Record<OrderStatus, string> = {
  paid: "bg-emerald-600 text-white",
  verifying: "bg-amber-500 text-black",
  pending: "bg-brand-red text-white",
  cancelled: "bg-fg/15 text-fg",
};

/** Orders placed from this phone (tokens are kept in local storage). */
export default function MyOrders() {
  const [orders, setOrders] = useState<(PublicOrder & { token: string })[]>([]);

  useEffect(() => {
    const saved = readJSON<SavedOrder[]>(KEYS.orders, []).slice(0, 10);
    if (!isSupabaseConfigured || saved.length === 0) return;
    const supabase = createClient();
    Promise.all(
      saved.map(({ token }) =>
        supabase
          .rpc("get_order", { p_token: token })
          .maybeSingle<PublicOrder>()
          .then(({ data }) => (data ? { ...data, token } : null))
      )
    ).then((list) => setOrders(list.filter(Boolean) as (PublicOrder & { token: string })[]));
  }, []);

  if (orders.length === 0) return null;

  return (
    <section className="section pt-0">
      <div className="container-x">
        <h2 className="flex items-center gap-2 font-display text-3xl tracking-wide">
          <ReceiptText className="h-6 w-6 text-brand-red" /> My orders
        </h2>
        <ul className="mt-4 divide-y divide-brand-line border border-brand-line">
          {orders.map((o) => (
            <li key={o.token}>
              <Link href={`/receipt/${o.token}`} className="flex items-center gap-3 bg-brand-card p-4 transition hover:bg-fg/5">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">
                    {o.product_name} × {o.quantity}
                  </p>
                  <p className="text-xs text-brand-muted">
                    <span className="font-mono">{o.receipt_no}</span> · {formatIST(o.created_at)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-xl leading-none">{rupees(o.total)}</p>
                  <span className={`mt-1 inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusStyle[o.status]}`}>
                    {o.status === "pending" && o.payment_method === "cash" ? "Cash due" : o.status}
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-brand-muted" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
