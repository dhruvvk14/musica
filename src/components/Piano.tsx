import React, { useState, useEffect, useMemo, useRef } from "react";
import { Piano, MidiNumbers } from "react-piano";
import "react-piano/dist/styles.css";
import * as Tone from "tone";
import { OpenSheetMusicDisplay } from "opensheetmusicdisplay";

interface PianoProps {
  maxWidth: number;
  goBack: () => void;
}

interface NoteEvent {
  time: number;
  note: string;
  duration: number;
}

// --- 1. SHEET VIEWER (Fixed Duration Logic + 0.7s Buffer) ---
const SheetViewer: React.FC<{ xml: string; currentSeconds: number; bpm: number; leadTime: number }> = ({ xml, currentSeconds, bpm, leadTime }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const osmdRef = useRef<OpenSheetMusicDisplay | null>(null);
  const lastSecondsRef = useRef(0);

  const beatsLeft = Math.ceil((leadTime - currentSeconds) / (60 / bpm));
  const showCountdown = currentSeconds < leadTime && currentSeconds > 0;

  useEffect(() => {
    if (containerRef.current && xml) {
      containerRef.current.innerHTML = ""; 
      const osmd = new OpenSheetMusicDisplay(containerRef.current, {
        drawTitle: false,
        autoResize: true,
        backend: "svg",
      });
      osmd.load(xml).then(() => {
        osmd.render();
        osmd.cursor.show();
        osmd.cursor.reset();
        osmdRef.current = osmd;
      });
    }
  }, [xml]);

  useEffect(() => {
    const osmd = osmdRef.current;
    if (!osmd || !osmd.cursor) return;
    const cursor = osmd.cursor;

    // 0.7s visual lag
    const buffer = 0.7; 
    const bufferedSeconds = Math.max(0, currentSeconds - leadTime - buffer);
    
    // Convert to measures (assuming 4/4 time for the tracker logic)
    const currentMusicalBeats = bufferedSeconds * (bpm / 60);
    const currentMeasurePosition = currentMusicalBeats / 4; 

    // Reset cursor if we jump back or start over
    if (currentSeconds < lastSecondsRef.current - 0.1 || currentSeconds <= leadTime) {
      cursor.reset();
    }

    // Advance cursor only if the buffered time has crossed the next note's timestamp
    // We use a small epsilon (0.005) to prevent jitter
    while (
      !cursor.Iterator.EndReached && 
      cursor.Iterator.currentTimeStamp.RealValue < currentMeasurePosition - 0.005
    ) {
      cursor.next();
    }
    
    lastSecondsRef.current = currentSeconds;
  }, [currentSeconds, bpm, leadTime]);

  return (
    <div style={{ position: 'relative', background: "#fff", margin: "0 40px 10px", height: "200px", overflowY: "auto", borderRadius: "8px", border: "2px solid #333" }}>
      {showCountdown && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          backgroundColor: 'rgba(255,255,255,0.7)', zIndex: 10,
          fontSize: '80px', fontWeight: '900', color: '#facc15',
          textShadow: '2px 2px 0px #000', fontFamily: 'Arial Black'
        }}>
          {beatsLeft}
        </div>
      )}
      <div ref={containerRef} style={{ width: "100%" }} />
    </div>
  );
};

