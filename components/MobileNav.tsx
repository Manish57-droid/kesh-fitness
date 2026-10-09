import { MapPin, MessageSquare, ShoppingBag, Tag, UserPlus } from "lucide-react";

const items = [
  { href: "/#plans", label: "Plans", Icon: Tag },
  { href: "/#shop", label: "Shop", Icon: ShoppingBag },
  { href: "/#join", label: "Join", Icon: UserPlus, highlight: true },
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
        {items.map(({ href, label, Icon, highlight }) => (
          <li key={href}>
            <a
              href={href}
              className={`flex h-16 flex-col items-center justify-center gap-1 text-[10px] font-semibold uppercase tracking-wider transition ${
                highlight ? "text-brand-red" : "text-fg/60 active:text-brand-red"
              }`}
            >
              {highlight ? (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-red text-white">
                  <Icon className="h-4 w-4" />
                </span>
              ) : (
                <Icon className="h-5 w-5" />
              )}
              {label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
