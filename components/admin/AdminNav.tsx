"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown,
  ClipboardList,
  ExternalLink,
  Images,
  Inbox,
  LayoutTemplate,
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
type NavLink = { href: string; label: string; short: string; Icon: typeof Inbox; badge?: keyof Counts };

/** Always visible in the navbar. */
const mainLinks: NavLink[] = [
  { href: "/admin/join-requests", label: "Join Requests", short: "Joins", Icon: ClipboardList, badge: "joins" },
  { href: "/admin/transactions", label: "Transactions", short: "Transactions", Icon: ReceiptIndianRupee, badge: "orders" },
  { href: "/admin/products", label: "Products", short: "Products", Icon: ShoppingBag },
  { href: "/admin/members", label: "Active Members", short: "Members", Icon: Users },
];

/** Inside the "More" dropdown. */
const moreLinks: NavLink[] = [
  { href: "/admin/messages", label: "Inbox", short: "Inbox", Icon: Inbox, badge: "messages" },
  { href: "/admin/gallery", label: "Gallery", short: "Gallery", Icon: Images },
  { href: "/admin/announcements", label: "Announcements", short: "Announce", Icon: Megaphone },
  { href: "/admin/content", label: "Website", short: "Website", Icon: LayoutTemplate },
];

/** Admin-only navigation: top bar with a "More" dropdown on desktop, bottom tab bar on phones. */
export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuth();
  const [counts, setCounts] = useState<Counts>({ joins: 0, messages: 0, orders: 0 });
  // Separate states: each menu closes on clicks outside itself only.
  const [desktopOpen, setDesktopOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const desktopMore = useRef<HTMLDivElement>(null);
  const mobileMore = useRef<HTMLLIElement>(null);
  const closeDesktop = useCallback(() => setDesktopOpen(false), []);
  const closeMobile = useCallback(() => setMobileOpen(false), []);
  useClickOutside(desktopMore, desktopOpen, closeDesktop);
  useClickOutside(mobileMore, mobileOpen, closeMobile);

  // Refresh the badges whenever the admin moves between pages.
  useEffect(() => {
    setDesktopOpen(false);
    setMobileOpen(false);
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
  const moreActive = moreLinks.some((l) => pathname.startsWith(l.href));
  const moreCount = moreLinks.reduce((n, l) => n + count(l.badge), 0);

  const Badge = ({ n, small = false }: { n: number; small?: boolean }) =>
    n > 0 ? (
      <span
        className={`flex items-center justify-center rounded-full bg-brand-red font-bold text-white ${
          small ? "h-4 min-w-4 px-1 text-[9px]" : "h-5 min-w-5 px-1 text-[10px]"
        }`}
      >
        {badgeText(n)}
      </span>
    ) : null;

  const dropdown = (className: string) => (
    <div className={`w-56 border border-brand-line bg-brand-card py-1 shadow-2xl ${className}`}>
      {moreLinks.map(({ href, label, Icon, badge }) => (
        <Link
          key={href}
          href={href}
          className={`flex items-center gap-3 px-4 py-3 text-sm transition ${
            pathname.startsWith(href) ? "bg-brand-red/10 text-brand-red" : "text-fg/80 hover:bg-fg/5 hover:text-fg"
          }`}
        >
          <Icon className="h-4 w-4" />
          <span className="flex-1">{label}</span>
          <Badge n={count(badge)} />
        </Link>
      ))}
    </div>
  );

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

          <div className="hidden items-center gap-1 lg:flex">
            {mainLinks.map(({ href, label, short, Icon, badge }) => {
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 rounded-sm px-3 py-2 text-xs font-semibold uppercase tracking-wider transition ${
                    active ? "bg-brand-red text-white" : "text-fg/70 hover:bg-fg/5 hover:text-fg"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="xl:hidden">{short}</span>
                  <span className="hidden xl:inline">{label}</span>
                  {!active && <Badge n={count(badge)} />}
                </Link>
              );
            })}

            <div ref={desktopMore} className="relative">
              <button
                onClick={() => setDesktopOpen(!desktopOpen)}
                aria-expanded={desktopOpen}
                aria-haspopup="menu"
                className={`flex items-center gap-2 rounded-sm px-3 py-2 text-xs font-semibold uppercase tracking-wider transition ${
                  moreActive ? "bg-brand-red text-white" : "text-fg/70 hover:bg-fg/5 hover:text-fg"
                }`}
              >
                <MoreHorizontal className="h-4 w-4" />
                More
                {!moreActive && <Badge n={moreCount} />}
                <ChevronDown className={`h-3.5 w-3.5 transition ${desktopOpen ? "rotate-180" : ""}`} />
              </button>
              {desktopOpen && dropdown("absolute right-0 top-full mt-2")}
            </div>
          </div>

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
          {mainLinks.map(({ href, short, Icon, badge }) => {
            const active = pathname.startsWith(href);
            const n = count(badge);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold tracking-normal transition ${
                    active ? "text-brand-red" : "text-fg/60"
                  }`}
                >
                  {active && <span className="absolute inset-x-3 top-0 h-0.5 bg-brand-red" />}
                  <Icon className="h-5 w-5" />
                  {short}
                  {n > 0 && (
                    <span className="absolute right-[14%] top-2">
                      <Badge n={n} small />
                    </span>
                  )}
                </Link>
              </li>
            );
          })}

          <li ref={mobileMore} className="relative">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-expanded={mobileOpen}
              className={`relative flex h-16 w-full flex-col items-center justify-center gap-1 text-[11px] font-semibold tracking-normal ${
                moreActive || mobileOpen ? "text-brand-red" : "text-fg/60"
              }`}
            >
              {moreActive && <span className="absolute inset-x-3 top-0 h-0.5 bg-brand-red" />}
              <MoreHorizontal className="h-5 w-5" />
              More
              {moreCount > 0 && (
                <span className="absolute right-[14%] top-2">
                  <Badge n={moreCount} small />
                </span>
              )}
            </button>
            {mobileOpen && dropdown("absolute bottom-full right-2 mb-2")}
          </li>
        </ul>
      </nav>
    </>
  );
}
