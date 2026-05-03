import React, { useState, useEffect } from "react";
import { Piano, MidiNumbers } from "react-piano";
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

const firstNote = MidiNumbers.fromNote("c3");
const lastNote = MidiNumbers.fromNote("e5");

const customKeyboardShortcuts = [
  { key: 'q', midiNumber: MidiNumbers.fromNote('c3') },
  { key: '2', midiNumber: MidiNumbers.fromNote('c#3') },
  { key: 'w', midiNumber: MidiNumbers.fromNote('d3') },
  { key: '3', midiNumber: MidiNumbers.fromNote('d#3') },
  { key: 'e', midiNumber: MidiNumbers.fromNote('e3') },
  { key: 'r', midiNumber: MidiNumbers.fromNote('f3') },
  { key: '5', midiNumber: MidiNumbers.fromNote('f#3') },
  { key: 't', midiNumber: MidiNumbers.fromNote('g3') },
  { key: '6', midiNumber: MidiNumbers.fromNote('g#3') },
  { key: 'y', midiNumber: MidiNumbers.fromNote('a3') },
  { key: '7', midiNumber: MidiNumbers.fromNote('a#3') },
  { key: 'u', midiNumber: MidiNumbers.fromNote('b3') },
  { key: 'i', midiNumber: MidiNumbers.fromNote('c4') },
  { key: '9', midiNumber: MidiNumbers.fromNote('c#4') },
  { key: 'o', midiNumber: MidiNumbers.fromNote('d4') },
  { key: '0', midiNumber: MidiNumbers.fromNote('d#4') },
  { key: 'p', midiNumber: MidiNumbers.fromNote('e4') },
  { key: '[', midiNumber: MidiNumbers.fromNote('f4') },
  { key: '=', midiNumber: MidiNumbers.fromNote('f#4') },
  { key: ']', midiNumber: MidiNumbers.fromNote('g4') },
  { key: 'a', midiNumber: MidiNumbers.fromNote('g#4') },
  { key: 's', midiNumber: MidiNumbers.fromNote('a4') },
  { key: 'd', midiNumber: MidiNumbers.fromNote('a#4') },
  { key: 'f', midiNumber: MidiNumbers.fromNote('b4') },
  { key: 'g', midiNumber: MidiNumbers.fromNote('c5') },
  { key: 'h', midiNumber: MidiNumbers.fromNote('c#5') },
  { key: 'j', midiNumber: MidiNumbers.fromNote('d5') },
  { key: 'k', midiNumber: MidiNumbers.fromNote('d#5') },
  { key: 'l', midiNumber: MidiNumbers.fromNote('e5') },
];

