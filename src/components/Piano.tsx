import React, { useState, useEffect } from "react";
import { Piano, KeyboardShortcuts, MidiNumbers } from "react-piano";
import "react-piano/dist/styles.css";
import * as Tone from "tone";

interface PianoProps {
  maxWidth: number;
  goBack: () => void;
}

interface NoteEvent {
  time: number;
  note: string;
  duration: number;
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
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeNotes, setActiveNotes] = useState<number[]>([]);

  // 1. Acoustic Grand Piano Sampler
  const [sampler] = useState(() => {
    return new Tone.Sampler({
      urls: {
        A0: "A0.mp3", C1: "C1.mp3", "D#1": "Ds1.mp3", "F#1": "Fs1.mp3",
        A1: "A1.mp3", C2: "C2.mp3", "D#2": "Ds2.mp3", "F#2": "Fs2.mp3",
        A2: "A2.mp3", C3: "C3.mp3", "D#3": "Ds3.mp3", "F#3": "Fs3.mp3",
        A3: "A3.mp3", C4: "C4.mp3", "D#4": "Ds4.mp3", "F#4": "Fs4.mp3",
        A4: "A4.mp3", C5: "C5.mp3", "D#5": "Ds5.mp3", "F#5": "Fs5.mp3",
        A5: "A5.mp3", C6: "C6.mp3",
      },
      release: 1,
      baseUrl: "https://tonejs.github.io/audio/salamander/",
      onload: () => setIsLoaded(true),
    }).toDestination();
  });

  // 2. MusicXML Parser & Visual Scheduler
  const handleFileLoad = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, "text/xml");
    
    const divisionsElem = xmlDoc.getElementsByTagName("divisions")[0];
    const divisions = divisionsElem ? parseInt(divisionsElem.textContent || "1") : 1;
    
    const notesArray: NoteEvent[] = [];
    let currentTime = 0;
    const measures = xmlDoc.getElementsByTagName("measure");

    for (let i = 0; i < measures.length; i++) {
      const measureNotes = measures[i].querySelectorAll("note");
      measureNotes.forEach((note) => {
        const isRest = note.getElementsByTagName("rest").length > 0;
        const isChord = note.getElementsByTagName("chord").length > 0;
        const durValue = parseInt(note.getElementsByTagName("duration")[0]?.textContent || "0");
        const durationInSeconds = (durValue / divisions) * 0.5;

        if (!isRest) {
          const step = note.getElementsByTagName("step")[0]?.textContent;
          const octave = note.getElementsByTagName("octave")[0]?.textContent;
          const alter = note.getElementsByTagName("alter")[0]?.textContent;

          if (step && octave) {
            let noteName = `${step}${octave}`;
            if (alter === "1") noteName = `${step}#${octave}`;
            if (alter === "-1") noteName = `${step}b${octave}`;

            notesArray.push({
              time: currentTime,
              note: noteName,
              duration: durationInSeconds,
            });
          }
        }
        if (!isChord) currentTime += durationInSeconds;
      });
    }

    setDuration(currentTime);
    Tone.Transport.cancel();

    new Tone.Part<NoteEvent>((time, event) => {
      const midiValue = Tone.Frequency(event.note).toMidi();

      // Audio
      sampler.triggerAttackRelease(event.note, event.duration, time);

      // Visual Highlight
      Tone.Draw.schedule(() => {
        setActiveNotes((prev) => [...new Set([...prev, midiValue])]);
      }, time);

      // Visual Release
      Tone.Draw.schedule(() => {
        setActiveNotes((prev) => prev.filter((n) => n !== midiValue));
      }, time + event.duration);

    }, notesArray).start(0);
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

  // Cast Piano to any to allow activeNotes prop without TS errors
  const PianoComponentRaw = Piano as any;

  return (
    <div style={containerStyle}>
      <style>{customPianoStyles}</style>

      <div style={pianoChassisStyle}>
        <div style={toolbarStyle}>
          <div style={fileUploadWrapper}>
            <label style={labelStyle}>IMPORT MUSICXML</label>
            <input type="file" accept=".musicxml,.xml" onChange={handleFileLoad} style={fileInputStyle} disabled={!isLoaded} />
          </div>

          <button onClick={togglePlay} style={playButtonStyle} disabled={!isLoaded}>
            {isPlaying ? "⏸ PAUSE" : "▶ PLAY COMPOSITION"}
          </button>
          
          <div style={scrubberContainer}>
             <input 
                type="range" min="0" max={duration || 1} step="0.1"
                value={playbackTime} 
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setPlaybackTime(val);
                  Tone.Transport.seconds = val;
                  setActiveNotes([]); 
                }}
                style={sliderStyle}
              />
              <span style={timeStyle}>{playbackTime.toFixed(1)}s</span>
          </div>
        </div>

        <div style={{ padding: "40px 60px", background: '#1e1e1e' }}>
            {!isLoaded ? (
              <div style={{color: '#facc15', textAlign: 'center'}}>Preparing Soundboard...</div>
            ) : (
              <PianoComponentRaw
                activeNotes={activeNotes}
                noteRange={{ first: firstNote, last: lastNote }}
                playNote={(midi: number) => {
                  sampler.triggerAttack(Tone.Frequency(midi, "midi").toNote());
                }}
                stopNote={(midi: number) => {
                  sampler.triggerRelease(Tone.Frequency(midi, "midi").toNote());
                }}
                onPlayNoteInput={(midi: number) => {
                  setActiveNotes((prev) => [...new Set([...prev, midi])]);
                }}
                onStopNoteInput={(midi: number) => {
                  setActiveNotes((prev) => prev.filter((n) => n !== midi));
                }}
                width={Math.min(maxWidth - 120, 1000)}
                keyboardShortcuts={keyboardShortcuts}
              />
            )}
        </div>
        
        <div style={{ padding: "0 20px 20px" }}>
          <button onClick={goBack} style={backButtonStyle}>← EXIT SESSION</button>
        </div>
      </div>
    </div>
  );
};

