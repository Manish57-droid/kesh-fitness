"use client";
const branches = [
  {
    name: "Kesh Fitness – Sakchi",
    area: "Sakchi, Jamshedpur",
    address: "12, Main Road, Sakchi, Jamshedpur – 831001",
    phone: "+91 98765 43210",
    email: "sakchi@keshfitness.in",
    features: ["Parking", "Swimming Pool", "Sauna", "Café"],
    flagship: true,
  },
  {
    name: "Kesh Fitness – Bistupur",
    area: "Bistupur, Jamshedpur",
    address: "45, Court Road, Bistupur, Jamshedpur – 831001",
    phone: "+91 98765 43211",
    email: "bistupur@keshfitness.in",
    features: ["Parking", "Boxing Ring", "Café"],
    flagship: false,
  },
  {
    name: "Kesh Fitness – Telco",
    area: "Telco Colony, Jamshedpur",
    address: "8, Tata Motors Road, Telco, Jamshedpur – 831004",
    phone: "+91 98765 43212",
    email: "telco@keshfitness.in",
    features: ["Parking", "Yoga Studio"],
    flagship: false,
  },
  {
    name: "Kesh Fitness – Mango",
    area: "Mango, Jharkhand",
    address: "77, NH-33, Mango, Jamshedpur – 831012",
    phone: "+91 98765 43213",
    email: "mango@keshfitness.in",
    features: ["Parking", "Sauna", "Juice Bar"],
    flagship: false,
  },
];

export default function Branches() {
  return (
    <section
      id="branches"
      style={{ padding: "6rem 2rem", background: "#F5F5F5" }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <p className="section-label">Our Locations</p>
        <span className="divider" />
        <h2
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: "clamp(2rem, 4vw, 3.2rem)",
            fontWeight: 700,
            color: "#0A0A0A",
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            marginBottom: "3.5rem",
            maxWidth: 500,
          }}
        >
          A Branch Near You, Wherever You Are.
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {branches.map((b) => (
            <div
              key={b.name}
              style={{
                background: "#fff",
                borderRadius: "12px",
                padding: "2rem",
                position: "relative",
                border: b.flagship ? "2px solid #2563EB" : "1px solid #E5E7EB",
                transition: "box-shadow 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.07)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.boxShadow = "none")
              }
            >
              {b.flagship && (
                <span
                  style={{
                    position: "absolute",
                    top: "1rem",
                    right: "1rem",
                    background: "#2563EB",
                    color: "#fff",
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    padding: "0.25rem 0.6rem",
                    borderRadius: "4px",
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  Flagship
                </span>
              )}
              <h3
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: "1.1rem",
                  fontWeight: 700,
                  color: "#0A0A0A",
                  marginBottom: "0.3rem",
                }}
              >
                {b.area}
              </h3>
              <p
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "0.82rem",
                  color: "#6B6B6B",
                  marginBottom: "1.25rem",
                  lineHeight: 1.5,
                }}
              >
                {b.address}
              </p>
              <div style={{ marginBottom: "1.25rem" }}>
                <p
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "0.82rem",
                    color: "#1C1C1E",
                    marginBottom: "0.25rem",
                  }}
                >
                  📞 {b.phone}
                </p>
                <p
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "0.82rem",
                    color: "#1C1C1E",
                  }}
                >
                  ✉️ {b.email}
                </p>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                {b.features.map((f) => (
                  <span
                    key={f}
                    style={{
                      background: "#F5F5F5",
                      border: "1px solid #E5E7EB",
                      borderRadius: "4px",
                      fontSize: "0.72rem",
                      fontWeight: 500,
                      color: "#6B6B6B",
                      padding: "0.2rem 0.55rem",
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
