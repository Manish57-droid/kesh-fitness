"use client";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { joinHref } from "@/lib/site";

const links = [
  { label: "About", href: "#about" },
  { label: "Programs", href: "#programs" },
  { label: "Coach", href: "#coach" },
  { label: "Plans", href: "#plans" },
  { label: "Gallery", href: "#gallery" },
  { label: "Visit", href: "#visit" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled || open
          ? "border-b border-brand-line bg-brand-black/90 backdrop-blur-md"
          : "bg-transparent"
      }`}
    >
      <nav className="container-x flex h-16 items-center justify-between md:h-20">
        <a href="#top" className="font-display text-3xl tracking-wider">
          KESH <span className="text-brand-red">FITNESS</span>
        </a>

        <ul className="hidden items-center gap-8 lg:flex">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="text-sm font-medium uppercase tracking-wider text-white/70 transition hover:text-white"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <a href={joinHref} target="_blank" rel="noreferrer" className="btn-primary hidden lg:inline-flex">
          Join Now
        </a>

        <button
          onClick={() => setOpen(!open)}
          className="p-2 lg:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-brand-line lg:hidden">
          <ul className="container-x flex flex-col py-4">
            {links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block py-3 font-display text-2xl tracking-wider text-white/80 hover:text-brand-red"
                >
                  {l.label}
                </a>
              </li>
            ))}
            <li className="pt-3">
              <a href={joinHref} target="_blank" rel="noreferrer" className="btn-primary w-full">
                Join Now
              </a>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
