"use client";
import { useState } from "react";

export default function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    branch: "",
    plan: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = () => {
    if (!form.name || !form.email) return;
    setSubmitted(true);
  };

  const inputStyle = {
    width: "100%",
    padding: "0.75rem 1rem",
    borderRadius: "8px",
    border: "1px solid #E5E7EB",
    fontFamily: "'Inter', sans-serif",
    fontSize: "0.88rem",
    color: "#0A0A0A",
    background: "#fff",
    outline: "none",
    transition: "border-color 0.2s",
  };

  return (
    <section id="contact" style={{ padding: "6rem 2rem", background: "#F5F5F5" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <p className="section-label">Enquiries</p>
        <span className="divider" />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "4rem",
            alignItems: "start",
          }}
          className="contact-grid"
        >
          {/* Left */}
          <div>
            <h2
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: "clamp(2rem, 4vw, 3rem)",
                fontWeight: 700,
                color: "#0A0A0A",
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
                marginBottom: "1.5rem",
              }}
            >
              Let's Get You
              <br />
              Started.
            </h2>
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.95rem",
                color: "#6B6B6B",
                lineHeight: 1.7,
                marginBottom: "2.5rem",
              }}
            >
              Drop us a message — a member of our team will get back to you
              within 24 hours to help pick the right plan, schedule a free trial,
              or answer any questions.
            </p>

            {[
              { icon: "📞", label: "Main Line", value: "+91 98765 43200" },
              { icon: "✉️", label: "Email", value: "hello@keshfitness.in" },
              { icon: "📍", label: "Flagship", value: "Sakchi, Jamshedpur – 831001" },
              { icon: "🕐", label: "Hours", value: "Mon–Fri: 6 AM – 11 PM" },
            ].map((c) => (
              <div
                key={c.label}
                style={{
                  display: "flex",
                  gap: "1rem",
                  marginBottom: "1rem",
                  alignItems: "flex-start",
                }}
              >
                <span style={{ fontSize: "1.2rem", flexShrink: 0 }}>{c.icon}</span>
                <div>
                  <p
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "0.72rem",
                      color: "#9CA3AF",
                      fontWeight: 600,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                    }}
                  >
                    {c.label}
                  </p>
                  <p
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "0.9rem",
                      color: "#1C1C1E",
                    }}
                  >
                    {c.value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Form */}
          <div
            style={{
              background: "#fff",
              borderRadius: "16px",
              padding: "2.5rem",
              border: "1px solid #E5E7EB",
            }}
          >
            {submitted ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "3rem 1rem",
                }}
              >
                <span style={{ fontSize: "3rem", display: "block", marginBottom: "1rem" }}>
                  ✅
                </span>
                <h3
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    fontSize: "1.4rem",
                    fontWeight: 700,
                    color: "#0A0A0A",
                    marginBottom: "0.75rem",
                  }}
                >
                  We'll be in touch!
                </h3>
                <p
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "0.9rem",
                    color: "#6B6B6B",
                    lineHeight: 1.6,
                  }}
                >
                  Thanks, {form.name}. Our team will contact you within 24 hours.
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <h3
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    fontSize: "1.15rem",
                    fontWeight: 700,
                    color: "#0A0A0A",
                    marginBottom: "0.25rem",
                  }}
                >
                  Send us a message
                </h3>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        color: "#6B6B6B",
                        display: "block",
                        marginBottom: "0.4rem",
                        letterSpacing: "0.04em",
                        textTransform: "uppercase",
                      }}
                    >
                      Full Name *
                    </label>
                    <input
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Your name"
                      style={inputStyle}
                      onFocus={(e) => (e.target.style.borderColor = "#2563EB")}
                      onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        color: "#6B6B6B",
                        display: "block",
                        marginBottom: "0.4rem",
                        letterSpacing: "0.04em",
                        textTransform: "uppercase",
                      }}
                    >
                      Phone
                    </label>
                    <input
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="+91 00000 00000"
                      style={inputStyle}
                      onFocus={(e) => (e.target.style.borderColor = "#2563EB")}
                      onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
                    />
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "#6B6B6B",
                      display: "block",
                      marginBottom: "0.4rem",
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                    }}
                  >
                    Email *
                  </label>
                  <input
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@email.com"
                    style={inputStyle}
                    onFocus={(e) => (e.target.style.borderColor = "#2563EB")}
                    onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        color: "#6B6B6B",
                        display: "block",
                        marginBottom: "0.4rem",
                        letterSpacing: "0.04em",
                        textTransform: "uppercase",
                      }}
                    >
                      Preferred Branch
                    </label>
                    <select
                      name="branch"
                      value={form.branch}
                      onChange={handleChange}
                      style={{ ...inputStyle, cursor: "pointer" }}
                      onFocus={(e) => (e.target.style.borderColor = "#2563EB")}
                      onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
                    >
                      <option value="">Select branch</option>
                      <option>Sakchi (Flagship)</option>
                      <option>Bistupur</option>
                      <option>Telco</option>
                      <option>Mango</option>
                    </select>
                  </div>
                  <div>
                    <label
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        color: "#6B6B6B",
                        display: "block",
                        marginBottom: "0.4rem",
                        letterSpacing: "0.04em",
                        textTransform: "uppercase",
                      }}
                    >
                      Interested In
                    </label>
                    <select
                      name="plan"
                      value={form.plan}
                      onChange={handleChange}
                      style={{ ...inputStyle, cursor: "pointer" }}
                      onFocus={(e) => (e.target.style.borderColor = "#2563EB")}
                      onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
                    >
                      <option value="">Select plan</option>
                      <option>Starter Plan</option>
                      <option>Pro Plan</option>
                      <option>Elite Plan</option>
                      <option>Free Trial</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "#6B6B6B",
                      display: "block",
                      marginBottom: "0.4rem",
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                    }}
                  >
                    Message
                  </label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Any questions or goals you'd like to share..."
                    rows={3}
                    style={{
                      ...inputStyle,
                      resize: "vertical",
                      minHeight: 90,
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#2563EB")}
                    onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
                  />
                </div>

                <button
                  onClick={handleSubmit}
                  style={{
                    background: "#0A0A0A",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    padding: "0.9rem",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "'Inter', sans-serif",
                    transition: "background 0.2s",
                    marginTop: "0.25rem",
                  }}
                  onMouseEnter={(e) =>
                    ((e.target as HTMLElement).style.background = "#2563EB")
                  }
                  onMouseLeave={(e) =>
                    ((e.target as HTMLElement).style.background = "#0A0A0A")
                  }
                >
                  Send Message →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      
    </section>
  );
}
