import React from "react";
import { Link, useLocation } from "react-router-dom";
import type { CSSProperties } from "react";

export default function Navbar() {
  const location = useLocation();

  // Helper to highlight the active link
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav style={styles.navContainer}>
      <div style={styles.navContent}>
        {/* Logo / Brand Section */}
        <div style={styles.logoSection}>
          <div style={styles.logoIcon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5">
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
            </svg>
          </div>
          <span style={styles.brandName}>Musica</span>
        </div>

        {/* Navigation Links */}
        <div style={styles.linkGroup}>
          <Link to="/" style={{ ...styles.link, ...(isActive("/") ? styles.activeLink : {}) }}>
            Home
          </Link>
          <Link to="/upload" style={{ ...styles.link, ...(isActive("/upload") ? styles.activeLink : {}) }}>
            Upload
          </Link>
          <Link to="/compare" style={{ ...styles.link, ...(isActive("/compare") ? styles.activeLink : {}) }}>
            Compare
          </Link>
          <Link to="/video" style={{ ...styles.link, ...(isActive("/video") ? styles.activeLink : {}) }}>
            Learning
          </Link>
        </div>

        {/* User / Login Section */}
        <div style={styles.actionSection}>
          <Link to="/login" style={styles.loginButton}>
            {isActive("/login") ? "Sign In" : "Account"}
          </Link>
        </div>
      </div>
    </nav>
  );
}

const styles: Record<string, CSSProperties> = {
  navContainer: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    height: "72px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    padding: "0 2rem",
    background: "rgba(9, 9, 11, 0.7)", // Matches the deep zinc background
    backdropFilter: "blur(12px)",
    borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
  },

  navContent: {
    width: "100%",
    maxWidth: "1200px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  logoSection: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },

  logoIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "6px",
    background: "rgba(99, 102, 241, 0.1)",
    borderRadius: "8px",
  },

  brandName: {
    fontSize: "1.25rem",
    fontWeight: 700,
    color: "#fff",
    letterSpacing: "-0.02em",
  },

  linkGroup: {
    display: "flex",
    gap: "2rem",
    alignItems: "center",
  },

  link: {
    textDecoration: "none",
    color: "#a1a1aa", // Zinc-400
    fontSize: "0.95rem",
    fontWeight: 500,
    transition: "all 0.2s ease",
  },

  activeLink: {
    color: "#fff",
    textShadow: "0 0 10px rgba(99, 102, 241, 0.4)",
  },

  actionSection: {
    display: "flex",
    alignItems: "center",
  },

  loginButton: {
    textDecoration: "none",
    padding: "8px 20px",
    borderRadius: "50px",
    background: "#fff",
    color: "#09090b",
    fontSize: "0.9rem",
    fontWeight: 600,
    transition: "transform 0.2s ease",
  },
};