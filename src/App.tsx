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
      // Here you would typically trigger the OMR conversion
      console.log("File ready for processing:", file.name);
    }
  };

  return (
    <div style={appContainerStyle}>
      {!started ? (
        <div style={{ textAlign: "center", color: "#f0f0f0", maxWidth: "500px" }}>
          <h1 style={{ fontSize: "3.5rem", marginBottom: 10, color: "#facc15" }}>🎹 Pianoscript</h1>
          <p style={{ fontSize: "1.1rem", marginBottom: 40, opacity: 0.7 }}>
            Upload sheet music images to transpose and play automatically.
          </p>

          <div 
            onClick={() => fileInputRef.current?.click()}
            style={uploadBoxStyle}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept="image/*" 
              style={{ display: 'none' }} 
            />
            {selectedFile ? (
              <p style={{ color: "#facc15" }}>✅ {selectedFile.name}</p>
            ) : (
              <>
                <div style={{ fontSize: "2rem", marginBottom: "10px" }}>📁</div>
                <p>Drop sheet music here or <span style={{ color: "#facc15" }}>Browse</span></p>
              </>
            )}
          </div>

          <button
            onClick={() => setStarted(true)}
            style={startButtonStyle}
          >
            {selectedFile ? "Process & Start" : "Open Manual Piano"}
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
  width: "100vw", height: "100vh", backgroundColor: "#121212",
  display: "flex", justifyContent: "center", alignItems: "center",
  fontFamily: "'Inter', sans-serif", overflow: "hidden"
};

const uploadBoxStyle: React.CSSProperties = {
  border: "2px dashed #444",
  padding: "40px",
  borderRadius: "16px",
  marginBottom: "30px",
  cursor: "pointer",
  transition: "all 0.3s",
  background: "#1a1a1a",
  color: "#888"
};

const startButtonStyle: React.CSSProperties = {
  padding: "16px 60px", fontSize: "18px", borderRadius: "12px",
  fontWeight: "bold", cursor: "pointer", border: "none",
  background: "linear-gradient(135deg, #facc15 0%, #eab308 100%)",
  color: "#1a1a1a", boxShadow: "0 10px 20px rgba(0,0,0,0.4)"
};

export default App;