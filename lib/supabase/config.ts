export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** False until .env.local has the Supabase keys. The public site works either way. */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);
