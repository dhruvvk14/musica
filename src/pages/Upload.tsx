import React, { useState, useEffect, useRef } from "react";
import PianoComponent from "../components/Piano";
import { uploadFile} from "../firebase/uploadfile";

const App: React.FC = () => {
  const [started, setStarted] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [musicXML, setMusicXML] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const url = "http://localhost:8000/";

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

  return (
    <div style={appContainerStyle}>
      {!started ? (
        <div style={{ textAlign: "center", color: "#f0f0f0", maxWidth: "700px" }}>
          <h1 style={titleStyle}>MUSICA</h1>
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

          <button onClick={handleStartProcess} style={startButtonStyle}>
            {selectedFile ? "PROCESS & PLAY" : "ENTER STUDIO"}
          </button>
        </div>
      ) : (
        <PianoComponent 
          maxWidth={windowWidth}
          goBack={() => setStarted(false)}
          musicXML={musicXML ?? null}
        />

      )}
    </div>
  );
};

const appContainerStyle: React.CSSProperties = {
  width: "100vw", height: "100vh", backgroundColor: "#0a0a0a",
  display: "flex", justifyContent: "center", alignItems: "center",
  fontFamily: "'Inter', sans-serif", overflow: "hidden",
  background: "radial-gradient(circle at center, #1a1a1a 0%, #050505 100%)",
};

const titleStyle: React.CSSProperties = {
  fontSize: "5rem", fontWeight: 900, marginBottom: "10px", color: "#facc15", 
  fontFamily: "'Arial Black', sans-serif", letterSpacing: "12px",
  textShadow: "0 10px 30px rgba(0,0,0,0.5)"
};

const taglineStyle: React.CSSProperties = {
  fontSize: "1.1rem", marginBottom: "50px", opacity: 0.7, letterSpacing: "0.5px", color: "#fff", fontWeight: "300"
};

const uploadBoxStyle: React.CSSProperties = {
  border: "1px solid #444", padding: "50px", borderRadius: "4px", marginBottom: "40px",
  cursor: "pointer", transition: "all 0.4s ease", background: "rgba(255, 255, 255, 0.02)",
  color: "#888", textTransform: "uppercase"
};

const startButtonStyle: React.CSSProperties = {
  padding: "18px 80px", fontSize: "16px", borderRadius: "4px", fontWeight: "900", 
  cursor: "pointer", border: "none", background: "#facc15", color: "#000", 
  boxShadow: "0 10px 40px rgba(250, 204, 21, 0.2)", letterSpacing: "3px"
};

export default App;