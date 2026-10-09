"use client";
import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn, LogOut, ShieldCheck } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { initials } from "@/lib/format";
import { useClickOutside } from "@/lib/useClickOutside";

/** Admin login button, or the admin menu once logged in. */
export default function UserMenu() {
  const { user, isAdmin, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(ref, open, close);

  if (!user || !isAdmin) {
    return (
      <Link href="/admin/login" className="icon-btn w-auto gap-1.5 px-3 text-xs font-semibold uppercase tracking-wider sm:w-auto sm:gap-2 sm:px-4">
        <LogIn className="h-4 w-4" />
        <span>Login</span>
      </Link>
    );
  }

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
    router.push("/");
    router.refresh();
  };

  const itemClass =
    "flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-fg/80 transition hover:bg-fg/5 hover:text-fg";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex h-11 w-11 items-center justify-center rounded-sm bg-brand-red font-display text-lg tracking-wider text-white sm:h-10 sm:w-10"
        aria-label="Admin menu"
        aria-expanded={open}
      >
        {initials(null, user.email)}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-60 border border-brand-line bg-brand-card py-2 shadow-2xl">
          <div className="border-b border-brand-line px-4 pb-3 pt-1">
            <p className="truncate text-xs text-brand-muted">{user.email}</p>
            <span className="mt-2 inline-block bg-brand-red px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">
              Admin
            </span>
          </div>
          <Link href="/admin" onClick={close} className={itemClass}>
            <ShieldCheck className="h-4 w-4" /> Admin Panel
          </Link>
          <button onClick={handleSignOut} className={itemClass}>
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
