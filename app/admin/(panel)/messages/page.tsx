import type { Metadata } from "next";
import AdminHeader from "@/components/admin/AdminHeader";
import MessagesView from "@/components/admin/MessagesView";
import { requireAdmin } from "@/lib/auth";
import type { Message } from "@/lib/types";

export const metadata: Metadata = { title: "Messages – Kesh Fitness Admin" };

export default async function MessagesPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("messages").select("*").order("created_at", { ascending: false }).limit(300);
  return (
    <>
      <AdminHeader title="Messages" subtitle="Questions and orders from the website. Replies show up for the sender on the site." />
      <MessagesView initial={(data as Message[]) ?? []} />
    </>
  );
}
