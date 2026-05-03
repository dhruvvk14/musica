import React, { useState, useEffect, useRef } from "react";
import PianoComponent from "./components/Piano";

const App: React.FC = () => {
  const [started, setStarted] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      console.log("File ready for processing:", file.name);
    }
  };

  return (
    <div style={appContainerStyle}>
      {!started ? (
        <div style={{ textAlign: "center", color: "#f0f0f0", maxWidth: "700px" }}>
          <h1 style={titleStyle}>MUSICA</h1>
          
          {/* --- UPDATED TAGLINE --- */}
          <p style={taglineStyle}>
            Practice makes perfect. Learn just by providing the music sheet.
          </p>

          <div 
            onClick={() => fileInputRef.current?.click()}
            style={uploadBoxStyle}
            onMouseOver={(e) => (e.currentTarget.style.borderColor = "#facc15")}
            onMouseOut={(e) => (e.currentTarget.style.borderColor = "#444")}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept="image/*" 
              style={{ display: 'none' }} 
            />
            {selectedFile ? (
              <p style={{ color: "#facc15", fontWeight: "bold" }}>✅ {selectedFile.name}</p>
            ) : (
              <>
                <div style={{ fontSize: "1.8rem", marginBottom: "10px", fontWeight: "900", letterSpacing: "4px" }}>
                  INPUT IMAGE
                </div>
                <p style={{ fontSize: "0.85rem", color: "#666", letterSpacing: "1px" }}>
                  Drop sheet music or <span style={{ color: "#facc15" }}>Browse</span>
                </p>
              </>
            )}
          </div>

          <button
            onClick={() => setStarted(true)}
            style={startButtonStyle}
          >
            {selectedFile ? "PROCESS & PLAY" : "ENTER STUDIO"}
          </button>
        </div>
      ) : (
        <PianoComponent maxWidth={windowWidth} goBack={() => setStarted(false)} />
      )}
    </div>
  );
};

// --- STYLES ---

const appContainerStyle: React.CSSProperties = {
  width: "100vw", height: "100vh", backgroundColor: "#0a0a0a",
  display: "flex", justifyContent: "center", alignItems: "center",
  fontFamily: "'Inter', sans-serif", overflow: "hidden",
  background: "radial-gradient(circle at center, #1a1a1a 0%, #050505 100%)",
};

const titleStyle: React.CSSProperties = {
  fontSize: "5rem", 
  fontWeight: 900, 
  marginBottom: "10px", 
  color: "#facc15", 
  fontFamily: "'Arial Black', sans-serif",
  letterSpacing: "12px",
  textShadow: "0 10px 30px rgba(0,0,0,0.5)"
};

const taglineStyle: React.CSSProperties = {
  fontSize: "1.1rem", 
  marginBottom: "50px", 
  opacity: 0.7, 
  letterSpacing: "0.5px",
  color: "#fff",
  fontWeight: "300"
};

const uploadBoxStyle: React.CSSProperties = {
  border: "1px solid #444",
  padding: "50px",
  borderRadius: "4px",
  marginBottom: "40px",
  cursor: "pointer",
  transition: "all 0.4s ease",
  background: "rgba(255, 255, 255, 0.02)",
  color: "#888",
  textTransform: "uppercase"
};

const startButtonStyle: React.CSSProperties = {
  padding: "18px 80px", 
  fontSize: "16px", 
  borderRadius: "4px",
  fontWeight: "900", 
  cursor: "pointer", 
  border: "none",
  background: "#facc15",
  color: "#000", 
  boxShadow: "0 10px 40px rgba(250, 204, 21, 0.2)",
  letterSpacing: "3px",
  transition: "all 0.2s ease"
};

export default App;