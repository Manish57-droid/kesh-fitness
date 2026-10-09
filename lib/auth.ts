import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Profile } from "@/lib/types";

/** For admin server pages. Sends anyone who isn't a logged-in admin to the admin login. */
export async function requireAdmin() {
  if (!isSupabaseConfigured) redirect("/admin/login");
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const profile = data as Profile | null;
  if (profile?.role !== "admin") redirect("/admin/login?error=not-admin");
  return { supabase, user, profile };
}
