import React, { useState, useEffect, useRef } from "react";
import PianoComponent from "../components/Piano";
import { uploadFile } from "../firebase/uploadfile";
import { UploadCloud, Music, ArrowRight, Loader2, FileAudio, Zap } from "lucide-react"; 

const Upload: React.FC = () => {
  // --- STATE ---
  const [started, setStarted] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [musicXML, setMusicXML] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const url = "http://localhost:8000/";

  // --- WEBSOCKET SETUP ---
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);

    const wsUrl = url.replace("http", "ws") + "ws";
    console.log("Connecting to WebSocket:", wsUrl);
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => console.log("✅ WebSocket Connected");
    ws.onerror = (e) => console.error("❌ WebSocket Error:", e);

    ws.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data) as { filename?: string };
        if (data.filename) {
          fetchMusicXML(data.filename);
        }
      } catch (e) {
        console.error("Invalid WS message:", event.data);
      }
    };

    return () => {
      window.removeEventListener("resize", handleResize);
      ws.close();
    };
  }, []);

  // --- LOGIC ---
  const fetchMusicXML = async (filename: string) => {
    try {
      const res = await fetch(url + "result/" + filename);
      if (!res.ok) throw new Error("Failed to fetch XML");
      
      const text = await res.text();
      setMusicXML(text); 
      setIsUploading(false);

      // Firebase
      const xmlFile = new File([text], filename, { type: "text/xml" });
      await uploadFile(xmlFile, filename); 

    } catch (err) {
      console.error("❌ Error:", err);
      alert("Error retrieving score data.");
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setSelectedFile(e.target.files[0]);
      setMusicXML(null); 
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
      setMusicXML(null);
    }
  };

  const handleStartProcess = async () => {
    if (!selectedFile) {
      setStarted(true); 
      return;
    }
    setIsUploading(true);
    setMusicXML(null);
    setStarted(true); 

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const res = await fetch(url + "upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Server upload error");
      const data = await res.json();

      if(data.filename) {
         fetchMusicXML(data.filename);
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Upload failed.");
      setIsUploading(false);
      setStarted(false);
    }
  };

  // --- RENDER ---
  return (
    <div style={containerStyle}>
      
      {/* Backgrounds (Matching Home.tsx) */}
      {!started && (
        <>
          <div className="blob-anim" style={backgroundGlowStyle} />
          <div style={gridPatternStyle} />
          <div style={vignetteStyle} />
        </>
      )}

      {!started ? (
        <div style={contentWrapperStyle} className="fade-in-up">
          
          {/* Header */}
          <div style={{ marginBottom: "40px", textAlign: "center", position: 'relative', zIndex: 10 }}>
            <div style={badgeStyle}>
              <Zap size={12} fill="#facc15" stroke="none" />
              <span>STUDIO MODE</span>
            </div>
            
            <h1 style={titleStyle}>
              UPLOAD YOUR <br/>
              <span style={textGradientStyle}>SHEET MUSIC</span>
            </h1>
            
            <p style={subtitleStyle}>
              We'll convert your image into an interactive, playable piano score instantly.
            </p>
          </div>

          {/* Glass Upload Card */}
          <div style={glassCardStyle}>
             <div 
                onClick={() => fileInputRef.current?.click()}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                style={{
                  ...uploadBoxStyle,
                  borderColor: dragActive || selectedFile ? "#facc15" : "rgba(255,255,255,0.1)",
                  background: dragActive ? "rgba(250, 204, 21, 0.05)" : "rgba(0,0,0,0.2)"
                }}
             >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                />
                
                {selectedFile ? (
                  <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', animation: 'fadeIn 0.5s ease'}}>
                    <div style={selectedIconBoxStyle}>
                       <Music size={32} color="#000" />
                    </div>
                    <div style={{textAlign: 'center'}}>
                        <p style={{ color: "#fff", fontWeight: "bold", fontSize: "1.1rem", margin: 0, letterSpacing: '0.5px' }}>{selectedFile.name}</p>
                        <p style={{ color: "#facc15", fontSize: "0.85rem", marginTop: "5px", fontWeight: '600' }}>Ready to Process</p>
                    </div>
                  </div>
                ) : (
                  <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px'}}>
                    <div style={iconCircleStyle}>
                       <UploadCloud size={32} color="#facc15" />
                    </div>
                    <div style={{textAlign: 'center'}}>
                      <div style={{ fontSize: "1.2rem", marginBottom: "8px", fontWeight: "700", color: "#fff", letterSpacing: "1px" }}>
                        DRAG & DROP
                      </div>
                      <p style={{ fontSize: "0.9rem", color: "#666", margin: 0 }}>
                        Supports PNG, JPG, JPEG
                      </p>
                    </div>
                  </div>
                )}
             </div>

             <div style={{padding: '0 40px 40px'}}>
                <button 
                  onClick={handleStartProcess} 
                  style={{
                      ...primaryBtnStyle,
                      opacity: selectedFile ? 1 : 0.5,
                      cursor: selectedFile ? 'pointer' : 'not-allowed',
                  }}
                >
                  {isUploading ? (
                      <><Loader2 className="spin" size={20} /> PROCESSING...</>
                  ) : (
                      <>{selectedFile ? "GENERATE TUTORIAL" : "SELECT FILE FIRST"} <ArrowRight size={20} /></>
                  )}
                </button>
             </div>
          </div>

        </div>
      ) : (
        // PIANO VIEW
        <PianoComponent 
          maxWidth={windowWidth}
          goBack={() => setStarted(false)}
          musicXML={musicXML ?? null}
        />
      )}
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;900&display=swap');
        @keyframes blobBounce { 0% { transform: translate(-50%, -50%) scale(1); } 50% { transform: translate(-50%, -55%) scale(1.1); } 100% { transform: translate(-50%, -50%) scale(1); } }
        .blob-anim { animation: blobBounce 10s infinite ease-in-out; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in-up { opacity: 0; animation: fadeInUp 0.8s ease-out forwards; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
};

// --- STYLES (Matching Home.tsx) ---

const containerStyle: React.CSSProperties = {
  minHeight: "100vh", width: "100vw", position: "relative", overflow: "hidden",
  background: "#050505", color: "#fff", display: "flex", flexDirection: "column",
  alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', sans-serif"
};

const backgroundGlowStyle: React.CSSProperties = {
  position: "absolute", top: "40%", left: "50%", transform: "translate(-50%, -50%)",
  width: "100vw", height: "100vh", 
  background: "radial-gradient(circle, rgba(250, 204, 21, 0.1) 0%, rgba(0,0,0,0) 60%)",
  zIndex: 1, pointerEvents: "none"
};

const gridPatternStyle: React.CSSProperties = {
  position: "absolute", inset: 0, zIndex: 0, opacity: 0.15,
  backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
  backgroundSize: "60px 60px", maskImage: "linear-gradient(to bottom, black 20%, transparent 100%)"
};

const vignetteStyle: React.CSSProperties = {
  position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none",
  background: "radial-gradient(circle at center, transparent 0%, #050505 100%)"
};

const contentWrapperStyle: React.CSSProperties = {
    position: 'relative', zIndex: 10, width: '100%', maxWidth: '600px', padding: '20px',
    display: 'flex', flexDirection: 'column', alignItems: 'center'
};

const badgeStyle: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: "8px",
  background: "rgba(250, 204, 21, 0.08)", border: "1px solid rgba(250, 204, 21, 0.2)",
  color: "#facc15", padding: "6px 14px", borderRadius: "100px", fontSize: "11px", fontWeight: "bold",
  letterSpacing: "2px", textTransform: "uppercase", marginBottom: "20px"
};

const titleStyle: React.CSSProperties = {
  fontSize: "3.5rem", lineHeight: "1", fontWeight: "900", letterSpacing: "-2px",
  fontFamily: "'Inter', sans-serif", margin: "0 0 15px 0", color: "#fff"
};

const textGradientStyle: React.CSSProperties = {
  background: "linear-gradient(180deg, #fff 0%, #666 100%)",
  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
};

const subtitleStyle: React.CSSProperties = {
  fontSize: "1rem", color: "#888", lineHeight: "1.5", fontWeight: "400", margin: 0
};

// Glass Card for Upload
const glassCardStyle: React.CSSProperties = {
    width: '100%',
    background: "rgba(20, 20, 20, 0.6)", 
    border: "1px solid rgba(255, 255, 255, 0.1)",
    backdropFilter: "blur(20px)",
    borderRadius: "24px", 
    overflow: 'hidden',
    boxShadow: "0 20px 50px rgba(0,0,0,0.5)"
};

const uploadBoxStyle: React.CSSProperties = {
  width: "100%", height: "260px",
  borderBottom: "1px solid rgba(255,255,255,0.1)",
  display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
  cursor: "pointer", transition: "all 0.3s ease",
  marginBottom: "30px"
};

const iconCircleStyle: React.CSSProperties = {
  width: "70px", height: "70px", borderRadius: "50%", background: "rgba(255, 255, 255, 0.05)",
  display: "flex", justifyContent: "center", alignItems: "center", marginBottom: "20px",
  transition: "all 0.3s ease", border: "1px solid rgba(255,255,255,0.1)"
};

const selectedIconBoxStyle: React.CSSProperties = {
    width: "60px", height: "60px", borderRadius: "16px", background: "#facc15",
    display: "flex", justifyContent: "center", alignItems: "center",
    boxShadow: "0 10px 30px rgba(250, 204, 21, 0.3)"
};

const primaryBtnStyle: React.CSSProperties = {
  width: '100%',
  background: "#facc15", color: "#000", border: "none", padding: "18px 36px",
  fontSize: "15px", fontWeight: "900", borderRadius: "100px", 
  display: "flex", alignItems: "center", justifyContent: 'center', gap: "10px", letterSpacing: "1px",
  transition: "all 0.2s"
};

export default Upload;