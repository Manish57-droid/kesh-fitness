"use client";
const testimonials = [
  {
    name: "Riya Agarwal",
    role: "Lost 18 kg in 7 months",
    branch: "Bistupur Branch",
    text: "Kesh Fitness changed my life. The trainers here actually care — they track your form, adjust your plan, and celebrate every milestone with you. The equipment is top-notch and always maintained.",
    stars: 5,
  },
  {
    name: "Suresh Pillai",
    role: "Marathon Runner",
    branch: "Sakchi Branch",
    text: "The cardio zone and functional training area at Kesh is unmatched in the city. I've trained at three different gyms before this — nothing comes close. The staff is professional and the environment is clean.",
    stars: 5,
  },
  {
    name: "Ananya Singh",
    role: "Member for 2 years",
    branch: "Telco Branch",
    text: "Joined for the yoga classes and stayed for everything else. The schedule is convenient, the group classes are energetic, and I've genuinely made friends here. Best investment I've made in myself.",
    stars: 5,
  },
  {
    name: "Vikram Nath",
    role: "Gained 12 kg muscle",
    branch: "Mango Branch",
    text: "As a hardgainer I was skeptical, but the personalised plan from my trainer combined with the nutrition consultations made the real difference. I'm finally seeing the results I worked years for.",
    stars: 5,
  },
  {
    name: "Pooja Jha",
    role: "Corporate Member",
    branch: "Bistupur Branch",
    text: "The Pro membership is genuinely worth every rupee. I can visit any branch, which is important for my travel schedule. The facilities are consistent no matter which location I walk into.",
    stars: 5,
  },
  {
    name: "Amit Tiwari",
    role: "Boxing Enthusiast",
    branch: "Sakchi Branch",
    text: "Started boxing six months ago at Kesh. Coach Rahul is exceptional — patient, precise, and motivating. The combat zone has professional equipment you'd only find in specialty gyms elsewhere.",
    stars: 5,
  },
];

export default function Testimonials() {
  return (
    <section
      id="testimonials"
      style={{ padding: "6rem 2rem", background: "#F5F5F5" }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <p className="section-label">Member Stories</p>
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
          }}
        >
          Real People.
          <br />
          Real Results.
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {testimonials.map((t) => (
            <div
              key={t.name}
              style={{
                background: "#fff",
                borderRadius: "12px",
                padding: "2rem",
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
              }}
            >
              <div>
                {"★".repeat(t.stars).split("").map((s, i) => (
                  <span key={i} style={{ color: "#F59E0B", fontSize: "0.9rem" }}>
                    {s}
                  </span>
                ))}
              </div>
              <p
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "0.9rem",
                  color: "#1C1C1E",
                  lineHeight: 1.75,
                  flex: 1,
                }}
              >
                "{t.text}"
              </p>
              <div
                style={{
                  borderTop: "1px solid #F0F0F0",
                  paddingTop: "1rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <p
                    style={{
                      fontFamily: "'Syne', sans-serif",
                      fontSize: "0.9rem",
                      fontWeight: 700,
                      color: "#0A0A0A",
                    }}
                  >
                    {t.name}
                  </p>
                  <p
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "0.75rem",
                      color: "#6B6B6B",
                      marginTop: "0.1rem",
                    }}
                  >
                    {t.role}
                  </p>
                </div>
                <span
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "0.68rem",
                    color: "#2563EB",
                    fontWeight: 600,
                    letterSpacing: "0.04em",
                  }}
                >
                  {t.branch}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
