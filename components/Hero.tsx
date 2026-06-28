"use client";
import { ArrowDown } from "lucide-react";

export default function Hero() {
  return (
    <section
      style={{
        minHeight: "100vh",
        background: "#0A0A0A",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "0 2rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle grid texture */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          pointerEvents: "none",
        }}
      />
      {/* Blue accent glow */}
      <div
        style={{
          position: "absolute",
          top: "20%",
          right: "10%",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          width: "100%",
          position: "relative",
          zIndex: 1,
        }}
      >
        <p
          className="section-label"
          style={{ color: "#2563EB", marginBottom: "1.5rem" }}
        >
          
        </p>
        <h1
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: "clamp(3rem, 8vw, 7rem)",
            fontWeight: 800,
            color: "#FFFFFF",
            lineHeight: 0.95,
            letterSpacing: "-0.03em",
            marginBottom: "2rem",
          }}
        >
          BUILD THE
          <br />
          <span style={{ color: "#2563EB" }}>STRONGEST</span>
          <br />
          VERSION
          <br />
          OF YOU.
        </h1>
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "1.05rem",
            color: "rgba(255,255,255,0.55)",
            maxWidth: 440,
            lineHeight: 1.7,
            marginBottom: "3rem",
            fontWeight: 300,
          }}
        >
          Kesh Fitness — where every rep, every set, and every session brings
          you closer to the person you're working to become.
        </p>

        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <a
            href="#membership"
            style={{
              background: "#2563EB",
              color: "#fff",
              padding: "0.9rem 2rem",
              borderRadius: "6px",
              fontSize: "0.9rem",
              fontWeight: 600,
              textDecoration: "none",
              fontFamily: "'Inter', sans-serif",
              letterSpacing: "0.02em",
              transition: "transform 0.2s, background 0.2s",
              display: "inline-block",
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLElement).style.transform = "translateY(-2px)";
              (e.target as HTMLElement).style.background = "#1D4ED8";
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.transform = "translateY(0)";
              (e.target as HTMLElement).style.background = "#2563EB";
            }}
          >
            Start Your Journey
          </a>
          <a
            href="#equipment"
            style={{
              border: "1px solid rgba(255,255,255,0.2)",
              color: "#fff",
              padding: "0.9rem 2rem",
              borderRadius: "6px",
              fontSize: "0.9rem",
              fontWeight: 500,
              textDecoration: "none",
              fontFamily: "'Inter', sans-serif",
              transition: "border-color 0.2s",
              display: "inline-block",
            }}
            onMouseEnter={(e) =>
              ((e.target as HTMLElement).style.borderColor = "rgba(255,255,255,0.6)")
            }
            onMouseLeave={(e) =>
              ((e.target as HTMLElement).style.borderColor = "rgba(255,255,255,0.2)")
            }
          >
            Explore Facilities
          </a>
        </div>

        {/* Stats row */}
        <div
          style={{
            display: "flex",
            gap: "3rem",
            marginTop: "5rem",
            flexWrap: "wrap",
          }}
        >
          {[
            { num: "5,000+", label: "Active Members" },
            { num: "8", label: "City Branches" },
            { num: "50+", label: "Expert Trainers" },
            { num: "6 AM–11 PM", label: "Daily Hours" },
          ].map((stat) => (
            <div key={stat.label}>
              <p
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: "2rem",
                  fontWeight: 700,
                  color: "#fff",
                  lineHeight: 1,
                }}
              >
                {stat.num}
              </p>
              <p
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "0.75rem",
                  color: "rgba(255,255,255,0.4)",
                  marginTop: "0.3rem",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        style={{
          position: "absolute",
          bottom: "2.5rem",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.5rem",
          color: "rgba(255,255,255,0.3)",
          animation: "bounce 2s infinite",
        }}
      >
        <ArrowDown size={18} />
      </div>
      
    </section>
  );
}
