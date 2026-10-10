import type { Metadata } from "next";
import AdminHeader from "@/components/admin/AdminHeader";
import TransactionsView from "@/components/admin/TransactionsView";
import { requireAdmin } from "@/lib/auth";
import type { Order } from "@/lib/types";

export const metadata: Metadata = { title: "Transactions – Kesh Fitness Admin" };

export default async function TransactionsPage() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(5000);
  const missing = error?.code === "42P01" || error?.code === "PGRST205";
  return (
    <>
      <AdminHeader title="Transactions" subtitle="Shop orders. Confirm UPI payments after checking the UTR in Paytm, and mark cash once collected." />
      {missing ? (
        <div className="card p-8 text-center">
          <p className="font-display text-2xl tracking-wide">Orders not set up yet</p>
          <p className="mt-2 text-sm text-fg/70">
            Run <code className="text-brand-red">supabase/migrations/004_orders_gallery.sql</code> in the Supabase SQL Editor, then refresh.
          </p>
        </div>
      ) : (
        <TransactionsView initial={(data as Order[]) ?? []} />
      )}
    </>
  );
}
