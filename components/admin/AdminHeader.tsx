/** Page title used at the top of each admin page. */
export default function AdminHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6 md:mb-8">
      <h1 className="font-display text-4xl tracking-wide md:text-5xl">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-brand-muted">{subtitle}</p>}
    </div>
  );
}
