"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/** Tracks the logged-in admin (visitors never log in). */
type AuthState = {
  user: User | null;
  isAdmin: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState>({ user: null, isAdmin: false, signOut: async () => {} });

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const load = useCallback(async (u: User | null) => {
    setUser(u);
    if (!u) return setIsAdmin(false);
    const { data } = await createClient().from("profiles").select("role").eq("id", u.id).single();
    setIsAdmin(data?.role === "admin");
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => load(data.user));

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION") return;
      // Defer: calling Supabase inside this callback can deadlock the auth lock.
      setTimeout(() => load(session?.user ?? null), 0);
    });
    return () => sub.subscription.unsubscribe();
  }, [load]);

  const signOut = useCallback(async () => {
    await createClient().auth.signOut();
    setUser(null);
    setIsAdmin(false);
  }, []);

  return <AuthContext.Provider value={{ user, isAdmin, signOut }}>{children}</AuthContext.Provider>;
}
