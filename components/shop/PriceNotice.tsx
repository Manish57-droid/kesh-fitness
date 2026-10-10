import { Info } from "lucide-react";

/** Reminder that product prices follow market rates. */
export default function PriceNotice({ compact = false }: { compact?: boolean }) {
  return (
    <p className={`flex items-start gap-2 border-l-2 border-amber-500 bg-amber-500/10 text-fg/80 ${compact ? "px-3 py-2 text-xs" : "px-4 py-3 text-sm"}`}>
      <Info className={`shrink-0 text-amber-500 ${compact ? "mt-px h-3.5 w-3.5" : "mt-0.5 h-4 w-4"}`} />
      <span>
        Prices may change with market rates and can differ from prices on online stores. The price shown at checkout is
        what you pay for this order.
      </span>
    </p>
  );
}
