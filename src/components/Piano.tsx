import React, { useState, useEffect } from "react";
import { Piano, KeyboardShortcuts, MidiNumbers } from "react-piano";
import "react-piano/dist/styles.css";
import * as Tone from "tone";

interface PianoProps {
  maxWidth: number;
  goBack: () => void;
  musicXML?: string | null; // Allow null
}

interface NoteEvent {
  time: number;
  note: string;
  duration: number;
}

// Range: C4 to B5
const firstNote = MidiNumbers.fromNote("c4");
const lastNote = MidiNumbers.fromNote("b5");

const keyboardShortcuts = KeyboardShortcuts.create({
  firstNote,
  lastNote,
  keyboardConfig: KeyboardShortcuts.HOME_ROW,
});

const PianoComponent: React.FC<PianoProps> = ({ maxWidth, goBack, musicXML }) => {
  const [playbackTime, setPlaybackTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeNotes, setActiveNotes] = useState<number[]>([]);

  // Initialize Sampler
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
      baseUrl: "https://tonejs.github.io/audio/salamander/",
      onload: () => setIsLoaded(true),
    }).toDestination();
  });

  // ------------------------------------------------------
  // 1. AUTOMATIC PARSING & SCHEDULING (Replaces handleFileLoad)
  // ------------------------------------------------------
  useEffect(() => {
    // Wait for both the XML data AND the Sampler to be ready
    if (!musicXML || !isLoaded || !sampler) return;

    console.log("Parsing MusicXML...");

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(musicXML, "text/xml");
    
    // Parse Divisions
    const divisions = parseInt(xmlDoc.getElementsByTagName("divisions")[0]?.textContent || "1");
    
    const notesArray: NoteEvent[] = [];
    let currentTime = 0;
    const measures = xmlDoc.getElementsByTagName("measure");

    // Loop through measures
    for (let i = 0; i < measures.length; i++) {
      const measureNotes = measures[i].querySelectorAll("note");
      
      measureNotes.forEach((note) => {
        const isRest = note.getElementsByTagName("rest").length > 0;
        const isChord = note.getElementsByTagName("chord").length > 0;
        const durValue = parseInt(note.getElementsByTagName("duration")[0]?.textContent || "0");
        
        // Calculate Duration
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
              duration: durationInSeconds 
            });
          }
        }
        
        // Advance time if not a chord
        if (!isChord) currentTime += durationInSeconds;
      });
    }

    setDuration(currentTime);

    // Schedule Tone.js Part
    Tone.Transport.cancel(); // Clear previous song
    
    const part = new Tone.Part<NoteEvent>((time, event) => {
      // 1. Trigger Sound
      sampler.triggerAttackRelease(event.note, event.duration, time);
      
      // 2. Schedule Visuals (Active Keys)
      const midiValue = Tone.Frequency(event.note).toMidi();
      
      Tone.Draw.schedule(() => {
        setActiveNotes((prev) => [...new Set([...prev, midiValue])]);
      }, time);

      Tone.Draw.schedule(() => {
        setActiveNotes((prev) => prev.filter((n) => n !== midiValue));
      }, time + event.duration);

    }, notesArray);

    part.start(0);
    
    // Cleanup on unmount or new song
    return () => {
      part.dispose();
    };

  }, [musicXML, isLoaded, sampler]); // Re-run when musicXML changes or sampler loads


  // ------------------------------------------------------
  // Playback Controls
  // ------------------------------------------------------
  const togglePlay = async () => {
    await Tone.start();
    if (Tone.Transport.state === "started") {
      Tone.Transport.pause();
      setIsPlaying(false);
    } else {
      Tone.Transport.start();
      setIsPlaying(true);
    }
  };

  // Sync Slider with Transport
  useEffect(() => {
    const interval = setInterval(() => {
      if (Tone.Transport.state === "started") {
        setPlaybackTime(Tone.Transport.seconds);
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);


  // ------------------------------------------------------
  // RENDER
  // ------------------------------------------------------
  const PianoComponentRaw = Piano as any;
  const pianoDisplayWidth = maxWidth * 0.9; 

  return (
    <div style={containerStyle}>
      {/* Styles Block Omitted for Brevity - Keep your existing styles here */}
      <style>{`
        .ReactPiano__Keyboard { display: flex !important; flex-direction: row !important; background: #000; padding: 0 !important; border-top: 15px solid #1a1a1a; margin: 0 auto; overflow: visible !important; }
        .ReactPiano__Key { margin: 0 !important; padding: 0 !important; position: relative !important; left: auto !important; }
        .ReactPiano__Key--natural { height: 350px !important; background: #ffffff !important; border: 1px solid #bbb !important; z-index: 1; width: ${pianoDisplayWidth / 14}px !important; }
        .ReactPiano__Key--accidental { height: 220px !important; background: #111 !important; border: 1px solid #000 !important; z-index: 10 !important; width: ${pianoDisplayWidth / 22}px !important; margin-left: -${pianoDisplayWidth / 44}px !important; margin-right: -${pianoDisplayWidth / 44}px !important; box-shadow: 2px 5px 10px rgba(0,0,0,0.5); }
        .piano-label-large { position: absolute; bottom: 25px; left: 0; right: 0; text-align: center; font-family: 'Arial Black', sans-serif; font-weight: 900; font-size: 18px; pointer-events: none; z-index: 999 !important; }
        .color-black { color: #000000 !important; }
        .color-white { color: #ffffff !important; bottom: 20px; font-size: 14px; }
        .ReactPiano__Key--active.ReactPiano__Key--natural { background: #facc15 !important; box-shadow: inset 0 -10px 20px rgba(0,0,0,0.1); }
        .ReactPiano__Key--active.ReactPiano__Key--accidental { background: #eab308 !important; }
      `}</style>

      <div style={pianoChassisStyle}>
        <div style={toolbarStyle}>
          {/* REMOVED: File Input (Since it's automated now) */}
          <div style={{display: 'flex', flexDirection: 'column', gap: '5px'}}>
             <span style={{color: '#facc15', fontWeight: 'bold', letterSpacing: '1px'}}>PIANOSCRIPT PLAYER</span>
             <span style={{color: '#666', fontSize: '12px'}}>
               {musicXML ? "FILE LOADED" : "WAITING FOR DATA..."}
             </span>
          </div>
          
          <button onClick={togglePlay} style={playButtonStyle} disabled={!isLoaded || !musicXML}>
            {isPlaying ? "⏸ PAUSE" : "▶ PLAY"}
          </button>

          <div style={{flexGrow: 1, display: 'flex', alignItems: 'center', gap: '20px'}}>
            <input type="range" min="0" max={duration || 1} step="0.1" value={playbackTime} 
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setPlaybackTime(val);
                Tone.Transport.seconds = val;
                // Clear active notes when scrubbing so keys don't get stuck
                setActiveNotes([]);
              }} 
              style={{flexGrow: 1, accentColor: '#facc15', height: '10px'}} 
            />
            <span style={{color: '#facc15', fontSize: '18px', minWidth: '60px', fontWeight: 'bold', fontFamily: 'monospace'}}>
              {playbackTime.toFixed(1)}s
            </span>
          </div>
        </div>

        <div style={pianoWrapperStyle}>
          {!isLoaded ? (
            <div style={{color: '#facc15', fontSize: '24px', fontWeight: 'bold', padding: '50px'}}>
               LOADING SOUNDS...
            </div>
          ) : (
            <div style={{ width: pianoDisplayWidth }}>
              <PianoComponentRaw
                activeNotes={activeNotes}
                noteRange={{ first: firstNote, last: lastNote }}
                playNote={(midi: number) => sampler.triggerAttack(Tone.Frequency(midi, "midi").toNote())}
                stopNote={(midi: number) => sampler.triggerRelease(Tone.Frequency(midi, "midi").toNote())}
                width={pianoDisplayWidth}
                keyboardShortcuts={keyboardShortcuts}
                renderNoteLabel={({ midiNumber, isAccidental }: any) => (
                  <div className={`piano-label-large ${isAccidental ? 'color-white' : 'color-black'}`}>
                    {Tone.Frequency(midiNumber, "midi").toNote()}
                  </div>
                )}
              />
            </div>
          )}
        </div>
        
        <div style={{ padding: "0 40px 60px", textAlign: 'left' }}>
          <button onClick={() => {
            Tone.Transport.stop(); // Stop audio when leaving
            goBack();
          }} style={backButtonStyle}>← EXIT TO HOME</button>
        </div>
      </div>
    </div>
  );
};

// ... Keep your Styles exactly as they were ...
const containerStyle: React.CSSProperties = { width: "100vw", height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#050505", overflow: "hidden" };
const pianoChassisStyle: React.CSSProperties = { width: "95%", background: "#111", borderRadius: "16px", border: "1px solid #333", boxShadow: "0 50px 100px rgba(0,0,0,0.9)" };
const toolbarStyle: React.CSSProperties = { padding: "30px 50px", display: "flex", alignItems: "center", gap: "40px", background: "#000", borderBottom: "2px solid #1a1a1a" };
const playButtonStyle: React.CSSProperties = { background: "#facc15", border: "none", padding: "15px 40px", borderRadius: "8px", fontWeight: "900", cursor: "pointer", fontSize: "16px", letterSpacing: "1px" };
const pianoWrapperStyle: React.CSSProperties = { padding: "0px 20px 40px", background: '#000', display: 'flex', justifyContent: 'center' };
const backButtonStyle: React.CSSProperties = { background: "transparent", border: "2px solid #facc15", color: "#facc15", padding: "12px 24px", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "bold", fontFamily: "'Arial Black', sans-serif", marginTop: "20px" };

export default PianoComponent;