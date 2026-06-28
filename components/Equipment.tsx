"use client";
const equipment = [
  {
    icon: "🏋️",
    name: "Free Weights",
    desc: "Full range of dumbbells (2–100 kg), barbells, EZ bars, and weight plates from top brands.",
  },
  {
    icon: "🚴",
    name: "Cardio Zone",
    desc: "Treadmills, stationary bikes, ellipticals, rowing machines, stair climbers — 40+ units.",
  },
  {
    icon: "💪",
    name: "Strength Machines",
    desc: "Cable machines, Smith machines, leg press, chest press, lat pulldown, and more.",
  },
  {
    icon: "🤸",
    name: "Functional Training",
    desc: "Battle ropes, kettlebells, TRX suspension, resistance bands, plyometric boxes.",
  },
  {
    icon: "🧘",
    name: "Yoga & Flexibility",
    desc: "Dedicated studio for yoga, pilates, and stretching sessions with foam rollers and mats.",
  },
  {
    icon: "🥊",
    name: "Combat & Boxing",
    desc: "Heavy bags, speed bags, boxing gloves, a full-size ring for MMA and boxing training.",
  },
  {
    icon: "🏊",
    name: "Recovery Zone",
    desc: "Steam rooms, saunas, ice baths, and massage chairs for post-workout recovery.",
  },
  {
    icon: "📊",
    name: "Performance Tracking",
    desc: "In-body composition scanners and digital fitness assessments to track your progress.",
  },
];

export default function Equipment() {
  return (
    <section
      id="equipment"
      style={{
        padding: "6rem 2rem",
        background: "#fff",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <p className="section-label">What We Offer</p>
        <span className="divider" />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: "3.5rem",
            flexWrap: "wrap",
            gap: "1rem",
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
              maxWidth: 480,
            }}
          >
            Every Tool You Need to Train Seriously.
          </h2>
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "0.95rem",
              color: "#6B6B6B",
              maxWidth: 340,
              lineHeight: 1.7,
            }}
          >
            From your first session to elite-level performance — our equipment
            covers every discipline and every goal.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {equipment.map((item) => (
            <div
              key={item.name}
              style={{
                background: "#F5F5F5",
                borderRadius: "12px",
                padding: "2rem",
                transition: "transform 0.2s, box-shadow 0.2s",
                cursor: "default",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget;
                el.style.transform = "translateY(-4px)";
                el.style.boxShadow = "0 12px 32px rgba(0,0,0,0.08)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget;
                el.style.transform = "translateY(0)";
                el.style.boxShadow = "none";
              }}
            >
              <span style={{ fontSize: "2rem", display: "block", marginBottom: "1rem" }}>
                {item.icon}
              </span>
              <h3
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: "1.1rem",
                  fontWeight: 700,
                  color: "#0A0A0A",
                  marginBottom: "0.6rem",
                }}
              >
                {item.name}
              </h3>
              <p
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "0.875rem",
                  color: "#6B6B6B",
                  lineHeight: 1.65,
                }}
              >
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
