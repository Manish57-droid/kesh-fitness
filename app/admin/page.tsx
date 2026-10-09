import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import AdminPanel from "@/components/admin/AdminPanel";
import { requireAdmin } from "@/lib/auth";
import type { Message, Notification } from "@/lib/types";

export const metadata: Metadata = { title: "Admin Panel – Kesh Fitness", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const { supabase } = await requireAdmin();

  const [messages, notifications] = await Promise.all([
    supabase.from("messages").select("*").order("created_at", { ascending: false }).limit(300),
    supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(50),
  ]);

  return (
    <>
      <Navbar solid />
      <main className="container-x pb-24 pt-24 md:pt-32 lg:pb-20">
        <p className="eyebrow">Admin</p>
        <h1 className="heading mt-4">
          Control <span className="text-brand-red">Room</span>
        </h1>
        <AdminPanel
          initialMessages={(messages.data as Message[]) ?? []}
          initialNotifications={(notifications.data as Notification[]) ?? []}
        />
      </main>
    </>
  );
}
