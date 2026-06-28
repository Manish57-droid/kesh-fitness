"use client";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

const links = [
  { label: "Equipment", href: "#equipment" },
  { label: "Branches", href: "#branches" },
  { label: "Timings", href: "#timings" },
  { label: "Membership", href: "#membership" },
  { label: "Trainers", href: "#trainers" },
  { label: "Gallery", href: "#gallery" },
  { label: "Contact", href: "#contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: scrolled ? "rgba(255,255,255,0.95)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled ? "1px solid #E5E7EB" : "none",
        transition: "all 0.3s ease",
        padding: "0 2rem",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 68,
        }}
      >
        {/* Logo */}
        <a href="#" style={{ textDecoration: "none" }}>
          <span
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: "1.4rem",
              fontWeight: 800,
              color: "#0A0A0A",
              letterSpacing: "-0.02em",
            }}
          >
            KESH{" "}
            <span style={{ color: "#2563EB" }}>FITNESS</span>
          </span>
        </a>

        {/* Desktop Links */}
        <div
          style={{ display: "flex", gap: "2rem", alignItems: "center" }}
          className="hidden md:flex"
        >
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.85rem",
                fontWeight: 500,
                color: "#1C1C1E",
                textDecoration: "none",
                letterSpacing: "0.01em",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) =>
                ((e.target as HTMLElement).style.color = "#2563EB")
              }
              onMouseLeave={(e) =>
                ((e.target as HTMLElement).style.color = "#1C1C1E")
              }
            >
              {l.label}
            </a>
          ))}
          <a
            href="#membership"
            style={{
              background: "#0A0A0A",
              color: "#fff",
              padding: "0.55rem 1.25rem",
              borderRadius: "6px",
              fontSize: "0.82rem",
              fontWeight: 600,
              textDecoration: "none",
              fontFamily: "'Inter', sans-serif",
              letterSpacing: "0.02em",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) =>
              ((e.target as HTMLElement).style.background = "#2563EB")
            }
            onMouseLeave={(e) =>
              ((e.target as HTMLElement).style.background = "#0A0A0A")
            }
          >
            Join Now
          </a>
        </div>

        {/* Mobile Toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#0A0A0A",
          }}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div
          style={{
            background: "#fff",
            borderTop: "1px solid #E5E7EB",
            padding: "1.5rem 2rem",
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
          }}
          className="md:hidden"
        >
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "1rem",
                color: "#1C1C1E",
                textDecoration: "none",
                fontWeight: 500,
              }}
            >
              {l.label}
            </a>
          ))}
          <a
            href="#membership"
            onClick={() => setOpen(false)}
            style={{
              background: "#0A0A0A",
              color: "#fff",
              padding: "0.75rem 1.5rem",
              borderRadius: "6px",
              fontSize: "0.9rem",
              fontWeight: 600,
              textDecoration: "none",
              textAlign: "center",
            }}
          >
            Join Now
          </a>
        </div>
      )}
    </nav>
  );
}