const PianoComponent: React.FC<PianoProps> = ({ maxWidth, goBack }) => {
  const [playbackTime, setPlaybackTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeNotes, setActiveNotes] = useState<number[]>([]);

  const [sampler] = useState(() => {
    return new Tone.Sampler({
      urls: {
        A0: "A0.mp3", C1: "C1.mp3", "D#3": "Ds3.mp3", "F#3": "Fs3.mp3",
        C4: "C4.mp3", "D#4": "Ds4.mp3", A4: "A4.mp3", C5: "C5.mp3",
      },
      baseUrl: "https://tonejs.github.io/audio/salamander/",
      onload: () => setIsLoaded(true),
    }).toDestination();
  });

  const handleFileLoad = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, "text/xml");
    const divisions = parseInt(xmlDoc.getElementsByTagName("divisions")[0]?.textContent || "1");
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
            notesArray.push({ time: currentTime, note: noteName, duration: durationInSeconds });
          }
        }
        if (!isChord) currentTime += durationInSeconds;
      });
    }
    setDuration(currentTime);
    Tone.Transport.cancel();
    new Tone.Part<NoteEvent>((time, event) => {
      const midiValue = Tone.Frequency(event.note).toMidi();
      sampler.triggerAttackRelease(event.note, event.duration, time);
      Tone.Draw.schedule(() => setActiveNotes((prev) => [...new Set([...prev, midiValue])]), time);
      Tone.Draw.schedule(() => setActiveNotes((prev) => prev.filter((n) => n !== midiValue)), time + event.duration);
    }, notesArray).start(0);
  };

  const togglePlay = () => {
    Tone.start();
    if (!isPlaying && Tone.Transport.seconds >= duration) {
        Tone.Transport.seconds = 0;
        setPlaybackTime(0);
    }
    isPlaying ? Tone.Transport.pause() : Tone.Transport.start();
    setIsPlaying(!isPlaying);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (Tone.Transport.state === "started") {
        const time = Tone.Transport.seconds;
        if (duration > 0 && time >= duration) {
            Tone.Transport.stop();
            Tone.Transport.seconds = duration;
            setPlaybackTime(duration);
            setIsPlaying(false);
            setActiveNotes([]);
        } else {
            setPlaybackTime(time);
        }
      }
    }, 50);
    return () => clearInterval(interval);
  }, [duration]);

  const pianoDisplayWidth = maxWidth * 0.9; 
  const naturalKeyWidth = pianoDisplayWidth / 17;
  const PianoComponentRaw = Piano as any;

  return (
    <div style={containerStyle}>
      <style>{`
        .ReactPiano__Keyboard { display: flex !important; background: #000; border-top: 15px solid #1a1a1a; margin: 0 auto; overflow: visible !important; justify-content: center; }
        .ReactPiano__Key { margin: 0 !important; position: relative !important; left: auto !important; }
        .ReactPiano__Key--natural { height: 350px !important; background: #ffffff !important; border: 1px solid #bbb !important; width: ${naturalKeyWidth}px !important; }
        .ReactPiano__Key--accidental { height: 220px !important; background: #111 !important; z-index: 10 !important; width: ${naturalKeyWidth * 0.6}px !important; margin-left: -${naturalKeyWidth * 0.3}px !important; margin-right: -${naturalKeyWidth * 0.3}px !important; box-shadow: 2px 5px 10px rgba(0,0,0,0.5); }
        .piano-label-large { position: absolute; bottom: 25px; left: 0; right: 0; text-align: center; font-family: 'Arial Black', sans-serif; font-weight: 900; font-size: 14px; pointer-events: none; z-index: 999 !important; }
        .color-black { color: #000000 !important; }
        .color-white { color: #ffffff !important; bottom: 20px; font-size: 12px; }
        .ReactPiano__Key--active.ReactPiano__Key--natural { background: #facc15 !important; }
        .ReactPiano__Key--active.ReactPiano__Key--accidental { background: #eab308 !important; }
        
        .exit-button {
          background: transparent;
          border: 2px solid #facc15;
          color: #facc15;
          padding: 12px 24px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: bold;
          font-family: 'Arial Black', sans-serif;
          transition: all 0.3s ease;
          display: inline-block;
        }
        .exit-button:hover {
          background: #facc15;
          color: #000;
          box-shadow: 0 0 15px rgba(250, 204, 21, 0.5);
        }
      `}</style>

      <div style={pianoChassisStyle}>
        <div style={toolbarStyle}>
          {/* --- NEW TITLE: MUSICA --- */}
          <div style={{ marginRight: '20px' }}>
            <h1 style={titleStyle}>MUSICA</h1>
          </div>

          <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
            <label style={{color: '#888', fontSize: '10px', fontWeight: '900', letterSpacing: '1px'}}>IMPORT MUSICXML</label>
            <input type="file" accept=".musicxml,.xml" onChange={handleFileLoad} style={{fontSize: '12px', color: '#ccc'}} />
          </div>
          
          <button onClick={togglePlay} style={playButtonStyle} disabled={!isLoaded}>
            {isPlaying ? "⏸ PAUSE" : "▶ START"}
          </button>

          <div style={{flexGrow: 1, display: 'flex', alignItems: 'center', gap: '20px'}}>
            <input type="range" min="0" max={duration || 1} step="0.1" value={playbackTime} onChange={(e) => {
                const val = parseFloat(e.target.value);
                setPlaybackTime(val);
                Tone.Transport.seconds = val;
                setActiveNotes([]);
              }} style={{flexGrow: 1, accentColor: '#facc15', height: '10px'}} 
            />
            <span style={{color: '#facc15', fontSize: '18px', minWidth: '100px', fontWeight: 'bold', fontFamily: 'monospace'}}>
              {playbackTime.toFixed(1)} / {duration.toFixed(1)}s
            </span>
          </div>
        </div>

        <div style={pianoWrapperStyle}>
          {!isLoaded ? (
            <div style={{color: '#facc15', fontSize: '24px', fontWeight: 'bold'}}>LOADING...</div>
          ) : (
            <div style={{ width: pianoDisplayWidth }}>
              <PianoComponentRaw
                activeNotes={activeNotes}
                noteRange={{ first: firstNote, last: lastNote }}
                playNote={(midi: number) => sampler.triggerAttack(Tone.Frequency(midi, "midi").toNote())}
                stopNote={(midi: number) => sampler.triggerRelease(Tone.Frequency(midi, "midi").toNote())}
                width={pianoDisplayWidth}
                keyboardShortcuts={customKeyboardShortcuts}
                renderNoteLabel={({ midiNumber, isAccidental }: any) => (
                  <div className={`piano-label-large ${isAccidental ? 'color-white' : 'color-black'}`}>
                    {Tone.Frequency(midiNumber, "midi").toNote()}
                  </div>
                )}
              />
            </div>
          )}
        </div>
        
        <div style={footerStyle}>
          <button onClick={goBack} className="exit-button">← EXIT TO HOME</button>
        </div>
      </div>
    </div>
  );
};

const containerStyle: React.CSSProperties = { width: "100vw", height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#050505", overflow: "hidden" };
const pianoChassisStyle: React.CSSProperties = { width: "95%", background: "#111", borderRadius: "16px", border: "1px solid #333", boxShadow: "0 50px 100px rgba(0,0,0,0.9)", display: 'flex', flexDirection: 'column' };
const toolbarStyle: React.CSSProperties = { padding: "20px 40px", display: "flex", alignItems: "center", gap: "30px", background: "#000", borderBottom: "2px solid #1a1a1a" };
const titleStyle: React.CSSProperties = { color: "#facc15", fontSize: "28px", fontWeight: "900", fontFamily: "'Arial Black', sans-serif", margin: 0, letterSpacing: "2px" };
const playButtonStyle: React.CSSProperties = { background: "#facc15", border: "none", padding: "10px 25px", borderRadius: "8px", fontWeight: "900", cursor: "pointer", fontSize: "14px", letterSpacing: "1px" };
const pianoWrapperStyle: React.CSSProperties = { padding: "0px 20px 0px", background: '#000', display: 'flex', justifyContent: 'center', height: '365px' };
const footerStyle: React.CSSProperties = { padding: "40px 50px 60px", textAlign: 'left', background: '#111' };

export default PianoComponent;