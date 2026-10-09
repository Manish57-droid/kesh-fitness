import type { Metadata } from "next";
import AdminHeader from "@/components/admin/AdminHeader";
import ProductsView from "@/components/admin/ProductsView";
import { requireAdmin } from "@/lib/auth";
import type { Product } from "@/lib/types";

export const metadata: Metadata = { title: "Products – Kesh Fitness Admin" };

export default async function ProductsPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase
    .from("products")
    .select("*")
    .order("sort_order")
    .order("created_at", { ascending: false });
  return (
    <>
      <AdminHeader title="Products" subtitle="Everything listed in the Shop section of the website." />
      <ProductsView initial={(data as Product[]) ?? []} />
    </>
  );
}
