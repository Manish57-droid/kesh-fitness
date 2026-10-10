import type { Metadata } from "next";
import AdminHeader from "@/components/admin/AdminHeader";
import GalleryAdminView from "@/components/admin/GalleryAdminView";
import { requireAdmin } from "@/lib/auth";
import type { GalleryPhoto } from "@/lib/types";

export const metadata: Metadata = { title: "Gallery – Kesh Fitness Admin" };

export default async function GalleryPage() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.from("gallery_photos").select("*").order("sort_order").order("id");
  return (
    <>
      <AdminHeader title="Gallery" subtitle="Photos in the website slideshow. Lower numbers show first." />
      <GalleryAdminView
        initial={(data as GalleryPhoto[]) ?? []}
        tableMissing={error?.code === "42P01" || error?.code === "PGRST205"}
      />
    </>
  );
}
