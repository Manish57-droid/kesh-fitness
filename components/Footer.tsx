"use client";
export default function Footer() {
  return (
    <footer style={{ background: "#0A0A0A", padding: "4rem 2rem 2rem" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr 1fr",
            gap: "3rem",
            paddingBottom: "3rem",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
          className="footer-grid"
        >
          {/* Brand */}
          <div>
            <span
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: "1.5rem",
                fontWeight: 800,
                color: "#fff",
                letterSpacing: "-0.02em",
                display: "block",
                marginBottom: "1rem",
              }}
            >
              KESH <span style={{ color: "#2563EB" }}>FITNESS</span>
            </span>
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.85rem",
                color: "rgba(255,255,255,0.4)",
                lineHeight: 1.7,
                maxWidth: 280,
              }}
            >
              Built for people who take their health seriously. Premium gyms,
              expert coaching, and a community that shows up every day.
            </p>
          </div>

          {/* Links */}
          {[
            {
              title: "Facilities",
              links: ["Equipment", "Classes", "Recovery Zone", "Boxing", "Yoga"],
            },
            {
              title: "Membership",
              links: ["Starter Plan", "Pro Plan", "Elite Plan", "Corporate", "Student"],
            },
            {
              title: "Company",
              links: ["About Us", "Trainers", "Branches", "Careers", "Contact"],
            },
          ].map((col) => (
            <div key={col.title}>
              <p
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.3)",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  marginBottom: "1.25rem",
                }}
              >
                {col.title}
              </p>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: "0.85rem",
                        color: "rgba(255,255,255,0.5)",
                        textDecoration: "none",
                        transition: "color 0.2s",
                      }}
                      onMouseEnter={(e) =>
                        ((e.target as HTMLElement).style.color = "#fff")
                      }
                      onMouseLeave={(e) =>
                        ((e.target as HTMLElement).style.color = "rgba(255,255,255,0.5)")
                      }
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div
          style={{
            paddingTop: "2rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "0.78rem",
              color: "rgba(255,255,255,0.25)",
            }}
          >
            © {new Date().getFullYear()} Kesh Fitness. All rights reserved.
          </p>
          <div style={{ display: "flex", gap: "1.5rem" }}>
            {["Privacy Policy", "Terms of Use", "Refund Policy"].map((l) => (
              <a
                key={l}
                href="#"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "0.78rem",
                  color: "rgba(255,255,255,0.25)",
                  textDecoration: "none",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) =>
                  ((e.target as HTMLElement).style.color = "rgba(255,255,255,0.6)")
                }
                onMouseLeave={(e) =>
                  ((e.target as HTMLElement).style.color = "rgba(255,255,255,0.25)")
                }
              >
                {l}
              </a>
            ))}
          </div>
        </div>
      </div>

      
    </footer>
  );
}
