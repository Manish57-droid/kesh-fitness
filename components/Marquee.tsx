const words = ["Strength", "Discipline", "Consistency", "Power", "Sweat", "Invincible"];

export default function Marquee() {
  const row = [...words, ...words];
  return (
    <div className="overflow-hidden border-y border-brand-redDark bg-brand-red py-4" aria-hidden>
      <div className="flex w-max animate-marquee">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex">
            {row.map((w, i) => (
              <span key={i} className="flex items-center font-display text-3xl tracking-widest md:text-4xl">
                <span className="px-6">{w}</span>
                <span className="text-black/40">✦</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
