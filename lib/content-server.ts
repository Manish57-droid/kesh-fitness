import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabaseKey, supabaseUrl } from "./supabase/config";
import { CONTENT_TAG, defaultContent, mergeContent, type SiteContent } from "./content";

/**
 * Landing-page content for server components. Cached by Next.js (tag CONTENT_TAG) and
 * refreshed as soon as the admin saves, or every 10 minutes at the latest.
 */
export const getContent = cache(async (): Promise<SiteContent> => {
  if (!isSupabaseConfigured) return defaultContent;
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
    global: {
      fetch: (input, init) => fetch(input, { ...init, next: { revalidate: 600, tags: [CONTENT_TAG] } }),
    },
  });
  // Before migration 006 the table doesn't exist; the error just means "use defaults".
  const { data } = await supabase.from("site_content").select("data").eq("key", "home").maybeSingle();
  return mergeContent(data?.data);
});
