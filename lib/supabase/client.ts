import { createBrowserClient } from "@supabase/ssr";
import { supabaseKey, supabaseUrl } from "./config";

/** Supabase client for client components (returns a shared instance). */
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseKey);
}
