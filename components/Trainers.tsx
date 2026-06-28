"use client";
const trainers = [
  {
    name: "Arjun Mehta",
    role: "Head of Strength & Conditioning",
    exp: "12 years",
    certs: "NSCA-CSCS, CPT",
    speciality: "Powerlifting, Athletic Performance",
    emoji: "🏋️‍♂️",
  },
  {
    name: "Priya Sharma",
    role: "Yoga & Flexibility Coach",
    exp: "9 years",
    certs: "RYT-500, Pilates Certified",
    speciality: "Yoga, Rehabilitation, Pilates",
    emoji: "🧘‍♀️",
  },
  {
    name: "Rahul Das",
    role: "Boxing & Combat Trainer",
    exp: "10 years",
    certs: "AIBA Level-2 Coach",
    speciality: "Boxing, MMA, Conditioning",
    emoji: "🥊",
  },
  {
    name: "Sneha Verma",
    role: "Nutrition & Wellness Coach",
    exp: "7 years",
    certs: "ISSA Nutritionist, ACE CPT",
    speciality: "Body Recomposition, Diet Planning",
    emoji: "🥗",
  },
  {
    name: "Kiran Joshi",
    role: "Cardio & HIIT Specialist",
    exp: "8 years",
    certs: "ACE CPT, TRX Certified",
    speciality: "HIIT, Endurance, Functional Training",
    emoji: "⚡",
  },
  {
    name: "Deepak Nair",
    role: "Sports Performance Coach",
    exp: "11 years",
    certs: "NSCA-CSCS, Sports Science MSc",
    speciality: "Speed, Agility, Sports-Specific Training",
    emoji: "🏃‍♂️",
  },
];

export default function Trainers() {
  return (
    <section id="trainers" style={{ padding: "6rem 2rem", background: "#fff" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <p className="section-label">Expert Team</p>
        <span className="divider" />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            flexWrap: "wrap",
            gap: "1.5rem",
            marginBottom: "3.5rem",
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
            Guided by People
            <br />
            Who've Done It.
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
            Our trainers aren't just certified — they're athletes, coaches, and
            practitioners who live the lifestyle they teach.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {trainers.map((t) => (
            <div
              key={t.name}
              style={{
                display: "flex",
                gap: "1.25rem",
                padding: "1.75rem",
                border: "1px solid #E5E7EB",
                borderRadius: "12px",
                background: "#fff",
                transition: "box-shadow 0.2s, transform 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.07)";
                e.currentTarget.style.transform = "translateY(-3px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "12px",
                  background: "#F5F5F5",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.8rem",
                }}
              >
                {t.emoji}
              </div>
              <div>
                <h3
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    fontSize: "1rem",
                    fontWeight: 700,
                    color: "#0A0A0A",
                    marginBottom: "0.15rem",
                  }}
                >
                  {t.name}
                </h3>
                <p
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "0.78rem",
                    color: "#2563EB",
                    fontWeight: 600,
                    marginBottom: "0.5rem",
                  }}
                >
                  {t.role}
                </p>
                <p
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "0.78rem",
                    color: "#6B6B6B",
                    marginBottom: "0.3rem",
                  }}
                >
                  {t.speciality}
                </p>
                <p
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "0.72rem",
                    color: "#9CA3AF",
                  }}
                >
                  {t.exp} exp · {t.certs}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
