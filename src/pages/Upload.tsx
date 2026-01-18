import React, { useState, useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import PianoComponent from "../components/Piano";
// Make sure this path is correct for your project
import { uploadFile } from "../firebase/uploadfile"; 

const url = "http://localhost:8000/";

const Upload: React.FC = () => {
  // --------------------
  // UI State
  // --------------------
  const [started, setStarted] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // --------------------
  // Logic State
  // --------------------
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [musicXML, setMusicXML] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // --------------------
  // 1. WebSocket Setup
  // --------------------
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);

    // FIX: Correctly replace http with ws
    // Result: ws://localhost:8000/ws
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
          console.log("📩 WebSocket received filename:", data.filename);
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

  // --------------------
  // 2. Fetch MusicXML
  // --------------------
  const fetchMusicXML = async (filename: string) => {
    console.log(`🚀 Fetching MusicXML for: ${filename}...`);
    
    try {
      const res = await fetch(url + "result/" + filename);
      if (!res.ok) throw new Error("Failed to fetch XML content");
      
      const text = await res.text();
      console.log("✅ MusicXML Loaded successfully!");
      
      setMusicXML(text); 
      setIsUploading(false);

      // --- Firebase Upload Logic ---
      // We upload the XML string we just received
      console.log("☁️ Uploading result to Firebase...");
      
      // Create a Blob/File from the XML string to upload it
      const xmlFile = new File([text], filename, { type: "text/xml" });
      
      // Assuming uploadFile takes (File, path/filename)
      await uploadFile(xmlFile, filename); 
      console.log("✅ Firebase upload complete");

      

    } catch (err) {
      console.error("❌ Failed to fetch/upload MusicXML:", err);
      alert("Error retrieving score data.");
      setIsUploading(false);
    }
  };

  // --------------------
  // Handlers
  // --------------------
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setMusicXML(null); 
    }
  };

  const handleStartProcess = async () => {
    if (!selectedFile) {
      setStarted(true); // Manual Mode
      return;
    }

    setIsUploading(true);
    setMusicXML(null);
    setStarted(true); // Switch to Piano View immediately

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      console.log("📤 Uploading image to backend...");
      const res = await fetch(url + "upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Server upload error");

      const data = await res.json();
      console.log("✅ Image upload successful. Response:", data);

      // If backend processes immediately, fetch now.
      // If it takes time, the WebSocket will trigger the fetch later.
      if(data.filename) {
         console.log("⚡ Backend returned filename immediately.");
         fetchMusicXML(data.filename);
      } else {
         console.log("⏳ Waiting for WebSocket notification...");
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Upload failed.");
      setIsUploading(false);
      setStarted(false);
    }
  };

  // --------------------
  // Render
  // --------------------
  return (
    <div style={appContainerStyle}>
      {!started ? (
        <div style={{ textAlign: "center", color: "#f0f0f0", maxWidth: "500px" }}>
          <h1 style={{ fontSize: "3.5rem", marginBottom: 10, color: "#facc15" }}>
            🎹 Pianoscript
          </h1>
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
              <p style={{ color: "#facc15", fontWeight: "bold" }}>
                ✅ {selectedFile.name}
              </p>
            ) : (
              <>
                <div style={{ fontSize: "2rem", marginBottom: "10px" }}>📁</div>
                <p>Drop sheet music here or <span style={{ color: "#facc15" }}>Browse</span></p>
              </>
            )}
          </div>

          <button onClick={handleStartProcess} style={startButtonStyle}>
            {selectedFile ? "Process & Start" : "Open Manual Piano"}
          </button>
        </div>
      ) : (
        <PianoComponent 
          maxWidth={windowWidth}
          goBack={() => setStarted(false)}
          musicXML={musicXML ?? null}
          isLoading={!!selectedFile && !musicXML}
        />
      )}
    </div>
  );
};

// Styles
const appContainerStyle: CSSProperties = { width: "100vw", height: "100vh", backgroundColor: "#121212", display: "flex", justifyContent: "center", alignItems: "center", fontFamily: "'Inter', sans-serif", overflow: "hidden" };
const uploadBoxStyle: CSSProperties = { border: "2px dashed #444", padding: "40px", borderRadius: "16px", marginBottom: "30px", cursor: "pointer", transition: "all 0.3s", background: "#1a1a1a", color: "#888" };
const startButtonStyle: CSSProperties = { padding: "16px 60px", fontSize: "18px", borderRadius: "12px", fontWeight: "bold", cursor: "pointer", border: "none", background: "linear-gradient(135deg, #facc15 0%, #eab308 100%)", color: "#1a1a1a", boxShadow: "0 10px 20px rgba(0,0,0,0.4)" };

export default Upload;