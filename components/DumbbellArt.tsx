/** Large decorative dumbbell outline for empty areas. Colour comes from `text-*` classes. */
export default function DumbbellArt({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 240 100"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinejoin="round"
      aria-hidden
      className={`pointer-events-none select-none ${className}`}
    >
      {/* bar */}
      <rect x="62" y="44" width="116" height="12" rx="3" />
      {/* inner plates */}
      <rect x="40" y="14" width="22" height="72" rx="5" />
      <rect x="178" y="14" width="22" height="72" rx="5" />
      {/* outer plates */}
      <rect x="22" y="26" width="18" height="48" rx="4" />
      <rect x="200" y="26" width="18" height="48" rx="4" />
      {/* end caps */}
      <rect x="10" y="42" width="12" height="16" rx="3" />
      <rect x="218" y="42" width="12" height="16" rx="3" />
      {/* grip knurling */}
      <path d="M100 44v12M110 44v12M120 44v12M130 44v12M140 44v12" strokeWidth="1.5" />
    </svg>
  );
}
