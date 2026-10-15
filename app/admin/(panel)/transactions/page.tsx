import type { Metadata } from "next";
import AdminHeader from "@/components/admin/AdminHeader";
import TransactionsView from "@/components/admin/TransactionsView";
import { requireAdmin } from "@/lib/auth";
import type { Order } from "@/lib/types";

export const metadata: Metadata = { title: "Transactions – Kesh Fitness Admin" };

export default async function TransactionsPage() {
  const { supabase } = await requireAdmin();
  const [{ data, error }] = await Promise.all([
    supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(5000),
    // Removes transactions older than 24 months (migration 011). Normally a daily job does this;
    // this is the fallback, run alongside so it doesn't slow the page. Fails harmlessly before the migration.
    supabase.rpc("admin_purge_old_orders"),
  ]);
  const missing = error?.code === "42P01" || error?.code === "PGRST205";
  return (
    <>
      <AdminHeader title="Transactions" subtitle="Fees and shop orders. Confirm UPI payments after checking the UTR in Paytm, and mark cash once collected. Kept for 24 months." />
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
