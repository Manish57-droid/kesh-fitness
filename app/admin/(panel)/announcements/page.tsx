import type { Metadata } from "next";
import AdminHeader from "@/components/admin/AdminHeader";
import NotificationsView from "@/components/admin/NotificationsView";
import { requireAdmin } from "@/lib/auth";
import type { Notification } from "@/lib/types";

export const metadata: Metadata = { title: "Announcements – Kesh Fitness Admin" };

export default async function AnnouncementsPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(50);
  return (
    <>
      <AdminHeader title="Announcements" subtitle="Shown in the notification bell for everyone on the website." />
      <NotificationsView initial={(data as Notification[]) ?? []} />
    </>
  );
}
