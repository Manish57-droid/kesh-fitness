import type { Metadata } from "next";
import AdminHeader from "@/components/admin/AdminHeader";
import ContentEditor from "@/components/admin/content/ContentEditor";
import { requireAdmin } from "@/lib/auth";
import { mergeContent } from "@/lib/content";

export const metadata: Metadata = { title: "Website – Kesh Fitness Admin" };

export default async function ContentPage() {
  const { supabase } = await requireAdmin();
  // Read straight from the database (not the website cache) so the editor is always current.
  const { data, error } = await supabase.from("site_content").select("data").eq("key", "home").maybeSingle();
  return (
    <>
      <AdminHeader title="Website" subtitle="Edit the text, photos, prices and timings on the home page. Changes go live when you tap Save." />
      <ContentEditor initial={mergeContent(data?.data)} tableMissing={error?.code === "42P01" || error?.code === "PGRST205"} />
    </>
  );
}
