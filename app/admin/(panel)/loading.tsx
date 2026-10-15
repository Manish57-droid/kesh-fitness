/** Shown instantly while an admin page loads its data, so navigation never looks frozen. */
export default function AdminLoading() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-label="Loading">
      <div className="h-9 w-56 bg-fg/10" />
      <div className="mt-2 h-4 w-80 max-w-full bg-fg/5" />
      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-20 border border-brand-line bg-brand-card" />
        ))}
      </div>
      <div className="mt-6 grid gap-3 lg:grid-cols-2">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-40 border border-brand-line bg-brand-card" />
        ))}
      </div>
    </div>
  );
}
