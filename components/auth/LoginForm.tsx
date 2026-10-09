"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, Loader2, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function LoginForm() {
  const router = useRouter();
  const notAdmin = useSearchParams().get("error") === "not-admin";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(notAdmin ? "This account doesn't have admin access." : "");

  if (!isSupabaseConfigured) {
    return (
      <div className="card relative w-full max-w-md">
        <h1 className="font-display text-4xl tracking-wide">Admin login not set up</h1>
        <p className="mt-3 text-sm text-fg/70">
          Add your Supabase keys to <code className="text-brand-red">.env.local</code> (see{" "}
          <code>.env.local.example</code>) and restart the dev server.
        </p>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setBusy(false);
      return setError(error.message);
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
    if (profile?.role !== "admin") {
      await supabase.auth.signOut();
      setBusy(false);
      return setError("This account doesn't have admin access.");
    }
    router.push("/admin");
    router.refresh();
  };

  return (
    <div className="card relative w-full max-w-md p-6 sm:p-8">
      <ShieldCheck className="h-8 w-8 text-brand-red" />
      <h1 className="mt-4 font-display text-5xl tracking-wide">Admin Login</h1>
      <p className="mt-2 text-sm text-fg/60">For Kesh Fitness staff only.</p>

      <form onSubmit={submit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input id="email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </div>
        <div>
          <label htmlFor="password" className="label">Password</label>
          <input id="password" type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
        </div>

        {error && (
          <p className="flex items-start gap-2 text-sm text-brand-red">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
          </p>
        )}

        <button type="submit" disabled={busy} className="btn-primary w-full">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          Sign In
        </button>
      </form>
    </div>
  );
}