// --- STYLES ---

const customPianoStyles = `
  .ReactPiano__Key--natural { 
    background: linear-gradient(to bottom, #ffffff 0%, #e2e2e2 100%) !important; 
    border-radius: 0 0 5px 5px !important;
  }
  .ReactPiano__Key--accidental { 
    background: linear-gradient(to bottom, #333 0%, #000 100%) !important; 
    border-radius: 0 0 3px 3px !important;
    height: 60% !important;
  }
  .ReactPiano__Key--active.ReactPiano__Key--natural { 
    background: #facc15 !important; 
    box-shadow: 0 0 20px #facc15 !important;
    z-index: 10;
  }
  .ReactPiano__Key--active.ReactPiano__Key--accidental { 
    background: #eab308 !important; 
    box-shadow: 0 0 15px #eab308 !important;
    z-index: 10;
  }
`;

const containerStyle: React.CSSProperties = { width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center", background: "#121212", padding: '20px' };
const pianoChassisStyle: React.CSSProperties = { background: "#262626", borderRadius: "20px", border: "1px solid #333", boxShadow: "0 40px 80px rgba(0,0,0,0.6)", width: '100%', maxWidth: '1100px', overflow: 'hidden' };
const toolbarStyle: React.CSSProperties = { padding: "25px 35px", display: "flex", alignItems: "center", gap: "30px", background: "#171717", borderBottom: "1px solid #333" };
const fileUploadWrapper: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '8px' };
const labelStyle: React.CSSProperties = { color: '#666', fontSize: '9px', fontWeight: 900, letterSpacing: '1.5px' };
const fileInputStyle: React.CSSProperties = { color: "#888", fontSize: "11px" };
const playButtonStyle: React.CSSProperties = { background: "#facc15", border: "none", padding: "12px 28px", borderRadius: "10px", fontWeight: "bold", cursor: "pointer", color: "#000" };
const scrubberContainer: React.CSSProperties = { flexGrow: 1, display: 'flex', alignItems: 'center', gap: '20px' };
const sliderStyle: React.CSSProperties = { flexGrow: 1, accentColor: "#facc15", cursor: "pointer" };
const timeStyle: React.CSSProperties = { color: "#facc15", fontFamily: "monospace", fontSize: '14px' };
const backButtonStyle: React.CSSProperties = { background: "transparent", border: "1px solid #333", color: "#555", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", fontSize: '11px', fontWeight: 'bold' };

export default PianoComponent;