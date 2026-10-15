import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * For admin server pages. Sends anyone who isn't a logged-in admin to the admin login.
 * Cached per request, so the admin layout and page share one check.
 *
 * getClaims() checks the login token's signature on this server when the Supabase project
 * uses signing keys (no trip to Supabase Auth); otherwise it asks Auth, like getUser().
 */
export const requireAdmin = cache(async () => {
  if (!isSupabaseConfigured) redirect("/admin/login");
  const supabase = createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) redirect("/admin/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).single();
  if (profile?.role !== "admin") redirect("/admin/login?error=not-admin");
  return { supabase, userId };
});
