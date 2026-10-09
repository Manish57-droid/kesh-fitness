import type { Metadata } from "next";
import AdminHeader from "@/components/admin/AdminHeader";
import JoinRequestsView from "@/components/admin/JoinRequestsView";
import { requireAdmin } from "@/lib/auth";
import type { JoinRequest } from "@/lib/types";

export const metadata: Metadata = { title: "Join Requests – Kesh Fitness Admin" };

export default async function JoinRequestsPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("join_requests").select("*").order("created_at", { ascending: false }).limit(500);
  return (
    <>
      <AdminHeader title="Join Requests" subtitle="People who filled the Join Kesh Fitness form." />
      <JoinRequestsView initial={(data as JoinRequest[]) ?? []} />
    </>
  );
}
