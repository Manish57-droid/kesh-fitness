"use client";
const items = [
  { label: "Weight Room", emoji: "🏋️", bg: "#0A0A0A", color: "#fff" },
  { label: "Cardio Zone", emoji: "🚴", bg: "#2563EB", color: "#fff" },
  { label: "Boxing Ring", emoji: "🥊", bg: "#1C1C1E", color: "#fff" },
  { label: "Yoga Studio", emoji: "🧘", bg: "#F5F5F5", color: "#0A0A0A" },
  { label: "Recovery Area", emoji: "🛁", bg: "#EFF6FF", color: "#2563EB" },
  { label: "Juice Bar", emoji: "🥤", bg: "#F5F5F5", color: "#0A0A0A" },
  { label: "Functional Zone", emoji: "⚡", bg: "#0A0A0A", color: "#fff" },
  { label: "Locker Rooms", emoji: "🔐", bg: "#2563EB", color: "#fff" },
];

export default function Gallery() {
  return (
    <section id="gallery" style={{ padding: "6rem 2rem", background: "#fff" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <p className="section-label">Facility Gallery</p>
        <span className="divider" />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            flexWrap: "wrap",
            gap: "1.5rem",
            marginBottom: "3rem",
          }}
        >
          <h2
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: "clamp(2rem, 4vw, 3.2rem)",
              fontWeight: 700,
              color: "#0A0A0A",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
            }}
          >
            See It to
            <br />
            Believe It.
          </h2>
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "0.9rem",
              color: "#6B6B6B",
              maxWidth: 300,
              lineHeight: 1.7,
            }}
          >
            Our facilities are designed to make every session feel premium — because
            your environment shapes your performance.
          </p>
        </div>

        {/* Masonry-style grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gridTemplateRows: "repeat(2, 200px)",
            gap: "1rem",
          }}
          className="gallery-grid"
        >
          {items.map((item, i) => (
            <div
              key={item.label}
              style={{
                background: item.bg,
                borderRadius: "12px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.75rem",
                cursor: "pointer",
                transition: "transform 0.25s, box-shadow 0.25s",
                gridColumn:
                  i === 0 ? "span 2" : i === 5 ? "span 2" : "span 1",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.02)";
                e.currentTarget.style.boxShadow = "0 16px 48px rgba(0,0,0,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <span style={{ fontSize: "2.5rem" }}>{item.emoji}</span>
              <span
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: "0.9rem",
                  fontWeight: 700,
                  color: item.color,
                  letterSpacing: "0.02em",
                }}
              >
                {item.label}
              </span>
            </div>
          ))}
        </div>

        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "0.8rem",
            color: "#9CA3AF",
            textAlign: "center",
            marginTop: "1.5rem",
          }}
        >
          Photo gallery coming soon — visit any branch for a free tour.
        </p>
      </div>

      
    </section>
  );
}