// --- 2. MAIN PIANO COMPONENT ---
const PianoComponent: React.FC<PianoProps> = ({ maxWidth, goBack }) => {
  const [displaySeconds, setDisplaySeconds] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [metronomeOn, setMetronomeOn] = useState(true);
  const [totalBeats, setTotalBeats] = useState(0); 
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeNotes, setActiveNotes] = useState<number[]>([]);
  const [xmlData, setXmlData] = useState<string>(""); 
  const [bpm, setBpm] = useState(120);
  const [volume, setVolume] = useState(-10);

  const range = { first: MidiNumbers.fromNote("c3"), last: MidiNumbers.fromNote("e5") };
  
  const leadTimeSeconds = 4 * (60 / bpm);
  const totalSeconds = (totalBeats * (60 / bpm)) + leadTimeSeconds;

  const clickSynth = useMemo(() => new Tone.MembraneSynth({
    pitchDecay: 0.008, octaves: 2,
    envelope: { attack: 0.0001, decay: 0.2, sustain: 0 }
  }).toDestination(), []);

  const sampler = useMemo(() => {
    return new Tone.Sampler({
      urls: { A0: "A0.mp3", C1: "C1.mp3", "D#3": "Ds3.mp3", "F#3": "Fs3.mp3", C4: "C4.mp3", "D#4": "Ds4.mp3", A4: "A4.mp3", C5: "C5.mp3" },
      baseUrl: "https://tonejs.github.io/audio/salamander/",
      onload: () => setIsLoaded(true),
    }).toDestination();
  }, []);

  useEffect(() => { Tone.Transport.bpm.value = bpm; }, [bpm]);
  useEffect(() => { Tone.Destination.volume.value = volume; }, [volume]);

  const handleFileLoad = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setXmlData(text); 
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, "text/xml");
    let detectedBpm = 120;
    const soundNode = xmlDoc.getElementsByTagName("sound")[0];
    if (soundNode?.getAttribute("tempo")) detectedBpm = parseInt(soundNode.getAttribute("tempo")!);
    setBpm(detectedBpm);

    const divisions = parseInt(xmlDoc.getElementsByTagName("divisions")[0]?.textContent || "1");
    const notesArray: NoteEvent[] = [];
    let cumulativeBeats = 0;
    const measures = xmlDoc.getElementsByTagName("measure");

    for (let i = 0; i < measures.length; i++) {
      const measureNotes = measures[i].querySelectorAll("note");
      measureNotes.forEach((note) => {
        const isRest = note.getElementsByTagName("rest").length > 0;
        const isChord = note.getElementsByTagName("chord").length > 0;
        const durValue = parseInt(note.getElementsByTagName("duration")[0]?.textContent || "0");
        const durationInBeats = (durValue / divisions);
        if (!isRest) {
          const step = note.getElementsByTagName("step")[0]?.textContent;
          const octave = note.getElementsByTagName("octave")[0]?.textContent;
          const alter = note.getElementsByTagName("alter")[0]?.textContent;
          if (step && octave) {
            let noteName = `${step}${octave}`;
            if (alter === "1") noteName = `${step}#${octave}`;
            if (alter === "-1") noteName = `${step}b${octave}`;
            notesArray.push({ time: cumulativeBeats, note: noteName, duration: durationInBeats });
          }
        }
        if (!isChord) cumulativeBeats += durationInBeats;
      });
    }

    setTotalBeats(cumulativeBeats);
    Tone.Transport.cancel();
    const beatInterval = 60 / detectedBpm;
    const totalLeadTime = 4 * beatInterval;

    for (let i = 0; i < cumulativeBeats + 4; i++) {
      const isDownbeat = i % 4 === 0;
      Tone.Transport.schedule((time) => {
        if (metronomeOn) clickSynth.triggerAttackRelease(isDownbeat ? "C6" : "C5", "32n", time, 0.4);
      }, i * beatInterval);
    }

    new Tone.Part<NoteEvent>((time, event) => {
      const midiValue = Tone.Frequency(event.note).toMidi();
      sampler.triggerAttackRelease(event.note, (event.duration * (60/Tone.Transport.bpm.value)), time);
      Tone.Draw.schedule(() => setActiveNotes((prev) => [...new Set([...prev, midiValue])]), time);
      Tone.Draw.schedule(() => setActiveNotes((prev) => prev.filter((n) => n !== midiValue)), time + (event.duration * (60/Tone.Transport.bpm.value)));
    }, notesArray.map(n => ({...n, time: (n.time * beatInterval) + totalLeadTime}))).start(0);
  };

  const togglePlay = async () => {
    if (Tone.context.state !== 'running') await Tone.start();
    if (Tone.Transport.seconds >= totalSeconds) Tone.Transport.seconds = 0;
    isPlaying ? Tone.Transport.pause() : Tone.Transport.start();
    setIsPlaying(!isPlaying);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (Tone.Transport.state === "started") {
        setDisplaySeconds(Tone.Transport.seconds);
        if (Tone.Transport.seconds >= totalSeconds) {
          Tone.Transport.stop();
          setIsPlaying(false);
          setActiveNotes([]);
        }
      }
    }, 16); 
    return () => clearInterval(interval);
  }, [totalSeconds]);

  const naturalKeyWidth = (maxWidth * 0.9) / 17;

  return (
    <div style={containerStyle}>
      <style>{`
        .ReactPiano__Keyboard { display: flex !important; background: #000; border-top: 15px solid #1a1a1a; margin: 0 auto; overflow: visible !important; justify-content: center; }
        .ReactPiano__Key { margin: 0 !important; position: relative !important; left: auto !important; }
        .ReactPiano__Key--natural { height: 350px !important; background: #ffffff !important; border: 1px solid #bbb !important; width: ${naturalKeyWidth}px !important; }
        .ReactPiano__Key--accidental { height: 220px !important; background: #111 !important; z-index: 10 !important; width: ${naturalKeyWidth * 0.6}px !important; margin-left: -${naturalKeyWidth * 0.3}px !important; margin-right: -${naturalKeyWidth * 0.3}px !important; box-shadow: 2px 5px 10px rgba(0,0,0,0.5); }
        .ReactPiano__Key--active { position: relative; }
        .ReactPiano__Key--active::after { content: ""; position: absolute; bottom: 12px; left: 10%; width: 80%; height: 8px; background: #ff0000; box-shadow: 0 0 15px rgba(255, 0, 0, 0.9); border-radius: 4px; z-index: 100; }
        .piano-label-large { position: absolute; bottom: 30px; left: 0; right: 0; text-align: center; font-family: 'Arial Black', sans-serif; font-weight: 900; font-size: 13px; color: #000; pointer-events: none; }
        .accidental-label { bottom: 25px; font-size: 11px; color: #fff; } 
        .ReactPiano__Key--active.ReactPiano__Key--natural { background: #facc15 !important; }
        .ReactPiano__Key--active.ReactPiano__Key--accidental { background: #eab308 !important; }
        .exit-button { background: transparent; border: 2px solid #facc15; color: #facc15; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: bold; font-family: 'Arial Black', sans-serif; transition: all 0.3s ease; }
        .exit-button:hover { background: #facc15; color: #000; }
        .control-slider { accent-color: #facc15; cursor: pointer; width: 80px; height: 4px; }
        .time-slider { flex-grow: 1; accent-color: #facc15; cursor: pointer; height: 6px; }
        .metronome-toggle { background: #000; border: 1px solid #333; color: #666; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-family: monospace; font-size: 10px; font-weight: bold; transition: all 0.2s; }
        .metronome-toggle.active { border-color: #facc15; color: #facc15; box-shadow: 0 0 8px rgba(250, 204, 21, 0.3); }
      `}</style>

      <div style={pianoChassisStyle}>
        <div style={toolbarStyle}>
          <h1 style={titleStyleStudio}>MUSICA</h1>
          <input type="file" accept=".musicxml,.xml" onChange={handleFileLoad} style={{fontSize: '12px', color: '#ccc'}} />
          <button onClick={togglePlay} style={playButtonStyle}>{isPlaying ? "⏸ PAUSE" : "▶ START"}</button>
          
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center', borderLeft: '1px solid #333', paddingLeft: '20px' }}>
            <div style={controlLabelStyle}><span>VOL</span><input type="range" className="control-slider" min="-40" max="0" value={volume} onChange={(e) => setVolume(parseInt(e.target.value))} /></div>
            <div style={controlLabelStyle}><span>{bpm} BPM</span><input type="range" className="control-slider" min="40" max="220" value={bpm} onChange={(e) => setBpm(parseInt(e.target.value))} /></div>
            <div style={controlLabelStyle}>
                <span>CLICK</span>
                <button className={`metronome-toggle ${metronomeOn ? 'active' : ''}`} onClick={() => setMetronomeOn(!metronomeOn)}>
                  {metronomeOn ? "ON" : "OFF"}
                </button>
            </div>
          </div>

          <div style={{flexGrow: 1, display: 'flex', alignItems: 'center', gap: '20px'}}>
            <input type="range" className="time-slider" min="0" max={totalSeconds || 1} step="0.01" value={displaySeconds} onChange={(e) => { 
              Tone.Transport.seconds = parseFloat(e.target.value); setDisplaySeconds(Tone.Transport.seconds); setActiveNotes([]); 
            }} />
            <span style={{color: '#facc15', fontSize: '16px', fontWeight: 'bold', fontFamily: 'monospace', minWidth: '150px'}}>{displaySeconds.toFixed(1)}s / {totalSeconds.toFixed(1)}s</span>
          </div>
        </div>

        {xmlData && <SheetViewer xml={xmlData} currentSeconds={displaySeconds} bpm={bpm} leadTime={leadTimeSeconds} />}

        <div style={pianoWrapperStyle}>
          {!isLoaded ? ( <div style={{color: '#facc15'}}>LOADING...</div> ) : (
            <div style={{ width: maxWidth * 0.9 }}>
              <Piano
                activeNotes={activeNotes} noteRange={range}
                playNote={(midi: number) => sampler.triggerAttack(Tone.Frequency(midi, "midi").toNote())}
                stopNote={(midi: number) => sampler.triggerRelease(Tone.Frequency(midi, "midi").toNote())}
                width={maxWidth * 0.9}
                renderNoteLabel={({ midiNumber, isAccidental }: any) => (
                  <div className={`piano-label-large ${isAccidental ? 'accidental-label' : ''}`}>
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
const pianoChassisStyle: React.CSSProperties = { width: "95%", background: "#111", borderRadius: "16px", border: "1px solid #333", display: 'flex', flexDirection: 'column' };
const toolbarStyle: React.CSSProperties = { padding: "20px 40px", display: "flex", alignItems: "center", gap: "30px", background: "#000", borderBottom: "2px solid #1a1a1a" };
const titleStyleStudio: React.CSSProperties = { color: "#facc15", fontSize: "28px", fontWeight: "900", fontFamily: "'Arial Black', sans-serif", margin: 0, letterSpacing: "2px" };
const playButtonStyle: React.CSSProperties = { background: "#facc15", border: "none", padding: "10px 25px", borderRadius: "8px", fontWeight: "900", cursor: "pointer", fontSize: "14px", minWidth: "120px" };
const controlLabelStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: '#666', fontSize: '10px', fontWeight: 'bold', fontFamily: 'monospace', minWidth: '90px' };
const pianoWrapperStyle: React.CSSProperties = { padding: "20px 20px 0px", background: '#000', display: 'flex', justifyContent: 'center', minHeight: '365px' };
const footerStyle: React.CSSProperties = { padding: "40px 50px 60px", textAlign: 'left', background: '#111' };

export default PianoComponent;