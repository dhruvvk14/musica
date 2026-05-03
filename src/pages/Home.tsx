import React from "react";
import { useNavigate } from "react-router-dom"; // 1. Import the hook
import { Music, Mic, Zap, Star, Play, User } from "lucide-react";

const Home: React.FC = () => {
  const navigate = useNavigate(); // 2. Initialize the hook

  return (
    <div style={containerStyle}>
      
      {/* --- BACKGROUND LAYERS --- */}
      <div className="blob-anim" style={backgroundGlowStyle} />
      <div style={gridPatternStyle} />
      <div style={vignetteStyle} />

      {/* --- NAVIGATION BAR --- */}
      {/* Note: If you are using the Navbar component in App.js, you might want to remove this <nav> block to avoid duplicates. 
          If you prefer this specific design, keep it and remove <Navbar /> from App.js. */}
      <nav style={navStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", cursor: 'pointer' }} onClick={() => navigate("/")}>
          <div style={logoIconBoxStyle}>
            <Music size={20} color="#000" strokeWidth={3} />
          </div>
          <span style={logoTextStyle}>MUSICA</span>
        </div>
        
        <div style={navLinksGroupStyle}>
          {/* Account Button -> Links to /login */}
          <button 
            onClick={() => navigate("/login")} 
            style={accountButtonStyle} 
            className="hover-scale"
          >
             <User size={16} /> Account
          </button>

          <div style={{width: '1px', height: '24px', background: 'rgba(255,255,255,0.15)', margin: '0 5px'}} />

          {/* Launch Studio Button -> Links to /upload */}
          <button onClick={() => navigate("/upload")} style={navButtonStyle}>
            Launch Studio
          </button>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <main style={mainContentStyle}>
        <div style={{ position: "relative", zIndex: 10, maxWidth: "1200px", margin: "0 auto", textAlign: "center" }}>
          
          {/* Badge */}
          <div style={badgeContainerStyle} className="fade-in-up">
            <div style={badgeStyle}>
              <Zap size={12} fill="#facc15" stroke="none" />
              <span>AI-POWERED PERFORMANCE GRADER</span>
            </div>
          </div>

          {/* Headline */}
          <h1 style={heroTitleStyle} className="fade-in-up delay-1">
            PERFECT YOUR <br />
            <span style={textGradientStyle}>SOUND.</span>
          </h1>

          {/* Subtitle */}
          <p style={heroSubtitleStyle} className="fade-in-up delay-2">
            The first AI companion that listens to your playing and grades it against sheet music in real-time. 
            Upload XML, record audio, and get instant feedback.
          </p>

          {/* CTA Buttons */}
          <div style={ctaContainerStyle} className="fade-in-up delay-3">
            
            {/* BUTTON 1: PRACTICE -> Links to /upload */}
            <button 
              onClick={() => navigate("/upload")} 
              style={primaryBtnStyle}
              className="hover-glow"
            >
              <Play size={20} fill="black" /> START PRACTICING
            </button>
            
            {/* BUTTON 2: GRADING -> Links to /compare */}
            <button 
              onClick={() => navigate("/compare")} 
              style={secondaryBtnStyle}
              className="hover-lift"
            >
              <Mic size={20} /> GRADE RECORDING
            </button>
            
          </div>
        </div>

        {/* --- FEATURE CARDS --- */}
        <div style={cardsGridStyle} className="fade-in-up delay-4">
          
          <div style={cardStyle} className="glass-card">
            <div style={cardIconBoxStyle}><Music size={24} color="#facc15" /></div>
            <h3 style={cardTitleStyle}>Sheet Analysis</h3>
            <p style={cardDescStyle}>Upload MusicXML or PNGs. We convert raw sheet music into an interactive digital score instantly.</p>
          </div>

          <div style={cardStyle} className="glass-card">
            <div style={cardIconBoxStyle}><Mic size={24} color="#facc15" /></div>
            <h3 style={cardTitleStyle}>Pitch Detection</h3>
            <p style={cardDescStyle}>Our AI listens to your audio performance and detects deviations in pitch and timing in real-time.</p>
          </div>

          <div style={cardStyle} className="glass-card">
            <div style={cardIconBoxStyle}><Star size={24} color="#facc15" /></div>
            <h3 style={cardTitleStyle}>Instant Report</h3>
            <p style={cardDescStyle}>Get a professional report card highlighting every mistake, so you know exactly what to practice.</p>
          </div>

        </div>
      </main>

      {/* --- FOOTER --- */}
      <footer style={footerStyle}>
         <p style={{opacity: 0.5, fontSize: '12px'}}>Built for the Hackathon 2024</p>
      </footer>

      {/* --- GLOBAL CSS ANIMATIONS --- */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;900&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700&display=swap');

        body { margin: 0; background: #000; font-family: 'Inter', sans-serif; overflow-x: hidden; }

        /* Animations */
        @keyframes blobBounce {
          0% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -55%) scale(1.1); }
          100% { transform: translate(-50%, -50%) scale(1); }
        }
        .blob-anim { animation: blobBounce 10s infinite ease-in-out; }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in-up { opacity: 0; animation: fadeInUp 0.8s ease-out forwards; }
        .delay-1 { animation-delay: 0.1s; }
        .delay-2 { animation-delay: 0.2s; }
        .delay-3 { animation-delay: 0.3s; }
        .delay-4 { animation-delay: 0.5s; }

        /* Interactive Classes */
        .hover-scale { transition: transform 0.2s ease; }
        .hover-scale:hover { transform: scale(1.05); }

        .hover-glow { transition: all 0.3s ease; }
        .hover-glow:hover { transform: translateY(-2px); box-shadow: 0 0 30px rgba(250, 204, 21, 0.4); }

        .hover-lift { transition: all 0.3s ease; }
        .hover-lift:hover { transform: translateY(-2px); background: rgba(255,255,255,0.1); border-color: #fff; }

        .glass-card { 
          backdrop-filter: blur(12px); 
          transition: transform 0.3s ease, border-color 0.3s ease, background 0.3s ease;
        }
        .glass-card:hover { 
          transform: translateY(-10px); 
          border-color: rgba(250, 204, 21, 0.5) !important; 
          background: rgba(20, 20, 20, 0.8) !important;
        }
      `}</style>
    </div>
  );
};

// --- STYLES ---

const containerStyle: React.CSSProperties = {
  minHeight: "100vh", width: "100vw", position: "relative", overflow: "hidden",
  background: "#050505", color: "#fff", display: "flex", flexDirection: "column"
};

// Backgrounds
const backgroundGlowStyle: React.CSSProperties = {
  position: "absolute", top: "0%", left: "50%", transform: "translate(-50%, -50%)",
  width: "120vw", height: "80vh", 
  background: "radial-gradient(circle, rgba(250, 204, 21, 0.15) 0%, rgba(0,0,0,0) 60%)",
  zIndex: 1, pointerEvents: "none"
};

const gridPatternStyle: React.CSSProperties = {
  position: "absolute", inset: 0, zIndex: 0, opacity: 0.15,
  backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
  backgroundSize: "60px 60px", maskImage: "linear-gradient(to bottom, black 40%, transparent 100%)"
};

const vignetteStyle: React.CSSProperties = {
  position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none",
  background: "radial-gradient(circle at center, transparent 0%, #050505 100%)"
};

// Navbar
const navStyle: React.CSSProperties = {
  display: "flex", justifyContent: "space-between", alignItems: "center",
  padding: "24px 60px", position: "relative", zIndex: 50,
  borderBottom: "1px solid rgba(255,255,255,0.05)",
  background: "rgba(5,5,5,0.5)", backdropFilter: "blur(10px)"
};

const logoIconBoxStyle: React.CSSProperties = {
  width: "36px", height: "36px", background: "#facc15", borderRadius: "8px",
  display: "flex", justifyContent: "center", alignItems: "center",
  boxShadow: "0 4px 20px rgba(250, 204, 21, 0.2)"
};

const logoTextStyle: React.CSSProperties = {
  fontSize: "22px", fontWeight: "900", letterSpacing: "-1px", fontFamily: "'Space Grotesk', sans-serif"
};

const navLinksGroupStyle: React.CSSProperties = { display: "flex", alignItems: "center", gap: "30px" };

const navButtonStyle: React.CSSProperties = {
  background: "#1a1a1a", border: "1px solid #333", color: "#fff", 
  padding: "10px 24px", borderRadius: "100px", fontWeight: "600",
  cursor: "pointer", fontSize: "13px", transition: "all 0.2s"
};

const accountButtonStyle: React.CSSProperties = {
  background: "#fff", color: "#000", border: "none", 
  padding: "10px 20px", borderRadius: "100px", fontWeight: "700",
  cursor: "pointer", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px",
  boxShadow: "0 0 15px rgba(255,255,255,0.2)"
};

// Hero
const mainContentStyle: React.CSSProperties = {
  flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
  position: "relative", zIndex: 10, padding: "80px 20px 0"
};

const badgeContainerStyle: React.CSSProperties = { marginBottom: "30px", display: "flex", justifyContent: "center" };
const badgeStyle: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: "8px",
  background: "rgba(250, 204, 21, 0.08)", border: "1px solid rgba(250, 204, 21, 0.2)",
  color: "#facc15", padding: "8px 16px", borderRadius: "100px", fontSize: "11px", fontWeight: "bold",
  letterSpacing: "2px", textTransform: "uppercase"
};

const heroTitleStyle: React.CSSProperties = {
  fontSize: "7rem", lineHeight: "0.95", fontWeight: "900", letterSpacing: "-4px",
  fontFamily: "'Inter', sans-serif", margin: "0 0 30px 0", color: "#fff"
};

const textGradientStyle: React.CSSProperties = {
  background: "linear-gradient(180deg, #fff 0%, #666 100%)",
  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
};

const heroSubtitleStyle: React.CSSProperties = {
  fontSize: "1.25rem", color: "#999", maxWidth: "580px", margin: "0 auto 60px", lineHeight: "1.6", fontWeight: "400"
};

const ctaContainerStyle: React.CSSProperties = { display: "flex", gap: "20px", justifyContent: "center", marginBottom: "120px" };

const primaryBtnStyle: React.CSSProperties = {
  background: "#facc15", color: "#000", border: "none", padding: "20px 40px",
  fontSize: "16px", fontWeight: "900", borderRadius: "100px", cursor: "pointer",
  display: "flex", alignItems: "center", gap: "10px", letterSpacing: "0.5px"
};

const secondaryBtnStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)", color: "#fff", border: "1px solid rgba(255,255,255,0.15)",
  padding: "20px 40px", fontSize: "16px", fontWeight: "900", borderRadius: "100px", cursor: "pointer",
  display: "flex", alignItems: "center", gap: "10px", letterSpacing: "0.5px"
};

// Cards
const cardsGridStyle: React.CSSProperties = {
  display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px", maxWidth: "1200px", width: "100%", paddingBottom: "100px"
};

const cardStyle: React.CSSProperties = {
  background: "rgba(20, 20, 20, 0.4)", border: "1px solid rgba(255, 255, 255, 0.08)",
  borderRadius: "24px", padding: "40px 30px", cursor: "default", position: "relative", overflow: "hidden"
};

const cardIconBoxStyle: React.CSSProperties = {
  width: "56px", height: "56px", background: "rgba(250, 204, 21, 0.1)",
  borderRadius: "16px", display: "flex", justifyContent: "center", alignItems: "center", marginBottom: "24px"
};

const cardTitleStyle: React.CSSProperties = { fontSize: "1.4rem", fontWeight: "800", margin: "0 0 12px 0", color: "#fff" };
const cardDescStyle: React.CSSProperties = { fontSize: "0.95rem", color: "#888", lineHeight: "1.6", margin: 0 };

const footerStyle: React.CSSProperties = {
    padding: "40px", borderTop: "1px solid #111", display: "flex", justifyContent: "center", alignItems: "center", color: "#444", zIndex: 20, position: 'relative'
};

export default Home;