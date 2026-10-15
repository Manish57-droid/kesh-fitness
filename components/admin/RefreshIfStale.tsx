"use client";
import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

// Older than this means the page came from the browser's page cache (next.config.js staleTimes).
const STALE_AFTER_MS = 10_000;

/**
 * Admin pages are kept in the browser for a few minutes, so going back to one is instant.
 * When a kept copy is shown, this quietly fetches fresh data and swaps it in.
 */
export default function RefreshIfStale({ renderedAt }: { renderedAt: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (Date.now() - renderedAt > STALE_AFTER_MS) startTransition(() => router.refresh());
  }, [renderedAt, router]);

  if (!pending) return null;
  return (
    <p
      role="status"
      className="fixed right-4 top-20 z-40 flex items-center gap-1.5 bg-brand-card/95 px-3 py-1.5 text-xs text-brand-muted shadow ring-1 ring-brand-line backdrop-blur print:hidden lg:top-24"
    >
      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Updating…
    </p>
  );
}
