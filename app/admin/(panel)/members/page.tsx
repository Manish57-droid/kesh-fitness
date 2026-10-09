import type { Metadata } from "next";
import AdminHeader from "@/components/admin/AdminHeader";
import MembersView from "@/components/admin/MembersView";
import { requireAdmin } from "@/lib/auth";
import type { JoinRequest, Member } from "@/lib/types";

export const metadata: Metadata = { title: "Active Members – Kesh Fitness Admin" };

export default async function MembersPage({ searchParams }: { searchParams: { from?: string } }) {
  const { supabase } = await requireAdmin();
  const fromId = Number(searchParams.from);

  const [members, fromRequest] = await Promise.all([
    supabase.from("members").select("*").order("name"),
    // "Add as member" on a join request opens the form pre-filled with that person's details.
    fromId ? supabase.from("join_requests").select("*").eq("id", fromId).maybeSingle() : Promise.resolve({ data: null }),
  ]);

  return (
    <>
      <AdminHeader title="Active Members" subtitle="Everyone currently training at the gym." />
      <MembersView
        initial={(members.data as Member[]) ?? []}
        fromRequest={(fromRequest.data as JoinRequest | null) ?? null}
        tableMissing={members.error?.code === "42P01" || members.error?.code === "PGRST205"}
      />
    </>
  );
}
