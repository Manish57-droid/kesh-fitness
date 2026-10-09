"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { joinHref } from "@/lib/site";
import ThemeToggle from "./ThemeToggle";
import UserMenu from "./auth/UserMenu";
import NotificationBell from "./NotificationBell";
import { useAuth } from "./auth/AuthProvider";

const links = [
  { label: "Programs", href: "/#programs" },
  { label: "Planner", href: "/#planner" },
  { label: "Plans", href: "/#plans" },
  { label: "Shop", href: "/#shop" },
  { label: "Join", href: "/#join" },
  { label: "Contact", href: "/#contact" },
  { label: "Visit", href: "/#visit" },
];

/** `solid` keeps the background visible at the top of the page (for inner pages). */
export default function Navbar({ solid = false }: { solid?: boolean }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        solid || scrolled || open
          ? "border-b border-brand-line bg-brand-black/90 backdrop-blur-md"
          : "bg-transparent"
      }`}
    >
      <nav className="container-x flex h-16 items-center justify-between gap-4 md:h-20">
        <Link href="/" className="shrink-0 font-display text-xl tracking-wider min-[400px]:text-2xl sm:text-3xl">
          KESH <span className="text-brand-red">FITNESS</span>
        </Link>

        <ul className="hidden items-center gap-5 lg:flex xl:gap-7">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="text-sm font-medium uppercase tracking-wider text-fg/70 transition hover:text-fg"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <ThemeToggle />
          <NotificationBell />
          <UserMenu />
          {!user && (
            <a href={joinHref} className="btn-primary btn-sm hidden xl:inline-flex">
              Join Now
            </a>
          )}
          <button
            onClick={() => setOpen(!open)}
            className="-mr-2 flex h-11 w-11 items-center justify-center lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="border-t border-brand-line lg:hidden">
          <ul className="container-x flex flex-col py-4">
            {links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block py-3 font-display text-2xl tracking-wider text-fg/80 hover:text-brand-red"
                >
                  {l.label}
                </a>
              </li>
            ))}
            <li className="pt-3">
              <a href={joinHref} className="btn-primary w-full">
                Join Now
              </a>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
