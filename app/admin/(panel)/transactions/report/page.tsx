import type { Metadata } from "next";
import MonthlyReport from "@/components/admin/MonthlyReport";
import { requireAdmin } from "@/lib/auth";
import { getContent } from "@/lib/content-server";
import { monthKey } from "@/lib/format";
import type { Order } from "@/lib/types";

export const metadata: Metadata = { title: "Monthly Report – Kesh Fitness Admin" };

/** Start of a "YYYY-MM" month in India time, as an ISO timestamp. */
const monthStart = (key: string) => `${key}-01T00:00:00+05:30`;
const nextMonth = (key: string) => {
  const [y, m] = key.split("-").map(Number);
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
};

export default async function ReportPage({ searchParams }: { searchParams: { month?: string } }) {
  const { supabase } = await requireAdmin();
  const month = /^\d{4}-(0[1-9]|1[0-2])$/.test(searchParams.month ?? "") ? searchParams.month! : monthKey(new Date());

  const [{ data, error }, c] = await Promise.all([
    supabase
      .from("orders")
      .select("*")
      .gte("created_at", monthStart(month))
      .lt("created_at", monthStart(nextMonth(month)))
      .order("created_at")
      .limit(5000),
    getContent(),
  ]);

  return <MonthlyReport month={month} orders={(data as Order[]) ?? []} error={error?.message ?? ""} gym={c.gym} />;
}
