import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Music, Mic, Upload, ArrowLeft, FileMusic, Play, CheckCircle, AlertCircle, X } from "lucide-react";
import Sheet from "../components/osmd"; // Your OSMD wrapper

export default function Compare() {
  const navigate = useNavigate();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [viewState, setViewState] = useState<"upload" | "results">("upload");

  // Refs for hidden inputs
  const imgInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  // XML Paths (Static for demo)
  const wrongXML = "/twinkle_wrong.musicxml";
  const correctXML = "/twinkle_correct.musicxml";

  const handleAnalyze = () => {
    if (!imageFile || !audioFile) return;
    setLoading(true);

    // Simulate processing delay
    setTimeout(() => {
      setLoading(false);
      setViewState("results");
    }, 2000);
  };

  const resetView = () => {
    setViewState("upload");
    setImageFile(null);
    setAudioFile(null);
  };

  return (
    <div style={containerStyle}>
      
      {/* --- BACKGROUND LAYERS --- */}
      <div className="blob-anim" style={backgroundGlowStyle} />
      <div style={gridPatternStyle} />
      <div style={vignetteStyle} />

      {/* --- NAVBAR (Consistent with Home) --- */}
      <nav style={navStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", cursor: 'pointer' }} onClick={() => navigate("/")}>
          <div style={logoIconBoxStyle}>
            <Music size={20} color="#000" strokeWidth={3} />
          </div>
          <span style={logoTextStyle}>MUSICA</span>
        </div>
        
        <button onClick={() => navigate("/")} style={navButtonStyle}>
           <ArrowLeft size={16} /> Back Home
        </button>
      </nav>

      {/* --- MAIN CONTENT --- */}
      <main style={mainContentStyle}>
        
        {/* VIEW 1: UPLOAD DASHBOARD */}
        {viewState === "upload" && (
          <div style={{ width: "100%", maxWidth: "1000px", textAlign: "center", position: "relative", zIndex: 10 }} className="fade-in-up">
            
            <h1 style={heroTitleStyle}>
              GRADING <span style={textGradientStyle}>STUDIO</span>
            </h1>
            <p style={heroSubtitleStyle}>
              Upload your sheet music and a recording. Our AI will align them and score your accuracy.
            </p>

            <div style={uploadGridStyle}>
              
              {/* 1. Sheet Music Input */}
              <div 
                style={{
                  ...cardStyle,
                  borderColor: imageFile ? "#facc15" : "rgba(255, 255, 255, 0.08)"
                }} 
                className="glass-card"
                onClick={() => imgInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={imgInputRef}
                  accept="image/*, .musicxml"
                  style={{ display: "none" }}
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                />
                <div style={cardIconBoxStyle}>
                   {imageFile ? <CheckCircle size={24} color="#000" /> : <FileMusic size={24} color="#facc15" />}
                </div>
                <h3 style={cardTitleStyle}>{imageFile ? "Sheet Uploaded" : "Sheet Music"}</h3>
                <p style={cardDescStyle}>
                  {imageFile ? imageFile.name : "Click to upload XML or Image"}
                </p>
              </div>

              {/* 2. Audio Input */}
              <div 
                style={{
                  ...cardStyle,
                  borderColor: audioFile ? "#facc15" : "rgba(255, 255, 255, 0.08)"
                }} 
                className="glass-card"
                onClick={() => audioInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={audioInputRef}
                  accept="audio/*"
                  style={{ display: "none" }}
                  onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                />
                <div style={cardIconBoxStyle}>
                  {audioFile ? <CheckCircle size={24} color="#000" /> : <Mic size={24} color="#facc15" />}
                </div>
                <h3 style={cardTitleStyle}>{audioFile ? "Audio Loaded" : "Performance"}</h3>
                <p style={cardDescStyle}>
                  {audioFile ? audioFile.name : "Click to upload MP3 or WAV"}
                </p>
              </div>

            </div>

            {/* Analyze Button */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '40px' }}>
              <button
                onClick={handleAnalyze}
                disabled={!imageFile || !audioFile || loading}
                style={{
                  ...primaryBtnStyle,
                  opacity: (!imageFile || !audioFile || loading) ? 0.5 : 1,
                  cursor: (!imageFile || !audioFile || loading) ? "not-allowed" : "pointer",
                }}
                className={(!imageFile || !audioFile || loading) ? "" : "hover-glow"}
              >
                {loading ? (
                   <>Processing...</>
                ) : (
                   <><Play size={20} fill="black" /> ANALYZE PERFORMANCE</>
                )}
              </button>
            </div>
          </div>
        )}

        {/* VIEW 2: RESULTS DASHBOARD */}
        {viewState === "results" && (
          <div style={resultsContainerStyle} className="fade-in-up">
            
            {/* Results Header */}
            <div style={resultsHeaderStyle}>
              <div>
                <div style={badgeStyle}>
                  <CheckCircle size={12} fill="#facc15" stroke="none" />
                  <span>ANALYSIS COMPLETE</span>
                </div>
                <h2 style={{ fontSize: "2rem", fontWeight: "800", margin: "10px 0 0" }}>Accuracy Score: <span style={{color: "#facc15"}}>85%</span></h2>
              </div>
              <button onClick={resetView} style={secondaryBtnStyle} className="hover-lift">
                <X size={18} /> EXIT REVIEW
              </button>
            </div>

            {/* Sheets Comparison */}
            <div style={sheetsGridStyle}>
              {/* Left: User Attempt */}
              <div style={sheetWrapperStyle}>
                <div style={sheetHeaderStyle}>
                  <div style={indicatorRed} /> USER DETECTED
                </div>
                <div style={sheetPaperStyle}>
                  <Sheet specialNotes={[29, 30]} musicXML={wrongXML} color="#ef4444" />
                </div>
              </div>

              {/* Right: Correct Version */}
              <div style={sheetWrapperStyle}>
                <div style={sheetHeaderStyle}>
                  <div style={indicatorGreen} /> REFERENCE SCORE
                </div>
                <div style={sheetPaperStyle}>
                  <Sheet specialNotes={[29, 30]} musicXML={correctXML} color="#22c55e" />
                </div>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* --- GLOBAL CSS ANIMATIONS (Copied from Home) --- */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;900&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700&display=swap');

        body { margin: 0; background: #000; font-family: 'Inter', sans-serif; overflow-x: hidden; }

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

        .hover-glow { transition: all 0.3s ease; }
        .hover-glow:hover { transform: translateY(-2px); box-shadow: 0 0 30px rgba(250, 204, 21, 0.4); }

        .hover-lift { transition: all 0.3s ease; }
        .hover-lift:hover { transform: translateY(-2px); background: rgba(255,255,255,0.1); border-color: #fff; }

        .glass-card { 
          backdrop-filter: blur(12px); 
          transition: transform 0.3s ease, border-color 0.3s ease, background 0.3s ease;
        }
        .glass-card:hover { 
          transform: translateY(-5px); 
          border-color: rgba(250, 204, 21, 0.5) !important; 
          background: rgba(20, 20, 20, 0.6) !important;
        }
      `}</style>
    </div>
  );
}

// --- STYLES (Adapted from Home) ---

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

// Nav
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

const navButtonStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", 
  padding: "10px 20px", borderRadius: "100px", fontWeight: "600",
  cursor: "pointer", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px"
};

// Main
const mainContentStyle: React.CSSProperties = {
  flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
  position: "relative", zIndex: 10, padding: "40px"
};

const heroTitleStyle: React.CSSProperties = {
  fontSize: "5rem", lineHeight: "0.95", fontWeight: "900", letterSpacing: "-2px",
  fontFamily: "'Inter', sans-serif", margin: "0 0 20px 0", color: "#fff"
};

const textGradientStyle: React.CSSProperties = {
  background: "linear-gradient(180deg, #fff 0%, #666 100%)",
  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
};

const heroSubtitleStyle: React.CSSProperties = {
  fontSize: "1.1rem", color: "#999", maxWidth: "500px", margin: "0 auto 60px", lineHeight: "1.6", fontWeight: "400"
};

// Upload Cards
const uploadGridStyle: React.CSSProperties = {
  display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", width: "100%", margin: "0 auto"
};

const cardStyle: React.CSSProperties = {
  background: "rgba(20, 20, 20, 0.4)", border: "1px solid rgba(255, 255, 255, 0.08)",
  borderRadius: "24px", padding: "60px 20px", cursor: "pointer", 
  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
};

const cardIconBoxStyle: React.CSSProperties = {
  width: "64px", height: "64px", background: "rgba(250, 204, 21, 0.1)", color: "#facc15",
  borderRadius: "100px", display: "flex", justifyContent: "center", alignItems: "center", marginBottom: "20px"
};

const cardTitleStyle: React.CSSProperties = { fontSize: "1.2rem", fontWeight: "800", margin: "0 0 8px 0", color: "#fff" };
const cardDescStyle: React.CSSProperties = { fontSize: "0.9rem", color: "#666", margin: 0 };

// Buttons
const primaryBtnStyle: React.CSSProperties = {
  background: "#facc15", color: "#000", border: "none", padding: "18px 36px",
  fontSize: "15px", fontWeight: "900", borderRadius: "100px", cursor: "pointer",
  display: "flex", alignItems: "center", gap: "10px", letterSpacing: "0.5px"
};

const secondaryBtnStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)", color: "#fff", border: "1px solid rgba(255,255,255,0.15)",
  padding: "12px 24px", fontSize: "13px", fontWeight: "700", borderRadius: "100px", cursor: "pointer",
  display: "flex", alignItems: "center", gap: "8px"
};

// Results View
const resultsContainerStyle: React.CSSProperties = {
  width: "100%", maxWidth: "1200px", display: "flex", flexDirection: "column", height: "100%"
};

const resultsHeaderStyle: React.CSSProperties = {
  display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "30px",
  borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "20px"
};

const badgeStyle: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: "6px",
  background: "rgba(250, 204, 21, 0.08)", border: "1px solid rgba(250, 204, 21, 0.2)",
  color: "#facc15", padding: "6px 12px", borderRadius: "100px", fontSize: "10px", fontWeight: "bold",
  letterSpacing: "1px", textTransform: "uppercase"
};

const sheetsGridStyle: React.CSSProperties = {
  display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px", flex: 1, minHeight: "500px"
};

const sheetWrapperStyle: React.CSSProperties = {
  display: "flex", flexDirection: "column", height: "100%"
};

const sheetHeaderStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: "10px", fontSize: "0.8rem", 
  fontWeight: "700", letterSpacing: "1px", color: "#888", marginBottom: "12px",
  textTransform: "uppercase"
};

const indicatorRed: React.CSSProperties = {
  width: "8px", height: "8px", background: "#ef4444", borderRadius: "50%", boxShadow: "0 0 10px #ef4444"
};
const indicatorGreen: React.CSSProperties = {
  width: "8px", height: "8px", background: "#22c55e", borderRadius: "50%", boxShadow: "0 0 10px #22c55e"
};

const sheetPaperStyle: React.CSSProperties = {
  flex: 1, backgroundColor: "#fff", borderRadius: "12px", overflowY: "auto", padding: "20px",
  boxShadow: "0 10px 40px rgba(0,0,0,0.5)"
};