"use client";
const schedule = [
  { day: "Monday", hours: "6:00 AM – 11:00 PM", open: true },
  { day: "Tuesday", hours: "6:00 AM – 11:00 PM", open: true },
  { day: "Wednesday", hours: "6:00 AM – 11:00 PM", open: true },
  { day: "Thursday", hours: "6:00 AM – 11:00 PM", open: true },
  { day: "Friday", hours: "6:00 AM – 11:00 PM", open: true },
  { day: "Saturday", hours: "6:00 AM – 10:00 PM", open: true },
  { day: "Sunday", hours: "7:00 AM – 8:00 PM", open: true },
];

const classes = [
  { name: "Morning Yoga", time: "7:00 AM", duration: "60 min", days: "Mon, Wed, Fri" },
  { name: "HIIT Blast", time: "8:00 AM", duration: "45 min", days: "Tue, Thu, Sat" },
  { name: "Strength & Power", time: "6:00 PM", duration: "60 min", days: "Mon–Fri" },
  { name: "Zumba", time: "7:00 PM", duration: "50 min", days: "Tue, Thu" },
  { name: "Boxing Fundamentals", time: "6:30 AM", duration: "60 min", days: "Mon, Wed, Fri" },
  { name: "Pilates Core", time: "9:00 AM", duration: "45 min", days: "Sat, Sun" },
];

export default function Timings() {
  const today = new Date().toLocaleDateString("en-US", { weekday: "long" });

  return (
    <section id="timings" style={{ padding: "6rem 2rem", background: "#fff" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <p className="section-label">Hours & Schedule</p>
        <span className="divider" />
        <h2
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: "clamp(2rem, 4vw, 3.2rem)",
            fontWeight: 700,
            color: "#0A0A0A",
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
            marginBottom: "3.5rem",
          }}
        >
          Always Open When You're Ready.
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "3rem",
          }}
          className="grid-cols-timing"
        >
          {/* Hours table */}
          <div>
            <h3
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: "1.2rem",
                fontWeight: 700,
                color: "#0A0A0A",
                marginBottom: "1.25rem",
              }}
            >
              Gym Hours
            </h3>
            <div
              style={{
                border: "1px solid #E5E7EB",
                borderRadius: "12px",
                overflow: "hidden",
              }}
            >
              {schedule.map((s, i) => {
                const isToday = s.day === today;
                return (
                  <div
                    key={s.day}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "0.9rem 1.5rem",
                      background: isToday ? "#EFF6FF" : i % 2 === 0 ? "#fff" : "#FAFAFA",
                      borderBottom: i < schedule.length - 1 ? "1px solid #E5E7EB" : "none",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: "0.88rem",
                        fontWeight: isToday ? 600 : 400,
                        color: isToday ? "#2563EB" : "#1C1C1E",
                      }}
                    >
                      {s.day}
                      {isToday && (
                        <span
                          style={{
                            marginLeft: "0.5rem",
                            fontSize: "0.65rem",
                            background: "#2563EB",
                            color: "#fff",
                            padding: "0.1rem 0.4rem",
                            borderRadius: "3px",
                            fontWeight: 700,
                            letterSpacing: "0.06em",
                          }}
                        >
                          TODAY
                        </span>
                      )}
                    </span>
                    <span
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: "0.88rem",
                        color: "#6B6B6B",
                      }}
                    >
                      {s.hours}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Classes */}
          <div>
            <h3
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: "1.2rem",
                fontWeight: 700,
                color: "#0A0A0A",
                marginBottom: "1.25rem",
              }}
            >
              Group Classes
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {classes.map((c) => (
                <div
                  key={c.name}
                  style={{
                    background: "#F5F5F5",
                    borderRadius: "10px",
                    padding: "1rem 1.25rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "0.5rem",
                  }}
                >
                  <div>
                    <p
                      style={{
                        fontFamily: "'Syne', sans-serif",
                        fontSize: "0.95rem",
                        fontWeight: 700,
                        color: "#0A0A0A",
                      }}
                    >
                      {c.name}
                    </p>
                    <p
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: "0.78rem",
                        color: "#6B6B6B",
                        marginTop: "0.15rem",
                      }}
                    >
                      {c.days}
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: "0.88rem",
                        fontWeight: 600,
                        color: "#2563EB",
                      }}
                    >
                      {c.time}
                    </p>
                    <p
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: "0.75rem",
                        color: "#6B6B6B",
                      }}
                    >
                      {c.duration}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      
    </section>
  );
}
