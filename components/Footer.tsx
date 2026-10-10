import Link from "next/link";
import { Instagram, Mail, Youtube } from "lucide-react";
import { defaultContent, instagramUrl, type GymDetails } from "@/lib/content";

export default function Footer({ gym = defaultContent.gym }: { gym?: GymDetails }) {
  const socials = [
    { href: instagramUrl(gym), label: "Instagram", Icon: Instagram },
    ...(gym.youtube ? [{ href: gym.youtube, label: "YouTube", Icon: Youtube }] : []),
    ...(gym.email ? [{ href: `mailto:${gym.email}`, label: "Email", Icon: Mail }] : []),
  ];
  return (
    <footer className="border-t border-brand-line bg-brand-black print:hidden">
      <div className="container-x flex flex-col items-center justify-between gap-6 py-10 text-center md:flex-row md:text-left">
        <div>
          <p className="font-display text-3xl tracking-wider">
            KESH <span className="text-brand-red">FITNESS</span>
          </p>
          <p className="mt-1 text-xs text-brand-muted">
            {gym.tagline} · {gym.address}
          </p>
        </div>

        <div className="flex gap-3">
          {socials.map(({ href, label, Icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noreferrer"
              aria-label={label}
              className="flex h-10 w-10 items-center justify-center border border-brand-line transition hover:border-brand-red hover:bg-brand-red hover:text-white"
            >
              <Icon className="h-4 w-4" />
            </a>
          ))}
        </div>

        <p className="text-xs text-brand-muted">
          © {new Date().getFullYear()} {gym.name}. All rights reserved.
          <span className="mx-2">·</span>
          <Link href="/admin/login" className="hover:text-fg">
            Admin
          </Link>
        </p>
      </div>
    </footer>
  );
}
