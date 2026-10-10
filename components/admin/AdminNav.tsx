"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ClipboardList,
  ExternalLink,
  Images,
  LayoutTemplate,
  Inbox,
  LogOut,
  Megaphone,
  MoreHorizontal,
  ReceiptIndianRupee,
  ShoppingBag,
  Users,
} from "lucide-react";
import ThemeToggle from "../ThemeToggle";
import { useAuth } from "../auth/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { useClickOutside } from "@/lib/useClickOutside";

type Counts = { joins: number; messages: number; orders: number };

const links: { href: string; label: string; short: string; Icon: typeof Inbox; badge?: keyof Counts; primary?: boolean }[] = [
  { href: "/admin/join-requests", label: "Join Requests", short: "Joins", Icon: ClipboardList, badge: "joins", primary: true },
  { href: "/admin/messages", label: "Messages", short: "Inbox", Icon: Inbox, badge: "messages", primary: true },
  { href: "/admin/transactions", label: "Transactions", short: "Orders", Icon: ReceiptIndianRupee, badge: "orders", primary: true },
  { href: "/admin/products", label: "Products", short: "Products", Icon: ShoppingBag, primary: true },
  { href: "/admin/gallery", label: "Gallery", short: "Gallery", Icon: Images },
  { href: "/admin/announcements", label: "Announcements", short: "Announce", Icon: Megaphone },
  { href: "/admin/members", label: "Active Members", short: "Members", Icon: Users },
  { href: "/admin/content", label: "Website", short: "Website", Icon: LayoutTemplate },
];

/** Admin-only navigation: top bar on desktop, bottom tab bar (+ "More") on phones. */
export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuth();
  const [counts, setCounts] = useState<Counts>({ joins: 0, messages: 0, orders: 0 });
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLLIElement>(null);
  const closeMore = useCallback(() => setMoreOpen(false), []);
  useClickOutside(moreRef, moreOpen, closeMore);

  // Refresh the badges whenever the admin moves between pages.
  useEffect(() => {
    setMoreOpen(false);
    const supabase = createClient();
    Promise.all([
      supabase.from("join_requests").select("id", { count: "exact", head: true }).or("status.eq.new,payment_status.eq.verifying"),
      supabase.from("messages").select("id", { count: "exact", head: true }).eq("is_read", false),
      // Orders needing action: UPI to verify, or cash not collected yet.
      supabase.from("orders").select("id", { count: "exact", head: true }).in("status", ["verifying", "pending"]),
    ]).then(([j, m, o]) => setCounts({ joins: j.count ?? 0, messages: m.count ?? 0, orders: o.count ?? 0 }));
  }, [pathname]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
    router.refresh();
  };

  const count = (key?: keyof Counts) => (key ? counts[key] : 0);
  const badgeText = (n: number) => (n > 99 ? "99+" : n);
  const secondary = links.filter((l) => !l.primary);
  const secondaryActive = secondary.some((l) => pathname.startsWith(l.href));

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-brand-line bg-brand-card/95 backdrop-blur-md print:hidden">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <Link href="/admin/join-requests" className="flex shrink-0 items-center gap-2">
            <span className="font-display text-2xl tracking-wider">
              KESH <span className="text-brand-red">FITNESS</span>
            </span>
            <span className="bg-brand-red px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">Admin</span>
          </Link>

          <ul className="hidden items-center gap-0.5 lg:flex">
            {links.map(({ href, label, short, Icon, badge }) => {
              const active = pathname.startsWith(href);
              const n = count(badge);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    title={label}
                    className={`flex items-center gap-1.5 rounded-sm px-2.5 py-2 text-[11px] font-semibold uppercase tracking-wider transition xl:text-xs ${
                      active ? "bg-brand-red text-white" : "text-fg/70 hover:bg-fg/5 hover:text-fg"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {/* icons only on small laptops (name in the tooltip), short names on wider screens */}
                    <span className="hidden xl:inline">{short}</span>
                    {!active && n > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-red px-1 text-[10px] font-bold text-white">
                        {badgeText(n)}
                      </span>
                    )}
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
        className="fixed inset-x-0 bottom-0 z-40 border-t border-brand-line bg-brand-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden print:hidden"
      >
        <ul className="grid grid-cols-5">
          {links
            .filter((l) => l.primary)
            .map(({ href, short, Icon, badge }) => {
              const active = pathname.startsWith(href);
              const n = count(badge);
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
                    {n > 0 && (
                      <span className="absolute right-[18%] top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-red px-1 text-[9px] font-bold text-white">
                        {badgeText(n)}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}

          <li ref={moreRef} className="relative">
            <button
              onClick={() => setMoreOpen(!moreOpen)}
              aria-expanded={moreOpen}
              className={`relative flex h-16 w-full flex-col items-center justify-center gap-1 text-[10px] font-semibold uppercase tracking-wider ${
                secondaryActive || moreOpen ? "text-brand-red" : "text-fg/60"
              }`}
            >
              {secondaryActive && <span className="absolute inset-x-3 top-0 h-0.5 bg-brand-red" />}
              <MoreHorizontal className="h-5 w-5" />
              More
            </button>
            {moreOpen && (
              <div className="absolute bottom-full right-2 mb-2 w-52 border border-brand-line bg-brand-card py-1 shadow-2xl">
                {secondary.map(({ href, label, Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-3 px-4 py-3 text-sm ${
                      pathname.startsWith(href) ? "text-brand-red" : "text-fg/80 hover:bg-fg/5"
                    }`}
                  >
                    <Icon className="h-4 w-4" /> {label}
                  </Link>
                ))}
              </div>
            )}
          </li>
        </ul>
      </nav>
    </>
  );
}
