import React from "react";
import AuthButton from "../firebase/auth";
import type { CSSProperties } from "react";

export default function Login() {
  return (
    <div style={styles.page}>
      {/* Decorative background glows */}
      <div style={styles.glowTop} />
      <div style={styles.glowBottom} />

      <div style={styles.card}>
        <div style={styles.brandIcon}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
        </div>

        <h1 style={styles.title}>Musica</h1>
        <p style={styles.subtitle}>
          Your rhythm, your rules. <br />
          <span style={{ color: "#a1a1aa" }}>Sign in to start listening.</span>
        </p>

        <div style={styles.buttonContainer}>
          <AuthButton />
        </div>

        <div style={styles.footer}>
          <div style={styles.divider}>
            <div style={styles.line} />
            <span style={styles.dividerText}>Secure Access</span>
            <div style={styles.line} />
          </div>
          <p style={styles.footerNote}>Powered by Firebase Authentication</p>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    width: "100vw",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#09090b", // Deep dark zinc
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    position: "relative",
    overflow: "hidden",
  },

  // Subtle background "atmosphere"
  glowTop: {
    position: "absolute",
    top: "-10%",
    left: "20%",
    width: "50vw",
    height: "50vh",
    background: "radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)",
    filter: "blur(60px)",
    zIndex: 0,
  },

  glowBottom: {
    position: "absolute",
    bottom: "-10%",
    right: "10%",
    width: "40vw",
    height: "40vh",
    background: "radial-gradient(circle, rgba(168, 85, 247, 0.12) 0%, transparent 70%)",
    filter: "blur(60px)",
    zIndex: 0,
  },

  card: {
    position: "relative",
    zIndex: 1,
    width: "100%",
    maxWidth: "420px",
    padding: "3rem 2.5rem",
    background: "rgba(24, 24, 27, 0.8)", // Dark translucent zinc
    backdropFilter: "blur(20px)",
    borderRadius: "24px",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
    textAlign: "center",
  },

  brandIcon: {
    marginBottom: "1.5rem",
    display: "inline-block",
    padding: "1rem",
    background: "rgba(99, 102, 241, 0.1)",
    borderRadius: "20px",
  },

  title: {
    margin: 0,
    fontSize: "2.25rem",
    fontWeight: 800,
    letterSpacing: "-0.025em",
    color: "#fff",
  },

  subtitle: {
    marginTop: "0.75rem",
    fontSize: "1rem",
    lineHeight: "1.5",
    color: "#fff",
    fontWeight: 400,
  },

  buttonContainer: {
    marginTop: "2.5rem",
    transition: "transform 0.2s ease",
  },

  footer: {
    marginTop: "3rem",
  },

  divider: {
    display: "flex",
    alignItems: "center",
    marginBottom: "1.5rem",
    gap: "1rem",
  },

  line: {
    flex: 1,
    height: "1px",
    background: "rgba(255, 255, 255, 0.1)",
  },

  dividerText: {
    fontSize: "0.75rem",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    color: "#52525b",
    fontWeight: 600,
  },

  footerNote: {
    fontSize: "0.8rem",
    color: "#3f3f46",
  },
};