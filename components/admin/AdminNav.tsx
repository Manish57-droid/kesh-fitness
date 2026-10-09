"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ClipboardList, ExternalLink, Inbox, LogOut, Megaphone, ShoppingBag, Users } from "lucide-react";
import ThemeToggle from "../ThemeToggle";
import { useAuth } from "../auth/AuthProvider";
import { createClient } from "@/lib/supabase/client";

const links = [
  { href: "/admin/join-requests", label: "Join Requests", short: "Joins", Icon: ClipboardList, badge: "joins" },
  { href: "/admin/messages", label: "Messages", short: "Inbox", Icon: Inbox, badge: "messages" },
  { href: "/admin/products", label: "Products", short: "Products", Icon: ShoppingBag },
  { href: "/admin/announcements", label: "Announcements", short: "Announce", Icon: Megaphone },
  { href: "/admin/members", label: "Active Members", short: "Members", Icon: Users },
] as const;

type Counts = { joins: number; messages: number };

/** Admin-only navigation: top bar on desktop, bottom tab bar on phones. */
export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuth();
  const [counts, setCounts] = useState<Counts>({ joins: 0, messages: 0 });

  // Refresh the "new" badges whenever the admin moves between pages.
  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from("join_requests").select("id", { count: "exact", head: true }).eq("status", "new"),
      supabase.from("messages").select("id", { count: "exact", head: true }).eq("is_read", false),
    ]).then(([j, m]) => setCounts({ joins: j.count ?? 0, messages: m.count ?? 0 }));
  }, [pathname]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/admin/login");
    router.refresh();
  };

  const badge = (key?: keyof Counts) =>
    key && counts[key] > 0 ? (
      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-red px-1 text-[10px] font-bold text-white">
        {counts[key] > 99 ? "99+" : counts[key]}
      </span>
    ) : null;

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-brand-line bg-brand-card/95 backdrop-blur-md">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/admin/join-requests" className="flex shrink-0 items-center gap-2">
            <span className="font-display text-2xl tracking-wider">
              KESH <span className="text-brand-red">FITNESS</span>
            </span>
            <span className="bg-brand-red px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">Admin</span>
          </Link>

          <ul className="hidden items-center gap-1 lg:flex">
            {links.map(({ href, label, Icon, ...rest }) => {
              const active = pathname.startsWith(href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={`flex items-center gap-2 rounded-sm px-3 py-2 text-xs font-semibold uppercase tracking-wider transition ${
                      active ? "bg-brand-red text-white" : "text-fg/70 hover:bg-fg/5 hover:text-fg"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                    {!active && badge("badge" in rest ? rest.badge : undefined)}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <ThemeToggle />
            <Link href="/" className="icon-btn" aria-label="View website" title="View website">
              <ExternalLink className="h-4 w-4" />
            </Link>
            <button onClick={handleSignOut} className="icon-btn" aria-label="Sign out" title="Sign out">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </nav>
      </header>

      <nav
        aria-label="Admin sections"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-brand-line bg-brand-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
      >
        <ul className="grid grid-cols-5">
          {links.map(({ href, short, Icon, ...rest }) => {
            const active = pathname.startsWith(href);
            const key = "badge" in rest ? rest.badge : undefined;
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`relative flex h-16 flex-col items-center justify-center gap-1 text-[10px] font-semibold uppercase tracking-wider transition ${
                    active ? "text-brand-red" : "text-fg/60"
                  }`}
                >
                  {active && <span className="absolute inset-x-3 top-0 h-0.5 bg-brand-red" />}
                  <Icon className="h-5 w-5" />
                  {short}
                  {key && counts[key] > 0 && (
                    <span className="absolute right-[18%] top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-red px-1 text-[9px] font-bold text-white">
                      {counts[key] > 99 ? "99+" : counts[key]}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
