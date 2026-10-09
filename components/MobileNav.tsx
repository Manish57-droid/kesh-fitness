import { CalendarDays, Home, MapPin, MessageSquare, Tag } from "lucide-react";

const items = [
  { href: "/#top", label: "Home", Icon: Home },
  { href: "/#plans", label: "Plans", Icon: Tag },
  { href: "/#planner", label: "Planner", Icon: CalendarDays },
  { href: "/#contact", label: "Message", Icon: MessageSquare },
  { href: "/#visit", label: "Visit", Icon: MapPin },
];

/** Bottom tab bar for phones; hidden on large screens. */
export default function MobileNav() {
  return (
    <nav
      aria-label="Quick navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-brand-line bg-brand-black/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
    >
      <ul className="grid grid-cols-5">
        {items.map(({ href, label, Icon }) => (
          <li key={href}>
            <a
              href={href}
              className="flex h-16 flex-col items-center justify-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-fg/60 transition active:text-brand-red"
            >
              <Icon className="h-5 w-5" />
              {label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
