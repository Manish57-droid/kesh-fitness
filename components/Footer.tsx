import { Instagram, Youtube } from "lucide-react";
import { site } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="border-t border-brand-line bg-brand-black">
      <div className="container-x flex flex-col items-center justify-between gap-6 py-10 text-center md:flex-row md:text-left">
        <div>
          <p className="font-display text-3xl tracking-wider">
            KESH <span className="text-brand-red">FITNESS</span>
          </p>
          <p className="mt-1 text-xs text-brand-muted">
            {site.tagline} · {site.address}
          </p>
        </div>

        <div className="flex gap-3">
          {[
            { href: site.instagram, label: "Instagram", Icon: Instagram },
            { href: site.youtube, label: "YouTube", Icon: Youtube },
          ].map(({ href, label, Icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noreferrer"
              aria-label={label}
              className="flex h-10 w-10 items-center justify-center border border-brand-line transition hover:border-brand-red hover:bg-brand-red"
            >
              <Icon className="h-4 w-4" />
            </a>
          ))}
        </div>

        <p className="text-xs text-brand-muted">
          © {new Date().getFullYear()} {site.name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
