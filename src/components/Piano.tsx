import React, { useState, useEffect } from "react";
import { Piano, KeyboardShortcuts, MidiNumbers } from "react-piano";
import "react-piano/dist/styles.css";
import * as Tone from "tone";

interface PianoProps {
  maxWidth: number;
  goBack: () => void;
}

const firstNote = MidiNumbers.fromNote("c4");
const lastNote = MidiNumbers.fromNote("b5");

const keyboardShortcuts = KeyboardShortcuts.create({
  firstNote,
  lastNote,
  keyboardConfig: KeyboardShortcuts.HOME_ROW,
});

const PianoComponent: React.FC<PianoProps> = ({ maxWidth, goBack }) => {
  const [playbackTime, setPlaybackTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  
  // High-quality Synth Engine
  const [synth] = useState(() => {
    const reverb = new Tone.Reverb(1.5).toDestination();
    return new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "triangle" },
      envelope: { attack: 0.05, release: 1 }
    }).connect(reverb);
  });

  // --- CLEAN MUSICXML PARSER ---
  const handleFileLoad = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, "text/xml");
    
    const notes: any[] = [];
    let currentTime = 0;
    const measures = xmlDoc.getElementsByTagName("measure");

    for (let i = 0; i < measures.length; i++) {
      const measureNotes = measures[i].getElementsByTagName("note");
      for (let j = 0; j < measureNotes.length; j++) {
        const note = measureNotes[j];
        const step = note.getElementsByTagName("step")[0]?.textContent;
        const octave = note.getElementsByTagName("octave")[0]?.textContent;
        const durValue = parseInt(note.getElementsByTagName("duration")[0]?.textContent || "1");
        
        if (step && octave) {
          notes.push({
            time: currentTime,
            note: `${step}${octave}`,
            duration: durValue / 4, // Adjusting scale for Tone.js
          });
        }
        currentTime += (durValue / 4);
      }
    }

    setDuration(currentTime);
    Tone.Transport.cancel();
    new Tone.Part((time, event) => {
      synth.triggerAttackRelease(event.note, event.duration, time);
    }, notes).start(0);
  };

  const togglePlay = async () => {
    await Tone.start();
    if (isPlaying) {
      Tone.Transport.pause();
    } else {
      Tone.Transport.start();
    }
    setIsPlaying(!isPlaying);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (Tone.Transport.state === "started") {
        setPlaybackTime(Tone.Transport.seconds);
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={containerStyle}>
      <style>{customPianoStyles}</style>
      
      <div style={pianoChassisStyle}>
        {/* --- MINIMALIST TOOLBAR --- */}
        <div style={toolbarStyle}>
          <div style={fileUploadWrapper}>
            <label style={labelStyle}>UPLOAD SHEET (.XML)</label>
            <input type="file" accept=".musicxml,.xml" onChange={handleFileLoad} style={fileInputStyle} />
          </div>

          <button onClick={togglePlay} style={playButtonStyle}>
            {isPlaying ? "⏸ PAUSE" : "▶ PLAY SHEET"}
          </button>
          
          <div style={scrubberContainer}>
             <input 
                type="range" min="0" max={duration || 100} step="0.1"
                value={playbackTime} 
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setPlaybackTime(val);
                  Tone.Transport.seconds = val;
                }}
                style={sliderStyle}
              />
              <span style={timeStyle}>{playbackTime.toFixed(1)}s</span>
          </div>
        </div>

        {/* --- PIANO BODY --- */}
        <div style={{ padding: "30px 50px" }}>
            <Piano
              noteRange={{ first: firstNote, last: lastNote }}
              playNote={(midi) => synth.triggerAttack(Tone.Frequency(midi, "midi").toFrequency())}
              stopNote={(midi) => synth.triggerRelease(Tone.Frequency(midi, "midi").toFrequency())}
              width={Math.min(maxWidth - 100, 1000)}
              keyboardShortcuts={keyboardShortcuts}
            />
        </div>
        
        <div style={{ padding: "0 20px 20px" }}>
          <button onClick={goBack} style={backButtonStyle}>← BACK TO HOME</button>
        </div>
      </div>
    </div>
  );
};

// --- STYLE DEFINITIONS ---

const customPianoStyles = `
  .ReactPiano__Key--natural { 
    background: linear-gradient(to bottom, #fcfcfc 0%, #eee 100%) !important; 
    border: 1px solid #ddd !important;
    border-radius: 0 0 6px 6px !important;
  }
  .ReactPiano__Key--accidental { 
    background: linear-gradient(to bottom, #444 0%, #111 100%) !important; 
    border-radius: 0 0 4px 4px !important;
  }
  .ReactPiano__Key--active.ReactPiano__Key--natural { background: #facc15 !important; transform: translateY(1px); }
  .ReactPiano__Key--active.ReactPiano__Key--accidental { background: #eab308 !important; }
`;

const containerStyle: React.CSSProperties = {
  width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center",
  background: "#1a1a1a", padding: '20px'
};

const pianoChassisStyle: React.CSSProperties = {
  background: "#262626", borderRadius: "16px", border: "1px solid #404040",
  boxShadow: "0 30px 60px rgba(0,0,0,0.5)", width: '100%', maxWidth: '1100px'
};

const toolbarStyle: React.CSSProperties = {
  padding: "20px 30px", display: "flex", alignItems: "center", gap: "30px",
  background: "#171717", borderRadius: "15px 15px 0 0", borderBottom: "1px solid #404040"
};

const fileUploadWrapper: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '6px' };
const labelStyle: React.CSSProperties = { color: '#a3a3a3', fontSize: '10px', fontWeight: 800, letterSpacing: '1px' };
const fileInputStyle: React.CSSProperties = { color: "#737373", fontSize: "12px" };

const playButtonStyle: React.CSSProperties = {
  background: "#facc15", border: "none", padding: "10px 24px", borderRadius: "8px",
  fontWeight: "bold", cursor: "pointer", color: "#171717", transition: '0.2s'
};

const scrubberContainer: React.CSSProperties = { flexGrow: 1, display: 'flex', alignItems: 'center', gap: '15px' };
const sliderStyle: React.CSSProperties = { flexGrow: 1, accentColor: "#facc15", cursor: "pointer" };
const timeStyle: React.CSSProperties = { color: "#facc15", fontFamily: "monospace", fontSize: '14px', width: '50px' };

const backButtonStyle: React.CSSProperties = { 
  background: "transparent", border: "1px solid #404040", color: "#737373", 
  padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontSize: '12px' 
};

export default PianoComponent;