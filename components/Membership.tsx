"use client";
import { Check } from "lucide-react";
import { useState } from "react";

const plans = [
  {
    name: "Starter",
    monthly: 799,
    annual: 649,
    desc: "Everything you need to begin your fitness journey.",
    features: [
      "Access to 1 branch",
      "All gym equipment",
      "Locker access",
      "2 group classes/month",
      "Fitness assessment",
    ],
    cta: "Get Started",
    highlight: false,
  },
  {
    name: "Pro",
    monthly: 1499,
    annual: 1199,
    desc: "The complete package for serious members.",
    features: [
      "Access to all branches",
      "Unlimited group classes",
      "1 personal training session/month",
      "Nutrition consultation",
      "Priority locker",
      "Guest pass (2/month)",
      "Recovery zone access",
    ],
    cta: "Join Pro",
    highlight: true,
  },
  {
    name: "Elite",
    monthly: 2499,
    annual: 1999,
    desc: "For those who want the very best, no compromises.",
    features: [
      "All Pro benefits",
      "4 personal training sessions/month",
      "Dedicated locker",
      "Body composition scans monthly",
      "Supplement discount (15%)",
      "Bring a friend anytime",
      "24/7 branch access",
    ],
    cta: "Go Elite",
    highlight: false,
  },
];

export default function Membership() {
  const [annual, setAnnual] = useState(false);

  return (
    <section
      id="membership"
      style={{ padding: "6rem 2rem", background: "#0A0A0A" }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <p className="section-label" style={{ color: "#2563EB" }}>
          Membership Plans
        </p>
        <span className="divider" />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            flexWrap: "wrap",
            gap: "2rem",
            marginBottom: "3.5rem",
          }}
        >
          <h2
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: "clamp(2rem, 4vw, 3.2rem)",
              fontWeight: 700,
              color: "#fff",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
            }}
          >
            Invest in Yourself.
            <br />
            Cancel Anytime.
          </h2>

          {/* Toggle */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              background: "rgba(255,255,255,0.07)",
              borderRadius: "8px",
              padding: "0.4rem",
            }}
          >
            {["Monthly", "Annual"].map((label) => {
              const isActive = (label === "Annual") === annual;
              return (
                <button
                  key={label}
                  onClick={() => setAnnual(label === "Annual")}
                  style={{
                    background: isActive ? "#2563EB" : "transparent",
                    color: isActive ? "#fff" : "rgba(255,255,255,0.5)",
                    border: "none",
                    borderRadius: "6px",
                    padding: "0.45rem 1rem",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "'Inter', sans-serif",
                    transition: "all 0.2s",
                  }}
                >
                  {label}
                  {label === "Annual" && (
                    <span
                      style={{
                        marginLeft: "0.4rem",
                        fontSize: "0.65rem",
                        background: isActive
                          ? "rgba(255,255,255,0.2)"
                          : "#2563EB",
                        color: "#fff",
                        padding: "0.1rem 0.35rem",
                        borderRadius: "3px",
                      }}
                    >
                      −20%
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "1.5rem",
            alignItems: "start",
          }}
        >
          {plans.map((plan) => (
            <div
              key={plan.name}
              style={{
                background: plan.highlight ? "#2563EB" : "rgba(255,255,255,0.05)",
                border: plan.highlight
                  ? "none"
                  : "1px solid rgba(255,255,255,0.1)",
                borderRadius: "16px",
                padding: "2.5rem 2rem",
                position: "relative",
              }}
            >
              {plan.highlight && (
                <span
                  style={{
                    position: "absolute",
                    top: "-0.7rem",
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "#fff",
                    color: "#2563EB",
                    fontSize: "0.65rem",
                    fontWeight: 800,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    padding: "0.25rem 0.75rem",
                    borderRadius: "20px",
                    fontFamily: "'Inter', sans-serif",
                    whiteSpace: "nowrap",
                  }}
                >
                  Most Popular
                </span>
              )}

              <p
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: "1.2rem",
                  fontWeight: 700,
                  color: plan.highlight ? "#fff" : "#fff",
                  marginBottom: "0.5rem",
                }}
              >
                {plan.name}
              </p>
              <p
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "0.82rem",
                  color: plan.highlight
                    ? "rgba(255,255,255,0.8)"
                    : "rgba(255,255,255,0.45)",
                  marginBottom: "1.75rem",
                  lineHeight: 1.5,
                }}
              >
                {plan.desc}
              </p>

              <div style={{ marginBottom: "2rem" }}>
                <span
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    fontSize: "2.8rem",
                    fontWeight: 800,
                    color: "#fff",
                    lineHeight: 1,
                  }}
                >
                  ₹{annual ? plan.annual : plan.monthly}
                </span>
                <span
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "0.82rem",
                    color: plan.highlight
                      ? "rgba(255,255,255,0.7)"
                      : "rgba(255,255,255,0.4)",
                    marginLeft: "0.4rem",
                  }}
                >
                  /M
                </span>
              </div>

              <ul
                style={{
                  listStyle: "none",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                  marginBottom: "2rem",
                }}
              >
                {plan.features.map((f) => (
                  <li
                    key={f}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "0.6rem",
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "0.85rem",
                      color: plan.highlight
                        ? "rgba(255,255,255,0.9)"
                        : "rgba(255,255,255,0.6)",
                      lineHeight: 1.4,
                    }}
                  >
                    <Check
                      size={15}
                      style={{
                        flexShrink: 0,
                        color: plan.highlight ? "#fff" : "#2563EB",
                        marginTop: "0.1rem",
                      }}
                    />
                    {f}
                  </li>
                ))}
              </ul>

              <a
                href="#contact"
                style={{
                  display: "block",
                  textAlign: "center",
                  padding: "0.85rem",
                  borderRadius: "8px",
                  fontSize: "0.88rem",
                  fontWeight: 600,
                  textDecoration: "none",
                  fontFamily: "'Inter', sans-serif",
                  background: plan.highlight ? "#fff" : "transparent",
                  color: plan.highlight ? "#2563EB" : "#fff",
                  border: plan.highlight ? "none" : "1px solid rgba(255,255,255,0.3)",
                  transition: "opacity 0.2s",
                }}
                onMouseEnter={(e) =>
                  ((e.target as HTMLElement).style.opacity = "0.85")
                }
                onMouseLeave={(e) =>
                  ((e.target as HTMLElement).style.opacity = "1")
                }
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
